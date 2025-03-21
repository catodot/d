/**
 * TrumpHandEffectsController - Centralizes all visual effects for Trump's hand
 * This isolates visual effect management from game logic and hitbox management
 */
class TrumpHandEffectsController {
  constructor(gameState) {
    logger.info("effects", "Creating Trump Hand Effects Controller");

    // DOM elements
    this.visual = document.getElementById("trump-hand-visual");
    this.hitbox = document.getElementById("trump-hand-hitbox");
    this.gameContainer = document.getElementById("game-container") || document.body;
    
    this.gameState = gameState;

    // Use the global DeviceUtils for mobile detection
    this.isMobile = window.DeviceUtils && window.DeviceUtils.isMobileDevice;

    // State tracking
    this.states = {
      IDLE: "idle",
      HITTABLE: "hittable",
      HIT: "hit",
      GRAB_SUCCESS: "grab-success"
    };
    
    this.currentState = this.states.IDLE;
    this.isAnimating = false;
    this.isHovering = false; // Track hover state
    this.isGrabbing = false; // Track grabbing state
    this.targetCountry = null; // Track which country is being targeted
    
    // Configuration
    this.config = {
      animationDuration: 650,
      promptDelay: 5000,
      defaultStyles: {
        display: "none",
        opacity: "0",
        border: "none",
        transform: "scale(1.0)",
        backgroundColor: "transparent",
        position: "relative"
      },
      hittableStyles: {
        // Regular state (non-first block, not hovering)
        regular: {
          display: "block",
          opacity: "0.3",
          border: "none",
          transform: "scale(1.0)",
          backgroundColor: "transparent",
          position: "relative"
        },
        // First block state
        firstBlock: {
          display: "block",
          opacity: "0.3", // Reduced opacity for the outline
          border: "5px dashed black",
          borderRadius: "50%",
          transform: "scale(1.0)",
          backgroundColor: "transparent",
          position: "relative"
        },
        // Grabbing state (not first block)
        grabbing: {
          display: "block",
          opacity: "0.3",
          border: "2px solid black", // Changed to black border
          borderRadius: "50%",
          transform: "scale(1.0)",
          backgroundColor: "transparent",
          position: "relative",
          zIndex: "10"
        },
        // Regular hover state
        hover: {
          transform: "scale(1.2)",
          opacity: "0.6"
        },
        // Grabbing hover state
        grabbingHover: {
          transform: "scale(1.2)",
          opacity: "0.6",
          border: "4px solid black", // Changed to black border
          borderRadius: "50%",
          zIndex: "10"
        }
      },
      effectStyles: {
        display: "block",
        opacity: "1",
        border: "none",
        zIndex: "50"
      },
      promptStyles: {
        base: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'black',
          fontWeight: 'bold',
          fontSize: this.isMobile ? '0.7rem' : '1rem', // Smaller on mobile
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: '150', // Higher z-index to ensure it appears above everything
          textShadow: '1px 1px 3px white',
          width: '100%',
          padding: this.isMobile ? '5px' : '10px', // Smaller padding on mobile
          backgroundColor: 'rgba(255, 255, 255, 0.85)', // More opaque background
        },
        immediate: {
          backgroundColor: 'rgba(255, 255, 255, 0.75)',
          borderRadius: '10px'
        }
      }
    };

    // Store original z-index values for restoration
    this.originalZIndices = {
      visual: this.visual ? window.getComputedStyle(this.visual).zIndex : null,
      hitbox: this.hitbox ? window.getComputedStyle(this.hitbox).zIndex : null,
    };
    
