import React, { useState } from 'react';
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
  IonButton,
  IonText,
  IonSpinner,
  IonModal,
  IonButtons,
  IonIcon,
  useIonToast,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn } = useAuth();
  const history = useHistory();
  const [present] = useIonToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      present({
        message: 'Bitte E-Mail und Passwort eingeben',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      present({
        message: 'Erfolgreich angemeldet!',
        duration: 2000,
        color: 'success',
      });
      history.push('/dashboard');
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Anmelden',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      present({
        message: 'Bitte E-Mail-Adresse eingeben',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    setResetLoading(true);
    try {
      await authService.resetPassword(resetEmail);
      present({
        message: 'Falls ein Account mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.',
        duration: 5000,
        color: 'success',
      });
      setShowResetModal(false);
      setResetEmail('');
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Senden des Reset-Links',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Anmelden</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '40px' }}>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>CarSharing Login</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleLogin}>
                <IonInput
                  type="email"
                  label="E-Mail"
                  labelPlacement="floating"
                  fill="solid"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value!)}
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
                  type="password"
                  label="Passwort"
                  labelPlacement="floating"
                  fill="solid"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
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

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={loading}
                  style={{ marginTop: '20px' }}
                >
                  {loading ? <IonSpinner name="crescent" /> : 'Anmelden'}
                </IonButton>
              </form>

              <IonButton
                fill="clear"
                expand="block"
                onClick={() => {
                  setResetEmail(email);
                  setShowResetModal(true);
                }}
                style={{ marginTop: '8px' }}
              >
                Passwort vergessen?
              </IonButton>

              <IonText color="medium">
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                  Noch kein Account? Kontaktieren Sie einen Administrator.
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </div>

        {/* Passwort vergessen Modal */}
        <IonModal isOpen={showResetModal} onDidDismiss={() => setShowResetModal(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Passwort zurücksetzen</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowResetModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '20px' }}>
              <IonText color="medium">
                <p style={{ marginBottom: '20px' }}>
                  Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.
                </p>
              </IonText>
              
              <form onSubmit={handleResetPassword}>
                <IonInput
                  type="email"
                  label="E-Mail"
                  labelPlacement="floating"
                  fill="solid"
                  value={resetEmail}
                  onIonInput={(e) => setResetEmail(e.detail.value!)}
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

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={resetLoading}
                  style={{ marginTop: '20px' }}
                >
                  {resetLoading ? <IonSpinner name="crescent" /> : 'Reset-Link senden'}
                </IonButton>
              </form>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Login;
