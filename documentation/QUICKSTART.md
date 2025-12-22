# Schnellstart-Anleitung

## 🎯 Ziel

Diese Anleitung hilft dir, die App **schnell zu verstehen** und erste **eigene Änderungen** zu machen.

---

## 📚 Lernpfad (empfohlen)

### Tag 1: Grundlagen verstehen (2-3 Stunden)

1. **README.md lesen** (15 Min)
   - Verstehe die Architektur
   - Lerne die Ordnerstruktur kennen

2. **Types ansehen** (30 Min)
   - Öffne `src/types/index.ts`
   - Schaue dir alle Interfaces an
   - Verstehe die Datenstrukturen

3. **Ein Service analysieren** (45 Min)
   - Öffne `src/services/database.ts`
   - Suche `tripsService`
   - Verstehe `getAll()`, `create()`, `update()`, `delete()`
   - Lies `SERVICES.md` parallel

4. **Eine Page analysieren** (60 Min)
   - Öffne `src/pages/Dashboard.tsx`
   - Gehe Zeile für Zeile durch
   - Verstehe wie Daten geladen werden
   - Verstehe wie Komponenten verwendet werden

### Tag 2: Komponenten verstehen (2-3 Stunden)

1. **COMPONENTS.md lesen** (30 Min)
   - Verstehe Props vs State
   - Lerne die Dashboard-Komponenten kennen

2. **TripControl analysieren** (60 Min)
   - Öffne `src/components/dashboard/TripControl.tsx`
   - Verstehe die State-Variablen
   - Verstehe `confirmStartTrip()`
   - Verstehe die Dialoge

3. **Eigene Änderung machen** (60 Min)
   - Ändere einen Text
   - Ändere eine Farbe
   - Teste die Änderung
   - Verstehe was passiert

### Tag 3: Contexts & Features (2-3 Stunden)

1. **CONTEXTS.md lesen** (30 Min)
   - Verstehe AuthContext
   - Verstehe DataContext

2. **FEATURES.md lesen** (60 Min)
   - Verstehe gemeinsame Fahrtaufzeichnung
   - Verstehe nachgetragene Fahrten

3. **DATABASE.md lesen** (60 Min)
   - Verstehe das Schema
   - Verstehe RLS Policies

---

## 🚀 Erste Änderungen (Hands-On)

### Übung 1: Text ändern (5 Min)

**Ziel**: Ändere "Fahrt starten" zu "Los geht's"

1. Öffne `src/components/dashboard/TripControl.tsx`
2. Suche nach `"Fahrt starten"`
3. Ändere zu `"Los geht's"`
4. Speichere
5. App lädt neu → Siehst du die Änderung?

**Lernziel**: Verstehe wo UI-Texte stehen.

---

### Übung 2: Farbe ändern (10 Min)

**Ziel**: Ändere die Farbe der grünen Karte

1. Öffne `src/components/dashboard/TripControl.tsx`
2. Suche nach `background: isForeignTrip ? '#ff9800' : isOwnTrip ? '#ffc409' : '#8ab21d'`
3. Ändere `#8ab21d` zu `#2196f3` (Blau)
4. Speichere
5. Siehst du die blaue Karte?

**Lernziel**: Verstehe wie Styling funktioniert.

---

### Übung 3: Neues Feld anzeigen (30 Min)

**Ziel**: Zeige Erstellungsdatum bei Fahrten an

1. **Type prüfen**:

   ```typescript
   // src/types/index.ts
   interface Trip {
     created_at: string; // ← Existiert bereits
   }
   ```

2. **TripCard öffnen**: `src/components/TripCard.tsx`

3. **Datum anzeigen**:

   ```typescript
   <IonCardContent>
     {/* Bestehender Code */}

     {/* NEU: Erstellungsdatum */}
     <IonText color="medium" style={{ fontSize: '12px' }}>
       Erstellt: {new Date(trip.created_at).toLocaleDateString('de-DE')}
     </IonText>
   </IonCardContent>
   ```

