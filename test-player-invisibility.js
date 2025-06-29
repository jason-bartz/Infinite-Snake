// Player Invisibility Bug Test Suite
// Testing player visibility during boss damage scenarios

console.log("=== PLAYER INVISIBILITY BUG TEST SUITE ===");
console.log("Test Date:", new Date().toISOString());
console.log("Browser:", navigator.userAgent);
console.log("\n");

// Test Configuration
const testConfig = {
    logLevel: 'verbose', // 'verbose', 'normal', 'minimal'
    autoRunTests: false,
    testDuration: 30000, // 30 seconds per test
    captureScreenshots: false
};

// Test State
let testResults = {
    bossTypes: {},
    damageTypes: {},
    timingAnalysis: [],
    errorLogs: [],
    visibilityStates: []
};

// Hook into game functions
let originalDraw;
let originalTakeDamage;
let originalDie;
let originalUpdateBossProjectiles;

// Initialize test hooks
function initializeTestHooks() {
    console.log("[TEST] Initializing hooks...");
    
    // Hook into player draw function
    if (playerSnake && playerSnake.draw) {
        originalDraw = playerSnake.draw;
        playerSnake.draw = function(interpolation) {
            // Log visibility state before drawing
            const preDrawState = {
                timestamp: Date.now(),
                alive: this.alive,
                invincibilityTimer: this.invincibilityTimer,
                globalAlpha: ctx.globalAlpha,
                segments: this.segments.length,
                position: { x: this.x, y: this.y },
                size: this.size,
                isPlayer: this.isPlayer,
                bossActive: bossEncounterActive,
                currentBoss: currentBoss ? currentBoss.bossType : null
            };
            
            // Call original draw
            originalDraw.call(this, interpolation);
            
            // Log visibility state after drawing
            const postDrawState = {
                timestamp: Date.now(),
                globalAlpha: ctx.globalAlpha,
                contextSaved: false // We'll check this
            };
            
            // Check if player appears invisible
            if (this.isPlayer && this.alive && ctx.globalAlpha < 1) {
                console.warn("[VISIBILITY BUG] Player drawn with alpha < 1:", ctx.globalAlpha);
                testResults.visibilityStates.push({
                    type: 'low_alpha',
                    preState: preDrawState,
                    postState: postDrawState
                });
            }
            
            // Log detailed state during boss encounters
            if (this.isPlayer && bossEncounterActive && testConfig.logLevel === 'verbose') {
                console.log("[PLAYER DRAW]", {
                    invincibilityTimer: this.invincibilityTimer,
                    alpha: ctx.globalAlpha,
                    size: this.size,
                    segmentCount: this.segments.length
                });
            }
        };
    }
    
    // Hook into damage functions
    if (window.updateBossProjectiles) {
        originalUpdateBossProjectiles = window.updateBossProjectiles;
        window.updateBossProjectiles = function(deltaTime) {
            const preDamagePlayerState = playerSnake ? {
                alive: playerSnake.alive,
                invincibilityTimer: playerSnake.invincibilityTimer,
                position: { x: playerSnake.x, y: playerSnake.y },
                size: playerSnake.size
            } : null;
            
            // Call original function
            originalUpdateBossProjectiles.call(this, deltaTime);
            
            // Check for damage
            if (playerSnake && preDamagePlayerState && preDamagePlayerState.alive && !playerSnake.alive) {
                console.log("[DAMAGE DETECTED] Player died from boss projectile");
                testResults.damageTypes[currentBoss ? currentBoss.bossType : 'unknown'] = 
                    (testResults.damageTypes[currentBoss ? currentBoss.bossType : 'unknown'] || 0) + 1;
            }
        };
    }
    
    console.log("[TEST] Hooks initialized");
}

