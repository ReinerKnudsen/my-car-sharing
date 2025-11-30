import React from 'react';
import { IonApp, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route } from 'react-router-dom';

/* Core CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';

setupIonicReact();

const TestPage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>CarSharing App - Test</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1>✅ Die App funktioniert!</h1>
        <p>Wenn Sie das sehen, lädt die Ionic App korrekt.</p>
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          background: '#f0f0f0',
          borderRadius: '8px' 
        }}>
          <h3>Environment Check:</h3>
          <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</p>
          <p>Supabase Key vorhanden: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Ja' : '❌ Nein'}</p>
        </div>
        <div style={{ marginTop: '20px' }}>
          <p><strong>Nächster Schritt:</strong> Login-Seite aktivieren</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

const App: React.FC = () => {
  return (
    <IonApp>
      <IonReactRouter>
        <Route path="/" component={TestPage} />
      </IonReactRouter>
    </IonApp>
  );
};

export default App;

