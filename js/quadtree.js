// Quadtree implementation for spatial partitioning
// Optimizes collision detection from O(n²) to O(n log n)

class Rectangle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    contains(point) {
        return point.x >= this.x &&
               point.x <= this.x + this.width &&
               point.y >= this.y &&
               point.y <= this.y + this.height;
    }
    
    intersects(rect) {
        return !(rect.x > this.x + this.width ||
                rect.x + rect.width < this.x ||
                rect.y > this.y + this.height ||
                rect.y + rect.height < this.y);
    }
}

class QuadTree {
    constructor(boundary, capacity = 4) {
        this.boundary = boundary;
        this.capacity = capacity;
        this.objects = [];
        this.divided = false;
        
        // Child nodes
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
        
        // Performance metrics
        this.totalObjects = 0;
        this.depth = 0;
    }
    
    insert(object) {
        // Object must have x, y, and bounds properties
        if (!this.boundary.contains({ x: object.x, y: object.y })) {
            return false;
        }
        
        if (this.objects.length < this.capacity && !this.divided) {
            this.objects.push(object);
            this.totalObjects++;
            return true;
        }
        
        if (!this.divided) {
            this.subdivide();
        }
        
        // Try to insert into children
        if (this.northeast.insert(object)) return true;
        if (this.northwest.insert(object)) return true;
        if (this.southeast.insert(object)) return true;
        if (this.southwest.insert(object)) return true;
        
        // If object spans multiple quadrants, keep it at this level
        this.objects.push(object);
        this.totalObjects++;
        return true;
    }
    
    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.width / 2;
        const h = this.boundary.height / 2;
        
        const ne = new Rectangle(x + w, y, w, h);
        const nw = new Rectangle(x, y, w, h);
        const se = new Rectangle(x + w, y + h, w, h);
        const sw = new Rectangle(x, y + h, w, h);
        
        this.northeast = new QuadTree(ne, this.capacity);
        this.northwest = new QuadTree(nw, this.capacity);
        this.southeast = new QuadTree(se, this.capacity);
        this.southwest = new QuadTree(sw, this.capacity);
        
        this.northeast.depth = this.depth + 1;
        this.northwest.depth = this.depth + 1;
        this.southeast.depth = this.depth + 1;
        this.southwest.depth = this.depth + 1;
        
        this.divided = true;
        
        // Re-insert objects into children
        const objects = this.objects;
        this.objects = [];
        for (const obj of objects) {
            this.insert(obj);
        }
    }
    
    query(range, found = []) {
        if (!this.boundary.intersects(range)) {
            return found;
        }
        
        for (const obj of this.objects) {
            if (range.contains({ x: obj.x, y: obj.y })) {
                found.push(obj);
            }
        }
        
        if (this.divided) {
            this.northeast.query(range, found);
            this.northwest.query(range, found);
            this.southeast.query(range, found);
            this.southwest.query(range, found);
        }
        
        return found;
    }
    
    queryRadius(x, y, radius, found = []) {
        const range = new Rectangle(x - radius, y - radius, radius * 2, radius * 2);
        const candidates = this.query(range);
        
        // Filter by actual circle distance
        const radiusSquared = radius * radius;
        for (const obj of candidates) {
            const dx = obj.x - x;
            const dy = obj.y - y;
            if (dx * dx + dy * dy <= radiusSquared) {
                found.push(obj);
            }
        }
        
        return found;
    }
    
    clear() {
        this.objects = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
        this.totalObjects = 0;
    }
    
    getStats() {
        let stats = {
            totalNodes: 1,
            totalObjects: this.totalObjects,
            maxDepth: this.depth,
            objectsPerNode: []
        };
        
        stats.objectsPerNode.push(this.objects.length);
        
        if (this.divided) {
            const neStats = this.northeast.getStats();
            const nwStats = this.northwest.getStats();
            const seStats = this.southeast.getStats();
            const swStats = this.southwest.getStats();
            
            stats.totalNodes += neStats.totalNodes + nwStats.totalNodes + 
                               seStats.totalNodes + swStats.totalNodes;
            stats.maxDepth = Math.max(stats.maxDepth, neStats.maxDepth, 
                                     nwStats.maxDepth, seStats.maxDepth, swStats.maxDepth);
            stats.objectsPerNode = stats.objectsPerNode.concat(
                neStats.objectsPerNode, nwStats.objectsPerNode,
                seStats.objectsPerNode, swStats.objectsPerNode
            );
        }
        
        return stats;
    }
}

