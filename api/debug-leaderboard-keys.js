// debug-leaderboard-keys.js
import { Redis } from '@upstash/redis';

// Initialize Redis client (same as leaderboard.js)
let redis;
let redisConnected = false;

try {
  redis = Redis.fromEnv();
  redisConnected = true;
} catch (error) {
  console.error('Redis.fromEnv() failed:', error.message);
  
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('Missing required environment variables');
    console.error('\nNOTE: This script requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
    console.error('These are typically set in Vercel dashboard, not in local .env file');
    console.error('\nTo run locally, you can:');
    console.error('1. Get the values from Vercel dashboard');
    console.error('2. Run with: UPSTASH_REDIS_REST_URL="..." UPSTASH_REDIS_REST_TOKEN="..." node api/debug-leaderboard-keys.js');
  } else {
    try {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      redisConnected = true;
    } catch (e) {
      console.error('Failed to initialize Redis client:', e.message);
    }
  }
}

// Helper to get week number (copied from leaderboard.js)
function getWeekNumber(date) {
  const d = new Date(date.getTime());
  const day = d.getDay() || 7;
  if (day !== 1) {
    d.setDate(d.getDate() - day + 1);
  }
  
  const yearOfMonday = d.getFullYear();
  const jan1 = new Date(yearOfMonday, 0, 1);
  const jan1Day = jan1.getDay() || 7;
  const firstMonday = new Date(yearOfMonday, 0, jan1Day === 1 ? 1 : 9 - jan1Day);
  
  const weekNum = Math.ceil(((d - firstMonday) / 86400000 + 1) / 7);
  
  if (weekNum === 0) {
    return getWeekNumber(new Date(yearOfMonday - 1, 11, 31));
  }
  
  return `${yearOfMonday}-W${String(weekNum).padStart(2, '0')}`;
}

// Main debug function
async function debugLeaderboardKeys() {
  console.log('=== LEADERBOARD DEBUG INFORMATION ===\n');
  
  // 1. Show current time in different timezones
  const now = new Date();
  console.log('Current Time Information:');
  console.log(`  UTC Time:     ${now.toISOString()}`);
  console.log(`  UTC Date:     ${now.toISOString().split('T')[0]}`);
  console.log(`  ET Time:      ${now.toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false })}`);
  
  // Get ET components
  const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const etYear = etTime.getFullYear();
  const etMonth = etTime.getMonth();
  const etDate = etTime.getDate();
  console.log(`  ET Date:      ${etYear}-${String(etMonth + 1).padStart(2, '0')}-${String(etDate).padStart(2, '0')}`);
  console.log('');
  
  // 2. Show what the expected keys should be
  console.log('Expected Keys (based on current ET time):');
  const expectedDaily = `lb:daily:${etYear}-${String(etMonth + 1).padStart(2, '0')}-${String(etDate).padStart(2, '0')}`;
  const expectedWeekly = `lb:weekly:${getWeekNumber(etTime)}`;
  const expectedMonthly = `lb:monthly:${etYear}-${String(etMonth + 1).padStart(2, '0')}`;
  
  console.log(`  Daily:   ${expectedDaily}`);
  console.log(`  Weekly:  ${expectedWeekly}`);
  console.log(`  Monthly: ${expectedMonthly}`);
  console.log(`  All:     lb:all`);
  console.log('');
  
  // 3. Show what UTC-based keys would be (for comparison)
  console.log('UTC-based Keys (old system):');
  const utcYear = now.getUTCFullYear();
  const utcMonth = now.getUTCMonth();
  const utcDate = now.getUTCDate();
  const utcDaily = `lb:daily:${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(utcDate).padStart(2, '0')}`;
  const utcWeekly = `lb:weekly:${getWeekNumber(now)}`;
  const utcMonthly = `lb:monthly:${utcYear}-${String(utcMonth + 1).padStart(2, '0')}`;
  
  console.log(`  Daily:   ${utcDaily}`);
  console.log(`  Weekly:  ${utcWeekly}`);
  console.log(`  Monthly: ${utcMonthly}`);
  console.log('');
  
  // 4. Get all leaderboard keys from Redis
  console.log('All Leaderboard Keys in Redis:');
  
  if (!redisConnected) {
    console.log('  [Unable to connect to Redis - see errors above]');
    console.log('');
  } else {
    try {
      const allKeys = await redis.keys('lb:*');
      
      if (!allKeys || allKeys.length === 0) {
        console.log('  No leaderboard keys found!');
      } else {
      // Sort keys for better readability
      allKeys.sort();
      
      for (const key of allKeys) {
        try {
          // Get the number of entries in each leaderboard
          const count = await redis.zcard(key);
          
          // Check if this is one of the expected keys
          let status = '';
          if (key === expectedDaily || key === expectedWeekly || key === expectedMonthly || key === 'lb:all') {
            status = ' [EXPECTED - ET]';
          } else if (key === utcDaily || key === utcWeekly || key === utcMonthly) {
            status = ' [OLD - UTC]';
          } else {
            status = ' [OUTDATED]';
          }
          
          console.log(`  ${key}: ${count} entries${status}`);
          
          // For keys with entries, show the top 3 scores
          if (count > 0) {
            const topScores = await redis.zrange(key, 0, 2, { rev: true, withScores: true });
            
            if (topScores && topScores.length > 0) {
              console.log('    Top scores:');
              for (let i = 0; i < topScores.length; i += 2) {
                try {
                  const member = topScores[i];
                  const score = topScores[i + 1];
                  const data = JSON.parse(member);
                  const date = new Date(data.timestamp);
                  console.log(`      ${(i/2) + 1}. ${data.username}: ${score} points (submitted: ${date.toISOString()})`);
                } catch (e) {
                  console.log(`      Error parsing entry: ${e.message}`);
                }
              }
            }
          }
          
        } catch (err) {
          console.log(`  ${key}: Error getting info - ${err.message}`);
        }
      }
    }
  } catch (err) {
    console.log(`  Error fetching keys: ${err.message}`);
  }
  }
  
  console.log('\n=== ANALYSIS ===');
  
  // 5. Check for timezone mismatch issues
  console.log('\nTimezone Analysis:');
  if (utcDate !== etDate) {
    console.log(`  WARNING: UTC date (${utcDate}) differs from ET date (${etDate})`);
    console.log('  This means scores submitted near midnight could appear in wrong day\'s leaderboard');
  } else {
    console.log('  UTC and ET are on the same date currently');
  }
  
  // 6. Recommendations
  console.log('\nRecommendations:');
  console.log('  1. The API should consistently use ET-based keys (as implemented)');
  console.log('  2. Old UTC-based keys should be cleaned up or migrated');
  console.log('  3. Consider adding a migration script to move scores from old keys to new keys');
  console.log('  4. Ensure the frontend is also using ET-based date calculations');
  
  process.exit(0);
}

// Run the debug script
debugLeaderboardKeys().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});