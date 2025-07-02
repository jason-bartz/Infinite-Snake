// Emergency Mobile UI Fix - Force create missing elements
(function() {
    function emergencyMobileFix() {
        console.log('Emergency Mobile UI Fix: Running...');
        
        // Check if we're on mobile
        const isMobile = document.body.classList.contains('mobile') || 
                        window.innerWidth <= 1024 ||
                        /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
        
        if (!isMobile) {
            console.log('Emergency Mobile UI Fix: Not mobile, skipping');
            return;
        }
        
        // Force add mobile class
        document.body.classList.add('mobile');
        
        // Check for player info box
        let playerBox = document.querySelector('.player-info-box');
        if (!playerBox) {
            console.error('Emergency Mobile UI Fix: Player info box missing!');
            // The element should exist in the HTML, so this is a critical error
        } else {
            console.log('Emergency Mobile UI Fix: Player info box found');
            // Force visibility
            playerBox.style.display = 'block';
            playerBox.style.visibility = 'visible';
            playerBox.style.opacity = '1';
        }
        
        // Check for leaderboard box
        let leaderboard = document.querySelector('.leaderboard-box');
        if (!leaderboard) {
            console.error('Emergency Mobile UI Fix: Leaderboard box missing!');
        } else {
            console.log('Emergency Mobile UI Fix: Leaderboard box found');
            // Force visibility
            leaderboard.style.display = 'block';
            leaderboard.style.visibility = 'visible';
            leaderboard.style.opacity = '1';
        }
        
        // Fix boost button position
        const boostButton = document.querySelector('.boost-button');
        if (boostButton) {
            console.log('Emergency Mobile UI Fix: Fixing boost button position');
            boostButton.style.position = 'absolute';
            boostButton.style.bottom = '40px';
            boostButton.style.right = '40px';
            boostButton.style.left = 'auto';
            boostButton.style.width = '100px';
            boostButton.style.height = '100px';
        }
        
        // Fix joystick position
        const joystick = document.querySelector('.virtual-joystick');
        if (joystick) {
            console.log('Emergency Mobile UI Fix: Fixing joystick position');
            joystick.style.position = 'absolute';
            joystick.style.bottom = '40px';
            joystick.style.left = '40px';
            joystick.style.right = 'auto';
        }
        
        // Force hide boost bar
        const boostBar = document.querySelector('.boost-bar-container');
        if (boostBar) {
            console.log('Emergency Mobile UI Fix: Hiding boost bar');
            boostBar.style.display = 'none';
            boostBar.style.visibility = 'hidden';
            boostBar.style.height = '0';
        }
        
        // Add click handlers for the panels
        addPanelClickHandlers();
        
        console.log('Emergency Mobile UI Fix: Complete');
    }
    
    function addPanelClickHandlers() {
        console.log('Emergency Mobile UI Fix: Adding panel click handlers');
        
        // For player info box
        const playerBox = document.querySelector('.player-info-box');
        if (playerBox && !playerBox.querySelector('.mobile-tab-handle')) {
            // Create clickable tab
            const playerTab = document.createElement('div');
            playerTab.className = 'mobile-tab-handle player-tab';
            playerTab.style.cssText = `
                position: absolute;
                right: -50px;
                top: 10px;
                width: 50px;
                height: 70px;
                background: rgba(16, 16, 64, 0.9);
                border: 2px solid #5878F8;
                border-left: none;
                border-radius: 0 8px 8px 0;
                cursor: pointer;
                z-index: 102;
            `;
            
            // Add skin preview
            const skinPreview = document.createElement('img');
            const portrait = document.querySelector('.player-portrait img');
            skinPreview.src = portrait ? portrait.src : 'skins/snake-default-green.png';
            skinPreview.style.cssText = `
                width: 36px;
                height: 36px;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                image-rendering: pixelated;
            `;
            playerTab.appendChild(skinPreview);
            
            playerBox.appendChild(playerTab);
            
            // Add click handler
            playerTab.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Player tab clicked');
                playerBox.classList.toggle('expanded');
            });
        }
        
        // For leaderboard box
        const leaderboard = document.querySelector('.leaderboard-box');
        if (leaderboard && !leaderboard.querySelector('.mobile-tab-handle')) {
            // Create clickable tab
            const leaderTab = document.createElement('div');
            leaderTab.className = 'mobile-tab-handle leaderboard-tab';
            leaderTab.innerHTML = '🏆';
            leaderTab.style.cssText = `
                position: absolute;
                right: -50px;
                top: 10px;
                width: 50px;
                height: 70px;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #F8F8F8;
                border-left: none;
                border-radius: 0 8px 8px 0;
                cursor: pointer;
                z-index: 102;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            `;
            
            leaderboard.appendChild(leaderTab);
            
            // Add click handler
            leaderTab.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Leaderboard tab clicked');
                leaderboard.classList.toggle('expanded');
            });
        }
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', emergencyMobileFix);
    } else {
        emergencyMobileFix();
    }
    
    // Also run after a delay to catch any late-loading elements
    setTimeout(emergencyMobileFix, 1000);
    setTimeout(emergencyMobileFix, 2000);
})();