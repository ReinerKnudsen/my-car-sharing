import React, { useState, useEffect, useRef } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonBadge,
  IonBackButton,
  IonButtons,
  IonButton,
  IonIcon,
  IonModal,
  useIonAlert,
  useIonToast,
  useIonViewWillEnter,
} from '@ionic/react';
import { logoPaypal, closeOutline } from 'ionicons/icons';
import { RefresherEventDetail } from '@ionic/core';
import { useAuth } from '../contexts/AuthContext';
import { receiptService } from '../services/receipt.service';
import { settingsService } from '../services/settings.service';
import { GroupAccount as GroupAccountType, GroupAccountTransaction } from '../types';
import { formatDate } from '../utils/dateUtils';

const GroupAccount: React.FC = () => {
  const [account, setAccount] = useState<GroupAccountType | null>(null);
  const [transactions, setTransactions] = useState<GroupAccountTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState<string | null>(null);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [paypalSdkLoaded, setPaypalSdkLoaded] = useState(false);
  const [showPaypalModal, setShowPaypalModal] = useState(false);
  const [paypalProcessing, setPaypalProcessing] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const { profile, isGroupAdmin, isAdmin } = useAuth();
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  useIonViewWillEnter(() => {
    loadData();
  });

  // Lade auch bei Component Mount (erste Anzeige)
  useEffect(() => {
    loadData();
  }, [profile?.gruppe_id]);

  // Load PayPal SDK when client ID is available
  useEffect(() => {
    if (paypalClientId && !paypalSdkLoaded) {
      loadPayPalSdk(paypalClientId);
    }
  }, [paypalClientId, paypalSdkLoaded]);

  const loadPayPalSdk = (clientId: string) => {
    // Check if SDK already loaded
    if ((window as any).paypal) {
      setPaypalSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    const paypalBaseUrl = import.meta.env.VITE_PAYPAL_BASE_URL || 'https://www.paypal.com';
    const isSandbox = paypalBaseUrl.includes('sandbox');

    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR${isSandbox ? '&enable-funding=venmo' : ''}`;
    script.async = true;
    script.onload = () => {
      setPaypalSdkLoaded(true);
    };
    script.onerror = () => {
      presentToast({
        message: 'PayPal SDK konnte nicht geladen werden',
        duration: 3000,
        color: 'danger',
      });
    };
    document.body.appendChild(script);
  };

  const loadData = async () => {
    if (!profile?.gruppe_id) return;

    try {
      setLoading(true);
      const [accountData, transactionData, paypalEmailData, paypalClientIdData] = await Promise.all(
        [
          receiptService.getGroupAccount(profile.gruppe_id),
          receiptService.getGroupAccountTransactions(profile.gruppe_id, undefined, undefined, 20),
          settingsService.getPayPalEmail(),
          settingsService.getPayPalClientId(),
        ]
      );
      setAccount(accountData);
      setTransactions(transactionData);
      setPaypalEmail(paypalEmailData);
      setPaypalClientId(paypalClientIdData);
    } catch (error) {
      console.error('Error loading group account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayPalPayment = () => {
    if (!paypalSdkLoaded || !paypalClientId) {
      presentToast({
        message: 'PayPal ist noch nicht konfiguriert',
        duration: 3000,
        color: 'warning',
      });
      return;
    }
    setShowPaypalModal(true);
  };

  const createPaymentReceipt = async (amount: number) => {
    if (!profile?.gruppe_id) return;

    try {
      // Hole die "Überweisung" Belegart
      const types = await receiptService.getReceiptTypes();
      const transferType = types.find((t) => t.bezeichnung === 'Überweisung');

      if (!transferType) {
        throw new Error('Belegart "Überweisung" nicht gefunden');
      }

      // Erstelle Beleg
      const today = new Date();
      const datum = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

      await receiptService.create({
        datum,
        receipt_type_id: transferType.id,
        betrag: amount,
        kommentar: `PayPal-Zahlung von ${profile.vorname} ${profile.name}`,
        gruppe_id: profile.gruppe_id,
        fahrer_id: profile.id,
      });

      presentToast({
        message: `Zahlung von ${amount.toFixed(2)} € erfolgreich eingetragen! 🎉`,
        duration: 3000,
        color: 'success',
      });

      // Daten neu laden
      loadData();
    } catch (error: any) {
      presentToast({
        message: error.message || 'Fehler beim Erstellen des Belegs',
        duration: 3000,
        color: 'danger',
      });
    } finally {
      setPaypalProcessing(false);
    }
  };

  // Render PayPal button in the modal
  const renderPayPalButton = () => {
    if (!paypalSdkLoaded || !account || !paypalButtonRef.current) return;

    const paypal = (window as any).paypal;
    if (!paypal) return;

    // Clear previous button
    paypalButtonRef.current.innerHTML = '';

    const amountToPay = Math.abs(account.balance);

    paypal
      .Buttons({
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [
              {
                description: 'CarSharing Gruppenkonto',
                amount: {
                  currency_code: 'EUR',
                  value: amountToPay.toFixed(2),
                },
                payee: {
                  email_address: paypalEmail,
                },
              },
            ],
          });
        },
        onApprove: async (data: any, actions: any) => {
          setPaypalProcessing(true);
          try {
            const order = await actions.order.capture();

            // Create receipt
            await createPaymentReceipt(amountToPay);

            // Close modal
            setShowPaypalModal(false);
          } catch (error) {
            console.error('Error capturing payment:', error);
            presentToast({
              message: 'Fehler bei der Zahlungsabwicklung',
              duration: 3000,
              color: 'danger',
            });
            setPaypalProcessing(false);
          }
        },
        onCancel: () => {
          presentToast({
            message: 'Zahlung abgebrochen',
            duration: 2000,
            color: 'medium',
          });
          setShowPaypalModal(false);
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          presentToast({
            message: 'PayPal Fehler: ' + (err.message || 'Unbekannter Fehler'),
            duration: 3000,
            color: 'danger',
          });
        },
      })
      .render(paypalButtonRef.current);
  };

  // Render button when modal opens and SDK is loaded
  useEffect(() => {
    if (showPaypalModal && paypalSdkLoaded) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        renderPayPalButton();
      }, 100);
    }
  }, [showPaypalModal, paypalSdkLoaded]);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    await loadData();
    event.detail.complete();
  };

  // Nur Gruppenadmin oder Admin haben Zugriff
  if (!isGroupAdmin && !isAdmin) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/profile" />
            </IonButtons>
            <IonTitle>Gruppenkonto</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonText color="medium">
              <p>Nur für Gruppenadmins zugänglich</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/profile" />
          </IonButtons>
          <IonTitle>Gruppenkonto</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        {!profile?.gruppe_id ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <IonText color="medium">
              <p>Du bist keiner Gruppe zugeordnet</p>
            </IonText>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <IonSpinner />
          </div>
        ) : (
          <>
            {/* Gruppen-Header */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>{profile.gruppe?.bezeichnung}</IonCardTitle>
              </IonCardHeader>
            </IonCard>

            {/* Kontoübersicht */}
            {account && (
              <IonCard>
                <IonCardContent>
                  {/* Kosten (Fahrten) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>Kilometer-Kosten</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {account.trip_count} Fahrten
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: 'var(--ion-color-danger)',
                      }}
                    >
                      -{account.total_trip_costs.toFixed(2)} €
                    </div>
                  </div>

                  {/* Einzahlungen (Belege) */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid #eee',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '500' }}>Einzahlungen</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {account.receipt_count} Belege
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: 'var(--ion-color-success)',
                      }}
                    >
                      +{account.total_receipts.toFixed(2)} €
                    </div>
                  </div>

                  {/* Saldo */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 0 4px 0',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Saldo</div>
                    <div
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color:
                          account.balance >= 0
                            ? 'var(--ion-color-success)'
                            : 'var(--ion-color-danger)',
                      }}
                    >
                      {account.balance > 0 ? '+' : ''}
                      {account.balance.toFixed(2)} €
                    </div>
                  </div>

                  {/* Erklärung - nur anzeigen wenn Balance nicht 0 */}
                  {account.balance !== 0 && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: account.balance > 0 ? '#e8f5e9' : '#ffebee',
                        borderRadius: '8px',
                        fontSize: '14px',
                        color: '#666',
                      }}
                    >
                      {account.balance > 0 ? (
                        <>
                          💰 Die Gruppe hat <strong>{account.balance.toFixed(2)} €</strong>{' '}
                          Guthaben.
                        </>
                      ) : (
                        <>
                          ⚠️ Die Gruppe muss noch{' '}
                          <strong>{Math.abs(account.balance).toFixed(2)} €</strong> bezahlen.
                        </>
                      )}
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            )}

            {/* PayPal Zahlung - nur bei negativem Saldo und wenn PayPal konfiguriert ist */}
            {account && account.balance < 0 && paypalEmail && paypalClientId && (
              <IonCard style={{ background: 'var(--ion-color-warning-tint)' }}>
                <IonCardContent>
                  <div style={{ textAlign: 'center' }}>
                    <IonText>
                      <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
                        💳 Bezahle den offenen Betrag per PayPal
                      </p>
                    </IonText>
                    <IonButton
                      expand="block"
                      color="dark"
                      onClick={handlePayPalPayment}
                      disabled={paypalProcessing || !paypalSdkLoaded}
                      style={{
                        '--background': '#0070ba',
                        '--background-hover': '#005ea6',
                        '--color': 'white',
                      }}
                    >
                      {paypalProcessing ? (
                        <IonSpinner name="crescent" />
                      ) : !paypalSdkLoaded ? (
                        <>
                          <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                          PayPal lädt...
                        </>
                      ) : (
                        <>
                          <IonIcon slot="start" icon={logoPaypal} />
                          {Math.abs(account.balance).toFixed(2)} € per PayPal zahlen
                        </>
                      )}
                    </IonButton>
                    <IonText color="medium">
                      <p style={{ margin: '12px 0 0 0', fontSize: '12px' }}>An: {paypalEmail}</p>
                    </IonText>
                  </div>
                </IonCardContent>
              </IonCard>
            )}

            {/* Transaktionsliste */}
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Kontobewegungen</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {transactions.length === 0 ? (
                  <IonText color="medium">
                    <p>Keine Kontobewegungen vorhanden</p>
                  </IonText>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {transactions.map((tx, index) => (
                      <div
                        key={`${tx.id}-${index}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          padding: '10px 0',
                          borderBottom:
                            index < transactions.length - 1 ? '1px solid #f0f0f0' : 'none',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', color: '#888' }}>
                              {formatDate(tx.datum, false)}
                            </span>
                            <IonBadge
                              color={tx.einnahme > 0 ? 'success' : 'danger'}
                              style={{ fontSize: '10px', '--color': '#fff' }}
                            >
                              {tx.typ}
                            </IonBadge>
                          </div>
                          <div style={{ fontSize: '14px', marginTop: '2px' }}>
                            {tx.fahrer_name}
                            {tx.beschreibung && (
                              <span style={{ color: '#888', marginLeft: '8px' }}>
                                • {tx.beschreibung}
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            fontWeight: 'bold',
                            color:
                              tx.einnahme > 0
                                ? 'var(--ion-color-success)'
                                : 'var(--ion-color-danger)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tx.einnahme > 0 ? '+' : '-'}
                          {(tx.einnahme || tx.ausgabe).toFixed(2)} €
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </>
        )}

        {/* PayPal Checkout Modal */}
        <IonModal isOpen={showPaypalModal} onDidDismiss={() => setShowPaypalModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>PayPal Zahlung</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowPaypalModal(false)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <IonText>
                <h2>Zahlung: {account && Math.abs(account.balance).toFixed(2)} €</h2>
                <p style={{ color: '#666', fontSize: '14px' }}>An: {paypalEmail}</p>
              </IonText>
            </div>

            {/* PayPal Button Container */}
            <div
              ref={paypalButtonRef}
              style={{
                minHeight: '150px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {!paypalSdkLoaded && (
                <div style={{ textAlign: 'center' }}>
                  <IonSpinner name="crescent" />
                  <p style={{ marginTop: '16px', color: '#666' }}>PayPal lädt...</p>
                </div>
              )}
            </div>

            {paypalProcessing && (
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <IonSpinner name="crescent" />
                <p style={{ marginTop: '16px', color: '#666' }}>Zahlung wird verarbeitet...</p>
              </div>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default GroupAccount;
