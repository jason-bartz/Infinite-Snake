// api/leaderboard.js
import { Redis } from '@upstash/redis';

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
  // Your game's validation rules
  if (playTime < 10) return { valid: false, error: 'Minimum 10 seconds play time required' };
  if (score > playTime * 1000) return { valid: false, error: 'Score too high for play time' }; // Allow up to 1000 points per second
  if (elements > playTime * 10) return { valid: false, error: 'Too many elements for play time' };
  if (kills > playTime * 2) return { valid: false, error: 'Too many kills for play time' };
  return { valid: true };
}

// Generate unique ID for each score entry
function generateScoreId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
        username: username.substring(0, 20).trim(), // Limit username length
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
    
    // DELETE - Clear leaderboard (admin only - add auth in production!)
    if (req.method === 'DELETE') {
      // WARNING: Add authentication before enabling this in production!
      const { period = 'all', adminKey } = req.query;
      
      // Simple admin key check (use proper auth in production)
      if (adminKey !== process.env.ADMIN_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const keys = getLeaderboardKeys();
      const key = keys[period];
      
      if (!key) {
        return res.status(400).json({ error: 'Invalid period specified' });
      }
      
      await redis.del(key);
      
      return res.status(200).json({ 
        success: true, 
        message: `Cleared ${period} leaderboard` 
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