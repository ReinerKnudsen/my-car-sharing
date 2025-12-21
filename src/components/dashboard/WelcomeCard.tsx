import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText } from '@ionic/react';
import { Profile } from '../../types';

interface WelcomeCardProps {
  profile: Profile;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ profile }) => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{profile ? `${profile.vorname} ${profile.name}` : 'Willkommen'}</IonCardTitle>
      </IonCardHeader>
      {profile?.gruppe && (
        <IonCardContent>
          <IonText color="medium">Gruppe: {profile.gruppe.bezeichnung}</IonText>
        </IonCardContent>
      )}
    </IonCard>
  );
};

export default WelcomeCard;
