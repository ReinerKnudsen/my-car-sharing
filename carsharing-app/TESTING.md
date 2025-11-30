# Testing-Dokumentation

Diese Dokumentation beschreibt die Test-Strategie und wie Tests für die CarSharing App ausgeführt werden.

## Überblick

Die App verwendet zwei Test-Frameworks:
- **Playwright** für End-to-End (E2E) Tests
- **Vitest** für Unit-Tests

## Test-Struktur

```
carsharing-app/
├── e2e/                          # Playwright E2E-Tests
│   ├── fixtures/
│   │   └── test-helpers.ts      # Test-Hilfsfunktionen
│   ├── auth.spec.ts             # Authentifizierungs-Tests
│   ├── dashboard.spec.ts        # Dashboard-Tests
│   ├── bookings.spec.ts         # Buchungs-Tests
│   ├── trips.spec.ts            # Fahrten-Tests
│   └── admin.spec.ts            # Admin-Tests
├── src/
│   ├── test/                    # Unit-Test-Setup
│   │   ├── setup.ts            # Vitest-Konfiguration
│   │   └── test-utils.tsx      # Test-Utilities & Mocks
│   ├── services/__tests__/      # Service-Unit-Tests
│   │   ├── auth.service.test.ts
│   │   └── database.test.ts
│   └── components/__tests__/    # Komponenten-Unit-Tests
│       ├── BookingCard.test.tsx
│       ├── TripCard.test.tsx
│       ├── ProtectedRoute.test.tsx
│       └── AdminRoute.test.tsx
├── playwright.config.ts         # Playwright-Konfiguration
└── vitest.config.ts            # Vitest-Konfiguration
```

## Unit-Tests (Vitest)

### Tests ausführen

```bash
# Alle Unit-Tests ausführen
npm run test:unit

# Tests im Watch-Mode (automatisches Neu-Laden)
npm run test:unit:watch

# Tests mit Coverage-Report
npm run test:unit:coverage

# Spezifischen Test ausführen
npm run test:unit -- src/services/__tests__/auth.service.test.ts
```

### Unit-Tests schreiben

**Service-Tests:**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../auth.service';
import { supabase } from '../supabase';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sollte Benutzer erfolgreich anmelden', async () => {
    const mockData = {
      user: { id: '123', email: 'test@example.com' },
      session: { access_token: 'token' },
    };

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: mockData,
      error: null,
    } as any);

    const result = await authService.signIn('test@example.com', 'password');

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    });
    expect(result).toEqual(mockData);
  });
});
```

**Komponenten-Tests:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/test-utils';
import BookingCard from '../BookingCard';
import { mockBooking } from '../../test/test-utils';

describe('BookingCard', () => {
  it('sollte Buchungsdetails anzeigen', () => {
    render(<BookingCard booking={mockBooking} />);
    
    expect(screen.getByText(mockBooking.uhrzeit)).toBeInTheDocument();
    expect(screen.getByText(/Test User/)).toBeInTheDocument();
  });
});
```

### Mock-Daten verwenden

Test-Utilities stellen vorgefertigte Mock-Daten bereit:

```typescript
import { 
  mockUser, 
  mockProfile, 
  mockGroup, 
  mockTrip, 
  mockBooking 
} from '../../test/test-utils';
```

### Best Practices für Unit-Tests

1. **Arrange-Act-Assert Pattern:**
   - Arrange: Test-Daten vorbereiten
   - Act: Funktion ausführen
   - Assert: Ergebnis überprüfen

2. **Mocks verwenden:**
   - Externe Dependencies mocken (Supabase, Router, etc.)
   - Nur die zu testende Einheit testen

3. **Aussagekräftige Test-Namen:**
   - Beschreiben Sie das erwartete Verhalten
   - Verwenden Sie "sollte..." Format

4. **Isolation:**
   - Jeder Test sollte unabhängig sein
   - `beforeEach` für Setup verwenden
   - Mocks nach jedem Test zurücksetzen

## E2E-Tests (Playwright)

### Tests ausführen

```bash
# Alle E2E-Tests ausführen (Headless)
npm run test:e2e

# Tests mit UI (Browser sichtbar)
npm run test:e2e:ui

# Spezifischen Test ausführen
npm run test:e2e -- e2e/auth.spec.ts

# Tests in bestimmtem Browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit

# Test-Report anzeigen
npx playwright show-report
```

### E2E-Tests schreiben

**Basis-Test:**

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './fixtures/test-helpers';

