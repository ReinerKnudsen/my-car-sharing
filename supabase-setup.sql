-- ============================================
-- CarSharing App - Komplettes Supabase Setup
-- ============================================
-- Diese Datei enthält alle notwendigen SQL-Befehle für die
-- vollständige Einrichtung der CarSharing-Datenbank.
--
-- Anleitung:
-- 1. Öffnen Sie das Supabase Dashboard
-- 2. Navigieren Sie zu "SQL Editor"
-- 3. Kopieren Sie dieses komplette Script und führen Sie es aus
-- 4. Erstellen Sie anschließend den ersten Admin-Benutzer (siehe unten)
-- ============================================

-- ============================================
-- TEIL 1: BASIS-SCHEMA (supabase-schema-v2.sql)
-- ============================================

-- 1. GRUPPEN TABELLE (zuerst, da referenziert)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bezeichnung TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILE TABELLE (erweitert auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    vorname TEXT NOT NULL,
    name TEXT NOT NULL,
    gruppe_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
    ist_admin BOOLEAN DEFAULT FALSE,
    ist_gruppen_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUCHUNGEN TABELLE (mit Zeitraum)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_datum DATE NOT NULL,
    start_uhrzeit TIME NOT NULL,
    ende_datum DATE,
    ende_uhrzeit TIME,
    gruppe_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    fahrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kommentar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FAHRTEN TABELLE (mit Kommentar)
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_kilometer INTEGER NOT NULL,
    end_kilometer INTEGER NOT NULL,
    datum DATE NOT NULL,
    fahrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kommentar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_kilometers CHECK (end_kilometer > start_kilometer)
);

-- 5. EINLADUNGSCODES TABELLE
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

-- 6. INDIZES FÜR BESSERE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_gruppe ON public.profiles(gruppe_id);
CREATE INDEX IF NOT EXISTS idx_bookings_fahrer ON public.bookings(fahrer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_gruppe ON public.bookings(gruppe_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_datum ON public.bookings(start_datum);
CREATE INDEX IF NOT EXISTS idx_bookings_ende_datum ON public.bookings(ende_datum);
CREATE INDEX IF NOT EXISTS idx_trips_fahrer ON public.trips(fahrer_id);
CREATE INDEX IF NOT EXISTS idx_trips_datum ON public.trips(datum);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON public.invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_gruppe ON public.invitation_codes(gruppe_id);

-- 7. ROW LEVEL SECURITY (RLS) AKTIVIEREN
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES FÜR GROUPS
CREATE POLICY "Authenticated users can read groups"
    ON public.groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can create groups"
    ON public.groups FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Only admins can update groups"
    ON public.groups FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Only admins can delete groups"
    ON public.groups FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

-- 9. RLS POLICIES FÜR PROFILES
CREATE POLICY "Authenticated users can read profiles"
    ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can create profiles"
    ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Users can update own profile, admins can update all"
    ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Only admins can delete profiles"
    ON public.profiles FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

-- 10. RLS POLICIES FÜR BOOKINGS
CREATE POLICY "Authenticated users can read bookings"
    ON public.bookings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create bookings"
    ON public.bookings FOR INSERT TO authenticated
    WITH CHECK (fahrer_id = auth.uid());

CREATE POLICY "Users can update own bookings, admins can update all"
    ON public.bookings FOR UPDATE TO authenticated
    USING (fahrer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Users can delete own bookings, admins can delete all"
    ON public.bookings FOR DELETE TO authenticated
    USING (fahrer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

-- 11. RLS POLICIES FÜR TRIPS
CREATE POLICY "Authenticated users can read trips"
    ON public.trips FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create trips"
    ON public.trips FOR INSERT TO authenticated
    WITH CHECK (fahrer_id = auth.uid());

CREATE POLICY "Users can update own trips, admins can update all"
    ON public.trips FOR UPDATE TO authenticated
    USING (fahrer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Users can delete own trips, admins can delete all"
    ON public.trips FOR DELETE TO authenticated
    USING (fahrer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

-- 12. RLS POLICIES FÜR INVITATION_CODES
CREATE POLICY "Anyone can validate invitation codes"
    ON public.invitation_codes FOR SELECT TO anon, authenticated
    USING (is_active = true);

CREATE POLICY "Admins can create invitation codes"
    ON public.invitation_codes FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Group admins can create codes for their group"
    ON public.invitation_codes FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_gruppen_admin = true AND profiles.gruppe_id = gruppe_id));

CREATE POLICY "Admins can update invitation codes"
    ON public.invitation_codes FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Group admins can update codes for their group"
    ON public.invitation_codes FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.ist_gruppen_admin = true AND p.gruppe_id = invitation_codes.gruppe_id));

CREATE POLICY "Admins can delete invitation codes"
    ON public.invitation_codes FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Group admins can delete codes for their group"
    ON public.invitation_codes FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.ist_gruppen_admin = true AND p.gruppe_id = invitation_codes.gruppe_id));

