/**
 * game.js - Minimal game logic with gathering
 * Foundation: movement, gathering, basic UI, skill tracking
 */

import { GRIDS, ITEMS } from './content.js';

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
  if (!elements.grid) return;
  
  elements.grid.replaceChildren();
  for (let y = 0; y < currentGrid.height; y++) {
    for (let x = 0; x < currentGrid.width; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      
      // Blocked cells
      const isBlocked = currentGrid.blockedCells?.some(([bx, by]) => bx === x && by === y);
      if (isBlocked) {
        cell.classList.add('blocked');
        cell.title = 'Blocked';
      }
      
      // Player
      if (state?.player?.x === x && state?.player?.y === y) {
        cell.classList.add('player');
        cell.title = 'Player';
      }
      
      elements.grid.append(cell);
    }
  }
  
  elements.grid.style.gridTemplateColumns = `repeat(${currentGrid.width}, 1fr)`;
  elements.grid.style.gridTemplateRows = `repeat(${currentGrid.height}, 1fr)`;
  
  // Update inspector
  const skill = state?.skills?.foraging || { xp: 0, level: 0, totalXp: 0 };
  if (elements.inspector) {
    elements.inspector.innerHTML = `
      <dt>Position</dt><dd>${state?.player?.x || 0}, ${state?.player?.y || 0}</dd>
      <dt>Foraging</dt><dd>Level ${skill.level} (${skill.totalXp || skill.xp || 0} XP)</dd>
      <dt>Inventory</dt><dd>${inventoryText()}</dd>
    `;
  }
}

function write(message, type = 'system') {
  if (!elements.consoleOutput) return;
  const line = document.createElement('div');
  line.className = `console-line ${type}`;
  line.textContent = message;
  elements.consoleOutput.append(line);
  elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
}

function show(result) {
  setStatus(result.success ? 'Ready' : 'Failed');
  write(`${result.code}: ${result.message}`, result.success ? 'system' : 'error');
  render();
}

// ============ Actions ============

function move(dx, dy) {
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
  if (x < 0 || x >= currentGrid.width || y < 0 || y >= currentGrid.height) {
    show({ success: false, code: 'INVALID', message: 'Invalid position.' });
    return;
  }
  state.player.x = x;
  state.player.y = y;
  render();
  show({ success: true, code: 'TELEPORTED', message: `Teleported to ${x},${y}` });
}

function gather() {
  // Test gathering - gives XP
  const result = SkillsSystem.addXP(state, 'foraging', 5);
  
  if (result.success) {
    const msg = result.leveledUp 
      ? `Gathered! Foraging leveled up to ${result.level}!`
      : `Gathered! +5 XP (${result.totalXp} total)`;
    
    show({ success: true, code: 'GATHERED', message: msg });
  } else {
    show({ success: false, code: 'ERROR', message: 'Failed to gather' });
  }
}

// ============ Commands ============

function executeCommand(raw) {
  const [command, ...args] = raw.trim().toLowerCase().split(/\s+/);
  if (!command) return;
  
  if (command === 'help') {
    write('Commands: help, state, teleport x y, gather, save, clear, reset', 'system');
  } else if (command === 'state') {
    write(JSON.stringify(state, null, 2));
  } else if (command === 'teleport') {
    teleport(Number(args[0]), Number(args[1]));
  } else if (command === 'gather') {
    gather();
  } else if (command === 'save') {
    window.GameState.save(state);
    write('SAVED', 'system');
  } else if (command === 'clear') {
    elements.consoleOutput?.replaceChildren();
  } else if (command === 'reset') {
    location.reload();
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
  window.executeCommand = executeCommand;
  window.render = render;
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