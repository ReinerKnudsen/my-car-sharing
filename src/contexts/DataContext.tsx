import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { bookingsService, tripsService } from '../services/database';
import { settingsService } from '../services/settings.service';
import { Booking, Trip, GroupCosts, DriverCosts } from '../types';

interface DataContextType {
  bookings: Booking[];
  trips: Trip[];
  lastKilometer: number;
  groupCosts: GroupCosts | null;
  driverCosts: DriverCosts[];
  kostenProKm: number;
  loading: boolean;
  refreshAll: () => Promise<void>;
  refreshBookings: () => Promise<void>;
  refreshTrips: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [lastKilometer, setLastKilometer] = useState<number>(0);
  const [groupCosts, setGroupCosts] = useState<GroupCosts | null>(null);
  const [driverCosts, setDriverCosts] = useState<DriverCosts[]>([]);
  const [kostenProKm, setKostenProKm] = useState<number>(0.3);
  const [loading, setLoading] = useState(false);

  const refreshBookings = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await bookingsService.getAll();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  }, [profile]);

  const refreshTrips = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await tripsService.getAll();
      setTrips(data);

      const lastTrip = await tripsService.getLastTrip();
      if (lastTrip) {
        setLastKilometer(lastTrip.end_kilometer);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  }, [profile]);

  const refreshDashboard = useCallback(async () => {
    if (!profile) return;
    try {
      const costRate = await settingsService.getKostenProKm();
      setKostenProKm(costRate);

      if (profile.gruppe_id) {
        const costs = await settingsService.getGroupCosts(profile.gruppe_id);
        setGroupCosts(costs);

        const driverData = await settingsService.getGroupCostsByDriver(profile.gruppe_id);
        setDriverCosts(driverData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [profile]);

  const refreshAll = useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    try {
      await Promise.all([refreshBookings(), refreshTrips(), refreshDashboard()]);
    } catch (error) {
      console.error('Error refreshing all data:', error);
    } finally {
      setLoading(false);
    }
  }, [profile, refreshBookings, refreshTrips, refreshDashboard]);

  useEffect(() => {
    if (profile) {
      refreshAll();
    }
  }, [profile]);

  const value: DataContextType = {
    bookings,
    trips,
    lastKilometer,
    groupCosts,
    driverCosts,
    kostenProKm,
    loading,
    refreshAll,
    refreshBookings,
    refreshTrips,
    refreshDashboard,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
