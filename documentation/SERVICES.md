# Services-Dokumentation

## 📋 Übersicht

Services sind die **Schnittstelle zur Datenbank**. Sie kapseln alle Datenbank-Operationen und bieten eine saubere API für Komponenten.

**Vorteile**:

- Zentrale Stelle für Datenbank-Logik
- Wiederverwendbar
- Einfach zu testen
- Änderungen nur an einer Stelle nötig

---

## 🗄️ Supabase Client (`supabase.ts`)

### Was ist Supabase?

Supabase ist ein **Backend-as-a-Service** (wie Firebase):

- PostgreSQL Datenbank
- Authentifizierung
- File Storage
- Realtime Subscriptions
- Row Level Security (RLS)

### Setup

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

**Wichtig**:

- URL und Key kommen aus `.env` Datei
- `ANON_KEY` ist öffentlich (RLS schützt Daten)

---

## 📊 Database Service (`database.ts`)

Alle Datenbank-Operationen sind in Services organisiert:

```typescript
export const tripsService = {
  /* ... */
};
export const bookingsService = {
  /* ... */
};
export const activeTripsService = {
  /* ... */
};
// etc.
```

---

## 🚗 Trips Service

### `getAll()`

**Zweck**: Lädt alle Fahrten der Gruppe.

```typescript
async getAll(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*, fahrer:profiles(*, gruppe:groups(*))')
    .order('datum', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
```

**Erklärung**:

1. `from('trips')` - Wähle Tabelle
2. `select('*')` - Wähle alle Spalten
3. `fahrer:profiles(...)` - **Join** mit profiles Tabelle
4. `order(...)` - Sortiere nach Datum (neueste zuerst)
5. `if (error) throw error` - Fehlerbehandlung
6. `return data || []` - Gib Daten zurück (oder leeres Array)

**RLS**: User sieht nur Fahrten seiner Gruppe (automatisch gefiltert).

---

### `getById(id: string)`

**Zweck**: Lädt eine einzelne Fahrt.

```typescript
async getById(id: string): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*, fahrer:profiles(*, gruppe:groups(*))')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
```

**Neu**:

- `.eq('id', id)` - Filter: WHERE id = ?
- `.single()` - Erwarte genau 1 Ergebnis

---

### `create(trip: InsertTrip)`

**Zweck**: Erstellt neue Fahrt.

```typescript
async create(trip: InsertTrip): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert(trip)
    .select('*, fahrer:profiles(*, gruppe:groups(*))')
    .single();

  if (error) throw error;
  return data;
}
```

**Erklärung**:

1. `.insert(trip)` - Füge Daten ein
2. `.select(...)` - Gib eingefügte Daten zurück (mit Joins)
3. `.single()` - Erwarte 1 Ergebnis

**Beispiel-Aufruf**:

```typescript
const newTrip = await tripsService.create({
  start_kilometer: 45000,
  end_kilometer: 45100,
  datum: '2025-12-22',
  fahrer_id: 'user-id',
  kosten: 30.0,
  kommentar: null,
});
```

---

### `update(id: string, updates: UpdateTrip)`

**Zweck**: Aktualisiert Fahrt.

```typescript
async update(id: string, updates: UpdateTrip): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', id)
    .select('*, fahrer:profiles(*, gruppe:groups(*))')
    .single();

  if (error) throw error;
  return data;
}
```

**Beispiel**:

```typescript
// Fahrt beanspruchen
await tripsService.update(tripId, {
  fahrer_id: currentUserId,
  kommentar: '✓ Beansprucht',
});
```

---

### `delete(id: string)`

**Zweck**: Löscht Fahrt.