-- 13. TRIGGER FÜR AUTOMATISCHE PROFILE-ERSTELLUNG
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

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_new_user();
    END IF;
END $$;

-- ============================================
-- TEIL 2: KOSTENSYSTEM (supabase-migration-costs.sql)
-- ============================================

-- 1. EINSTELLUNGEN TABELLE
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- Standard-Kostensatz einfügen (0.30 € pro km)
INSERT INTO public.settings (key, value, description)
VALUES ('kosten_pro_km', '0.30', 'Kosten pro Kilometer in Euro')
ON CONFLICT (key) DO NOTHING;

-- 2. KOSTEN-FELD ZU TRIPS HINZUFÜGEN
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS kosten DECIMAL(10, 2);

-- Bestehende Fahrten mit Kosten aktualisieren (falls vorhanden)
UPDATE public.trips
SET kosten = (end_kilometer - start_kilometer) * 
    (SELECT value::decimal FROM public.settings WHERE key = 'kosten_pro_km')
WHERE kosten IS NULL;

-- 3. RLS FÜR SETTINGS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
    ON public.settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can update settings"
    ON public.settings FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Only admins can insert settings"
    ON public.settings FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

-- 4. TRIGGER: KOSTEN BEI NEUER FAHRT BERECHNEN
CREATE OR REPLACE FUNCTION public.calculate_trip_costs()
RETURNS TRIGGER AS $$
DECLARE
    rate DECIMAL(10, 4);
BEGIN
    SELECT value::decimal INTO rate FROM public.settings WHERE key = 'kosten_pro_km';
    IF rate IS NULL THEN rate := 0.30; END IF;
    NEW.kosten := (NEW.end_kilometer - NEW.start_kilometer) * rate;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_trip_costs_insert ON public.trips;
CREATE TRIGGER calculate_trip_costs_insert
    BEFORE INSERT ON public.trips FOR EACH ROW
    EXECUTE FUNCTION public.calculate_trip_costs();

DROP TRIGGER IF EXISTS calculate_trip_costs_update ON public.trips;
CREATE TRIGGER calculate_trip_costs_update
    BEFORE UPDATE ON public.trips FOR EACH ROW
    WHEN (OLD.start_kilometer IS DISTINCT FROM NEW.start_kilometer OR OLD.end_kilometer IS DISTINCT FROM NEW.end_kilometer)
    EXECUTE FUNCTION public.calculate_trip_costs();

