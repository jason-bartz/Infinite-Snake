// Unlock Manager - Handles skin unlock checking and notifications
class UnlockManager {
    constructor() {
        this.STORAGE_KEY = 'infiniteSnakeUnlocks';
        // Initialize with all default skins
        this.unlockedSkins = new Set(['snake-default-green', 'chirpy', 'ruby', 'lil-beans']);
        this.pendingUnlocks = [];
        this.gameStarted = false;
        this.initialDelayTimer = null;
        this.notificationQueue = [];
        this.isProcessingNotification = false;
        this.loadUnlockedSkins(); // Load will update the set
        this.initializeEventListeners();
    }

    loadUnlockedSkins() {
        try {
            // Default skins that are always unlocked
            const defaultSkins = ['snake-default-green', 'chirpy', 'ruby', 'lil-beans'];
            
            // Try to load from unlock manager storage
            const stored = localStorage.getItem(this.STORAGE_KEY);
            let unlocks = stored ? new Set(JSON.parse(stored)) : new Set(defaultSkins);
            
            // Also merge with main game storage
            const mainGameUnlocks = localStorage.getItem('unlockedSkins');
            if (mainGameUnlocks) {
                const mainUnlocks = JSON.parse(mainGameUnlocks);
                mainUnlocks.forEach(skin => unlocks.add(skin));
            }
            
            // Always ensure default skins are unlocked
            defaultSkins.forEach(skin => unlocks.add(skin));
            
            // Update the instance property
            this.unlockedSkins = unlocks;
            
            // Only save if we merged data from main game storage
            if (mainGameUnlocks && stored) {
                this.saveUnlockedSkins();
            }
        } catch (error) {
            console.error('Failed to load unlocked skins:', error);
            this.unlockedSkins = new Set(['snake-default-green', 'chirpy', 'ruby', 'lil-beans']);
        }
    }

