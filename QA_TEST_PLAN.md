# Infinite Snake - Comprehensive QA Test Plan

## Test Environment Setup
- **Desktop Browser**: Chrome, Firefox, Safari (latest versions)
- **Mobile Devices**: iOS Safari, Android Chrome
- **Screen Resolutions**: 
  - Desktop: 1920x1080, 1366x768, 1280x1024
  - Mobile: 375x667 (iPhone SE), 414x896 (iPhone XR), 360x640 (Android)

## 1. DESKTOP TESTS

### Test Case 1.1: Classic Mode Death Count Verification
**Objective**: Verify player dies permanently on 4th death, not 3rd

**Pre-conditions**:
- Game loaded in desktop browser
- Classic mode selected

**Test Steps**:
1. Start new game in Classic mode
2. Play until snake dies (1st death)
3. Verify death count increments to 1
4. Verify revival is offered (3 revives remaining)
5. Revive and continue playing
6. Die again (2nd death)
7. Verify death count increments to 2
8. Verify revival is offered (2 revives remaining)
9. Revive and continue playing
10. Die again (3rd death)
11. Verify death count increments to 3
12. Verify revival is offered (1 revive remaining)
13. Revive and continue playing
14. Die again (4th death)
15. Verify death count increments to 4

**Expected Results**:
- Death count should increment properly: 1, 2, 3, 4
- Revives should count down: 3, 2, 1, 0
- Game should show permanent death screen ONLY on 4th death (deathCount >= 4)
- Code check at line 13755: `if (gameMode === 'classic' && deathCount >= 4)`

**Potential Issues Found**:
✅ Logic appears correct - death occurs on 4th death when deathCount >= 4

---

### Test Case 1.2: Game Over Screen Text Visibility
**Objective**: Verify all text on game over screen is readable

**Pre-conditions**:
- Game loaded in desktop browser
- Cosmic theme active (check CSS file loaded: game-over-visibility-fix.css)

**Test Steps**:
1. Play game until permanent death
2. Observe game over screen appearance
3. Check visibility of:
   - "GAME OVER" title
   - Player statistics (Score, Length, etc.)
   - Death message
   - Leaderboard rank message
   - Button text (Play Again, Main Menu)
   - Corner decorations

**Expected Results**:
- Main container should have cosmic purple gradient background (not dark blue)
- Stats containers should have semi-transparent cosmic blue/purple gradient
- Gray text should appear as bright cyan (--snes-cosmic-teal)
- All text should have proper contrast with text shadows
- CRT scanline effect should be at 0.3 opacity (not blocking text)
- Cosmic particle animation should be behind all text

**CSS Validation Points**:
- Line 6-10: Lighter purple gradient for main container
- Line 29-33: Cyan text color for better contrast
- Line 47-49: Reduced scanline opacity (0.3) with overlay blend mode

---

## 2. MOBILE TESTS

### Test Case 2.1: Player Stats Box Visibility
**Objective**: Verify player stats box is visible in top-left corner

**Pre-conditions**:
- Game loaded on mobile device
- Screen width <= 1024px (mobile breakpoint)

**Test Steps**:
1. Load game on mobile device
2. Observe top-left corner of screen
3. Check player stats box positioning
4. Verify all stats are readable:
   - Player portrait
   - Player name
   - Score
   - Length
   - Other stats

**Expected Results**:
- Stats box fixed at position: top: 10px, left: 10px
- Width: 140px (120px on screens < 360px)
- Background: rgba(16, 16, 64, 0.95)
- Border: 3px SNES-style with light blue highlight
- Font size: 6px for stats, 8px for name
- NO slide-out tab handle visible
- Box should NOT slide or move

**CSS Validation Points (mobile-ui-fixed.css)**:
- Line 10-12: Fixed positioning enforced
- Line 17-18: Width 140px, auto height
- Line 46-53: Tab handle forcefully hidden

---

### Test Case 2.2: Leaderboard Visibility
**Objective**: Verify leaderboard is visible in top-right corner with collapse functionality

**Pre-conditions**:
- Game loaded on mobile device
- Leaderboard data available

**Test Steps**:
1. Load game on mobile device
2. Observe top-right corner of screen
3. Verify leaderboard box is visible
4. Click/tap leaderboard header
5. Verify collapse animation works
6. Click/tap header again
7. Verify expand animation works
8. Check leaderboard entries are readable

