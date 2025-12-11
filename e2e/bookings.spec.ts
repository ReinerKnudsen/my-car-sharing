import { test, expect } from '@playwright/test';
import { TestHelpers, generateTestData } from './fixtures/test-helpers';

/**
 * E2E Tests für Buchungen
 */

test.describe('Buchungen', () => {
  let helpers: TestHelpers;

  test.beforeEach(({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.skip('sollte Buchungsliste anzeigen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('bookings');
    
    // Prüfe Buchungen-Seite
    await expect(page.locator('ion-title:has-text("Buchungen")')).toBeVisible();
  });

  test.skip('sollte Segment-Filter anzeigen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('bookings');
    
    // Prüfe Filter-Segmente
    await expect(page.locator('ion-segment-button[value="upcoming"]')).toBeVisible();
    await expect(page.locator('ion-segment-button[value="all"]')).toBeVisible();
    await expect(page.locator('ion-segment-button[value="past"]')).toBeVisible();
  });

  test.skip('sollte zur Buchung-Erstellen-Seite navigieren', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('bookings');
    
    // Klicke FAB-Button
    await page.click('ion-fab-button');
    
    // Sollte zur Create-Seite navigieren
    await expect(page).toHaveURL(/.*bookings\/create/);
    await expect(page.locator('ion-title:has-text("Neue Buchung")')).toBeVisible();
  });

  test.skip('sollte neue Buchung erstellen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    
    const testData = generateTestData();
    await helpers.createBooking(
      testData.booking.datum,
      testData.booking.uhrzeit,
      testData.booking.kommentar
    );
    
    // Sollte zurück zur Buchungsliste navigieren
    await expect(page).toHaveURL(/.*bookings$/);
    
    // Sollte Erfolgs-Toast anzeigen
    await helpers.waitForToast('erfolgreich');
  });

  test.skip('sollte Validierung für Pflichtfelder durchführen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('bookings');
    await page.click('ion-fab-button');
    
    // Versuche ohne Eingaben zu speichern
    await page.click('button[type="submit"]');
    
    // Sollte Validierungsfehler anzeigen
    await helpers.waitForToast('Pflichtfelder');
  });

  test.skip('sollte Buchung löschen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('bookings');
    
    // Warte auf Buchungen
    await page.waitForSelector('ion-card', { timeout: 5000 });
    
    // Klicke auf ersten Lösch-Button
    const deleteButton = page.locator('button:has-text("Löschen")').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Bestätige Löschung
      await page.click('button[role="destructive"]');
      
      // Sollte Erfolgs-Toast anzeigen
      await helpers.waitForToast('gelöscht');
    }
  });

  test.skip('sollte zwischen Filtern wechseln', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('bookings');
    
    // Wechsle zu "Alle"
    await page.click('ion-segment-button[value="all"]');
    await page.waitForTimeout(500);
    
    // Wechsle zu "Vergangen"
    await page.click('ion-segment-button[value="past"]');
    await page.waitForTimeout(500);
    
    // Filter sollte aktiv sein
    const pastSegment = page.locator('ion-segment-button[value="past"]');
    await expect(pastSegment).toHaveClass(/segment-button-checked/);
  });
});

