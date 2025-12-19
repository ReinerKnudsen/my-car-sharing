# CarSharing App

Eine moderne CarSharing-Anwendung für den privaten Bereich, entwickelt mit Ionic React und Supabase.

## Features

### Benutzerverwaltung

- **Benutzerauthentifizierung**: Sichere Anmeldung mit E-Mail und Passwort
- **Einladungscode-System**: Registrierung nur mit gültigem Einladungscode
- **Rollensystem**: Admin, Gruppenadmin und normale Benutzer
- **Benutzer-Blockierung**: Admin kann Benutzer bei Bedarf blockieren
- **Passwort-Reset**: Passwort zurücksetzen per E-Mail

### Gruppenverwaltung

- **Gruppenverwaltung**: Organisieren Sie Fahrer in Gruppen (z.B. Familie, WG)
- **Gruppenadmin**: Verwaltet die Mitglieder einer Gruppe
- **Gruppenkonto**: Übersicht über Einnahmen, Ausgaben und Saldo

### Buchungen & Fahrten

- **Buchungssystem**: Buchen Sie das Auto für bestimmte Zeiträume
- **Kalenderansicht**: Visualisierung aller Buchungen im Kalender
- **Zeitraum-Buchungen**: Start- und Enddatum/-uhrzeit für Buchungen
- **Fahrtenverwaltung**: Erfassen Sie Fahrten mit Start- und Endkilometerstand
- **Automatische Kostenberechnung**: Fahrtkosten werden automatisch berechnet (€/km)

### Belegsystem

- **Belegerfassung**: Erfassen Sie Ausgaben (Tanken, Wäsche, Wartung, etc.)
- **Belegarten-Verwaltung**: Admin kann Belegarten anpassen und erweitern
- **Überweisungen**: Einzahlungen ins Gruppenkonto dokumentieren
- **PayPal-Integration**: Direkte Zahlung ins Gruppenkonto via PayPal

### Dashboard & Statistiken

- **Dashboard**: Übersicht über kommende Buchungen, letzte Fahrten und Statistiken
- **Gruppenkonto-Übersicht**: Saldo, Transaktionshistorie und Statistiken

### Admin-Bereich

- **Benutzerverwaltung**: Erstellen, bearbeiten und blockieren von Benutzern
- **Gruppenverwaltung**: Gruppen erstellen und verwalten
- **Einladungscodes**: Einladungscodes generieren und verwalten
- **Belegarten**: Belegarten anpassen und verwalten
- **Einstellungen**: Kostensatz pro km und PayPal-Konfiguration

### Technisch

- **Cross-Platform**: Läuft auf iOS, Android und im Web
- **PWA-Support**: Installierbar als Progressive Web App
- **Versionierung**: Automatische Versionsnummer-Generierung

## Technologie-Stack

- **Frontend**: React 19.0.0 mit Ionic Framework 8.5.0
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Mobile**: Capacitor 7.4.4 für iOS und Android
- **TypeScript**: Typsichere Entwicklung
- **Testing**: Playwright (E2E), Vitest (Unit-Tests), Cypress
- **Zahlungen**: PayPal SDK Integration
- **Build**: Vite 5.0

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
3. Kopieren Sie den kompletten Inhalt von `supabase-setup.sql` und führen Sie ihn aus
   - Diese Datei enthält alle notwendigen Tabellen, Funktionen und Policies
   - Alternativ können Sie die einzelnen Migrations-Dateien manuell ausführen (siehe Datei-Kommentare)
4. Notieren Sie sich Ihre Supabase URL und Anon Key (Settings > API)

### 3. Umgebungsvariablen einrichten

Erstellen Sie eine `.env` Datei im Hauptverzeichnis:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Ersetzen Sie `your-supabase-url` und `your-supabase-anon-key` mit Ihren tatsächlichen Werten.

### 4. Ersten Admin-Benutzer und Gruppe erstellen

**Schritt 1: Erste Gruppe erstellen**

```sql
INSERT INTO public.groups (bezeichnung)
VALUES ('Meine Gruppe')
RETURNING id; -- Notieren Sie sich diese ID
```

**Schritt 2: Admin-Benutzer erstellen**

Es gibt zwei Möglichkeiten:

**Option A: Über Supabase Dashboard**

1. Gehen Sie zu Authentication > Users
2. Erstellen Sie einen neuen Benutzer
3. Gehen Sie zu Table Editor > profiles
4. Erstellen Sie ein Profil mit:
   - `id`: UUID des erstellten Benutzers
   - `vorname` und `name`: Name des Admins
   - `gruppe_id`: ID der erstellten Gruppe
   - `ist_admin`: `true`
   - `ist_gruppen_admin`: `true`

