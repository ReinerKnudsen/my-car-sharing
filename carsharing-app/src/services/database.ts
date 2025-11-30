import { supabase } from './supabase';
import { 
  Group, 
  Profile, 
  Trip, 
  Booking,
  InsertGroup,
  InsertProfile,
  InsertTrip,
  InsertBooking,
  UpdateGroup,
  UpdateProfile,
  UpdateTrip,
  UpdateBooking
} from '../types';

// Groups Service
export const groupsService = {
  async getAll(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('bezeichnung');
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(group: InsertGroup): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .insert(group)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UpdateGroup): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Profiles Service
export const profilesService = {
  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, gruppe:groups(*)')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, gruppe:groups(*)')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByGroupId(gruppeId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, gruppe:groups(*)')
      .eq('gruppe_id', gruppeId)
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async create(profile: InsertProfile): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select('*, gruppe:groups(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UpdateProfile): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select('*, gruppe:groups(*)')
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Trips Service
export const tripsService = {
  async getAll(): Promise<Trip[]> {
    const { data, error } = await supabase
      .from('trips')
      .select('*, fahrer:profiles(*, gruppe:groups(*))')
      .order('datum', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Trip | null> {
    const { data, error } = await supabase
      .from('trips')
      .select('*, fahrer:profiles(*, gruppe:groups(*))')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByFahrerId(fahrerId: string): Promise<Trip[]> {
    const { data, error } = await supabase
      .from('trips')
      .select('*, fahrer:profiles(*, gruppe:groups(*))')
      .eq('fahrer_id', fahrerId)
      .order('datum', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(trip: InsertTrip): Promise<Trip> {
    const { data, error } = await supabase
      .from('trips')
      .insert(trip)
      .select('*, fahrer:profiles(*, gruppe:groups(*))')
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UpdateTrip): Promise<Trip> {
    const { data, error } = await supabase
      .from('trips')
      .update(updates)
      .eq('id', id)
      .select('*, fahrer:profiles(*, gruppe:groups(*))')
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getTotalKilometers(): Promise<number> {
    const { data, error } = await supabase
      .from('trips')
      .select('start_kilometer, end_kilometer');
    
    if (error) throw error;
    
    if (!data || data.length === 0) return 0;
    
    return data.reduce((total, trip) => {
      return total + (trip.end_kilometer - trip.start_kilometer);
    }, 0);
  },

  async getKilometersByFahrer(fahrerId: string): Promise<number> {
    const { data, error } = await supabase
      .from('trips')
      .select('start_kilometer, end_kilometer')
      .eq('fahrer_id', fahrerId);
    
    if (error) throw error;
    
    if (!data || data.length === 0) return 0;
    
    return data.reduce((total, trip) => {
      return total + (trip.end_kilometer - trip.start_kilometer);
    }, 0);
  },
};

// Bookings Service
export const bookingsService = {
  async getAll(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, gruppe:groups(*), fahrer:profiles(*, gruppe:groups(*))')
      .order('datum', { ascending: false })
      .order('uhrzeit', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, gruppe:groups(*), fahrer:profiles(*, gruppe:groups(*))')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByFahrerId(fahrerId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, gruppe:groups(*), fahrer:profiles(*, gruppe:groups(*))')
      .eq('fahrer_id', fahrerId)
      .order('datum', { ascending: false })
      .order('uhrzeit', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getByGroupId(gruppeId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, gruppe:groups(*), fahrer:profiles(*, gruppe:groups(*))')
      .eq('gruppe_id', gruppeId)
      .order('datum', { ascending: false })
      .order('uhrzeit', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getUpcoming(): Promise<Booking[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('bookings')
      .select('*, gruppe:groups(*), fahrer:profiles(*, gruppe:groups(*))')
      .gte('datum', today)
      .order('datum')
      .order('uhrzeit');
    
    if (error) throw error;
    return data || [];
  },

  async create(booking: InsertBooking): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select('*, gruppe:groups(*), fahrer:profiles(*, gruppe:groups(*))')
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: UpdateBooking): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select('*, gruppe:groups(*), fahrer:profiles(*, gruppe:groups(*))')
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

