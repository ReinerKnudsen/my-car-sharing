import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { DriverCosts as DriverCostsType } from '../../types';

interface DriverCostsProps {
  driverCosts: DriverCostsType[];
}

const DriverCosts: React.FC<DriverCostsProps> = ({ driverCosts }) => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle className="small-card-title">Kosten pro Fahrer</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {driverCosts.length === 0 ? (
          <p style={{ color: '#666' }}>Keine Fahrten vorhanden</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {driverCosts.map((driver) => (
              <div
                key={driver.fahrer_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '8px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong>{driver.fahrer_name}</strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                    {driver.trip_count} Fahrten • {driver.total_kilometers.toLocaleString('de-DE')}{' '}
                    km
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: '18px', color: 'var(--ion-color-success)' }}>
                    {driver.total_costs.toFixed(2)} €
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default DriverCosts;
