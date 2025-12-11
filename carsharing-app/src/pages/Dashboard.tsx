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
  IonText,
  IonToggle,
  IonInput,
  IonButton,
  IonIcon,
  useIonAlert,
  useIonToast,
  useIonViewWillEnter,
} from '@ionic/react';
import { car, checkmarkCircle } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useAuth } from '../contexts/AuthContext';
import { bookingsService, tripsService } from '../services/database';
import { Booking, Trip } from '../types';
import { formatDate } from '../utils/dateUtils';

// Typ für aktive Fahrt im localStorage
interface ActiveTrip {
  startKilometer: number;
  startedAt: string;
}

// LocalStorage Key
const ACTIVE_TRIP_KEY = 'carsharing_active_trip';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [totalKm, setTotalKm] = useState<number>(0);
  const [myKm, setMyKm] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [lastKilometer, setLastKilometer] = useState<number>(0);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [endKilometerInput, setEndKilometerInput] = useState<string>('');
  const [startKilometerInput, setStartKilometerInput] = useState<string>('');
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showStartDialog, setShowStartDialog] = useState(false);
  
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  // Lade aktive Fahrt aus localStorage beim Start
  useEffect(() => {
    const stored = localStorage.getItem(ACTIVE_TRIP_KEY);
    if (stored) {
      setActiveTrip(JSON.parse(stored));
    }
  }, []);

  // Lade Daten wenn profile verfügbar wird (wichtig für initialen Load)
  useEffect(() => {
    if (profile) {
      loadDashboardData();
    }
  }, [profile]);

  // Lade Daten jedes Mal wenn das Dashboard angezeigt wird (Tab-Wechsel)
  useIonViewWillEnter(() => {
    loadDashboardData();
  });

  const loadDashboardData = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Load upcoming bookings (max 4)
      const bookings = await bookingsService.getUpcoming();
      setUpcomingBookings(bookings.slice(0, 4));

      // Load recent trips (max 4)
      const trips = await tripsService.getAll();
      setRecentTrips(trips.slice(0, 4));

      // Lade letzten Kilometerstand
      const lastTrip = await tripsService.getLastTrip();
      if (lastTrip) {
        setLastKilometer(lastTrip.end_kilometer);
      }

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

  // Fahrt starten - Dialog öffnen
  const handleStartTrip = () => {
    setStartKilometerInput(lastKilometer.toString());
    setShowStartDialog(true);
  };

  // Fahrt wirklich starten (nach Bestätigung)
  const confirmStartTrip = async () => {
    if (!profile) return;

    const inputKm = parseInt(startKilometerInput, 10);
    
    if (isNaN(inputKm) || inputKm < lastKilometer) {
      presentToast({
        message: 'Kilometerstand muss mindestens dem letzten Stand entsprechen',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    try {
      // Wenn der eingegebene km-Stand größer als der letzte ist, erstelle eine "unbekannte" Fahrt
      if (inputKm > lastKilometer) {
        const today = new Date();
        const datum = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

        await tripsService.create({
          start_kilometer: lastKilometer,
          end_kilometer: inputKm,
          datum,
          fahrer_id: profile.id,
          kommentar: '⚠️ Nachgetragen - Fahrer unbekannt',
        });

        presentToast({
          message: `Fehlende Fahrt nachgetragen: ${lastKilometer.toLocaleString('de-DE')} → ${inputKm.toLocaleString('de-DE')} km`,
          duration: 3000,
          color: 'warning',
        });
      }

      // Jetzt die eigentliche Fahrt starten
      const newActiveTrip: ActiveTrip = {
        startKilometer: inputKm,
        startedAt: new Date().toISOString(),
      };
      localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(newActiveTrip));
      setActiveTrip(newActiveTrip);
      setLastKilometer(inputKm);
      setShowStartDialog(false);

      presentToast({
        message: `Fahrt gestartet bei ${inputKm.toLocaleString('de-DE')} km`,
        duration: 2000,
        color: 'success',
      });

      // Dashboard neu laden
      loadDashboardData();
    } catch (error: any) {
      presentToast({
        message: error.message || 'Fehler beim Starten',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  // Fahrt beenden - Dialog öffnen
  const handleEndTrip = () => {
    setEndKilometerInput('');
    setShowEndDialog(true);
  };

  // Fahrt speichern
  const saveTrip = async () => {
    if (!activeTrip || !profile) return;

    const endKm = parseInt(endKilometerInput, 10);
    
    if (isNaN(endKm) || endKm <= activeTrip.startKilometer) {
      presentToast({
        message: 'End-Kilometer muss größer als Start-Kilometer sein',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    try {
      // Heutiges Datum im Format YYYY-MM-DD
      const today = new Date();
      const datum = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

      await tripsService.create({
        start_kilometer: activeTrip.startKilometer,
        end_kilometer: endKm,
        datum,
        fahrer_id: profile.id,
        kommentar: null,
      });

      // Aktive Fahrt löschen
      localStorage.removeItem(ACTIVE_TRIP_KEY);
      setActiveTrip(null);
      setShowEndDialog(false);
      setLastKilometer(endKm);

      const distance = endKm - activeTrip.startKilometer;
      presentToast({
        message: `Fahrt beendet! ${distance} km gefahren`,
        duration: 2000,
        color: 'success',
      });

      // Dashboard neu laden
      loadDashboardData();
    } catch (error: any) {
      presentToast({
        message: error.message || 'Fehler beim Speichern',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  // Toggle Handler
  const handleToggleChange = (checked: boolean) => {
    if (checked && !activeTrip) {
      handleStartTrip();
    } else if (!checked && activeTrip) {
      handleEndTrip();
    }
  };

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadDashboardData();
    event.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>My CarSharing</IonTitle>
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
                 {profile ? `${profile.vorname} ${profile.name}` : 'Willkommen'}
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

            {/* Fahrt Slider */}
            <IonCard style={{ 
              background: activeTrip 
                ? '#ffc409' 
                : '#8ab21d',
              color: 'white'
            }}>
              <IonCardContent style={{ padding: '20px', color: '#000000' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <IonIcon icon={activeTrip ? checkmarkCircle : car} style={{ fontSize: '36px' }} />
                    <div>
                      <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>
                        {activeTrip ? 'Fahrt läuft' : 'Fahrt starten'}
                      </h2>
                      <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                        {activeTrip 
                          ? `Gestartet bei ${activeTrip.startKilometer.toLocaleString('de-DE')} km`
                          : `Letzter Stand: ${lastKilometer.toLocaleString('de-DE')} km`
                        }
                      </p>
                    </div>
                  </div>
                  <IonToggle
                    checked={!!activeTrip}
                    onIonChange={(e) => handleToggleChange(e.detail.checked)}
                    style={{ 
                      '--track-background': '#fff',
                      '--track-background-checked': '#fff',
                      '--handle-background': '#2f2f2f',
                      '--handle-background-checked': '#2f2f2f',
                      width: '60px',
                      height: '36px',
                      '--handle-width': '28px',
                      '--handle-height': '28px',
                    }}
                  />
                </div>
              </IonCardContent>
            </IonCard>

            {/* Start Trip Dialog */}
            {showStartDialog && !activeTrip && (
              <IonCard style={{ border: '2px solid var(--ion-color-primary)' }}>
                <IonCardHeader>
                  <IonCardTitle>Fahrt starten</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p style={{ marginBottom: '8px' }}>
                    Letzter Kilometerstand: <strong>{lastKilometer.toLocaleString('de-DE')} km</strong>
                  </p>
                  <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                    Falls der aktuelle Stand höher ist, wird eine fehlende Fahrt automatisch nachgetragen.
                  </p>
                  <IonInput
                    type="number"
                    label="Aktueller Kilometerstand *"
                    labelPlacement="floating"
                    fill="solid"
                    value={startKilometerInput}
                    onIonInput={(e) => setStartKilometerInput(e.detail.value!)}
                    style={{ 
                      marginBottom: '16px',
                      '--background': '#f4f5f8',
                      '--border-width': '1px',
                      '--border-style': 'solid',
                      '--border-color': '#d7d8da',
                      '--border-radius': '8px',
                    }}
                  />
                  {startKilometerInput && parseInt(startKilometerInput) > lastKilometer && (
                    <div style={{ 
                      padding: '12px', 
                      background: '#fff3e0', 
                      borderRadius: '8px',
                      marginBottom: '16px',
                      borderLeft: '4px solid #ff9800'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        ⚠️ Eine Fahrt von <strong>{lastKilometer.toLocaleString('de-DE')}</strong> → <strong>{parseInt(startKilometerInput).toLocaleString('de-DE')} km</strong> wird als "Fahrer unbekannt" nachgetragen.
                      </p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <IonButton 
                      expand="block" 
                      fill="outline" 
                      onClick={() => setShowStartDialog(false)}
                      style={{ flex: 1 }}
                    >
                      Abbrechen
                    </IonButton>
                    <IonButton 
                      expand="block" 
                      onClick={confirmStartTrip}
                      style={{ flex: 1 }}
                    >
                      Starten
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* End Trip Dialog */}
            {showEndDialog && activeTrip && (
              <IonCard style={{ border: '2px solid var(--ion-color-primary)' }}>
                <IonCardHeader>
                  <IonCardTitle>Fahrt beenden</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p style={{ marginBottom: '16px' }}>
                    Start-Kilometer: <strong>{activeTrip.startKilometer.toLocaleString('de-DE')} km</strong>
                  </p>
                  <IonInput
                    type="number"
                    label="End-Kilometer *"
                    labelPlacement="floating"
                    fill="solid"
                    value={endKilometerInput}
                    onIonInput={(e) => setEndKilometerInput(e.detail.value!)}
                    style={{ 
                      marginBottom: '16px',
                      '--background': '#f4f5f8',
                      '--border-width': '1px',
                      '--border-style': 'solid',
                      '--border-color': '#d7d8da',
                      '--border-radius': '8px',
                    }}
                  />
                  {endKilometerInput && parseInt(endKilometerInput) > activeTrip.startKilometer && (
                    <p style={{ 
                      padding: '12px', 
                      background: '#e3f2fd', 
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      Gefahrene Strecke: <strong>{(parseInt(endKilometerInput) - activeTrip.startKilometer).toLocaleString('de-DE')} km</strong>
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <IonButton 
                      expand="block" 
                      fill="outline" 
                      onClick={() => setShowEndDialog(false)}
                      style={{ flex: 1 }}
                    >
                      Abbrechen
                    </IonButton>
                    <IonButton 
                      expand="block" 
                      onClick={saveTrip}
                      style={{ flex: 1 }}
                    >
                      Speichern
                    </IonButton>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            

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
                      <strong>{formatDate(booking.start_datum, false)}, {booking.start_uhrzeit.slice(0,5)} bis {formatDate(booking.ende_datum, false)}, {booking.ende_uhrzeit.slice(0,5)}</strong>
                      <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                        {booking.gruppe?.bezeichnung}
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
                      <strong>{formatDate(trip.datum, false)}</strong>
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
