import { test, expect } from '@playwright/test';

test.describe('Infinite Snake Game Initialization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the game page', async ({ page }) => {
    await expect(page).toHaveTitle(/Infinite Snake/);
  });

  test('should display the main game container', async ({ page }) => {
    const gameContainer = page.locator('#game-container');
    await expect(gameContainer).toBeVisible();
  });

  test('should load the game canvas', async ({ page }) => {
    const canvas = page.locator('canvas#game-canvas');
    await expect(canvas).toBeVisible();
    
    // Check canvas dimensions
    const canvasSize = await canvas.boundingBox();
    expect(canvasSize).not.toBeNull();
    expect(canvasSize!.width).toBeGreaterThan(0);
    expect(canvasSize!.height).toBeGreaterThan(0);
  });

  test('should display the score', async ({ page }) => {
    const score = page.locator('#score');
    await expect(score).toBeVisible();
    await expect(score).toContainText('0');
  });

  test('should display game controls on desktop', async ({ page, isMobile }) => {
    if (!isMobile) {
      // Check for keyboard instructions
      const controls = page.locator('.controls, .instructions').first();
      await expect(controls).toBeVisible();
    }
  });

  test('should display mobile controls on mobile devices', async ({ page, isMobile }) => {
    if (isMobile) {
      // Check for touch controls
      const mobileControls = page.locator('.mobile-controls, .touch-controls').first();
      await expect(mobileControls).toBeVisible();
    }
  });

  test('should load game resources', async ({ page }) => {
    // Check if elements data is loaded
    const elementsLoaded = await page.evaluate(() => {
      return window.hasOwnProperty('gameElements') || 
             window.hasOwnProperty('elements') ||
             (window as any).game?.elements;
    });
    expect(elementsLoaded).toBeTruthy();
  });

  test('should initialize the snake', async ({ page }) => {
    // Wait for game initialization
    await page.waitForTimeout(1000);
    
    // Check if snake is rendered on canvas
    const canvas = page.locator('canvas#game-canvas');
    const canvasScreenshot = await canvas.screenshot();
    
    // The canvas should not be completely black (snake should be visible)
    expect(canvasScreenshot.length).toBeGreaterThan(1000);
  });

  test('should handle window resize', async ({ page }) => {
    // Initial viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    
    const initialCanvas = await page.locator('canvas#game-canvas').boundingBox();
    
    // Resize viewport
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);
    
    const resizedCanvas = await page.locator('canvas#game-canvas').boundingBox();
    
    // Canvas should adapt to new size
    expect(resizedCanvas!.width).not.toBe(initialCanvas!.width);
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    expect(consoleErrors).toHaveLength(0);
  });
});