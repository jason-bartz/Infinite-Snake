class KillstreakManager {
    constructor() {
        this.currentStreak = 0;
        this.lastKillTime = 0;
        this.streakTimeout = 5000; // 5 seconds between kills
        this.isActive = false;
        
        // Killstreak milestones
        this.milestones = {
            2: { name: 'DOUBLE STRIKE', file: 'double-strike' },
            3: { name: 'TRIPLE FANG', file: 'triple-fang' },
            4: { name: 'DEATH COIL', file: 'death-coil' },
            5: { name: "PYTHON'S GRIP", file: 'pythons-grip' },
            6: { name: 'SERPENTINE FURY', file: 'serpentine-fury' },
            7: { name: 'VENOMANCER', file: 'venomancer' },
            8: { name: 'BASILISK', file: 'basilisk' },
            9: { name: 'APEX PREDATOR', file: 'apex-predator' },
            10: { name: 'OUROBOROS', file: 'ouroboros' },
            15: { name: 'INFINITE DEVOURER', file: 'infinite-devourer' }
        };
        
        // Preload audio files
        this.audioCache = {};
        this.preloadAudio();
    }
    
    preloadAudio() {
        Object.entries(this.milestones).forEach(([kills, data]) => {
            const audio = new Audio(`killstreak-announcer/${data.file}.mp3`);
            audio.volume = 0.7;
            // Add error handling for missing audio files
            audio.onerror = () => {
                console.log(`Killstreak audio not found: ${data.file}.mp3`);
            };
            this.audioCache[kills] = audio;
        });
    }
    
    onKill() {
        const now = Date.now();
        
        // Check if streak should continue
        if (this.currentStreak > 0 && now - this.lastKillTime > this.streakTimeout) {
            this.resetStreak();
        }
        
        this.currentStreak++;
        this.lastKillTime = now;
        this.isActive = true;
        
        console.log('[KILLSTREAK] Kill registered, current streak:', this.currentStreak);
        
        // Check for milestone
        const milestone = this.milestones[this.currentStreak];
        if (milestone) {
            this.announceKillstreak(this.currentStreak, milestone);
        }
    }
    
    announceKillstreak(kills, milestone) {
        // Show visual message with medal
        this.showKillstreakMessage(milestone.name, milestone.file);
        
        // Play audio announcement
        this.playKillstreakAudio(kills);
    }
    
    showKillstreakMessage(streakName, medalFile) {
        console.log('[KILLSTREAK] Attempting to show message:', streakName, medalFile);
        
        // Check if game has started
        if (typeof window.gameStarted === 'undefined' || !window.gameStarted) {
            console.log('[KILLSTREAK] Game not started, skipping message');
            return;
        }
        
        const popup = document.getElementById('killstreakDisplay');
        if (!popup) {
            console.log('[KILLSTREAK] killstreakDisplay element not found!');
            return;
        }
        
        // Map audio filename to medal filename (handle the space in "apex predator")
        const medalFileName = medalFile === 'apex-predator' ? 'apex predator' : medalFile;
        
        // Create message with medal
        const medalHtml = `<img src="assets/kill-medals/${medalFileName}.png" class="killstreak-medal" alt="${streakName}">`;
        const messageHtml = `${medalHtml}<div class="killstreak-text">${streakName}</div>`;
        
        console.log('[KILLSTREAK] Setting popup HTML:', messageHtml);
        popup.innerHTML = messageHtml;
        popup.className = 'show';
        console.log('[KILLSTREAK] Popup classes:', popup.className);
        
        // Auto-hide after 4 seconds
        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            console.log('[KILLSTREAK] Hiding message');
            popup.classList.remove('show');
        }, 4000);
    }
    
    playKillstreakAudio(kills) {
        // Check if audio is muted
        if (typeof window.musicMuted !== 'undefined' && window.musicMuted) return;
        
        const audio = this.audioCache[kills];
        if (audio) {
            // Clone and play to allow overlapping sounds
            const audioClone = audio.cloneNode();
            audioClone.volume = audio.volume;
            audioClone.play().catch(e => console.log('Killstreak audio play failed:', e));
        }
    }
    
    resetStreak() {
        this.currentStreak = 0;
        this.isActive = false;
    }
    
    onPlayerDeath() {
        this.resetStreak();
    }
    
    getCurrentStreak() {
        return this.currentStreak;
    }
    
    isStreakActive() {
        if (!this.isActive) return false;
        
        const now = Date.now();
        return (now - this.lastKillTime) <= this.streakTimeout;
    }
}