-- 5. FUNKTION: GRUPPENKOSTEN BERECHNEN
CREATE OR REPLACE FUNCTION public.get_group_costs(group_id UUID, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (total_trips BIGINT, total_kilometers INTEGER, total_costs DECIMAL(10, 2)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(t.id)::BIGINT as total_trips,
        COALESCE(SUM(t.end_kilometer - t.start_kilometer), 0)::INTEGER as total_kilometers,
        COALESCE(SUM(t.kosten), 0.00)::DECIMAL(10, 2) as total_costs
    FROM public.trips t
    JOIN public.profiles p ON t.fahrer_id = p.id
    WHERE p.gruppe_id = group_id
    AND (start_date IS NULL OR t.datum >= start_date)
    AND (end_date IS NULL OR t.datum <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_group_costs(UUID, DATE, DATE) TO authenticated;

-- 6. FUNKTION: KOSTEN PRO FAHRER IN GRUPPE
CREATE OR REPLACE FUNCTION public.get_group_costs_by_driver(group_id UUID, start_date DATE DEFAULT NULL, end_date DATE DEFAULT NULL)
RETURNS TABLE (fahrer_id UUID, fahrer_name TEXT, trip_count BIGINT, total_kilometers INTEGER, total_costs DECIMAL(10, 2)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as fahrer_id,
        (p.vorname || ' ' || p.name) as fahrer_name,
        COUNT(t.id)::BIGINT as trip_count,
        COALESCE(SUM(t.end_kilometer - t.start_kilometer), 0)::INTEGER as total_kilometers,
        COALESCE(SUM(t.kosten), 0.00)::DECIMAL(10, 2) as total_costs
    FROM public.profiles p
    LEFT JOIN public.trips t ON t.fahrer_id = p.id
        AND (start_date IS NULL OR t.datum >= start_date)
        AND (end_date IS NULL OR t.datum <= end_date)
    WHERE p.gruppe_id = group_id
    GROUP BY p.id, p.vorname, p.name
    ORDER BY total_costs DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_group_costs_by_driver(UUID, DATE, DATE) TO authenticated;

-- ============================================
-- TEIL 3: BELEGSYSTEM (supabase-migration-receipts.sql)
-- ============================================

-- 1. BELEGARTEN TABELLE
CREATE TABLE IF NOT EXISTS public.receipt_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bezeichnung VARCHAR(100) NOT NULL,
    beschreibung TEXT,
    aktiv BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Standard-Belegarten einfügen
INSERT INTO public.receipt_types (bezeichnung, beschreibung, sort_order) VALUES
    ('Tanken', 'Kraftstoff und Betankung', 1),
    ('Wäsche', 'Autowäsche und Reinigung', 2),
    ('Wartung', 'Wartung, Reparaturen, TÜV', 3),
    ('Weiteres', 'Sonstige Ausgaben', 4),
    ('Überweisung', 'Einzahlung ins Gruppenkonto', 5)
ON CONFLICT DO NOTHING;

-- 2. BELEGE TABELLE
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gruppe_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    fahrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receipt_type_id UUID NOT NULL REFERENCES public.receipt_types(id),
    datum DATE NOT NULL,
    betrag DECIMAL(10, 2) NOT NULL,
    kommentar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_receipts_gruppe_id ON public.receipts(gruppe_id);
CREATE INDEX IF NOT EXISTS idx_receipts_fahrer_id ON public.receipts(fahrer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_datum ON public.receipts(datum DESC);

-- 3. RLS FÜR RECEIPT_TYPES
ALTER TABLE public.receipt_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active receipt types"
    ON public.receipt_types FOR SELECT TO authenticated
    USING (aktiv = true OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Only admins can insert receipt types"
    ON public.receipt_types FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Only admins can update receipt types"
    ON public.receipt_types FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

CREATE POLICY "Only admins can delete receipt types"
    ON public.receipt_types FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

-- 4. RLS FÜR RECEIPTS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group receipts"
    ON public.receipts FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.gruppe_id = receipts.gruppe_id)
    );

CREATE POLICY "Non-blocked users can insert receipts"
    ON public.receipts FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.gruppe_id = receipts.gruppe_id AND profiles.ist_gesperrt = false)
    );

CREATE POLICY "Users can update own receipts"
    ON public.receipts FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true)
        OR (fahrer_id = auth.uid() AND created_at > NOW() - INTERVAL '24 hours')
    );

