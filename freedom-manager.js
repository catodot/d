class SmackManager {
  /**
   * Creates a new SmackManager instance.
   * @param {Object} animationManager - The animation manager to delegate animations to.
   */
  constructor(animationManager) {
    logger.info("animation", "Creating Smack Manager");
    this.animationManager = animationManager;
  }

  /**
   * Plays a smack animation for the specified country.
   * @param {string} countryName - The name of the country to play the animation for.
   * @param {Function} onCompleteCallback - Callback to execute when animation completes.
   */
  playSmackAnimation(countryName, onCompleteCallback) {
    logger.info("animation", `Delegating smack animation for ${countryName} to AnimationManager`);

    // Delegate to the animationManager's playSmackAnimation method
    this.animationManager.playSmackAnimation(countryName, onCompleteCallback);
  }

  /**
   * Reset the Smack Manager to its initial state
   */
  reset() {
    logger.info("animation", "Resetting Smack Manager");
    // If there are any ongoing smack animations, stop them
    if (this.animationManager && typeof this.animationManager.stopSmackAnimations === "function") {
      this.animationManager.stopSmackAnimations();
    }
  }

  /**
   * Completely destroy the Smack Manager
   */
  destroy() {
    logger.info("animation", "Destroying Smack Manager");

    // Stop any ongoing animations
    if (this.animationManager && typeof this.animationManager.stopSmackAnimations === "function") {
      this.animationManager.stopSmackAnimations();
    }

    // Clear references
    this.animationManager = null;
  }
}

// Export the class to the global scope
window.SmackManager = SmackManager;

class TrumpHandEffectsController {
  constructor(gameState) {
    logger.info("effects", "Creating Trump Hand Effects Controller");
    this.elements = {
      visual: document.getElementById("trump-hand-visual"),
      hitbox: document.getElementById("trump-hand-hitbox"),
      gameContainer: document.getElementById("game-container") || document.body,
    };

    this.gameState = gameState;
    this.promptShownTime = 0;

    // Use the global DeviceUtils for mobile detection
    this.isMobile = window.DeviceUtils ? window.DeviceUtils.isMobile() : false;

    // Constant state definitions
    this.STATES = {
      IDLE: "idle",
      HITTABLE: "hittable",
      HIT: "hit",
      GRAB_SUCCESS: "grab-success",
    };

    this._styleUpdatePending = false;

    // Current state tracking
    this.state = {
      current: this.STATES.IDLE,
      isAnimating: false,
      isHovering: false,
      isGrabbing: false,
      targetCountry: null,
    };

    // Configuration
    this.config = this._createConfiguration();

    // Store original z-index values for restoration
    this.originalZIndices = {
      visual: this.elements.visual ? window.getComputedStyle(this.elements.visual).zIndex : null,
      hitbox: this.elements.hitbox ? window.getComputedStyle(this.elements.hitbox).zIndex : null,
    };

    // Ensure the visual element has the proper initial styles
    if (this.elements.visual) {
      // Make sure the visual element isn't inheriting unwanted visibility
      this.elements.visual.style.visibility = "visible";
      // Set initial styles, including z-index 0
      this.elements.visual.style.zIndex = "0";
      this.resetVisual();
    }
  }

  _createConfiguration() {
    return {
      animationDuration: 650,
      promptDelay: 1500, // Delay before showing the prompt
      defaultStyles: {
        display: "none",
        opacity: "0",
        border: "none",
        transform: "scale(1.0)",
        backgroundColor: "transparent",
        position: "absolute",
        visibility: "visible",
        zIndex: "1",
        transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out, background-color 0.3s ease-out, border 0.3s ease-out",
      },
      hittableStyles: {
        // Regular state (non-first block, not hovering)
        regular: {
          display: "block",
          border: "none",
          opacity: "0.5",
          // border: "1px dashed black",
          transform: "scale(1)",
          backgroundColor: "transparent",
          backgroundColor: "rgba(128, 0, 128, .5)", // Semi-transparent purple

          position: "absolute",
          visibility: "visible",
          zIndex: "0", // Use normal z-index here - will be overridden when needed
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out, background-color 0.3s ease-out, border 0.3s ease-out",
        },
        // getting ready for First block state
        firstBlock: {
          display: "block",
          opacity: "0.8",
          border: "2px dashed black",
          backgroundColor: "rgba(255, 255, 255, .5)",
          backgroundColor: "rgba(128, 0, 128, .5)", // Semi-transparent purple
          borderRadius: "50%",
          transform: "scale(1)",
          position: "absolute",
          visibility: "visible",
          zIndex: "0", // Higher z-index for first block
          transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out, background-color 0.3s ease-out, border 0.3s ease-out",
        },
        // First block hover state
        firstBlockHover: {
          transform: "scale(1.1)", // Grow slightly on hover for first block
          opacity: "0.9",
          backgroundColor: "rgba(0, 233, 4, 0.5)", // Darker purple on hover

        },
        // Grabbing state (not first block)
        grabbing: {
          display: "block",
          opacity: "0.3",
          border: "2px solid black",
          borderRadius: "50%",
          transform: "scale(1)",
          backgroundColor: "transparent",
          position: "absolute",
          visibility: "visible",
          zIndex: "1",
          transition: "transform 0.2s ease-out, opacity 0.2s ease-out, border 0.2s ease-out",
        },
        // Regular hover state
        hover: {
          transform: "scale(1.1)",
          opacity: "0.6",
          backgroundColor: "rgba(0, 233, 4, 0.5)", // Darker purple on hover

        },
        // Grabbing hover state
        grabbingHover: {
          transform: "scale(1.1)",
          opacity: "0.6",
          border: "4px solid black",
          borderRadius: "50%",
          zIndex: "1",
          backgroundColor: "rgba(0, 233, 4, 0.5)", // Darker purple on hover

        },
      },
      effectStyles: {
        display: "block",
        opacity: "1",
        border: "none",
        zIndex: "1",
        visibility: "visible",
        position: "absolute",
        backgroundColor: "transparent", // Explicitly ensure transparency
      },
    };
  }

  setVisualZIndex(zIndex) {
    if (this.elements.visual) {
      this.elements.visual.style.zIndex = zIndex;
    }
  }

  updateVisualStyles() {
    if (!this.elements.visual) return;
  
    // Add throttling to prevent multiple updates in rapid succession
    if (this._styleUpdatePending) return;
  
    this._styleUpdatePending = true;
    requestAnimationFrame(() => {
      // Remember current z-index to preserve it
      const currentZIndex = this.elements.visual.style.zIndex;
      
      // Get the appropriate style set based on current state
      let styleSet;
      const isFirstBlock = this.isFirstBlock();
  
      if (isFirstBlock) {
        // First block with or without hover
        if (this.state.isHovering) {
          styleSet = {
            ...this.config.hittableStyles.firstBlock,
            ...this.config.hittableStyles.firstBlockHover,
          };
        } else {
          styleSet = this.config.hittableStyles.firstBlock;
        }
      } else if (this.state.isGrabbing) {
        // Grabbing state
        styleSet = this.state.isHovering ? this.config.hittableStyles.grabbingHover : this.config.hittableStyles.grabbing;
      } else {
        // Regular state (not grabbing)
        styleSet = this.state.isHovering
          ? { ...this.config.hittableStyles.regular, ...this.config.hittableStyles.hover }
          : this.config.hittableStyles.regular;
      }
  
      // Apply the selected style set with critical properties
      const mergedStyles = { ...styleSet };
  
      // Always ensure these critical properties
      mergedStyles.pointerEvents = "none";
      mergedStyles.overflow = "visible";
      
      // Delete z-index from mergedStyles to prevent overriding the current value
      delete mergedStyles.zIndex;
      
      this.setStyles(this.elements.visual, mergedStyles);
      
      // Restore the z-index we saved earlier
      this.elements.visual.style.zIndex = currentZIndex;
  
      // Ensure the hitbox remains interactive
      if (this.elements.hitbox) {
        this.elements.hitbox.style.pointerEvents = "all";
        this.elements.hitbox.style.cursor = "pointer";
        this.elements.hitbox.style.zIndex = "1";
      }
  
      logger.debug("effects", "Updated visual styles", {
        isFirstBlock,
        isGrabbing: this.state.isGrabbing,
        isHovering: this.state.isHovering,
      });
  
      // Reset flag after update
      this._styleUpdatePending = false;
    });
  }

  setStyles(element, styles) {
    if (!element) return;

    Object.entries(styles).forEach(([property, value]) => {
      element.style[property] = value;
    });
  }

  resetVisual() {
    if (!this.elements.visual) return;
  
    // Remove all effect classes
    this.elements.visual.classList.remove(...Object.values(this.STATES), "animation-completed");
  
    // Reset all styles to default
    this.setStyles(this.elements.visual, {
      ...this.config.defaultStyles,
      backgroundColor: "transparent", // Explicitly ensure transparency
      zIndex: "0", // Always start with z-index 0
    });
  
    // Remove any dynamic shard elements
    this.removeShards();
  
    // Reset state
    this.state.isAnimating = false;
    this.state.isHovering = false;
    this.state.isGrabbing = false;
    this.state.targetCountry = null;
    this.state.current = this.STATES.IDLE;
  
    logger.debug("effects", "Visual reset to default state");
  }

  isFirstBlock() {
    return this.gameState?.stats?.successfulBlocks === 0;
  }

  _scheduleHitEffectCleanup() {
    setTimeout(() => {
      // Remove screen shake
      this.elements.gameContainer.classList.remove("screen-shake");

      // Update classes
      this.elements.visual.classList.remove(this.STATES.HIT);
      this.elements.visual.classList.add("animation-completed");

      // Complete reset after a short delay
      setTimeout(() => {
        this.resetVisual();
      }, 100);
    }, this.config.animationDuration);
  }

  _scheduleGrabEffectCleanup() {
    // Immediately ensure background is transparent
    if (this.elements.visual) {
      this.elements.visual.style.backgroundColor = "transparent";
    }

    setTimeout(() => {
      // Remove screen shake
      this.elements.gameContainer.classList.remove("grab-screen-shake");

      // Update classes
      if (this.elements.visual) {
        this.elements.visual.classList.remove(this.STATES.GRAB_SUCCESS);
        this.elements.visual.classList.add("animation-completed");

        // Explicitly ensure background is transparent again
        this.elements.visual.style.backgroundColor = "transparent";
      }

      // Complete reset after a short delay
      setTimeout(() => {
        this.resetVisual();
      }, 100);
    }, this.config.animationDuration);
  }

  makeHittable(isFirstBlock = this.isFirstBlock()) {
    if (!this.elements.visual || !this.elements.hitbox) {
      console.error("Cannot make hittable: visual or hitbox element is missing");
      return;
    }

    // Update class and state
    this.elements.visual.classList.add(this.STATES.HITTABLE);
    this.elements.hitbox.classList.add(this.STATES.HITTABLE);

    // Explicitly ensure hitbox is interactive
    this.elements.hitbox.style.pointerEvents = "all";
    this.elements.hitbox.style.cursor = "pointer";
    this.elements.hitbox.style.zIndex = "1";

    // Ensure visual element doesn't capture clicks
    this.elements.visual.style.pointerEvents = "none";

    this.state.isAnimating = false;
    this.state.current = this.STATES.HITTABLE;

    // Apply appropriate styles based on first block state, grabbing state, and hover state
    this.updateVisualStyles();

    // Check if we need to show the prompt
    this.updatePromptVisibility();
  }

  /**
   * Apply visual effect when player successfully blocks
   */
  applyHitEffect() {
    if (!this.elements.visual) return;

    // Stop if already animating this effect
    if (this.state.isAnimating && this.state.current === this.STATES.HIT) return;

    // Update state
    this.state.isAnimating = true;
    this.state.current = this.STATES.HIT;
    this.state.isHovering = false;
    this.state.isGrabbing = false; // Not grabbing anymore after being hit

    // Apply styles for animation but ensure visual doesn't block clicks
    const effectStyles = { ...this.config.effectStyles, pointerEvents: "none" };
    this.setStyles(this.elements.visual, effectStyles);

    // Update classes
    this.elements.visual.classList.remove(this.STATES.HITTABLE, this.STATES.GRAB_SUCCESS);
    this.elements.visual.classList.add(this.STATES.HIT);

    // Apply screen shake
    this.elements.gameContainer.classList.add("screen-shake");

    // Force reflow for animation
    void this.elements.visual.offsetWidth;

    // Clean up after animation
    this._scheduleHitEffectCleanup();
  }

  applyGrabSuccessEffect() {
    if (!this.elements.visual) return;

    // Stop if already animating this effect
    if (this.state.isAnimating && this.state.current === this.STATES.GRAB_SUCCESS) return;

    // Update state
    this.state.isAnimating = true;
    this.state.current = this.STATES.GRAB_SUCCESS;
    this.state.isHovering = false;
    this.state.isGrabbing = false; // Grab is complete, not grabbing anymore

    // Apply styles for animation ensuring it doesn't block clicks
    const effectStyles = {
      ...this.config.effectStyles,
      pointerEvents: "none",
      overflow: "visible",
      backgroundColor: "transparent", // Explicitly set transparent background
    };
    this.setStyles(this.elements.visual, effectStyles);

    // Update classes
    this.elements.visual.classList.remove(this.STATES.HITTABLE, this.STATES.HIT);
    this.elements.visual.classList.add(this.STATES.GRAB_SUCCESS);

    // Create shard elements
    this.createShards();

    // Apply screen shake
    this.elements.gameContainer.classList.add("grab-screen-shake");

    // Force reflow for animation
    void this.elements.visual.offsetWidth;

    // Clean up after animation
    this._scheduleGrabEffectCleanup();
  }

  /**
   * Create shard elements for grab success effect
   */
  createShards() {
    if (!this.elements.visual) return;

    // Remove existing shards first
    this.removeShards();

    // Create new shards
    for (let i = 3; i <= 8; i++) {
      const shard = document.createElement("div");
      shard.className = `shard${i}`;
      shard.setAttribute("data-shard-id", i.toString());

      // Apply styles directly - ensure shards are visible but don't interfere with clicks
      this.setStyles(shard, {
        position: "absolute",
        opacity: "1",
        zIndex: "2", // Higher z-index than the parent
        top: "50%",
        left: "50%",
        visibility: "visible",
        pointerEvents: "none", // Ensure shards don't block clicks
      });

      this.elements.visual.appendChild(shard);
    }
  }

  /**
   * Remove shard elements
   */
  removeShards() {
    if (!this.elements.visual) return;

    const shards = this.elements.visual.querySelectorAll("[data-shard-id]");
    shards.forEach((shard) => shard.remove());
  }

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

      // Calculate the "threat" opacity (5% darker than current)
      const currentOpacity = parseFloat(flagOverlay._previousOpacity);
      // Add 0.05 (5%) to the current opacity for the slight darkening effect
      const threatOpacity = Math.min(0.95, currentOpacity + 0.05).toString();
      flagOverlay.style.opacity = threatOpacity;

