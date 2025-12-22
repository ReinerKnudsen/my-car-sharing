# Features-Dokumentation

## 📋 Übersicht

Diese Dokumentation erklärt die wichtigsten Features der App und wie sie implementiert sind.

---

## 🚗 Gemeinsame Fahrtaufzeichnung

### Problem

Mehrere Fahrer nutzen **ein Auto**. Wenn Fahrer 1 vergisst, seine Aufzeichnung zu beenden, kann Fahrer 2 nicht starten.

### Lösung

**Automatisches Beenden fremder Aufzeichnungen**

### Wie funktioniert es?

#### 1. Datenbank-Tabelle `active_trips`

```sql
CREATE TABLE active_trips (
  id UUID PRIMARY KEY,
  fahrer_id UUID NOT NULL,
  gruppe_id UUID NOT NULL,
  start_kilometer INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT unique_active_trip_per_group UNIQUE (gruppe_id)
);
```

**Wichtig**:

- `UNIQUE (gruppe_id)` verhindert mehrere Aufzeichnungen pro Gruppe
- Aber: Ihr habt mehrere Gruppen, ein Auto → gruppenübergreifend laden!

#### 2. Service-Funktion `getAny()`

```typescript
async getAny(): Promise<ActiveTrip | null> {
  const { data, error } = await supabase
    .from('active_trips')
    .select('*, fahrer:profiles(*, gruppe:groups(*))')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}
```

**Wichtig**: Keine Gruppen-Filter → lädt **jede** aktive Fahrt.

#### 3. TripControl Komponente

**Beim Öffnen der App:**

```typescript
useEffect(() => {
  loadActiveTrip(); // Lädt aktive Fahrt
}, []);

const loadActiveTrip = async () => {
  const data = await activeTripsService.getAny();
  setDbActiveTrip(data);
};
```

**Anzeige:**

```typescript
const isForeignTrip = dbActiveTrip && dbActiveTrip.fahrer_id !== profileId;

// Farbe basierend auf Status
<IonCard style={{
  background: isForeignTrip ? '#ff9800' : isOwnTrip ? '#ffc409' : '#8ab21d'
}}>
```

