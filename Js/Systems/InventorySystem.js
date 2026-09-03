/**
 * InventorySystem - Item management
 * 
 * Usage:
 *   // Initialize
 *   InventorySystem.initialize(resourceData);
 *   
 *   // Add items
 *   InventorySystem.addItem('berries', 5);
 *   
 *   // Remove items
 *   InventorySystem.removeItem('berries', 3);
 *   
 *   // Check items
 *   const hasEnough = InventorySystem.hasItem('berries', 5);
 *   
 *   // Get all items
 *   const inventory = InventorySystem.getAll();
 */

const InventorySystem = {
  // Resource definitions from JSON
  _resourceData: null,

  /**
   * Initialize with resource data
   * @param {Object} resourceData - Loaded from resources.json
   */
  initialize(resourceData) {
    console.log('[InventorySystem] Initializing...');
    this._resourceData = resourceData;
    
    // Validate resource data
    if (!resourceData || !resourceData.resources || !Array.isArray(resourceData.resources)) {
      console.error('[InventorySystem] Invalid resource data');
      return false;
    }

    console.log(`[InventorySystem] Loaded ${resourceData.resources.length} resources`);
    return true;
  },

  /**
   * Get resource definition by ID
   * @param {string} resourceId - Resource ID
   * @returns {Object|null} Resource definition
   */
  getResource(resourceId) {
    if (!this._resourceData) return null;
    
    return this._resourceData.resources.find(r => r.id === resourceId) || null;
  },

  /**
   * Add item to inventory
   * @param {string} resourceId - Resource ID
   * @param {number} amount - Amount to add
   * @returns {number} New stack size
   */
  addItem(resourceId, amount) {
    const resource = this.getResource(resourceId);
    
    if (!resource) {
      console.error(`[InventorySystem] Cannot add unknown item "${resourceId}"`);
      return 0;
    }

    const current = GameState.get(`inventory.${resourceId}`) || 0;
    const stackSize = resource.stackSize || 999;
    const newAmount = Math.min(current + amount, stackSize);
    const actualAdded = newAmount - current;

    GameState.update(`inventory.${resourceId}`, newAmount);

    console.log(`[InventorySystem] Added ${actualAdded} ${resourceId} (total: ${newAmount})`);

    // Emit event
    window.EventBus.emit('inventory.itemAdded', {
      resourceId: resourceId,
      amount: actualAdded,
      total: newAmount,
      resource: resource
    });

    return newAmount;
  },

  /**
   * Remove item from inventory
   * @param {string} resourceId - Resource ID
   * @param {number} amount - Amount to remove
   * @returns {boolean} Success
   */
  removeItem(resourceId, amount) {
    const current = GameState.get(`inventory.${resourceId}`) || 0;
    
    if (current < amount) {
      console.warn(`[InventorySystem] Cannot remove ${amount} ${resourceId}: only ${current} available`);
      return false;
    }

    const newAmount = current - amount;
    
    if (newAmount === 0) {
      // Remove key entirely for clean saves
      const inventory = GameState.get('inventory');
      delete inventory[resourceId];
      GameState.update('inventory', inventory);
    } else {
      GameState.update(`inventory.${resourceId}`, newAmount);
    }

    console.log(`[InventorySystem] Removed ${amount} ${resourceId} (remaining: ${newAmount})`);

    // Emit event
    window.EventBus.emit('inventory.itemRemoved', {
      resourceId: resourceId,
      amount: amount,
      remaining: newAmount
    });

    return true;
  },

  /**
   * Check if player has enough of an item
   * @param {string} resourceId - Resource ID
   * @param {number} amount - Required amount
   * @returns {boolean} Has enough
   */
  hasItem(resourceId, amount = 1) {
    const current = GameState.get(`inventory.${resourceId}`) || 0;
    return current >= amount;
  },

  /**
   * Check if player has multiple items
   * @param {Array} requirements - Array of { resourceId, amount }
   * @returns {Object} { hasAll: boolean, missing: Array }
   */
  hasItems(requirements) {
    const missing = [];

    for (const req of requirements) {
      const current = GameState.get(`inventory.${req.resourceId}`) || 0;
      
      if (current < req.amount) {
        missing.push({
          resourceId: req.resourceId,
          required: req.amount,
          has: current
        });
      }
    }

    return {
      hasAll: missing.length === 0,
      missing: missing
    };
  },

  /**
   * Get item amount
   * @param {string} resourceId - Resource ID
   * @returns {number} Amount in inventory
   */
  getAmount(resourceId) {
    return GameState.get(`inventory.${resourceId}`) || 0;
  },

  /**
   * Get entire inventory
   * @returns {Object} Inventory object
   */
  getAll() {
    return GameState.get('inventory') || {};
  },

  /**
   * Get inventory as array with resource details
   * @returns {Array} Array of { resource, amount }
   */
  getAllDetailed() {
    const inventory = this.getAll();
    const detailed = [];

    for (const [resourceId, amount] of Object.entries(inventory)) {
      const resource = this.getResource(resourceId);
      detailed.push({
        resourceId: resourceId,
        amount: amount,
        resource: resource
      });
    }

    return detailed;
  },

  /**
   * Clear entire inventory
   */
  clear() {
    GameState.update('inventory', {});
    console.log('[InventorySystem] Inventory cleared');
    
    window.EventBus.emit('inventory.cleared', {});
  },

  /**
   * Get inventory stats
   * @returns {Object} Stats object
   */
  getStats() {
    const inventory = this.getAll();
    const totalItems = Object.values(inventory).reduce((sum, amount) => sum + amount, 0);
    const uniqueItems = Object.keys(inventory).length;

    return {
      totalItems: totalItems,
      uniqueItems: uniqueItems,
      slots: uniqueItems
    };
  }
};

// Export for ES modules
export default InventorySystem;

// Also make available globally for non-module scripts
window.InventorySystem = InventorySystem;

console.log('[InventorySystem] Initialized');