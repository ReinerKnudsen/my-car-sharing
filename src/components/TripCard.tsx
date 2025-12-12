import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonText,
  IonButton,
  IonIcon,
  IonBadge,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { Trip } from '../types';
import { tripsService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';

interface TripCardProps {
  trip: Trip;
  isFirst?: boolean; // Nur der erste Eintrag darf gelöscht werden
  onDelete?: () => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, isFirst = false, onDelete }) => {
  const { profile, isAdmin } = useAuth();
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();
 
  const distance = trip.end_kilometer - trip.start_kilometer;
  
  // Löschen erlaubt wenn:
  // - Admin ODER
  // - Erster Eintrag UND Fahrt gehört zur eigenen Gruppe
  const isSameGroup = trip.fahrer?.gruppe_id === profile?.gruppe_id;
  const canDelete = (isFirst && isSameGroup);

  const handleDelete = () => {
    presentAlert({
      header: 'Fahrt löschen',
      message: 'Möchten Sie diese Fahrt wirklich löschen?',
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
              await tripsService.delete(trip.id);
              present({
                message: 'Fahrt gelöscht',
                duration: 2000,
                color: 'success',
              });
              if (onDelete) onDelete();
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
    <IonCard>
      <IonCardHeader>
          <IonCardTitle>            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               {trip.start_kilometer.toLocaleString('de-DE')} → {trip.end_kilometer.toLocaleString('de-DE')}
               <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                 <IonBadge color="primary">{distance} km</IonBadge>
                 {trip.kosten !== null && trip.kosten !== undefined && (
                   <IonBadge color="success">{trip.kosten.toFixed(2)} €</IonBadge>
                 )}
               </div>
            </div></IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem lines="none">
          <IonLabel>
            <IonText color="medium">
              <p>Datum</p>
            </IonText>
            {formatDate(trip.datum, true)}
          </IonLabel>
        </IonItem>

        <IonItem lines="none">
          <IonLabel>
            <IonText color="medium">
              <p>Fahrer</p>
            </IonText>
            <h2>
              {trip.fahrer?.vorname} {trip.fahrer?.name} 
            </h2>
          </IonLabel>
          <IonLabel>
              <IonText color="medium">
                <p>Gruppe</p>
              </IonText>
              <h2>{trip.fahrer?.gruppe?.bezeichnung}</h2>
            </IonLabel>
        </IonItem>
        {trip.kommentar && (
          <IonItem lines="none">
            <IonLabel>
              <IonText color="medium">
                <p>Kommentar</p>
              </IonText>
              <h2>{trip.kommentar}</h2>
            </IonLabel>
          </IonItem>
        )}

        {canDelete && (
          <IonButton
            expand="block"
            color="danger"
            fill="outline"
            onClick={handleDelete}
            style={{ marginTop: '10px' }}
          >
            <IonIcon slot="start" icon={trashOutline} />
            Löschen
          </IonButton>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default TripCard;

