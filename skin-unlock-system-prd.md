# Infinite Snake - Skin Unlock System Product Requirements Document

## Executive Summary

This document outlines the requirements for implementing a comprehensive skin unlock system in Infinite Snake. The system will replace the current "available unlocks" mechanism with a tiered rarity system featuring 48 total skins across 6 rarity tiers, each with specific unlock criteria designed to increase player engagement and retention.

## Product Overview

### Vision
Create a rewarding progression system that encourages diverse playstyles and provides both short-term and long-term goals for players while maintaining the game's arcade aesthetic.

### Goals
1. **Increase Player Retention**: Provide clear progression goals that keep players engaged
2. **Reward Diverse Playstyles**: Unlock criteria that cater to different player preferences
3. **Create Collection Desire**: Tiered rarity system that motivates completionism
4. **Enhance Visual Variety**: 48 unique skins to personalize the player experience
5. **Maintain Mystery**: Boss skins hidden until defeated, creating discovery moments

## User Stories & Acceptance Criteria

### Epic 1: Rarity-Based Skin Organization

**User Story 1.1**: As a player, I want to browse skins by rarity tier so I can easily find skins of similar value.

**Acceptance Criteria**:
- [ ] 6 rarity tabs displayed: Common, Uncommon, Rare, Legendary, Exotic, Secret
- [ ] Each tab shows only skins from that tier
- [ ] Visual distinction between rarities (colors, effects)
- [ ] Smooth tab switching with < 100ms response time
- [ ] Active tab clearly highlighted

**User Story 1.2**: As a player, I want to see my overall collection progress so I know how many skins I've unlocked.

**Acceptance Criteria**:
- [ ] Progress counter shows X/48 skins unlocked
- [ ] Counter updates immediately upon unlock
- [ ] Progress persists across sessions
- [ ] Visual celebration at milestone unlocks (25%, 50%, 75%, 100%)

### Epic 2: Unlock Criteria & Tracking

**User Story 2.1**: As a player, I want to unlock skins through various achievements so I have diverse goals to pursue.

**Acceptance Criteria**:
- [ ] All 48 skins have specific unlock criteria implemented
- [ ] Progress tracked accurately across sessions
- [ ] Real-time unlock notifications
- [ ] Unlock criteria clearly displayed for locked skins
- [ ] Multiple unlock types supported:
  - Score thresholds (single game)
  - Cumulative lifetime score
  - Element discoveries
  - Kill counts
  - Play time
  - Days played
  - Power-up consumption
  - Boss defeats
  - Special achievements

**User Story 2.2**: As a player, I want my progress to persist so I don't lose achievements between sessions.

**Acceptance Criteria**:
- [ ] All tracking metrics saved to localStorage
- [ ] Progress survives browser refresh
- [ ] Backwards compatible with existing save data
- [ ] Corruption recovery mechanism
- [ ] Export/import capability for progress backup

### Epic 3: Skin Preview Modal

**User Story 3.1**: As a player, I want to preview skins before equipping them so I can make informed choices.

**Acceptance Criteria**:
- [ ] Modal shows animated skin preview
- [ ] Skin name and rarity displayed
- [ ] Bio/description text for each skin
- [ ] Equip button for unlocked skins
- [ ] Lock indicator for locked skins
- [ ] Unlock criteria shown for locked skins
- [ ] Smooth open/close animations
- [ ] Keyboard accessible (Tab, Enter, Escape)

**User Story 3.2**: As a player, I want special effects for rare skins so they feel more valuable.

**Acceptance Criteria**:
- [ ] Particle effects for Legendary/Exotic/Secret skins
- [ ] Unique animations for different rarities
- [ ] Audio feedback matching rarity tier
- [ ] Visual effects don't impact performance

### Epic 4: Boss Skin Mystery

**User Story 4.1**: As a player, I want boss skins to remain mysterious until defeated so I have surprises to discover.

**Acceptance Criteria**:
- [ ] Boss skins show as "❓" when locked
- [ ] Name hidden until unlocked
- [ ] Bio reveals after defeat
- [ ] Special unlock animation for boss defeats
- [ ] Boss defeat tracked persistently

### Epic 5: Mobile Compatibility

**User Story 5.1**: As a mobile player, I want the skin system to work well on my device so I have the same experience as desktop.

**Acceptance Criteria**:
- [ ] Touch-friendly UI elements (44px minimum)
- [ ] Responsive grid layout
- [ ] Smooth scrolling in skin grid
- [ ] Modal fits mobile viewport
- [ ] Performance optimized for mobile
- [ ] Swipe gestures for tab navigation

## Data Model Requirements

