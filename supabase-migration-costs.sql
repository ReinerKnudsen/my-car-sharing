-- ============================================
-- CarSharing App - Migration: Kostensystem
-- ============================================
-- Diese Migration fügt hinzu:
-- 1. Einstellungen-Tabelle für Kostensatz pro km
-- 2. Kosten-Feld für Fahrten
-- 3. Funktion zur Berechnung der Gruppenkosten
-- ============================================

-- ============================================
-- 1. EINSTELLUNGEN TABELLE
-- ============================================
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

-- ============================================
-- 2. KOSTEN-FELD ZU TRIPS HINZUFÜGEN
-- ============================================
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS kosten DECIMAL(10, 2);

-- Bestehende Fahrten mit Kosten aktualisieren (falls vorhanden)
UPDATE public.trips
SET kosten = (end_kilometer - start_kilometer) * 
    (SELECT value::decimal FROM public.settings WHERE key = 'kosten_pro_km')
WHERE kosten IS NULL;

-- ============================================
-- 3. RLS FÜR SETTINGS
-- ============================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Benutzer können Einstellungen lesen
CREATE POLICY "Authenticated users can read settings"
    ON public.settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Nur Admins können Einstellungen ändern
CREATE POLICY "Only admins can update settings"
    ON public.settings
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- Nur Admins können Einstellungen erstellen
CREATE POLICY "Only admins can insert settings"
    ON public.settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.ist_admin = true
        )
    );

-- ============================================
-- 4. TRIGGER: KOSTEN BEI NEUER FAHRT BERECHNEN
-- ============================================
CREATE OR REPLACE FUNCTION public.calculate_trip_costs()
RETURNS TRIGGER AS $$
DECLARE
    rate DECIMAL(10, 4);
BEGIN
    -- Aktuellen Kostensatz holen
    SELECT value::decimal INTO rate
    FROM public.settings
    WHERE key = 'kosten_pro_km';
    
    -- Falls kein Satz gefunden, Standard verwenden
    IF rate IS NULL THEN
        rate := 0.30;
    END IF;
    
    -- Kosten berechnen
    NEW.kosten := (NEW.end_kilometer - NEW.start_kilometer) * rate;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger bei INSERT
DROP TRIGGER IF EXISTS calculate_trip_costs_insert ON public.trips;
CREATE TRIGGER calculate_trip_costs_insert
    BEFORE INSERT ON public.trips
    FOR EACH ROW
    EXECUTE FUNCTION public.calculate_trip_costs();

-- Trigger bei UPDATE (falls Kilometer geändert werden)
DROP TRIGGER IF EXISTS calculate_trip_costs_update ON public.trips;
CREATE TRIGGER calculate_trip_costs_update
    BEFORE UPDATE ON public.trips
    FOR EACH ROW
    WHEN (OLD.start_kilometer IS DISTINCT FROM NEW.start_kilometer 
          OR OLD.end_kilometer IS DISTINCT FROM NEW.end_kilometer)
    EXECUTE FUNCTION public.calculate_trip_costs();

-- ============================================
-- 5. FUNKTION: GRUPPENKOSTEN BERECHNEN
-- ============================================
CREATE OR REPLACE FUNCTION public.get_group_costs(
    group_id UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_trips BIGINT,
    total_kilometers INTEGER,
    total_costs DECIMAL(10, 2)
) AS $$
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

-- Berechtigung für authentifizierte Benutzer
GRANT EXECUTE ON FUNCTION public.get_group_costs(UUID, DATE, DATE) TO authenticated;

-- ============================================
-- 6. FUNKTION: KOSTEN PRO FAHRER IN GRUPPE
-- ============================================
CREATE OR REPLACE FUNCTION public.get_group_costs_by_driver(
    group_id UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    fahrer_id UUID,
    fahrer_name TEXT,
    trip_count BIGINT,
    total_kilometers INTEGER,
    total_costs DECIMAL(10, 2)
) AS $$
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
-- FERTIG!
-- ============================================
-- Nach Ausführung dieser Migration:
-- 1. Kostensatz kann im Admin-Menü geändert werden
-- 2. Neue Fahrten bekommen automatisch Kosten berechnet
-- 3. Gruppenkosten können abgefragt werden
-- ============================================

