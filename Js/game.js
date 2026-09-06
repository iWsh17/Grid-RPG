/**
 * game.js - Movement and gathering with resource nodes and action timers
 * 
 * CHANGES (P0 Complete + Security):
 * 1. Added error boundaries to prevent crashes
 * 2. Fixed memory leak - setInterval now tracked and can be cleaned up
 * 3. Exposed debug functions to global scope for testing
 * 4. ADDED: Input sanitization for console commands (security)
 */


import { GRIDS, ITEMS, RESOURCE_NODES } from '../content.js';


// Grid management
let currentGridId = 'meadow_01';
let currentGrid = GRIDS[currentGridId];


// DOM elements
const elements = {
  grid: document.querySelector('#grid'),
  inspector: document.querySelector('#state-inspector'),
  consoleOutput: document.querySelector('#console-output'),
  consoleForm: document.querySelector('#console-form'),
  consoleInput: document.querySelector('#console-input'),
  resetButton: document.querySelector('#reset-button'),
  statusBadge: document.querySelector('#status-badge')
};


// Get systems from window
const SkillsSystem = window.SkillsSystem;
const InventorySystem = window.InventorySystem;


// State
let state = null;


// Action timer state
let currentAction = null; // { type: 'gathering', nodeId, startTime, duration, onComplete }


// Game loop timers - FIXED: Now tracked so they can be cleaned up
let respawnInterval = null;


// ============ Error Boundary ============

function safeRender(fn, fallback, context = '') {
  try {
    return fn();
  } catch (error) {
    console.error(`[Render Error${context ? ` in ${context}` : ''}]`, error);
    return fallback;
  }
}


// ============ Input Sanitization ============

/**
 * Sanitize item ID - only allow alphanumeric and underscore
 */
function sanitizeItemId(id) {
  if (typeof id !== 'string') return '';
  return id.replace(/[^a-z0-9_]/gi, '').slice(0, 50);
}


/**
 * Sanitize amount - must be positive integer, clamp to valid range
 */
function sanitizeAmount(amount) {
  const parsed = parseInt(amount);
  if (isNaN(parsed) || parsed < 1) return 1;
  return Math.min(999, parsed);
}


/**
 * Sanitize skill name
 */
function sanitizeSkillName(name) {
  if (typeof name !== 'string') return '';
  return name.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 30);
}


/**
 * Sanitize XP amount
 */
function sanitizeXP(amount) {
  const parsed = parseInt(amount);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.min(10000, parsed);
}


/**
 * Sanitize level
 */
function sanitizeLevel(level) {
  const parsed = parseInt(level);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.min(100, parsed);
}


/**
 * Sanitize teleport coordinates
 */
function sanitizeCoordinate(coord) {
  const parsed = parseInt(coord);
  if (isNaN(parsed)) return 0;
  // Clamp to reasonable grid bounds
  return Math.max(-100, Math.min(1000, parsed));
}


// ============ UI Functions ============


function setStatus(message) {
  elements.statusBadge.textContent = message;
}


function inventoryText() {
  if (!state?.inventory) return 'Empty';
  const entries = Object.entries(state.inventory)
    .filter(([, amount]) => amount > 0)
    .map(([id, amount]) => `${ITEMS[id]?.name ?? id}: ${amount}`);
  return entries.length ? entries.join(', ') : 'Empty';
}


