// api/leaderboard.js
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// Country code to name mapping (partial list)
const COUNTRY_NAMES = {
  'US': 'United States',
  'CA': 'Canada', 
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'JP': 'Japan',
  'AU': 'Australia',
  'BR': 'Brazil',
  'IN': 'India',
  'CN': 'China',
  'RU': 'Russia',
  'MX': 'Mexico',
  'IT': 'Italy',
  'ES': 'Spain',
  'KR': 'South Korea',
  'NL': 'Netherlands',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  // Add more as needed
};

// Get country from request headers (Vercel provides this)
function getCountryFromRequest(req) {
  // Vercel provides country in x-vercel-ip-country header
  const countryCode = req.headers['x-vercel-ip-country'] || 
                     req.headers['cf-ipcountry'] || // Cloudflare
                     'XX'; // Unknown
  
  const countryName = COUNTRY_NAMES[countryCode] || countryCode;
  
  console.log('Detected country:', { code: countryCode, name: countryName });
  
  return {
    code: countryCode,
    name: countryName
  };
}

// Initialize Redis client with better error handling
let redis;
try {
  // First try fromEnv() which is the recommended approach
  redis = Redis.fromEnv();
} catch (error) {
  console.error('Redis.fromEnv() failed:', error.message);
  
  // Fallback to explicit initialization
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('Missing required environment variables');
    console.error('UPSTASH_REDIS_REST_URL exists:', !!process.env.UPSTASH_REDIS_REST_URL);
    console.error('UPSTASH_REDIS_REST_TOKEN exists:', !!process.env.UPSTASH_REDIS_REST_TOKEN);
    throw new Error('Upstash Redis environment variables not configured');
  }
  
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Helper to generate Redis keys for different periods
function getLeaderboardKeys(period) {
  const now = new Date();
  const keys = {
    daily: `lb:daily:${now.toISOString().split('T')[0]}`,
    weekly: `lb:weekly:${getWeekNumber(now)}`,
    monthly: `lb:monthly:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    all: 'lb:all'
  };
  
  return period ? keys[period] : keys;
}

// Helper to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return `${d.getUTCFullYear()}-W${Math.ceil((((d - yearStart) / 86400000) + 1)/7)}`;
}

// Validate scores to prevent cheating
function validateScore(score, elements, playTime, kills) {
  // Basic sanity checks
  if (typeof score !== 'number' || score < 0) {
    return { valid: false, error: 'Invalid score format' };
  }
  
  // Check for overflow or unrealistic scores
  if (score > Number.MAX_SAFE_INTEGER || score > 999999999) {
    return { valid: false, error: 'Score exceeds maximum allowed value' };
  }
  
  // Minimum play time required
  if (playTime < 5) {
    return { valid: false, error: 'Minimum 5 seconds play time required' };
  }
  
  // Maximum points per second: 5000 (allows for boss kills + combos)
  // Boss kill = 10000 points, so in 2-3 seconds of boss defeat that's ~3333-5000 pts/sec
  if (score > playTime * 5000) {
    return { valid: false, error: 'Score too high for play time' };
  }
  
  // Maximum elements per second: 10
  if (elements > playTime * 10) {
    return { valid: false, error: 'Too many elements discovered for play time' };
  }
  
  // Maximum kills per minute: 30 (0.5 kills per second)
  if (kills > (playTime / 60) * 30) {
    return { valid: false, error: 'Too many kills for play time' };
  }
  
  // Additional checks for impossible scenarios
  if (elements < 0 || kills < 0 || playTime < 0) {
    return { valid: false, error: 'Invalid game statistics' };
  }
  
  // Check for reasonable score composition
  // Minimum possible score sources: elements (100 pts each), kills (500 pts each), discoveries (500 pts each)
  const minPossibleScore = Math.max(0, elements * 100);
  if (score < minPossibleScore * 0.5) {
    return { valid: false, error: 'Score inconsistent with game statistics' };
  }
  
  return { valid: true };
}

// Generate unique ID for each score entry
function generateScoreId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Rate limiting helper
async function checkRateLimit(redis, identifier, maxRequests = 5, windowSeconds = 60) {
  const key = `rate:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    // First request, set expiry
    await redis.expire(key, windowSeconds);
  }
  
  if (current > maxRequests) {
    const ttl = await redis.ttl(key);
    return { 
      allowed: false, 
      retryAfter: ttl > 0 ? ttl : windowSeconds 
    };
  }
  
  return { allowed: true, remaining: maxRequests - current };
}

