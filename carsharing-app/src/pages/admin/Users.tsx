import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
  IonBadge,
  IonFab,
  IonFabButton,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { add, trashOutline, personAddOutline } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { profilesService } from '../../services/database';
import { Profile } from '../../types';

const Users: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();
  const history = useHistory();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await profilesService.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadUsers();
    event.detail.complete();
  };

  const handleCreateUser = () => {
    history.push('/admin/register');
  };

  const handleDeleteUser = (user: Profile) => {
    presentAlert({
      header: 'Benutzer löschen',
      message: `Möchten Sie ${user.vorname} ${user.name} wirklich löschen?`,
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel',
        },
        {
          text: 'Löschen',
          role: 'destructive',
          handler: async () => {
            try {
              await profilesService.delete(user.id);
              present({
                message: 'Benutzer gelöscht',
                duration: 2000,
                color: 'success',
              });
              loadUsers();
            } catch (error: any) {
              present({
                message: error.message || 'Fehler beim Löschen',
                duration: 3000,
                color: 'danger',
              });
            }
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Fahrer verwalten</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <IonSpinner />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonText color="medium">
              <p>Noch keine Benutzer vorhanden</p>
            </IonText>
            <IonButton onClick={handleCreateUser}>
              <IonIcon slot="start" icon={personAddOutline} />
              Benutzer erstellen
            </IonButton>
          </div>
        ) : (
          users.map((user) => (
            <IonCard key={user.id}>
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h2>
                      {user.vorname} {user.name}
                    </h2>
                    {user.gruppe && (
                      <IonText color="medium">
                        <p>Gruppe: {user.gruppe.bezeichnung}</p>
                      </IonText>
                    )}
                    {user.ist_admin && (
                      <IonBadge color="primary" style={{ marginTop: '8px' }}>
                        Administrator
                      </IonBadge>
                    )}
                  </div>
                  <IonButton
                    fill="clear"
                    color="danger"
                    onClick={() => handleDeleteUser(user)}
                  >
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={handleCreateUser}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Users;

