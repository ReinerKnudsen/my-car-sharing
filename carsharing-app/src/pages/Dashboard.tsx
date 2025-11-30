import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
} from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import { useAuth } from '../contexts/AuthContext';
import { bookingsService, tripsService } from '../services/database';
import { Booking, Trip } from '../types';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [totalKm, setTotalKm] = useState<number>(0);
  const [myKm, setMyKm] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Load upcoming bookings
      const bookings = await bookingsService.getUpcoming();
      setUpcomingBookings(bookings.slice(0, 5));

      // Load recent trips
      const trips = await tripsService.getAll();
      setRecentTrips(trips.slice(0, 5));

      // Calculate total kilometers
      const total = await tripsService.getTotalKilometers();
      setTotalKm(total);

      // Calculate user's kilometers
      const userKm = await tripsService.getKilometersByFahrer(profile.id);
      setMyKm(userKm);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadDashboardData();
    event.detail.complete();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Dashboard</IonTitle>
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
            {/* Welcome Card */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>
                  Willkommen, {profile?.vorname} {profile?.name}! 🎉
                </IonCardTitle>
              </IonCardHeader>
              {profile?.gruppe && (
                <IonCardContent>
                  <IonText color="medium">
                    Gruppe: {profile.gruppe.bezeichnung}
                  </IonText>
                </IonCardContent>
              )}
            </IonCard>

            {/* Statistics Cards */}
            <IonGrid>
              <IonRow>
                <IonCol size="6">
                  <IonCard>
                    <IonCardContent>
                      <IonText color="medium">
                        <p style={{ margin: 0, fontSize: '0.9em' }}>Gesamt-Kilometer</p>
                      </IonText>
                      <h2 style={{ margin: '8px 0 0 0' }}>{totalKm.toLocaleString('de-DE')} km</h2>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
                <IonCol size="6">
                  <IonCard>
                    <IonCardContent>
                      <IonText color="medium">
                        <p style={{ margin: 0, fontSize: '0.9em' }}>Meine Kilometer</p>
                      </IonText>
                      <h2 style={{ margin: '8px 0 0 0' }}>{myKm.toLocaleString('de-DE')} km</h2>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              </IonRow>
            </IonGrid>

            {/* Upcoming Bookings */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Kommende Buchungen</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {upcomingBookings.length === 0 ? (
                  <IonText color="medium">
                    <p>Keine kommenden Buchungen</p>
                  </IonText>
                ) : (
                  upcomingBookings.map((booking) => (
                    <div key={booking.id} style={{ marginBottom: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                      <strong>{formatDate(booking.datum)} - {booking.uhrzeit}</strong>
                      <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                        {booking.fahrer?.vorname} {booking.fahrer?.name}
                      </p>
                    </div>
                  ))
                )}
              </IonCardContent>
            </IonCard>

            {/* Recent Trips */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Letzte Fahrten</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {recentTrips.length === 0 ? (
                  <IonText color="medium">
                    <p>Noch keine Fahrten</p>
                  </IonText>
                ) : (
                  recentTrips.map((trip) => (
                    <div key={trip.id} style={{ marginBottom: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                      <strong>{formatDate(trip.datum)}</strong>
                      <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                        {trip.fahrer?.vorname} {trip.fahrer?.name} - {trip.end_kilometer - trip.start_kilometer} km
                      </p>
                    </div>
                  ))
                )}
              </IonCardContent>
            </IonCard>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
