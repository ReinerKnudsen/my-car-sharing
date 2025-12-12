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
  IonFab,
  IonFabButton,
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonButtons,
  IonSegment,
  IonSegmentButton,
  useIonAlert,
  useIonToast,
  isPlatform,
} from '@ionic/react';
import { add, trashOutline, pencilOutline, close } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { groupsService } from '../../services/database';
import { Group } from '../../types';

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();
  const history = useHistory();
  const isIOS = isPlatform('ios');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const data = await groupsService.getAll();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadGroups();
    event.detail.complete();
  };

  const handleOpenModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setGroupName(group.bezeichnung);
    } else {
      setEditingGroup(null);
      setGroupName('');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGroup(null);
    setGroupName('');
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      present({
        message: 'Bitte einen Gruppennamen eingeben',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    try {
      if (editingGroup) {
        // Update existing group
        await groupsService.update(editingGroup.id, {
          bezeichnung: groupName,
        });
        present({
          message: 'Gruppe aktualisiert',
          duration: 2000,
          color: 'success',
        });
      } else {
        // Create new group
        await groupsService.create({
          bezeichnung: groupName,
        });
        present({
          message: 'Gruppe erstellt',
          duration: 2000,
          color: 'success',
        });
      }
      handleCloseModal();
      loadGroups();
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Speichern',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  const handleDeleteGroup = (group: Group) => {
    presentAlert({
      header: 'Gruppe löschen',
      message: `Möchten Sie die Gruppe "${group.bezeichnung}" wirklich löschen?`,
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
              await groupsService.delete(group.id);
              present({
                message: 'Gruppe gelöscht',
                duration: 2000,
                color: 'success',
              });
              loadGroups();
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
          <IonTitle>Verwaltung</IonTitle>
          {isIOS && (
            <IonButtons slot="end">
              <IonButton onClick={() => handleOpenModal()}>
                <IonIcon icon={add} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
        <IonToolbar>
          <IonSegment value="groups" onIonChange={(e) => {
            if (e.detail.value === 'users') history.push('/admin/users');
            if (e.detail.value === 'codes') history.push('/admin/invitation-codes');
          }}>
            <IonSegmentButton value="users">
              <IonLabel>Fahrer</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="groups">
              <IonLabel>Gruppen</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="codes">
              <IonLabel>Einladungen</IonLabel>
            </IonSegmentButton>
          </IonSegment>
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
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonText color="medium">
              <p>Noch keine Gruppen vorhanden</p>
            </IonText>
            <IonButton onClick={() => handleOpenModal()}>
              <IonIcon slot="start" icon={add} />
              Gruppe erstellen
            </IonButton>
          </div>
        ) : (
          groups.map((group) => (
            <IonCard key={group.id}>
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2>{group.bezeichnung}</h2>
                  <div>
                    <IonButton
                      fill="clear"
                      color="primary"
                      onClick={() => handleOpenModal(group)}
                    >
                      <IonIcon icon={pencilOutline} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => handleDeleteGroup(group)}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}

        {!isIOS && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => handleOpenModal()}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Create/Edit Modal */}
        <IonModal isOpen={showModal} onDidDismiss={handleCloseModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingGroup ? 'Gruppe bearbeiten' : 'Neue Gruppe'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={handleCloseModal}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonInput
              label="Gruppenname *"
              labelPlacement="floating"
              fill="solid"
              value={groupName}
              onIonInput={(e) => setGroupName(e.detail.value!)}
              placeholder="z.B. Familie Müller"
              style={{ 
                marginBottom: '16px',
                '--background': '#f4f5f8',
                '--border-width': '1px',
                '--border-style': 'solid',
                '--border-color': '#d7d8da',
                '--border-radius': '8px',
                '--padding-start': '16px',
                '--padding-end': '16px',
              }}
            />

            <IonButton
              expand="block"
              onClick={handleSaveGroup}
              style={{ marginTop: '20px' }}
            >
              {editingGroup ? 'Aktualisieren' : 'Erstellen'}
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Groups;

