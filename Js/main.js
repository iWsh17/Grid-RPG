/**
 * Main - Minimal initialization
 */

import EventBus from './core/EventBus.js';
import GameState from './core/GameState.js';
import { SkillsSystem } from './systems/SkillsSystem.js';
import InventorySystem from './systems/InventorySystem.js';

window.EventBus = EventBus;
window.GameState = GameState;
window.SkillsSystem = SkillsSystem;
window.InventorySystem = InventorySystem;

async function initialize() {
  console.log('[Main] Initializing...');
  
  // Initialize systems
  SkillsSystem.initialize({ skills: [{ id: 'foraging', name: 'Foraging', xpPerLevel: 10, maxLevel: 5 }] });
  InventorySystem.initialize({});
  
  // Create state
  const state = {
    player: { x: 1, y: 1, id: 'player_1' },
    inventory: {},
    storage: {},
    skills: {
      foraging: { xp: 0, level: 0, totalXp: 0 }
    },
    capabilities: {}
  };
  
  window.state = state;
  console.log('[Main] ✅ Ready');
  
  EventBus.emit('game.initialized', { state });
  return { state };
}

// Debug helpers
window.showState = () => { console.log(window.state); return window.state; };
window.saveGame = () => GameState.save(window.state);
window.resetGame = () => { GameState.clear(); location.reload(); };

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}