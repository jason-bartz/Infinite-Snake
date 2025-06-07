# Global Leaderboard Implementation Guide

## Overview
This document outlines the complete implementation plan for adding a global leaderboard system to Infinite Snake using Cloudflare Workers and secure API practices.

## Architecture Overview
- **Frontend**: Vercel (existing hosting) - no changes needed
- **API**: Cloudflare Workers (new) - handles leaderboard endpoints
- **Database**: Cloudflare D1 or external database
- **Security**: Server-side validation, session tokens, encrypted events

```
[Game on Vercel] → API calls → [Cloudflare Workers] → [Database]
```

## In-Game Implementation

### 1. Username Entry (Main Menu)
```javascript
// Add to main menu screen
<input type="text" 
       id="usernameInput" 
       placeholder="Enter username" 
       maxlength="20"
       pattern="[A-Za-z0-9_-]+"
       autocomplete="off">
<div class="username-info">3-20 characters, letters/numbers only</div>

// Store in localStorage
localStorage.setItem('username', sanitizedUsername);
```

### 2. Leaderboard UI Components
- **Main Menu Button**: Top-right corner with trophy icon
- **Pause Menu Option**: "View Leaderboard" below Settings
- **Full-screen Modal**: 
  - Tabs: Today | This Week | All Time
  - Shows: Rank, Username, Score, Elements, Time
  - Your entry highlighted if in top 100
  - Pagination for beyond top 100

### 3. Death Screen Update
```javascript
// Add to respawn overlay
`Daily Rank: ${dailyRank ? `#${dailyRank}` : 'Unranked'}`
```

## Cloudflare Workers Setup

### Project Structure
```
cloudflare-workers/
├── wrangler.toml
├── src/
│   ├── index.js
│   ├── routes/
│   │   ├── submit.js
│   │   └── leaderboard.js
│   └── utils/
│       ├── validation.js
│       └── rateLimit.js
```

### Database Schema (D1)
```sql
CREATE TABLE scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    score INTEGER NOT NULL,
    elements_discovered INTEGER,
    play_time INTEGER,
    kills INTEGER,
    client_id TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    game_version TEXT,
    INDEX idx_daily (created_at, score DESC),
    INDEX idx_weekly (created_at, score DESC),
    INDEX idx_all_time (score DESC)
);

CREATE TABLE banned_users (
    client_id TEXT PRIMARY KEY,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE game_sessions (
    session_id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    events TEXT, -- JSON array of encrypted events
    status TEXT DEFAULT 'active'
);
```

## Security Implementation

### Client-Side Security Measures

#### 1. Session-Based Approach
```javascript
// Game Start - Get session token
const session = await fetch('/api/game/start', {
    method: 'POST',
    credentials: 'include'
}).then(r => r.json());

// During gameplay - Send encrypted events
gameEvents.push(encryptEvent({
    type: 'collect',
    element: elementId,
    timestamp: Date.now()
}));

// Game end - Server calculates score
const result = await fetch('/api/game/end', {
    method: 'POST',
    headers: {
        'X-Session-Token': session.token
    },
    body: JSON.stringify({
        events: gameEvents
    })
});
```

#### 2. Obfuscation Techniques
```javascript
// Obfuscate score variable names
let _0x4a3f = 0; // actual score

// Track suspicious patterns
const metrics = {
    averageSpeed: [],
    clickRate: [],
    scoreVelocity: []
};

// Generate checksum for validation
function generateChecksum(score, time, elements) {
    return btoa(JSON.stringify({
        s: score,
        t: time,
        e: elements,
        h: Date.now(),
        v: GAME_VERSION
    }));
}
```

### Server-Side Security (Cloudflare Workers)

#### 1. Environment Variables and CORS
```javascript
// Use environment variables for secrets
const ENCRYPTION_KEY = env.ENCRYPTION_KEY;
const DATABASE_URL = env.DATABASE_URL;
const ALLOWED_ORIGINS = ['https://infinitesnake.io'];

// Validate origin
export async function handleRequest(request) {
    const origin = request.headers.get('origin');
    if (!ALLOWED_ORIGINS.includes(origin)) {
        return new Response('Forbidden', { status: 403 });
    }
    
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
        'Access-Control-Max-Age': '86400',
    };
    
    // ... handle request
}
```

#### 2. Score Validation
```javascript
// Server-side score calculation
function calculateScore(events) {
    // Never trust client-provided scores
    let score = 0;
    for (const event of decryptEvents(events)) {
        if (validateEvent(event)) {
            score += getEventValue(event);
        }
    }
    return score;
}

// Validation functions
function validateScore(data, session) {
    const MAX_SCORE_PER_SECOND = 100;
    const MAX_ELEMENTS_PER_SECOND = 5;
    
    // Check score velocity
    if (data.score / session.playTime > MAX_SCORE_PER_SECOND) return false;
    
    // Check element discovery rate
    if (data.elements / session.playTime > MAX_ELEMENTS_PER_SECOND) return false;
    
    // Check for impossible scores
    const MAX_THEORETICAL_SCORE = session.playTime * MAX_SCORE_PER_SECOND;
    if (data.score > MAX_THEORETICAL_SCORE) return false;
    
    return true;
}
```

