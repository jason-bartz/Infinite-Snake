# Discord Skin Unlock System

## Overview
This system allows players to unlock an exclusive "Discord Elite" skin by redeeming special codes that are distributed in the Discord server.

## How It Works

### For Players:
1. Join the Discord server
2. Receive a code (e.g., `DISCORD-2025-JMQZ`)
3. Open the game and pause (press P)
4. Go to Settings tab
5. Enter the code and click Redeem
6. The Discord Elite skin will be unlocked!

### For Admins:

#### Generating New Codes:
```bash
cd "Infinite Snake"
node admin-tools/generate-codes.js 20 batch-name
```

This creates:
- Plain text file with codes (share these in Discord)
- JSON file with full details (keep for records)
- JS file with hashes (add to codeValidator.js)

#### Initial Codes Generated:
20 codes have been generated and are ready to use:
- DISCORD-2025-JMQZ
- DISCORD-2025-IYTM
- DISCORD-2025-F123
- DISCORD-2025-9R4F
- DISCORD-2025-UOFM
- ... and 15 more

See `admin-tools/generated-codes/discord-codes-initial-*.txt` for the full list.

## Implementation Details

### Files Modified:
1. **skinData.js** - Added Discord Elite skin definition
2. **codeValidator.js** - Handles code validation with hashed codes
3. **unlockManager.js** - Added support for 'code' unlock type
4. **index.html** - Added Settings tab to pause menu
5. **game-original.js** - Added redeemCode() and switchTab() functions
6. **skinIdMapping.js** - Added discord-elite mapping

### Security:
- Codes are validated using hashed values (not stored in plain text)
- Each code can only be redeemed once per browser
- Redemptions are tracked in localStorage

## TODO:
- [ ] Add discord-elite.png skin image (currently using placeholder)
- [ ] Update Discord invite link in Settings tab
- [ ] Consider adding analytics for code redemptions

## Code Format:
- Pattern: `DISCORD-YYYY-XXXX`
- YYYY: Year (e.g., 2025)
- XXXX: Random 4-character alphanumeric suffix

## Admin Commands:
```bash
# Generate 50 new codes
node admin-tools/generate-codes.js 50 summer-batch

# Generate 100 codes with custom prefix (future use)
# Would need to modify the script for custom prefixes
```