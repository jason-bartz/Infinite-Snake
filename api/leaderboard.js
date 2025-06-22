// api/leaderboard.js
import { Redis } from '@upstash/redis';

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
  if (score > playTime * 200) return { valid: false, error: 'Score too high for play time' };
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
      
      // Create score entry
      const scoreEntry = {
        id: generateScoreId(),
        username: username.substring(0, 20).trim(), // Limit username length
        score: Math.floor(score),
        elements_discovered: elements_discovered || 0,
        play_time: play_time || 0,
        kills: kills || 0,
        timestamp: Date.now()
      };
      
      // Get all period keys
      const keys = getLeaderboardKeys();
      const scoreData = JSON.stringify(scoreEntry);
      
      // Use pipeline for atomic operations
      const pipe = redis.pipeline();
      
      // Add to daily leaderboard (expires in 7 days)
      pipe.zadd(keys.daily, scoreEntry.score, scoreData);
      pipe.expire(keys.daily, 604800); // 7 days in seconds
      
      // Add to weekly leaderboard (expires in 30 days)
      pipe.zadd(keys.weekly, scoreEntry.score, scoreData);
      pipe.expire(keys.weekly, 2592000); // 30 days
      
      // Add to monthly leaderboard (expires in 90 days)
      pipe.zadd(keys.monthly, scoreEntry.score, scoreData);
      pipe.expire(keys.monthly, 7776000); // 90 days
      
      // Add to all-time leaderboard (no expiry)
      pipe.zadd(keys.all, scoreEntry.score, scoreData);
      
      // Execute all commands
      await pipe.exec();
      
      // Get player's rank in daily leaderboard
      const dailyRank = await redis.zrevrank(keys.daily, scoreData);
      
      // Also update user's best score
      const userKey = `user:${username.toLowerCase()}:best`;
      const currentBestStr = await redis.get(userKey);
      let currentBest = null;
      if (currentBestStr) {
        try {
          currentBest = JSON.parse(currentBestStr);
        } catch (e) {
          console.error('Failed to parse current best score:', e);
        }
      }
      
      if (!currentBest || scoreEntry.score > (currentBest.score || 0)) {
        await redis.setex(userKey, 2592000, JSON.stringify(scoreEntry)); // Expire in 30 days
      }
      
      console.log(`Score submitted: ${username} - ${score} (rank: ${dailyRank + 1})`);
      
      return res.status(200).json({
        success: true,
        daily_rank: dailyRank !== null ? dailyRank + 1 : null,
        score_id: scoreEntry.id
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
      const key = getLeaderboardKeys(period)[period];
      console.log('Fetching leaderboard for key:', key);
      
      // Fetch leaderboard data with pagination
      const start = parseInt(offset) || 0;
      const end = start + (parseInt(limit) || 100) - 1;
      console.log('Range:', start, 'to', end);
      
      // Get scores in descending order
      let scores;
      try {
        scores = await redis.zrange(key, start, end, { rev: true });
        console.log('Scores retrieved:', scores ? scores.length : 'null');
      } catch (zrangeError) {
        console.error('zrange error:', zrangeError);
        // Try without options as fallback
        scores = await redis.zrange(key, start, end);
      }
      
      // Parse and format results
      const leaderboard = (scores || []).map((entry, index) => {
        try {
          const data = JSON.parse(entry);
          return {
            ...data,
            rank: start + index + 1
          };
        } catch (e) {
          console.error('Failed to parse leaderboard entry:', e);
          return null;
        }
      }).filter(Boolean);
      
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
      
      const key = getLeaderboardKeys(period)[period];
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