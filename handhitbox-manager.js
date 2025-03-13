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

 // Add this method to HandHitboxManager class
setupHoverEffects() {
  if (!this.trumpHandHitBox || !this.trumpHandHitBoxVisual) return;
  
  const hitbox = this.trumpHandHitBox;
  const visual = this.trumpHandHitBoxVisual;
  
  // Remove existing listeners to prevent duplicates
  if (this._hoverHandlers) {
    hitbox.removeEventListener("mouseenter", this._hoverHandlers.enter);
    hitbox.removeEventListener("mouseleave", this._hoverHandlers.leave);
  }
  
  // Define event handlers
  const onMouseEnter = () => {
    if (hitbox.classList.contains("hittable")) {
      visual.style.transform = "scale(1.2)"; 
      visual.style.opacity = "0.4";
    }
  };
  
  const onMouseLeave = () => {
    if (hitbox.classList.contains("hittable")) {
      visual.style.transform = "scale(1.0)";
      visual.style.opacity = "0.1";
    }
  };
  
  // Add the event listeners
  hitbox.addEventListener("mouseenter", onMouseEnter);
  hitbox.addEventListener("mouseleave", onMouseLeave);
  
  // Store the handlers for potential later removal
  this._hoverHandlers = { enter: onMouseEnter, leave: onMouseLeave };
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



  
  // Add this method to HandHitboxManager class
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

    // Determine if we're on mobile
    const isMobile = this.isMobileDevice();

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

  // Helper method to determine if on mobile device
  isMobileDevice() {
    // Check if it's an actual mobile device by user agent
    const isMobileUserAgent = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Also check if the viewport is mobile-sized (e.g., less than 768px width)
    const isMobileViewport = window.innerWidth < 768;
    
    // Consider it mobile if either condition is true
    return isMobileUserAgent || isMobileViewport;
  }

  // Helper method to get coordinates based on device type
  getCoordinatesForDevice(animation, isMobile) {
    if (isMobile && animation.deviceCoordinates && animation.deviceCoordinates.mobile && animation.deviceCoordinates.mobile[this.currentFrame]) {
      // Use mobile-specific coordinates if available
      logger.trace("hitbox", "Using mobile-specific coordinates");
      return animation.deviceCoordinates.mobile[this.currentFrame];
    } else if (animation.handCoordinates && animation.handCoordinates[this.currentFrame]) {
      // Fall back to standard coordinates
      logger.trace("hitbox", "Using standard coordinates");
      return animation.handCoordinates[this.currentFrame];
    }

    return null;
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
      
      // Update visibility only if not in an animation state
      if (!this.trumpHandHitBoxVisual.classList.contains("hit") && 
          !this.trumpHandHitBoxVisual.classList.contains("grab-success")) {
        // Set appropriate opacity based on hitbox state
        if (this.trumpHandHitBox.classList.contains("hittable")) {
          this.trumpHandHitBoxVisual.style.display = "block";
          if (this.trumpHandHitBoxVisual.style.opacity === "0") {
            this.trumpHandHitBoxVisual.style.opacity = "0.1"; // Default opacity when hittable
          }
        } else {
          this.trumpHandHitBoxVisual.style.opacity = "0";
        }
      }
      
      // Ensure hover effects are attached
      if (!this._hoverHandlers) {
        this.setupHoverEffects();
      }
    }
    
    logger.trace("hitbox", `Positioned hand hitbox at (${coords.x}, ${coords.y}) with dimensions ${coords.width}x${coords.height}`);
  }

  // Hide the hitbox
  hideHitbox() {
    if (this.trumpHandHitBox) {
      this.trumpHandHitBox.style.display = "none";
      this.trumpHandHitBox.style.pointerEvents = "none";
      this.isVisible = false;
    }
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
