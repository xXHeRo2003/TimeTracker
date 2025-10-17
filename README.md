# Flowtime – Moderner Time Tracker

Flowtime ist ein fokussierter Desktop-Timer auf Basis von Electron. Die App ist modular aufgebaut, mehrsprachig (de/en) und speichert Arbeits-Sessions lokal auf dem Gerät.

## Highlights

- Fokus-Timer mit Presets (15/25/45/60 Minuten), manueller Eingabe und Tastatursteuerung
- Task-Formular mit Session-Historie inklusive Tages-, Wochen- und Gesamtfilter
- Persistente Speicherung via `localStorage` und optische Rückmeldung bei Timer-Ende
- Sauber getrennte Renderer-Module für Timer, Historie, Einstellungen, i18n und Hilfsfunktionen

## Getting Started (Desktop)

Voraussetzung: Node.js (>= 18).

```bash
cd apps/desktop
npm install
npm run start   # development mode
```

Für Produktions-Builds steht electron-builder bereit:

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
│   └── desktop
│       ├── package.json
│       ├── resources/
│       └── src
│           ├── main/
│           │   └── index.js              # Electron Hauptprozess
│           ├── preload/
│           │   └── index.js              # Gesicherte Bridge API
│           └── renderer/
│               ├── pages/
│               │   └── index.html
│               ├── scripts/
│               │   ├── app.js            # Einstiegspunkt
│               │   ├── config/           # Konstanten & Übersetzungen
│               │   ├── core/             # i18n State
│               │   ├── features/         # Timer, History, Settings, Mobile View
│               │   ├── services/         # Storage-Anbindung
│               │   ├── ui/               # DOM-Helfer & UI-spezifische Utilities
│               │   └── utils/            # Generische Helper (Zeit, UUIDs, Datumsbereiche)
│               └── styles/
│                   ├── index.css
│                   └── partials/
│                       ├── base.css
│                       ├── components.css
│                       └── views.css
└── README.md
```

## Code-Aufbau (Renderer)

- `features/timer.js` kapselt alle Timer-Interaktionen (Start/Pause, Segment-Navigation, Presets).
- `features/history.js` lädt und rendert die Historie, inklusive Filterlogik und Totalzeit.
- `features/settings.js` verantwortet das Einstellungs-Panel, Sprachwechsel und Responsive-Umbau.
- `core/i18n.js` stellt Übersetzungs- und Sprachauswahl-Logik inkl. Listenern bereit.
- `ui/translations.js` übernimmt das Aktualisieren der DOM-Texte; `ui/version.js` zieht die App-Version aus der Preload-Bridge.

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

Viel Erfolg beim Fokussieren!
