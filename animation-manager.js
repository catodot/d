class AnimationManager {
  constructor() {
    logger.info('animation', 'Creating Animation Manager');

    // Main DOM elements
    this.trumpSprite = document.getElementById("trump-sprite");
    this.handHitbox = document.getElementById("hand-hitbox");
    
    // Animation state tracking
    this.currentState = "idle";
    this.currentFrame = 0;
    this.animationInterval = null;
    this.onAnimationEnd = null;
    this.isLooping = true;
    this.isPaused = false;
    this.debug = false;
    this.loopCount = 0;
    this.maxLoops = 1;

    // Create an overlay element for slap animations
    this.createOverlayElement();

    // Define animations
    this.animations = {
      idle: {
        spriteSheet: "images/trump-idle-sprite.png",
        frameCount: 2,
        frameDuration: 400, 
        looping: true,
        maxLoops: 4, // Loop 4 times then end
        handVisible: false,
      },
      grabEastCanada: {
        spriteSheet: "images/trump-grab-east-canada-sprite.png",
        frameCount: 2,
        frameDuration: 250, // 200ms per frame = 400ms per cycle
        looping: true,
        maxLoops: 4, // Loop 4 times then end
        handVisible: true,
        handCoordinates: [
          { x: 430, y: 385, width: 90, height: 90 }, // Frame 0
          { x: 404, y: 383, width: 90, height: 90 }  // Frame 1
        ]
      },
      grabWestCanada: {
        spriteSheet: "images/trump-grab-west-canada-sprite.png",
        frameCount: 2,
        frameDuration: 250, // 200ms per frame = 400ms per cycle
        looping: true,
        maxLoops: 4, // Loop 4 times then end
        handVisible: true,
        handCoordinates: [
          { x: 122, y: 337, width: 90, height: 90 }, // Frame 0
          { x: 110, y: 316, width: 90, height: 90 } // Frame 1
        ]
      },
      grabGreenland: {
        spriteSheet: "images/trump-grab-greenland-sprite.png",
        frameCount: 2,
        frameDuration: 250, // 200ms per frame = 400ms per cycle
        looping: true,
        maxLoops: 4, // Loop 4 times then end
        handVisible: true,
        handCoordinates: [
          { x: 559, y: 222, width: 90, height: 90 }, // Frame 0
          { x: 540, y: 220, width: 90, height: 90 } // Frame 1
        ]
      },
      grabMexico: {
        spriteSheet: "images/trump-grab-mexico-sprite.png",
        frameCount: 2,
        frameDuration: 250, // 200ms per frame = 400ms per cycle
        looping: true,
        maxLoops: 4, // Loop 4 times then end
        handVisible: true,
        handCoordinates: [
          { x: 298, y: 598, width: 90, height: 90 }, // Frame 0
          { x: 278, y: 605, width: 90, height: 90 } // Frame 1
        ]
      },
      slapped: {
        spriteSheet: "images/trump-slapped-sprite.png",
        frameCount: 2,
        frameDuration: 250, // 200ms per frame = 400ms per cycle
        looping: true,
        maxLoops: 2, // Play twice before ending
        handVisible: false,
      },
      victory: {
        spriteSheet: "images/trump-idle-sprite.png",
        frameCount: 2,
        frameDuration: 250, // 200ms per frame = 400ms per cycle
        looping: true,
        maxLoops: 2, // Play twice before ending
        handVisible: false,
      },
      // Slap animations defined but played differently via overlay
      smackEastCanada: {
        spriteSheet: "images/smack-east-canada-sprite.png",
        frameCount: 5,
        frameDuration: 100, // 100ms per frame = slap plays faster than other animations
        looping: false,
        handVisible: false
      },
      smackWestCanada: {
        spriteSheet: "images/smack-west-canada-sprite.png",
        frameCount: 5,
        frameDuration: 100, // 100ms per frame = slap plays faster than other animations
        looping: false,
        handVisible: false
      },
      smackMexico: {
        spriteSheet: "images/smack-mexico-sprite.png",
        frameCount: 5,
        frameDuration: 100, // 100ms per frame = slap plays faster than other animations
        looping: false,
        handVisible: false
      },
      smackGreenland: {
        spriteSheet: "images/smack-greenland-sprite.png",
        frameCount: 5,
        frameDuration: 100, // 100ms per frame = slap plays faster than other animations
        looping: false,
        handVisible: false
      }
    };
  }

  init() {
    logger.info('animation', 'Initializing Animation Manager');
    // Start with idle animation
    this.changeState("idle");

    // Make sure the hand hitbox is properly initialized
    if (this.handHitbox) {
      this.handHitbox.style.pointerEvents = "all";
      logger.debug('animation', 'Hand hitbox initialized');
    } else {
      logger.error('animation', 'Hand hitbox element not found');
    }
  }

  createOverlayElement() {
    // Check if overlay already exists
    if (document.getElementById("smack-overlay")) return;
    
    const trumpContainer = document.getElementById("trump-sprite-container");
    if (!trumpContainer) {
      logger.error('animation', 'Trump container not found, cannot create smack overlay');
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
    logger.debug('animation', 'Smack overlay element created');
  }
  setGameSpeed(speedMultiplier) {
    // We don't adjust animation speeds directly anymore
    // Animation timings stay fixed for consistent animations
    logger.debug('animation', `Game speed set to ${speedMultiplier.toFixed(2)}x (animations remain at fixed speed)`);
    
    // We could store the value if needed for reference
    this.gameSpeed = speedMultiplier;
  }

  changeState(stateName, onEndCallback = null) {
    const timestamp = new Date().getTime();
  logger.debug('animation', `changeState to "${stateName}" at ${timestamp}ms`);
  
    // Don't change animation if requested state doesn't exist
    if (!this.animations[stateName]) {
      logger.error('animation', `Animation state '${stateName}' does not exist`);
      return;
    }
    
    // Log previous state details before changing
    if (this.currentState) {
      logger.debug('animation', `Changing from ${this.currentState} (frame ${this.currentFrame}, loop ${this.loopCount}/${this.maxLoops}) to ${stateName}`);
    } else {
      logger.debug('animation', `Setting initial animation state to ${stateName}`);
    }
    
    // Stop current animation
    this.stop();
    
    // Get animation data
    const animation = this.animations[stateName];
    this.currentState = stateName;
    this.currentFrame = 0;
    this.loopCount = 0;
    this.maxLoops = animation.maxLoops || 1;
    this.isLooping = animation.looping;
    this.onAnimationEnd = onEndCallback;
    
    // Update sprite image
    if (this.trumpSprite) {
      this.trumpSprite.style.backgroundImage = `url('${animation.spriteSheet}')`;
      logger.debug('animation', `Set sprite image to ${animation.spriteSheet}`);
    } else {
      logger.error('animation', 'Trump sprite element not found');
    }
    
    // Handle hand visibility
    if (animation.handVisible && animation.handCoordinates && this.handHitbox) {
      this.handHitbox.style.display = "block";
      this.updateHandPosition(0);
      logger.debug('animation', 'Hand hitbox made visible');
    } else if (this.handHitbox) {
      this.handHitbox.style.display = "none";
      logger.debug('animation', 'Hand hitbox hidden');
    }
    
    // Update initial frame
    this.updateFrame(0);
    
    // Ensure the first frame is displayed for the full duration
    // by adding a short delay before starting the animation interval
    setTimeout(() => {
      // Start animation loop
      this.play();
    }, 16); // Small delay to ensure frame rendering
  }

  
  updateFrame(frameIndex) {
    if (!this.trumpSprite) return;

    const animation = this.animations[this.currentState];
  if (!animation) return;

  // Add timestamp logging
  const timestamp = new Date().getTime();
  logger.debug('animation', `Frame update at ${timestamp}ms: ${this.currentState} frame ${frameIndex}, loop ${this.loopCount}`);

    // Ensure valid frame index
    frameIndex = Math.min(frameIndex, animation.frameCount - 1);

    // Calculate percentage for background position
    // If there are 2 frames, positions would be 0% and 100%
    const percentPosition = (frameIndex / (animation.frameCount - 1 || 1)) * 100;

    // Set background position in percentage
    this.trumpSprite.style.backgroundPosition = `${percentPosition}% 0%`;

    // Update hand position if needed
    if (animation.handVisible && animation.handCoordinates) {
      this.updateHandPosition(frameIndex);
    }
  }

  updateHandPosition(frameIndex) {
    const handHitbox = document.getElementById("hand-hitbox");
    if (!handHitbox) {
      logger.error('animation', 'Hand hitbox not found in updateHandPosition');
      return;
    }

    const grabAnimations = ["grabEastCanada", "grabWestCanada", "grabMexico", "grabGreenland"];
    const smackedAnimations = ["slapped"];
    const isDebugMode = document.body.classList.contains("debug-mode");

    // No hitbox for idle or after being smacked
    if (this.currentState === "idle" || smackedAnimations.includes(this.currentState)) {
      handHitbox.style.display = "none";
      handHitbox.style.pointerEvents = "none";
      logger.trace('animation', `Hiding hand hitbox for ${this.currentState} state`);
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
      logger.error('animation', `No hand coordinates for ${this.currentState}`);
      handHitbox.style.display = "none";
      handHitbox.style.pointerEvents = "none";
      return;
    }

    const coords = animation.handCoordinates[frameIndex];
    if (!coords) {
      logger.error('animation', `No coordinates for frame ${frameIndex} in ${this.currentState}`);
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

    // Show hitbox only in debug mode AND during grab animations
    if (isDebugMode) {
      handHitbox.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
      handHitbox.style.border = "2px solid red";
      handHitbox.style.display = "block";
    } else {
      handHitbox.style.backgroundColor = "transparent";
      handHitbox.style.border = "none";
      handHitbox.style.display = "block";
    }

    // Enable interaction during grab
    handHitbox.style.zIndex = "1000";
    handHitbox.style.pointerEvents = "all";

    logger.trace('animation', `Positioned hand hitbox at (${coords.x}, ${coords.y}) with dimensions ${coords.width}x${coords.height}`);
  }

 
  play() {
    // Clear any existing animation interval
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
  
    const animation = this.animations[this.currentState];
    if (!animation) {
      logger.error('animation', `No animation data found for state: ${this.currentState}`);
      return;
    }
  
    // If we have just one frame, or paused, don't start animation
    if (animation.frameCount <= 1 || this.isPaused) {
      if (animation.frameCount <= 1 && typeof this.onAnimationEnd === "function") {
        setTimeout(this.onAnimationEnd, animation.frameDuration || 300);
      }
      return;
    }
  
    logger.debug('animation', `Starting animation loop for ${this.currentState}: ${animation.frameCount} frames, max ${this.maxLoops} loops, ${animation.frameDuration}ms per frame`);
  
    // Use fixed interval timing for predictable animation
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
  
        logger.trace('animation', `Completed loop ${this.loopCount}/${this.maxLoops} for ${this.currentState}`);
  
        // Check if we've reached max loops for this animation
        if (!this.isLooping || (this.maxLoops > 0 && this.loopCount >= this.maxLoops)) {
          // Log completion before stopping
          logger.debug('animation', `Animation ${this.currentState} completed after ${this.loopCount} loops`);
          
          // Stop the animation
          this.stop();
          
          // Call completion callback if provided
          if (typeof this.onAnimationEnd === "function") {
            const timestamp = new Date().getTime();
            logger.debug('animation', `Animation end callback triggered at ${timestamp}ms for ${this.currentState}`);
            const callback = this.onAnimationEnd;
            setTimeout(() => callback(), 16);
          }
          return;
        }
      }
  
      // Trace frame changes
      logger.trace('animation', `${this.currentState}: frame ${this.currentFrame}/${animation.frameCount-1}, loop ${this.loopCount}/${this.maxLoops}`);
  
      // Update the displayed frame
      this.updateFrame(this.currentFrame);
    }, animation.frameDuration);
  }
  


  stop() {
    const stack = new Error().stack;
    const caller = stack.split('\n')[2];
    
    if (this.animationInterval) {
      logger.debug('animation', `Stopping animation interval for ${this.currentState} at frame ${this.currentFrame}, loop ${this.loopCount}/${this.maxLoops} - called from: ${caller}`);
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
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.play();
    }
  }

  playSmackAnimation(animationNameOrCountry, onCompleteCallback) {
    // Add detailed logging to see input values
    logger.info('animation', `playSmackAnimation called with: "${animationNameOrCountry}" (${typeof animationNameOrCountry})`);
    
    // Make sure we have a string before calling startsWith
    let smackAnimationName = '';
    
    if (typeof animationNameOrCountry === 'string') {
      // Only add 'smack' prefix if it's a country name without the prefix
      if (!animationNameOrCountry.startsWith('smack')) {
        // Get a consistent format by converting to lowercase first
        const lowerCountry = animationNameOrCountry.toLowerCase();
        logger.debug('animation', `Converted to lowercase: "${lowerCountry}"`);
        
        // Map country names to their correct animation names
        const countryToAnimation = {
          'eastcanada': 'smackEastCanada',
          'westcanada': 'smackWestCanada',
          'greenland': 'smackGreenland',
          'mexico': 'smackMexico'
        };
        
        // Log the lookup result
        logger.debug('animation', `Lookup result for "${lowerCountry}": ${countryToAnimation[lowerCountry] || 'not found'}`);
        
        if (countryToAnimation[lowerCountry]) {
          smackAnimationName = countryToAnimation[lowerCountry];
        } else {
          // Default handling for unmapped countries
          smackAnimationName = `smack${animationNameOrCountry.charAt(0).toUpperCase() + animationNameOrCountry.slice(1)}`;
          logger.debug('animation', `Using default animation name construction: ${smackAnimationName}`);
        }
      } else {
        smackAnimationName = animationNameOrCountry;
        logger.debug('animation', `Using provided animation name: ${smackAnimationName}`);
      }
    } else {
      // Not a string - log error and use fallback
      logger.error('animation', `Invalid animation or country name: ${animationNameOrCountry}`);
      smackAnimationName = 'smackMexico'; // Fallback to a default animation
    }
    
    logger.info('animation', `Final smack animation name: "${smackAnimationName}"`);
    
    // Check if animation exists (important check)
    if (!this.animations[smackAnimationName]) {
      logger.error('animation', `Smack animation "${smackAnimationName}" not found in available animations!`);
      logger.debug('animation', `Available animations: ${Object.keys(this.animations).join(', ')}`);
      
      // If animation doesn't exist, skip to the callback
      if (typeof onCompleteCallback === 'function') {
        onCompleteCallback();
      }
      return;
    }

    
    // Get animation data
    const smackAnimation = this.animations[smackAnimationName];
    
    // Get overlay element
    const overlay = document.getElementById("smack-overlay");
    if (!overlay) {
      logger.error('animation', 'Smack overlay element not found');
      if (typeof onCompleteCallback === 'function') {
        onCompleteCallback();
      }
      return;
    }
    
    // Set overlay background to smack animation
    overlay.style.backgroundImage = `url('${smackAnimation.spriteSheet}')`;
    overlay.style.display = "block";
    overlay.style.backgroundPosition = "0% 0%";
    
    // Track current frame and set up interval
    let currentFrame = 0;
    let hasTriggeredImpact = false;
    const impactFrame = 3; // Frame at which we'll trigger the callback
    
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
        logger.debug('animation', `Smack impact triggered at frame ${currentFrame}`);
        
        // Call callback to change Trump's animation to slapped
        if (typeof onCompleteCallback === 'function') {
          onCompleteCallback();
        }
      }
      
      // Check if animation is complete
      if (currentFrame >= smackAnimation.frameCount - 1) {
        clearInterval(overlayInterval);
        overlay.style.display = "none";
      }
    }, smackAnimation.frameDuration);
  }

  // Enable or disable debug mode
  setDebugMode(enabled) {
    this.debug = enabled;

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
  }

  // Manually set frame (useful for debugging)
  setFrame(frameIndex) {
    const animation = this.animations[this.currentState];
    if (!animation) return;

    // Ensure frame is in valid range
    frameIndex = Math.max(0, Math.min(frameIndex, animation.frameCount - 1));
    this.currentFrame = frameIndex;
    this.updateFrame(frameIndex);
  }

  // Get current animation data
  getCurrentAnimation() {
    return {
      name: this.currentState,
      frame: this.currentFrame,
      data: this.animations[this.currentState],
    };
  }

  // Add or update an animation
  addAnimation(name, data) {
    this.animations[name] = data;
  }
}

window.AnimationManager = AnimationManager;