    // Debug info to ensure initialization is correct
    logger.info("effects", "TrumpHandEffectsController initialized", {
      visual: !!this.visual,
      hitbox: !!this.hitbox,
      gameState: !!this.gameState,
      isMobile: this.isMobile
    });
  }

  /**
   * Set element styles from a styles object
   * @param {HTMLElement} element - The DOM element to style
   * @param {Object} styles - Object of style properties and values
   */
  setStyles(element, styles) {
    if (!element) return;
    
    Object.entries(styles).forEach(([property, value]) => {
      element.style[property] = value;
    });
  }

  /**
   * Determine if this is the first block based on game state
   * @returns {boolean} True if this is the first block attempt
   */
  isFirstBlock() {
    return this.gameState?.stats?.successfulBlocks === 0;
  }

  /**
   * Creates DOM element with specified properties and styles
   * @param {string} type - Element type (div, span, etc)
   * @param {Object} props - Properties to set (className, innerHTML, etc)
   * @param {Object} styles - Styles to apply
   * @returns {HTMLElement} The created element
   */
  createElement(type, props = {}, styles = {}) {
    const element = document.createElement(type);
    
    // Set properties (excluding dataset which needs special handling)
    Object.entries(props).forEach(([prop, value]) => {
      if (prop !== 'dataset') {
        element[prop] = value;
      }
    });
    
    // Handle dataset separately if provided
    if (props.dataset) {
      Object.entries(props.dataset).forEach(([key, value]) => {
        element.setAttribute(`data-${key}`, value);
      });
    }
    
    // Set styles
    this.setStyles(element, styles);
    
    return element;
  }

  /**
   * Create and manage click prompts for first-time users
   * @param {string} type - Type of prompt ('immediate' or 'animated')
   */
  createPrompt(type = 'immediate') {
    if (!this.visual) return;
    
    // Remove existing prompts first
    this.removePrompts();
    
    const isImmediate = type === 'immediate';
    const className = `click-prompt ${isImmediate ? 'immediate-prompt' : ''}`;
    const text = isImmediate ? 'click here!' : '<strong>CLICK HERE!!!</strong>';
    
    // Create a container that will hold our prompt
    const container = document.createElement('div');
    container.className = className;
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.right = '0';
    container.style.bottom = '0';
    container.style.zIndex = '150';
    container.style.pointerEvents = 'none';
    
    // Create the actual prompt content with full opacity
    const promptContent = document.createElement('div');
    promptContent.innerHTML = text;
    promptContent.style.position = 'absolute';
    promptContent.style.top = '50%';
    promptContent.style.left = '50%';
    promptContent.style.transform = 'translate(-50%, -50%)';
    promptContent.style.color = 'black';
    promptContent.style.fontWeight = 'bold';
    promptContent.style.fontSize = this.isMobile ? '0.7rem' : '1rem';
    promptContent.style.textAlign = 'center';
    promptContent.style.width = '100%';
    promptContent.style.padding = this.isMobile ? '5px' : '10px';
    promptContent.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
    promptContent.style.borderRadius = '10px';
    promptContent.style.textShadow = '1px 1px 3px white';
    promptContent.style.opacity = '1'; // Explicitly set opacity
    
    // Append the content to the container
    container.appendChild(promptContent);
    
    // Append the container to the visual
    this.visual.appendChild(container);
    
    // Add animation for non-immediate prompts
    if (!isImmediate) {
      promptContent.animate(
        [
          { opacity: 0.9, transform: 'translate(-50%, -50%) scale(0.9)', textShadow: '1px 1px 2px white' },
          { opacity: 1, transform: 'translate(-50%, -50%) scale(1.1)', textShadow: '3px 3px 6px white' },
          { opacity: 0.9, transform: 'translate(-50%, -50%) scale(0.9)', textShadow: '1px 1px 2px white' }
        ],
        {
          duration: 1000,
          iterations: Infinity
        }
      );
    }
    
    logger.debug("effects", `Added ${type} click prompt`);
    return container;
  }
  
  /**
   * Remove all prompts from the visual element
   */
  removePrompts() {
    if (!this.visual) return;
    
    const prompts = this.visual.querySelectorAll('.click-prompt');
    prompts.forEach(prompt => prompt.remove());
  }

  /**
   * Reset visual element to default state
   */
  resetVisual() {
    if (!this.visual) return;
  
    // Remove all effect classes
    this.visual.classList.remove(...Object.values(this.states), "animation-completed");
  
    // Remove any prompts
    this.removePrompts();
  
    // Reset all styles to default
    this.setStyles(this.visual, {
      ...this.config.defaultStyles,
      zIndex: this.originalZIndices.visual
    });
  
    // Remove any dynamic shard elements
    this.removeShards();
  
    this.isAnimating = false;
    this.isHovering = false;
    this.isGrabbing = false;
    this.targetCountry = null;
    this.currentState = this.states.IDLE;
    
    logger.debug("effects", "Visual reset to default state");
  }

  /**
   * Make the hand hittable, with appropriate visual cues
   * @param {boolean} isFirstBlock - Whether this is the user's first block attempt
   */
  makeHittable(isFirstBlock = this.isFirstBlock()) {
    if (!this.visual || !this.hitbox) return;
  
    // Update class and state
    this.visual.classList.add(this.states.HITTABLE);
    this.hitbox.classList.add(this.states.HITTABLE);
  
    this.isAnimating = false;
    this.currentState = this.states.HITTABLE;
  
    // Apply appropriate styles based on first block state, grabbing state, and hover state
    this.updateVisualStyles();
  
    // Add help indicators for first block
    if (isFirstBlock) {
      // Create immediate prompt
      this.createPrompt('immediate');
      
      // Schedule animated prompt after delay
      setTimeout(() => {
        // Only add if still in hittable state and still the first block
        if (this.currentState === this.states.HITTABLE && this.isFirstBlock()) {
          this.createPrompt('animated');
        }
      }, this.config.promptDelay);
    }
  
    logger.debug("effects", "Hand set to hittable state", { 
      isFirstBlock, 
      isGrabbing: this.isGrabbing
    });
  }

  /**
   * Apply visual effect when player successfully blocks
   */
  applyHitEffect() {
    if (!this.visual) return;

    // Stop if already animating this effect
    if (this.isAnimating && this.currentState === this.states.HIT) return;

    // Update state
    this.isAnimating = true;
    this.currentState = this.states.HIT;
    this.isHovering = false;
    this.isGrabbing = false; // Not grabbing anymore after being hit

    // Remove prompts
    this.removePrompts();

    // Apply styles for animation
    this.setStyles(this.visual, this.config.effectStyles);

    // Update classes
    this.visual.classList.remove(this.states.HITTABLE, this.states.GRAB_SUCCESS);
    this.visual.classList.add(this.states.HIT);

    // Apply screen shake
    this.gameContainer.classList.add("screen-shake");

    // Force reflow for animation
    void this.visual.offsetWidth;

    // Clean up after animation
    setTimeout(() => {
      // Remove screen shake
      this.gameContainer.classList.remove("screen-shake");

      // Update classes
      this.visual.classList.remove(this.states.HIT);
      this.visual.classList.add("animation-completed");

      // Complete reset after a short delay
      setTimeout(() => {
        this.resetVisual();
      }, 100);
    }, this.config.animationDuration);

    logger.debug("effects", "Applied hit effect");
  }

  /**
   * Apply visual effect when Trump successfully grabs
   */
  applyGrabSuccessEffect() {
    if (!this.visual) return;

    // Stop if already animating this effect
    if (this.isAnimating && this.currentState === this.states.GRAB_SUCCESS) return;

    // Update state
    this.isAnimating = true;
    this.currentState = this.states.GRAB_SUCCESS;
    this.isHovering = false;
    this.isGrabbing = false; // Grab is complete, not grabbing anymore

    // Remove prompts
    this.removePrompts();

    // Apply styles for animation
    this.setStyles(this.visual, this.config.effectStyles);

    // Update classes
    this.visual.classList.remove(this.states.HITTABLE, this.states.HIT);
    this.visual.classList.add(this.states.GRAB_SUCCESS);

    // Create shard elements
    this.createShards();

    // Apply screen shake
    this.gameContainer.classList.add("grab-screen-shake");

    // Force reflow for animation
    void this.visual.offsetWidth;

    // Clean up after animation
    setTimeout(() => {
      // Remove screen shake
      this.gameContainer.classList.remove("grab-screen-shake");

      // Update classes
      this.visual.classList.remove(this.states.GRAB_SUCCESS);
      this.visual.classList.add("animation-completed");

      // Complete reset after a short delay
      setTimeout(() => {
        this.resetVisual();
      }, 100);
    }, this.config.animationDuration);

    logger.debug("effects", "Applied grab success effect");
  }

  /**
   * Highlight a target country during grab attempts
   * @param {string} country - The country ID to highlight
   * @param {boolean} isTargeting - Whether we're targeting (true) or releasing (false)
   */
  highlightTargetCountry(country, isTargeting) {
    if (!country) return;

    // Get the flag overlay element
    const flagOverlay = document.getElementById(`${country}-flag-overlay`);
    if (!flagOverlay) return;

    if (isTargeting) {
      // Store current opacity for restoration
      flagOverlay._previousOpacity = flagOverlay.style.opacity || "0";

      // Add highlight class
      flagOverlay.classList.add("targeting-pulse");

      // Ensure visibility
      const currentOpacity = parseFloat(flagOverlay._previousOpacity);
      const newOpacity = Math.max(0.2, currentOpacity + 0.1).toString();
      flagOverlay.style.opacity = newOpacity;
      
      // Store the currently targeted country
      this.targetCountry = country;
    } else {
      // Remove highlight
      flagOverlay.classList.remove("targeting-pulse");

      // Restore previous opacity
      if (flagOverlay._previousOpacity !== undefined) {
        flagOverlay.style.opacity = flagOverlay._previousOpacity;
        delete flagOverlay._previousOpacity;
      }
      
      // Clear the targeted country if it matches
      if (this.targetCountry === country) {
        this.targetCountry = null;
      }
    }
  }

  /**
   * Restore visual state to match current hitbox state
   * Called when hand moves/changes but state doesn't change
   */
  restoreVisualState() {
    if (!this.visual || !this.hitbox || this.isAnimating) return;
    
    // Only proceed if hitbox is hittable
    if (this.hitbox.classList.contains(this.states.HITTABLE)) {
      // Update styles based on current state configuration
      this.updateVisualStyles();
      
      // Handle prompts for first block case
      if (!this.isFirstBlock()) {
        this.removePrompts();
      } else {
        // For first block, we need to add the prompt back if it's not there
        if (this.visual.querySelectorAll('.click-prompt').length === 0) {
          this.createPrompt(this.gameState?.stats?.successfulBlocks > 0 ? 'animated' : 'immediate');
        }
      }
    } else {
      // If not hittable, remove any prompts
      this.removePrompts();
    }
    
    logger.debug("effects", "Restored visual state", {
      isFirstBlock: this.isFirstBlock(),
      isGrabbing: this.isGrabbing,
      isHovering: this.isHovering
    });
  }

  /**
   * Apply visual changes for non-grabbing state
   */
  setNotGrabbingState() {
    if (!this.visual) return;

    // Only update if the state is changing
    if (this.isGrabbing) {
      // Update grabbing state
      this.isGrabbing = false;
      
      // If we're in hittable state, restore appropriate styling
      if (this.currentState === this.states.HITTABLE) {
        this.updateVisualStyles();
      } else {
        // Reset to default state
        this.resetVisual();
      }
      
      logger.debug("effects", "Set to not-grabbing state", {
        isHittable: this.currentState === this.states.HITTABLE,
        isFirstBlock: this.isFirstBlock()
      });
    }
  }

  /**
   * Apply visual changes for grabbing state
   */
  setGrabbingState() {
    if (!this.visual) return;
    
    // Only update if the state is changing
    if (!this.isGrabbing) {
      // Update grabbing state
      this.isGrabbing = true;
      
      // If we're in hittable state, update styling to show grabbing state
      if (this.currentState === this.states.HITTABLE) {
        this.updateVisualStyles();
      }
      
      logger.debug("effects", "Set to grabbing state", {
        isHittable: this.currentState === this.states.HITTABLE,
        isFirstBlock: this.isFirstBlock()
      });
    }
  }

  /**
   * Update visual styles based on current state configuration
   * (first block, grabbing, hovering)
   */
  updateVisualStyles() {
    if (!this.visual) return;
    
    const isFirstBlock = this.isFirstBlock();
    
    // Choose appropriate style set based on state
    let styleSet;
    
    if (isFirstBlock) {
      // First block always uses the first block style regardless of grabbing/hovering
      styleSet = this.config.hittableStyles.firstBlock;
    } else if (this.isGrabbing) {
      // Not first block, and grabbing
      if (this.isHovering) {
        // Grabbing and hovering
        styleSet = this.config.hittableStyles.grabbingHover;
      } else {
        // Grabbing but not hovering
        styleSet = this.config.hittableStyles.grabbing;
      }
    } else {
      // Not first block, not grabbing
      if (this.isHovering) {
        // Not grabbing but hovering
        styleSet = {
          ...this.config.hittableStyles.regular,
          ...this.config.hittableStyles.hover
        };
      } else {
        // Not grabbing, not hovering
        styleSet = this.config.hittableStyles.regular;
      }
    }
    
    // Apply the selected style set - ensuring full copy of styles
    const mergedStyles = {...styleSet};
    this.setStyles(this.visual, mergedStyles);
    
    logger.debug("effects", "Updated visual styles", { 
      isFirstBlock, 
      isGrabbing: this.isGrabbing, 
      isHovering: this.isHovering,
      selectedStyle: isFirstBlock ? "firstBlock" : 
                    this.isGrabbing && this.isHovering ? "grabbingHover" :
                    this.isGrabbing ? "grabbing" :
                    this.isHovering ? "hover" : "regular",
      borderApplied: mergedStyles.border
    });
  }

  /**
   * Create shard elements for grab success effect
   */
  createShards() {
    if (!this.visual) return;

    // Remove existing shards first
    this.removeShards();

    // Create new shards
    for (let i = 3; i <= 8; i++) {
      const shard = document.createElement("div");
      shard.className = `shard${i}`;
      shard.setAttribute("data-shard-id", i.toString());
      
      // Apply styles directly
      this.setStyles(shard, {
        position: "absolute",
        opacity: "1",
        zIndex: "100"
      });
      
      this.visual.appendChild(shard);
    }

    logger.debug("effects", "Created grab success shards");
  }

  /**
   * Remove shard elements
   */
  removeShards() {
    if (!this.visual) return;

    const shards = this.visual.querySelectorAll("[data-shard-id]");
    shards.forEach(shard => shard.remove());

    logger.debug("effects", "Removed shards");
  }

  /**
   * Update visual appearance when hovering over hand
   * @param {boolean} isHovering - Whether the cursor is hovering
   */
  updateHoverState(isHovering) {
    if (!this.visual || !this.hitbox) return;
    
    // Update hover state tracking
    this.isHovering = isHovering;

    // Don't apply hover effects during animations
    if (this.isAnimating) return;

    // Only apply hover effects if hand is in hittable state
    if (this.hitbox.classList.contains(this.states.HITTABLE)) {
      // Update visual based on current state configuration
      this.updateVisualStyles();
      
      logger.debug("effects", isHovering ? "Applied hover styles" : "Removed hover styles", {
        isGrabbing: this.isGrabbing,
        isFirstBlock: this.isFirstBlock()
      });
    }
  }

  /**
   * PUBLIC API METHODS
   * These methods provide a clean interface for GameManager to use
   */
  
  /**
   * Handle the start of a grab sequence
   * @param {string} country - The country being targeted
   * @param {boolean} isFirstBlock - Whether this is the first block attempt
   */
  handleGrabStart(country, isFirstBlock = this.isFirstBlock()) {
    // Make hand hittable
    this.makeHittable(isFirstBlock);
    
    // Highlight the targeted country
    this.highlightTargetCountry(country, true);
    
    // Set grabbing state
    this.setGrabbingState();
    
    logger.debug("effects", "Started grab sequence", {
      country,
      isFirstBlock,
      isGrabbing: this.isGrabbing
    });
  }
  
  /**
   * Handle successful grab block by player
   */
  handleGrabBlocked() {
    // Unhighlight the country
    if (this.targetCountry) {
      this.highlightTargetCountry(this.targetCountry, false);
    }
    
    // Set to not grabbing
    this.setNotGrabbingState();
    
    // Apply hit effect
    this.applyHitEffect();
    
    logger.debug("effects", "Handled grab block");
  }
  
  /**
   * Handle successful grab by Trump
   */
  handleGrabSuccess() {
    // Unhighlight the country
    if (this.targetCountry) {
      this.highlightTargetCountry(this.targetCountry, false);
    }
    
    // Set to not grabbing
    this.setNotGrabbingState();
    
    // Apply success effect
    this.applyGrabSuccessEffect();
    
    logger.debug("effects", "Handled grab success");
  }
}