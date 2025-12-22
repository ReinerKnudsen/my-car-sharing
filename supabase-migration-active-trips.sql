-- ============================================
-- MIGRATION: Active Trips Tracking
-- Datum: 2025-12-22
-- Beschreibung: Ermöglicht das Tracking von laufenden Fahrtaufzeichnungen
--               über mehrere Geräte und Fahrer hinweg
-- ============================================

-- 1. Erstelle Tabelle für aktive Fahrten
CREATE TABLE IF NOT EXISTS public.active_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fahrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    gruppe_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    start_kilometer INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_active_trip_per_group UNIQUE (gruppe_id)
);

-- 2. Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_active_trips_gruppe ON public.active_trips(gruppe_id);
CREATE INDEX IF NOT EXISTS idx_active_trips_fahrer ON public.active_trips(fahrer_id);

-- 3. RLS Policies für active_trips
ALTER TABLE public.active_trips ENABLE ROW LEVEL SECURITY;

-- ALLE authentifizierten Benutzer können aktive Fahrten sehen
CREATE POLICY "Authenticated users can view all active trips"
ON public.active_trips FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fahrer können aktive Fahrten für ihre Gruppe erstellen
CREATE POLICY "Users can insert active trips for their group"
ON public.active_trips FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.gruppe_id = active_trips.gruppe_id
    AND profiles.id = active_trips.fahrer_id
  )
);

-- ALLE authentifizierten Benutzer können aktive Fahrten löschen
CREATE POLICY "Authenticated users can delete all active trips"
ON public.active_trips FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 4. Kommentar zur Tabelle
COMMENT ON TABLE public.active_trips IS 'Speichert laufende Fahrtaufzeichnungen. Pro Gruppe kann nur eine aktive Fahrt existieren.';
COMMENT ON COLUMN public.active_trips.fahrer_id IS 'Fahrer, der die Aufzeichnung gestartet hat';
COMMENT ON COLUMN public.active_trips.gruppe_id IS 'Gruppe, zu der die Aufzeichnung gehört';
COMMENT ON COLUMN public.active_trips.start_kilometer IS 'Kilometerstand beim Start der Aufzeichnung';
COMMENT ON COLUMN public.active_trips.started_at IS 'Zeitpunkt des Aufzeichnungsstarts';
