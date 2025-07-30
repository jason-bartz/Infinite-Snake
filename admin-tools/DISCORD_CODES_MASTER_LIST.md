# Discord Codes Master List

## Overview
This document contains the complete mapping of Discord codes to skins. Each code unlocks a specific skin, allowing us to distribute all 58 skins in the game through Discord codes.

**Important**: While we advertise only "Scarabyte" skin for Discord codes, each code actually unlocks a different skin!

## Code Format
All codes follow the pattern: `DISCORD-2025-XXXX` where XXXX is a 4-character alphanumeric suffix.

## Complete Code-to-Skin Mapping

### Original Batch (20 codes)
1. `DISCORD-2025-JMQZ` → **Scarabyte** (discord-elite) - *The advertised skin*
2. `DISCORD-2025-IYTM` → **Hot Head** (hot-head)
3. `DISCORD-2025-F123` → **Good Boy** (good-boy)
4. `DISCORD-2025-9R4F` → **Lil' Beans** (lil-beans)
5. `DISCORD-2025-UOFM` → **Spout** (spout)
6. `DISCORD-2025-SLTY` → **Ansel 35** (ansel-35)
7. `DISCORD-2025-JJQS` → **Time Out** (time-out)
8. `DISCORD-2025-FNR3` → **Boat McBoatface** (boat-mcboatface)
9. `DISCORD-2025-EE20` → **Speed Demon Jr.** (speed-demon-jr)
10. `DISCORD-2025-8U8D` → **Speed Demon** (speed-demon)
11. `DISCORD-2025-LLYD` → **World Traveler** (world-traveler)
12. `DISCORD-2025-H4T2` → **Bo Kay** (bo-kay)
13. `DISCORD-2025-F4JY` → **The Special** (the-special)
14. `DISCORD-2025-2AC7` → **Ruby** (ruby)
15. `DISCORD-2025-3CI2` → **Chirpy** (chirpy)
16. `DISCORD-2025-24YP` → **Poddington** (poddington)
17. `DISCORD-2025-TSHH` → **CRT Surfer** (crt-surfer)
18. `DISCORD-2025-TB66` → **'Murica** (murica)
19. `DISCORD-2025-MSR7` → **Whirlwind** (whirlwind)
20. `DISCORD-2025-CATD` → **MVP** (mvp)

### New Batch (38 codes)
21. `DISCORD-2025-CS2Z` → **Margot** (margot)
22. `DISCORD-2025-YC1B` → **Caffeine Fiend** (caffeine-fiend)
23. `DISCORD-2025-JKD8` → **Cola Crusader** (cola-crusader)
24. `DISCORD-2025-XZCP` → **Sir Dips-a-Lot** (sir-dips-a-lot)
25. `DISCORD-2025-2J1P` → **Sir Whirl** (sir-whirl)
26. `DISCORD-2025-T6WS` → **Colonel Kernel** (colonel-kernel)
27. `DISCORD-2025-KICS` → **Scuffy** (scuffy)
28. `DISCORD-2025-LQTA` → **The Resistance** (the-resistance)
29. `DISCORD-2025-5CTH` → **World Muncher** (world-muncher)
30. `DISCORD-2025-WQJ3` → **Ralph** (ralph)
31. `DISCORD-2025-Q07Y` → **Ice Dragon** (ice-dragon)
32. `DISCORD-2025-E2XS` → **Spud Bud** (spud-bud)
33. `DISCORD-2025-335Z` → **Big Dawg** (big-dawg)
34. `DISCORD-2025-MJ48` → **Tony Pep** (tony-pep)
35. `DISCORD-2025-QCSF` → **Sprinkles** (sprinkles)
36. `DISCORD-2025-KF0T` → **Noodle Master** (noodle-master)
37. `DISCORD-2025-82OB` → **Little Bro** (little-bro)
38. `DISCORD-2025-IUYR` → **Mr. Swirley** (mr-swirley)
39. `DISCORD-2025-4H8Q` → **Franklin** (franklin)
40. `DISCORD-2025-CG5B` → **Ring Leader** (ring-leader)
41. `DISCORD-2025-JH6Z` → **Cosmic Ray** (cosmic-ray)
42. `DISCORD-2025-TCQ1` → **Billy Blue** (billy-blue)
43. `DISCORD-2025-JH9A` → **Metal Boi** (metal-boi)
44. `DISCORD-2025-X5Z5` → **Ho Ho Hose** (ho-ho-hose)
45. `DISCORD-2025-RZNN` → **Pixel** (pixel)
46. `DISCORD-2025-QENO` → **Woz** (woz)
47. `DISCORD-2025-UI26` → **The Pocketeer** (the-pocketeer)
48. `DISCORD-2025-Y8S0` → **Tres Commas** (tres-commas)
49. `DISCORD-2025-5ZC6` → **Pastry Cat** (pastry-cat)
50. `DISCORD-2025-5TZ7` → **Snappy** (snappy)
51. `DISCORD-2025-S8VK` → **Eldritch Horror** (eldritch-horror)
52. `DISCORD-2025-PDW3` → **Midnight** (midnight)
53. `DISCORD-2025-VWUR` → **Gilly** (gilly)
54. `DISCORD-2025-CLBN` → **Abyssos** (abyssos)
55. `DISCORD-2025-PIGJ` → **Osseus** (osseus)
56. `DISCORD-2025-MFJR` → **Pyraxis** (pyraxis)
57. `DISCORD-2025-7ZFB` → **Zephyrus** (zephyrus)
58. `DISCORD-2025-ZRVH` → **Snake Default Green** (snake-default-green)

## Distribution Strategy
- Advertise codes as unlocking "Scarabyte" skin only
- Players will discover they actually get different skins
- Creates a treasure hunt/trading dynamic in the community
- Encourages code sharing and community interaction

## Adding New Skins
When new skins are added to the game:
1. Run `node admin-tools/generate-codes.js [number]` to generate new codes
2. Add the new code-to-skin mappings to `codeValidator.js`
3. Update this master list
4. Distribute new codes through Discord events

## Security Note
The codes are validated using hashes, not the plaintext codes. This prevents players from guessing codes by looking at the source code.