function render() {
  safeRender(() => {
    if (!elements.grid) return;
    
    elements.grid.replaceChildren();
    for (let y = 0; y < currentGrid.height; y++) {
      for (let x = 0; x < currentGrid.width; x++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        
        const isBlocked = currentGrid.blockedCells?.some(([bx, by]) => bx === x && by === y);
        if (isBlocked) {
          cell.classList.add('blocked');
          cell.title = 'Blocked';
        }
        
        const nodeState = state.resourceNodes?.find(n => n.x === x && n.y === y);
        if (nodeState) {
          const nodeDef = RESOURCE_NODES.find(n => n.id === nodeState.id);
          cell.classList.add('resource-node');
          cell.textContent = nodeDef.icon;
          cell.title = `${nodeDef.name} (${nodeState.quantity}/${nodeDef.maxQuantity})`;
          
          if (nodeState.quantity <= 0) {
            cell.classList.add('depleted');
          }
        }
        
        if (state?.player?.x === x && state?.player?.y === y) {
          cell.classList.add('player');
          cell.title = 'Player';
        }
        
        elements.grid.append(cell);
      }
    }
    
    elements.grid.style.gridTemplateColumns = `repeat(${currentGrid.width}, 1fr)`;
    elements.grid.style.gridTemplateRows = `repeat(${currentGrid.height}, 1fr)`;
    
    const foragingSkill = state?.skills?.foraging || { level: 0, totalXp: 0 };
    const miningSkill = state?.skills?.mining || { level: 0, totalXp: 0 };
    
    if (elements.inspector) {
      elements.inspector.innerHTML = `
        <dt>Position</dt><dd>${state?.player?.x || 0}, ${state?.player?.y || 0}</dd>
        <dt>Foraging</dt><dd>Level ${foragingSkill.level} (${foragingSkill.totalXp || foragingSkill.xp || 0} XP)</dd>
        <dt>Mining</dt><dd>Level ${miningSkill.level} (${miningSkill.totalXp || miningSkill.xp || 0} XP)</dd>
        <dt>Inventory</dt><dd>${inventoryText()}</dd>
      `;
    }
    
    renderInventory();
    renderSkills();
    renderEquipped();
  }, null, 'render');
}


function renderInventory() {
  safeRender(() => {
    const grid = document.getElementById('inventory-grid');
    if (!grid || !state?.inventory) return;
    
    grid.replaceChildren();
    
    const items = Object.entries(state.inventory)
      .filter(([, amount]) => amount > 0);
    
    if (items.length === 0) {
      grid.innerHTML = '<p style="color: var(--muted); font-size: 0.75rem; padding: 8px;">Empty</p>';
      return;
    }
    
    items.forEach(([itemId, amount]) => {
      const itemDef = ITEMS[itemId];
      
      if (!itemDef) {
        console.warn(`[renderInventory] Unknown item: ${itemId}`);
        return;
      }
      
      const slot = document.createElement('div');
      slot.className = 'inventory-slot';
      slot.title = `${itemDef.name || itemId} x${amount}`;
      
      slot.innerHTML = `
        <span class="item-icon">${itemDef.icon || '📦'}</span>
        <span class="item-count">${amount}</span>
      `;
      
      slot.style.cursor = 'pointer';
      slot.onclick = (e) => {
        e.stopPropagation();
        const result = window.ToolSystem.equipTool(state, itemId);
        show(result);
      };
      
      grid.append(slot);
    });
  }, null, 'renderInventory');
}


function renderSkills() {
  safeRender(() => {
    const container = document.getElementById('skills-list');
    if (!container || !state?.skills) return;
    
    container.replaceChildren();
    
    const skillDefs = [
      { id: 'fishing', name: 'Fishing', icon: '🎣' },
      { id: 'mining', name: 'Mining', icon: '⛏️' },
      { id: 'foraging', name: 'Foraging', icon: '🌿' },
      { id: 'woodcutting', name: 'Woodcutting', icon: '🪓' }
    ];
    
    skillDefs.forEach(skillDef => {
      const skill = state.skills[skillDef.id] || { level: 0, totalXp: 0 };
      const xpForNextLevel = skill.level * 100 || 100;
      const xpInCurrentLevel = skill.totalXp % 100;
      const progress = (xpInCurrentLevel / xpForNextLevel) * 100;
      
      const row = document.createElement('div');
      row.className = 'skill-row';
      row.innerHTML = `
        <div class="skill-info">
          <span class="skill-name">${skillDef.icon} ${skillDef.name}</span>
          <span class="skill-level">Level ${skill.level}</span>
        </div>
        <div class="xp-bar">
          <div class="xp-fill" style="width: ${progress}%"></div>
          <span class="xp-text">${Math.floor(xpInCurrentLevel)}/${xpForNextLevel} XP</span>
        </div>
      `;
      
      container.append(row);
    });
  }, null, 'renderSkills');
}


