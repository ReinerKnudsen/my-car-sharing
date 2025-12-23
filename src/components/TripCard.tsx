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
import { trashOutline, handLeftOutline } from 'ionicons/icons';
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

  // Nachgetragene Fahrt erkennen (kein Fahrer zugewiesen)
  const isUnclaimed = !trip.fahrer_id;

  // Löschen erlaubt wenn:
  // - Admin ODER
  // - Erster Eintrag UND Fahrt gehört zur eigenen Gruppe
  const isSameGroup = trip.fahrer?.gruppe_id === profile?.gruppe_id;
  const canDelete = isFirst && isSameGroup;

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

  const handleClaimTrip = () => {
    presentAlert({
      header: 'Fahrt übernehmen',
      message: 'Bist Du sicher, dass Du die Fahrt in Dein Konto übernehmen willst?',
      buttons: [
        {
          text: 'Nein',
          role: 'cancel',
        },
        {
          text: 'Ja',
          handler: async () => {
            try {
              if (!profile?.id || !profile?.gruppe_id) {
                throw new Error('Profil nicht vollständig geladen');
              }

              await tripsService.update(trip.id, {
                fahrer_id: profile.id,
                kommentar: '',
              });

              present({
                message: 'Fahrt erfolgreich übernommen!',
                duration: 2000,
                color: 'success',
              });

              if (onDelete) onDelete();
            } catch (error: any) {
              present({
                message: error.message || 'Fehler beim Beanspruchen',
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
    <IonCard
      style={isUnclaimed ? { borderLeft: '4px solid #ff9800', backgroundColor: '#fff3e0' } : {}}
    >
      <IonCardHeader>
        <IonCardTitle className="small-card-title">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            {trip.start_kilometer.toLocaleString('de-DE')} →{' '}
            {trip.end_kilometer.toLocaleString('de-DE')}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'end' }}
            >
              <IonBadge className="badge-indicator km">{distance} km</IonBadge>
              {trip.kosten !== null && trip.kosten !== undefined && (
                <IonBadge className="badge-indicator price">{trip.kosten.toFixed(2)} €</IonBadge>
              )}
            </div>
          </div>
        </IonCardTitle>
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
              {isUnclaimed ? (
                <IonText color="warning" style={{ fontWeight: 'bold' }}>
                  ⚠️
                </IonText>
              ) : (
                `${trip.fahrer?.vorname} ${trip.fahrer?.name}`
              )}
            </h2>
          </IonLabel>
          <IonLabel>
            <IonText color="medium">
              <p>Gruppe</p>
            </IonText>
            <h2>
              {isUnclaimed ? (
                <IonText color="warning" style={{ fontWeight: 'bold' }}>
                  -
                </IonText>
              ) : (
                trip.fahrer?.gruppe?.bezeichnung
              )}
            </h2>
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

        {isUnclaimed && (
          <IonButton
            expand="block"
            color="warning"
            onClick={handleClaimTrip}
            style={{ marginTop: '10px' }}
          >
            <IonIcon slot="start" icon={handLeftOutline} />
            Fahrt übernehmen
          </IonButton>
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
