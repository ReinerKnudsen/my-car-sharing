import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ FEHLER: Supabase URL oder Anon Key fehlt in der .env Datei!');
  console.error('Bitte erstellen Sie eine .env Datei mit:');
  console.error('VITE_SUPABASE_URL=your-url');
  console.error('VITE_SUPABASE_ANON_KEY=your-key');

  // Erstelle einen Dummy-Client um Fehler zu vermeiden
  // In Production würde man hier eine Fehlerseite zeigen
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      // Session-Persistierung für PWA (besonders wichtig für iOS)
      persistSession: true,

      // Eindeutiger Storage-Key für diese App
      storageKey: 'carsharing-auth-token',

      // Explizit localStorage verwenden (wichtig für PWAs)
      storage: window.localStorage,

      // Token automatisch erneuern (verhindert Session-Ablauf)
      autoRefreshToken: true,

      // Session aus URL erkennen (z.B. nach Password-Reset)
      detectSessionInUrl: true,

      // Flow-Type für bessere PWA-Kompatibilität
      flowType: 'pkce',
    },
  }
);
