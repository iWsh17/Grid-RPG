/**
 * GameState - Centralized state management
 * 
 * Usage:
 *   // Initialize
 *   GameState.initialize();
 *   
 *   // Get state
 *   const skills = GameState.get('skills');
 *   const inventory = GameState.get('inventory');
 *   
 *   // Update state
 *   GameState.update('skills.foraging.level', 5);
 *   GameState.update('inventory.berries', 10);
 *   
 *   // Save/Load
 *   GameState.save();
 *   GameState.load();
 */

const GameState = {
  // The actual game state
  _state: null,

  // Save key for localStorage
  _saveKey: 'gridRPG_save_v2',

  /**
   * Initialize the game state with default values
   */
  initialize() {
    console.log('[GameState] Initializing...');
    
    this._state = {
      // Player stats
      player: {
        name: 'Player',
        level: 1,
        hp: 100,
        maxHp: 100
      },

      // Skills: { foraging: { level: 1, xp: 0, totalXp: 0 }, ... }
      skills: {
        foraging: { level: 1, xp: 0, totalXp: 0 },
        mining: { level: 1, xp: 0, totalXp: 0 },
        crafting: { level: 1, xp: 0, totalXp: 0 }
      },

      // Inventory: { berries: 10, copper_ore: 5, ... }
      inventory: {},

      // Unlocked recipes: { berry_potion: true, ... }
      recipes: {
        berry_potion: true,
        fiber_rope: true,
        stone_wall: true
      },

      // Achievements/progress tracking
      achievements: {
        firstGather: false,
        firstCraft: false,
        maxSkill: false,
        artisansCompass: false
      },

      // Game progress
      progress: {
        zonesDiscovered: [],
        nodesDiscovered: [],
        playTime: 0
      }
    };

    console.log('[GameState] Initialized with default state');
    return this._state;
  },

  /**
   * Get the entire state or a specific path
   * @param {string} [path] - Dot-notation path (e.g., 'skills.foraging')
   * @returns {any} State value or entire state
   */
  get(path) {
    if (!path) {
      return this._state;
    }

    const parts = path.split('.');
    let value = this._state;

    for (const part of parts) {
      if (value === undefined || value === null) {
        console.warn(`[GameState] Path "${path}" not found`);
        return undefined;
      }
      value = value[part];
    }

    return value;
  },

  /**
   * Update a value in the state
   * @param {string} path - Dot-notation path
   * @param {any} value - New value
   * @returns {boolean} Success
   */
  update(path, value) {
    const parts = path.split('.');
    let current = this._state;

    // Navigate to parent
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        console.error(`[GameState] Cannot update "${path}": parent path not found`);
        return false;
      }
      current = current[part];
    }

    // Set the value
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;

    console.log(`[GameState] Updated "${path}" =`, value);
    return true;
  },

  /**
   * Increment a numeric value
   * @param {string} path - Dot-notation path
   * @param {number} amount - Amount to add
   * @returns {number} New value
   */
  increment(path, amount = 1) {
    const current = this.get(path);
    if (typeof current !== 'number') {
      console.error(`[GameState] Cannot increment "${path}": not a number`);
      return current;
    }

    const newValue = current + amount;
    this.update(path, newValue);
    return newValue;
  },

  /**
   * Save state to localStorage
   * @returns {boolean} Success
   */
  save() {
    try {
      const saveData = JSON.stringify(this._state);
      localStorage.setItem(this._saveKey, saveData);
      console.log('[GameState] Saved to localStorage');
      return true;
    } catch (error) {
      console.error('[GameState] Failed to save:', error);
      return false;
    }
  },

  /**
   * Load state from localStorage
   * @returns {boolean} Success
   */
  load() {
    try {
      const saveData = localStorage.getItem(this._saveKey);
      
      if (!saveData) {
        console.log('[GameState] No save found, using defaults');
        this.initialize();
        return false;
      }

      this._state = JSON.parse(saveData);
      console.log('[GameState] Loaded from localStorage');
      return true;
    } catch (error) {
      console.error('[GameState] Failed to load:', error);
      this.initialize();
      return false;
    }
  },

  /**
   * Reset state to defaults
   */
  reset() {
    console.log('[GameState] Resetting to defaults...');
    this.initialize();
  },

  /**
   * Export state as JSON (for debugging)
   * @returns {string} JSON string
   */
  export() {
    return JSON.stringify(this._state, null, 2);
  },

  /**
   * Import state from JSON (for debugging)
   * @param {string} json - JSON string
   */
  import(json) {
    try {
      this._state = JSON.parse(json);
      console.log('[GameState] Imported state');
    } catch (error) {
      console.error('[GameState] Failed to import:', error);
    }
  }
};

// Export for ES modules
export default GameState;

// Also make available globally for non-module scripts
window.GameState = GameState;

console.log('[GameState] Initialized');