- **Grün** (#8ab21d): Keine Aufzeichnung
- **Gelb** (#ffc409): Eigene Aufzeichnung
- **Orange** (#ff9800): Fremde Aufzeichnung

**Beim Start:**

```typescript
const confirmStartTrip = async () => {
  // 1. Lade aktuelle Fahrt aus DB
  const currentActiveTrip = await activeTripsService.getAny();

  // 2. Wenn fremde Fahrt läuft, beende sie
  if (currentActiveTrip && currentActiveTrip.fahrer_id !== profileId) {
    await tripsService.create({
      start_kilometer: currentActiveTrip.start_kilometer,
      end_kilometer: inputKm,
      fahrer_id: currentActiveTrip.fahrer_id,
      kommentar: '✓ Automatisch beendet',
      // ...
    });
    await activeTripsService.delete(currentActiveTrip.id);
  }

  // 3. Starte neue Fahrt
  await activeTripsService.create({
    fahrer_id: profileId,
    gruppe_id: gruppeId,
    start_kilometer: inputKm,
    // ...
  });
};
```

### Ablauf-Diagramm

```
Fahrer 1 startet Aufzeichnung
         ↓
    [active_trips]
    fahrer_id: User1
    start_km: 45000
         ↓
Fahrer 2 öffnet App
         ↓
    Sieht orange Karte:
    "Fahrer 1 zeichnet auf"
         ↓
Fahrer 2 startet neue Fahrt
         ↓
    System beendet Fahrt 1:
    trips: 45000 → 45500 (Fahrer 1)
         ↓
    System löscht active_trips
         ↓
    System erstellt neue active_trips:
    fahrer_id: User2
    start_km: 45500
         ↓
    Fertig!
```

---

## 📝 Nachgetragene Fahrten

### Problem

Kilometerstand hat sich erhöht, aber keine Fahrt wurde aufgezeichnet.

### Lösung

**Automatische Erstellung fehlender Fahrten**

### Implementierung

#### 1. Nullable `fahrer_id`

```typescript
interface Trip {
  fahrer_id: string | null; // Kann null sein!
  // ...
}
```

#### 2. Beim Start prüfen

```typescript
const confirmStartTrip = async () => {
  const inputKm = parseInt(startKilometerInput);

  // Wenn aktueller Stand > letzter Stand
  if (inputKm > lastKilometer && !currentActiveTrip) {
    // Erstelle fehlende Fahrt
    await tripsService.create({
      start_kilometer: lastKilometer,
      end_kilometer: inputKm,
      fahrer_id: null, // Unbekannter Fahrer
      kommentar: '⚠️ Nachgetragen - Fahrer unbekannt',
      // ...
    });
  }
};
```

#### 3. Visuelle Markierung

```typescript
const isUnclaimed = trip.fahrer_id === null;

<IonCard style={{
  background: isUnclaimed ? '#fff3e0' : 'white'
}}>
  <IonCardContent>
    {isUnclaimed ? (
      <IonText color="warning">⚠️ Unbekannter Fahrer</IonText>
    ) : (
      <IonText>{trip.fahrer?.vorname}</IonText>
    )}
  </IonCardContent>
</IonCard>
```

#### 4. Beanspruchen-Funktion

```typescript
const handleClaim = async () => {
  await tripsService.update(trip.id, {
    fahrer_id: currentUserId,
    kommentar: '✓ Beansprucht'
  });
  await refreshTrips();
};

<IonButton onClick={handleClaim}>
  Fahrt beanspruchen
</IonButton>
```

---

## 📅 Buchungssystem

### Zweck

Fahrzeug für bestimmte Zeiträume reservieren.

### Datenmodell

```typescript
interface Booking {
  id: string;
  von: string; // ISO DateTime
  bis: string; // ISO DateTime
  zweck: string; // Grund der Buchung
  fahrer_id: string;
  gruppe_id: string;
}
```

### Features

#### 1. Buchung erstellen

```typescript
const createBooking = async () => {
  await bookingsService.create({
    von: '2025-12-22T10:00:00',
    bis: '2025-12-22T14:00:00',
    zweck: 'Einkaufen',
    fahrer_id: profileId,
    gruppe_id: profile.gruppe_id,
  });
};
```

#### 2. Überschneidungs-Prüfung

```typescript
const checkOverlap = (newBooking: Booking, existingBookings: Booking[]) => {
  return existingBookings.some((booking) => {
    const newStart = new Date(newBooking.von);
    const newEnd = new Date(newBooking.bis);
    const existingStart = new Date(booking.von);
    const existingEnd = new Date(booking.bis);

    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });
};
```

#### 3. Anzeige

```typescript
<IonCard>
  <IonCardContent>
    <IonText>
      {format(new Date(booking.von), 'dd.MM.yyyy HH:mm')} -
      {format(new Date(booking.bis), 'HH:mm')}
    </IonText>
    <IonText>{booking.zweck}</IonText>
    <IonText>{booking.fahrer?.vorname}</IonText>
  </IonCardContent>
</IonCard>
```

---

## 💰 Kostenverwaltung

### Automatische Berechnung

```typescript
const calculateCosts = (trip: Trip, kostenProKm: number) => {
  const distance = trip.end_kilometer - trip.start_kilometer;
  return distance * kostenProKm;
};
```

### Kosten pro Kilometer

Gespeichert in `settings` Tabelle:

```sql
INSERT INTO settings (key, value)
VALUES ('kosten_pro_km', '0.30');
```

Geladen in `DataContext`:

```typescript
const loadSettings = async () => {
  const settings = await settingsService.getAll();
  const kostenProKmSetting = settings.find((s) => s.key === 'kosten_pro_km');
  setKostenProKm(parseFloat(kostenProKmSetting?.value || '0.30'));
};
```

### Gruppenkosten

Berechnung in `DataContext`:

```typescript
const calculateGroupCosts = (trips: Trip[]) => {
  const total_trips = trips.length;
  const total_kilometers = trips.reduce((sum, t) => sum + (t.end_kilometer - t.start_kilometer), 0);
  const total_costs = trips.reduce((sum, t) => sum + (t.kosten || 0), 0);

  return { total_trips, total_kilometers, total_costs };
};
```

### Fahrerkosten

```typescript
const calculateDriverCosts = (trips: Trip[]) => {
  const byDriver = trips.reduce(
    (acc, trip) => {
      if (!trip.fahrer_id) return acc;

      if (!acc[trip.fahrer_id]) {
        acc[trip.fahrer_id] = {
          fahrer_id: trip.fahrer_id,
          fahrer_name: `${trip.fahrer?.vorname} ${trip.fahrer?.name}`,
          trip_count: 0,
          total_kilometers: 0,
          total_costs: 0,
        };
      }

      acc[trip.fahrer_id].trip_count++;
      acc[trip.fahrer_id].total_kilometers += trip.end_kilometer - trip.start_kilometer;
      acc[trip.fahrer_id].total_costs += trip.kosten || 0;

      return acc;
    },
    {} as Record<string, DriverCosts>
  );

  return Object.values(byDriver);
};
```

---

## 📄 Belegverwaltung

### Zweck

Upload von Tankbelegen, Reparaturrechnungen etc.

### Datenmodell

```typescript
interface Receipt {
  id: string;
  datum: string;
  betrag: number;
  beschreibung: string;
  receipt_type_id: string;
  fahrer_id: string;
  gruppe_id: string;
  file_path: string | null; // Supabase Storage Path
}
```

### File Upload

```typescript
const uploadReceipt = async (file: File) => {
  // 1. Upload zu Supabase Storage
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('receipts').upload(fileName, file);

  if (error) throw error;

  // 2. Erstelle Beleg-Eintrag
  await receiptsService.create({
    datum: new Date().toISOString(),
    betrag: amount,
    beschreibung: description,
    receipt_type_id: typeId,
    fahrer_id: profileId,
    gruppe_id: gruppeId,
    file_path: data.path,
  });
};
```

### File Download

```typescript
const downloadReceipt = async (filePath: string) => {
  const { data, error } = await supabase.storage.from('receipts').download(filePath);

  if (error) throw error;

  // Erstelle Download-Link
  const url = URL.createObjectURL(data);
  window.open(url);
};
```

---

## 👥 Gruppenverwaltung

### Einladungscodes

```typescript
interface InvitationCode {
  id: string;
  code: string; // Eindeutiger Code
  gruppe_id: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
}
```

### Code generieren

```typescript
const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const createInvitationCode = async () => {
  await invitationCodesService.create({
    code: generateCode(),
    gruppe_id: profile.gruppe_id,
    created_by: profile.id,
    expires_at: null,
    max_uses: null,
    is_active: true,
  });
};
```

### Code einlösen

```typescript
const redeemCode = async (code: string) => {
  // 1. Finde Code
  const invitation = await invitationCodesService.getByCode(code);

  if (!invitation || !invitation.is_active) {
    throw new Error('Ungültiger Code');
  }

  // 2. Prüfe Limits
  if (invitation.max_uses && invitation.uses_count >= invitation.max_uses) {
    throw new Error('Code bereits vollständig genutzt');
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    throw new Error('Code abgelaufen');
  }

  // 3. Füge User zur Gruppe hinzu
  await profilesService.update(profile.id, {
    gruppe_id: invitation.gruppe_id,
  });

  // 4. Erhöhe Nutzungszähler
  await invitationCodesService.incrementUses(invitation.id);
};
```

---

## 🔐 Admin-Funktionen

### Admin-Check

```typescript
const isAdmin = profile?.ist_admin === true;
const isGroupAdmin = profile?.ist_gruppen_admin === true;
```

### Admin-Panel

```typescript
{isAdmin && (
  <IonCard>
    <IonCardHeader>
      <IonCardTitle>Admin-Bereich</IonCardTitle>
    </IonCardHeader>
    <IonCardContent>
      <IonButton routerLink="/admin/users">
        Benutzer verwalten
      </IonButton>
      <IonButton routerLink="/admin/groups">
        Gruppen verwalten
      </IonButton>
      <IonButton routerLink="/admin/settings">
        Einstellungen
      </IonButton>
    </IonCardContent>
  </IonCard>
)}
```

### Benutzer sperren

```typescript
const blockUser = async (userId: string) => {
  await profilesService.update(userId, {
    ist_gesperrt: true,
  });
};

// In AuthContext prüfen
if (profile?.ist_gesperrt) {
  await supabase.auth.signOut();
  navigate('/login?blocked=true');
}
```

---

## 📱 Pull-to-Refresh

### Implementierung

```typescript
const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
  await refreshAll();
  event.detail.complete();  // Beende Animation
};

<IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
  <IonRefresherContent />
</IonRefresher>
```

---

## 🎨 Loading States

### Skeleton Screens

```typescript
{loading ? (
  <DashboardSkeleton />
) : (
  <div>
    {/* Echter Content */}
  </div>
)}
```

### Spinner

```typescript
{loading && <IonSpinner />}
```

---

## 🔔 Notifications (Toasts)

### Verwendung

```typescript
const [presentToast] = useIonToast();

const showSuccess = () => {
  presentToast({
    message: 'Erfolgreich gespeichert!',
    duration: 2000,
    color: 'success',
    position: 'bottom',
  });
};

const showError = (error: string) => {
  presentToast({
    message: error,
    duration: 3000,
    color: 'danger',
    position: 'bottom',
  });
};
```

---

## 🎯 Best Practices

### 1. Immer refreshen nach Änderungen

```typescript
await tripsService.create(newTrip);
await refreshTrips(); // ← Wichtig!
```

### 2. Loading States zeigen

```typescript
const [saving, setSaving] = useState(false);

const handleSave = async () => {
  setSaving(true);
  try {
    await save();
  } finally {
    setSaving(false);
  }
};
```

### 3. Fehlerbehandlung

```typescript
try {
  await operation();
  showSuccess();
} catch (error) {
  showError(error.message);
}
```

### 4. Bestätigungsdialoge

```typescript
const [showAlert, setShowAlert] = useState(false);

<IonAlert
  isOpen={showAlert}
  onDidDismiss={() => setShowAlert(false)}
  header="Löschen?"
  message="Wirklich löschen?"
  buttons={[
    { text: 'Abbrechen', role: 'cancel' },
    { text: 'Löschen', handler: handleDelete }
  ]}
/>
```

---

**Nächster Schritt**: Lies `DATABASE.md` um das Datenbankschema zu verstehen.
