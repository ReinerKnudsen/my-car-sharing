import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { GroupCosts as GroupCostsType, DriverCosts as DriverCostsType } from '../../types';

interface GroupCostsProps {
  groupCosts: GroupCostsType;
  driverCosts: DriverCostsType[];
  groupName?: string;
  currentUserId?: string;
}

const GroupCosts: React.FC<GroupCostsProps> = ({
  groupCosts,
  driverCosts,
  groupName,
  currentUserId,
}) => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle className="small-card-title">
          Gruppenkosten{groupName ? `: ${groupName}` : ''}
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {/* Total Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ padding: '12px', background: '#e3f2fd', borderRadius: '8px' }}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--ion-color-primary)',
              }}
            >
              {groupCosts.total_trips}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Fahrten</div>
          </div>
          <div style={{ padding: '12px', background: '#e8f5e9', borderRadius: '8px' }}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--ion-color-primary)',
              }}
            >
              {groupCosts.total_kilometers.toLocaleString('de-DE')}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Kilometer</div>
          </div>
          <div style={{ padding: '12px', background: '#fff3e0', borderRadius: '8px' }}>
            <div
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'var(--ion-color-primary)',
              }}
            >
              {groupCosts.total_costs.toFixed(2)} €
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Gesamt</div>
          </div>
        </div>

        {/* Per Driver Breakdown */}
        {driverCosts.length > 0 && (
          <>
            <h3 style={{ margin: '16px 0 12px 0', fontSize: '14px', color: '#666' }}>
              Kosten pro Fahrer
            </h3>
            {driverCosts.map((driver) => (
              <div
                key={driver.fahrer_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  background: driver.fahrer_id === currentUserId ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  borderLeft:
                    driver.fahrer_id === currentUserId
                      ? '4px solid var(--ion-color-primary)'
                      : 'none',
                }}
              >
                <div>
                  <strong>
                    {driver.fahrer_name}
                    {driver.fahrer_id === currentUserId && ' (Du)'}
                  </strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                    {driver.trip_count} Fahrten · {driver.total_kilometers.toLocaleString('de-DE')}{' '}
                    km
                  </p>
                </div>
                <div
                  style={{
                    fontWeight: 'bold',
                    color: 'var(--ion-color-success)',
                    fontSize: '16px',
                  }}
                >
                  {driver.total_costs.toFixed(2)} €
                </div>
              </div>
            ))}
          </>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default GroupCosts;
