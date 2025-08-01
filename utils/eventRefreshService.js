/**
 * Event Refresh Service
 * Provides centralized event refresh functionality
 * React Native compatible implementation
 */

class EventRefreshService {
  constructor() {
    this.listeners = new Set();
    this.eventCallbacks = new Map();
  }

  /**
   * Request a refresh of events data
   */
  requestRefresh() {
    console.log('🔄 EventRefreshService: Requesting events refresh...');
    this.emit('refresh-events');
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName - Name of the event
   * @param {...any} args - Arguments to pass to callbacks
   */
  emit(eventName, ...args) {
    const callbacks = this.eventCallbacks.get(eventName) || [];
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error('Error in event callback:', error);
      }
    });
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to call when event is emitted
   */
  on(eventName, callback) {
    if (!this.eventCallbacks.has(eventName)) {
      this.eventCallbacks.set(eventName, []);
    }
    this.eventCallbacks.get(eventName).push(callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to remove
   */
  off(eventName, callback) {
    const callbacks = this.eventCallbacks.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Subscribe to refresh events
   * @param {Function} callback - Function to call when refresh is requested
   */
  subscribe(callback) {
    this.listeners.add(callback);
    this.on('refresh-events', callback);
    
    return () => {
      this.listeners.delete(callback);
      this.off('refresh-events', callback);
    };
  }

  /**
   * Get number of active subscribers
   */
  getSubscriberCount() {
    return this.listeners.size;
  }
}

// Create singleton instance
const eventRefreshService = new EventRefreshService();

export default eventRefreshService;
