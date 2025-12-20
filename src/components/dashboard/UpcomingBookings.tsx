import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText } from '@ionic/react';
import { Booking } from '../../types';
import BookingCard from '../BookingCard';

interface UpcomingBookingsProps {
  bookings: Booking[];
  onRefresh?: () => void;
}

const UpcomingBookings: React.FC<UpcomingBookingsProps> = ({ bookings, onRefresh }) => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle className="small-card-title">Kommende Buchungen</IonCardTitle>
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