      // Store the currently targeted country
      this.state.targetCountry = country;
    } else {
      // Remove highlight
      flagOverlay.classList.remove("targeting-pulse");

      // Restore previous opacity
      if (flagOverlay._previousOpacity !== undefined) {
        flagOverlay.style.opacity = flagOverlay._previousOpacity;
        delete flagOverlay._previousOpacity;
      }

      // Clear the targeted country if it matches
      if (this.state.targetCountry === country) {
        this.state.targetCountry = null;
      }
    }
  }

  /**
   * Update hover state when mouse hovers over hand
   * @param {boolean} isHovering - Whether hovering or not
   */
  updateHoverState(isHovering) {
    if (!this.elements.visual || !this.elements.hitbox) return;

    // Update hover state tracking
    this.state.isHovering = isHovering;

    // Don't apply hover effects during animations
    if (this.state.isAnimating) return;

    // Only apply hover effects if hand is in hittable state
    if (this.elements.hitbox.classList.contains(this.STATES.HITTABLE)) {
      // Update visual based on current state configuration
      this.updateVisualStyles();

      logger.debug("effects", isHovering ? "Applied hover styles" : "Removed hover styles", {
        isGrabbing: this.state.isGrabbing,
        isFirstBlock: this.isFirstBlock(),
      });
    }
  }

  /**
   * Set grabbing state (when Trump is trying to grab)
   */
  setGrabbingState() {
    if (!this.elements.visual) return;

    // Only update if the state is changing
    if (!this.state.isGrabbing) {
      // Update grabbing state
      this.state.isGrabbing = true;

      // If we're in hittable state, update styling
      if (this.state.current === this.STATES.HITTABLE) {
        this.updateVisualStyles();
      }

      logger.debug("effects", "Set to grabbing state");
    }
  }

  /**
   * Set not-grabbing state
   */
  setNotGrabbingState() {
    if (!this.elements.visual) return;

    // Only update if the state is changing
    if (this.state.isGrabbing) {
      // Update grabbing state
      this.state.isGrabbing = false;

      // If we're in hittable state, restore appropriate styling
      if (this.state.current === this.STATES.HITTABLE) {
        this.updateVisualStyles();
      } else {
        // Reset to default state
        this.resetVisual();
      }

      logger.debug("effects", "Set to not-grabbing state");
    }
  }

  /**
   * PUBLIC API METHODS
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
    });
  }

  /**
   * Handle successful grab block by player
   */
  handleGrabBlocked() {
    // Unhighlight the country
    if (this.state.targetCountry) {
      this.highlightTargetCountry(this.state.targetCountry, false);
    }

    // Set to not grabbing
    this.setNotGrabbingState();

    // Apply hit effect
    this.applyHitEffect();

    logger.debug("effects", "Handled grab block");
  }

  // Add these methods to TrumpHandEffectsController

  addClickHerePrompt() {
    if (!this.elements.visual) return;
  
    // Check if prompt already exists
    if (document.getElementById("trump-hand-click-prompt")) {
      // Prompt already exists, no need to add another one
      return;
    }
  
    const isMobile = window.DeviceUtils ? window.DeviceUtils.isMobile() : false;
  
    // Remove any existing prompts (from other sources perhaps)
    this.removeClickHerePrompt();
  
    // Create the prompt element
    const prompt = document.createElement("div");
    prompt.id = "trump-hand-click-prompt";
    prompt.textContent = "CLICK HERE";
  
    // Style it to be very visible
    prompt.style.position = "absolute";
    prompt.style.left = "50%";
    prompt.style.top = "50%";
    prompt.style.textAlign = "center";
    prompt.style.color = "white";
  
    if (isMobile) {
      prompt.style.fontSize = ".8rem"; // Smaller font on mobile
    } else {
      prompt.style.fontSize = "1.3rem";
    }
  
    // Simple black outline that's thick but not overwhelming
    prompt.style.textShadow = 
      "3px 0 0 #000," +
      "-3px 0 0 #000," +
      "0 3px 0 #000," +
      "0 -3px 0 #000," +
      "2px 2px 0 #000," +
      "-2px -2px 0 #000," +
      "2px -2px 0 #000," +
      "-2px 2px 0 #000";
  
    prompt.style.transform = "translate(-50%, -50%)";
    prompt.style.fontWeight = "bold";
    prompt.style.padding = "20px 12px";
    prompt.style.borderRadius = "100%";
    prompt.style.fontFamily = "Arial, sans-serif";
    prompt.style.zIndex = "2";
    prompt.style.pointerEvents = "none";
  
    // Add pulsing animation
    prompt.style.animation = "pulse-prompt 1.5s infinite ease-in-out";
  
    // Add animation keyframes if they don't exist
    if (!document.getElementById("hand-prompt-style")) {
      const style = document.createElement("style");
      style.id = "hand-prompt-style";
      style.textContent = `
          @keyframes pulse-prompt {
            0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.8; }
            50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.8; }
          }
        `;
      document.head.appendChild(style);
    }
  
    // Append the prompt to the visual element
    this.elements.visual.appendChild(prompt);
  
    console.log("Added click here prompt to", this.elements.visual);
  }

  /**
   * Remove click prompt
   */
  removeClickHerePrompt() {
    // Remove trump-hand-click-prompt
    const prompt = document.getElementById("trump-hand-click-prompt");
    if (prompt && prompt.parentNode) {
      prompt.parentNode.removeChild(prompt);
    }

    // Also remove any .hitbox-prompt elements (from the other version)
    if (this.elements.hitbox) {
      const existingPrompts = this.elements.hitbox.querySelectorAll(".hitbox-prompt");
      existingPrompts.forEach((prompt) => prompt.remove());
    }

    // Remove style elements
    const handPromptStyle = document.getElementById("hand-prompt-style");
    if (handPromptStyle) handPromptStyle.remove();

    const hitboxPromptStyle = document.getElementById("hitbox-prompt-style");
    if (hitboxPromptStyle) hitboxPromptStyle.remove();

    logger.debug("effects", "Removed click here prompt");
  }

updatePromptVisibility() {
  // Double check if gameState is available and properly structured
  if (!this.gameState) {
    console.warn("Game state not available for prompt visibility check");
    return;
  }

  const isBeforeFirstBlock =
    this.gameState &&
    this.gameState.stats &&
    typeof this.gameState.stats.successfulBlocks === "number" &&
    this.gameState.stats.successfulBlocks === 0;

  // Get the current game time (seconds elapsed since start)
  const currentGameTime = this.gameState.config ? 
    (this.gameState.config.GAME_DURATION - this.gameState.timeRemaining) : 0;
  
  // Only show prompt after 10 seconds of game time has passed
  const shouldShowPrompt = isBeforeFirstBlock && 
                          this.state.current === this.STATES.HITTABLE && 
                          currentGameTime >= 5;

  console.log("Prompt visibility check:", {
    isBeforeFirstBlock,
    currentState: this.state.current,
    hittableState: this.STATES.HITTABLE,
    currentGameTime,
    shouldShowPrompt
  });

  if (shouldShowPrompt) {
    // Set higher z-index when showing the prompt
    this.setVisualZIndex("10");
    this.addClickHerePrompt();
  } else {
    // Reset to normal z-index when not showing prompt
    this.setVisualZIndex("0");
    this.removeClickHerePrompt();
  }
}
handleSuccessfulHit() {
  // Remove the click here prompt after a successful hit
  this.removeClickHerePrompt();
  
  // Explicitly set z-index back to 0 after first hit
  this.setVisualZIndex("0");
  
  this.updateVisualStyles();
}
  /**
   * Handle successful grab by Trump
   */
  handleGrabSuccess() {
    // Unhighlight the country
    if (this.state.targetCountry) {
      this.highlightTargetCountry(this.state.targetCountry, false);
    }

    // Set to not grabbing
    this.setNotGrabbingState();

    // Apply success effect
    this.applyGrabSuccessEffect();

    logger.debug("effects", "Handled grab success");
  }

  reset() {
    // Reset visual elements
    this.resetVisual();

    // Remove any prompts
    this.removeClickHerePrompt();

    // Reset prompt shown state
    this.promptShownTime = 0;

    // Reset state
    this.state = {
      current: this.STATES.IDLE,
      isAnimating: false,
      isHovering: false,
      isGrabbing: false,
      targetCountry: null,
    };

    // Make non-hittable
    if (this.elements.hitbox) {
      this.elements.hitbox.classList.remove(this.STATES.HITTABLE);
      this.elements.hitbox.style.pointerEvents = "none";
    }

    // Remove any animation elements
    this.removeShards();

    // Remove classes from gameContainer
    if (this.elements.gameContainer) {
      this.elements.gameContainer.classList.remove("screen-shake", "grab-screen-shake");
    }

    logger.debug("effects", "Reset Trump hand effects controller");
  }
}

/**
 * Shared utility functions for hitbox management
 */
const HitboxUtils = {
  /**
   * Position an element using coordinates
   * @param {HTMLElement} element - Element to position
   * @param {Object} coords - Coordinates object with x, y, width, height
   * @param {Object} styles - Optional additional styles to apply
   * @returns {boolean} Success status
   */
  positionElement(element, coords, styles = {}) {
    if (!element) return false;

    // Position the element
    element.style.position = "absolute";
    element.style.left = `${coords.x}px`;
    element.style.top = `${coords.y}px`;
    element.style.width = `${coords.width}px`;
    element.style.height = `${coords.height}px`;

    // Apply additional styles
    Object.entries(styles).forEach(([prop, value]) => {
      element.style[prop] = value;
    });

    return true;
  },

  /**
   * Calculate scale factor based on current map size vs reference scale
   * @param {HTMLElement} mapElement - Map element
   * @param {number} referenceScale - Reference scale
   * @returns {number} Scale factor
   */
  calculateScaleFactor(mapElement, referenceScale = 1.0) {
    if (!mapElement) return 1.0;

    const currentMapScale = mapElement.clientWidth / mapElement.naturalWidth;
    return currentMapScale / referenceScale;
  },

  /**
   * Apply debug visual style to an element
   * @param {HTMLElement} element - Element to style
   * @param {boolean} enabled - Whether debug mode is enabled
   */
  applyDebugVisuals(element, enabled) {
    if (!element) return;

    if (enabled) {
      // element.style.border = "2px dashed red";
      // element.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
    } else {
      element.style.border = "none";
      element.style.backgroundColor = "transparent";
    }
  },

  /**
   * Set up event handlers with clone technique to prevent memory leaks
   * @param {HTMLElement} element - Element to attach events to
   * @param {Object} handlers - Map of event types to handler functions
   * @returns {HTMLElement} The new element with attached handlers
   */
  setupEventHandlers(element, handlers) {
    if (!element) return null;

    // Create a clone to remove any existing handlers
    const newElement = element.cloneNode(true);
    if (element.parentNode) {
      element.parentNode.replaceChild(newElement, element);
    }

    // Add new handlers to the clone
    Object.entries(handlers).forEach(([event, handler]) => {
      newElement.addEventListener(event, handler);
    });

    return newElement;
  },

  /**
   * Remove click here prompt and related elements
   */
  removeClickPrompt() {
    // Remove trump-hand-click-prompt
    const prompt = document.getElementById("trump-hand-click-prompt");
    if (prompt && prompt.parentNode) {
      prompt.parentNode.removeChild(prompt);
    }

    // Also remove any .hitbox-prompt elements
    const hitbox = document.getElementById("trump-hand-hitbox");
    if (hitbox) {
      const existingPrompts = hitbox.querySelectorAll(".hitbox-prompt");
      existingPrompts.forEach((prompt) => prompt.remove());
    }

    // Remove style elements
    const handPromptStyle = document.getElementById("hand-prompt-style");
    if (handPromptStyle) handPromptStyle.remove();

    const hitboxPromptStyle = document.getElementById("hitbox-prompt-style");
    if (hitboxPromptStyle) hitboxPromptStyle.remove();
  },
};

// Make utilities globally available
window.HitboxUtils = HitboxUtils;

/**
 * Manages the hitbox for Trump's hand in grab animations
 */
class HandHitboxManager {
  /**
   * Create a new HandHitboxManager
   */
  constructor() {
    // Configuration
    this.config = {
      VISUAL_SCALE_FACTOR: 0.55,
      MOBILE_TOUCH_FACTOR: 1.2,
      DESKTOP_TOUCH_FACTOR: 1.0,
      REFERENCE_SCALE: 1.0,
    };

    // DOM elements - direct references to preserve original behavior
    this.trumpHandHitBox = document.getElementById("trump-hand-hitbox");
    this.trumpHandHitBoxVisual = document.getElementById("trump-hand-visual");

    // Also store in elements object for consistency
    this.elements = {
      hitbox: this.trumpHandHitBox,
      visual: this.trumpHandHitBoxVisual,
    };

    // Animation state
    this.currentState = "";
    this.currentFrame = 0;
    this.isVisible = false;
    this.isDebugMode = false;

    // Event handlers
    this._hoverHandlers = null;

    // Animation data reference
    this.animations = null;

    // Allowed animation states
    this.animationTypes = {
      grab: ["grabEastCanada", "grabWestCanada", "grabMexico", "grabGreenland"],
      smack: ["slapped"],
    };

    this.init();
  }

  /**
   * Initialize the hitbox manager
   */
  init() {
    if (this.trumpHandHitBox) {
      this.trumpHandHitBox.style.display = "none";
      this.trumpHandHitBox.style.pointerEvents = "none";

      // Don't set up hover effects if TrumpHandEffectsController exists
      if (!window.trumpHandEffects) {
        this.setupHoverEffects();
      }
    } else {
      // Try to get the element if it wasn't found initially
      this.trumpHandHitBox = document.getElementById("trump-hand-hitbox");
      this.elements.hitbox = this.trumpHandHitBox;

      this.trumpHandHitBoxVisual = document.getElementById("trump-hand-visual");
      this.elements.visual = this.trumpHandHitBoxVisual;
    }

    // Clear any existing tracking interval
    if (window.handVisualInterval) {
      clearInterval(window.handVisualInterval);
      window.handVisualInterval = null;
    }
  }

  /**
   * Hide the hitbox
   */
  hideHitbox() {
    if (this.trumpHandHitBox) {
      this.trumpHandHitBox.style.display = "none";
      this.trumpHandHitBox.style.pointerEvents = "none";
      this.isVisible = false;

      // Also hide the visual element
      if (this.trumpHandHitBoxVisual) {
        this.trumpHandHitBoxVisual.style.opacity = "0";
      }

      // Remove event listeners when hiding the hitbox
      this.removeHoverEffects();

      // Remove the prompt
      this.removeClickHerePrompt();
    }
  }

  /**
   * Setup hover effects for the hitbox
   */
  setupHoverEffects() {
    if (!this.trumpHandHitBox || !this.trumpHandHitBoxVisual) return;

    // Remove existing listeners first
    this.removeHoverEffects();

    // Define new handlers using the effects controller
    const onMouseEnter = () => {
      if (window.trumpHandEffects) {
        window.trumpHandEffects.updateHoverState(true);
      }

      // Add additional visual feedback by changing cursor
      this.trumpHandHitBox.style.cursor = "pointer";
    };

    const onMouseLeave = () => {
      if (window.trumpHandEffects) {
        window.trumpHandEffects.updateHoverState(false);
      }
    };

    // Add click sound effect
    const onClick = (e) => {
      // Prevent event bubbling
      e.stopPropagation();

      // Trigger audio feedback if available
      if (window.audioManager) {
        window.audioManager.play("ui", "click");
      }
    };

    // Add the event listeners
    this.trumpHandHitBox.addEventListener("mouseenter", onMouseEnter);
    this.trumpHandHitBox.addEventListener("mouseleave", onMouseLeave);
    this.trumpHandHitBox.addEventListener("click", onClick);

    // Store for later removal
    this._hoverHandlers = {
      enter: onMouseEnter,
      leave: onMouseLeave,
      click: onClick,
    };
  }

