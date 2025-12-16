import React from 'react';
import { IonText } from '@ionic/react';

const AppVersion: React.FC = () => {
  const version = import.meta.env.VITE_APP_VERSION || 'dev';
  const commitSha = import.meta.env.VITE_COMMIT_SHA;
  const deployId = import.meta.env.VITE_DEPLOY_ID;

  return (
    <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.75rem' }}>
      <IonText color="medium">
        <p>
          Version: {version}
          {commitSha && ` • ${commitSha.substring(0, 7)}`}
        </p>
      </IonText>
    </div>
  );
};

export default AppVersion;
