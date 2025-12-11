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
  IonButton,
  IonText,
  IonSpinner,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { supabase } from '../services/supabase';

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const history = useHistory();
  const [present] = useIonToast();

  useEffect(() => {
    // Check if user came from a password reset link
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsValidSession(true);
        } else {
          present({
            message: 'Ungültiger oder abgelaufener Reset-Link. Bitte fordere einen neuen an.',
            duration: 5000,
            color: 'danger',
          });
          history.push('/login');
        }
      } catch (error) {
        console.error('Session check error:', error);
        history.push('/login');
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [history, present]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      present({
        message: 'Bitte beide Passwortfelder ausfüllen',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    if (newPassword.length < 6) {
      present({
        message: 'Das Passwort muss mindestens 6 Zeichen lang sein',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      present({
        message: 'Die Passwörter stimmen nicht überein',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      await authService.updatePassword(newPassword);
      present({
        message: 'Passwort erfolgreich geändert!',
        duration: 3000,
        color: 'success',
      });
      history.push('/dashboard');
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Ändern des Passworts',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!isValidSession) {
    return null;
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Neues Passwort setzen</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '40px' }}>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Passwort zurücksetzen</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p style={{ marginBottom: '20px' }}>
                  Gib dein neues Passwort ein.
                </p>
              </IonText>

              <form onSubmit={handleResetPassword}>
                <IonInput
                  type="password"
                  label="Neues Passwort"
                  labelPlacement="floating"
                  fill="solid"
                  value={newPassword}
                  onIonInput={(e) => setNewPassword(e.detail.value!)}
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
                  label="Passwort bestätigen"
                  labelPlacement="floating"
                  fill="solid"
                  value={confirmPassword}
                  onIonInput={(e) => setConfirmPassword(e.detail.value!)}
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
                  {loading ? <IonSpinner name="crescent" /> : 'Passwort speichern'}
                </IonButton>
              </form>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ResetPassword;

