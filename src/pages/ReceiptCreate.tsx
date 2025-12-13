import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSpinner,
  IonBackButton,
  IonButtons,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { receiptService } from '../services/receipt.service';
import { ReceiptType } from '../types';

// Heutiges Datum als YYYY-MM-DD String
const getTodayString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
};

const ReceiptCreate: React.FC = () => {
  const [datum, setDatum] = useState<string>(getTodayString());
  const [receiptTypeId, setReceiptTypeId] = useState<string>('');
  const [betrag, setBetrag] = useState<string>('');
  const [kommentar, setKommentar] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  
  const { profile } = useAuth();
  const history = useHistory();
  const [present] = useIonToast();

  useEffect(() => {
    loadReceiptTypes();
  }, []);

  const loadReceiptTypes = async () => {
    try {
      setLoadingTypes(true);
      const types = await receiptService.getReceiptTypes();
      setReceiptTypes(types);
      // Ersten Typ als Standard auswählen
      if (types.length > 0) {
        setReceiptTypeId(types[0].id);
      }
    } catch (error) {
      console.error('Error loading receipt types:', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!datum || !receiptTypeId || !betrag) {
      present({
        message: 'Bitte alle Pflichtfelder ausfüllen',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    if (!profile || !profile.gruppe_id) {
      present({
        message: 'Du bist keiner Gruppe zugeordnet',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    const betragNum = parseFloat(betrag.replace(',', '.'));
    if (isNaN(betragNum) || betragNum <= 0) {
      present({
        message: 'Bitte einen gültigen Betrag eingeben',
        duration: 2000,
        color: 'danger',
      });
      return;
    }

    // Datum darf nicht in der Zukunft liegen
    if (datum > getTodayString()) {
      present({
        message: 'Das Datum darf nicht in der Zukunft liegen',
        duration: 3000,
        color: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      await receiptService.create({
        datum,
        receipt_type_id: receiptTypeId,
        betrag: betragNum,
        kommentar: kommentar || null,
        gruppe_id: profile.gruppe_id,
        fahrer_id: profile.id,
      });

      const selectedType = receiptTypes.find(t => t.id === receiptTypeId);
      present({
        message: `Beleg "${selectedType?.bezeichnung}" über ${betragNum.toFixed(2)} € erstellt`,
        duration: 2000,
        color: 'success',
      });

      history.goBack();
    } catch (error: any) {
      present({
        message: error.message || 'Fehler beim Erstellen des Belegs',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    marginBottom: '16px',
    '--background': '#f4f5f8',
    '--border-width': '1px',
    '--border-style': 'solid',
    '--border-color': '#d7d8da',
    '--border-radius': '8px',
    '--padding-start': '16px',
    '--padding-end': '16px',
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/receipts" />
          </IonButtons>
          <IonTitle>Neuer Beleg</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Beleg eintragen</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {loadingTypes ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                <IonSpinner />
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <IonInput
                  type="date"
                  label="Datum *"
                  labelPlacement="floating"
                  fill="solid"
                  value={datum}
                  max={getTodayString()}
                  onIonInput={(e) => setDatum(e.detail.value!)}
                  required
                  style={inputStyle}
                />

                <IonSelect
                  label="Art *"
                  labelPlacement="floating"
                  fill="solid"
                  value={receiptTypeId}
                  onIonChange={(e) => setReceiptTypeId(e.detail.value)}
                  interface="action-sheet"
                  style={inputStyle}
                >
                  {receiptTypes.map((type) => (
                    <IonSelectOption key={type.id} value={type.id}>
                      {type.bezeichnung}
                    </IonSelectOption>
                  ))}
                </IonSelect>

                <IonInput
                  type="number"
                  inputMode="decimal"
                  label="Betrag in Euro *"
                  labelPlacement="floating"
                  fill="solid"
                  value={betrag}
                  onIonInput={(e) => setBetrag(e.detail.value!)}
                  min="0"
                  step="0.01"
                  required
                  style={inputStyle}
                />

                <IonTextarea
                  label="Kommentar"
                  labelPlacement="floating"
                  fill="solid"
                  value={kommentar}
                  onIonInput={(e) => setKommentar(e.detail.value!)}
                  rows={3}
                  style={inputStyle}
                />

                {/* Vorschau */}
                {betrag && parseFloat(betrag.replace(',', '.')) > 0 && (
                  <div style={{
                    padding: '12px',
                    background: '#ffebee',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <p style={{ margin: 0, color: 'var(--ion-color-danger)' }}>
                      Betrag: <strong>{parseFloat(betrag.replace(',', '.')).toFixed(2)} €</strong>
                    </p>
                  </div>
                )}

                <IonButton
                  expand="block"
                  type="submit"
                  disabled={loading}
                  style={{ marginTop: '20px' }}
                >
                  {loading ? <IonSpinner name="crescent" /> : 'Beleg erstellen'}
                </IonButton>
              </form>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default ReceiptCreate;

