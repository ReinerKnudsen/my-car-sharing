import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup nach jedem Test
afterEach(() => {
  cleanup();
});

// Mock für Supabase Client
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock für Ionic React Router
vi.mock('@ionic/react-router', () => ({
  IonReactRouter: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock für react-router-dom
vi.mock('react-router-dom', () => ({
  useHistory: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    goBack: vi.fn(),
  })),
  useLocation: vi.fn(() => ({
    pathname: '/',
    search: '',
  })),
  Route: vi.fn(({ component: Component }: any) => Component ? Component({}) : null),
  Redirect: vi.fn(() => null),
}));

