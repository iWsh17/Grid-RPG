/**
 * GameState.js - Save/load game state with error handling and versioning
 * 
 * CHANGES:
 * 1. Added save versioning for migrations
 * 2. Added error handling for localStorage failures
 * 3. Added validation on loaded data
 * 4. Added timestamp for save tracking
 */

const SAVE_VERSION = 1;
const SAVE_KEY = 'rpg_save';

/**
 * Validates that loaded state has required structure
 * @param {Object} state - The state to validate
 * @returns {boolean} - True if valid
 */
function validateState(state) {
  if (!state || typeof state !== 'object') {
    console.error('[GameState] Invalid state: not an object');
    return false;
  }
  
  if (!state.player || typeof state.player !== 'object') {
    console.error('[GameState] Invalid state: missing player');
    return false;
  }
  
  if (typeof state.player.x !== 'number' || typeof state.player.y !== 'number') {
    console.error('[GameState] Invalid state: player position invalid');
    return false;
  }
  
  if (!state.inventory || typeof state.inventory !== 'object') {
    console.error('[GameState] Invalid state: missing inventory');
    return false;
  }
  
  if (!state.skills || typeof state.skills !== 'object') {
    console.error('[GameState] Invalid state: missing skills');
    return false;
  }
  
  return true;
}

/**
 * Saves game state to localStorage
 * @param {Object} state - The game state to save
 * @returns {Object} - { success: boolean, error?: string }
 */
export function save(state) {
  try {
    const saveData = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      state: state
    };
    
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    console.log('[GameState] Saved successfully');
    return { success: true };
  } catch (error) {
    console.error('[GameState] Save failed:', error);
    
    // Handle specific errors
    if (error.name === 'QuotaExceededError') {
      return { 
        success: false, 
        error: 'Save quota exceeded. Clear some space.' 
      };
    }
    
    if (error.name === 'SecurityError') {
      return { 
        success: false, 
        error: 'Storage not available (private mode?)' 
      };
    }
    
    return { 
      success: false, 
      error: 'Save failed. Check console for details.' 
    };
  }
}

/**
 * Loads game state from localStorage
 * @returns {Object|null} - The loaded state, or null if failed
 */
export function load() {
  try {
    const saveDataRaw = localStorage.getItem(SAVE_KEY);
    
    if (!saveDataRaw) {
      console.log('[GameState] No save found');
      return null;
    }
    
    const saveData = JSON.parse(saveDataRaw);
    
    // Validate version
    if (saveData.version !== SAVE_VERSION) {
      console.warn(`[GameState] Save version mismatch: expected ${SAVE_VERSION}, got ${saveData.version}`);
      // In future: add migration logic here
      // For now, just warn and try to load anyway
    }
    
    // Validate state structure
    if (!validateState(saveData.state)) {
      console.error('[GameState] Save data corrupted, starting fresh');
      return null;
    }
    
    console.log(`[GameState] Loaded save from ${new Date(saveData.timestamp).toLocaleString()}`);
    return saveData.state;
  } catch (error) {
    console.error('[GameState] Load failed:', error);
    
    if (error.name === 'SecurityError') {
      console.error('[GameState] Storage not available (private mode?)');
      return null;
    }
    
    if (error instanceof SyntaxError) {
      console.error('[GameState] Save data corrupted (invalid JSON)');
      return null;
    }
    
    return null;
  }
}

/**
 * Clears saved game
 * @returns {void}
 */
export function clear() {
  try {
    localStorage.removeItem(SAVE_KEY);
    console.log('[GameState] Save cleared');
  } catch (error) {
    console.error('[GameState] Clear failed:', error);
  }
}

/**
 * Checks if a save exists
 * @returns {boolean}
 */
export function hasSave() {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch (error) {
    console.error('[GameState] Check failed:', error);
    return false;
  }
}