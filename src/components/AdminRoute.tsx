import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IonSpinner, IonContent, IonCard, IonCardContent } from '@ionic/react';

interface AdminRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ component: Component, ...rest }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <IonContent>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <IonSpinner />
        </div>
      </IonContent>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (!isAdmin) {
    return (
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <h2>Zugriff verweigert</h2>
            <p>Sie haben keine Berechtigung, diese Seite aufzurufen.</p>
          </IonCardContent>
        </IonCard>
      </IonContent>
    );
  }

  return <Route {...rest} render={(props) => <Component {...props} />} />;
};

export default AdminRoute;
