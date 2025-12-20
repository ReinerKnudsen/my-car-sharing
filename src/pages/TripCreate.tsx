import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonTextarea,
  IonButton,
  IonSpinner,
  IonBackButton,
  IonButtons,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { tripsService } from '../services/database';
import { settingsService } from '../services/settings.service';
import { Trip } from '../types';

// Heutiges Datum als YYYY-MM-DD String
const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
};

const TripCreate: React.FC = () => {
  const [startKilometer, setStartKilometer] = useState<string>('');
  const [endKilometer, setEndKilometer] = useState<string>('');
  const [datum, setDatum] = useState<string>(getTodayString());
  const [kommentar, setKommentar] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [lastTrip, setLastTrip] = useState<Trip | null>(null);
  const [kostenProKm, setKostenProKm] = useState<number>(0.3);
  const { profile } = useAuth();
  const { refreshTrips, refreshDashboard } = useData();
  const history = useHistory();
  const [present] = useIonToast();

  // Lade die letzte Fahrt und Kostensatz beim Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [trip, costRate] = await Promise.all([
          tripsService.getLastTrip(),
          settingsService.getKostenProKm(),
        ]);
        if (trip) {
          setLastTrip(trip);
          setStartKilometer(trip.end_kilometer.toString());
        }
        setKostenProKm(costRate);
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!datum || !startKilometer || !endKilometer) {
      present({
        message: 'Bitte alle Pflichtfelder ausfüllen',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    if (!profile) {
      present({
        message: 'Benutzer nicht gefunden',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    const startKm = parseInt(startKilometer, 10);
    const endKm = parseInt(endKilometer, 10);

    if (isNaN(startKm) || isNaN(endKm)) {
      present({
        message: 'Bitte gültige Kilometerwerte eingeben',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    if (endKm <= startKm) {
      present({
        message: 'End-Kilometer muss größer als Start-Kilometer sein',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    // Datum darf nicht in der Zukunft liegen
    if (datum > getTodayString()) {
      present({
        message: 'Das Datum darf nicht in der Zukunft liegen',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const tripDistance = endKm - startKm;
      const kosten = tripDistance * kostenProKm;

      await tripsService.create({
        start_kilometer: startKm,
        end_kilometer: endKm,
        datum,
        fahrer_id: profile.id,
        kommentar: kommentar || null,
        kosten,
      });

      present({
        message: 'Fahrt erfolgreich gespeichert!',
        duration: 2000,
        color: 'success',
      });

      // Aktualisiere Trips und Dashboard im Context
      await refreshTrips();
      await refreshDashboard();

      // Kurze Verzögerung um sicherzustellen, dass DB-Write committed ist
      setTimeout(() => {
        history.goBack();
      }, 300);
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Erstellen der Fahrt',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const startKm = parseInt(startKilometer, 10) || 0;
  const endKm = parseInt(endKilometer, 10) || 0;
  const distance = endKm > startKm ? endKm - startKm : 0;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/trips" />
          </IonButtons>
          <IonTitle>Neue Fahrt</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Fahrt eintragen</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <form onSubmit={handleSubmit} noValidate>
              <IonInput
                type="date"
                label="Datum *"
                labelPlacement="floating"
                fill="solid"
                value={datum}
                max={getTodayString()}
                onIonInput={(e) => setDatum(e.detail.value!)}
                required
                style={{
                  marginBottom: '16px',
                  '--background': '#f4f5f8',
                  '--border-width': '1px',
                  '--border-style': 'solid',
                  '--border-color': '#d7d8da',
                  '--border-radius': '8px',
                  '--padding-start': '16px',
                  '--padding-end': '16px',
                }}
              />

              <IonInput
                type="number"
                label="Start-Kilometer *"
                labelPlacement="floating"
                fill="solid"
                value={startKilometer}
                onIonInput={(e) => setStartKilometer(e.detail.value!)}
                required
                style={{
                  marginBottom: '16px',
                  '--background': '#f4f5f8',
                  '--border-width': '1px',
                  '--border-style': 'solid',
                  '--border-color': '#d7d8da',
                  '--border-radius': '8px',
                  '--padding-start': '16px',
                  '--padding-end': '16px',
                }}
              />

              <IonInput
                type="number"
                label="End-Kilometer *"
                labelPlacement="floating"
                fill="solid"
                value={endKilometer}
                onIonInput={(e) => setEndKilometer(e.detail.value!)}
                required
                style={{
                  marginBottom: '16px',
                  '--background': '#f4f5f8',
                  '--border-width': '1px',
                  '--border-style': 'solid',
                  '--border-color': '#d7d8da',
                  '--border-radius': '8px',
                  '--padding-start': '16px',
                  '--padding-end': '16px',
                }}
              />

              <IonTextarea
                label="Kommentar"
                labelPlacement="floating"
                fill="solid"
                value={kommentar}
                onIonInput={(e) => setKommentar(e.detail.value!)}
                rows={3}
                style={{
                  marginBottom: '16px',
                  '--background': '#f4f5f8',
                  '--border-width': '1px',
                  '--border-style': 'solid',
                  '--border-color': '#d7d8da',
                  '--border-radius': '8px',
                  '--padding-start': '16px',
                  '--padding-end': '16px',
                }}
              />

              {distance > 0 && (
                <div
                  style={{
                    padding: '12px',
                    background: '#e3f2fd',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <p style={{ margin: 0, color: '#1976d2' }}>
                    Gefahrene Strecke: <strong>{distance.toLocaleString('de-DE')} km</strong>
                  </p>
                  <p style={{ margin: '8px 0 0 0', color: 'var(--ion-color-success)' }}>
                    Kosten: <strong>{(distance * kostenProKm).toFixed(2)} €</strong>
                  </p>
                </div>
              )}

              <IonButton
                expand="block"
                type="submit"
                disabled={loading}
                style={{ marginTop: '20px' }}
              >
                {loading ? <IonSpinner name="crescent" /> : 'Fahrt erstellen'}
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default TripCreate;