4. **Speichern und testen**

**Lernziel**: Verstehe wie Daten angezeigt werden.

---

### Übung 4: Neue Funktion hinzufügen (60 Min)

**Ziel**: Button zum Kopieren der Fahrt-ID

1. **Import hinzufügen**:

   ```typescript
   import { IonButton, IonIcon } from '@ionic/react';
   import { copy } from 'ionicons/icons';
   ```

2. **Funktion erstellen**:

   ```typescript
   const handleCopyId = () => {
     navigator.clipboard.writeText(trip.id);
     // Toast anzeigen (optional)
   };
   ```

3. **Button hinzufügen**:

   ```typescript
   <IonButton size="small" onClick={handleCopyId}>
     <IonIcon icon={copy} slot="start" />
     ID kopieren
   </IonButton>
   ```

4. **Testen**: Klicke Button, füge ID ein (Strg+V)

**Lernziel**: Verstehe wie Funktionen hinzugefügt werden.

---

## 🔍 Debugging-Tipps

### Console Logs verwenden

```typescript
const Dashboard: React.FC = () => {
  const { trips, loading } = useData();

  console.log('Trips:', trips);
  console.log('Loading:', loading);

  // ...
};
```

**Wo sehen?** Browser → F12 → Console

---

### React DevTools

1. **Extension installieren**: "React Developer Tools"
2. **Browser öffnen** → F12 → Components Tab
3. **Komponente auswählen**
4. **Props & State inspizieren**

---

### Supabase Dashboard

1. **Öffne** Supabase Dashboard
2. **Table Editor**: Sieh Daten direkt
3. **SQL Editor**: Teste Queries
4. **Logs**: Sieh Fehler

---

## 📖 Code-Patterns verstehen

### Pattern 1: Daten laden

```typescript
// 1. Hook verwenden
const { trips, loading, refreshTrips } = useData();

// 2. Loading State prüfen
if (loading) {
  return <IonSpinner />;
}

// 3. Daten anzeigen
return (
  <div>
    {trips.map(trip => (
      <TripCard key={trip.id} trip={trip} />
    ))}
  </div>
);
```

---

### Pattern 2: Daten speichern

```typescript
const handleSave = async () => {
  try {
    // 1. Service aufrufen
    await tripsService.create(newTrip);

    // 2. Daten neu laden
    await refreshTrips();

    // 3. Feedback geben
    presentToast({
      message: 'Gespeichert!',
      color: 'success',
    });
  } catch (error) {
    // 4. Fehler behandeln
    presentToast({
      message: error.message,
      color: 'danger',
    });
  }
};
```

---

### Pattern 3: Conditional Rendering

```typescript
// Zeige nur wenn Bedingung erfüllt
{isAdmin && <AdminPanel />}

// Zeige A oder B
{loading ? <Spinner /> : <Content />}

// Zeige Liste
{trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
```

---

## 🎨 Styling-Tipps

### Inline Styles

```typescript
<div style={{
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px',
  background: '#f5f5f5'
}}>
  {/* Content */}
</div>
```

### Ionic CSS Variables

```typescript
<IonCard style={{
  '--background': '#e3f2fd',
  '--color': '#1976d2'
}}>
  {/* Content */}
</IonCard>
```

### Farben

```typescript
const colors = {
  primary: '#3880ff',
  success: '#8ab21d',
  warning: '#ffc409',
  danger: '#ff9800',
  medium: '#92949c',
  light: '#f4f5f8',
};
```

---

## 🛠️ Häufige Aufgaben

### Neue Seite hinzufügen

1. **Erstelle** `src/pages/NewPage.tsx`
2. **Route hinzufügen** in `App.tsx`:
   ```typescript
   <Route path="/new-page" component={NewPage} />
   ```
