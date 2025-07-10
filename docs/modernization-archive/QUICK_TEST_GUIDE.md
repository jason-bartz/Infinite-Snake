# Quick Test Guide for Modernized Infinite Snake

## Starting the Game

### 1. Start a Local Web Server
ES6 modules require a web server. Choose one method:

**Python 3:**
```bash
cd "/Users/jasonbartz/Documents/Development Projects/Infinite Snake"
python3 -m http.server 8000
```

**Node.js:**
```bash
cd "/Users/jasonbartz/Documents/Development Projects/Infinite Snake"
npx http-server -p 8000
```

**VS Code:**
- Install "Live Server" extension
- Right-click `index-clean.html` → "Open with Live Server"

### 2. Open in Browser
Go to: `http://localhost:8000/index-clean.html`

## Initial Checks

### Console (F12)
You should see:
- ✅ "Starting Infinite Snake Initialization"
- ✅ Module loading messages
- ✅ "Initialization Complete"
- ❌ No red errors

### Visual Check
- ✅ Main menu appears
- ✅ Background stars animating
- ✅ UI elements visible
- ✅ Game modes clickable

## Gameplay Test

### 1. Basic Controls
- **Arrow Keys** or **WASD**: Move snake
- **Shift**: Boost (when available)
- **Esc**: Pause
- **M**: Mute audio

### 2. Test Each Game Mode

#### Classic Mode
- [ ] 3 lives system works
- [ ] Snake respawns after death
- [ ] Game over after 3 deaths
- [ ] Score increases with elements

#### Infinite Mode
- [ ] No lives limit
- [ ] Immediate respawn
- [ ] Elements combine correctly
- [ ] Special items spawn (Alchemy Vision, etc.)

#### Speedrun Mode
- [ ] Timer starts and displays
- [ ] Timer stops at target score
- [ ] Leaderboard submission works

#### Peaceful Mode
- [ ] No AI snakes spawn
- [ ] Can collect elements freely
- [ ] No combat/death from enemies

### 3. Mobile Test (Responsive Mode)
- [ ] Mobile UI appears
- [ ] Virtual joystick works
- [ ] Boost button responsive
- [ ] UI panels visible/accessible

### 4. Performance Test
Press `Ctrl+Shift+P` for overlay:
- [ ] FPS stays above 30
- [ ] No memory leaks
- [ ] Quality auto-adjusts if needed

## Debug Features

### Keyboard Shortcuts
- `Ctrl+Shift+D`: Toggle debug mode
- `Ctrl+Shift+P`: Toggle performance overlay

### Debug Console Commands
```javascript
// Check module status
window.getModuleStatus()

// Check performance
window.performanceSystem.getReport()

// Check mobile UI
window.mobileUIManager.getStatus()

// Enable verbose logging
window.DEBUG_CONFIG.enabled = true
window.DEBUG_CONFIG.enableLogging = true
```

## Common Issues

### "Module not found" Errors
- Make sure you're using a web server
- Check file paths are correct
- Verify all files were created

### Game Won't Start
- Check console for initialization errors
- Ensure element loader completed
- Try hard refresh (Ctrl+F5)

### Performance Issues
- Enable performance overlay
- Check quality settings
- Look for console warnings

### Mobile UI Missing
- Check if mobile detection worked
- Try: `window.MobileUIManager.isMobile()`
- Force mobile UI: `window.mobileUIManager.init()`

## Verification Checklist

### Core Features
- [ ] Snake movement smooth
- [ ] Elements spawn correctly
- [ ] Combinations work
- [ ] Score tracking accurate
- [ ] Sound effects play
- [ ] Music plays

### Visual Effects
- [ ] Particle effects render
- [ ] Death animations work
- [ ] Glow effects (desktop)
- [ ] Background stars move
- [ ] UI animations smooth

### Special Items
- [ ] Alchemy Vision reveals recipes
- [ ] Void Orb creates black holes
- [ ] Catalyst Gem spawns elements
- [ ] Shooting stars appear
- [ ] Border particles animate

### Boss Fights
- [ ] Bosses spawn at correct scores
- [ ] Boss health bar appears
- [ ] Boss patterns work
- [ ] Victory unlocks skins
- [ ] Boss music plays

### Systems
- [ ] Save/load works
- [ ] Skins persist
- [ ] Settings save
- [ ] Leaderboard updates
- [ ] Stats track correctly

## Success Indicators

If everything works:
1. **No console errors**
2. **Smooth 30+ FPS**
3. **All features functional**
4. **Clean, modular code**
5. **Better performance than original**

## Next Steps

Once verified:
1. Rename `index-clean.html` to `index.html`
2. Keep `index-original-backup.html` as backup
3. Remove old/deprecated files:
   - Old mobile UI files
   - Old performance monitors
   - Emergency fix files
4. Deploy your modernized game!

## Rollback Plan

If issues occur:
1. Use `index-original-backup.html`
2. Check error messages
3. Review migration guides
4. Enable debug mode for details