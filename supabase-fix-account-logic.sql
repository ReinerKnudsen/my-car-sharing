-- ============================================
-- Fix: Kontologik korrigieren
-- ============================================
-- Nur die beiden Funktionen neu erstellen
-- Belege = Einnahmen (+)
-- Fahrten = Kosten (-)
-- Saldo = Belege - Fahrten
-- ============================================

-- ============================================
-- 1. FUNKTION: GRUPPENKONTO ÜBERSICHT
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

-- ============================================
-- 2. FUNKTION: GRUPPENKONTO DETAILS (Transaktionen)
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

-- ============================================
-- FERTIG!
-- ============================================
-- Die Kontologik ist nun korrigiert:
-- - Fahrten = Kosten (rot, negativ)
-- - Belege = Einzahlungen (grün, positiv)
-- - Saldo = Einzahlungen - Kosten
-- ============================================

