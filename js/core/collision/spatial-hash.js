// Spatial Hash Grid for Infinite Snake
// Optimizes collision detection by dividing space into grid cells

class SpatialHashGrid {
    constructor(cellSize = 100, worldWidth = 4000, worldHeight = 4000) {
        this.cellSize = cellSize;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.gridWidth = Math.ceil(worldWidth / cellSize);
        this.gridHeight = Math.ceil(worldHeight / cellSize);
        
        // Map to store entities by cell key
        this.grid = new Map();
        
        // Cache for frequently accessed cells
        this.cellCache = new Map();
        this.maxCacheSize = 100;
        
        // Performance tracking
        this.stats = {
            totalChecks: 0,
            checksAvoided: 0,
            cacheHits: 0,
            cacheMisses: 0
        };
    }
    
    // Clear the grid
    clear() {
        this.grid.clear();
        this.cellCache.clear();
    }
    
    // Get cell coordinates from world position
    getCellCoords(x, y) {
        const cellX = Math.floor(x / this.cellSize);
        const cellY = Math.floor(y / this.cellSize);
        return { cellX, cellY };
    }
    
    // Get unique key for a cell
    getCellKey(cellX, cellY) {
        return `${cellX},${cellY}`;
    }
    
    // Add an entity to the grid
    add(entity, x, y, radius = 20) {
        const minX = x - radius;
        const maxX = x + radius;
        const minY = y - radius;
        const maxY = y + radius;
        
        // Get all cells this entity overlaps
        const minCell = this.getCellCoords(minX, minY);
        const maxCell = this.getCellCoords(maxX, maxY);
        
        // Add to all overlapping cells
        for (let cellX = minCell.cellX; cellX <= maxCell.cellX; cellX++) {
            for (let cellY = minCell.cellY; cellY <= maxCell.cellY; cellY++) {
                const key = this.getCellKey(cellX, cellY);
                
                if (!this.grid.has(key)) {
                    this.grid.set(key, new Set());
                }
                
                this.grid.get(key).add(entity);
                
                // Invalidate cache for this cell
                this.cellCache.delete(key);
            }
        }
    }
    
    // Remove an entity from the grid
    remove(entity, x, y, radius = 20) {
        const minX = x - radius;
        const maxX = x + radius;
        const minY = y - radius;
        const maxY = y + radius;
        
        // Get all cells this entity might be in
        const minCell = this.getCellCoords(minX, minY);
        const maxCell = this.getCellCoords(maxX, maxY);
        
        // Remove from all overlapping cells
        for (let cellX = minCell.cellX; cellX <= maxCell.cellX; cellX++) {
            for (let cellY = minCell.cellY; cellY <= maxCell.cellY; cellY++) {
                const key = this.getCellKey(cellX, cellY);
                const cell = this.grid.get(key);
                
                if (cell) {
                    cell.delete(entity);
                    if (cell.size === 0) {
                        this.grid.delete(key);
                    }
                    
                    // Invalidate cache for this cell
                    this.cellCache.delete(key);
                }
            }
        }
    }
    
    // Update entity position (remove from old cells, add to new)
    update(entity, oldX, oldY, newX, newY, radius = 20) {
        // Only update if position changed significantly
        const dx = newX - oldX;
        const dy = newY - oldY;
        const distSq = dx * dx + dy * dy;
        
        if (distSq > 1) { // Moved more than 1 pixel
            this.remove(entity, oldX, oldY, radius);
            this.add(entity, newX, newY, radius);
        }
    }
    
    // Get all entities near a point
    getNearby(x, y, radius = 100) {
        const nearbyEntities = new Set();
        
        // Calculate which cells to check
        const minX = x - radius;
        const maxX = x + radius;
        const minY = y - radius;
        const maxY = y + radius;
        
        const minCell = this.getCellCoords(minX, minY);
        const maxCell = this.getCellCoords(maxX, maxY);
        
        // Check all overlapping cells
        for (let cellX = minCell.cellX; cellX <= maxCell.cellX; cellX++) {
            for (let cellY = minCell.cellY; cellY <= maxCell.cellY; cellY++) {
                const key = this.getCellKey(cellX, cellY);
                
                // Check cache first
                let cell = this.cellCache.get(key);
                if (cell) {
                    this.stats.cacheHits++;
                } else {
                    this.stats.cacheMisses++;
                    cell = this.grid.get(key);
                    
                    // Add to cache
                    if (cell && this.cellCache.size < this.maxCacheSize) {
                        this.cellCache.set(key, cell);
                    }
                }
                
                if (cell) {
                    for (const entity of cell) {
                        nearbyEntities.add(entity);
                    }
                }
            }
        }
        
        return Array.from(nearbyEntities);
    }
    
    // Check if there are any entities near a point
    hasNearby(x, y, radius = 100, excludeEntity = null) {
        const minX = x - radius;
        const maxX = x + radius;
        const minY = y - radius;
        const maxY = y + radius;
        
        const minCell = this.getCellCoords(minX, minY);
        const maxCell = this.getCellCoords(maxX, maxY);
        
        // Check all overlapping cells
        for (let cellX = minCell.cellX; cellX <= maxCell.cellX; cellX++) {
            for (let cellY = minCell.cellY; cellY <= maxCell.cellY; cellY++) {
                const key = this.getCellKey(cellX, cellY);
                const cell = this.grid.get(key);
                
                if (cell && cell.size > 0) {
                    if (excludeEntity) {
                        // Check if there's any entity other than the excluded one
                        for (const entity of cell) {
                            if (entity !== excludeEntity) {
                                return true;
                            }
                        }
                    } else {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    // Get performance statistics
    getStats() {
        const efficiency = this.stats.totalChecks > 0 
            ? (this.stats.checksAvoided / this.stats.totalChecks) * 100 
            : 0;
        
        return {
            ...this.stats,
            efficiency: efficiency.toFixed(1) + '%',
            cellsInUse: this.grid.size,
            cacheSize: this.cellCache.size
        };
    }
    
    // Reset statistics
    resetStats() {
        this.stats.totalChecks = 0;
        this.stats.checksAvoided = 0;
        this.stats.cacheHits = 0;
        this.stats.cacheMisses = 0;
    }
    
    // Debug visualization (returns cell data for rendering)
    getDebugCells() {
        const cells = [];
        
        for (const [key, entities] of this.grid.entries()) {
            const [cellX, cellY] = key.split(',').map(Number);
            cells.push({
                x: cellX * this.cellSize,
                y: cellY * this.cellSize,
                width: this.cellSize,
                height: this.cellSize,
                count: entities.size
            });
        }
        
        return cells;
    }
}

// Export for use in game
window.SpatialHashGrid = SpatialHashGrid;