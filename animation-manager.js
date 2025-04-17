class AnimationManager {
  constructor() {
    // Main DOM elements
    this.trumpSprite = document.getElementById("trump-sprite");

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

    this.currentSizeVariant = "normal"; // Track the current size globally
    this.sizeTransitionInProgress = false;

    // Create hand hitbox manager
    if (typeof HandHitboxManager === "function" && !this.handHitboxManager) {
      // Pass this.audioManager to HandHitboxManager constructor
      this.handHitboxManager = new HandHitboxManager(this.audioManager);
    }
    // Create an overlay element for slap animations
    this.createOverlayElement();

    // Define animations with priority values (1=essential, 2=important, 3=optional)
    this.animations = {
      idle: {
        spriteSheet: "images/trump-idle-sprite.png",
        frameCount: 2,
        loopCount: Infinity,
        handVisible: false,
        priority: 1, // Highest priority - needed immediately
      },

      grabEastCanada: {
        spriteSheet: "images/trump-grab-east-canada-sprite.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1608, y: 1439, width: 737, height: 737 }, // Frame 0
          { x: 1469, y: 1344, width: 737, height: 737 }, // Frame 1
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackEastCanada",
        priority: 2,
      },

      grabWestCanada: {
        spriteSheet: "images/trump-grab-west-canada-sprite.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 286, y: 1248, width: 737, height: 737 }, // Frame 0
          { x: 282, y: 1140, width: 737, height: 737 }, // Frame 1
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackWestCanada",
        priority: 2,
      },

      grabGreenland: {
        spriteSheet: "images/trump-grab-greenland-sprite.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 2163, y: 754, width: 737, height: 737 }, // Frame 0
          { x: 2072, y: 789, width: 737, height: 737 }, // Frame 1
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackGreenland",
        priority: 2,
      },

      grabMexico: {
        spriteSheet: "images/trump-grab-mexico-sprite.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1118, y: 2319, width: 737, height: 737 }, // Frame 0
          { x: 906, y: 2445, width: 737, height: 737 }, // Frame 1
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackMexico",
        priority: 2,
      },

      slapped: {
        spriteSheet: "images/trump-slapped-sprite.png",
        frameCount: 2,
        loopCount: 4, // Increased from 2 for better visibility
        handVisible: false,
        priority: 2,
      },
      victory: {
        spriteSheet: "images/trump-happy-sprite.png",
        frameCount: 2,
        loopCount: 4, // Increased from 2 for better visibility
        handVisible: false,
        priority: 2,
      },

      // Smack animations
      smackEastCanada: {
        spriteSheet: "images/smack-east-canada-sprite.png",
        frameCount: 5,
        frameDuration: 120, // Faster animation (120ms per frame)
        handVisible: false,
        priority: 3,
      },
      smackWestCanada: {
        spriteSheet: "images/smack-west-canada-sprite.png",
        frameCount: 5,
        frameDuration: 120,
        handVisible: false,
        priority: 3,
      },
      smackMexico: {
        spriteSheet: "images/smack-mexico-sprite.png",
        frameCount: 5,
        frameDuration: 120,
        handVisible: false,
        priority: 3,
      },
      smackGreenland: {
        spriteSheet: "images/smack-greenland-sprite.png",
        frameCount: 5,
        frameDuration: 120,
        handVisible: false,
        priority: 3,
      },
      muskAppearance: {
        spriteSheet: "images/musk.png",
        frameCount: 2, // If it's a single image
        loopCount: 4, // Play once
        handVisible: false,
        priority: 3,
      },

      // Small size variants
      idleSmall: {
        spriteSheet: "images/trump-idle-sprite-small.png",
        frameCount: 2,
        loopCount: Infinity,
        handVisible: false,
        priority: 3,
      },
      grabEastCanadaSmall: {
        spriteSheet: "images/trump-grab-east-canada-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1608, y: 1439, width: 737, height: 737 },
          { x: 1469, y: 1344, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackEastCanada",
        priority: 3,
      },
      grabWestCanadaSmall: {
        spriteSheet: "images/trump-grab-west-canada-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 286, y: 1248, width: 737, height: 737 },
          { x: 282, y: 1140, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackWestCanada",
        priority: 3,
      },
      grabGreenlandSmall: {
        spriteSheet: "images/trump-grab-greenland-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 2163, y: 754, width: 737, height: 737 },
          { x: 2072, y: 789, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackGreenland",
        priority: 3,
      },
      grabMexicoSmall: {
        spriteSheet: "images/trump-grab-mexico-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1118, y: 2319, width: 737, height: 737 },
          { x: 906, y: 2445, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackMexico",
        priority: 3,
      },
      slappedSmall: {
        spriteSheet: "images/trump-slapped-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3,
      },
      victorySmall: {
        spriteSheet: "images/trump-happy-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3,
      },

      // Smaller size variants
      idleSmaller: {
        spriteSheet: "images/trump-idle-sprite-smaller.png",
        frameCount: 2,
        loopCount: Infinity,
        handVisible: false,
        priority: 3,
      },
      grabEastCanadaSmaller: {
        spriteSheet: "images/trump-grab-east-canada-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1608, y: 1439, width: 737, height: 737 },
          { x: 1469, y: 1344, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackEastCanada",
        priority: 3,
      },
      grabWestCanadaSmaller: {
        spriteSheet: "images/trump-grab-west-canada-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 286, y: 1248, width: 737, height: 737 },
          { x: 282, y: 1140, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackWestCanada",
        priority: 3,
      },
      grabGreenlandSmaller: {
        spriteSheet: "images/trump-grab-greenland-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 2163, y: 754, width: 737, height: 737 },
          { x: 2072, y: 789, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackGreenland",
        priority: 3,
      },
      grabMexicoSmaller: {
        spriteSheet: "images/trump-grab-mexico-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1118, y: 2319, width: 737, height: 737 },
          { x: 906, y: 2445, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackMexico",
        priority: 3,
      },
      slappedSmaller: {
        spriteSheet: "images/trump-slapped-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3,
      },
      victorySmaller: {
        spriteSheet: "images/trump-happy-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3,
      },

      // Smallest size variants
      idleSmallest: {
        spriteSheet: "images/trump-idle-sprite-smallest.png",
        frameCount: 2,
        loopCount: Infinity,
        handVisible: false,
        priority: 3,
      },
      grabEastCanadaSmallest: {
        spriteSheet: "images/trump-grab-east-canada-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1608, y: 1439, width: 737, height: 737 },
          { x: 1469, y: 1344, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackEastCanada",
        priority: 3,
      },
      grabWestCanadaSmallest: {
        spriteSheet: "images/trump-grab-west-canada-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 286, y: 1248, width: 737, height: 737 },
          { x: 282, y: 1140, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackWestCanada",
        priority: 3,
      },
      grabGreenlandSmallest: {
        spriteSheet: "images/trump-grab-greenland-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 2163, y: 754, width: 737, height: 737 },
          { x: 2072, y: 789, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackGreenland",
        priority: 3,
      },
      grabMexicoSmallest: {
        spriteSheet: "images/trump-grab-mexico-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1118, y: 2319, width: 737, height: 737 },
          { x: 906, y: 2445, width: 737, height: 737 },
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackMexico",
        priority: 3,
      },
      slappedSmallest: {
        spriteSheet: "images/trump-slapped-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3,
      },
      victorySmallest: {
        spriteSheet: "images/trump-happy-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3,
      },

      shrinkDefeat: {
        spriteSheet: "images/trump-happy-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3,
      },
    };

    // Image loading tracking
    this.loadedSprites = new Set();
    this.loadingSprites = new Map(); // Map to track loading promises

    this.stateQueue = [];
    this.isTransitioning = false;

    // Pass animations data to hand hitbox manager
    this.handHitboxManager.setAnimationsData(this.animations);
  }

  init() {
    // Start with progressive loading
    // 1. Load only highest priority animations (idle)
    this._loadAnimationsByPriority(1).then(() => {
      // Start with idle animation once it's loaded
      this.changeState("idle");

      // 2. Load important animations in background
      this._loadAnimationsByPriority(2);

      // 3. After a delay, load lower priority animations
      setTimeout(() => {
        this._loadAnimationsByPriority(3);
      }, 3000); // 3 second delay before loading optional assets
    });
  }

  /**
   * Load animations by priority level
   * @param {number} priorityLevel - Priority level (1=essential, 2=important, 3=optional)
   * @returns {Promise} - Resolves when all animations at this priority level are loaded
   */
  _loadAnimationsByPriority(priorityLevel) {
    const spritesToLoad = [];

    // Find all animations with the specified priority
    Object.keys(this.animations).forEach((animName) => {
      const anim = this.animations[animName];
      if (anim && anim.priority === priorityLevel && !this.loadedSprites.has(anim.spriteSheet) && !this.loadingSprites.has(anim.spriteSheet)) {
        spritesToLoad.push(anim.spriteSheet);
      }
    });

    return this._loadSprites(spritesToLoad);
  }

  /**
   * Load specific animations by name
   * @param {Array} animationNames - Array of animation names to load
   * @returns {Promise} - Resolves when all specified animations are loaded
   */
  _loadSpecificAnimations(animationNames) {
    const spritesToLoad = [];

    animationNames.forEach((animName) => {
      if (
        this.animations[animName] &&
        !this.loadedSprites.has(this.animations[animName].spriteSheet) &&
        !this.loadingSprites.has(this.animations[animName].spriteSheet)
      ) {
        spritesToLoad.push(this.animations[animName].spriteSheet);
      }
    });

    return this._loadSprites(spritesToLoad);
  }

  /**
   * Load specific sprite sheets
   * @param {Array} spriteUrls - Array of sprite URLs to load
   * @returns {Promise} - Resolves when all sprites are loaded
   */
  _loadSprites(spriteUrls) {
    const loadingPromises = [];

    spriteUrls.forEach((src) => {
      // Skip if already loaded
      if (this.loadedSprites.has(src)) {
        return;
      }

      // Reuse existing promise if already loading
      if (this.loadingSprites.has(src)) {
        loadingPromises.push(this.loadingSprites.get(src));
        return;
      }

      // Create new loading promise
      const loadPromise = new Promise((resolveLoad) => {
        const img = new Image();

        img.onload = () => {
          this.loadedSprites.add(src);
          this.loadingSprites.delete(src);
          resolveLoad(true);
        };

        img.onerror = () => {
          console.warn(`Failed to load sprite: ${src}`);
          this.loadingSprites.delete(src);
          resolveLoad(false); // Resolve with false to indicate failure
        };

        img.src = src;
      });

      // Store and track the promise
      this.loadingSprites.set(src, loadPromise);
      loadingPromises.push(loadPromise);
    });

    return Promise.all(loadingPromises);
  }

  /**
   * Check if an animation's sprite sheet is loaded
   * @param {string} animationName - Name of the animation to check
   * @returns {boolean} - True if loaded, false otherwise
   */
  isAnimationLoaded(animationName) {
    if (!this.animations[animationName]) return false;
    return this.loadedSprites.has(this.animations[animationName].spriteSheet);
  }

  createOverlayElement() {
    // Check if overlay already exists
    if (document.getElementById("smack-overlay")) return;

    const trumpContainer = document.getElementById("trump-sprite-container");
    if (!trumpContainer) {
      console.error("Trump container not found, cannot create smack overlay");
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
    overlay.style.zIndex = "3"; // Above trump but below hand
    overlay.style.display = "none";

    trumpContainer.appendChild(overlay);
  }

  // Method to set a specific frame
  setFrame(frameIndex) {
    const animation = this.animations[this.currentState];
    if (!animation) return;

    // Ensure frame is in valid range
    frameIndex = Math.max(0, Math.min(frameIndex, animation.frameCount - 1));
    this.currentFrame = frameIndex;
    this.updateFrame(frameIndex);
  }

  setGameSpeed(speedMultiplier) {
    // Update the game speed multiplier
    this.gameSpeed = speedMultiplier;
  }

  // new

  queueStateChange(stateName, onEndCallback = null) {
    this.stateQueue.push({ stateName, onEndCallback });
    this.processStateQueue();
  }

  processStateQueue() {
    // If already transitioning or queue is empty, do nothing
    if (this.isTransitioning || this.stateQueue.length === 0) return;

    // Get the next state change
    const { stateName, onEndCallback } = this.stateQueue.shift();

    // Mark as transitioning
    this.isTransitioning = true;

    // Ensure sprite stays visible during transition
    if (this.trumpSprite) {
      this.trumpSprite.style.display = "block";
      this.trumpSprite.style.visibility = "visible";
    }

    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
      // Update actual state
      this._updateStateDirectly(stateName, onEndCallback);

      // Mark transition as complete
      this.isTransitioning = false;

      // Process next queued state change if any
      this.processStateQueue();
    });
  }

  // Helper method to handle the actual state change
  _updateStateDirectly(stateName, onEndCallback) {
    // Determine state name based on current size if needed
    const currentSize = window.freedomManager?.getTrumpSize()?.size || "normal";
    let finalStateName = stateName;

    if (currentSize !== "normal") {
      const sizedStateName = `${stateName}${currentSize.charAt(0).toUpperCase() + currentSize.slice(1)}`;
      if (this.animations[sizedStateName]) {
        finalStateName = sizedStateName;
      }
    }

    // Update state directly
    if (this.animations[finalStateName]) {
      this.currentState = finalStateName;
      this.currentFrame = 0;
      this.loopCount = 0;
      this.onAnimationEnd = onEndCallback;

      // Update sprite image
      if (this.trumpSprite) {
        this.trumpSprite.style.backgroundImage = `url('${this.animations[finalStateName].spriteSheet}')`;
      }

      // Update initial frame
      this.updateFrame(0);

      // CRUCIAL: Restart the animation
      this.play();
    }
  }

  changeState(stateName, onEndCallback = null) {
    const currentSize = window.freedomManager?.getTrumpSize()?.size || "normal";

    // Adjust the stateName for the current size if needed
    if (currentSize !== "normal") {
      const sizedStateName = `${stateName}${currentSize.charAt(0).toUpperCase() + currentSize.slice(1)}`;
      if (this.animations[sizedStateName]) {
        stateName = sizedStateName;
      }
    }

    // Check if state exists
    if (!this.animations[stateName]) {
      console.warn(`Animation state not found: ${stateName}`);
      return;
    }
    const animation = this.animations[stateName];
    const spriteSheet = animation.spriteSheet;

    // Fade out current animation
    if (this.trumpSprite) {
      // Use small timeout to allow transition
      setTimeout(() => {
        // Load if needed
        if (!this.loadedSprites.has(spriteSheet)) {
          this._loadSprites([spriteSheet]).then(() => {
            this.queueStateChange(stateName, onEndCallback);
          });
        } else {
          // Change immediately if loaded
          this.queueStateChange(stateName, onEndCallback);
        }
      }, 50); // Brief fade transition
    } else {
      // Direct change if no sprite element
      this.queueStateChange(stateName, onEndCallback);
    }
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

// Temporarily enlarge sprite for slapped and victory animations
if (window.DeviceUtils.isMobileDevice && this.currentState.includes('slapped') || window.DeviceUtils.isMobileDevice && this.currentState.includes('victory')) {
  this.trumpSprite.classList.add('enlarged-trump-sprite');
} else {
  this.trumpSprite.classList.remove('enlarged-trump-sprite');
}


    // Update hand position if needed
    if (animation.handVisible) {
      this.handHitboxManager.updateStateAndFrame(this.currentState, frameIndex);
    }

    if (this.handHitboxManager) {
      const hitboxInfo = this.handHitboxManager.getHitboxInfo();
    }
  }

  async playAnimationSequence(startState, onComplete = null) {
    const animation = this.animations[startState];
    if (!animation) {
      console.warn(`Animation ${startState} not found for sequence`);
      if (onComplete) onComplete();
      return;
    }

    // Load the animation if needed
    if (!this.loadedSprites.has(animation.spriteSheet)) {
      await this._loadSprites([animation.spriteSheet]);
    }

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

    // Clear any existing animation frame
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    const animation = this.animations[this.currentState];
    if (!animation) {
      console.error(`No animation data found for state: ${this.currentState}`);
      return;
    }

    // If paused, don't start animation
    if (this.isPaused) return;

    // Calculate frame duration based on game speed
    let frameDuration;
    if (animation.frameDuration) {
      frameDuration = Math.max(50, animation.frameDuration / this.gameSpeed);
    } else {
      frameDuration = Math.max(50, this.baseFrameDuration / this.gameSpeed);
    }

    // For mobile, apply minimum frame duration
    if (window.DeviceUtils && window.DeviceUtils.isMobileDevice) {
      frameDuration = Math.max(frameDuration, 80);
    }

    // Track time for frame-based animation
    let lastFrameTime = performance.now();
    let accumulatedTime = 0;

    // Animation loop using requestAnimationFrame
    const animateFrame = (timestamp) => {
      if (this.isPaused) {
        // this.animationFrame = requestAnimationFrame(animateFrame);
        return;
      }

      // Calculate elapsed time
      const elapsed = timestamp - lastFrameTime;
      lastFrameTime = timestamp;

      // Accumulate time
      accumulatedTime += elapsed;

      // Check if it's time for a new frame
      if (accumulatedTime >= frameDuration) {
        accumulatedTime = 0;

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
      }

      // Continue the animation loop
      this.animationFrame = requestAnimationFrame(animateFrame);
    };

    // Start the animation loop
    if (!this.isPaused) {
      this.animationFrame = requestAnimationFrame(animateFrame);
    }
  }

  stop() {
    // Clear timers but DON'T change sprite visibility
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Make sure sprite stays visible
    if (this.trumpSprite) {
      this.trumpSprite.style.display = "block";
      this.trumpSprite.style.visibility = "visible";
    }
  }




  createFlagAnimation(countryId, position, scale = 1.0) {
    const flagElement = document.createElement("div");
    flagElement.id = `${countryId}-trump-flag`;
    flagElement.className = "trump-flag-animation";
    // flagElement.setAttribute('data-animation-id', animationId);

    
    // Style the flag
    Object.assign(flagElement.style, {
      position: "absolute",
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${400 * scale}px`,
      height: `${400 * scale}px`,
      backgroundImage: "url('images/trump-flag.png')",
      backgroundSize: "400% 100%", // 4 frames side by side
      backgroundPosition: "0% 0%",
      backgroundRepeat: "no-repeat",
      zIndex: "1", // Above country overlay
      transform: `rotate(${-5 + Math.random() * 90}deg)`, // Slight random rotation
      transformOrigin: "bottom center",
      filter: "drop-shadow(2px 2px 2px rgba(0,0,0,0.5))",
    });
    
    // Get the game container
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.appendChild(flagElement);
    }
    
    // Create and return the animation
    const animationId = this.createSpriteAnimation({
      element: flagElement,
      frameCount: 4,
      frameDuration: 500 + Math.random() * 300, // Random variation in timing
      loop: true,
      id: `flag-${countryId}-${Date.now()}`,
    });
    
    return {
      element: flagElement,
      animationId: animationId
    };
  }


  removeAllFlags() {
    document.querySelectorAll('.trump-flag-animation').forEach(flag => {
      const animId = flag.getAttribute('data-animation-id');
      if (animId) {
        this.stopSpriteAnimation(animId);
      }
      if (flag.parentNode) {
        flag.parentNode.removeChild(flag);
      }
    });
  }

  destroy() {
    this.stop();
    if (this.handHitboxManager && typeof this.handHitboxManager.destroy === "function") {
      this.handHitboxManager.destroy();
    }

    // Clear all references
    this.trumpSprite = null;
    this.animations = null;
    this.currentState = "";
    this.onAnimationEnd = null;

    this.removeAllFlags;

    // Remove overlay
    const overlay = document.getElementById("smack-overlay");
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    if (this.spriteAnimations) {
      Object.keys(this.spriteAnimations).forEach((id) => {
        clearInterval(this.spriteAnimations[id].interval);
      });
      this.spriteAnimations = {};
    }
  }

  changeSizeState(newSize) {
    // Don't process if we're already at this size
    if (this.currentSizeVariant === newSize) {
      return;
    }

    // Get base state name without any size suffix
    const baseState = this.currentState.replace(/(Small|Smaller|Smallest)$/, "");

    // Construct new state name keeping the same animation type, just with new size
    const newStateName = newSize === "normal" ? baseState : `${baseState}${newSize.charAt(0).toUpperCase() + newSize.slice(1)}`;

    // CRITICAL: Verify the exact animation state exists for this size
    if (!this.animations[newStateName]) {
      console.error(`[SIZE TRANSITION] Missing animation state: ${newStateName}`);
      return;
    }

    // Store current size before changing
    this.currentSizeVariant = newSize;

    // Update sprite sheet and record state change
    if (this.trumpSprite) {
      this.trumpSprite.style.backgroundImage = `url('${this.animations[newStateName].spriteSheet}')`;

      // Apply backup state name if needed
      if (this.handHitboxManager) {
        // Signal to hitbox manager that size has changed
        if (typeof this.handHitboxManager.handleSizeChange === "function") {
          this.handHitboxManager.handleSizeChange(newSize);
        }
      }
    }
  }

  async preloadNextSize(targetSize) {
    // Preload the size variant before actually switching to it
    await this.preloadSizeVariant(targetSize);

    return true; // Loading complete
  }
  // Enhance pause and resume with logging
  pause() {
    this.isPaused = true;

    // Store current animation state for restoration
    this._pausedState = {
      state: this.currentState,
      frame: this.currentFrame,
      loopCount: this.loopCount,
      callback: this.onAnimationEnd,
    };

    // Stop animation loops but don't reset state
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  resume() {
    if (!this.isPaused) {
      return;
    }

    this.isPaused = false;

    // If we have saved state, restore it
    if (this._pausedState) {
      // If it's a smack animation, special handling
      if (this._pausedState.state && this._pausedState.state.startsWith("smack")) {
        // For smack animations, we need to restart from beginning
        this.changeState(this._pausedState.state, this._pausedState.callback);
      } else {
        // For regular animations, we can just restart the animation loop
        // with the current state and frame
        this.currentState = this._pausedState.state;
        this.currentFrame = this._pausedState.frame;
        this.loopCount = this._pausedState.loopCount;
        this.onAnimationEnd = this._pausedState.callback;

        // Update the frame immediately to ensure visual consistency
        this.updateFrame(this.currentFrame);

        // Restart the animation
        this.play();
      }

      // Clear the saved state
      this._pausedState = null;
    } else {
      // If no saved state, just restart current animation
      this.play();
    }
  }

  /**
   * Play smack animation with lazy loading
   * @param {string} animationNameOrCountry - Name of animation or country
   * @param {function} onCompleteCallback - Callback when animation completes
   */
  async playSmackAnimation(animationNameOrCountry, onCompleteCallback) {
    // Get the smack overlay element
    const overlay = document.getElementById("smack-overlay");
    if (!overlay) {
      console.error("Smack overlay element not found");
      if (typeof onCompleteCallback === "function") {
        onCompleteCallback();
      }
      return;
    }

    // Determine the correct smack animation name (keep your existing logic)
    let smackAnimationName = this._determineSmackAnimationName(animationNameOrCountry);

    // Check if animation exists
    if (!this.animations[smackAnimationName]) {
      console.error(`Smack animation "${smackAnimationName}" not found in available animations!`);
      if (typeof onCompleteCallback === "function") {
        onCompleteCallback();
      }
      return;
    }

    // Get animation data
    const smackAnimation = this.animations[smackAnimationName];

    // Lazy load the sprite if it's not already loaded
    if (!this.loadedSprites.has(smackAnimation.spriteSheet)) {
      this._loadSprites([smackAnimation.spriteSheet]).catch((error) => {
        console.error(`Failed to load smack sprite: ${smackAnimation.spriteSheet}`, error);
      });
    }

    // Precompute frame positions for efficiency
    const framePositions = Array.from({ length: smackAnimation.frameCount }, (_, i) => `${(i / (smackAnimation.frameCount - 1)) * 100}%`);

    // Use the animation's frame duration or default, adjusted for game speed
    const frameDuration = Math.max(
      50, // Minimum frame duration
      (smackAnimation.frameDuration || 120) / this.gameSpeed
    );

    // Track current frame and impact state
    let currentFrame = 0;
    let hasTriggeredImpact = false;
    const impactFrame = 3; // Frame at which we'll trigger the callback

    // Use requestAnimationFrame for smoother rendering
    const updateFrame = (timestamp) => {
      // Update frame
      currentFrame++;

      // Update background position using precomputed positions
      overlay.style.backgroundPosition = `${framePositions[currentFrame]} 0%`;

      // Check impact frame
      if (!hasTriggeredImpact && currentFrame >= impactFrame) {
        hasTriggeredImpact = true;
        if (typeof onCompleteCallback === "function") {
          onCompleteCallback();
        }
      }

      // Check if animation is complete
      if (currentFrame >= smackAnimation.frameCount - 1) {
        overlay.style.display = "none";
        return;
      }

      // Schedule next frame with adaptive timing
      setTimeout(() => requestAnimationFrame(updateFrame), frameDuration);
    };

    // Set up overlay
    overlay.style.backgroundImage = `url('${smackAnimation.spriteSheet}')`;
    overlay.style.display = "block";
    overlay.style.backgroundPosition = "0% 0%";

    // Start animation
    requestAnimationFrame(updateFrame);
  }

  // Helper method to determine smack animation name (keep your existing logic)
  _determineSmackAnimationName(animationNameOrCountry) {
    if (typeof animationNameOrCountry === "string") {
      if (animationNameOrCountry.startsWith("smack")) {
        return animationNameOrCountry;
      }

      const countryToAnimation = {
        eastcanada: "smackEastCanada",
        westcanada: "smackWestCanada",
        greenland: "smackGreenland",
        mexico: "smackMexico",
        canada: "smackEastCanada", // Default for generic "canada"
      };

      const lowerCountry = animationNameOrCountry.toLowerCase();
      return countryToAnimation[lowerCountry] || `smack${animationNameOrCountry.charAt(0).toUpperCase() + animationNameOrCountry.slice(1)}`;
    }

    return "smackMexico"; // Fallback
  }

  // Enable or disable debug mode
  setDebugMode(enabled) {
    this.debug = enabled;
    if (this.handHitboxManager && typeof this.handHitboxManager.setDebugMode === "function") {
      this.handHitboxManager.setDebugMode(enabled);
    }
  }

  // Get current animation data
  getCurrentAnimation() {
    return {
      name: this.currentState,
      frame: this.currentFrame,
      data: this.animations[this.currentState],
      hitbox: this.handHitboxManager ? this.handHitboxManager.getHitboxInfo() : null,
    };
  }

  // Get current hitbox information
  getHitboxInfo() {
    return this.handHitboxManager ? this.handHitboxManager.getHitboxInfo() : null;
  }

  reset() {
    if (this.trumpSprite) {
      this.trumpSprite.style.display = "block"; // Make sure Trump is visible again
    }
    this.changeState("idle"); // Return to normal idle state
  }

  preloadSizeVariant(size) {
    const suffix = size === "normal" ? "" : size;
    const animationsToLoad = [];

    // Find all animations with this size suffix
    Object.keys(this.animations).forEach((animName) => {
      if ((suffix === "" && !animName.match(/Small|Smaller|Smallest/)) || (suffix !== "" && animName.endsWith(suffix))) {
        if (!this.loadedSprites.has(this.animations[animName].spriteSheet)) {
          animationsToLoad.push(animName);
        }
      }
    });

    console.log(`Preloading ${animationsToLoad.length} animations for size variant: ${size}`);
    return this._loadSpecificAnimations(animationsToLoad);
  }

  createSpriteAnimation(options) {
    const {
      element, // DOM element to animate
      frameCount, // Number of frames in the sprite
      frameDuration, // Duration per frame
      loop = true, // Whether to loop the animation
      onComplete, // Callback when animation completes
      id, // Unique identifier for this animation
      customUpdater, // Custom update function (optional)
    } = options;

    if (!element && !customUpdater) {
      console.error("Cannot create sprite animation: No element provided");
      return null;
    }

    // Use a unique ID for tracking this animation
    const animationId = id || `sprite-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Clear any existing animation with this ID
    if (this.spriteAnimations && this.spriteAnimations[animationId]) {
      clearInterval(this.spriteAnimations[animationId].interval);
    }

    // Initialize sprite animations tracking if needed
    if (!this.spriteAnimations) {
      this.spriteAnimations = {};
    }

    let currentFrame = 0;
    const maxLoops = loop ? Infinity : 1;
    let loopCount = 0;

    // Create the animation interval
    const interval = setInterval(() => {
      // Skip if paused
      if (this.isPaused) return;

      // Use custom updater if provided
      if (customUpdater) {
        customUpdater();
        return;
      }

      // Standard sprite sheet animation
      currentFrame = (currentFrame + 1) % frameCount;
      const percentPosition = (currentFrame / (frameCount - 1)) * 100;
      element.style.backgroundPosition = `${percentPosition}% 0%`;

      // Handle loop counting
      if (currentFrame === 0 && !loop) {
        loopCount++;
        if (loopCount >= maxLoops) {
          this.stopSpriteAnimation(animationId);
          if (typeof onComplete === "function") {
            onComplete();
          }
        }
      }
    }, frameDuration);

    // Store the animation data
    this.spriteAnimations[animationId] = {
      interval,
      element,
      currentFrame,
      frameCount,
      loopCount,
      maxLoops,
      onComplete,
    };

    return animationId;
  }

  stopSpriteAnimation(animationId) {
    if (!this.spriteAnimations || !this.spriteAnimations[animationId]) {
      return false;
    }

    clearInterval(this.spriteAnimations[animationId].interval);
    delete this.spriteAnimations[animationId];
    return true;
  }
}

window.AnimationManager = AnimationManager;
