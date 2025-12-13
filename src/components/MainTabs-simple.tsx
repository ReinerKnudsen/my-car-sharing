import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import {
  speedometerOutline,
  calendarOutline,
  carOutline,
  peopleOutline,
  personOutline,
  receiptOutline,
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';

import Dashboard from '../pages/Dashboard';
import Bookings from '../pages/Bookings';
import BookingCreate from '../pages/BookingCreate';
import Trips from '../pages/Trips';
import TripCreate from '../pages/TripCreate';
import Receipts from '../pages/Receipts';
import ReceiptCreate from '../pages/ReceiptCreate';
import GroupAccount from '../pages/GroupAccount';
import Profile from '../pages/Profile';
import Users from '../pages/admin/Users';
import Groups from '../pages/admin/Groups';
import InvitationCodes from '../pages/admin/InvitationCodes';
import Settings from '../pages/admin/Settings';
import ReceiptTypes from '../pages/admin/ReceiptTypes';
import Register from '../pages/Register';

const MainTabs: React.FC = () => {
  const { isAdmin, isGroupAdmin } = useAuth();

  return (
    <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/dashboard" component={Dashboard} />
          <Route exact path="/trips" component={Trips} />
          <Route exact path="/trips/create" component={TripCreate} />
          <Route exact path="/bookings" component={Bookings} />
          <Route exact path="/bookings/create" component={BookingCreate} />
          <Route exact path="/receipts" component={Receipts} />
          <Route exact path="/receipts/create" component={ReceiptCreate} />
          <Route exact path="/group-account" component={GroupAccount} />
          <Route exact path="/profile" component={Profile} />
          <Route exact path="/admin/users" component={Users} />
          <Route exact path="/admin/groups" component={Groups} />
          <Route exact path="/admin/invitation-codes" component={InvitationCodes} />
          <Route exact path="/admin/settings" component={Settings} />
          <Route exact path="/admin/receipt-types" component={ReceiptTypes} />
          <Route exact path="/admin/register" component={Register} />
          <Route exact path="/">
            <Redirect to="/dashboard" />
          </Route>
        </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="dashboard" href="/dashboard">
          <IonIcon icon={speedometerOutline} />
          <IonLabel>Dashboard</IonLabel>
        </IonTabButton>

        <IonTabButton tab="trips" href="/trips">
          <IonIcon icon={carOutline} />
          <IonLabel>Fahrten</IonLabel>
        </IonTabButton>

        <IonTabButton tab="bookings" href="/bookings">
          <IonIcon icon={calendarOutline} />
          <IonLabel>Buchungen</IonLabel>
        </IonTabButton>

        <IonTabButton tab="receipts" href="/receipts">
          <IonIcon icon={receiptOutline} />
          <IonLabel>Belege</IonLabel>
        </IonTabButton>

        {(isAdmin || isGroupAdmin) && (
          <IonTabButton tab="admin" href="/admin/users">
            <IonIcon icon={peopleOutline} />
            <IonLabel>Verwaltung</IonLabel>
          </IonTabButton>
        )}

        <IonTabButton tab="profile" href="/profile">
          <IonIcon icon={personOutline} />
          <IonLabel>Profil</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default MainTabs;
