import { test, expect } from '@playwright/test';
import { TestHelpers } from './fixtures/test-helpers';

/**
 * E2E Tests für Authentifizierung
 * 
 * HINWEIS: Diese Tests benötigen eine laufende Supabase-Instanz
 * und konfigurierte Umgebungsvariablen in .env
 */

test.describe('Authentifizierung', () => {
  let helpers: TestHelpers;

  test.beforeEach(({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('sollte Login-Seite anzeigen', async ({ page }) => {
    await page.goto('/login');
    
    // Prüfe ob Login-Formular vorhanden ist
    await expect(page.locator('h2:has-text("CarSharing Login")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Anmelden")')).toBeVisible();
  });

  test('sollte Fehler bei leeren Feldern anzeigen', async ({ page }) => {
    await page.goto('/login');
    
    // Versuche ohne Eingaben einzuloggen
    await page.click('button[type="submit"]');
    
    // Warte auf Toast-Nachricht
    await page.waitForSelector('ion-toast', { timeout: 5000 });
    const toast = page.locator('ion-toast');
    await expect(toast).toContainText('E-Mail und Passwort');
  });

  test('sollte Fehler bei falschen Credentials anzeigen', async ({ page }) => {
    await page.goto('/login');
    
    // Gebe falsche Credentials ein
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Warte auf Fehler-Toast
    await page.waitForSelector('ion-toast', { timeout: 5000 });
    const toast = page.locator('ion-toast');
    await expect(toast).toBeVisible();
  });

  test('sollte nicht eingeloggte Benutzer zur Login-Seite umleiten', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Sollte zur Login-Seite umgeleitet werden
    await expect(page).toHaveURL(/.*login/);
  });

  test.skip('sollte erfolgreiches Login durchführen', async ({ page }) => {
    // HINWEIS: Dieser Test benötigt einen existierenden Test-Benutzer
    // Erstellen Sie einen Benutzer in Supabase oder passen Sie die Credentials an
    
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Sollte zum Dashboard umgeleitet werden
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    
    // Sollte Willkommens-Text anzeigen
    await expect(page.locator('ion-card-title:has-text("Willkommen")')).toBeVisible();
  });

  test.skip('sollte Logout durchführen', async ({ page }) => {
    // HINWEIS: Benötigt erfolgreichen Login
    
    await helpers.login('test@example.com', 'testpassword');
    
    // Navigiere zum Profil
    await helpers.navigateToTab('profile');
    
    // Klicke Abmelden
    await page.click('button:has-text("Abmelden")');
    
    // Sollte zur Login-Seite umgeleitet werden
    await expect(page).toHaveURL(/.*login/);
  });
});

