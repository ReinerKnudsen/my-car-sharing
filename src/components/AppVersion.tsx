import React, { useEffect, useState } from 'react';
import { IonText } from '@ionic/react';

interface VersionInfo {
  version: string;
  commit: string;
  buildTime: string;
}

const AppVersion: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    version: 'loading...',
    commit: '',
    buildTime: '',
  });

  useEffect(() => {
    fetch('/version.json')
      .then((res) => res.json())
      .then((data) => setVersionInfo(data))
      .catch(() =>
        setVersionInfo({
          version: 'dev',
          commit: 'local',
          buildTime: new Date().toISOString(),
        })
      );
  }, []);

  return (
    <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.75rem' }}>
      <IonText color="medium">
        <p>
          Version: {versionInfo.version} • {versionInfo.commit}
        </p>
      </IonText>
    </div>
  );
};

export default AppVersion;
