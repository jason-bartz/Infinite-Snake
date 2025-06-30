// Alternative 1: Grid-based distribution with random offset
rockFallAttackGridBased() {
    // Create ground fissures attack
    bossScreenShakeTimer = 60;
    bossScreenShakeIntensity = 12;
    
    // Clear existing fissures
    bossFissures = [];
    
    // Get visible world bounds
    const worldBounds = {
        left: cameraX - (canvas.width / 2) / cameraZoom,
        right: cameraX + (canvas.width / 2) / cameraZoom,
        top: cameraY - (canvas.height / 2) / cameraZoom,
        bottom: cameraY + (canvas.height / 2) / cameraZoom
    };
    
    // Create a grid of fissures
    const gridSize = 250; // Distance between fissures
    const randomOffset = 100; // Random offset from grid position
    
    for (let x = worldBounds.left; x <= worldBounds.right; x += gridSize) {
        for (let y = worldBounds.top; y <= worldBounds.bottom; y += gridSize) {
            // Add random offset to make it less uniform
            const offsetX = (Math.random() - 0.5) * randomOffset * 2;
            const offsetY = (Math.random() - 0.5) * randomOffset * 2;
            
            // Vary fissure sizes
            const size = 60 + Math.random() * 80; // 60-140 pixel radius
            
            bossFissures.push({
                x: x + offsetX,
                y: y + offsetY,
                radius: 0,
                targetRadius: size,
                growthSpeed: 3,
                life: 240,
                maxLife: 240,
                state: 'opening'
            });
        }
    }
}

// Alternative 2: Weighted distribution (more fissures near player)
rockFallAttackWeighted() {
    // Create ground fissures attack
    bossScreenShakeTimer = 60;
    bossScreenShakeIntensity = 12;
    
    // Clear existing fissures
    bossFissures = [];
    
    const fissureCount = 15 + Math.floor(Math.random() * 8); // 15-22 fissures
    
    for (let i = 0; i < fissureCount; i++) {
        // 40% chance to spawn near player, 60% chance for random position
        let x, y;
        
        if (Math.random() < 0.4 && playerSnake && playerSnake.alive) {
            // Spawn near player
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 300; // 100-400 pixels from player
            x = playerSnake.x + Math.cos(angle) * distance;
            y = playerSnake.y + Math.sin(angle) * distance;
        } else {
            // Random position on visible screen
            const worldBounds = {
                left: cameraX - (canvas.width / 2) / cameraZoom,
                right: cameraX + (canvas.width / 2) / cameraZoom,
                top: cameraY - (canvas.height / 2) / cameraZoom,
                bottom: cameraY + (canvas.height / 2) / cameraZoom
            };
            
            x = worldBounds.left + Math.random() * (worldBounds.right - worldBounds.left);
            y = worldBounds.top + Math.random() * (worldBounds.bottom - worldBounds.top);
        }
        
        // Vary fissure sizes
        const size = 60 + Math.random() * 80; // 60-140 pixel radius
        
        bossFissures.push({
            x: x,
            y: y,
            radius: 0,
            targetRadius: size,
            growthSpeed: 3,
            life: 240,
            maxLife: 240,
            state: 'opening'
        });
    }
}

// Alternative 3: Spiral pattern from center of screen
rockFallAttackSpiral() {
    // Create ground fissures attack
    bossScreenShakeTimer = 60;
    bossScreenShakeIntensity = 12;
    
    // Clear existing fissures
    bossFissures = [];
    
    const fissureCount = 20;
    const spiralTurns = 3;
    
    for (let i = 0; i < fissureCount; i++) {
        const t = i / fissureCount;
        const angle = t * Math.PI * 2 * spiralTurns;
        const distance = t * Math.min(canvas.width, canvas.height) / cameraZoom / 2;
        
        const x = cameraX + Math.cos(angle) * distance;
        const y = cameraY + Math.sin(angle) * distance;
        
        // Vary fissure sizes (smaller at center, larger at edges)
        const size = 40 + t * 100; // 40-140 pixel radius
        
        bossFissures.push({
            x: x,
            y: y,
            radius: 0,
            targetRadius: size,
            growthSpeed: 3 + t * 2, // Outer fissures open faster
            life: 240,
            maxLife: 240,
            state: 'opening'
        });
    }
}