// Lore Unlock Manager - Handles lore unlock notifications and tracking
class LoreUnlockManager {
    constructor() {
        this.STORAGE_KEY = 'infiniteSnakeLoreUnlocks';
        this.unlockedLore = new Map(); // Maps lore ID to unlock data
        this.pendingUnlocks = [];
        this.isProcessingNotification = false;
        this.notificationQueue = [];
        this.messageTimeout = null;
        
        // Preload achievement sound
        this.achievementSound = new Audio('sounds/award-achievement.mp3');
        this.achievementSound.volume = 0.7;
        this.achievementSound.onerror = () => {
            console.log('[LORE] Achievement sound not found: award-achievement.mp3');
        };
        
        this.loadUnlockedLore();
    }
    
    loadUnlockedLore() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                this.unlockedLore = new Map(data);
            }
        } catch (error) {
            console.error('[LORE] Failed to load unlocked lore:', error);
            this.unlockedLore = new Map();
        }
    }
    
    saveUnlockedLore() {
        try {
            const data = Array.from(this.unlockedLore.entries());
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('[LORE] Failed to save unlocked lore:', error);
        }
    }
    
    unlockLore(loreId, loreTitle) {
        // Check if already unlocked
        if (this.unlockedLore.has(loreId)) {
            return false;
        }
        
        // Record unlock with timestamp
        const unlockData = {
            title: loreTitle,
            unlockedAt: new Date().toISOString(),
            isNew: true
        };
        
        this.unlockedLore.set(loreId, unlockData);
        this.saveUnlockedLore();
        
        // Queue notification
        this.notificationQueue.push({ loreId, loreTitle });
        this.processNotificationQueue();
        
        return true;
    }
    
    processNotificationQueue() {
        if (this.isProcessingNotification || this.notificationQueue.length === 0) {
            return;
        }
        
        this.isProcessingNotification = true;
        const { loreId, loreTitle } = this.notificationQueue.shift();
        
        this.showLoreUnlockMessage(loreTitle);
        
        // Process next notification after delay
        setTimeout(() => {
            this.isProcessingNotification = false;
            this.processNotificationQueue();
        }, 5000); // 5 second delay between notifications
    }
    
    showLoreUnlockMessage(loreTitle) {
        console.log('[LORE] Showing unlock message:', loreTitle);
        
        // Check if game has started
        if (typeof window.gameStarted === 'undefined' || !window.gameStarted) {
            console.log('[LORE] Game not started, queueing message');
            // Re-queue the notification
            this.notificationQueue.unshift({ loreTitle });
            this.isProcessingNotification = false;
            return;
        }
        
        const popup = document.getElementById('loreUnlockDisplay');
        if (!popup) {
            console.log('[LORE] loreUnlockDisplay element not found!');
            this.isProcessingNotification = false;
            return;
        }
        
        // Create message
        popup.textContent = `LORE UNLOCKED: ${loreTitle.toUpperCase()}`;
        popup.className = 'show';
        
        // Play achievement sound
        if (this.achievementSound) {
            this.achievementSound.currentTime = 0;
            this.achievementSound.play().catch(error => {
                console.log('[LORE] Could not play achievement sound:', error);
            });
        }
        
        // Auto-hide after 6 seconds (longer than regular messages)
        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            popup.className = '';
        }, 6000);
    }
    
    markAsRead(loreId) {
        const loreData = this.unlockedLore.get(loreId);
        if (loreData && loreData.isNew) {
            loreData.isNew = false;
            this.saveUnlockedLore();
        }
    }
    
    isUnlocked(loreId) {
        return this.unlockedLore.has(loreId);
    }
    
    getUnlockData(loreId) {
        return this.unlockedLore.get(loreId);
    }
    
    getAllUnlockedLore() {
        return Array.from(this.unlockedLore.entries());
    }
    
    getUnlockedCount() {
        return this.unlockedLore.size;
    }
    
    // Check lore unlock criteria (similar to skin unlock criteria)
    checkLoreCriteria(loreId, criteria) {
        const stats = window.playerStats;
        if (!stats) return false;
        
        switch (criteria.type) {
            case 'default':
                return true; // Default lore is always unlocked
                
            case 'scoreInGame':
                return stats.getHighScore() >= criteria.value;
            
            case 'gamesPlayed':
                return stats.getTotalGamesPlayed() >= criteria.value;
            
            case 'discoveries':
                return stats.getTotalDiscoveries() >= criteria.value;
            
            case 'totalScore':
                return stats.getTotalScore() >= criteria.value;
            
            case 'defeatBoss':
                // Check if boss has been defeated in the game
                // This looks for defeatedBosses set from the game
                if (window.defeatedBosses && window.defeatedBosses.has) {
                    return window.defeatedBosses.has(criteria.bossName.toLowerCase());
                }
                // Also check localStorage for persistent tracking
                const defeatedBossList = JSON.parse(localStorage.getItem('defeatedBosses') || '[]');
                return defeatedBossList.includes(criteria.bossName.toLowerCase());
            
            case 'kills':
                return stats.getTotalKills() >= criteria.value;
            
            case 'playTime':
                return stats.getTotalPlayTime() >= criteria.value;
            
            case 'voidOrbs':
                return stats.getVoidOrbsEaten() >= criteria.value;
            
            case 'catalystGems':
                return stats.getCatalystGemsEaten() >= criteria.value;
            
            case 'deaths':
                return stats.getTotalDeaths() >= criteria.value;
            
            case 'timeWindow':
                const hour = new Date().getHours();
                if (criteria.startHour > criteria.endHour) {
                    // Spans midnight
                    return hour >= criteria.startHour || hour < criteria.endHour;
                }
                return hour >= criteria.startHour && hour < criteria.endHour;
            
            case 'daysPlayed':
                return stats.getDaysPlayed() >= criteria.value;
            
            case 'playMonth':
                return new Date().getMonth() === (criteria.month - 1); // JS months are 0-indexed
            
            case 'dayOfWeek':
                return new Date().getDay() === criteria.day;
            
            case 'killsInGame':
                return stats.getBestKillsInGame() >= criteria.value;
            
            case 'playTimeWindow':
                // Complex time window with days requirement
                const currentHour = new Date().getHours();
                const inTimeWindow = currentHour >= criteria.startHour && currentHour < criteria.endHour;
                // This would need additional tracking for days in specific time window
                return inTimeWindow; // Simplified for now
            
            case 'comboStreak':
                return stats.getBestComboStreak() >= criteria.value;
            
            case 'bossKills':
                return stats.getTotalBossKills() >= criteria.value;
            
            case 'weekendPlay':
                const dayOfWeek = new Date().getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                return isWeekend && stats.getWeekendDaysPlayed() >= criteria.value;
            
            case 'newElements':
                return stats.getMostNewElementsInGame() >= criteria.value;
            
            case 'daysStreak':
                return stats.getBestDayStreak() >= criteria.value;
            
            case 'nightOwl':
                // Playing after midnight
                return new Date().getHours() < 6 && stats.getNightOwlDays() >= criteria.days;
            
            case 'bossStreak':
                return stats.getMostBossesInGame() >= criteria.value;
            
            case 'survivalTime':
                return stats.getBestSurvivalTime() >= criteria.value;
            
            case 'rarityUnlock':
                return stats.getLegendaryDiscoveries() >= criteria.count;
            
            case 'voidOrbsInGame':
                return stats.getMostVoidOrbsInGame() >= criteria.value;
            
            case 'catalystCombo':
                return stats.getBestCatalystCombo() >= criteria.value;
            
            case 'morningRoutine':
                return new Date().getHours() < 9 && stats.getMorningDays() >= criteria.days;
            
            case 'dedication':
                return stats.getMonthsPlayed() >= criteria.months;
            
            case 'veteranStatus':
                return stats.getDaysPlayed() >= criteria.days;
            
            case 'holidayPlay':
                // Simplified - would need holiday date checking
                return stats.getHolidaysPlayed() >= criteria.value;
            
            case 'allBosses':
                return stats.getAllBossesDefeatedCount() >= criteria.count;
            
            default:
                console.warn('[LORE] Unknown unlock criteria type:', criteria.type);
                return false;
        }
    }
    
    // Check all lore entries for unlocks
    checkAllLoreUnlocks() {
        if (!window.LORE_DATA) {
            console.warn('[LORE] LORE_DATA not loaded yet');
            return;
        }
        
        const newUnlocks = [];
        
        for (const [loreId, data] of Object.entries(window.LORE_DATA)) {
            if (!this.isUnlocked(loreId)) {
                if (this.checkLoreCriteria(loreId, data.unlockCriteria)) {
                    // Don't show notification for default unlocks
                    const showNotification = data.unlockCriteria.type !== 'default';
                    
                    if (this.unlockLore(loreId, data.title)) {
                        newUnlocks.push({ id: loreId, title: data.title, showNotification });
                    }
                }
            }
        }
        
        // Process notifications for new unlocks (excluding defaults)
        newUnlocks.forEach(unlock => {
            if (unlock.showNotification) {
                console.log('[LORE] New lore unlocked:', unlock.title);
            }
        });
        
        return newUnlocks;
    }
    
    // Initialize lore checking
    initialize() {
        // Check all lore on initialization (for default entries)
        setTimeout(() => {
            this.checkAllLoreUnlocks();
        }, 1000);
    }
}

// Initialize lore unlock manager
window.loreUnlockManager = new LoreUnlockManager();
window.loreUnlockManager.initialize();