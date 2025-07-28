// debug-timezone-analysis.js
// This script shows the timezone differences and expected keys without requiring Redis connection

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

console.log('=== TIMEZONE ANALYSIS FOR LEADERBOARD KEYS ===\n');

// Show current time in different timezones
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

// Show what the expected keys should be
console.log('Expected Keys (based on current ET time):');
const expectedDaily = `lb:daily:${etYear}-${String(etMonth + 1).padStart(2, '0')}-${String(etDate).padStart(2, '0')}`;
const expectedWeekly = `lb:weekly:${getWeekNumber(etTime)}`;
const expectedMonthly = `lb:monthly:${etYear}-${String(etMonth + 1).padStart(2, '0')}`;

console.log(`  Daily:   ${expectedDaily}`);
console.log(`  Weekly:  ${expectedWeekly}`);
console.log(`  Monthly: ${expectedMonthly}`);
console.log(`  All:     lb:all`);
console.log('');

// Show what UTC-based keys would be (for comparison)
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

// Analyze the differences
console.log('=== KEY DIFFERENCES ===\n');

if (utcDate !== etDate) {
  console.log(`⚠️  DATE MISMATCH DETECTED!`);
  console.log(`  - UTC is on ${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(utcDate).padStart(2, '0')}`);
  console.log(`  - ET is on ${etYear}-${String(etMonth + 1).padStart(2, '0')}-${String(etDate).padStart(2, '0')}`);
  console.log(`  - This means scores submitted now will go to different daily leaderboards`);
  console.log(`  - UTC-based submissions would go to: ${utcDaily}`);
  console.log(`  - ET-based submissions would go to: ${expectedDaily}`);
  console.log('');
}

// Show time windows
console.log('Time Windows When Dates Differ:');
console.log('  - From 00:00 UTC to 04:00 UTC (midnight to 4 AM UTC)');
console.log('  - Which is 20:00 ET to 00:00 ET (8 PM to midnight ET)');
console.log('  - During this window, UTC is on the next day compared to ET');
console.log('');

// Show examples of old keys that might exist
console.log('Examples of Keys That Might Exist From Old UTC System:');
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(now);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

console.log(`  - lb:daily:${yesterday.toISOString().split('T')[0]} (yesterday UTC)`);
console.log(`  - lb:daily:${twoDaysAgo.toISOString().split('T')[0]} (2 days ago UTC)`);
console.log(`  - lb:daily:2025-07-26 (July 26 UTC)`);
console.log(`  - lb:daily:2025-07-27 (July 27 UTC)`);
console.log('');

// Recommendations
console.log('=== RECOMMENDATIONS ===\n');
console.log('1. The Issue:');
console.log('   - The leaderboard API now uses ET-based keys');
console.log('   - But old data might exist with UTC-based keys');
console.log('   - This causes confusion when viewing leaderboards');
console.log('');
console.log('2. To Fix:');
console.log('   - Run a migration to move scores from old UTC keys to new ET keys');
console.log('   - Or clear all old keys and start fresh');
console.log('   - Ensure frontend also uses ET-based date calculations');
console.log('');
console.log('3. To Debug Further:');
console.log('   - Get Redis credentials from Vercel dashboard');
console.log('   - Run: UPSTASH_REDIS_REST_URL="..." UPSTASH_REDIS_REST_TOKEN="..." node api/debug-leaderboard-keys.js');
console.log('   - This will show all existing keys and their contents');

process.exit(0);