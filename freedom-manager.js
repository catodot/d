class GlowOutline {
  constructor() {
    this.initializeGlobalStyles();
  }

  initializeGlobalStyles() {
    if (!document.getElementById("glow-outline-style")) {
      const styleElement = document.createElement("style");
      styleElement.id = "glow-outline-style";
      styleElement.textContent = `
              @keyframes outlinePulse {
                  0% { transform: scale(1.0); }
                  50% { transform: scale(1.1); }
                  100% { transform: scale(1.0); }
              }
              
              @keyframes cartoonGlowPulse {
                  0% { 
                      box-shadow: 
                          0 0 0 4px var(--glow-color, rgba(255, 215, 0, 1)),
                          0 0 0 8px var(--glow-color, rgba(255, 215, 0, 0.6));
                  }
                  50% { 
                      box-shadow: 
                          0 0 0 6px var(--glow-color, rgba(255, 215, 0, 1)),
                          0 0 0 12px var(--glow-color, rgba(255, 215, 0, 0.6));
                  }
                  100% { 
                      box-shadow: 
                          0 0 0 4px var(--glow-color, rgba(255, 215, 0, 1)),
                          0 0 0 8px var(--glow-color, rgba(255, 215, 0, 0.6));
                  }
              }

              .record-button-glow {
                  position: relative;
                  z-index: 1;
              }

              .record-button-glow::before {
                  content: '';
                  position: absolute;
                  top: -8px;
                  left: -8px;
                  right: -8px;
                  bottom: -8px;
                  border-radius: 50%;
                  background: transparent;
                  z-index: -1;
                  animation: cartoonGlowPulse 1s infinite ease-in-out;
                  pointer-events: none;
              }

              .record-button-glow.recording::before {
                  --glow-color: rgba(231, 76, 60, 1);
              }

              .record-button-glow.waiting::before {
                  --glow-color: rgba(243, 156, 18, 1);
              }
          `;
      document.head.appendChild(styleElement);
    }
  }

  // Original create method for protestors remains unchanged
  create({
    parentId,
    position = { left: 0, top: 0 },
    size = { width: 100, height: 100 },
    color = "#FFD700",
    borderWidth = 4,
    zIndex = 10210,
    borderRadius = "50%",
  }) {
    const wrapper = document.createElement("div");
    wrapper.id = `${parentId}-glow-wrapper`;
    Object.assign(wrapper.style, {
      position: "absolute",
      left: `${position.left}px`,
      top: `${position.top}px`,
      width: `${size.width}px`,
      height: `${size.height}px`,
      pointerEvents: "none",
      zIndex: zIndex.toString(),
      transformOrigin: "bottom center",
    });

    const outlineContainer = document.createElement("div");
    outlineContainer.id = `${parentId}-outline`;
    outlineContainer.style.position = "absolute";
    outlineContainer.style.top = "0";
    outlineContainer.style.left = "0";
    outlineContainer.style.width = "100%";
    outlineContainer.style.height = "100%";
    outlineContainer.style.borderRadius = borderRadius;
    outlineContainer.style.border = `${borderWidth}px solid ${color}`;
    outlineContainer.style.boxShadow = `0 0 15px 5px ${this.getRGBAFromColor(color, 0.7)}`;
    outlineContainer.style.opacity = "0.8";
    outlineContainer.style.animation = "outlinePulse 1.5s infinite ease-in-out";
    outlineContainer.style.pointerEvents = "none";
    outlineContainer.style.zIndex = "1";

    wrapper.appendChild(outlineContainer);
    return wrapper;
  }

  // New method specifically for adding glow to record button
  addToRecordButton(buttonElement) {
    // Add a class to the record button for the glow effect
    buttonElement.classList.add("record-button-glow");

    // Return the button element for chaining
    return buttonElement;
  }

  // New method to update the glow color based on button state
  updateGlowColor(buttonElement, color) {
    if (buttonElement && buttonElement.style) {
      // Extract RGB values from color
      let rgba = color;
      if (color.startsWith("#")) {
        rgba = this.getRGBAFromColor(color, 0.5);
      }

      // Set the custom property for the glow color
      buttonElement.style.setProperty("--glow-color", rgba);
    }
  }

  getRGBAFromColor(color, alpha) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}

class SmackManager {
  /**
   * Creates a new SmackManager instance.
   * @param {Object} animationManager - The animation manager to delegate animations to.
   * @param {Object} audioManager - The audio manager for smack sounds.
   */
  constructor(animationManager, audioManager) {
    logger.info("animation", "Creating Smack Manager");
    this.animationManager = animationManager;
    this.audioManager = audioManager;
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
  /**
   * Create a new TrumpHandEffectsController
   * @param {Object} gameState - The game state reference
   * @param {Object} audioManager - The audio manager reference
   */
  constructor(gameState, audioManager) {
    this.audioManager = audioManager;

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
    console.log(`[uuu HAND EFFECTS] ========== HOVER UPDATE START ==========`);
    console.log(`[uuu HAND EFFECTS] Is hovering: ${isHovering}`);
    console.log(`[uuu HAND EFFECTS] Current state: ${this.state.current}`);
    console.log(`[uuu HAND EFFECTS] Is grabbing: ${this.state.isGrabbing}`);
    console.log(`[uuu HAND EFFECTS] Is animating: ${this.state.isAnimating}`);
    
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
    console.log(`[uuu HAND EFFECTS] ========== HOVER UPDATE END ==========`);

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
    console.log("lll in setNotGrabbingState");
    
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
      return;
    }

    const isMobile = window.DeviceUtils ? window.DeviceUtils.isMobile() : false;

    // Remove any existing prompts
    this.removeClickHerePrompt();

    // Create the prompt element
    const prompt = document.createElement("div");
    prompt.id = "trump-hand-click-prompt";
    prompt.textContent = "CLICK HERE";

    // Add base classes
    prompt.classList.add("hand-click-prompt");
    prompt.classList.add(isMobile ? "hand-click-prompt--mobile" : "hand-click-prompt--desktop");
    prompt.classList.add("hand-click-prompt--pulsing");

    // Some properties might still need to be set via JS if they're dynamic
    prompt.style.zIndex = "2";
    prompt.style.pointerEvents = "none";

    // Add a style element for the animations if it doesn't exist yet
    if (!document.getElementById("hand-prompt-style")) {
      this.addPromptStyles();
    }

    // Append the prompt to the visual element
    this.elements.visual.appendChild(prompt);

    console.log("Added click here prompt to", this.elements.visual);
  }