**Option B: Über SQL**

```sql
-- Erst den Benutzer in auth.users erstellen, dann:
INSERT INTO public.profiles (id, vorname, name, gruppe_id, ist_admin, ist_gruppen_admin)
VALUES ('user-uuid-hier', 'Admin', 'User', 'gruppen-uuid-hier', true, true);
```

**Schritt 3: Ersten Einladungscode erstellen**

```sql
INSERT INTO public.invitation_codes (code, gruppe_id, created_by, max_uses)
VALUES ('WILLKOMMEN2024', 'gruppen-uuid-hier', 'admin-user-uuid-hier', 10);
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
│   ├── components/              # Wiederverwendbare Komponenten
│   │   ├── AdminRoute.tsx       # Route Guard für Admin
│   │   ├── AuthGuard.tsx        # Authentifizierungs-Guard
│   │   ├── ProtectedRoute.tsx   # Route Guard für authentifizierte Benutzer
│   │   ├── BookingCard.tsx      # Buchungs-Karte
│   │   ├── BookingCalendar.tsx  # Kalenderansicht für Buchungen
│   │   ├── TripCard.tsx         # Fahrten-Karte
│   │   ├── AppVersion.tsx       # Versionsnummer-Anzeige
│   │   └── MainTabs.tsx         # Haupt-Navigation
│   ├── contexts/                # React Contexts
│   │   └── AuthContext.tsx      # Authentifizierung & Benutzerverwaltung
│   ├── pages/                   # Seiten
│   │   ├── Login.tsx            # Login-Seite
│   │   ├── Register.tsx         # Registrierung mit Einladungscode
│   │   ├── ResetPassword.tsx    # Passwort zurücksetzen
│   │   ├── Dashboard.tsx        # Haupt-Dashboard
│   │   ├── Profile.tsx          # Benutzerprofil
│   │   ├── Bookings.tsx         # Buchungsübersicht
│   │   ├── BookingCreate.tsx    # Neue Buchung erstellen
│   │   ├── Trips.tsx            # Fahrtenübersicht
│   │   ├── TripCreate.tsx       # Neue Fahrt erfassen
│   │   ├── Receipts.tsx         # Belegübersicht
│   │   ├── ReceiptCreate.tsx    # Neuen Beleg erstellen
│   │   ├── GroupAccount.tsx     # Gruppenkonto mit Saldo & Transaktionen
│   │   └── admin/               # Admin-Bereich
│   │       ├── Users.tsx        # Benutzerverwaltung
│   │       ├── Groups.tsx       # Gruppenverwaltung
│   │       ├── InvitationCodes.tsx  # Einladungscode-Verwaltung
│   │       ├── ReceiptTypes.tsx     # Belegarten-Verwaltung
│   │       └── Settings.tsx         # System-Einstellungen
│   ├── services/                # API Services
│   │   ├── supabase.ts          # Supabase Client
│   │   ├── auth.service.ts      # Authentifizierungs-Service
│   │   └── database.ts          # Datenbank-Operationen
│   ├── types/                   # TypeScript Typen
│   │   └── index.ts             # Typ-Definitionen
│   ├── utils/                   # Hilfsfunktionen
│   └── App.tsx                  # Haupt-App-Komponente
├── scripts/                     # Build & Deployment Scripts
│   ├── generate-version.js      # Automatische Versionsgenerierung
│   └── update-changelog.js      # Changelog-Verwaltung
├── supabase-schema-v2.sql       # Basis Datenbank-Schema
├── supabase-migration-*.sql     # Datenbank-Migrationen
├── capacitor.config.ts          # Capacitor Konfiguration
├── package.json                 # Dependencies & Scripts
└── README.md                    # Diese Datei
```

## Datenbankschema

### Haupttabellen

- **groups**: Gruppen von Fahrern
- **profiles**: Benutzerprofile (erweitert auth.users)
  - Felder: `ist_admin`, `ist_gruppen_admin`, `gruppe_id`
- **bookings**: Auto-Buchungen mit Zeiträumen
  - Felder: `start_datum`, `start_uhrzeit`, `ende_datum`, `ende_uhrzeit`, `kommentar`
- **trips**: Fahrten mit Kilometerständen und automatischer Kostenberechnung
  - Felder: `start_kilometer`, `end_kilometer`, `datum`, `kosten`, `kommentar`
- **invitation_codes**: Einladungscodes für Registrierung
  - Felder: `code`, `gruppe_id`, `expires_at`, `max_uses`, `uses_count`, `is_active`
- **receipts**: Belege für Ausgaben und Einzahlungen
  - Felder: `receipt_type_id`, `datum`, `betrag`, `kommentar`
