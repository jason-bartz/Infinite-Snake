// Canvas State Optimizer for Performance
// Reduces ctx.save/restore calls by managing state manually

class CanvasStateOptimizer {
    constructor(ctx) {
        this.ctx = ctx;
        
        // Track current state
        this.currentState = {
            globalAlpha: 1,
            fillStyle: '#000000',
            strokeStyle: '#000000',
            lineWidth: 1,
            lineCap: 'butt',
            lineJoin: 'miter',
            font: '10px sans-serif',
            textAlign: 'start',
            textBaseline: 'alphabetic',
            shadowBlur: 0,
            shadowColor: 'rgba(0, 0, 0, 0)',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            globalCompositeOperation: 'source-over',
            imageSmoothingEnabled: true,
            lineDashOffset: 0,
            transform: {
                a: 1, b: 0, c: 0, d: 1, e: 0, f: 0
            }
        };
        
        // State stack for nested saves
        this.stateStack = [];
        
        // Track save/restore reduction
        this.stats = {
            savesCalled: 0,
            savesSkipped: 0,
            restoresCalled: 0,
            restoresSkipped: 0,
            propertyChanges: 0,
            propertyChangesSkipped: 0
        };
        
        // Bind methods
        this.save = this.save.bind(this);
        this.restore = this.restore.bind(this);
    }
    
    // Save current state (replacement for ctx.save)
    save() {
        this.stats.savesCalled++;
        
        // Clone current state and push to stack
        const stateCopy = {
            ...this.currentState,
            transform: { ...this.currentState.transform }
        };
        
        this.stateStack.push(stateCopy);
        
        // Only call native save if we have transforms
        if (this.hasTransform()) {
            this.ctx.save();
        } else {
            this.stats.savesSkipped++;
        }
    }
    
    // Restore previous state (replacement for ctx.restore)
    restore() {
        this.stats.restoresCalled++;
        
        if (this.stateStack.length === 0) {
            console.warn('No saved state to restore');
            return;
        }
        
        const previousState = this.stateStack.pop();
        
        // Only restore properties that changed
        let changesApplied = false;
        
        Object.keys(previousState).forEach(key => {
            if (key === 'transform') {
                if (this.hasTransform()) {
                    this.ctx.restore();
                    changesApplied = true;
                }
            } else if (this.currentState[key] !== previousState[key]) {
                this.applyProperty(key, previousState[key]);
                changesApplied = true;
            }
        });
        
        if (!changesApplied) {
            this.stats.restoresSkipped++;
        }
        
        this.currentState = previousState;
    }
    
    // Set a property with caching
    setProperty(property, value) {
        this.stats.propertyChanges++;
        
        // Skip if value hasn't changed
        if (this.currentState[property] === value) {
            this.stats.propertyChangesSkipped++;
            return;
        }
        
        // Update state and apply to context
        this.currentState[property] = value;
        this.applyProperty(property, value);
    }
    
    // Apply property to context
    applyProperty(property, value) {
        switch (property) {
            case 'globalAlpha':
            case 'fillStyle':
            case 'strokeStyle':
            case 'lineWidth':
            case 'lineCap':
            case 'lineJoin':
            case 'font':
            case 'textAlign':
            case 'textBaseline':
            case 'shadowBlur':
            case 'shadowColor':
            case 'shadowOffsetX':
            case 'shadowOffsetY':
            case 'globalCompositeOperation':
            case 'imageSmoothingEnabled':
            case 'lineDashOffset':
                this.ctx[property] = value;
                break;
        }
    }
    
    // Batch multiple property changes
    setProperties(properties) {
        Object.entries(properties).forEach(([key, value]) => {
            this.setProperty(key, value);
        });
    }
    
    // Check if we have any transforms
    hasTransform() {
        const t = this.currentState.transform;
        return t.a !== 1 || t.b !== 0 || t.c !== 0 || 
               t.d !== 1 || t.e !== 0 || t.f !== 0;
    }
    
    // Reset to default state
    reset() {
        this.currentState = {
            globalAlpha: 1,
            fillStyle: '#000000',
            strokeStyle: '#000000',
            lineWidth: 1,
            lineCap: 'butt',
            lineJoin: 'miter',
            font: '10px sans-serif',
            textAlign: 'start',
            textBaseline: 'alphabetic',
            shadowBlur: 0,
            shadowColor: 'rgba(0, 0, 0, 0)',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            globalCompositeOperation: 'source-over',
            imageSmoothingEnabled: true,
            lineDashOffset: 0,
            transform: {
                a: 1, b: 0, c: 0, d: 1, e: 0, f: 0
            }
        };
        
        this.stateStack = [];
        
        // Apply defaults to context
        Object.entries(this.currentState).forEach(([key, value]) => {
            if (key !== 'transform') {
                this.applyProperty(key, value);
            }
        });
    }
    
    // Get optimization statistics
    getStats() {
        const saveReduction = this.stats.savesCalled > 0
            ? (this.stats.savesSkipped / this.stats.savesCalled * 100).toFixed(2)
            : 0;
            
        const restoreReduction = this.stats.restoresCalled > 0
            ? (this.stats.restoresSkipped / this.stats.restoresCalled * 100).toFixed(2)
            : 0;
            
        const propertyReduction = this.stats.propertyChanges > 0
            ? (this.stats.propertyChangesSkipped / this.stats.propertyChanges * 100).toFixed(2)
            : 0;
            
        return {
            ...this.stats,
            saveReduction: `${saveReduction}%`,
            restoreReduction: `${restoreReduction}%`,
            propertyReduction: `${propertyReduction}%`,
            stackDepth: this.stateStack.length
        };
    }
    
    // Convenience methods for common operations
    withAlpha(alpha, callback) {
        const oldAlpha = this.currentState.globalAlpha;
        this.setProperty('globalAlpha', alpha);
        callback();
        this.setProperty('globalAlpha', oldAlpha);
    }
    
    withStyle(fillStyle, strokeStyle, callback) {
        const oldFill = this.currentState.fillStyle;
        const oldStroke = this.currentState.strokeStyle;
        
        if (fillStyle) this.setProperty('fillStyle', fillStyle);
        if (strokeStyle) this.setProperty('strokeStyle', strokeStyle);
        
        callback();
        
        if (fillStyle) this.setProperty('fillStyle', oldFill);
        if (strokeStyle) this.setProperty('strokeStyle', oldStroke);
    }
    
    withShadow(blur, color, offsetX, offsetY, callback) {
        const oldBlur = this.currentState.shadowBlur;
        const oldColor = this.currentState.shadowColor;
        const oldOffsetX = this.currentState.shadowOffsetX;
        const oldOffsetY = this.currentState.shadowOffsetY;
        
        this.setProperties({
            shadowBlur: blur,
            shadowColor: color,
            shadowOffsetX: offsetX || 0,
            shadowOffsetY: offsetY || 0
        });
        
        callback();
        
        this.setProperties({
            shadowBlur: oldBlur,
            shadowColor: oldColor,
            shadowOffsetX: oldOffsetX,
            shadowOffsetY: oldOffsetY
        });
    }
    
    // Clear shadow (common operation)
    clearShadow() {
        this.setProperties({
            shadowBlur: 0,
            shadowColor: 'rgba(0, 0, 0, 0)',
            shadowOffsetX: 0,
            shadowOffsetY: 0
        });
    }
}

// Export for use in game
window.CanvasStateOptimizer = CanvasStateOptimizer;