// Mobile Background Performance Optimizer
class MobileBackgroundOptimizer {
    constructor() {
        this.performanceMode = 'auto'; // 'low', 'medium', 'high', 'auto'
        this.lastFrameTimes = [];
        this.targetFPS = 60;
        this.measurementWindow = 30; // frames
        
        // Feature toggles based on performance
        this.features = {
            stars: true,
            planets: true,
            nebulae: false,
            parallax: true,
            twinkle: true,
            shootingStars: false
        };
        
        // LOD settings
        this.lod = {
            starCount: { low: 30, medium: 60, high: 100 },
            planetCount: { low: 2, medium: 4, high: 6 },
            parallaxLayers: { low: 1, medium: 2, high: 3 },
            updateFrequency: { low: 4, medium: 2, high: 1 } // Update every N frames
        };
        
        this.currentLOD = 'medium';
        this.frameCounter = 0;
    }
    
    measurePerformance(deltaTime) {
        this.lastFrameTimes.push(deltaTime);
        if (this.lastFrameTimes.length > this.measurementWindow) {
            this.lastFrameTimes.shift();
        }
        
        if (this.lastFrameTimes.length === this.measurementWindow) {
            const avgFrameTime = this.lastFrameTimes.reduce((a, b) => a + b) / this.measurementWindow;
            const currentFPS = 1000 / avgFrameTime;
            
            // Adjust LOD based on FPS
            if (currentFPS < 50 && this.currentLOD !== 'low') {
                this.currentLOD = 'low';
                this.adjustFeatures();
            } else if (currentFPS > 55 && currentFPS < 60 && this.currentLOD !== 'medium') {
                this.currentLOD = 'medium';
                this.adjustFeatures();
            } else if (currentFPS >= 60 && this.currentLOD !== 'high') {
                this.currentLOD = 'high';
                this.adjustFeatures();
            }
        }
    }
    
    adjustFeatures() {
        switch (this.currentLOD) {
            case 'low':
                this.features = {
                    stars: true,
                    planets: false,
                    nebulae: false,
                    parallax: false,
                    twinkle: false,
                    shootingStars: false
                };
                break;
            case 'medium':
                this.features = {
                    stars: true,
                    planets: true,
                    nebulae: false,
                    parallax: true,
                    twinkle: true,
                    shootingStars: false
                };
                break;
            case 'high':
                this.features = {
                    stars: true,
                    planets: true,
                    nebulae: true,
                    parallax: true,
                    twinkle: true,
                    shootingStars: true
                };
                break;
        }
    }
    
    shouldUpdate(feature) {
        if (!this.features[feature]) return false;
        
        const updateFreq = this.lod.updateFrequency[this.currentLOD];
        return this.frameCounter % updateFreq === 0;
    }
    
    getStarCount() {
        return this.lod.starCount[this.currentLOD];
    }
    
    getPlanetCount() {
        return this.lod.planetCount[this.currentLOD];
    }
    
    getParallaxLayers() {
        return this.lod.parallaxLayers[this.currentLOD];
    }
    
    update() {
        this.frameCounter++;
    }
}