- **receipt_types**: Belegarten (Tanken, Wäsche, Wartung, etc.)
  - Felder: `bezeichnung`, `beschreibung`, `aktiv`, `sort_order`
- **settings**: System-Einstellungen
  - Einträge: `kosten_pro_km`, `paypal_email`, `paypal_client_id`

### Funktionen

- **get_group_account()**: Berechnet Gruppenkonto-Saldo
- **get_group_account_transactions()**: Liefert Transaktionshistorie
- **calculate_trip_costs()**: Trigger für automatische Kostenberechnung

### Row Level Security (RLS)

Alle Tabellen sind mit Row Level Security geschützt:

- **Lesen**: Authentifizierte Benutzer können alle Daten ihrer Gruppe lesen
- **Erstellen**: Benutzer können eigene Buchungen, Fahrten und Belege erstellen
- **Aktualisieren**: Benutzer können eigene Daten ändern (24h-Limit bei Belegen)
- **Löschen**: Benutzer können eigene Daten löschen (24h-Limit bei Belegen)
- **Admin**: Admins können alle Daten verwalten
- **Gruppenadmin**: Kann Belege der eigenen Gruppe verwalten

## Verwendung

### Als normaler Fahrer

1. **Registrieren**:
   - Einladungscode von Admin/Gruppenadmin erhalten
   - Registrierung mit E-Mail, Passwort und Code

2. **Anmelden**: Mit E-Mail und Passwort anmelden

3. **Dashboard**: Übersicht über kommende Buchungen, letzte Fahrten und Statistiken

4. **Auto buchen**:
   - Zur Buchungen-Seite navigieren
   - "+" Button klicken
   - Start- und Enddatum/-uhrzeit sowie Kommentar eingeben
   - Kalenderansicht zeigt alle Buchungen

5. **Fahrt erfassen**:
   - Zur Fahrten-Seite navigieren
   - "+" Button klicken
   - Start- und Endkilometer sowie Datum eingeben
   - Kosten werden automatisch berechnet

6. **Belege erfassen**:
   - Zur Belege-Seite navigieren
   - "+" Button klicken
   - Belegart wählen (Tanken, Wäsche, Wartung, Überweisung)
   - Betrag, Datum und optional Kommentar eingeben

7. **Gruppenkonto einsehen**:
   - Gruppenkonto-Tab öffnen
   - Saldo, Transaktionshistorie und Statistiken anzeigen
   - Bei negativem Saldo: PayPal-Zahlung möglich (falls konfiguriert)

### Als Gruppenadmin

Zusätzlich zu den Fahrer-Funktionen:

1. **Einladungscodes erstellen**:
   - Verwaltung > Einladungscodes
   - Neuen Code generieren
   - Code an neue Mitglieder weitergeben

2. **Belege verwalten**:
   - Belege der Gruppenmitglieder einsehen und löschen

### Als Administrator

Zusätzlich zu allen anderen Funktionen:

1. **Benutzer verwalten**:
   - Verwaltung > Benutzer
   - Neue Benutzer erstellen
   - Benutzer blockieren oder löschen
   - Admin- und Gruppenadmin-Rechte vergeben
2. **Gruppen verwalten**:
   - Verwaltung > Gruppen
   - Neue Gruppen erstellen
   - Gruppen bearbeiten oder löschen

3. **Einladungscodes verwalten**:
   - Verwaltung > Einladungscodes
   - Codes für alle Gruppen erstellen und verwalten
   - Ablaufdatum und maximale Verwendungen festlegen

4. **Belegarten verwalten**:
   - Verwaltung > Belegarten
   - Neue Belegarten hinzufügen
   - Bestehende Belegarten bearbeiten oder deaktivieren
   - Sortierung anpassen

5. **System-Einstellungen**:
   - Verwaltung > Einstellungen
   - Kostensatz pro Kilometer festlegen
   - PayPal-Konfiguration (E-Mail und Client-ID)
   - Einstellungen werden für alle Gruppen verwendet

## PayPal-Integration einrichten

### 1. PayPal Developer Account

