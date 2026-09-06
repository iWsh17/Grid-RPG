/**
 * content.js - Game data definitions with validation
 * 
 * CHANGES:
 * 1. Added validation for all data structures
 * 2. Using CONFIG constants where applicable
 * 3. Added JSDoc documentation
 * 4. Added runtime checks
 */

import { CONFIG } from './Js/core/config.js';

// ============ Validation Functions ============

/**
 * Validates a resource node definition
 * @param {Object} node - Node to validate
 * @returns {boolean} - True if valid
 */
function validateResourceNode(node) {
  const required = ['id', 'name', 'icon', 'skill', 'minLevel', 'gatherTime', 'respawnTime', 'maxQuantity', 'lootTable', 'xpReward'];
  
  for (const field of required) {
    if (!(field in node)) {
      console.error(`[Content] Resource node missing field: ${field}`, node);
      return false;
    }
  }
  
  if (typeof node.id !== 'string' || node.id.length > CONFIG.VALIDATION.MAX_ID_LENGTH) {
    console.error(`[Content] Resource node has invalid id: ${node.id}`);
    return false;
  }
  
  if (node.gatherTime < CONFIG.GATHER.MIN_TIME_MS || node.gatherTime > CONFIG.GATHER.MAX_TIME_MS) {
    console.error(`[Content] Resource node ${node.id} has invalid gatherTime: ${node.gatherTime}`);
    return false;
  }
  
  if (node.respawnTime < CONFIG.RESPAWN.MIN_TIME_MS || node.respawnTime > CONFIG.RESPAWN.MAX_TIME_MS) {
    console.error(`[Content] Resource node ${node.id} has invalid respawnTime: ${node.respawnTime}`);
    return false;
  }
  
  if (!Array.isArray(node.lootTable)) {
    console.error(`[Content] Resource node ${node.id} has invalid lootTable`);
    return false;
  }
  
  return true;
}

/**
 * Validates an item definition
 * @param {Object} item - Item to validate
 * @returns {boolean} - True if valid
 */
function validateItem(item) {
  const required = ['id', 'name', 'icon', 'type'];
  
  for (const field of required) {
    if (!(field in item)) {
      console.error(`[Content] Item missing field: ${field}`, item);
      return false;
    }
  }
  
  if (typeof item.id !== 'string' || item.id.length > CONFIG.VALIDATION.MAX_ID_LENGTH) {
    console.error(`[Content] Item has invalid id: ${item.id}`);
    return false;
  }
  
  return true;
}

/**
 * Validates a grid definition
 * @param {Object} grid - Grid to validate
 * @returns {boolean} - True if valid
 */
function validateGrid(grid) {
  const required = ['id', 'name', 'width', 'height', 'description'];
  
  for (const field of required) {
    if (!(field in grid)) {
      console.error(`[Content] Grid missing field: ${field}`, grid);
      return false;
    }
  }
  
  if (grid.width < 1 || grid.width > CONFIG.VALIDATION.MAX_COORDINATE) {
    console.error(`[Content] Grid ${grid.id} has invalid width: ${grid.width}`);
    return false;
  }
  
  if (grid.height < 1 || grid.height > CONFIG.VALIDATION.MAX_COORDINATE) {
    console.error(`[Content] Grid ${grid.id} has invalid height: ${grid.height}`);
    return false;
  }
  
  return true;
}

// ============ Resource Nodes ============

export const RESOURCE_NODES = [
  {
    id: 'shoreline',
    name: 'Shoreline',
    icon: '🌊',
    skill: 'fishing',
    minLevel: 1,
    gatherTime: CONFIG.GATHER.BASE_TIME_MS,
    respawnTime: CONFIG.RESPAWN.BASE_TIME_MS,
    maxQuantity: 10,
    lootTable: [
      { resourceId: 'fish_clownfish', amountMin: 1, amountMax: 2, chance: 0.7 },
      { resourceId: 'fish_tuna', amountMin: 1, amountMax: 1, chance: 0.3 },
    ],
    xpReward: 10,
  },
  {
    id: 'reed_bed',
    name: 'Reed Bed',
    icon: '🌾',
    skill: 'foraging',
    minLevel: 1,
    gatherTime: CONFIG.GATHER.BASE_TIME_MS,
    respawnTime: CONFIG.RESPAWN.BASE_TIME_MS,
    maxQuantity: 15,
    lootTable: [
      { resourceId: 'reed', amountMin: 1, amountMax: 3, chance: 0.8 },
      { resourceId: 'fiber', amountMin: 1, amountMax: 2, chance: 0.4 },
    ],
    xpReward: 8,
  },
  {
    id: 'surface_rock',
    name: 'Surface Rock',
    icon: '🪨',
    skill: 'mining',
    minLevel: 1,
    gatherTime: CONFIG.GATHER.BASE_TIME_MS,
    respawnTime: CONFIG.RESPAWN.BASE_TIME_MS,
    maxQuantity: 8,
    lootTable: [
      { resourceId: 'stone', amountMin: 1, amountMax: 2, chance: 0.9 },
      { resourceId: 'iron_ore', amountMin: 1, amountMax: 1, chance: 0.2 },
    ],
    xpReward: 12,
  },
  {
    id: 'copper_vein',
    name: 'Copper Vein',
    icon: '🟠',
    skill: 'mining',
    minLevel: 2,
    gatherTime: CONFIG.GATHER.BASE_TIME_MS * 1.5,
    respawnTime: CONFIG.RESPAWN.BASE_TIME_MS * 1.5,
    maxQuantity: 6,
    lootTable: [
      { resourceId: 'copper_ore', amountMin: 1, amountMax: 2, chance: 0.8 },
      { resourceId: 'stone', amountMin: 1, amountMax: 1, chance: 0.5 },
    ],
    xpReward: 18,
  },
  {
    id: 'sapling',
    name: 'Sapling',
    icon: '🌱',
    skill: 'woodcutting',
    minLevel: 1,
    gatherTime: CONFIG.GATHER.BASE_TIME_MS,
    respawnTime: CONFIG.RESPAWN.BASE_TIME_MS,
    maxQuantity: 12,
    lootTable: [
      { resourceId: 'wood_oak', amountMin: 1, amountMax: 3, chance: 0.8 },
      { resourceId: 'fiber', amountMin: 1, amountMax: 2, chance: 0.3 },
    ],
    xpReward: 10,
  },
  {
    id: 'pine_tree',
    name: 'Pine Tree',
    icon: '🌲',
    skill: 'woodcutting',
    minLevel: 2,
    gatherTime: CONFIG.GATHER.BASE_TIME_MS * 1.5,
    respawnTime: CONFIG.RESPAWN.BASE_TIME_MS * 1.5,
    maxQuantity: 8,
    lootTable: [
      { resourceId: 'wood_pine', amountMin: 1, amountMax: 3, chance: 0.8 },
      { resourceId: 'resin', amountMin: 1, amountMax: 1, chance: 0.3 },
    ],
    xpReward: 15,
  },
].filter(node => {
  const isValid = validateResourceNode(node);
  if (!isValid) {
    console.error(`[Content] Removing invalid node: ${node?.id || 'unknown'}`);
  }
  return isValid;
});

