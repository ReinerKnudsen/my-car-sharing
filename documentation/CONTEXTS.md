# Contexts-Dokumentation

## 📋 Übersicht

**React Context** ist ein System für **globales State Management**. Statt Props durch viele Komponenten-Ebenen zu reichen, können Daten zentral verwaltet und überall abgerufen werden.

**Problem ohne Context**:

```
App → Page → Container → Component → Child
     ↓ props  ↓ props    ↓ props     ↓ props
```

**Lösung mit Context**:

```
Context (zentral)
   ↓ useContext()
Component (direkt)
```

---

## 🔐 AuthContext

**Datei**: `src/contexts/AuthContext.tsx`

**Zweck**: Verwaltet Authentifizierung und User-Profil.

### State

```typescript
interface AuthState {
  user: AuthUser | null; // Supabase User
  profile: Profile | null; // Datenbank-Profil
  loading: boolean; // Lädt gerade?
  isAdmin: boolean; // Ist Admin?
  isGroupAdmin: boolean; // Ist Gruppen-Admin?
}
```

### Provider

```typescript
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Beim Start: Prüfe ob User eingeloggt
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
    });

    // Höre auf Auth-Änderungen
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const profile = await profilesService.getById(userId);
    setProfile(profile);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isGroupAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Wichtig**:

1. **Beim Start**: Prüfe Session
2. **Auth-Listener**: Reagiere auf Login/Logout
3. **Profile laden**: Nach Login automatisch

### Hook

```typescript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Verwendung in Komponenten

```typescript
const Dashboard: React.FC = () => {
  const { profile, isAdmin } = useAuth();

  if (!profile) {
    return <div>Nicht eingeloggt</div>;
  }

  return (
    <div>
      <h1>Hallo {profile.vorname}!</h1>
      {isAdmin && <AdminPanel />}
    </div>
  );
};
```

---

## 📊 DataContext

**Datei**: `src/contexts/DataContext.tsx`

**Zweck**: Verwaltet alle App-Daten (Trips, Bookings, Costs).

### State

```typescript
interface DataState {
  trips: Trip[];
  bookings: Booking[];
  lastKilometer: number;
  groupCosts: GroupCosts | null;
  driverCosts: DriverCosts[];
  kostenProKm: number;
  loading: boolean;
}
```

### Provider

```typescript
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  // ... weitere States

  // Lade alle Daten
  const refreshAll = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await Promise.all([
        refreshTrips(),
        refreshBookings(),
        refreshCosts(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refreshTrips = async () => {
    const data = await tripsService.getAll();
    setTrips(data);

    // Berechne letzten Kilometerstand
    if (data.length > 0) {
      const sorted = [...data].sort((a, b) =>
        b.end_kilometer - a.end_kilometer
      );
      setLastKilometer(sorted[0].end_kilometer);
    }
  };

  const refreshBookings = async () => {
    const data = await bookingsService.getAll();
    setBookings(data);
  };

  // Initial laden
  useEffect(() => {
    if (profile) {
      refreshAll();
    }
  }, [profile]);

  return (
    <DataContext.Provider value={{
      trips,
      bookings,
      lastKilometer,
      groupCosts,
      driverCosts,
      kostenProKm,
      loading,
      refreshAll,
      refreshTrips,
      refreshBookings,
      refreshDashboard,
    }}>
      {children}
    </DataContext.Provider>
  );
};
```

**Wichtig**:

1. **Abhängig von AuthContext**: Lädt nur wenn User eingeloggt
2. **Refresh-Funktionen**: Können von Komponenten aufgerufen werden
3. **Berechnungen**: lastKilometer wird automatisch berechnet

### Hook

```typescript
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
```

### Verwendung in Komponenten

```typescript
const Trips: React.FC = () => {
  const { trips, loading, refreshTrips } = useData();

  if (loading) {
    return <IonSpinner />;
  }

  return (
    <div>
      <IonButton onClick={refreshTrips}>Aktualisieren</IonButton>
      {trips.map(trip => (
        <TripCard key={trip.id} trip={trip} />
      ))}
    </div>
  );
};
```

---

## 🔄 Context-Hierarchie

```typescript
// App.tsx
<AuthProvider>
  <DataProvider>
    <IonApp>
      <IonRouterOutlet>
        <Route path="/dashboard" component={Dashboard} />
        {/* ... */}
      </IonRouterOutlet>
    </IonApp>
  </DataProvider>
</AuthProvider>
```

**Wichtig**:

- `AuthProvider` außen (wird zuerst benötigt)
- `DataProvider` innen (braucht Auth)

---

## 🎯 Wann Context verwenden?

### ✅ Gut für Context:

- User-Authentifizierung
- App-weite Daten (Trips, Bookings)
- Theme/Sprache
- Globale Settings

### ❌ Nicht für Context:

- Lokaler Component-State (z.B. Dialog offen/zu)
- Temporäre Formulardaten
- UI-State (z.B. aktiver Tab)

**Regel**: Context für Daten, die **viele Komponenten** brauchen.

---

## 🔍 Context vs Props

