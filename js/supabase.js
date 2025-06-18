// Supabase configuration
const SUPABASE_URL = 'https://aftlnhoetforoghbqfhs.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdGxuaG9ldGZvcm9naGJxZmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxOTc5MjcsImV4cCI6MjA2NTc3MzkyN30.oIXwvY4Ajg-QT7GjDh3rA4Q3Ys4gKOKQEEcvM-K-vYs'

// Import Supabase from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Initialize anonymous auth
export async function initializeAuth() {
    try {
        let { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            const { data, error } = await supabase.auth.signInAnonymously()
            if (error) throw error
            console.log('Anonymous user created:', data.user.id)
        }
        
        return true
    } catch (error) {
        console.error('Auth error:', error)
        return false
    }
}

// Device fingerprint for security
export function generateDeviceFingerprint() {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillText('fingerprint', 2, 2)
    
    const dataURL = canvas.toDataURL()
    let hash = 0
    for (let i = 0; i < dataURL.length; i++) {
        const char = dataURL.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash
    }
    
    return Math.abs(hash).toString(36)
}

// Game session management
let currentGameSession = null

export async function startGameSession() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        
        const sessionId = crypto.randomUUID()
        currentGameSession = {
            id: sessionId,
            user_id: user.id,
            started_at: new Date().toISOString(),
            game_events: []
        }
        
        // Create session in database
        const { data, error } = await supabase
            .from('game_sessions')
            .insert({
                id: sessionId,
                user_id: user.id,
                started_at: currentGameSession.started_at,
                status: 'active'
            })
            
        if (error) {
            console.error('Error creating game session:', error)
            return null
        }
        
        return sessionId
    } catch (error) {
        console.error('Session error:', error)
        return null
    }
}

export function addGameEvent(eventType, eventData) {
    if (!currentGameSession) return
    
    currentGameSession.game_events.push({
        type: eventType,
        data: eventData,
        timestamp: Date.now()
    })
}

// Submit score to leaderboard
export async function submitScore(username, score, elementsDiscovered, playTime, kills) {
    try {
        // Ensure auth is initialized
        const authOk = await initializeAuth()
        if (!authOk) {
            throw new Error('Authentication failed')
        }
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            throw new Error('No authenticated user')
        }
        
        // Call the submit_game_score function
        const { data, error } = await supabase.rpc('submit_game_score', {
            p_session_id: currentGameSession?.id || null,
            p_username: username,
            p_score: score,
            p_elements: elementsDiscovered,
            p_play_time: Math.floor(playTime),
            p_kills: kills,
            p_game_events: currentGameSession?.game_events || []
        })
        
        if (error) {
            console.error('Score submission error:', error)
            throw error
        }
        
        return data
    } catch (error) {
        console.error('Error submitting score:', error)
        throw error
    }
}

// Get leaderboard data
export async function getLeaderboard(period = 'daily', limit = 100, offset = 0) {
    try {
        const { data, error } = await supabase.rpc('get_leaderboard', {
            p_period: period,
            p_limit: limit,
            p_offset: offset
        })
        
        if (error) {
            console.error('Leaderboard fetch error:', error)
            throw error
        }
        
        return data || []
    } catch (error) {
        console.error('Error fetching leaderboard:', error)
        return []
    }
}

// Get player's rank for a specific score
export async function getPlayerRank(score, period = 'daily') {
    try {
        const { data, error } = await supabase
            .from('scores')
            .select('score', { count: 'exact' })
            .gt('score', score)
            
        if (error) {
            console.error('Rank fetch error:', error)
            return null
        }
        
        return (data?.length || 0) + 1
    } catch (error) {
        console.error('Error fetching rank:', error)
        return null
    }
}

// Get player's best score
export async function getPlayerBestScore() {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        
        const { data, error } = await supabase
            .from('scores')
            .select('score')
            .eq('user_id', user.id)
            .order('score', { ascending: false })
            .limit(1)
            
        if (error) {
            console.error('Best score fetch error:', error)
            return null
        }
        
        return data?.[0]?.score || 0
    } catch (error) {
        console.error('Error fetching best score:', error)
        return null
    }
}