// Test Functions
const tests = {
    // Test 1: Check player visibility state changes
    testVisibilityTiming: function() {
        console.log("\n[TEST 1] Testing visibility timing...");
        
        let visibilityLog = [];
        let checkInterval = setInterval(() => {
            if (playerSnake) {
                const state = {
                    timestamp: Date.now(),
                    alive: playerSnake.alive,
                    invincibilityTimer: playerSnake.invincibilityTimer,
                    visible: true, // We'll determine this
                    bossActive: bossEncounterActive,
                    respawning: playerRespawnTimer > 0
                };
                
                // Try to determine visibility
                if (playerSnake.segments && playerSnake.segments.length > 0) {
                    const head = playerSnake.segments[0];
                    const screen = worldToScreen(head.x, head.y);
                    
                    // Check if player would be on screen
                    if (screen.x > -100 && screen.x < canvas.width + 100 &&
                        screen.y > -100 && screen.y < canvas.height + 100) {
                        // Player should be visible on screen
                        state.shouldBeVisible = true;
                    }
                }
                
                visibilityLog.push(state);
                
                // Log significant events
                if (state.invincibilityTimer > 0 && testConfig.logLevel !== 'minimal') {
                    console.log("[INVINCIBILITY ACTIVE]", state.invincibilityTimer, "ms remaining");
                }
            }
        }, 100); // Check every 100ms
        
        // Stop after test duration
        setTimeout(() => {
            clearInterval(checkInterval);
            testResults.timingAnalysis = visibilityLog;
            console.log("[TEST 1] Complete. Logged", visibilityLog.length, "states");
        }, testConfig.testDuration);
    },
    
    // Test 2: Boss-specific damage testing
    testBossSpecificDamage: function() {
        console.log("\n[TEST 2] Testing boss-specific damage...");
        
        // Monitor for each boss type
        const bossTypes = ['PYRAXIS', 'ABYSSOS', 'OSSEUS', 'ZEPHYRUS'];
        
        bossTypes.forEach(bossType => {
            testResults.bossTypes[bossType] = {
                encounters: 0,
                playerDeaths: 0,
                invisibilityEvents: 0,
                damageTypes: {}
            };
        });
        
        console.log("[TEST 2] Monitoring boss encounters...");
    },
    
    // Test 3: Check rendering pipeline
    testRenderingPipeline: function() {
        console.log("\n[TEST 3] Testing rendering pipeline...");
        
        // Override canvas context to monitor alpha changes
        const originalGlobalAlpha = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'globalAlpha');
        let alphaChangeLog = [];
        
        Object.defineProperty(ctx, 'globalAlpha', {
            get: function() {
                return originalGlobalAlpha.get.call(this);
            },
            set: function(value) {
                // Log alpha changes during player rendering
                if (playerSnake && playerSnake.alive && bossEncounterActive) {
                    alphaChangeLog.push({
                        timestamp: Date.now(),
                        value: value,
                        stack: new Error().stack
                    });
                    
                    if (value < 1 && testConfig.logLevel === 'verbose') {
                        console.log("[ALPHA CHANGE]", value);
                    }
                }
                originalGlobalAlpha.set.call(this, value);
            }
        });
        
        setTimeout(() => {
            console.log("[TEST 3] Complete. Logged", alphaChangeLog.length, "alpha changes");
            testResults.alphaChanges = alphaChangeLog;
        }, testConfig.testDuration);
    },
    
    // Test 4: Hitbox vs Visual testing
    testHitboxVsVisual: function() {
        console.log("\n[TEST 4] Testing hitbox vs visual representation...");
        
        let hitboxCheckInterval = setInterval(() => {
            if (playerSnake && playerSnake.alive && bossEncounterActive) {
                // Check if player can still be hit while potentially invisible
                const playerBounds = {
                    x: playerSnake.x,
                    y: playerSnake.y,
                    radius: SEGMENT_SIZE * (playerSnake.size || 1)
                };
                
                // Check projectile collisions
                let nearProjectiles = 0;
                bossProjectiles.forEach(projectile => {
                    const dx = projectile.x - playerBounds.x;
                    const dy = projectile.y - playerBounds.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 100) {
                        nearProjectiles++;
                    }
                });
                
                if (nearProjectiles > 0 && testConfig.logLevel !== 'minimal') {
                    console.log("[HITBOX CHECK] Player near", nearProjectiles, "projectiles");
                }
            }
        }, 200);
        
        setTimeout(() => {
            clearInterval(hitboxCheckInterval);
            console.log("[TEST 4] Complete");
        }, testConfig.testDuration);
    },
    
    // Test 5: Console error monitoring
    testConsoleErrors: function() {
        console.log("\n[TEST 5] Monitoring console errors...");
        
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.error = function(...args) {
            testResults.errorLogs.push({
                type: 'error',
                timestamp: Date.now(),
                message: args.join(' '),
                bossActive: bossEncounterActive
            });
            originalError.apply(console, args);
        };
        
        console.warn = function(...args) {
            testResults.errorLogs.push({
                type: 'warning',
                timestamp: Date.now(),
                message: args.join(' '),
                bossActive: bossEncounterActive
            });
            originalWarn.apply(console, args);
        };
        
        setTimeout(() => {
            console.error = originalError;
            console.warn = originalWarn;
            console.log("[TEST 5] Complete. Logged", testResults.errorLogs.length, "errors/warnings");
        }, testConfig.testDuration);
    }
};