### Props (lokal)

```typescript
<TripCard trip={trip} onDelete={handleDelete} />
```

**Gut für**: Daten, die nur 1-2 Ebenen tief gehen.

### Context (global)

```typescript
const { trips } = useData();
```

**Gut für**: Daten, die überall gebraucht werden.

---

## ⚡ Performance

### Problem: Re-Renders

Wenn Context-State sich ändert, rendern **alle** Komponenten, die den Context nutzen.

```typescript
// ❌ Jede Änderung rendert alles neu
const { trips, bookings, costs } = useData();

// ✅ Nur nötige Daten holen
const { trips } = useData();
```

### Lösung: Memoization

```typescript
const value = useMemo(() => ({
  trips,
  bookings,
  loading,
  refreshAll,
}), [trips, bookings, loading]);

return (
  <DataContext.Provider value={value}>
    {children}
  </DataContext.Provider>
);
```

**Aktuell nicht implementiert**, aber empfohlen für große Apps.

---

## 🛠️ Refresh-Pattern

### Manueller Refresh

```typescript
const { refreshTrips } = useData();

const handleSave = async () => {
  await tripsService.create(newTrip);
  await refreshTrips(); // Daten neu laden
};
```

### Automatischer Refresh

```typescript
// In DataContext
useEffect(() => {
  if (profile) {
    refreshAll();
  }
}, [profile]); // Lädt neu wenn User sich ändert
```

### Pull-to-Refresh

```typescript
const handleRefresh = async (event: CustomEvent) => {
  await refreshAll();
  event.detail.complete();  // Beende Animation
};

<IonRefresher onIonRefresh={handleRefresh}>
  <IonRefresherContent />
</IonRefresher>
```

---

## 🔐 Auth-Flow

### 1. Login

```typescript
// Login.tsx
const handleLogin = async () => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error) {
    // AuthContext hört auf Auth-Änderung
    // → lädt automatisch Profile
    // → DataContext lädt automatisch Daten
    navigate('/dashboard');
  }
};
```

### 2. Logout

```typescript
const handleLogout = async () => {
  await supabase.auth.signOut();
  // AuthContext setzt user = null
  // DataContext löscht Daten
  navigate('/login');
};
```

### 3. Protected Routes

```typescript
const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <IonSpinner />;
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
};
```

---

## 📊 Data-Flow Beispiel

**Szenario**: User erstellt neue Fahrt

```
1. User klickt "Speichern"
   ↓
2. Component ruft tripsService.create()
   ↓
3. Supabase speichert Fahrt
   ↓
4. Component ruft refreshTrips()
   ↓
5. DataContext lädt Trips neu
   ↓
6. Alle Komponenten mit useData() re-rendern
   ↓
7. User sieht neue Fahrt
```

---

## 🎨 Best Practices

### 1. Nur nötige Daten holen

```typescript
// ❌ Alles holen
const data = useData();

// ✅ Nur benötigte
const { trips, refreshTrips } = useData();
```

### 2. Loading States prüfen

```typescript
const { trips, loading } = useData();

if (loading) {
  return <Skeleton />;
}
```

### 3. Error Handling

```typescript
const refreshAll = async () => {
  try {
    await Promise.all([...]);
  } catch (error) {
    console.error('Fehler beim Laden:', error);
    // Toast anzeigen
  }
};
```

### 4. Cleanup

```typescript
useEffect(() => {
  const subscription = supabase.auth.onAuthStateChange(...);

  return () => {
    subscription.unsubscribe();  // Cleanup!
  };
}, []);
```

---

## 🔍 Debugging

### Context-Werte loggen

```typescript
const Dashboard: React.FC = () => {
  const auth = useAuth();
  const data = useData();

  console.log('Auth:', auth);
  console.log('Data:', data);

  // ...
};
```

### React DevTools

1. Browser-Extension installieren
2. Components-Tab öffnen
3. Context-Provider finden
4. State inspizieren

---

## 🚀 Erweiterte Konzepte

### Context Composition

Mehrere Contexts kombinieren:

```typescript
const useAppData = () => {
  const auth = useAuth();
  const data = useData();

  return {
    ...auth,
    ...data,
  };
};
```

### Custom Hooks

```typescript
const useTrips = () => {
  const { trips, refreshTrips } = useData();

  const addTrip = async (trip: InsertTrip) => {
    await tripsService.create(trip);
    await refreshTrips();
  };

  return { trips, addTrip };
};
```

---

## 📝 Zusammenfassung

**AuthContext**:

- Verwaltet User & Profil
- Prüft Authentifizierung
- Lädt Profile automatisch

**DataContext**:

- Verwaltet App-Daten
- Bietet Refresh-Funktionen
- Cached Daten

**Vorteile**:

- Keine Prop-Drilling
- Zentrale Datenverwaltung
- Einfache Updates

**Nachteile**:

- Kann zu Re-Renders führen
- Komplexer als Props
- Schwerer zu debuggen

---

**Nächster Schritt**: Lies `PAGES.md` um zu verstehen, wie Seiten aufgebaut sind.