### Player Statistics Schema
```javascript
{
  // Core Metrics
  "highScore": number,              // Highest single game score
  "totalScore": number,             // Cumulative lifetime score
  "gamesPlayed": number,            // Total games played
  
  // Combat Metrics
  "totalKills": number,             // Enemy snakes eliminated
  "bossesDefeated": Set<string>,   // Boss IDs defeated
  
  // Time Metrics
  "totalPlayTime": number,          // Milliseconds played
  "daysPlayed": Set<string>,        // Unique days (ISO date strings)
  "firstPlayDate": string,          // ISO date of first play
  "lastPlayDate": string,           // ISO date of last play
  
  // Discovery Metrics
  "elementsDiscovered": number,     // Total unique elements found
  "totalCombinations": number,      // Total combinations made
  
  // Power-up Metrics
  "voidOrbsEaten": number,         // Total void orbs consumed
  "catalystGemsEaten": number,     // Total catalyst gems used
  "alchemyVisionsEaten": number,   // Total alchemy visions collected
  
  // Session Metrics
  "currentStreak": number,          // Current daily play streak
  "longestStreak": number,          // Longest daily play streak
  
  // Skin Metrics
  "skinsUnlocked": Set<string>,     // Unlocked skin IDs
  "skinUnlockDates": Map<string, string>, // Skin ID -> unlock date
  "favoritesSkins": Array<string>,  // Most used skins
  "currentSkin": string             // Currently equipped skin
}
```

### Skin Unlock Requirements
```javascript
{
  "skinId": {
    "tier": "common|uncommon|rare|legendary|exotic|secret",
    "name": "Display Name",
    "bio": "Skin description",
    "unlockType": "score|discovery|kills|time|days|powerups|boss|special",
    "unlockValue": number|string,
    "unlockDescription": "Human-readable requirement",
    "isHidden": boolean,  // For secret skins
    "isBoss": boolean     // For boss skins
  }
}
```

### Complete Unlock Criteria List

#### Common Tier (12 skins)
1. **Flame** - Score 10,000 points
2. **Dog** - Play 5 games
3. **Neko** - Discover 10 elements
4. **Whale** - Eat 50 total food items
5. **35mm** - Play for 15 minutes total
6. **Clock** - Play on 2 different days
7. **Boat McBoatface** - Travel 10,000 units total
8. **Kid Car** - Reach 10 boost streaks
9. **Racer** - Use boost 50 times
10. **Gnome** - Visit all 4 map corners in one game
11. **Floral** - Collect 5 different power-ups
12. **Brick Man** - Build a snake of 50 segments

#### Uncommon Tier (9 skins)
1. **Pod Player** - Score 50,000 points
2. **TV** - Play for 1 hour total
3. **'Murica** - Play on July 4th
4. **Buffalo** - Get 25 kills
5. **Football** - Score exactly 7 touchdowns (7,000 points)
6. **Barbi** - Discover 50 elements
7. **Coffee** - Play before 9 AM local time
8. **Diet Cola** - Eat 25 Catalyst Gems
9. **Fries** - Chain 3 kills in 10 seconds

#### Rare Tier (10 skins)
1. **Camera Guy** - Discover 100 elements
2. **Green Dragon** - Score 100,000 points
3. **Red Dragon** - Get 50 kills
4. **Ice Dragon** - Survive 10 minutes in one game
5. **Potato** - Play on 7 different days
6. **Hotdog** - Eat 100 total food items
7. **Pizza** - Score 8 slices (80,000 points)
8. **Donut** - Complete a full circle path
9. **Ramen** - Play for 3 hours total
10. **Controller** - Play 50 games

#### Legendary Tier (6 skins)
1. **Mac** - Score 500,000 points
2. **Handheld Game** - Play on mobile device
3. **Unicorn** - Score 1,000,000 points
4. **Nyan** - Discover 250 elements
5. **Infinity Glove** - Collect all 6 infinity stones in one game
6. **Lovecraft** - Discover the "Eldritch Horror" element

#### Exotic Tier (7 skins)
1. **Saturn** - Play for 24 hours total
2. **Space Cadet** - Reach space altitude (high score)
3. **Tornado** - Spin 720 degrees in 2 seconds
4. **Robot** - Get 100 kills
5. **Santa** - Play during December holidays
6. **Skibidi** - Complete the Skibidi dance pattern
7. **Frank** - Discover "Frankenstein" element

#### Secret Tier (8 skins)
1. **Pyraxis** - Defeat Pyraxis the Molten
2. **Abyssos** - Defeat Abyssos the Depths
3. **Osseus** - Defeat Osseus the Eternal
4. **Zephyrus** - Defeat Zephyrus the Tempest
5. **???** - Complete all other unlocks
6. **???** - Score 10,000,000 points
7. **???** - Play for 365 days
8. **???** - Hidden achievement

