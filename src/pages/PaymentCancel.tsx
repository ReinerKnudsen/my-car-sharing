import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonText,
} from '@ionic/react';
import { closeCircle, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const PaymentCancel: React.FC = () => {
  const history = useHistory();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="warning">
          <IonTitle>Zahlung abgebrochen</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <IonIcon
                icon={closeCircle}
                style={{ fontSize: '80px', color: 'var(--ion-color-warning)', marginBottom: '20px' }}
              />
              <h2>Zahlung abgebrochen</h2>
              <IonText color="medium">
                <p>Die PayPal-Zahlung wurde abgebrochen.</p>
                <p>Kein Geld wurde überwiesen.</p>
              </IonText>

              <IonButton
                expand="block"
                onClick={() => history.push('/group-account')}
                style={{ marginTop: '20px' }}
              >
                <IonIcon slot="start" icon={arrowBack} />
                Zurück zum Gruppenkonto
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default PaymentCancel;

