-- ============================================
-- MIGRATION: Make fahrer_id nullable in trips table
-- Datum: 2025-12-20
-- Beschreibung: Ermöglicht nachgetragene Fahrten ohne zugewiesenen Fahrer
-- ============================================

-- 1. Entferne die NOT NULL Constraint von fahrer_id
ALTER TABLE public.trips 
ALTER COLUMN fahrer_id DROP NOT NULL;

-- 2. Aktualisiere RLS Policies für trips
-- Alte Policy löschen
DROP POLICY IF EXISTS "Users can view trips in their group" ON public.trips;
DROP POLICY IF EXISTS "Users can insert trips in their group" ON public.trips;
DROP POLICY IF EXISTS "Users can update trips in their group" ON public.trips;
DROP POLICY IF EXISTS "Users can delete trips in their group" ON public.trips;

-- Neue Policies mit Unterstützung für nachgetragene Fahrten (fahrer_id IS NULL)
CREATE POLICY "Users can view trips in their group or unclaimed trips"
ON public.trips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Fahrten der eigenen Gruppe
      profiles.gruppe_id = (
        SELECT gruppe_id FROM public.profiles WHERE id = trips.fahrer_id
      )
      -- ODER nachgetragene Fahrten ohne Fahrer
      OR trips.fahrer_id IS NULL
    )
  )
);

CREATE POLICY "Users can insert trips in their group or unclaimed trips"
ON public.trips FOR INSERT
WITH CHECK (
  -- Nachgetragene Fahrten (ohne fahrer_id) dürfen erstellt werden
  trips.fahrer_id IS NULL
  OR
  -- ODER Fahrten für die eigene Gruppe
  EXISTS (
    SELECT 1 FROM public.profiles p1
    WHERE p1.id = auth.uid()
    AND p1.gruppe_id = (
      SELECT p2.gruppe_id FROM public.profiles p2 WHERE p2.id = trips.fahrer_id
    )
  )
);

CREATE POLICY "Users can update trips in their group or claim unclaimed trips"
ON public.trips FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND (
      -- Eigene Fahrten
      trips.fahrer_id = auth.uid()
      -- ODER nachgetragene Fahrten können von jedem beansprucht werden
      OR trips.fahrer_id IS NULL
    )
  )
);

CREATE POLICY "Users can delete their own trips"
ON public.trips FOR DELETE
USING (
  trips.fahrer_id = auth.uid()
);

-- 3. Kommentar zur Spalte hinzufügen
COMMENT ON COLUMN public.trips.fahrer_id IS 'Fahrer der Fahrt. NULL für nachgetragene Fahrten ohne bekannten Fahrer.';
