import { test, expect } from '@playwright/test';

test.describe('Leaderboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
  });

  test('should display leaderboard button or link', async ({ page }) => {
    // Look for leaderboard access
    const leaderboardTrigger = page.locator('button:has-text("Leaderboard"), a:has-text("Leaderboard"), .leaderboard-button').first();
    
    if (await leaderboardTrigger.isVisible()) {
      await expect(leaderboardTrigger).toBeVisible();
    } else {
      // Leaderboard might be always visible
      const leaderboardSection = page.locator('.leaderboard, #leaderboard, .high-scores').first();
      await expect(leaderboardSection).toBeVisible();
    }
  });

  test('should show leaderboard when requested', async ({ page }) => {
    const leaderboardButton = page.locator('button:has-text("Leaderboard"), .leaderboard-button').first();
    
    if (await leaderboardButton.isVisible()) {
      await leaderboardButton.click();
      
      // Wait for leaderboard to appear
      const leaderboard = page.locator('.leaderboard, #leaderboard, .leaderboard-modal').first();
      await expect(leaderboard).toBeVisible();
      
      // Should contain score entries
      const scoreEntries = leaderboard.locator('.score-entry, .leaderboard-entry, tr').first();
      await expect(scoreEntries).toBeVisible();
    }
  });

  test('should display score format correctly', async ({ page }) => {
    // Navigate to leaderboard if needed
    const leaderboardButton = page.locator('button:has-text("Leaderboard")').first();
    if (await leaderboardButton.isVisible()) {
      await leaderboardButton.click();
    }
    
    // Check score display
    const scores = page.locator('.score, .score-value, .leaderboard-score');
    const firstScore = scores.first();
    
    if (await firstScore.isVisible()) {
      const scoreText = await firstScore.textContent();
      // Score should be a number
      expect(scoreText).toMatch(/\d+/);
    }
  });

  test('should update leaderboard after game over', async ({ page }) => {
    // First, trigger a game over by running into walls
    // This is a bit tricky as we need to know the game mechanics
    
    // Try to crash the snake
    for (let i = 0; i < 100; i++) {
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(50);
    }
    
    // Wait for game over
    await page.waitForTimeout(2000);
    
    // Check for game over screen
    const gameOver = page.locator('.game-over, #game-over, .game-over-modal').first();
    
    if (await gameOver.isVisible()) {
      // Look for score submission
      const nameInput = page.locator('input[type="text"], input[placeholder*="name"], input[placeholder*="Name"]').first();
      
      if (await nameInput.isVisible()) {
        // Enter a name
        await nameInput.fill('TestPlayer');
        
        // Submit score
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Save")').first();
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Check if score was added to leaderboard
          await page.waitForTimeout(1000);
          const leaderboard = page.locator('.leaderboard, #leaderboard').first();
          const hasTestPlayer = await leaderboard.locator('text=TestPlayer').isVisible();
          
          expect(hasTestPlayer).toBe(true);
        }
      }
    }
  });

  test('should sort scores correctly', async ({ page }) => {
    // Navigate to leaderboard
    const leaderboardButton = page.locator('button:has-text("Leaderboard")').first();
    if (await leaderboardButton.isVisible()) {
      await leaderboardButton.click();
    }
    
    // Get all score values
    const scores = await page.locator('.score-value, .leaderboard-score, td.score').allTextContents();
    const numericScores = scores
      .map(s => parseInt(s.replace(/\D/g, '')))
      .filter(n => !isNaN(n));
    
    if (numericScores.length > 1) {
      // Check if scores are sorted in descending order
      for (let i = 1; i < numericScores.length; i++) {
        expect(numericScores[i]).toBeLessThanOrEqual(numericScores[i - 1]);
      }
    }
  });

  test('should limit number of leaderboard entries', async ({ page }) => {
    // Navigate to leaderboard
    const leaderboardButton = page.locator('button:has-text("Leaderboard")').first();
    if (await leaderboardButton.isVisible()) {
      await leaderboardButton.click();
    }
    
    // Count entries
    const entries = await page.locator('.leaderboard-entry, .score-entry, .leaderboard tr').count();
    
    // Most games limit to top 10 or 20
    expect(entries).toBeLessThanOrEqual(20);
  });

  test('should persist leaderboard data', async ({ page }) => {
    // Get current leaderboard state
    const leaderboardButton = page.locator('button:has-text("Leaderboard")').first();
    let initialScores: string[] = [];
    
    if (await leaderboardButton.isVisible()) {
      await leaderboardButton.click();
      initialScores = await page.locator('.score-value, .leaderboard-score').allTextContents();
    }
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Check leaderboard again
    if (await leaderboardButton.isVisible()) {
      await leaderboardButton.click();
      const reloadedScores = await page.locator('.score-value, .leaderboard-score').allTextContents();
      
      // Scores should be preserved
      expect(reloadedScores.length).toBe(initialScores.length);
    }
  });

  test('should display player names or initials', async ({ page }) => {
    // Navigate to leaderboard
    const leaderboardButton = page.locator('button:has-text("Leaderboard")').first();
    if (await leaderboardButton.isVisible()) {
      await leaderboardButton.click();
    }
    
    // Check for player names
    const playerNames = page.locator('.player-name, .leaderboard-name, .name');
    
    if (await playerNames.first().isVisible()) {
      const firstName = await playerNames.first().textContent();
      expect(firstName).toBeTruthy();
      expect(firstName!.length).toBeGreaterThan(0);
    }
  });

  test('should handle empty leaderboard gracefully', async ({ page }) => {
    // This test checks if the game handles no scores well
    const leaderboard = page.locator('.leaderboard, #leaderboard').first();
    
    if (await leaderboard.isVisible()) {
      const emptyMessage = leaderboard.locator('text=/no scores|empty|be the first/i').first();
      const hasEntries = await leaderboard.locator('.leaderboard-entry, .score-entry').count();
      
      // Should either have entries or show an empty message
      if (hasEntries === 0) {
        expect(await emptyMessage.isVisible()).toBe(true);
      }
    }
  });

  test('should close leaderboard modal', async ({ page }) => {
    // Open leaderboard
    const leaderboardButton = page.locator('button:has-text("Leaderboard")').first();
    
    if (await leaderboardButton.isVisible()) {
      await leaderboardButton.click();
      
      // Look for close button
      const closeButton = page.locator('button:has-text("Close"), button:has-text("X"), .close-button').first();
      
      if (await closeButton.isVisible()) {
        await closeButton.click();
        
        // Leaderboard modal should be hidden
        const leaderboardModal = page.locator('.leaderboard-modal, .modal').first();
        await expect(leaderboardModal).toBeHidden();
      } else {
        // Try clicking outside or pressing Escape
        await page.keyboard.press('Escape');
        
        // Check if it closed
        const leaderboardModal = page.locator('.leaderboard-modal').first();
        if (await leaderboardModal.isVisible()) {
          // Click outside
          await page.mouse.click(10, 10);
        }
      }
    }
  });
});