import { IonApp, IonContent, IonPage, setupIonicReact } from '@ionic/react';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

setupIonicReact();

const App: React.FC = () => {
  console.log('App is rendering!');
  
  return (
    <IonApp>
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Debug Mode</h1>
            <p>Wenn Sie das sehen, funktioniert die grundlegende App-Struktur!</p>
            <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Gesetzt' : '❌ Fehlt'}</p>
            <p>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Gesetzt' : '❌ Fehlt'}</p>
          </div>
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default App;

