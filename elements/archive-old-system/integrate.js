/**
 * Integration Script
 * Simple script to integrate the new element system with existing game
 */

(async function() {
    console.log('Initializing new element system...');
    
    try {
        // Create element loader
        const loader = new ElementLoader();
        await loader.init();
        
        // Create compatibility layer
        const compatibility = new ElementCompatibilityLayer(loader);
        await compatibility.init();
        
        // Make available globally
        window.elementLoader = loader;
        window.elementCompatibility = compatibility;
        
        // Load saved progress
        compatibility.loadDiscoveredElements();
        
        console.log('New element system initialized successfully');
        
        // Dispatch event to notify game
        window.dispatchEvent(new CustomEvent('elementsLoaded', {
            detail: {
                loader: loader,
                compatibility: compatibility
            }
        }));
        
    } catch (error) {
        console.error('Failed to initialize element system:', error);
        
        // Fall back to old system if available
        if (window.originalElementsInit) {
            console.log('Falling back to original element system');
            window.originalElementsInit();
        }
    }
})();