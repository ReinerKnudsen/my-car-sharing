import React, { useEffect, useState, useRef } from 'react';
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
  IonSpinner,
  IonText,
  useIonToast,
} from '@ionic/react';
import { checkmarkCircle, home } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { receiptService } from '../services/receipt.service';

const PaymentSuccess: React.FC = () => {
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false); // ← Guard: Nur einmal ausführen!
  const history = useHistory();
  const location = useLocation();
  const { profile } = useAuth();
  const [presentToast] = useIonToast();

  useEffect(() => {
    // Warte bis profile geladen ist UND noch nicht verarbeitet
    if (profile?.gruppe_id && !hasProcessed.current) {
      hasProcessed.current = true; // ← Markiere als verarbeitet
      handlePaymentSuccess();
    }
  }, [profile]); // ← Trigger wenn profile sich ändert

  const handlePaymentSuccess = async () => {
    // Hole Betrag aus URL Query Parameter (falls übergeben)
    const params = new URLSearchParams(location.search);
    const amountParam = params.get('amount');
    const amount = amountParam ? parseFloat(amountParam) : null;

    if (!amount) {
      setError('Zahlungsbetrag nicht gefunden');
      setProcessing(false);
      return;
    }

    // Profile sollte jetzt geladen sein (durch useEffect dependency)
    if (!profile?.gruppe_id) {
      setError('Keine Gruppe gefunden. Bitte erneut einloggen.');
      setProcessing(false);
      return;
    }

    try {
      // Erstelle Beleg automatisch
      const receiptTypes = await receiptService.getReceiptTypes();
      const transferType = receiptTypes.find((t) => t.bezeichnung === 'Überweisung');

      if (!transferType) {
        throw new Error('Belegart "Überweisung" nicht gefunden');
      }

      await receiptService.create({
        gruppe_id: profile.gruppe_id,
        fahrer_id: profile.id,
        receipt_type_id: transferType.id,
        datum: new Date().toISOString().split('T')[0],
        betrag: amount,
        kommentar: 'PayPal Zahlung',
      });

      presentToast({
        message: '✅ Zahlung erfolgreich! Beleg wurde erstellt.',
        duration: 3000,
        color: 'success',
      });

      // Warte kurz, dann redirect zum Gruppenkonto
      setTimeout(() => {
        history.push('/group-account');
      }, 2000);
    } catch (err: any) {
      console.error('Error creating receipt:', err);
      setError(err.message || 'Fehler beim Erstellen des Belegs');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>Zahlung erfolgreich</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            {processing ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <IonSpinner name="crescent" style={{ transform: 'scale(2)', marginBottom: '20px' }} />
                <h2>{profile ? 'Verarbeite Zahlung...' : 'Lade Profil...'}</h2>
                <IonText color="medium">
                  <p>{profile ? 'Einen Moment bitte, der Beleg wird erstellt.' : 'Authentifizierung läuft...'}</p>
                </IonText>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <IonIcon
                  icon={checkmarkCircle}
                  style={{ fontSize: '80px', color: 'var(--ion-color-danger)', marginBottom: '20px' }}
                />
                <h2>Fehler</h2>
                <IonText color="danger">
                  <p>{error}</p>
                </IonText>
                <IonButton expand="block" onClick={() => history.push('/group-account')} style={{ marginTop: '20px' }}>
                  <IonIcon slot="start" icon={home} />
                  Zum Gruppenkonto
                </IonButton>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <IonIcon
                  icon={checkmarkCircle}
                  style={{ fontSize: '80px', color: 'var(--ion-color-success)', marginBottom: '20px' }}
                />
                <h2>Zahlung erfolgreich!</h2>
                <IonText color="medium">
                  <p>Deine PayPal-Zahlung wurde verarbeitet und der Beleg wurde erstellt.</p>
                  <p>Du wirst automatisch weitergeleitet...</p>
                </IonText>
              </div>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default PaymentSuccess;

