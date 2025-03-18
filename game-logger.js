class GameLogger {
  constructor(options = {}) {
    // Default configuration
    this.config = {
      enabled: true,
      defaultLevel: 'info',
      showTimestamp: true,
      categories: {
        animation: false,
        audio: false,
        gameState: false,
        input: false,
        physics: false,
        rendering: false,
        network: false,
        performance: false,
      },
      levels: {
        error: { value: 0, color: 'red', enabled: true },
        warn: { value: 1, color: 'orange', enabled: true },
        info: { value: 2, color: 'teal', enabled: true },
        debug: { value: 3, color: 'green', enabled: false },
        trace: { value: 4, color: 'gray', enabled: false }
      }
    };

    // Override defaults with provided options
    this.config = this.mergeConfigs(this.config, options);
    
    // Store original console methods
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
    };
    
    // Create console methods for each level
    this.setupConsoleMethods();
    
    // Initialize local storage persistence if in browser
    this.initLocalStorage();
    
    // Log that the logger is initialized
    this.info('system', 'Logger initialized');
  }
  
  // Merge user config with defaults
  mergeConfigs(defaultConfig, userConfig) {
    const result = { ...defaultConfig };
    
    // Handle top-level properties
    for (const key in userConfig) {
      if (typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
        result[key] = this.mergeConfigs(defaultConfig[key] || {}, userConfig[key]);
      } else {
        result[key] = userConfig[key];
      }
    }
    
    return result;
  }
  
  // Setup console methods based on levels
  setupConsoleMethods() {
    for (const level in this.config.levels) {
      const levelConfig = this.config.levels[level];
      
      // Create method for each level (error, warn, info, debug, trace)
      this[level] = (category, message, ...args) => {
        this.log(level, category, message, ...args);
      };
    }
  }
  
  // Initialize local storage persistence
  initLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Try to load saved config from localStorage
        const savedConfig = localStorage.getItem('gameLoggerConfig');
        if (savedConfig) {
          const parsedConfig = JSON.parse(savedConfig);
          this.config = this.mergeConfigs(this.config, parsedConfig);
        }
      } catch (e) {
        this.error('system', 'Failed to load logger config from localStorage:', e);
      }
    }
  }
  
  // Save current config to localStorage
  saveToLocalStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('gameLoggerConfig', JSON.stringify(this.config));
      } catch (e) {
        this.error('system', 'Failed to save logger config to localStorage:', e);
      }
    }
  }
  
  // Main log method
  log(level, category, message, ...args) {
    // Exit if logging is completely disabled
    if (!this.config.enabled) return;
    
    // Check if level is enabled
    const levelConfig = this.config.levels[level];
    if (!levelConfig || !levelConfig.enabled) return;
    
    // Check if category is enabled
    if (category !== 'system' && this.config.categories[category] === false) return;
    
    // Format the message
    const formattedMsg = this.formatMessage(level, category, message);
    
    // Choose console method based on level
    let consoleMethod = 'log';
    if (level === 'error') consoleMethod = 'error';
    else if (level === 'warn') consoleMethod = 'warn';
    else if (level === 'info') consoleMethod = 'info';
    else if (level === 'debug') consoleMethod = 'debug';
    
    // Apply styling in browsers
    // if (typeof window !== 'undefined') {
    //   this.originalConsole[consoleMethod](
    //     `%c${formattedMsg}`,
    //     `color: ${levelConfig.color}; font-weight: bold;`,
    //     ...args
    //   );
    // } else {
    //   this.originalConsole[consoleMethod](formattedMsg, ...args);
    // }
  }
  
  // Format the log message
  formatMessage(level, category, message) {
    let result = '';
    
    // Add timestamp if enabled
    if (this.config.showTimestamp) {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
      result += `[${time}] `;
    }
    
    // Add level and category
    result += `[${level.toUpperCase()}][${category}] ${message}`;
    
    return result;
  }
  
  // Toggle a specific category
  toggleCategory(category, enabled = null) {
    if (this.config.categories.hasOwnProperty(category)) {
      if (enabled === null) {
        // Toggle the current value
        this.config.categories[category] = !this.config.categories[category];
      } else {
        // Set to specified value
        this.config.categories[category] = !!enabled;
      }
      
      this.info('system', `Logging for ${category} is now ${this.config.categories[category] ? 'enabled' : 'disabled'}`);
      this.saveToLocalStorage();
      return this.config.categories[category];
    }
    
    this.warn('system', `Unknown category: ${category}`);
    return false;
  }
  
  // Toggle a specific log level
  toggleLevel(level, enabled = null) {
    if (this.config.levels.hasOwnProperty(level)) {
      if (enabled === null) {
        // Toggle the current value
        this.config.levels[level].enabled = !this.config.levels[level].enabled;
      } else {
        // Set to specified value
        this.config.levels[level].enabled = !!enabled;
      }
      
      this.info('system', `Logging level ${level} is now ${this.config.levels[level].enabled ? 'enabled' : 'disabled'}`);
      this.saveToLocalStorage();
      return this.config.levels[level].enabled;
    }
    
    this.warn('system', `Unknown log level: ${level}`);
    return false;
  }
  
  // Enable all categories
  enableAllCategories() {
    for (const category in this.config.categories) {
      this.config.categories[category] = true;
    }
    this.info('system', 'All logging categories enabled');
    this.saveToLocalStorage();
  }
  
  // Disable all categories
  disableAllCategories() {
    for (const category in this.config.categories) {
      this.config.categories[category] = false;
    }
    this.info('system', 'All logging categories disabled');
    this.saveToLocalStorage();
  }
  
  // Create UI for controlling logger (useful in development)
  // createDebugUI() {
  //   if (typeof document === 'undefined') return;
    
  //   // Create container
  //   const container = document.createElement('div');
  //   container.id = 'game-logger-ui';
  //   container.style.cssText = `
  //     position: fixed;
  //     bottom: 10px;
  //     left: 10px;
  //     background-color: rgba(0, 0, 0, 0.8);
  //     color: white;
  //     padding: 10px;
  //     border-radius: 5px;
  //     font-family: monospace;
  //     font-size: 12px;
  //     z-index: 10000;
  //     max-height: 300px;
  //     overflow-y: auto;
  //     width: 300px;
  //   `;
    
  //   // Create header
  //   const header = document.createElement('div');
  //   header.textContent = 'Game Logger';
  //   header.style.cssText = 'font-weight: bold; margin-bottom: 10px; cursor: pointer;';
    
  //   // Create content container (for toggling visibility)
  //   const content = document.createElement('div');
    
  //   // Toggle button for collapsing
  //   let isCollapsed = false;
  //   header.addEventListener('click', () => {
  //     isCollapsed = !isCollapsed;
  //     content.style.display = isCollapsed ? 'none' : 'block';
  //     header.textContent = isCollapsed ? 'Game Logger [+]' : 'Game Logger';
  //   });
    
  //   // Level toggles
  //   const levelSection = document.createElement('div');
  //   levelSection.innerHTML = '<strong>Log Levels:</strong>';
    
  //   for (const level in this.config.levels) {
  //     const levelToggle = document.createElement('label');
  //     levelToggle.style.cssText = 'display: block; margin: 5px 0; cursor: pointer;';
      
  //     const checkbox = document.createElement('input');
  //     checkbox.type = 'checkbox';
  //     checkbox.checked = this.config.levels[level].enabled;
  //     checkbox.addEventListener('change', () => {
  //       this.toggleLevel(level, checkbox.checked);
  //     });
      
  //     levelToggle.appendChild(checkbox);
  //     levelToggle.appendChild(document.createTextNode(` ${level}`));
  //     levelToggle.style.color = this.config.levels[level].color;
      
  //     levelSection.appendChild(levelToggle);
  //   }
    
  //   // Category toggles
  //   const categorySection = document.createElement('div');
  //   categorySection.innerHTML = '<strong>Categories:</strong>';
    
  //   for (const category in this.config.categories) {
  //     const categoryToggle = document.createElement('label');
  //     categoryToggle.style.cssText = 'display: block; margin: 5px 0; cursor: pointer;';
      
  //     const checkbox = document.createElement('input');
  //     checkbox.type = 'checkbox';
  //     checkbox.checked = this.config.categories[category];
  //     checkbox.addEventListener('change', () => {
  //       this.toggleCategory(category, checkbox.checked);
  //     });
      
  //     categoryToggle.appendChild(checkbox);
  //     categoryToggle.appendChild(document.createTextNode(` ${category}`));
      
  //     categorySection.appendChild(categoryToggle);
  //   }
    
  //   // Quick toggle buttons
  //   const quickToggles = document.createElement('div');
  //   quickToggles.style.marginTop = '10px';
    
  //   const enableAllBtn = document.createElement('button');
  //   enableAllBtn.textContent = 'Enable All';
  //   enableAllBtn.addEventListener('click', () => {
  //     this.enableAllCategories();
  //     // Update UI checkboxes
  //     document.querySelectorAll('#game-logger-ui input[type="checkbox"]').forEach(cb => {
  //       if (cb.parentElement.parentElement === categorySection) {
  //         cb.checked = true;
  //       }
  //     });
  //   });
    
  //   const disableAllBtn = document.createElement('button');
  //   disableAllBtn.textContent = 'Disable All';
  //   disableAllBtn.addEventListener('click', () => {
  //     this.disableAllCategories();
  //     // Update UI checkboxes
  //     document.querySelectorAll('#game-logger-ui input[type="checkbox"]').forEach(cb => {
  //       if (cb.parentElement.parentElement === categorySection) {
  //         cb.checked = false;
  //       }
  //     });
  //   });
    
  //   quickToggles.appendChild(enableAllBtn);
  //   quickToggles.appendChild(document.createTextNode(' '));
  //   quickToggles.appendChild(disableAllBtn);
    
  //   // Assemble UI
  //   content.appendChild(levelSection);
  //   content.appendChild(document.createElement('hr'));
  //   content.appendChild(categorySection);
  //   content.appendChild(quickToggles);
    
  //   container.appendChild(header);
  //   container.appendChild(content);
    
  //   // Add to document
  //   document.body.appendChild(container);
    
  //   return container;
  // }
  
  // Create a group in the console
  group(category, label) {
    if (!this.config.enabled || !this.config.categories[category]) return {
      end: () => {} // No-op if logging disabled
    };
    
    console.group(this.formatMessage('info', category, label));
    
    return {
      end: () => console.groupEnd()
    };
  }
  
  // Time an operation
  time(category, label) {
    if (!this.config.enabled || !this.config.categories[category]) return {
      end: () => {} // No-op if logging disabled
    };
    
    const startTime = performance.now();
    const formattedLabel = this.formatMessage('info', category, label);
    
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.info(category, `${label} took ${duration.toFixed(2)}ms`);
      }
    };
  }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
  window.GameLogger = GameLogger;
} else if (typeof module !== 'undefined') {
  module.exports = GameLogger;
}