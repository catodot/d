/**
 * Utility for centralized debug logging control
 */
const DebugUtil = {
  // Is debug mode enabled globally?
  enabled: false,
  
  // Categories that are enabled
  categories: {},
  
  // Initialize with options
  init(options = {}) {
    this.enabled = options.enabled !== undefined ? options.enabled : this.enabled;
    this.categories = { ...this.categories, ...options.categories };
    return this;
  },
  
  // Check if a category is enabled
  isCategoryEnabled(category) {
    if (!category) return this.enabled;
    return this.enabled && this.categories[category];
  },
  
  // Logging methods
  log(category, message, ...args) {
    if (this.isCategoryEnabled(category)) {
      console.log(`[${category || 'general'}] ${message}`, ...args);
    }
  },
  
  debug(category, message, ...args) {
    if (this.isCategoryEnabled(category)) {
      console.debug(`[${category || 'debug'}] ${message}`, ...args);
    }
  },
  
  info(category, message, ...args) {
    if (this.isCategoryEnabled(category)) {
      console.info(`[${category || 'info'}] ${message}`, ...args);
    }
  },
  
  // Always show warnings and errors
  warn(category, message, ...args) {
    console.warn(`[${category || 'warn'}] ${message}`, ...args);
  },
  
  error(category, message, ...args) {
    console.error(`[${category || 'error'}] ${message}`, ...args);
  }
};

// Export for browser environment
if (typeof window !== 'undefined') {
  window.DebugUtil = DebugUtil;
}

// Export for Node.js environment
if (typeof module !== 'undefined') {
  module.exports = DebugUtil;
}