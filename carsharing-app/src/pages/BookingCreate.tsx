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
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton,
  IonSpinner,
  IonBackButton,
  IonButtons,
  useIonToast,
} from '@ionic/react';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsService } from '../services/database';

const BookingCreate: React.FC = () => {
  const [startDatum, setStartDatum] = useState('');
  const [startUhrzeit, setStartUhrzeit] = useState('');
  const [endeDatum, setEndeDatum] = useState('');
  const [endeUhrzeit, setEndeUhrzeit] = useState('');
  const [kommentar, setKommentar] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const [present] = useIonToast();

  // Lese startDate aus URL-Parameter (wenn vom Kalender kommend)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateFromUrl = params.get('startDate');
    if (dateFromUrl) {
      setStartDatum(dateFromUrl);
    }
  }, [location.search]);

  const inputStyle = {
    marginBottom: '16px',
    '--background': '#f4f5f8',
    '--border-width': '1px',
    '--border-style': 'solid',
    '--border-color': '#d7d8da',
    '--border-radius': '8px',
    '--padding-start': '16px',
    '--padding-end': '16px',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDatum || !startUhrzeit || !endeDatum || !endeUhrzeit || !profile?.gruppe_id) {
      present({
        message: 'Bitte alle Pflichtfelder ausfüllen',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      await bookingsService.create({
        start_datum: startDatum,
        start_uhrzeit: startUhrzeit,
        ende_datum: endeDatum,
        ende_uhrzeit: endeUhrzeit,
        gruppe_id: profile.gruppe_id,
        fahrer_id: profile.id,
        kommentar: kommentar || null,
      });
      
      present({
        message: 'Buchung erfolgreich erstellt!',
        duration: 2000,
        color: 'success',
      });
      
      history.goBack();
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Erstellen der Buchung',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/bookings" />
          </IonButtons>
          <IonTitle>Neue Buchung</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Auto buchen</IonCardTitle>
          </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleSubmit}>
                {/* Gruppe anzeigen (nicht änderbar) */}
                <IonItem lines="none" style={{ marginBottom: '16px' }}>
                  <IonLabel>
                    <p>Gruppe</p>
                    <h2>{profile?.gruppe?.bezeichnung || 'Keine Gruppe zugewiesen'}</h2>
                  </IonLabel>
                </IonItem>

                {/* Start */}
                <h3 style={{ margin: '16px 0 8px' }}>Start</h3>
                <IonInput
                  type="date"
                  label="Start-Datum *"
                  labelPlacement="floating"
                  fill="solid"
                  value={startDatum}
                  onIonInput={(e) => setStartDatum(e.detail.value!)}
                  required
                  style={inputStyle}
                />
                <IonInput
                  type="time"
                  label="Start-Uhrzeit *"
                  labelPlacement="floating"
                  fill="solid"
                  value={startUhrzeit}
                  onIonInput={(e) => setStartUhrzeit(e.detail.value!)}
                  required
                  style={inputStyle}
                />

                {/* Ende */}
                <h3 style={{ margin: '16px 0 8px' }}>Ende</h3>
                <IonInput
                  type="date"
                  label="Ende-Datum *"
                  labelPlacement="floating"
                  fill="solid"
                  value={endeDatum}
                  onIonInput={(e) => setEndeDatum(e.detail.value!)}
                  required
                  style={inputStyle}
                />
                <IonInput
                  type="time"
                  label="Ende-Uhrzeit *"
                  labelPlacement="floating"
                  fill="solid"
                  value={endeUhrzeit}
                  onIonInput={(e) => setEndeUhrzeit(e.detail.value!)}
                  required
                  style={inputStyle}
                />

                {/* Kommentar */}
                <IonTextarea
                  label="Kommentar"
                  labelPlacement="floating"
                  fill="solid"
                  value={kommentar}
                  onIonInput={(e) => setKommentar(e.detail.value!)}
                  rows={3}
                  style={inputStyle}
                />

              <IonButton
                expand="block"
                type="submit"
                disabled={loading}
                style={{ marginTop: '20px' }}
              >
                {loading ? <IonSpinner name="crescent" /> : 'Buchung erstellen'}
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default BookingCreate;

