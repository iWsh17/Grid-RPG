/**
 * EventBus - Central event system for decoupled communication
 * 
 * Usage:
 *   // Subscribe to an event
 *   EventBus.on('resource.gathered', (data) => { ... });
 *   
 *   // Emit an event
 *   EventBus.emit('resource.gathered', { nodeId: 'berry_bush', items: [...] });
 *   
 *   // Unsubscribe
 *   EventBus.off('resource.gathered', callback);
 */

const EventBus = {
  // Internal event storage
  _events: {},

  /**
   * Subscribe to an event
   * @param {string} event - Event name (e.g., 'resource.gathered')
   * @param {function} callback - Function to call when event fires
   */
  on(event, callback) {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(callback);
    
    // Debug logging (remove in production if too verbose)
    console.log(`[EventBus] Subscribed to "${event}"`);
  },

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {any} data - Data to pass to callbacks
   */
  emit(event, data = {}) {
    const callbacks = this._events[event];
    
    if (callbacks) {
      console.log(`[EventBus] Emitting "${event}"`, data);
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in "${event}" callback:`, error);
        }
      });
    } else {
      console.warn(`[EventBus] No listeners for "${event}"`);
    }
  },

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {function} callback - The callback to remove
   */
  off(event, callback) {
    if (!this._events[event]) return;
    
    this._events[event] = this._events[event].filter(cb => cb !== callback);
    console.log(`[EventBus] Unsubscribed from "${event}"`);
  },

  /**
   * Clear all listeners for an event (or all events)
   * @param {string} [event] - Event name to clear, or omit for all
   */
  clear(event) {
    if (event) {
      this._events[event] = [];
      console.log(`[EventBus] Cleared listeners for "${event}"`);
    } else {
      this._events = {};
      console.log(`[EventBus] Cleared all listeners`);
    }
  },

  /**
   * Get number of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    return this._events[event] ? this._events[event].length : 0;
  }
};

// Export for ES modules
export default EventBus;

// Also make available globally for non-module scripts
window.EventBus = EventBus;

console.log('[EventBus] Initialized');