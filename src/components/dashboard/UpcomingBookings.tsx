import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonIcon,
} from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Booking } from '../../types';
import BookingCard from '../BookingCard';

interface UpcomingBookingsProps {
  bookings: Booking[];
  onRefresh?: () => void;
}

const UpcomingBookings: React.FC<UpcomingBookingsProps> = ({ bookings, onRefresh }) => {
  const history = useHistory();

  return (
    <IonCard>
      <IonCardHeader onClick={() => history.push('/bookings')} style={{ cursor: 'pointer' }}>
        <IonCardTitle
          className="small-card-title"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          Kommende Buchungen
          <IonIcon
            icon={chevronForwardOutline}
            style={{ fontSize: '18px', color: 'var(--ion-color-medium)' }}
          />
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {bookings.length === 0 ? (
          <IonText color="medium">
            <p>Keine kommenden Buchungen</p>
          </IonText>
        ) : (
          bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onDelete={onRefresh} />
          ))
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default UpcomingBookings;