// Generate a server-side token for score verification
function generateScoreToken(gameData, secret) {
  const data = `${gameData.score}:${gameData.elements}:${gameData.playTime}:${gameData.kills}:${gameData.timestamp}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

// Verify score token
function verifyScoreToken(gameData, token, secret) {
  const expectedToken = generateScoreToken(gameData, secret);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

export default async function handler(req, res) {
  // Enable CORS for your game
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Check if Redis is initialized
  if (!redis) {
    console.error('Redis client not initialized');
    return res.status(500).json({ 
      error: 'Database connection not configured',
      details: 'Redis client initialization failed'
    });
  }
  
  try {
    // POST - Submit a new score
    if (req.method === 'POST') {
      const { username, score, elements_discovered, play_time, kills } = req.body;
      
      // Basic validation
      if (!username || typeof score !== 'number' || score < 0) {
        return res.status(400).json({ 
          error: 'Invalid input: username and score are required' 
        });
      }
      
      // Get client IP for rate limiting
      const clientIp = req.headers['x-forwarded-for'] || 
                      req.headers['x-real-ip'] || 
                      req.connection?.remoteAddress || 
                      'unknown';
      
      // Check rate limit (10 submissions per minute per IP)
      const rateLimitResult = await checkRateLimit(redis, `ip:${clientIp}`, 10, 60);
      if (!rateLimitResult.allowed) {
        return res.status(429).json({ 
          error: 'Too many requests', 
          retryAfter: rateLimitResult.retryAfter 
        });
      }
      
      // Also rate limit by IP hourly (25 submissions per hour)
      const hourlyRateLimit = await checkRateLimit(redis, `ip-hourly:${clientIp}`, 25, 3600);
      if (!hourlyRateLimit.allowed) {
        return res.status(429).json({ 
          error: 'Too many submissions this hour', 
          retryAfter: hourlyRateLimit.retryAfter 
        });
      }
      
      // Comprehensive username content filtering
      const blockedPatterns = [
        // Impersonation & Authority
        /\b(admin|administrator|admins|adm1n|4dmin)\b/i,
        /\b(moderator|mod|m0d|m0der4tor)\b/i,
        /\b(official|offical|0fficial|staff|support)\b/i,
        /\b(system|sys|root|sudo|superuser)\b/i,
        /\b(owner|founder|ceo|president)\b/i,
        
        // Profanity & Variations
        /\b(fuck|f[u\*@#]ck|fck|fuk|fuq|phuck|f[0-9]ck)\b/i,
        /\b(shit|sh[i!1\*@]t|sht|sh1t|$hit)\b/i,
        /\b(ass|a[s\$5]{2}|azz|@ss)\b/i,
        /\b(bitch|b[i!1\*]tch|b1tch|biatch|beotch)\b/i,
        /\b(damn|dam|d[a@]mn|dayum)\b/i,
        /\b(hell|h[e3]ll|h3ll)\b/i,
        /\b(bastard|b[a@]st[a@]rd|basterd)\b/i,
        /\b(cunt|c[u\*]nt|kunt)\b/i,
        /\b(whore|wh0re|h[o0]e|h[o0]ar)\b/i,
        /\b(slut|s1ut|$lut)\b/i,
        
        // Anatomical & Sexual Terms
        /\b(penis|pen[i!1]s|p[e3]n[i!1]s|peen|penus)\b/i,
        /\b(vagina|vag[i!1]na|vaj|vajay)\b/i,
        /\b(dick|d[i!1]ck|d1ck|dik)\b/i,
        /\b(cock|c[o0]ck|cok|c0ck)\b/i,
        /\b(pussy|pu[s\$]{2}y|p[u\*]ssy)\b/i,
        /\b(boob|b[o0]{2}b|tit|t[i!1]t|breast)\b/i,
        /\b(anal|an[a@]l|anus|butt)\b/i,
        /\b(oral|blowjob|bj|handjob|hj)\b/i,
        /\b(sex|s[e3]x|secks|seks)\b/i,
        /\b(porn|p[o0]rn|xxx|nsfw)\b/i,
        
        // Racial & Ethnic Slurs
        /\b(nigg|n[i!1]gg|n-word)/i,  // Removed trailing \b to catch nigger, nigga, etc.
        /\b(fag|f[a@]g)\b/i,  // Keep boundaries for fag but not gay/homo
        /\bgay\b/i,  // Separate pattern with boundaries for "gay"
        /\b(homo|queer)\b/i,
        /\b(retard|ret[a@]rd|r-word|tard)\b/i,
        /\b(kike|k[i!1]ke)\b/i,  // Removed jew/joo as they could be legitimate
        /\b(spic|sp[i!1]c|wetback|beaner)\b/i,
        /\b(chink|ch[i!1]nk|gook|g[o0]{2}k)\b/i,
        /\btowelhead\b/i,  // More specific patterns
        /\b(cracker|whitey|honkey)\b/i,
        
        // Offensive Historical/Political References
        /\b(hitler|h[i!1]tler|adolf|fuhrer)\b/i,
        /\b(nazi|n[a@]zi|gestapo|reich)\b/i,  // Removed 'ss' as it's too common
        /\b(stalin|mao|pol-?pot)\b/i,
        /\b(isis|isil|qaeda|taliban)\b/i,
        /\b(terrorist|terror)\b/i,
        /\bbomb\b/i,  // Separate to avoid blocking "bombastic", etc.
        /\bjihad\b/i,
        /\b(kkk|klan|lynch)\b/i,
        
        // Violence & Death
        /\b(kill|k[i!1]ll|murder|slay)\b/i,
        /\b(rape|r[a@]pe|molest)\b/i,
        /\b(die|d[i!1]e|death|dead)\b/i,
        /\b(suicide|kys|kms)\b/i,
        /\bhang\b/i,  // Separate to avoid blocking "change", "hanging out", etc.
        /\b(shoot|stab|cut|bleed)\b/i,
        
        // Scatological
        /\b(poop|p[o0]{2}p|crap|feces|scat)\b/i,
        /\b(piss|p[i!1]ss|pee|urine)\b/i,
        /\b(fart|queef)\b/i,
        
        // XSS & Injection Attempts
        /<script|<iframe|<object|<embed|<form/i,
        /javascript:|vbscript:|onload=|onerror=|onclick=|onmouse/i,
        /eval\(|expression\(|prompt\(|confirm\(/i,
        /document\.|window\.|alert\(/i,
        /\.exe|\.bat|\.cmd|\.com|\.pif|\.scr|\.vbs|\.js/i,
        
        // SQL Injection Patterns
        /(\b(union|select|insert|update|delete|drop|create)\b.*\b(from|where|table)\b)/i,
        /(\b(or|and)\b.*=.*)/i,
        /('|(--|#|\/\*|\*\/)|;.*--)/,
        
        // Non-printable characters (except basic ASCII)
        /[^\x20-\x7E]/g
      ];
      
      const cleanUsername = username.trim();
      for (const pattern of blockedPatterns) {
        if (pattern.test(cleanUsername)) {
          return res.status(400).json({ 
            error: 'Username contains inappropriate content' 
          });
        }
      }
      
      // Anti-cheat validation
      const validation = validateScore(score, elements_discovered, play_time, kills);
      if (!validation.valid) {
        console.log('Score validation failed:', { username, score, validation });
        return res.status(400).json({ error: validation.error });
      }
      
      // Get country from IP
      const country = getCountryFromRequest(req);
      
      // Create score entry with country
      const scoreEntry = {
        id: generateScoreId(),
        username: cleanUsername.substring(0, 20), // Use cleaned username, limit length
        score: Math.floor(score),
        elements_discovered: elements_discovered || 0,
        play_time: play_time || 0,
        kills: kills || 0,
        country_code: country.code,
        country_name: country.name,
        timestamp: Date.now()
      };
      
      // Get all period keys
      const keys = getLeaderboardKeys();
      const scoreData = JSON.stringify(scoreEntry);
      
      // Ensure score is a number
      const numericScore = Number(scoreEntry.score);
      
      console.log('Adding score:', { 
        key: keys.daily, 
        score: numericScore, 
        memberLength: scoreData.length,
        memberPreview: scoreData.substring(0, 100) + '...'
      });
      
      // Validate that scoreData is proper JSON
      try {
        const testParse = JSON.parse(scoreData);
        console.log('JSON validation passed for scoreData');
      } catch (jsonError) {
        console.error('Invalid JSON being stored:', jsonError);
        throw new Error('Failed to create valid JSON for storage');
      }
      
      // Use individual operations instead of pipeline to debug
      try {
        // Add to daily leaderboard (expires in 7 days)
        await redis.zadd(keys.daily, { score: numericScore, member: scoreData });
        await redis.expire(keys.daily, 604800); // 7 days in seconds
        
        // Add to weekly leaderboard (expires in 30 days)
        await redis.zadd(keys.weekly, { score: numericScore, member: scoreData });
        await redis.expire(keys.weekly, 2592000); // 30 days
        
        // Add to monthly leaderboard (expires in 90 days)
        await redis.zadd(keys.monthly, { score: numericScore, member: scoreData });
        await redis.expire(keys.monthly, 7776000); // 90 days
        
        // Add to all-time leaderboard (no expiry)
        await redis.zadd(keys.all, { score: numericScore, member: scoreData });
        
        console.log('All zadd operations completed successfully');
        
      } catch (zaddError) {
        console.error('ZADD operation failed:', zaddError);
        console.error('Score data:', { score: numericScore, member: scoreData });
        throw zaddError;
      }
      
      // Get player's rank in daily leaderboard
      let dailyRank = null;
      try {
        dailyRank = await redis.zrevrank(keys.daily, scoreData);
      } catch (rankError) {
        console.error('Failed to get rank:', rankError);
        // Continue anyway - rank is not critical
      }
      
      // Also update user's best score
      const userKey = `user:${username.toLowerCase()}:best`;
      const currentBestStr = await redis.get(userKey);
      let currentBest = null;
      let currentBestScore = 0;
      
      if (currentBestStr) {
        try {
          // Try to parse as JSON first
          currentBest = JSON.parse(currentBestStr);
          currentBestScore = currentBest.score || 0;
        } catch (e) {
          // If parsing fails, it might be a plain number
          const numValue = parseFloat(currentBestStr);
          if (!isNaN(numValue)) {
            currentBestScore = numValue;
          }
          console.log('Current best is a plain number:', currentBestScore);
        }
      }
      
      if (scoreEntry.score > currentBestScore) {
        await redis.setex(userKey, 2592000, JSON.stringify(scoreEntry)); // Expire in 30 days
      }
      
      console.log(`Score submitted: ${username} (${country.code}) - ${score} (rank: ${dailyRank !== null ? dailyRank + 1 : 'unknown'})`);
      
      return res.status(200).json({
        success: true,
        daily_rank: dailyRank !== null ? dailyRank + 1 : null,
        score_id: scoreEntry.id,
        country: country
      });
    }
    
    // GET - Retrieve leaderboard
    if (req.method === 'GET') {
      const { 
        period = 'daily', 
        limit = 100, 
        offset = 0,
        username = null 
      } = req.query;
      
      // Validate period
      const validPeriods = ['daily', 'weekly', 'monthly', 'all'];
      if (!validPeriods.includes(period)) {
        return res.status(400).json({ error: 'Invalid period. Use: daily, weekly, monthly, or all' });
      }
      
      // Get the appropriate key
      const keys = getLeaderboardKeys();
      const key = keys[period];
      console.log('Fetching leaderboard for key:', key);
      
      if (!key) {
        return res.status(400).json({ error: 'Invalid period specified' });
      }
      
      // Fetch leaderboard data with pagination
      const start = parseInt(offset) || 0;
      const end = start + (parseInt(limit) || 100) - 1;
      console.log('Range:', start, 'to', end);
      
      // Get scores in descending order with scores included
      let scores;
      try {
        // Use WITHSCORES to get both member and score
        scores = await redis.zrange(key, start, end, { 
          rev: true,
          withScores: true 
        });
        console.log('Scores retrieved:', scores ? scores.length : 'null');
        console.log('First few entries:', scores?.slice(0, 4));
      } catch (zrangeError) {
        console.error('zrange error:', zrangeError);
        // Try without withScores as fallback
        try {
          scores = await redis.zrange(key, start, end, { rev: true });
        } catch (fallbackError) {
          // Final fallback - basic zrange
          scores = await redis.zrange(key, start, end);
        }
      }
      
      // Parse and format results
      const leaderboard = [];
      
      if (scores && scores.length > 0) {
        // Handle the case where we might have [member, score, member, score, ...] format
        const isWithScores = scores.length > 0 && typeof scores[1] === 'number';
        
        if (isWithScores) {
          // Process pairs of [member, score]
          for (let i = 0; i < scores.length; i += 2) {
            try {
              const member = scores[i];
              const score = scores[i + 1];
              
              console.log(`Processing entry ${i/2 + 1}:`, { member, score });
              
              // Try to parse the member as JSON
              let data;
              if (typeof member === 'string') {
                data = JSON.parse(member);
              } else if (typeof member === 'object') {
                data = member;
              } else {
                console.error('Unexpected member type:', typeof member, member);
                continue;
              }
              
              leaderboard.push({
                ...data,
                score: score, // Include the Redis score
                rank: start + (i / 2) + 1
              });
            } catch (e) {
              console.error('Failed to parse leaderboard entry:', e, 'Raw data:', scores[i]);
            }
          }
        } else {
          // Process as simple array of members
          scores.forEach((entry, index) => {
            try {
              console.log(`Processing simple entry ${index + 1}:`, entry);
              
              let data;
              if (typeof entry === 'string') {
                data = JSON.parse(entry);
              } else if (typeof entry === 'object') {
                data = entry;
              } else {
                console.error('Unexpected entry type:', typeof entry, entry);
                return;
              }
              
              leaderboard.push({
                ...data,
                rank: start + index + 1
              });
            } catch (e) {
              console.error('Failed to parse leaderboard entry:', e, 'Raw data:', entry);
            }
          });
        }
      }
      
      // If username provided, also get their rank
      let userRank = null;
      if (username) {
        // Get all scores to find user's position (inefficient for large sets)
        // For production, consider maintaining a separate user->score mapping
        const allScores = await redis.zrange(key, 0, -1, { rev: true });
        const userIndex = (allScores || []).findIndex(entry => {
          try {
            const data = JSON.parse(entry);
            return data.username.toLowerCase() === username.toLowerCase();
          } catch (e) {
            return false;
          }
        });
        
        if (userIndex !== -1) {
          userRank = {
            rank: userIndex + 1,
            ...JSON.parse(allScores[userIndex])
          };
        }
      }
      
      // Get total count for pagination info
      const totalCount = await redis.zcard(key);
      
      return res.status(200).json({
        leaderboard,
        pagination: {
          total: totalCount,
          limit: parseInt(limit) || 100,
          offset: start,
          hasMore: end < totalCount - 1
        },
        userRank,
        period
      });
    }
    
    // DELETE - Clear leaderboard or specific entries (admin only)
    if (req.method === 'DELETE') {
      const { period = 'all', adminKey, action, threshold } = req.query;
      
      // Simple admin key check (use proper auth in production)
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Special action to clean suspicious scores
      if (action === 'clean') {
        const keys = getLeaderboardKeys();
        let cleaned = 0;
        
        for (const [periodName, key] of Object.entries(keys)) {
          // Get all scores
          const allScores = await redis.zrange(key, 0, -1, { 
            rev: true,
            withScores: true 
          });
          
          if (!allScores || allScores.length === 0) continue;
          
          // Process scores in pairs
          for (let i = 0; i < allScores.length; i += 2) {
            try {
              const member = allScores[i];
              const score = allScores[i + 1];
              
              // Check for overflow or suspicious scores
              if (score > 999999999 || score > Number.MAX_SAFE_INTEGER / 2) {
                await redis.zrem(key, member);
                cleaned++;
                console.log(`Removed suspicious score: ${score} from ${periodName}`);
              } else {
                // Parse member data to check for invalid entries
                const data = JSON.parse(member);
                
                // Re-validate the score
                const validation = validateScore(
                  data.score, 
                  data.elements_discovered, 
                  data.play_time, 
                  data.kills
                );
                
                if (!validation.valid) {
                  await redis.zrem(key, member);
                  cleaned++;
                  console.log(`Removed invalid score from ${data.username}: ${validation.error}`);
                }
              }
            } catch (e) {
              console.error('Error processing score entry:', e);
            }
          }
        }
        
        return res.status(200).json({
          success: true,
          message: 'Cleaned suspicious scores',
          cleaned
        });
      }
      
      const keys = getLeaderboardKeys();
      
      // Handle clearing all leaderboards
      if (period === 'all') {
        const deleted = {};
        let totalDeleted = 0;
        
        // Delete all period leaderboards
        for (const [periodName, keyPattern] of Object.entries(keys)) {
          try {
            const result = await redis.del(keyPattern);
            deleted[periodName] = result;
            totalDeleted += result;
          } catch (err) {
            console.error(`Failed to delete ${periodName}:`, err);
            deleted[periodName] = 0;
          }
        }
        
        // Also delete any old daily/weekly/monthly keys using pattern matching
        try {
          // Get all leaderboard keys
          const allKeys = await redis.keys('lb:*');
          console.log(`Found ${allKeys.length} total leaderboard keys`);
          
          // Delete them in batches
          const batchSize = 10;
          for (let i = 0; i < allKeys.length; i += batchSize) {
            const batch = allKeys.slice(i, i + batchSize);
            if (batch.length > 0) {
              await redis.del(...batch);
              totalDeleted += batch.length;
            }
          }
        } catch (err) {
          console.error('Failed to delete old keys:', err);
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Cleared all leaderboards',
          deleted,
          totalDeleted
        });
      }
      
      // Handle clearing specific period
      const key = keys[period];
      if (!key) {
        return res.status(400).json({ error: 'Invalid period specified' });
      }
      
      const result = await redis.del(key);
      
      return res.status(200).json({ 
        success: true, 
        message: `Cleared ${period} leaderboard`,
        deleted: result
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Leaderboard API error:', error);
    
    // Check if it's a Redis connection error
    if (error.message?.includes('UPSTASH_REDIS_REST_URL') || 
        error.message?.includes('Redis') ||
        error.message?.includes('Upstash')) {
      return res.status(500).json({ 
        error: 'Database connection error',
        details: error.message,
        hint: 'Please check Upstash environment variables'
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      type: error.constructor.name
    });
  }
}