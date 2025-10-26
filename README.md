# Flowtime – Moderner Time Tracker

Flowtime besteht aus zwei Clients, die denselben Funktionsumfang teilen:

- **Desktop** (`apps/desktop`): Electron-App mit lokalem Speichern, Break-Reminder und Offline-Modus.
- **Mobile** (`apps/mobile`): React-Native-App (Expo) für Android/iOS mit identischer Timer-, Historien- und Einstellungslogik.
- **Backend** (`apps/server`): Express + SQLite als optionales REST-Backend, das sich später leicht anbinden lässt.

Alle Clients unterstützen Deutsch und Englisch, Countdown- und Stopuhr-Modus, Presets, manuelle Dauer-Eingabe, Historie mit Filtern sowie den Pausen-Reminder.

## Highlights

- Countdown & Stopuhr mit segmentierter Anpassung (Stunden/Minuten/Sekunden) und Presets.
- Task-Formular mit lokaler Persistenz, History-Filter (Heute/Woche/Alles) und Gesamtauswertung.
- Mehrsprachiges UI (de/en) mit langlebigem AsyncStorage/LocalStorage Handling.
- Pausen-Reminder inkl. Snooze-Funktion; auf Mobile zusätzlich via lokalem Notification-Try.
- Konsistenter Look & Feel: dunkles Theme, klare Buttons, gute Touch Targets.

## Projektstruktur

```
.
├── apps
│   ├── desktop               # Electron-Client
│   │   ├── package.json
│   │   ├── resources/
│   │   └── src/
│   ├── mobile                # React Native (Expo) Client
│   │   ├── App.js
│   │   ├── app.json
│   │   ├── package.json
│   │   └── src/
│   └── server                # REST-Backend (Express + SQLite)
│       ├── package.json
│       └── src/
└── README.md
```

### Desktop-Renderer (Kurzüberblick)

- `scripts/features/*`: Timer, Historie, Einstellungen, Break-Reminder.
- `scripts/core/i18n.js`: Sprachlogik und Listener.
- `scripts/ui/*`: DOM-spezifische Helper (z. B. Benachrichtigungen).
- `scripts/utils/*`: Zeitformatierung, Datumsbereich, ID-Erzeugung.

### Mobile-App (Expo)

- `src/hooks/useTimer.js`: Countdown-/Stopuhr-Logik mit Tick-Management.
- `src/hooks/useBreakReminder.js`: Reminder inkl. Snooze & Notification-Fallback.
- `src/context/*`: AsyncStorage-basierte Stores für Historie, Sprache, Reminder.
- `src/screens/*`: Timer-, History- und Settings-UI in React Native.
- `src/theme/*`: Farb- und Spacing-Token für konsistente Styles.

## Getting Started – Desktop (Electron)

Voraussetzungen: Node.js 20.x, npm 10.x.

```bash
cd apps/desktop
npm install
npm run start   # Entwicklungsmodus
```

Der Produktionsbuild landet nach `npm run dist` unter `apps/desktop/dist/` (NSIS, Portable, DMG, AppImage).

## Getting Started – Mobile (React Native)

Voraussetzungen:

- Node.js 18–20, npm 9/10
- Expo CLI (`npm install -g expo-cli`) oder `npx expo` im Projekt
- Android Studio mit aktivem Emulator oder echtes Gerät mit Expo Go App

Installation & Start:

```bash
cd apps/mobile
npm install
npm start            # Expo Dev Server
# Danach: Taste "a" für Android Emulator oder QR-Code in Expo Go scannen
```

Für eine native Android-Build-Pipeline:

```bash
npx expo prebuild
npx expo run:android
# Öffnet das generierte android/ Projekt automatisch in Android Studio
```

### Wichtige Dependencies

- React Navigation (Bottom Tabs + Native Stack)
- AsyncStorage für Persistenz (Historie, Sprache, Reminder)
- Expo Notifications (lokale Erinnerungen)

## Getting Started – Backend (Express + SQLite)

```bash
cd apps/server
npm install
npm run dev        # mit Hot Reload
npm test           # node:test Suite
```

Konfiguration via Umgebungsvariablen:

- `PORT` – HTTP-Port (Standard: `4000`)
- `FLOWTIME_DB_DIR` / `FLOWTIME_DB_PATH` – Speicherort für die SQLite-DB

## Feature-Parität Mobile vs. Desktop

| Feature                | Desktop | Mobile |
| ---------------------- | :-----: | :----: |
| Countdown & Stopuhr    |   ✅    |   ✅   |
| Presets & Segment-Shift|   ✅    |   ✅   |
| Manuelle Eingabe       |   ✅    |   ✅   |
| Historie + Filter      |   ✅    |   ✅   |
| Mehrsprachigkeit       |   ✅    |   ✅   |
| Pausen-Reminder        |   ✅    |   ✅   |
| System-Notifications   |  Toast  | Alert + Expo Notification |

## Android Studio Workflow

1. Projekt auschecken/kopieren.
2. `npm install` unter `apps/mobile`.
3. `npx expo prebuild` erzeugt native Projektstruktur.
4. `npx expo run:android` öffnet Android Studio mit dem generierten Projekt (`android/`).
5. Über Android Studio wie gewohnt Build/Run ausführen oder ein `.apk/.aab` erstellen.

> Tipp: Expo bleibt trotzdem nutzbar. Für schnelle Iteration `npm start`, für native Builds den Prebuild-Workflow verwenden.

## Weiterentwicklung

- Gemeinsame Utility-Layer (`packages/shared`) anlegen, um Desktop & Mobile Logik zu teilen.
- REST-Backend anbinden (fetch/axios) statt reinem AsyncStorage.
- E2E-Tests (z. B. Detox) für Mobile ergänzen; Play Store/CI-Pipeline vorbereiten.

Viel Erfolg beim Fokussieren – und nun auch unterwegs! 😊