// Export for use in game
window.killstreakManager = new KillstreakManager();

// Console command for testing killstreaks
window.testKillstreak = function(streakNumber) {
    if (!window.killstreakManager) {
        console.error('[KILLSTREAK TEST] KillstreakManager not initialized');
        return;
    }
    
    // Validate input
    const validStreaks = Object.keys(window.killstreakManager.milestones).map(Number);
    if (!streakNumber) {
        console.log('[KILLSTREAK TEST] Usage: testKillstreak(number)');
        console.log('[KILLSTREAK TEST] Available streaks:', validStreaks.join(', '));
        return;
    }
    
    streakNumber = Number(streakNumber);
    if (!validStreaks.includes(streakNumber)) {
        console.error('[KILLSTREAK TEST] Invalid streak number. Available:', validStreaks.join(', '));
        return;
    }
    
    // Set game as started for testing
    const wasGameStarted = window.gameStarted;
    window.gameStarted = true;
    
    // Reset streak and simulate kills to reach desired streak
    window.killstreakManager.resetStreak();
    console.log('[KILLSTREAK TEST] Simulating', streakNumber, 'kills...');
    
    for (let i = 0; i < streakNumber; i++) {
        window.killstreakManager.onKill();
    }
    
    console.log('[KILLSTREAK TEST] Killstreak', streakNumber, 'triggered:', window.killstreakManager.milestones[streakNumber].name);
    
    // Restore game state after a delay
    setTimeout(() => {
        window.gameStarted = wasGameStarted;
    }, 5000);
};

// Console command to reset killstreak
window.resetKillstreak = function() {
    if (!window.killstreakManager) {
        console.error('[KILLSTREAK TEST] KillstreakManager not initialized');
        return;
    }
    
    window.killstreakManager.resetStreak();
    console.log('[KILLSTREAK TEST] Killstreak reset to 0');
};

// Console command to show current killstreak
window.showKillstreak = function() {
    if (!window.killstreakManager) {
        console.error('[KILLSTREAK TEST] KillstreakManager not initialized');
        return;
    }
    
    const current = window.killstreakManager.getCurrentStreak();
    const isActive = window.killstreakManager.isStreakActive();
    console.log('[KILLSTREAK TEST] Current streak:', current);
    console.log('[KILLSTREAK TEST] Streak active:', isActive);
    
    // Show available milestones
    console.log('[KILLSTREAK TEST] Available milestones:');
    Object.entries(window.killstreakManager.milestones).forEach(([kills, data]) => {
        const status = current >= kills ? '✓' : ' ';
        console.log(`  ${status} ${kills}: ${data.name}`);
    });
};

// Debug command to monitor kill events
window.debugKillstreak = function() {
    if (!window.killstreakManager) {
        console.error('[KILLSTREAK DEBUG] KillstreakManager not initialized');
        return;
    }
    
    // Override onKill to add debug logging
    const originalOnKill = window.killstreakManager.onKill;
    window.killstreakManager.onKill = function() {
        console.log('[KILLSTREAK DEBUG] onKill() called');
        console.trace(); // Show call stack
        originalOnKill.call(this);
    };
    
    console.log('[KILLSTREAK DEBUG] Debug mode enabled. Kill events will be logged with stack traces.');
};