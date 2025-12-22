import { supabase } from './supabase';
import {
  Group,
  Profile,
  Trip,
  Booking,
  ActiveTrip,
  InsertGroup,
  InsertProfile,
  InsertTrip,
  InsertBooking,
  InsertActiveTrip,
  UpdateGroup,
  UpdateProfile,
  UpdateTrip,
  UpdateBooking,
} from '../types';

// Groups Service
export const groupsService = {
  async getAll(): Promise<Group[]> {
    const { data, error } = await supabase.from('groups').select('*').order('bezeichnung');

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Group | null> {
    const { data, error } = await supabase.from('groups').select('*').eq('id', id).single();

    if (error) throw error;
    return data;
  },

  async create(group: InsertGroup): Promise<Group> {
    const { data, error } = await supabase.from('groups').insert(group).select().single();

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
    const { error } = await supabase.from('groups').delete().eq('id', id);

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
    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) throw error;
  },
};

// Trips Service
export const tripsService = {
  async getAll(): Promise<Trip[]> {
    const { data, error } = await supabase
      .from('trips')
      .select('*, fahrer:profiles(*, gruppe:groups(*))')
      .order('end_kilometer', { ascending: false }) // Höchster Kilometerstand zuerst
      .limit(50); // Nur die letzten 50 Fahrten laden

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
    const { error } = await supabase.from('trips').delete().eq('id', id);

    if (error) throw error;
  },

  async getTotalKilometers(): Promise<number> {
    const { data, error } = await supabase.from('trips').select('start_kilometer, end_kilometer');

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

  // Holt die letzte Fahrt (höchster Endkilometerstand)
  async getLastTrip(): Promise<Trip | null> {
    const { data, error } = await supabase
      .from('trips')
      .select('*, fahrer:profiles(*, gruppe:groups(*))')
      .order('end_kilometer', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Kein Eintrag gefunden ist kein Fehler
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  },
};

// Bookings Service
export const bookingsService = {
  // Holt nur aktive/zukünftige Buchungen (ende_datum >= heute)
  async getAll(): Promise<Booking[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('bookings')
      .select('*, gruppe:groups(*), fahrer:profiles(*, gruppe:groups(*))')
      .gte('ende_datum', today)
      .order('start_datum')
      .order('start_uhrzeit');

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
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('bookings')
      .select('*, gruppe:groups(*), fahrer:profiles(*, gruppe:groups(*))')
      .eq('fahrer_id', fahrerId)
      .gte('ende_datum', today)
      .order('start_datum')
      .order('start_uhrzeit');

    if (error) throw error;
    return data || [];
  },

  async getByGroupId(gruppeId: string): Promise<Booking[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('bookings')
      .select('*, gruppe:groups(*), fahrer:profiles(*, gruppe:groups(*))')
      .eq('gruppe_id', gruppeId)
      .gte('ende_datum', today)
      .order('start_datum')
      .order('start_uhrzeit');

    if (error) throw error;
    return data || [];
  },

  // Alias für getAll (beide holen nur aktive/zukünftige)
  async getUpcoming(): Promise<Booking[]> {
    return this.getAll();
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
    const { error } = await supabase.from('bookings').delete().eq('id', id);

    if (error) throw error;
  },
};

// Active Trips Service
export const activeTripsService = {
  async getByGroup(gruppeId: string): Promise<ActiveTrip | null> {
    const { data, error } = await supabase
      .from('active_trips')
      .select('*, fahrer:profiles(*, gruppe:groups(*))')
      .eq('gruppe_id', gruppeId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getAny(): Promise<ActiveTrip | null> {
    const { data, error } = await supabase
      .from('active_trips')
      .select('*, fahrer:profiles(*, gruppe:groups(*))')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(activeTrip: InsertActiveTrip): Promise<ActiveTrip> {
    const { data, error } = await supabase
      .from('active_trips')
      .insert(activeTrip)
      .select('*, fahrer:profiles(*, gruppe:groups(*))')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('active_trips').delete().eq('id', id);

    if (error) throw error;
  },

  async deleteByGroup(gruppeId: string): Promise<void> {
    const { error } = await supabase.from('active_trips').delete().eq('gruppe_id', gruppeId);

    if (error) throw error;
  },
};
