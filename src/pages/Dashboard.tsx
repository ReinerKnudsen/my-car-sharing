import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  useIonViewWillEnter,
} from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  DashboardSkeleton,
  WelcomeCard,
  TripControl,
  UpcomingBookings,
  RecentTrips,
  GroupCosts,
} from '../components/dashboard';

interface ActiveTrip {
  startKilometer: number;
  startedAt: string;
}

const ACTIVE_TRIP_KEY = 'carsharing_active_trip';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const {
    bookings,
    trips,
    lastKilometer: contextLastKm,
    groupCosts,
    driverCosts,
    kostenProKm,
    loading,
    refreshAll,
    refreshDashboard,
  } = useData();

  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [lastKilometer, setLastKilometer] = useState<number>(contextLastKm);

  const upcomingBookings = bookings.slice(0, 4);
  const recentTrips = trips.slice(0, 4);

  useEffect(() => {
    setLastKilometer(contextLastKm);
  }, [contextLastKm]);

  useEffect(() => {
    const stored = localStorage.getItem(ACTIVE_TRIP_KEY);
    if (stored) {
      setActiveTrip(JSON.parse(stored));
    }
  }, []);

  useIonViewWillEnter(() => {
    if (!profile) return;
    refreshAll();
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshAll();
    event.detail.complete();
  };

  const handleTripStart = (trip: ActiveTrip) => {
    setActiveTrip(trip);
    setLastKilometer(trip.startKilometer);
  };

  const handleTripEnd = () => {
    setActiveTrip(null);
  };

  const handleTripRefresh = async () => {
    await refreshDashboard();
  };

  if (!profile) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Dashboard</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <p>Profil wird geladen...</p>
        </IonContent>
      </IonPage>
    );
  }

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
          <DashboardSkeleton />
        ) : (
          <>
            <WelcomeCard profile={profile} />

            <TripControl
              activeTrip={activeTrip}
              lastKilometer={lastKilometer}
              kostenProKm={kostenProKm}
              profileId={profile.id}
              onTripStart={handleTripStart}
              onTripEnd={handleTripEnd}
              onRefresh={handleTripRefresh}
            />

            <UpcomingBookings bookings={upcomingBookings} onRefresh={refreshDashboard} />

            <RecentTrips trips={recentTrips} />

            {profile.gruppe_id && groupCosts && (
              <GroupCosts
                groupCosts={groupCosts}
                driverCosts={driverCosts || []}
                groupName={profile.gruppe?.bezeichnung}
                currentUserId={profile.id}
              />
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
