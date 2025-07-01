// api/leaderboard-manage.js
import { Redis } from '@upstash/redis';

// Initialize Redis
let redis;
try {
  redis = Redis.fromEnv();
  console.log('Redis initialized successfully');
} catch (error) {
  console.error('Failed to initialize Redis:', error);
  redis = null;
}

// Get leaderboard keys for different periods
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

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Check admin authentication
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!redis) {
    return res.status(500).json({ error: 'Database not initialized' });
  }
  
  try {
    // DELETE - Remove specific entry
    if (req.method === 'DELETE') {
      const { entryId, username, timestamp, period = 'all' } = req.body || req.query;
      
      if (!entryId && (!username || !timestamp)) {
        return res.status(400).json({ error: 'Entry ID or username/timestamp required' });
      }
      
      const keys = getLeaderboardKeys();
      const periods = period === 'all' ? Object.keys(keys) : [period];
      let totalDeleted = 0;
      
      // Delete from all specified periods
      for (const p of periods) {
        const key = keys[p];
        if (!key) continue;
        
        try {
          // Get all entries
          const entries = await redis.zrange(key, 0, -1, { withScores: true });
          
          // Find and remove the specific entry
          for (let i = 0; i < entries.length; i += 2) {
            const member = entries[i];
            const score = entries[i + 1];
            
            try {
              const data = JSON.parse(member);
              // Match by ID or by username/timestamp combination
              const matchById = entryId && data.id === entryId;
              const matchByData = !entryId && username && timestamp && 
                                data.username === username && 
                                data.timestamp === timestamp;
              
              if (matchById || matchByData) {
                await redis.zrem(key, member);
                totalDeleted++;
                console.log(`Deleted entry from ${p} leaderboard:`, data.username);
              }
            } catch (e) {
              console.error('Error parsing entry:', e);
            }
          }
        } catch (err) {
          console.error(`Error deleting from ${p}:`, err);
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `Deleted entry from ${totalDeleted} leaderboard(s)`,
        deleted: totalDeleted
      });
    }
    
    // PUT - Update entry (delete and re-add with new data)
    if (req.method === 'PUT') {
      const { entryId, username, score, period = 'all' } = req.body;
      
      if (!entryId || (!username && score === undefined)) {
        return res.status(400).json({ error: 'Entry ID and at least one field to update required' });
      }
      
      const keys = getLeaderboardKeys();
      const periods = period === 'all' ? Object.keys(keys) : [period];
      let totalUpdated = 0;
      
      for (const p of periods) {
        const key = keys[p];
        if (!key) continue;
        
        try {
          // Get all entries
          const entries = await redis.zrange(key, 0, -1, { withScores: true });
          
          // Find and update the specific entry
          for (let i = 0; i < entries.length; i += 2) {
            const member = entries[i];
            const oldScore = entries[i + 1];
            
            try {
              const data = JSON.parse(member);
              if (data.id === entryId) {
                // Update fields
                if (username) data.username = username.substring(0, 20).trim();
                if (score !== undefined) data.score = Math.floor(score);
                
                // Remove old entry
                await redis.zrem(key, member);
                
                // Add updated entry
                const newScore = score !== undefined ? Math.floor(score) : oldScore;
                await redis.zadd(key, { score: newScore, member: JSON.stringify(data) });
                
                totalUpdated++;
                console.log(`Updated entry ${entryId} in ${p} leaderboard`);
              }
            } catch (e) {
              console.error('Error updating entry:', e);
            }
          }
        } catch (err) {
          console.error(`Error updating in ${p}:`, err);
        }
      }
      
      return res.status(200).json({ 
        success: true, 
        message: `Updated entry in ${totalUpdated} leaderboard(s)`,
        updated: totalUpdated
      });
    }
    
    // GET - Get specific entry details
    if (req.method === 'GET') {
      const { entryId } = req.query;
      
      if (!entryId) {
        return res.status(400).json({ error: 'Entry ID required' });
      }
      
      const keys = getLeaderboardKeys();
      const foundIn = [];
      let entryData = null;
      
      // Search all leaderboards
      for (const [period, key] of Object.entries(keys)) {
        try {
          const entries = await redis.zrange(key, 0, -1, { withScores: true });
          
          for (let i = 0; i < entries.length; i += 2) {
            const member = entries[i];
            const score = entries[i + 1];
            
            try {
              const data = JSON.parse(member);
              if (data.id === entryId) {
                if (!entryData) entryData = data;
                foundIn.push({ period, score, rank: Math.floor(i / 2) + 1 });
              }
            } catch (e) {
              console.error('Error parsing entry:', e);
            }
          }
        } catch (err) {
          console.error(`Error searching ${period}:`, err);
        }
      }
      
      if (!entryData) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      
      return res.status(200).json({ 
        success: true,
        entry: entryData,
        foundIn
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Leaderboard manage error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}