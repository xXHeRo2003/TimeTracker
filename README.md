# Flowtime – Moderner Time Tracker

Flowtime ist ein fokussierter Desktop-Timer auf Basis von Electron. Die App ist modular aufgebaut, mehrsprachig (de/en) und speichert Arbeits-Sessions lokal auf dem Gerät.

## Highlights

- Fokus-Timer mit Countdown- und Stopuhr-Modus, Presets (15/25/45/60 Minuten), manueller Eingabe und Tastatursteuerung
- Countdown-Laufzeiten lassen sich bis auf `00:00:00` heruntersetzen
- Task-Formular mit Session-Historie inklusive Tages-, Wochen- und Gesamtfilter
- Persistente Speicherung via `localStorage` und optische Rückmeldung bei Timer-Ende
- Optionaler Pausen-Reminder mit frei wählbarem Intervall und dezenter Benachrichtigung unten rechts
- Sauber getrennte Renderer-Module für Timer, Historie, Einstellungen, i18n und Hilfsfunktionen

## Timer-Modi

Direkt unter der Zeitanzeige wählst du jetzt, ob der Timer als Countdown oder als Stopuhr laufen soll. Im Stopuhr-Modus wird die Zeit hochgezählt, während Presets, Pfeiltasten und manuelle Eingabe für die Countdown-Konfiguration reserviert bleiben. Der Countdown akzeptiert inzwischen auch `00:00:00` als Zielzeit, sodass du Sessions auf Wunsch komplett zurücksetzen kannst.

## Pausen-Reminder

Über die Einstellungen lässt sich ein Pausen-Reminder aktivieren, der nach einer frei definierten Anzahl an Minuten eine dezente Benachrichtigung unten rechts einblendet. Das Intervall ist zwischen 5 und 240 Minuten frei skalierbar und bleibt lokal gespeichert. Auf Wunsch kannst du die Erinnerung snoozen und dir nach einigen Minuten erneut Bescheid geben lassen.

## Getting Started (Desktop)

Voraussetzung: Node.js (>= 18).

```bash
cd apps/desktop
npm install
npm run start   # development mode
```

Der Entwicklungsstart fährt automatisch den integrierten SQLite-Server hoch. Für Produktions-Builds steht electron-builder bereit:

```bash
cd apps/desktop
npm install
npm run dist
```

Die Artefakte landen unter `apps/desktop/dist/` (AppImage, DMG, NSIS/Portable). Plattform-Icons befinden sich in `apps/desktop/resources/icons/`.

## Projektstruktur

```
.
├── apps
│   ├── desktop
│   │   ├── package.json
│   │   ├── resources/
│   │   └── src
│   │       ├── main/
│   │       │   └── index.js              # Electron Hauptprozess
│   │       ├── preload/
│   │       │   └── index.js              # Gesicherte Bridge API
│   │       └── renderer/
│   │           ├── pages/
│   │           │   └── index.html
│   │           ├── scripts/
│   │           │   ├── app.js            # Einstiegspunkt
│   │           │   ├── config/           # Konstanten & Übersetzungen
│   │           │   ├── core/             # i18n State
│   │           │   ├── features/         # Timer, History, Settings, Mobile View
│   │           │   ├── services/         # Storage-Anbindung
│   │           │   ├── ui/               # DOM-Helfer & UI-spezifische Utilities
│   │           │   └── utils/            # Generische Helper (Zeit, UUIDs, Datumsbereiche)
│   │           └── styles/
│   │               ├── index.css
│   │               └── partials/
│   │                   ├── base.css
│   │                   ├── components.css
│   │                   └── views.css
│   └── server
│       ├── package.json
│       └── src
│           ├── db.js                     # SQLite-Anbindung & Queries
│           ├── index.js                  # Express-Einstiegspunkt
│           └── routes/
│               ├── stats.js              # Aggregierte Auswertungen
│               └── timeEntries.js        # CRUD-Endpunkte für Sessions
└── README.md
```

## Code-Aufbau (Renderer)

