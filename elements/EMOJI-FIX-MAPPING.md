# Emoji Fix Mapping

## Current Issues Found

### Incorrect Emoji Mappings:
1. **Mud** (element ID: 6) 
   - Currently: emoji_id 6 → 🌫️ (fog)
   - Should be: emoji_id 5 → 🟫 (brown square)

2. **Lava** (element ID: 8)
   - Currently: emoji_id 8 → 🌧️ (rain)  
   - Should be: emoji_id 7 → 🌋 (volcano)

3. **Stone** (element ID: 15)
   - Currently: emoji_id 14 → 🏜️ (desert)
   - Should be: emoji_id 20 → 🪨 (rock)

4. **Rain** (element ID: 9)
   - Currently: emoji_id 9 → ⚫ (black circle)
   - Should be: emoji_id 8 → 🌧️ (rain)

5. **Smoke** (element ID: 10)
   - Currently: emoji_id 10 → 🟤 (brown circle)
   - Should be: emoji_id 6 → 🌫️ (fog/smoke)

## Correct Base Element Mappings

### Tier 0 (Primordial)
- Fire (1) → 🔥 (emoji_id: 1) ✓ Correct
- Water (2) → 💧 (emoji_id: 2) ✓ Correct  
- Earth (3) → 🌍 (emoji_id: 3) ✓ Correct
- Air (4) → 💨 (emoji_id: 4) ✓ Correct

### Tier 1 (Basic Natural) - Need Fixes
- Steam (5) → Should be 💨 or ♨️ (hot springs steam)
- Mud (6) → Should be 🟫 (brown square)
- Dust (7) → Should be 🌫️ or 💨
- Lava (8) → Should be 🌋 (volcano)
- Rain (9) → Should be 🌧️
- Smoke (10) → Should be 🌫️
- Ice (11) → Should be ❄️ (emoji_id: 12)
- Snow (12) → Should be 🌨️ or ❄️
- Lightning (13) → Should be ⚡ (emoji_id: 28)
- Wind (14) → Should be 💨 or 🌬️
- Stone (15) → Should be 🪨 (emoji_id: 20)
- Sand (16) → Should be 🏖️ (emoji_id: 21)

## Implementation Strategy

1. Create a mapping correction file
2. Update all element definitions with correct emoji IDs
3. Verify each element displays correctly
4. Test in game