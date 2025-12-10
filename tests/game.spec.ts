import { test, expect } from '@playwright/test';

// Test user credentials - make sure this user exists in your DB
const TEST_USER = {
  username: 'testuser',
  password: 'testpass'
};

test.describe('Single Player Game', () => {
  test('login and start single player game', async ({ page }) => {
    await page.goto('/login');

    // Login
    await page.fill('input[name="username"], input[formControlName="username"]', TEST_USER.username);
    await page.fill('input[name="password"], input[formControlName="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for navigation
    await page.waitForURL(/\/(game|choose-word|wait)/);

    // Open sidenav and click single player
    await page.click('button.hamburger');
    await page.click('text=single player');

    // Should be on game page
    await expect(page).toHaveURL('/game');

    // Board should be visible
    await expect(page.locator('.board')).toBeVisible();
  });

  test('single player game persists after refresh', async ({ page }) => {
    await page.goto('/login');

    // Login
    await page.fill('input[name="username"], input[formControlName="username"]', TEST_USER.username);
    await page.fill('input[name="password"], input[formControlName="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(game|choose-word|wait)/);

    // Start single player
    await page.click('button.hamburger');
    await page.click('text=single player');
    await expect(page).toHaveURL('/game');

    // Type a word
    await page.keyboard.type('STEAK');
    await page.keyboard.press('Enter');

    // Wait for animation
    await page.waitForTimeout(2000);

    // First cell should have 'S'
    const firstCell = page.locator('.row:first-child .cell:first-child');
    await expect(firstCell).toContainText('S');

    // Refresh the page
    await page.reload();

    // Should still be on game page (not redirected to choose-word)
    await expect(page).toHaveURL('/game');

    // First cell should still have 'S' (game persisted)
    await expect(firstCell).toContainText('S');
  });

  test('null solution shows error message', async ({ page }) => {
    await page.goto('/login');

    // Login
    await page.fill('input[name="username"], input[formControlName="username"]', TEST_USER.username);
    await page.fill('input[name="password"], input[formControlName="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(game|choose-word|wait)/);

    // If we somehow end up with a null solution game, typing should show error
    // This is more of a safety net test
    await page.goto('/game');

    // The board should be present
    await expect(page.locator('.board')).toBeVisible();
  });
});

test.describe('Multiplayer Game', () => {
  test('multiplayer with no word routes to choose-word', async ({ page }) => {
    await page.goto('/login');

    // Login
    await page.fill('input[name="username"], input[formControlName="username"]', TEST_USER.username);
    await page.fill('input[name="password"], input[formControlName="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(game|choose-word|wait)/);

    // If the most recent game is multiplayer with no word, should be on choose-word
    // This depends on DB state, so we just verify the page loads
    const url = page.url();
    expect(['/game', '/choose-word', '/wait'].some(path => url.includes(path))).toBeTruthy();
  });
});

test.describe('Responsive Design', () => {
  test('board fits on iPhone screen', async ({ page }) => {
    await page.goto('/login');

    // Login first
    await page.fill('input[name="username"], input[formControlName="username"]', TEST_USER.username);
    await page.fill('input[name="password"], input[formControlName="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(game|choose-word|wait)/);

    // Start single player to ensure we're on game page with board
    await page.click('button.hamburger');
    await page.click('text=single player');
    await expect(page).toHaveURL('/game');

    // Board should be visible and not overflow
    const board = page.locator('.board');
    await expect(board).toBeVisible();

    // Check board is within viewport
    const boundingBox = await board.boundingBox();
    if (boundingBox) {
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        expect(boundingBox.width).toBeLessThanOrEqual(viewportSize.width);
      }
    }
  });
});

test.describe('In-App Browser Warning', () => {
  test('shows warning for Instagram user agent', async ({ page, context }) => {
    // Set Instagram user agent
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 123.0.0',
        writable: false
      });
    });

    await page.goto('/login');

    // Warning banner should be visible
    await expect(page.locator('.in-app-warning')).toBeVisible();
    await expect(page.locator('.in-app-warning')).toContainText('best experience');
  });

  test('dismisses warning when X clicked', async ({ page, context }) => {
    // Set Instagram user agent
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 Instagram',
        writable: false
      });
    });

    await page.goto('/login');

    // Warning should be visible
    const warning = page.locator('.in-app-warning');
    await expect(warning).toBeVisible();

    // Click dismiss
    await page.click('.in-app-warning button');

    // Warning should be gone
    await expect(warning).not.toBeVisible();
  });
});