- `features/timer.js` kapselt Countdown- und Stopuhr-Logik inklusive Start/Pause, Segment-Navigation und Presets.
- `features/history.js` lädt und rendert die Historie, inklusive Filterlogik und Totalzeit.
- `features/settings.js` verantwortet das Einstellungs-Panel, Sprachwechsel und Responsive-Umbau.
- `features/breakReminder.js` überwacht die aktive Session und stößt Pausen-Benachrichtigungen nach frei definierbaren Intervallen an.
- `core/i18n.js` stellt Übersetzungs- und Sprachauswahl-Logik inkl. Listenern bereit.
- `ui/translations.js` übernimmt das Aktualisieren der DOM-Texte; `ui/version.js` zieht die App-Version aus der Preload-Bridge.
- `ui/notifications.js` rendert Toast-artige Hinweise wie den Pausen-Reminder im unteren rechten Bildschirmbereich.

Diese Schnittstellen halten den Einstieg in `scripts/app.js` schlank und erleichtern Erweiterungen, etwa neue Features oder zusätzliche Views.

## README aktuell halten

- Ergänze neue Module oder Skripte sofort in den Abschnitten „Projektstruktur“ bzw. „Code-Aufbau“.
- Dokumentiere Build- oder Runtime-Abhängigkeiten, sobald sie hinzukommen.
- Prüfe bei Funktionsänderungen, ob Highlights oder Bedienhinweise angepasst werden müssen.
- Notiere Datum und Anlass größerer Überarbeitungen im Commit-Log, damit der Kontext nachvollziehbar bleibt.

## Weiterentwicklungsideen

1. Sync-Backends (z. B. Supabase, Firebase) für geräteübergreifende Historien.
2. Erweiterte Auswertungen wie Wochenziele, CSV-/ICS-Export oder Reporting-Grafiken.
3. Fokus-Assistenten: Pausenerinnerungen, Desktop-Notifications oder Widgets.

## Backend API (Node.js + SQLite)

Der neue REST-Server unter `apps/server` persistiert alle Zeit-Einträge in einer SQLite-Datenbank. Die Datei liegt standardmäßig in einem benutzerspezifischen Verzeichnis, damit App-Updates die Daten nicht überschreiben:

- macOS: `~/Library/Application Support/Flowtime/time-tracker.db`
- Windows: `%APPDATA%\Flowtime\time-tracker.db`
- Linux: `~/.config/flowtime/time-tracker.db`

Alternativ lassen sich Ablageort und Port via Umgebungsvariablen steuern:

- `PORT`: HTTP-Port (Standard: `4000`)
- `FLOWTIME_DB_DIR`: eigener Ordner für die DB-Datei
- `FLOWTIME_DB_PATH`: kompletter Pfad zur DB-Datei (hat Vorrang vor `FLOWTIME_DB_DIR`)

### Setup

```bash
cd apps/server
npm install
npm run start     # oder: PORT=5000 npm run start
npm test          # führt die API-Tests mit node:test aus
```

`npm run dev` startet den Server inklusive Hot-Reload via Nodemon. Für den produktiven Desktop-Build brauchst du diesen manuellen Start nicht mehr – der Electron-Hauptprozess bootet den Server automatisch beim App-Launch. Per `FLOWTIME_BACKEND_PORT` lässt sich ein alternativer Port erzwingen, Standard bleibt `4000`.

### Endpunkte (Auszug)

- `GET /api/health` – einfacher Health-Check inkl. DB-Pfad
- `GET /api/time-entries` – paginierte Liste (`limit`, `offset`, optional `from`/`to` in ms)
- `POST /api/time-entries` – neuen Eintrag erzeugen (`title`, optional `note`, `startedAt`)
- `PATCH /api/time-entries/:id` – Titel/Notiz/Startzeit aktualisieren
- `POST /api/time-entries/:id/stop` – Eintrag beenden, berechnet Dauer in Sekunden
- `DELETE /api/time-entries/:id` – Eintrag entfernen
- `GET /api/stats/daily` – Tages-Summen (`from`/`to` optional)

Nutze `fetch`/`axios` aus dem Renderer, um Historie und Timer gegen die API zu synchronisieren. Die bestehenden LocalStorage-Services lassen sich schrittweise ersetzen oder parallel betreiben, indem die API als persistente Quelle fungiert.

Viel Erfolg beim Fokussieren!