// Optimized planet renderer for mobile
class MobilePlanetRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.planets = [];
        this.planetCache = new Map();
        this.initPlanets();
    }
    
    initPlanets() {
        // Pre-render planets to offscreen canvases
        const planetTypes = [
            { radius: 30, color1: '#ff6b6b', color2: '#4ecdc4', rings: false },
            { radius: 40, color1: '#95e1d3', color2: '#f38181', rings: true },
            { radius: 35, color1: '#a8e6cf', color2: '#ffd3b6', rings: false },
            { radius: 45, color1: '#ff8b94', color2: '#a8d8ea', rings: true }
        ];
        
        planetTypes.forEach((type, index) => {
            const offscreen = document.createElement('canvas');
            const size = type.radius * 2 + (type.rings ? 40 : 0);
            offscreen.width = size;
            offscreen.height = size;
            const offCtx = offscreen.getContext('2d');
            
            // Draw planet
            const centerX = size / 2;
            const centerY = size / 2;
            
            // Simple gradient planet
            const gradient = offCtx.createRadialGradient(
                centerX - type.radius * 0.3, 
                centerY - type.radius * 0.3, 
                0,
                centerX, 
                centerY, 
                type.radius
            );
            gradient.addColorStop(0, type.color1);
            gradient.addColorStop(1, type.color2);
            
            offCtx.fillStyle = gradient;
            offCtx.beginPath();
            offCtx.arc(centerX, centerY, type.radius, 0, Math.PI * 2);
            offCtx.fill();
            
            // Simple rings if applicable
            if (type.rings) {
                offCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                offCtx.lineWidth = 3;
                offCtx.beginPath();
                offCtx.ellipse(centerX, centerY, type.radius + 15, type.radius * 0.3, 0, 0, Math.PI * 2);
                offCtx.stroke();
            }
            
            this.planetCache.set(index, offscreen);
            
            // Create planet instances
            this.planets.push({
                x: Math.random() * 10000,
                y: Math.random() * 10000,
                type: index,
                parallax: 0.2 + Math.random() * 0.3,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.01
            });
        });
    }
    
    render(camera, zoom, visiblePlanets = 4) {
        const ctx = this.ctx;
        
        // Only render the specified number of planets
        for (let i = 0; i < Math.min(visiblePlanets, this.planets.length); i++) {
            const planet = this.planets[i];
            const planetCanvas = this.planetCache.get(planet.type);
            
            const x = planet.x - camera.x * planet.parallax;
            const y = planet.y - camera.y * planet.parallax;
            
            // Wrap around world
            const wrappedX = ((x % 10000) + 10000) % 10000;
            const wrappedY = ((y % 10000) + 10000) % 10000;
            
            // Check if visible
            const size = planetCanvas.width;
            if (wrappedX + size < 0 || wrappedX - size > this.canvas.width ||
                wrappedY + size < 0 || wrappedY - size > this.canvas.height) {
                continue;
            }
            
            ctx.save();
            ctx.translate(wrappedX, wrappedY);
            ctx.rotate(planet.rotation);
            ctx.globalAlpha = 0.8;
            ctx.drawImage(
                planetCanvas, 
                -planetCanvas.width / 2, 
                -planetCanvas.height / 2
            );
            ctx.restore();
            
            planet.rotation += planet.rotationSpeed;
        }
    }
}

// Particle system optimizer
class MobileParticleOptimizer {
    constructor() {
        this.particlePools = new Map();
        this.maxParticlesPerType = {
            star: 100,
            shootingStar: 3,
            sparkle: 50
        };
    }
    
    getPool(type) {
        if (!this.particlePools.has(type)) {
            this.particlePools.set(type, {
                active: [],
                inactive: [],
                maxSize: this.maxParticlesPerType[type] || 50
            });
        }
        return this.particlePools.get(type);
    }
    
    spawn(type, properties) {
        const pool = this.getPool(type);
        
        let particle;
        if (pool.inactive.length > 0) {
            particle = pool.inactive.pop();
            Object.assign(particle, properties);
        } else if (pool.active.length < pool.maxSize) {
            particle = { type, ...properties };
        } else {
            // Pool is full, don't spawn
            return null;
        }
        
        pool.active.push(particle);
        return particle;
    }
    
    update(type, updateFn, deltaTime) {
        const pool = this.getPool(type);
        const active = pool.active;
        
        for (let i = active.length - 1; i >= 0; i--) {
            const particle = active[i];
            updateFn(particle, deltaTime);
            
            if (particle.life <= 0 || !particle.alive) {
                // Move to inactive pool
                active.splice(i, 1);
                pool.inactive.push(particle);
            }
        }
    }
    
    render(type, renderFn, ctx) {
        const pool = this.getPool(type);
        pool.active.forEach(particle => renderFn(particle, ctx));
    }
}

// Export for use in main game
window.MobileBackgroundOptimizer = MobileBackgroundOptimizer;
window.MobilePlanetRenderer = MobilePlanetRenderer;
window.MobileParticleOptimizer = MobileParticleOptimizer;