/**
 * GameAnalytics Integration for Infinite Snake
 * Handles all analytics tracking and event submission
 */

(function() {
    'use strict';
    
    // Analytics configuration
    const GA_CONFIG = {
        // GameAnalytics keys for Infinite Snake
        GAME_KEY: '9706032e30d54fd4cf38fc740ddebb4b',
        SECRET_KEY: '9e58d63cace7305bd1af3e8834ada7bc77291652',
        
        // Game build version
        BUILD_VERSION: '1.0.0',
        
        // Resource currencies available in the game
        RESOURCE_CURRENCIES: ['elements', 'score', 'revives'],
        
        // Resource item types
        RESOURCE_ITEM_TYPES: ['powerup', 'discovery', 'boss_defeat', 'element_craft'],
        
        // Custom dimensions
        CUSTOM_DIMENSIONS: {
            // 01: Game modes
            dimension01: ['infinite', 'classic', 'discovery', 'points', 'cozy'],
            // 02: Skins/characters
            dimension02: ['snake-default-green', 'neko', '35mm', 'Frank', 'barbi', 'boat-mcboatface', 
                         'brick-man', 'buffalo', 'camera-guy', 'chirpy', 'clock', 'coffee', 
                         'controller', 'diet-cola', 'dog', 'donut', 'flame', 'floral', 
                         'football', 'fries', 'gnome', 'green-dragon', 'handheld-game', 
                         'hotdog', 'ice-dragon', 'icecream', 'infinity-glove', 'kid-car', 
                         'lovecraft', 'mac', 'midnight', 'murica', 'nyan', 'pixel', 'pizza', 
                         'pod-player', 'popcorn', 'potato', 'racer', 'ramen', 'red-dragon', 
                         'robot', 'ruby', 'santa', 'saturn', 'skibidi', 'snake-2', 
                         'space-cadet', 'spaghetti', 'tornado', 'tv', 'unicorn', 'whale',
                         'pyraxis', 'abyssos', 'osseus', 'zephyrus'],
            // 03: Boss types
            dimension03: ['pyraxis', 'abyssos', 'osseus', 'zephyrus', 'none']
        }
    };
    
    // Analytics state
    let initialized = false;
    let sessionStartTime = null;
    let currentGameMode = 'infinite';
    let currentSkin = 'snake-default-green';
    let consentGiven = null; // Will be loaded from localStorage
    
    // GameAnalytics wrapper object
    const GameAnalyticsWrapper = {
        
        /**
         * Initialize GameAnalytics SDK
         */
        init: function() {
            if (initialized || !window.gameanalytics) {
                console.warn('[GA] GameAnalytics SDK not found or already initialized');
                return;
            }
            
            // Check for consent
            consentGiven = this.checkConsent();
            if (!consentGiven) {
                console.log('[GA] Analytics consent not given, skipping initialization');
                return;
            }
            
            try {
                const GA = window.gameanalytics.GameAnalytics;
                
                // Enable logging during development
                if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    GA.setEnabledInfoLog(true);
                    GA.setEnabledVerboseLog(true);
                }
                
                // Configure build version
                GA.configureBuild(GA_CONFIG.BUILD_VERSION);
                
                // Configure available values
                GA.configureAvailableResourceCurrencies(GA_CONFIG.RESOURCE_CURRENCIES);
                GA.configureAvailableResourceItemTypes(GA_CONFIG.RESOURCE_ITEM_TYPES);
                GA.configureAvailableCustomDimensions01(GA_CONFIG.CUSTOM_DIMENSIONS.dimension01);
                GA.configureAvailableCustomDimensions02(GA_CONFIG.CUSTOM_DIMENSIONS.dimension02);
                GA.configureAvailableCustomDimensions03(GA_CONFIG.CUSTOM_DIMENSIONS.dimension03);
                
                // Initialize SDK
                GA.initialize(GA_CONFIG.GAME_KEY, GA_CONFIG.SECRET_KEY);
                
                initialized = true;
                console.log('[GA] GameAnalytics initialized successfully');
                
            } catch (error) {
                console.error('[GA] Failed to initialize GameAnalytics:', error);
            }
        },
        
        /**
         * Set current game mode
         */
        setGameMode: function(mode) {
            if (!initialized || !consentGiven) return;
            
            currentGameMode = mode;
            window.gameanalytics.GameAnalytics.setCustomDimension01(mode);
            console.log('[GA] Game mode set to:', mode);
        },
        
        /**
         * Set current skin
         */
        setSkin: function(skin) {
            if (!initialized || !consentGiven) return;
            
            currentSkin = skin;
            window.gameanalytics.GameAnalytics.setCustomDimension02(skin);
            console.log('[GA] Skin set to:', skin);
        },
        
        /**
         * Set current boss encounter
         */
        setBossEncounter: function(bossType) {
            if (!initialized || !consentGiven) return;
            
            window.gameanalytics.GameAnalytics.setCustomDimension03(bossType || 'none');
            console.log('[GA] Boss encounter set to:', bossType);
        },
        
        /**
         * Track game session start
         */
        trackSessionStart: function() {
            if (!initialized || !consentGiven) return;
            
            sessionStartTime = Date.now();
            
            this.trackEvent('design', 'session:start', 1);
            this.trackEvent('design', `session:start:${currentGameMode}`, 1);
            
            console.log('[GA] Session started');
        },
        
        /**
         * Track game session end
         */
        trackSessionEnd: function(score, discoveries, deaths) {
            if (!initialized || !consentGiven || !sessionStartTime) return;
            
            const sessionLength = Math.floor((Date.now() - sessionStartTime) / 1000);
            
            this.trackEvent('design', 'session:length', sessionLength);
            this.trackEvent('design', `session:length:${currentGameMode}`, sessionLength);
            this.trackEvent('design', 'session:score', score);
            this.trackEvent('design', `session:score:${currentGameMode}`, score);
            
            if (discoveries !== undefined) {
                this.trackEvent('design', 'session:discoveries', discoveries);
            }
            
            if (deaths !== undefined) {
                this.trackEvent('design', 'session:deaths', deaths);
            }
            
            sessionStartTime = null;
            console.log('[GA] Session ended - Length:', sessionLength, 'Score:', score);
        },
        
        /**
         * Track progression events
         */
        trackProgression: function(status, progression01, progression02, progression03, score) {
            if (!initialized || !consentGiven) return;
            
            const GA = window.gameanalytics.GameAnalytics;
            
            try {
                if (score !== undefined) {
                    GA.addProgressionEvent(status, progression01, progression02, progression03, score);
                } else if (progression03) {
                    GA.addProgressionEvent(status, progression01, progression02, progression03);
                } else if (progression02) {
                    GA.addProgressionEvent(status, progression01, progression02);
                } else {
                    GA.addProgressionEvent(status, progression01);
                }
                
                console.log('[GA] Progression tracked:', status, progression01, progression02, progression03, score);
            } catch (error) {
                console.error('[GA] Failed to track progression:', error);
            }
        },
        
        /**
         * Track resource events
         */
        trackResource: function(flowType, currency, amount, itemType, itemId) {
            if (!initialized || !consentGiven) return;
            
            const GA = window.gameanalytics.GameAnalytics;
            
            try {
                GA.addResourceEvent(flowType, currency, amount, itemType, itemId);
                console.log('[GA] Resource tracked:', flowType, currency, amount, itemType, itemId);
            } catch (error) {
                console.error('[GA] Failed to track resource:', error);
            }
        },
        
        /**
         * Track design events
         */
        trackEvent: function(eventType, eventId, value) {
            if (!initialized || !consentGiven) return;
            
            const GA = window.gameanalytics.GameAnalytics;
            
            try {
                if (eventType === 'design') {
                    if (value !== undefined) {
                        GA.addDesignEvent(eventId, value);
                    } else {
                        GA.addDesignEvent(eventId);
                    }
                    console.log('[GA] Design event tracked:', eventId, value);
                }
            } catch (error) {
                console.error('[GA] Failed to track event:', error);
            }
        },
        
        /**
         * Track player death
         */
        trackDeath: function(cause, score, position) {
            if (!initialized || !consentGiven) return;
            
            this.trackEvent('design', `death:${cause}`, 1);
            this.trackEvent('design', `death:score:${currentGameMode}`, score);
            
            if (position) {
                this.trackEvent('design', 'death:position:x', Math.floor(position.x));
                this.trackEvent('design', 'death:position:y', Math.floor(position.y));
            }
            
            console.log('[GA] Death tracked:', cause, score);
        },
        
        /**
         * Track boss defeat
         */
        trackBossDefeat: function(bossType, attempts, timeSpent) {
            if (!initialized || !consentGiven) return;
            
            this.trackProgression('Complete', 'boss', bossType);
            this.trackEvent('design', `boss:defeated:${bossType}`, 1);
            this.trackEvent('design', `boss:attempts:${bossType}`, attempts);
            this.trackEvent('design', `boss:time:${bossType}`, timeSpent);
            
            // Track as resource gain
            this.trackResource('Source', 'score', 5000, 'boss_defeat', bossType);
            
            console.log('[GA] Boss defeat tracked:', bossType);
        },
        
        /**
         * Track element discovery
         */
        trackDiscovery: function(elementName, elementId, discoveryCount) {
            if (!initialized || !consentGiven) return;
            
            this.trackEvent('design', 'element:discovered', 1);
            this.trackEvent('design', `element:discovered:${elementName}`, 1);
            this.trackEvent('design', 'element:total_discoveries', discoveryCount);
            
            // Track as resource gain
            this.trackResource('Source', 'elements', 1, 'discovery', elementName);
            
            console.log('[GA] Discovery tracked:', elementName, discoveryCount);
        },
        
        /**
         * Track kill streak
         */
        trackKillStreak: function(streakName, count) {
            if (!initialized || !consentGiven) return;
            
            this.trackEvent('design', `killstreak:${streakName}`, 1);
            this.trackEvent('design', 'killstreak:count', count);
            
            console.log('[GA] Kill streak tracked:', streakName, count);
        },
        
        /**
         * Track skin unlock
         */
        trackSkinUnlock: function(skinId, unlockMethod) {
            if (!initialized || !consentGiven) return;
            
            this.trackProgression('Complete', 'unlock', 'skin', skinId);
            this.trackEvent('design', `skin:unlocked:${skinId}`, 1);
            this.trackEvent('design', `skin:unlock_method:${unlockMethod}`, 1);
            
            console.log('[GA] Skin unlock tracked:', skinId, unlockMethod);
        },
        
        /**
         * Track power-up collection
         */
        trackPowerUp: function(powerUpType, value) {
            if (!initialized || !consentGiven) return;
            
            this.trackEvent('design', `powerup:collected:${powerUpType}`, 1);
            this.trackResource('Source', 'score', value || 0, 'powerup', powerUpType);
            
            console.log('[GA] Power-up tracked:', powerUpType);
        },
        
        /**
         * Track revive usage
         */
        trackRevive: function(revivesRemaining) {
            if (!initialized || !consentGiven) return;
            
            this.trackEvent('design', 'revive:used', 1);
            this.trackResource('Sink', 'revives', 1, 'powerup', 'revive');
            this.trackEvent('design', 'revive:remaining', revivesRemaining);
            
            console.log('[GA] Revive tracked, remaining:', revivesRemaining);
        },
        
        /**
         * Check if user has given consent
         */
        checkConsent: function() {
            // Check localStorage for consent
            const storedConsent = localStorage.getItem('analyticsConsent');
            
            if (storedConsent === null) {
                // No consent stored yet - default to true for now
                // In production, you'd want to show a consent dialog
                return true;
            }
            
            return storedConsent === 'true';
        },
        
        /**
         * Set consent
         */
        setConsent: function(hasConsent) {
            consentGiven = hasConsent;
            localStorage.setItem('analyticsConsent', hasConsent.toString());
            
            if (window.gameanalytics) {
                window.gameanalytics.GameAnalytics.setEnabledEventSubmission(hasConsent);
                console.log('[GA] Consent set to:', hasConsent);
            }
            
            // Re-initialize if consent is now given
            if (hasConsent && !initialized) {
                this.init();
            }
        },
        
        /**
         * Get initialization status
         */
        isInitialized: function() {
            return initialized;
        }
    };
    
    // Expose to global scope
    window.GameAnalyticsWrapper = GameAnalyticsWrapper;
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Small delay to ensure GameAnalytics SDK is loaded
            setTimeout(() => GameAnalyticsWrapper.init(), 100);
        });
    } else {
        setTimeout(() => GameAnalyticsWrapper.init(), 100);
    }
    
})();