function renderEquipped() {
  safeRender(() => {
    const container = document.getElementById('equipped-slot');
    if (!container || !state?.player) return;
    
    const equippedTool = state.player.equippedTool;
    
    if (!equippedTool) {
      container.innerHTML = '<p class="equipped-empty">Nothing equipped</p>';
      return;
    }
    
    const itemId = typeof equippedTool === 'string' ? equippedTool : equippedTool.itemId;
    const itemDef = ITEMS[itemId];
    
    if (!itemDef) {
      console.warn(`[renderEquipped] Unknown equipped item: ${itemId}`);
      container.innerHTML = `<p class="equipped-empty">Unknown item: ${itemId}</p>`;
      return;
    }
    
    container.innerHTML = `
      <div class="equipped-item" onclick="window.unequipTool()">
        <span class="item-icon">${itemDef.icon || '📦'}</span>
        <span class="item-name">${itemDef.name || itemId}</span>
        <span class="unequip-hint">Click to unequip</span>
      </div>
    `;
  }, null, 'renderEquipped');
}


window.unequipTool = function() {
  if (!state?.player?.equippedTool) return;
  
  const result = ToolSystem.unequipTool(state);
  show(result);
};


function write(message, type = 'system') {
  if (!elements.consoleOutput) return;
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  line.textContent = message;
  elements.consoleOutput.append(line);
  elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
}


function show(result) {
  safeRender(() => {
    if (!result || typeof result !== 'object') {
      console.error('[show] Invalid result:', result);
      return;
    }
    
    setStatus(result.success ? 'Ready' : 'Failed');
    write(`${result.code}: ${result.message}`, result.success ? 'system' : 'error');
    render();
  }, null, 'show');
}


function showActionBar(duration) {
  const bar = document.getElementById('action-bar');
  const fill = document.querySelector('.action-bar-fill');
  const text = document.querySelector('.action-bar-text');
  
  if (bar && fill && text) {
    bar.style.display = 'flex';
    fill.style.width = '0%';
    text.textContent = `Gathering... (${(duration / 1000).toFixed(1)}s)`;
    
    const checkInterval = setInterval(() => {
      if (!currentAction) {
        clearInterval(checkInterval);
        bar.style.display = 'none';
        return;
      }
      
      const elapsed = Date.now() - currentAction.startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      fill.style.width = `${progress}%`;
      
      if (elapsed >= duration && currentAction.type === 'gathering') {
        clearInterval(checkInterval);
        currentAction.onComplete();
        currentAction = null;
        bar.style.display = 'none';
      }
    }, 100);
  }
}


function hideActionBar() {
  const bar = document.getElementById('action-bar');
  if (bar) {
    bar.style.display = 'none';
  }
}


// ============ Game Loop - FIXED ============

function startRespawnLoop() {
  // Clear any existing interval first
  if (respawnInterval) {
    clearInterval(respawnInterval);
  }
  
  respawnInterval = setInterval(() => {
    if (!state?.resourceNodes) return;
    
    const now = Date.now();
    let needsRender = false;
    
    state.resourceNodes.forEach(nodeState => {
      if (nodeState.quantity <= 0 && nodeState.lastDepleted) {
        const nodeDef = RESOURCE_NODES.find(n => n.id === nodeState.id);
        const timeSince = now - nodeState.lastDepleted;
        
        if (timeSince >= nodeDef.respawnTime) {
          nodeState.quantity = nodeDef.maxQuantity;
          nodeState.lastDepleted = null;
          needsRender = true;
        }
      }
    });
    
    if (needsRender) {
      render();
    }
  }, 1000);
  
  console.log('[Game Loop] Respawn loop started');
}


function stopRespawnLoop() {
  if (respawnInterval) {
    clearInterval(respawnInterval);
    respawnInterval = null;
    console.log('[Game Loop] Respawn loop stopped');
  }
}


// ============ Actions ============


