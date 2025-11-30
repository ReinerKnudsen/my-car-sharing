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
  IonButton,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonSpinner,
  IonBackButton,
  IonButtons,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { groupsService } from '../services/database';
import { Group } from '../types';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vorname, setVorname] = useState('');
  const [name, setName] = useState('');
  const [gruppeId, setGruppeId] = useState<string | null>(null);
  const [istAdmin, setIstAdmin] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const { signUp, isAdmin } = useAuth();
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !vorname || !name) {
      present({
        message: 'Bitte alle Pflichtfelder ausfüllen',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    if (password.length < 6) {
      present({
        message: 'Passwort muss mindestens 6 Zeichen lang sein',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, vorname, name, gruppeId, istAdmin);
      present({
        message: 'Benutzer erfolgreich erstellt!',
        duration: 2000,
        color: 'success',
      });
      history.goBack();
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Erstellen des Benutzers',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // Only admins can access this page
  if (!isAdmin) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/dashboard" />
            </IonButtons>
            <IonTitle>Zugriff verweigert</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard>
            <IonCardContent>
              <p>Sie haben keine Berechtigung, diese Seite aufzurufen.</p>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/admin/users" />
          </IonButtons>
          <IonTitle>Neuer Benutzer</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Benutzer registrieren</IonCardTitle>
          </IonCardHeader>
            <IonCardContent>
              <form onSubmit={handleRegister}>
                <IonInput
                  label="Vorname *"
                  labelPlacement="floating"
                  fill="solid"
                  value={vorname}
                  onIonInput={(e) => setVorname(e.detail.value!)}
                  required
                  style={inputStyle}
                />

                <IonInput
                  label="Name *"
                  labelPlacement="floating"
                  fill="solid"
                  value={name}
                  onIonInput={(e) => setName(e.detail.value!)}
                  required
                  style={inputStyle}
                />

                <IonInput
                  type="email"
                  label="E-Mail *"
                  labelPlacement="floating"
                  fill="solid"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value!)}
                  required
                  style={inputStyle}
                />

                <IonInput
                  type="password"
                  label="Passwort *"
                  labelPlacement="floating"
                  fill="solid"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value!)}
                  required
                  style={inputStyle}
                />

              <IonItem>
                <IonLabel>Gruppe</IonLabel>
                <IonSelect
                  value={gruppeId}
                  placeholder="Gruppe auswählen"
                  onIonChange={(e) => setGruppeId(e.detail.value)}
                >
                  <IonSelectOption value={null}>Keine Gruppe</IonSelectOption>
                  {groups.map((group) => (
                    <IonSelectOption key={group.id} value={group.id}>
                      {group.bezeichnung}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel>Administrator</IonLabel>
                <IonToggle
                  checked={istAdmin}
                  onIonChange={(e) => setIstAdmin(e.detail.checked)}
                />
              </IonItem>

              <IonButton
                expand="block"
                type="submit"
                disabled={loading}
                style={{ marginTop: '20px' }}
              >
                {loading ? <IonSpinner name="crescent" /> : 'Registrieren'}
              </IonButton>
            </form>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Register;

