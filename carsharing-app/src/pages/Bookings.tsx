import React, { useState, useMemo } from 'react';
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
  useIonViewWillEnter,
  isPlatform,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { bookingsService } from '../services/database';
import { Booking } from '../types';
import BookingCard from '../components/BookingCard';
import BookingCalendar from '../components/BookingCalendar';

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  // Initialisiere mit heutigem Datum im Format YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayString());
  const history = useHistory();

  // Lädt Buchungen jedes Mal, wenn die Seite angezeigt wird
  useIonViewWillEnter(() => {
    loadBookings();
  });

  const loadBookings = async () => {
    try {
      setLoading(true);
      // Holt nur aktive/zukünftige Buchungen (ende_datum >= heute)
      const data = await bookingsService.getAll();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtere Buchungen für den ausgewählten Tag
  const bookingsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    
    // String-Vergleich um Zeitzonen-Probleme zu vermeiden
    return bookings.filter(booking => {
      return selectedDate >= booking.start_datum && selectedDate <= booking.ende_datum;
    });
  }, [bookings, selectedDate]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadBookings();
    event.detail.complete();
  };

  const handleCreateBooking = () => {
    // Wenn ein Datum ausgewählt ist, übergebe es als Parameter
    if (selectedDate) {
      history.push(`/bookings/create?startDate=${selectedDate}`);
    } else {
      history.push('/bookings/create');
    }
  };

  const isIOS = isPlatform('ios');

  const handleDateSelect = (date: string) => {
    // Toggle: Klick auf gleichen Tag hebt Auswahl auf
    setSelectedDate(prev => prev === date ? null : date);
  };

  const formatSelectedDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Buchungen</IonTitle>
          {/* iOS: + Button im Header */}
          {isIOS && (
            <IonButtons slot="end">
              <IonButton onClick={handleCreateBooking}>
                <IonIcon icon={add} />
              </IonButton>
            </IonButtons>
          )}
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
        ) : (
          <>
            {/* Kalender */}
            <BookingCalendar 
              bookings={bookings}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />

            {/* Buchungen für ausgewählten Tag */}
            {selectedDate && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ marginBottom: '12px' }}>
                  {formatSelectedDate(selectedDate)}
                </h3>
                
                {bookingsForSelectedDate.length === 0 ? (
                  <IonText color="medium">
                    <p>Keine Buchungen an diesem Tag</p>
                  </IonText>
                ) : (
                  bookingsForSelectedDate.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onDelete={loadBookings}
                    />
                  ))
                )}
              </div>
            )}

            {/* Hinweis wenn kein Tag ausgewählt */}
            {!selectedDate && bookings.length > 0 && (
              <IonText color="medium" style={{ textAlign: 'center', display: 'block' }}>
                <p>Klicke auf einen Tag, um Buchungen anzuzeigen</p>
              </IonText>
            )}

            {/* Keine Buchungen vorhanden */}
            {bookings.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <IonText color="medium">
                  <p>Keine aktiven Buchungen</p>
                </IonText>
                <IonButton onClick={handleCreateBooking}>
                  <IonIcon slot="start" icon={add} />
                  Neue Buchung
                </IonButton>
              </div>
            )}
          </>
        )}

        {/* Android: FAB Button unten rechts */}
        {!isIOS && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleCreateBooking}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Bookings;

