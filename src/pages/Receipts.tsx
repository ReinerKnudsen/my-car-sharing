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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButtons,
  IonCard,
  IonCardContent,
  IonBadge,
  useIonViewWillEnter,
  useIonAlert,
  useIonToast,
  isPlatform,
} from '@ionic/react';
import { add, trashOutline, receiptOutline } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { receiptService } from '../services/receipt.service';
import { Receipt } from '../types';
import { formatDate } from '../utils/dateUtils';

const Receipts: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'gruppe' | 'alle'>('gruppe');
  const { profile, isAdmin } = useAuth();
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  useIonViewWillEnter(() => {
    loadReceipts();
  });

  useEffect(() => {
    loadReceipts();
  }, [filter, profile]);

  const loadReceipts = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      let data: Receipt[];
      
      if (filter === 'alle' && isAdmin) {
        data = await receiptService.getAll();
      } else if (profile.gruppe_id) {
        data = await receiptService.getByGroup(profile.gruppe_id);
      } else {
        data = [];
      }
      
      setReceipts(data);
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadReceipts();
    event.detail.complete();
  };

  const handleCreateReceipt = () => {
    history.push('/receipts/create');
  };

  const handleDelete = async (receipt: Receipt) => {
    // Prüfe ob innerhalb von 24h oder Admin
    const createdAt = new Date(receipt.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const canDelete = isAdmin || receipt.fahrer_id === profile?.id && hoursSinceCreation < 24;

    if (!canDelete) {
      presentToast({
        message: 'Belege können nur innerhalb von 24 Stunden gelöscht werden',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    presentAlert({
      header: 'Beleg löschen',
      message: `Möchtest du den Beleg vom ${formatDate(receipt.datum, false)} über ${receipt.betrag.toFixed(2)} € wirklich löschen?`,
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Löschen',
          role: 'destructive',
          handler: async () => {
            try {
              await receiptService.delete(receipt.id);
              presentToast({
                message: 'Beleg gelöscht',
                duration: 2000,
                color: 'success',
              });
              loadReceipts();
            } catch (error: any) {
              presentToast({
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

  const isIOS = isPlatform('ios');

  // Berechne Gesamtsumme
  const totalAmount = receipts.reduce((sum, r) => sum + r.betrag, 0);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Belege</IonTitle>
          {isIOS && profile?.gruppe_id && (
            <IonButtons slot="end">
              <IonButton onClick={handleCreateReceipt}>
                <IonIcon icon={add} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
        {isAdmin && (
          <IonToolbar>
            <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as any)}>
              <IonSegmentButton value="gruppe">
                <IonLabel>Meine Gruppe</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="alle">
                <IonLabel>Alle Gruppen</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </IonToolbar>
        )}
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {!profile?.gruppe_id && !isAdmin ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonText color="medium">
              <p>Du bist keiner Gruppe zugeordnet</p>
            </IonText>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <IonSpinner />
          </div>
        ) : receipts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonIcon icon={receiptOutline} style={{ fontSize: '64px', color: '#ccc' }} />
            <IonText color="medium">
              <p>Keine Belege vorhanden</p>
            </IonText>
            {profile?.gruppe_id && (
              <IonButton onClick={handleCreateReceipt}>
                <IonIcon slot="start" icon={add} />
                Neuer Beleg
              </IonButton>
            )}
          </div>
        ) : (
          <>
            {/* Zusammenfassung */}
            <IonCard style={{ marginBottom: '16px' }}>
              <IonCardContent style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '12px 16px'
              }}>
                <div>
                  <IonText color="medium" style={{ fontSize: '14px' }}>
                    {receipts.length} Beleg{receipts.length !== 1 ? 'e' : ''}
                  </IonText>
                </div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: 'var(--ion-color-danger)' 
                }}>
                  {totalAmount.toFixed(2)} €
                </div>
              </IonCardContent>
            </IonCard>

            {/* Belege Liste */}
            {receipts.map((receipt) => (
              <ReceiptCard 
                key={receipt.id} 
                receipt={receipt} 
                onDelete={() => handleDelete(receipt)}
                showGroup={filter === 'alle'}
                currentUserId={profile?.id}
                isAdmin={isAdmin}
              />
            ))}
          </>
        )}

        {/* Android: FAB Button */}
        {!isIOS && profile?.gruppe_id && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleCreateReceipt}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}
      </IonContent>
    </IonPage>
  );
};

// Einzelne Beleg-Karte
interface ReceiptCardProps {
  receipt: Receipt;
  onDelete: () => void;
  showGroup: boolean;
  currentUserId?: string;
  isAdmin: boolean;
}

const ReceiptCard: React.FC<ReceiptCardProps> = ({ 
  receipt, 
  onDelete, 
  showGroup, 
  currentUserId,
  isAdmin 
}) => {
  // Kann innerhalb von 24h gelöscht werden oder von Admin
  const createdAt = new Date(receipt.created_at);
  const now = new Date();
  const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  const canDelete = isAdmin || (receipt.fahrer_id === currentUserId && hoursSinceCreation < 24);

  return (
    <IonCard style={{ margin: '0 0 12px 0' }}>
      <IonCardContent style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            {/* Datum und Art */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold' }}>
                {formatDate(receipt.datum, false)}
              </span>
              <IonBadge color="medium">
                {receipt.receipt_type?.bezeichnung || 'Unbekannt'}
              </IonBadge>
            </div>
            
            {/* Fahrer */}
            <div style={{ color: '#666', fontSize: '14px' }}>
              {receipt.fahrer?.vorname} {receipt.fahrer?.name}
              {showGroup && receipt.gruppe && (
                <span style={{ marginLeft: '8px', color: '#999' }}>
                  • {receipt.gruppe.bezeichnung}
                </span>
              )}
            </div>
            
            {/* Kommentar */}
            {receipt.kommentar && (
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#888', fontStyle: 'italic' }}>
                {receipt.kommentar}
              </div>
            )}
          </div>
          
          {/* Betrag und Löschen */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: 'var(--ion-color-danger)',
              marginBottom: '8px'
            }}>
              {receipt.betrag.toFixed(2)} €
            </div>
            {canDelete && (
              <IonButton 
                fill="clear" 
                size="small" 
                color="danger"
                onClick={onDelete}
              >
                <IonIcon icon={trashOutline} />
              </IonButton>
            )}
          </div>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default Receipts;

