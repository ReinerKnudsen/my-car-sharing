# Datenbank-Dokumentation

## 📋 Übersicht

Die App verwendet **PostgreSQL** über Supabase. Die Datenbank ist mit **Row Level Security (RLS)** gesichert.

---

## 🗄️ Tabellen-Schema

### `profiles`

**Zweck**: Erweiterte User-Informationen (zusätzlich zu Supabase Auth).

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  vorname TEXT NOT NULL,
  name TEXT NOT NULL,
  gruppe_id UUID REFERENCES groups(id),
  ist_admin BOOLEAN DEFAULT FALSE,
  ist_gruppen_admin BOOLEAN DEFAULT FALSE,
  ist_gesperrt BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Wichtige Felder**:

- `id`: Gleiche ID wie Supabase Auth User
- `gruppe_id`: Zugehörigkeit zu einer Gruppe
- `ist_admin`: Globaler Admin
- `ist_gruppen_admin`: Admin der eigenen Gruppe
- `ist_gesperrt`: Gesperrter User (kann sich nicht einloggen)

**Beziehungen**:

- → `auth.users` (1:1)
- → `groups` (N:1)

---

### `groups`

**Zweck**: Organisationseinheiten (z.B. Familien, WGs).

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bezeichnung TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Beispiel-Daten**:

```sql
INSERT INTO groups (bezeichnung) VALUES
  ('Familie Müller'),
  ('WG Hauptstraße'),
  ('Freundeskreis');
```

---

### `trips`

**Zweck**: Gespeicherte Fahrten.

```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_kilometer INTEGER NOT NULL,
  end_kilometer INTEGER NOT NULL,
  datum DATE NOT NULL,
  fahrer_id UUID REFERENCES profiles(id),  -- Kann NULL sein!
  kommentar TEXT,
  kosten DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Wichtige Felder**:

- `fahrer_id`: NULL = nachgetragene Fahrt (unbekannter Fahrer)
- `datum`: Datum der Fahrt (nicht Erstellungsdatum)
- `kosten`: Automatisch berechnet (Distanz × Kosten/km)

**Beziehungen**:

- → `profiles` (N:1, optional)

**Constraints**:

```sql
ALTER TABLE trips
  ADD CONSTRAINT check_kilometers
  CHECK (end_kilometer > start_kilometer);
```

---

### `active_trips`

**Zweck**: Laufende Fahrtaufzeichnungen.

```sql
CREATE TABLE active_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fahrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gruppe_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  start_kilometer INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_active_trip_per_group UNIQUE (gruppe_id)
);
```

**Wichtige Felder**:

- `started_at`: Wann wurde Aufzeichnung gestartet
- `UNIQUE (gruppe_id)`: Pro Gruppe nur eine aktive Fahrt

**Beziehungen**:

- → `profiles` (N:1)
- → `groups` (N:1)

**Besonderheit**:

- Wird automatisch gelöscht wenn Fahrt beendet wird
- `ON DELETE CASCADE`: Wird gelöscht wenn User/Gruppe gelöscht wird

---

### `bookings`

**Zweck**: Fahrzeug-Reservierungen.

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  von TIMESTAMPTZ NOT NULL,
  bis TIMESTAMPTZ NOT NULL,
  zweck TEXT NOT NULL,
  fahrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gruppe_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_booking_times CHECK (bis > von)
);
```

**Wichtige Felder**:

- `von`/`bis`: Zeitbereich der Buchung
- `zweck`: Grund der Buchung (z.B. "Einkaufen")

**Constraints**:

```sql
CHECK (bis > von)  -- Ende muss nach Start sein
```

---

### `settings`

**Zweck**: App-Einstellungen.

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);
```

**Beispiel-Daten**:

```sql
INSERT INTO settings (key, value, description) VALUES
  ('kosten_pro_km', '0.30', 'Kosten pro gefahrenem Kilometer in Euro'),
  ('app_name', 'My Car-Sharing', 'Name der App');
```

---

### `receipt_types`

**Zweck**: Kategorien für Belege.

```sql
CREATE TABLE receipt_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bezeichnung TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Beispiel-Daten**:

```sql
INSERT INTO receipt_types (bezeichnung) VALUES
  ('Tankbeleg'),
  ('Reparatur'),
  ('Versicherung'),
  ('Sonstiges');
```

---

### `receipts`

**Zweck**: Hochgeladene Belege.

```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datum DATE NOT NULL,
  betrag DECIMAL(10,2) NOT NULL,
  beschreibung TEXT,
  receipt_type_id UUID NOT NULL REFERENCES receipt_types(id),
  fahrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gruppe_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  file_path TEXT,  -- Pfad in Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Wichtige Felder**:

- `file_path`: Pfad zur Datei in Supabase Storage
- `betrag`: Betrag des Belegs

---

### `invitation_codes`

**Zweck**: Einladungscodes für Gruppen.

```sql
CREATE TABLE invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  gruppe_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Wichtige Felder**:

