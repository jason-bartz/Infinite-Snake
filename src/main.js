/**
 * Main Entry Point for Infinite Snake
 * This file bootstraps the game with the new architecture while maintaining backward compatibility
 */

import { featureFlags } from '../config/feature-flags.js';

// Initialize feature flags first
console.log('[Infinite Snake] Initializing with feature flags:', featureFlags.getAll());

// Load the existing game (for now, this is the compatibility layer)
// In future phases, we'll gradually replace this with new systems

/**
 * Bootstrap the application
 */
async function bootstrap() {
  console.log('[Infinite Snake] Starting game...');
  console.log('[Infinite Snake] Version: 2.1.0');
  console.log('[Infinite Snake] Mode: Development');

  // Log active feature flags
  const activeFlags = Object.entries(featureFlags.getAll())
    .filter(([_, value]) => value === true)
    .map(([key]) => key);

  if (activeFlags.length > 0) {
    console.log('[Infinite Snake] Active Feature Flags:', activeFlags);
  }

  // The existing game code is loaded via script tags in index.html
  // This will change as we migrate to the new architecture

  // Set up global error handling
  window.addEventListener('error', (event) => {
    console.error('[Infinite Snake] Global Error:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Infinite Snake] Unhandled Promise Rejection:', event.reason);
  });

  console.log('[Infinite Snake] Bootstrap complete');
}

// Start the application
bootstrap().catch((error) => {
  console.error('[Infinite Snake] Fatal error during bootstrap:', error);
});

// Export for potential use
export { bootstrap, featureFlags };
