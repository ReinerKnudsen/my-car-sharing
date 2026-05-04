import React from 'react';
import { IonButton, IonButtons } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Zeigt einen runden Avatar mit den Initialen des Users.
 * Klick navigiert zur Profil-Seite.
 * 
 * Verwendung im IonToolbar:
 *   <ProfileAvatarButton />
 * 
 * Die Komponente enthält bereits <IonButtons slot="end">,
 * damit sie direkt in eine IonToolbar eingesetzt werden kann.
 */
const ProfileAvatarButton: React.FC = () => {
  const { profile } = useAuth();
  const history = useHistory();

  // Initialen aus Vorname + Nachname (z.B. "RK" für Reiner Knudsen)
  const getInitials = (): string => {
    if (!profile) return '?';
    const first = profile.vorname?.charAt(0)?.toUpperCase() || '';
    const last = profile.name?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  // Einfache Hash-Funktion für konsistente Farbe pro User
  const getColor = (): string => {
    if (!profile) return '#92949c';
    const name = `${profile.vorname}${profile.name}`;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Auswahl aus harmonischen Farben (gut lesbar mit weißem Text)
    const colors = [
      '#3880ff', // blau
      '#3dc2ff', // cyan
      '#5260ff', // indigo
      '#2dd36f', // grün
      '#ffc409', // gelb
      '#eb445a', // rot
      '#92949c', // grau
      '#6a64ff', // violett
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <IonButtons slot="end">
      <IonButton
        onClick={() => history.push('/profile')}
        style={{ marginRight: '8px' }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: getColor(),
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          {getInitials()}
        </div>
      </IonButton>
    </IonButtons>
  );
};

export default ProfileAvatarButton;
