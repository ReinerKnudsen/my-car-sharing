-- ============================================
-- CarSharing App - Migration: Benutzerverwaltung
-- ============================================
-- Diese Migration fügt hinzu:
-- 1. Sichere Funktion zum Einlösen von Einladungscodes
-- 2. ist_gesperrt Feld für Benutzer-Sperrung
-- 3. Aktualisierte RLS Policies für gesperrte Benutzer
-- ============================================

-- ============================================
-- 1. SICHERE FUNKTION FÜR EINLADUNGSCODE-NUTZUNG
-- ============================================
-- Diese Funktion läuft mit erhöhten Rechten (SECURITY DEFINER)
-- und kann von jedem authentifizierten Benutzer aufgerufen werden

CREATE OR REPLACE FUNCTION public.use_invitation_code(code_to_use VARCHAR)
RETURNS void AS $$
DECLARE
    code_record RECORD;
BEGIN
    -- Code suchen
    SELECT id, uses_count, max_uses, is_active, expires_at 
    INTO code_record
    FROM public.invitation_codes
    WHERE code = UPPER(code_to_use);
    
    -- Prüfen ob Code existiert
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Einladungscode nicht gefunden';
    END IF;
    
    -- Prüfen ob Code aktiv ist
    IF NOT code_record.is_active THEN
        RAISE EXCEPTION 'Einladungscode ist nicht mehr aktiv';
    END IF;
    
    -- Prüfen ob Code abgelaufen ist
    IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
        RAISE EXCEPTION 'Einladungscode ist abgelaufen';
    END IF;
    
    -- Prüfen ob max_uses erreicht
    IF code_record.uses_count >= code_record.max_uses THEN
        RAISE EXCEPTION 'Einladungscode wurde bereits vollständig verwendet';
    END IF;
    
    -- Code aktualisieren
    UPDATE public.invitation_codes
    SET 
        uses_count = uses_count + 1,
        is_active = CASE 
            WHEN uses_count + 1 >= max_uses THEN false 
            ELSE true 
        END
    WHERE id = code_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Berechtigung für authentifizierte Benutzer
GRANT EXECUTE ON FUNCTION public.use_invitation_code(VARCHAR) TO authenticated;

-- ============================================
-- 2. IST_GESPERRT FELD HINZUFÜGEN
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ist_gesperrt BOOLEAN DEFAULT FALSE;

-- ============================================
-- 3. RLS POLICIES FÜR GESPERRTE BENUTZER
-- ============================================

-- Bestehende Policies für bookings aktualisieren (INSERT)
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
CREATE POLICY "Non-blocked users can create bookings"
    ON public.bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fahrer_id = (select auth.uid())
        AND NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_gesperrt = true
        )
    );

-- Bestehende Policies für bookings aktualisieren (UPDATE)
DROP POLICY IF EXISTS "Users can update own bookings, admins can update all" ON public.bookings;
CREATE POLICY "Non-blocked users can update own bookings, admins can update all"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (
        (fahrer_id = (select auth.uid()) AND NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_gesperrt = true
        ))
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
    );

-- Bestehende Policies für trips aktualisieren (INSERT)
DROP POLICY IF EXISTS "Authenticated users can create trips" ON public.trips;
CREATE POLICY "Non-blocked users can create trips"
    ON public.trips
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fahrer_id = (select auth.uid())
        AND NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_gesperrt = true
        )
    );

-- Bestehende Policies für trips aktualisieren (UPDATE)
DROP POLICY IF EXISTS "Users can update own trips, admins can update all" ON public.trips;
CREATE POLICY "Non-blocked users can update own trips, admins can update all"
    ON public.trips
    FOR UPDATE
    TO authenticated
    USING (
        (fahrer_id = (select auth.uid()) AND NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_gesperrt = true
        ))
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
    );

-- ============================================
-- 4. FUNKTION ZUM SETZEN DES GRUPPEN-ADMINS
-- ============================================
-- Setzt einen Benutzer als Gruppen-Admin und entfernt ggf. den vorherigen

