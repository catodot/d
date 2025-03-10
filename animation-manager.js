class AnimationManager {
  constructor() {
    logger.info("animation", "Creating Animation Manager");

    // Main DOM elements
    this.trumpSprite = document.getElementById("trump-sprite");
    this.handHitbox = document.getElementById("hand-hitbox");

    // Animation state tracking
    this.currentState = "idle";
    this.currentFrame = 0;
    this.animationInterval = null;
    this.onAnimationEnd = null;
    this.loopCount = 0;
    this.isPaused = false;
    this.debug = false;
    
    // Speed control
  this.gameSpeed = 1.0;
  this.baseFrameDuration = 300; // Base duration for animations in ms
  
    
    // Create an overlay element for slap animations
    this.createOverlayElement();

    // Define animations
    this.animations = {
      idle: {
        spriteSheet: "images/trump-idle-sprite.png",
        frameCount: 2,
        loopCount: 3,
        handVisible: false,
      },
      grabEastCanada: {
        spriteSheet: "images/trump-grab-east-canada-sprite.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 514, y: 458, width: 90, height: 90 }, // Frame 0
          { x: 473, y: 442, width: 90, height: 90 }  // Frame 1
        ],
        deviceCoordinates: {
          mobile: [
            { x: 232, y: 209, width: 50, height: 50 }, // Frame 0
            { x: 218, y: 204, width: 50, height: 50 }, // Frame 1
          ],
        },
        smackAnimation: "smackEastCanada"
      },
      grabWestCanada: {
        spriteSheet: "images/trump-grab-west-canada-sprite.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 139, y: 408, width: 90, height: 90 }, // Frame 0
          { x: 137, y: 371, width: 90, height: 90 }, // Frame 1
        ],
        deviceCoordinates: {
          mobile: [
            { x: 60, y: 183, width: 50, height: 50 }, // Frame 0
            { x: 61, y: 172, width: 50, height: 50 }, // Frame 1
          ],
        },
        smackAnimation: "smackWestCanada"
      },
      grabGreenland: {
        spriteSheet: "images/trump-grab-greenland-sprite.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 659, y: 269, width: 90, height: 90 }, // Frame 0
          { x: 627, y: 275, width: 90, height: 90 }, // Frame 1
        ],
        deviceCoordinates: {
          mobile: [
            { x: 313, y: 131, width: 50, height: 50 }, // Frame 0
            { x: 292, y: 126, width: 50, height: 50 }, // Frame 1
          ],
        },
        smackAnimation: "smackGreenland"
      },
      grabMexico: {
        spriteSheet: "images/trump-grab-mexico-sprite.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 361, y: 692, width: 90, height: 90 }, // Frame 0
          { x: 314, y: 713, width: 90, height: 90 }, // Frame 1
        ],
        deviceCoordinates: {
          mobile: [
            { x: 168, y: 333, width: 50, height: 50 }, // Frame 0
            { x: 151, y: 337, width: 50, height: 50 }, // Frame 1
          ],
        },
        smackAnimation: "smackMexico"
      },
      slapped: {
        spriteSheet: "images/trump-slapped-sprite.png",
        frameCount: 2,
        loopCount: 2,
        handVisible: false,
      },
      victory: {
        spriteSheet: "images/trump-idle-sprite.png",
        frameCount: 2,
        loopCount: 2,
        handVisible: false,
      },
      // Slap animations defined but played differently via overlay
      smackEastCanada: {
        spriteSheet: "images/smack-east-canada-sprite.png",
        frameCount: 5,
        frameDuration: 120, // Faster animation (120ms per frame)
        handVisible: false,
      },
      smackWestCanada: {
        spriteSheet: "images/smack-west-canada-sprite.png",
        frameCount: 5,
        frameDuration: 120,
        handVisible: false,
      },
      smackMexico: {
        spriteSheet: "images/smack-mexico-sprite.png",
        frameCount: 5,
        frameDuration: 120,
        handVisible: false,
      },
      smackGreenland: {
        spriteSheet: "images/smack-greenland-sprite.png",
        frameCount: 5,
        frameDuration: 120,
        handVisible: false,
      },
    };
  }

  init() {
    logger.info("animation", "Initializing Animation Manager");
    // Start with idle animation
    this.changeState("idle");

    if (this.handHitbox) {
      this.handHitbox.style.pointerEvents = "all";
      logger.debug("animation", "Hand hitbox initialized");
    } else {
      logger.error("animation", "Hand hitbox element not found");
    }
  }

  createOverlayElement() {
    // Check if overlay already exists
    if (document.getElementById("smack-overlay")) return;

    const trumpContainer = document.getElementById("trump-sprite-container");
    if (!trumpContainer) {
      logger.error("animation", "Trump container not found, cannot create smack overlay");
      return;
    }

    // Create overlay element
    const overlay = document.createElement("div");
    overlay.id = "smack-overlay";
    overlay.style.position = "absolute";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundRepeat = "no-repeat";
    overlay.style.backgroundSize = "auto 100%";
    overlay.style.zIndex = "5"; // Above trump but below hand
    overlay.style.display = "none";

    trumpContainer.appendChild(overlay);
    logger.debug("animation", "Smack overlay element created");
  }

  // Add this method to the AnimationManager class