function move(dx, dy) {
  if (currentAction) {
    currentAction = null;
    hideActionBar();
    show({ success: false, code: 'ACTION_CANCELLED', message: 'Gathering cancelled!' });
  }
  
  const newX = state.player.x + dx;
  const newY = state.player.y + dy;
  
  if (newX < 0 || newX >= currentGrid.width || newY < 0 || newY >= currentGrid.height) {
    show({ success: false, code: 'OUT_OF_BOUNDS', message: 'Cannot move there.' });
    return;
  }
  
  const isBlocked = currentGrid.blockedCells?.some(([bx, by]) => bx === newX && by === newY);
  if (isBlocked) {
    show({ success: false, code: 'BLOCKED', message: 'That cell is blocked.' });
    return;
  }
  
  state.player.x = newX;
  state.player.y = newY;
  show({ success: true, code: 'MOVED', message: `Moved to ${newX}, ${newY}` });
}


function teleport(x, y) {
  // SECURITY: Validate coordinates
  const safeX = sanitizeCoordinate(x);
  const safeY = sanitizeCoordinate(y);
  
  if (safeX < 0 || safeX >= currentGrid.width || safeY < 0 || safeY >= currentGrid.height) {
    show({ success: false, code: 'INVALID', message: 'Invalid position. Use coordinates within grid bounds.' });
    return;
  }
  
  state.player.x = safeX;
  state.player.y = safeY;
  render();
  show({ success: true, code: 'TELEPORTED', message: `Teleported to ${safeX},${safeY}` });
}


function gather() {
  if (currentAction) {
    if (currentAction.type === 'gathering') {
      const elapsed = Date.now() - currentAction.startTime;
      if (elapsed >= currentAction.duration) {
        currentAction.onComplete();
        currentAction = null;
        hideActionBar();
      }
      return;
    }
  }
  
  const nodeState = state.resourceNodes?.find(
    n => n.x === state.player.x && n.y === state.player.y
  );
  
  if (!nodeState) {
    show({ success: false, code: 'NO_NODE', message: 'Nothing to gather here. Move to a resource node.' });
    return;
  }
  
  const nodeDef = RESOURCE_NODES.find(n => n.id === nodeState.id);
  
  const toolCheck = ToolSystem.canUseNode(state, nodeDef);
  if (!toolCheck.canUse) {
    if (toolCheck.reason === 'no_tool_equipped') {
      show({ 
        success: false, 
        code: 'NO_TOOL_EQUIPPED', 
        message: `You need a ${toolCheck.toolName} to gather from this` 
      });
      return;
    }
    if (toolCheck.reason === 'wrong_tool') {
      show({ 
        success: false, 
        code: 'WRONG_TOOL', 
        message: `You need a ${toolCheck.toolName} (you have ${toolCheck.currentTool} equipped)` 
      });
      return;
    }
    if (toolCheck.reason === 'tool_broken') {
      show({ 
        success: false, 
        code: 'TOOL_BROKEN', 
        message: `Your ${toolCheck.toolName} broke! Craft a new one.` 
      });
      return;
    }
  }
  
  const skillLevel = state.skills[nodeDef.skill]?.level || 0;
  if (skillLevel < nodeDef.minLevel) {
    show({ 
      success: false, 
      code: 'SKILL_TOO_LOW', 
      message: `Need ${nodeDef.skill} level ${nodeDef.minLevel} (you are ${skillLevel})` 
    });
    return;
  }
  
  if (nodeState.quantity <= 0) {
    const timeSince = Date.now() - (nodeState.lastDepleted || 0);
    if (timeSince < nodeDef.respawnTime) {
      const remaining = Math.ceil((nodeDef.respawnTime - timeSince) / 1000);
      show({ 
        success: false, 
        code: 'DEPLETED', 
        message: `This node is depleted. Respawning in ${remaining}s` 
      });
      return;
    }
    nodeState.quantity = nodeDef.maxQuantity;
    nodeState.lastDepleted = null;
    show({ success: true, code: 'RESPAWNED', message: 'The node has respawned!' });
    render();
    return;
  }
  
  const gatherTime = nodeDef.gatherTime || 2000;
  currentAction = {
    type: 'gathering',
    nodeId: nodeDef.id,
    nodeState: nodeState,
    nodeDef: nodeDef,
    startTime: Date.now(),
    duration: gatherTime,
    onComplete: () => executeGather(nodeDef, nodeState)
  };
  
  showActionBar(gatherTime);
  show({ success: true, code: 'GATHERING', message: `Gathering ${nodeDef.name}... (Hold E)` });
}


