import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import TripCard from '../TripCard';
import { mockTrip } from '../../test/test-utils';

/**
 * Unit-Tests für TripCard Komponente
 */

// Mock useAuth Hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { 
      id: mockTrip.fahrer_id, 
      ist_admin: false, 
      ist_gruppen_admin: false,
      ist_gesperrt: false,
      gruppe_id: '123e4567-e89b-12d3-a456-426614174001',
    },
    isAdmin: false,
    isGroupAdmin: false,
    user: { id: mockTrip.fahrer_id, email: 'test@example.com' },
    loading: false,
  }),
}));

// Mock Ionic Hooks
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual('@ionic/react');
  return {
    ...(actual as object),
    useIonAlert: () => [vi.fn()],
    useIonToast: () => [vi.fn()],
  };
});

describe('TripCard', () => {
  it('sollte Fahrtdetails anzeigen', () => {
    render(<TripCard trip={mockTrip} />);

    // Prüfe ob Fahrer angezeigt wird
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    
    // Prüfe ob Kilometerstände angezeigt werden
    expect(screen.getByText(/1.000 km/)).toBeInTheDocument();
    expect(screen.getByText(/1.050 km/)).toBeInTheDocument();
  });

  it('sollte berechnete Distanz als Badge anzeigen', () => {
    render(<TripCard trip={mockTrip} />);

    const distance = mockTrip.end_kilometer - mockTrip.start_kilometer;
    expect(screen.getByText(`${distance} km`)).toBeInTheDocument();
  });

  it('sollte Gruppe anzeigen wenn vorhanden', () => {
    render(<TripCard trip={mockTrip} />);

    if (mockTrip.fahrer?.gruppe) {
      expect(screen.getByText(mockTrip.fahrer.gruppe.bezeichnung)).toBeInTheDocument();
    }
  });

  it('sollte Löschen-Button für eigene Fahrten anzeigen', () => {
    render(<TripCard trip={mockTrip} />);

    const deleteButton = screen.queryByText('Löschen');
    expect(deleteButton).toBeInTheDocument();
  });

  it('sollte formatiertes Datum anzeigen', () => {
    render(<TripCard trip={mockTrip} />);

    // Deutsches Datum-Format sollte vorhanden sein
    const dateElements = screen.getAllByText(/2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('sollte deutsche Tausender-Trennung verwenden', () => {
    const longTrip = {
      ...mockTrip,
      start_kilometer: 10000,
      end_kilometer: 10500,
    };

    render(<TripCard trip={longTrip} />);

    // Deutsches Format: 10.000 statt 10,000
    expect(screen.getByText(/10\.000/)).toBeInTheDocument();
  });
});

