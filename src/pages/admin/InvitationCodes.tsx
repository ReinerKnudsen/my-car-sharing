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
  IonInput,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonBadge,
  IonChip,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  useIonAlert,
  useIonToast,
  isPlatform,
} from '@ionic/react';
import { add, trashOutline, copyOutline, close, banOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { invitationService } from '../../services/invitation.service';
import { groupsService } from '../../services/database';
import { InvitationCode, Group } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const InvitationCodes: React.FC = () => {
  const [codes, setCodes] = useState<InvitationCode[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [maxUses, setMaxUses] = useState<number>(1);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();
  const { profile, isAdmin, isGroupAdmin } = useAuth();
  const history = useHistory();
  const isIOS = isPlatform('ios');
  const isOnlyGroupAdmin = isGroupAdmin && !isAdmin;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // If user is group admin (not full admin), only load their group's codes
      if (profile?.ist_gruppen_admin && !profile?.ist_admin && profile?.gruppe_id) {
        const [codesData, groupsData] = await Promise.all([
          invitationService.getCodesForGroup(profile.gruppe_id),
          groupsService.getAll(),
        ]);
        setCodes(codesData);
        // Filter groups to only show the user's group
        setGroups(groupsData.filter(g => g.id === profile.gruppe_id));
      } else {
        // Full admin sees all codes and groups
        const [codesData, groupsData] = await Promise.all([
          invitationService.getAllCodes(),
          groupsService.getAll(),
        ]);
        setCodes(codesData);
        setGroups(groupsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadData();
    event.detail.complete();
  };

  const handleOpenModal = () => {
    // Pre-select group for group admins (they only have one option)
    if (profile?.ist_gruppen_admin && !profile?.ist_admin && profile?.gruppe_id) {
      setSelectedGroupId(profile.gruppe_id);
    } else {
      setSelectedGroupId('');
    }
    setMaxUses(1);
    setExpiresInDays(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleCreateCode = async () => {
    if (!selectedGroupId) {
      present({
        message: 'Bitte eine Gruppe auswählen',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    if (!profile?.id) {
      present({
        message: 'Nicht angemeldet',
        duration: 3000,
        color: 'danger',
      });
      return;
    }

    setCreating(true);
    try {
      let expiresAt: string | undefined;
      if (expiresInDays && expiresInDays > 0) {
        const date = new Date();
        date.setDate(date.getDate() + expiresInDays);
        expiresAt = date.toISOString();
      }

      const newCode = await invitationService.createCode(
        {
          gruppe_id: selectedGroupId,
          max_uses: maxUses,
          expires_at: expiresAt,
        },
        profile.id
      );

      present({
        message: `Code ${newCode.code} erstellt!`,
        duration: 3000,
        color: 'success',
      });
      handleCloseModal();
      loadData();
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Erstellen',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      present({
        message: 'Code in Zwischenablage kopiert!',
        duration: 2000,
        color: 'success',
      });
    } catch (error) {
      present({
        message: 'Kopieren fehlgeschlagen',
        duration: 2000,
        color: 'danger',
      });
    }
  };

  const handleToggleActive = async (code: InvitationCode) => {
    try {
      if (code.is_active) {
        await invitationService.deactivateCode(code.id);
        present({
          message: 'Code deaktiviert',
          duration: 2000,
          color: 'success',
        });
      } else {
        await invitationService.reactivateCode(code.id);
        present({
          message: 'Code aktiviert',
          duration: 2000,
          color: 'success',
        });
      }
      loadData();
    } catch (error: any) {
      present({
        message: error.message || 'Fehler',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  const handleDeleteCode = (code: InvitationCode) => {
    presentAlert({
      header: 'Code löschen',
      message: `Möchten Sie den Code "${code.code}" wirklich löschen?`,
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
              await invitationService.deleteCode(code.id);
              present({
                message: 'Code gelöscht',
                duration: 2000,
                color: 'success',
              });
              loadData();
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

  const isExpired = (code: InvitationCode) => {
    if (!code.expires_at) return false;
    return new Date(code.expires_at) < new Date();
  };

  const isFullyUsed = (code: InvitationCode) => {
    return code.uses_count >= code.max_uses;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{isAdmin ? 'Verwaltung' : 'Einladungscodes'}</IonTitle>
          {isIOS && (
            <IonButtons slot="end">
              <IonButton onClick={handleOpenModal}>
                <IonIcon icon={add} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
        {isAdmin ? (
          <IonToolbar>
            <IonSegment value="codes" onIonChange={(e) => {
              if (e.detail.value === 'users') history.push('/admin/users');
              if (e.detail.value === 'groups') history.push('/admin/groups');
              if (e.detail.value === 'settings') history.push('/admin/settings');
              if (e.detail.value === 'receipt-types') history.push('/admin/receipt-types');
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
              <IonSegmentButton value="receipt-types">
                <IonLabel>Belegarten</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        ) : isOnlyGroupAdmin ? (
          <IonToolbar>
            <IonSegment value="codes" onIonChange={(e) => {
              if (e.detail.value === 'users') history.push('/admin/users');
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
        ) : codes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonText color="medium">
              <p>Noch keine Einladungscodes vorhanden</p>
            </IonText>
            <IonButton onClick={handleOpenModal}>
              <IonIcon slot="start" icon={add} />
              Code erstellen
            </IonButton>
          </div>
        ) : (
          codes.map((code) => (
            <IonCard key={code.id}>
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {/* Code */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '1.4em', 
                        fontWeight: 'bold',
                        letterSpacing: '2px'
                      }}>
                        {code.code}
                      </span>
                      <IonButton fill="clear" size="small" onClick={() => handleCopyCode(code.code)}>
                        <IonIcon icon={copyOutline} />
                      </IonButton>
                    </div>

                    {/* Group */}
                    <div style={{ marginBottom: '8px' }}>
                      <IonChip color="primary" style={{ margin: 0 }}>
                        {code.gruppe?.bezeichnung || 'Unbekannte Gruppe'}
                      </IonChip>
                    </div>

                    {/* Status badges */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      {code.is_active && !isExpired(code) && !isFullyUsed(code) ? (
                        <IonBadge color="success">Aktiv</IonBadge>
                      ) : (
                        <IonBadge color="medium">Inaktiv</IonBadge>
                      )}
                      
                      <IonBadge color="light">
                        {code.uses_count}/{code.max_uses} verwendet
                      </IonBadge>
                      
                      {isExpired(code) && (
                        <IonBadge color="danger">Abgelaufen</IonBadge>
                      )}
                      
                      {isFullyUsed(code) && (
                        <IonBadge color="warning">Aufgebraucht</IonBadge>
                      )}
                    </div>

                    {/* Meta info */}
                    <IonText color="medium" style={{ fontSize: '0.85em' }}>
                      <div>Erstellt am {formatDate(code.created_at)}</div>
                      {code.expires_at && (
                        <div>Gültig bis {formatDate(code.expires_at)}</div>
                      )}
                    </IonText>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <IonButton
                      fill="clear"
                      color={code.is_active ? 'warning' : 'success'}
                      onClick={() => handleToggleActive(code)}
                      title={code.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    >
                      <IonIcon icon={code.is_active ? banOutline : checkmarkCircleOutline} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => handleDeleteCode(code)}
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
            <IonFabButton onClick={handleOpenModal}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Create Modal */}
        <IonModal isOpen={showModal} onDidDismiss={handleCloseModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Neuer Einladungscode</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={handleCloseModal}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {/* Group selector - disabled for group admins (they only have one option) */}
            {profile?.ist_gruppen_admin && !profile?.ist_admin ? (
              <IonInput
                label="Gruppe"
                labelPlacement="floating"
                fill="solid"
                value={groups[0]?.bezeichnung || ''}
                disabled
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
            ) : (
              <IonSelect
                label="Gruppe *"
                labelPlacement="floating"
                fill="solid"
                value={selectedGroupId}
                onIonChange={(e) => setSelectedGroupId(e.detail.value)}
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
              >
                {groups.map((group) => (
                  <IonSelectOption key={group.id} value={group.id}>
                    {group.bezeichnung}
                  </IonSelectOption>
                ))}
              </IonSelect>
            )}

            <IonInput
              type="number"
              label="Maximale Verwendungen"
              labelPlacement="floating"
              fill="solid"
              value={maxUses}
              onIonInput={(e) => setMaxUses(parseInt(e.detail.value || '1', 10))}
              min={1}
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

            <IonSelect
              label="Gültigkeit"
              labelPlacement="floating"
              fill="solid"
              value={expiresInDays}
              onIonChange={(e) => setExpiresInDays(e.detail.value)}
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
            >
              <IonSelectOption value={null}>Unbegrenzt</IonSelectOption>
              <IonSelectOption value={1}>1 Tag</IonSelectOption>
              <IonSelectOption value={7}>7 Tage</IonSelectOption>
              <IonSelectOption value={30}>30 Tage</IonSelectOption>
              <IonSelectOption value={90}>90 Tage</IonSelectOption>
            </IonSelect>

            <IonButton
              expand="block"
              onClick={handleCreateCode}
              disabled={creating}
              style={{ marginTop: '20px' }}
            >
              {creating ? <IonSpinner name="crescent" /> : 'Code erstellen'}
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default InvitationCodes;

