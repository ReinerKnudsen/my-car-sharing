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
  IonIcon,
  IonButtons,
  IonBackButton,
  useIonToast,
} from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { invitationService } from '../services/invitation.service';

const Register: React.FC = () => {
  // Step 1: Code validation
  const [invitationCode, setInvitationCode] = useState('');
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeValid, setCodeValid] = useState(false);
  const [gruppeId, setGruppeId] = useState<string | null>(null);
  const [gruppeName, setGruppeName] = useState('');

  // Step 2: Registration form
  const [vorname, setVorname] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [registering, setRegistering] = useState(false);

  const history = useHistory();
  const [present] = useIonToast();

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitationCode.trim()) {
      present({
        message: 'Bitte Einladungscode eingeben',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    setCodeValidating(true);
    try {
      const result = await invitationService.validateCode(invitationCode);

      if (result.valid && result.gruppe_id) {
        setCodeValid(true);
        setGruppeId(result.gruppe_id);

        // Get group name for display
        const { data: gruppe } = await import('../services/supabase').then(m => 
          m.supabase.from('groups').select('bezeichnung').eq('id', result.gruppe_id).single()
        );
        if (gruppe) {
          setGruppeName(gruppe.bezeichnung);
        }

        present({
          message: 'Code gültig! Bitte Registrierung abschließen.',
          duration: 3000,
          color: 'success',
        });
      } else {
        present({
          message: result.error || 'Ungültiger Code',
          duration: 3000,
          color: 'danger',
        });
      }
    } catch (error: any) {
      present({
        message: error.message || 'Fehler bei der Code-Validierung',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setCodeValidating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vorname || !name || !email || !password) {
      present({
        message: 'Bitte alle Felder ausfüllen',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    if (password.length < 8) {
      present({
        message: 'Das Passwort muss mindestens 8 Zeichen lang sein',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    if (password !== passwordConfirm) {
      present({
        message: 'Die Passwörter stimmen nicht überein',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    if (!gruppeId) {
      present({
        message: 'Fehler: Keine Gruppe zugewiesen',
        duration: 3000,
        color: 'danger',
      });
      return;
    }

    setRegistering(true);
    try {
      // Register the user
      await authService.signUpWithInvitation(email, password, vorname, name, gruppeId);

      // Mark the invitation code as used
      await invitationService.useCode(invitationCode);

      present({
        message: 'Registrierung erfolgreich! Bitte bestätige deine E-Mail-Adresse.',
        duration: 5000,
        color: 'success',
      });

      history.push('/login');
    } catch (error: any) {
      present({
        message: error.message || 'Fehler bei der Registrierung',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setRegistering(false);
    }
  };

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/login" text="Zurück" />
          </IonButtons>
          <IonTitle>Registrieren</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '20px' }}>
          {/* Step 1: Code Validation */}
          {!codeValid && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Einladungscode eingeben</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonText color="medium">
                  <p style={{ marginBottom: '20px' }}>
                    Du benötigst einen Einladungscode, um dich zu registrieren. 
                    Diesen erhältst du von deinem Gruppen-Administrator.
                  </p>
                </IonText>

                <form onSubmit={handleValidateCode}>
                  <IonInput
                    type="text"
                    label="Einladungscode"
                    labelPlacement="floating"
                    fill="solid"
                    value={invitationCode}
                    onIonInput={(e) => setInvitationCode(e.detail.value?.toUpperCase() || '')}
                    placeholder="z.B. ABC123XY"
                    maxlength={20}
                    style={{
                      ...inputStyle,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                      fontFamily: 'monospace',
                      fontSize: '1.2em',
                    }}
                  />

                  <IonButton
                    expand="block"
                    type="submit"
                    disabled={codeValidating}
                    style={{ marginTop: '20px' }}
                  >
                    {codeValidating ? <IonSpinner name="crescent" /> : 'Code prüfen'}
                  </IonButton>
                </form>
              </IonCardContent>
            </IonCard>
          )}

          {/* Step 2: Registration Form */}
          {codeValid && (
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Account erstellen</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {/* Success indicator */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '12px',
                  backgroundColor: 'var(--ion-color-success-tint)',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <IonIcon icon={checkmarkCircleOutline} color="success" style={{ fontSize: '24px' }} />
                  <div>
                    <strong>Code gültig!</strong>
                    <br />
                    <IonText color="medium">
                      Du wirst der Gruppe <strong>{gruppeName}</strong> zugeordnet.
                    </IonText>
                  </div>
                </div>

                <form onSubmit={handleRegister}>
                  <IonInput
                    type="text"
                    label="Vorname"
                    labelPlacement="floating"
                    fill="solid"
                    value={vorname}
                    onIonInput={(e) => setVorname(e.detail.value || '')}
                    required
                    style={inputStyle}
                  />

                  <IonInput
                    type="text"
                    label="Nachname"
                    labelPlacement="floating"
                    fill="solid"
                    value={name}
                    onIonInput={(e) => setName(e.detail.value || '')}
                    required
                    style={inputStyle}
                  />

                  <IonInput
                    type="email"
                    label="E-Mail"
                    labelPlacement="floating"
                    fill="solid"
                    value={email}
                    onIonInput={(e) => setEmail(e.detail.value || '')}
                    required
                    style={inputStyle}
                  />

                  <IonInput
                    type="password"
                    label="Passwort"
                    labelPlacement="floating"
                    fill="solid"
                    value={password}
                    onIonInput={(e) => setPassword(e.detail.value || '')}
                    required
                    style={inputStyle}
                  />

                  <IonInput
                    type="password"
                    label="Passwort bestätigen"
                    labelPlacement="floating"
                    fill="solid"
                    value={passwordConfirm}
                    onIonInput={(e) => setPasswordConfirm(e.detail.value || '')}
                    required
                    style={inputStyle}
                  />

                  <IonButton
                    expand="block"
                    type="submit"
                    disabled={registering}
                    style={{ marginTop: '20px' }}
                  >
                    {registering ? <IonSpinner name="crescent" /> : 'Registrieren'}
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="clear"
                    onClick={() => {
                      setCodeValid(false);
                      setInvitationCode('');
                      setGruppeId(null);
                      setGruppeName('');
                    }}
                    style={{ marginTop: '8px' }}
                  >
                    Anderen Code verwenden
                  </IonButton>
                </form>
              </IonCardContent>
            </IonCard>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Register;
