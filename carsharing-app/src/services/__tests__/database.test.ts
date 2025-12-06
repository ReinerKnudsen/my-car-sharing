import { describe, it, expect, vi, beforeEach } from 'vitest';
import { groupsService, profilesService, tripsService, bookingsService } from '../database';
import { supabase } from '../supabase';
import { mockGroup, mockProfile, mockTrip, mockBooking } from '../../test/test-utils';

/**
 * Unit-Tests für Database Services
 */

describe('groupsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('sollte alle Gruppen zurückgeben', async () => {
      const mockGroups = [mockGroup];
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockGroups,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await groupsService.getAll();

      expect(supabase.from).toHaveBeenCalledWith('groups');
      expect(mockFrom.select).toHaveBeenCalledWith('*');
      expect(mockFrom.order).toHaveBeenCalledWith('bezeichnung');
      expect(result).toEqual(mockGroups);
    });
  });

  describe('getById', () => {
    it('sollte Gruppe nach ID zurückgeben', async () => {
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockGroup,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await groupsService.getById('123');

      expect(mockFrom.eq).toHaveBeenCalledWith('id', '123');
      expect(result).toEqual(mockGroup);
    });
  });

  describe('create', () => {
    it('sollte neue Gruppe erstellen', async () => {
      const newGroup = { bezeichnung: 'Neue Gruppe' };
      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...newGroup, id: '123' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await groupsService.create(newGroup);

      expect(mockFrom.insert).toHaveBeenCalledWith(newGroup);
      expect(result).toHaveProperty('id');
    });
  });

  describe('update', () => {
    it('sollte Gruppe aktualisieren', async () => {
      const updates = { bezeichnung: 'Geänderte Gruppe' };
      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockGroup, ...updates },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await groupsService.update('123', updates);

      expect(mockFrom.update).toHaveBeenCalledWith(updates);
      expect(mockFrom.eq).toHaveBeenCalledWith('id', '123');
      expect(result.bezeichnung).toBe(updates.bezeichnung);
    });
  });

  describe('delete', () => {
    it('sollte Gruppe löschen', async () => {
      const mockFrom = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      await groupsService.delete('123');

      expect(mockFrom.delete).toHaveBeenCalled();
      expect(mockFrom.eq).toHaveBeenCalledWith('id', '123');
    });
  });
});

describe('tripsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('sollte alle Fahrten zurückgeben', async () => {
      const mockTrips = [mockTrip];
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockTrips,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await tripsService.getAll();

      expect(supabase.from).toHaveBeenCalledWith('trips');
      expect(result).toEqual(mockTrips);
    });
  });

  describe('create', () => {
    it('sollte neue Fahrt erstellen', async () => {
      const newTrip = {
        start_kilometer: 1000,
        end_kilometer: 1050,
        datum: '2024-01-01',
        fahrer_id: '123',
      };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...newTrip, id: '456' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await tripsService.create(newTrip);

      expect(mockFrom.insert).toHaveBeenCalledWith(newTrip);
      expect(result).toHaveProperty('id');
    });
  });

  describe('getTotalKilometers', () => {
    it('sollte Gesamt-Kilometer berechnen', async () => {
      const mockTrips = [
        { start_kilometer: 1000, end_kilometer: 1050 },
        { start_kilometer: 1050, end_kilometer: 1100 },
      ];

      const mockFrom = {
        select: vi.fn().mockResolvedValue({
          data: mockTrips,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await tripsService.getTotalKilometers();

      expect(result).toBe(100); // (1050-1000) + (1100-1050)
    });

    it('sollte 0 zurückgeben wenn keine Fahrten vorhanden', async () => {
      const mockFrom = {
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await tripsService.getTotalKilometers();

      expect(result).toBe(0);
    });
  });

  describe('getKilometersByFahrer', () => {
    it('sollte Kilometer für spezifischen Fahrer berechnen', async () => {
      const mockTrips = [
        { start_kilometer: 1000, end_kilometer: 1030 },
      ];

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: mockTrips,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await tripsService.getKilometersByFahrer('123');

      expect(mockFrom.eq).toHaveBeenCalledWith('fahrer_id', '123');
      expect(result).toBe(30);
    });
  });
});

describe('bookingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('sollte alle Buchungen zurückgeben', async () => {
      const mockBookings = [mockBooking];
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      mockFrom.order.mockResolvedValueOnce(mockFrom);
      mockFrom.order.mockResolvedValueOnce({
        data: mockBookings,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await bookingsService.getAll();

      expect(supabase.from).toHaveBeenCalledWith('bookings');
      expect(result).toEqual(mockBookings);
    });
  });

  describe('create', () => {
    it('sollte neue Buchung erstellen', async () => {
      const newBooking = {
        start_datum: '2024-01-01',
        start_uhrzeit: '14:00:00',
        ende_datum: '2024-01-01',
        ende_uhrzeit: '18:00:00',
        gruppe_id: '456',
        fahrer_id: '123',
        kommentar: 'Test',
      };

      const mockFrom = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...newBooking, id: '789' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await bookingsService.create(newBooking);

      expect(mockFrom.insert).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('getUpcoming', () => {
    it('sollte nur kommende Buchungen zurückgeben', async () => {
      const today = new Date().toISOString().split('T')[0];
      const mockBookings = [mockBooking];
      
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      mockFrom.order.mockResolvedValueOnce(mockFrom);
      mockFrom.order.mockResolvedValueOnce({
        data: mockBookings,
        error: null,
      });

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await bookingsService.getUpcoming();

      expect(mockFrom.gte).toHaveBeenCalledWith('datum', today);
      expect(result).toEqual(mockBookings);
    });
  });
});

describe('profilesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('sollte alle Profile zurückgeben', async () => {
      const mockProfiles = [mockProfile];
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockProfiles,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await profilesService.getAll();

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(result).toEqual(mockProfiles);
    });
  });

  describe('getByGroupId', () => {
    it('sollte Profile nach Gruppen-ID filtern', async () => {
      const mockProfiles = [mockProfile];
      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockProfiles,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await profilesService.getByGroupId('456');

      expect(mockFrom.eq).toHaveBeenCalledWith('gruppe_id', '456');
      expect(result).toEqual(mockProfiles);
    });
  });
});

