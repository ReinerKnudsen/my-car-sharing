# Komponenten-Dokumentation

## 📋 Übersicht

Komponenten sind wiederverwendbare UI-Bausteine. Sie nehmen **Props** (Eingaben) entgegen und geben **JSX** (UI) zurück.

---

## 🏠 Dashboard-Komponenten

### `WelcomeCard.tsx`

**Zweck**: Zeigt Benutzername und Gruppe an.

**Props**:

```typescript
interface WelcomeCardProps {
  profile: Profile; // Benutzerprofil
}
```

**Was macht sie**:

- Zeigt Vor- und Nachname des Users
- Zeigt Gruppenname (falls vorhanden)

**Beispiel**:

```tsx
<WelcomeCard profile={profile} />
```

---

### `TripControl.tsx`

**Zweck**: Steuerung der Fahrtaufzeichnung (Start/Ende).

**Props**:

```typescript
interface TripControlProps {
  activeTrip: LocalActiveTrip | null; // Laufende Fahrt
  lastKilometer: number; // Letzter KM-Stand
  kostenProKm: number; // Kosten pro Kilometer
  profileId: string; // User-ID
  gruppeId: string; // Gruppen-ID
  onTripStart: (trip) => void; // Callback beim Start
  onTripEnd: () => void; // Callback beim Ende
  onRefresh: () => void; // Callback zum Aktualisieren
}
```

**Was macht sie**:

1. **Anzeige**:
   - Grün: Keine Aufzeichnung
   - Gelb: Eigene Aufzeichnung läuft
   - Orange: Fremde Aufzeichnung läuft

2. **Start-Dialog**:
   - Eingabe des aktuellen KM-Stands
   - Prüfung auf fremde Aufzeichnungen
   - Automatisches Beenden fremder Fahrten
   - Erstellung fehlender Fahrten

3. **End-Dialog**:
   - Eingabe des End-KM-Stands
   - Berechnung der Kosten
   - Speicherung der Fahrt

**Wichtige Funktionen**:

```typescript
// Lädt aktive Fahrt aus DB (gruppenübergreifend)
const loadActiveTrip = async () => {
  const data = await activeTripsService.getAny();
  setDbActiveTrip(data);
};

// Startet neue Fahrt
const confirmStartTrip = async () => {
  // 1. Lade aktuelle DB-Fahrt
  const currentActiveTrip = await activeTripsService.getAny();

  // 2. Beende fremde Fahrt falls vorhanden
  if (currentActiveTrip && currentActiveTrip.fahrer_id !== profileId) {
    await tripsService.create({
      /* Fahrt beenden */
    });
    await activeTripsService.delete(currentActiveTrip.id);
  }

  // 3. Erstelle neue aktive Fahrt
  await activeTripsService.create({
    /* neue Fahrt */
  });
};
```

**Besonderheiten**:

- KM-Stand wird nur vorausgefüllt, wenn KEINE fremde Aufzeichnung läuft
- Dialoge sind als fixed Overlays implementiert (nicht inline)
- Verwendet LocalStorage + Datenbank für Synchronisation

---

### `RecentTrips.tsx`

**Zweck**: Zeigt die letzten 4 Fahrten an.

**Props**:

```typescript
interface RecentTripsProps {
  trips: Trip[]; // Array von Fahrten
}
```

**Was macht sie**:

- Zeigt Datum, Fahrer, Strecke, Kosten
- Markiert nachgetragene Fahrten (orange Hintergrund)
- Zeigt "⚠️ Unbekannter Fahrer" für nachgetragene Fahrten

**Code-Beispiel**:

```typescript
const isUnclaimed = trip.fahrer_id === null;

<IonCard style={{
  background: isUnclaimed ? '#fff3e0' : 'white'
}}>
  {/* Fahrt-Details */}
</IonCard>
```

---

### `UpcomingBookings.tsx`

**Zweck**: Zeigt die nächsten 4 Buchungen an.

**Props**:

```typescript
interface UpcomingBookingsProps {
  bookings: Booking[];
  onRefresh: () => void;
}
```

**Was macht sie**:

- Zeigt Datum, Uhrzeit, Fahrer
- Zeigt Zweck der Buchung
- Refresh-Button zum Aktualisieren

---

### `GroupCosts.tsx`

**Zweck**: Zeigt Gruppenstatistiken und Kosten pro Fahrer.

**Props**:

```typescript
interface GroupCostsProps {
  groupCosts: GroupCosts; // Gesamt-Statistiken
  driverCosts: DriverCosts[]; // Kosten pro Fahrer
  groupName?: string;
  currentUserId?: string;
}
```

**Was macht sie**:

1. **Statistik-Boxen** (farbig):
   - Blau: Anzahl Fahrten
   - Grün: Gesamte Kilometer
   - Orange: Gesamtkosten

2. **Fahrer-Liste**:
   - Name, Fahrten, Kilometer, Kosten
   - Eigene Zeile hervorgehoben (blau)
   - Marker "(Du)" beim eigenen Namen