3. **Navigation** hinzufügen:
   ```typescript
   <IonButton routerLink="/new-page">
     Neue Seite
   </IonButton>
   ```

---

### Neue Komponente erstellen

1. **Erstelle** `src/components/MyComponent.tsx`
2. **Definiere Interface**:
   ```typescript
   interface MyComponentProps {
     title: string;
     onSave: () => void;
   }
   ```
3. **Implementiere**:

   ```typescript
   const MyComponent: React.FC<MyComponentProps> = ({ title, onSave }) => {
     return (
       <IonCard>
         <IonCardHeader>
           <IonCardTitle>{title}</IonCardTitle>
         </IonCardHeader>
         <IonCardContent>
           <IonButton onClick={onSave}>Speichern</IonButton>
         </IonCardContent>
       </IonCard>
     );
   };

   export default MyComponent;
   ```

---

### Neue Service-Funktion

1. **Öffne** `src/services/database.ts`
2. **Füge Funktion hinzu**:
   ```typescript
   export const tripsService = {
     // Bestehende Funktionen...

     async getByDateRange(from: string, to: string): Promise<Trip[]> {
       const { data, error } = await supabase
         .from('trips')
         .select('*, fahrer:profiles(*)')
         .gte('datum', from)
         .lte('datum', to)
         .order('datum', { ascending: false });

       if (error) throw error;
       return data || [];
     },
   };
   ```

---

## 🐛 Häufige Fehler

### Fehler 1: "Cannot read property of undefined"

**Ursache**: Daten sind noch nicht geladen

**Lösung**: Loading State prüfen

```typescript
if (!trip) return null; // Oder <Spinner />
```

---

### Fehler 2: "useContext must be used within Provider"

**Ursache**: Context außerhalb des Providers verwendet

**Lösung**: Prüfe `App.tsx` → Provider-Hierarchie

---

### Fehler 3: "Key prop missing"

**Ursache**: `key` fehlt bei `.map()`

**Lösung**:

```typescript
{trips.map(trip => (
  <TripCard key={trip.id} trip={trip} />  // ← key hinzufügen
))}
```

---

## 📚 Nächste Schritte

Nach dem Schnellstart:

1. **Lies die Detail-Dokumentation**:
   - `COMPONENTS.md` für alle Komponenten
   - `SERVICES.md` für Datenbank-Zugriffe
   - `FEATURES.md` für komplexe Features

2. **Experimentiere**:
   - Ändere Texte, Farben, Layouts
   - Füge neue Felder hinzu
   - Erstelle neue Komponenten

3. **Baue ein eigenes Feature**:
   - Z.B. "Fahrt-Statistiken"
   - Z.B. "Favoriten-Fahrten"
   - Z.B. "Export als PDF"

---

## 💡 Lern-Ressourcen

### Offizielle Docs

- **React**: https://react.dev/learn
- **TypeScript**: https://www.typescriptlang.org/docs/handbook/intro.html
- **Ionic**: https://ionicframework.com/docs/components
- **Supabase**: https://supabase.com/docs

### Tutorials

- **React Tutorial**: https://react.dev/learn/tutorial-tic-tac-toe
- **TypeScript in 5 Minutes**: https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html
- **Ionic React**: https://ionicframework.com/docs/react/quickstart

---

## 🎓 Zusammenfassung

**Du hast gelernt**:

- ✅ Wie die App strukturiert ist
- ✅ Wie Komponenten funktionieren
- ✅ Wie Daten geladen werden
- ✅ Wie du Änderungen machst
- ✅ Wie du debuggst

**Nächste Schritte**:

1. Mache die Übungen
2. Lies die Detail-Dokumentation
3. Experimentiere mit eigenem Code
4. Baue ein eigenes Feature

**Viel Erfolg beim Lernen! 🚀**

Du hast die App nicht alleine gebaut, aber jetzt kannst du sie **verstehen** und **erweitern**!
