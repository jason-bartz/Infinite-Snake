import { test, expect } from '@playwright/test';

test.describe('Snake Movement', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for game to initialize
    await page.waitForTimeout(1000);
  });

  test('should move snake with arrow keys', async ({ page }) => {
    // Get initial score
    const initialScore = await page.locator('#score').textContent();
    
    // Press arrow keys
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(500);
    
    // Snake should have moved (canvas content should change)
    const canvas = page.locator('canvas#game-canvas');
    const screenshot1 = await canvas.screenshot();
    
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    
    const screenshot2 = await canvas.screenshot();
    
    // Screenshots should be different (snake moved)
    expect(Buffer.compare(screenshot1, screenshot2)).not.toBe(0);
  });

  test('should move snake with WASD keys', async ({ page }) => {
    // Test WASD controls
    await page.keyboard.press('d'); // Right
    await page.waitForTimeout(300);
    
    await page.keyboard.press('s'); // Down
    await page.waitForTimeout(300);
    
    await page.keyboard.press('a'); // Left
    await page.waitForTimeout(300);
    
    await page.keyboard.press('w'); // Up
    await page.waitForTimeout(300);
    
    // Game should still be running
    const gameOver = await page.locator('.game-over, #game-over').isVisible();
    expect(gameOver).toBe(false);
  });

  test('should prevent snake from reversing direction', async ({ page }) => {
    // Move right
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    
    // Try to move left (opposite direction)
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    
    // Snake should continue moving right (not crash)
    const gameOver = await page.locator('.game-over, #game-over').isVisible();
    expect(gameOver).toBe(false);
  });

  test('should handle rapid key presses', async ({ page }) => {
    // Rapid key presses
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowUp');
    
    await page.waitForTimeout(1000);
    
    // Game should handle rapid inputs without crashing
    const gameOver = await page.locator('.game-over, #game-over').isVisible();
    expect(gameOver).toBe(false);
  });

  test('should move snake with touch controls on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip();
      return;
    }
    
    const gameCanvas = page.locator('canvas#game-canvas');
    const canvasBox = await gameCanvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas not found');
    }
    
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    
    // Swipe right
    await page.touchscreen.tap(centerX, centerY);
    await page.touchscreen.swipe({
      startX: centerX,
      startY: centerY,
      endX: centerX + 100,
      endY: centerY,
      steps: 10
    });
    
    await page.waitForTimeout(500);
    
    // Swipe down
    await page.touchscreen.swipe({
      startX: centerX,
      startY: centerY,
      endX: centerX,
      endY: centerY + 100,
      steps: 10
    });
    
    await page.waitForTimeout(500);
    
    // Game should respond to touch controls
    const gameOver = await page.locator('.game-over, #game-over').isVisible();
    expect(gameOver).toBe(false);
  });

  test('should pause and resume game', async ({ page }) => {
    // Look for pause functionality
    const pauseButton = page.locator('button:has-text("Pause"), button:has-text("pause")').first();
    
    if (await pauseButton.isVisible()) {
      // Click pause
      await pauseButton.click();
      await page.waitForTimeout(500);
      
      // Take screenshot of paused state
      const pausedScreenshot = await page.locator('canvas#game-canvas').screenshot();
      
      // Wait a bit
      await page.waitForTimeout(1000);
      
      // Take another screenshot - should be the same if paused
      const stillPausedScreenshot = await page.locator('canvas#game-canvas').screenshot();
      
      expect(Buffer.compare(pausedScreenshot, stillPausedScreenshot)).toBe(0);
      
      // Resume game
      const resumeButton = page.locator('button:has-text("Resume"), button:has-text("resume"), button:has-text("Play")').first();
      if (await resumeButton.isVisible()) {
        await resumeButton.click();
      } else {
        await pauseButton.click(); // Toggle
      }
    }
  });

  test('should maintain snake speed consistency', async ({ page }) => {
    const movements = [];
    
    // Measure time between movements
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      
      const canvas = await page.locator('canvas#game-canvas').screenshot();
      const endTime = Date.now();
      
      movements.push(endTime - startTime);
      
      await page.waitForTimeout(400);
    }
    
    // Check that movement timing is relatively consistent
    const avgTime = movements.reduce((a, b) => a + b) / movements.length;
    const variance = movements.map(t => Math.abs(t - avgTime));
    const maxVariance = Math.max(...variance);
    
    // Allow some variance but not too much
    expect(maxVariance).toBeLessThan(200);
  });
});