1. Erstellen Sie einen Account auf [developer.paypal.com](https://developer.paypal.com)
2. Erstellen Sie eine neue App im Dashboard
3. Notieren Sie sich die **Client-ID** (für Sandbox oder Live)

### 2. In der App konfigurieren

1. Als Admin anmelden
2. Zu Verwaltung > Einstellungen navigieren
3. **PayPal E-Mail**: E-Mail-Adresse des PayPal-Kontos eingeben
4. **PayPal Client-ID**: Client-ID aus dem Developer Dashboard eingeben
5. Speichern

### 3. Verwendung

- Benutzer mit negativem Saldo sehen einen PayPal-Button im Gruppenkonto
- Nach erfolgreicher Zahlung wird automatisch ein Beleg erstellt
- Der Gruppenkonto-Saldo wird entsprechend aktualisiert

**Hinweis**: Lassen Sie die PayPal-Felder leer, um PayPal zu deaktivieren.

## Anpassungen

### App-Name und Icon ändern

1. Ändern Sie `appName` in `capacitor.config.ts`
2. Ersetzen Sie die Icons in `public/` für Web
3. Für native Apps: Siehe `ICONS.md` für detaillierte Anleitung

### Farben anpassen

Bearbeiten Sie `src/theme/variables.css` um das Farbschema anzupassen.

### Kostensatz anpassen

1. Als Admin anmelden
2. Verwaltung > Einstellungen
3. "Kosten pro Kilometer" anpassen
4. Neue Fahrten verwenden automatisch den neuen Satz

### Weitere Funktionen hinzufügen

Das Projekt ist modular aufgebaut. Neue Features können einfach hinzugefügt werden:

1. Neue Tabellen in Supabase erstellen (neue Migration-Datei)
2. TypeScript-Typen in `src/types/index.ts` definieren
3. Service-Funktionen in `src/services/database.ts` hinzufügen
4. UI-Komponenten und Seiten erstellen
5. Routen in `App.tsx` hinzufügen

## Troubleshooting

### "Supabase URL oder Anon Key fehlt"

- Stellen Sie sicher, dass die `.env` Datei korrekt erstellt wurde
- Überprüfen Sie, dass die Werte in der `.env` Datei korrekt sind
- Starten Sie den Dev-Server neu nach Änderungen an `.env`

### Registrierung funktioniert nicht

- Überprüfen Sie, dass ein gültiger Einladungscode existiert
- Prüfen Sie in Supabase: Table Editor > invitation_codes
- Stellen Sie sicher, dass `is_active = true` und `uses_count < max_uses`

### Authentifizierung funktioniert nicht

- Überprüfen Sie, dass alle Datenbank-Migrationen ausgeführt wurden
- Stellen Sie sicher, dass RLS-Policies aktiviert sind
- Prüfen Sie in Supabase Auth > Users, ob der Benutzer existiert
- Prüfen Sie, ob ein Profil in der `profiles` Tabelle existiert

### Kosten werden nicht berechnet

- Überprüfen Sie, dass `supabase-migration-costs.sql` ausgeführt wurde
- Prüfen Sie in Table Editor > settings, ob `kosten_pro_km` existiert
- Trigger `calculate_trip_costs` muss auf `trips` Tabelle aktiv sein

### PayPal-Button wird nicht angezeigt

- Überprüfen Sie, dass PayPal-Einstellungen konfiguriert sind
- Prüfen Sie in Table Editor > settings: `paypal_email` und `paypal_client_id`
- PayPal-Button erscheint nur bei negativem Gruppenkonto-Saldo

### App startet nicht auf iOS/Android

- Führen Sie `npx cap sync` nach jedem Build aus
- Überprüfen Sie, dass alle nativen Dependencies installiert sind
- Für iOS: Überprüfen Sie Signing & Capabilities in Xcode
- Für Android: Überprüfen Sie `AndroidManifest.xml` für Permissions

### Versionsnummer wird nicht aktualisiert

- Der `prebuild` Script generiert automatisch `src/version.json`
- Führen Sie `npm run build` aus (nicht nur `vite build`)
- Prüfen Sie, dass `scripts/generate-version.js` existiert

## Support & Beitragen

Bei Fragen oder Problemen:

- Öffnen Sie ein Issue auf GitHub
- Kontaktieren Sie den Entwickler

## Lizenz

Dieses Projekt ist für den privaten Gebrauch bestimmt.

## Changelog & Versionen

Die App verwendet semantische Versionierung (SemVer):

- **Major**: Breaking Changes (z.B. 1.0.0 → 2.0.0)
- **Minor**: Neue Features (z.B. 1.0.0 → 1.1.0)
- **Patch**: Bugfixes (z.B. 1.0.0 → 1.0.1)

Aktuelle Version: **2.1.5**

Siehe `changelog.md` für detaillierte Änderungshistorie.

## Nächste Schritte

Mögliche Erweiterungen:

- Push-Benachrichtigungen für Buchungsbestätigungen
- Fahrzeugverwaltung (mehrere Autos pro Gruppe)
- Erweiterte Statistiken und Reports
- Bildupload für Schadensmeldungen und Belege
- Integration mit Kalender-Apps (iCal, Google Calendar)
- Export-Funktionen (PDF, CSV)
- Benachrichtigungen bei niedrigem Gruppenkonto-Saldo
- Automatische Erinnerungen für Wartungstermine