CREATE POLICY "Users can delete receipts"
    ON public.receipts FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true)
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_gruppen_admin = true AND profiles.gruppe_id = receipts.gruppe_id)
        OR (fahrer_id = auth.uid() AND created_at > NOW() - INTERVAL '24 hours')
    );

-- 5. FUNKTION: GRUPPENKONTO ÜBERSICHT
CREATE OR REPLACE FUNCTION public.get_group_account(p_group_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (total_trip_costs DECIMAL(10, 2), total_receipts DECIMAL(10, 2), balance DECIMAL(10, 2), trip_count BIGINT, receipt_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH trip_totals AS (
        SELECT COALESCE(SUM(t.kosten), 0.00) as costs, COUNT(t.id) as cnt
        FROM public.trips t JOIN public.profiles p ON t.fahrer_id = p.id
        WHERE p.gruppe_id = p_group_id
        AND (p_start_date IS NULL OR t.datum >= p_start_date)
        AND (p_end_date IS NULL OR t.datum <= p_end_date)
    ),
    receipt_totals AS (
        SELECT COALESCE(SUM(r.betrag), 0.00) as costs, COUNT(r.id) as cnt
        FROM public.receipts r
        WHERE r.gruppe_id = p_group_id
        AND (p_start_date IS NULL OR r.datum >= p_start_date)
        AND (p_end_date IS NULL OR r.datum <= p_end_date)
    )
    SELECT 
        tt.costs::DECIMAL(10, 2) as total_trip_costs,
        rt.costs::DECIMAL(10, 2) as total_receipts,
        (rt.costs - tt.costs)::DECIMAL(10, 2) as balance,
        tt.cnt as trip_count,
        rt.cnt as receipt_count
    FROM trip_totals tt, receipt_totals rt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_group_account(UUID, DATE, DATE) TO authenticated;

-- 6. FUNKTION: GRUPPENKONTO DETAILS (Transaktionen)
CREATE OR REPLACE FUNCTION public.get_group_account_transactions(p_group_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (id UUID, datum DATE, typ TEXT, beschreibung TEXT, fahrer_name TEXT, einnahme DECIMAL(10, 2), ausgabe DECIMAL(10, 2)) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.datum, 'Fahrt'::TEXT as typ,
        ((t.end_kilometer - t.start_kilometer)::TEXT || ' km')::TEXT as beschreibung,
        (p.vorname || ' ' || p.name)::TEXT as fahrer_name,
        0.00::DECIMAL(10, 2) as einnahme, t.kosten as ausgabe
    FROM public.trips t JOIN public.profiles p ON t.fahrer_id = p.id
    WHERE p.gruppe_id = p_group_id
    AND (p_start_date IS NULL OR t.datum >= p_start_date)
    AND (p_end_date IS NULL OR t.datum <= p_end_date)
    UNION ALL
    SELECT r.id, r.datum, rt.bezeichnung as typ,
        COALESCE(r.kommentar, '')::TEXT as beschreibung,
        (p.vorname || ' ' || p.name)::TEXT as fahrer_name,
        r.betrag as einnahme, 0.00::DECIMAL(10, 2) as ausgabe
    FROM public.receipts r
    JOIN public.profiles p ON r.fahrer_id = p.id
    JOIN public.receipt_types rt ON r.receipt_type_id = rt.id
    WHERE r.gruppe_id = p_group_id
    AND (p_start_date IS NULL OR r.datum >= p_start_date)
    AND (p_end_date IS NULL OR r.datum <= p_end_date)
    ORDER BY datum DESC, ausgabe DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_group_account_transactions(UUID, DATE, DATE, INTEGER) TO authenticated;

-- ============================================
-- TEIL 4: PAYPAL INTEGRATION (supabase-migration-paypal.sql)
-- ============================================

INSERT INTO public.settings (key, value, description) VALUES
    ('paypal_email', '', 'PayPal E-Mail-Adresse für Gruppenzahlungen (leer = PayPal deaktiviert)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.settings (key, value, description) VALUES
    ('paypal_client_id', '', 'PayPal Client ID (aus PayPal Developer Dashboard)')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- TEIL 5: BENUTZERVERWALTUNG (supabase-migration-user-management.sql)
-- ============================================

-- 1. SICHERE FUNKTION FÜR EINLADUNGSCODE-NUTZUNG
CREATE OR REPLACE FUNCTION public.use_invitation_code(code_to_use VARCHAR)
RETURNS void AS $$
DECLARE
    code_record RECORD;
BEGIN
    SELECT id, uses_count, max_uses, is_active, expires_at INTO code_record
    FROM public.invitation_codes WHERE code = UPPER(code_to_use);
    
    IF NOT FOUND THEN RAISE EXCEPTION 'Einladungscode nicht gefunden'; END IF;
    IF NOT code_record.is_active THEN RAISE EXCEPTION 'Einladungscode ist nicht mehr aktiv'; END IF;
    IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN RAISE EXCEPTION 'Einladungscode ist abgelaufen'; END IF;
    IF code_record.uses_count >= code_record.max_uses THEN RAISE EXCEPTION 'Einladungscode wurde bereits vollständig verwendet'; END IF;
    
    UPDATE public.invitation_codes
    SET uses_count = uses_count + 1,
        is_active = CASE WHEN uses_count + 1 >= max_uses THEN false ELSE true END
    WHERE id = code_record.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.use_invitation_code(VARCHAR) TO authenticated;

-- 2. IST_GESPERRT FELD HINZUFÜGEN
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ist_gesperrt BOOLEAN DEFAULT FALSE;

-- 3. RLS POLICIES FÜR GESPERRTE BENUTZER AKTUALISIEREN
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;
CREATE POLICY "Non-blocked users can create bookings"
    ON public.bookings FOR INSERT TO authenticated
    WITH CHECK (fahrer_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_gesperrt = true));

DROP POLICY IF EXISTS "Users can update own bookings, admins can update all" ON public.bookings;
CREATE POLICY "Non-blocked users can update own bookings, admins can update all"
    ON public.bookings FOR UPDATE TO authenticated
    USING ((fahrer_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_gesperrt = true))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

DROP POLICY IF EXISTS "Authenticated users can create trips" ON public.trips;
CREATE POLICY "Non-blocked users can create trips"
    ON public.trips FOR INSERT TO authenticated
    WITH CHECK (fahrer_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_gesperrt = true));

DROP POLICY IF EXISTS "Users can update own trips, admins can update all" ON public.trips;
CREATE POLICY "Non-blocked users can update own trips, admins can update all"
    ON public.trips FOR UPDATE TO authenticated
    USING ((fahrer_id = auth.uid() AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_gesperrt = true))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.ist_admin = true));

