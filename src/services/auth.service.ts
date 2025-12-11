import { supabase } from './supabase';
import { Profile } from '../types';

export const authService = {
  // Sign In
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign Up
  async signUp(email: string, password: string, vorname: string, name: string, gruppe_id: string | null, ist_admin: boolean = false) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          vorname,
          name,
          gruppe_id,
          ist_admin,
        });
      
      if (profileError) throw profileError;
    }
    
    return data;
  },

  // Sign Out
  async signOut() {
    try {
      // Lokale Session löschen (schnell, kein Server-Call)
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      console.error("Fehler beim Abmelden:", error);
      
      // Fallback: Manuell localStorage löschen
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  },

  // Get Current Session
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Get Current User
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Get Profile for User
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, gruppe:groups(*)')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update Profile
  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Reset Password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  // Update Password
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  },
};

