-- ============================================
-- CarSharing App - Supabase Database Schema
-- ============================================
-- Dieses SQL-Script erstellt alle Tabellen, Trigger und Row Level Security Policies
-- für die CarSharing Anwendung.
--
-- Anleitung:
-- 1. Öffnen Sie das Supabase Dashboard
-- 2. Navigieren Sie zu "SQL Editor"
-- 3. Kopieren Sie dieses Script und führen Sie es aus
-- ============================================

-- ============================================
-- GRUPPEN TABELLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bezeichnung TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROFILE TABELLE (erweitert auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    vorname TEXT NOT NULL,
    name TEXT NOT NULL,
    gruppe_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    ist_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BUCHUNGEN TABELLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    datum DATE NOT NULL,
    uhrzeit TIME NOT NULL,
    gruppe_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    fahrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kommentar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FAHRTEN TABELLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_kilometer INTEGER NOT NULL,
    end_kilometer INTEGER NOT NULL,
    datum DATE NOT NULL,
    fahrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_kilometers CHECK (end_kilometer > start_kilometer)
);

-- ============================================
-- INDIZES FÜR BESSERE PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_gruppe ON public.profiles(gruppe_id);
CREATE INDEX IF NOT EXISTS idx_bookings_fahrer ON public.bookings(fahrer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_gruppe ON public.bookings(gruppe_id);
CREATE INDEX IF NOT EXISTS idx_bookings_datum ON public.bookings(datum);
CREATE INDEX IF NOT EXISTS idx_trips_fahrer ON public.trips(fahrer_id);
CREATE INDEX IF NOT EXISTS idx_trips_datum ON public.trips(datum);

-- ============================================
-- ROW LEVEL SECURITY (RLS) AKTIVIEREN
-- ============================================
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FÜR GROUPS
-- ============================================

-- Alle authentifizierten Benutzer können Gruppen lesen
CREATE POLICY "Authenticated users can read groups"
    ON public.groups
    FOR SELECT
    TO authenticated
    USING (true);

-- Nur Admins können Gruppen erstellen
CREATE POLICY "Only admins can create groups"
    ON public.groups
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- Nur Admins können Gruppen aktualisieren
CREATE POLICY "Only admins can update groups"
    ON public.groups
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- Nur Admins können Gruppen löschen
CREATE POLICY "Only admins can delete groups"
    ON public.groups
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- ============================================
-- RLS POLICIES FÜR PROFILES
-- ============================================

-- Alle authentifizierten Benutzer können Profile lesen
CREATE POLICY "Authenticated users can read profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- Nur Admins können Profile erstellen
CREATE POLICY "Only admins can create profiles"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- Benutzer können ihr eigenes Profil aktualisieren, Admins können alle Profile aktualisieren
CREATE POLICY "Users can update own profile, admins can update all"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
        id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- Nur Admins können Profile löschen
CREATE POLICY "Only admins can delete profiles"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- ============================================
-- RLS POLICIES FÜR BOOKINGS
-- ============================================

-- Alle authentifizierten Benutzer können Buchungen lesen
CREATE POLICY "Authenticated users can read bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (true);

-- Alle authentifizierten Benutzer können Buchungen erstellen
CREATE POLICY "Authenticated users can create bookings"
    ON public.bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fahrer_id = auth.uid()
    );

-- Benutzer können eigene Buchungen aktualisieren, Admins können alle aktualisieren
CREATE POLICY "Users can update own bookings, admins can update all"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (
        fahrer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- Benutzer können eigene Buchungen löschen, Admins können alle löschen
CREATE POLICY "Users can delete own bookings, admins can delete all"
    ON public.bookings
    FOR DELETE
    TO authenticated
    USING (
        fahrer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- ============================================
-- RLS POLICIES FÜR TRIPS
-- ============================================

-- Alle authentifizierten Benutzer können Fahrten lesen
CREATE POLICY "Authenticated users can read trips"
    ON public.trips
    FOR SELECT
    TO authenticated
    USING (true);

-- Alle authentifizierten Benutzer können Fahrten erstellen
CREATE POLICY "Authenticated users can create trips"
    ON public.trips
    FOR INSERT
    TO authenticated
    WITH CHECK (
        fahrer_id = auth.uid()
    );

-- Benutzer können eigene Fahrten aktualisieren, Admins können alle aktualisieren
CREATE POLICY "Users can update own trips, admins can update all"
    ON public.trips
    FOR UPDATE
    TO authenticated
    USING (
        fahrer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- Benutzer können eigene Fahrten löschen, Admins können alle löschen
CREATE POLICY "Users can delete own trips, admins can delete all"
    ON public.trips
    FOR DELETE
    TO authenticated
    USING (
        fahrer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- ============================================
-- TRIGGER FÜR AUTOMATISCHE PROFILE-ERSTELLUNG
-- ============================================
-- Dieser Trigger erstellt automatisch ein Profil, wenn ein neuer Benutzer registriert wird
-- HINWEIS: Dieser Trigger wird nur verwendet, wenn die Registrierung nicht über die App erfolgt

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, vorname, name, ist_admin)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'vorname', ''),
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        COALESCE((NEW.raw_user_meta_data->>'ist_admin')::boolean, false)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger nur erstellen, wenn er noch nicht existiert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END
$$;

-- ============================================
-- BEISPIELDATEN (OPTIONAL - ZUM TESTEN)
-- ============================================
-- Kommentieren Sie diese Zeilen aus, wenn Sie Testdaten einfügen möchten

-- INSERT INTO public.groups (bezeichnung) VALUES
--     ('Familie Müller'),
--     ('Familie Schmidt'),
--     ('WG Hauptstraße');

-- ============================================
-- FERTIG!
-- ============================================
-- Die Datenbank ist jetzt bereit für die CarSharing App.
-- Nächste Schritte:
-- 1. Kopieren Sie Ihre Supabase URL und Anon Key
-- 2. Fügen Sie diese in die .env Datei der App ein
-- 3. Erstellen Sie den ersten Admin-Benutzer über die Supabase Auth UI
--    oder über die App-Registrierung
-- ============================================