    saveUnlockedSkins() {
        try {
            // Safeguard: ensure unlockedSkins exists and is iterable
            if (!this.unlockedSkins || typeof this.unlockedSkins[Symbol.iterator] !== 'function') {
                console.warn('Cannot save unlocked skins - invalid data');
                return;
            }
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.unlockedSkins)));
        } catch (error) {
            console.error('Failed to save unlocked skins:', error);
        }
    }

    checkUnlockCriteria(skinId, criteria) {
        const stats = window.playerStats;
        if (!stats) return false;

        switch (criteria.type) {
            case 'default':
                return true; // Default skin is always unlocked
                
            case 'deaths':
                return stats.getTotalDeaths() >= criteria.value;
            
            case 'gamesPlayed':
                return stats.getTotalGamesPlayed() >= criteria.value;
            
            case 'timeWindow':
                return stats.hasPlayedBetweenHours(criteria.startHour, criteria.endHour);
            
            case 'discoveries':
                return stats.getTotalDiscoveries() >= criteria.value;
            
            case 'playTime':
                return stats.getTotalPlayTime() >= criteria.value;
            
            case 'scoreInGame':
                return stats.getHighScore() >= criteria.value;
            
            case 'daysPlayed':
                return stats.getDaysPlayed() >= criteria.value;
            
            case 'dieEarly':
                return stats.getDiedWithin30Seconds() >= criteria.value;
            
            case 'firstPlace':
                return stats.getFirstPlaceFinishes() >= criteria.value;
            
            case 'kills':
                return stats.getTotalKills() >= criteria.value;
            
            case 'killsInGame':
                return stats.getMaxKillsInOneGame() >= criteria.value;
            
            case 'voidOrbs':
                return stats.getVoidOrbsEaten() >= criteria.value;
            
            case 'killsWithoutDying':
                return stats.getKillsWithoutDying() >= criteria.value;
            
            case 'catalystGems':
                return stats.getCatalystGemsEaten() >= criteria.value;
            
            case 'totalScore':
                return stats.getTotalScore() >= criteria.value;
            
            case 'monthWindow':
                return stats.hasPlayedDuringMonths(criteria.startMonth, criteria.endMonth);
            
            case 'monthlyLeaderboard':
                return stats.getMonthlyLeaderboardWins() >= criteria.value;
            
            case 'gamesPlayedDuringMonths':
                // Check if played during the specified months AND has enough games
                const playedInWindow = stats.hasPlayedDuringMonths(criteria.startMonth, criteria.endMonth);
                const gamesPlayed = stats.getTotalGamesPlayed();
                return playedInWindow && gamesPlayed >= criteria.value;
            
            case 'collectExotics':
                // Count other exotic skins that are unlocked
                let exoticCount = 0;
                for (const [id, data] of Object.entries(window.SKIN_DATA)) {
                    if (data.rarity === 'exotic' && id !== skinId && this.unlockedSkins.has(id)) {
                        exoticCount++;
                    }
                }
                return exoticCount >= criteria.value;
            
            case 'defeatBoss':
                // This will be triggered by the boss defeat event
                return false;
            
            default:
                console.warn('Unknown unlock criteria type:', criteria.type);
                return false;
        }
    }

    checkAllUnlocks() {
        const newUnlocks = [];
        
        // Define default skins that should not show notifications
        const defaultSkins = ['snake-default-green', 'chirpy', 'ruby', 'lil-beans'];
        
        for (const [skinId, data] of Object.entries(window.SKIN_DATA)) {
            if (!this.unlockedSkins.has(skinId)) {
                if (this.checkUnlockCriteria(skinId, data.unlockCriteria)) {
                    this.unlockSkin(skinId, data);
                    
                    // Only add to notifications if not a default skin
                    if (!defaultSkins.includes(skinId)) {
                        newUnlocks.push({ skinId, data });
                    }
                }
            }
        }
        
        if (newUnlocks.length > 0) {
            this.showUnlockNotifications(newUnlocks);
        }
    }

    unlockSkin(skinId, skinData) {
        this.unlockedSkins.add(skinId);
        this.saveUnlockedSkins();
        
        // Also update the main game's unlock system
        const mainGameUnlocks = localStorage.getItem('unlockedSkins');
        let unlockedSet = mainGameUnlocks ? new Set(JSON.parse(mainGameUnlocks)) : new Set(['basic-boy']);
        unlockedSet.add(skinId);
        
        // Also add the old ID if it exists (for compatibility)
        if (window.skinIdConverter) {
            const oldId = window.skinIdConverter.toOldId(skinId);
            if (oldId && oldId !== skinId) {
                unlockedSet.add(oldId);
            }
        }
        
        localStorage.setItem('unlockedSkins', JSON.stringify(Array.from(unlockedSet)));
        
        // Update skin metadata for both new and old IDs
        if (window.skinMetadata) {
            if (window.skinMetadata[skinId]) {
                window.skinMetadata[skinId].unlocked = true;
            }
            
            // Also update the old ID in skinMetadata if it exists
            if (window.skinIdConverter) {
                const oldId = window.skinIdConverter.toOldId(skinId);
                if (oldId && window.skinMetadata[oldId]) {
                    window.skinMetadata[oldId].unlocked = true;
                }
            }
        }
        
        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('skinUnlocked', {
            detail: { skinId, skinData }
        }));
        
        // Force reload skin data if the function exists
        if (window.loadSkinData) {
            window.loadSkinData();
        }
    }

    showUnlockNotifications(unlocks) {
        // If game hasn't started yet, queue the notifications
        if (!this.gameStarted) {
            this.notificationQueue.push(...unlocks);
            return;
        }
        
        // Queue notifications to show one at a time
        this.pendingUnlocks.push(...unlocks);
        
        // If not already processing, start processing
        if (!this.isProcessingNotification) {
            this.processNextUnlock();
        }
    }

    processNextUnlock() {
        if (this.pendingUnlocks.length === 0) {
            this.isProcessingNotification = false;
            return;
        }
        
        this.isProcessingNotification = true;
        const unlock = this.pendingUnlocks.shift();
        this.showUnlockNotification(unlock.skinId, unlock.data);
        
        // Show next unlock after a longer delay (4 seconds instead of 3)
        setTimeout(() => this.processNextUnlock(), 4000);
    }

    showUnlockNotification(skinId, skinData) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `unlock-notification rarity-${skinData.rarity}`;
        
        // Convert new skin ID to old ID for image path
        let imageId = skinId;
        if (window.skinIdConverter && window.skinIdConverter.toOldId) {
            const oldId = window.skinIdConverter.toOldId(skinId);
            if (oldId && oldId !== skinId) {
                imageId = oldId;
            }
        }
        
        // Determine the correct image path
        const imagePath = skinData.isBoss ? `assets/boss-skins/${imageId}.png` : `skins/${imageId}.png`;
        
        notification.innerHTML = `
            <div class="unlock-content">
                <div class="unlock-header">NEW SKIN UNLOCKED!</div>
                <div class="unlock-skin-preview">
                    <img src="${imagePath}" alt="${skinData.name}" onerror="this.style.display='none'">
                </div>
                <div class="unlock-info">
                    <div class="unlock-skin-name">${skinData.name}</div>
                    <div class="unlock-skin-rarity">${skinData.rarity.toUpperCase()}</div>
                    <div class="unlock-skin-bio">${skinData.bio || 'A mysterious new skin!'}</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add animation class after a brief delay
        setTimeout(() => notification.classList.add('show'), 50);
        
        // Remove notification after animation
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 3500); // Increased duration to 3.5 seconds
        
        // Play sound effect based on rarity
        this.playUnlockSound(skinData.rarity);
    }

    playUnlockSound(rarity) {
        // Play skin unlock achievement sound
        const audio = new Audio('/sounds/award-achievement-2.mp3');
        audio.volume = 0.7;
        audio.play().catch(() => {
            console.log('[UNLOCK] Failed to play skin unlock sound');
        });
    }

    // Boss unlock method
    unlockBossSkin(bossName) {
        const bossSkinId = bossName.toLowerCase();
        if (window.SKIN_DATA[bossSkinId] && window.SKIN_DATA[bossSkinId].isBoss) {
            this.unlockSkin(bossSkinId, window.SKIN_DATA[bossSkinId]);
            this.showUnlockNotifications([{ skinId: bossSkinId, data: window.SKIN_DATA[bossSkinId] }]);
        }
    }

    // Check specific events
    checkEventBasedUnlocks(eventType) {
        const checksToRun = {
            'gameEnd': ['scoreInGame', 'killsInGame', 'killsWithoutDying', 'dieEarly'],
            'kill': ['kills', 'killsInGame', 'killsWithoutDying'],
            'death': ['deaths', 'dieEarly'],
            'discovery': ['discoveries'],
            'powerup': ['voidOrbs', 'catalystGems'],
            'gameStart': ['gamesPlayed', 'timeWindow', 'monthWindow', 'daysPlayed'],
            'playTime': ['playTime'],
            'firstPlace': ['firstPlace'],
            'scoreUpdate': ['totalScore']
        };
        
        const criteriaTypes = checksToRun[eventType] || [];
        const newUnlocks = [];
        
        for (const [skinId, data] of Object.entries(window.SKIN_DATA)) {
            if (!this.unlockedSkins.has(skinId) && criteriaTypes.includes(data.unlockCriteria.type)) {
                if (this.checkUnlockCriteria(skinId, data.unlockCriteria)) {
                    this.unlockSkin(skinId, data);
                    newUnlocks.push({ skinId, data });
                }
            }
        }
        
        if (newUnlocks.length > 0) {
            this.showUnlockNotifications(newUnlocks);
        }
    }

    initializeEventListeners() {
        // Listen for game events
        window.addEventListener('gameStart', () => this.checkEventBasedUnlocks('gameStart'));
        window.addEventListener('gameEnd', () => this.checkEventBasedUnlocks('gameEnd'));
        window.addEventListener('playerDeath', () => this.checkEventBasedUnlocks('death'));
        window.addEventListener('enemyKilled', () => this.checkEventBasedUnlocks('kill'));
        window.addEventListener('elementDiscovered', () => this.checkEventBasedUnlocks('discovery'));
        window.addEventListener('powerupCollected', () => this.checkEventBasedUnlocks('powerup'));
        window.addEventListener('scoreUpdate', () => this.checkEventBasedUnlocks('scoreUpdate'));
        window.addEventListener('firstPlace', () => this.checkEventBasedUnlocks('firstPlace'));
        
        // Check play time periodically
        setInterval(() => this.checkEventBasedUnlocks('playTime'), 60000); // Every minute
        
        // Boss defeat events
        window.addEventListener('bossDefeated', (e) => {
            if (e.detail && e.detail.bossName) {
                this.unlockBossSkin(e.detail.bossName);
            }
        });
    }

    // Get progress towards a specific skin
    getUnlockProgress(skinId) {
        // Convert old skin ID to new skin ID if needed
        const newSkinId = window.skinIdConverter ? window.skinIdConverter.toNewId(skinId) : skinId;
        const data = window.SKIN_DATA[newSkinId];
        if (!data) return null;
        
        const stats = window.playerStats;
        if (!stats) return null;
        
        const criteria = data.unlockCriteria;
        let current = 0;
        let target = criteria.value || 1;
        
        switch (criteria.type) {
            case 'deaths':
                current = stats.getTotalDeaths();
                break;
            case 'gamesPlayed':
                current = stats.getTotalGamesPlayed();
                break;
            case 'discoveries':
                current = stats.getTotalDiscoveries();
                break;
            case 'playTime':
                current = stats.getTotalPlayTime();
                break;
            case 'scoreInGame':
                current = stats.getHighScore();
                break;
            case 'daysPlayed':
                current = stats.getDaysPlayed();
                break;
            case 'dieEarly':
                current = stats.getDiedWithin30Seconds();
                break;
            case 'firstPlace':
                current = stats.getFirstPlaceFinishes();
                break;
            case 'kills':
                current = stats.getTotalKills();
                break;
            case 'killsInGame':
                current = stats.getMaxKillsInOneGame();
                break;
            case 'voidOrbs':
                current = stats.getVoidOrbsEaten();
                break;
            case 'killsWithoutDying':
                current = stats.getKillsWithoutDying();
                break;
            case 'catalystGems':
                current = stats.getCatalystGemsEaten();
                break;
            case 'totalScore':
                current = stats.getTotalScore();
                break;
            case 'monthlyLeaderboard':
                current = stats.getMonthlyLeaderboardWins();
                break;
            case 'gamesPlayedDuringMonths':
                // Check if in the right time window first
                if (stats.hasPlayedDuringMonths(criteria.startMonth, criteria.endMonth)) {
                    current = stats.getTotalGamesPlayed();
                } else {
                    current = 0; // Not in the right months
                }
                break;
            case 'collectExotics':
                // Count other exotic skins that are unlocked
                let exoticCount = 0;
                for (const [id, data] of Object.entries(window.SKIN_DATA)) {
                    if (data.rarity === 'exotic' && id !== skinId && this.unlockedSkins.has(id)) {
                        exoticCount++;
                    }
                }
                current = exoticCount;
                break;
            case 'timeWindow':
            case 'monthWindow':
            case 'defeatBoss':
                // These are binary checks - return proper progress object
                const isUnlocked = this.checkUnlockCriteria(skinId, criteria);
                return {
                    current: isUnlocked ? 1 : 0,
                    max: 1,
                    percentage: isUnlocked ? 100 : 0
                };
            default:
                return null;
        }
        
        return {
            current,
            max: target,
            percentage: Math.min(100, (current / target) * 100)
        };
    }

    // Initialize method (called from main game)
    initialize() {
        // Reload unlocked skins to sync with main game
        this.loadUnlockedSkins();
        
        // Check all unlocks on initialization but don't show notifications yet
        this.checkAllUnlocks();
        
        // Sync with skinMetadata if available
        if (window.skinMetadata) {
            this.unlockedSkins.forEach(skinId => {
                if (window.skinMetadata[skinId]) {
                    window.skinMetadata[skinId].unlocked = true;
                }
            });
        }
    }
    
    // Called when the game actually starts
    onGameStart() {
        this.gameStarted = true;
        
        // Clear any existing timer
        if (this.initialDelayTimer) {
            clearTimeout(this.initialDelayTimer);
        }
        
        // Wait 3 seconds before showing any queued notifications
        this.initialDelayTimer = setTimeout(() => {
            if (this.notificationQueue.length > 0) {
                this.showUnlockNotifications(this.notificationQueue);
                this.notificationQueue = [];
            }
        }, 3000);
    }
    
    // Called when a boss is defeated
    onBossDefeat(bossType) {
        console.log('[UNLOCK] Boss defeated:', bossType);
        
        // Find skins that require defeating this boss
        for (const [skinId, data] of Object.entries(window.SKIN_DATA)) {
            if (!this.unlockedSkins.has(skinId) && data.unlockCriteria) {
                if (data.unlockCriteria.type === 'defeatBoss' && 
                    data.unlockCriteria.boss === bossType.toLowerCase()) {
                    this.unlockSkin(skinId, data);
                    this.pendingUnlocks.push({ skinId, data });
                }
            }
        }
        
        // Process unlock notifications
        if (this.pendingUnlocks.length > 0 && !this.isProcessingNotification) {
            this.processNextUnlock();
        }
    }
    
    // Called when returning to menu
    onGameEnd() {
        this.gameStarted = false;
        
        // Clear any pending timers
        if (this.initialDelayTimer) {
            clearTimeout(this.initialDelayTimer);
            this.initialDelayTimer = null;
        }
        
        // Clear pending unlocks
        this.pendingUnlocks = [];
        this.isProcessingNotification = false;
    }
    
    // Get unlocked skins
    getUnlockedSkins() {
        return this.unlockedSkins;
    }
    
    // Debug method
    debugUnlocks() {
        console.log('Unlocked Skins:', Array.from(this.unlockedSkins));
        console.log('Pending Unlocks:', this.pendingUnlocks);
    }
}

// Initialize unlock manager globally
window.unlockManager = new UnlockManager();