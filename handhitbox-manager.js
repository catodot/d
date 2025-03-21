class HandHitboxManager {
  constructor() {
    logger.info("hitbox", "Creating Hand Hitbox Manager");

    // Main DOM elements
    this.trumpHandHitBox = document.getElementById("trump-hand-hitbox");
    this.trumpHandHitBoxVisual = document.getElementById("trump-hand-visual");

    // State tracking
    this.currentState = "";
    this.currentFrame = 0;
    this.isVisible = false;
    this.isDebugMode = false;

    // Animation data reference
    this.animations = null;

    this.init();
  }

  init() {
    if (this.trumpHandHitBox) {
      this.trumpHandHitBox.style.display = "none";
      this.trumpHandHitBox.style.pointerEvents = "none";
      logger.debug("hitbox", "Hand hitbox initialized");
      
      // Set up hover effects
      this.setupHoverEffects();
    } else {
      logger.error("hitbox", "Hand hitbox element not found");
    }
    
    // Clear any existing tracking interval
    if (window.handVisualInterval) {
      clearInterval(window.handVisualInterval);
      window.handVisualInterval = null;
    }
  }

  hideHitbox() {
    if (this.trumpHandHitBox) {
      this.trumpHandHitBox.style.display = "none";
      this.trumpHandHitBox.style.pointerEvents = "none";
      this.isVisible = false;
      
      // Also hide the visual element
      if (this.trumpHandHitBoxVisual) {
        this.trumpHandHitBoxVisual.style.opacity = "0";
      }
    }
  }

  setupHoverEffects() {
    if (!this.trumpHandHitBox || !this.trumpHandHitBoxVisual) return;
    
    // Remove existing listeners
    this.removeHoverEffects();
    
    // Define new handlers using the effects controller
    const onMouseEnter = () => {
      if (window.trumpHandEffects) {
        window.trumpHandEffects.updateHoverState(true);
      }
    };
    
    const onMouseLeave = () => {
      if (window.trumpHandEffects) {
        window.trumpHandEffects.updateHoverState(false);
      }
    };
    
    // Add the event listeners
    this.trumpHandHitBox.addEventListener("mouseenter", onMouseEnter);
    this.trumpHandHitBox.addEventListener("mouseleave", onMouseLeave);
    
    // Store for later removal
    this._hoverHandlers = { enter: onMouseEnter, leave: onMouseLeave };
  }

  removeHoverEffects() {
    if (!this.trumpHandHitBox || !this._hoverHandlers) return;
    
    // Remove the stored event listeners
    this.trumpHandHitBox.removeEventListener("mouseenter", this._hoverHandlers.enter);
    this.trumpHandHitBox.removeEventListener("mouseleave", this._hoverHandlers.leave);
    
    // Clear the stored handlers
    this._hoverHandlers = null;
  }

  // Method to set reference to animations data
  setAnimationsData(animations) {
    this.animations = animations;
    logger.debug("hitbox", "Animations data set in HandHitboxManager");
  }

  // Method to update state and frame
  updateStateAndFrame(state, frameIndex) {
    this.currentState = state;
    this.currentFrame = frameIndex;
    this.updatePosition();
  }


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

  // Main method to update hitbox position
  updatePosition() {
    if (!this.trumpHandHitBox) {
      logger.error("hitbox", "Hand hitbox not found in updatePosition");
      return;
    }

    if (!this.animations) {
      logger.error("hitbox", "No animations data available in HandHitboxManager");
      return;
    }

    const grabAnimations = ["grabEastCanada", "grabWestCanada", "grabMexico", "grabGreenland"];
    const smackedAnimations = ["slapped"];
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

    const isMobile = window.DeviceUtils.isMobileDevice

    // Choose the right coordinates based on device type
    let coords = this.getCoordinatesForDevice(animation, isMobile);

    if (!coords) {
      logger.error("hitbox", `No coordinates for frame ${this.currentFrame} in ${this.currentState}`);
      this.hideHitbox();
      return;
    }

    // Position the hitbox
    this.positionHitbox(coords, isMobile);
  }

  // Helper method to get coordinates based on device type
  getCoordinatesForDevice(animation, isMobile) {
    // Always start with the base desktop coordinates
    if (!animation.handCoordinates || !animation.handCoordinates[this.currentFrame]) {
      logger.trace("hitbox", "No base coordinates found for frame");
      return null;
    }
    
    const baseCoords = animation.handCoordinates[this.currentFrame];
    logger.trace("hitbox", `Base coordinates: x:${baseCoords.x}, y:${baseCoords.y}, w:${baseCoords.width}, h:${baseCoords.height}`);
    
    // Get the current map element
    const mapElem = document.getElementById("map-background");
    if (!mapElem) {
      logger.error("hitbox", "Map element not found for scaling calculation");
      return baseCoords;
    }
    
    // Calculate current map scale compared to natural size
    const currentMapScale = mapElem.clientWidth / mapElem.naturalWidth;
    
    // This is your "reference" scale at which the desktop coordinates were calibrated
    // You may need to adjust this value based on your development environment
    const referenceDesktopScale = 1.0; // Starting with 1.0 assumes coordinates were calibrated at natural size
    
    // Calculate the adjustment needed
    const scaleAdjustment = currentMapScale / referenceDesktopScale;
    
    // For mobile, you might want to make hitboxes slightly larger for easier touch targets
    const touchFactor = isMobile ? 1.2 : 1.0;
    
    // Apply scaling
    const scaledCoords = {
      x: Math.round(baseCoords.x * scaleAdjustment),
      y: Math.round(baseCoords.y * scaleAdjustment),
      width: Math.round(baseCoords.width * scaleAdjustment * touchFactor),
      height: Math.round(baseCoords.height * scaleAdjustment * touchFactor)
    };
    
    logger.trace("hitbox", `Scaled coordinates (factor ${scaleAdjustment.toFixed(2)}): x:${scaledCoords.x}, y:${scaledCoords.y}, w:${scaledCoords.width}, h:${scaledCoords.height}`);
    return scaledCoords;
  }

scaleCoordinates(baseCoords, scaleFactor, touchFactor = 1.0) {
  return {
    x: Math.round(baseCoords.x * scaleFactor),
    y: Math.round(baseCoords.y * scaleFactor),
    width: Math.round(baseCoords.width * scaleFactor * touchFactor),
    height: Math.round(baseCoords.height * scaleFactor * touchFactor)
  };
}
 
positionHitbox(coords, isMobile) {
  // Position the hitbox
  this.trumpHandHitBox.style.position = "absolute";
  this.trumpHandHitBox.style.left = `${coords.x}px`;
  this.trumpHandHitBox.style.top = `${coords.y}px`;
  this.trumpHandHitBox.style.width = `${coords.width}px`;
  this.trumpHandHitBox.style.height = `${coords.height}px`;
  
  // Make it visible and clickable
  this.trumpHandHitBox.style.display = "block";
  this.trumpHandHitBox.style.pointerEvents = "all";
  this.isVisible = true;
  
  // Position the visual element directly, adjusting for the different coordinate space
  if (this.trumpHandHitBoxVisual) {
    // Get the sprite container's position relative to its parent
    const trumpContainer = document.getElementById("trump-sprite-container");
    const containerRect = trumpContainer.getBoundingClientRect();
    const parentRect = trumpContainer.parentElement.getBoundingClientRect();
    
    // Calculate the offset from sprite container to its parent
    const offsetX = containerRect.left - parentRect.left;
    const offsetY = containerRect.top - parentRect.top;
    
    // Apply sizing and account for the coordinate system difference
    const scaledWidth = coords.width * 0.55;
    const scaledHeight = coords.height * 0.55;
    const adjustedX = coords.x + offsetX + (coords.width - scaledWidth) / 2;
    const adjustedY = coords.y + offsetY + (coords.height - scaledHeight) / 2;
    
    this.trumpHandHitBoxVisual.style.position = "absolute";
    this.trumpHandHitBoxVisual.style.left = `${adjustedX}px`;
    this.trumpHandHitBoxVisual.style.top = `${adjustedY}px`;
    this.trumpHandHitBoxVisual.style.width = `${scaledWidth}px`;
    this.trumpHandHitBoxVisual.style.height = `${scaledHeight}px`;
    
    // After positioning, let the effects controller restore styling
    if (window.trumpHandEffects && this.trumpHandHitBox.classList.contains("hittable")) {
      window.trumpHandEffects.restoreVisualState();
    } else if (!this.trumpHandHitBoxVisual.classList.contains("hit") && 
              !this.trumpHandHitBoxVisual.classList.contains("grab-success")) {
      // Only basic visibility if no effects controller
      this.trumpHandHitBoxVisual.style.display = "block";
      this.trumpHandHitBoxVisual.style.opacity = "0.3";
    }
  }
  
  // Ensure hover effects are attached
  if (!this._hoverHandlers) {
    this.setupHoverEffects();
  }
  
  logger.trace("hitbox", `Positioned hand hitbox at (${coords.x}, ${coords.y}) with dimensions ${coords.width}x${coords.height}`);
}

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
    }
  }

  destroy() {
    // Remove event listeners
    this.removeHoverEffects();
    
    // Hide and detach elements
    this.hideHitbox();
    
    // Null out references to DOM elements
    this.trumpHandHitBox = null;
    this.trumpHandHitBoxVisual = null;
    
    logger.debug("hitbox", "HandHitboxManager destroyed");
  }

  // Method to set debug mode
  setDebugMode(enabled) {
    this.isDebugMode = enabled;

    if (this.isVisible) {
      this.updatePosition(); // This will update the visual style
    }

    logger.debug("hitbox", `Debug mode ${enabled ? "enabled" : "disabled"} for hitbox`);
  }

  // Get current hitbox position and dimensions
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
