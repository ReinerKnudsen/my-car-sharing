import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { authService } from '../services/auth.service';
import { Profile, AuthState } from '../types';

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, vorname: string, name: string, gruppeId: string | null, istAdmin?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Schritt 1: Hole User und setze loading SOFORT auf false
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false); // SOFORT auf false, egal was passiert
      
      // Schritt 2: Profil NACHTRÄGLICH laden (blockiert nicht)
      if (user) {
        loadProfile(user.id);
      }
    });

    // Schritt 3: Listener für Login/Logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, gruppe:groups(*)')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('AuthProvider: Error loading profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { user: authUser } = await authService.signIn(email, password);
    setUser(authUser);
    if (authUser) {
      await loadProfile(authUser.id);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    vorname: string,
    name: string,
    gruppeId: string | null,
    istAdmin: boolean = false
  ) => {
    const { user: authUser } = await authService.signUp(email, password, vorname, name, gruppeId, istAdmin);
    setUser(authUser);
    if (authUser) {
      await loadProfile(authUser.id);
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Fehler beim Abmelden:', error);
    } finally {
      setUser(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user: user ? { id: user.id, email: user.email || '' } : null,
    profile,
    loading,
    isAdmin: profile?.ist_admin || false,
    isGroupAdmin: profile?.ist_gruppen_admin || false,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

