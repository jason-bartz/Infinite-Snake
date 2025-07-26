#!/usr/bin/env node

// Admin script to clean suspicious leaderboard entries
// Usage: ADMIN_KEY=your-admin-key node admin/clean-leaderboard.js

const https = require('https');

const ADMIN_KEY = process.env.ADMIN_KEY;
const API_URL = process.env.API_URL || 'https://infinitesnake.com';

if (!ADMIN_KEY) {
  console.error('Error: ADMIN_KEY environment variable is required');
  console.error('Usage: ADMIN_KEY=your-admin-key node admin/clean-leaderboard.js');
  process.exit(1);
}

function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${json.error || 'Unknown error'}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function cleanLeaderboard() {
  console.log('Cleaning suspicious leaderboard entries...');
  
  try {
    // Clean suspicious scores
    const cleanResult = await makeRequest(
      `/api/leaderboard?action=clean&adminKey=${encodeURIComponent(ADMIN_KEY)}`,
      'DELETE'
    );
    
    console.log(`✓ Cleaned ${cleanResult.cleaned} suspicious entries`);
    
    // Get current leaderboard stats
    const stats = await makeRequest('/api/leaderboard?period=all&limit=10');
    
    console.log('\nTop 10 All-Time Scores:');
    stats.leaderboard.forEach((entry, index) => {
      console.log(
        `${index + 1}. ${entry.username} - ${entry.score.toLocaleString()} points` +
        ` (${entry.play_time}s, ${entry.elements_discovered} elements, ${entry.kills} kills)`
      );
    });
    
    console.log(`\nTotal entries: ${stats.pagination.total}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

async function viewLeaderboard(period = 'all') {
  console.log(`\nViewing ${period} leaderboard...`);
  
  try {
    const result = await makeRequest(`/api/leaderboard?period=${period}&limit=20`);
    
    console.log(`\n${period.toUpperCase()} Leaderboard (Top 20):`);
    console.log('='.repeat(80));
    
    result.leaderboard.forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleString();
      console.log(
        `${entry.rank}. ${entry.username.padEnd(20)} ${entry.score.toLocaleString().padStart(10)} pts` +
        `  ${entry.play_time}s  ${entry.elements_discovered} elem  ${entry.kills} kills  ${entry.country_code}  ${date}`
      );
    });
    
    console.log('='.repeat(80));
    console.log(`Total entries: ${result.pagination.total}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Main execution
(async () => {
  const action = process.argv[2] || 'clean';
  
  switch (action) {
    case 'clean':
      await cleanLeaderboard();
      break;
    case 'view':
      const period = process.argv[3] || 'all';
      await viewLeaderboard(period);
      break;
    case 'view-all':
      for (const period of ['daily', 'weekly', 'monthly', 'all']) {
        await viewLeaderboard(period);
      }
      break;
    default:
      console.log('Usage:');
      console.log('  ADMIN_KEY=key node admin/clean-leaderboard.js clean     # Clean suspicious scores');
      console.log('  ADMIN_KEY=key node admin/clean-leaderboard.js view      # View all-time leaderboard');
      console.log('  ADMIN_KEY=key node admin/clean-leaderboard.js view daily   # View daily leaderboard');
      console.log('  ADMIN_KEY=key node admin/clean-leaderboard.js view-all  # View all periods');
  }
})();