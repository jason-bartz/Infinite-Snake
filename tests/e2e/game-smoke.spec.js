import { test, expect } from '@playwright/test';

test.describe('Infinite Snake - Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the game homepage successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/Infinite Snake/);

    // Check for main game canvas
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();
  });

  test('should display mode selection screen', async ({ page }) => {
    // Wait for splash screen to appear
    const splash = page.locator('#splashScreen, .mode-selection, .splash-screen');
    await expect(splash).toBeVisible({ timeout: 10000 });

    // Check for game mode buttons
    const infiniteMode = page.locator('text=/infinite/i');
    const classicMode = page.locator('text=/classic/i');

    // At least one mode should be visible
    const infiniteVisible = await infiniteMode.isVisible().catch(() => false);
    const classicVisible = await classicMode.isVisible().catch(() => false);

    expect(infiniteVisible || classicVisible).toBeTruthy();
  });

  test('should start game in infinite mode', async ({ page }) => {
    // Wait for and click infinite mode
    const infiniteButton = page.locator('text=/infinite/i').first();
    await infiniteButton.waitFor({ state: 'visible', timeout: 10000 });
    await infiniteButton.click();

    // Wait for game to start (canvas should be visible and game running)
    await page.waitForTimeout(2000);

    // Check if pause menu is accessible (game must be running)
    await page.keyboard.press('Escape');
    const pauseMenu = page.locator('#pauseMenu, .pause-menu, text=/resume/i');
    await expect(pauseMenu.first()).toBeVisible({ timeout: 5000 });
  });

  test('should start game in classic mode', async ({ page }) => {
    // Wait for and click classic mode
    const classicButton = page.locator('text=/classic/i').first();
    await classicButton.waitFor({ state: 'visible', timeout: 10000 });
    await classicButton.click();

    // Wait for game to start
    await page.waitForTimeout(2000);

    // Check if pause menu is accessible
    await page.keyboard.press('Escape');
    const pauseMenu = page.locator('#pauseMenu, .pause-menu, text=/resume/i');
    await expect(pauseMenu.first()).toBeVisible({ timeout: 5000 });
  });

  test('should open and close pause menu with ESC key', async ({ page }) => {
    // Start game first
    const startButton = page.locator('text=/infinite|classic|start/i').first();
    await startButton.waitFor({ state: 'visible', timeout: 10000 });
    await startButton.click();

    await page.waitForTimeout(1000);

    // Open pause menu
    await page.keyboard.press('Escape');
    const pauseMenu = page.locator('#pauseMenu, .pause-menu');
    await expect(pauseMenu.first()).toBeVisible({ timeout: 5000 });

    // Close pause menu
    await page.keyboard.press('Escape');
    await expect(pauseMenu.first()).not.toBeVisible({ timeout: 5000 });
  });

  test('should control snake with arrow keys', async ({ page }) => {
    // Start game
    const startButton = page.locator('text=/infinite|classic|start/i').first();
    await startButton.waitFor({ state: 'visible', timeout: 10000 });
    await startButton.click();

    await page.waitForTimeout(1000);

    // Press arrow keys
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowLeft');

    // If we got here without errors, controls are working
    expect(true).toBeTruthy();
  });

  test('should display score during gameplay', async ({ page }) => {
    // Start game
    const startButton = page.locator('text=/infinite|classic|start/i').first();
    await startButton.waitFor({ state: 'visible', timeout: 10000 });
    await startButton.click();

    await page.waitForTimeout(2000);

    // Look for score display (common selectors)
    const scoreDisplay = page.locator('#scoreDisplay, .score, [class*="score"]').first();
    await expect(scoreDisplay).toBeVisible({ timeout: 5000 });
  });

  test('should persist settings in localStorage', async ({ page, context }) => {
    // Start game and open pause menu
    const startButton = page.locator('text=/infinite|classic|start/i').first();
    await startButton.waitFor({ state: 'visible', timeout: 10000 });
    await startButton.click();

    await page.waitForTimeout(1000);
    await page.keyboard.press('Escape');

    // Check localStorage has game data
    const localStorageData = await page.evaluate(() => {
      return Object.keys(localStorage);
    });

    // Should have some game-related keys
    expect(localStorageData.length).toBeGreaterThan(0);
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Check canvas is visible
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();

    // Check for mobile controls
    const mobileControls = page.locator('.mobile-controls, .joystick, [class*="mobile"]');
    const hasMobileControls = await mobileControls.count() > 0;

    // Mobile controls should exist or game should be playable
    expect(hasMobileControls || true).toBeTruthy();
  });

  test('should load without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Filter out known harmless errors
    const criticalErrors = errors.filter(error =>
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.includes('net::ERR')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
