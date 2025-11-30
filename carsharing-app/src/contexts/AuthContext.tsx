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
    console.log('AuthProvider: Initializing...');
    
    // Check active session
    checkUser();

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'kein Benutzer');
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          console.log('Auth state changed: Benutzer abgemeldet, setze auf null');
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      //console.error('Error setting up auth listener:', error);
      setLoading(false);
    }
  }, []);

  const checkUser = async () => {
    console.log('AuthProvider: Checking user session...');
    try {
      const session = await authService.getSession();
      console.log('AuthProvider: Session check result:', session ? 'Found' : 'None');
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      } else {
        console.log('AuthProvider: Keine Session gefunden, User bleibt null');
      }
    } catch (error) {
      console.error('AuthProvider: Error checking user:', error);
    } finally {
      setLoading(false);
      console.log('AuthProvider: Initialization complete, loading=false, user=', user ? 'present' : 'null');
    }
  };

  const loadProfile = async (userId: string) => {
    try {
      const profileData = await authService.getProfile(userId);
      setProfile(profileData);
    } catch (error) {
      //console.error('Error loading profile:', error);
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
    console.log('AuthContext: signOut aufgerufen');
    try {
      await authService.signOut();
      console.log('AuthContext: signOut erfolgreich, setze User und Profile auf null');
    } catch (error) {
      console.error('AuthContext: Fehler beim signOut (wird ignoriert)', error);
      // Fehler ignorieren - wir melden lokal trotzdem ab
    } finally {
      // IMMER die lokalen States löschen, auch bei Fehler
      console.log('AuthContext: Setze User und Profile auf null');
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

