import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonButton,
  IonItem,
  IonLabel,
  IonText,
  IonIcon,
  useIonToast,
} from '@ionic/react';
import { walletOutline, chevronForwardOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const { profile, signOut, user, isAdmin, isGroupAdmin } = useAuth();
  const history = useHistory();
  const [present] = useIonToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      present({
        message: 'Erfolgreich abgemeldet',
        duration: 2000,
        color: 'success',
      });
      window.location.href = '/login';
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Abmelden',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Profil</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Mein Profil</IonCardTitle>
            <IonCardSubtitle>{user?.email}</IonCardSubtitle>
          </IonCardHeader>
          <IonCardContent>
            {profile && (
              <>
                <IonItem lines="none">
                  <IonLabel>
                    <IonText color="medium">
                      <p>Name</p>
                    </IonText>
                    <h2>
                      {profile.vorname} {profile.name}
                    </h2>
                  </IonLabel>
                </IonItem>

                <IonItem lines="none">
                  <IonLabel>
                    <IonText color="medium">
                      <p>E-Mail</p>
                    </IonText>
                    <h2>{user?.email}</h2>
                  </IonLabel>
                </IonItem>

                {profile.gruppe && (
                  <IonItem lines="none">
                    <IonLabel>
                      <IonText color="medium">
                        <p>Gruppe</p>
                      </IonText>
                      <h2>{profile.gruppe.bezeichnung}</h2>
                    </IonLabel>
                  </IonItem>
                )}

                <IonItem lines="none">
                  <IonLabel>
                    <IonText color="medium">
                      <p>Rolle</p>
                    </IonText>
                    <h2>
                      {profile.ist_admin 
                        ? 'Administrator' 
                        : profile.ist_gruppen_admin 
                          ? 'Gruppenadmin' 
                          : 'Fahrer'}
                    </h2>
                  </IonLabel>
                </IonItem>
              </>
            )}

            {/* Gruppenkonto Link für Admin/Gruppenadmin */}
            {(isAdmin || isGroupAdmin) && profile?.gruppe_id && (
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => history.push('/group-account')}
                style={{ marginTop: '20px' }}
              >
                <IonIcon slot="start" icon={walletOutline} />
                Gruppenkonto
                <IonIcon slot="end" icon={chevronForwardOutline} />
              </IonButton>
            )}

            <IonButton
              expand="block"
              color="danger"
              onClick={handleSignOut}
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

export default Profile;