// ============ Items ============

export const ITEMS = {
  // Tools
  fishing_rod_basic: {
    id: 'fishing_rod_basic',
    name: 'Basic Fishing Rod',
    icon: '🎣',
    type: 'tool',
    toolType: 'fishing_rod',
    durability: CONFIG.TOOL.DEFAULT_DURABILITY,
  },
  pickaxe_basic: {
    id: 'pickaxe_basic',
    name: 'Basic Pickaxe',
    icon: '⛏️',
    type: 'tool',
    toolType: 'pickaxe',
    durability: CONFIG.TOOL.DEFAULT_DURABILITY,
  },
  axe_basic: {
    id: 'axe_basic',
    name: 'Basic Axe',
    icon: '🪓',
    type: 'tool',
    toolType: 'axe',
    durability: CONFIG.TOOL.DEFAULT_DURABILITY,
  },
  sickle_basic: {
    id: 'sickle_basic',
    name: 'Basic Sickle',
    icon: '🌾',
    type: 'tool',
    toolType: 'sickle',
    durability: CONFIG.TOOL.DEFAULT_DURABILITY,
  },
  
  // Resources
  fish_clownfish: {
    id: 'fish_clownfish',
    name: 'Clownfish',
    icon: '🐠',
    type: 'resource',
    stackable: true,
    maxStack: CONFIG.INVENTORY.MAX_STACK_SIZE,
  },
  fish_tuna: {
    id: 'fish_tuna',
    name: 'Tuna',
    icon: '🐟',
    type: 'resource',
    stackable: true,
    maxStack: CONFIG.INVENTORY.MAX_STACK_SIZE,
  },
  reed: {
    id: 'reed',
    name: 'Reed',
    icon: '🌾',
    type: 'resource',
    stackable: true,
    maxStack: CONFIG.INVENTORY.MAX_STACK_SIZE,
  },
  fiber: {
    id: 'fiber',
    name: 'Fiber',
    icon: '🧵',
    type: 'resource',
    stackable: true,
    maxStack: CONFIG.INVENTORY.MAX_STACK_SIZE,
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    icon: '🪨',
    type: 'resource',
    stackable: true,
    maxStack: CONFIG.INVENTORY.MAX_STACK_SIZE,
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    icon: '🔶',
    type: 'resource',
    stackable: true,
    maxStack: CONFIG.INVENTORY.MAX_STACK_SIZE,
  },
  copper_ore: {
    id: 'copper_ore',
    name: 'Copper Ore',
    icon: '🟠',
    type: 'resource',
    stackable: true,
    maxStack: CONFIG.INVENTORY.MAX_STACK_SIZE,
  },
  wood_oak: {
    id: 'wood_oak',
    name: 'Oak Wood',
    icon: '🪵',
    type: 'resource',
    stackable: true,
    maxStack: CONFIG.INVENTORY.MAX_STACK_SIZE,
  },
  wood_pine: {
    id: 'wood_pine',
    name: 'Pine Wood',
    icon: '🌲',
    type: 'resource',
    stackable: true,
    maxStack: CONFIG.INVENTORY.MAX_STACK_SIZE,
  },
  resin: {
    id: 'resin',
    name: 'Resin',
    icon: '💧',
    type: 'resource',
    stackable: true,
    maxStack: CONFIG.INVENTORY.MAX_STACK_SIZE,
  },
};

// Validate all items
Object.entries(ITEMS).forEach(([id, item]) => {
  if (!validateItem(item)) {
    console.error(`[Content] Removing invalid item: ${id}`);
    delete ITEMS[id];
  }
});

// ============ Grids ============

export const GRIDS = {
  meadow_01: {
    id: 'meadow_01',
    name: 'Meadow',
    width: 10,
    height: 10,
    description: 'A peaceful meadow with various resource nodes.',
    blockedCells: [
      [4, 4], [4, 5], [5, 4],
    ],
  },
};

// Validate all grids
Object.entries(GRIDS).forEach(([id, grid]) => {
  if (!validateGrid(grid)) {
    console.error(`[Content] Grid ${id} is invalid`);
  }
});

console.log(`[Content] Loaded: ${RESOURCE_NODES.length} nodes, ${Object.keys(ITEMS).length} items, ${Object.keys(GRIDS).length} grids`);