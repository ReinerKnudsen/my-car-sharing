import React, { useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IonSpinner, IonContent } from '@ionic/react';

/**
 * AuthGuard - Schützt Routen vor nicht-authentifizierten Benutzern
 * Wrapper-Komponente für geschützte Bereiche
 */
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const history = useHistory();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/login') {
      history.replace('/login');
    }
  }, [user, loading, history, location]);

  if (loading) {
    return (
      <IonContent>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <IonSpinner name="crescent" />
        </div>
      </IonContent>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;

