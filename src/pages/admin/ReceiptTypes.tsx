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
  IonFab,
  IonFabButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonModal,
  IonInput,
  IonTextarea,
  IonBadge,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  useIonViewWillEnter,
  useIonAlert,
  useIonToast,
  isPlatform,
} from '@ionic/react';
import { add, createOutline, eyeOffOutline, eyeOutline, closeOutline } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { receiptService } from '../../services/receipt.service';
import { ReceiptType } from '../../types';

const ReceiptTypes: React.FC = () => {
  const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<ReceiptType | null>(null);
  const [formData, setFormData] = useState({ bezeichnung: '', beschreibung: '' });
  const [saving, setSaving] = useState(false);
  
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  useIonViewWillEnter(() => {
    loadReceiptTypes();
  });

  const loadReceiptTypes = async () => {
    try {
      setLoading(true);
      const data = await receiptService.getAllReceiptTypes();
      setReceiptTypes(data);
    } catch (error) {
      console.error('Error loading receipt types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadReceiptTypes();
    event.detail.complete();
  };

  const openCreateModal = () => {
    setEditingType(null);
    setFormData({ bezeichnung: '', beschreibung: '' });
    setShowModal(true);
  };

  const openEditModal = (type: ReceiptType) => {
    setEditingType(type);
    setFormData({ 
      bezeichnung: type.bezeichnung, 
      beschreibung: type.beschreibung || '' 
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.bezeichnung.trim()) {
      presentToast({
        message: 'Bitte eine Bezeichnung eingeben',
        duration: 2000,
        color: 'warning',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingType) {
        await receiptService.updateReceiptType(editingType.id, {
          bezeichnung: formData.bezeichnung,
          beschreibung: formData.beschreibung || null,
        });
        presentToast({
          message: 'Belegart aktualisiert',
          duration: 2000,
          color: 'success',
        });
      } else {
        await receiptService.createReceiptType({
          bezeichnung: formData.bezeichnung,
          beschreibung: formData.beschreibung || null,
          aktiv: true,
          sort_order: 0, // wird vom Service gesetzt
        });
        presentToast({
          message: 'Belegart erstellt',
          duration: 2000,
          color: 'success',
        });
      }
      setShowModal(false);
      loadReceiptTypes();
    } catch (error: any) {
      presentToast({
        message: error.message || 'Fehler beim Speichern',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (type: ReceiptType) => {
    const action = type.aktiv ? 'deaktivieren' : 'aktivieren';
    
    presentAlert({
      header: `Belegart ${action}`,
      message: `Möchtest du "${type.bezeichnung}" ${action}?`,
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: type.aktiv ? 'Deaktivieren' : 'Aktivieren',
          handler: async () => {
            try {
              if (type.aktiv) {
                await receiptService.deactivateReceiptType(type.id);
              } else {
                await receiptService.activateReceiptType(type.id);
              }
              presentToast({
                message: `Belegart ${type.aktiv ? 'deaktiviert' : 'aktiviert'}`,
                duration: 2000,
                color: 'success',
              });
              loadReceiptTypes();
            } catch (error: any) {
              presentToast({
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

  const isIOS = isPlatform('ios');

  const inputStyle = {
    marginBottom: '16px',
    '--background': '#f4f5f8',
    '--border-width': '1px',
    '--border-style': 'solid',
    '--border-color': '#d7d8da',
    '--border-radius': '8px',
    '--padding-start': '16px',
    '--padding-end': '16px',
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Verwaltung</IonTitle>
          {isIOS && (
            <IonButtons slot="end">
              <IonButton onClick={openCreateModal}>
                <IonIcon icon={add} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
        <IonToolbar>
          <IonSegment value="receipt-types" onIonChange={(e) => {
            if (e.detail.value === 'users') history.push('/admin/users');
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
            <IonSegmentButton value="receipt-types">
              <IonLabel>Belegarten</IonLabel>
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
        ) : receiptTypes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonText color="medium">
              <p>Keine Belegarten vorhanden</p>
            </IonText>
            <IonButton onClick={openCreateModal}>
              <IonIcon slot="start" icon={add} />
              Neue Belegart
            </IonButton>
          </div>
        ) : (
          receiptTypes.map((type) => (
            <IonCard key={type.id} style={{ margin: '0 0 12px 0' }}>
              <IonCardContent style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{type.bezeichnung}</strong>
                      {!type.aktiv && (
                        <IonBadge color="medium">Inaktiv</IonBadge>
                      )}
                    </div>
                    {type.beschreibung && (
                      <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                        {type.beschreibung}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <IonButton 
                      fill="clear" 
                      size="small"
                      onClick={() => openEditModal(type)}
                    >
                      <IonIcon icon={createOutline} />
                    </IonButton>
                    <IonButton 
                      fill="clear" 
                      size="small"
                      color={type.aktiv ? 'medium' : 'success'}
                      onClick={() => handleToggleActive(type)}
                    >
                      <IonIcon icon={type.aktiv ? eyeOffOutline : eyeOutline} />
                    </IonButton>
                  </div>
                </div>
              </IonCardContent>
            </IonCard>
          ))
        )}

        {/* Android: FAB Button */}
        {!isIOS && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={openCreateModal}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Modal zum Erstellen/Bearbeiten */}
        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
              <IonTitle>{editingType ? 'Belegart bearbeiten' : 'Neue Belegart'}</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={handleSave} disabled={saving}>
                  {saving ? <IonSpinner name="crescent" /> : 'Speichern'}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonInput
              label="Bezeichnung *"
              labelPlacement="floating"
              fill="solid"
              value={formData.bezeichnung}
              onIonInput={(e) => setFormData({ ...formData, bezeichnung: e.detail.value! })}
              style={inputStyle}
            />
            <IonTextarea
              label="Beschreibung"
              labelPlacement="floating"
              fill="solid"
              value={formData.beschreibung}
              onIonInput={(e) => setFormData({ ...formData, beschreibung: e.detail.value! })}
              rows={3}
              style={inputStyle}
            />
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ReceiptTypes;