// Specialized collision detection system using QuadTree
class CollisionSystem {
    constructor(worldWidth, worldHeight) {
        this.worldBounds = new Rectangle(0, 0, worldWidth, worldHeight);
        this.quadTree = new QuadTree(this.worldBounds, 6);
        
        // Performance tracking
        this.stats = {
            checksPerformed: 0,
            collisionsFound: 0,
            totalTime: 0,
            lastFrameTime: 0
        };
        
        // Spatial hashing for elements (static objects)
        this.elementGrid = new Map();
        this.gridSize = 100; // Size of each grid cell
    }
    
    update(snakes, elements) {
        const startTime = performance.now();
        
        // Clear previous frame data
        this.quadTree.clear();
        this.stats.checksPerformed = 0;
        this.stats.collisionsFound = 0;
        
        // Build quadtree with snake segments
        for (const snake of snakes) {
            if (!snake.alive && !snake.isDying) continue;
            
            // Insert head with special flag
            this.quadTree.insert({
                x: snake.x,
                y: snake.y,
                snake: snake,
                isHead: true,
                radius: snake.size / 2
            });
            
            // Insert body segments
            for (let i = 0; i < snake.segments.length; i++) {
                const segment = snake.segments[i];
                this.quadTree.insert({
                    x: segment.x,
                    y: segment.y,
                    snake: snake,
                    isHead: false,
                    segmentIndex: i,
                    radius: snake.size / 2
                });
            }
        }
        
        // Update element spatial hash
        this.updateElementGrid(elements);
        
        this.stats.lastFrameTime = performance.now() - startTime;
        this.stats.totalTime += this.stats.lastFrameTime;
    }
    
    updateElementGrid(elements) {
        this.elementGrid.clear();
        
        for (const element of elements) {
            const gridX = Math.floor(element.x / this.gridSize);
            const gridY = Math.floor(element.y / this.gridSize);
            const key = `${gridX},${gridY}`;
            
            if (!this.elementGrid.has(key)) {
                this.elementGrid.set(key, []);
            }
            this.elementGrid.get(key).push(element);
        }
    }
    
    checkSnakeCollisions(snake) {
        if (!snake.alive || snake.isDying) return [];
        
        const collisions = [];
        const checkRadius = snake.size * 3; // Check area slightly larger than snake
        
        // Query quadtree for nearby objects
        const nearby = this.quadTree.queryRadius(snake.x, snake.y, checkRadius);
        
        for (const obj of nearby) {
            this.stats.checksPerformed++;
            
            // Skip self
            if (obj.snake === snake && obj.isHead) continue;
            
            // Calculate actual distance
            const dx = snake.x - obj.x;
            const dy = snake.y - obj.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = snake.size / 2 + obj.radius;
            
            if (distance < minDistance) {
                this.stats.collisionsFound++;
                
                collisions.push({
                    type: obj.isHead ? 'head' : 'body',
                    otherSnake: obj.snake,
                    distance: distance,
                    segmentIndex: obj.segmentIndex
                });
            }
        }
        
        return collisions;
    }
    
    checkElementCollisions(snake, elementSize = 20) {
        const collisions = [];
        const checkRadius = snake.size / 2 + elementSize;
        
        // Check surrounding grid cells
        const minGridX = Math.floor((snake.x - checkRadius) / this.gridSize);
        const maxGridX = Math.floor((snake.x + checkRadius) / this.gridSize);
        const minGridY = Math.floor((snake.y - checkRadius) / this.gridSize);
        const maxGridY = Math.floor((snake.y + checkRadius) / this.gridSize);
        
        for (let gx = minGridX; gx <= maxGridX; gx++) {
            for (let gy = minGridY; gy <= maxGridY; gy++) {
                const key = `${gx},${gy}`;
                const elements = this.elementGrid.get(key);
                
                if (!elements) continue;
                
                for (const element of elements) {
                    this.stats.checksPerformed++;
                    
                    const dx = snake.x - element.x;
                    const dy = snake.y - element.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < checkRadius) {
                        this.stats.collisionsFound++;
                        collisions.push(element);
                    }
                }
            }
        }
        
        return collisions;
    }
    
    getObjectsInRadius(x, y, radius) {
        return this.quadTree.queryRadius(x, y, radius);
    }
    
    getObjectsInRect(x, y, width, height) {
        return this.quadTree.query(new Rectangle(x, y, width, height));
    }
    
    getStats() {
        const quadTreeStats = this.quadTree.getStats();
        return {
            ...this.stats,
            ...quadTreeStats,
            gridCells: this.elementGrid.size,
            avgChecksPerFrame: this.stats.totalTime > 0 ? 
                this.stats.checksPerformed / (this.stats.totalTime / 16.67) : 0
        };
    }
}

// Export for use in main game
window.QuadTree = QuadTree;
window.Rectangle = Rectangle;
window.CollisionSystem = CollisionSystem;