function executeGather(nodeDef, nodeState) {
  if (state.player.equippedTool) {
    const durabilityResult = ToolSystem.consumeDurability(state, state.player.equippedTool, 1);
    if (durabilityResult.broke) {
      show({ success: false, code: 'TOOL_BROKEN', message: `Your ${durabilityResult.tool?.name} broke!` });
    }
  }
  
  const gathered = [];
  for (const loot of nodeDef.lootTable) {
    if (Math.random() <= loot.chance) {
      const amount = Math.floor(Math.random() * (loot.amountMax - loot.amountMin + 1)) + loot.amountMin;
      const result = InventorySystem.addItem(state, loot.resourceId, amount);
      if (result.success) {
        gathered.push(`${ITEMS[loot.resourceId]?.name || loot.resourceId} x${amount}`);
      }
    }
  }
  
  const xpResult = SkillsSystem.addXP(state, nodeDef.skill, nodeDef.xpReward);
  
  nodeState.quantity--;
  if (nodeState.quantity <= 0) {
    nodeState.lastDepleted = Date.now();
  }
  
  let msg = '';
  if (gathered.length > 0) {
    msg = `Gathered: ${gathered.join(', ')}`;
    if (xpResult.leveledUp) {
      msg += ` ⬆️ ${nodeDef.skill} reached level ${xpResult.level}!`;
    } else {
      msg += ` (+${nodeDef.xpReward} ${nodeDef.skill} XP)`;
    }
  } else {
    msg = 'Nothing gathered...';
  }
  
  show({ success: true, code: 'GATHERED', message: msg });
}


// ============ Commands ============