setFrame(frameIndex) {
  const animation = this.animations[this.currentState];
  if (!animation) return;

  // Ensure frame is in valid range
  frameIndex = Math.max(0, Math.min(frameIndex, animation.frameCount - 1));
  this.currentFrame = frameIndex;
  this.updateFrame(frameIndex);
  
  // Also update hand position if needed
  if (animation.handVisible && animation.handCoordinates) {
    this.updateHandPosition(frameIndex);
  }
}

  setGameSpeed(speedMultiplier) {
    // Update the game speed multiplier
    this.gameSpeed = speedMultiplier;
    logger.debug("animation", `Game speed set to ${speedMultiplier.toFixed(2)}x`);
  }

  changeState(stateName, onEndCallback = null) {
    logger.debug("animation", `changeState to "${stateName}"`);

    // Don't change animation if requested state doesn't exist
    if (!this.animations[stateName]) {
      logger.error("animation", `Animation state '${stateName}' does not exist`);
      return;
    }

    // Log previous state details before changing
    if (this.currentState) {
      logger.debug(
        "animation",
        `Changing from ${this.currentState} (frame ${this.currentFrame}, loop ${this.loopCount}) to ${stateName}`
      );
    }

    // Stop current animation
    this.stop();

    // Get animation data
    const animation = this.animations[stateName];
    this.currentState = stateName;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.onAnimationEnd = onEndCallback;

    // Update sprite image
    if (this.trumpSprite) {
      this.trumpSprite.style.backgroundImage = `url('${animation.spriteSheet}')`;
      logger.debug("animation", `Set sprite image to ${animation.spriteSheet}`);
    } else {
      logger.error("animation", "Trump sprite element not found");
    }

 // Handle hand visibility
 if (animation.handVisible && animation.handCoordinates && this.handHitbox) {
  this.handHitbox.style.display = "block";
  this.updateHandPosition(0);
  logger.debug("animation", "Hand hitbox made visible");
} else if (this.handHitbox) {
  this.handHitbox.style.display = "none";
  logger.debug("animation", "Hand hitbox hidden");
}


    // Update initial frame
    this.updateFrame(0);

    // Small delay to ensure first frame renders properly
    setTimeout(() => {
      // Start animation loop
      this.play();
    }, 16);
  }

  updateFrame(frameIndex) {
    if (!this.trumpSprite) return;

    const animation = this.animations[this.currentState];
    if (!animation) return;

    // Ensure valid frame index
    frameIndex = Math.min(frameIndex, animation.frameCount - 1);

    // Calculate percentage for background position
    // If there are 2 frames, positions would be 0% and 100%
    const percentPosition = (frameIndex / (animation.frameCount - 1 || 1)) * 100;

    // Set background position in percentage
    this.trumpSprite.style.backgroundPosition = `${percentPosition}% 0%`;

    // Update hand position if needed
    if (animation.handVisible && animation.handCoordinates) {
      this.updateHandPosition(this.currentFrame);
    }

    logger.trace(
      "animation",
      `${this.currentState}: frame ${frameIndex}/${animation.frameCount - 1}, loop ${this.loopCount}/${animation.loopCount}`
    );
  }

  // yours not working 
  // updateHandPosition(frameIndex) {
  //   const handHitbox = document.getElementById("hand-hitbox");
  //   if (!handHitbox) {
  //     logger.error("animation", "Hand hitbox not found in updateHandPosition");
  //     return;
  //   }

  //   const animation = this.animations[this.currentState];
  //   if (!animation || !animation.handCoordinates) {
  //     logger.error("animation", `No hand coordinates for ${this.currentState}`);
  //     this.handHitbox.style.display = "none";
  //     this.handHitbox.style.pointerEvents = "none";
  //     return;
  //   }

  //   // Determine if we're on mobile
  //   const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  //   // Choose the right coordinates based on device type
  //   let coords;
  //   if (isMobile && animation.deviceCoordinates && animation.deviceCoordinates.mobile && animation.deviceCoordinates.mobile[frameIndex]) {
  //     // Use mobile-specific coordinates if available
  //     coords = animation.deviceCoordinates.mobile[frameIndex];
  //     logger.trace("animation", "Using mobile-specific coordinates");
  //   } else {
  //     // Fall back to standard coordinates
  //     coords = animation.handCoordinates[frameIndex];
  //     logger.trace("animation", "Using standard coordinates");
  //   }

  //   if (!coords) {
  //     logger.error("animation", `No coordinates for frame ${frameIndex} in ${this.currentState}`);
  //     this.handHitbox.style.display = "none";
  //     this.handHitbox.style.pointerEvents = "none";
  //     return;
  //   }

  //   // Position the hitbox
  //   this.handHitbox.style.position = "absolute";
  //   this.handHitbox.style.left = `${coords.x}px`;
  //   this.handHitbox.style.top = `${coords.y}px`;
  //   this.handHitbox.style.width = `${coords.width}px`;
  //   this.handHitbox.style.height = `${coords.height}px`;

  //   // Debug visualization
  //   if (this.debug) {
  //     this.handHitbox.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
  //     this.handHitbox.style.border = "2px solid red";

  //     // Make debug hitbox more visible on mobile
  //     if (isMobile) {
  //       this.handHitbox.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
  //       this.handHitbox.style.border = "3px solid red";
  //     }
  //   } else {
  //     this.handHitbox.style.backgroundColor = "transparent";
  //     this.handHitbox.style.border = "none";
  //   }

  //   this.handHitbox.style.display = "block";

  //   // Enable interaction
  //   this.handHitbox.style.zIndex = "2000";
  //   this.handHitbox.style.pointerEvents = "all";

  //   logger.trace("animation", `Positioned hand hitbox at (${coords.x}, ${coords.y}) with dimensions ${coords.width}x${coords.height}`);
  // }





  updateHandPosition(frameIndex) {
    const handHitbox = document.getElementById("hand-hitbox");
    if (!handHitbox) {
      logger.error("animation", "Hand hitbox not found in updateHandPosition");
      return;
    }
  
    const grabAnimations = ["grabEastCanada", "grabWestCanada", "grabMexico", "grabGreenland"];
    const smackedAnimations = ["slapped"];
    const isDebugMode = document.body.classList.contains("debug-mode");
  
    // No hitbox for idle or after being smacked
    if (this.currentState === "idle" || smackedAnimations.includes(this.currentState)) {
      handHitbox.style.display = "none";
      handHitbox.style.pointerEvents = "none";
      logger.trace("animation", `Hiding hand hitbox for ${this.currentState} state`);
      return;
    }
  
    // Only continue for grab animations
    if (!grabAnimations.includes(this.currentState)) {
      handHitbox.style.display = "none";
      handHitbox.style.pointerEvents = "none";
      return;
    }
  
    const animation = this.animations[this.currentState];
    if (!animation || !animation.handCoordinates) {
      logger.error("animation", `No hand coordinates for ${this.currentState}`);
      handHitbox.style.display = "none";
      handHitbox.style.pointerEvents = "none";
      return;
    }
  
    // Determine if we're on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
    // Choose the right coordinates based on device type
    let coords;
    if (isMobile && animation.deviceCoordinates && animation.deviceCoordinates.mobile && animation.deviceCoordinates.mobile[frameIndex]) {
      // Use mobile-specific coordinates if available
      coords = animation.deviceCoordinates.mobile[frameIndex];
      logger.trace("animation", "Using mobile-specific coordinates");
    } else {
      // Fall back to standard coordinates
      coords = animation.handCoordinates[frameIndex];
      logger.trace("animation", "Using standard coordinates");
    }
  
    if (!coords) {
      logger.error("animation", `No coordinates for frame ${frameIndex} in ${this.currentState}`);
      handHitbox.style.display = "none";
      handHitbox.style.pointerEvents = "none";
      return;
    }
  
    // Position the hitbox
    handHitbox.style.position = "absolute";
    handHitbox.style.left = `${coords.x}px`;
    handHitbox.style.top = `${coords.y}px`;
    handHitbox.style.width = `${coords.width}px`;
    handHitbox.style.height = `${coords.height}px`;
  
    // Debug visualization
    if (isDebugMode) {
      handHitbox.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
      handHitbox.style.border = "2px solid red";
  
      // Make debug hitbox more visible on mobile
      if (isMobile) {
        handHitbox.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
        handHitbox.style.border = "3px solid red";
      }
    } else {
      handHitbox.style.backgroundColor = "transparent";
      handHitbox.style.border = "none";
    }
  
    handHitbox.style.display = "block";
  
    // Enable interaction
    handHitbox.style.zIndex = "2000";
    handHitbox.style.pointerEvents = "all";
  
    logger.trace("animation", `Positioned hand hitbox at (${coords.x}, ${coords.y}) with dimensions ${coords.width}x${coords.height}`);
  }

  // This goes inside AnimationManager class
