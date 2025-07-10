// Base class for entities with magnetic attraction to snakes
export class MagneticEntity {
    constructor(x, y, config = {}) {
        this.x = x;
        this.y = y;
        
        // Allow configuration of magnetism parameters
        this.magnetRange = config.magnetRange ?? 100;
        this.magnetStrength = config.magnetStrength ?? 4.0;
        this.size = config.size ?? 20;
        this.useSquaredDistances = config.useSquaredDistances ?? true;
        this.applyDeltaTime = config.applyDeltaTime ?? true;
    }
    
    applyMagnetism(deltaTime = 1) {
        const magnetRange = this.magnetRange;
        const magnetStrength = this.magnetStrength;
        const minDistance = this.size || this.ELEMENT_SIZE || 20;
        
        // Pre-calculate squared values if using optimization
        const magnetRangeSq = this.useSquaredDistances ? magnetRange * magnetRange : magnetRange;
        const minDistanceSq = this.useSquaredDistances ? minDistance * minDistance : minDistance;
        
        for (const snake of snakes) {
            if (!snake.alive) continue;
            
            const dx = snake.x - this.x;
            const dy = snake.y - this.y;
            
            let distance;
            
            if (this.useSquaredDistances) {
                const distanceSq = dx * dx + dy * dy;
                
                if (distanceSq < magnetRangeSq && distanceSq > minDistanceSq) {
                    distance = Math.sqrt(distanceSq);
                } else {
                    continue;
                }
            } else {
                distance = Math.hypot(dx, dy);
                
                if (distance >= magnetRange || distance <= minDistance) {
                    continue;
                }
            }
            
            const dirX = dx / distance;
            const dirY = dy / distance;
            let pullStrength = (1 - distance / magnetRange) * magnetStrength;
            
            // Apply deltaTime if configured (for frame-rate independent movement)
            if (this.applyDeltaTime) {
                pullStrength *= deltaTime;
            }
            
            this.x += dirX * pullStrength;
            this.y += dirY * pullStrength;
        }
    }
}

// Preset configurations for different entity types
export const MAGNETISM_PRESETS = {
    element: {
        magnetRange: 100,
        magnetStrength: 4.0,
        useSquaredDistances: false,
        applyDeltaTime: true
    },
    powerUp: {
        magnetRange: 120,
        magnetStrength: 5.0,
        useSquaredDistances: true,
        applyDeltaTime: false  // Note: CatalystGem and VoidOrb don't use deltaTime
    },
    powerUpWithDelta: {
        magnetRange: 120,
        magnetStrength: 5.0,
        useSquaredDistances: true,
        applyDeltaTime: true  // For AlchemyVision
    }
};