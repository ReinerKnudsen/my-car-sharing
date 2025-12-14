-- ============================================
-- Migration: Automatischer Gruppenadmin
-- ============================================
-- Diese Migration implementiert:
-- 1. Erster User einer Gruppe wird automatisch Gruppenadmin
-- 2. Gruppenadmins können andere User ihrer Gruppe promoten

-- ============================================
-- 1. Update handle_new_user Trigger
-- ============================================
-- Der Trigger prüft jetzt, ob der neue User der erste in seiner Gruppe ist
-- Wenn ja: ist_gruppen_admin = true

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_gruppe_id uuid;
    v_ist_gruppen_admin boolean;
    v_existing_users_count integer;
BEGIN
    -- Hole gruppe_id aus Metadaten
    v_gruppe_id := (NEW.raw_user_meta_data->>'gruppe_id')::uuid;
    
    -- Prüfe ob dieser User der erste in der Gruppe ist
    IF v_gruppe_id IS NOT NULL THEN
        -- Zähle existierende User in dieser Gruppe
        SELECT COUNT(*) INTO v_existing_users_count
        FROM public.profiles
        WHERE gruppe_id = v_gruppe_id;
        
        -- Wenn noch keine User in der Gruppe: Mache diesen zum Gruppenadmin
        IF v_existing_users_count = 0 THEN
            v_ist_gruppen_admin := true;
        ELSE
            v_ist_gruppen_admin := COALESCE((NEW.raw_user_meta_data->>'ist_gruppen_admin')::boolean, false);
        END IF;
    ELSE
        v_ist_gruppen_admin := COALESCE((NEW.raw_user_meta_data->>'ist_gruppen_admin')::boolean, false);
    END IF;

    -- Erstelle Profil
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

-- ============================================
-- 2. RLS Policy für set_group_admin
-- ============================================
-- Gruppenadmins dürfen jetzt auch die Funktion aufrufen

-- Erstelle Policy für die RPC-Berechtigung
-- (Hinweis: Die eigentliche Prüfung passiert in der set_group_admin Funktion)

-- Aktualisiere set_group_admin um Gruppenadmin-Berechtigung zu prüfen
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
    -- Hole aktuelle User ID
    current_user_id := (select auth.uid());
    
    -- Hole Infos über aktuellen User
    SELECT ist_admin, ist_gruppen_admin, gruppe_id 
    INTO current_user_admin, current_user_group_admin, current_user_gruppe_id
    FROM profiles 
    WHERE id = current_user_id;
    
    -- Hole Gruppe des Ziel-Users
    SELECT gruppe_id INTO target_gruppe_id
    FROM profiles
    WHERE id = user_id;
    
    -- Berechtigung prüfen:
    -- Entweder Full-Admin ODER Gruppenadmin der gleichen Gruppe
    IF NOT (
        current_user_admin = true 
        OR 
        (current_user_group_admin = true AND current_user_gruppe_id = target_gruppe_id)
    ) THEN
        RAISE EXCEPTION 'Keine Berechtigung um Gruppenadmins zu setzen';
    END IF;
    
    -- Prüfe ob Target-User zur Gruppe gehört
    IF target_gruppe_id IS NULL THEN
        RAISE EXCEPTION 'Ziel-User muss einer Gruppe angehören';
    END IF;
    
    -- Prüfe ob es bereits einen Gruppenadmin in dieser Gruppe gibt
    SELECT id INTO existing_admin_id
    FROM profiles
    WHERE gruppe_id = target_gruppe_id 
    AND ist_gruppen_admin = true
    AND id != user_id
    LIMIT 1;
    
    -- Wenn Admin existiert und remove_existing = false: Fehler
    IF existing_admin_id IS NOT NULL AND remove_existing = false THEN
        RAISE EXCEPTION 'Gruppe hat bereits einen Admin. Verwende remove_existing=true um zu überschreiben.';
    END IF;
    
    -- Entferne alten Admin (falls vorhanden)
    IF existing_admin_id IS NOT NULL THEN
        UPDATE profiles
        SET ist_gruppen_admin = false
        WHERE id = existing_admin_id;
    END IF;
    
    -- Setze neuen Gruppenadmin
    UPDATE profiles
    SET ist_gruppen_admin = true
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. RLS Policy für profiles (falls nötig)
-- ============================================
-- Gruppenadmins dürfen andere User ihrer Gruppe aktualisieren

-- Drop alte Policy falls vorhanden
DROP POLICY IF EXISTS "Group admins can update their group members" ON profiles;

-- Erstelle neue Policy
CREATE POLICY "Group admins can update their group members"
ON profiles FOR UPDATE
TO authenticated
USING (
    -- Full Admin kann alles
    (SELECT ist_admin FROM profiles WHERE id = (select auth.uid())) = true
    OR
    -- Gruppenadmin kann User seiner Gruppe updaten (außer ist_admin)
    (
        (SELECT ist_gruppen_admin FROM profiles WHERE id = (select auth.uid())) = true
        AND gruppe_id = (SELECT gruppe_id FROM profiles WHERE id = (select auth.uid()))
    )
)
WITH CHECK (
    -- Full Admin kann alles
    (SELECT ist_admin FROM profiles WHERE id = (select auth.uid())) = true
    OR
    -- Gruppenadmin kann User seiner Gruppe updaten
    (
        (SELECT ist_gruppen_admin FROM profiles WHERE id = (select auth.uid())) = true
        AND gruppe_id = (SELECT gruppe_id FROM profiles WHERE id = (select auth.uid()))
        -- Aber nicht das ist_admin Flag setzen
        AND (ist_admin = (SELECT ist_admin FROM profiles WHERE id = id))
    )
);

-- ============================================
-- FERTIG!
-- ============================================
-- Nach Ausführung dieser Migration:
-- ✅ Erster User einer Gruppe wird automatisch Gruppenadmin
-- ✅ Gruppenadmins können andere User ihrer Gruppe promoten
-- ✅ Beim Promoten wird der alte Gruppenadmin automatisch entfernt

