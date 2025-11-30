# CarSharing App

Eine moderne CarSharing-Anwendung für den privaten Bereich, entwickelt mit Ionic React und Supabase.

## Features

- **Benutzerauthentifizierung**: Sichere Anmeldung mit E-Mail und Passwort
- **Gruppenverwaltung**: Organisieren Sie Fahrer in Gruppen (z.B. Familie, WG)
- **Buchungssystem**: Buchen Sie das Auto für bestimmte Zeiten
- **Fahrtenverwaltung**: Erfassen Sie Fahrten mit Start- und Endkilometerstand
- **Dashboard**: Übersicht über kommende Buchungen, letzte Fahrten und Statistiken
- **Admin-Bereich**: Verwaltung von Benutzern und Gruppen
- **Cross-Platform**: Läuft auf iOS, Android und im Web

## Technologie-Stack

- **Frontend**: React mit Ionic Framework
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Mobile**: Capacitor für iOS und Android
- **TypeScript**: Typsichere Entwicklung
- **Testing**: Playwright (E2E), Vitest (Unit-Tests)

## Installation

### Voraussetzungen

- Node.js (v18 oder höher)
- npm oder yarn
- Supabase Account (kostenlos unter [supabase.com](https://supabase.com))
- Für iOS: Xcode und macOS
- Für Android: Android Studio

### 1. Projekt klonen

```bash
cd carsharing-app
npm install
```

### 2. Supabase einrichten

1. Erstellen Sie ein neues Projekt auf [supabase.com](https://supabase.com)
2. Öffnen Sie den SQL Editor in Ihrem Supabase Dashboard
3. Kopieren Sie den Inhalt von `supabase-schema.sql` und führen Sie ihn aus
4. Notieren Sie sich Ihre Supabase URL und Anon Key (Settings > API)

### 3. Umgebungsvariablen einrichten

Erstellen Sie eine `.env` Datei im Hauptverzeichnis:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Ersetzen Sie `your-supabase-url` und `your-supabase-anon-key` mit Ihren tatsächlichen Werten.

### 4. Ersten Admin-Benutzer erstellen

Es gibt zwei Möglichkeiten, den ersten Admin-Benutzer zu erstellen:

**Option A: Über Supabase Dashboard**
1. Gehen Sie zu Authentication > Users
2. Erstellen Sie einen neuen Benutzer
3. Gehen Sie zu Table Editor > profiles
4. Setzen Sie `ist_admin` auf `true` für diesen Benutzer

**Option B: Über SQL**
```sql
-- Erst den Benutzer in auth.users erstellen, dann:
INSERT INTO public.profiles (id, vorname, name, ist_admin)
VALUES ('user-uuid-hier', 'Admin', 'User', true);
```

## Entwicklung

### Web-Version starten

```bash
npm run dev
```

Die App läuft dann auf `http://localhost:5173`

### Build für Produktion

```bash
npm run build
```

### Tests ausführen

```bash
# Alle Tests
npm test

# Unit-Tests
npm run test:unit

# Unit-Tests mit Coverage
npm run test:unit:coverage

# E2E-Tests
npm run test:e2e

# E2E-Tests mit UI
npm run test:e2e:ui
```

Siehe [TESTING.md](TESTING.md) für detaillierte Test-Dokumentation.

### iOS-App

```bash
npm run build
npx cap sync
npx cap open ios
```

Dann in Xcode das Projekt öffnen und auf einem Simulator oder Gerät ausführen.

### Android-App

```bash
npm run build
npx cap sync
npx cap open android
```

Dann in Android Studio das Projekt öffnen und auf einem Emulator oder Gerät ausführen.

## Projektstruktur

```
carsharing-app/
├── src/
│   ├── components/          # Wiederverwendbare Komponenten
│   │   ├── AdminRoute.tsx   # Route Guard für Admin
│   │   ├── ProtectedRoute.tsx
│   │   ├── BookingCard.tsx
│   │   ├── TripCard.tsx
│   │   └── MainTabs.tsx     # Haupt-Navigation
│   ├── contexts/            # React Contexts
│   │   └── AuthContext.tsx  # Authentifizierung
│   ├── pages/               # Seiten
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   ├── Bookings.tsx
│   │   ├── BookingCreate.tsx
│   │   ├── Trips.tsx
│   │   ├── TripCreate.tsx
│   │   └── admin/
│   │       ├── Users.tsx
│   │       └── Groups.tsx
│   ├── services/            # API Services
│   │   ├── supabase.ts
│   │   ├── auth.service.ts
│   │   └── database.ts
│   ├── types/               # TypeScript Typen
│   │   └── index.ts
│   └── App.tsx              # Haupt-App-Komponente
├── supabase-schema.sql      # Datenbank-Schema
├── capacitor.config.ts      # Capacitor Konfiguration
└── README.md
```

## Datenbankschema

### Tables

- **groups**: Gruppen von Fahrern
- **profiles**: Benutzerprofile (erweitert auth.users)
- **bookings**: Auto-Buchungen
- **trips**: Fahrten mit Kilometerständen

### Row Level Security (RLS)

Alle Tabellen sind mit Row Level Security geschützt:
- Authentifizierte Benutzer können alle Daten lesen
- Benutzer können eigene Buchungen und Fahrten erstellen
- Admins können alle Daten verwalten

## Verwendung

### Als normaler Fahrer

1. **Anmelden**: Mit E-Mail und Passwort anmelden
2. **Dashboard**: Übersicht über kommende Buchungen und Statistiken
3. **Auto buchen**: 
   - Zur Buchungen-Seite navigieren
   - "+" Button klicken
   - Datum, Uhrzeit und Kommentar eingeben
4. **Fahrt erfassen**:
   - Zur Fahrten-Seite navigieren
   - "+" Button klicken
   - Start- und Endkilometer sowie Datum eingeben

### Als Administrator

Zusätzlich zu den Fahrer-Funktionen:

1. **Benutzer verwalten**:
   - Verwaltung-Tab öffnen
   - Neue Benutzer erstellen
   - Benutzer löschen
   
2. **Gruppen verwalten**:
   - Verwaltung > Gruppen
   - Neue Gruppen erstellen
   - Gruppen bearbeiten oder löschen

## Anpassungen

### App-Name und Icon ändern

1. Ändern Sie `appName` in `capacitor.config.ts`
2. Ersetzen Sie die Icons in `public/` für Web
3. Für native Apps: Verwenden Sie `cordova-res` oder erstellen Sie Icons manuell

### Farben anpassen

Bearbeiten Sie `src/theme/variables.css` um das Farbschema anzupassen.

### Weitere Funktionen hinzufügen

Das Projekt ist modular aufgebaut. Neue Features können einfach hinzugefügt werden:
1. Neue Tabellen in Supabase erstellen
2. TypeScript-Typen in `src/types/index.ts` definieren
3. Service-Funktionen in `src/services/database.ts` hinzufügen
4. UI-Komponenten und Seiten erstellen

## Troubleshooting

### "Supabase URL oder Anon Key fehlt"
- Stellen Sie sicher, dass die `.env` Datei korrekt erstellt wurde
- Überprüfen Sie, dass die Werte in der `.env` Datei korrekt sind
- Starten Sie den Dev-Server neu nach Änderungen an `.env`

### Authentifizierung funktioniert nicht
- Überprüfen Sie, dass das Datenbank-Schema korrekt ausgeführt wurde
- Stellen Sie sicher, dass RLS-Policies aktiviert sind
- Prüfen Sie in Supabase Auth > Users, ob der Benutzer existiert

### App startet nicht auf iOS/Android
- Führen Sie `npx cap sync` nach jedem Build aus
- Überprüfen Sie, dass alle nativen Dependencies installiert sind
- Für iOS: Überprüfen Sie Signing & Capabilities in Xcode
- Für Android: Überprüfen Sie `AndroidManifest.xml` für Permissions

## Support & Beitragen

Bei Fragen oder Problemen:
- Öffnen Sie ein Issue auf GitHub
- Kontaktieren Sie den Entwickler

## Lizenz

Dieses Projekt ist für den privaten Gebrauch bestimmt.

## Nächste Schritte

Mögliche Erweiterungen:
- Push-Benachrichtigungen für Buchungsbestätigungen
- Kalender-Integration
- Kostenverwaltung (Tanken, Wartung)
- Fahrzeugverwaltung (mehrere Autos)
- Statistiken und Reports
- Bildupload für Schadensmeldungen
- Integration mit Kalender-Apps

