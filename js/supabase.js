// js/supabase.js - Upstash Redis Leaderboard Client
// This maintains compatibility with your existing game code

const API_ENDPOINT = '/api/leaderboard';

// Cache for leaderboard data to reduce API calls
let leaderboardCache = {
  daily: { data: null, timestamp: 0 },
  weekly: { data: null, timestamp: 0 },
  monthly: { data: null, timestamp: 0 },
  all: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 30000; // 30 seconds

// Initialize (kept for compatibility with existing code)
export async function initializeAuth() {
  console.log('Upstash Leaderboard system initializing...');
  
  // Test API connection
  try {
    const response = await fetch(`${API_ENDPOINT}?limit=1`);
    if (response.ok) {
      console.log('✅ Leaderboard API connected successfully');
      return true;
    } else {
      console.error('❌ Leaderboard API returned error:', response.status);
    }
  } catch (error) {
    console.error('❌ Failed to connect to leaderboard API:', error);
  }
  return false;
}

// Start game session (kept for compatibility)
export async function startGameSession() {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log('Game session started:', sessionId);
  return sessionId;
}

// Submit score to leaderboard
export async function submitScore(username, score, elementsDiscovered, playTime, kills) {
  try {
    // Clear cache on new submission
    Object.keys(leaderboardCache).forEach(key => {
      leaderboardCache[key] = { data: null, timestamp: 0 };
    });
    
    console.log('Submitting score:', { username, score, elementsDiscovered, playTime, kills });
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        score,
        elements_discovered: elementsDiscovered,
        play_time: playTime,
        kills
      })
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'Failed to submit score');
    }
    
    console.log('✅ Score submitted successfully! Daily rank:', responseData.daily_rank);
    
    // Return the daily rank for the UI
    return responseData.daily_rank;
    
  } catch (error) {
    console.error('❌ Submit score error:', error);
    throw error;
  }
}

// Get leaderboard with caching
export async function getLeaderboard(period = 'daily', limit = 100) {
  try {
    // Check cache first
    const cached = leaderboardCache[period];
    if (cached && cached.data && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached ${period} leaderboard`);
      return cached.data.slice(0, limit);
    }
    
    console.log(`Fetching ${period} leaderboard...`);
    
    const response = await fetch(`${API_ENDPOINT}?period=${period}&limit=${limit}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch leaderboard');
    }
    
    const data = await response.json();
    
    // Cache the results
    if (data.leaderboard) {
      leaderboardCache[period] = {
        data: data.leaderboard,
        timestamp: Date.now()
      };
    }
    
    return data.leaderboard || [];
    
  } catch (error) {
    console.error('❌ Get leaderboard error:', error);
    
    // Return cached data if available, even if expired
    if (leaderboardCache[period] && leaderboardCache[period].data) {
      console.log('Returning stale cache due to error');
      return leaderboardCache[period].data.slice(0, limit);
    }
    
    throw error;
  }
}

// Get user's rank and score
export async function getUserRank(username, period = 'daily') {
  try {
    const response = await fetch(
      `${API_ENDPOINT}?period=${period}&limit=1&username=${encodeURIComponent(username)}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch user rank');
    }
    
    const data = await response.json();
    return data.userRank;
    
  } catch (error) {
    console.error('Get user rank error:', error);
    return null;
  }
}

// Clear cache (useful for testing)
export function clearCache() {
  Object.keys(leaderboardCache).forEach(key => {
    leaderboardCache[key] = { data: null, timestamp: 0 };
  });
  console.log('Leaderboard cache cleared');
}

// Utility function to format time
export function formatPlayTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Keep these exports for compatibility with existing code
export function generateDeviceFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);
  
  const dataURL = canvas.toDataURL();
  let hash = 0;
  for (let i = 0; i < dataURL.length; i++) {
    const char = dataURL.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}

// Keep this for compatibility but it's no longer used
export function addGameEvent(eventType, eventData) {
  // No-op - events are not tracked in Redis version
  console.log('Game event (not tracked):', eventType, eventData);
}

// No longer needed, but kept for compatibility
export async function getPlayerBestScore() {
  return null;
}

// No longer needed, but kept for compatibility  
export async function getPlayerRank(score, period = 'daily') {
  return null;
}

// For backward compatibility - no longer using Supabase
export const supabase = null;