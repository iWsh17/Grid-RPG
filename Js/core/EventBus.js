/**
 * EventBus.js - Pub/sub event system with cleanup support
 * 
 * CHANGES:
 * 1. Added unsubscribe function return from on()
 * 2. Added error handling in emit() callbacks
 * 3. Added clear() for cleanup
 * 4. Added listener count for debugging
 */

const listeners = new Map();

/**
 * Subscribe to an event
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 * @returns {Function} - Unsubscribe function (call to remove listener)
 */
export function on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  
  const eventListeners = listeners.get(event);
  eventListeners.add(callback);
  
  console.log(`[EventBus] Subscribed to '${event}' (${eventListeners.size} listeners)`);
  
  // Return unsubscribe function
  return function unsubscribe() {
    off(event, callback);
  };
}

/**
 * Unsubscribe from an event
 * @param {string} event - Event name
 * @param {Function} callback - Callback function to remove
 * @returns {void}
 */
export function off(event, callback) {
  if (listeners.has(event)) {
    const removed = listeners.get(event).delete(callback);
    console.log(`[EventBus] Unsubscribed from '${event}': ${removed}`);
    
    // Clean up empty listener sets
    if (listeners.get(event).size === 0) {
      listeners.delete(event);
    }
  }
}

/**
 * Emit an event to all listeners
 * @param {string} event - Event name
 * @param {any} data - Data to pass to callbacks
 * @returns {number} - Number of listeners notified
 */
export function emit(event, data) {
  if (!listeners.has(event)) {
    return 0;
  }
  
  const eventListeners = listeners.get(event);
  let notified = 0;
  
  eventListeners.forEach(callback => {
    try {
      callback(data);
      notified++;
    } catch (error) {
      console.error(`[EventBus] Error in '${event}' listener:`, error);
      // Continue notifying other listeners
    }
  });
  
  console.log(`[EventBus] Emitted '${event}' to ${notified} listeners`);
  return notified;
}

/**
 * Clear all listeners (for cleanup/reset)
 * @returns {void}
 */
export function clear() {
  const count = listeners.size;
  listeners.clear();
  console.log(`[EventBus] Cleared all listeners (${count} events)`);
}

/**
 * Get listener count for debugging
 * @param {string} [event] - Optional event name
 * @returns {number|Map} - Count for specific event, or full map
 */
export function getListenerCount(event) {
  if (event) {
    return listeners.has(event) ? listeners.get(event).size : 0;
  }
  return listeners.size;
}