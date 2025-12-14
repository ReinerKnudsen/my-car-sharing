-- ============================================
-- CarSharing App - Schema Migration
-- ============================================
-- Dieses Script erweitert eine bestehende Datenbank um:
-- - Einladungscodes-System
-- - Gruppen-Admin Funktionalität
--
-- Kann auf eine bestehende CarSharing-Datenbank angewendet werden.
-- ============================================

-- ============================================
-- 1. PROFILES ERWEITERN: ist_gruppen_admin Feld
-- ============================================
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ist_gruppen_admin BOOLEAN DEFAULT FALSE;

-- ============================================
-- 2. EINLADUNGSCODES TABELLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.invitation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    gruppe_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 1,
    uses_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. INDIZES FÜR INVITATION_CODES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON public.invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_gruppe ON public.invitation_codes(gruppe_id);

-- ============================================
-- 4. ROW LEVEL SECURITY AKTIVIEREN
-- ============================================
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES FÜR INVITATION_CODES
-- ============================================

-- Jeder kann Codes lesen (für Validierung bei Registrierung) - aber nur aktive
CREATE POLICY "Anyone can validate invitation codes"
    ON public.invitation_codes
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Admins können alle Codes erstellen
CREATE POLICY "Admins can create invitation codes"
    ON public.invitation_codes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
    );

-- Gruppenadmins können Codes für ihre Gruppe erstellen
CREATE POLICY "Group admins can create codes for their group"
    ON public.invitation_codes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_gruppen_admin = true
            AND profiles.gruppe_id = gruppe_id
        )
    );

-- Admins können alle Codes aktualisieren
CREATE POLICY "Admins can update invitation codes"
    ON public.invitation_codes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
    );

-- Gruppenadmins können Codes ihrer Gruppe aktualisieren
CREATE POLICY "Group admins can update codes for their group"
    ON public.invitation_codes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid())
            AND p.ist_gruppen_admin = true
            AND p.gruppe_id = invitation_codes.gruppe_id
        )
    );

-- Admins können alle Codes löschen
CREATE POLICY "Admins can delete invitation codes"
    ON public.invitation_codes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
    );

-- Gruppenadmins können Codes ihrer Gruppe löschen
CREATE POLICY "Group admins can delete codes for their group"
    ON public.invitation_codes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = (select auth.uid())
            AND p.ist_gruppen_admin = true
            AND p.gruppe_id = invitation_codes.gruppe_id
        )
    );

-- ============================================
-- 6. TRIGGER AKTUALISIEREN (gruppe_id unterstützen)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, vorname, name, gruppe_id, ist_admin, ist_gruppen_admin)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'vorname', ''),
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        (NEW.raw_user_meta_data->>'gruppe_id')::uuid,
        COALESCE((NEW.raw_user_meta_data->>'ist_admin')::boolean, false),
        COALESCE((NEW.raw_user_meta_data->>'ist_gruppen_admin')::boolean, false)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FERTIG!
-- ============================================
-- Die Migration ist abgeschlossen.
--
-- Nächste Schritte:
-- 1. Redirect URL für Registrierung konfigurieren:
--    Authentication > URL Configuration > Redirect URLs
--    Hinzufügen: https://ihre-domain.com/register
--
-- 2. Optional: Bestehende Benutzer zu Gruppen-Admins machen:
--    UPDATE public.profiles SET ist_gruppen_admin = true WHERE id = 'user-id';
-- ============================================