playAnimationSequence(startState, onComplete = null) {
  // Play the start animation
  this.changeState(startState, () => {
    // When animation completes, call the provided callback
    if (typeof onComplete === "function") {
      onComplete();
    }
  });
}


play() {
  // Clear any existing animation interval
  if (this.animationInterval) {
    clearInterval(this.animationInterval);
    this.animationInterval = null;
  }

  const animation = this.animations[this.currentState];
  if (!animation) {
    logger.error("animation", `No animation data found for state: ${this.currentState}`);
    return;
  }

  // If paused, don't start animation
  if (this.isPaused) return;

  // Calculate frame duration based on game speed
  const frameDuration = animation.frameDuration ? 
    animation.frameDuration : // Use specific duration if provided
    Math.max(50, this.baseFrameDuration / this.gameSpeed); // Don't go below 50ms

  logger.debug(
    "animation",
    `Starting animation loop for ${this.currentState}: ${animation.frameCount} frames, max ${animation.loopCount} loops at ${frameDuration}ms per frame`
  );

  // Use interval timing with speed adjustment
  this.animationInterval = setInterval(() => {
    if (this.isPaused) return;

    // Advance frame
    this.currentFrame++;

    // Check for loop completion
    if (this.currentFrame >= animation.frameCount) {
      // Reset frame counter
      this.currentFrame = 0;
      
      // Increase loop counter
      this.loopCount++;
      
      // Check if we've reached max loops for this animation
      if (animation.loopCount && this.loopCount >= animation.loopCount) {
        // Log completion before stopping
        logger.debug("animation", `Animation ${this.currentState} completed after ${this.loopCount} loops`);

        // Stop the animation
        this.stop();

        // Call completion callback if provided
        if (typeof this.onAnimationEnd === "function") {
          const callback = this.onAnimationEnd;
          setTimeout(() => callback(), 16);
        }
        return;
      }
    }

    // Update the displayed frame
    this.updateFrame(this.currentFrame);
  }, frameDuration);
}

  stop() {
    if (this.animationInterval) {
      logger.debug(
        "animation",
        `Stopping animation interval for ${this.currentState} at frame ${this.currentFrame}, loop ${this.loopCount}`
      );
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  }

  pause() {
    this.isPaused = true;
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    logger.debug("animation", "Animation paused");
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.play();
      logger.debug("animation", "Animation resumed");
    }
  }

  playSmackAnimation(animationNameOrCountry, onCompleteCallback) {
    // Get the smack overlay element
    const overlay = document.getElementById("smack-overlay");
    if (!overlay) {
      logger.error("animation", "Smack overlay element not found");
      if (typeof onCompleteCallback === "function") {
        onCompleteCallback();
      }
      return;
    }

    // Determine the correct smack animation name
    let smackAnimationName = "";
    
    if (typeof animationNameOrCountry === "string") {
      // If it already starts with "smack", use it directly
      if (animationNameOrCountry.startsWith("smack")) {
        smackAnimationName = animationNameOrCountry;
      } else {
        // Map country names to their corresponding smack animations
        const countryToAnimation = {
          eastcanada: "smackEastCanada",
          westcanada: "smackWestCanada",
          greenland: "smackGreenland",
          mexico: "smackMexico",
          canada: "smackEastCanada", // Default for generic "canada"
        };
        
        const lowerCountry = animationNameOrCountry.toLowerCase();
        if (countryToAnimation[lowerCountry]) {
          smackAnimationName = countryToAnimation[lowerCountry];
        } else {
          // Construct a name if not found in the mapping
          smackAnimationName = `smack${animationNameOrCountry.charAt(0).toUpperCase() + animationNameOrCountry.slice(1)}`;
        }
      }
    } else {
      logger.error("animation", `Invalid animation or country name: ${animationNameOrCountry}`);
      smackAnimationName = "smackMexico"; // Fallback to a default animation
    }

    logger.info("animation", `Playing smack animation: "${smackAnimationName}"`);

    // Check if animation exists
    if (!this.animations[smackAnimationName]) {
      logger.error("animation", `Smack animation "${smackAnimationName}" not found in available animations!`);
      if (typeof onCompleteCallback === "function") {
        onCompleteCallback();
      }
      return;
    }

    // Get animation data
    const smackAnimation = this.animations[smackAnimationName];

    // Set overlay background to smack animation
    overlay.style.backgroundImage = `url('${smackAnimation.spriteSheet}')`;
    overlay.style.display = "block";
    overlay.style.backgroundPosition = "0% 0%";

    // Track current frame and set up interval
    let currentFrame = 0;
    let hasTriggeredImpact = false;
    const impactFrame = 3; // Frame at which we'll trigger the callback

    // Use the animation's own frameDuration or default to a fast value for smacks
    const frameDuration = smackAnimation.frameDuration || 120;

    // Create interval for overlay animation
    const overlayInterval = setInterval(() => {
      // Update frame
      currentFrame++;

      // Calculate progress through animation
      const percentPosition = (currentFrame / (smackAnimation.frameCount - 1)) * 100;
      overlay.style.backgroundPosition = `${percentPosition}% 0%`;

      // Check if we've reached impact frame but haven't triggered the impact yet
      if (!hasTriggeredImpact && currentFrame >= impactFrame) {
        hasTriggeredImpact = true;
        logger.debug("animation", `Smack impact triggered at frame ${currentFrame}`);

        // Call callback to change Trump's animation to slapped
        if (typeof onCompleteCallback === "function") {
          onCompleteCallback();
        }
      }

      // Check if animation is complete
      if (currentFrame >= smackAnimation.frameCount - 1) {
        clearInterval(overlayInterval);
        overlay.style.display = "none";
      }
    }, frameDuration);
  }

  // Enable or disable debug mode
  setDebugMode(enabled) {
    this.debug = enabled;
    
    // Update hand hitbox display if it exists
    if (this.handHitbox) {
      if (enabled) {
        this.handHitbox.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
        this.handHitbox.style.border = "2px solid red";
      } else {
        const animation = this.animations[this.currentState];
        if (!animation || !animation.handVisible) {
          this.handHitbox.style.backgroundColor = "transparent";
          this.handHitbox.style.border = "none";
        }
      }
    }
    
    logger.info("animation", `Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // setDebugMode(enabled) {
  //   this.debug = enabled;

  //   if (this.handHitbox) {
  //     if (enabled) {
  //       this.handHitbox.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
  //       this.handHitbox.style.border = "2px solid red";
  //     } else {
  //       const animation = this.animations[this.currentState];
  //       if (!animation || !animation.handVisible) {
  //         this.handHitbox.style.backgroundColor = "transparent";
  //         this.handHitbox.style.border = "none";
  //       }
  //     }
  //   }
  // }

  // Get current animation data
  getCurrentAnimation() {
    return {
      name: this.currentState,
      frame: this.currentFrame,
      data: this.animations[this.currentState],
    };
  }
}

window.AnimationManager = AnimationManager;
