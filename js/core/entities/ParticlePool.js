        class ParticlePool {
            constructor(size = 200) {
                this.pool = [];
                this.activeParticles = [];
                this.poolSize = size;
                
                // Pre-allocate particles
                for (let i = 0; i < size; i++) {
                    this.pool.push(new Particle(0, 0, 0, 0, 'white'));
                }
                
                // Pre-warm the pool by cycling through particles
                this.preWarm();
            }
            
            preWarm() {
                // Temporarily activate and deactivate particles to warm up memory
                const warmupCount = Math.min(50, this.poolSize);
                const tempParticles = [];
                for (let i = 0; i < warmupCount; i++) {
                    tempParticles.push(this.spawn(0, 0, 0, 0, 'white'));
                }
                // Return them to pool
                tempParticles.forEach(p => {
                    p.active = false;
                    p.life = 0;
                });
                this.update();
            }
            
            spawn(x, y, vx, vy, color, size = 4, type = 'square', options = {}) {
                let particle = this.pool.pop();
                if (!particle) {
                    // Pool is empty, create new particle
                    particle = new Particle(x, y, vx, vy, color, size, type);
                } else {
                    particle.reset(x, y, vx, vy, color, size, type, options);
                }
                this.activeParticles.push(particle);
                return particle;
            }
            
            update(deltaTime = 1) {
                for (let i = this.activeParticles.length - 1; i >= 0; i--) {
                    const particle = this.activeParticles[i];
                    if (!particle.update(deltaTime)) {
                        // Return to pool
                        this.activeParticles.splice(i, 1);
                        this.pool.push(particle);
                    }
                }
            }
            
            draw() {
                this.activeParticles.forEach(particle => {
                    if (isInViewport(particle.x, particle.y, 50)) {
                        particle.draw();
                    }
                });
            }
            
            getActiveCount() {
                return this.activeParticles.length;
            }
        }
        
        // Initialize particle pool
        const particlePool = new ParticlePool(isMobile ? 50 : 200); // Further reduced for mobile performance

export default ParticlePool;
