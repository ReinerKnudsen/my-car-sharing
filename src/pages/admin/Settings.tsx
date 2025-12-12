import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  useIonToast,
} from '@ionic/react';
import { saveOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { settingsService } from '../../services/settings.service';
import { useAuth } from '../../contexts/AuthContext';

const Settings: React.FC = () => {
  const [kostenProKm, setKostenProKm] = useState<string>('0.30');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [present] = useIonToast();
  const history = useHistory();
  const { profile } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const value = await settingsService.getKostenProKm();
      setKostenProKm(value.toString());
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    const value = parseFloat(kostenProKm);
    if (isNaN(value) || value < 0) {
      present({
        message: 'Bitte einen gültigen Betrag eingeben',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    setSaving(true);
    try {
      await settingsService.update('kosten_pro_km', value.toFixed(2), profile.id);
      present({
        message: 'Einstellungen gespeichert',
        duration: 2000,
        color: 'success',
      });
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Speichern',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate example cost
  const exampleKm = 50;
  const exampleCost = (parseFloat(kostenProKm) || 0) * exampleKm;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Verwaltung</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value="settings" onIonChange={(e) => {
            if (e.detail.value === 'users') history.push('/admin/users');
            if (e.detail.value === 'groups') history.push('/admin/groups');
            if (e.detail.value === 'codes') history.push('/admin/invitation-codes');
          }}>
            <IonSegmentButton value="users">
              <IonLabel>Fahrer</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="groups">
              <IonLabel>Gruppen</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="codes">
              <IonLabel>Einladungen</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="settings">
              <IonLabel>Kosten</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <IonSpinner />
          </div>
        ) : (
          <>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Kostensatz pro Kilometer</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText color="medium">
                  <p style={{ marginBottom: '16px' }}>
                    Dieser Betrag wird für jede neue Fahrt pro gefahrenem Kilometer berechnet.
                  </p>
                </IonText>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonInput
                    type="number"
                    label="Euro pro km"
                    labelPlacement="floating"
                    fill="solid"
                    value={kostenProKm}
                    onIonInput={(e) => setKostenProKm(e.detail.value || '0')}
                    min={0}
                    step={0.01}
                    style={{
                      flex: 1,
                      '--background': '#f4f5f8',
                      '--border-width': '1px',
                      '--border-style': 'solid',
                      '--border-color': '#d7d8da',
                      '--border-radius': '8px',
                      '--padding-start': '16px',
                      '--padding-end': '16px',
                    }}
                  />
                  <IonText style={{ fontSize: '1.2em', fontWeight: 'bold' }}>€/km</IonText>
                </div>

                {/* Example calculation */}
                <div style={{ 
                  marginTop: '20px', 
                  padding: '16px', 
                  backgroundColor: 'var(--ion-color-light)',
                  borderRadius: '8px'
                }}>
                  <IonText color="medium">
                    <p style={{ margin: 0 }}>
                      <strong>Beispiel:</strong> Eine Fahrt von {exampleKm} km kostet{' '}
                      <strong style={{ color: 'var(--ion-color-primary)' }}>
                        {exampleCost.toFixed(2)} €
                      </strong>
                    </p>
                  </IonText>
                </div>

                <IonButton
                  expand="block"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ marginTop: '20px' }}
                >
                  {saving ? (
                    <IonSpinner name="crescent" />
                  ) : (
                    <>
                      <IonIcon slot="start" icon={saveOutline} />
                      Speichern
                    </>
                  )}
                </IonButton>
              </IonCardContent>
            </IonCard>

            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Hinweis</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText color="medium">
                  <p>
                    Der Kostensatz wird nur für <strong>neue Fahrten</strong> angewendet. 
                    Bestehende Fahrten behalten ihre ursprünglichen Kosten.
                  </p>
                  <p style={{ marginTop: '8px' }}>
                    Die Kosten werden automatisch berechnet als:<br />
                    <code>(End-Kilometer - Start-Kilometer) × Kostensatz</code>
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Settings;

