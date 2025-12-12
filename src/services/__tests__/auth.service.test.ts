import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth.service';
import { supabase } from '../supabase';

/**
 * Unit-Tests für Auth Service
 */

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    it('sollte Benutzer erfolgreich anmelden', async () => {
      const mockData = {
        user: { id: '123', email: 'test@example.com' },
        session: { access_token: 'token' },
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: mockData,
        error: null,
      } as any);

      const result = await authService.signIn('test@example.com', 'password');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result).toEqual(mockData);
    });

    it('sollte Fehler bei ungültigen Credentials werfen', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as any);

      await expect(
        authService.signIn('wrong@example.com', 'wrong')
      ).rejects.toThrow();
    });
  });

  describe('signUp', () => {
    it('sollte neuen Benutzer erfolgreich registrieren', async () => {
      const mockUser = { id: '123', email: 'new@example.com' };
      
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      const result = await authService.signUp(
        'new@example.com',
        'password123',
        'John',
        'Doe',
        null,
        false
      );

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
      expect(result.user).toEqual(mockUser);
    });

    it('sollte Fehler bei bereits existierender E-Mail werfen', async () => {
      const mockError = new Error('User already exists');
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as any);

      await expect(
        authService.signUp('existing@example.com', 'password', 'John', 'Doe', null)
      ).rejects.toThrow();
    });
  });

  describe('signOut', () => {
    it('sollte Benutzer erfolgreich abmelden', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);

      await authService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('sollte aktuelle Session zurückgeben', async () => {
      const mockSession = {
        access_token: 'token',
        user: { id: '123' },
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as any);

      const result = await authService.getSession();

      expect(result).toEqual(mockSession);
    });

    it('sollte null zurückgeben wenn keine Session vorhanden', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const result = await authService.getSession();

      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('sollte aktuellen Benutzer zurückgeben', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });
  });

  describe('getProfile', () => {
    it('sollte Benutzerprofil mit Gruppe zurückgeben', async () => {
      const mockProfile = {
        id: '123',
        vorname: 'John',
        name: 'Doe',
        gruppe_id: '456',
        ist_admin: false,
        ist_gruppen_admin: false,
        ist_gesperrt: false,
        created_at: '2024-01-01',
        gruppe: {
          id: '456',
          bezeichnung: 'Test Gruppe',
          created_at: '2024-01-01',
        },
      };

      const mockFrom = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await authService.getProfile('123');

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockFrom.select).toHaveBeenCalledWith('*, gruppe:groups(*)');
      expect(mockFrom.eq).toHaveBeenCalledWith('id', '123');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('sollte Profil erfolgreich aktualisieren', async () => {
      const updates = { vorname: 'Jane' };
      const mockUpdated = {
        id: '123',
        vorname: 'Jane',
        name: 'Doe',
      };

      const mockFrom = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdated,
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockFrom as any);

      const result = await authService.updateProfile('123', updates);

      expect(mockFrom.update).toHaveBeenCalledWith(updates);
      expect(mockFrom.eq).toHaveBeenCalledWith('id', '123');
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('resetPassword', () => {
    it('sollte Passwort-Reset-E-Mail senden', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as any);

      await authService.resetPassword('test@example.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('updatePassword', () => {
    it('sollte Passwort erfolgreich aktualisieren', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      } as any);

      await authService.updatePassword('newpassword123');

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });
  });
});

