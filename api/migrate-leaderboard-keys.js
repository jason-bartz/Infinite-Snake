// Migration script to consolidate UTC-based keys to ET-based keys
import { Redis } from '@upstash/redis';

// Initialize Redis
let redis;
try {
  redis = Redis.fromEnv();
} catch (error) {
  console.error('Redis initialization failed:', error);
  process.exit(1);
}

// Helper to convert UTC date to ET date
function getETDateFromUTC(utcDateStr) {
  // Parse UTC date string (YYYY-MM-DD)
  const [year, month, day] = utcDateStr.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  
  // Convert to ET
  const etDateStr = utcDate.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Format as YYYY-MM-DD
  const [m, d, y] = etDateStr.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// Helper to get ISO week number for ET date
function getETWeekNumber(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Clone the date
  const d = new Date(date.getTime());
  
  // Set to nearest Monday
  const dayNum = d.getDay() || 7;
  if (dayNum !== 1) {
    d.setDate(d.getDate() - dayNum + 1);
  }
  
  // Get year of this Monday
  const yearOfMonday = d.getFullYear();
  
  // Get first Monday of the year
  const jan1 = new Date(yearOfMonday, 0, 1);
  const jan1Day = jan1.getDay() || 7;
  const firstMonday = new Date(yearOfMonday, 0, jan1Day === 1 ? 1 : 9 - jan1Day);
  
  // Calculate week number
  const weekNum = Math.ceil(((d - firstMonday) / 86400000 + 1) / 7);
  
  return `${yearOfMonday}-W${String(weekNum).padStart(2, '0')}`;
}

async function migrateLeaderboards() {
  console.log('Starting leaderboard migration from UTC to ET...\n');
  
  try {
    // Get all leaderboard keys
    const allKeys = await redis.keys('lb:*');
    console.log(`Found ${allKeys.length} leaderboard keys\n`);
    
    const migrationMap = new Map();
    const stats = {
      daily: { migrated: 0, merged: 0, skipped: 0 },
      weekly: { migrated: 0, merged: 0, skipped: 0 },
      monthly: { migrated: 0, merged: 0, skipped: 0 }
    };
    
    // Analyze keys and build migration map
    for (const key of allKeys) {
      if (key === 'lb:all') continue; // Skip all-time leaderboard
      
      const parts = key.split(':');
      if (parts.length !== 3) continue;
      
      const [prefix, period, dateStr] = parts;
      
      if (period === 'daily' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Convert UTC date to ET date
        const etDate = getETDateFromUTC(dateStr);
        const newKey = `lb:daily:${etDate}`;
        
        if (dateStr !== etDate) {
          console.log(`Daily: ${key} -> ${newKey}`);
          if (!migrationMap.has(newKey)) {
            migrationMap.set(newKey, []);
          }
          migrationMap.get(newKey).push({ oldKey: key, period: 'daily' });
        }
      } else if (period === 'weekly' && dateStr.match(/^\d{4}-W\d{1,2}$/)) {
        // For weekly, we need to check if the week number is different in ET
        // This is complex, so for now we'll keep weekly keys as-is
        console.log(`Weekly: ${key} (keeping as-is for now)`);
      }
    }
    
    // Perform migration
    console.log(`\nMigrating ${migrationMap.size} keys...\n`);
    
    for (const [newKey, sources] of migrationMap) {
      console.log(`\nProcessing ${newKey}:`);
      
      // Check if target key already exists
      const targetExists = await redis.exists(newKey);
      const targetCount = targetExists ? await redis.zcard(newKey) : 0;
      console.log(`  Target exists: ${targetExists} (${targetCount} entries)`);
      
      // Collect all scores from source keys
      const allScores = new Map(); // username -> best score entry
      
      // First, get existing scores from target if it exists
      if (targetExists) {
        const existingScores = await redis.zrange(newKey, 0, -1, { withScores: true });
        for (let i = 0; i < existingScores.length; i += 2) {
          try {
            const data = JSON.parse(existingScores[i]);
            const score = existingScores[i + 1];
            const username = data.username.toLowerCase();
            
            if (!allScores.has(username) || score > allScores.get(username).score) {
              allScores.set(username, { data: existingScores[i], score });
            }
          } catch (e) {
            console.log(`  Error parsing existing entry: ${e.message}`);
          }
        }
      }
      
      // Get scores from source keys
      for (const source of sources) {
        const sourceCount = await redis.zcard(source.oldKey);
        console.log(`  Source ${source.oldKey}: ${sourceCount} entries`);
        
        if (sourceCount > 0) {
          const scores = await redis.zrange(source.oldKey, 0, -1, { withScores: true });
          
          for (let i = 0; i < scores.length; i += 2) {
            try {
              const data = JSON.parse(scores[i]);
              const score = scores[i + 1];
              const username = data.username.toLowerCase();
              
              // Keep only the best score per user
              if (!allScores.has(username) || score > allScores.get(username).score) {
                allScores.set(username, { data: scores[i], score });
              }
            } catch (e) {
              console.log(`  Error parsing source entry: ${e.message}`);
            }
          }
        }
      }
      
      // Clear target key and repopulate with merged scores
      if (allScores.size > 0) {
        await redis.del(newKey);
        
        // Add all scores
        const members = [];
        for (const [username, entry] of allScores) {
          members.push({ score: entry.score, member: entry.data });
        }
        
        // Add in batches
        const batchSize = 100;
        for (let i = 0; i < members.length; i += batchSize) {
          const batch = members.slice(i, i + batchSize);
          await redis.zadd(newKey, ...batch);
        }
        
        console.log(`  Migrated ${allScores.size} unique users to ${newKey}`);
        stats[sources[0].period].migrated++;
        
        // Set expiration based on period
        if (newKey.includes('daily')) {
          await redis.expire(newKey, 604800); // 7 days
        } else if (newKey.includes('weekly')) {
          await redis.expire(newKey, 2592000); // 30 days
        } else if (newKey.includes('monthly')) {
          await redis.expire(newKey, 7776000); // 90 days
        }
      }
      
      // Delete source keys after successful migration
      for (const source of sources) {
        await redis.del(source.oldKey);
        console.log(`  Deleted source key: ${source.oldKey}`);
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(JSON.stringify(stats, null, 2));
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateLeaderboards().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});