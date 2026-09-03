/**
 * DataLoader - Load JSON data files asynchronously
 * 
 * Usage:
 *   const skills = await DataLoader.load('skills');
 *   const resources = await DataLoader.load('resources');
 *   
 *   // Or load multiple at once
 *   const data = await DataLoader.loadAll(['skills', 'resources', 'recipes']);
 */

const DataLoader = {
  // Cache loaded data
  _cache: {},

  /**
   * Load a single JSON file
   * @param {string} name - Name of the data file (without .json)
   * @returns {Promise<any>} Loaded data
   */
  async load(name) {
    // Return cached data if available
    if (this._cache[name]) {
      console.log(`[DataLoader] Returning cached "${name}"`);
      return this._cache[name];
    }

    try {
      console.log(`[DataLoader] Loading "${name}.json"...`);
      const response = await fetch(`data/${name}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this._cache[name] = data;
      
      console.log(`[DataLoader] Loaded "${name}" successfully`);
      return data;
    } catch (error) {
      console.error(`[DataLoader] Failed to load "${name}.json":`, error);
      throw error;
    }
  },

  /**
   * Load multiple JSON files at once
   * @param {string[]} names - Array of data file names
   * @returns {Promise<Object>} Object with loaded data keyed by name
   */
  async loadAll(names) {
    console.log(`[DataLoader] Loading ${names.length} files:`, names);
    
    const results = {};
    
    try {
      const promises = names.map(name => 
        this.load(name).then(data => ({ name, data }))
      );
      
      const loaded = await Promise.all(promises);
      
      loaded.forEach(({ name, data }) => {
        results[name] = data;
      });
      
      console.log(`[DataLoader] All files loaded successfully`);
      return results;
    } catch (error) {
      console.error(`[DataLoader] Failed to load files:`, error);
      throw error;
    }
  },

  /**
   * Get cached data without loading
   * @param {string} name - Name of the data file
   * @returns {any|null} Cached data or null if not loaded
   */
  get(name) {
    return this._cache[name] || null;
  },

  /**
   * Clear the cache
   * @param {string} [name] - Specific cache to clear, or omit for all
   */
  clearCache(name) {
    if (name) {
      delete this._cache[name];
      console.log(`[DataLoader] Cleared cache for "${name}"`);
    } else {
      this._cache = {};
      console.log(`[DataLoader] Cleared all caches`);
    }
  }
};

// Export for ES modules
export default DataLoader;

// Also make available globally for non-module scripts
window.DataLoader = DataLoader;

console.log('[DataLoader] Initialized');