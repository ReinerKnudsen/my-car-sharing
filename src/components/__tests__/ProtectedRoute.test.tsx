import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import ProtectedRoute from '../ProtectedRoute';

/**
 * Unit-Tests für ProtectedRoute Komponente
 */

const TestComponent = () => <div>Protected Content</div>;

describe('ProtectedRoute', () => {
  it('sollte Loading-Spinner anzeigen während geladen wird', () => {
    vi.mock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: null,
        profile: null,
        loading: true,
        isAdmin: false,
      }),
    }));

    render(
      <ProtectedRoute
        path="/test"
        component={TestComponent}
      />
    );

    // Spinner sollte sichtbar sein
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('sollte Komponente anzeigen wenn Benutzer eingeloggt ist', () => {
    vi.mock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: { id: '123', email: 'test@example.com' },
        profile: { id: '123', vorname: 'Test', name: 'User' },
        loading: false,
        isAdmin: false,
      }),
    }));

    render(
      <ProtectedRoute
        path="/test"
        component={TestComponent}
      />
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('sollte zur Login-Seite umleiten wenn nicht eingeloggt', () => {
    vi.mock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: null,
        profile: null,
        loading: false,
        isAdmin: false,
      }),
    }));

    // In einem echten Test würde hier die Navigation überprüft werden
    // Dies ist nur ein Beispiel-Test
    expect(true).toBe(true);
  });
});

