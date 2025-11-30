import { test, expect } from '@playwright/test';
import { TestHelpers } from './fixtures/test-helpers';

/**
 * E2E Tests für Dashboard
 */

test.describe('Dashboard', () => {
  let helpers: TestHelpers;

  test.beforeEach(({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.skip('sollte Dashboard nach Login anzeigen', async ({ page }) => {
    // HINWEIS: Benötigt valide Test-Credentials
    await helpers.login('test@example.com', 'testpassword');
    
    // Prüfe Dashboard-Elemente
    await expect(page.locator('ion-title:has-text("Dashboard")')).toBeVisible();
    await expect(page.locator('ion-card-title:has-text("Willkommen")')).toBeVisible();
  });

  test.skip('sollte Statistik-Karten anzeigen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    
    // Prüfe ob Statistik-Karten vorhanden sind
    await expect(page.locator('text=Gesamt-Kilometer')).toBeVisible();
    await expect(page.locator('text=Meine Kilometer')).toBeVisible();
  });

  test.skip('sollte kommende Buchungen anzeigen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    
    // Prüfe Buchungen-Karte
    await expect(page.locator('ion-card-title:has-text("Kommende Buchungen")')).toBeVisible();
  });

  test.skip('sollte letzte Fahrten anzeigen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    
    // Prüfe Fahrten-Karte
    await expect(page.locator('ion-card-title:has-text("Letzte Fahrten")')).toBeVisible();
  });

  test.skip('sollte Pull-to-Refresh unterstützen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    
    // Simuliere Pull-to-Refresh
    const refresher = page.locator('ion-refresher');
    await expect(refresher).toBeVisible();
  });
});