CREATE OR REPLACE FUNCTION public.set_group_admin(
    user_id UUID,
    remove_existing BOOLEAN DEFAULT false
)
RETURNS void AS $$
DECLARE
    user_gruppe_id UUID;
    existing_admin_id UUID;
BEGIN
    -- Prüfen ob der aufrufende Benutzer Admin ist
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (select auth.uid()) AND ist_admin = true
    ) THEN
        RAISE EXCEPTION 'Nur Administratoren können Gruppen-Admins setzen';
    END IF;
    
    -- Gruppe des Benutzers ermitteln
    SELECT gruppe_id INTO user_gruppe_id
    FROM public.profiles
    WHERE id = user_id;
    
    IF user_gruppe_id IS NULL THEN
        RAISE EXCEPTION 'Benutzer ist keiner Gruppe zugeordnet';
    END IF;
    
    -- Prüfen ob bereits ein Gruppen-Admin existiert
    SELECT id INTO existing_admin_id
    FROM public.profiles
    WHERE gruppe_id = user_gruppe_id
    AND ist_gruppen_admin = true
    AND id != user_id;
    
    IF existing_admin_id IS NOT NULL THEN
        IF NOT remove_existing THEN
            RAISE EXCEPTION 'Es existiert bereits ein Gruppen-Admin. Verwende remove_existing=true um zu überschreiben.';
        END IF;
        
        -- Bestehenden Admin entfernen
        UPDATE public.profiles
        SET ist_gruppen_admin = false
        WHERE id = existing_admin_id;
    END IF;
    
    -- Neuen Gruppen-Admin setzen
    UPDATE public.profiles
    SET ist_gruppen_admin = true
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Berechtigung für authentifizierte Benutzer (Funktion prüft intern auf Admin)
GRANT EXECUTE ON FUNCTION public.set_group_admin(UUID, BOOLEAN) TO authenticated;

-- ============================================
-- 5. FUNKTION ZUM ENTFERNEN DES GRUPPEN-ADMIN STATUS
-- ============================================
CREATE OR REPLACE FUNCTION public.remove_group_admin(user_id UUID)
RETURNS void AS $$
BEGIN
    -- Prüfen ob der aufrufende Benutzer Admin ist
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = (select auth.uid()) AND ist_admin = true
    ) THEN
        RAISE EXCEPTION 'Nur Administratoren können Gruppen-Admin Status entfernen';
    END IF;
    
    UPDATE public.profiles
    SET ist_gruppen_admin = false
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.remove_group_admin(UUID) TO authenticated;

-- ============================================
-- 6. RLS POLICIES FÜR GRUPPEN-ADMINS (Benutzerverwaltung)
-- ============================================

-- Gruppen-Admins können Profile in ihrer Gruppe aktualisieren (sperren)
DROP POLICY IF EXISTS "Users can update own profile, admins can update all" ON public.profiles;
CREATE POLICY "Users and group admins can update profiles"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        -- Eigenes Profil
        id = (select auth.uid())
        -- Oder Admin
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid())
            AND p.ist_admin = true
        )
        -- Oder Gruppen-Admin für Mitglieder seiner Gruppe (außer andere Admins)
        OR (
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (select auth.uid())
                AND p.ist_gruppen_admin = true
                AND p.gruppe_id = profiles.gruppe_id
            )
            AND profiles.ist_admin = false
            AND profiles.id != (select auth.uid())
        )
    );

-- Gruppen-Admins können Profile in ihrer Gruppe löschen (außer Gruppen-Admins und Admins)
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins and group admins can delete profiles"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        -- Admin kann alle löschen
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid())
            AND p.ist_admin = true
        )
        -- Oder Gruppen-Admin für normale Mitglieder seiner Gruppe
        OR (
            EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = (select auth.uid())
                AND p.ist_gruppen_admin = true
                AND p.gruppe_id = profiles.gruppe_id
            )
            AND profiles.ist_admin = false
            AND profiles.ist_gruppen_admin = false
            AND profiles.id != (select auth.uid())
        )
    );

-- ============================================
-- FERTIG!
-- ============================================

