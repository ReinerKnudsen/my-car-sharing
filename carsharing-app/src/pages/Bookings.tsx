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
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { bookingsService } from '../services/database';
import { Booking } from '../types';
import BookingCard from '../components/BookingCard';

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const history = useHistory();

  useEffect(() => {
    // Kommentiert für jetzt - manuell laden
    // loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingsService.getAll();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    
    let filtered = [...bookings];
    
    if (filter === 'upcoming') {
      filtered = bookings.filter((b) => b.datum >= today);
    } else if (filter === 'past') {
      filtered = bookings.filter((b) => b.datum < today);
    }
    
    setFilteredBookings(filtered);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadBookings();
    event.detail.complete();
  };

  const handleCreateBooking = () => {
    history.push('/bookings/create');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Buchungen</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as any)}>
            <IonSegmentButton value="upcoming">
              <IonLabel>Kommend</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="all">
              <IonLabel>Alle</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="past">
              <IonLabel>Vergangen</IonLabel>
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
        ) : filteredBookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonText color="medium">
              <p>Keine Buchungen vorhanden</p>
            </IonText>
            <IonButton onClick={handleCreateBooking}>
              <IonIcon slot="start" icon={add} />
              Neue Buchung
            </IonButton>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onDelete={loadBookings}
            />
          ))
        )}

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={handleCreateBooking}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
};

export default Bookings;

