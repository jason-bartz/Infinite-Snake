// Mobile Tab Diagnostic Script
// Run this in the browser console to diagnose mobile tab issues

function diagnoseMobileTabs() {
    console.log('=== MOBILE TAB DIAGNOSTIC ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // 1. Check mobile detection
    console.log('\n1. MOBILE DETECTION:');
    console.log('- Body has mobile class:', document.body.classList.contains('mobile'));
    console.log('- Window width:', window.innerWidth);
    console.log('- User agent:', navigator.userAgent);
    console.log('- Touch support:', 'ontouchstart' in window);
    console.log('- Pointer coarse:', window.matchMedia("(pointer: coarse)").matches);
    
    // 2. Check UnifiedMobileUI
    console.log('\n2. UNIFIEDMOBILEUI STATUS:');
    if (window.unifiedMobileUI) {
        console.log('- unifiedMobileUI exists: YES');
        console.log('- isInitialized:', window.unifiedMobileUI.isInitialized);
        console.log('- statsPanel:', window.unifiedMobileUI.statsPanel);
        console.log('- leaderboardPanel:', window.unifiedMobileUI.leaderboardPanel);
    } else {
        console.log('- unifiedMobileUI exists: NO');
    }
    
    // 3. Check DOM elements
    console.log('\n3. DOM ELEMENTS:');
    const statsPanel = document.querySelector('.player-info-box');
    const leaderboardPanel = document.querySelector('.leaderboard-box');
    console.log('- Stats panel:', statsPanel ? 'FOUND' : 'NOT FOUND');
    console.log('- Leaderboard panel:', leaderboardPanel ? 'FOUND' : 'NOT FOUND');
    
    // 4. Check for tabs
    console.log('\n4. MOBILE TABS:');
    const allTabs = document.querySelectorAll('.mobile-tab-handle');
    console.log('- Total tabs found:', allTabs.length);
    
    const statsTabs = document.querySelectorAll('.player-info-box .mobile-tab-handle');
    console.log('- Stats tabs:', statsTabs.length);
    
    const leaderboardTabs = document.querySelectorAll('.leaderboard-box .mobile-tab-handle');
    console.log('- Leaderboard tabs:', leaderboardTabs.length);
    
    // 5. Check tab styles
    if (statsTabs.length > 0) {
        console.log('\n5. STATS TAB COMPUTED STYLES:');
        const tab = statsTabs[0];
        const styles = window.getComputedStyle(tab);
        console.log('- display:', styles.display);
        console.log('- visibility:', styles.visibility);
        console.log('- opacity:', styles.opacity);
        console.log('- position:', styles.position);
        console.log('- right:', styles.right);
        console.log('- width:', styles.width);
        console.log('- height:', styles.height);
        console.log('- z-index:', styles.zIndex);
        console.log('- background:', styles.background);
    }
    
    // 6. Check panel styles
    if (statsPanel) {
        console.log('\n6. STATS PANEL COMPUTED STYLES:');
        const styles = window.getComputedStyle(statsPanel);
        console.log('- position:', styles.position);
        console.log('- left:', styles.left);
        console.log('- overflow:', styles.overflow);
        console.log('- z-index:', styles.zIndex);
    }
    
    // 7. Check CSS files
    console.log('\n7. LOADED CSS FILES:');
    const cssFiles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => link.href);
    cssFiles.forEach(file => {
        if (file.includes('mobile')) {
            console.log('- ' + file.split('/').pop());
        }
    });
    
    // 8. Try to manually create tabs
    console.log('\n8. MANUAL TAB CREATION TEST:');
    if (document.body.classList.contains('mobile') && statsPanel && !statsTabs.length) {
        console.log('- Attempting to manually initialize mobile UI...');
        if (window.unifiedMobileUI && !window.unifiedMobileUI.isInitialized) {
            window.unifiedMobileUI.init();
            console.log('- Called unifiedMobileUI.init()');
        } else if (window.unifiedMobileUI && window.unifiedMobileUI.isInitialized) {
            console.log('- Mobile UI already initialized, calling setupPanels()...');
            window.unifiedMobileUI.setupPanels();
        }
    }
    
    console.log('\n=== END DIAGNOSTIC ===');
}

// Auto-run the diagnostic
diagnoseMobileTabs();

// Also make it available globally
window.diagnoseMobileTabs = diagnoseMobileTabs;