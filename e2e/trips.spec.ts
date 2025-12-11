import { test, expect } from '@playwright/test';
import { TestHelpers, generateTestData } from './fixtures/test-helpers';

/**
 * E2E Tests für Fahrten
 */

test.describe('Fahrten', () => {
  let helpers: TestHelpers;

  test.beforeEach(({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.skip('sollte Fahrtenliste anzeigen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('trips');
    
    // Prüfe Fahrten-Seite
    await expect(page.locator('ion-title:has-text("Fahrten")')).toBeVisible();
  });

  test.skip('sollte Segment-Filter anzeigen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('trips');
    
    // Prüfe Filter-Segmente
    await expect(page.locator('ion-segment-button[value="all"]')).toBeVisible();
    await expect(page.locator('ion-segment-button[value="mine"]')).toBeVisible();
  });

  test.skip('sollte zur Fahrt-Erstellen-Seite navigieren', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('trips');
    
    // Klicke FAB-Button
    await page.click('ion-fab-button');
    
    // Sollte zur Create-Seite navigieren
    await expect(page).toHaveURL(/.*trips\/create/);
    await expect(page.locator('ion-title:has-text("Neue Fahrt")')).toBeVisible();
  });

  test.skip('sollte neue Fahrt erstellen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    
    const testData = generateTestData();
    await helpers.createTrip(
      testData.trip.datum,
      testData.trip.startKm,
      testData.trip.endKm
    );
    
    // Sollte zurück zur Fahrtenliste navigieren
    await expect(page).toHaveURL(/.*trips$/);
    
    // Sollte Erfolgs-Toast anzeigen
    await helpers.waitForToast('erfolgreich');
  });

  test.skip('sollte gefahrene Kilometer berechnen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('trips');
    await page.click('ion-fab-button');
    
    // Gebe Kilometer ein
    const testData = generateTestData();
    await page.fill('input[type="date"]', testData.trip.datum);
    
    // Fülle Start-Kilometer
    const startInput = page.locator('input[type="number"]').first();
    await startInput.fill(testData.trip.startKm.toString());
    
    // Fülle End-Kilometer
    const endInput = page.locator('input[type="number"]').last();
    await endInput.fill(testData.trip.endKm.toString());
    
    // Sollte Distanz anzeigen
    const distance = testData.trip.endKm - testData.trip.startKm;
    await expect(page.locator(`text=${distance} km`)).toBeVisible();
  });

  test.skip('sollte Validierung für Kilometer durchführen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('trips');
    await page.click('ion-fab-button');
    
    // Gebe ungültige Kilometer ein (End kleiner als Start)
    await page.fill('input[type="date"]', '2024-01-01');
    await page.locator('input[type="number"]').first().fill('1000');
    await page.locator('input[type="number"]').last().fill('900');
    
    // Versuche zu speichern
    await page.click('button[type="submit"]');
    
    // Sollte Validierungsfehler anzeigen
    await helpers.waitForToast('größer');
  });

  test.skip('sollte Fahrt löschen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('trips');
    
    // Warte auf Fahrten
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

  test.skip('sollte Kilometer-Badge anzeigen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    await helpers.navigateToTab('trips');
    
    // Warte auf Fahrten
    const cards = page.locator('ion-card');
    if (await cards.count() > 0) {
      // Sollte Badge mit km anzeigen
      await expect(page.locator('ion-badge:has-text("km")')).toBeVisible();
    }
  });
});