-- 4. FUNKTION ZUM SETZEN DES GRUPPEN-ADMINS
CREATE OR REPLACE FUNCTION public.set_group_admin(user_id UUID, remove_existing BOOLEAN DEFAULT false)
RETURNS void AS $$
DECLARE
    user_gruppe_id UUID;
    existing_admin_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND ist_admin = true) THEN
        RAISE EXCEPTION 'Nur Administratoren können Gruppen-Admins setzen';
    END IF;
    
    SELECT gruppe_id INTO user_gruppe_id FROM public.profiles WHERE id = user_id;
    IF user_gruppe_id IS NULL THEN RAISE EXCEPTION 'Benutzer ist keiner Gruppe zugeordnet'; END IF;
    
    SELECT id INTO existing_admin_id FROM public.profiles
    WHERE gruppe_id = user_gruppe_id AND ist_gruppen_admin = true AND id != user_id;
    
    IF existing_admin_id IS NOT NULL THEN
        IF NOT remove_existing THEN
            RAISE EXCEPTION 'Es existiert bereits ein Gruppen-Admin. Verwende remove_existing=true um zu überschreiben.';
        END IF;
        UPDATE public.profiles SET ist_gruppen_admin = false WHERE id = existing_admin_id;
    END IF;
    
    UPDATE public.profiles SET ist_gruppen_admin = true WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.set_group_admin(UUID, BOOLEAN) TO authenticated;

