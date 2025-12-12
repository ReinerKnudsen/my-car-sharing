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
  IonLabel,
  IonBadge,
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonButtons,
  IonActionSheet,
  useIonAlert,
  useIonToast,
  isPlatform,
} from '@ionic/react';
import { 
  add, 
  trashOutline, 
  personAddOutline, 
  ellipsisVertical,
  shieldCheckmarkOutline,
  shieldOutline,
  lockClosedOutline,
  lockOpenOutline,
} from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { profilesService } from '../../services/database';
import { supabase } from '../../services/supabase';
import { Profile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const Users: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();
  const history = useHistory();
  const isIOS = isPlatform('ios');
  const { profile: currentUser, isAdmin, isGroupAdmin } = useAuth();

  // Determine if current user is ONLY a group admin (not a full admin)
  const isOnlyGroupAdmin = isGroupAdmin && !isAdmin;

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await profilesService.getAll();
      
      // If user is only a group admin, filter to show only users from their group
      if (isOnlyGroupAdmin && currentUser?.gruppe_id) {
        const filteredUsers = data.filter(u => u.gruppe_id === currentUser.gruppe_id);
        setUsers(filteredUsers);
      } else {
        setUsers(data);
      }
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

  const handleUserAction = (user: Profile) => {
    setSelectedUser(user);
    setShowActionSheet(true);
  };

  const handleDeleteUser = (user: Profile) => {
    // Prevent deletion if user is a group admin
    if (user.ist_gruppen_admin) {
      present({
        message: 'Gruppen-Admin kann nicht gelöscht werden. Bitte zuerst den Gruppen-Admin Status entfernen.',
        duration: 4000,
        color: 'warning',
      });
      return;
    }

    presentAlert({
      header: 'Benutzer löschen',
      message: `Möchten Sie ${user.vorname} ${user.name} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
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

  const handleToggleBlock = async (user: Profile) => {
    const newBlockedState = !user.ist_gesperrt;
    const action = newBlockedState ? 'sperren' : 'entsperren';
    
    presentAlert({
      header: `Benutzer ${action}`,
      message: newBlockedState 
        ? `${user.vorname} ${user.name} wird gesperrt und kann keine Buchungen oder Fahrten mehr erstellen.`
        : `${user.vorname} ${user.name} wird entsperrt und kann wieder normal arbeiten.`,
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel',
        },
        {
          text: newBlockedState ? 'Sperren' : 'Entsperren',
          handler: async () => {
            try {
              await profilesService.update(user.id, { ist_gesperrt: newBlockedState });
              present({
                message: `Benutzer ${newBlockedState ? 'gesperrt' : 'entsperrt'}`,
                duration: 2000,
                color: 'success',
              });
              loadUsers();
            } catch (error: any) {
              present({
                message: error.message || 'Fehler',
                duration: 3000,
                color: 'danger',
              });
            }
          },
        },
      ],
    });
  };

  const handleSetGroupAdmin = async (user: Profile) => {
    if (!user.gruppe_id) {
      present({
        message: 'Benutzer ist keiner Gruppe zugeordnet',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    // Check if there's already a group admin for this group
    const existingAdmin = users.find(
      u => u.gruppe_id === user.gruppe_id && u.ist_gruppen_admin && u.id !== user.id
    );

    if (existingAdmin) {
      presentAlert({
        header: 'Gruppen-Admin überschreiben?',
        message: `${existingAdmin.vorname} ${existingAdmin.name} ist bereits Gruppen-Admin für "${user.gruppe?.bezeichnung}". Möchten Sie den Admin-Status auf ${user.vorname} ${user.name} übertragen?`,
        buttons: [
          {
            text: 'Abbrechen',
            role: 'cancel',
          },
          {
            text: 'Übertragen',
            handler: async () => {
              await executeSetGroupAdmin(user, true);
            },
          },
        ],
      });
    } else {
      await executeSetGroupAdmin(user, false);
    }
  };

  const executeSetGroupAdmin = async (user: Profile, removeExisting: boolean) => {
    try {
      const { error } = await supabase.rpc('set_group_admin', {
        user_id: user.id,
        remove_existing: removeExisting
      });

      if (error) throw error;

      present({
        message: `${user.vorname} ${user.name} ist jetzt Gruppen-Admin`,
        duration: 2000,
        color: 'success',
      });
      loadUsers();
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Setzen des Gruppen-Admins',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  const handleRemoveGroupAdmin = async (user: Profile) => {
    presentAlert({
      header: 'Gruppen-Admin entfernen',
      message: `Möchten Sie ${user.vorname} ${user.name} als Gruppen-Admin entfernen?`,
      buttons: [
        {
          text: 'Abbrechen',
          role: 'cancel',
        },
        {
          text: 'Entfernen',
          handler: async () => {
            try {
              const { error } = await supabase.rpc('remove_group_admin', {
                user_id: user.id
              });

              if (error) throw error;

              present({
                message: 'Gruppen-Admin Status entfernt',
                duration: 2000,
                color: 'success',
              });
              loadUsers();
            } catch (error: any) {
              present({
                message: error.message || 'Fehler',
                duration: 3000,
                color: 'danger',
              });
            }
          },
        },
      ],
    });
  };

  const getActionSheetButtons = () => {
    if (!selectedUser) return [];

    const buttons: any[] = [];

    // Don't allow actions on yourself
    if (selectedUser.id === currentUser?.id) {
      return [
        {
          text: 'Das bist du selbst',
          role: 'cancel',
        },
      ];
    }

    // Don't allow actions on other admins (for everyone)
    if (selectedUser.ist_admin) {
      return [
        {
          text: 'Keine Aktionen für Administratoren',
          role: 'cancel',
        },
      ];
    }

    // Group Admin actions - only for full admins
    if (isAdmin && selectedUser.gruppe_id) {
      if (selectedUser.ist_gruppen_admin) {
        buttons.push({
          text: 'Gruppen-Admin entfernen',
          icon: shieldOutline,
          handler: () => handleRemoveGroupAdmin(selectedUser),
        });
      } else {
        buttons.push({
          text: 'Zum Gruppen-Admin machen',
          icon: shieldCheckmarkOutline,
          handler: () => handleSetGroupAdmin(selectedUser),
        });
      }
    }

    // Block/Unblock - available for admins and group admins (for their group members)
    if (selectedUser.ist_gesperrt) {
      buttons.push({
        text: 'Entsperren',
        icon: lockOpenOutline,
        handler: () => handleToggleBlock(selectedUser),
      });
    } else {
      buttons.push({
        text: 'Sperren',
        icon: lockClosedOutline,
        handler: () => handleToggleBlock(selectedUser),
      });
    }

    // Delete (not allowed for group admins, and group admins can't delete other group admins)
    if (!selectedUser.ist_gruppen_admin) {
      buttons.push({
        text: 'Löschen',
        role: 'destructive',
        icon: trashOutline,
        handler: () => handleDeleteUser(selectedUser),
      });
    }

    // Cancel
    buttons.push({
      text: 'Abbrechen',
      role: 'cancel',
    });

    return buttons;
  };

  // Get page title based on role
  const getPageTitle = () => {
    if (isOnlyGroupAdmin && currentUser?.gruppe) {
      return `Gruppe: ${currentUser.gruppe.bezeichnung}`;
    }
    return 'Verwaltung';
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{getPageTitle()}</IonTitle>
          {/* Only show add button for full admins */}
          {isIOS && isAdmin && (
            <IonButtons slot="end">
              <IonButton onClick={handleCreateUser}>
                <IonIcon icon={add} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
        {/* Segment navigation - different for admins vs group admins */}
        {isAdmin ? (
          <IonToolbar>
            <IonSegment value="users" onIonChange={(e) => {
              if (e.detail.value === 'groups') history.push('/admin/groups');
              if (e.detail.value === 'codes') history.push('/admin/invitation-codes');
              if (e.detail.value === 'settings') history.push('/admin/settings');
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
              <IonSegmentButton value="settings">
                <IonLabel>Kosten</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        ) : isGroupAdmin ? (
          <IonToolbar>
            <IonSegment value="users" onIonChange={(e) => {
              if (e.detail.value === 'codes') history.push('/admin/invitation-codes');
            }}>
              <IonSegmentButton value="users">
                <IonLabel>Mitglieder</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="codes">
                <IonLabel>Einladungen</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        ) : null}
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
              <p>{isOnlyGroupAdmin ? 'Noch keine Mitglieder in deiner Gruppe' : 'Noch keine Benutzer vorhanden'}</p>
            </IonText>
            {isAdmin && (
              <IonButton onClick={handleCreateUser}>
                <IonIcon slot="start" icon={personAddOutline} />
                Benutzer erstellen
              </IonButton>
            )}
            {isOnlyGroupAdmin && (
              <IonButton onClick={() => history.push('/admin/invitation-codes')}>
                <IonIcon slot="start" icon={add} />
                Einladungscode erstellen
              </IonButton>
            )}
          </div>
        ) : (
          users.map((user) => (
            <IonCard key={user.id} style={{ opacity: user.ist_gesperrt ? 0.6 : 1 }}>
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 4px 0' }}>
                      {user.vorname} {user.name}
                      {user.id === currentUser?.id && (
                        <IonText color="medium"> (Du)</IonText>
                      )}
                    </h2>
                    
                    {/* Show group only for full admins (group admins see only their group anyway) */}
                    {isAdmin && user.gruppe && (
                      <IonText color="medium">
                        <p style={{ margin: '0 0 8px 0' }}>
                          Gruppe: {user.gruppe.bezeichnung}
                        </p>
                      </IonText>
                    )}
                    
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {user.ist_admin && (
                        <IonBadge color="primary">Admin</IonBadge>
                      )}
                      {user.ist_gruppen_admin && (
                        <IonBadge color="secondary">Gruppen-Admin</IonBadge>
                      )}
                      {user.ist_gesperrt && (
                        <IonBadge color="danger">Gesperrt</IonBadge>
                      )}
                    </div>
                  </div>
                  
                  <IonButton
                    fill="clear"
                    onClick={() => handleUserAction(user)}
                  >
                    <IonIcon icon={ellipsisVertical} />
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}

        {/* FAB only for full admins */}
        {!isIOS && isAdmin && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleCreateUser}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => {
            setShowActionSheet(false);
            setSelectedUser(null);
          }}
          header={selectedUser ? `${selectedUser.vorname} ${selectedUser.name}` : ''}
          buttons={getActionSheetButtons()}
        />
      </IonContent>
    </IonPage>
  );
};

export default Users;