## Tracking System Requirements

### Real-time Tracking
- Track all metrics during gameplay without performance impact
- Update localStorage every 30 seconds (batched)
- Immediate save on game end or tab close

### Event Tracking
```javascript
// Track these events
- GAME_START
- GAME_END (with final stats)
- ELEMENT_DISCOVERED
- ENEMY_KILLED
- POWERUP_COLLECTED
- BOSS_SPAWNED
- BOSS_DEFEATED
- ACHIEVEMENT_UNLOCKED
- SKIN_UNLOCKED
- SKIN_EQUIPPED
```

### Performance Requirements
- Tracking overhead < 1% CPU usage
- localStorage writes < 50ms
- No frame drops during tracking
- Graceful degradation if storage full

## Migration Plan

### Phase 1: Data Migration (Week 1)
1. Audit existing player data
2. Create migration script for:
   - Current high scores
   - Discovered elements
   - Unlocked skins
   - Play statistics
3. Test migration on sample data
4. Add backwards compatibility layer

### Phase 2: System Implementation (Week 2-3)
1. Implement tracking system
2. Add new UI components
3. Wire up unlock logic
4. Test all unlock criteria

### Phase 3: Testing & Polish (Week 4)
1. QA testing all unlock paths
2. Performance optimization
3. Mobile testing
4. User acceptance testing

### Rollback Plan
- Feature flag for new system
- Parallel run with old system for 1 week
- Automated backup before migration
- One-click rollback capability

## Success Metrics

### Key Performance Indicators (KPIs)
1. **Retention Rate**: 20% increase in D7 retention
2. **Session Length**: 15% increase in average session time
3. **Skin Usage**: 80% of active players use non-default skin
4. **Completion Rate**: 30% of players unlock 10+ skins
5. **Engagement**: 25% increase in daily active users

### Tracking Metrics
- Daily/Weekly/Monthly active users
- Average skins unlocked per player
- Most/least popular skins
- Time to first unlock
- Unlock funnel conversion rates
- Player segmentation by unlock progress

## Risk Assessment

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|---------|-------------|------------|
| localStorage corruption | High | Low | Regular backups, validation |
| Performance degradation | Medium | Medium | Profiling, lazy loading |
| Browser compatibility | Low | Low | Feature detection, polyfills |
| Mobile performance | Medium | Medium | Optimized assets, testing |

### Product Risks
| Risk | Impact | Probability | Mitigation |
|------|---------|-------------|------------|
| Unlock criteria too hard | High | Medium | Telemetry, quick adjustments |
| Player confusion | Medium | Low | Clear UI, onboarding |
| Reduced engagement | High | Low | A/B testing, gradual rollout |
| Server tracking costs | Low | Low | Client-side only initially |

### Mitigation Strategies
1. **Gradual Rollout**: 10% -> 50% -> 100% over 2 weeks
2. **Feature Flags**: Easy disable without deployment
3. **Telemetry**: Real-time monitoring of unlock rates
4. **Feedback Loop**: In-game feedback mechanism
5. **Hotfix Process**: Same-day balance adjustments

## Technical Dependencies

### Required Systems
1. **localStorage**: Primary storage mechanism
2. **Canvas API**: Skin preview rendering
3. **Web Workers**: Background tracking (optional)
4. **IndexedDB**: Future expansion for cloud sync

### Browser Requirements
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Mobile Safari 13+
- Chrome Android 80+

### Performance Budget
- Initial load: < 100ms added
- Runtime overhead: < 5% CPU
- Memory usage: < 10MB additional
- Storage usage: < 1MB per player

## Timeline Recommendations

### MVP Timeline (4 weeks)
**Week 1**: Foundation
- Data model implementation
- Migration scripts
- Basic tracking system

**Week 2**: Core Features
- Rarity tier system
- Unlock criteria engine
- UI components

**Week 3**: Polish
- Animations and effects
- Mobile optimization
- Boss skin mystery

**Week 4**: Testing & Launch
- QA testing
- Performance optimization
- Gradual rollout

### Post-Launch Roadmap
**Month 2**:
- Cloud sync support
- Leaderboards for each metric
- Social sharing features

**Month 3**:
- Seasonal skins
- Limited-time events
- Achievement badges

**Month 4+**:
- Skin trading system
- Custom skin creator
- Competitive seasons

## Appendix

### A. Detailed Unlock Criteria Specifications
[Full list of all 48 skins with exact requirements]

### B. UI/UX Mockups
[Referenced from skin-ui-mockup.html]

### C. Technical Architecture
[System diagrams and data flow]

### D. Analytics Implementation
[Event tracking specifications]

### E. A/B Test Plans
[Testing strategies for unlock rates]