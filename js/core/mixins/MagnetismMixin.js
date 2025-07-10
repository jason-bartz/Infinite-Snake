// Magnetism behavior mixin for entities that attract to snakes
export const MagnetismMixin = {
    // Default magnetism parameters - can be overridden by classes
    magnetRange: 100,
    magnetStrength: 4.0,
    
    applyMagnetism(deltaTime = 1, useSquaredDistances = true) {
        const magnetRange = this.magnetRange;
        const magnetStrength = this.magnetStrength;
        const minDistance = this.size || this.ELEMENT_SIZE || 20;
        
        // Pre-calculate squared values if using optimization
        const magnetRangeSq = useSquaredDistances ? magnetRange * magnetRange : magnetRange;
        const minDistanceSq = useSquaredDistances ? minDistance * minDistance : minDistance;
        
        for (const snake of snakes) {
            if (!snake.alive) continue;
            
            const dx = snake.x - this.x;
            const dy = snake.y - this.y;
            
            let distance, distanceCheck;
            
            if (useSquaredDistances) {
                const distanceSq = dx * dx + dy * dy;
                distanceCheck = distanceSq;
                
                if (distanceSq < magnetRangeSq && distanceSq > minDistanceSq) {
                    distance = Math.sqrt(distanceSq);
                } else {
                    continue;
                }
            } else {
                distance = Math.hypot(dx, dy);
                distanceCheck = distance;
                
                if (distance >= magnetRange || distance <= minDistance) {
                    continue;
                }
            }
            
            const dirX = dx / distance;
            const dirY = dy / distance;
            const pullStrength = (1 - distance / magnetRange) * magnetStrength * deltaTime;
            
            this.x += dirX * pullStrength;
            this.y += dirY * pullStrength;
        }
    }
};

// Helper function to apply mixin to a class
export function withMagnetism(BaseClass, magnetRange = 100, magnetStrength = 4.0) {
    return class extends BaseClass {
        constructor(...args) {
            super(...args);
            this.magnetRange = magnetRange;
            this.magnetStrength = magnetStrength;
        }
        
        applyMagnetism(deltaTime = 1, useSquaredDistances = true) {
            MagnetismMixin.applyMagnetism.call(this, deltaTime, useSquaredDistances);
        }
    };
}