  /**
   * Remove hover effects
   */
  removeHoverEffects() {
    if (!this.trumpHandHitBox || !this._hoverHandlers) return;

    // Remove the stored event listeners
    if (this._hoverHandlers.enter) {
      this.trumpHandHitBox.removeEventListener("mouseenter", this._hoverHandlers.enter);
    }

    if (this._hoverHandlers.leave) {
      this.trumpHandHitBox.removeEventListener("mouseleave", this._hoverHandlers.leave);
    }

    if (this._hoverHandlers.click) {
      this.trumpHandHitBox.removeEventListener("click", this._hoverHandlers.click);
    }

    // Clear the stored handlers
    this._hoverHandlers = null;
  }

  /**
   * Set animations data
   * @param {Object} animations - Animations data object
   */
  setAnimationsData(animations) {
    this.animations = animations;
  }

  /**
   * Update current state and frame
   * @param {string} state - Current animation state
   * @param {number} frameIndex - Current frame index
   */
  updateStateAndFrame(state, frameIndex) {
    this.currentState = state;
    this.currentFrame = frameIndex;
    this.updatePosition();
  }

  /**
   * Adjust hitbox size
   * @param {number} width - New width in pixels
   * @param {number} height - New height in pixels
   * @returns {Object|undefined} Current hitbox info or undefined if not visible
   */
  adjustHitboxSize(width, height) {
    if (!this.trumpHandHitBox || !this.isVisible) {
      return;
    }

    // Store original coordinates
    const x = parseInt(this.trumpHandHitBox.style.left, 10);
    const y = parseInt(this.trumpHandHitBox.style.top, 10);

    // Apply new dimensions
    this.trumpHandHitBox.style.width = `${width}px`;
    this.trumpHandHitBox.style.height = `${height}px`;

    // Update stored coordinates for current frame
    if (this.animations && this.animations[this.currentState]) {
      if (this.animations[this.currentState].handCoordinates && this.animations[this.currentState].handCoordinates[this.currentFrame]) {
        this.animations[this.currentState].handCoordinates[this.currentFrame].width = width;
        this.animations[this.currentState].handCoordinates[this.currentFrame].height = height;
      }
    }

    return { x, y, width, height };
  }

  /**
   * Remove click here prompt
   */
  removeClickHerePrompt() {
    // Remove trump-hand-click-prompt
    const prompt = document.getElementById("trump-hand-click-prompt");
    if (prompt && prompt.parentNode) {
      prompt.parentNode.removeChild(prompt);
    }

    // Also remove any .hitbox-prompt elements (from the other version)
    if (this.trumpHandHitBox) {
      const existingPrompts = this.trumpHandHitBox.querySelectorAll(".hitbox-prompt");
      existingPrompts.forEach((prompt) => prompt.remove());
    }

    // Remove style elements
    const handPromptStyle = document.getElementById("hand-prompt-style");
    if (handPromptStyle) handPromptStyle.remove();

    const hitboxPromptStyle = document.getElementById("hitbox-prompt-style");
    if (hitboxPromptStyle) hitboxPromptStyle.remove();
  }

  /**
   * Get coordinates for a specific animation frame
   * @param {Object} animation - The animation data
   * @param {number} frameIndex - The frame index to get coordinates for
   * @param {boolean} isMobile - Whether the device is mobile
   * @returns {Object|null} The scaled coordinates or null if not found
   */
  getCoordinatesForFrame(animation, frameIndex, isMobile) {
    // Check if coordinates exist for this frame
    if (!animation.handCoordinates || !animation.handCoordinates[frameIndex]) {
      return null;
    }

    const baseCoords = animation.handCoordinates[frameIndex];

    // Get the current map element
    const mapElem = document.getElementById("map-background");
    if (!mapElem) {
      return baseCoords; // Return unscaled as fallback
    }

    // Calculate current map scale compared to natural size
    const currentMapScale = mapElem.clientWidth / mapElem.naturalWidth;

    // This is your "reference" scale at which the desktop coordinates were calibrated
    const referenceDesktopScale = this.config.REFERENCE_SCALE;

    // Calculate the adjustment needed
    const scaleAdjustment = currentMapScale / referenceDesktopScale;

    // For mobile, you might want to make hitboxes slightly larger for easier touch targets
    const touchFactor = isMobile ? this.config.MOBILE_TOUCH_FACTOR : this.config.DESKTOP_TOUCH_FACTOR;

    // Apply scaling
    const scaledCoords = {
      x: Math.round(baseCoords.x * scaleAdjustment),
      y: Math.round(baseCoords.y * scaleAdjustment),
      width: Math.round(baseCoords.width * scaleAdjustment * touchFactor),
      height: Math.round(baseCoords.height * scaleAdjustment * touchFactor),
    };

    return scaledCoords;
  }

  /**
   * Update hitbox position based on current state and frame
   * @param {boolean} predictFrame - Whether to predict next frame position for smoother animations
   */
  updatePosition(predictFrame = false) {
    // Validate required elements and data
    if (!this.trumpHandHitBox) {
      return;
    }

    if (!this.animations) {
      return;
    }

    const grabAnimations = this.animationTypes.grab;
    const smackedAnimations = this.animationTypes.smack;
    this.isDebugMode = document.body.classList.contains("debug-mode");

    // No hitbox for idle or after being smacked
    if (this.currentState === "idle" || smackedAnimations.includes(this.currentState)) {
      this.hideHitbox();
      return;
    }

    // Only continue for grab animations
    if (!grabAnimations.includes(this.currentState)) {
      this.hideHitbox();
      return;
    }

    const animation = this.animations[this.currentState];
    if (!animation || !animation.handCoordinates) {
      this.hideHitbox();
      return;
    }

    const isMobile = window.DeviceUtils ? window.DeviceUtils.isMobile() : false;

    // If prediction is enabled and we're not on the last frame, look ahead
    let frameToUse = this.currentFrame;
    if (predictFrame && frameToUse < animation.handCoordinates.length - 1) {
      frameToUse += 1; // Look ahead one frame to account for rendering delay
    }

    // Get the coordinates for the specified frame
    let coords = this.getCoordinatesForFrame(animation, frameToUse, isMobile);

    if (!coords) {
      this.hideHitbox();
      return;
    }

    // Position the hitbox
    this.positionHitbox(coords, isMobile);
  }

  /**
   * Scale coordinates by given factors
   * @param {Object} baseCoords - Base coordinates
   * @param {number} scaleFactor - Scale factor for all dimensions
   * @param {number} touchFactor - Additional factor for width/height
   * @returns {Object} Scaled coordinates
   */
  scaleCoordinates(baseCoords, scaleFactor, touchFactor = 1.0) {
    return {
      x: Math.round(baseCoords.x * scaleFactor),
      y: Math.round(baseCoords.y * scaleFactor),
      width: Math.round(baseCoords.width * scaleFactor * touchFactor),
      height: Math.round(baseCoords.height * scaleFactor * touchFactor),
    };
  }

  /**
   * Position the hitbox at specified coordinates
   * @param {Object} coords - Coordinates for positioning
   * @param {boolean} isMobile - True if on mobile device
   */
  positionHitbox(coords, isMobile) {
    // Position the hitbox
    this.trumpHandHitBox.style.position = "absolute";
    this.trumpHandHitBox.style.left = `${coords.x}px`;
    this.trumpHandHitBox.style.top = `${coords.y}px`;
    this.trumpHandHitBox.style.width = `${coords.width}px`;
    this.trumpHandHitBox.style.height = `${coords.height}px`;

    // Make it visible and explicitly set pointer events to all
    this.trumpHandHitBox.style.display = "block";
    this.trumpHandHitBox.style.pointerEvents = "all";
    this.trumpHandHitBox.style.cursor = "pointer"; // Add cursor pointer
    this.trumpHandHitBox.style.zIndex = "300"; // Ensure it's above visual elements
    this.isVisible = true;

    // Position the visual element directly, adjusting for the different coordinate space
    if (this.trumpHandHitBoxVisual) {
      // Get the sprite container's position relative to its parent
      const trumpContainer = document.getElementById("trump-sprite-container");
      const containerRect = trumpContainer ? trumpContainer.getBoundingClientRect() : { left: 0, top: 0 };
      const parentRect = trumpContainer && trumpContainer.parentElement ? trumpContainer.parentElement.getBoundingClientRect() : { left: 0, top: 0 };

      // Calculate the offset from sprite container to its parent
      const offsetX = containerRect.left - parentRect.left;
      const offsetY = containerRect.top - parentRect.top;

      // Apply sizing and account for the coordinate system difference
      const scaledWidth = coords.width * this.config.VISUAL_SCALE_FACTOR;
      const scaledHeight = coords.height * this.config.VISUAL_SCALE_FACTOR;
      const adjustedX = coords.x + offsetX + (coords.width - scaledWidth) / 2;
      const adjustedY = coords.y + offsetY + (coords.height - scaledHeight) / 2;

      this.trumpHandHitBoxVisual.style.position = "absolute";
      this.trumpHandHitBoxVisual.style.left = `${adjustedX}px`;
      this.trumpHandHitBoxVisual.style.top = `${adjustedY}px`;
      this.trumpHandHitBoxVisual.style.width = `${scaledWidth}px`;
      this.trumpHandHitBoxVisual.style.height = `${scaledHeight}px`;
      this.trumpHandHitBoxVisual.style.pointerEvents = "none"; // Ensure visual doesn't block clicks

      // After positioning, let the effects controller restore styling
      if (this.trumpHandHitBoxVisual) {
        // After positioning, try to restore styling with effects controller
        if (window.trumpHandEffects && this.trumpHandHitBox.classList.contains("hittable")) {
          try {
            // First try the specific method
            if (typeof window.trumpHandEffects.restoreVisualState === "function") {
              window.trumpHandEffects.restoreVisualState();
            }
            // Fall back to updateVisualStyles if restoreVisualState doesn't exist
            else if (typeof window.trumpHandEffects.updateVisualStyles === "function") {
              window.trumpHandEffects.updateVisualStyles();
            }
          } catch (e) {
            console.warn("Error restoring visual state:", e);
          }
        } else if (!this.trumpHandHitBoxVisual.classList.contains("hit") && !this.trumpHandHitBoxVisual.classList.contains("grab-success")) {
          // Only basic visibility if no effects controller
          this.trumpHandHitBoxVisual.style.display = "block";
          this.trumpHandHitBoxVisual.style.visibility = "visible";
        }
      }
    }

    // Ensure hover effects are attached
    if (!this._hoverHandlers) {
      this.setupHoverEffects();
    }

    // Check if we need to show the prompt - now using the effects controller
    const isBeforeFirstBlock =
      window.gameManager &&
      window.gameManager.gameState &&
      window.gameManager.gameState.stats &&
      window.gameManager.gameState.stats.successfulBlocks === 0;

    if (isBeforeFirstBlock && window.trumpHandEffects) {
      window.trumpHandEffects.updatePromptVisibility();
    }
  }

  /**
   * Handle successful hit - can be called to remove prompt after first successful hit
   */
  handleSuccessfulHit() {
    // If we have the effects controller, let it handle the prompt removal
    if (window.trumpHandEffects) {
      window.trumpHandEffects.handleSuccessfulHit();
    }
  }

