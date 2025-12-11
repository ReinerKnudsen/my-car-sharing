// Database Types
export interface Group {
  id: string;
  bezeichnung: string;
  created_at: string;
}

export interface Profile {
  id: string;
  vorname: string;
  name: string;
  gruppe_id: string | null;
  ist_admin: boolean;
  created_at: string;
  // Joined data
  gruppe?: Group;
}

export interface Trip {
  id: string;
  start_kilometer: number;
  end_kilometer: number;
  datum: string;
  fahrer_id: string;
  kommentar: string | null;
  created_at: string;
  // Joined data
  fahrer?: Profile;
}

export interface Booking {
  id: string;
  start_datum: string;
  start_uhrzeit: string;
  ende_datum: string;
  ende_uhrzeit: string;
  gruppe_id: string;
  fahrer_id: string;
  kommentar: string | null;
  created_at: string;
  // Joined data
  gruppe?: Group;
  fahrer?: Profile;
}

// Form Types
export interface TripFormData {
  start_kilometer: number;
  end_kilometer: number;
  datum: string;
  kommentar?: string;
}

export interface BookingFormData {
  start_datum: string;
  start_uhrzeit: string;
  ende_datum: string;
  ende_uhrzeit: string;
  gruppe_id: string;
  kommentar?: string;
}

export interface ProfileFormData {
  vorname: string;
  name: string;
  gruppe_id: string | null;
  ist_admin: boolean;
}

export interface GroupFormData {
  bezeichnung: string;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
}

// Database Insert Types
export type InsertTrip = Omit<Trip, 'id' | 'created_at' | 'fahrer'>;
export type InsertBooking = Omit<Booking, 'id' | 'created_at' | 'gruppe' | 'fahrer'>;
export type InsertProfile = Omit<Profile, 'id' | 'created_at' | 'gruppe'>;
export type InsertGroup = Omit<Group, 'id' | 'created_at'>;

// Update Types
export type UpdateTrip = Partial<InsertTrip>;
export type UpdateBooking = Partial<InsertBooking>;
export type UpdateProfile = Partial<InsertProfile>;
export type UpdateGroup = Partial<InsertGroup>;

