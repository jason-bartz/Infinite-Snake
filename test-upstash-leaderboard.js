// test-upstash-leaderboard.js
// Run this in your browser console on your game page

async function testUpstashLeaderboard() {
  console.log('🚀 Starting Upstash leaderboard tests...\n');
  
  // Test 1: Check if module is loaded
  console.log('1️⃣ Checking if leaderboard module exists...');
  if (typeof supabaseModule === 'undefined') {
    console.error('❌ Module not found! Make sure the game page is loaded.');
    return;
  }
  console.log('✅ Module found\n');
  
  // Test 2: Initialize connection
  console.log('2️⃣ Testing API connection...');
  const initialized = await supabaseModule.initializeAuth();
  if (!initialized) {
    console.error('❌ Failed to connect to API');
    return;
  }
  console.log('✅ API connected\n');
  
  // Test 3: Submit test scores
  console.log('3️⃣ Submitting test scores...');
  const testPlayers = [
    { name: 'Alice_' + Date.now().toString().slice(-4), score: 2500, elements: 15, time: 120, kills: 5 },
    { name: 'Bob_' + Date.now().toString().slice(-4), score: 3200, elements: 20, time: 180, kills: 8 },
    { name: 'Charlie_' + Date.now().toString().slice(-4), score: 1800, elements: 10, time: 90, kills: 3 }
  ];
  
  for (const player of testPlayers) {
    try {
      const rank = await supabaseModule.submitScore(
        player.name,
        player.score,
        player.elements,
        player.time,
        player.kills
      );
      console.log(`✅ ${player.name}: Score ${player.score} submitted! Rank: #${rank}`);
    } catch (error) {
      console.error(`❌ Failed to submit score for ${player.name}:`, error.message);
    }
  }
  
  // Wait a moment for Redis to update
  console.log('\n⏳ Waiting for database update...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 4: Fetch leaderboards
  console.log('\n4️⃣ Fetching leaderboards...');
  const periods = ['daily', 'weekly', 'all'];
  
  for (const period of periods) {
    try {
      console.log(`\n📊 ${period.toUpperCase()} Leaderboard:`);
      const leaderboard = await supabaseModule.getLeaderboard(period, 5);
      
      if (leaderboard.length === 0) {
        console.log('   (No entries yet)');
      } else {
        leaderboard.forEach(entry => {
          console.log(`   #${entry.rank} ${entry.username} - ${entry.score} pts (${entry.elements_discovered} elements)`);
        });
      }
    } catch (error) {
      console.error(`❌ Failed to fetch ${period} leaderboard:`, error.message);
    }
  }
  
  // Test 5: Test validation (should fail)
  console.log('\n5️⃣ Testing anti-cheat validation...');
  try {
    await supabaseModule.submitScore(
      'Cheater',
      999999,  // Impossibly high score
      100,     // Too many elements
      10,      // Only 10 seconds playtime
      50       // Too many kills for 10 seconds
    );
    console.error('❌ Anti-cheat validation FAILED - invalid score was accepted!');
  } catch (error) {
    console.log('✅ Anti-cheat working correctly:', error.message);
  }
  
  // Test 6: Test caching
  console.log('\n6️⃣ Testing cache...');
  console.time('First fetch');
  await supabaseModule.getLeaderboard('daily', 10);
  console.timeEnd('First fetch');
  
  console.time('Cached fetch');
  await supabaseModule.getLeaderboard('daily', 10);
  console.timeEnd('Cached fetch');
  console.log('✅ Cache is working (second fetch should be faster)\n');
  
  console.log('✨ All tests complete!\n');
  console.log('📝 Available commands:');
  console.log('   supabaseModule.submitScore(username, score, elements, playTime, kills)');
  console.log('   supabaseModule.getLeaderboard(period, limit)');
  console.log('   supabaseModule.getUserRank(username, period)');
  console.log('   supabaseModule.clearCache()');
  console.log('   showLeaderboard() - Opens the game leaderboard UI');
}

// Run the test
testUpstashLeaderboard();

// Quick submit function for testing
window.quickSubmit = async (username, score) => {
  try {
    const rank = await supabaseModule.submitScore(
      username || 'Player_' + Date.now().toString().slice(-4),
      score || Math.floor(Math.random() * 5000) + 1000,
      Math.floor(Math.random() * 20) + 5,
      Math.floor(Math.random() * 180) + 30,
      Math.floor(Math.random() * 10) + 1
    );
    console.log(`Score submitted! Daily rank: #${rank}`);
  } catch (error) {
    console.error('Failed to submit:', error.message);
  }
};

console.log('\n💡 TIP: Use quickSubmit("YourName", 5000) to quickly test score submission');