  /**
   * Reset the hitbox state
   */
  reset() {
    // Reset any hitbox state as needed
    console.log("[HandHitboxManager] Resetting hitbox state");

    // Get a fresh reference to the hitbox element
    this.trumpHandHitBox = document.getElementById("trump-hand-hitbox");

    // Reset any flags or state
    if (this.trumpHandHitBox) {
      this.trumpHandHitBox.classList.remove("hittable", "first-block-help", "hit");
      this.trumpHandHitBox.style.visibility = "hidden";
      this.trumpHandHitBox.style.pointerEvents = "none";
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Remove event listeners
    this.removeHoverEffects();

    // Remove the prompt - now using the effects controller if available
    if (window.trumpHandEffects) {
      window.trumpHandEffects.removeClickHerePrompt();
    }

    // Hide hitbox
    this.hideHitbox();

    // Clear references
    this.trumpHandHitBox = null;
    this.trumpHandHitBoxVisual = null;
    this.elements.hitbox = null;
    this.elements.visual = null;
  }

  /**
   * Set debug mode
   * @param {boolean} enabled - Whether debug mode is enabled
   */
  setDebugMode(enabled) {
    this.isDebugMode = enabled;

    if (this.isVisible) {
      this.updatePosition(); // Update visual style
    }

    // Apply debug visuals if needed
    if (this.trumpHandHitBox) {
      if (enabled) {
        // this.trumpHandHitBox.style.border = "2px dashed red";
        // this.trumpHandHitBox.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
      } else {
        this.trumpHandHitBox.style.border = "none";
        this.trumpHandHitBox.style.backgroundColor = "transparent";
      }
    }
  }

  /**
   * Get current hitbox information
   * @returns {Object|null} Hitbox information or null if not visible
   */
  getHitboxInfo() {
    if (!this.trumpHandHitBox || !this.isVisible) {
      return null;
    }

    return {
      x: parseInt(this.trumpHandHitBox.style.left, 10),
      y: parseInt(this.trumpHandHitBox.style.top, 10),
      width: parseInt(this.trumpHandHitBox.style.width, 10),
      height: parseInt(this.trumpHandHitBox.style.height, 10),
      visible: this.isVisible,
      state: this.currentState,
      frame: this.currentFrame,
    };
  }
}

// Make available to window
window.HandHitboxManager = HandHitboxManager;

/**
 * Manages hitboxes for protestors in the game
 */
class ProtestorHitboxManager {
  /**
   * Create a new ProtestorHitboxManager
   * @param {boolean} lazyInit - Whether to use lazy initialization
   */
  constructor(lazyInit = false) {
    logger.info("protestor-hitbox", "Creating Protestor Hitbox Manager");

    // State tracking
    this.protestorHitboxes = {
      canada: { element: null, isVisible: false, scale: 1.0 },
      mexico: { element: null, isVisible: false, scale: 1.0 },
      greenland: { element: null, isVisible: false, scale: 1.0 },
    };

    this.isDebugMode = false;
    this.lazyInit = lazyInit; // Store lazy init flag

    // Reference to the map element for scaling calculations
    this.mapElement = document.getElementById("map-background");

    // Calibrated at map scale: 0.24
    // Multiple spawn locations for each country (will be scaled based on map size)
    // These are the natural coordinates relative to the original map size
    this.spawnLocations = {
      canada: [
        {
          x: 1120,
          y: 1624,
          width: 295,
          height: 295,
          calibrationScale: 0.24,
        },
        {
          x: 980,
          y: 1520,
          width: 295,
          height: 295,
          calibrationScale: 0.24,
        },
        {
          x: 1250,
          y: 1480,
          width: 295,
          height: 295,
          calibrationScale: 0.24,
        },
      ],
      mexico: [
        {
          x: 1102,
          y: 2536,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1050,
          y: 2450,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1180,
          y: 2510,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
      ],
      greenland: [
        {
          x: 2192,
          y: 577,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2080,
          y: 520,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2300,
          y: 620,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
      ],
    };

    // Store currently selected coordinates for each country
    this.currentCoordinates = {};

    // Reference to the currently associated freedom manager
    this.freedomManager = null;

    // Initialize the manager with or without lazy loading
    if (!lazyInit) {
      this.init();
    } else {
      // Just create container, don't create hitboxes yet
      this.ensureHitboxContainer();
      this.selectRandomSpawnLocations();
    }
  }

  /**
   * Initialize hitboxes
   */
  init() {
    logger.debug("protestor-hitbox", "Initializing protestor hitboxes");

    // Create container for hitboxes if it doesn't exist
    this.ensureHitboxContainer();

    // Select random spawn locations for each country
    this.selectRandomSpawnLocations();

    // Pre-create hitboxes but keep them hidden initially
    // Only if not using lazy initialization
    if (!this.lazyInit) {
      Object.keys(this.protestorHitboxes).forEach((countryId) => {
        this.createHitbox(countryId);
      });
    }

    // Check if debug mode is enabled
    this.isDebugMode = document.body.classList.contains("debug-mode");

    // Set up resize listener
    window.addEventListener("resize", () => this.repositionAllHitboxes());
  }

  /**
   * Select random spawn locations for all countries
   */
  selectRandomSpawnLocations() {
    Object.keys(this.spawnLocations).forEach((countryId) => {
      const locations = this.spawnLocations[countryId];
      if (locations && locations.length > 0) {
        // Select a random location from the array
        const randomIndex = Math.floor(Math.random() * locations.length);
        this.currentCoordinates[countryId] = locations[randomIndex];

        logger.debug("protestor-hitbox", `Selected random spawn location ${randomIndex} for ${countryId}`);
      }
    });
  }

  /**
   * Select a new random spawn location for a specific country
   * @param {string} countryId - Country identifier
   */
  selectNewRandomSpawnLocation(countryId) {
    const locations = this.spawnLocations[countryId];
    if (locations && locations.length > 0) {
      const randomIndex = Math.floor(Math.random() * locations.length);
      this.currentCoordinates[countryId] = locations[randomIndex];

      logger.debug("protestor-hitbox", `Selected new random spawn location ${randomIndex} for ${countryId}`);

      // Reposition hitbox if it's visible
      if (this.protestorHitboxes[countryId].isVisible) {
        this.positionHitbox(countryId);
      }
    }
  }

  /**
   * Ensure the hitbox container exists
   * @returns {HTMLElement} The hitbox container
   */
  ensureHitboxContainer() {
    let container = document.getElementById("protestor-hitboxes-container");

    if (!container) {
      container = document.createElement("div");
      container.id = "protestor-hitboxes-container";
      container.style.position = "absolute";
      container.style.left = "0";
      container.style.top = "0";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.pointerEvents = "none";
      container.style.zIndex = "3005"; // Should match FreedomManager.Z_INDEXES.PROTESTORS

      // Add to game container
      const gameContainer = document.getElementById("game-container");
      if (gameContainer) {
        gameContainer.appendChild(container);
        logger.debug("protestor-hitbox", "Created protestor hitboxes container");
      } else {
        logger.error("protestor-hitbox", "Game container not found, cannot create hitbox container");
      }
    }

    this.container = container;
    return container;
  }

  /**
   * Create a hitbox for a specific country
   * @param {string} countryId - Country identifier
   * @returns {HTMLElement} The created hitbox
   */
  createHitbox(countryId) {
    // Clean up any existing hitbox first
    this.removeHitbox(countryId);

    // Create new hitbox element
    const hitbox = document.createElement("div");
    hitbox.id = `${countryId}-protestor-hitbox`;
    hitbox.className = "protestor-hitbox";
    hitbox.style.position = "absolute";
    hitbox.style.pointerEvents = "all";
    hitbox.style.cursor = "pointer";
    hitbox.style.display = "none"; // Start hidden

    hitbox.setAttribute("role", "button");
    hitbox.setAttribute("aria-label", `Support ${countryId.charAt(0).toUpperCase() + countryId.slice(1)} protestors`);

    // Add debug styling if in debug mode
    if (this.isDebugMode) {
      HitboxUtils.applyDebugVisuals(hitbox, true);
    }

    // Store reference to the element
    this.protestorHitboxes[countryId].element = hitbox;
    this.protestorHitboxes[countryId].scale = 1.0; // Reset scale

    // Add to container
    if (this.container) {
      this.container.appendChild(hitbox);
      logger.debug("protestor-hitbox", `Created protestor hitbox for ${countryId}`);
    }

    return hitbox;
  }

  /**
   * Remove a specific country's hitbox
   * @param {string} countryId - Country identifier
   */
  removeHitbox(countryId) {
    const existingHitbox = this.protestorHitboxes[countryId].element;
    if (existingHitbox && existingHitbox.parentNode) {
      existingHitbox.parentNode.removeChild(existingHitbox);
      logger.debug("protestor-hitbox", `Removed existing protestor hitbox for ${countryId}`);
    }
    this.protestorHitboxes[countryId].element = null;
    this.protestorHitboxes[countryId].isVisible = false;
    this.protestorHitboxes[countryId].scale = 1.0;
  }

  /**
   * Show a hitbox for a specific country
   * @param {string} countryId - Country identifier
   * @param {Object} freedomManager - Freedom manager reference
   * @returns {HTMLElement|null} The hitbox or null if failed
   */
  showHitbox(countryId, freedomManager) {
    console.log(`[HITBOX DEBUG] Starting showHitbox for ${countryId}`);

    if (!this.protestorHitboxes[countryId]) {
      console.error(`[HITBOX ERROR] Invalid country ID: ${countryId}`);
      logger.error("protestor-hitbox", `Invalid country ID: ${countryId}`);
      return null;
    }

    // Store reference to the freedom manager for click handling
    this.freedomManager = freedomManager;

    // Create or ensure hitbox exists
    let hitbox = this.protestorHitboxes[countryId].element;
    if (!hitbox) {
      console.log(`[HITBOX DEBUG] Creating new hitbox for ${countryId}`);
      hitbox = this.createHitbox(countryId);
    }

    // Position the hitbox
    console.log(`[HITBOX DEBUG] Positioning hitbox for ${countryId}`);
    this.positionHitbox(countryId);

    // Make it visible
    hitbox.style.display = "block";
    this.protestorHitboxes[countryId].isVisible = true;

    // Add click handler that calls the freedomManager's handleProtestorClick
    console.log(`[HITBOX DEBUG] Setting click handler for ${countryId}`);
    this.setClickHandler(countryId, hitbox, freedomManager);

    console.log(`[HITBOX INFO] Successfully showed hitbox for ${countryId}`);
    logger.info("protestor-hitbox", `Showing protestor hitbox for ${countryId}`);

    return hitbox;
  }

  /**
   * Hide a specific country's hitbox
   * @param {string} countryId - Country identifier
   */
  hideHitbox(countryId) {
    const hitboxInfo = this.protestorHitboxes[countryId];
    if (hitboxInfo && hitboxInfo.element) {
      hitboxInfo.element.style.display = "none";
      hitboxInfo.isVisible = false;
      logger.debug("protestor-hitbox", `Hidden protestor hitbox for ${countryId}`);
    }
  }

  /**
   * Position a hitbox based on the current coordinates
   * @param {string} countryId - Country identifier
   */
  positionHitbox(countryId) {
    const hitbox = this.protestorHitboxes[countryId].element;
    if (!hitbox) return;

    // Get the current coordinates for this country
    const baseCoords = this.currentCoordinates[countryId];
    if (!baseCoords) {
      logger.error("protestor-hitbox", `No coordinates defined for ${countryId}`);
      return;
    }

    // Get the map element
    const mapElement = document.getElementById("map-background");
    if (!mapElement) {
      logger.error("protestor-hitbox", "Map element not found");
      return;
    }

    // Get the game container
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) {
      logger.error("protestor-hitbox", "Game container not found");
      return;
    }

    // Get container positions
    const mapRect = mapElement.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    // Calculate map offset
    const mapOffsetX = mapRect.left - containerRect.left;
    const mapOffsetY = mapRect.top - containerRect.top;

    // Calculate scale
    const currentMapScale = mapRect.width / mapElement.naturalWidth;
    const hitboxScale = this.protestorHitboxes[countryId].scale || 1.0;

    // Scale and position the hitbox
    const scaledX = baseCoords.x * currentMapScale;
    const scaledY = baseCoords.y * currentMapScale;
    const scaledWidth = baseCoords.width * currentMapScale * hitboxScale;
    const scaledHeight = baseCoords.height * currentMapScale * hitboxScale;

    // Center adjustment for growing hitbox
    const widthDiff = (scaledWidth - baseCoords.width * currentMapScale) / 2;
    const heightDiff = (scaledHeight - baseCoords.height * currentMapScale) / 2;

    // Calculate final position
    const finalX = mapOffsetX + scaledX - widthDiff;
    const finalY = mapOffsetY + scaledY - heightDiff;

    // Position the hitbox using the utility function
    HitboxUtils.positionElement(hitbox, {
      x: finalX,
      y: finalY,
      width: scaledWidth,
      height: scaledHeight,
    });

    logger.debug(
      "protestor-hitbox",
      `Positioned protestor hitbox for ${countryId} at map-relative (${scaledX}, ${scaledY}), absolute (${finalX}, ${finalY})`
    );
  }

  /**
   * Calculate scale factor for a specific country
   * @param {string} countryId - Country identifier
   * @returns {number} Scale factor
   */
  calculateScaleFactor(countryId) {
    if (!this.mapElement) {
      logger.error("protestor-hitbox", "Map element not found for scaling calculation");
      return 1.0;
    }

    // Calculate current map scale compared to natural size
    const currentMapScale = this.mapElement.clientWidth / this.mapElement.naturalWidth;

    // Use the calibration scale stored with the coordinates
    const baseCoords = this.currentCoordinates[countryId];
    const referenceScale = baseCoords.calibrationScale || 1.0;

    // Calculate the adjustment needed
    const scaleFactor = currentMapScale / referenceScale;

    // Add detailed logging
    console.log(`Protestor ${countryId} scaling:`, {
      currentMapScale,
      referenceScale,
      resultingScaleFactor: scaleFactor,
      baseX: baseCoords.x,
      baseY: baseCoords.y,
      scaledX: baseCoords.x * scaleFactor,
      scaledY: baseCoords.y * scaleFactor,
    });

    return scaleFactor;
  }

  /**
   * Set up click handler for a hitbox
   * @param {string} countryId - Country identifier
   * @param {HTMLElement} hitbox - The hitbox element
   * @param {Object} freedomManager - Freedom manager reference
   */
  setClickHandler(countryId, hitbox, freedomManager) {
    // Define the click handler
    const clickHandler = (event) => {
      event.stopPropagation();
      this.logClick("Click/Touch", event, hitbox, countryId);

      if (freedomManager && typeof freedomManager.handleProtestorClick === "function") {
        freedomManager.handleProtestorClick(countryId);
      } else {
        logger.error("protestor-hitbox", "Freedom manager or handler function not available");
      }
    };

    // Use utility to set up handlers (this handles the clone technique internally)
    const newHitbox = HitboxUtils.setupEventHandlers(hitbox, {
      click: clickHandler,
      touchstart: (event) => {
        event.preventDefault();
        event.stopPropagation();
        clickHandler(event);
      },
    });

    // Update reference to the new hitbox element
    this.protestorHitboxes[countryId].element = newHitbox;
  }

  /**
   * Log click information for debugging
   * @param {string} eventName - Name of the event
   * @param {Event} event - Event object
   * @param {HTMLElement} hitbox - Hitbox element
   * @param {string} countryId - Country identifier
   */
  logClick(eventName, event, hitbox, countryId) {
    logger.info("protestor-hitbox", `${eventName} detected on protestor hitbox for ${countryId}`);

    // Log position data for debugging
    const rect = hitbox.getBoundingClientRect();
    const x = event.clientX || (event.touches && event.touches[0].clientX) || 0;
    const y = event.clientY || (event.touches && event.touches[0].clientY) || 0;

    logger.debug("protestor-hitbox", `Click coordinates: (${x}, ${y}), Hitbox: (${rect.left}, ${rect.top}, ${rect.width}, ${rect.height})`);

    // Check if click is within the bounds
    const isInside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;

    logger.debug("protestor-hitbox", `Click inside hitbox: ${isInside}`);
  }

  /**
   * Update the size of a hitbox
   * @param {string} countryId - Country identifier
   * @param {number} scaleFactor - Scale factor to apply
   */
  updateSize(countryId, scaleFactor) {
    // Update the scale for this country
    const currentScale = this.protestorHitboxes[countryId].scale || 1.0;
    this.protestorHitboxes[countryId].scale = currentScale * scaleFactor;

    logger.debug("protestor-hitbox", `Updating scale for ${countryId} from ${currentScale} to ${this.protestorHitboxes[countryId].scale}`);

    // Reposition based on the new scale
    this.positionHitbox(countryId);
  }

  /**
   * Set debug mode
   * @param {boolean} enabled - Whether debug mode is enabled
   */
  setDebugMode(enabled) {
    this.isDebugMode = enabled;

    // Update all existing hitboxes
    Object.keys(this.protestorHitboxes).forEach((countryId) => {
      const hitbox = this.protestorHitboxes[countryId].element;
      if (!hitbox) return;

      HitboxUtils.applyDebugVisuals(hitbox, enabled);
    });

    logger.debug("protestor-hitbox", `Debug mode ${enabled ? "enabled" : "disabled"} for protestor hitboxes`);
  }

  /**
   * Reposition all visible hitboxes
   */
  repositionAllHitboxes() {
    Object.keys(this.protestorHitboxes).forEach((countryId) => {
      if (this.protestorHitboxes[countryId].isVisible) {
        this.positionHitbox(countryId);
      }
    });

    logger.debug("protestor-hitbox", "Repositioned all visible protestor hitboxes");
  }

  /**
   * Clean up all hitboxes
   */
  cleanupAll() {
    // Remove all hitbox elements
    Object.keys(this.protestorHitboxes).forEach((countryId) => {
      const hitbox = this.protestorHitboxes[countryId];
      if (hitbox && hitbox.element && hitbox.element.parentNode) {
        hitbox.element.parentNode.removeChild(hitbox.element);
      }
    });

    // Reset hitbox data
    this.protestorHitboxes = {
      canada: { element: null, isVisible: false, scale: 1.0 },
      mexico: { element: null, isVisible: false, scale: 1.0 },
      greenland: { element: null, isVisible: false, scale: 1.0 },
    };

    // Clear any click handlers
    if (this._clickHandler) {
      document.removeEventListener("click", this._clickHandler);
    }

    logger.info("protestor-hitbox", "Cleaned up all protestor hitboxes");
  }

  /**
   * Reset the manager
   */
  reset() {
    // Clean up existing hitboxes
    this.cleanupAll();

    // Reselect random spawn locations
    this.selectRandomSpawnLocations();

    // Reset state variables
    this.freedomManager = null;

    // Reinitialize core functionality if needed
    if (!this.lazyInit) {
      Object.keys(this.protestorHitboxes).forEach((countryId) => {
        this.createHitbox(countryId);
      });
    }

    logger.info("protestor-hitbox", "Reset protestor hitbox manager");
  }

  /**
   * Completely destroy the manager
   */
  destroy() {
    // Comprehensive cleanup
    this.cleanupAll();

    // Remove container if it exists
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    // Reset all tracking variables
    this.container = null;
    this.currentCoordinates = {};
    this.freedomManager = null;
  }
}

// Make available to window
window.ProtestorHitboxManager = ProtestorHitboxManager;

class FreedomManager {
  // Z-index constants for proper layering
  static Z_INDEXES = {
    BASE: 1000,
    CONFETTI: 1005,
    FIREWORKS: 1010,
    FLASH: 1015,
    TEXT: 1020,
    PROTESTORS: 1025,
  };

