// Optimized Quadtree for spatial partitioning
// This implementation is specifically optimized for the snake game's collision detection

class QuadTree {
    constructor(boundary, capacity = 4) {
        this.boundary = boundary; // { x, y, width, height }
        this.capacity = capacity;
        this.entities = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }

    // Insert an entity into the quadtree
    insert(entity) {
        // Ensure entity has required properties
        if (!this.contains(entity)) {
            return false;
        }

        // If there's room and we haven't subdivided, add it
        if (this.entities.length < this.capacity && !this.divided) {
            this.entities.push(entity);
            return true;
        }

        // Otherwise, subdivide if we haven't already
        if (!this.divided) {
            this.subdivide();
        }

        // Try to insert into children
        return this.northeast.insert(entity) ||
               this.northwest.insert(entity) ||
               this.southeast.insert(entity) ||
               this.southwest.insert(entity);
    }

    // Check if entity is within this quadtree's boundary
    contains(entity) {
        return entity.x >= this.boundary.x &&
               entity.x < this.boundary.x + this.boundary.width &&
               entity.y >= this.boundary.y &&
               entity.y < this.boundary.y + this.boundary.height;
    }

    // Subdivide into four quadrants
    subdivide() {
        const x = this.boundary.x;
        const y = this.boundary.y;
        const w = this.boundary.width / 2;
        const h = this.boundary.height / 2;

        this.northeast = new QuadTree({ x: x + w, y: y, width: w, height: h }, this.capacity);
        this.northwest = new QuadTree({ x: x, y: y, width: w, height: h }, this.capacity);
        this.southeast = new QuadTree({ x: x + w, y: y + h, width: w, height: h }, this.capacity);
        this.southwest = new QuadTree({ x: x, y: y + h, width: w, height: h }, this.capacity);

        this.divided = true;

        // Move existing entities to children
        for (const entity of this.entities) {
            this.northeast.insert(entity) ||
            this.northwest.insert(entity) ||
            this.southeast.insert(entity) ||
            this.southwest.insert(entity);
        }
        this.entities = [];
    }

    // Query entities within a range
    query(range, found = []) {
        // If range doesn't intersect this quadtree, return
        if (!this.intersects(range)) {
            return found;
        }

        // Check entities in this node
        for (const entity of this.entities) {
            if (this.entityInRange(entity, range)) {
                found.push(entity);
            }
        }

        // If subdivided, query children
        if (this.divided) {
            this.northeast.query(range, found);
            this.northwest.query(range, found);
            this.southeast.query(range, found);
            this.southwest.query(range, found);
        }

        return found;
    }

    // Check if range intersects with boundary
    intersects(range) {
        return !(range.x > this.boundary.x + this.boundary.width ||
                range.x + range.width < this.boundary.x ||
                range.y > this.boundary.y + this.boundary.height ||
                range.y + range.height < this.boundary.y);
    }

    // Check if entity is within range
    entityInRange(entity, range) {
        return entity.x >= range.x &&
               entity.x <= range.x + range.width &&
               entity.y >= range.y &&
               entity.y <= range.y + range.height;
    }

    // Clear the quadtree
    clear() {
        this.entities = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }
}

// Specialized quadtree for snake collision detection
class SnakeQuadTree extends QuadTree {
    constructor(worldSize) {
        super({ x: 0, y: 0, width: worldSize, height: worldSize }, 8);
        this.worldSize = worldSize;
    }

    // Insert snake head for collision detection
    insertSnake(snake) {
        if (snake.alive && !snake.isDying) {
            this.insert({
                x: snake.x,
                y: snake.y,
                radius: snake.size * 15,
                snake: snake,
                type: 'snake'
            });
        }
    }

    // Insert element for collection detection
    insertElement(element) {
        if (element.active) {
            this.insert({
                x: element.x,
                y: element.y,
                radius: 20,
                element: element,
                type: 'element'
            });
        }
    }

    // Get nearby entities for collision checking
    getNearby(x, y, radius) {
        const range = {
            x: x - radius,
            y: y - radius,
            width: radius * 2,
            height: radius * 2
        };
        return this.query(range);
    }

    // Optimized snake collision check
    getPotentialSnakeCollisions(snake) {
        const searchRadius = 100 + snake.length * 0.5; // Dynamic search radius
        return this.getNearby(snake.x, snake.y, searchRadius)
            .filter(entity => entity.type === 'snake' && entity.snake !== snake);
    }

    // Optimized element collection check
    getNearbyElements(snake, radius = 150) {
        return this.getNearby(snake.x, snake.y, radius)
            .filter(entity => entity.type === 'element');
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuadTree, SnakeQuadTree };
}