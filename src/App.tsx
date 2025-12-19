import React from 'react';
import { IonApp, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Switch } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import MainTabs from './components/MainTabs';

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

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          gap: '16px',
        }}
      >
        <IonSpinner name="crescent" />
        <p>Lädt...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <MainTabs />;
};

const App: React.FC = () => {
  return (
    <IonApp>
      <AuthProvider>
        <DataProvider>
          <IonReactRouter>
            <IonRouterOutlet>
              <Switch>
                <Route path="/register" component={Register} exact />
                <Route path="/reset-password" component={ResetPassword} exact />
                <Route path="/" component={AppRoutes} />
              </Switch>
            </IonRouterOutlet>
          </IonReactRouter>
        </DataProvider>
      </AuthProvider>
    </IonApp>
  );
};

export default App;
