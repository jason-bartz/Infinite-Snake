// Mobile UI Inline Style Fix
// This script applies inline styles directly to ensure tabs are visible

(function() {
    console.log('Applying inline style fixes for mobile tabs...');
    
    // Wait for panels to exist
    function applyFixes() {
        const statsPanel = document.querySelector('.player-info-box');
        const leaderPanel = document.querySelector('.leaderboard-box');
        
        if (!statsPanel || !leaderPanel) {
            console.log('Panels not found, retrying...');
            setTimeout(applyFixes, 500);
            return;
        }
        
        // Fix panel positions with inline styles
        statsPanel.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            left: -270px !important;
            width: 280px !important;
            height: auto !important;
            background: rgba(16, 16, 64, 0.95) !important;
            border: 3px solid #5878F8 !important;
            border-left: none !important;
            border-radius: 0 8px 8px 0 !important;
            z-index: 100 !important;
            transition: left 0.3s ease-out !important;
            overflow: visible !important;
        `;
        
        leaderPanel.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            right: -270px !important;
            width: 280px !important;
            height: auto !important;
            background: rgba(0, 0, 0, 0.95) !important;
            border: 3px solid #F8F8F8 !important;
            border-right: none !important;
            border-radius: 8px 0 0 8px !important;
            z-index: 100 !important;
            transition: right 0.3s ease-out !important;
            overflow: visible !important;
        `;
        
        // Find or create tabs
        let statsTab = statsPanel.querySelector('.mobile-tab-handle');
        let leaderTab = leaderPanel.querySelector('.mobile-tab-handle');
        
        // Create stats tab if missing
        if (!statsTab) {
            console.log('Creating stats tab with inline styles...');
            statsTab = document.createElement('div');
            statsTab.className = 'mobile-tab-handle stats-tab';
            statsPanel.appendChild(statsTab);
        }
        
        // Apply inline styles to stats tab
        statsTab.style.cssText = `
            position: absolute !important;
            right: -50px !important;
            top: 10px !important;
            width: 50px !important;
            height: 80px !important;
            background: rgba(16, 16, 64, 0.95) !important;
            border: 3px solid #5878F8 !important;
            border-left: none !important;
            border-radius: 0 8px 8px 0 !important;
            cursor: pointer !important;
            z-index: 10000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            box-shadow: 4px 0 10px rgba(0, 0, 0, 0.5) !important;
        `;
        
        // Add skin preview if missing
        if (!statsTab.querySelector('.mobile-tab-skin')) {
            const skinDiv = document.createElement('div');
            skinDiv.className = 'mobile-tab-skin';
            skinDiv.style.cssText = `
                width: 32px !important;
                height: 32px !important;
                background-image: url('skins/snake-default-green.png') !important;
                background-size: contain !important;
                background-repeat: no-repeat !important;
                background-position: center !important;
                image-rendering: pixelated !important;
            `;
            statsTab.appendChild(skinDiv);
        }
        
        // Create leaderboard tab if missing
        if (!leaderTab) {
            console.log('Creating leaderboard tab with inline styles...');
            leaderTab = document.createElement('div');
            leaderTab.className = 'mobile-tab-handle leaderboard-tab';
            leaderTab.innerHTML = '🏆';
            leaderPanel.appendChild(leaderTab);
        }
        
        // Apply inline styles to leaderboard tab
        leaderTab.style.cssText = `
            position: absolute !important;
            left: -50px !important;
            top: 10px !important;
            width: 50px !important;
            height: 80px !important;
            background: rgba(0, 0, 0, 0.95) !important;
            border: 3px solid #F8F8F8 !important;
            border-right: none !important;
            border-radius: 8px 0 0 8px !important;
            cursor: pointer !important;
            z-index: 10000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 24px !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            box-shadow: -4px 0 10px rgba(0, 0, 0, 0.5) !important;
        `;
        
        // Add click handlers if not present
        if (!statsTab.hasAttribute('data-click-handler')) {
            statsTab.setAttribute('data-click-handler', 'true');
            statsTab.addEventListener('click', function(e) {
                e.stopPropagation();
                if (statsPanel.style.left === '0px') {
                    statsPanel.style.left = '-270px';
                } else {
                    statsPanel.style.left = '0px';
                }
            });
        }
        
        if (!leaderTab.hasAttribute('data-click-handler')) {
            leaderTab.setAttribute('data-click-handler', 'true');
            leaderTab.addEventListener('click', function(e) {
                e.stopPropagation();
                if (leaderPanel.style.right === '0px') {
                    leaderPanel.style.right = '-270px';
                } else {
                    leaderPanel.style.right = '0px';
                }
            });
        }
        
        console.log('Inline style fixes applied successfully!');
        console.log('Stats tab visible:', window.getComputedStyle(statsTab).visibility);
        console.log('Leader tab visible:', window.getComputedStyle(leaderTab).visibility);
    }
    
    // Start applying fixes
    applyFixes();
})();

// Make it globally accessible
window.applyMobileTabFix = function() {
    const script = document.createElement('script');
    script.textContent = '(' + arguments.callee.toString() + ')()';
    document.head.appendChild(script);
};