  /**
   * @param {Object} gameState - The game state object
   * @param {Object} elements - DOM elements
   * @param {Object} audioManager - Audio management system
   * @param {Object} [config] - Optional configuration
   */
  constructor(gameState, elements, audioManager, config = {}) {
    console.log("[DEBUG] FreedomManager constructor called");
    this.gameState = gameState;
    this.elements = elements;
    this.audioManager = audioManager;

    // Configuration with defaults
    this.config = {
      fullAnnexationTime: 10000, // 10 seconds after full annexation before resistance is possible
      resistanceChance: 0.05, // 5% check per second for fully annexed countries
      protestorShowDelay: 0.75, // Show protestors at 75% of annexation time
      effectsEnabled: {
        confetti: true,
        screenShake: true,
        fireworks: true,
      },
      ...config,
    };

    // Logger setup
    this.setupLogger();

    this.initProtestorHitboxManager();

    // Set up country data in a unified structure
    this.countries = {
      canada: {
        id: "canada",
        annexTime: 0,
        resistanceAvailable: false,
        protestorsShown: false,
        clickCounter: 0,
        disappearTimeout: null,
        animations: {},
      },
      mexico: {
        id: "mexico",
        annexTime: 0,
        resistanceAvailable: false,
        protestorsShown: false,
        clickCounter: 0,
        disappearTimeout: null,
        animations: {},
      },
      greenland: {
        id: "greenland",
        annexTime: 0,
        resistanceAvailable: false,
        protestorsShown: false,
        clickCounter: 0,
        disappearTimeout: null,
        animations: {},
      },
    };

    // Animation tracking
    this.activeAnimations = {
      confetti: [],
      fireworks: [],
      protestors: {},
    };

    // Create containers for particles
    this.createParticleContainers();

    // Store reference to other game systems
    this.animationManager = window.animationManager;
    this.smackManager = window.smackManager;

    this.logger.info("freedom", "Enhanced Freedom Manager initialized");
  }

  /**
   * Set up logger reference
   */
  setupLogger() {
    this.logger = window.logger || {
      debug: (category, message) => console.log(`[DEBUG] ${category}: ${message}`),
      info: (category, message) => console.log(`[INFO] ${category}: ${message}`),
      warn: (category, message) => console.warn(`[WARN] ${category}: ${message}`),
      error: (category, message) => console.error(`[ERROR] ${category}: ${message}`),
    };
  }

  /**
   * Create particle containers for visual effects
   */
  createParticleContainers() {
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) {
      return;
    }

    // Create one container per country
    Object.keys(this.countries).forEach((countryId) => {
      // Check if container already exists
      if (document.getElementById(`${countryId}-particles`)) {
        return;
      }

      const container = document.createElement("div");
      container.id = `${countryId}-particles`;
      container.className = "freedom-particles";
      container.style.position = "absolute";
      container.style.left = "0";
      container.style.top = "0";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.pointerEvents = "none";
      container.style.zIndex = FreedomManager.Z_INDEXES.BASE;
      container.style.overflow = "hidden";

      gameContainer.appendChild(container);
    });
  }

  update(deltaTime) {
    if (!this.gameState.isPlaying || this.gameState.isPaused) return;

    // Convert deltaTime from ms to seconds for chance calculation
    const deltaSeconds = deltaTime / 1000;

    // Process each country
    Object.keys(this.countries).forEach((countryId) => {
      const country = this.countries[countryId];
      const gameCountry = this.gameState.countries[countryId];

      if (!gameCountry) return;

      // FIXED: Only update annexation time and show protestors for FULLY annexed countries
      if (gameCountry.claims > 0) {
        // Update annexation timer
        country.annexTime += deltaTime;

        // Show protestors when at the configured delay threshold
        const protestorThreshold = this.config.fullAnnexationTime * this.config.protestorShowDelay;
        if (country.annexTime >= protestorThreshold && !country.protestorsShown) {
          this.logger.info("freedom", `[THRESHOLD] ${countryId} reached protestor show threshold at ${country.annexTime}ms`);
          this.showProtestors(countryId);
          country.protestorsShown = true;
        }

        // Check if country has been annexed long enough to enable resistance
        if (country.annexTime >= this.config.fullAnnexationTime && !country.resistanceAvailable) {
          country.resistanceAvailable = true;
          this.logger.info(
            "freedom",
            `[RESISTANCE AVAILABLE] ${countryId} now able to resist after ${(country.annexTime / 1000).toFixed(1)}s of full annexation`
          );

          // Show subtle indicator that resistance is possible
          this.showResistancePossibleIndicator(countryId);
        }

        // Check for resistance for countries that have been annexed long enough
        if (country.resistanceAvailable && !country.protestorsShown) {
          // Calculate per-frame chance based on per-second chance
          const frameResistanceChance = this.config.resistanceChance * deltaSeconds;

          // Random check if resistance should happen now
          if (Math.random() < frameResistanceChance) {
            this.logger.info("freedom", `[AUTO UPRISING] Random resistance triggered in ${countryId}!`);
            this.triggerCountryResistance(countryId);

            // Reset after successful resistance
            country.resistanceAvailable = false;
            country.annexTime = 0;
            country.protestorsShown = false;
            this.hideProtestors(countryId);
          }
        }
      } else {
        // Country not fully annexed, reset timer and hide protestors
        if (country.protestorsShown) {
          this.hideProtestors(countryId);
          country.protestorsShown = false;
        }
        country.annexTime = 0;
        country.resistanceAvailable = false;
      }
    });
  }
  /**
   * Show indicator that resistance is possible
   * @param {string} countryId - Country identifier
   */
  showResistancePossibleIndicator(countryId) {
    const countryElement = this.elements.countries[countryId];
    if (!countryElement) return;

    // Add pulsing glow effect
    countryElement.classList.add("resistance-possible");

    // Play subtle sound
    this.playSound("particles", "freedom", 0.4); // Lower volume
  }

  /**
   * Create freedom celebration for country liberation
   * @param {string} countryId - Country identifier
   */
  createFreedomCelebration(countryId) {
    // Get the flag overlay to determine position
    const flagOverlay = document.getElementById(`${countryId}-flag-overlay`);
    if (!flagOverlay) {
      this.logger.error("freedom", `Flag overlay for ${countryId} not found for freedom celebration!`);
      return;
    }
    if (this.audioManager) {
      this.audioManager.playRandom("particles", "freedom", null, 0.8);
    }
    // Get the game container
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) return;

    // Get flag position and dimensions relative to the game container
    const flagRect = flagOverlay.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    // Calculate positions
    const flagLeft = flagRect.left - containerRect.left;
    const flagTop = flagRect.top - containerRect.top;
    const flagWidth = flagRect.width;
    const flagHeight = flagRect.height;

    // Screen shake effect if enabled
    if (this.config.effectsEnabled.screenShake) {
      this.addScreenShake(gameContainer);
    }

    // Create flash effect
    this.createFlashEffect(flagLeft, flagTop, flagWidth, flagHeight, gameContainer);

    // Create "RESISTANCE!" text
    this.createResistanceText(flagLeft, flagTop, flagWidth, flagHeight, gameContainer);

    // Create confetti if enabled
    if (this.config.effectsEnabled.confetti) {
      this.createConfettiBurst(flagLeft, flagTop, flagWidth, flagHeight, gameContainer);
    }
  }

  /**
   * Add screen shake effect to container
   * @param {HTMLElement} container - Container to apply shake effect
   */
  addScreenShake(container) {
    container.classList.add("screen-shake");
    setTimeout(() => {
      container.classList.remove("screen-shake");
    }, 800);
  }

