# Flowtime – Moderner Time Tracker

Dieses Projekt enthält zwei Clients für einen fokussierten Time Tracker:

- **desktop/** – Electron-App für Windows, macOS und Linux.
- **mobile/** – React Native (Expo) App für iOS und Android.

## Features

- Fokussierter Countdown-Timer mit Presets (15/25/45/60 Minuten)
- Task-Eingabefeld, um Sessions mit Beschreibung zu speichern
- Historie mit Tages-, Wochen- und Gesamtfilter
- Aggregierte Gesamtfokuszeit über alle Sessions
- Persistenz: Desktop via `localStorage`, Mobile via `AsyncStorage`
- Dunkles, modernes UI mit Inter-Font

## Getting Started

### Desktop (Electron)

Voraussetzungen: Node.js (>= 18).

```bash
cd desktop
npm install
npm run start
```

Während der Entwicklung öffnet sich automatisch das DevTools-Fenster. Für den produktiven Build kann `electron-builder` oder eine andere Packager-Lösung ergänzt werden.

### Mobile (React Native / Expo)

Voraussetzungen: Node.js (>= 18) und Expo CLI (`npm install -g expo-cli`).

```bash
cd mobile
npm install
npm run start
```

Anschließend kann die App über den Expo Go Client (iOS/Android) oder einen Emulator geöffnet werden. Für eigenständige Builds empfiehlt sich die Expo EAS Pipeline.

## Struktur

```
.
├── desktop
│   ├── package.json
│   └── src
│       ├── main
│       │   └── main.js
│       ├── preload
│       │   └── preload.js
│       └── renderer
│           ├── index.html
│           ├── renderer.js
│           └── styles.css
└── mobile
    ├── App.tsx
    ├── app.json
    ├── babel.config.js
    ├── package.json
    └── tsconfig.json
```

## Weiterentwicklung

- Automatische Synchronisation zwischen Desktop und Mobile kann z. B. via Firebase, Supabase oder eigenem Backend ergänzt werden.
- Push-Nachrichten oder Widgets für Pausen erinnern.
- Erweiterte Reports (z. B. Wochenziele, CSV-Export).

Viel Erfolg beim Fokussieren!
