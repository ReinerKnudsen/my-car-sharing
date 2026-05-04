import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
} from '@ionic/react';
import {
  peopleOutline,
  layersOutline,
  mailOutline,
  cashOutline,
  receiptOutline,
} from 'ionicons/icons';
import ProfileAvatarButton from '../../components/ProfileAvatarButton';

const AdminOverview: React.FC = () => {
  const menuItems = [
    {
      label: 'Fahrer',
      icon: peopleOutline,
      href: '/admin/users',
      description: 'Benutzer verwalten',
    },
    {
      label: 'Gruppen',
      icon: layersOutline,
      href: '/admin/groups',
      description: 'Gruppen verwalten',
    },
    {
      label: 'Einladungscodes',
      icon: mailOutline,
      href: '/admin/invitation-codes',
      description: 'Einladungen erstellen & verwalten',
    },
    {
      label: 'Kosten',
      icon: cashOutline,
      href: '/admin/settings',
      description: 'Kilometerkosten & PayPal',
    },
    {
      label: 'Belegarten',
      icon: receiptOutline,
      href: '/admin/receipt-types',
      description: 'Belegarten verwalten',
    },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Verwaltung</IonTitle>
          <ProfileAvatarButton />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList inset>
          {menuItems.map((item) => (
            <IonItem
              key={item.href}
              routerLink={item.href}
              detail
            >
              <IonIcon icon={item.icon} slot="start" color="primary" />
              <IonLabel>
                <h2>{item.label}</h2>
                <p>{item.description}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default AdminOverview;
