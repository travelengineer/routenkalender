# Routenkalender

Wochenweiser Reisekalender für Roadtrips, unter dem Namen **travelengineer**.
Am Desktop und am iPad ein Kalender im Format 4:3, eine Zeile je Kalenderwoche
von Montag bis Sonntag. Am iPhone eine eigene, auf das Gerät zugeschnittene
Fassung: Tagesliste, aufklappbarer Zeitraum, Menü hinter den drei Punkten,
runder Plus-Knopf. Der Kalender entfällt dort bewusst.

**Live:** https://travelengineer.github.io/routenkalender/

## Bedienung im Kalender

Auf eine freie Fläche eines Tages tippen legt dort einen Eintrag an. Bestehende
Einträge lassen sich auf einen anderen Tag ziehen, mit Maus und am iPad mit dem
Finger nach kurzem Halten. Ein Aufenthalt behält dabei seine Länge und beginnt am
Zieltag. Am Rand scrollt die Seite beim Ziehen mit.

## Eintragsarten

| Art | Felder | Darstellung |
|---|---|---|
| Aufenthalt | Ort, von Datum/Uhrzeit, bis Datum/Uhrzeit | durchgehender Balken über alle Tage, mit Anzahl Nächte |
| Fahrt | Start, Ziel, Abfahrt, Kilometer, Fahrzeit | Punkt mit Uhrzeit, darunter km, Fahrzeit, errechnete Ankunft |
| Termin | Bezeichnung, Ort, Beginn, Ende | Punkt mit Uhrzeit |
| Notiz | Bezeichnung, Text | Punkt ohne Uhrzeit |

## Strecke und Fahrzeit

Auf Knopfdruck wird der Ort über **Nominatim** gesucht und die Straßenroute über
**OSRM** berechnet. Beide Werte stehen danach in Eingabefeldern und sind
überschreibbar. Ortskoordinaten werden im Browser zwischengespeichert, damit
möglichst wenige Anfragen anfallen. Beide Dienste sind für kleine, private
Nutzung gedacht, bitte nicht in Schleifen abfragen.

## Abgleich zwischen Geräten

Ohne eingerichtete Ablage liegen alle Daten nur im lokalen Speicher des Browsers.
Mit Ablage gleichen sich alle angemeldeten Geräte ab: nach jeder Änderung wird
gesendet, im Hintergrund alle 15 Sekunden geholt, und beim Zurückkehren auf den
Tab sofort. Offline geänderte Einträge werden nachgereicht, sobald wieder
Verbindung besteht.

Zusammengeführt wird je Eintrag, der jüngere Zeitstempel gewinnt. Gelöschtes wird
als Grabstein vermerkt und taucht daher nicht vom anderen Gerät wieder auf.

### Ablage einrichten (Cloudflare Worker, kostenlos)

1. Konto auf dash.cloudflare.com anlegen.
2. **Storage & Databases → KV → Create instance**, Name `routenkalender`.
3. **Compute (Workers) → Create → Start from Hello World**, Name `routenkalender`,
   Deploy, dann **Edit code**. Den Inhalt von `worker.js` aus diesem Repository
   vollständig hineinkopieren, alles Bestehende ersetzen, Deploy.
4. Im Worker unter **Settings → Bindings → Add → KV namespace**:
   Variablenname `TRIP`, Namespace `routenkalender`.
5. Unter **Settings → Variables and Secrets** anlegen:
   - `ALLOWED_ORIGIN` (Text) – `https://travelengineer.github.io`
   - `TRIP_USER` (Secret) – der Benutzername
   - `TRIP_PASSWORD` (Secret, freiwillig) – das Passwort zum Bearbeiten
   - `TRIP_PASSWORD_VIEW` (Secret, freiwillig) – Passwort nur zum Ansehen

   Ohne `TRIP_PASSWORD` gilt das Passwort der **ersten Anmeldung**: der Worker
   merkt sich davon einen Hash und verlangt ihn ab dann. Also gleich nach dem
   Veröffentlichen einmal anmelden. Ein später gesetztes `TRIP_PASSWORD` hat
   immer Vorrang.
6. Die Adresse des Workers steht in `index.html` bei `var SYNC_URL`. Eingetragen
   ist `https://routenkalender.lukasschwarz.workers.dev`. Eine andere Adresse lässt
   sich je Gerät auch über `?sync=https://….workers.dev` setzen, sie bleibt dann
   dort gespeichert.

Danach steht das Passwort nur noch im Worker, nicht mehr im Quelltext, und die
Anmeldemaske schützt die Daten tatsächlich.

## Dateien sichern

**Sichern** schreibt den ganzen Stand als JSON-Datei, **Laden** liest sie wieder
ein. **Kalenderdatei** erzeugt eine `.ics` für den Apple Kalender.

## Anmeldung

Ohne eingerichtete Ablage prüft die Seite selbst, die Zugangsdaten stehen dann im
Quelltext und halten nur beiläufige Mitleser ab. Mit Ablage prüft der Worker.
Die Maske erscheint bei jedem Besuch, außer das Häkchen ist gesetzt. „Sperren"
meldet wieder ab.

## Startdaten ändern

Die Beispielreise steht in `index.html` im Block zwischen `BEGINN STARTDATEN` und
`ENDE STARTDATEN`. Sie wird nur geladen, solange im Browser noch nichts
gespeichert ist, und dient bei eingerichteter Ablage als erster Serverstand. Für
einen leeren Kalender die Liste `entries` auf `[]` setzen.

## Marke

Logo in `travelengineer-logo-hell.png` und `travelengineer-logo-dunkel.png`, die
freigestellte Bildmarke in `travelengineer-mark.png`. In der Seite steckt die
Bildmarke als eingebettete Datei, im dunklen Erscheinungsbild wird sie umgekehrt.

## Aufbau

Eine einzelne HTML-Datei ohne Abhängigkeiten, außer den Schriften von Google
Fonts, dazu `worker.js` für die Ablage. Kein Build, kein Framework.