#### 3. Rate Limiting
```javascript
const rateLimiter = {
    submissions: '5 per hour per IP',
    queries: '60 per minute per IP'
};

async function checkRateLimit(request, type) {
    const ip = request.headers.get('CF-Connecting-IP');
    const key = `rate_limit:${type}:${ip}`;
    
    const current = await env.RATE_LIMIT.get(key);
    if (current && parseInt(current) >= rateLimiter[type]) {
        return false;
    }
    
    await env.RATE_LIMIT.put(key, (parseInt(current || 0) + 1).toString(), {
        expirationTtl: 3600 // 1 hour
    });
    
    return true;
}
```

## API Endpoints

### 1. Start Game Session
```
POST /api/game/start
Response: {
    sessionId: string,
    token: string,
    timestamp: number
}
```

### 2. Submit Game Events
```
POST /api/game/events
Headers: {
    'X-Session-Token': string
}
Body: {
    events: EncryptedEvent[]
}
```

### 3. End Game Session
```
POST /api/game/end
Headers: {
    'X-Session-Token': string
}
Body: {
    events: EncryptedEvent[],
    finalState: EncryptedState
}
Response: {
    score: number,
    rank: number,
    dailyRank: number
}
```

### 4. Get Leaderboard
```
GET /api/leaderboard?period=daily&limit=100&offset=0
Response: {
    entries: [{
        rank: number,
        username: string,
        score: number,
        elements: number,
        playTime: number
    }],
    userRank: number,
    totalPlayers: number
}
```

## Anti-Cheat Measures

### Client-Side Detection
1. Monitor for DevTools usage
2. Track unusual input patterns
3. Detect memory tampering attempts
4. Log timing inconsistencies

### Server-Side Validation
1. **Event Sequence Validation**: Ensure events follow logical game rules
2. **Timing Verification**: Check timestamps are sequential and reasonable
3. **Score Calculation**: Always calculate server-side from events
4. **Pattern Detection**: Flag unusual play patterns for review
5. **Replay Prevention**: Store event hashes to prevent replay attacks

### Anomaly Detection
```javascript
async function detectAnomalies(clientId, sessionData) {
    const flags = [];
    
    // Check for sudden skill jumps
    const recentScores = await getRecentScores(clientId);
    const avgScore = average(recentScores);
    if (sessionData.score > avgScore * 3) {
        flags.push('SUDDEN_SKILL_INCREASE');
    }
    
    // Check for impossible element combinations
    if (hasImpossibleCombinations(sessionData.elements)) {
        flags.push('IMPOSSIBLE_ELEMENTS');
    }
    
    // Check for superhuman reaction times
    const reactionTimes = calculateReactionTimes(sessionData.events);
    if (average(reactionTimes) < 100) { // ms
        flags.push('SUPERHUMAN_REACTIONS');
    }
    
    return flags;
}
```

## Implementation Timeline

### Phase 1: Frontend UI (Week 1)
- [ ] Add username input to main menu
- [ ] Create leaderboard modal component
- [ ] Add leaderboard buttons to menu and pause screen
- [ ] Update death screen with rank display

### Phase 2: Cloudflare Setup (Week 1-2)
- [ ] Create Cloudflare Workers project
- [ ] Set up D1 database with schema
- [ ] Implement basic API endpoints
- [ ] Configure environment variables

### Phase 3: Integration (Week 2)
- [ ] Connect frontend to API
- [ ] Implement session management
- [ ] Add event tracking system
- [ ] Test end-to-end flow

### Phase 4: Security (Week 3)
- [ ] Implement encryption for events
- [ ] Add server-side validation
- [ ] Set up rate limiting
- [ ] Add anomaly detection

### Phase 5: Testing & Launch (Week 4)
- [ ] Load testing
- [ ] Security testing
- [ ] Beta test with small group
- [ ] Monitor for exploits
- [ ] Full launch

## Cost Considerations

### Cloudflare Workers (Free Tier)
- 100,000 requests/day
- 10ms CPU time per request
- Perfect for small-medium games

### Scaling Options
- Workers Paid: $5/month for 10M requests
- D1 Database: Free tier includes 5GB storage
- Consider caching popular queries

## Monitoring & Maintenance

### Key Metrics to Track
1. API response times
2. Error rates
3. Suspicious activity patterns
4. Database query performance
5. Rate limit hits

### Regular Maintenance
- Review flagged accounts weekly
- Update anti-cheat rules based on new exploits
- Optimize database queries
- Archive old leaderboard data

## Additional Considerations

### GDPR Compliance
- Allow users to request data deletion
- Anonymize IP addresses
- Clear privacy policy
- Cookie consent for sessions

### Backup Strategy
- Daily D1 backups
- Export leaderboards weekly
- Store critical data redundantly

### Future Enhancements
- Friend leaderboards
- Country/region filters
- Achievement system
- Seasonal leaderboards
- Replay system for top scores