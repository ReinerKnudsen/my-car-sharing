import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import { Profile } from '../types';

/**
 * Custom render für Tests mit allen notwendigen Providern
 */

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialAuth?: {
    user: { id: string; email: string } | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;
  };
}

function AllTheProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

/**
 * Mock-Daten für Tests
 */
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
};

export const mockProfile: Profile = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  vorname: 'Test',
  name: 'User',
  gruppe_id: '123e4567-e89b-12d3-a456-426614174001',
  ist_admin: false,
  ist_gruppen_admin: false,
  created_at: '2024-01-01T00:00:00Z',
  gruppe: {
    id: '123e4567-e89b-12d3-a456-426614174001',
    bezeichnung: 'Test Gruppe',
    created_at: '2024-01-01T00:00:00Z',
  },
};

export const mockAdminProfile: Profile = {
  ...mockProfile,
  ist_admin: true,
};

export const mockGroup = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  bezeichnung: 'Test Gruppe',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockTrip = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  start_kilometer: 1000,
  end_kilometer: 1050,
  datum: '2024-01-01',
  fahrer_id: mockUser.id,
  kommentar: null,
  created_at: '2024-01-01T00:00:00Z',
  fahrer: mockProfile,
};

export const mockBooking = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  start_datum: '2024-01-01',
  start_uhrzeit: '14:00:00',
  ende_datum: '2024-01-01',
  ende_uhrzeit: '18:00:00',
  gruppe_id: mockGroup.id,
  fahrer_id: mockUser.id,
  kommentar: 'Test Buchung',
  created_at: '2024-01-01T00:00:00Z',
  gruppe: mockGroup,
  fahrer: mockProfile,
};

/**
 * Helper-Funktionen
 */
export function waitFor(callback: () => void, options?: { timeout?: number }) {
  return new Promise((resolve) => {
    const timeout = options?.timeout || 1000;
    setTimeout(() => {
      callback();
      resolve(undefined);
    }, timeout);
  });
}

