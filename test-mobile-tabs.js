// Test script to manually create and verify mobile tabs
function testMobileTabs() {
    console.log('=== Mobile Tab Test ===');
    
    // Force mobile class
    document.body.classList.add('mobile');
    console.log('Mobile class added');
    
    // Find panels
    const statsPanel = document.querySelector('.player-info-box');
    const leaderboardPanel = document.querySelector('.leaderboard-box');
    
    console.log('Stats panel:', statsPanel ? 'found' : 'not found');
    console.log('Leaderboard panel:', leaderboardPanel ? 'found' : 'not found');
    
    if (!statsPanel || !leaderboardPanel) {
        console.error('Panels not found!');
        return;
    }
    
    // Remove any existing tabs
    document.querySelectorAll('.mobile-tab-handle').forEach(tab => tab.remove());
    console.log('Cleared existing tabs');
    
    // Create stats tab
    const statsTab = document.createElement('div');
    statsTab.className = 'mobile-tab-handle stats-tab';
    statsTab.style.cssText = `
        position: absolute;
        right: -50px;
        top: 10px;
        width: 50px;
        height: 80px;
        background: red;
        border: 2px solid white;
        z-index: 9999;
        cursor: pointer;
    `;
    statsTab.innerHTML = '📊';
    statsPanel.appendChild(statsTab);
    console.log('Stats tab created');
    
    // Create leaderboard tab
    const leaderboardTab = document.createElement('div');
    leaderboardTab.className = 'mobile-tab-handle leaderboard-tab';
    leaderboardTab.style.cssText = `
        position: absolute;
        left: -50px;
        top: 10px;
        width: 50px;
        height: 80px;
        background: blue;
        border: 2px solid white;
        z-index: 9999;
        cursor: pointer;
    `;
    leaderboardTab.innerHTML = '🏆';
    leaderboardPanel.appendChild(leaderboardTab);
    console.log('Leaderboard tab created');
    
    // Add click handlers
    statsTab.onclick = () => {
        console.log('Stats tab clicked');
        statsPanel.classList.toggle('expanded');
    };
    
    leaderboardTab.onclick = () => {
        console.log('Leaderboard tab clicked');
        leaderboardPanel.classList.toggle('expanded');
    };
    
    // Verify tabs exist
    const verifyStats = document.querySelector('.player-info-box .mobile-tab-handle');
    const verifyLeaderboard = document.querySelector('.leaderboard-box .mobile-tab-handle');
    
    console.log('Stats tab verification:', verifyStats ? 'SUCCESS' : 'FAILED');
    console.log('Leaderboard tab verification:', verifyLeaderboard ? 'SUCCESS' : 'FAILED');
    
    // Check computed styles
    if (verifyStats) {
        const computed = window.getComputedStyle(verifyStats);
        console.log('Stats tab computed style:', {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            position: computed.position,
            right: computed.right,
            zIndex: computed.zIndex
        });
    }
    
    // Force panels to have overflow visible
    statsPanel.style.overflow = 'visible';
    leaderboardPanel.style.overflow = 'visible';
    console.log('Set panels overflow to visible');
    
    console.log('=== Test Complete ===');
}

// Run test after a delay to ensure DOM is ready
setTimeout(testMobileTabs, 2000);

// Also make it available globally
window.testMobileTabs = testMobileTabs;