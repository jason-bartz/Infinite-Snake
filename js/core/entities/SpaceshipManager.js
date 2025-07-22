import Spaceship from './Spaceship.js';

class SpaceshipManager {
    constructor(context, canvas) {
        this.context = context;
        this.canvas = canvas;
        this.spaceships = [];
        this.maxSpaceships = 2;
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
            
            // Random chance to actually spawn
            if (Math.random() < this.spawnChance) {
                this.spawnSpaceship();
            }
            
            // Calculate next potential spawn time
            this.nextSpawnTime = this.calculateNextSpawnTime();
        }
    }
    
    spawnSpaceship() {
        const spaceship = new Spaceship(this.context, this.canvas);
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