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
  ist_gruppen_admin: boolean;
  ist_gesperrt: boolean;
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
  kosten: number | null;
  created_at: string;
  // Joined data
  fahrer?: Profile;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface GroupCosts {
  total_trips: number;
  total_kilometers: number;
  total_costs: number;
}

export interface DriverCosts {
  fahrer_id: string;
  fahrer_name: string;
  trip_count: number;
  total_kilometers: number;
  total_costs: number;
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

export interface InvitationCode {
  id: string;
  code: string;
  gruppe_id: string;
  created_by: string;
  expires_at: string | null;
  max_uses: number;
  uses_count: number;
  is_active: boolean;
  created_at: string;
  // Joined data
  gruppe?: Group;
  creator?: Profile;
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
  ist_gruppen_admin: boolean;
}

export interface GroupFormData {
  bezeichnung: string;
}

export interface InvitationCodeFormData {
  gruppe_id: string;
  expires_at?: string;
  max_uses: number;
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
  isGroupAdmin: boolean;
}

// Database Insert Types
export type InsertTrip = Omit<Trip, 'id' | 'created_at' | 'fahrer'>;
export type InsertBooking = Omit<Booking, 'id' | 'created_at' | 'gruppe' | 'fahrer'>;
export type InsertProfile = Omit<Profile, 'id' | 'created_at' | 'gruppe'>;
export type InsertGroup = Omit<Group, 'id' | 'created_at'>;
export type InsertInvitationCode = Omit<InvitationCode, 'id' | 'created_at' | 'uses_count' | 'gruppe' | 'creator'>;

// Update Types
export type UpdateTrip = Partial<InsertTrip>;
export type UpdateBooking = Partial<InsertBooking>;
export type UpdateProfile = Partial<InsertProfile>;
export type UpdateGroup = Partial<InsertGroup>;
export type UpdateInvitationCode = Partial<Pick<InvitationCode, 'is_active' | 'expires_at' | 'max_uses'>>;

