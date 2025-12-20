import React from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSkeletonText,
} from '@ionic/react';

const DashboardSkeleton: React.FC = () => {
  return (
    <>
      {/* Trip Control Skeleton */}
      <IonCard>
        <IonCardContent style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <IonSkeletonText
              animated
              style={{ width: '36px', height: '36px', borderRadius: '50%' }}
            />
            <div style={{ flex: 1 }}>
              <IonSkeletonText animated style={{ width: '40%', height: '18px' }} />
              <IonSkeletonText
                animated
                style={{ width: '60%', height: '14px', marginTop: '6px' }}
              />
            </div>
            <IonSkeletonText
              animated
              style={{ width: '80px', height: '36px', borderRadius: '8px' }}
            />
          </div>
        </IonCardContent>
      </IonCard>

      {/* Bookings Skeleton */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="small-card-title">
            <IonSkeletonText animated style={{ width: '60%' }} />
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {[1, 2].map((i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <IonSkeletonText
                animated
                style={{ width: '100%', height: '80px', borderRadius: '8px' }}
              />
            </div>
          ))}
        </IonCardContent>
      </IonCard>

      {/* Trips Skeleton */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="small-card-title">
            <IonSkeletonText animated style={{ width: '50%' }} />
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                marginBottom: '10px',
                padding: '10px',
                background: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <IonSkeletonText animated style={{ width: '40%', height: '16px' }} />
              <IonSkeletonText
                animated
                style={{ width: '70%', height: '14px', marginTop: '5px' }}
              />
            </div>
          ))}
        </IonCardContent>
      </IonCard>

      {/* Group Costs Skeleton */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="small-card-title">
            <IonSkeletonText animated style={{ width: '70%' }} />
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <IonSkeletonText
                  animated
                  style={{ width: '60%', height: '12px', margin: '0 auto' }}
                />
                <IonSkeletonText
                  animated
                  style={{ width: '80%', height: '24px', margin: '4px auto 0' }}
                />
              </div>
            ))}
          </div>
        </IonCardContent>
      </IonCard>

      {/* Driver Costs Skeleton */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle className="small-card-title">
            <IonSkeletonText animated style={{ width: '60%' }} />
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {[1, 2].map((i) => (
            <div
              key={i}
              style={{
                marginBottom: '12px',
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <IonSkeletonText animated style={{ width: '50%', height: '16px' }} />
              <IonSkeletonText
                animated
                style={{ width: '70%', height: '14px', marginTop: '4px' }}
              />
            </div>
          ))}
        </IonCardContent>
      </IonCard>
    </>
  );
};

export default DashboardSkeleton;
