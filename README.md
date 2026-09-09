# Routenkalender

Wochenweiser Reisekalender für Roadtrips. Eine Zeile ist eine Kalenderwoche von
Montag bis Sonntag, am Desktop und am iPad im Format 4:3, am iPhone als
Tagesliste mit einem kompakten Punkteraster als Übersicht.

**Live:** https://travelengineer.github.io/routenkalender/

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

## Daten

Alles liegt ausschließlich im lokalen Speicher des Browsers (`localStorage`), es
gibt keinen Server und keine Übertragung. Zum Wechsel zwischen iPad und iPhone
dienen die Knöpfe **Sichern** (JSON-Datei) und **Laden**. **Kalenderdatei**
erzeugt eine `.ics`-Datei für den Apple Kalender.

## Anmeldung

Vor dem Kalender liegt eine Maske mit Benutzername und Passwort. Sie läuft in der
Seite selbst, die Zugangsdaten stehen also im Quelltext. Das hält beiläufige
Mitleser ab, ist aber kein Zugriffsschutz. Wer echten Schutz braucht, hostet die
Seite hinter einer serverseitigen Anmeldung.

## Startdaten ändern

Die Beispielreise steht in `index.html` im Block zwischen
`BEGINN STARTDATEN` und `ENDE STARTDATEN`. Sie wird nur geladen, solange im
Browser noch nichts gespeichert ist. Für einen leeren Kalender die Liste
`entries` auf `[]` setzen.

## Aufbau

Eine einzelne Datei ohne Abhängigkeiten, außer den Schriften von Google Fonts.
Kein Build, kein Framework. Zum Ändern die Datei bearbeiten und einchecken,
GitHub Pages veröffentlicht sie automatisch neu.
