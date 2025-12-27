import React, { useState, useEffect, useCallback } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonInput,
  IonButton,
  IonToggle,
  useIonToast,
} from '@ionic/react';
import { car, checkmarkCircle, alertCircle } from 'ionicons/icons';
import { tripsService, activeTripsService } from '../../services/database';
import { ActiveTrip as DbActiveTrip } from '../../types';

interface LocalActiveTrip {
  startKilometer: number;
  startedAt: string;
}

interface TripControlProps {
  activeTrip: LocalActiveTrip | null;
  lastKilometer: number;
  kostenProKm: number;
  profileId: string;
  gruppeId: string;
  onTripStart: (trip: LocalActiveTrip) => void;
  onTripEnd: () => void;
  onRefresh: () => void;
}

const ACTIVE_TRIP_KEY = 'carsharing_active_trip';

const TripControl: React.FC<TripControlProps> = ({
  activeTrip,
  lastKilometer,
  kostenProKm,
  profileId,
  gruppeId,
  onTripStart,
  onTripEnd,
  onRefresh,
}) => {
  const [startKilometerInput, setStartKilometerInput] = useState<string>('');
  const [endKilometerInput, setEndKilometerInput] = useState<string>('');
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [dbActiveTrip, setDbActiveTrip] = useState<DbActiveTrip | null>(null);
  const [presentToast] = useIonToast();

  const loadActiveTrip = useCallback(async () => {
    try {
      // Lade JEDE aktive Fahrt (nicht nur die der eigenen Gruppe)
      const data = await activeTripsService.getAny();
      setDbActiveTrip(data);
    } catch (error) {
      console.error('Fehler beim Laden der aktiven Fahrt:', error);
    }
  }, []);

  useEffect(() => {
    loadActiveTrip();
  }, [loadActiveTrip]);

  const getTimeSinceStart = (startedAt: string): string => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `seit ${diffDays} Tag${diffDays > 1 ? 'en' : ''}`;
    } else if (diffHours > 0) {
      return `seit ${diffHours} Std.`;
    } else {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `seit ${diffMins} Min.`;
    }
  };

  const confirmStartTrip = async () => {
    const inputKm = parseInt(startKilometerInput);

    if (isNaN(inputKm)) {
      presentToast({
        message: 'Bitte gültigen Kilometerstand eingeben',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    if (inputKm < lastKilometer) {
      presentToast({
        message: 'Der Kilometerstand darf nicht kleiner sein als der letzte gespeicherte.',
        duration: 3000,
        color: 'warning',
      });
      setStartKilometerInput(lastKilometer.toString());
      return;
    }

    try {
      const today = new Date();
      const datum = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

      // WICHTIG: Lade aktuelle aktive Fahrt aus DB (könnte sich geändert haben)
      const currentActiveTrip = await activeTripsService.getAny();

      // Wenn eine andere Fahrt läuft, erstelle Differenzfahrt (nachgetragen)
      if (currentActiveTrip && currentActiveTrip.fahrer_id !== profileId) {
        const distance = inputKm - currentActiveTrip.start_kilometer;
        const kosten = distance * kostenProKm;

        // Erstelle nachgetragene Fahrt (fahrer_id = NULL)
        await tripsService.create({
          start_kilometer: currentActiveTrip.start_kilometer,
          end_kilometer: inputKm,
          datum,
          fahrer_id: null,
          kommentar: `⚠️ Gestartet und nicht beendet von ${currentActiveTrip.fahrer?.vorname}`,
          kosten,
        });

        // Lösche aktive Aufzeichnung von Fahrer 1
        await activeTripsService.delete(currentActiveTrip.id);

        presentToast({
          message: `Differenzfahrt erstellt - ${currentActiveTrip.fahrer?.vorname} kann diese beanspruchen`,
          duration: 3000,
          color: 'warning',
        });
      }
      // Wenn eigene Fahrt läuft, beende sie auch
      else if (activeTrip) {
        const distance = inputKm - activeTrip.startKilometer;
        const kosten = distance * kostenProKm;

        await tripsService.create({
          start_kilometer: activeTrip.startKilometer,
          end_kilometer: inputKm,
          datum,
          fahrer_id: profileId,
          kommentar: null,
          kosten,
        });

        if (currentActiveTrip) {
          await activeTripsService.delete(currentActiveTrip.id);
        }
        localStorage.removeItem(ACTIVE_TRIP_KEY);
        onTripEnd();

        presentToast({
          message: 'Vorherige Fahrt beendet',
          duration: 2000,
          color: 'success',
        });
      }
      // Prüfe auf fehlende Kilometer
      else if (inputKm > lastKilometer && !currentActiveTrip) {
        const distance = inputKm - lastKilometer;
        const kosten = distance * kostenProKm;

        await tripsService.create({
          start_kilometer: lastKilometer,
          end_kilometer: inputKm,
          datum,
          fahrer_id: null,
          kommentar: '⚠️ Nachgetragen - Fahrer unbekannt',
          kosten,
        });

        presentToast({
          message: `Fehlende Fahrt nachgetragen: ${lastKilometer.toLocaleString('de-DE')} → ${inputKm.toLocaleString('de-DE')} km`,
          duration: 3000,
          color: 'warning',
        });
      }

      // Starte neue Fahrt
      const newActiveTrip: LocalActiveTrip = {
        startKilometer: inputKm,
        startedAt: new Date().toISOString(),
      };

      // Speichere in DB
      await activeTripsService.create({
        fahrer_id: profileId,
        gruppe_id: gruppeId,
        start_kilometer: inputKm,
        started_at: new Date().toISOString(),
      });

      // Speichere lokal
      localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(newActiveTrip));
      onTripStart(newActiveTrip);
      setShowStartDialog(false);
      setStartKilometerInput('');

      presentToast({
        message: 'Fahrt gestartet!',
        duration: 2000,
        color: 'success',
      });

      await loadActiveTrip();
      onRefresh();
    } catch (error: any) {
      presentToast({
        message: error.message || 'Fehler beim Starten der Fahrt',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  const saveTrip = async () => {
    const endKm = parseInt(endKilometerInput);

    if (isNaN(endKm) || !activeTrip || endKm <= activeTrip.startKilometer) {
      presentToast({
        message: 'Ungültiger End-Kilometerstand',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    try {
      const today = new Date();
      const datum = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const distance = endKm - activeTrip.startKilometer;
      const kosten = distance * kostenProKm;

      await tripsService.create({
        start_kilometer: activeTrip.startKilometer,
        end_kilometer: endKm,
        datum,
        fahrer_id: profileId,
        kommentar: null,
        kosten,
      });

      // Lösche aus DB
      if (dbActiveTrip) {
        await activeTripsService.delete(dbActiveTrip.id);
      }

      localStorage.removeItem(ACTIVE_TRIP_KEY);
      onTripEnd();
      setShowEndDialog(false);
      setEndKilometerInput('');

      presentToast({
        message: 'Fahrt gespeichert!',
        duration: 2000,
        color: 'success',
      });

      await loadActiveTrip();
      onRefresh();
    } catch (error: any) {
      presentToast({
        message: error.message || 'Fehler beim Speichern der Fahrt',
        duration: 3000,
        color: 'danger',
      });
    }
  };

  const handleToggleChange = (checked: boolean) => {
    if (checked && !activeTrip) {
      // Vorausfüllen nur wenn KEINE fremde Aufzeichnung läuft
      if (!isForeignTrip) {
        setStartKilometerInput(lastKilometer.toString());
      }
      setShowStartDialog(true);
    } else if (!checked && activeTrip) {
      setShowEndDialog(true);
    }
  };

  const isForeignTrip = dbActiveTrip && dbActiveTrip.fahrer_id !== profileId;
  const isOwnTrip = activeTrip !== null;

  return (
    <>
      {showStartDialog && !activeTrip && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <IonCard
            style={{
              border: '2px solid var(--ion-color-primary)',
              maxWidth: '500px',
              width: '100%',
              margin: 0,
            }}
          >
            <IonCardHeader>
              <IonCardTitle>Fahrt starten</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              {isForeignTrip && (
                <div
                  style={{
                    padding: '12px',
                    background: '#fff3e0',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    borderLeft: '4px solid #ff9800',
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#ff9800' }}>
                    ⚠️ {dbActiveTrip.fahrer?.vorname} {dbActiveTrip.fahrer?.name} zeichnet auf
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                    Start: {dbActiveTrip.start_kilometer.toLocaleString('de-DE')} km{' '}
                    {getTimeSinceStart(dbActiveTrip.started_at)}
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#666' }}>
                    Diese Fahrt wird automatisch beendet.
                  </p>
                </div>
              )}
              {!isForeignTrip && (
                <p style={{ marginBottom: '8px' }}>
                  Letzter Kilometerstand:{' '}
                  <strong>{lastKilometer.toLocaleString('de-DE')} km</strong>
                </p>
              )}
              <p style={{ marginBottom: '16px', color: '#666', fontSize: '14px' }}>
                {isForeignTrip
                  ? 'Gib den aktuellen Kilometerstand ein:'
                  : 'Falls der aktuelle Stand höher ist, wird eine fehlende Fahrt automatisch nachgetragen.'}
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
              <div style={{ display: 'flex', gap: '12px' }}>
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setShowStartDialog(false)}
                  style={{ flex: 1 }}
                >
                  Abbrechen
                </IonButton>
                <IonButton expand="block" onClick={confirmStartTrip} style={{ flex: 1 }}>
                  Starten
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      )}

      {showEndDialog && activeTrip && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <IonCard
            style={{
              border: '2px solid var(--ion-color-primary)',
              maxWidth: '500px',
              width: '100%',
              margin: 0,
            }}
          >
            <IonCardHeader>
              <IonCardTitle>Fahrt beenden</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p style={{ marginBottom: '16px' }}>
                Start-Kilometer:{' '}
                <strong>{activeTrip.startKilometer.toLocaleString('de-DE')} km</strong>
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
                <div
                  style={{
                    padding: '12px',
                    background: '#e3f2fd',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <p style={{ margin: 0 }}>
                    Gefahrene Strecke:{' '}
                    <strong>
                      {(parseInt(endKilometerInput) - activeTrip.startKilometer).toLocaleString(
                        'de-DE'
                      )}{' '}
                      km
                    </strong>
                  </p>
                  <p style={{ margin: '8px 0 0 0', color: 'var(--ion-color-success)' }}>
                    Kosten:{' '}
                    <strong>
                      {(
                        (parseInt(endKilometerInput) - activeTrip.startKilometer) *
                        kostenProKm
                      ).toFixed(2)}{' '}
                      €
                    </strong>
                  </p>
                </div>
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
                <IonButton expand="block" onClick={saveTrip} style={{ flex: 1 }}>
                  Speichern
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      )}

      <IonCard
        style={{
          background: isForeignTrip ? '#ff9800' : isOwnTrip ? '#ffc409' : '#8ab21d',
          color: 'white',
        }}
      >
        <IonCardContent style={{ padding: '20px', color: '#000000' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <IonIcon
                icon={isForeignTrip ? alertCircle : isOwnTrip ? checkmarkCircle : car}
                style={{ fontSize: '36px' }}
              />
              <div>
                <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>
                  {isForeignTrip
                    ? `${dbActiveTrip.fahrer?.vorname} zeichnet auf`
                    : isOwnTrip
                      ? 'Fahrt läuft'
                      : 'Fahrt starten'}
                </h2>
                <p style={{ margin: '6px 0 0 0', opacity: 0.9, fontSize: '14px' }}>
                  {isForeignTrip
                    ? `Start: ${dbActiveTrip.start_kilometer.toLocaleString('de-DE')} km ${getTimeSinceStart(dbActiveTrip.started_at)}`
                    : isOwnTrip
                      ? `Gestartet bei ${activeTrip.startKilometer.toLocaleString('de-DE')} km`
                      : `Letzter Stand: ${lastKilometer.toLocaleString('de-DE')} km`}
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
    </>
  );
};

export default TripControl;
