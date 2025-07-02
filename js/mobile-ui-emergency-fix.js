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
        
        console.log('Emergency Mobile UI Fix: Complete');
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