- `code`: Eindeutiger Code (z.B. "ABC123")
- `expires_at`: Ablaufdatum (optional)
- `max_uses`: Maximale Nutzungen (optional)
- `uses_count`: Wie oft wurde Code genutzt

---

## 🔐 Row Level Security (RLS)

### Was ist RLS?

**Row Level Security** = Datenschutz auf Zeilen-Ebene. Jede Zeile kann individuell geschützt werden.

**Vorteil**:

- Sicherheit in der Datenbank (nicht nur im Code)
- User können nur ihre Daten sehen
- Automatisch von Supabase geprüft

---

### RLS Policies - Trips

#### SELECT (Lesen)

```sql
CREATE POLICY "Users can view trips in their group"
ON trips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.gruppe_id = (
      SELECT gruppe_id FROM profiles WHERE id = trips.fahrer_id
    )
  )
  OR trips.fahrer_id IS NULL  -- Nachgetragene Fahrten sehen alle
);
```

**Bedeutung**: User sieht nur:

- Fahrten seiner Gruppe
- Nachgetragene Fahrten (fahrer_id = NULL)

#### INSERT (Erstellen)

```sql
CREATE POLICY "Users can insert trips for their group"
ON trips FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (
      profiles.gruppe_id = (
        SELECT gruppe_id FROM profiles WHERE id = NEW.fahrer_id
      )
      OR NEW.fahrer_id IS NULL
    )
  )
);
```

**Bedeutung**: User kann erstellen:

- Fahrten für User seiner Gruppe
- Nachgetragene Fahrten (fahrer_id = NULL)

#### UPDATE (Ändern)

```sql
CREATE POLICY "Users can update trips in their group"
ON trips FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.gruppe_id = (
      SELECT gruppe_id FROM profiles WHERE id = trips.fahrer_id
    )
  )
  OR trips.fahrer_id IS NULL
);
```

#### DELETE (Löschen)

```sql
CREATE POLICY "Users can delete their own trips"
ON trips FOR DELETE
USING (
  fahrer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.ist_gruppen_admin = TRUE
  )
);
```

**Bedeutung**: User kann löschen:

- Eigene Fahrten
- Gruppen-Admin kann alle Fahrten seiner Gruppe löschen

---

### RLS Policies - Active Trips

#### SELECT (Lesen)

```sql
CREATE POLICY "Authenticated users can view all active trips"
ON active_trips FOR SELECT
USING (auth.uid() IS NOT NULL);
```

**Wichtig**: **ALLE** authentifizierten User können aktive Fahrten sehen (gruppenübergreifend).

**Warum?** Ein Auto für alle Gruppen → jeder muss sehen, wenn jemand aufzeichnet.

#### INSERT (Erstellen)

```sql
CREATE POLICY "Users can insert active trips for their group"
ON active_trips FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.gruppe_id = NEW.gruppe_id
    AND profiles.id = NEW.fahrer_id
  )
);
```

**Bedeutung**: User kann nur für seine eigene Gruppe erstellen.

#### DELETE (Löschen)

```sql
CREATE POLICY "Authenticated users can delete all active trips"
ON active_trips FOR DELETE
USING (auth.uid() IS NOT NULL);
```

**Wichtig**: **ALLE** authentifizierten User können aktive Fahrten löschen.

**Warum?** Jeder muss fremde Aufzeichnungen beenden können.

---

### RLS Policies - Bookings

```sql
-- SELECT: Nur Buchungen der eigenen Gruppe
CREATE POLICY "Users can view bookings in their group"
ON bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.gruppe_id = bookings.gruppe_id
  )
);

-- INSERT: Nur für eigene Gruppe
CREATE POLICY "Users can insert bookings for their group"
ON bookings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.gruppe_id = NEW.gruppe_id
  )
);

-- DELETE: Nur eigene Buchungen
CREATE POLICY "Users can delete their own bookings"
ON bookings FOR DELETE
USING (fahrer_id = auth.uid());
```

---

## 🔗 Beziehungen (Foreign Keys)

### ER-Diagramm

```
┌─────────────┐
│   groups    │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────┐      1        N  ┌─────────────┐
│  profiles   │◄─────────────────┤    trips    │
└──────┬──────┘                  └─────────────┘
       │ 1
       │
       │ N
┌──────▼──────┐
│  bookings   │
└─────────────┘

┌──────────────┐
│ active_trips │
└──────┬───────┘
       │ N
       │
       │ 1
┌──────▼──────┐
│  profiles   │
└─────────────┘
```

**Legende**:

- 1 = Eins
- N = Viele
- → = Foreign Key

---

