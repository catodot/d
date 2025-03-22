/**
 * Manages the hitbox for Trump's hand in grab animations
 */
class HandHitboxManager {
  /**
   * Create a new HandHitboxManager
   */
  constructor() {
    logger.info("hitbox", "Creating Hand Hitbox Manager");

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
      logger.debug("hitbox", "Hand hitbox initialized");

      // Don't set up hover effects if TrumpHandEffectsController exists
      if (!window.trumpHandEffects) {
        this.setupHoverEffects();
      }
    } else {
      logger.error("hitbox", "Hand hitbox element not found");
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
    logger.debug("hitbox", "Animations data set in HandHitboxManager");
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
      logger.error("hitbox", "Cannot adjust size of invisible hitbox");
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

    logger.debug("hitbox", `Adjusted hitbox size to ${width}x${height}`);
    return { x, y, width, height };
  }

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
    logger.error("hitbox", "Map element not found for scaling calculation");
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
    height: Math.round(baseCoords.height * scaleAdjustment * touchFactor)
  };
  
  logger.trace(
    "hitbox",
    `Scaled coordinates for frame ${frameIndex} (factor ${scaleAdjustment.toFixed(2)}): x:${scaledCoords.x}, y:${scaledCoords.y}, w:${scaledCoords.width}, h:${scaledCoords.height}`
  );
  
  return scaledCoords;
}
  
/**
 * Update hitbox position based on current state and frame
 * @param {boolean} predictFrame - Whether to predict next frame position for smoother animations
 */
updatePosition(predictFrame = false) {
  // Validate required elements and data
  if (!this.trumpHandHitBox) {
    logger.error("hitbox", "Hand hitbox not found in updatePosition");
    return;
  }

  if (!this.animations) {
    logger.error("hitbox", "No animations data available in HandHitboxManager");
    return;
  }

  const grabAnimations = this.animationTypes.grab;
  const smackedAnimations = this.animationTypes.smack;
  this.isDebugMode = document.body.classList.contains("debug-mode");

  // No hitbox for idle or after being smacked
  if (this.currentState === "idle" || smackedAnimations.includes(this.currentState)) {
    this.hideHitbox();
    logger.trace("hitbox", `Hiding hand hitbox for ${this.currentState} state`);
    return;
  }

  // Only continue for grab animations
  if (!grabAnimations.includes(this.currentState)) {
    this.hideHitbox();
    return;
  }

  const animation = this.animations[this.currentState];
  if (!animation || !animation.handCoordinates) {
    logger.error("hitbox", `No hand coordinates for ${this.currentState}`);
    this.hideHitbox();
    return;
  }

  const isMobile = window.DeviceUtils.isMobileDevice;

  // If prediction is enabled and we're not on the last frame, look ahead
  let frameToUse = this.currentFrame;
  if (predictFrame && frameToUse < animation.handCoordinates.length - 1) {
    frameToUse += 1; // Look ahead one frame to account for rendering delay
  }
  
  // Get the coordinates for the specified frame
  let coords = this.getCoordinatesForFrame(animation, frameToUse, isMobile);
  
  if (!coords) {
    logger.error("hitbox", `No coordinates for frame ${frameToUse} in ${this.currentState}`);
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
      if (window.trumpHandEffects && this.trumpHandHitBox.classList.contains("hittable")) {
        window.trumpHandEffects.restoreVisualState();
      } else if (!this.trumpHandHitBoxVisual.classList.contains("hit") && !this.trumpHandHitBoxVisual.classList.contains("grab-success")) {
        // Only basic visibility if no effects controller
        this.trumpHandHitBoxVisual.style.display = "block";
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

    logger.trace("hitbox", `Positioned hand hitbox at (${coords.x}, ${coords.y}) with dimensions ${coords.width}x${coords.height}`);
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

    logger.debug("hitbox", "HandHitboxManager destroyed");
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

    logger.debug("hitbox", `Debug mode ${enabled ? "enabled" : "disabled"} for hitbox`);
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
