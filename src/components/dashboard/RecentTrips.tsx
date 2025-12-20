import React from 'react';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonText } from '@ionic/react';
import { Trip } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface RecentTripsProps {
  trips: Trip[];
}

const RecentTrips: React.FC<RecentTripsProps> = ({ trips }) => {
  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle className="small-card-title">Letzte Fahrten</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {trips.length === 0 ? (
          <IonText color="medium">
            <p>Noch keine Fahrten</p>
          </IonText>
        ) : (
          trips.map((trip) => {
            const isUnclaimed = !trip.fahrer_id;
            return (
              <div
                key={trip.id}
                style={{
                  marginBottom: '10px',
                  padding: '10px',
                  background: isUnclaimed ? '#fff3e0' : '#f5f5f5',
                  borderRadius: '8px',
                  borderLeft: isUnclaimed ? '4px solid #ff9800' : 'none',
                }}
              >
                <strong>{formatDate(trip.datum, false)}</strong>
                <p style={{ margin: '5px 0 0 0', color: '#666' }}>
                  {isUnclaimed ? (
                    <span style={{ color: '#ff9800', fontWeight: 'bold' }}>
                      ⚠️ Unbekannter Fahrer
                    </span>
                  ) : (
                    <>
                      {trip.fahrer?.vorname} {trip.fahrer?.name}
                    </>
                  )}
                  {' - '}
                  {trip.end_kilometer - trip.start_kilometer} km
                  {trip.kosten !== null && trip.kosten !== undefined && (
                    <span style={{ color: 'var(--ion-color-success)', marginLeft: '8px' }}>
                      ({trip.kosten.toFixed(2)} €)
                    </span>
                  )}
                </p>
              </div>
            );
          })
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default RecentTrips;
