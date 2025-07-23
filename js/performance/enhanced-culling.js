// Enhanced Culling System
// Uses quadtree and LOD for efficient rendering on mobile

class EnhancedCullingSystem {
    constructor() {
        this.quadtree = null;
        this.worldBounds = null;
        this.viewportPadding = 100; // Extra padding for smooth scrolling
        this.lodDistances = {
            full: 200,    // Full detail within 200 units
            medium: 500,  // Medium detail up to 500 units
            low: 1000,    // Low detail up to 1000 units
            cull: 1500    // Don't render beyond 1500 units
        };
        
        // Mobile-specific adjustments
        this.isMobile = window.isMobile || false;
        if (this.isMobile) {
            this.lodDistances = {
                full: 150,
                medium: 300,
                low: 500,
                cull: 800
            };
        }
        
        // Performance tracking
        this.stats = {
            totalObjects: 0,
            visibleObjects: 0,
            culledObjects: 0,
            quadtreeDepth: 0
        };
    }
    
    // Initialize with world size
    init(worldSize) {
        this.worldBounds = new Rectangle(0, 0, worldSize, worldSize);
        this.resetQuadtree();
    }
    
    // Reset quadtree for new frame
    resetQuadtree() {
        // Adjust capacity based on device performance
        const capacity = this.isMobile ? 6 : 4;
        this.quadtree = new QuadTree(this.worldBounds, capacity);
    }
    
    // Insert object into spatial index
    insert(object) {
        if (object && typeof object.x === 'number' && typeof object.y === 'number') {
            this.quadtree.insert(object);
            this.stats.totalObjects++;
        }
    }
    
    // Get visible objects within viewport
    getVisibleObjects(camera, viewport) {
        const visibleBounds = this.getVisibleBounds(camera, viewport);
        const candidates = this.quadtree.query(visibleBounds);
        
        // Apply LOD filtering
        const visibleObjects = [];
        const cameraPos = { x: camera.x, y: camera.y };
        
        for (const obj of candidates) {
            const distance = this.getDistance(cameraPos, obj);
            const lod = this.getLOD(distance);
            
            if (lod !== 'cull') {
                obj.renderLOD = lod;
                obj.distanceToCamera = distance;
                visibleObjects.push(obj);
            }
        }
        
        // Update stats
        this.stats.visibleObjects = visibleObjects.length;
        this.stats.culledObjects = this.stats.totalObjects - visibleObjects.length;
        this.stats.quadtreeDepth = this.getMaxDepth(this.quadtree);
        
        return visibleObjects;
    }
    
    // Calculate visible bounds with padding
    getVisibleBounds(camera, viewport) {
        const zoom = camera.zoom || 1;
        const halfWidth = (viewport.width / 2 / zoom) + this.viewportPadding;
        const halfHeight = (viewport.height / 2 / zoom) + this.viewportPadding;
        
        return new Rectangle(
            camera.x - halfWidth,
            camera.y - halfHeight,
            halfWidth * 2,
            halfHeight * 2
        );
    }
    
    // Get distance between two points
    getDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Determine LOD based on distance
    getLOD(distance) {
        if (distance <= this.lodDistances.full) return 'full';
        if (distance <= this.lodDistances.medium) return 'medium';
        if (distance <= this.lodDistances.low) return 'low';
        return 'cull';
    }
    
    // Get maximum depth of quadtree
    getMaxDepth(node) {
        if (!node || !node.divided) return node ? node.depth : 0;
        
        return Math.max(
            this.getMaxDepth(node.northeast),
            this.getMaxDepth(node.northwest),
            this.getMaxDepth(node.southeast),
            this.getMaxDepth(node.southwest)
        );
    }
    
    // Batch insert multiple objects
    batchInsert(objects) {
        for (const obj of objects) {
            this.insert(obj);
        }
    }
    
    // Get objects within radius (for collision detection)
    getObjectsInRadius(center, radius) {
        const searchBounds = new Rectangle(
            center.x - radius,
            center.y - radius,
            radius * 2,
            radius * 2
        );
        
        const candidates = this.quadtree.query(searchBounds);
        const results = [];
        
        // Filter to actual circular radius
        for (const obj of candidates) {
            const distance = this.getDistance(center, obj);
            if (distance <= radius) {
                obj.distanceToCenter = distance;
                results.push(obj);
            }
        }
        
        return results;
    }
    
    // Optimize rendering order (closer objects first)
    sortByDistance(objects) {
        return objects.sort((a, b) => {
            return (a.distanceToCamera || 0) - (b.distanceToCamera || 0);
        });
    }
    
    // Get performance stats
    getStats() {
        return {
            ...this.stats,
            efficiency: this.stats.totalObjects > 0 
                ? ((this.stats.culledObjects / this.stats.totalObjects) * 100).toFixed(1) + '%'
                : '0%'
        };
    }
}

// Enhanced viewport checking with shape support
function isInViewport(x, y, margin = 50, shape = null) {
    if (!window.enhancedCulling) return true; // Fallback
    
    const camera = window.camera || { x: 0, y: 0, zoom: 1 };
    const canvas = window.canvas || { width: 800, height: 600 };
    
    const bounds = window.enhancedCulling.getVisibleBounds(camera, canvas);
    
    // Basic point check
    if (shape === null) {
        return x >= bounds.x - margin &&
               x <= bounds.x + bounds.width + margin &&
               y >= bounds.y - margin &&
               y <= bounds.y + bounds.height + margin;
    }
    
    // Shape-based checks
    if (shape.type === 'circle') {
        const radius = shape.radius || 0;
        return x + radius >= bounds.x - margin &&
               x - radius <= bounds.x + bounds.width + margin &&
               y + radius >= bounds.y - margin &&
               y - radius <= bounds.y + bounds.height + margin;
    }
    
    if (shape.type === 'rect') {
        const width = shape.width || 0;
        const height = shape.height || 0;
        return x + width >= bounds.x - margin &&
               x <= bounds.x + bounds.width + margin &&
               y + height >= bounds.y - margin &&
               y <= bounds.y + bounds.height + margin;
    }
    
    return true;
}

// Create global instance
window.enhancedCulling = new EnhancedCullingSystem();

// Export for module usage
export default EnhancedCullingSystem;