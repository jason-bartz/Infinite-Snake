export const MAGNETISM_PRESETS = {
    element: { range: 100, strength: 4.0 },
    powerUp: { range: 150, strength: 5.0 },
    powerUpWithDelta: { range: 150, strength: 1.5 }
};

export function applyMagnetism(entity, deltaTime = 1, useSquaredDistance = false) {
    const { magnetRange, magnetStrength } = entity;
    if (!magnetRange || !magnetStrength) return;
    
    for (const snake of snakes) {
        if (!snake.isAlive) continue;
        
        const dx = snake.x - entity.x;
        const dy = snake.y - entity.y;
        const distanceSquared = dx * dx + dy * dy;
        
        if (useSquaredDistance) {
            const rangeSquared = magnetRange * magnetRange;
            if (distanceSquared < rangeSquared && distanceSquared > 0) {
                const distance = Math.sqrt(distanceSquared);
                const dirX = dx / distance;
                const dirY = dy / distance;
                const pullStrength = (1 - distance / magnetRange) * magnetStrength * deltaTime;
                
                entity.x += dirX * pullStrength;
                entity.y += dirY * pullStrength;
            }
        } else {
            const distance = Math.hypot(dx, dy);
            const minDistance = entity.constructor.name === 'Element' ? ELEMENT_SIZE : 0;
            
            if (distance < magnetRange && distance > minDistance) {
                const dirX = dx / distance;
                const dirY = dy / distance;
                const pullStrength = (1 - distance / magnetRange) * magnetStrength * deltaTime;
                
                entity.x += dirX * pullStrength;
                entity.y += dirY * pullStrength;
            }
        }
    }
}

export const MagnetismMixin = {
    initMagnetism(preset = MAGNETISM_PRESETS.element) {
        this.magnetRange = preset.range;
        this.magnetStrength = preset.strength;
    },
    
    applyMagnetism(deltaTime = 1, useSquaredDistance = false) {
        applyMagnetism(this, deltaTime, useSquaredDistance);
    }
};