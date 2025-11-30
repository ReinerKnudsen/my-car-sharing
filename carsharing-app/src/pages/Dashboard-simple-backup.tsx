import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const history = useHistory();

  const handleLogout = async () => {
    await signOut();
    history.replace('/login');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <h1>🎉 Willkommen im Dashboard!</h1>
            <h2>Login erfolgreich!</h2>
            
            {profile && (
              <div style={{ marginTop: '20px' }}>
                <p><strong>Name:</strong> {profile.vorname} {profile.name}</p>
                <p><strong>Admin:</strong> {profile.ist_admin ? '✅ Ja' : '❌ Nein'}</p>
                {profile.gruppe && (
                  <p><strong>Gruppe:</strong> {profile.gruppe.bezeichnung}</p>
                )}
              </div>
            )}
            
            <IonButton 
              expand="block" 
              color="danger" 
              onClick={handleLogout}
              style={{ marginTop: '20px' }}
            >
              Abmelden
            </IonButton>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;

