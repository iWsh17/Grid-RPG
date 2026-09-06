/**
 * main.js - Application initialization
 */

import { save, load } from './core/GameState.js';
import { on, emit } from './core/EventBus.js';
import { createInitialState } from './core/WorldState.js';

// These modules attach to window
import './core/DataLoader.js';
import './core/Utils.js';
import './systems/InventorySystem.js';
import './systems/SkillsSystem.js';
import './systems/ToolSystem.js';
import './systems/CraftingSystem.js';

// Import game logic
import './game.js';

/**
 * Initialize the game
 */
function init() {
  console.log('[main] Initializing...');
  
  try {
    // Try to load saved state
    const savedState = load();
    
    if (savedState) {
      window.state = savedState;
      console.log('[main] Loaded saved state');
    } else {
      window.state = createInitialState();
      console.log('[main] Created new state');
    }
    
    // Emit initialization complete
    emit('game:ready', { state: window.state });
    
    console.log('[main] Initialization complete');
  } catch (error) {
    console.error('[main] Initialization failed:', error);
    
    // Create fallback state
    window.state = createInitialState();
    emit('game:ready', { state: window.state });
  }
}

// Start initialization
init();