-- ============================================
-- CarSharing App - Migration: PayPal Integration
-- ============================================
-- Diese Migration fügt hinzu:
-- 1. PayPal-Einstellungen in settings Tabelle
-- 2. Automatische Beleg-Erstellung nach Zahlung
-- ============================================

-- ============================================
-- 1. PAYPAL EINSTELLUNGEN
-- ============================================

-- PayPal Email/Account für Zahlungen
INSERT INTO public.settings (key, value, description) VALUES
    ('paypal_email', '', 'PayPal E-Mail-Adresse für Gruppenzahlungen (leer = PayPal deaktiviert)')
ON CONFLICT (key) DO NOTHING;

-- PayPal Client ID (für PayPal SDK)
INSERT INTO public.settings (key, value, description) VALUES
    ('paypal_client_id', '', 'PayPal Client ID (aus PayPal Developer Dashboard)')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- FERTIG!
-- ============================================
-- Nach Ausführung dieser Migration:
-- 1. Admin kann PayPal-Konto in Einstellungen hinterlegen
-- 2. Gruppenkonto zeigt PayPal-Button bei negativem Saldo
-- 3. Nach erfolgreicher Zahlung wird automatisch Beleg erstellt
-- ============================================

