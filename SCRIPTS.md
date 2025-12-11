# Verfügbare npm Scripts

Dieses Dokument beschreibt alle verfügbaren npm Scripts für die CarSharing App.

## Entwicklung

### `npm run dev`
Startet den Entwicklungsserver mit Hot-Reload.
- URL: `http://localhost:5173`
- Änderungen werden automatisch neu geladen
- Ideal für die tägliche Entwicklung

### `npm run build`
Erstellt einen optimierten Production Build.
- TypeScript wird kompiliert
- Code wird minifiziert
- Output: `dist/` Verzeichnis

### `npm run preview`
Vorschau des Production Builds lokal.
- Muss nach `npm run build` ausgeführt werden
- Testet den Production Build lokal

## Code-Qualität

### `npm run lint`
Führt ESLint aus, um Code-Probleme zu finden.
- Überprüft TypeScript/JavaScript Code
- Zeigt Warnungen und Fehler an

## Testing

### `npm run test.unit`
Führt Unit-Tests mit Vitest aus.
- Schnelle Tests für einzelne Komponenten
- Watch-Mode verfügbar

### `npm run test.e2e`
Führt End-to-End Tests mit Cypress aus.
- Testet die gesamte Anwendung
- Simuliert Benutzerinteraktionen

## Mobile Apps

### `npm run ios`
Build, Sync und öffnet das iOS-Projekt in Xcode.
- Erstellt Production Build
- Synchronisiert mit Capacitor
- Öffnet Xcode
- **Voraussetzung**: macOS mit Xcode installiert

### `npm run android`
Build, Sync und öffnet das Android-Projekt in Android Studio.
- Erstellt Production Build
- Synchronisiert mit Capacitor
- Öffnet Android Studio
- **Voraussetzung**: Android Studio installiert

### `npm run sync`
Synchronisiert den Web-Code mit iOS und Android.
- Kopiert Web-Assets zu nativen Projekten
- Aktualisiert native Konfigurationen
- Muss nach jedem Build ausgeführt werden

### `npm run sync:ios`
Synchronisiert nur mit iOS.
- Schneller als vollständiges Sync
- Wenn nur iOS-Änderungen nötig sind

### `npm run sync:android`
Synchronisiert nur mit Android.
- Schneller als vollständiges Sync
- Wenn nur Android-Änderungen nötig sind

## Workflow-Beispiele

### Web-Entwicklung
```bash
# Terminal 1: Dev-Server starten
npm run dev

# Im Browser: http://localhost:5173 öffnen
# Änderungen werden automatisch neu geladen
```

### iOS-Entwicklung
```bash
# 1. Änderungen im Code machen
# 2. Build erstellen und in Xcode öffnen
npm run ios

# 3. In Xcode: Simulator wählen und Run klicken
```

### Android-Entwicklung
```bash
# 1. Änderungen im Code machen
# 2. Build erstellen und in Android Studio öffnen
npm run android

# 3. In Android Studio: Emulator wählen und Run klicken
```

### Schnelles Sync ohne Xcode/Android Studio zu öffnen
```bash
# 1. Build erstellen
npm run build

# 2. Nur synchronisieren
npm run sync

# 3. Manuell Xcode oder Android Studio öffnen
```

### Production Build testen
```bash
# 1. Production Build erstellen
npm run build

# 2. Lokal testen
npm run preview

# 3. Im Browser öffnen (URL wird angezeigt)
```

## Tipps

### Hot Reload für native Apps
- Für iOS/Android Entwicklung: Verwenden Sie `npm run dev` parallel
- Verwenden Sie die Browser-Version für schnellere Iterationen
- Testen Sie native Features nur in nativen Apps

### Build-Probleme
```bash
# Cache löschen und neu bauen
rm -rf dist node_modules
npm install
npm run build
```

### Capacitor-Probleme
```bash
# Capacitor neu initialisieren
rm -rf ios android
npx cap add ios
npx cap add android
npm run sync
```

### Performance-Check
```bash
# Build analysieren
npm run build -- --mode production

# Bundle-Größe überprüfen
ls -lh dist/
```

## Häufig verwendete Befehle

```bash
# Projekt starten (erste Installation)
npm install
npm run dev

# Nach Code-Änderungen (Web)
# Nichts - Hot-Reload läuft automatisch

# Nach Code-Änderungen (iOS/Android)
npm run build
npm run sync

# Neues Package installieren
npm install package-name
npm run build
npm run sync

# Vor dem Commit
npm run lint
npm run build
```

## Weitere Informationen

- Vite: https://vitejs.dev/
- Capacitor: https://capacitorjs.com/docs
- Ionic: https://ionicframework.com/docs