```typescript
async delete(id: string): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

---

## 📅 Bookings Service

Gleiche Struktur wie Trips Service:

```typescript
export const bookingsService = {
  async getAll(): Promise<Booking[]> {
    /* ... */
  },
  async getById(id: string): Promise<Booking | null> {
    /* ... */
  },
  async create(booking: InsertBooking): Promise<Booking> {
    /* ... */
  },
  async update(id: string, updates: UpdateBooking): Promise<Booking> {
    /* ... */
  },
  async delete(id: string): Promise<void> {
    /* ... */
  },
};
```

**Besonderheit**: Bookings haben Zeitbereich (von/bis).

---

## 🚦 Active Trips Service

### Zweck

Verwaltet **laufende Fahrtaufzeichnungen** in der Datenbank.

**Warum?**

- Geräteübergreifende Synchronisation
- Andere Fahrer sehen laufende Aufzeichnungen
- Automatisches Beenden beim neuen Start

---

### `getAny()`

**Zweck**: Lädt **irgendeine** aktive Fahrt (gruppenübergreifend).

```typescript
async getAny(): Promise<ActiveTrip | null> {
  const { data, error } = await supabase
    .from('active_trips')
    .select('*, fahrer:profiles(*, gruppe:groups(*))')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
```

**Wichtig**:

- `.limit(1)` - Nur 1 Ergebnis
- `.maybeSingle()` - Kann auch 0 Ergebnisse sein (kein Fehler)
- Keine Gruppen-Filter → **alle Gruppen**

**Warum gruppenübergreifend?**
Ihr habt nur **ein Auto** für alle Gruppen. Jeder muss sehen, wenn jemand aufzeichnet.

---

### `create(activeTrip: InsertActiveTrip)`

**Zweck**: Startet neue Aufzeichnung.

```typescript
async create(activeTrip: InsertActiveTrip): Promise<ActiveTrip> {
  const { data, error } = await supabase
    .from('active_trips')
    .insert(activeTrip)
    .select('*, fahrer:profiles(*, gruppe:groups(*))')
    .single();

  if (error) throw error;
  return data;
}
```

**Beispiel**:

```typescript
await activeTripsService.create({
  fahrer_id: 'user-id',
  gruppe_id: 'group-id',
  start_kilometer: 45000,
  started_at: new Date().toISOString(),
});
```

---

### `delete(id: string)`

**Zweck**: Beendet Aufzeichnung.

```typescript
async delete(id: string): Promise<void> {
  const { error } = await supabase
    .from('active_trips')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

**Wann aufgerufen?**

- Beim Beenden der eigenen Fahrt
- Beim automatischen Beenden fremder Fahrten

---

## 👥 Profiles Service

```typescript
export const profilesService = {
  async getAll(): Promise<Profile[]> {
    /* ... */
  },
  async getById(id: string): Promise<Profile | null> {
    /* ... */
  },
  async update(id: string, updates: UpdateProfile): Promise<Profile> {
    /* ... */
  },
};
```

**Besonderheit**: Profile werden meist über `AuthContext` geladen.

---

## 👥 Groups Service

```typescript
export const groupsService = {
  async getAll(): Promise<Group[]> {
    /* ... */
  },
  async getById(id: string): Promise<Group | null> {
    /* ... */
  },
  async create(group: InsertGroup): Promise<Group> {
    /* ... */
  },
  async update(id: string, updates: UpdateGroup): Promise<Group> {
    /* ... */
  },
  async delete(id: string): Promise<void> {
    /* ... */
  },
};
```

---

## 🔐 Row Level Security (RLS)

### Was ist RLS?

**Row Level Security** = Datenschutz auf Zeilen-Ebene.

**Beispiel**:

```sql
-- Policy: User sieht nur Fahrten seiner Gruppe
CREATE POLICY "Users can view trips in their group"
ON trips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.gruppe_id = trips.gruppe_id
  )
);
```

**Bedeutung**:

- User kann nur Zeilen sehen, wo `gruppe_id` übereinstimmt
- Automatisch von Supabase geprüft
- Kein Code in der App nötig

---

### RLS Policies in der App

#### Trips

- **SELECT**: Nur Fahrten der eigenen Gruppe
- **INSERT**: Nur für eigene Gruppe
- **UPDATE**: Nur Fahrten der eigenen Gruppe
- **DELETE**: Nur Fahrten der eigenen Gruppe

#### Active Trips

- **SELECT**: **ALLE** authentifizierten User (gruppenübergreifend)
- **INSERT**: Nur für eigene Gruppe
- **DELETE**: **ALLE** authentifizierten User (gruppenübergreifend)

**Warum unterschiedlich?**

- Trips: Privat pro Gruppe
- Active Trips: Öffentlich (ein Auto für alle)

---

## 🔄 Async/Await

Alle Service-Funktionen sind **asynchron**:

```typescript
// ❌ Falsch
const trips = tripsService.getAll(); // Promise, nicht Daten!

// ✅ Richtig
const trips = await tripsService.getAll(); // Warte auf Daten
```

**Regel**: Immer `await` verwenden bei Service-Aufrufen.

---

## 🎯 Error Handling

```typescript
try {
  const trips = await tripsService.getAll();
  // Erfolg
} catch (error) {
  console.error('Fehler:', error);
  // Fehlerbehandlung
}
```

**In der App**:

- Fehler werden als Toast angezeigt
- User bekommt Feedback

---

## 📝 TypeScript Types

### Insert Types

```typescript
// Trip ohne id und created_at (wird von DB generiert)
type InsertTrip = Omit<Trip, 'id' | 'created_at' | 'fahrer'>;
```

**Verwendung**:

```typescript
const newTrip: InsertTrip = {
  start_kilometer: 45000,
  end_kilometer: 45100,
  datum: '2025-12-22',
  fahrer_id: 'user-id',
  kosten: 30.0,
  kommentar: null,
};
```

### Update Types

```typescript
// Alle Felder optional
type UpdateTrip = Partial<InsertTrip>;
```

**Verwendung**:

```typescript
const updates: UpdateTrip = {
  kommentar: 'Geändert', // Nur kommentar ändern
};
```

---

## 🔍 Joins

Supabase unterstützt **Joins** über Foreign Keys:

```typescript
.select('*, fahrer:profiles(*, gruppe:groups(*))')
```

**Bedeutung**:

1. `*` - Alle Spalten von trips
2. `fahrer:profiles(*)` - Join mit profiles über fahrer_id
3. `gruppe:groups(*)` - Nested join mit groups

**Ergebnis**:

```typescript
{
  id: 'trip-id',
  start_kilometer: 45000,
  fahrer: {
    id: 'user-id',
    vorname: 'Max',
    name: 'Mustermann',
    gruppe: {
      id: 'group-id',
      bezeichnung: 'Familie'
    }
  }
}
```

---

## 🎨 Best Practices

### 1. Immer try/catch

```typescript
try {
  await tripsService.create(trip);
} catch (error) {
  // Fehlerbehandlung
}
```

### 2. Loading States

```typescript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await tripsService.getAll();
    setTrips(data);
  } finally {
    setLoading(false); // Immer ausführen
  }
};
```

### 3. Refresh nach Änderungen

```typescript
await tripsService.create(newTrip);
await refreshAll(); // Daten neu laden
```

---

## 🚀 Performance-Tipps

### 1. Nur nötige Daten laden

```typescript
// ❌ Alle Spalten
.select('*')

// ✅ Nur benötigte
.select('id, datum, kosten')
```

### 2. Limit verwenden

```typescript
.select('*')
.limit(10)  // Nur 10 Ergebnisse
```

### 3. Caching in Context

Daten werden in `DataContext` gecacht:

```typescript
// Einmal laden
const { trips } = useData();

// Mehrfach verwenden (kein erneuter API-Call)
```

---

## 📚 Weiterführende Konzepte

### Realtime Subscriptions

Supabase kann Änderungen in Echtzeit pushen:

```typescript
const subscription = supabase
  .channel('trips')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, (payload) => {
    console.log('Änderung:', payload);
  })
  .subscribe();
```

**Aktuell nicht verwendet**, aber möglich für Live-Updates.

---

## 🔍 Debugging

```typescript
// Supabase Query debuggen
const { data, error } = await supabase.from('trips').select('*');

console.log('Data:', data);
console.log('Error:', error);
```

**Supabase Dashboard**:

- Table Editor: Daten direkt ansehen
- SQL Editor: Queries testen
- Logs: Fehler nachvollziehen

---

**Nächster Schritt**: Lies `CONTEXTS.md` um zu verstehen, wie Daten in der App verwaltet werden.
