import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase Config:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
  key: supabaseAnonKey ? 'Present' : 'MISSING'
});

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
  supabaseAnonKey || 'placeholder-key'
);

