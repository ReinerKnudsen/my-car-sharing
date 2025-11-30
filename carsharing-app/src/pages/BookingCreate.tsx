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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonBackButton,
  IonButtons,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsService, groupsService } from '../services/database';
import { Group } from '../types';

const BookingCreate: React.FC = () => {
  const [datum, setDatum] = useState('');
  const [uhrzeit, setUhrzeit] = useState('');
  const [gruppeId, setGruppeId] = useState('');
  const [kommentar, setKommentar] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const history = useHistory();
  const [present] = useIonToast();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const data = await groupsService.getAll();
      setGroups(data);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!datum || !uhrzeit || !gruppeId || !profile) {
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
        datum,
        uhrzeit,
        gruppe_id: gruppeId,
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
                <IonInput
                  type="date"
                  label="Datum *"
                  labelPlacement="floating"
                  fill="solid"
                  value={datum}
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
                  type="time"
                  label="Uhrzeit *"
                  labelPlacement="floating"
                  fill="solid"
                  value={uhrzeit}
                  onIonInput={(e) => setUhrzeit(e.detail.value!)}
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

                <IonItem style={{ marginBottom: '16px' }}>
                  <IonLabel>Gruppe *</IonLabel>
                  <IonSelect
                    value={gruppeId}
                    placeholder="Gruppe auswählen"
                    onIonChange={(e) => setGruppeId(e.detail.value)}
                  >
                    {groups.map((group) => (
                      <IonSelectOption key={group.id} value={group.id}>
                        {group.bezeichnung}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

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

