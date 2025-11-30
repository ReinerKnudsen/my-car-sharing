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

interface TripCardProps {
  trip: Trip;
  onDelete?: () => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onDelete }) => {
  const { profile, isAdmin } = useAuth();
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const distance = trip.end_kilometer - trip.start_kilometer;
  const canDelete = isAdmin || trip.fahrer_id === profile?.id;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <IonCardTitle>{formatDate(trip.datum)}</IonCardTitle>
          <IonBadge color="primary">{distance} km</IonBadge>
        </div>
      </IonCardHeader>
      <IonCardContent>
        <IonItem lines="none">
          <IonLabel>
            <IonText color="medium">
              <p>Fahrer</p>
            </IonText>
            <h2>
              {trip.fahrer?.vorname} {trip.fahrer?.name}
            </h2>
          </IonLabel>
        </IonItem>

        <IonItem lines="none">
          <IonLabel>
            <IonText color="medium">
              <p>Kilometer</p>
            </IonText>
            <h2>
              {trip.start_kilometer.toLocaleString('de-DE')} km → {trip.end_kilometer.toLocaleString('de-DE')} km
            </h2>
          </IonLabel>
        </IonItem>

        {trip.fahrer?.gruppe && (
          <IonItem lines="none">
            <IonLabel>
              <IonText color="medium">
                <p>Gruppe</p>
              </IonText>
              <h2>{trip.fahrer.gruppe.bezeichnung}</h2>
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