test.describe('Authentifizierung', () => {
  let helpers: TestHelpers;

  test.beforeEach(({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('sollte Login-Seite anzeigen', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.locator('h2:has-text("CarSharing Login")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test.skip('sollte erfolgreiches Login durchführen', async ({ page }) => {
    await helpers.login('test@example.com', 'testpassword');
    
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('ion-card-title:has-text("Willkommen")')).toBeVisible();
  });
});
```

**Test-Helpers verwenden:**

```typescript
import { TestHelpers, generateTestData } from './fixtures/test-helpers';

test('sollte neue Buchung erstellen', async ({ page }) => {
  const helpers = new TestHelpers(page);
  const testData = generateTestData();
  
  await helpers.login('test@example.com', 'password');
  await helpers.createBooking(
    testData.booking.datum,
    testData.booking.uhrzeit,
    testData.booking.kommentar
  );
  
  await helpers.waitForToast('erfolgreich');
});
```

### Warum sind Tests `skip`ped?

Viele E2E-Tests sind mit `test.skip()` markiert, weil sie:
1. Eine laufende Supabase-Instanz benötigen
2. Valide Test-Credentials benötigen
3. Testdaten in der Datenbank benötigen

**Tests aktivieren:**

1. Richten Sie eine Test-Datenbank in Supabase ein
2. Erstellen Sie Test-Benutzer
3. Aktualisieren Sie die Credentials in den Tests
4. Entfernen Sie `.skip` von den Tests

```typescript
// Vorher
test.skip('sollte erfolgreiches Login durchführen', async ({ page }) => {
  await helpers.login('test@example.com', 'testpassword');
  // ...
});

// Nachher (mit echten Credentials)
test('sollte erfolgreiches Login durchführen', async ({ page }) => {
  await helpers.login('your-test-user@example.com', 'your-test-password');
  // ...
});
```

### Best Practices für E2E-Tests

1. **Test-Isolation:**
   - Jeder Test sollte unabhängig laufen können
   - Verwenden Sie eindeutige Test-Daten
   - Cleanup nach Tests

2. **Selektoren:**
   - Verwenden Sie stabile Selektoren (data-testid)
   - Vermeiden Sie CSS-Klassen als Selektoren
   - Nutzen Sie semantische HTML-Selektoren

3. **Waits:**
   - Verwenden Sie Playwright's auto-waiting
   - Explizite `waitFor` nur wenn nötig
   - Vermeiden Sie feste Timeouts

4. **Test-Daten:**
   - Verwenden Sie `generateTestData()` für dynamische Daten
   - Vermeiden Sie hardcodierte Werte
   - Erstellen Sie Daten über die App, nicht direkt in der DB

## Coverage

### Coverage-Report erstellen

```bash
# Unit-Test Coverage
npm run test:unit:coverage

# Report im Browser öffnen
open coverage/index.html
```

### Coverage-Ziele

- **Statements:** ≥ 80%
- **Branches:** ≥ 75%
- **Functions:** ≥ 80%
- **Lines:** ≥ 80%

## Continuous Integration (CI)

### GitHub Actions Beispiel

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit:coverage
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging

### Unit-Tests debuggen

```bash
# Tests mit Node Inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# In VS Code: Debug-Konfiguration
{
  "type": "node",
  "request": "launch",
  "name": "Debug Unit Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test:unit"],
  "console": "integratedTerminal"
}
```

### E2E-Tests debuggen

```bash
# Tests im UI-Mode
npm run test:e2e:ui

# Tests mit Inspector
npx playwright test --debug

# Spezifischen Test debuggen
npx playwright test auth.spec.ts --debug
```

**Playwright-Debug-Tools:**

- `await page.pause()` - Pausiert Test für manuelle Inspektion
- Playwright Inspector - Visuelle Test-Ausführung
- Trace Viewer - Aufzeichnung von Test-Ausführungen

## Problembehebung

### Vitest-Probleme

**Problem:** Tests finden Module nicht
```bash
# Lösung: Prüfen Sie vitest.config.ts resolve.alias
```

**Problem:** DOM-APIs nicht verfügbar
```bash
# Lösung: Stellen Sie sicher, dass happy-dom in vitest.config.ts konfiguriert ist
environment: 'happy-dom'
```

### Playwright-Probleme

**Problem:** Browser nicht gefunden
```bash
# Lösung: Browser installieren
npx playwright install chromium
```

**Problem:** Timeout-Fehler
```bash
# Lösung: Erhöhen Sie das Timeout
test.setTimeout(60000); // 60 Sekunden
```

**Problem:** Selektoren nicht gefunden
```bash
# Lösung: Verwenden Sie `page.pause()` für Inspektion
await page.pause();
```

## Test-Beispiele

Vollständige Test-Beispiele finden Sie in:
- `e2e/` - E2E-Test-Beispiele
- `src/services/__tests__/` - Service-Test-Beispiele
- `src/components/__tests__/` - Komponenten-Test-Beispiele

## Weitere Ressourcen

- [Playwright Dokumentation](https://playwright.dev)
- [Vitest Dokumentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Ionic Testing](https://ionicframework.com/docs/testing/overview)

## Checkliste für neue Features

Beim Hinzufügen neuer Features:

- [ ] Unit-Tests für Services schreiben
- [ ] Unit-Tests für Komponenten schreiben
- [ ] E2E-Tests für User-Flows schreiben
- [ ] Coverage-Bericht prüfen (≥80%)
- [ ] Tests in CI laufen lassen
- [ ] Test-Dokumentation aktualisieren

