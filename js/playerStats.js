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
            if (parsed.stats?.lifetime?.monthlyLeaderboardWins) {
                parsed.stats.lifetime.monthlyLeaderboardWins = new Set(parsed.stats.lifetime.monthlyLeaderboardWins);
            }
            if (parsed.stats?.achievements?.playedDuringHours) {
                parsed.stats.achievements.playedDuringHours = new Set(parsed.stats.achievements.playedDuringHours);
            }
            if (parsed.stats?.achievements?.playedDuringMonths) {
                parsed.stats.achievements.playedDuringMonths = new Set(parsed.stats.achievements.playedDuringMonths);
            }
            
            // Ensure gamesPlayedByMode exists for backward compatibility
            if (!parsed.stats?.lifetime?.gamesPlayedByMode) {
                parsed.stats.lifetime.gamesPlayedByMode = {
                    classic: 0,
                    infinite: 0,
                    cozy: 0,
                    discovery: 0,
                    points: 0
                };
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
                    monthlyLeaderboardWins: new Set(),
                    gamesPlayedByMode: {
                        classic: 0,
                        infinite: 0,
                        cozy: 0,
                        discovery: 0,
                        points: 0
                    }
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
                    playedDuringMonths: new Set(),
                    gamesInTimeWindows: {},
                    bestMonthlyRank: null
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
        
        // Migrate v2.0 stats if they exist
        if (oldStats.stats) {
            // Deep copy all existing stats
            if (oldStats.stats.lifetime) {
                Object.assign(newStats.stats.lifetime, oldStats.stats.lifetime);
                // Ensure gamesPlayedByMode exists even for old data
                if (!oldStats.stats.lifetime.gamesPlayedByMode) {
                    newStats.stats.lifetime.gamesPlayedByMode = {
                        classic: 0,
                        infinite: 0,
                        cozy: 0,
                        discovery: 0,
                        points: 0
                    };
                }
            }
            if (oldStats.stats.powerups) {
                Object.assign(newStats.stats.powerups, oldStats.stats.powerups);
            }
            if (oldStats.stats.achievements) {
                Object.assign(newStats.stats.achievements, oldStats.stats.achievements);
                
                // Migrate bestDailyRank/bestWeeklyRank to bestMonthlyRank if it exists
                if (oldStats.stats.achievements.bestWeeklyRank !== undefined) {
                    newStats.stats.achievements.bestMonthlyRank = oldStats.stats.achievements.bestWeeklyRank;
                } else if (oldStats.stats.achievements.bestDailyRank !== undefined) {
                    newStats.stats.achievements.bestMonthlyRank = oldStats.stats.achievements.bestDailyRank;
                }
            }
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
                toStore.stats.lifetime.monthlyLeaderboardWins = Array.from(this.stats.stats.lifetime.monthlyLeaderboardWins);
                toStore.stats.achievements.playedDuringHours = Array.from(this.stats.stats.achievements.playedDuringHours);
                toStore.stats.achievements.playedDuringMonths = Array.from(this.stats.stats.achievements.playedDuringMonths);
                
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toStore));
                
                // Check for new lore unlocks when stats are saved
                if (window.loreUnlockManager && window.loreUnlockManager.checkAllLoreUnlocks) {
                    window.loreUnlockManager.checkAllLoreUnlocks();
                }
                
                // Also check skin unlocks
                if (window.unlockManager && window.unlockManager.checkAllUnlocks) {
                    window.unlockManager.checkAllUnlocks();
                }
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
        console.log('[DEATH TRACKING] recordDeath called in PlayerStats');
        this.sessionStats.deaths++;
        this.stats.stats.lifetime.totalDeaths++;
        console.log('[DEATH TRACKING] Total deaths now:', this.stats.stats.lifetime.totalDeaths);
        
        // Check if died within 30 seconds
        const timeSinceStart = (Date.now() - this.sessionStats.startTime) / 1000;
        if (timeSinceStart <= 30) {
            this.stats.stats.achievements.diedWithin30Seconds++;
        }
        
        this.saveStats();
    }

    recordBossKill() {
        
        // Track session boss kills if needed
        }
        
        // Track most bosses in one game
        if (!this.stats.stats.achievements.mostBossesInGame) {
            this.stats.stats.achievements.mostBossesInGame = 0;
        }
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
            case 'voidOrb':
                this.sessionStats.voidOrbs++;
                this.stats.stats.powerups.voidOrbs++;
                break;
            case 'catalyst':
            case 'catalystGem':
                this.sessionStats.catalystGems++;
                this.stats.stats.powerups.catalystGems++;
                break;
            case 'alchemy':
            case 'alchemyVision':
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
        
        // Track games in time windows (for Midnight skin)
        if (!this.stats.stats.achievements.gamesInTimeWindows) {
            this.stats.stats.achievements.gamesInTimeWindows = {};
        }
        // Check midnight window (0-3 AM)
        if (hour >= 0 && hour <= 3) {
            const key = '0-3';
            this.stats.stats.achievements.gamesInTimeWindows[key] = 
                (this.stats.stats.achievements.gamesInTimeWindows[key] || 0) + 1;
        }
        
        // Track month played
        const month = new Date().getMonth();
        this.stats.stats.achievements.playedDuringMonths.add(month);
        
        this.saveStats();
        
        // Check lore unlocks at game start (for time-based unlocks)
        setTimeout(() => {
            this.checkLoreUnlocks();
        }, 1000);
    }

    recordGameEnd(finalScore, gameMode) {
        console.log('[DEBUG] PlayerStats.recordGameEnd called with mode:', gameMode);
        
        // Record final score to lifetime total
        if (finalScore !== undefined && finalScore > 0) {
            this.recordFinalScore(finalScore);
        }
        
        // Update total play time
        const sessionTime = (Date.now() - this.sessionStats.startTime) / 1000 / 60; // in minutes
        this.stats.stats.lifetime.totalPlayTime += sessionTime;
        
        // Track games played by mode
        const mode = gameMode || window.gameMode || 'infinite'; // Fallback to window.gameMode or default to infinite
        console.log('[DEBUG] Recording game for mode:', mode);
        console.log('[DEBUG] Before increment - cozy games:', this.stats.stats.lifetime.gamesPlayedByMode.cozy);
        
        if (this.stats.stats.lifetime.gamesPlayedByMode && this.stats.stats.lifetime.gamesPlayedByMode.hasOwnProperty(mode)) {
            this.stats.stats.lifetime.gamesPlayedByMode[mode]++;
        }
        
        console.log('[DEBUG] After increment - cozy games:', this.stats.stats.lifetime.gamesPlayedByMode.cozy);
        
        this.saveStats();
        
        // Check for lore unlocks after saving stats
        if (window.loreUnlockManager && window.loreUnlockManager.checkAllLoreUnlocks) {
            setTimeout(() => {
                window.loreUnlockManager.checkAllLoreUnlocks();
            }, 100);
        }
    }

    recordFirstPlace() {
        // Add flag to prevent multiple recordings per game
        if (!this.sessionStats.firstPlaceAchieved) {
            this.sessionStats.firstPlaceAchieved = true;
            this.stats.stats.lifetime.firstPlaceFinishes++;
            this.saveStats();
        }
    }

    recordLeaderboardRank(rank, isMonthly = true) {
        // Only record numeric ranks (not 'Submitted' or other non-numeric values)
        if (typeof rank === 'number' && rank > 0) {
            // Track monthly rank
            if (isMonthly) {
                if (this.stats.stats.achievements.bestMonthlyRank === null || 
                    rank < this.stats.stats.achievements.bestMonthlyRank) {
                    this.stats.stats.achievements.bestMonthlyRank = rank;
                    this.saveStats();
                }
            }
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
        if (this.stats.stats.lifetime.monthlyLeaderboardWins && this.stats.stats.lifetime.monthlyLeaderboardWins.size !== undefined) {
            return this.stats.stats.lifetime.monthlyLeaderboardWins.size;
        }
        return 0;
    }
    
    getCurrentSessionDuration() {
        // Return current session duration in minutes
        return Math.floor((Date.now() - this.sessionStartTime) / (1000 * 60));
    }

    getGamesPlayedByMode(mode) {
        if (this.stats.stats.lifetime.gamesPlayedByMode && this.stats.stats.lifetime.gamesPlayedByMode[mode] !== undefined) {
            return this.stats.stats.lifetime.gamesPlayedByMode[mode];
        }
        return 0;
    }

    hasPlayedBetweenHours(startHour, endHour) {
        for (let hour = startHour; hour <= endHour; hour++) {
            if (this.stats.stats.achievements.playedDuringHours.has(hour)) {
                return true;
            }
        }
        return false;
    }
    
    getGamesPlayedBetweenHours(startHour, endHour) {
        // Track games played in specific time windows
        if (!this.stats.stats.achievements.gamesInTimeWindows) {
            this.stats.stats.achievements.gamesInTimeWindows = {};
        }
        
        const key = `${startHour}-${endHour}`;
        return this.stats.stats.achievements.gamesInTimeWindows[key] || 0;
    }

    hasPlayedDuringMonths(startMonth, endMonth) {
        for (let month = startMonth; month <= endMonth; month++) {
            if (this.stats.stats.achievements.playedDuringMonths.has(month)) {
                return true;
            }
        }
        return false;
    }
    
    // Additional getter methods for lore unlock criteria
    getBestKillsInGame() {
        return this.getMaxKillsInOneGame();
    }
    
    getBestComboStreak() {
        return this.stats.stats.achievements.bestComboStreak || 0;
    }
    
    getTotalBossKills() {
    }
    
    getWeekendDaysPlayed() {
        return this.stats.stats.achievements.weekendDaysPlayed || 0;
    }
    
    getMostNewElementsInGame() {
        return this.stats.stats.achievements.mostNewElementsInGame || 0;
    }
    
    getBestDayStreak() {
        return this.stats.stats.achievements.bestDayStreak || 0;
    }
    
    getNightOwlDays() {
        return this.stats.stats.achievements.nightOwlDays || 0;
    }
    
    getMostBossesInGame() {
        return this.stats.stats.achievements.mostBossesInGame || 0;
    }
    
    getBestSurvivalTime() {
        return this.stats.stats.achievements.bestSurvivalTime || 0;
    }
    
    getLegendaryDiscoveries() {
        return this.stats.stats.achievements.legendaryDiscoveries || 0;
    }
    
    getMostVoidOrbsInGame() {
        return this.stats.stats.achievements.mostVoidOrbsInGame || 0;
    }
    
    getBestCatalystCombo() {
        return this.stats.stats.achievements.bestCatalystCombo || 0;
    }
    
    getMorningDays() {
        return this.stats.stats.achievements.morningDays || 0;
    }
    
    getMonthsPlayed() {
        // Calculate months between first play date and now
        if (!this.stats.firstPlayDate) return 0;
        const firstPlay = new Date(this.stats.firstPlayDate);
        const now = new Date();
        const months = (now.getFullYear() - firstPlay.getFullYear()) * 12 + 
                      (now.getMonth() - firstPlay.getMonth());
        return Math.max(0, months);
    }
    
    getHolidaysPlayed() {
        return this.stats.stats.achievements.holidaysPlayed || 0;
    }
    
    }
    
    getBestWeeklyRank() {
        // Deprecated - use getBestMonthlyRank instead
        return this.stats.stats.achievements.bestMonthlyRank;
    }
    
    getBestMonthlyRank() {
        return this.stats.stats.achievements.bestMonthlyRank;
    }

    checkLoreUnlocks() {
        if (window.loreUnlockManager && window.loreUnlockManager.checkAllLoreUnlocks) {
            window.loreUnlockManager.checkAllLoreUnlocks();
        }
    }

    initializeEventListeners() {
        // Hook into game events
        window.addEventListener('gameStart', () => this.recordGameStart());
        window.addEventListener('gameEnd', (e) => this.recordGameEnd(e.detail?.score, e.detail?.mode));
        window.addEventListener('playerDeath', () => {
            console.log('[DEATH TRACKING] playerDeath event received in PlayerStats');
            this.recordDeath();
        });
        window.addEventListener('enemyKilled', () => {
            this.recordKill();
            // Check lore every 100 kills
            if (this.stats.stats.lifetime.totalKills % 100 === 0) {
                this.checkLoreUnlocks();
            }
        });
        window.addEventListener('elementDiscovered', (e) => {
            // Handle the result element from the discovery
            if (e.detail.result) {
                this.recordDiscovery(e.detail.result);
                // Check lore every 10 discoveries
                if (this.stats.stats.lifetime.elementsDiscovered.size % 10 === 0) {
                    this.checkLoreUnlocks();
                }
            }
        });
        window.addEventListener('powerupCollected', (e) => this.recordPowerupCollected(e.detail.type));
        window.addEventListener('scoreUpdate', (e) => {
            this.updateScore(e.detail.score);
            // Check lore at score milestones
            if (e.detail.score >= 25000 && !this.sessionStats.checkedLore25k) {
                this.sessionStats.checkedLore25k = true;
                this.checkLoreUnlocks();
            }
            if (e.detail.score >= 100000 && !this.sessionStats.checkedLore100k) {
                this.sessionStats.checkedLore100k = true;
                this.checkLoreUnlocks();
            }
        });
        window.addEventListener('firstPlace', () => this.recordFirstPlace());
        window.addEventListener('bossDefeated', (e) => {
            console.log('[BOSS TRACKING] Boss defeated event received:', e.detail);
            this.recordBossKill();
        });
    }

    // Debug method to view all stats
    debugStats() {
        // Debug method removed for production
    }
    
    // Reset all stats
    resetAllStats() {
        if (confirm('Are you sure you want to reset ALL player statistics? This cannot be undone!')) {
            localStorage.removeItem(this.STORAGE_KEY);
            this.stats = this.createDefaultStats();
            this.sessionStats = this.initSessionStats();
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
            localStorage.removeItem('viewedSkins');
            // Reset skin selection
            localStorage.removeItem('infiniteSnakeSkinData');
            // Reset discovered elements
            localStorage.removeItem('discoveredElements');
            localStorage.removeItem('allTimeDiscoveries');
            // Reset game settings
            localStorage.removeItem('gameSettings');
            // Reset element combos (if any)
            localStorage.removeItem('elementCombinations');
            // Reset high score and best scores
            localStorage.removeItem('highScore');
            localStorage.removeItem('bestScore');
            localStorage.removeItem('bestDiscoveries');
            localStorage.removeItem('bestKills');
            // Reset leaderboard settings
            localStorage.removeItem('leaderboardCollapsed');
            localStorage.removeItem('scoreboardCollapsed');
            localStorage.removeItem('mobileScoreboardCollapsed');
            localStorage.removeItem('lastUsername');
            localStorage.removeItem('playerName');
            // Reset game progression
            localStorage.removeItem('defeatedBosses');
            localStorage.removeItem('elementBankSlots');
            localStorage.removeItem('gamesPlayed');
            localStorage.removeItem('sessionCount');
            localStorage.removeItem('lastWelcomeShown');
            // Reset other features
            localStorage.removeItem('debugMode');
            localStorage.removeItem('settingsUsedMessages');
            localStorage.removeItem('infiniteSnakeLore');
            localStorage.removeItem('infiniteSnakeRedeemedCodes');
            
            // Reload the page
            window.location.reload();
        }
    }
}

// Initialize player stats globally
window.playerStats = new PlayerStats();