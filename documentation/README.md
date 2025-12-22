# My Car-Sharing App - Dokumentation

## 📋 Inhaltsverzeichnis

1. [Projektübersicht](#projektübersicht)
2. [Technologie-Stack](#technologie-stack)
3. [Architektur](#architektur)
4. [Ordnerstruktur](#ordnerstruktur)
5. [Wichtige Konzepte](#wichtige-konzepte)
6. [Weitere Dokumentation](#weitere-dokumentation)

---

## 📱 Projektübersicht

**My Car-Sharing** ist eine mobile Web-App zur Verwaltung von gemeinsam genutzten Fahrzeugen. Die App ermöglicht:

- **Fahrtenverwaltung**: Aufzeichnung von Fahrten mit Start- und End-Kilometerstand
- **Buchungssystem**: Reservierung des Fahrzeugs für bestimmte Zeiträume
- **Kostenverwaltung**: Automatische Berechnung und Aufteilung der Fahrtkosten
- **Gruppenverwaltung**: Organisation mehrerer Nutzer in Gruppen
- **Belegverwaltung**: Upload und Verwaltung von Tankbelegen, Reparaturen etc.
- **Gemeinsame Fahrtaufzeichnung**: Automatisches Beenden fremder Aufzeichnungen beim Start einer neuen Fahrt

---

## 🛠️ Technologie-Stack

### Frontend

- **React 18** - UI-Framework
- **TypeScript** - Typsichere Entwicklung
- **Ionic Framework 8** - Mobile UI-Komponenten
- **React Router** - Navigation

### Backend & Datenbank

- **Supabase** - Backend-as-a-Service
  - PostgreSQL Datenbank
  - Row Level Security (RLS) für Datensicherheit
  - Authentication
  - Storage für Dateien

### Build & Development

- **Vite** - Build-Tool
- **Capacitor** - Native App-Wrapper (für iOS/Android)

---

## 🏗️ Architektur

Die App folgt einer **komponentenbasierten Architektur** mit klarer Trennung von Verantwortlichkeiten:

```
┌─────────────────────────────────────────┐
│           UI Layer (Pages)              │
│  Dashboard, Trips, Bookings, Settings   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Component Layer                     │
│  Wiederverwendbare UI-Komponenten        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Context Layer (State)               │
│  AuthContext, DataContext                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Service Layer                       │
│  database.ts, supabase.ts                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Supabase Backend                    │
│  PostgreSQL + RLS + Auth + Storage       │
└─────────────────────────────────────────┘
```

### Datenfluss

1. **User-Interaktion** → Page-Komponente
2. **Page** ruft Context-Funktion auf
3. **Context** ruft Service-Funktion auf
4. **Service** kommuniziert mit Supabase
5. **Supabase** gibt Daten zurück
6. **Context** aktualisiert State
7. **Page** re-rendert mit neuen Daten

---

## 📁 Ordnerstruktur

```
my-carsharing/
├── src/
│   ├── components/          # Wiederverwendbare UI-Komponenten
│   │   ├── dashboard/       # Dashboard-spezifische Komponenten
│   │   ├── TripCard.tsx     # Fahrt-Anzeige
│   │   ├── BookingCard.tsx  # Buchungs-Anzeige
│   │   └── ...
│   │
│   ├── contexts/            # React Context für globalen State
│   │   ├── AuthContext.tsx  # Authentifizierung & User-Daten
│   │   └── DataContext.tsx  # App-Daten (Trips, Bookings, etc.)
│   │
│   ├── pages/               # Hauptseiten der App
│   │   ├── Dashboard.tsx    # Startseite
│   │   ├── Trips.tsx        # Fahrtenübersicht
│   │   ├── Bookings.tsx     # Buchungsübersicht
│   │   ├── Settings.tsx     # Einstellungen
│   │   └── ...
│   │
│   ├── services/            # Backend-Kommunikation
│   │   ├── supabase.ts      # Supabase-Client
│   │   └── database.ts      # Datenbank-Operationen
│   │
│   ├── types/               # TypeScript-Typdefinitionen
│   │   └── index.ts         # Alle Interfaces & Types
│   │
│   ├── App.tsx              # Haupt-App-Komponente
│   └── main.tsx             # Entry Point
│
├── documentation/           # Diese Dokumentation
├── supabase/               # Supabase-Konfiguration
└── public/                 # Statische Assets
```

---

## 💡 Wichtige Konzepte

### 1. **React Context API**

Die App verwendet Context für globales State Management:

- **AuthContext**: Verwaltet Authentifizierung und User-Profil
- **DataContext**: Verwaltet alle App-Daten (Trips, Bookings, Costs)

**Vorteil**: Daten müssen nicht durch viele Komponenten-Ebenen durchgereicht werden.

```typescript
// Verwendung in einer Komponente
const { profile } = useAuth();
const { trips, refreshAll } = useData();
```

### 2. **Row Level Security (RLS)**

Supabase verwendet RLS-Policies, um Datenzugriff zu kontrollieren:

- Jeder User sieht nur Daten seiner Gruppe
- Admins haben erweiterte Rechte
- Policies werden in der Datenbank definiert

**Beispiel**: Ein User kann nur Fahrten seiner Gruppe sehen.

### 3. **TypeScript Interfaces**

Alle Datenstrukturen sind typisiert:

```typescript
interface Trip {
  id: string;
  start_kilometer: number;
  end_kilometer: number;
  datum: string;
  fahrer_id: string | null;
  kosten: number | null;
  // ...
}
```

**Vorteil**: Fehler werden zur Entwicklungszeit erkannt, nicht zur Laufzeit.

### 4. **Service Layer Pattern**

Alle Datenbank-Operationen sind in Services gekapselt:

```typescript
// Statt direktem Supabase-Aufruf in Komponenten:
const trips = await tripsService.getAll();

// Statt:
const { data } = await supabase.from('trips').select('*');
```

**Vorteil**: Änderungen an der Datenbank-Logik müssen nur an einer Stelle gemacht werden.

### 5. **Ionic Framework**

Ionic bietet mobile UI-Komponenten:

- `IonPage`, `IonHeader`, `IonContent` - Seitenstruktur
- `IonCard`, `IonButton`, `IonInput` - UI-Elemente
- `IonRefresher` - Pull-to-Refresh
- `IonAlert`, `IonToast` - Dialoge & Benachrichtigungen

**Vorteil**: Native Mobile-UX ohne native Entwicklung.

---

## 📚 Weitere Dokumentation

Detaillierte Dokumentation zu einzelnen Bereichen:

- **[COMPONENTS.md](./COMPONENTS.md)** - Alle Komponenten im Detail
- **[SERVICES.md](./SERVICES.md)** - Service-Layer und Datenbank-Zugriffe
- **[PAGES.md](./PAGES.md)** - Alle Seiten und deren Funktionen
- **[CONTEXTS.md](./CONTEXTS.md)** - State Management mit Context API
- **[FEATURES.md](./FEATURES.md)** - Wichtige Features und deren Implementierung
- **[DATABASE.md](./DATABASE.md)** - Datenbankschema und RLS-Policies

---

## 🚀 Schnellstart zum Lernen

### Empfohlene Lernreihenfolge:

1. **Start mit Types** (`src/types/index.ts`)
   - Verstehe die Datenstrukturen
   - Alle Interfaces ansehen

2. **Services verstehen** (`src/services/database.ts`)
   - Wie werden Daten geladen?
   - Wie werden Daten gespeichert?

3. **Contexts ansehen** (`src/contexts/`)
   - Wie wird State verwaltet?
   - Wie werden Daten zwischen Komponenten geteilt?

4. **Eine Page analysieren** (`src/pages/Dashboard.tsx`)
   - Wie wird eine Seite aufgebaut?
   - Wie werden Daten geladen und angezeigt?

5. **Komponenten verstehen** (`src/components/`)
   - Wie werden wiederverwendbare UI-Teile gebaut?
   - Props und State verstehen

6. **Features nachvollziehen** (siehe `FEATURES.md`)
   - Wie funktioniert die Fahrtaufzeichnung?
   - Wie funktioniert das Buchungssystem?

---

## 🎯 Nächste Schritte

1. Lies diese README komplett durch
2. Öffne `COMPONENTS.md` und schaue dir die Dashboard-Komponenten an
3. Öffne `src/pages/Dashboard.tsx` und verfolge den Code Zeile für Zeile
4. Experimentiere: Ändere Texte, Farben, Layout
5. Lies `FEATURES.md` um zu verstehen, wie komplexe Features implementiert sind

**Tipp**: Beginne mit kleinen Änderungen und teste sie sofort. So lernst du am besten!

---

## 📞 Hilfe & Ressourcen

- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs/
- **Ionic Docs**: https://ionicframework.com/docs
- **Supabase Docs**: https://supabase.com/docs

---

**Viel Erfolg beim Lernen! 🎓**
