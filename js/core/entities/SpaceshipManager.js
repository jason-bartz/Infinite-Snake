import Spaceship from './Spaceship.js';

class SpaceshipManager {
    constructor(context, canvas) {
        this.context = context;
        this.canvas = canvas;
        this.spaceships = [];
        this.maxSpaceships = 4; // Total maximum
        this.maxRegularSpaceships = 3; // Max regular spaceships (1-9)
        this.maxSpecialSpaceships = 1; // Max special spaceships
        this.minSpawnInterval = 10000; // 10 seconds minimum
        this.maxSpawnInterval = 30000; // 30 seconds maximum
        this.lastSpawnTime = Date.now();
        this.nextSpawnTime = this.calculateNextSpawnTime();
        this.spawnChance = 0.3; // 30% chance when spawn time is reached
    }
    
    calculateNextSpawnTime() {
        return Date.now() + this.minSpawnInterval + 
               Math.random() * (this.maxSpawnInterval - this.minSpawnInterval);
    }
    
    update() {
        // Update existing spaceships
        this.spaceships.forEach(spaceship => spaceship.update());
        
        // Remove inactive spaceships
        this.spaceships = this.spaceships.filter(spaceship => spaceship.active);
        
        // Check if it's time to spawn a new spaceship
        const currentTime = Date.now();
        if (currentTime >= this.nextSpawnTime && 
            this.spaceships.length < this.maxSpaceships) {
            
            // Count current spaceship types
            const regularCount = this.spaceships.filter(s => !s.isSpecial).length;
            const specialCount = this.spaceships.filter(s => s.isSpecial).length;
            
            // Random chance to actually spawn
            if (Math.random() < this.spawnChance) {
                // Decide whether to spawn regular or special
                const spawnSpecial = specialCount < this.maxSpecialSpaceships && 
                                   Math.random() < 0.25; // 25% chance for special
                
                if (spawnSpecial || regularCount < this.maxRegularSpaceships) {
                    this.spawnSpaceship(spawnSpecial);
                }
            }
            
            // Calculate next potential spawn time
            this.nextSpawnTime = this.calculateNextSpawnTime();
        }
    }
    
    spawnSpaceship(isSpecial = false) {
        const spaceship = new Spaceship(this.context, this.canvas, isSpecial);
        this.spaceships.push(spaceship);
    }
    
    render() {
        // Render all active spaceships
        this.spaceships.forEach(spaceship => spaceship.render());
    }
    
    resize(width, height) {
        this.canvas = { width, height };
    }
}

// Make SpaceshipManager available globally
window.SpaceshipManager = SpaceshipManager;

export default SpaceshipManager;