**Expected Results**:
- Leaderboard fixed at position: top: 10px, right: 10px
- Width: 180px (150px on screens < 360px)
- Collapse functionality working (height: 30px when collapsed)
- Arrow indicator rotates when collapsed
- Background: rgba(248, 248, 248, 0.95)
- Entries font size: 7px
- Leader entry has gold background highlight

**CSS Validation Points**:
- Line 118-121: Fixed positioning enforced
- Line 157-160: Collapsed state height 30px
- Line 177-188: Collapse arrow animation

---

### Test Case 2.3: Boost Button Meter Visibility
**Objective**: Verify boost button shows boost amount with visual meter

**Pre-conditions**:
- Game loaded on mobile device
- Player has boost capability

**Test Steps**:
1. Load game on mobile device
2. Locate boost button (bottom-right)
3. Verify boost meter fill is visible
4. Use boost and observe meter depletion
5. Wait for boost to recharge
6. Observe meter refill animation
7. Let boost get low (<20%)
8. Verify low boost warning state

**Expected Results**:
- Boost button fixed at: bottom: 40px, right: 40px
- Size: 100px x 100px
- Meter fill gradient: cosmic teal to cosmic purple
- Fill height updates with CSS variable --boost-fill
- Low boost state: red border with pulse animation
- Text remains visible above meter fill
- Active state: 2px translate effect

**CSS Validation Points**:
- Line 306-320: Boost button positioning and styling
- Line 323-337: Meter fill implementation
- Line 349-352: Low boost warning state
- Line 361-370: Pulse animation for low boost

---

## 3. CROSS-PLATFORM TESTS

### Test Case 3.1: Responsive Behavior
**Objective**: Verify UI adapts properly across different screen sizes

**Test Steps**:
1. Load game on desktop (>1024px)
2. Resize browser window to tablet size (768-1024px)
3. Resize to mobile size (<768px)
4. Resize to very small mobile (<360px)
5. Check each breakpoint for proper UI scaling

**Expected Results**:
- Desktop: Full UI with original styling
- Tablet (768-1024px): Larger mobile UI elements
- Mobile (<768px): Standard mobile UI
- Small mobile (<360px): Compact mobile UI

---

## 4. IDENTIFIED ISSUES & RECOMMENDATIONS

### ✅ Desktop Classic Mode Death Count
**Status**: Working correctly
- Code shows proper logic: death on 4th death (deathCount >= 4)
- No changes needed

### ⚠️ Game Over Screen Visibility
**Status**: CSS fixes implemented, needs verification
- Ensure game-over-visibility-fix.css is loaded
- Test with different monitor brightness settings
- Verify cosmic theme doesn't conflict with other themes

### ⚠️ Mobile UI Elements
**Status**: Fixed positioning implemented, needs device testing
**Recommendations**:
1. Test on actual devices, not just browser dev tools
2. Verify touch interactions don't interfere with gameplay
3. Check z-index layering (UI should be above game but below modals)
4. Test landscape orientation handling

### Additional Testing Notes:
1. **Performance**: Monitor FPS on mobile during UI animations
2. **Battery**: Check if fixed positioning impacts battery life vs slide-out panels
3. **Accessibility**: Ensure UI elements meet minimum touch target sizes (44x44px)
4. **Network**: Test leaderboard updates on slow connections

---

## Test Execution Checklist

- [ ] Desktop - Classic mode 4th death verification
- [ ] Desktop - Game over screen all browsers
- [ ] Mobile - Player stats box visibility (iOS)
- [ ] Mobile - Player stats box visibility (Android)
- [ ] Mobile - Leaderboard visibility and collapse (iOS)
- [ ] Mobile - Leaderboard visibility and collapse (Android)
- [ ] Mobile - Boost button meter (iOS)
- [ ] Mobile - Boost button meter (Android)
- [ ] Cross-platform - Responsive breakpoints
- [ ] Performance - FPS monitoring
- [ ] Accessibility - Touch target verification

## Bug Report Template

**Title**: [Component] - Brief description
**Device**: Desktop/Mobile (specific device/browser)
**Steps to Reproduce**:
1. 
2. 
**Expected**: What should happen
**Actual**: What actually happened
**Screenshot**: (if applicable)
**Console Errors**: (if any)