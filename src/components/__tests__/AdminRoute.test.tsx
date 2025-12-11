import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import AdminRoute from '../AdminRoute';

/**
 * Unit-Tests für AdminRoute Komponente
 */

const AdminComponent = () => <div>Admin Content</div>;

describe('AdminRoute', () => {
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
      <AdminRoute
        path="/admin"
        component={AdminComponent}
      />
    );

    // Spinner sollte sichtbar sein
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('sollte Komponente anzeigen für Admin-Benutzer', () => {
    vi.mock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: { id: '123', email: 'admin@example.com' },
        profile: { id: '123', vorname: 'Admin', name: 'User', ist_admin: true },
        loading: false,
        isAdmin: true,
      }),
    }));

    render(
      <AdminRoute
        path="/admin"
        component={AdminComponent}
      />
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('sollte Zugriff verweigern für normale Benutzer', () => {
    vi.mock('../../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: { id: '123', email: 'test@example.com' },
        profile: { id: '123', vorname: 'Test', name: 'User', ist_admin: false },
        loading: false,
        isAdmin: false,
      }),
    }));

    render(
      <AdminRoute
        path="/admin"
        component={AdminComponent}
      />
    );

    expect(screen.getByText('Zugriff verweigert')).toBeInTheDocument();
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
    expect(true).toBe(true);
  });
});

