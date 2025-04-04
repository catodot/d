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

    
    this.currentSizeVariant = 'normal'; // Track the current size globally
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
        priority: 1 // Highest priority - needed immediately
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
        priority: 2
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
        priority: 2
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
        priority: 2
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
        priority: 2
      },
      
      slapped: {
        spriteSheet: "images/trump-slapped-sprite.png",
        frameCount: 2,
        loopCount: 4, // Increased from 2 for better visibility
        handVisible: false,
        priority: 2
      },
      victory: {
        spriteSheet: "images/trump-happy-sprite.png",
        frameCount: 2,
        loopCount: 4, // Increased from 2 for better visibility
        handVisible: false,
        priority: 2
      },
      
      // Smack animations 
      smackEastCanada: {
        spriteSheet: "images/smack-east-canada-sprite.png",
        frameCount: 5,
        frameDuration: 120, // Faster animation (120ms per frame)
        handVisible: false,
        priority: 3
      },
      smackWestCanada: {
        spriteSheet: "images/smack-west-canada-sprite.png",
        frameCount: 5,
        frameDuration: 120,
        handVisible: false,
        priority: 3
      },
      smackMexico: {
        spriteSheet: "images/smack-mexico-sprite.png",
        frameCount: 5,
        frameDuration: 120,
        handVisible: false,
        priority: 3
      },
      smackGreenland: {
        spriteSheet: "images/smack-greenland-sprite.png",
        frameCount: 5,
        frameDuration: 120,
        handVisible: false,
        priority: 3
      },
      muskAppearance: {
        spriteSheet: "images/musk.png",
        frameCount: 2, // If it's a single image
        loopCount: 4, // Play once
        handVisible: false,
        priority: 3
      },

      // Small size variants
      idleSmall: {
        spriteSheet: "images/trump-idle-sprite-small.png",
        frameCount: 2,
        loopCount: Infinity,
        handVisible: false,
        priority: 3
      },
      grabEastCanadaSmall: {
        spriteSheet: "images/trump-grab-east-canada-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1608, y: 1439, width: 737, height: 737 },
          { x: 1469, y: 1344, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackEastCanada",
        priority: 3
      },
      grabWestCanadaSmall: {
        spriteSheet: "images/trump-grab-west-canada-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 286, y: 1248, width: 737, height: 737 },
          { x: 282, y: 1140, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackWestCanada",
        priority: 3
      },
      grabGreenlandSmall: {
        spriteSheet: "images/trump-grab-greenland-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 2163, y: 754, width: 737, height: 737 },
          { x: 2072, y: 789, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackGreenland",
        priority: 3
      },
      grabMexicoSmall: {
        spriteSheet: "images/trump-grab-mexico-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1118, y: 2319, width: 737, height: 737 },
          { x: 906, y: 2445, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackMexico",
        priority: 3
      },
      slappedSmall: {
        spriteSheet: "images/trump-slapped-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3
      },
      victorySmall: {
        spriteSheet: "images/trump-happy-sprite-small.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3
      },

      // Smaller size variants
      idleSmaller: {
        spriteSheet: "images/trump-idle-sprite-smaller.png",
        frameCount: 2,
        loopCount: Infinity,
        handVisible: false,
        priority: 3
      },
      grabEastCanadaSmaller: {
        spriteSheet: "images/trump-grab-east-canada-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1608, y: 1439, width: 737, height: 737 },
          { x: 1469, y: 1344, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackEastCanada",
        priority: 3
      },
      grabWestCanadaSmaller: {
        spriteSheet: "images/trump-grab-west-canada-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 286, y: 1248, width: 737, height: 737 },
          { x: 282, y: 1140, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackWestCanada",
        priority: 3
      },
      grabGreenlandSmaller: {
        spriteSheet: "images/trump-grab-greenland-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 2163, y: 754, width: 737, height: 737 },
          { x: 2072, y: 789, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackGreenland",
        priority: 3
      },
      grabMexicoSmaller: {
        spriteSheet: "images/trump-grab-mexico-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1118, y: 2319, width: 737, height: 737 },
          { x: 906, y: 2445, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackMexico",
        priority: 3
      },
      slappedSmaller: {
        spriteSheet: "images/trump-slapped-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3
      },
      victorySmaller: {
        spriteSheet: "images/trump-happy-sprite-smaller.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3
      },

      // Smallest size variants
      idleSmallest: {
        spriteSheet: "images/trump-idle-sprite-smallest.png",
        frameCount: 2,
        loopCount: Infinity,
        handVisible: false,
        priority: 3
      },
      grabEastCanadaSmallest: {
        spriteSheet: "images/trump-grab-east-canada-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1608, y: 1439, width: 737, height: 737 },
          { x: 1469, y: 1344, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackEastCanada",
        priority: 3
      },
      grabWestCanadaSmallest: {
        spriteSheet: "images/trump-grab-west-canada-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 286, y: 1248, width: 737, height: 737 },
          { x: 282, y: 1140, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackWestCanada",
        priority: 3
      },
      grabGreenlandSmallest: {
        spriteSheet: "images/trump-grab-greenland-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 2163, y: 754, width: 737, height: 737 },
          { x: 2072, y: 789, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackGreenland",
        priority: 3
      },
      grabMexicoSmallest: {
        spriteSheet: "images/trump-grab-mexico-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: true,
        handCoordinates: [
          { x: 1118, y: 2319, width: 737, height: 737 },
          { x: 906, y: 2445, width: 737, height: 737 }
        ],
        calibrationScale: 0.23,
        smackAnimation: "smackMexico",
        priority: 3
      },
      slappedSmallest: {
        spriteSheet: "images/trump-slapped-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3
      },
      victorySmallest: {
        spriteSheet: "images/trump-happy-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3
      },

      shrinkDefeat: {
        spriteSheet: "images/trump-happy-sprite-smallest.png",
        frameCount: 2,
        loopCount: 4,
        handVisible: false,
        priority: 3
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
    console.log("init animation manager");

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
    Object.keys(this.animations).forEach(animName => {
      const anim = this.animations[animName];
      if (anim && (anim.priority === priorityLevel) && 
          !this.loadedSprites.has(anim.spriteSheet) && 
          !this.loadingSprites.has(anim.spriteSheet)) {
        spritesToLoad.push(anim.spriteSheet);
      }
    });
    
    console.log(`Loading ${spritesToLoad.length} sprites with priority ${priorityLevel}`);
    return this._loadSprites(spritesToLoad);
  }

  /**
   * Load specific animations by name
   * @param {Array} animationNames - Array of animation names to load
   * @returns {Promise} - Resolves when all specified animations are loaded
   */
  _loadSpecificAnimations(animationNames) {
    const spritesToLoad = [];
    
    animationNames.forEach(animName => {
      if (this.animations[animName] && 
          !this.loadedSprites.has(this.animations[animName].spriteSheet) &&
          !this.loadingSprites.has(this.animations[animName].spriteSheet)) {
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
    
    spriteUrls.forEach(src => {
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
          console.log(`Loaded sprite: ${src}`);
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
    overlay.style.zIndex = "5"; // Above trump but below hand
    overlay.style.display = "none";

    trumpContainer.appendChild(overlay);
    console.log("Smack overlay element created");
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
    console.log(`Game speed set to ${speedMultiplier.toFixed(2)}x`);
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
  
    // Wait for a good moment to change state
    const safeStateChange = () => {
      // Determine state name based on current size if needed
      const currentSize = window.freedomManager?.getTrumpSize()?.size || 'normal';
      let finalStateName = stateName;
  
      if (currentSize !== 'normal') {
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
  
      // Mark transition as complete
      this.isTransitioning = false;
  
      // Process next queued state change if any
      this.processStateQueue();
    };
  
    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(safeStateChange);
  }

  // Modify existing methods to use queueStateChange
  // changeState(stateName, onEndCallback = null) {
  //   this.queueStateChange(stateName, onEndCallback);
  // }
  // end new 


  async changeState(stateName, onEndCallback = null) {
    // First get current size from FreedomManager
    const currentSize = window.freedomManager?.getTrumpSize()?.size || 'normal';
    console.log("vvv" + currentSize);
    
    console.log("[vvv AnimationManager] Checking window.freedomManager:", window.freedomManager);
    console.log("[vvv AnimationManager] Checking window.freedomManager type:", typeof window.freedomManager);
     
    // If we're not in normal size, check if a size variant exists
    if (currentSize !== 'normal') {
        const sizedStateName = `${stateName}${currentSize.charAt(0).toUpperCase() + currentSize.slice(1)}`;
        if (this.animations[sizedStateName]) {
            stateName = sizedStateName; // Use the sized variant
            console.log(`Using sized variant: ${stateName}`);
        } else {
            console.warn(`Size variant ${sizedStateName} not found, falling back to ${stateName}`);
        }
    }
     
     // Now check if the state exists at all
     if (!this.animations[stateName]) {
         console.warn(`Animation state not found: ${stateName}`);
         return;
     }
   
      // Get animation data
      const animation = this.animations[stateName];
      const spriteSheet = animation.spriteSheet;
      
     if (!this.loadedSprites.has(spriteSheet)) {
       console.log(`Sprite for ${stateName} not loaded, loading now...`);
       
       try {
           await this._loadSprites([spriteSheet]);
       } catch (error) {
           console.error(`Failed to load sprite for ${stateName}:`, error);
           if (stateName !== "idle" && this.animations["idle"]) {
               console.log("Falling back to idle animation");
               this.changeState("idle", onEndCallback);
               return;
           }
       }
     }
   
     // Use the queuing mechanism
     this.queueStateChange(stateName, onEndCallback);
 }

  updateFrame(frameIndex) {
    console.log(`[uuu FRAME UPDATE] ========== FRAME UPDATE START ==========`);
    console.log(`[uuu FRAME UPDATE] State: ${this.currentState}`);
    console.log(`[uuu FRAME UPDATE] Frame: ${frameIndex}`);
    
    if (this.animations[this.currentState]?.handVisible) {
      console.log(`[uuu FRAME UPDATE] Hand coordinates for frame:`, 
          this.animations[this.currentState].handCoordinates[frameIndex]);
  }

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
    if (animation.handVisible) {
      this.handHitboxManager.updateStateAndFrame(this.currentState, frameIndex);
    }

    console.log(`${this.currentState}: frame ${frameIndex}/${animation.frameCount - 1}, loop ${this.loopCount}/${animation.loopCount}`);
    if (this.handHitboxManager) {
      const hitboxInfo = this.handHitboxManager.getHitboxInfo();
      console.log(`[uuu FRAME UPDATE] Hitbox state:`, hitboxInfo);
  }
  console.log(`[uuu FRAME UPDATE] ========== FRAME UPDATE END ==========`);
}

  /**
   * Play a sequence of animations with lazy loading
   * @param {string} startState - Starting animation state
   * @param {function} onComplete - Callback when sequence completes
   */
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
        this.animationFrame = requestAnimationFrame(animateFrame);
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
            console.log(`Animation ${this.currentState} completed after ${this.loopCount} loops`);

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
    this.animationFrame = requestAnimationFrame(animateFrame);
  }

  stop() {
    if (this.animationInterval) {
      console.log(`Stopping animation interval for ${this.currentState} at frame ${this.currentFrame}, loop ${this.loopCount}`);
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  destroy() {
    this.stop();
    if (this.handHitboxManager && typeof this.handHitboxManager.destroy === 'function') {
      this.handHitboxManager.destroy();
    }

    // Clear all references
    this.trumpSprite = null;
    this.animations = null;
    this.currentState = "";
    this.onAnimationEnd = null;

    // Remove overlay
    const overlay = document.getElementById("smack-overlay");
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }

    console.log("Animation Manager destroyed");
  }

  
//   changeSizeState(newSize) {
//     console.log(`[uuu SIZE TRANSITION] ========== SIZE CHANGE START ==========`);
//     console.log(`[uuu SIZE TRANSITION] Current state before: ${this.currentState}`);
//     console.log(`[uuu SIZE TRANSITION] Current frame before: ${this.currentFrame}`);
//     console.log(`[uuu SIZE TRANSITION] Target size: ${newSize}`);
        
//     // Prevent concurrent transitions
//     if (this.sizeTransitionInProgress) {
//         console.warn("[uuu SIZE TRANSITION] Another transition in progress, aborting");
//         return;
//     }
    
//     this.sizeTransitionInProgress = true;
    
//     // Store the new size globally
//     this.currentSizeVariant = newSize;
    
//     // Get the base state name without any size suffix
//     const baseState = this.currentState.replace(/(Small|Smaller|Smallest)$/, '');
    
//     // Construct the new state name
//     const newStateName = newSize === 'normal' ? baseState : 
//                           `${baseState}${newSize.charAt(0).toUpperCase() + newSize.slice(1)}`;
    
//     console.log(`[uuu SIZE TRANSITION] State transition: ${this.currentState} -> ${newStateName}`);
    
//     // Validate the new state exists
//     if (!this.animations[newStateName]) {
//         console.error(`[uuu SIZE TRANSITION] Error: State ${newStateName} not found in animations`);
//         // Try to find a fallback state
//         const fallbackState = newSize === 'normal' ? 'idle' : `idle${newSize.charAt(0).toUpperCase() + newSize.slice(1)}`;
        
//         if (this.animations[fallbackState]) {
//             console.log(`[uuu SIZE TRANSITION] Falling back to ${fallbackState}`);
//             this.currentState = fallbackState;
//             if (this.trumpSprite) {
//                 this.trumpSprite.style.backgroundImage = `url('${this.animations[fallbackState].spriteSheet}')`;
//             }
//             this.currentFrame = 0;
//             this.loopCount = 0;
//             this.updateFrame(0);
//             this.play();
//         } else {
//             console.error(`[uuu SIZE TRANSITION] No suitable fallback found for size ${newSize}`);
//         }
        
//         this.sizeTransitionInProgress = false;
//         return;
//     }
    
//     // Store current animation progress
//     const currentProgress = {
//         frame: this.currentFrame,
//         loopCount: this.loopCount,
//         callback: this.onAnimationEnd
//     };
    
//     // Pause current animation
//     this.stop();
    
//     // Update state and visuals
//     this.currentState = newStateName;
//     if (this.trumpSprite) {
//         this.trumpSprite.style.backgroundImage = `url('${this.animations[newStateName].spriteSheet}')`;
//     }
    
//     // Restore animation progress
//     this.currentFrame = currentProgress.frame;
//     this.loopCount = currentProgress.loopCount;
//     this.onAnimationEnd = currentProgress.callback;
    
//     // Update visual frame
//     this.updateFrame(this.currentFrame);
    
//     // Resume animation
//     this.play();
    
//     console.log(`[uuu SIZE TRANSITION] Completed transition to ${newStateName}, global size set to: ${this.currentSizeVariant}`);
//     this.sizeTransitionInProgress = false;

//     console.log(`[uuu SIZE TRANSITION] New state after: ${this.currentState}`);
//     console.log(`[uuu SIZE TRANSITION] New frame after: ${this.currentFrame}`);
//     console.log(`[uuu SIZE TRANSITION] Animation data:`, this.animations[this.currentState]);
//     console.log(`[uuu SIZE TRANSITION] ========== SIZE CHANGE END ==========`);
// }

// changeSizeState(newSize) {
//   console.log(`[uuu SIZE TRANSITION] ========== SIZE CHANGE START ==========`);
//   console.log(`[uuu SIZE TRANSITION] Current state before: ${this.currentState}`);
//   console.log(`[uuu SIZE TRANSITION] Current frame before: ${this.currentFrame}`);
//   console.log(`[uuu SIZE TRANSITION] Target size: ${newSize}`);
      
//   // Prevent concurrent transitions
//   if (this.sizeTransitionInProgress) {
//       console.warn("[uuu SIZE TRANSITION] Another transition in progress, aborting");
//       return;
//   }
  
//   this.sizeTransitionInProgress = true;
  
//   // Store the new size globally
//   this.currentSizeVariant = newSize;
  
//   // Get the base state name without any size suffix
//   const baseState = this.currentState.replace(/(Small|Smaller|Smallest)$/, '');
  
//   // Determine sprite sheet based on current state and new size
//   let spriteSheet;
//   if (newSize === 'normal') {
//       spriteSheet = this.animations[baseState].spriteSheet;
//   } else {
//       const sizedStateName = `${baseState}${newSize.charAt(0).toUpperCase() + newSize.slice(1)}`;
//       if (this.animations[sizedStateName]) {
//           spriteSheet = this.animations[sizedStateName].spriteSheet;
//       } else {
//           console.warn(`No sprite sheet found for ${sizedStateName}, using base sprite`);
//           spriteSheet = this.animations[baseState].spriteSheet;
//       }
//   }

//   // Update sprite sheet directly without changing entire animation object
//   if (this.trumpSprite) {
//       this.trumpSprite.style.backgroundImage = `url('${spriteSheet}')`;
//   }

//   // Ensure the current state remains the same, just with a different sprite
//   this.currentSizeVariant = newSize;
  
//   this.sizeTransitionInProgress = false;

//   console.log(`[uuu SIZE TRANSITION] Sprite transitioned to: ${spriteSheet}`);
//   console.log(`[uuu SIZE TRANSITION] ========== SIZE CHANGE END ==========`);
// }


// changeSizeState(newSize) {
//     console.log(`[SIZE TRANSITION] Starting transition to ${newSize}`);
    
//     // Get base state name without any size suffix
//     const baseState = this.currentState.replace(/(Small|Smaller|Smallest)$/, '');
    
//     // Construct new state name keeping the same animation type, just with new size
//     const newStateName = newSize === 'normal' ? baseState : 
//                         `${baseState}${newSize.charAt(0).toUpperCase() + newSize.slice(1)}`;
    
//     console.log(`[SIZE TRANSITION] State transition: ${this.currentState} -> ${newStateName}`);

//     // CRITICAL: Verify the exact animation state exists for this size
//     if (!this.animations[newStateName]) {
//         console.error(`[SIZE TRANSITION] Missing animation state: ${newStateName}`);
//         return;
//     }

//     // Store current animation progress
//     const currentProgress = {
//         frame: this.currentFrame,
//         loopCount: this.loopCount,
//         callback: this.onAnimationEnd
//     };

//     // Stop current animation
//     this.stop();

//     // Update sprite sheet and state
//     if (this.trumpSprite) {
//         this.trumpSprite.style.backgroundImage = `url('${this.animations[newStateName].spriteSheet}')`;
//     }
    
//     // Update size and state
//     this.currentSizeVariant = newSize;
//     this.currentState = newStateName;

//     // Update hitbox with new coordinates for this size variant
//     if (this.handHitboxManager) {
//         this.handHitboxManager.updateStateAndFrame(
//             this.currentState,
//             currentProgress.frame
//         );
//     }

//     // Restore animation progress exactly where we were
//     this.currentFrame = currentProgress.frame;
//     this.loopCount = currentProgress.loopCount;
//     this.onAnimationEnd = currentProgress.callback;
    
//     // Update frame and resume animation
//     this.updateFrame(this.currentFrame);
//     this.play();

//     console.log(`[SIZE TRANSITION] Animation state preserved through size change`);
// }



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
    this.trumpSprite.style.backgroundImage = `url('${this.animations[newStateName].spriteSheet}')`;
  }
}

async preloadNextSize(targetSize) {
  console.log(`Preloading resources for size transition to: ${targetSize}`);
  
  // Preload the size variant before actually switching to it
  await this.preloadSizeVariant(targetSize);
  
  return true; // Loading complete
}
  // Enhance pause and resume with logging
  pause() {
    console.log(`[ANIMATION] Pausing animation in state: ${this.currentState}`);
    this.isPaused = true;
    
    // Store current animation state for restoration
    this._pausedState = {
      state: this.currentState,
      frame: this.currentFrame,
      loopCount: this.loopCount,
      callback: this.onAnimationEnd
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
    
    console.log("[ANIMATION] Pause complete, stored state:", this._pausedState);
  }

  resume() {
    console.log(`[ANIMATION] Attempting to resume from paused state`);
    
    if (!this.isPaused) {
      console.log("[ANIMATION] Resume called but not paused - ignoring");
      return;
    }
    
    this.isPaused = false;
    
    // If we have saved state, restore it
    if (this._pausedState) {
      console.log("[ANIMATION] Restoring animation from:", this._pausedState);
      
      // If it's a smack animation, special handling
      if (this._pausedState.state && this._pausedState.state.startsWith('smack')) {
        // For smack animations, we need to restart from beginning
        this.changeState(this._pausedState.state, this._pausedState.callback);
        console.log("[ANIMATION] Restarted smack animation:", this._pausedState.state);
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
      console.log("[ANIMATION] No saved state found, just restarting current animation");
      // If no saved state, just restart current animation
      this.play();
    }
  }



handleGamePause() {
  console.log("[FreedomManager] Handling game pause");
  
  // Store the current state of all protestors
  this._pausedState = {
    protestors: {},
    extraProtestors: {...this.activeAnimations.extraProtestors}
  };

  // Store and clear protestor animations
  Object.keys(this.activeAnimations.protestors).forEach(countryId => {
    if (this.activeAnimations.protestors[countryId]) {
      this._pausedState.protestors[countryId] = {
        interval: this.activeAnimations.protestors[countryId],
        shown: this.countries[countryId].protestorsShown,
        wrapper: this.countries[countryId].protestorWrapper,
        clickCount: this.countries[countryId].clickCounter
      };
      clearInterval(this.activeAnimations.protestors[countryId]);
      delete this.activeAnimations.protestors[countryId];
    }
  });

  // Clear extra protestor animations
  Object.keys(this.activeAnimations.extraProtestors).forEach(key => {
    if (this.activeAnimations.extraProtestors[key]) {
      clearInterval(this.activeAnimations.extraProtestors[key]);
      delete this.activeAnimations.extraProtestors[key];
    }
  });
}

handleGameResume() {
  console.log("[FreedomManager] Handling game resume");
  
  if (!this._pausedState) return;

  // Restore protestor animations
  Object.keys(this._pausedState.protestors).forEach(countryId => {
    const pausedData = this._pausedState.protestors[countryId];
    if (pausedData.shown) {
      // Re-setup animations if wrapper still exists
      if (pausedData.wrapper && document.contains(pausedData.wrapper)) {
        this._setupProtestorAnimations(countryId, pausedData.wrapper);
        
        // Restore click count
        this.countries[countryId].clickCounter = pausedData.clickCount;
      } else {
        // If wrapper is gone, fully cleanup this protestor
        this._cleanupProtestorElements(countryId);
      }
    }
  });

  // Clear pause state
  this._pausedState = null;
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
      console.error(`Invalid animation or country name: ${animationNameOrCountry}`);
      smackAnimationName = "smackMexico"; // Fallback to a default animation
    }

    console.log(`Playing smack animation: "${smackAnimationName}"`);

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
      console.log(`Loading smack sprite: ${smackAnimation.spriteSheet}`);
      try {
        await this._loadSprites([smackAnimation.spriteSheet]);
      } catch (error) {
        console.error(`Failed to load smack sprite: ${smackAnimation.spriteSheet}`, error);
        // Continue anyway but log the error
      }
    }

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
        console.log(`Smack impact triggered at frame ${currentFrame}`);

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
    if (this.handHitboxManager && typeof this.handHitboxManager.setDebugMode === 'function') {
      this.handHitboxManager.setDebugMode(enabled);
    }
    console.log(`Debug mode ${enabled ? "enabled" : "disabled"}`);
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
      this.trumpSprite.style.display = 'block';  // Make sure Trump is visible again
    }
    this.changeState('idle');  // Return to normal idle state
  }
  
  /**
   * Preload a specific size variant of animations
   * This is more focused than the original _preloadImportantSprites
   * @param {string} size - Size variant ('normal', 'Small', 'Smaller', 'Smallest')
   * @returns {Promise} - Resolves when loading is complete
   */
  preloadSizeVariant(size) {
    const suffix = size === 'normal' ? '' : size;
    const animationsToLoad = [];
    
    // Find all animations with this size suffix
    Object.keys(this.animations).forEach(animName => {
      if ((suffix === '' && !animName.match(/Small|Smaller|Smallest/)) || 
          (suffix !== '' && animName.endsWith(suffix))) {
        if (!this.loadedSprites.has(this.animations[animName].spriteSheet)) {
          animationsToLoad.push(animName);
        }
      }
    });
    
    console.log(`Preloading ${animationsToLoad.length} animations for size variant: ${size}`);
    return this._loadSpecificAnimations(animationsToLoad);
  }
}

window.AnimationManager = AnimationManager;