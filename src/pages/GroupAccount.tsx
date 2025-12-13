import React, { useState, useEffect } from 'react';
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
  useIonViewWillEnter,
} from '@ionic/react';
import { RefresherEventDetail } from '@ionic/core';
import { useAuth } from '../contexts/AuthContext';
import { receiptService } from '../services/receipt.service';
import { GroupAccount as GroupAccountType, GroupAccountTransaction } from '../types';
import { formatDate } from '../utils/dateUtils';

const GroupAccount: React.FC = () => {
  const [account, setAccount] = useState<GroupAccountType | null>(null);
  const [transactions, setTransactions] = useState<GroupAccountTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile, isGroupAdmin, isAdmin } = useAuth();

  useIonViewWillEnter(() => {
    loadData();
  });

  const loadData = async () => {
    if (!profile?.gruppe_id) return;

    try {
      setLoading(true);
      const [accountData, transactionData] = await Promise.all([
        receiptService.getGroupAccount(profile.gruppe_id),
        receiptService.getGroupAccountTransactions(profile.gruppe_id, undefined, undefined, 100),
      ]);
      setAccount(accountData);
      setTransactions(transactionData);
    } catch (error) {
      console.error('Error loading group account:', error);
    } finally {
      setLoading(false);
    }
  };

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
                  {/* Einnahmen (Fahrten) */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>Fahrten</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {account.trip_count} Fahrten
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      color: 'var(--ion-color-success)' 
                    }}>
                      +{account.total_trip_costs.toFixed(2)} €
                    </div>
                  </div>

                  {/* Ausgaben (Belege) */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>Belege</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {account.receipt_count} Belege
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      color: 'var(--ion-color-danger)' 
                    }}>
                      -{account.total_receipts.toFixed(2)} €
                    </div>
                  </div>

                  {/* Saldo */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '16px 0 4px 0',
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Saldo</div>
                    <div style={{ 
                      fontSize: '24px', 
                      fontWeight: 'bold', 
                      color: account.balance >= 0 ? 'var(--ion-color-success)' : 'var(--ion-color-danger)' 
                    }}>
                      {account.balance >= 0 ? '+' : ''}{account.balance.toFixed(2)} €
                    </div>
                  </div>

                  {/* Erklärung */}
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    background: account.balance >= 0 ? '#e8f5e9' : '#ffebee',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#666'
                  }}>
                    {account.balance >= 0 ? (
                      <>
                        💰 Die Gruppe hat noch <strong>{account.balance.toFixed(2)} €</strong> Guthaben, 
                        das für Ausgaben verwendet werden kann.
                      </>
                    ) : (
                      <>
                        ⚠️ Die Ausgaben übersteigen die Einnahmen um <strong>{Math.abs(account.balance).toFixed(2)} €</strong>.
                      </>
                    )}
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
                          borderBottom: index < transactions.length - 1 ? '1px solid #f0f0f0' : 'none'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '13px', color: '#888' }}>
                              {formatDate(tx.datum, false)}
                            </span>
                            <IonBadge 
                              color={tx.einnahme > 0 ? 'success' : 'danger'}
                              style={{ fontSize: '10px' }}
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
                        <div style={{ 
                          fontWeight: 'bold',
                          color: tx.einnahme > 0 ? 'var(--ion-color-success)' : 'var(--ion-color-danger)',
                          whiteSpace: 'nowrap'
                        }}>
                          {tx.einnahme > 0 ? '+' : '-'}{(tx.einnahme || tx.ausgabe).toFixed(2)} €
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </IonCardContent>
            </IonCard>
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

export default GroupAccount;

