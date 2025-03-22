class TrumpHandEffectsController {
  constructor(gameState) {
    logger.info("effects", "Creating Trump Hand Effects Controller");
    this.elements = {
      visual: document.getElementById("trump-hand-visual"),
      hitbox: document.getElementById("trump-hand-hitbox"),
      gameContainer: document.getElementById("game-container") || document.body
    };
    
    this.gameState = gameState;
    
    // Use the global DeviceUtils for mobile detection
    this.isMobile = window.DeviceUtils && window.DeviceUtils.isMobileDevice;

    // Constant state definitions
    this.STATES = {
      IDLE: "idle",
      HITTABLE: "hittable",
      HIT: "hit",
      GRAB_SUCCESS: "grab-success"
    };
    
    // Current state tracking
    this.state = {
      current: this.STATES.IDLE,
      isAnimating: false,
      isHovering: false,
      isGrabbing: false,
      targetCountry: null
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
      // Set initial styles
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
            zIndex: "50",
            transition: "transform 0.2s ease-out, opacity 0.2s ease-out, border 0.2s ease-out" // Add transition
          },
          hittableStyles: {
            // Regular state (non-first block, not hovering)
            regular: {
              display: "block",
              border: "none",
              opacity: "0.5", 
              border: "2px dashed black",
              transform: "scale(1)",
              backgroundColor: "transparent",
              position: "absolute",
              visibility: "visible",
              zIndex: "50",
              transition: "transform 0.2s ease-out, opacity 0.2s ease-out, border 0.2s ease-out"
            },
            // getting ready for First block state
            firstBlock: {
              display: "block",
              opacity: "0.8", 
              border: "2px dashed black",
              backgroundColor: "rgba(255, 255, 255, .5)",
              borderRadius: "50%",
              transform: "scale(1)",
              position: "absolute",
              visibility: "visible",
              zIndex: "50",
              transition: "transform 0.2s ease-out, opacity 0.2s ease-out, border 0.2s ease-out"
            },
            // First block hover state
            firstBlockHover: {
              transform: "scale(1.15)", // Grow slightly on hover for first block
              opacity: "0.9"
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
              zIndex: "50",
              transition: "transform 0.2s ease-out, opacity 0.2s ease-out, border 0.2s ease-out"
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
              border: "4px solid black",
              borderRadius: "50%",
              zIndex: "50"
            }
          },
          effectStyles: {
            display: "block",
            opacity: "1",
            border: "none",
            zIndex: "100",
            visibility: "visible",
            position: "absolute"
          }
        };
      }
      
      // Update the updateVisualStyles method to handle first block hover
      updateVisualStyles() {
        if (!this.elements.visual) return;
        
        // Get the appropriate style set based on current state
        let styleSet;
        const isFirstBlock = this.isFirstBlock();
        
        if (isFirstBlock) {
          // First block with or without hover
          if (this.state.isHovering) {
            // First block with hover - combine base and hover styles
            styleSet = {
              ...this.config.hittableStyles.firstBlock, 
              ...this.config.hittableStyles.firstBlockHover
            };
          } else {
            // First block without hover
            styleSet = this.config.hittableStyles.firstBlock;
          }
        } else if (this.state.isGrabbing) {
          // Grabbing state
          styleSet = this.state.isHovering ? 
                    this.config.hittableStyles.grabbingHover : 
                    this.config.hittableStyles.grabbing;
        } else {
          // Regular state (not grabbing)
          styleSet = this.state.isHovering ? 
                    {...this.config.hittableStyles.regular, ...this.config.hittableStyles.hover} : 
                    this.config.hittableStyles.regular;
        }
        
        // Apply the selected style set with critical properties
        const mergedStyles = {...styleSet};
        
        // Always ensure these critical properties for proper interaction
        mergedStyles.pointerEvents = "none"; // Visual should never capture clicks
        mergedStyles.overflow = "visible";   // Ensure effects are fully visible
        
        this.setStyles(this.elements.visual, mergedStyles);
        
        // Ensure the hitbox remains interactive
        if (this.elements.hitbox) {
          this.elements.hitbox.style.pointerEvents = "all";
          this.elements.hitbox.style.cursor = "pointer";
          this.elements.hitbox.style.zIndex = "300"; // Higher than visual elements
        }
        
        logger.debug("effects", "Updated visual styles", { 
          isFirstBlock, 
          isGrabbing: this.state.isGrabbing, 
          isHovering: this.state.isHovering
        });
      }

  setStyles(element, styles) {
    if (!element) return;
    
    Object.entries(styles).forEach(([property, value]) => {
      element.style[property] = value;
    });
  }

  /**
   * Reset visual element to default state
   */
  resetVisual() {
    if (!this.elements.visual) return;
  
    // Remove all effect classes
    this.elements.visual.classList.remove(
      ...Object.values(this.STATES), 
      "animation-completed"
    );
  
  
    // Reset all styles to default
    this.setStyles(this.elements.visual, {
      ...this.config.defaultStyles,
      zIndex: this.originalZIndices.visual || "50"
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

  /**
   * Get the appropriate style set for the current state
   * @private
   * @returns {Object} Style set to apply
   */
  _getStyleSetForCurrentState() {
    const isFirstBlock = this.isFirstBlock();
    
    if (isFirstBlock) {
      // First block always uses the first block style regardless of grabbing/hovering
      return this.config.hittableStyles.firstBlock;
    } else if (this.state.isGrabbing) {
      // Not first block, and grabbing
      if (this.state.isHovering) {
        // Grabbing and hovering
        return this.config.hittableStyles.grabbingHover;
      } else {
        // Grabbing but not hovering
        return this.config.hittableStyles.grabbing;
      }
    } else {
      // Not first block, not grabbing
      if (this.state.isHovering) {
        // Not grabbing but hovering
        return {
          ...this.config.hittableStyles.regular,
          ...this.config.hittableStyles.hover
        };
      } else {
        // Not grabbing, not hovering
        return this.config.hittableStyles.regular;
      }
    }
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
    setTimeout(() => {
      // Remove screen shake
      this.elements.gameContainer.classList.remove("grab-screen-shake");

      // Update classes
      this.elements.visual.classList.remove(this.STATES.GRAB_SUCCESS);
      this.elements.visual.classList.add("animation-completed");

      // Complete reset after a short delay
      setTimeout(() => {
        this.resetVisual();
      }, 100);
    }, this.config.animationDuration);
  }

  /**
   * Make the hand hittable, with appropriate visual cues
   * @param {boolean} isFirstBlock - Whether this is the user's first block attempt
   */
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
    this.elements.hitbox.style.zIndex = "300";
    
    // Ensure visual element doesn't capture clicks
    this.elements.visual.style.pointerEvents = "none";

    this.state.isAnimating = false;
    this.state.current = this.STATES.HITTABLE;

    // Apply appropriate styles based on first block state, grabbing state, and hover state
    this.updateVisualStyles();
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
    const effectStyles = {...this.config.effectStyles, pointerEvents: "none"};
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

  /**
   * Apply visual effect when Trump successfully grabs
   */
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
      overflow: "visible"
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
        zIndex: "200", // Higher z-index than the parent
        top: "50%",
        left: "50%",
        visibility: "visible",
        pointerEvents: "none" // Ensure shards don't block clicks
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
    shards.forEach(shard => shard.remove());
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
        isFirstBlock: this.isFirstBlock()
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
      isFirstBlock
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

/**
 * Add click prompt to guide user
 */
addClickHerePrompt() {
  if (!this.elements.visual) return;

  // Remove any existing prompts
  this.removeClickHerePrompt();

  // Create a prompt that's positioned directly over the visual element
  const prompt = document.createElement("div");
  prompt.id = "trump-hand-click-prompt";
  prompt.textContent = "CLICK HERE";

  // Style it to be very visible
  prompt.style.position = "absolute";
  prompt.style.top = "50%";
  prompt.style.left = "50%";
  prompt.style.textAlign = "center";

  prompt.style.transform = "translate(-50%, -50%)";
  prompt.style.fontWeight = "bold";
  prompt.style.padding = "15px 6px";
  prompt.style.borderRadius = "100%";
  prompt.style.fontSize = "1.3rem";
  prompt.style.fontFamily = "Arial, sans-serif";
  prompt.style.zIndex = "10000"; // Very high to ensure visibility
  prompt.style.pointerEvents = "none"; // Don't block clicks
  prompt.style.fontWeight = "bold";

  // Add pulsing animation
  prompt.style.animation = "pulse-prompt 1.5s infinite ease-in-out";

  // Add animation keyframes if they don't exist
  if (!document.getElementById("hand-prompt-style")) {
    const style = document.createElement("style");
    style.id = "hand-prompt-style";
    style.textContent = `
      @keyframes pulse-prompt {
        0% { transform: translate(-50%, -50%) scale(0.95); }
        50% { transform: translate(-50%, -50%) scale(1.05); }
        100% { transform: translate(-50%, -50%) scale(0.95); }
      }
    `;
    document.head.appendChild(style);
  }

  // Append the prompt to the visual element
  this.elements.visual.appendChild(prompt);
  
  logger.debug("effects", "Added click here prompt");
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

/**
 * Check if prompt should be shown based on game state
 * and show it if needed
 */
updatePromptVisibility() {
  const isBeforeFirstBlock = 
    this.gameState && 
    this.gameState.stats && 
    this.gameState.stats.successfulBlocks === 0;
    
  if (isBeforeFirstBlock && this.state.current === this.STATES.HITTABLE) {
    this.addClickHerePrompt();
  } else {
    this.removeClickHerePrompt();
  }
}

/**
 * Handle successful hit - remove prompt after first successful hit
 */
handleSuccessfulHit() {
  // Remove the click here prompt after a successful hit
  this.removeClickHerePrompt();
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
}