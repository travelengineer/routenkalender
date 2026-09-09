/**
 * Routenkalender – Ablage für die Reisedaten.
 *
 * Läuft als Cloudflare Worker. Der Worker hält die Reisedaten in einem
 * KV-Namespace und prüft bei jeder Anfrage Benutzername und Passwort.
 * Beides steht nur hier, nicht im Quelltext der Website.
 *
 * Nötige Einstellungen im Cloudflare-Dashboard:
 *   Variables (Secrets):  TRIP_USER, TRIP_PASSWORD   und optional TRIP_PASSWORD_VIEW
 *   KV Namespace Binding: TRIP  →  ein Namespace, z. B. "routenkalender"
 *   Variable (Text):      ALLOWED_ORIGIN  →  https://travelengineer.github.io
 *
 * Endpunkte, beide unter /trip:
 *   GET   liefert den gespeicherten Stand
 *   PUT   schickt den eigenen Stand, der Worker führt beide zusammen und
 *         antwortet mit dem Ergebnis
 *
 * Zusammenführen: je Eintrag gewinnt der jüngere Zeitstempel (updatedAt).
 * Gelöschte Einträge werden als Grabstein vermerkt, damit sie nicht vom
 * anderen Gerät wieder auftauchen.
 */

const KEY = "trip";
const TOMBSTONE_DAYS = 60;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const url = new URL(request.url);
    if (url.pathname !== "/trip") return json({ error: "not_found" }, 404, cors);

    const role = checkAuth(request, env);
    if (!role) return json({ error: "unauthorized" }, 401, cors);

    if (request.method === "GET") {
      return json({ role, doc: await load(env) }, 200, cors);
    }

    if (request.method === "PUT") {
      if (role !== "edit") return json({ error: "read_only" }, 403, cors);
      let incoming;
      try { incoming = await request.json(); }
      catch (e) { return json({ error: "bad_json" }, 400, cors); }
      const merged = merge(await load(env), incoming);
      await env.TRIP.put(KEY, JSON.stringify(merged));
      return json({ role, doc: merged }, 200, cors);
    }

    return json({ error: "method_not_allowed" }, 405, cors);
  }
};

function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
  const ok = allowed.length === 0 || allowed.indexOf(origin) !== -1;
  return {
    "Access-Control-Allow-Origin": ok && origin ? origin : (allowed[0] || "*"),
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Trip-User, X-Trip-Auth",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, cors)
  });
}

/** Vergleicht ohne frühen Abbruch, damit die Laufzeit nichts über das Passwort verrät. */
function same(a, b) {
  a = String(a == null ? "" : a);
  b = String(b == null ? "" : b);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function checkAuth(request, env) {
  const user = request.headers.get("X-Trip-User") || "";
  const pass = request.headers.get("X-Trip-Auth") || "";
  if (env.TRIP_USER && !same(user.toLowerCase(), String(env.TRIP_USER).toLowerCase())) return null;
  if (env.TRIP_PASSWORD && same(pass, env.TRIP_PASSWORD)) return "edit";
  if (env.TRIP_PASSWORD_VIEW && same(pass, env.TRIP_PASSWORD_VIEW)) return "view";
  return null;
}

async function load(env) {
  const raw = await env.TRIP.get(KEY);
  if (!raw) return { meta: null, metaUpdatedAt: 0, entries: {}, deleted: {}, rev: 0, updatedAt: 0 };
  try {
    const d = JSON.parse(raw);
    return {
      meta: d.meta || null,
      metaUpdatedAt: Number(d.metaUpdatedAt || 0),
      entries: d.entries || {},
      deleted: d.deleted || {},
      rev: Number(d.rev || 0),
      updatedAt: Number(d.updatedAt || 0)
    };
  } catch (e) {
    return { meta: null, metaUpdatedAt: 0, entries: {}, deleted: {}, rev: 0, updatedAt: 0 };
  }
}

function merge(stored, incoming) {
  const now = Date.now();
  const out = {
    meta: stored.meta,
    metaUpdatedAt: stored.metaUpdatedAt,
    entries: Object.assign({}, stored.entries),
    deleted: Object.assign({}, stored.deleted),
    rev: stored.rev + 1,
    updatedAt: now
  };

  const inMeta = incoming && incoming.meta;
  const inMetaAt = Number((incoming && incoming.metaUpdatedAt) || 0);
  if (inMeta && (inMetaAt > out.metaUpdatedAt || !out.meta)) {
    out.meta = inMeta;
    out.metaUpdatedAt = inMetaAt || now;
  }

  const inEntries = (incoming && incoming.entries) || {};
  for (const id of Object.keys(inEntries)) {
    const e = inEntries[id];
    if (!e || typeof e !== "object") continue;
    const t = Number(e.updatedAt || 0);
    if (t <= Number(out.deleted[id] || 0)) continue;
    const cur = out.entries[id];
    if (!cur || Number(cur.updatedAt || 0) <= t) out.entries[id] = e;
  }

  const inDeleted = (incoming && incoming.deleted) || {};
  for (const id of Object.keys(inDeleted)) {
    const t = Number(inDeleted[id] || 0);
    if (!t) continue;
    if (t > Number(out.deleted[id] || 0)) out.deleted[id] = t;
    const cur = out.entries[id];
    if (cur && Number(cur.updatedAt || 0) <= t) delete out.entries[id];
  }

  const cutoff = now - TOMBSTONE_DAYS * 86400000;
  for (const id of Object.keys(out.deleted)) {
    if (Number(out.deleted[id]) < cutoff) delete out.deleted[id];
  }

  return out;
}