## 📊 Indizes

Indizes beschleunigen Abfragen:

```sql
-- Trips
CREATE INDEX idx_trips_fahrer ON trips(fahrer_id);
CREATE INDEX idx_trips_datum ON trips(datum DESC);

-- Bookings
CREATE INDEX idx_bookings_fahrer ON bookings(fahrer_id);
CREATE INDEX idx_bookings_gruppe ON bookings(gruppe_id);
CREATE INDEX idx_bookings_von ON bookings(von);

-- Active Trips
CREATE INDEX idx_active_trips_gruppe ON active_trips(gruppe_id);
CREATE INDEX idx_active_trips_fahrer ON active_trips(fahrer_id);
```

**Warum?**

- Schnellere Suche nach fahrer_id
- Schnellere Sortierung nach Datum
- Bessere Performance bei Joins

---

## 🔄 Trigger & Functions

### Automatische Timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

**Bedeutung**: `updated_at` wird automatisch aktualisiert.

---

## 💾 Backups

Supabase macht automatisch Backups:

- **Point-in-Time Recovery**: Bis zu 7 Tage zurück
- **Daily Backups**: Automatisch gespeichert

**Manuelles Backup**:

```bash
# Über Supabase CLI
supabase db dump -f backup.sql
```

---

## 🔍 Nützliche Queries

### Alle Fahrten eines Users

```sql
SELECT * FROM trips
WHERE fahrer_id = 'user-id'
ORDER BY datum DESC;
```

### Gesamtkosten pro Gruppe

```sql
SELECT
  g.bezeichnung,
  COUNT(t.id) as fahrten,
  SUM(t.end_kilometer - t.start_kilometer) as kilometer,
  SUM(t.kosten) as kosten
FROM groups g
JOIN profiles p ON p.gruppe_id = g.id
JOIN trips t ON t.fahrer_id = p.id
GROUP BY g.id, g.bezeichnung;
```

### Aktive Buchungen

```sql
SELECT * FROM bookings
WHERE von <= NOW()
AND bis >= NOW()
ORDER BY von;
```

### Nachgetragene Fahrten

```sql
SELECT * FROM trips
WHERE fahrer_id IS NULL
ORDER BY datum DESC;
```

---

## 🛠️ Migrations

Migrations sind SQL-Dateien für Schema-Änderungen:

```sql
-- supabase-migration-nullable-fahrer.sql
ALTER TABLE trips
  ALTER COLUMN fahrer_id DROP NOT NULL;

-- Kommentar
COMMENT ON COLUMN trips.fahrer_id IS
  'Fahrer der Fahrt. NULL = nachgetragene Fahrt (unbekannter Fahrer)';
```

**Ausführen**:

1. Supabase Dashboard öffnen
2. SQL Editor
3. Migration einfügen und ausführen

---

## 📈 Performance-Tipps

### 1. Indizes verwenden

```sql
-- Langsam (ohne Index)
SELECT * FROM trips WHERE fahrer_id = 'user-id';

-- Schnell (mit Index)
CREATE INDEX idx_trips_fahrer ON trips(fahrer_id);
```

### 2. Nur nötige Spalten laden

```sql
-- ❌ Langsam
SELECT * FROM trips;

-- ✅ Schnell
SELECT id, datum, kosten FROM trips;
```

### 3. LIMIT verwenden

```sql
-- Nur letzte 10 Fahrten
SELECT * FROM trips
ORDER BY datum DESC
LIMIT 10;
```

### 4. Joins optimieren

```sql
-- ✅ Gut: Nur nötige Joins
SELECT t.*, p.vorname, p.name
FROM trips t
JOIN profiles p ON p.id = t.fahrer_id;

-- ❌ Schlecht: Unnötige Joins
SELECT t.*, p.*, g.*, s.*
FROM trips t
JOIN profiles p ON p.id = t.fahrer_id
JOIN groups g ON g.id = p.gruppe_id
JOIN settings s ON true;
```

---

## 🔐 Sicherheit

### Best Practices

1. **Immer RLS aktivieren**

```sql
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
```

2. **Policies für alle Operationen**

- SELECT, INSERT, UPDATE, DELETE

3. **Keine Secrets im Code**

```typescript
// ❌ Falsch
const key = 'secret-key-123';

// ✅ Richtig
const key = import.meta.env.VITE_SUPABASE_KEY;
```

4. **Prepared Statements** (automatisch von Supabase)

```typescript
// Sicher gegen SQL Injection
await supabase.from('trips').select('*').eq('id', userInput); // ✅ Automatisch escaped
```

---

## 📚 Weiterführende Ressourcen

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Supabase Docs**: https://supabase.com/docs/guides/database
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

**Nächster Schritt**: Lies `PAGES.md` um zu verstehen, wie Seiten aufgebaut sind.
