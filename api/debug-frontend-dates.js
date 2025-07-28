// debug-frontend-dates.js
// This script shows how dates might be calculated differently between frontend and backend

console.log('=== FRONTEND VS BACKEND DATE CALCULATIONS ===\n');

// Current time
const now = new Date();
console.log('Current Time:');
console.log(`  Browser/Local: ${now.toString()}`);
console.log(`  ISO (UTC):     ${now.toISOString()}`);
console.log('');

// Frontend might use local date
console.log('Frontend (using local date methods):');
const frontendYear = now.getFullYear();
const frontendMonth = now.getMonth();
const frontendDate = now.getDate();
const frontendKey = `lb:daily:${frontendYear}-${String(frontendMonth + 1).padStart(2, '0')}-${String(frontendDate).padStart(2, '0')}`;
console.log(`  Local Date: ${frontendYear}-${String(frontendMonth + 1).padStart(2, '0')}-${String(frontendDate).padStart(2, '0')}`);
console.log(`  Would request: ${frontendKey}`);
console.log('');

// Frontend using UTC
console.log('Frontend (if using UTC methods):');
const utcYear = now.getUTCFullYear();
const utcMonth = now.getUTCMonth();
const utcDate = now.getUTCDate();
const utcKey = `lb:daily:${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(utcDate).padStart(2, '0')}`;
console.log(`  UTC Date: ${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(utcDate).padStart(2, '0')}`);
console.log(`  Would request: ${utcKey}`);
console.log('');

// Backend using ET
console.log('Backend (using ET):');
const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
const etYear = etTime.getFullYear();
const etMonth = etTime.getMonth();
const etDate = etTime.getDate();
const etKey = `lb:daily:${etYear}-${String(etMonth + 1).padStart(2, '0')}-${String(etDate).padStart(2, '0')}`;
console.log(`  ET Date: ${etYear}-${String(etMonth + 1).padStart(2, '0')}-${String(etDate).padStart(2, '0')}`);
console.log(`  Stores to: ${etKey}`);
console.log('');

// Show potential mismatches
console.log('=== POTENTIAL MISMATCHES ===\n');

if (frontendKey !== etKey) {
  console.log('⚠️  Frontend (local) vs Backend (ET) mismatch!');
  console.log(`  Frontend requests: ${frontendKey}`);
  console.log(`  Backend stores to: ${etKey}`);
  console.log('  This could cause frontend to request wrong day\'s leaderboard');
  console.log('');
}

if (utcKey !== etKey) {
  console.log('⚠️  Frontend (UTC) vs Backend (ET) mismatch!');
  console.log(`  Frontend requests: ${utcKey}`);
  console.log(`  Backend stores to: ${etKey}`);
  console.log('  This could cause frontend to request wrong day\'s leaderboard');
  console.log('');
}

// Show the solution
console.log('=== SOLUTION ===\n');
console.log('The frontend needs to calculate dates the same way as the backend:');
console.log('');
console.log('// Frontend code should use:');
console.log('const now = new Date();');
console.log('const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));');
console.log('const etYear = easternTime.getFullYear();');
console.log('const etMonth = easternTime.getMonth();');
console.log('const etDate = easternTime.getDate();');
console.log('const dailyKey = `daily:${etYear}-${String(etMonth + 1).padStart(2, "0")}-${String(etDate).padStart(2, "0")}`;');
console.log('');
console.log('This ensures both frontend and backend use the same ET-based dates.');

process.exit(0);