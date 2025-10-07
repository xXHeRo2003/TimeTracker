# Flowtime – Moderner Time Tracker

Dieses Projekt enthält aktuell die Desktop-App für einen fokussierten Time Tracker. Die App liegt nun gebündelt unter `apps/desktop`, sodass Platz für weitere Clients (z. B. Mobile) entsteht.

## Features

- Fokussierter Countdown-Timer mit Presets (15/25/45/60 Minuten) und eigener Zeit (mm:ss oder Minuten)
- Task-Eingabefeld, um Sessions mit Beschreibung zu speichern
- Historie mit Tages-, Wochen- und Gesamtfilter
- Aggregierte Gesamtfokuszeit über alle Sessions
- Persistenz: Desktop via `localStorage`, Mobile via `AsyncStorage`
- Dunkles, modernes UI mit Inter-Font

## Getting Started

### Desktop (Electron)

Voraussetzungen: Node.js (>= 18).

#### Entwicklung starten

```bash
cd apps/desktop
npm install
npm run start
```

Der Entwicklungsmodus öffnet ein Electron-Fenster inklusive DevTools.

#### Produktions-Build mit electron-builder

Das Projekt enthält eine vorkonfigurierte `electron-builder`-Integration (`npm run dist`).

```bash
cd apps/desktop
npm install
npm run dist
```

Der Befehl erzeugt je nach Betriebssystem passende Artefakte im Ordner `apps/desktop/dist/`. Unter Linux wird z. B. `Flowtime-<version>.AppImage` erstellt. Das AppImage lässt sich wie folgt starten:

```bash
cd apps/desktop/dist
chmod +x Flowtime-1.0.0.AppImage
./Flowtime-1.0.0.AppImage
```

Hinweis: Für macOS (DMG) und Windows (NSIS & Portable) werden die jeweiligen Pakete ebenfalls unter `dist/` abgelegt. Lege eigene Icons im Ordner `apps/desktop/resources/` ab, um plattformspezifische Symbole zu verwenden.


## Struktur

```
.
├── apps
│   └── desktop
│       ├── package.json
│       ├── resources/
│       ├── dist/
│       └── src
│           ├── main/
│           │   └── index.js
│           ├── preload/
│           │   └── index.js
│           └── renderer/
│               ├── pages/
│               │   └── index.html
│               ├── scripts/
│               │   └── app.js
│               └── styles/
│                   ├── index.css
│                   └── partials/
│                       ├── base.css
│                       ├── components.css
│                       └── views.css
└── README.md
```

## Weiterentwicklung

- Automatische Synchronisation zwischen Desktop und Mobile kann z. B. via Firebase, Supabase oder eigenem Backend ergänzt werden.
- Push-Nachrichten oder Widgets für Pausen erinnern.
- Erweiterte Reports (z. B. Wochenziele, CSV-Export).

Viel Erfolg beim Fokussieren!
