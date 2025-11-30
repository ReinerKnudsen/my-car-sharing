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
} from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import AuthGuard from './AuthGuard';

import Dashboard from '../pages/Dashboard';
import Bookings from '../pages/Bookings';
import BookingCreate from '../pages/BookingCreate';
import Trips from '../pages/Trips';
import TripCreate from '../pages/TripCreate';
import Profile from '../pages/Profile';
import Users from '../pages/admin/Users';
import Groups from '../pages/admin/Groups';
import Register from '../pages/Register';
import AdminRoute from './AdminRoute';

const MainTabs: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <AuthGuard>
      <IonTabs>
        <IonRouterOutlet>
          <Route exact path="/dashboard" component={Dashboard} />
          <Route exact path="/bookings" component={Bookings} />
          <Route exact path="/bookings/create" component={BookingCreate} />
          <Route exact path="/trips" component={Trips} />
          <Route exact path="/trips/create" component={TripCreate} />
          <Route exact path="/profile" component={Profile} />
          
          <AdminRoute exact path="/admin/users" component={Users} />
          <AdminRoute exact path="/admin/groups" component={Groups} />
          <AdminRoute exact path="/admin/register" component={Register} />
          
          <Route exact path="/">
            <Redirect to="/dashboard" />
          </Route>
        </IonRouterOutlet>

        <IonTabBar slot="bottom">
          <IonTabButton tab="dashboard" href="/dashboard">
            <IonIcon icon={speedometerOutline} />
            <IonLabel>Dashboard</IonLabel>
          </IonTabButton>

          <IonTabButton tab="bookings" href="/bookings">
            <IonIcon icon={calendarOutline} />
            <IonLabel>Buchungen</IonLabel>
          </IonTabButton>

          <IonTabButton tab="trips" href="/trips">
            <IonIcon icon={carOutline} />
            <IonLabel>Fahrten</IonLabel>
          </IonTabButton>

          {isAdmin && (
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
    </AuthGuard>
  );
};

export default MainTabs;
