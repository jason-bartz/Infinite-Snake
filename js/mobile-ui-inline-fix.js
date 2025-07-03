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
            left: -283px !important;
            width: 280px !important;
            height: auto !important;
            background: #101040 !important;
            border: 3px solid !important;
            border-color: #5878F8 #000000 #000000 #5878F8 !important;
            border-left: none !important;
            border-radius: 0 !important;
            z-index: 100 !important;
            transition: left 0.3s ease-out !important;
            overflow: visible !important;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.8) !important;
        `;
        
        leaderPanel.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            right: -283px !important;
            width: 280px !important;
            height: auto !important;
            background: #000000 !important;
            border: 3px solid !important;
            border-color: #F8F8F8 #505050 #505050 #F8F8F8 !important;
            border-right: none !important;
            border-radius: 0 !important;
            z-index: 100 !important;
            transition: right 0.3s ease-out !important;
            overflow: visible !important;
            box-shadow: -4px 4px 0 rgba(0,0,0,0.8) !important;
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
            right: -43px !important;
            top: 10px !important;
            width: 43px !important;
            height: 60px !important;
            background: #101040 !important;
            border: 3px solid !important;
            border-color: #5878F8 #000000 #000000 !important;
            border-left: none !important;
            border-radius: 0 !important;
            cursor: pointer !important;
            z-index: 10000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            box-shadow: 4px 4px 0 rgba(0,0,0,0.8) !important;
            image-rendering: pixelated !important;
            image-rendering: -moz-crisp-edges !important;
            image-rendering: crisp-edges !important;
        `;
        
        // Add skin preview if missing
        if (!statsTab.querySelector('.mobile-tab-skin')) {
            const skinDiv = document.createElement('div');
            skinDiv.className = 'mobile-tab-skin';
            skinDiv.style.cssText = `
                width: 24px !important;
                height: 24px !important;
                background-image: url('skins/snake-default-green.png') !important;
                background-size: contain !important;
                background-repeat: no-repeat !important;
                background-position: center !important;
                image-rendering: pixelated !important;
                image-rendering: -moz-crisp-edges !important;
                image-rendering: crisp-edges !important;
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
            left: -43px !important;
            top: 10px !important;
            width: 43px !important;
            height: 60px !important;
            background: #000000 !important;
            border: 3px solid !important;
            border-color: #F8F8F8 #505050 #505050 !important;
            border-right: none !important;
            border-radius: 0 !important;
            cursor: pointer !important;
            z-index: 10000 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            font-size: 20px !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            box-shadow: -4px 4px 0 rgba(0,0,0,0.8) !important;
            image-rendering: pixelated !important;
            image-rendering: -moz-crisp-edges !important;
            image-rendering: crisp-edges !important;
        `;
        
        // Add click handlers if not present
        if (!statsTab.hasAttribute('data-click-handler')) {
            statsTab.setAttribute('data-click-handler', 'true');
            statsTab.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                // Toggle expanded class instead of inline styles
                if (statsPanel.classList.contains('expanded')) {
                    statsPanel.classList.remove('expanded');
                    statsPanel.style.left = '-283px';
                } else {
                    // Close other panel first
                    leaderPanel.classList.remove('expanded');
                    leaderPanel.style.right = '-283px';
                    // Open this panel
                    statsPanel.classList.add('expanded');
                    statsPanel.style.left = '0px';
                }
            });
            
            // Also add touch handler
            statsTab.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                e.preventDefault();
                statsTab.click();
            });
        }
        
        if (!leaderTab.hasAttribute('data-click-handler')) {
            leaderTab.setAttribute('data-click-handler', 'true');
            leaderTab.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                // Toggle expanded class instead of inline styles
                if (leaderPanel.classList.contains('expanded')) {
                    leaderPanel.classList.remove('expanded');
                    leaderPanel.style.right = '-283px';
                } else {
                    // Close other panel first
                    statsPanel.classList.remove('expanded');
                    statsPanel.style.left = '-283px';
                    // Open this panel
                    leaderPanel.classList.add('expanded');
                    leaderPanel.style.right = '0px';
                }
            });
            
            // Also add touch handler
            leaderTab.addEventListener('touchstart', function(e) {
                e.stopPropagation();
                e.preventDefault();
                leaderTab.click();
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