/**
 * config.js - Centralized configuration constants
 * 
 * CHANGES:
 * 1. Extracted magic numbers from content.js
 * 2. Added game balance constants
 * 3. Added UI constants
 * 4. Added validation limits
 */

export const CONFIG = {
  // ========== GAME BALANCE ==========
  
  // Gathering
  GATHER: {
    BASE_TIME_MS: 2000,
    MIN_TIME_MS: 500,
    MAX_TIME_MS: 5000,
  },
  
  // Respawning
  RESPAWN: {
    BASE_TIME_MS: 30000,
    MIN_TIME_MS: 10000,
    MAX_TIME_MS: 120000,
  },
  
  // Skills
  SKILL: {
    XP_PER_LEVEL_BASE: 100,
    MAX_LEVEL: 100,
    MIN_LEVEL: 0,
  },
  
  // ========== INVENTORY ==========
  
  INVENTORY: {
    MAX_SLOTS: 20,
    MAX_STACK_SIZE: 999,
    MIN_STACK_SIZE: 1,
  },
  
  // ========== TOOLS ==========
  
  TOOL: {
    DEFAULT_DURABILITY: 100,
    MIN_DURABILITY: 0,
    DURABILITY_PER_USE: 1,
  },
  
  // ========== VALIDATION ==========
  
  VALIDATION: {
    MAX_STRING_LENGTH: 50,
    MAX_ID_LENGTH: 30,
    MAX_NAME_LENGTH: 100,
    MAX_COORDINATE: 1000,
    MIN_COORDINATE: -100,
  },
  
  // ========== UI ==========
  
  UI: {
    CONSOLE_MAX_LINES: 100,
    ACTION_BAR_UPDATE_MS: 100,
  },
  
  // ========== SAVE/LOAD ==========
  
  SAVE: {
    KEY: 'rpg_save',
    VERSION: 1,
    AUTO_SAVE_INTERVAL_MS: 60000, // 1 minute
  },
  
  // ========== PERFORMANCE ==========
  
  PERFORMANCE: {
    RESPAWN_CHECK_INTERVAL_MS: 1000,
    RENDER_THROTTLE_MS: 16, // ~60fps
  },
};

/**
 * Validates a configuration value
 * @param {string} category - Config category
 * @param {string} key - Config key
 * @param {any} value - Value to validate
 * @returns {boolean} - True if valid
 */
export function validateConfig(category, key, value) {
  if (!CONFIG[category]) {
    console.error(`[Config] Invalid category: ${category}`);
    return false;
  }
  
  if (!(key in CONFIG[category])) {
    console.error(`[Config] Invalid key: ${key} in ${category}`);
    return false;
  }
  
  // Type checking
  const expectedType = typeof CONFIG[category][key];
  if (typeof value !== expectedType) {
    console.error(`[Config] Type mismatch for ${category}.${key}: expected ${expectedType}, got ${typeof value}`);
    return false;
  }
  
  return true;
}

/**
 * Gets a config value with validation
 * @param {string} category - Config category
 * @param {string} key - Config key
 * @returns {any} - The config value, or undefined if invalid
 */
export function getConfig(category, key) {
  if (!validateConfig(category, key, CONFIG[category][key])) {
    return undefined;
  }
  return CONFIG[category][key];
}

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.GATHER);
Object.freeze(CONFIG.RESPAWN);
Object.freeze(CONFIG.SKILL);
Object.freeze(CONFIG.INVENTORY);
Object.freeze(CONFIG.TOOL);
Object.freeze(CONFIG.VALIDATION);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.SAVE);
Object.freeze(CONFIG.PERFORMANCE);

console.log('[Config] Loaded successfully');