  addPromptStyles() {
    const style = document.createElement("style");
    style.id = "hand-prompt-style";
    style.textContent = `
      .hand-click-prompt {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: white;
        font-weight: bold;
                line-height: 1.9rem;

        padding: 20px 12px;
        letter-spacing: 1px;
        border-radius: 100%;
        font-family: Rock Salt, serif;
        text-shadow: 
          3px 0 0 #000,
          -3px 0 0 #000,
          0 3px 0 #000,
          0 -3px 0 #000,
          2px 2px 0 #000,
          -2px -2px 0 #000,
          2px -2px 0 #000,
          -2px 2px 0 #000;
          
      }
      
      .hand-click-prompt--desktop {
        font-size: 1.2rem;
                        line-height: 1.9rem;

      }
      
      .hand-click-prompt--mobile {
        font-size: 0.8rem;
                        line-height: 1.3rem;

      }
      
      .hand-click-prompt--pulsing {
        animation: pulse-prompt 1.5s infinite ease-in-out;
      }
      
      @keyframes pulse-prompt {
        0% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.8; }
        50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.8; }
      }
    `;
    document.head.appendChild(style);
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
    const currentGameTime = this.gameState.config ? this.gameState.config.GAME_DURATION - this.gameState.timeRemaining : 0;

    // Only show prompt after 10 seconds of game time has passed
    const shouldShowPrompt = isBeforeFirstBlock && this.state.current === this.STATES.HITTABLE && currentGameTime >= 5;

    console.log("Prompt visibility check:", {
      isBeforeFirstBlock,
      currentState: this.state.current,
      hittableState: this.STATES.HITTABLE,
      currentGameTime,
      shouldShowPrompt,
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
 * Manages the hitbox for Trump's hand in grab animations
 */
class HandHitboxManager {
  /**
   * Create a new HandHitboxManager
   * @param {Object} audioManager - The audio manager reference
   */
  constructor(audioManager) {
    this.audioManager = audioManager;

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
      grab: ["grabEastCanada", 
    "grabEastCanadaSmall", 
    "grabEastCanadaSmaller", 
    "grabEastCanadaSmallest",
    "grabWestCanada", 
    "grabWestCanadaSmall", 
    "grabWestCanadaSmaller", 
    "grabWestCanadaSmallest",
    "grabMexico", 
    "grabMexicoSmall", 
    "grabMexicoSmaller", 
    "grabMexicoSmallest",
    "grabGreenland", 
    "grabGreenlandSmall", 
    "grabGreenlandSmaller", 
    "grabGreenlandSmallest"],
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
  console.log("lll in hideHitbox");
  
    if (this.trumpHandHitBox) {
      console.log("lll in hideHitbox and have hitbox");

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
    console.log("lll in hideHitbox and don't have hitbox");

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

      if (this.audioManager) {
        this.audioManager.play("ui", "click", 0.5);
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
    console.log(`[uuu HITBOX] ========== HITBOX UPDATE START ==========`);
    console.log(`[uuu HITBOX] Previous state: ${this.currentState}`);
    console.log(`[uuu HITBOX] Previous frame: ${this.currentFrame}`);
    console.log(`[uuu HITBOX] New state: ${state}`);
    console.log(`[uuu HITBOX] New frame: ${frameIndex}`);
    
    this.currentState = state;
    this.currentFrame = frameIndex;
    this.updatePosition();
    console.log(`[uuu HITBOX] Updated position completed`);
    console.log(`[uuu HITBOX] Current coordinates:`, this.getHitboxInfo());
    console.log(`[uuu HITBOX] ========== HITBOX UPDATE END ==========`);
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

    console.log("lll  our log makes it to here");

    const grabAnimations = this.animationTypes.grab;
    const smackedAnimations = this.animationTypes.smack;
    this.isDebugMode = document.body.classList.contains("debug-mode");

    // No hitbox for idle or after being smacked
    if (this.currentState === "idle" || smackedAnimations.includes(this.currentState)) {
      console.log("lll but we NEVER make it h");
      
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

window.HandHitboxManager = HandHitboxManager;

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
      usa: { element: null, isVisible: false, scale: 1.0 }, // Add USA
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
          x: 408, // van
          y: 1600,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 608, //cal
          y: 1600,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 608, //ed
          y: 1300,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 508, //wh
          y: 1100,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 408, //daw
          y: 900,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 791, //sask
          y: 1300,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 891, //win
          y: 900,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 991, //tor
          y: 1500,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1091, //ott
          y: 1400,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1091, //north of ott
          y: 1600,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1291, //north of mon
          y: 1400,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 1291, //mon
          y: 1850,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1800, // n queb
          y: 1600,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1491, //queb
          y: 1800,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1891, //sher
          y: 1850,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 1991, //ns
          y: 1850,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 2091, //ns
          y: 1850,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 2191, //nl
          y: 1850,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
      ],

      usa: [
        {
          x: 800, // Seattle area
          y: 1900,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 900, // Minnesota area
          y: 1900,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1000, // Chicago area
          y: 2000,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1200, // New York area
          y: 2000,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 900, // California area
          y: 2200,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1100, // Texas area
          y: 2300,
          width: 300,
          height: 300,
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
        {
          x: 1102,
          y: 2636,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1050,
          y: 2650,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 1180,
          y: 2650,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
      ],
      greenland: [
        {
          x: 1900,
          y: 377,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2000,
          y: 377,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 2200,
          y: 377,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2400,
          y: 377,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

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

        {
          x: 2192,
          y: 777,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2180,
          y: 720,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2300,
          y: 720,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2500,
          y: 720,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2600,
          y: 720,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 2192,
          y: 877,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2180,
          y: 820,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2300,
          y: 820,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2500,
          y: 820,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },
        {
          x: 2600,
          y: 820,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 2500,
          y: 920,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 2400,
          y: 920,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 2300,
          y: 920,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 2250,
          y: 920,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 2400,
          y: 1020,
          width: 300,
          height: 300,
          calibrationScale: 0.24,
        },

        {
          x: 2400,
          y: 1220,
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

  static PROTESTOR_TIMING = {
    // Regular protestors
    INITIAL_ANNEX_MIN_DELAY: 10000,    
    INITIAL_ANNEX_MAX_DELAY: 40000,    
    FADE_AWAY_TIME: 4000, // Time before protestors fade if not clicked (7 seconds)
    REGENERATION_DELAY: 10000, // Time between fade/liberation and next appearance (10 seconds)
    
    // USA protestors
    USA_INITIAL_APPEARANCE_THRESHOLD: 0.9, // Show first USA protestors at 10% of game time
    USA_REAPPEAR_MIN_TIME:  35000, // Minimum time before USA protestors reappear
    USA_REAPPEAR_MAX_TIME:  45000  // Maximum time before USA protestors reappear
  };  


  /**
   * @param {Object} gameState - The game state object
   * @param {Object} elements - DOM elements
   * @param {Object} audioManager - Audio management system
   * @param {Object} [config] - Optional configuration
   */

  constructor(gameState, elements, audioManager, config = {}, gameEngine) {
    this.gameState = gameState;
    this.elements = elements;
    this.audioManager = audioManager;
    this.gameEngine = gameEngine;

    this.usaTimingCheckDone = false; // Add this flag

    this.glowOutline = new GlowOutline();

    // Configuration with defaults
    this.config = {
      fullAnnexationTime: 40000, // 10 seconds after full annexation before resistance is possible
      resistanceChance: 0.01, // 5% check per second for fully annexed countries
      protestorShowDelay: 0.75, // Show protestors at 75% of annexation time
      effectsEnabled: {
        confetti: true,
        screenShake: true,
        fireworks: true,
      },
      ...config,
    };


    // Set up logger reference
    this.logger = this._initLogger();

    // Set up country data in a unified structure
    this.countries = this._initCountries();

    // Animation tracking
    this.activeAnimations = {
      confetti: [],
      fireworks: [],
      protestors: {},
      extraProtestors: {},
    };

    // Initialize sub-modules
    this.animationManager = window.animationManager;
    this.smackManager = window.smackManager;

    // Initialize protestor hitbox manager
    this._initProtestorHitboxManager();

    // Create containers for particles
    this._createParticleContainers();

    this.usaProtestorConfig = {
      initialThreshold: 0.9, // Show first USA protestors after 10% of game time
      minRespawnTime: 20000, //  ms minimum between protestor appearances
      maxRespawnTime: 40000, //  ms maximum between protestor appearances
      nextSpawnTime: null
    };
    
    // Track Trump's shrink state
    this.trumpShrinkLevel = 0; // 0 = normal, 1 = small, 2 = smaller, 3 = smallest
    this.trumpShrinkStates = ['normal', 'small', 'smaller', 'smallest'];

    this.logger.info("freedom", "Enhanced Freedom Manager initialized");

    this.trumpSizeState = {
      currentSize: 'normal',  // 'normal', 'small', 'smaller', 'smallest'
      sizeIndex: 0,          // 0-3 matching the size arrays
      sizes: ['normal', 'small', 'smaller', 'smallest'],
      transitioning: false
    };
    
  }

  /**
   * Initialize logger
   * @private
   */
  _initLogger() {
    return (
      window.logger || {
        debug: (category, message) => console.log(`[DEBUG] ${category}: ${message}`),
        info: (category, message) => console.log(`[INFO] ${category}: ${message}`),
        warn: (category, message) => console.warn(`[WARN] ${category}: ${message}`),
        error: (category, message) => console.error(`[ERROR] ${category}: ${message}`),
      }
    );
  }

  /**
   * Initialize country data
   * @private
   */
  _initCountries() {
    return {
      canada: this._createCountryState("canada"),
      mexico: this._createCountryState("mexico"),
      greenland: this._createCountryState("greenland"),
      usa: this._createCountryState("usa"),
    };
  }

  /**
   * Create a country state object
   * @private
   * @param {string} id - Country identifier
   * @returns {Object} Country state object
   */
  _createCountryState(id) {
    return {
      id,
      annexTime: 0,
      resistanceAvailable: false,
      protestorsShown: false,
      clickCounter: 0,
      disappearTimeout: null,
      initialDelaySet: false, 
      initialDelay: null,
      animations: {},
      protestorWrapper: null,
      currentScale: 1.0,
      regenerationTimeout: null,


    };
  }

  /**
   * Initialize protestor hitbox manager
   * @private
   */
  _initProtestorHitboxManager() {
    if (!window.protestorHitboxManager) {
      this.logger.info("freedom", "Creating new Protestor Hitbox Manager");
      window.protestorHitboxManager = new ProtestorHitboxManager(true); // Pass flag for lazy initialization
    }
    this.protestorHitboxManager = window.protestorHitboxManager;
    this.logger.info("freedom", "Protestor Hitbox Manager initialized");
  }

  /**
   * Create particle containers for visual effects
   * @private
   */
  _createParticleContainers() {
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) {
      this.logger.error("freedom", "Game container not found for particle containers");
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
      this.logger.debug("freedom", `Created particle container for ${countryId}`);
    });
  }

  /**
   * Get DOM element safely with logging
   * @private
   * @param {string} id - Element ID
   * @param {string} context - Context for error logging
   * @returns {HTMLElement|null} - The element or null if not found
   */
  _getElement(id, context) {
    const element = document.getElementById(id);
    // Only log as error if in a critical context, otherwise log as debug
    if (!element) {
      if (context === "critical") {
        this.logger.error("freedom", `Element ${id} not found for ${context}`);
      } else {
        this.logger.debug("freedom", `Element ${id} not found for ${context}`);
      }
    }
    return element;
  }

  /**
   * Get game container element
   * @private
   * @returns {HTMLElement|null} - Game container or null
   */
  _getGameContainer() {
    return this._getElement("game-container", "operation");
  }

  /**
   * Main game update function - called on each frame
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    if (!this.gameState.isPlaying || this.gameState.isPaused) return;

    // Convert deltaTime from ms to seconds for chance calculation
    const deltaSeconds = deltaTime / 1000;


    this._checkForUSAProtestors(deltaTime);

    // Process each country
    Object.keys(this.countries).forEach((countryId) => {
      const country = this.countries[countryId];
      const gameCountry = this.gameState.countries[countryId];

      if (!gameCountry) return;

      // Only update annexation time and show protestors for FULLY annexed countries
      if (gameCountry.claims >= 1) {
        // New code: only requires 1 claim
        this._updateAnnexedCountry(country, gameCountry, deltaTime, deltaSeconds);
      } else {
        // Country not fully annexed, reset timer and hide protestors
        this._resetCountryState(country);
      }
    });
  }

  _updateAnnexedCountry(country, gameCountry, deltaTime, deltaSeconds) {
    const countryId = country.id;
    
    // Update annexation timer
    country.annexTime += deltaTime;
    
    // Set initial random delay if not set
    if (!country.initialDelaySet) {
      country.initialDelay = this._getRandomBetween(
        FreedomManager.PROTESTOR_TIMING.INITIAL_ANNEX_MIN_DELAY,
        FreedomManager.PROTESTOR_TIMING.INITIAL_ANNEX_MAX_DELAY
      );
      country.initialDelaySet = true;
      console.log(`[PROTESTORS] Set initial delay for ${countryId}: ${country.initialDelay/1000}s`);
    }
    
    // Check if we should show protestors for annexed countries
    if (country.annexTime >= country.initialDelay && !country.protestorsShown) {
      this.logger.info("freedom", `[THRESHOLD] ${countryId} reached protestor show threshold at ${country.annexTime}ms`);
      this.showProtestors(countryId);
      country.protestorsShown = true;
    }
      
    if (country.annexTime >= this.config.fullAnnexationTime && !country.resistanceAvailable) {
      country.resistanceAvailable = true;
      this.logger.info(
        "freedom",
        `[RESISTANCE AVAILABLE] ${countryId} now able to resist after ${(country.annexTime / 1000).toFixed(1)}s of full annexation`
      );
      this._showResistancePossibleIndicator(countryId);
    }
  
    if (country.resistanceAvailable && !country.protestorsShown) {
      this._checkRandomResistance(countryId, deltaSeconds);
    }
  }

  
  _resetCountryState(country) {
    const countryId = country.id;
  
    if (country.protestorsShown) {
      this.hideProtestors(countryId);
      country.protestorsShown = false;
    }

    if (country.regenerationTimeout) {
      clearTimeout(country.regenerationTimeout);
      country.regenerationTimeout = null;
  }
    country.annexTime = 0;
    country.resistanceAvailable = false;
    country.initialDelaySet = false;  // Add this
    country.initialDelay = null;      // Add this
  }


  _checkRandomResistance(countryId, deltaSeconds) {
    // Calculate per-frame chance based on per-second chance
    const frameResistanceChance = this.config.resistanceChance * deltaSeconds;

    // Random check if resistance should happen now
    if (Math.random() < frameResistanceChance) {
      this.logger.info("freedom", `[AUTO UPRISING] Random resistance triggered in ${countryId}!`);
      this.triggerCountryResistance(countryId);

      // Reset after successful resistance
      this.countries[countryId].resistanceAvailable = false;
      this.countries[countryId].annexTime = 0;
      this.countries[countryId].protestorsShown = false;
      this.hideProtestors(countryId);
    }
  }

  _showResistancePossibleIndicator(countryId) {
    const countryElement = this.elements.countries[countryId];
    if (!countryElement) return;

    // Add pulsing glow effect
    countryElement.classList.add("resistance-possible");

    // Play subtle sound
    if (this.audioManager) {
      this.audioManager.playRandom("particles", "freedom", null, 0.4);
    }
  }


  _scheduleNextRegularProtestors(countryId) {
    // Clear any existing timeout
    if (this.countries[countryId]?.regenerationTimeout) {
      clearTimeout(this.countries[countryId].regenerationTimeout);
    }
  
    // Schedule next appearance after REGENERATION_DELAY
    this.countries[countryId].regenerationTimeout = setTimeout(() => {
      // Only show if country is still annexed
      if (this.gameState.countries[countryId]?.claims > 0) {
        this.showProtestors(countryId);
      }
    }, FreedomManager.PROTESTOR_TIMING.REGENERATION_DELAY);
  }
  
  _scheduleNextUSAProtestors() {
    const nextDelay = this._getRandomBetween(
      FreedomManager.PROTESTOR_TIMING.USA_REAPPEAR_MIN_TIME,
      FreedomManager.PROTESTOR_TIMING.USA_REAPPEAR_MAX_TIME
    );
    
    this.usaProtestorConfig.nextSpawnTime = nextDelay;
    console.log(`[USA PROTESTORS] Next spawn in ${nextDelay/1000} seconds`);
  }

  _createProtestorElements(countryId, hitbox) {
    const gameContainer = this._getGameContainer();
    if (!gameContainer) return null;

    const left = parseInt(hitbox.style.left) || 0;
    const top = parseInt(hitbox.style.top) || 0;
    const width = parseInt(hitbox.style.width) || 100;
    const height = parseInt(hitbox.style.height) || 100;

    // Clean up existing elements
    const existingElement = this._getElement(`${countryId}-protestors-wrapper`, "cleanup");
    if (existingElement?.parentNode) {
      existingElement.parentNode.removeChild(existingElement);
    }

    // Create wrapper with glow
    const wrapper = this.glowOutline.create({
      parentId: countryId,
      position: { left, top },
      size: { width, height },
      color: "#FFD700", // Gold color
      zIndex: 10210,
    });
    wrapper.id = `${countryId}-protestors-wrapper`;

    // Create protestors sprite
    const protestors = document.createElement("div");
    protestors.id = `${countryId}-protestors`;
    Object.assign(protestors.style, {
      position: "relative",
      width: "100%",
      height: "100%",
      backgroundImage: "url('images/protest.png')",
      backgroundSize: "400% 100%", // For 4-frame sprite sheet
      backgroundPosition: "0% 0%",
      backgroundRepeat: "no-repeat",
      opacity: "0",
      transition: "opacity 0.3s ease-out",
      zIndex: "2",
    });
    wrapper.appendChild(protestors);

    gameContainer.appendChild(wrapper);

    return wrapper;
  }

  _setupProtestorAnimations(countryId, wrapper) {
    const protestors = this._getElement(`${countryId}-protestors`, "animation setup");
    if (!protestors) {
      this.logger.error("freedom", `Protestor sprite for ${countryId} not found for animation setup`);
      return;
    }

    // Get the outline element
    const outline = this._getElement(`${countryId}-protestors-outline`, "outline setup");

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
      const protestorElement = this._getElement(`${countryId}-protestors`, "animation update");
      if (!protestorElement) {
        clearInterval(animationInterval);
        this.logger.debug("freedom", `Animation cleared for ${countryId} - element not found`);
        return;
      }

      // For 4-frame sprite sheet
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

      // Fade in the outline
      if (outline) {
        outline.style.transition = "opacity 0.5s ease-out";
        outline.style.opacity = "1";
      }

      // Only play protest sound if the country is still annexed
      const gameCountry = this.gameState.countries[countryId];
      if (gameCountry && gameCountry.claims > 0) {
        // Play protest sound on appearance with very low initial volume
        this.audioManager.playProtestorSound(countryId, 0.05); // Start at 5% volume
      } else {
        this.logger.debug("freedom", `Skipped playing protestor sound for free country: ${countryId}`);
      }
    }, 100);
  }

  showProtestors(countryId) {
    this.protestorHitboxManager.selectNewRandomSpawnLocation(countryId);
  
    this.logger.info("freedom", `Showing protestors for ${countryId}`);
  
    // Get the hitbox
    const hitbox = this.protestorHitboxManager.showHitbox(countryId, this);
    if (!hitbox) {
      this.logger.error("freedom", `Failed to create protestor hitbox for ${countryId}`);
      return null;
    }
  
    // Only clean up existing protestors if we successfully got a new hitbox
    if (this.countries[countryId].protestorWrapper) {
      this._cleanupProtestorElements(countryId);
    }
  
    // Create protestor wrapper and sprite
    const wrapper = this._createProtestorElements(countryId, hitbox);
    if (!wrapper) return null;
  
    // Initialize click counter
    this.countries[countryId].clickCounter = 0;
    this.countries[countryId].currentScale = 1.0;
    this.countries[countryId].protestorWrapper = wrapper;
  
    // Set up animations
    this._setupProtestorAnimations(countryId, wrapper);
  
    // Set timeout for protestors to disappear if not clicked
    this.countries[countryId].disappearTimeout = setTimeout(() => {
      this._shrinkAndHideProtestors(countryId);
    }, FreedomManager.PROTESTOR_TIMING.FADE_AWAY_TIME);
  
    return wrapper;
  }
  /**
   * Shrink and hide protestors with animation
   * @private
   * @param {string} countryId - Country identifier
   */

  

hideProtestors(countryId) {
  this.logger.info("freedom", `[HIDE] Hiding protestors for ${countryId}`);

  // Stop sounds for this specific country
  if (this.audioManager) {
      this.audioManager.stopProtestorSound(countryId);
  }

  // Clean up all elements and animations for this country
  this._cleanupProtestorElements(countryId);

  // Hide hitbox
  if (this.protestorHitboxManager) {
      this.protestorHitboxManager.hideHitbox(countryId);
  }

  // Reset country state
  if (this.countries[countryId]) {
      this.countries[countryId].protestorWrapper = null;
      this.countries[countryId].protestorsShown = false;
      this.countries[countryId].clickCounter = 0; // Explicitly reset click counter

      // Clear disappear timeout
      if (this.countries[countryId].disappearTimeout) {
          clearTimeout(this.countries[countryId].disappearTimeout);
          this.countries[countryId].disappearTimeout = null;
      }
  }

  // When USA protestors are hidden, schedule next appearance
  if (countryId === "usa") {
    this._scheduleNextUSAProtestors();
  } else {
    this._scheduleNextRegularProtestors(countryId);
  }
}

_shrinkAndHideProtestors(countryId) {

  if (this.audioManager) {
    this.audioManager.stopProtestorSound(countryId);
  }


  const protestorWrapper = this._getElement(`${countryId}-protestors-wrapper`, "shrinking");
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



_scheduleNextUSAProtestors() {
  // Ensures consistent timing for next USA protestors spawn
  const nextDelay = this._getRandomBetween(
    FreedomManager.PROTESTOR_TIMING.USA_REAPPEAR_MIN_TIME,
    FreedomManager.PROTESTOR_TIMING.USA_REAPPEAR_MAX_TIME
  );
  
  this.usaProtestorConfig.nextSpawnTime = nextDelay;
  
  console.log(`[USA PROTESTORS] Next spawn scheduled in ${nextDelay/1000} seconds`);
}

// Modify _spawnUSAProtestors to remove explicit timing logic
_spawnUSAProtestors() {
  console.log("[USA PROTESTORS] Spawning USA protestors");
  
  // Clean up any existing USA protestors first
  this._cleanupProtestorElements("usa");
  
  // Create fresh protestor state
  this.countries.usa.protestorsShown = false;
  this.countries.usa.clickCounter = 0;
  
  // Show the protestors
  this.showProtestors("usa");
  this.countries.usa.protestorsShown = true;
  
  // Play special sound
  setTimeout(() => {
    if (this.audioManager) {
      this.audioManager.playRandom("particles", "freedom", null, 0.8);
    }
  }, 100);
}

_checkForUSAProtestors(deltaTime) {
  // Only proceed if protestors are NOT currently shown
  if (this.countries.usa?.protestorsShown) {
    return;
  }
  
  const totalGameTime = this.gameState.config.GAME_DURATION;
  const currentGameTime = totalGameTime - this.gameState.timeRemaining;
  
   // First appearance check using configured threshold
   if (!this.usaTimingCheckDone && this.usaProtestorConfig.nextSpawnTime === null) {
    const usaThreshold = totalGameTime * FreedomManager.PROTESTOR_TIMING.USA_INITIAL_APPEARANCE_THRESHOLD;
    if (currentGameTime >= usaThreshold) {
      this._spawnUSAProtestors();
      this.usaTimingCheckDone = true;
    }
  } 
  
  // Subsequent appearance check
  if (this.usaProtestorConfig.nextSpawnTime !== null) {
    this.usaProtestorConfig.nextSpawnTime -= deltaTime;
    
    if (this.usaProtestorConfig.nextSpawnTime <= 0) {
      this._spawnUSAProtestors();
    }
  }
}

changeSizeState(newSize) {
  console.log(`[SIZE TRANSITION] Starting transition to ${newSize}`);
  
  // Get base state name without any size suffix
  const baseState = this.currentState.replace(/(Small|Smaller|Smallest)$/, '');
  
  // Construct new state name keeping the same animation type, just with new size
  const newStateName = newSize === 'normal' ? baseState : 
                      `${baseState}${newSize.charAt(0).toUpperCase() + newSize.slice(1)}`;
  
  console.log(`[SIZE TRANSITION] State transition: ${this.currentState} -> ${newStateName}`);

  // CRITICAL: Verify the exact animation state exists for this size
  if (!this.animations[newStateName]) {
    console.error(`[SIZE TRANSITION] Missing animation state: ${newStateName}`);
    return;
  }

  // ONLY update the sprite sheet image
  if (this.trumpSprite) {
    // Preserve the current animation state completely
    this.trumpSprite.style.backgroundImage = `url('${this.animations[newStateName].spriteSheet}')`;
  }

  // Optional: Log to verify no state changes
  console.log(`[SIZE TRANSITION] Current state still: ${this.currentState}`);
  console.log(`[SIZE TRANSITION] Current frame still: ${this.currentFrame}`);
}



// Add method to get current Trump size
getTrumpSize() {
  console.log("vvv [DEBUG] Freedom Manager Size State:", {
    currentSize: this.trumpSizeState.currentSize,
    index: this.trumpSizeState.sizeIndex,
    transitioning: this.trumpSizeState.transitioning,
    fullState: this.trumpSizeState
  });

  return {
    size: this.trumpSizeState.currentSize,
    index: this.trumpSizeState.sizeIndex,
    isTransitioning: this.trumpSizeState.transitioning
  };
}

// Add method to reset Trump size
resetTrumpSize() {
  this.trumpSizeState = {
    currentSize: 'normal',
    sizeIndex: 0,
    sizes: ['normal', 'small', 'smaller', 'smallest'],
    transitioning: false
  };

  // Update sprite if animation manager exists
  if (this.animationManager?.trumpSprite && this.animationManager.currentState) {
    const baseState = this.animationManager.currentState.replace(/(Small|Smaller|Smallest)$/, '');
    if (this.animationManager.animations?.[baseState]?.spriteSheet) {
      this.animationManager.trumpSprite.style.backgroundImage = 
        `url('${this.animationManager.animations[baseState].spriteSheet}')`;
    }
  }
}


_handleUSAShrinkSequence() {
  console.log("vvv [USA SHRINK DEBUG] ========== SHRINK ATTEMPT START ==========");
  
  // Get or create effect container
  let effectContainer = document.getElementById('shrink-effects-container');
  if (!effectContainer) {
    effectContainer = document.createElement('div');
    effectContainer.id = 'shrink-effects-container';
    effectContainer.style.position = 'absolute';
    effectContainer.style.top = '0';
    effectContainer.style.left = '0';
    effectContainer.style.width = '100%';
    effectContainer.style.height = '100%';
    effectContainer.style.pointerEvents = 'none';
    effectContainer.style.zIndex = '0';
    document.getElementById('game-container').appendChild(effectContainer);
  }
  
  this.trumpShrinkLevel++;
  const isFinalShrink = this.trumpShrinkLevel >= 3;
  
  // Create shrink effect centered on Trump
  this.createShrinkEffect(effectContainer, isFinalShrink);
  
  // Add screen shake
  const gameContainer = document.getElementById('game-container');
  if (gameContainer) {
    gameContainer.classList.add(isFinalShrink ? 'heavy-screen-shake' : 'screen-shake');
    setTimeout(() => {
      gameContainer.classList.remove('screen-shake', 'heavy-screen-shake');
    }, isFinalShrink ? 1000 : 500);
  }

  // Update Trump size state
  const sizes = ['normal', 'small', 'smaller', 'smallest'];
  this.trumpSizeState = {
    currentSize: sizes[this.trumpShrinkLevel] || 'smallest',
    sizeIndex: this.trumpShrinkLevel,
    sizes: sizes,
    transitioning: false
  };

  if (this.animationManager?.trumpSprite) {
    const targetSize = sizes[this.trumpShrinkLevel];
    const currentState = this.animationManager.currentState;
    const targetState = currentState.replace(/(Small|Smaller|Smallest)$/, '') + 
                       (targetSize === 'normal' ? '' : targetSize.charAt(0).toUpperCase() + targetSize.slice(1));
    
    if (this.animationManager.animations?.[targetState]?.spriteSheet) {
      // Add a brief delay to let the effect start before changing sprite
      setTimeout(() => {
        this.animationManager.trumpSprite.style.backgroundImage = 
          `url('${this.animationManager.animations[targetState].spriteSheet}')`;
        this.currentTrumpSize = targetSize;
      }, 100);
    }
  }

  // Hide protestors
  this.hideProtestors("usa");
  
  // Play sound with timing aligned to visual effect
  if (this.audioManager) {
    setTimeout(() => {
      if (isFinalShrink) {
        // this.audioManager.playRandom("trump", "finalShrink", null, 0.9);
      } else {
        // this.audioManager.playRandom("trump", "shrink", null, 0.7);
      }
    }, 50);
  }

  // Handle final shrink
  if (isFinalShrink) {
    setTimeout(() => {
      if (this.gameEngine) {
        this.gameEngine.triggerGameEnd(this.gameEngine.END_STATES.TRUMP_DESTROYED);
      }
    }, 1200); // Increased to match final animation duration
  } else {
    // Schedule next USA protestors
    this.usaTimingCheckDone = false;
    const nextDelay = this._getRandomBetween(
      FreedomManager.PROTESTOR_TIMING.USA_REAPPEAR_MIN_TIME,
      FreedomManager.PROTESTOR_TIMING.USA_REAPPEAR_MAX_TIME
    );
    this.usaProtestorConfig.nextSpawnTime = nextDelay;
  }
  
  console.log(`[USA SHRINK] Trump shrink level: ${this.trumpShrinkLevel}, Is final: ${isFinalShrink}`);
}

/**
 * Find Trump's position relative to the map background
 * Uses similar positioning logic to the protestor hitboxes
 */
_getTrumpPosition() {
  // Get the map element and game container
  const mapElement = document.getElementById("map-background");
  const gameContainer = document.getElementById("game-container");
  
  if (!mapElement || !gameContainer) {
    // Fallback to center of screen if elements not found
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      width: 100,
      height: 150
    };
  }
  
  // Get container positions
  const mapRect = mapElement.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  
  // Calculate map offset from game container
  const mapOffsetX = mapRect.left - containerRect.left;
  const mapOffsetY = mapRect.top - containerRect.top;
  
  // Calculate current scale of the map
  const currentMapScale = mapRect.width / mapElement.naturalWidth;
  
  // Trump is positioned approximately near USA 
  // These are approximate coordinates that can be adjusted through trial and error
  const trumpBaseCoords = {
    x: 1300, // Based on USA protestor positions (average of Texas/Chicago areas)
    y: 2300, // Slightly above some USA protestor positions
    width: 150,
    height: 200,
    calibrationScale: 0.24 // Same as protestor calibration
  };
  
  // Scale coordinates based on current map scale
  const scaledX = trumpBaseCoords.x * currentMapScale;
  const scaledY = trumpBaseCoords.y * currentMapScale;
  const scaledWidth = trumpBaseCoords.width * currentMapScale;
  const scaledHeight = trumpBaseCoords.height * currentMapScale;
  
  // Calculate final position within the game container
  const finalX = mapOffsetX + scaledX;
  const finalY = mapOffsetY + scaledY;
  
  console.log("[TRUMP POSITION] Calculated position:", {
    x: finalX,
    y: finalY,
    width: scaledWidth,
    height: scaledHeight,
    mapScale: currentMapScale
  });
  
  return {
    x: finalX,
    y: finalY,
    width: scaledWidth,
    height: scaledHeight
  };
}


_createShrinkStyles() {
  const styleElement = document.createElement('style');
  styleElement.id = 'shrink-effect-styles';
  styleElement.textContent = `
    /* Most of the previous styles remain the same */
    .shrink-ring {
      position: absolute;
      border-radius: 50%;
      background: transparent;
      left: var(--trump-x);
      top: var(--trump-y);
      transform: translate(-50%, -50%);
      opacity: 0.8;
      z-index: -40000;
    }
    
    /* Reduced to just two rings */
    .shrink-ring-0 {
      border: 10px solid #000;
      outline: 1px solid yellow;
      animation: shrink-ring 1.2s ease-in forwards;
      animation-delay: 0s;
    }
    
    .shrink-ring-1 {
      border: 7px solid var(--background-dark,rgb(0, 0, 0));
            outline: 1px solid yellow;

      animation: shrink-ring 1.2s ease-in forwards;
      animation-delay: 0.3s;
    }
        
    /* Animation keyframes remain the same */
    @keyframes shrink-ring {
      0% {
        opacity: 0.9;
        width: calc(var(--trump-width) * 7);
        height: calc(var(--trump-height) * 7);
      }
      40% {
        opacity: 0.9;
        width: calc(var(--trump-width) * 6);
        height: calc(var(--trump-height) * 6);
      }
      80% {
        opacity: 0.8;
        width: calc(var(--trump-width) * 3);
        height: calc(var(--trump-height) * 3);
      }
      100% {
        opacity: 0;
        width: 0;
        height: 0;
      }
    }
    
    /* Update final shrink styles to match the reduced rings */
    .final-shrink .shrink-ring-0 {
      border: 9px solid #000;
      animation: final-shrink-ring 1.8s ease-in forwards;
      animation-delay: 0s;
    }
    
    .final-shrink .shrink-ring-1 {
      border: 7px solid var(--background-dark,rgb(0, 0, 0));
      animation: final-shrink-ring 1.8s ease-in forwards;
      animation-delay: 0.4s;
    }
    
    .final-shrink .shrink-ring-2 {
      border: 9px solid #000;
      animation: final-shrink-ring 1.8s ease-in forwards;
      animation-delay: 0.4s;
    }
    
    .final-shrink .shrink-ring-3 {
      border: 7px solid var(--background-dark,black);
      animation: final-shrink-ring 1.8s ease-in forwards;
      animation-delay: 0.6s;
    }
    
    @keyframes final-shrink-flash {
      0% {
        width: calc(var(--trump-width) * 7);
        height: calc(var(--trump-height) * 7);
        opacity: 0.8;
      }
      30% {
        opacity: 0.9;
        width: calc(var(--trump-width) * 5);
        height: calc(var(--trump-height) * 5);
      }
      70% {
        opacity: 0.7;
        width: calc(var(--trump-width) * 2);
        height: calc(var(--trump-height) * 2);
      }
      100% {
        width: 0;
        height: 0;
        opacity: 0;
      }
    }
    
    @keyframes final-shrink-star {
      0% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(2.5) rotate(0deg);
      }
      30% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(2) rotate(120deg);
      }
      70% {
        opacity: 0.9;
        transform: translate(-50%, -50%) scale(0.8) rotate(300deg);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.05) rotate(720deg);
      }
    }
    
    @keyframes final-shrink-ring {
      0% {
        opacity: 0.9;
        width: calc(var(--trump-width) * 7);
        height: calc(var(--trump-height) * 7);
      }
      40% {
        opacity: 0.9;
        width: calc(var(--trump-width) * 4);
        height: calc(var(--trump-height) * 4);
      }
      80% {
        opacity: 0.8;
        width: calc(var(--trump-width) * 1);
        height: calc(var(--trump-height) * 1);
      }
      100% {
        opacity: 0;
        width: 0;
        height: 0;
      }
    }
    
    /* Screen shake animation for the game container */
    .screen-shake {
      animation: screen-shake 0.7s cubic-bezier(.36,.07,.19,.97) both;
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
      perspective: 1000px;
    }
    
    .heavy-screen-shake {
      animation: heavy-screen-shake 0.8s cubic-bezier(.36,.07,.19,.97) both;
    }
    
    @keyframes screen-shake {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      10%, 30%, 50%, 70%, 90% { transform: translate(-5px, 0) rotate(-1deg); }
      20%, 40%, 60%, 80% { transform: translate(5px, 0) rotate(1deg); }
    }
    
    @keyframes heavy-screen-shake {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      10%, 30%, 50%, 70%, 90% { transform: translate(-10px, 0) rotate(-2deg); }
      20%, 40%, 60%, 80% { transform: translate(10px, 0) rotate(2deg); }
    }
  `;
  
  document.head.appendChild(styleElement);
}

createShrinkEffect(container, isFinal = false) {
  // Get Trump's position
  const trumpPosition = this._getTrumpPosition();
  
  // Create the effect wrapper
  const effect = document.createElement('div');
  effect.className = `shrink-effect ${isFinal ? 'final-shrink' : ''}`;
  
  // Set CSS variables for positioning relative to Trump's position
  effect.style.setProperty('--trump-x', `${trumpPosition.x}px`);
  effect.style.setProperty('--trump-y', `${trumpPosition.y}px`);
  effect.style.setProperty('--trump-width', `${trumpPosition.width}px`);
  effect.style.setProperty('--trump-height', `${trumpPosition.height}px`);
  
  // Create central star/burst effect
  const star = document.createElement('div');
  star.className = 'shrink-star';
  effect.appendChild(star);
  
  // Create outer flash effect
  const flash = document.createElement('div');
  flash.className = 'shrink-flash';
  effect.appendChild(flash);
  
  // Add compression rings
  for (let i = 0; i < 4; i++) {
    const ring = document.createElement('div');
    ring.className = `shrink-ring shrink-ring-${i}`;
    effect.appendChild(ring);
  }
  
  // Insert the effect at the beginning of the container
  // This ensures it appears behind other elements
  container.insertBefore(effect, container.firstChild);
  
  // Create style element if it doesn't exist
  if (!document.getElementById('shrink-effect-styles')) {
    this._createShrinkStyles();
  }
  
  // Remove effect after animation
  setTimeout(() => {
    effect.remove();
  }, isFinal ? 2000 : 1500);
}



changeSizeState(newSize) {
  console.log("[SIZE TRANSITION DEBUG] ========== SIZE CHANGE ATTEMPT ==========");
  console.log("[SIZE TRANSITION DEBUG] Current state:", {
    currentState: this.currentState,
    requestedSize: newSize,
    currentFrame: this.currentFrame,
    currentSprite: this.trumpSprite?.style?.backgroundImage
  });
  
  const baseState = this.currentState.replace(/(Small|Smaller|Smallest)$/, '');
  const targetStateName = newSize === 'normal' ? baseState : 
                         `${baseState}${newSize.charAt(0).toUpperCase() + newSize.slice(1)}`;
  
  if (this.trumpSprite && this.animations?.[targetStateName]) {
    // ONLY change the sprite sheet image itself, nothing else
    this.trumpSprite.style.backgroundImage = `url('${this.animations[targetStateName].spriteSheet}')`;
  }
  
  console.log("[SIZE TRANSITION DEBUG] ========== SIZE CHANGE ATTEMPT END ==========");
}

handleUSAThirdClick() {
  console.log("xxx [USA] Processing third click");

  if (this.audioManager) {
    this.audioManager.stopProtestorSound("usa");
  }

  this._handleUSAShrinkSequence();
  this.countries.usa.clickCounter = 0;
}



_applyShrink(newSize) {
  console.log(`[USA SHRINK] Applying size change to ${newSize}`);

  // Get base state name (remove any existing size suffix)
  const baseState = this.animationManager.currentState.replace(/(Small|Smaller|Smallest)$/, '');
  const newState = newSize === 'normal' ? baseState : 
                  baseState + newSize.charAt(0).toUpperCase() + newSize.slice(1);

  console.log(`[USA SHRINK] State transition: ${baseState} -> ${newState}`);

  // Verify the new state exists in animations
  if (!this.animationManager.animations[newState]) {
    console.error(`[USA SHRINK] Error: ${newState} not found in animations`);
    return;
  }

  // Stop current animation
  this.animationManager.stop();

  // Update sprite sheet and state
  this.animationManager.trumpSprite.style.backgroundImage = 
    `url('${this.animationManager.animations[newState].spriteSheet}')`;
  this.animationManager.currentState = newState;

  // Important: Reset to frame 0 for clean transition
  this.animationManager.currentFrame = 0;
  this.animationManager.updateFrame(0);

  // Resume animation
  this.animationManager.play();

  // Play shrink sound
  if (this.audioManager) {
    this.audioManager.playRandom("resistance", "shrink", null, 0.7);
  }
}

_handleFinalShrink() {
  console.log("[FINAL SHRINK] Initiating final shrink sequence");

  const gameContainer = this._getGameContainer();
  if (!gameContainer) return;

  // Play final shrink sound
  if (this.audioManager) {
    // this.audioManager.playRandom("resistance", "finalShrink", null, 0.9);
  }

  // Final screen shake and disappear
  gameContainer.classList.add("screen-shake");
  setTimeout(() => {
    gameContainer.classList.remove("screen-shake");
    if (this.animationManager && this.animationManager.trumpSprite) {
      this.animationManager.trumpSprite.style.display = "none";
    }
    // Trigger game end with special end state
    if (this.gameEngine) {
      this.gameEngine.triggerGameEnd(this.gameEngine.END_STATES.TRUMP_DESTROYED);
    }
  }, 800);
}

// Utility method for random number between values
_getRandomBetween(min, max) {
  return min + Math.random() * (max - min);
}


handleProtestorClick(countryId) {
  // Prevent click handling during animations
  if (this.isProcessingProtestorClick) {
    return;
}
this.isProcessingProtestorClick = true;

  const country = this.countries[countryId];
  if (!country) {
      this.logger.error("freedom", `Country ${countryId} not found in data`);
      return;
  }

  // Add animation lock
  this.isProcessingClick = true;

  try {
      // Increment click counter
      country.clickCounter = (country.clickCounter || 0) + 1;

      // Clear any existing timeout
      if (country.disappearTimeout) {
          clearTimeout(country.disappearTimeout);
      }

      // Get required elements
      const protestorWrapper = this._getElement(`${countryId}-protestors-wrapper`, "click handling");
      const protestorSprite = this._getElement(`${countryId}-protestors`, "click handling");

      if (!protestorWrapper || !protestorSprite) {
          throw new Error(`Required elements not found for ${countryId}`);
      }

      // Store wrapper reference
      country.protestorWrapper = protestorWrapper;

      // Handle third click specially
      if (country.clickCounter >= 3) {
          if (countryId === "usa") {
              this.handleUSAThirdClick();
          } else {
              this.triggerCountryResistance(countryId);
          }
          country.clickCounter = 0;
      } else {
          this._processProtestorClick(countryId, country.clickCounter, protestorWrapper, protestorSprite);
      }
  } catch (error) {
      this.logger.error("freedom", `Error processing protestor click: ${error.message}`);
    } finally {
      // Clear the flag after a short delay to prevent rapid re-clicks
      setTimeout(() => {
          this.isProcessingProtestorClick = false;
      }, 100);
  }
}
  
_processProtestorClick(countryId, clickCount, wrapper, sprite) {
  console.log(`xxx Processing protestor click for ${countryId}, click ${clickCount}`);

  // Calculate volume that increases with each click
  const volume = Math.min(0.05 + clickCount * 0.15, 0.5);

  // Reset animation/transition for clean state
  wrapper.style.animation = "none";
  wrapper.style.transition = "none";
  void wrapper.offsetWidth; // Force reflow

  // Store original position
  const originalPosition = {
      left: wrapper.style.left,
      top: wrapper.style.top,
      width: wrapper.style.width,
      height: wrapper.style.height
  };

  // Set transform origin
  wrapper.style.transformOrigin = "bottom center";

  // Play sounds for clicks 1 and 2
  if (clickCount < 3) {
      this.audioManager.playProtestorSound(countryId, volume);
      this.audioManager.playGrowProtestorsSound(0.2);
  }

  // Create additional protestors for clicks 1 and 2
  if (clickCount === 1 || clickCount === 2) {
      this._createAdditionalProtestors(countryId, clickCount);
  }

  // Apply visual effects based on click count
  wrapper.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
  
  if (clickCount === 2) {
      sprite.style.backgroundImage = "url('images/protestHeart.png')";
      wrapper.style.transform = "scale(1.75)";
  } else {
      wrapper.style.transform = "scale(1.4)";
  }

  // Set disappear timeout
  this.countries[countryId].disappearTimeout = setTimeout(() => {
    this._shrinkAndHideProtestors(countryId);
}, FreedomManager.PROTESTOR_TIMING.FADE_AWAY_TIME);

  // Maintain position
  wrapper.style.position = "absolute";
  wrapper.style.left = originalPosition.left;
  wrapper.style.top = originalPosition.top;
  wrapper.style.width = originalPosition.width;
  wrapper.style.height = originalPosition.height;
  wrapper.style.zIndex = "10210";

  console.log(`xxx Processed click ${clickCount} for ${countryId}`);
}


  _createAdditionalProtestors(countryId, clickCount) {
    const wrapper = this._getElement(`${countryId}-protestors-wrapper`, "additional protestors");
    if (!wrapper) return;

    const gameContainer = this._getGameContainer();
    if (!gameContainer) return;

    // Remove any previous additional protestors
    document.querySelectorAll(`.${countryId}-additional-protestor`).forEach((el) => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });

    // Only add additional protestors after first click
    if (clickCount < 1) return;

    // Get the base position
    const left = parseInt(wrapper.style.left) || 0;
    const top = parseInt(wrapper.style.top) || 0;
    const width = parseInt(wrapper.style.width) || 100;
    const height = parseInt(wrapper.style.height) || 100;

    // Create 1-2 additional protestors based on click count
    const count = Math.min(clickCount, 2);

    for (let i = 0; i < count; i++) {
      // Create a new protestor element
      const additionalProtestor = document.createElement("div");
      additionalProtestor.id = `${countryId}-additional-protestor-${i}`;
      additionalProtestor.className = `${countryId}-additional-protestor`;
      additionalProtestor.style.position = "absolute";

      // Position on either side of the main protestor
      // First click: Add one protestor to the right
      // Second click: Add one protestor to the left
      const side = i === 0 ? 1 : -1; // 1 for right, -1 for left
      const offsetX = side * (width * 0.6); // Place at 80% of the width to the side
      const offsetY = -5; // Slightly higher than the original

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
      this._animateAdditionalProtestor(countryId, i, additionalProtestor);
    }
  }

  _animateAdditionalProtestor(countryId, index, protestor) {
    let currentFrame = index % 4; // Start on different frames for variety

    const animationInterval = setInterval(() => {
      // Check if element still exists in DOM directly
      const el = document.getElementById(`${countryId}-additional-protestor-${index}`);
      if (el) {
        currentFrame = (currentFrame + 1) % 4;
        const percentPosition = (currentFrame / 3) * 100;
        el.style.backgroundPosition = `${percentPosition}% 0%`;
      } else {
        // Element doesn't exist anymore, clear interval
        clearInterval(animationInterval);

        // Clean up the reference in our tracking
        if (this.activeAnimations.extraProtestors) {
          const key = `${countryId}-additional-${index}`;
          delete this.activeAnimations.extraProtestors[key];
        }
      }
    }, 350); // Slightly different timing from main protestor

    // Store interval for cleanup
    if (!this.activeAnimations.extraProtestors) {
      this.activeAnimations.extraProtestors = {};
    }
    this.activeAnimations.extraProtestors[`${countryId}-additional-${index}`] = animationInterval;
  }


  
  _capturePositionData(countryId) {
    const protestorWrapper = this._getElement(`${countryId}-protestors-wrapper`, "position capture");
    const hitbox = this.protestorHitboxManager?.protestorHitboxes[countryId]?.element;

    if (protestorWrapper) {
      const gameContainer = this._getGameContainer();
      if (!gameContainer) return null;

      const containerRect = gameContainer.getBoundingClientRect();
      const wrapperRect = protestorWrapper.getBoundingClientRect();

      return {
        source: "wrapper",
        left: wrapperRect.left - containerRect.left,
        top: wrapperRect.top - containerRect.top,
        width: wrapperRect.width,
        height: wrapperRect.height,
      };
    } else if (hitbox) {
      const gameContainer = this._getGameContainer();
      if (!gameContainer) return null;

      const containerRect = gameContainer.getBoundingClientRect();
      const hitboxRect = hitbox.getBoundingClientRect();

      return {
        source: "hitbox",
        left: hitboxRect.left - containerRect.left,
        top: hitboxRect.top - containerRect.top,
        width: hitboxRect.width,
        height: hitboxRect.height,
      };
    }

    // Fallback coordinates as last resort
    const fallbackCoords = {
      canada: { left: 117, top: 328, width: 35, height: 35 },
      mexico: { left: 126, top: 440, width: 35, height: 35 },
      greenland: { left: 249, top: 208, width: 35, height: 35 },
    };

    if (fallbackCoords[countryId]) {
      return {
        source: "fallback",
        ...fallbackCoords[countryId],
      };
    }

    return null;
  }

  
  _createResistanceCelebration(countryId, positionData) {
    const gameContainer = this._getGameContainer();
    if (!gameContainer) return;

    if (!positionData) {
      this.logger.error("freedom", `No position data available for celebration in ${countryId}`);
      return;
    }

    const { left, top, width, height } = positionData;

    if (this.audioManager) {
      this.audioManager.playRandom("particles", "freedom", null, 0.8);
    }

    // Visual effects
    if (this.config.effectsEnabled.screenShake) {
      this._addScreenShake(gameContainer);
    }

    this._createFlashEffect(left, top, width, height, gameContainer);
    this._createResistanceText(left, top, width, height, gameContainer);

    if (this.config.effectsEnabled.confetti) {
      this._createConfettiBurst(left, top, width, height, gameContainer);
    }

    if (this.config.effectsEnabled.fireworks) {
      this._createFireworkBurst(left, top, width, height, gameContainer);
    }
  }

  triggerCountryResistance(countryId) {
    this.logger.info("freedom", `MAJOR RESISTANCE in ${countryId}!`);

    // Stop ALL protestor sounds before playing victory sounds
    if (this.audioManager) {
      this.audioManager.stopAllProtestorSounds();

      // Small delay before playing resistance sound
      setTimeout(() => {
        // Play resistance sound with good volume
        this.audioManager.playRandom("resistance", countryId, null, 0.7);
      }, 15);
    }

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
    const flagOverlay = this._getElement(`${countryId}-flag-overlay`, "resistance");
    if (flagOverlay) {
      this.logger.info("freedom", `Resetting flag opacity for ${countryId} to zero`);
      flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");
      flagOverlay.style.opacity = "0";
    }

    // Store position data before removing elements
    const positionData = this._capturePositionData(countryId);

    // Create celebration effects
    this._createResistanceCelebration(countryId, positionData);

    // Play resistance animation via smack manager
    this._playResistanceAnimation(countryId);

    // IMPORTANT: Delay protestor cleanup until after animation
    setTimeout(() => {
      this._cleanupProtestorElements(countryId);
    }, this.config.animationDuration + 100); // Add small buffer after animation

    return true;
  }




  

  
  

  

  _shrinkTrump() {
    console.log("[TRUMP SHRINK] Initiating shrink sequence");
    
    // Get the current size based on level (no increment)
    const newSize = this.trumpShrinkStates[this.trumpShrinkLevel];
    console.log("yyy " + newSize);
    
    console.log(`[TRUMP SHRINK] Current level: ${this.trumpShrinkLevel}, Target size: ${newSize}`);

    // Cache current animation state before change
    const currentState = this.animationManager.currentState;
    console.log(`[TRUMP SHRINK] Current animation state: ${currentState}`);

    // Ensure we clean up any active protestors before size change
    if (this.protestorHitboxManager) {
        // Let the protestor hitbox manager handle its own cleanup
        this.protestorHitboxManager.hideHitbox('usa');
    }

    // Change size state
    this.animationManager.changeSizeState(newSize);
    
    // Verify size change
    setTimeout(() => {
      const newState = this.animationManager.currentState;
      console.log(`[TRUMP SHRINK] Verifying size change: ${currentState} -> ${newState}`);
      
      // Resume USA protestor spawning after size change
      this.usaTimingCheckDone = false;
    }, 100);

    // Play shrink sound
    if (this.audioManager) {
      this.audioManager.playRandom("resistance", "shrink", null, 0.7);
    }
}


  











  _playResistanceAnimation(countryId) {
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
        // Don't clean up here - it's handled by the delayed cleanup in triggerCountryResistance
      });
    }
  }

  /**
   * Add screen shake effect
   * @private
   * @param {HTMLElement} container - Container to apply shake effect
   */
  _addScreenShake(container) {
    container.classList.add("screen-shake");
    setTimeout(() => {
      container.classList.remove("screen-shake");
    }, 800);
  }

  /**
   * Create flash effect
   * @private
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {HTMLElement} container - Parent container
   */
  _createFlashEffect(x, y, width, height, container) {
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

  /**
   * Create resistance text effect
   * @private
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {HTMLElement} container - Parent container
   */
  _createResistanceText(x, y, width, height, container) {
    const text = document.createElement("div");
    text.className = "freedom-text";
    text.textContent = "!!!";
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
    text.style.fontWeight = "900";

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

  /**
   * Create confetti burst effect
   * @private
   * @param {number} left - X position
   * @param {number} top - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {HTMLElement} container - Parent container
   */
  _createConfettiBurst(left, top, width, height, container) {
    const confettiCount = 60; // Fewer, more impactful pieces

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
        this._createConfettiPiece(startX, startY, container, i % 2 === 0);
      }, i * 15);
    }
  }

  /**
   * Create a single confetti piece
   * @private
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {HTMLElement} container - Parent container
   * @param {boolean} isLarger - Whether this is a larger piece
   */
  _createConfettiPiece(startX, startY, container, isLarger = false) {
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

    this._animateConfetti(confettiRef, startX, startY, destinationX, destinationY, rotation, duration, cp1x, cp1y, cp2x, cp2y, simplifiedPath);
  }

  /**
   * Animate a confetti piece
   * @private
   * @param {Object} confettiRef - Reference to the confetti object
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} destinationX - Ending X position
   * @param {number} destinationY - Ending Y position
   * @param {number} rotation - Initial rotation
   * @param {number} duration - Animation duration
   * @param {number} cp1x - Control point 1 X
   * @param {number} cp1y - Control point 1 Y
   * @param {number} cp2x - Control point 2 X
   * @param {number} cp2y - Control point 2 Y
   * @param {boolean} simplifiedPath - Whether to use simplified path
   */
  _animateConfetti(confettiRef, startX, startY, destinationX, destinationY, rotation, duration, cp1x, cp1y, cp2x, cp2y, simplifiedPath) {
    const confetti = confettiRef.element;

    const animateConfettiFrame = (timestamp) => {
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

          // Instead of fading out, shrink at the end
          if (progress > 0.7) {
            const scale = 1 - ((progress - 0.7) / 0.3) * 0.7; // Don't scale all the way to 0
            confetti.style.transform = `rotate(${spin}deg) scale(${scale})`;
          } else {
            confetti.style.transform = `rotate(${spin}deg)`;
          }
        }

        // Optimize animation frame rate on mobile
        if (simplifiedPath && progress % 0.1 !== 0) {
          // Skip some frames on mobile
          setTimeout(() => requestAnimationFrame(animateConfettiFrame), 16);
        } else {
          requestAnimationFrame(animateConfettiFrame);
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

    requestAnimationFrame(animateConfettiFrame);
  }

  /**
   * Create firework burst effect
   * @private
   * @param {number} left - X position
   * @param {number} top - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {HTMLElement} container - Parent container
   */
  _createFireworkBurst(left, top, width, height, container) {
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
            this._createFireworkParticle(burst.x, burst.y, container);
          }, i * 15);
        }
      }, burst.delay);
    });
  }

  /**
   * Create a single firework particle
   * @private
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {HTMLElement} container - Parent container
   */
  _createFireworkParticle(centerX, centerY, container) {
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

    this._animateFireworkParticle(fireworkRef, centerX, centerY, destinationX, destinationY, duration, particleType);
  }

  /**
   * Animate a firework particle
   * @private
   * @param {Object} fireworkRef - Reference to the firework object
   * @param {number} centerX - Starting X position
   * @param {number} centerY - Starting Y position
   * @param {number} destinationX - Ending X position
   * @param {number} destinationY - Ending Y position
   * @param {number} duration - Animation duration
   * @param {string} particleType - Type of particle
   */
  _animateFireworkParticle(fireworkRef, centerX, centerY, destinationX, destinationY, duration, particleType) {
    const particle = fireworkRef.element;

    const animateParticleFrame = (timestamp) => {
      if (fireworkRef.animationCompleted) return;

      const elapsed = timestamp - fireworkRef.startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        // Arc path with gentle gravity
        const easedProgress = progress;
        const currentX = centerX + (destinationX - centerX) * easedProgress;

        // Arc effect - gentler, wider arc
        const verticalOffset = Math.sin(progress * Math.PI) * 60; // Higher arc
        const gravity = Math.pow(progress, 2) * 40; // Very gentle gravity
        const currentY = centerY + (destinationY - centerY) * easedProgress - verticalOffset + gravity;

        // Update position
        particle.style.left = `${currentX}px`;
        particle.style.top = `${currentY}px`;

        // Rotation based on particle type
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

        requestAnimationFrame(animateParticleFrame);
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

    requestAnimationFrame(animateParticleFrame);
  }

  /**
   * Update flag opacity based on claims
   * @param {string} countryId - Country identifier
   */
  updateFlagOpacity(countryId) {
    const flagOverlay = this._getElement(`${countryId}-flag-overlay`, "flag update");
    if (!flagOverlay) return;

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


  
  cleanupAllProtestors() {
    // Stop ALL protestor sounds first
    if (this.audioManager) {
      this.audioManager.stopAllProtestorSounds();
    }

    // Clean up each country's protestors, including USA
    Object.keys(this.countries).forEach((countryId) => {
      this._cleanupProtestorElements(countryId);

      // Reset country state
      if (this.countries[countryId]) {
        this.countries[countryId].protestorsShown = false;
        this.countries[countryId].clickCounter = 0;

        if (this.countries[countryId].disappearTimeout) {
          clearTimeout(this.countries[countryId].disappearTimeout);
          this.countries[countryId].disappearTimeout = null;
        }
      }
    });

    // Clean up hitboxes
    if (this.protestorHitboxManager) {
      this.protestorHitboxManager.cleanupAll();
    }
  }

  /**
   * Clean up all visual effects
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
    if (window.animationManager) {
      window.animationManager.reset();
    }
  }

  /**
   * Reset the manager for a new game
   */
  reset() {
    this.logger.info("freedom", "Resetting Freedom Manager");

    // Reset USA protestor timing
    this.usaTimingCheckDone = false;
    this.usaProtestorConfig.nextSpawnTime = null;

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

    // Reset ALL country states
    Object.keys(this.countries).forEach((countryId) => {
        // Full country state reset
        this.countries[countryId] = {
            id: countryId,
            annexTime: 0,
            resistanceAvailable: false,
            protestorsShown: false,
            clickCounter: 0,
            disappearTimeout: null,
            animations: {},
            protestorWrapper: null,
            currentScale: 1.0
        };

        // Reset visual state of country overlay
        const flagOverlay = this._getElement(`${countryId}-flag-overlay`, "reset");
        if (flagOverlay) {
            flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100", 
                                      "resistance-possible", "targeting-pulse");
            flagOverlay.style.opacity = "";
        }
    });

    // Reset animation manager
    if (window.animationManager) {
        window.animationManager.reset();
    }

    // Reset trump size
    this.trumpShrinkLevel = 0;


    this.resetTrumpSize();


  }

  _cleanupProtestorElements(countryId) {
    // FIRST: Stop all sounds for this specific country
  if (this.audioManager) {
    // Call twice to ensure it stops (might help if there's a race condition)
    this.audioManager.stopProtestorSound(countryId);
    setTimeout(() => this.audioManager.stopProtestorSound(countryId), 50);
  }

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

    // Clear any disappear timeout
    if (this.countries[countryId]?.disappearTimeout) {
      clearTimeout(this.countries[countryId].disappearTimeout);
      this.countries[countryId].disappearTimeout = null;
    }

    // Remove all additional protestor elements
    document.querySelectorAll(`.${countryId}-additional-protestor`).forEach((el) => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });

    // Remove protestor wrapper
    const wrapper = this._getElement(`${countryId}-protestors-wrapper`, "cleanup");
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }

    // Reset country state
    if (this.countries[countryId]) {
      this.countries[countryId].protestorsShown = false;
      this.countries[countryId].protestorWrapper = null;
    }
   if (countryId === "usa") {
    this._scheduleNextUSAProtestors();
  }
  if (countryId === "usa") {
    this._scheduleNextUSAProtestors();
  }
  }

  _scheduleNextUSAProtestors() {
    // Ensures consistent timing for next USA protestors spawn
    const nextDelay = this._getRandomBetween(
      FreedomManager.PROTESTOR_TIMING.USA_REAPPEAR_MIN_TIME,
      FreedomManager.PROTESTOR_TIMING.USA_REAPPEAR_MAX_TIME
    );
    
    this.usaProtestorConfig.nextSpawnTime = nextDelay;
    
    console.log(`[USA PROTESTORS] Next spawn scheduled in ${nextDelay/1000} seconds`);
  }

  cleanupAllProtestors() {
    // FIRST: Stop ALL protestor sounds
    if (this.audioManager) {
      this.audioManager.stopAllProtestorSounds();
    }

    // Clean up each country's protestors
    Object.keys(this.countries).forEach((countryId) => {
      this._cleanupProtestorElements(countryId);

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
    });

    // Clean up hitboxes
    if (this.protestorHitboxManager) {
      this.protestorHitboxManager.cleanupAll();
    }

    // Clear all animation intervals
    this.activeAnimations.protestors = {};
    this.activeAnimations.extraProtestors = {};

    this.logger.info("freedom", "All protestors cleaned up");
  }

  handleGrabSuccess() {
    console.log("lll in handle grab sucess");
    
    // FIRST: Clean up protestors if this is a game-ending grab
    const isGameEnding = this._checkGameOverCondition();
    if (isGameEnding) {
      this.cleanupAllProtestors();
    }

    // THEN: Unhighlight the country
    if (this.state.targetCountry) {
      this.highlightTargetCountry(this.state.targetCountry, false);
    }

    // Set to not grabbing
    this.setNotGrabbingState();

    // Apply success effect only if game isn't ending
    if (!isGameEnding) {
      this.applyGrabSuccessEffect();
    }

    this.logger.debug("freedom", "Handled grab success");
  }

  destroy() {
    this.logger.info("freedom", "Destroying Freedom Manager");

    // Stop all sounds first
    if (this.audioManager) {
      this.audioManager.stopAllProtestorSounds();
      this.audioManager.stopAll();
    }

    // Clean up all effects and protestors
    this.cleanupAllEffects();

    // Explicitly destroy protestor hitbox manager
    if (this.protestorHitboxManager) {
      this.protestorHitboxManager.destroy();
    }

    // Reset internal state for all countries
    Object.keys(this.countries).forEach((countryId) => {
      const country = this.countries[countryId];
      country.annexTime = 0;
      country.resistanceAvailable = false;
      country.protestorsShown = false;
      country.clickCounter = 0;
    });

    // Clear all timers and intervals
    Object.keys(this.activeAnimations).forEach((key) => {
      const animations = this.activeAnimations[key];
      if (typeof animations === "object") {
        Object.values(animations).forEach((interval) => {
          if (typeof interval === "number") {
            clearInterval(interval);
          }
        });
      }
    });

    // Reset animation tracking
    this.activeAnimations = {
      confetti: [],
      fireworks: [],
      protestors: {},
      extraProtestors: {},
    };

    // Clear references to other systems
    this.animationManager = null;
    this.smackManager = null;
    this.protestorHitboxManager = null;
  }
  /* ----- Debug and Testing Methods ----- */

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

    // Set the annexation timer to the class FreedomManager {
threshold
    country.annexTime = this.config.fullAnnexationTime;
    country.resistanceAvailable = true;

    // Show the resistance indicator
    this._showResistancePossibleIndicator(countryId);

    return true;
  }
}

// Export the FreedomManager globally
window.FreedomManager = FreedomManager;