// Test runner
function runAllTests() {
    console.log("\n=== STARTING ALL TESTS ===\n");
    
    initializeTestHooks();
    
    // Run tests sequentially
    tests.testVisibilityTiming();
    tests.testBossSpecificDamage();
    tests.testRenderingPipeline();
    tests.testHitboxVsVisual();
    tests.testConsoleErrors();
    
    // Generate report after all tests
    setTimeout(() => {
        generateTestReport();
    }, testConfig.testDuration + 5000);
}

// Generate test report
function generateTestReport() {
    console.log("\n=== TEST REPORT ===\n");
    
    // Analyze visibility states
    const invisibilityEvents = testResults.visibilityStates.filter(state => 
        state.type === 'low_alpha' || state.type === 'missing_draw'
    );
    
    console.log("1. VISIBILITY ANALYSIS:");
    console.log("   - Total invisibility events:", invisibilityEvents.length);
    console.log("   - Events by boss type:");
    Object.keys(testResults.bossTypes).forEach(boss => {
        console.log(`     ${boss}:`, testResults.bossTypes[boss].invisibilityEvents);
    });
    
    console.log("\n2. DAMAGE CORRELATION:");
    console.log("   - Damage events by boss:", testResults.damageTypes);
    
    console.log("\n3. TIMING PATTERNS:");
    if (testResults.timingAnalysis.length > 0) {
        const invincibilityPeriods = testResults.timingAnalysis.filter(s => s.invincibilityTimer > 0);
        console.log("   - Invincibility periods detected:", invincibilityPeriods.length);
    }
    
    console.log("\n4. ERRORS DURING BOSS ENCOUNTERS:");
    const bossErrors = testResults.errorLogs.filter(e => e.bossActive);
    console.log("   - Total errors:", bossErrors.length);
    bossErrors.forEach(error => {
        console.log(`   - ${error.type}: ${error.message.substring(0, 50)}...`);
    });
    
    console.log("\n5. REPRODUCTION STEPS:");
    console.log("   Based on the test data, here are potential reproduction steps:");
    console.log("   1. Start game and collect elements");
    console.log("   2. Trigger boss encounter");
    console.log("   3. Get hit by boss projectile");
    console.log("   4. Observe player during respawn");
    console.log("   5. Check if player is invisible after respawn");
    
    console.log("\n=== END OF REPORT ===\n");
    
    // Store results globally for inspection
    window.invisibilityTestResults = testResults;
    console.log("Test results stored in window.invisibilityTestResults");
}

// Manual test helpers
window.testInvisibility = {
    run: runAllTests,
    
    // Force respawn to test invisibility
    forceRespawn: function() {
        if (playerSnake && playerSnake.alive) {
            console.log("[TEST] Forcing player death for respawn test...");
            playerSnake.die(true);
        } else {
            console.log("[TEST] Player already dead or doesn't exist");
        }
    },
    
    // Spawn specific boss
    spawnBoss: function(bossType = 'PYRAXIS') {
        console.log(`[TEST] Spawning ${bossType}...`);
        if (window.spawnBoss) {
            window.spawnBoss(bossType);
        }
    },
    
    // Monitor player state
    monitorPlayer: function() {
        setInterval(() => {
            if (playerSnake) {
                console.log("[MONITOR]", {
                    alive: playerSnake.alive,
                    invincibility: playerSnake.invincibilityTimer,
                    size: playerSnake.size,
                    segments: playerSnake.segments.length,
                    respawnTimer: playerRespawnTimer
                });
            }
        }, 1000);
    },
    
    // Get current test results
    getResults: function() {
        return testResults;
    }
};

console.log("\n=== TEST SUITE LOADED ===");
console.log("To run all tests: testInvisibility.run()");
console.log("To force respawn: testInvisibility.forceRespawn()");
console.log("To spawn boss: testInvisibility.spawnBoss('PYRAXIS')");
console.log("To monitor player: testInvisibility.monitorPlayer()");
console.log("To get results: testInvisibility.getResults()");