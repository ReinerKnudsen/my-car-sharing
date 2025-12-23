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
  IonText,
  IonFab,
  IonFabButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButtons,
  useIonViewWillEnter,
  isPlatform,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Trip } from '../types';
import TripCard from '../components/TripCard';

const Trips: React.FC = () => {
  const { trips, loading, refreshTrips } = useData();
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<'all' | 'mine'>('mine');
  const { profile } = useAuth();
  const history = useHistory();

  // Lädt Fahrten jedes Mal, wenn die Seite angezeigt wird
  useIonViewWillEnter(() => {
    refreshTrips();
  });

  useEffect(() => {
    filterTrips();
  }, [trips, filter, profile]);

  const filterTrips = () => {
    let filtered = [...trips];

    if (filter === 'mine' && profile) {
      filtered = trips.filter((t) => t.fahrer?.gruppe_id === profile.gruppe_id);
    }

    setFilteredTrips(filtered);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await refreshTrips();
    event.detail.complete();
  };

  const handleCreateTrip = () => {
    history.push('/trips/create');
  };

  const isIOS = isPlatform('ios');

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Fahrten</IonTitle>
          {/* iOS: + Button im Header */}
          {isIOS && (
            <IonButtons slot="end">
              <IonButton onClick={handleCreateTrip}>
                <IonIcon icon={add} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as any)}>
            <IonSegmentButton value="mine">
              <IonLabel>Unsere Fahrten</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="all">
              <IonLabel>Alle</IonLabel>
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
            <p>Lädt Fahrten...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonText color="medium">
              <p>Keine Fahrten vorhanden</p>
            </IonText>
            <IonButton onClick={handleCreateTrip}>
              <IonIcon slot="start" icon={add} />
              Neue Fahrt
            </IonButton>
          </div>
        ) : (
          filteredTrips.map((trip) => {
            // Nur der Trip mit dem höchsten end_kilometer darf gelöscht werden
            const isLastTrip = trips.length > 0 && trip.id === trips[0]?.id;
            return (
              <TripCard key={trip.id} trip={trip} isFirst={isLastTrip} onDelete={refreshTrips} />
            );
          })
        )}

        {/* Android: FAB Button unten rechts */}
        {!isIOS && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={handleCreateTrip}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Trips;