  /**
   * Create flash effect for resistance event
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {HTMLElement} container - Parent container
   */
  createFlashEffect(x, y, width, height, container) {
    const flash = document.createElement("div");
    flash.className = "freedom-flash";
    flash.style.position = "absolute";
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    flash.style.width = `${width}px`;
    flash.style.height = `${height}px`;
    flash.style.borderRadius = "10%";
    flash.style.zIndex = FreedomManager.Z_INDEXES.FLASH;
    container.appendChild(flash);

    // Remove flash after animation completes
    setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    }, 1500);
  }
  createResistanceText(x, y, width, height, container) {
    const text = document.createElement("div");
    text.className = "freedom-text";
    text.textContent = ".";
    text.style.position = "absolute";
    text.style.zIndex = FreedomManager.Z_INDEXES.TEXT;

    // MUCH larger text
    text.style.fontSize = "1rem";

    // Thicker outline
    text.style.webkitTextStroke = ".5px black";
    text.style.textStroke = ".5px black";

    // More vibrant color
    const hue = Math.floor(Math.random() * 60); // Randomize between red-yellow
    text.style.color = `hsl(${hue}, 100%, 50%)`;
    // text.style.fontFamily = "'Rock Salt', cursive, sans-serif";
    text.style.fontWeight = "900";

    // Add more dramatic text shadow
    // text.style.textShadow = "4px 4px 0 #000";

    // Calculate center position
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Position to allow for animation
    const textWidth = 300; // Generous width estimate
    text.style.width = `${textWidth}px`;
    text.style.left = `${centerX - textWidth / 2}px`;
    text.style.top = `${centerY - 30}px`;
    text.style.textAlign = "center";

    container.appendChild(text);

    // Random starting rotation for more dynamism
    const startRotation = -10 + Math.random() * 20;

    // Create unique animation ID to avoid conflicts
    const animationId = `resistance-text-${Date.now()}`;

    // Create custom keyframes for this specific instance
    const style = document.createElement("style");
    style.textContent = `
          @keyframes ${animationId} {
            0% {
              transform: scale(0.1) rotate(${startRotation - 15}deg);
              opacity: 0;
            }
            15% {
              transform: scale(1.6) rotate(${startRotation + 10}deg);
              opacity: 1;
            }
            30% {
              transform: scale(1.1) rotate(${startRotation - 8}deg);
              opacity: 1;
            }
            45% {
              transform: scale(1.4) rotate(${startRotation + 6}deg);
              opacity: 1;
            }
            65% {
              transform: scale(1.2) rotate(${startRotation - 4}deg);
              opacity: 1;
            }
            80% {
              transform: scale(1.3) rotate(${startRotation + 2}deg);
              opacity: 0.9;
            }
            100% {
              transform: scale(2.5) rotate(${startRotation}deg);
              opacity: 0;
            }
          }
        `;
    document.head.appendChild(style);

    // Apply the animation
    text.style.animation = `${animationId} 2.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards`;

    // Remove text and style after animation
    setTimeout(() => {
      if (text.parentNode) {
        text.parentNode.removeChild(text);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 2500);
  }

  createConfettiBurst(left, top, width, height, gameContainer) {
    const confettiCount = 20; // Fewer, more impactful pieces

    const points = [
      { x: left + width * 0.2, y: top + height * 0.3 },
      { x: left + width * 0.5, y: top + height * 0.5 },
      { x: left + width * 0.8, y: top + height * 0.4 },
    ];

    for (let i = 0; i < confettiCount; i++) {
      setTimeout(() => {
        const point = points[Math.floor(Math.random() * points.length)];

        const startX = point.x + (Math.random() * 50 - 25);
        const startY = point.y + (Math.random() * 50 - 25);

        this.createConfettiPiece(startX, startY, gameContainer, i % 2 === 0);
      }, i * 15);
    }
  }

  createFireworkBurst(left, top, width, height, gameContainer) {
    const burstLocations = [
      { x: left + width * 0.3, y: top + height * 0.3, delay: 0 },
      { x: left + width * 0.7, y: top + height * 0.4, delay: 300 },
      { x: left + width * 0.5, y: top + height * 0.2, delay: 600 },
    ];

    burstLocations.forEach((burst) => {
      setTimeout(() => {
        const particleCount = 15 + Math.floor(Math.random() * 10);
        for (let i = 0; i < particleCount; i++) {
          setTimeout(() => {
            this.createFireworkParticle(burst.x, burst.y, gameContainer);
          }, i * 15);
        }
      }, burst.delay);
    });
  }


  createFireworkEffect(centerX, centerY, container) {
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      // Stagger creation slightly
      setTimeout(() => {
        this.createFireworkParticle(centerX, centerY, container);
      }, i * 10);
    }
  }

  createConfettiPiece(startX, startY, container, isLarger = false) {
    if (!container) return;

    // Create confetti element
    const confetti = document.createElement("div");
    confetti.className = "freedom-confetti";

    // Performance optimization: use CSS properties that are cheap to animate
    confetti.style.willChange = "transform, opacity";

    // Random confetti properties for more variety
    const shapes = ["circle", "square", "rectangle", "triangle"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    confetti.classList.add(`confetti-${shape}`);

    // Size - occasionally make some pieces larger for variety
    const size = isLarger ? 8 + Math.random() * 8 : 4 + Math.random() * 6;
    confetti.style.width = `${size}px`;
    confetti.style.height = shape === "rectangle" ? `${size * 2}px` : `${size}px`;

    // Random vibrant color with high saturation
    const hue = Math.floor(Math.random() * 360);
    const lightness = 50 + Math.random() * 30; // Brighter colors
    confetti.style.backgroundColor = `hsl(${hue}, 100%, ${lightness}%)`;

    // Add black border for cartoon look
    confetti.style.border = "1px solid black";

    // Set the initial position
    confetti.style.position = "absolute";
    confetti.style.left = `${startX}px`;
    confetti.style.top = `${startY}px`;
    confetti.style.zIndex = FreedomManager.Z_INDEXES.CONFETTI;

    // Add to container
    container.appendChild(confetti);

    // Store confetti reference for potential cleanup
    const confettiRef = {
      element: confetti,
      startTime: performance.now(),
      animationCompleted: false,
    };
    this.activeAnimations.confetti.push(confettiRef);

    // Animation parameters
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 120;
    const destinationX = startX + Math.cos(angle) * distance;
    const destinationY = startY + Math.sin(angle) * distance;
    const duration = 1200 + Math.random() * 1500;

    // Control points for bezier curve
    const cp1x = startX + (destinationX - startX) * 0.3 + (Math.random() * 30 - 15);
    const cp1y = startY + (destinationY - startY) * 0.3 - Math.random() * 20;
    const cp2x = startX + (destinationX - startX) * 0.6 + (Math.random() * 30 - 15);
    const cp2y = destinationY - Math.random() * 50;

    // Initial rotation
    const rotation = Math.random() * 360;
    confetti.style.transform = `rotate(${rotation}deg)`;

    // Use simpler animation path on mobile
    const simplifiedPath = window.DeviceUtils ? window.DeviceUtils.isMobile() : false;

    const animateConfetti = (timestamp) => {
      if (confettiRef.animationCompleted) return;

      const elapsed = timestamp - confettiRef.startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        let currentX, currentY;

        if (simplifiedPath) {
          // Linear path for mobile (more efficient)
          currentX = startX + (destinationX - startX) * progress;
          currentY = startY + (destinationY - startY) * progress;
        } else {
          // Cubic bezier calculations for smooth movement on desktop
          const t = progress;
          const t_ = 1 - t;

          currentX = Math.pow(t_, 3) * startX + 3 * Math.pow(t_, 2) * t * cp1x + 3 * t_ * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * destinationX;
          currentY = Math.pow(t_, 3) * startY + 3 * Math.pow(t_, 2) * t * cp1y + 3 * t_ * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * destinationY;
        }

        // Update position
        confetti.style.left = `${currentX}px`;
        confetti.style.top = `${currentY}px`;

        // Simplified rotation on mobile
        if (simplifiedPath) {
          const spin = rotation + progress * 360 * (Math.random() > 0.5 ? 1 : -1);
          confetti.style.transform = `rotate(${spin}deg)`;
        } else {
          // Add spin animation
          const spin = rotation + progress * progress * 720 * (Math.random() > 0.5 ? 1 : -1);
          confetti.style.transform = `rotate(${spin}deg)`;

          // Instead of fading out, shrink at the end
          if (progress > 0.7) {
            const scale = 1 - ((progress - 0.7) / 0.3) * 0.7; // Don't scale all the way to 0
            confetti.style.transform = `rotate(${spin}deg) scale(${scale})`;
          }
        }

        // Optimize animation frame rate on mobile
        if (simplifiedPath && progress % 0.1 !== 0) {
          // Skip some frames on mobile
          setTimeout(() => requestAnimationFrame(animateConfetti), 16);
        } else {
          requestAnimationFrame(animateConfetti);
        }
      } else {
        // Animation complete, clean up
        confettiRef.animationCompleted = true;

        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }

        // Remove from active animations
        const index = this.activeAnimations.confetti.indexOf(confettiRef);
        if (index !== -1) {
          this.activeAnimations.confetti.splice(index, 1);
        }
      }
    };

    requestAnimationFrame(animateConfetti);
  }

  createFireworkParticle(centerX, centerY, container) {
    if (!container) return;

    const particle = document.createElement("div");
    particle.className = "freedom-firework";

    // Focus on streamers and simple shapes
    const particleTypes = ["spark", "circle", "spark"]; // More sparks
    const particleType = particleTypes[Math.floor(Math.random() * particleTypes.length)];

    // Vibrant colors
    const hue = Math.floor(Math.random() * 360);

    // Particle styling
    if (particleType === "circle") {
      particle.style.backgroundColor = `hsl(${hue}, 100%, 60%)`;
      particle.style.borderRadius = "50%";
    } else if (particleType === "spark") {
      // Elongated spark - streamer-like
      const sparkAngle = Math.random() * 360;
      particle.style.backgroundColor = `hsl(${hue}, 100%, 65%)`;
      particle.style.borderRadius = "40% 40% 5% 5%";
      particle.style.transform = `rotate(${sparkAngle}deg)`;
    }

    // Always add black border
    particle.style.border = "2px solid black";

    // Larger size
    const size = particleType === "spark" ? 6 + Math.random() * 12 : 10 + Math.random() * 15;

    particle.style.width = `${size}px`;
    if (particleType === "spark") {
      // Sparks are elongated like streamers
      particle.style.height = `${size * (3 + Math.random())}px`;
    } else {
      particle.style.height = `${size}px`;
    }

    // Initial position
    particle.style.position = "absolute";
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.zIndex = FreedomManager.Z_INDEXES.FIREWORKS;

    // Add to container
    container.appendChild(particle);

    // Store reference for potential cleanup
    const fireworkRef = {
      element: particle,
      startTime: performance.now(),
      animationCompleted: false,
    };
    this.activeAnimations.fireworks.push(fireworkRef);

    // MUCH wider spread
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 180; // Wider distribution
    const destinationX = centerX + Math.cos(angle) * distance;
    const destinationY = centerY + Math.sin(angle) * distance;

    // Longer duration for slower movement
    const duration = 1500 + Math.random() * 1000;

    // Use gentle arc paths for more natural movement
    const useArc = true;

    const animateParticle = (timestamp) => {
      if (fireworkRef.animationCompleted) return;

      const elapsed = timestamp - fireworkRef.startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        let currentX, currentY;

        if (useArc) {
          // Arc path with gentle gravity
          const easedProgress = progress;
          currentX = centerX + (destinationX - centerX) * easedProgress;

          // Arc effect - gentler, wider arc
          const verticalOffset = Math.sin(progress * Math.PI) * 60; // Higher arc
          const gravity = Math.pow(progress, 2) * 40; // Very gentle gravity
          currentY = centerY + (destinationY - centerY) * easedProgress - verticalOffset + gravity;
        } else {
          // Straight path (not really used now)
          const easedProgress = Math.pow(progress, 0.8);
          currentX = centerX + (destinationX - centerX) * easedProgress;
          currentY = centerY + (destinationY - centerY) * easedProgress;
        }

        // Update position
        particle.style.left = `${currentX}px`;
        particle.style.top = `${currentY}px`;

        // Very minimal rotation - mostly just follow the arc path
        if (particleType === "spark") {
          // Calculate angle based on movement direction
          const dx = currentX - parseFloat(particle.style.left || centerX);
          const dy = currentY - parseFloat(particle.style.top || centerY);
          let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

          // Add very slight wobble
          angle += Math.sin(progress * Math.PI * 2) * 5;

          particle.style.transform = `rotate(${angle}deg)`;
        } else {
          // Almost no rotation for circles
          const rotation = progress * 30 * (Math.random() > 0.5 ? 1 : -1);
          particle.style.transform = `rotate(${rotation}deg)`;
        }

        // Simple exit - just fade
        if (progress > 0.8) {
          const exitScale = 1 - (progress - 0.8) / 0.2;
          particle.style.opacity = exitScale.toString();
        }

        requestAnimationFrame(animateParticle);
      } else {
        // Animation complete, clean up
        fireworkRef.animationCompleted = true;

        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }

        // Remove from active animations
        const index = this.activeAnimations.fireworks.indexOf(fireworkRef);
        if (index !== -1) {
          this.activeAnimations.fireworks.splice(index, 1);
        }
      }
    };

    requestAnimationFrame(animateParticle);
  }

  // Function to create the celebration with fewer particles
  createFreedomCelebration(countryId) {
    // Get the flag overlay to determine position
    const flagOverlay = document.getElementById(`${countryId}-flag-overlay`);
    if (!flagOverlay) {
      this.logger.error("freedom", `Flag overlay for ${countryId} not found for freedom celebration!`);
      return;
    }

    // Get the game container
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) return;

    // Get flag position and dimensions relative to the game container
    const flagRect = flagOverlay.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    // Calculate positions
    const flagLeft = flagRect.left - containerRect.left;
    const flagTop = flagRect.top - containerRect.top;
    const flagWidth = flagRect.width;
    const flagHeight = flagRect.height;

    // Screen shake effect if enabled
    if (this.config.effectsEnabled.screenShake) {
      this.addScreenShake(gameContainer);
    }

    // Create flash effect
    this.createFlashEffect(flagLeft, flagTop, flagWidth, flagHeight, gameContainer);

    // Create "RESISTANCE!" text
    this.createResistanceText(flagLeft, flagTop, flagWidth, flagHeight, gameContainer);

    // Create confetti if enabled - FEWER BUT BIGGER CONFETTI
    if (this.config.effectsEnabled.confetti) {
      // Reduce confetti count significantly
      const confettiCount = 60; // Fewer, more impactful pieces

      // Create confetti from multiple points with WIDER spread
      const points = [
        { x: flagLeft + flagWidth * 0.2, y: flagTop + flagHeight * 0.3 },
        { x: flagLeft + flagWidth * 0.5, y: flagTop + flagHeight * 0.5 },
        { x: flagLeft + flagWidth * 0.8, y: flagTop + flagHeight * 0.4 },
      ];

      // Distribute confetti across the points with longer delay
      for (let i = 0; i < confettiCount; i++) {
        // Stagger creation for better visual effect
        setTimeout(() => {
          // Choose a random point from our defined points
          const point = points[Math.floor(Math.random() * points.length)];

          // Add more random variation around the point for wider spread
          const startX = point.x + (Math.random() * 50 - 25);
          const startY = point.y + (Math.random() * 50 - 25);

          this.createConfettiPiece(startX, startY, gameContainer, i % 2 === 0); // More large pieces
        }, i * 15); // Slightly slower creation rate
      }
    }

    // Add firework bursts - FEWER BUT MORE SPREAD OUT
    if (this.config.effectsEnabled.fireworks) {
      // Just a few strategic burst locations with wide spread
      const burstLocations = [
        { x: flagLeft + flagWidth * 0.3, y: flagTop + flagHeight * 0.3, delay: 0 },
        { x: flagLeft + flagWidth * 0.7, y: flagTop + flagHeight * 0.4, delay: 300 },
        { x: flagLeft + flagWidth * 0.5, y: flagTop + flagHeight * 0.2, delay: 600 },
      ];

      burstLocations.forEach((burst) => {
        setTimeout(() => {
          // Fewer particles per burst, but each one more impactful
          const particleCount = 15 + Math.floor(Math.random() * 10);
          for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
              this.createFireworkParticle(burst.x, burst.y, gameContainer);
            }, i * 15); // Slower creation for less overwhelming
          }
        }, burst.delay);
      });
    }
  }

  createFreedomCelebrationAtHitbox(countryId, element) {
    // Get the game container
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) {
      this.logger.error("freedom", "Game container not found for celebration");
      return;
    }
  
    // Get container rect for position calculations
    const containerRect = gameContainer.getBoundingClientRect();
    
    // Try to get position from the element directly (protestor wrapper or hitbox)
    let left, top, width, height;
    
    if (element) {
      // Get element's position relative to the game container
      const elementRect = element.getBoundingClientRect();
      left = elementRect.left - containerRect.left;
      top = elementRect.top - containerRect.top;
      width = elementRect.width;
      height = elementRect.height;
      
      this.logger.debug("freedom", `Celebration coordinates from element for ${countryId}`, { left, top, width, height });
    } else {
      // Fallback: Try to get the protestor wrapper
      const protestorsWrapper = document.getElementById(`${countryId}-protestors-wrapper`);
      
      if (protestorsWrapper) {
        const wrapperRect = protestorsWrapper.getBoundingClientRect();
        left = wrapperRect.left - containerRect.left;
        top = wrapperRect.top - containerRect.top;
        width = wrapperRect.width;
        height = wrapperRect.height;
        
        this.logger.debug("freedom", `Celebration coordinates from wrapper for ${countryId}`, { left, top, width, height });
      } else {
        // Final fallback: Try to get hitbox position from the hitbox manager
        if (this.protestorHitboxManager && this.protestorHitboxManager.protestorHitboxes[countryId]) {
          const hitbox = this.protestorHitboxManager.protestorHitboxes[countryId].element;
          
          if (hitbox) {
            const hitboxRect = hitbox.getBoundingClientRect();
            left = hitboxRect.left - containerRect.left;
            top = hitboxRect.top - containerRect.top;
            width = hitboxRect.width;
            height = hitboxRect.height;
            
            this.logger.debug("freedom", `Celebration coordinates from hitbox for ${countryId}`, { left, top, width, height });
          } else {
            // Use hardcoded coordinates as absolute last resort
            const coordinatesMap = {
              canada: { left: 117, top: 328, width: 35, height: 35 },
              mexico: { left: 126, top: 440, width: 35, height: 35 },
              greenland: { left: 249, top: 208, width: 35, height: 35 },
            };
            
            const coords = coordinatesMap[countryId];
            if (coords) {
              ({ left, top, width, height } = coords);
              this.logger.debug("freedom", `Celebration coordinates from fallback for ${countryId}`, { left, top, width, height });
            } else {
              this.logger.error("freedom", `No coordinates found for ${countryId}`);
              return;
            }
          }
        }
      }
    }
  
    if (this.audioManager) {
      this.audioManager.playRandom("particles", "freedom", null, 0.8);
    }
  
    // Screen shake effect if enabled
    if (this.config.effectsEnabled.screenShake) {
      this.addScreenShake(gameContainer);
    }
  
    // Create flash effect
    this.createFlashEffect(left, top, width, height, gameContainer);
  
    // Create "RESISTANCE!" text
    this.createResistanceText(left, top, width, height, gameContainer);
  
    // Create confetti if enabled
    if (this.config.effectsEnabled.confetti) {
      this.createConfettiBurst(left, top, width, height, gameContainer);
    }
  
    // Add firework bursts
    if (this.config.effectsEnabled.fireworks) {
      this.createFireworkBurst(left, top, width, height, gameContainer);
    }
  }

  /**
   * Play resistance animation for a country
   * @param {string} countryId - Country identifier
   */
  playResistanceAnimation(countryId) {
    if (!this.smackManager) return;

    let smackAnimation = "";

    // Map country to correct animation
    if (countryId === "canada") {
      smackAnimation = Math.random() < 0.5 ? "smackEastCanada" : "smackWestCanada";
    } else if (countryId === "mexico") {
      smackAnimation = "smackMexico";
    } else if (countryId === "greenland") {
      smackAnimation = "smackGreenland";
    }

    if (smackAnimation) {
      this.logger.info("freedom", `Playing smack animation ${smackAnimation} for resistance effect`);
      this.smackManager.playSmackAnimation(smackAnimation, () => {
        this.logger.debug("freedom", "Resistance animation completed");
      });
    }
  }

  /**
   * Update flag opacity based on claims
   * @param {string} countryId - Country identifier
   */
  updateFlagOpacity(countryId) {
    const flagOverlay = document.getElementById(`${countryId}-flag-overlay`);
    if (!flagOverlay) {
      this.logger.error("freedom", `Flag overlay for ${countryId} not found!`);
      return;
    }

    const gameCountry = this.gameState.countries[countryId];
    if (!gameCountry) {
      this.logger.error("freedom", `Country ${countryId} not found in game state!`);
      return;
    }

    const claims = gameCountry.claims;

    this.logger.info("freedom", `Updating flag opacity for ${countryId} to claims level ${claims}`);

    // Remove previous opacity classes
    flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");

    // Add appropriate class based on claims
    if (claims === 0) {
      flagOverlay.style.opacity = "0"; // Use string "0" instead of number 0
    } else if (claims === 1) {
      flagOverlay.classList.add("opacity-33");
      flagOverlay.style.opacity = ""; // Clear direct opacity styling
    } else if (claims === 2) {
      flagOverlay.classList.add("opacity-66");
      flagOverlay.style.opacity = ""; // Clear direct opacity styling
    } else if (claims === 3) {
      flagOverlay.classList.add("opacity-100");
      flagOverlay.style.opacity = ""; // Clear direct opacity styling
    }
  }

