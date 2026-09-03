/**
 * Main - Bootstrap and initialize all systems
 * 
 * This file loads all data and initializes all systems.
 * Include this in your HTML after the core modules.
 * 
 * Usage:
 *   <script type="module" src="js/main.js"></script>
 */

import EventBus from './core/EventBus.js';
import DataLoader from './core/DataLoader.js';
import GameState from './core/GameState.js';
import SkillManager from './core/SkillManager.js';
import InventorySystem from './systems/InventorySystem.js';
import HarvestingSystem from './systems/HarvestingSystem.js';
import CraftingSystem from './systems/CraftingSystem.js';

// Make available globally for non-module scripts
window.EventBus = EventBus;
window.DataLoader = DataLoader;
window.GameState = GameState;
window.SkillManager = SkillManager;
window.InventorySystem = InventorySystem;
window.HarvestingSystem = HarvestingSystem;
window.CraftingSystem = CraftingSystem;

/**
 * Initialize all systems
 */
async function initialize() {
  console.log('[Main] Initializing game systems...');
  console.group('[Main] Initialization');

  try {
    // 1. Load all data files
    console.log('[Main] Loading data files...');
    const data = await DataLoader.loadAll([
      'skills',
      'resources',
      'resourceNodes',
      'recipes'
    ]);

    // 2. Initialize game state
    console.log('[Main] Initializing game state...');
    GameState.initialize();

    // 3. Initialize all managers with their data
    console.log('[Main] Initializing managers...');
    SkillManager.initialize(data.skills);
    InventorySystem.initialize(data.resources);
    HarvestingSystem.initialize(data.resourceNodes);
    CraftingSystem.initialize(data.recipes);

    // 4. Set up event listeners
    console.log('[Main] Setting up event listeners...');
    setupEventListeners();

    // 5. Load saved game if exists
    console.log('[Main] Loading saved game...');
    const hasSave = GameState.load();
    
    if (hasSave) {
      console.log('[Main] Game loaded from save');
    } else {
      console.log('[Main] Starting new game');
    }

    console.log('[Main] ✅ All systems initialized successfully');
    console.groupEnd();

    // Emit initialization complete event
    EventBus.emit('game.initialized', {
      data: data,
      hasSave: hasSave
    });

    return true;
  } catch (error) {
    console.error('[Main] ❌ Initialization failed:', error);
    console.groupEnd();
    return false;
  }
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
  // Log all events in development
  EventBus.on('skill.xpGain', (data) => {
    console.log(`[Event] Gained ${data.amount} XP in ${data.skillId}`);
  });

  EventBus.on('skill.levelUp', (data) => {
    console.log(`[Event] 🎉 ${data.skillName} reached level ${data.level}!`);
  });

  EventBus.on('resource.gathered', (data) => {
    const items = data.gathered.map(g => `${g.amount}x ${g.resourceId}`).join(', ');
    console.log(`[Event] Gathered: ${items}`);
  });

  EventBus.on('crafting.crafted', (data) => {
    console.log(`[Event] Crafted: ${data.output.amount}x ${data.output.resourceId}`);
  });

  // Auto-save on important events
  EventBus.on('skill.levelUp', () => {
    GameState.save();
  });

  EventBus.on('crafting.crafted', () => {
    GameState.save();
  });
}

/**
 * Debug helpers for browser console
 */
function setupDebugHelpers() {
  // Test gathering
  window.testGather = (nodeId = 'berry_bush') => {
    const result = HarvestingSystem.gather(nodeId);
    console.log('Test gather result:', result);
    return result;
  };

  // Test crafting
  window.testCraft = (recipeId = 'berry_potion') => {
    const result = CraftingSystem.craft(recipeId);
    console.log('Test craft result:', result);
    return result;
  };

  // Show skills
  window.showSkills = () => {
    const skills = SkillManager.getAllSkills();
    console.table(skills.map(s => ({
      Skill: s.name,
      Level: s.level,
      XP: `${s.xp}/${s.totalXp}`,
      Progress: `${s.xpPercentage}%`
    })));
    return skills;
  };

  // Show inventory
  window.showInventory = () => {
    const inventory = InventorySystem.getAllDetailed();
    console.table(inventory.map(i => ({
      Item: i.resource.name,
      Amount: i.amount,
      Category: i.resource.category,
      Tier: i.resource.tier
    })));
    return inventory;
  };

  // Show available nodes
  window.showNodes = (skillId = 'foraging') => {
    const nodes = HarvestingSystem.getAvailableNodes(skillId);
    console.table(nodes.map(n => ({
      Node: n.name,
      Skill: n.skill,
      Level: `${n.minLevel}-${n.maxLevel}`,
      Respawn: `${n.respawnTime/1000}s`
    })));
    return nodes;
  };

  // Show recipes
  window.showRecipes = (category = 'all') => {
    let recipes = CraftingSystem.getAllRecipes();
    
    if (category !== 'all') {
      recipes = recipes.filter(r => r.category === category);
    }
    
    console.table(recipes.map(r => ({
      Recipe: r.name,
      Skill: r.skill,
      Level: r.skillLevel,
      XP: r.xpReward,
      Time: `${r.craftTime/1000}s`
    })));
    return recipes;
  };

  // Reset game
  window.resetGame = () => {
    if (confirm('Reset all progress? This cannot be undone!')) {
      GameState.reset();
      GameState.save();
      console.log('[Debug] Game reset');
    }
  };

  // Export save
  window.exportSave = () => {
    const save = GameState.export();
    console.log('Save data:', save);
    return save;
  };

  // Import save
  window.importSave = (json) => {
    try {
      GameState.import(json);
      GameState.save();
      console.log('[Debug] Save imported');
      return true;
    } catch (error) {
      console.error('[Debug] Failed to import save:', error);
      return false;
    }
  };

  console.log('[Debug] Helper functions available: testGather, testCraft, showSkills, showInventory, showNodes, showRecipes, resetGame, exportSave, importSave');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initialize().then(setupDebugHelpers);
  });
} else {
  initialize().then(setupDebugHelpers);
}

console.log('[Main] Module loaded, waiting for DOM...');