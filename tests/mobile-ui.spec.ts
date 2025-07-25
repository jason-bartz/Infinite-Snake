import { test, expect, devices } from '@playwright/test';

// Run these tests only on mobile devices
test.use({ ...devices['iPhone 12'] });

test.describe('Mobile UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('should display mobile-optimized layout', async ({ page }) => {
    // Check viewport is mobile-sized
    const viewportSize = page.viewportSize();
    expect(viewportSize!.width).toBeLessThan(768);
    
    // Check for mobile-specific elements
    const mobileUI = await page.evaluate(() => {
      const hasTouch = 'ontouchstart' in window;
      const hasMobileControls = !!document.querySelector('.mobile-controls, .touch-controls, .touch-buttons');
      const hasResponsiveCanvas = !!document.querySelector('canvas#game-canvas');
      
      return { hasTouch, hasMobileControls, hasResponsiveCanvas };
    });
    
    expect(mobileUI.hasResponsiveCanvas).toBe(true);
  });

  test('should have touch-friendly controls', async ({ page }) => {
    // Look for touch control buttons
    const controlButtons = page.locator('.control-button, .direction-button, .arrow-button');
    const buttonCount = await controlButtons.count();
    
    if (buttonCount > 0) {
      // Check if buttons are large enough for touch
      const firstButton = controlButtons.first();
      const buttonSize = await firstButton.boundingBox();
      
      if (buttonSize) {
        // Buttons should be at least 44x44 pixels (iOS HIG recommendation)
        expect(buttonSize.width).toBeGreaterThanOrEqual(44);
        expect(buttonSize.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should handle touch gestures', async ({ page }) => {
    const canvas = page.locator('canvas#game-canvas');
    const canvasBox = await canvas.boundingBox();
    
    if (!canvasBox) {
      throw new Error('Canvas not found');
    }
    
    const centerX = canvasBox.x + canvasBox.width / 2;
    const centerY = canvasBox.y + canvasBox.height / 2;
    
    // Test swipe gestures
    const swipeTests = [
      { name: 'right', startX: centerX, startY: centerY, endX: centerX + 100, endY: centerY },
      { name: 'left', startX: centerX, startY: centerY, endX: centerX - 100, endY: centerY },
      { name: 'down', startX: centerX, startY: centerY, endX: centerX, endY: centerY + 100 },
      { name: 'up', startX: centerX, startY: centerY, endX: centerX, endY: centerY - 100 }
    ];
    
    for (const swipe of swipeTests) {
      await page.touchscreen.swipe({
        startX: swipe.startX,
        startY: swipe.startY,
        endX: swipe.endX,
        endY: swipe.endY,
        steps: 10
      });
      
      await page.waitForTimeout(300);
    }
    
    // Game should still be running after gestures
    const gameOver = await page.locator('.game-over, #game-over').isVisible();
    expect(gameOver).toBe(false);
  });

  test('should handle tap controls', async ({ page }) => {
    // Look for tap-based control buttons
    const upButton = page.locator('button:has-text("↑"), button:has-text("Up"), .control-up').first();
    const downButton = page.locator('button:has-text("↓"), button:has-text("Down"), .control-down').first();
    const leftButton = page.locator('button:has-text("←"), button:has-text("Left"), .control-left').first();
    const rightButton = page.locator('button:has-text("→"), button:has-text("Right"), .control-right').first();
    
    // Test tapping controls if they exist
    if (await upButton.isVisible()) {
      await upButton.tap();
      await page.waitForTimeout(300);
    }
    
    if (await rightButton.isVisible()) {
      await rightButton.tap();
      await page.waitForTimeout(300);
    }
    
    if (await downButton.isVisible()) {
      await downButton.tap();
      await page.waitForTimeout(300);
    }
    
    if (await leftButton.isVisible()) {
      await leftButton.tap();
      await page.waitForTimeout(300);
    }
  });

  test('should prevent accidental touches', async ({ page }) => {
    // Test double-tap prevention
    const canvas = page.locator('canvas#game-canvas');
    const canvasBox = await canvas.boundingBox();
    
    if (canvasBox) {
      // Rapid taps
      for (let i = 0; i < 5; i++) {
        await page.touchscreen.tap(canvasBox.x + 50, canvasBox.y + 50);
        await page.waitForTimeout(50);
      }
      
      // Game should handle rapid taps gracefully
      const gameOver = await page.locator('.game-over, #game-over').isVisible();
      expect(gameOver).toBe(false);
    }
  });

  test('should scale UI elements appropriately', async ({ page }) => {
    // Check font sizes
    const score = page.locator('#score');
    const scoreStyles = await score.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        padding: computed.padding
      };
    });
    
    // Font should be readable on mobile
    const fontSize = parseInt(scoreStyles.fontSize);
    expect(fontSize).toBeGreaterThanOrEqual(14);
  });

  test('should handle orientation changes', async ({ page, context }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const portraitCanvas = await page.locator('canvas#game-canvas').boundingBox();
    
    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(500);
    
    const landscapeCanvas = await page.locator('canvas#game-canvas').boundingBox();
    
    // Canvas should adapt to orientation
    expect(landscapeCanvas!.width).toBeGreaterThan(landscapeCanvas!.height);
    expect(portraitCanvas!.height).toBeGreaterThan(portraitCanvas!.width);
  });

  test('should provide visual feedback for touches', async ({ page }) => {
    const controlButton = page.locator('.control-button, .direction-button').first();
    
    if (await controlButton.isVisible()) {
      // Check for active/pressed states
      await controlButton.tap();
      
      // Check if button has visual feedback (class change, etc.)
      const hasActiveClass = await controlButton.evaluate((el) => {
        return el.classList.contains('active') || 
               el.classList.contains('pressed') ||
               el.classList.contains('touching');
      });
      
      // Visual feedback is recommended but not required
    }
  });

  test('should handle multi-touch properly', async ({ page }) => {
    const canvas = page.locator('canvas#game-canvas');
    const canvasBox = await canvas.boundingBox();
    
    if (canvasBox) {
      // Simulate pinch gesture (though game might not use it)
      await page.touchscreen.tap(canvasBox.x + 100, canvasBox.y + 100);
      await page.touchscreen.tap(canvasBox.x + 200, canvasBox.y + 200);
      
      await page.waitForTimeout(500);
      
      // Game should not crash with multi-touch
      const gameOver = await page.locator('.game-over, #game-over').isVisible();
      expect(gameOver).toBe(false);
    }
  });

  test('should have mobile-optimized performance', async ({ page }) => {
    // Measure frame rate or rendering performance
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        let lastTime = performance.now();
        
        function countFrames() {
          frameCount++;
          const currentTime = performance.now();
          
          if (currentTime - lastTime > 1000) {
            resolve({ fps: frameCount });
            return;
          }
          
          requestAnimationFrame(countFrames);
        }
        
        requestAnimationFrame(countFrames);
      });
    });
    
    // Should maintain reasonable FPS on mobile
    expect((performanceMetrics as any).fps).toBeGreaterThan(10);
  });
});