**Layout**:

```
┌─────────────────────────────────┐
│ Gruppenkosten: Familie          │
├─────────────────────────────────┤
│ [Blau]  [Grün]  [Orange]        │
│   15      450      135,00 €     │
│ Fahrten   km      Gesamt        │
├─────────────────────────────────┤
│ Kosten pro Fahrer               │
│ ┌─────────────────────────────┐ │
│ │ Max (Du)         45,00 €    │ │ ← Blau
│ └─────────────────────────────┘ │
│ Anna                 30,00 €    │
│ Tom                  60,00 €    │
└─────────────────────────────────┘
```

---

### `DashboardSkeleton.tsx`

**Zweck**: Zeigt Lade-Animation während Daten geladen werden.

**Was macht sie**:

- Animierte Platzhalter für alle Dashboard-Bereiche
- Verbessert wahrgenommene Performance
- Keine Props nötig

---

## 📄 Weitere Komponenten

### `TripCard.tsx`

**Zweck**: Einzelne Fahrt-Karte mit Details.

**Props**:

```typescript
interface TripCardProps {
  trip: Trip;
  onRefresh?: () => void;
}
```

**Features**:

- Anzeige aller Fahrt-Details
- "Fahrt beanspruchen"-Button für nachgetragene Fahrten
- Bestätigungsdialog beim Beanspruchen
- Bearbeiten/Löschen-Buttons (für eigene Fahrten)

**Wichtige Logik**:

```typescript
// Prüfe ob Fahrt nachgetragen wurde
const isUnclaimed = trip.fahrer_id === null;

// Beanspruchen-Funktion
const handleClaim = async () => {
  await tripsService.update(trip.id, {
    fahrer_id: currentUserId,
    kommentar: '✓ Beansprucht',
  });
};
```

---

### `BookingCard.tsx`

**Zweck**: Einzelne Buchungs-Karte.

**Props**:

```typescript
interface BookingCardProps {
  booking: Booking;
  onRefresh?: () => void;
}
```

**Features**:

- Anzeige von Datum, Zeit, Zweck
- Löschen-Button (nur für eigene Buchungen)
- Bestätigungsdialog beim Löschen

---

## 🎨 Styling-Patterns

### Farbcodes

```typescript
// Status-Farben
const colors = {
  success: '#8ab21d', // Grün - Bereit
  warning: '#ffc409', // Gelb - Aktiv (eigene)
  danger: '#ff9800', // Orange - Warnung (fremde)
  primary: '#3880ff', // Blau - Primär
};

// Hintergrund-Farben für Statistiken
const statColors = {
  trips: '#e3f2fd', // Blau
  kilometers: '#e8f5e9', // Grün
  costs: '#fff3e0', // Orange
};
```

### Layout-Pattern

```typescript
// Flex-Layout für Karten
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px'
}}>
  <div>{/* Links */}</div>
  <div>{/* Rechts */}</div>
</div>

// Grid-Layout für Statistiken
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px'
}}>
  {/* 3 Spalten */}
</div>
```

---

## 🔄 Props vs State

### Props (von außen)

```typescript
// Props werden von Parent-Komponente übergeben
<TripControl
  activeTrip={activeTrip}  // ← Props
  lastKilometer={45230}
/>
```

### State (intern)

```typescript
// State wird in der Komponente selbst verwaltet
const [showDialog, setShowDialog] = useState(false);
const [inputValue, setInputValue] = useState('');
```

**Regel**:

- Props = Daten von außen (read-only)
- State = Daten von innen (änderbar)

---

## 🎯 Wiederverwendbarkeit

Komponenten sind wiederverwendbar:

```typescript
// Gleiche Komponente, verschiedene Daten
<TripCard trip={trip1} />
<TripCard trip={trip2} />
<TripCard trip={trip3} />
```

**Vorteil**: Code-Duplikation vermeiden, einheitliches Design.

---

## 📚 Weiterführende Konzepte

### Callbacks

Props können auch Funktionen sein:

```typescript
interface Props {
  onSave: (data: string) => void;  // Callback
}

// In der Komponente:
<IonButton onClick={() => props.onSave('data')}>
  Speichern
</IonButton>
```

### Conditional Rendering

```typescript
// Zeige nur wenn Bedingung erfüllt
{isVisible && <div>Sichtbar</div>}

// Zeige A oder B
{isActive ? <ActiveView /> : <InactiveView />}
```

### Lists & Keys

```typescript
// Array von Daten rendern
{trips.map((trip) => (
  <TripCard key={trip.id} trip={trip} />
))}
```

**Wichtig**: `key` ist notwendig für React's Performance.

---

## 🔍 Debugging-Tipps

```typescript
// Console-Logs in Komponenten
console.log('Props:', props);
console.log('State:', state);

// React DevTools verwenden
// Browser-Extension installieren
// Komponenten-Hierarchie inspizieren
```

---

**Nächster Schritt**: Lies `SERVICES.md` um zu verstehen, wie Daten geladen werden.