function executeCommand(raw) {
  // SECURITY: Sanitize the raw input
  const safeRaw = raw.slice(0, 200); // Limit total length
  const [command, ...args] = safeRaw.trim().toLowerCase().split(/\s+/);
  if (!command) return;
  
  if (command === 'help') {
    write('Commands: help, state, teleport x y, gather, craft, recipes, craftable, equip, unequip, save, clear, reset', 'system');
    write('Debug: addxp <skill> <amount>, setlevel <skill> <level>, give <item> <amount>', 'system');
    write('Nodes: shoreline (5,8), reed_bed (7,8), surface_rock (2,3), copper_vein (3,3), sapling (8,2), pine_tree (8,3)', 'system');
  } else if (command === 'state') {
    write(JSON.stringify(state, null, 2));
  } else if (command === 'teleport') {
    // SECURITY: Sanitize coordinates
    const x = sanitizeCoordinate(args[0]);
    const y = sanitizeCoordinate(args[1]);
    teleport(x, y);
  } else if (command === 'gather') {
    gather();
  } else if (command === 'equip') {
    // SECURITY: Sanitize tool ID
    const toolId = sanitizeItemId(args[0]);
    if (!toolId) {
      write('Usage: equip <tool_id>. Example: equip fishing_rod_basic', 'error');
      return;
    }
    const result = ToolSystem.equipTool(state, toolId);
    show(result);
  } else if (command === 'unequip') {
    const result = ToolSystem.unequipTool(state);
    show(result);
  } else if (command === 'craft') {
    // SECURITY: Sanitize recipe ID
    const recipeId = sanitizeItemId(args[0]);
    if (!recipeId) {
      write('Usage: craft <recipe_id>. Example: craft fishing_rod_basic', 'error');
      return;
    }
    const CraftingSystem = window.CraftingSystem;
    if (!CraftingSystem) {
      write('CraftingSystem not loaded', 'error');
      return;
    }
    write('Available recipes:', 'system');
    CraftingSystem.getAllRecipes().forEach(recipe => {
      const ingredients = Object.entries(recipe.ingredients)
        .map(([id, amt]) => `${id}: ${amt}`)
        .join(', ');
      write(`  ${recipe.id} - ${recipe.name} (${ingredients})`, 'system');
    });
  } else if (command === 'craftable') {
    const CraftingSystem = window.CraftingSystem;
    if (!CraftingSystem) {
      write('CraftingSystem not loaded', 'error');
      return;
    }
    const craftable = CraftingSystem.getCraftableRecipes(state);
    if (craftable.length === 0) {
      write('No recipes can be crafted yet. Gather more materials!', 'error');
    } else {
      write('You can craft:', 'system');
      craftable.forEach(r => write(`  ${r.name} (${r.id})`, 'system'));
    }
  } else if (command === 'save') {
    window.GameState.save(state);
    write('SAVED', 'system');
  } else if (command === 'addxp') {
    // SECURITY: Sanitize skill and XP
    const skill = sanitizeSkillName(args[0]);
    const amount = sanitizeXP(args[1]);
    if (!skill || !amount) {
      write('Usage: addxp <skill> <amount>. Example: addxp mining 100', 'error');
      return;
    }
    const result = SkillsSystem.addXP(state, skill, amount);
    show({ success: true, code: 'XP_ADDED', message: `Added ${amount} XP to ${skill}. Level: ${result.level}` });
  } else if (command === 'setlevel') {
    // SECURITY: Sanitize skill and level
    const skill = sanitizeSkillName(args[0]);
    const level = sanitizeLevel(args[1]);
    if (!skill || !level) {
      write('Usage: setlevel <skill> <level>. Example: setlevel mining 5', 'error');
      return;
    }
    state.skills[skill] = { xp: 0, level: level, totalXp: 0 };
    show({ success: true, code: 'LEVEL_SET', message: `Set ${skill} to level ${level}` });
  } else if (command === 'give') {
    // SECURITY: Sanitize item ID and amount
    const itemId = sanitizeItemId(args[0]);
    const amount = sanitizeAmount(args[1]);
    if (!itemId || !amount) {
      write('Usage: give <item_id> <amount>. Example: give iron_pickaxe 1', 'error');
      return;
    }
    const result = InventorySystem.addItem(state, itemId, amount);
    show({ success: result.success, code: result.success ? 'ITEM_GIVEN' : 'GIVE_FAILED', message: result.success ? `Gave ${amount} ${itemId}` : result.reason });
  } else if (command === 'clear') {
    elements.consoleOutput?.replaceChildren();
  } else if (command === 'reset') {
    location.reload();
  } else if (command === 'stop') {
    stopRespawnLoop();
    write('Respawn loop stopped', 'system');
  } else if (command === 'start') {
    startRespawnLoop();
    write('Respawn loop started', 'system');
  } else {
    write(`Unknown: ${command}. Type help.`, 'error');
  }
}


// ============ Input ============


const directions = {
  ArrowUp: [0, -1], w: [0, -1],
  ArrowDown: [0, 1], s: [0, 1],
  ArrowLeft: [-1, 0], a: [-1, 0],
  ArrowRight: [1, 0], d: [1, 0]
};


document.addEventListener('keydown', event => {
  const dir = directions[event.key];
  if (dir && event.target !== elements.consoleInput) {
    event.preventDefault();
    move(...dir);
  }
});


document.addEventListener('keydown', event => {
  if (event.key === 'e' && event.target !== elements.consoleInput) {
    event.preventDefault();
    gather();
  }
});


elements.resetButton?.addEventListener('click', () => location.reload());


elements.consoleForm?.addEventListener('submit', event => {
  event.preventDefault();
  executeCommand(elements.consoleInput.value);
  elements.consoleInput.value = '';
});


// ============ Init ============


function init() {
  state = window.state;
  render();
  write('Foundation ready. Type help.', 'system');
  write(`Resource nodes loaded: ${RESOURCE_NODES.length}`, 'system');
  window.executeCommand = executeCommand;
  window.render = render;
  window.show = show;
  
  // FIXED: Start respawn loop with tracking
  startRespawnLoop();
  
  // EXPOSED: For debugging/testing
  window.startRespawnLoop = startRespawnLoop;
  window.stopRespawnLoop = stopRespawnLoop;
  window.getRespawnInterval = () => respawnInterval;
  
  console.log('[game.js] Initialized');
}


if (window.state) {
  init();
} else {
  const check = () => {
    if (window.state) init();
    else setTimeout(check, 100);
  };
  check();
}