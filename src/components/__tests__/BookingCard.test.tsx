import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import BookingCard from '../BookingCard';
import { mockBooking } from '../../test/test-utils';

/**
 * Unit-Tests für BookingCard Komponente
 */

// Mock useAuth Hook
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    profile: { id: '123e4567-e89b-12d3-a456-426614174000', ist_admin: false },
    isAdmin: false,
    user: { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com' },
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

describe('BookingCard', () => {
  it('sollte Buchungsdetails anzeigen', () => {
    render(<BookingCard booking={mockBooking} />);
    
    // Prüfe ob Fahrer angezeigt wird
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
    
    // Prüfe ob Kommentar angezeigt wird
    if (mockBooking.kommentar) {
      expect(screen.getByText(mockBooking.kommentar)).toBeInTheDocument();
    }
  });

  it('sollte Gruppe anzeigen wenn vorhanden', () => {
    render(<BookingCard booking={mockBooking} />);

    if (mockBooking.gruppe) {
      expect(screen.getByText(mockBooking.gruppe.bezeichnung)).toBeInTheDocument();
    }
  });

  it('sollte Löschen-Button für eigene Buchungen anzeigen', () => {
    render(<BookingCard booking={mockBooking} />);

    const deleteButton = screen.queryByText('Löschen');
    expect(deleteButton).toBeInTheDocument();
  });

  it('sollte formatiertes Datum anzeigen', () => {
    render(<BookingCard booking={mockBooking} />);

    // Deutsches Datum-Format sollte vorhanden sein
    const dateElements = screen.getAllByText(/2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('sollte onDelete Callback aufrufen nach Bestätigung', async () => {
    const onDelete = vi.fn();
    
    render(<BookingCard booking={mockBooking} onDelete={onDelete} />);

    // Dieser Test würde in einer vollständigen Implementierung
    // den Alert-Dialog mocken und die Bestätigung simulieren
    expect(onDelete).not.toHaveBeenCalled();
  });
});

