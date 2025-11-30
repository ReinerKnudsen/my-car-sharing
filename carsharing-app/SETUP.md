# CarSharing App - Schnellstart-Anleitung

Diese Anleitung führt Sie Schritt für Schritt durch die Einrichtung der CarSharing App.

## Schritt 1: Supabase Projekt erstellen

1. Gehen Sie zu [supabase.com](https://supabase.com) und melden Sie sich an
2. Klicken Sie auf "New Project"
3. Wählen Sie einen Namen für Ihr Projekt (z.B. "carsharing-app")
4. Wählen Sie ein sicheres Datenbank-Passwort
5. Wählen Sie eine Region (am besten eine in Ihrer Nähe)
6. Klicken Sie auf "Create new project"

## Schritt 2: Datenbank-Schema einrichten

1. Warten Sie, bis Ihr Supabase-Projekt vollständig eingerichtet ist (ca. 2 Minuten)
2. Klicken Sie in der linken Sidebar auf "SQL Editor"
3. Klicken Sie auf "New query"
4. Öffnen Sie die Datei `supabase-schema.sql` aus diesem Projekt
5. Kopieren Sie den gesamten Inhalt
6. Fügen Sie ihn in den SQL Editor ein
7. Klicken Sie auf "Run" (oder drücken Sie Cmd+Enter / Ctrl+Enter)
8. Sie sollten die Nachricht "Success. No rows returned" sehen

## Schritt 3: API-Keys abrufen

1. Klicken Sie in der linken Sidebar auf "Settings" (Zahnrad-Symbol)
2. Klicken Sie auf "API"
3. Sie finden dort:
   - **Project URL**: Kopieren Sie diese URL
   - **anon public**: Kopieren Sie diesen Key (unter "Project API keys")

## Schritt 4: Umgebungsvariablen einrichten

1. Öffnen Sie das Projekt im Editor
2. Erstellen Sie eine neue Datei namens `.env` im Hauptverzeichnis
3. Fügen Sie folgende Zeilen ein:

```env
VITE_SUPABASE_URL=Ihre-Project-URL-hier
VITE_SUPABASE_ANON_KEY=Ihr-anon-Key-hier
```

4. Ersetzen Sie die Platzhalter mit Ihren tatsächlichen Werten aus Schritt 3
5. Speichern Sie die Datei

## Schritt 5: Dependencies installieren

```bash
npm install
```

## Schritt 6: App starten

```bash
npm run dev
```

Die App sollte jetzt auf `http://localhost:5173` laufen!

## Schritt 7: Ersten Admin-Benutzer erstellen

### Option A: Über Supabase Dashboard (Empfohlen)

1. Gehen Sie zurück zum Supabase Dashboard
2. Klicken Sie auf "Authentication" in der linken Sidebar
3. Klicken Sie auf "Users"
4. Klicken Sie auf "Add user" > "Create new user"
5. Geben Sie eine E-Mail und ein Passwort ein
6. Klicken Sie auf "Create user"
7. Kopieren Sie die UUID des Benutzers (die lange ID)
8. Gehen Sie zu "Table Editor" > "profiles"
9. Sie sollten bereits einen Eintrag für diesen Benutzer sehen
10. Klicken Sie auf den Eintrag
11. Ändern Sie `ist_admin` von `false` auf `true`
12. Klicken Sie auf "Save"

### Option B: Über SQL

1. Gehen Sie zum SQL Editor
2. Führen Sie folgende Query aus (ersetzen Sie die Werte):

```sql
-- Erst schauen Sie sich die User-ID an:
SELECT id, email FROM auth.users;

-- Dann setzen Sie ist_admin auf true:
UPDATE public.profiles 
SET ist_admin = true 
WHERE id = 'Ihre-User-UUID-hier';
```

## Schritt 8: In der App anmelden

1. Öffnen Sie die App im Browser
2. Sie sollten die Login-Seite sehen
3. Melden Sie sich mit der E-Mail und dem Passwort an, die Sie in Schritt 7 erstellt haben
4. Sie sollten jetzt das Dashboard sehen
5. Als Admin haben Sie Zugriff auf den "Verwaltung"-Tab

## Nächste Schritte

### Gruppen erstellen

1. Klicken Sie auf den "Verwaltung"-Tab
2. Wählen Sie "Gruppen"
3. Klicken Sie auf das "+" Symbol
4. Geben Sie einen Gruppennamen ein (z.B. "Familie Müller")
5. Klicken Sie auf "Erstellen"

### Weitere Benutzer erstellen

1. Klicken Sie auf den "Verwaltung"-Tab
2. Sie sind bereits auf "Fahrer"
3. Klicken Sie auf das "+" Symbol
4. Füllen Sie das Formular aus:
   - Vorname
   - Name
   - E-Mail
   - Passwort (mindestens 6 Zeichen)
   - Gruppe auswählen
   - Administrator (optional)
5. Klicken Sie auf "Registrieren"

### Buchung erstellen

1. Klicken Sie auf den "Buchungen"-Tab
2. Klicken Sie auf das "+" Symbol
3. Wählen Sie Datum und Uhrzeit
4. Wählen Sie eine Gruppe
5. Optional: Fügen Sie einen Kommentar hinzu
6. Klicken Sie auf "Buchung erstellen"

### Fahrt erfassen

1. Klicken Sie auf den "Fahrten"-Tab
2. Klicken Sie auf das "+" Symbol
3. Geben Sie den Start-Kilometerstand ein (wird automatisch vorgeschlagen)
4. Geben Sie den End-Kilometerstand ein
5. Wählen Sie das Datum
6. Klicken Sie auf "Fahrt erstellen"

## Für mobile Apps (iOS/Android)

### iOS

1. Stellen Sie sicher, dass Xcode installiert ist
2. Führen Sie aus:
```bash
npm run build
npx cap sync
npx cap open ios
```
3. In Xcode: Wählen Sie ein Zielgerät und klicken Sie auf "Run"

### Android

1. Stellen Sie sicher, dass Android Studio installiert ist
2. Führen Sie aus:
```bash
npm run build
npx cap sync
npx cap open android
```
3. In Android Studio: Wählen Sie einen Emulator und klicken Sie auf "Run"

## Häufige Probleme

### "Supabase URL oder Anon Key fehlt"

- Überprüfen Sie, dass die `.env` Datei im richtigen Verzeichnis liegt
- Stellen Sie sicher, dass die Werte korrekt sind (keine Leerzeichen am Anfang/Ende)
- Starten Sie den Dev-Server neu: Stoppen Sie `npm run dev` und starten Sie es erneut

### "Failed to fetch" beim Anmelden

- Überprüfen Sie, dass das Datenbank-Schema korrekt ausgeführt wurde
- Gehen Sie zu Supabase > Table Editor und prüfen Sie, ob alle Tabellen vorhanden sind
- Überprüfen Sie, dass RLS aktiviert ist (Tabelle auswählen > RLS ist enabled)

### Kann keine Daten sehen

- Überprüfen Sie, dass Sie als Admin angemeldet sind
- Gehen Sie zu Supabase > Table Editor > profiles und überprüfen Sie `ist_admin`
- Erstellen Sie einige Testdaten direkt in Supabase

### Build-Fehler

- Löschen Sie `node_modules` und führen Sie `npm install` erneut aus
- Stellen Sie sicher, dass Sie Node.js v18 oder höher verwenden: `node --version`
- Löschen Sie den Build-Cache: `rm -rf dist` und bauen Sie erneut

## Unterstützung

Bei weiteren Fragen:
1. Überprüfen Sie die `README.md` für detailliertere Informationen
2. Schauen Sie sich die Supabase-Dokumentation an: [docs.supabase.com](https://docs.supabase.com)
3. Schauen Sie sich die Ionic-Dokumentation an: [ionicframework.com/docs](https://ionicframework.com/docs)

