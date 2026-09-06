/**
 * main.js - Application initialization
 * 
 * This module initializes all systems and creates the initial game state.
 * Systems attach to window for global access by other modules.
 */

import { save, load } from './core/GameState.js';
import { on, emit } from './core/EventBus.js';

// Core modules (some attach to window)
import './core/DataLoader.js';
import './core/Utils.js';
import './core/config.js';

// Systems attach to window
import './systems/InventorySystem.js';
import './systems/SkillsSystem.js';
import './systems/ToolSystem.js';
import './systems/CraftingSystem.js';

// Game logic (expects window.state and window systems)
import './game.js';

/**
 * Create initial game state
 * @returns {Object} Initial state
 */
function createInitialState() {
  // Get resource nodes from content
  const RESOURCE_NODES = window.RESOURCE_NODES || [];
  
  return {
    player: {
      x: 0,
      y: 0,
      equippedTool: null,
    },
    inventory: {},
    skills: {
      fishing: { level: 0, totalXp: 0 },
      mining: { level: 0, totalXp: 0 },
      foraging: { level: 0, totalXp: 0 },
      woodcutting: { level: 0, totalXp: 0 },
    },
    resourceNodes: RESOURCE_NODES.map(node => ({
      id: node.id,
      x: node.x || 0,
      y: node.y || 0,
      quantity: node.maxQuantity,
      lastDepleted: null,
    })),
  };
}

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