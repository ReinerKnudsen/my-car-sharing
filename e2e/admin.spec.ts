import { test, expect } from '@playwright/test';
import { TestHelpers, generateTestData } from './fixtures/test-helpers';

/**
 * E2E Tests für Admin-Funktionen
 */

test.describe('Admin-Bereich', () => {
  let helpers: TestHelpers;

  test.beforeEach(({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.skip('sollte Admin-Tab nur für Admins anzeigen', async ({ page }) => {
    // Als normaler Benutzer einloggen
    await helpers.login('test@example.com', 'testpassword');
    
    // Admin-Tab sollte nicht sichtbar sein
    const adminTab = page.locator('ion-tab-button[tab="admin"]');
    await expect(adminTab).not.toBeVisible();
  });

  test.skip('sollte Admin-Seiten anzeigen für Admins', async ({ page }) => {
    // Als Admin einloggen
    await helpers.login('admin@example.com', 'adminpassword');
    
    // Admin-Tab sollte sichtbar sein
    const adminTab = page.locator('ion-tab-button[tab="admin"]');
    await expect(adminTab).toBeVisible();
    
    // Navigiere zum Admin-Bereich
    await helpers.navigateToTab('admin');
    
    // Sollte Fahrer-Verwaltung anzeigen
    await expect(page.locator('ion-title:has-text("Fahrer verwalten")')).toBeVisible();
  });

  test.skip('sollte Benutzerliste anzeigen', async ({ page }) => {
    await helpers.login('admin@example.com', 'adminpassword');
    await helpers.navigateToTab('admin');
    
    // Sollte Benutzer-Karten anzeigen
    await page.waitForSelector('ion-card', { timeout: 5000 });
  });

  test.skip('sollte zur Registrierungsseite navigieren', async ({ page }) => {
    await helpers.login('admin@example.com', 'adminpassword');
    await helpers.navigateToTab('admin');
    
    // Klicke FAB-Button
    await page.click('ion-fab-button');
    
    // Sollte zur Register-Seite navigieren
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('ion-title:has-text("Neuer Benutzer")')).toBeVisible();
  });

  test.skip('sollte Gruppenverwaltung anzeigen', async ({ page }) => {
    await helpers.login('admin@example.com', 'adminpassword');
    await helpers.navigateToTab('admin');
    
    // Navigiere zu Gruppen (falls Link vorhanden)
    const groupsLink = page.locator('text=Gruppen');
    if (await groupsLink.isVisible()) {
      await groupsLink.click();
      await expect(page.locator('ion-title:has-text("Gruppen verwalten")')).toBeVisible();
    }
  });

  test.skip('sollte neue Gruppe erstellen', async ({ page }) => {
    await helpers.login('admin@example.com', 'adminpassword');
    
    const testData = generateTestData();
    await helpers.createGroup(testData.group.bezeichnung);
    
    // Sollte Erfolgs-Toast anzeigen
    await helpers.waitForToast('erstellt');
  });

  test.skip('sollte Gruppe bearbeiten', async ({ page }) => {
    await helpers.login('admin@example.com', 'adminpassword');
    await helpers.navigateToTab('admin');
    
    // Navigiere zu Gruppen
    const groupsLink = page.locator('text=Gruppen');
    if (await groupsLink.isVisible()) {
      await groupsLink.click();
    }
    
    // Warte auf Gruppen
    await page.waitForSelector('ion-card', { timeout: 5000 });
    
    // Klicke auf ersten Bearbeiten-Button
    const editButton = page.locator('button ion-icon[icon="pencil-outline"]').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Modal sollte sich öffnen
      await expect(page.locator('ion-modal ion-title:has-text("Gruppe bearbeiten")')).toBeVisible();
    }
  });

  test.skip('sollte Gruppe löschen', async ({ page }) => {
    await helpers.login('admin@example.com', 'adminpassword');
    await helpers.navigateToTab('admin');
    
    // Navigiere zu Gruppen
    const groupsLink = page.locator('text=Gruppen');
    if (await groupsLink.isVisible()) {
      await groupsLink.click();
    }
    
    // Warte auf Gruppen
    await page.waitForSelector('ion-card', { timeout: 5000 });
    
    // Klicke auf ersten Löschen-Button
    const deleteButton = page.locator('button ion-icon[icon="trash-outline"]').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // Bestätige Löschung
      await page.click('button[role="destructive"]');
      
      // Sollte Erfolgs-Toast anzeigen
      await helpers.waitForToast('gelöscht');
    }
  });

  test.skip('sollte nicht-Admin Zugriff verweigern', async ({ page }) => {
    // Als normaler Benutzer einloggen
    await helpers.login('test@example.com', 'testpassword');
    
    // Versuche direkt zur Admin-Seite zu navigieren
    await page.goto('/admin/users');
    
    // Sollte Zugriff verweigern
    await expect(page.locator('text=Zugriff verweigert')).toBeVisible();
  });
});

