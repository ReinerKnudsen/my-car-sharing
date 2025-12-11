import { Page } from '@playwright/test';

/**
 * Test-Hilfsfunktionen für E2E-Tests
 */

export interface TestUser {
  email: string;
  password: string;
  vorname: string;
  name: string;
  isAdmin?: boolean;
}

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Führt Login durch
   */
  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    // Warte auf Navigation zum Dashboard
    await this.page.waitForURL('**/dashboard', { timeout: 10000 });
  }

  /**
   * Führt Logout durch
   */
  async logout() {
    await this.page.click('ion-tab-button[tab="profile"]');
    await this.page.waitForSelector('button:has-text("Abmelden")');
    await this.page.click('button:has-text("Abmelden")');
    await this.page.waitForURL('**/login');
  }

  /**
   * Navigiert zu einem Tab
   */
  async navigateToTab(tabName: 'dashboard' | 'bookings' | 'trips' | 'admin' | 'profile') {
    await this.page.click(`ion-tab-button[tab="${tabName}"]`);
    await this.page.waitForTimeout(500); // Kurz warten für Animation
  }

  /**
   * Erstellt eine Buchung
   */
  async createBooking(datum: string, uhrzeit: string, kommentar?: string) {
    await this.navigateToTab('bookings');
    await this.page.click('ion-fab-button');
    
    // Formular ausfüllen
    await this.page.fill('input[type="date"]', datum);
    await this.page.fill('input[type="time"]', uhrzeit);
    
    if (kommentar) {
      await this.page.fill('ion-textarea textarea', kommentar);
    }
    
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(1000); // Warte auf Toast und Navigation
  }

  /**
   * Erstellt eine Fahrt
   */
  async createTrip(datum: string, startKm: number, endKm: number) {
    await this.navigateToTab('trips');
    await this.page.click('ion-fab-button');
    
    // Formular ausfüllen
    await this.page.fill('input[type="date"]', datum);
    await this.page.fill('input[type="number"]').nth(0).then(el => el.fill(startKm.toString()));
    await this.page.fill('input[type="number"]').nth(1).then(el => el.fill(endKm.toString()));
    
    await this.page.click('button[type="submit"]');
    await this.page.waitForTimeout(1000); // Warte auf Toast und Navigation
  }

  /**
   * Erstellt eine Gruppe (nur für Admins)
   */
  async createGroup(bezeichnung: string) {
    await this.navigateToTab('admin');
    await this.page.waitForTimeout(500);
    
    // Wähle Groups-Tab falls nicht schon aktiv
    const groupsLink = this.page.locator('text=Gruppen');
    if (await groupsLink.isVisible()) {
      await groupsLink.click();
      await this.page.waitForTimeout(500);
    }
    
    await this.page.click('ion-fab-button');
    await this.page.waitForSelector('ion-modal');
    
    await this.page.fill('ion-input input', bezeichnung);
    await this.page.click('ion-modal button:has-text("Erstellen")');
    await this.page.waitForTimeout(1000);
  }

  /**
   * Wartet auf einen Toast mit bestimmtem Text
   */
  async waitForToast(text: string) {
    await this.page.waitForSelector(`ion-toast:has-text("${text}")`, { timeout: 5000 });
  }

  /**
   * Überprüft ob ein Element sichtbar ist
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.locator(selector).isVisible();
    } catch {
      return false;
    }
  }
}

/**
 * Generiert Test-Daten
 */
export function generateTestData() {
  const timestamp = Date.now();
  
  return {
    user: {
      email: `test-${timestamp}@example.com`,
      password: 'Test123456',
      vorname: 'Test',
      name: 'User',
    },
    admin: {
      email: `admin-${timestamp}@example.com`,
      password: 'Admin123456',
      vorname: 'Admin',
      name: 'User',
      isAdmin: true,
    },
    group: {
      bezeichnung: `Test Gruppe ${timestamp}`,
    },
    booking: {
      datum: new Date().toISOString().split('T')[0],
      uhrzeit: '14:00',
      kommentar: 'Test Buchung',
    },
    trip: {
      datum: new Date().toISOString().split('T')[0],
      startKm: 1000,
      endKm: 1050,
    },
  };
}

