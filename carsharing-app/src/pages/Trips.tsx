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
  IonButtons,
  useIonViewWillEnter,
  isPlatform,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { tripsService } from '../services/database';
import { Trip } from '../types';
import TripCard from '../components/TripCard';

const Trips: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const { profile } = useAuth();
  const history = useHistory();

  // Lädt Fahrten jedes Mal, wenn die Seite angezeigt wird
  useIonViewWillEnter(() => {
    loadTrips();
  });

  useEffect(() => {
    filterTrips();
  }, [trips, filter, profile]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const data = await tripsService.getAll();
      setTrips(data);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTrips = () => {
    let filtered = [...trips];
    
    if (filter === 'mine' && profile) {
      filtered = trips.filter((t) => t.fahrer_id === profile.id);
    }
    
    setFilteredTrips(filtered);
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadTrips();
    event.detail.complete();
  };

  const handleCreateTrip = () => {
    history.push('/trips/create');
  };

  const isIOS = isPlatform('ios');

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
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
            <IonSegmentButton value="all">
              <IonLabel>Alle</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="mine">
              <IonLabel>Meine Fahrten</IonLabel>
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
          filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onDelete={loadTrips}
            />
          ))
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