// In FreedomManager.reset()
reset() {
  console.log("[DEBUG] FreedomManager.reset() called");

  // Stop ALL animations first
  this.cleanupAllEffects();

  // Reset ALL protestors completely
  this.cleanupAllProtestors();

  // Clear any intervals or timeouts
  if (this.activeAnimations.extraProtestors) {
    Object.keys(this.activeAnimations.extraProtestors).forEach((key) => {
      clearInterval(this.activeAnimations.extraProtestors[key]);
    });
    this.activeAnimations.extraProtestors = {};
  }

  // Reset visual effects for country flags
  Object.keys(this.countries).forEach((countryId) => {
    // Reset country state
    this.countries[countryId].annexTime = 0;
    this.countries[countryId].resistanceAvailable = false;
    this.countries[countryId].protestorsShown = false;
    this.countries[countryId].clickCounter = 0;

    // Reset visual state of country overlay
    const flagOverlay = document.getElementById(`${countryId}-flag-overlay`);
    if (flagOverlay) {
      flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100", "resistance-possible", "targeting-pulse");
      // Reset any direct style properties
      flagOverlay.style.opacity = "";
    }
  });
}
  /**
   * Clean up all effects and animations
   */
  cleanupAllEffects() {
    // Clean up all protestors
    this.cleanupAllProtestors();

    // Clean up confetti
    this.activeAnimations.confetti.forEach((confetti) => {
      if (confetti.element && confetti.element.parentNode) {
        confetti.element.parentNode.removeChild(confetti.element);
      }
      confetti.animationCompleted = true;
    });
    this.activeAnimations.confetti = [];

    // Clean up fireworks
    this.activeAnimations.fireworks.forEach((firework) => {
      if (firework.element && firework.element.parentNode) {
        firework.element.parentNode.removeChild(firework.element);
      }
      firework.animationCompleted = true;
    });
    this.activeAnimations.fireworks = [];

    // Remove any resistance indicators
    document.querySelectorAll(".resistance-possible").forEach((el) => {
      el.classList.remove("resistance-possible");
    });

    // Remove all freedom-related elements directly
    const freedomElements = document.querySelectorAll(".freedom-flash, .freedom-text, .freedom-confetti, .freedom-firework");
    freedomElements.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }

  /**
   * Improved sound playing in FreedomManager
   */
  playSound(type, id, volume) {
    if (!this.audioManager) {
      this.logger.warn("freedom", `Cannot play sound ${type}/${id}: AudioManager not available`);
      return Promise.resolve();
    }

    try {
      // First try playRandom if available
      if (typeof this.audioManager.playRandom === "function") {
        return Promise.resolve(this.audioManager.playRandom(type, id, null, volume));
      }

      // Fall back to regular play if needed
      if (typeof this.audioManager.play === "function") {
        return this.audioManager.play(type, id, volume);
      }

      // Last resort - direct play if available
      if (typeof this.audioManager.playDirect === "function") {
        // Try to resolve a path
        let soundPath = null;
        if (type === "resistance" && id && this.audioManager.soundFiles?.resistance?.[id]?.[0]) {
          soundPath = this.audioManager.soundFiles.resistance[id][0];
        }

        if (soundPath) {
          return Promise.resolve(this.audioManager.playDirect(soundPath, volume));
        }
      }

      this.logger.warn("freedom", `No suitable method to play ${type}/${id}`);
      return Promise.resolve(null);
    } catch (error) {
      this.logger.warn("freedom", `Error attempting to play sound ${type}/${id}: ${error.message}`);
      return Promise.resolve(null);
    }
  }
  // Also update playProtestSound method
  playProtestSound(countryId, volume = 0.5) {
    if (!this.audioManager) return;

    try {
      // Determine which country sound to use
      let soundCountry = countryId;
      if (countryId === "canada") {
        // Randomly choose east or west Canada
        soundCountry = Math.random() < 0.5 ? "eastCanada" : "westCanada";
      }

      // Call correct method
      if (typeof this.audioManager.playProtestorSound === "function") {
        this.audioManager.playProtestorSound(soundCountry, 0, volume);
      } else {
        this.audioManager.playRandom("defense", "protest", soundCountry, volume);
      }
    } catch (error) {
      this.logger.warn("freedom", `Error playing protest sound: ${error.message}`);
    }
  }

  /**
   * Debug method to set country claims
   * @param {string} countryId - Country identifier
   * @param {number} claimLevel - Number of claims to set
   * @returns {boolean} - Success status
   */
  setCountryClaims(countryId, claimLevel) {
    const gameCountry = this.gameState.countries[countryId];
    if (!gameCountry) {
      this.logger.error("freedom", `Country ${countryId} not found in gameState`);
      return false;
    }

    // Set the claim level (between 0 and maxClaims)
    const maxClaims = gameCountry.maxClaims;
    const newClaims = Math.max(0, Math.min(claimLevel, maxClaims));

    gameCountry.claims = newClaims;
    this.updateFlagOpacity(countryId);

    return true;
  }

  initProtestorHitboxManager() {
    // Only initialize when needed
    if (!this.protestorHitboxManager) {
      console.log("[FREEDOM DEBUG] Initializing protestor hitbox manager connection");

      // Create the protestor hitbox manager if it doesn't exist
      if (!window.protestorHitboxManager) {
        console.log("[FREEDOM DEBUG] Creating new ProtestorHitboxManager");
        window.protestorHitboxManager = new ProtestorHitboxManager(true); // Pass flag for lazy initialization
        this.logger.info("freedom", "Created new Protestor Hitbox Manager");
      } else {
        console.log("[FREEDOM DEBUG] Using existing ProtestorHitboxManager");
      }

      this.protestorHitboxManager = window.protestorHitboxManager;
      this.logger.info("freedom", "Protestor Hitbox Manager initialized");
    }
  }



  shrinkAndHideProtestors(countryId) {
    const protestorWrapper = document.getElementById(`${countryId}-protestors-wrapper`);
    if (!protestorWrapper) return;

    this.logger.info("freedom", `Protestors timed out in ${countryId}, disappearing`);

    // Clear any existing transitions/animations first
    protestorWrapper.style.animation = "none";
    protestorWrapper.style.transition = "none";
    void protestorWrapper.offsetWidth; // Force reflow

    // Get original position
    const originalPosition = {
      left: protestorWrapper.style.left,
      top: protestorWrapper.style.top,
      width: protestorWrapper.style.width,
      height: protestorWrapper.style.height,
    };

    // Set transform-origin to bottom center for shrinking back into ground
    protestorWrapper.style.transformOrigin = "bottom center";

    // Set up transitions for smooth disappearance
    protestorWrapper.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";
    protestorWrapper.style.opacity = "0";

    // Scale vertically more than horizontally to simulate sinking into ground
    protestorWrapper.style.transform = "scale(1, 0.2) translateY(10px)";

    // Ensure correct positioning is maintained
    protestorWrapper.style.position = "absolute";
    protestorWrapper.style.left = originalPosition.left;
    protestorWrapper.style.top = originalPosition.top;
    protestorWrapper.style.width = originalPosition.width;
    protestorWrapper.style.height = originalPosition.height;

    // Hide after animation completes
    setTimeout(() => {
      this.hideProtestors(countryId);

      // Reset click counter
      if (this.countries[countryId]) {
        this.countries[countryId].clickCounter = 0;
      }
    }, 500);
  }

  // Keep this implementation and remove the duplicate
  showProtestors(countryId) {
    this.hideProtestors(countryId);
    this.protestorHitboxManager.selectNewRandomSpawnLocation(countryId);

    this.logger.info("freedom", `Showing protestors for ${countryId}`);

    // Get the hitbox
    const hitbox = this.protestorHitboxManager.showHitbox(countryId, this);
    if (!hitbox) {
      console.error(`[FREEDOM ERROR] Failed to create protestor hitbox for ${countryId}`);
      this.logger.error("freedom", `Failed to create protestor hitbox for ${countryId}`);
      return null;
    }

    // Get hitbox position and size directly from the style
    const left = parseInt(hitbox.style.left) || 0;
    const top = parseInt(hitbox.style.top) || 0;
    const width = parseInt(hitbox.style.width) || 100;
    const height = parseInt(hitbox.style.height) || 100;

    // Create a container for the protestor sprite
    const gameContainer = document.getElementById("game-container");

    // Clean up any existing elements first
    const existingElement = document.getElementById(`${countryId}-protestors-wrapper`);
    if (existingElement && existingElement.parentNode) {
      existingElement.parentNode.removeChild(existingElement);
    }

    // Create wrapper element
    const wrapper = document.createElement("div");
    wrapper.id = `${countryId}-protestors-wrapper`;
    wrapper.style.position = "absolute";
    wrapper.style.left = `${left}px`;
    wrapper.style.top = `${top}px`;
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.pointerEvents = "none"; // Hitbox handles clicks
    wrapper.style.zIndex = "10210"; // Just above the hitbox container
    wrapper.style.transformOrigin = "bottom center"; // Key addition: set grow from bottom

    // Create the protestors sprite element
    const protestors = document.createElement("div");
    protestors.id = `${countryId}-protestors`;
    protestors.style.width = "100%";
    protestors.style.height = "100%";
    protestors.style.backgroundImage = "url('images/protest.png')";
    protestors.style.backgroundSize = "400% 100%"; // For 4-frame sprite sheet
    protestors.style.backgroundPosition = "0% 0%";
    protestors.style.backgroundRepeat = "no-repeat";
    protestors.style.opacity = "0"; // Start invisible for fade-in
    protestors.style.transition = "opacity 0.3s ease-out"; // Smooth fade-in

    // Add protestors to wrapper
    wrapper.appendChild(protestors);

    // Add wrapper to game container
    gameContainer.appendChild(wrapper);

    // Store wrapper reference
    this.countries[countryId].protestorWrapper = wrapper;

    // Initialize click counter
    this.countries[countryId].clickCounter = 0;
    this.countries[countryId].currentScale = 1.0; // For scaling when clicked

    // Add transition end listener to track completion
    const handleTransitionEnd = () => {
      wrapper.removeEventListener("transitionend", handleTransitionEnd);
      this.logger.debug("freedom", `Protestor animation for ${countryId} completed`);
    };
    wrapper.addEventListener("transitionend", handleTransitionEnd);

    // Track sprite transition separately
    protestors.addEventListener(
      "transitionend",
      () => {
        this.logger.debug("freedom", `Protestor sprite for ${countryId} visible`);
      },
      { once: true }
    );

    // Animation for sprite sheet
    let currentFrame = 0;

    const animationInterval = setInterval(() => {
      const protestorElement = document.getElementById(`${countryId}-protestors`);
      if (!protestorElement) {
        clearInterval(animationInterval);
        this.logger.debug("freedom", `Animation cleared for ${countryId} - element not found`);
        return;
      }

      // For 4-frame sprite sheet - cycle through frames
      currentFrame = (currentFrame + 1) % 4;
      const percentPosition = (currentFrame / 3) * 100;
      protestorElement.style.backgroundPosition = `${percentPosition}% 0%`;
    }, 300);

    // Store the interval for cleanup
    this.activeAnimations.protestors[countryId] = animationInterval;

    // Add grow-from-ground animation
    wrapper.style.transform = "scale(1, 0.2) translateY(10px)"; // Start small from ground

    // Fade in protestors after a short delay
    setTimeout(() => {
      // Now grow up with transition
      wrapper.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out";
      wrapper.style.transform = "scale(1, 1)"; // Grow to full size
      protestors.style.opacity = "1"; // Fade in the sprite

      // Play protest sound on appearance
      this.playProtestSound(countryId, 0.15); // Start with very low volume
    }, 100);

    // Set timeout for protestors to disappear if not clicked
    this.countries[countryId].disappearTimeout = setTimeout(() => {
      this.shrinkAndHideProtestors(countryId);
    }, 7000); // 7 seconds timeout

    this.logger.debug("freedom", `Created protestors for ${countryId} at (${left}, ${top})`);

    return wrapper;
  }


  stopProtestorSounds(countryId = null) {
    if (!this.audioManager) return;

    if (typeof this.audioManager.stopProtestorSounds === "function") {
      if (countryId === "canada") {
        this.audioManager.stopProtestorSounds("eastCanada");
        this.audioManager.stopProtestorSounds("westCanada");
      } else if (countryId) {
        this.audioManager.stopProtestorSounds(countryId);
      } else {
        // Stop all protestor sounds if no specific country is provided
        this.audioManager.stopProtestorSounds();
      }
    }
  }

  triggerCountryResistance(countryId) {
    this.logger.info("freedom", `MAJOR RESISTANCE in ${countryId}!`);
    
    // Stop any ongoing protestor sounds first
    this.stopProtestorSounds(countryId);
    
    // Remove pulsing effect if it exists
    const countryElement = this.elements.countries[countryId];
    if (countryElement) {
      countryElement.classList.remove("resistance-possible");
    }
    
    // Reset claims to 0 (completely liberate the country)
    if (this.gameState.countries[countryId]) {
      this.gameState.countries[countryId].claims = 0;
    }
    
    // Update the flag overlay to be completely transparent
    const flagOverlay = document.getElementById(`${countryId}-flag-overlay`);
    if (flagOverlay) {
      this.logger.info("freedom", `Resetting flag opacity for ${countryId} to zero`);
      flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");
      flagOverlay.style.opacity = "0";
    }
    
    // IMPORTANT: Get references to elements BEFORE cleaning them up
    const protestorWrapper = document.getElementById(`${countryId}-protestors-wrapper`);
    const hitbox = this.protestorHitboxManager ? 
      this.protestorHitboxManager.protestorHitboxes[countryId].element : null;
    
    // Store position data before removing elements
    let elementForCelebration = null;
    let positionData = null;
    
    if (protestorWrapper) {
      const gameContainer = document.getElementById("game-container");
      const containerRect = gameContainer ? gameContainer.getBoundingClientRect() : null;
      
      if (containerRect) {
        const wrapperRect = protestorWrapper.getBoundingClientRect();
        positionData = {
          left: wrapperRect.left - containerRect.left,
          top: wrapperRect.top - containerRect.top,
          width: wrapperRect.width,
          height: wrapperRect.height
        };
        
        this.logger.debug("freedom", `Stored position data for ${countryId}`, positionData);
      }
    }
    
    // NOW clean up protestors after capturing position information
    this.cleanupAllProtestorsForCountry(countryId);
    
    // Create celebration effects using the stored position data
    if (positionData) {
      this.createFreedomCelebrationWithPosition(countryId, positionData);
    } else if (hitbox) {
      this.createFreedomCelebrationAtHitbox(countryId, hitbox);
    } else {
      // Fallback to old method if no elements found
      this.createFreedomCelebration(countryId);
    }
    
    // Play resistance sound
    this.playSound("resistance", countryId, 0.7);
    
    // Trigger animation via smack manager
    this.playResistanceAnimation(countryId);
    
    return true;
  }
  
  // New method to create celebration using stored position data
  createFreedomCelebrationWithPosition(countryId, positionData) {
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) {
      this.logger.error("freedom", "Game container not found for celebration");
      return;
    }
    
    const { left, top, width, height } = positionData;
    
    if (this.audioManager) {
      this.audioManager.playRandom("particles", "freedom", null, 0.8);
    }
    
    // Screen shake effect if enabled
    if (this.config.effectsEnabled.screenShake) {
      this.addScreenShake(gameContainer);
    }
    
    // Create flash effect
    this.createFlashEffect(left, top, width, height, gameContainer);
    
    // Create "RESISTANCE!" text
    this.createResistanceText(left, top, width, height, gameContainer);
    
    // Create confetti if enabled
    if (this.config.effectsEnabled.confetti) {
      this.createConfettiBurst(left, top, width, height, gameContainer);
    }
    
    // Add firework bursts
    if (this.config.effectsEnabled.fireworks) {
      this.createFireworkBurst(left, top, width, height, gameContainer);
    }
  }

 

  createAdditionalProtestors(countryId, clickCount) {
    const wrapper = document.getElementById(`${countryId}-protestors-wrapper`);
    if (!wrapper) return;
  
    // Remove any previous additional protestors
    document.querySelectorAll(`.${countryId}-additional-protestor`).forEach((el) => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  
    // Only add additional protestors after first click
    if (clickCount < 1) return;
  
    // Get the base protestor dimensions and position
    const baseRect = wrapper.getBoundingClientRect();
    const gameContainer = document.getElementById("game-container");
    const containerRect = gameContainer.getBoundingClientRect();
  
    // Calculate relative position to game container
    const left = parseInt(wrapper.style.left) || 0;
    const top = parseInt(wrapper.style.top) || 0;
    const width = parseInt(wrapper.style.width) || 100;
    const height = parseInt(wrapper.style.height) || 100;
  
    // Create 1-2 additional protestors based on click count
    const count = Math.min(clickCount, 2);
  
    for (let i = 0; i < count; i++) {
      // Create a new protestor element
      const additionalProtestor = document.createElement("div");
      additionalProtestor.id = `${countryId}-additional-protestor-${i}`; // Add unique ID
      additionalProtestor.className = `${countryId}-additional-protestor`;
      additionalProtestor.style.position = "absolute";
  
      // Slightly different position offsets for each protestor
      // These offsets create a small group effect
      const offsetX = -20 + i * 30; // Spreading out horizontally
      const offsetY = -10 - i * 5; // Slightly higher than the original
  
      additionalProtestor.style.left = `${left + offsetX}px`;
      additionalProtestor.style.top = `${top + offsetY}px`;
      additionalProtestor.style.width = `${width * 0.8}px`; // Slightly smaller
      additionalProtestor.style.height = `${height * 0.8}px`; // Slightly smaller
      additionalProtestor.style.zIndex = "10209"; // Below the main protestor
      additionalProtestor.style.backgroundImage = "url('images/protest.png')";
      additionalProtestor.style.backgroundSize = "400% 100%";
      additionalProtestor.style.backgroundPosition = "0% 0%";
      additionalProtestor.style.backgroundRepeat = "no-repeat";
      additionalProtestor.style.pointerEvents = "none";
      additionalProtestor.style.opacity = "0.9";
      additionalProtestor.style.transformOrigin = "bottom center";
  
      // Add to game container
      gameContainer.appendChild(additionalProtestor);
  
      // Start animation
      let currentFrame = i % 4; // Start on different frames for variety
  
      const animationInterval = setInterval(() => {
        currentFrame = (currentFrame + 1) % 4;
        const percentPosition = (currentFrame / 3) * 100;
  
        // Get a fresh reference to the specific protestor
        const el = document.getElementById(`${countryId}-additional-protestor-${i}`);
        if (el) {
          el.style.backgroundPosition = `${percentPosition}% 0%`;
        } else {
          clearInterval(animationInterval);
        }
      }, 350); // Slightly different timing from main protestor
  
      // Store interval for cleanup
      if (!this.activeAnimations.extraProtestors) {
        this.activeAnimations.extraProtestors = {};
      }
      this.activeAnimations.extraProtestors[`${countryId}-additional-${i}`] = animationInterval;
    }
  }
  
  handleProtestorClick(countryId) {
    const country = this.countries[countryId];
    if (!country) {
      this.logger.error("freedom", `Click handler called but country ${countryId} not found in data`);
      return;
    }
  
    // Ensure activeAnimations exists
    if (!this.activeAnimations) {
      this.activeAnimations = {
        protestors: {},
        extraProtestors: {},
      };
    }
  
    // Log the click event
    this.logger.info("freedom", `[CLICK EVENT] Protestor clicked in ${countryId}`);
  
    // Clear any existing timeout
    if (country.disappearTimeout) {
      clearTimeout(country.disappearTimeout);
    }
  
    // Increment click counter
    const oldClickCount = country.clickCounter || 0;
    country.clickCounter = oldClickCount + 1;
  
    // Get a fresh reference to the protestor wrapper and sprite elements
    const protestorWrapper = document.getElementById(`${countryId}-protestors-wrapper`);
    const protestorSprite = document.getElementById(`${countryId}-protestors`);
  
    if (!protestorWrapper || !protestorSprite) {
      this.logger.error("freedom", `Protestor elements not found for ${countryId}`);
      return;
    }
  
    // Store the wrapper reference in country data
    country.protestorWrapper = protestorWrapper;
  
    // Calculate volume based on click count
    const volume = Math.min(0.3 + country.clickCounter * 0.15, 0.9);
  
    // Play protestor sound with increasing volume
    this.playProtestSound(countryId, volume);
  
    // ADDITION: Also play the grow protestors sound on click for additional feedback
    if (this.audioManager) {
      this.audioManager.playGrowProtestorsSound(0.7);
    }
  
    // Create additional protestors
    const gameContainer = document.getElementById("game-container");
    if (gameContainer && protestorWrapper) {
      // Clean up any previous additional protestors - FIXED
      document.querySelectorAll(`.${countryId}-additional-protestor`).forEach((el) => {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
  
      // Clean up previous animation intervals
      if (this.activeAnimations.extraProtestors) {
        for (let key in this.activeAnimations.extraProtestors) {
          if (key.startsWith(`${countryId}-`)) {
            clearInterval(this.activeAnimations.extraProtestors[key]);
            delete this.activeAnimations.extraProtestors[key];
          }
        }
      }
  
      // Create additional protestors based on click count
      if (country.clickCounter === 1 || country.clickCounter === 2) {
        this.createAdditionalProtestors(countryId, country.clickCounter);
      }
  
      // CRITICAL CHANGE: Stop all CSS animations and transitions before applying transform
      protestorWrapper.style.animation = "none";
      protestorWrapper.style.transition = "none";
      void protestorWrapper.offsetWidth; // Force browser reflow to apply style changes
  
      // Get original position values
      const originalPosition = {
        left: protestorWrapper.style.left,
        top: protestorWrapper.style.top,
        width: protestorWrapper.style.width,
        height: protestorWrapper.style.height,
      };
  
      // KEY FIX: Set transform-origin to bottom center so it grows upward
      protestorWrapper.style.transformOrigin = "bottom center";
  
      if (country.clickCounter >= 3) {
        // Trigger liberation after 3 clicks
        this.triggerCountryResistance(countryId);
        country.clickCounter = 0;
      } else if (country.clickCounter === 2) {
        // Change sprite to heart version on second click
        protestorSprite.style.backgroundImage = "url('images/protestHeart.png')";
        this.logger.info("freedom", `[SPRITE CHANGE] Changed protestor sprite to protestHeart.png for ${countryId}`);
  
        // Apply dramatic scaling (1.75x) with bounce effect
        protestorWrapper.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
        protestorWrapper.style.transform = "scale(1.75)";
  
        // Set timeout for protestors to disappear if not clicked
        country.disappearTimeout = setTimeout(() => {
          this.shrinkAndHideProtestors(countryId);
        }, 7000);
      } else {
        // First click behavior
        // Apply moderate scaling (1.4x)
        protestorWrapper.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
        protestorWrapper.style.transform = "scale(1.4)";
  
        // Set timeout for protestors to disappear if not clicked
        country.disappearTimeout = setTimeout(() => {
          this.shrinkAndHideProtestors(countryId);
        }, 7000);
      }
  
      // Ensure the wrapper remains correctly positioned
      protestorWrapper.style.position = "absolute";
      protestorWrapper.style.left = originalPosition.left;
      protestorWrapper.style.top = originalPosition.top;
      protestorWrapper.style.width = originalPosition.width;
      protestorWrapper.style.height = originalPosition.height;
      protestorWrapper.style.zIndex = "10210"; // Keep above hitbox
    }
  }
  
  hideProtestors(countryId) {
    this.logger.info("freedom", `[HIDE] Hiding protestors for ${countryId}`);
  
    // Stop sounds for this specific country
    this.stopProtestorSounds(countryId);
  
    // Clear additional protestors - FIXED
    document.querySelectorAll(`.${countryId}-additional-protestor`).forEach((el) => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  
    // Clear animation intervals for additional protestors
    if (this.activeAnimations.extraProtestors) {
      Object.keys(this.activeAnimations.extraProtestors)
        .filter((key) => key.startsWith(`${countryId}-`))
        .forEach((key) => {
          clearInterval(this.activeAnimations.extraProtestors[key]);
          delete this.activeAnimations.extraProtestors[key];
        });
    }
  
    // Clear main protestor animation interval
    if (this.activeAnimations.protestors[countryId]) {
      clearInterval(this.activeAnimations.protestors[countryId]);
      delete this.activeAnimations.protestors[countryId];
    }
  
    // Hide hitbox
    if (this.protestorHitboxManager) {
      this.protestorHitboxManager.hideHitbox(countryId);
    }
  
    // Remove protestor wrapper
    const protestorWrapper = this.countries[countryId]?.protestorWrapper || document.getElementById(`${countryId}-protestors-wrapper`);
  
    if (protestorWrapper && protestorWrapper.parentNode) {
      protestorWrapper.parentNode.removeChild(protestorWrapper);
    }
  
    // Reset country state
    if (this.countries[countryId]) {
      this.countries[countryId].protestorWrapper = null;
      this.countries[countryId].protestorsShown = false;
  
      // Clear disappear timeout
      if (this.countries[countryId].disappearTimeout) {
        clearTimeout(this.countries[countryId].disappearTimeout);
        this.countries[countryId].disappearTimeout = null;
      }
    }
  }
  
  cleanupAllProtestorsForCountry(countryId) {
    // Remove the main protestor wrapper
    const protestorWrapper = document.getElementById(`${countryId}-protestors-wrapper`);
    if (protestorWrapper && protestorWrapper.parentNode) {
      protestorWrapper.parentNode.removeChild(protestorWrapper);
    }
  
    // Remove all additional protestors for this country - FIXED
    document.querySelectorAll(`.${countryId}-additional-protestor`).forEach((el) => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  
    // Clear animation intervals for additional protestors
    if (this.activeAnimations.extraProtestors) {
      for (let key in this.activeAnimations.extraProtestors) {
        if (key.startsWith(`${countryId}-`)) {
          clearInterval(this.activeAnimations.extraProtestors[key]);
          delete this.activeAnimations.extraProtestors[key];
        }
      }
    }
  
    // Reset country state
    if (this.countries[countryId]) {
      this.countries[countryId].protestorsShown = false;
      this.countries[countryId].clickCounter = 0;
  
      // Clear any disappear timeout
      if (this.countries[countryId].disappearTimeout) {
        clearTimeout(this.countries[countryId].disappearTimeout);
        this.countries[countryId].disappearTimeout = null;
      }
    }
  
    // Hide the hitbox
    if (this.protestorHitboxManager) {
      this.protestorHitboxManager.hideHitbox(countryId);
    }
  }
  
  cleanupAllProtestors() {
    // Stop all protestor sounds
    this.stopProtestorSounds();
  
    // Clear all animation intervals for main protestors
    Object.keys(this.activeAnimations.protestors).forEach((countryId) => {
      if (this.activeAnimations.protestors[countryId]) {
        clearInterval(this.activeAnimations.protestors[countryId]);
      }
    });
    this.activeAnimations.protestors = {};
  
    // Clear all animation intervals for additional protestors
    if (this.activeAnimations.extraProtestors) {
      Object.keys(this.activeAnimations.extraProtestors).forEach((key) => {
        clearInterval(this.activeAnimations.extraProtestors[key]);
      });
      this.activeAnimations.extraProtestors = {};
    }
  
    // Remove all additional protestor elements - FIXED
    document.querySelectorAll('[class$="-additional-protestor"]').forEach((el) => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  
    // Clean up all main protestor elements
    document.querySelectorAll('[id$="-protestors-wrapper"]').forEach((el) => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  
    // Clean up hitboxes
    if (this.protestorHitboxManager) {
      this.protestorHitboxManager.cleanupAll();
    }
  
    // Reset country states
    Object.keys(this.countries).forEach((countryId) => {
      if (this.countries[countryId]) {
        this.countries[countryId].protestorsShown = false;
  
        // Clear any disappear timeouts
        if (this.countries[countryId].disappearTimeout) {
          clearTimeout(this.countries[countryId].disappearTimeout);
          this.countries[countryId].disappearTimeout = null;
        }
      }
    });
  
    this.logger.info("freedom", "All protestors cleaned up");
  }

  resetProtestors() {
    // Clean up all protestors
    this.cleanupAllProtestors();

    // Reset the hitbox manager if it exists
    if (this.protestorHitboxManager) {
      this.protestorHitboxManager.cleanupAll();
    }
  }

  /**
   * Debug method to annex a country
   * @param {string} countryId - Country identifier
   * @returns {boolean} - Success status
   */
  annexCountry(countryId) {
    const gameCountry = this.gameState.countries[countryId];
    if (!gameCountry) {
      this.logger.error("freedom", `Country ${countryId} not found in gameState`);
      return false;
    }

    // Set claims to max
    gameCountry.claims = gameCountry.maxClaims;

    // Update the flag overlay
    this.updateFlagOpacity(countryId);

    return true;
  }

  /**
   * Debug method to make a country ready for resistance
   * @param {string} countryId - Country identifier
   * @returns {boolean} - Success status
   */
  makeResistanceReady(countryId) {
    const country = this.countries[countryId];
    if (!country) {
      this.logger.error("freedom", `Country ${countryId} not found in countries`);
      return false;
    }

    // First make sure the country is fully annexed
    this.annexCountry(countryId);

    // Set the annexation timer to the threshold
    country.annexTime = this.config.fullAnnexationTime;
    country.resistanceAvailable = true;

    // Show the resistance indicator
    this.showResistancePossibleIndicator(countryId);

    return true;
  }

  destroy() {
    // Stop all sounds
    if (this.audioManager) {
      if (typeof this.audioManager.stopAll === "function") {
        this.audioManager.stopAll();
      }
    }

    // Clean up all effects and protestors
    this.cleanupAllEffects();
    this.cleanupAllProtestors();

    // Reset internal state for all countries
    Object.keys(this.countries).forEach((countryId) => {
      const country = this.countries[countryId];
      country.annexTime = 0;
      country.resistanceAvailable = false;
      country.protestorsShown = false;
      country.clickCounter = 0;
    });

    this.logger.info("freedom", "Freedom Manager destroyed");
  }
}

// Export the FreedomManager globally
window.FreedomManager = FreedomManager;
