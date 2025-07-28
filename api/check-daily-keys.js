// Script to check for all daily keys and recover data
import { Redis } from '@upstash/redis';

let redis;
try {
  redis = Redis.fromEnv();
} catch (error) {
  console.error('Redis initialization failed:', error);
  process.exit(1);
}

async function checkDailyKeys() {
  console.log('Checking for daily leaderboard keys...\n');
  
  try {
    // Get all keys
    const allKeys = await redis.keys('lb:*');
    console.log(`Total keys found: ${allKeys.length}`);
    
    // Filter for daily keys
    const dailyKeys = allKeys.filter(key => key.includes('daily'));
    console.log(`Daily keys found: ${dailyKeys.length}`);
    
    if (dailyKeys.length > 0) {
      console.log('\nDaily keys:');
      for (const key of dailyKeys) {
        const count = await redis.zcard(key);
        console.log(`  ${key}: ${count} entries`);
      }
    } else {
      console.log('\nNo daily keys found!');
      
      // Check weekly keys for recent data
      console.log('\nChecking weekly keys for recent scores...');
      const weeklyKeys = allKeys.filter(key => key.includes('weekly'));
      
      for (const key of weeklyKeys) {
        console.log(`\nChecking ${key}:`);
        const count = await redis.zcard(key);
        console.log(`  Total entries: ${count}`);
        
        if (count > 0) {
          // Get a few samples to check dates
          const samples = await redis.zrange(key, 0, 4, { rev: true, withScores: true });
          
          console.log('  Recent entries:');
          for (let i = 0; i < samples.length && i < 10; i += 2) {
            try {
              const data = JSON.parse(samples[i]);
              const score = samples[i + 1];
              const date = new Date(data.timestamp);
              console.log(`    ${data.username}: ${score} points - ${date.toISOString()} (${date.toLocaleDateString('en-US')})`);
            } catch (e) {
              console.log('    [Error parsing entry]');
            }
          }
        }
      }
      
      // Suggest recovery options
      console.log('\n=== RECOVERY OPTIONS ===');
      console.log('1. Daily keys may have expired (7-day TTL)');
      console.log('2. You could recreate daily keys from weekly data by filtering by timestamp');
      console.log('3. Or simply wait for new scores to populate today\'s daily leaderboard');
    }
    
    // Check for any keys with dates
    console.log('\n\nAll keys with dates:');
    const datePattern = /\d{4}-\d{2}-\d{2}|W\d{1,2}/;
    const keysWithDates = allKeys.filter(key => datePattern.test(key));
    keysWithDates.forEach(key => console.log(`  ${key}`));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDailyKeys().then(() => {
  console.log('\nDone!');
  process.exit(0);
});