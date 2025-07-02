// Mobile Tab Debug Script
// Run this in console to diagnose tab visibility issues

(function() {
    console.log('=== Mobile Tab Debug ===');
    
    // Check mobile detection
    console.log('Mobile class on body:', document.body.classList.contains('mobile'));
    console.log('Window width:', window.innerWidth);
    console.log('User agent:', navigator.userAgent);
    
    // Check if panels exist
    const statsPanel = document.querySelector('.player-info-box');
    const leaderPanel = document.querySelector('.leaderboard-box');
    
    console.log('Stats panel exists:', !!statsPanel);
    console.log('Leaderboard panel exists:', !!leaderPanel);
    
    if (statsPanel) {
        console.log('Stats panel computed styles:');
        const statsStyles = window.getComputedStyle(statsPanel);
        console.log('- Position:', statsStyles.position);
        console.log('- Left:', statsStyles.left);
        console.log('- Top:', statsStyles.top);
        console.log('- Width:', statsStyles.width);
        console.log('- Display:', statsStyles.display);
        console.log('- Visibility:', statsStyles.visibility);
        console.log('- Z-index:', statsStyles.zIndex);
        
        // Check for tabs
        const statsTab = statsPanel.querySelector('.mobile-tab-handle');
        console.log('Stats tab exists:', !!statsTab);
        
        if (statsTab) {
            const tabStyles = window.getComputedStyle(statsTab);
            console.log('Stats tab computed styles:');
            console.log('- Position:', tabStyles.position);
            console.log('- Right:', tabStyles.right);
            console.log('- Display:', tabStyles.display);
            console.log('- Visibility:', tabStyles.visibility);
            console.log('- Z-index:', tabStyles.zIndex);
            console.log('- Width:', tabStyles.width);
            console.log('- Height:', tabStyles.height);
        }
    }
    
    if (leaderPanel) {
        console.log('\nLeaderboard panel computed styles:');
        const leaderStyles = window.getComputedStyle(leaderPanel);
        console.log('- Position:', leaderStyles.position);
        console.log('- Right:', leaderStyles.right);
        console.log('- Top:', leaderStyles.top);
        console.log('- Width:', leaderStyles.width);
        
        // Check for tabs
        const leaderTab = leaderPanel.querySelector('.mobile-tab-handle');
        console.log('Leaderboard tab exists:', !!leaderTab);
        
        if (leaderTab) {
            const tabStyles = window.getComputedStyle(leaderTab);
            console.log('Leaderboard tab computed styles:');
            console.log('- Position:', tabStyles.position);
            console.log('- Left:', tabStyles.left);
            console.log('- Display:', tabStyles.display);
            console.log('- Visibility:', tabStyles.visibility);
            console.log('- Z-index:', tabStyles.zIndex);
        }
    }
    
    // Try to force create tabs if missing
    if (!statsPanel?.querySelector('.mobile-tab-handle')) {
        console.log('\n!!! Stats tab missing - attempting to create...');
        if (window.unifiedMobileUI) {
            window.unifiedMobileUI.isInitialized = false;
            window.unifiedMobileUI.init();
        } else {
            console.error('unifiedMobileUI not found!');
        }
    }
    
    // Force mobile styles
    console.log('\nForcing mobile styles...');
    document.body.classList.add('mobile');
    
    // Check for CSS file
    const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    const mobileCSS = cssLinks.find(link => link.href.includes('mobile-ui-unified.css'));
    console.log('Mobile CSS loaded:', !!mobileCSS);
    
    console.log('=== End Debug ===');
})();