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
import { trashOutline, createOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Booking } from '../types';
import { bookingsService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';

interface BookingCardProps {
  booking: Booking;
  onDelete?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onDelete }) => {
  const { profile, isAdmin } = useAuth();
  const [presentAlert] = useIonAlert();
  const [present] = useIonToast();
  const history = useHistory();

  // Zeit kommt als "HH:MM:SS" aus der DB - zeige nur "HH:MM"
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // "14:30:00" → "14:30"
  };

  const canDelete = isAdmin || booking.fahrer_id === profile?.id;
  const canEdit = booking.gruppe_id === profile?.gruppe_id; // Alle Gruppenmitglieder können bearbeiten

  const handleEdit = () => {
    history.push(`/bookings/create?edit=${booking.id}`);
  };

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
        <IonCardTitle className="small-card-title">{booking.gruppe?.bezeichnung}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <IonLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <IonText color="medium" className="small-padding">
                <p>Start</p>
              </IonText>
              <IonText color="primary">
                <p style={{ fontWeight: 'bold' }}>
                  {formatDate(booking.start_datum, true)} um {formatTime(booking.start_uhrzeit)}
                </p>
              </IonText>
            </div>
          </IonLabel>
          <IonLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <IonText color="medium">
                <p>Ende</p>
              </IonText>
              <IonText color="primary">
                <p style={{ fontWeight: 'bold' }}>
                  {formatDate(booking.ende_datum, true)} um {formatTime(booking.ende_uhrzeit)}
                </p>
              </IonText>
            </div>
          </IonLabel>
        </div>

        {booking.kommentar && canEdit && (
          <div style={{ padding: '16px 0px' }}>
            <IonLabel>
              <IonText color="medium">
                <p>Kommentar</p>
              </IonText>
              <p>{booking.kommentar}</p>
            </IonLabel>
          </div>
        )}

        {booking.gruppe && (
          <div style={{ padding: '16px 0px' }}>
            <IonLabel>
              <IonText color="medium">
                <p>
                  Erstellt von {booking.fahrer?.vorname} {booking.fahrer?.name}
                </p>
              </IonText>
            </IonLabel>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {canEdit && (
            <IonButton
              expand="block"
              color="primary"
              fill="outline"
              onClick={handleEdit}
              style={{ flex: 1 }}
            >
              <IonIcon slot="start" icon={createOutline} />
              Bearbeiten
            </IonButton>
          )}
          {canDelete && (
            <IonButton
              expand="block"
              color="danger"
              fill="outline"
              onClick={handleDelete}
              style={{ flex: canEdit ? 1 : undefined }}
            >
              <IonIcon slot="start" icon={trashOutline} />
              Löschen
            </IonButton>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default BookingCard;
