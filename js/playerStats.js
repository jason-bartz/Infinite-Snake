// Player Statistics Tracking System
class PlayerStats {
    constructor() {
        this.STORAGE_KEY = 'infiniteSnakePlayerStats';
        this.VERSION = '2.0';
        this.stats = this.loadStats();
        this.sessionStartTime = Date.now();
        this.sessionStats = this.initSessionStats();
        this.saveDebounceTimer = null;
        this.initializeEventListeners();
    }

    initSessionStats() {
        return {
            startTime: Date.now(),
            score: 0,
            kills: 0,
            discoveries: new Set(),
            voidOrbs: 0,
            catalystGems: 0,
            deaths: 0,
            firstPlaceAchieved: false
        };
    }

    loadStats() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) return this.createDefaultStats();
            
            const parsed = JSON.parse(stored);
            if (parsed.version !== this.VERSION) {
                return this.migrateStats(parsed);
            }
            
            // Convert arrays back to Sets
            if (parsed.stats?.lifetime?.elementsDiscovered) {
                parsed.stats.lifetime.elementsDiscovered = new Set(parsed.stats.lifetime.elementsDiscovered);
            }
            if (parsed.stats?.lifetime?.daysPlayed) {
                parsed.stats.lifetime.daysPlayed = new Set(parsed.stats.lifetime.daysPlayed);
            }
            if (parsed.stats?.achievements?.playedDuringHours) {
                parsed.stats.achievements.playedDuringHours = new Set(parsed.stats.achievements.playedDuringHours);
            }
            if (parsed.stats?.achievements?.playedDuringMonths) {
                parsed.stats.achievements.playedDuringMonths = new Set(parsed.stats.achievements.playedDuringMonths);
            }
            
            return parsed;
        } catch (error) {
            console.error('Failed to load player stats:', error);
            return this.createDefaultStats();
        }
    }

    createDefaultStats() {
        return {
            version: this.VERSION,
            stats: {
                lifetime: {
                    totalScore: 0,
                    highScore: 0,
                    totalKills: 0,
                    totalDeaths: 0,
                    totalPlayTime: 0,
                    totalGamesPlayed: 0,
                    elementsDiscovered: new Set(),
                    daysPlayed: new Set(),
                    firstPlaceFinishes: 0,
                    monthlyLeaderboardWins: new Set()
                },
                powerups: {
                    voidOrbs: 0,
                    catalystGems: 0,
                    alchemyVisions: 0
                },
                achievements: {
                    killsInOneGame: 0,
                    killsWithoutDying: 0,
                    diedWithin30Seconds: 0,
                    playedDuringHours: new Set(),
                    playedDuringMonths: new Set()
                }
            }
        };
    }

    migrateStats(oldStats) {
        // Migration logic from old format to new format
        const newStats = this.createDefaultStats();
        
        // Migrate any existing data
        if (oldStats.highScore) {
            newStats.stats.lifetime.highScore = oldStats.highScore;
        }
        
        return newStats;
    }

    saveStats() {
        // Debounce saves to prevent excessive writes
        clearTimeout(this.saveDebounceTimer);
        this.saveDebounceTimer = setTimeout(() => {
            try {
                // Convert Sets to arrays for storage
                const toStore = JSON.parse(JSON.stringify(this.stats));
                toStore.stats.lifetime.elementsDiscovered = Array.from(this.stats.stats.lifetime.elementsDiscovered);
                toStore.stats.lifetime.daysPlayed = Array.from(this.stats.stats.lifetime.daysPlayed);
                toStore.stats.achievements.playedDuringHours = Array.from(this.stats.stats.achievements.playedDuringHours);
                toStore.stats.achievements.playedDuringMonths = Array.from(this.stats.stats.achievements.playedDuringMonths);
                
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
            } catch (error) {
                console.error('Failed to save player stats:', error);
            }
        }, 500);
    }

    // Game Event Handlers
    updateScore(score) {
        // Only update current session score, not total
        this.sessionStats.score = score;
        // Update high score if needed
        if (score > this.stats.stats.lifetime.highScore) {
            this.stats.stats.lifetime.highScore = score;
            this.saveStats();
        }
    }
    
    // Record final score at game end
    recordFinalScore(finalScore) {
        // Add final score to lifetime total only once at game end
        this.stats.stats.lifetime.totalScore += finalScore;
        // Update high score if needed
        if (finalScore > this.stats.stats.lifetime.highScore) {
            this.stats.stats.lifetime.highScore = finalScore;
        }
        this.saveStats();
    }

    recordKill() {
        this.sessionStats.kills++;
        this.stats.stats.lifetime.totalKills++;
        
        // Track max kills in one game
        if (this.sessionStats.kills > this.stats.stats.achievements.killsInOneGame) {
            this.stats.stats.achievements.killsInOneGame = this.sessionStats.kills;
        }
        
        this.saveStats();
    }

    recordDeath() {
        this.sessionStats.deaths++;
        this.stats.stats.lifetime.totalDeaths++;
        
        // Check if died within 30 seconds
        const timeSinceStart = (Date.now() - this.sessionStats.startTime) / 1000;
        if (timeSinceStart <= 30) {
            this.stats.stats.achievements.diedWithin30Seconds++;
        }
        
        this.saveStats();
    }

    recordDiscovery(element) {
        this.sessionStats.discoveries.add(element);
        this.stats.stats.lifetime.elementsDiscovered.add(element);
        this.saveStats();
    }

    recordPowerupCollected(type) {
        switch(type) {
            case 'void':
                this.sessionStats.voidOrbs++;
                this.stats.stats.powerups.voidOrbs++;
                break;
            case 'catalyst':
                this.sessionStats.catalystGems++;
                this.stats.stats.powerups.catalystGems++;
                break;
            case 'alchemy':
                this.stats.stats.powerups.alchemyVisions++;
                break;
        }
        this.saveStats();
    }

    recordGameStart() {
        this.sessionStats = this.initSessionStats();
        this.stats.stats.lifetime.totalGamesPlayed++;
        
        // Track day played
        const today = new Date().toDateString();
        this.stats.stats.lifetime.daysPlayed.add(today);
        
        // Track hour played
        const hour = new Date().getHours();
        this.stats.stats.achievements.playedDuringHours.add(hour);
        
        // Track month played
        const month = new Date().getMonth();
        this.stats.stats.achievements.playedDuringMonths.add(month);
        
        this.saveStats();
    }

    recordGameEnd(finalScore) {
        // Record final score to lifetime total
        if (finalScore !== undefined && finalScore > 0) {
            this.recordFinalScore(finalScore);
        }
        
        // Update total play time
        const sessionTime = (Date.now() - this.sessionStats.startTime) / 1000 / 60; // in minutes
        this.stats.stats.lifetime.totalPlayTime += sessionTime;
        
        this.saveStats();
    }

    recordFirstPlace() {
        // Add flag to prevent multiple recordings per game
        if (!this.sessionStats.firstPlaceAchieved) {
            this.sessionStats.firstPlaceAchieved = true;
            this.stats.stats.lifetime.firstPlaceFinishes++;
            this.saveStats();
        }
    }

    recordKillsWithoutDying(count) {
        if (count > this.stats.stats.achievements.killsWithoutDying) {
            this.stats.stats.achievements.killsWithoutDying = count;
        }
        this.saveStats();
    }

    recordMonthlyLeaderboardWin(month, year) {
        const key = `${year}-${month}`;
        this.stats.stats.lifetime.monthlyLeaderboardWins.add(key);
        this.saveStats();
    }

    // Getters for unlock checking
    getTotalDeaths() {
        return this.stats.stats.lifetime.totalDeaths;
    }

    getTotalGamesPlayed() {
        return this.stats.stats.lifetime.totalGamesPlayed;
    }

    getTotalPlayTime() {
        return this.stats.stats.lifetime.totalPlayTime;
    }

    getTotalDiscoveries() {
        return this.stats.stats.lifetime.elementsDiscovered.size;
    }

    getTotalKills() {
        return this.stats.stats.lifetime.totalKills;
    }

    getTotalScore() {
        return this.stats.stats.lifetime.totalScore;
    }

    getHighScore() {
        return this.stats.stats.lifetime.highScore;
    }

    getFirstPlaceFinishes() {
        return this.stats.stats.lifetime.firstPlaceFinishes;
    }

    getDaysPlayed() {
        return this.stats.stats.lifetime.daysPlayed.size;
    }

    getVoidOrbsEaten() {
        return this.stats.stats.powerups.voidOrbs;
    }

    getCatalystGemsEaten() {
        return this.stats.stats.powerups.catalystGems;
    }

    getMaxKillsInOneGame() {
        return this.stats.stats.achievements.killsInOneGame;
    }

    getKillsWithoutDying() {
        return this.stats.stats.achievements.killsWithoutDying;
    }

    getDiedWithin30Seconds() {
        return this.stats.stats.achievements.diedWithin30Seconds;
    }

    getMonthlyLeaderboardWins() {
        return this.stats.stats.lifetime.monthlyLeaderboardWins.size;
    }

    hasPlayedBetweenHours(startHour, endHour) {
        for (let hour = startHour; hour <= endHour; hour++) {
            if (this.stats.stats.achievements.playedDuringHours.has(hour)) {
                return true;
            }
        }
        return false;
    }

    hasPlayedDuringMonths(startMonth, endMonth) {
        for (let month = startMonth; month <= endMonth; month++) {
            if (this.stats.stats.achievements.playedDuringMonths.has(month)) {
                return true;
            }
        }
        return false;
    }

    initializeEventListeners() {
        // Hook into game events
        window.addEventListener('gameStart', () => this.recordGameStart());
        window.addEventListener('gameEnd', (e) => this.recordGameEnd(e.detail?.score));
        window.addEventListener('playerDeath', () => this.recordDeath());
        window.addEventListener('enemyKilled', () => this.recordKill());
        window.addEventListener('elementDiscovered', (e) => this.recordDiscovery(e.detail.element));
        window.addEventListener('powerupCollected', (e) => this.recordPowerupCollected(e.detail.type));
        window.addEventListener('scoreUpdate', (e) => this.updateScore(e.detail.score));
        window.addEventListener('firstPlace', () => this.recordFirstPlace());
    }

    // Debug method to view all stats
    debugStats() {
        console.log('Player Stats:', this.stats);
        console.log('Session Stats:', this.sessionStats);
    }
    
    // Reset all stats
    resetAllStats() {
        if (confirm('Are you sure you want to reset ALL player statistics? This cannot be undone!')) {
            localStorage.removeItem(this.STORAGE_KEY);
            this.stats = this.createDefaultStats();
            this.sessionStats = this.initSessionStats();
            console.log('All player stats have been reset!');
            window.location.reload();
        }
    }
    
    // Reset ALL game data including stats, skins, and discoveries
    resetEverything() {
        if (confirm('⚠️ WARNING: This will reset EVERYTHING!\n\n• All player statistics\n• All unlocked skins\n• All discovered elements\n• All game settings\n\nAre you absolutely sure?')) {
            // Reset player stats
            localStorage.removeItem(this.STORAGE_KEY);
            // Reset unlocked skins (multiple keys)
            localStorage.removeItem('infiniteSnakeUnlocks');
            localStorage.removeItem('unlockedSkins');
            localStorage.removeItem('currentSkin');
            // Reset skin selection
            localStorage.removeItem('infiniteSnakeSkinData');
            // Reset discovered elements
            localStorage.removeItem('discoveredElements');
            localStorage.removeItem('allTimeDiscoveries');
            // Reset game settings
            localStorage.removeItem('gameSettings');
            // Reset element combos (if any)
            localStorage.removeItem('elementCombinations');
            // Reset high score
            localStorage.removeItem('highScore');
            // Reset leaderboard settings
            localStorage.removeItem('leaderboardCollapsed');
            localStorage.removeItem('lastUsername');
            
            console.log('🔄 ALL game data has been reset!');
            console.log('Stats, skins, discoveries, and settings have been cleared.');
            
            // Reload the page
            window.location.reload();
        }
    }
}

// Initialize player stats globally
window.playerStats = new PlayerStats();