-- 5. FUNKTION ZUM ENTFERNEN DES GRUPPEN-ADMIN STATUS
CREATE OR REPLACE FUNCTION public.remove_group_admin(user_id UUID)
RETURNS void AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND ist_admin = true) THEN
        RAISE EXCEPTION 'Nur Administratoren können Gruppen-Admin Status entfernen';
    END IF;
    UPDATE public.profiles SET ist_gruppen_admin = false WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.remove_group_admin(UUID) TO authenticated;

-- 6. RLS POLICIES FÜR GRUPPEN-ADMINS
DROP POLICY IF EXISTS "Users can update own profile, admins can update all" ON public.profiles;
CREATE POLICY "Users and group admins can update profiles"
    ON public.profiles FOR UPDATE TO authenticated
    USING (
        id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.ist_admin = true)
        OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.ist_gruppen_admin = true AND p.gruppe_id = profiles.gruppe_id)
            AND profiles.ist_admin = false AND profiles.id != auth.uid())
    );

DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins and group admins can delete profiles"
    ON public.profiles FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.ist_admin = true)
        OR (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.ist_gruppen_admin = true AND p.gruppe_id = profiles.gruppe_id)
            AND profiles.ist_admin = false AND profiles.ist_gruppen_admin = false AND profiles.id != auth.uid())
    );

-- ============================================
-- TEIL 6: AUTOMATISCHER GRUPPENADMIN (supabase-migration-auto-group-admin.sql)
-- ============================================

-- Update handle_new_user Trigger für automatischen Gruppenadmin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_gruppe_id uuid;
    v_ist_gruppen_admin boolean;
    v_existing_users_count integer;
BEGIN
    v_gruppe_id := (NEW.raw_user_meta_data->>'gruppe_id')::uuid;
    
    IF v_gruppe_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_existing_users_count FROM public.profiles WHERE gruppe_id = v_gruppe_id;
        IF v_existing_users_count = 0 THEN
            v_ist_gruppen_admin := true;
        ELSE
            v_ist_gruppen_admin := COALESCE((NEW.raw_user_meta_data->>'ist_gruppen_admin')::boolean, false);
        END IF;
    ELSE
        v_ist_gruppen_admin := COALESCE((NEW.raw_user_meta_data->>'ist_gruppen_admin')::boolean, false);
    END IF;

    INSERT INTO public.profiles (id, vorname, name, gruppe_id, ist_admin, ist_gruppen_admin)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'vorname', ''),
        COALESCE(NEW.raw_user_meta_data->>'name', ''),
        v_gruppe_id,
        COALESCE((NEW.raw_user_meta_data->>'ist_admin')::boolean, false),
        v_ist_gruppen_admin
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aktualisiere set_group_admin für Gruppenadmin-Berechtigung
CREATE OR REPLACE FUNCTION public.set_group_admin(user_id uuid, remove_existing boolean DEFAULT false)
RETURNS void AS $$
DECLARE
    target_gruppe_id uuid;
    current_user_id uuid;
    current_user_admin boolean;
    current_user_group_admin boolean;
    current_user_gruppe_id uuid;
    existing_admin_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    SELECT ist_admin, ist_gruppen_admin, gruppe_id 
    INTO current_user_admin, current_user_group_admin, current_user_gruppe_id
    FROM profiles WHERE id = current_user_id;
    
    SELECT gruppe_id INTO target_gruppe_id FROM profiles WHERE id = user_id;
    
    IF NOT (current_user_admin = true OR (current_user_group_admin = true AND current_user_gruppe_id = target_gruppe_id)) THEN
        RAISE EXCEPTION 'Keine Berechtigung um Gruppenadmins zu setzen';
    END IF;
    
    IF target_gruppe_id IS NULL THEN RAISE EXCEPTION 'Ziel-User muss einer Gruppe angehören'; END IF;
    
    SELECT id INTO existing_admin_id FROM profiles
    WHERE gruppe_id = target_gruppe_id AND ist_gruppen_admin = true AND id != user_id LIMIT 1;
    
    IF existing_admin_id IS NOT NULL AND remove_existing = false THEN
        RAISE EXCEPTION 'Gruppe hat bereits einen Admin. Verwende remove_existing=true um zu überschreiben.';
    END IF;
    
    IF existing_admin_id IS NOT NULL THEN
        UPDATE profiles SET ist_gruppen_admin = false WHERE id = existing_admin_id;
    END IF;
    
    UPDATE profiles SET ist_gruppen_admin = true WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy für Gruppenadmins
