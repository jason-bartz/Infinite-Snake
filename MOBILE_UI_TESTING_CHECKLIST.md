# Mobile UI Testing Checklist

## Test Environment Setup
- [ ] Clear browser cache and local storage
- [ ] Test on actual mobile device (not just browser dev tools)
- [ ] Test in both portrait and landscape orientations
- [ ] Test on different screen sizes (phone and tablet)

## Critical Fixes to Verify

### 1. Boost Button Position
- [ ] Boost button appears on the RIGHT side (not left)
- [ ] Position is: bottom: 40px, right: 40px
- [ ] Button is circular with proper styling
- [ ] Button shows boost fill animation
- [ ] Button responds to touch/tap
- [ ] Button changes color when boost is low (<20%)

### 2. Panel Tab Visibility
- [ ] Player stats tab is visible on the RIGHT edge of left panel
- [ ] Leaderboard tab is visible on the LEFT edge of right panel
- [ ] Tabs show at position top: 10px from panel edge
- [ ] Stats tab shows player's snake skin icon
- [ ] Leaderboard tab shows trophy emoji (🏆)
- [ ] Tabs have proper SNES-style borders and shadows

### 3. Panel Functionality
- [ ] Tapping stats tab slides panel in/out from left
- [ ] Tapping leaderboard tab slides panel in/out from right
- [ ] Only one panel can be open at a time
- [ ] Tapping outside panels closes them
- [ ] Panel state persists in localStorage
- [ ] Smooth animation (0.3s ease-out)

### 4. Z-Index Hierarchy
- [ ] Game canvas: z-index 1
- [ ] Discovery feed: z-index 10
- [ ] Bottom UI: z-index 20
- [ ] Mobile controls: z-index 90
- [ ] Joystick/Boost: z-index 95
- [ ] Panels: z-index 100
- [ ] Tab handles: z-index 102
- [ ] Pause menu: z-index 9999-10000

### 5. No Conflicts or Errors
- [ ] No JavaScript console errors
- [ ] No duplicate event handlers
- [ ] Single mobile UI system (unifiedMobileUI)
- [ ] No CSS conflicts or overrides
- [ ] Proper initialization sequence

## Performance Checks
- [ ] Smooth panel animations
- [ ] No lag when tapping controls
- [ ] Touch events respond immediately
- [ ] No memory leaks from event handlers

## Edge Cases
- [ ] Orientation changes don't break UI
- [ ] Fast repeated taps handled correctly
- [ ] Panel state restored after page reload
- [ ] Works with different skins equipped
- [ ] Works during active gameplay

## Regression Tests
- [ ] Virtual joystick still works
- [ ] Pause/mute buttons still accessible
- [ ] Discovery feed displays properly
- [ ] Game performance not impacted
- [ ] Desktop mode unaffected

## Known Issues Fixed
- [x] Boost button on wrong side
- [x] Tabs not visible
- [x] Conflicting UI managers
- [x] Duplicate position declarations
- [x] Race conditions in initialization

## Test Results
Date: ___________
Tester: ___________
Device: ___________
OS: ___________
Browser: ___________

Notes:
_________________________________
_________________________________
_________________________________