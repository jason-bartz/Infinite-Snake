// Temporary debug endpoint for leaderboard
import { Redis } from '@upstash/redis';

// Initialize Redis
let redis;
try {
  redis = Redis.fromEnv();
} catch (error) {
  console.error('Redis initialization failed:', error);
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (!redis) {
    return res.status(500).json({ error: 'Redis not initialized' });
  }
  
  try {
    // Get current time info
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // Calculate ET components
    const etYear = easternTime.getFullYear();
    const etMonth = easternTime.getMonth();
    const etDate = easternTime.getDate();
    
    // Generate keys both ways
    const etDailyKey = `lb:daily:${etYear}-${String(etMonth + 1).padStart(2, '0')}-${String(etDate).padStart(2, '0')}`;
    const utcDailyKey = `lb:daily:${now.toISOString().split('T')[0]}`;
    
    // Get all lb: keys
    const allKeys = await redis.keys('lb:*');
    
    // Get counts for various keys
    const debugInfo = {
      currentTime: {
        utc: now.toISOString(),
        et: easternTime.toString(),
        utcDate: now.toISOString().split('T')[0],
        etDate: `${etYear}-${String(etMonth + 1).padStart(2, '0')}-${String(etDate).padStart(2, '0')}`
      },
      expectedKeys: {
        etBased: etDailyKey,
        utcBased: utcDailyKey,
        match: etDailyKey === utcDailyKey
      },
      allLeaderboardKeys: allKeys.sort(),
      keyCounts: {}
    };
    
    // Get count for each key
    for (const key of allKeys) {
      if (key.startsWith('lb:')) {
        try {
          const count = await redis.zcard(key);
          debugInfo.keyCounts[key] = count;
          
          // Get top 3 entries to see dates
          if (count > 0 && (key.includes('daily') || key.includes('weekly'))) {
            const top3 = await redis.zrange(key, 0, 2, { rev: true, withScores: true });
            if (top3 && top3.length > 0) {
              debugInfo.keyCounts[key] = {
                count,
                samples: []
              };
              
              for (let i = 0; i < top3.length; i += 2) {
                try {
                  const data = JSON.parse(top3[i]);
                  debugInfo.keyCounts[key].samples.push({
                    username: data.username,
                    score: top3[i + 1],
                    timestamp: new Date(data.timestamp).toISOString(),
                    date: new Date(data.timestamp).toLocaleDateString('en-US', {timeZone: 'America/New_York'})
                  });
                } catch (e) {
                  // Skip invalid entries
                }
              }
            }
          }
        } catch (e) {
          debugInfo.keyCounts[key] = 'error: ' + e.message;
        }
      }
    }
    
    // Check what data is in current daily key
    debugInfo.currentDailyData = {
      etKey: etDailyKey,
      utcKey: utcDailyKey
    };
    
    try {
      const etCount = await redis.zcard(etDailyKey);
      const utcCount = await redis.zcard(utcDailyKey);
      debugInfo.currentDailyData.etKeyCount = etCount;
      debugInfo.currentDailyData.utcKeyCount = utcCount;
    } catch (e) {
      debugInfo.currentDailyData.error = e.message;
    }
    
    return res.status(200).json(debugInfo);
    
  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({ 
      error: 'Debug failed', 
      message: error.message 
    });
  }
}