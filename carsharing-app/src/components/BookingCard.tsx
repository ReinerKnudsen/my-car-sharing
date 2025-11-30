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
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { Booking } from '../types';
import { bookingsService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

interface BookingCardProps {
  booking: Booking;
  onDelete?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onDelete }) => {
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

  const canDelete = isAdmin || booking.fahrer_id === profile?.id;

  const handleDelete = () => {
    presentAlert({
      header: 'Buchung löschen',
      message: 'Möchten Sie diese Buchung wirklich löschen?',
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
              await bookingsService.delete(booking.id);
              present({
                message: 'Buchung gelöscht',
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
        <IonCardTitle>{formatDate(booking.datum)}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem lines="none">
          <IonLabel>
            <IonText color="medium">
              <p>Uhrzeit</p>
            </IonText>
            <h2>{booking.uhrzeit}</h2>
          </IonLabel>
        </IonItem>

        <IonItem lines="none">
          <IonLabel>
            <IonText color="medium">
              <p>Fahrer</p>
            </IonText>
            <h2>
              {booking.fahrer?.vorname} {booking.fahrer?.name}
            </h2>
          </IonLabel>
        </IonItem>

        {booking.gruppe && (
          <IonItem lines="none">
            <IonLabel>
              <IonText color="medium">
                <p>Gruppe</p>
              </IonText>
              <h2>{booking.gruppe.bezeichnung}</h2>
            </IonLabel>
          </IonItem>
        )}

        {booking.kommentar && (
          <IonItem lines="none">
            <IonLabel>
              <IonText color="medium">
                <p>Kommentar</p>
              </IonText>
              <p>{booking.kommentar}</p>
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

export default BookingCard;

