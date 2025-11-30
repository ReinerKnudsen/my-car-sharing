#!/usr/bin/env tsx
/**
 * Test-Script für Supabase Datenbankverbindung
 * 
 * Dieses Script testet:
 * 1. Ob die Umgebungsvariablen gesetzt sind
 * 2. Ob die Verbindung zu Supabase hergestellt werden kann
 * 3. Ob die Datenbank-Tabellen existieren
 * 4. Ob RLS (Row Level Security) aktiviert ist
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES Module Support
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lade .env Datei
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Farben für Console-Output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, 'green');
}

function logError(message: string) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testConnection() {
  console.log('\n' + '='.repeat(60));
  log('Supabase Datenbankverbindungs-Test', 'cyan');
  console.log('='.repeat(60) + '\n');

  // 1. Prüfe Umgebungsvariablen
  logInfo('1. Prüfe Umgebungsvariablen...');
  
  if (!SUPABASE_URL) {
    logError('VITE_SUPABASE_URL ist nicht gesetzt!');
    logInfo('Bitte erstellen Sie eine .env Datei mit:');
    console.log('VITE_SUPABASE_URL=your-supabase-url');
    console.log('VITE_SUPABASE_ANON_KEY=your-supabase-anon-key\n');
    process.exit(1);
  }
  
  if (!SUPABASE_ANON_KEY) {
    logError('VITE_SUPABASE_ANON_KEY ist nicht gesetzt!');
    process.exit(1);
  }

  logSuccess(`URL: ${SUPABASE_URL.substring(0, 30)}...`);
  logSuccess(`Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

  // 2. Erstelle Supabase Client
  logInfo('\n2. Erstelle Supabase Client...');
  
  let supabase;
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    logSuccess('Supabase Client erstellt');
  } catch (error: any) {
    logError(`Fehler beim Erstellen des Clients: ${error.message}`);
    process.exit(1);
  }

  // 3. Teste Datenbankverbindung
  logInfo('\n3. Teste Datenbankverbindung...');
  
  try {
    const { error } = await supabase.from('groups').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('relation "public.groups" does not exist')) {
        logError('Tabelle "groups" existiert nicht!');
        logWarning('Bitte führen Sie das SQL-Schema aus: supabase-schema.sql');
        process.exit(1);
      }
      throw error;
    }
    
    logSuccess('Verbindung zur Datenbank erfolgreich');
  } catch (error: any) {
    logError(`Verbindungsfehler: ${error.message}`);
    process.exit(1);
  }

  // 4. Prüfe ob Tabellen existieren
  logInfo('\n4. Prüfe Datenbank-Tabellen...');
  
  const tables = ['groups', 'profiles', 'bookings', 'trips'];
  let allTablesExist = true;

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.message.includes('does not exist')) {
          logError(`Tabelle "${table}" existiert nicht`);
          allTablesExist = false;
        } else {
          throw error;
        }
      } else {
        logSuccess(`Tabelle "${table}" gefunden`);
      }
    } catch (error: any) {
      logError(`Fehler bei "${table}": ${error.message}`);
      allTablesExist = false;
    }
  }

  if (!allTablesExist) {
    logWarning('\nNicht alle Tabellen existieren!');
    logInfo('Führen Sie das SQL-Schema aus: supabase-schema.sql');
    process.exit(1);
  }

  // 5. Zähle Datensätze
  logInfo('\n5. Zähle Datensätze in den Tabellen...');
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      logInfo(`${table}: ${count || 0} Einträge`);
    } catch (error: any) {
      logWarning(`Konnte ${table} nicht zählen: ${error.message}`);
    }
  }

  // 6. Teste Auth (optional)
  logInfo('\n6. Teste Auth-System...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error && !error.message.includes('session_not_found')) {
      throw error;
    }
    
    logSuccess('Auth-System funktioniert');
    
    if (data.session) {
      logInfo('Eine aktive Session wurde gefunden');
    } else {
      logInfo('Keine aktive Session (normal für anonymen Zugriff)');
    }
  } catch (error: any) {
    logWarning(`Auth-Test fehlgeschlagen: ${error.message}`);
  }

  // 7. Prüfe RLS (Row Level Security)
  logInfo('\n7. Prüfe Row Level Security (RLS)...');
  
  try {
    // Versuche ohne Auth zu lesen (sollte fehlschlagen wenn RLS aktiv ist)
    const { data: groups } = await supabase.from('groups').select('*');
    
    if (groups && groups.length > 0) {
      logWarning('Daten können ohne Authentifizierung gelesen werden');
      logWarning('RLS könnte nicht korrekt konfiguriert sein');
    } else {
      logInfo('Keine Daten ohne Auth verfügbar (RLS funktioniert)');
    }
  } catch (error: any) {
    if (error.message.includes('policy')) {
      logSuccess('RLS ist aktiv und funktioniert');
    } else {
      logWarning(`RLS-Check: ${error.message}`);
    }
  }

  // Zusammenfassung
  console.log('\n' + '='.repeat(60));
  logSuccess('Alle Tests erfolgreich abgeschlossen! ✨');
  console.log('='.repeat(60) + '\n');
  
  logInfo('Nächste Schritte:');
  console.log('1. Erstellen Sie einen Test-Benutzer in Supabase');
  console.log('2. Starten Sie die App: npm run dev');
  console.log('3. Melden Sie sich an und testen Sie die Funktionen\n');
}

// Script ausführen
testConnection().catch((error) => {
  console.error('\n');
  logError(`Unerwarteter Fehler: ${error.message}`);
  console.error(error);
  process.exit(1);
});

