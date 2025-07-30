/**
 * Leaderboard Client - Upstash Redis Integration
 * Manages score submission and leaderboard data retrieval
 */

const gameLogger = window.gameLogger || console;

const API_ENDPOINT = '/api/leaderboard';

let LEADERBOARD_ENABLED = true;

// Leaderboard data caching to minimize API requests
let leaderboardCache = {
  daily: { data: null, timestamp: 0 },
  weekly: { data: null, timestamp: 0 },
  monthly: { data: null, timestamp: 0 },
  all: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 30000; // Cache TTL: 30 seconds

/**
 * Initialize leaderboard system and test API connectivity
 * @returns {Promise<boolean>} Connection status
 */
export async function initializeLeaderboard() {
  
  // API connectivity test
  try {
    const response = await fetch(`${API_ENDPOINT}?limit=1`);
    if (response.ok) {
      return true;
    } else {
      gameLogger.error('LEADERBOARD', 'Leaderboard API returned error:', response.status);
    }
  } catch (error) {
    gameLogger.error('LEADERBOARD', 'Failed to connect to leaderboard API:', error);
  }
  return false;
}

/**
 * Start game session - Legacy compatibility method
 * @returns {Promise<string>} Session identifier
 */
export async function startGameSession() {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  gameLogger.debug('LEADERBOARD', 'Game session started:', sessionId);
  return sessionId;
}

/**
 * Submit player score to leaderboard
 * @param {string} username - Player name
 * @param {number} score - Final score
 * @param {number} elementsDiscovered - Total elements discovered
 * @param {number} playTime - Game duration in seconds
 * @param {number} kills - Total eliminations
 * @param {string} skin - Player skin identifier
 * @returns {Promise<Object>} Submission result with rankings
 */
export async function submitScore(username, score, elementsDiscovered, playTime, kills, skin) {
  try {
    if (!LEADERBOARD_ENABLED) {
      gameLogger.debug('LEADERBOARD', 'Leaderboard is disabled');
      return null;
    }
    
    // Clear cache on new submission
    Object.keys(leaderboardCache).forEach(key => {
      leaderboardCache[key] = { data: null, timestamp: 0 };
    });
    
    gameLogger.info('LEADERBOARD', 'Submitting score:', { username, score, elementsDiscovered, playTime, kills, skin });
    gameLogger.debug('LEADERBOARD', 'API Endpoint:', API_ENDPOINT);
    
    const requestBody = {
      username,
      score,
      elements_discovered: elementsDiscovered,
      play_time: playTime,
      kills,
      skin: skin || 'snake-default-green'
    };
    gameLogger.debug('LEADERBOARD', 'Request body:', requestBody);
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    gameLogger.debug('LEADERBOARD', 'Response status:', response.status, response.statusText);
    
    const responseData = await response.json();
    gameLogger.debug('LEADERBOARD', 'Response data:', responseData);
    
    if (!response.ok) {
      gameLogger.error('LEADERBOARD', 'API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData.error,
        details: responseData
      });
      
      // Handle specific error cases with user-friendly messages
      if (response.status === 429) {
        // Rate limiting
        const retryAfter = responseData.retryAfter || 60;
        throw new Error(`Too many submissions. Please wait ${retryAfter} seconds before trying again.`);
      } else if (responseData.error && responseData.error.includes('inappropriate content')) {
        throw new Error('Username contains inappropriate content. Please choose a different name.');
      } else if (responseData.error && responseData.error.includes('too high for play time')) {
        throw new Error('Score validation failed. This score appears to be invalid.');
      } else if (responseData.error && responseData.error.includes('Too many elements')) {
        throw new Error('Invalid game data detected.');
      }
      
      throw new Error(responseData.error || 'Failed to submit score');
    }
    
    // Return both daily and weekly ranks
    // For backward compatibility, if only daily_rank is requested (no weekly_rank in response),
    // return just the daily_rank as before
    if (responseData.weekly_rank !== undefined) {
      // New API that returns both ranks
      return {
        daily_rank: responseData.daily_rank,
        weekly_rank: responseData.weekly_rank
      };
    }
    
    // Old API behavior for backward compatibility
    if (responseData.daily_rank === null) {
      // Score submitted but rank is null
      return 'Submitted'; // Return a string to indicate successful submission without rank
    }
    
    return responseData.daily_rank;
    
  } catch (error) {
    gameLogger.error('LEADERBOARD', 'Submit score error:', error);
    
    // Disable leaderboard if API is not available
    if (error.message.includes('405') || error.message.includes('404') || error.message.includes('Failed to fetch')) {
      LEADERBOARD_ENABLED = false;
      gameLogger.warn('LEADERBOARD', 'Disabling leaderboard due to API unavailability');
      return null;
    }
    
    throw error;
  }
}

// Get leaderboard with caching
export async function getLeaderboard(period = 'daily', limit = 100) {
  try {
    // Check cache first
    const cached = leaderboardCache[period];
    if (cached && cached.data && Date.now() - cached.timestamp < CACHE_DURATION) {
      // Using cached leaderboard
      return cached.data.slice(0, limit);
    }
    
    
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
    gameLogger.error('LEADERBOARD', 'Get leaderboard error:', error);
    
    // Return cached data if available, even if expired
    if (leaderboardCache[period] && leaderboardCache[period].data) {
      gameLogger.warn('LEADERBOARD', 'Returning stale cache due to error');
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
    gameLogger.error('LEADERBOARD', 'Get user rank error:', error);
    return null;
  }
}

// Clear cache (useful for testing)
export function clearCache() {
  Object.keys(leaderboardCache).forEach(key => {
    leaderboardCache[key] = { data: null, timestamp: 0 };
  });
  gameLogger.debug('LEADERBOARD', 'Leaderboard cache cleared');
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
  gameLogger.debug('LEADERBOARD', 'Game event (not tracked):', eventType, eventData);
}

// No longer needed, but kept for compatibility
export async function getPlayerBestScore() {
  return null;
}

// No longer needed, but kept for compatibility  
export async function getPlayerRank(score, period = 'daily') {
  return null;
}

// Backward compatibility alias
export const initializeAuth = initializeLeaderboard;