DROP POLICY IF EXISTS "Group admins can update their group members" ON profiles;
CREATE POLICY "Group admins can update their group members"
ON profiles FOR UPDATE TO authenticated
USING (
    (SELECT ist_admin FROM profiles WHERE id = auth.uid()) = true
    OR ((SELECT ist_gruppen_admin FROM profiles WHERE id = auth.uid()) = true
        AND gruppe_id = (SELECT gruppe_id FROM profiles WHERE id = auth.uid()))
)
WITH CHECK (
    (SELECT ist_admin FROM profiles WHERE id = auth.uid()) = true
    OR ((SELECT ist_gruppen_admin FROM profiles WHERE id = auth.uid()) = true
        AND gruppe_id = (SELECT gruppe_id FROM profiles WHERE id = auth.uid())
        AND (ist_admin = (SELECT ist_admin FROM profiles WHERE id = id)))
);

-- ============================================
-- SETUP ABGESCHLOSSEN!
-- ============================================
-- Die Datenbank ist jetzt vollständig eingerichtet.
--
-- NÄCHSTE SCHRITTE:
--
-- 1. Erste Gruppe erstellen:
--    INSERT INTO public.groups (bezeichnung) VALUES ('Meine Gruppe') RETURNING id;
--    (Notieren Sie sich die zurückgegebene ID)
--
-- 2. Ersten Admin-Benutzer erstellen:
--    a) Gehen Sie zu: Authentication > Users > Add user
--    b) Erstellen Sie einen Benutzer mit E-Mail und Passwort
--    c) Gehen Sie zu: Table Editor > profiles
--    d) Erstellen Sie ein Profil:
--       - id: UUID des erstellten Benutzers
--       - vorname: Ihr Vorname
--       - name: Ihr Nachname
--       - gruppe_id: ID der erstellten Gruppe
--       - ist_admin: true
--       - ist_gruppen_admin: true
--
-- 3. Ersten Einladungscode erstellen:
--    INSERT INTO public.invitation_codes (code, gruppe_id, created_by, max_uses)
--    VALUES ('WILLKOMMEN2024', 'gruppen-uuid', 'admin-user-uuid', 10);
--
-- 4. Supabase URL und Anon Key in .env eintragen:
--    VITE_SUPABASE_URL=https://xxx.supabase.co
--    VITE_SUPABASE_ANON_KEY=xxx
--
-- 5. (Optional) PayPal konfigurieren:
--    - Als Admin anmelden
--    - Verwaltung > Einstellungen
--    - PayPal E-Mail und Client-ID eingeben
--
-- 6. (Optional) Kostensatz anpassen:
--    UPDATE public.settings SET value = '0.35' WHERE key = 'kosten_pro_km';
--
-- ============================================
