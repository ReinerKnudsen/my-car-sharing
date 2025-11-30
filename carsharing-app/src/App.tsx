import React from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import MainTabs from './components/MainTabs-simple';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

/* Custom CSS */
import './theme/custom.css';

setupIonicReact();

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('AppRoutes: loading=', loading, 'user=', user ? 'present' : 'null');

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    console.log('AppRoutes: Kein User, zeige Login');
    return <Login />;
  }

  console.log('AppRoutes: User vorhanden, zeige MainTabs');
  return <MainTabs />;
};

const App: React.FC = () => {
  return (
    <IonApp>
      <AuthProvider>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route path="/" component={AppRoutes} />
          </IonRouterOutlet>
        </IonReactRouter>
      </AuthProvider>
    </IonApp>
  );
};

export default App;
