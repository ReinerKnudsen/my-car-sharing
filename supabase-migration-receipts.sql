-- ============================================
-- CarSharing App - Migration: Belegsystem
-- ============================================
-- Diese Migration fügt hinzu:
-- 1. Belegarten-Tabelle (erweiterbar durch Admin)
-- 2. Belege-Tabelle
-- 3. RLS Policies
-- 4. Funktion für Gruppenkonto-Übersicht
-- ============================================

-- ============================================
-- 1. BELEGARTEN TABELLE
-- ============================================
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

-- ============================================
-- 2. BELEGE TABELLE
-- ============================================
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

-- Index für schnellere Abfragen
CREATE INDEX IF NOT EXISTS idx_receipts_gruppe_id ON public.receipts(gruppe_id);
CREATE INDEX IF NOT EXISTS idx_receipts_fahrer_id ON public.receipts(fahrer_id);
CREATE INDEX IF NOT EXISTS idx_receipts_datum ON public.receipts(datum DESC);

-- ============================================
-- 3. RLS FÜR RECEIPT_TYPES
-- ============================================
ALTER TABLE public.receipt_types ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Benutzer können aktive Belegarten lesen
CREATE POLICY "Authenticated users can read active receipt types"
    ON public.receipt_types
    FOR SELECT
    TO authenticated
    USING (aktiv = true OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = (select auth.uid())
        AND profiles.ist_admin = true
    ));

-- Nur Admins können Belegarten erstellen
CREATE POLICY "Only admins can insert receipt types"
    ON public.receipt_types
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
    );

-- Nur Admins können Belegarten ändern
CREATE POLICY "Only admins can update receipt types"
    ON public.receipt_types
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
    );

-- Nur Admins können Belegarten löschen
CREATE POLICY "Only admins can delete receipt types"
    ON public.receipt_types
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
    );

-- ============================================
-- 4. RLS FÜR RECEIPTS
-- ============================================
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Gruppenmitglieder können Belege ihrer Gruppe sehen, Admins alle
CREATE POLICY "Users can view group receipts"
    ON public.receipts
    FOR SELECT
    TO authenticated
    USING (
        -- Admin sieht alle
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
        OR
        -- Gruppenmitglied sieht eigene Gruppe
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.gruppe_id = receipts.gruppe_id
        )
    );

-- Nicht-gesperrte Gruppenmitglieder können Belege erstellen
CREATE POLICY "Non-blocked users can insert receipts"
    ON public.receipts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.gruppe_id = receipts.gruppe_id
            AND profiles.ist_gesperrt = false
        )
    );

-- Eigene Belege können aktualisiert werden (innerhalb von 24h) oder von Admin
CREATE POLICY "Users can update own receipts"
    ON public.receipts
    FOR UPDATE
    TO authenticated
    USING (
        -- Admin kann alles
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
        OR
        -- Eigene Belege innerhalb von 24h
        (fahrer_id = (select auth.uid()) AND created_at > NOW() - INTERVAL '24 hours')
    );

-- Eigene Belege können gelöscht werden (innerhalb von 24h) oder von Admin/Gruppenadmin
CREATE POLICY "Users can delete receipts"
    ON public.receipts
    FOR DELETE
    TO authenticated
    USING (
        -- Admin kann alles
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_admin = true
        )
        OR
        -- Gruppenadmin kann Belege seiner Gruppe löschen
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.ist_gruppen_admin = true
            AND profiles.gruppe_id = receipts.gruppe_id
        )
        OR
        -- Eigene Belege innerhalb von 24h
        (fahrer_id = (select auth.uid()) AND created_at > NOW() - INTERVAL '24 hours')
    );

-- ============================================
-- 5. FUNKTION: GRUPPENKONTO ÜBERSICHT
-- ============================================
CREATE OR REPLACE FUNCTION public.get_group_account(
    p_group_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_trip_costs DECIMAL(10, 2),
    total_receipts DECIMAL(10, 2),
    balance DECIMAL(10, 2),
    trip_count BIGINT,
    receipt_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH trip_totals AS (
        SELECT 
            COALESCE(SUM(t.kosten), 0.00) as costs,
            COUNT(t.id) as cnt
        FROM public.trips t
        JOIN public.profiles p ON t.fahrer_id = p.id
        WHERE p.gruppe_id = p_group_id
        AND (p_start_date IS NULL OR t.datum >= p_start_date)
        AND (p_end_date IS NULL OR t.datum <= p_end_date)
    ),
    receipt_totals AS (
        SELECT 
            COALESCE(SUM(r.betrag), 0.00) as costs,
            COUNT(r.id) as cnt
        FROM public.receipts r
        WHERE r.gruppe_id = p_group_id
        AND (p_start_date IS NULL OR r.datum >= p_start_date)
        AND (p_end_date IS NULL OR r.datum <= p_end_date)
    )
    SELECT 
        tt.costs::DECIMAL(10, 2) as total_trip_costs,
        rt.costs::DECIMAL(10, 2) as total_receipts,
        (rt.costs - tt.costs)::DECIMAL(10, 2) as balance,  -- Einzahlungen MINUS Kosten
        tt.cnt as trip_count,
        rt.cnt as receipt_count
    FROM trip_totals tt, receipt_totals rt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_group_account(UUID, DATE, DATE) TO authenticated;

-- ============================================
-- 6. FUNKTION: GRUPPENKONTO DETAILS (Transaktionen)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_group_account_transactions(
    p_group_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    datum DATE,
    typ TEXT,
    beschreibung TEXT,
    fahrer_name TEXT,
    einnahme DECIMAL(10, 2),
    ausgabe DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    -- Fahrten als Ausgaben (Kosten)
    SELECT 
        t.id,
        t.datum,
        'Fahrt'::TEXT as typ,
        ((t.end_kilometer - t.start_kilometer)::TEXT || ' km')::TEXT as beschreibung,
        (p.vorname || ' ' || p.name)::TEXT as fahrer_name,
        0.00::DECIMAL(10, 2) as einnahme,
        t.kosten as ausgabe
    FROM public.trips t
    JOIN public.profiles p ON t.fahrer_id = p.id
    WHERE p.gruppe_id = p_group_id
    AND (p_start_date IS NULL OR t.datum >= p_start_date)
    AND (p_end_date IS NULL OR t.datum <= p_end_date)
    
    UNION ALL
    
    -- Belege als Einnahmen (Einzahlungen)
    SELECT 
        r.id,
        r.datum,
        rt.bezeichnung as typ,
        COALESCE(r.kommentar, '')::TEXT as beschreibung,
        (p.vorname || ' ' || p.name)::TEXT as fahrer_name,
        r.betrag as einnahme,
        0.00::DECIMAL(10, 2) as ausgabe
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
-- FERTIG!
-- ============================================
-- Nach Ausführung dieser Migration:
-- 1. Belegarten können vom Admin verwaltet werden
-- 2. Fahrer können Belege für ihre Gruppe erstellen
-- 3. Gruppenkonto zeigt Übersicht und Transaktionen
-- ============================================

