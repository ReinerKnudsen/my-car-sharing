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
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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

              <IonText color="medium">
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                  Noch kein Account? Kontaktieren Sie einen Administrator.
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
