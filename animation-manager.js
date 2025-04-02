
class AnimationManager {
    constructor() {

      // logger.info("animation", "Creating Animation Manager");
  
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
  
      // Create hand hitbox manager
      if (typeof HandHitboxManager === "function" && !this.handHitboxManager) {
        // Pass this.audioManager to HandHitboxManager constructor
        this.handHitboxManager = new HandHitboxManager(this.audioManager);
      }  
      // Create an overlay element for slap animations
      this.createOverlayElement();
  
      // Define animations
      this.animations = {
        idle: {
          spriteSheet: "images/trump-idle-sprite.png",
          frameCount: 2,
          loopCount: Infinity,
          handVisible: false,
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
        },
        // Rest of animations remain the same
  
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
        },


        
        slapped: {
          spriteSheet: "images/trump-slapped-sprite.png",
          frameCount: 2,
          loopCount: 4, // Increased from 2 for better visibility
          handVisible: false,
        },
        victory: {
          spriteSheet: "images/trump-happy-sprite.png",
          frameCount: 2,
          loopCount: 4, // Increased from 2 for better visibility
          handVisible: false,
        },
        // Smack animations remain the same
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
        muskAppearance: {
          spriteSheet: "images/musk.png",
          frameCount: 2, // If it's a single image
          loopCount: 4, // Play once
          handVisible: false,
        },



        idleSmall: {
          spriteSheet: "images/trump-idle-sprite-small.png",
          frameCount: 2,
          loopCount: Infinity,
          handVisible: false
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
          smackAnimation: "smackEastCanada"
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
          smackAnimation: "smackWestCanada"
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
          smackAnimation: "smackGreenland"
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
          smackAnimation: "smackMexico"
        },
        slappedSmall: {
          spriteSheet: "images/trump-slapped-sprite-small.png",
          frameCount: 2,
          loopCount: 4,
          handVisible: false
        },
        victorySmall: {
          spriteSheet: "images/trump-happy-sprite-small.png",
          frameCount: 2,
          loopCount: 4,
          handVisible: false
        },








        idleSmaller: {
          spriteSheet: "images/trump-idle-sprite-smaller.png",
          frameCount: 2,
          loopCount: Infinity,
          handVisible: false
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
          smackAnimation: "smackEastCanada"
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
          smackAnimation: "smackWestCanada"
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
          smackAnimation: "smackGreenland"
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
          smackAnimation: "smackMexico"
        },
        slappedSmaller: {
          spriteSheet: "images/trump-slapped-sprite-smaller.png",
          frameCount: 2,
          loopCount: 4,
          handVisible: false
        },
        victorySmaller: {
          spriteSheet: "images/trump-happy-sprite-smaller.png",
          frameCount: 2,
          loopCount: 4,
          handVisible: false
        },


        







        idleSmallest: {
          spriteSheet: "images/trump-idle-sprite-smallest.png",
          frameCount: 2,
          loopCount: Infinity,
          handVisible: false
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
          smackAnimation: "smackEastCanada"
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
          smackAnimation: "smackWestCanada"
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
          smackAnimation: "smackGreenland"
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
          smackAnimation: "smackMexico"
        },
        slappedSmallest: {
          spriteSheet: "images/trump-slapped-sprite-smallest.png",
          frameCount: 2,
          loopCount: 4,
          handVisible: false
        },
        victorySmallest: {
          spriteSheet: "images/trump-happy-sprite-smallest.png",
          frameCount: 2,
          loopCount: 4,
          handVisible: false
        },

      };
  
      this.sizeState = 'normal'; // Can be: 'normal', 'small', 'smaller', 'smallest'
      this.loadedSprites = new Set();
      this._preloadImportantSprites(['normal']);

      // Pass animations data to hand hitbox manager
      this.handHitboxManager.setAnimationsData(this.animations);
    }
  
    init() {
      console.log("init animation manager");
  
      // logger.info("animation", "Initializing Animation Manager");
      this._preloadImportantSprites();
  
      // Start with idle animation
      this.changeState("idle");
      // logger.debug("animation", "Animation Manager initialized");
    }
  
// In AnimationManager, replace the existing _preloadImportantSprites with:

_preloadImportantSprites(sizes = ['normal']) {
  return new Promise((resolve, reject) => {
    if (!this.animations) {
      console.warn('No animations defined for preloading');
      resolve();
      return;
    }

    const spritesToLoad = [];
    const loadingPromises = [];
    
    sizes.forEach(size => {
      const suffix = size === 'normal' ? '' : size.charAt(0).toUpperCase() + size.slice(1);
      const baseAnimations = ['idle', 'grabEastCanada', 'grabWestCanada', 'grabMexico', 'grabGreenland'];
      
      baseAnimations.forEach(baseAnim => {
        const animName = baseAnim + suffix;
        if (this.animations[animName] && !this.loadedSprites.has(this.animations[animName].spriteSheet)) {
          spritesToLoad.push(this.animations[animName].spriteSheet);
        }
      });
    });

    // Load all sprites
    spritesToLoad.forEach(src => {
      if (!this.loadedSprites.has(src)) {
        const loadPromise = new Promise((resolveLoad) => {
          const img = new Image();
          img.onload = () => {
            this.loadedSprites.add(src);
            console.log(`Preloaded sprite: ${src}`);
            resolveLoad();
          };
          img.onerror = () => {
            console.warn(`Failed to preload sprite: ${src}`);
            resolveLoad(); // Resolve anyway to not block the chain
          };
          img.src = src;
        });
        loadingPromises.push(loadPromise);
      }
    });

    // Wait for all sprites to load
    Promise.all(loadingPromises)
      .then(() => {
        console.log(`Successfully preloaded ${spritesToLoad.length} sprites`);
        resolve();
      })
      .catch(error => {
        console.error('Error preloading sprites:', error);
        resolve(); // Resolve anyway to not block the game
      });
  });
}


  
    createOverlayElement() {
      // Check if overlay already exists
      if (document.getElementById("smack-overlay")) return;
  
      const trumpContainer = document.getElementById("trump-sprite-container");
      if (!trumpContainer) {
        // logger.error("animation", "Trump container not found, cannot create smack overlay");
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
      // logger.debug("animation", "Smack overlay element created");
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
      // logger.debug("animation", `Game speed set to ${speedMultiplier.toFixed(2)}x`);
    }
  

    changeState(stateName, onEndCallback = null) {
      // Don't change animation if requested state doesn't exist
      if (!this.animations[stateName]) {
        console.warn(`Animation state not found: ${stateName}`);
        return;
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
      }
    
      // Update initial frame
      this.updateFrame(0);
    
      // Start playing
      setTimeout(() => {
        this.play();
      }, 1);
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
      if (animation.handVisible) {
        this.handHitboxManager.updateStateAndFrame(this.currentState, frameIndex);
      }
  
      // logger.trace("animation", `${this.currentState}: frame ${frameIndex}/${animation.frameCount - 1}, loop ${this.loopCount}/${animation.loopCount}`);
    }
  
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
  
      // Clear any existing animation frame
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
  
      const animation = this.animations[this.currentState];
      if (!animation) {
        // logger.error("animation", `No animation data found for state: ${this.currentState}`);
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
      if (window.DeviceUtils.isMobileDevice) {
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
              // logger.debug("animation", `Animation ${this.currentState} completed after ${this.loopCount} loops`);
  
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
        // logger.debug("animation", `Stopping animation interval for ${this.currentState} at frame ${this.currentFrame}, loop ${this.loopCount}`);
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
      this.handHitboxManager.destroy();
  
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
  
      // logger.debug("animation", "Animation Manager destroyed");
    }
  
    pause() {
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
      
      console.log("Animation paused, state saved:", this._pausedState);
    }
  
    /**
     * Resume animation
     */
    resume() {
      if (!this.isPaused) return;
      
      this.isPaused = false;
      
      // If we have saved state, restore it
      if (this._pausedState) {
        console.log("Restoring animation from:", this._pausedState);
        
        // If it's a smack animation, special handling
        if (this._pausedState.state && this._pausedState.state.startsWith('smack')) {
          // For smack animations, we need to restart from beginning
          this.changeState(this._pausedState.state, this._pausedState.callback);
          console.log("Restarted smack animation:", this._pausedState.state);
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
  
    playSmackAnimation(animationNameOrCountry, onCompleteCallback) {
      // Get the smack overlay element
      const overlay = document.getElementById("smack-overlay");
      if (!overlay) {
        // logger.error("animation", "Smack overlay element not found");
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
        // logger.error("animation", `Invalid animation or country name: ${animationNameOrCountry}`);
        smackAnimationName = "smackMexico"; // Fallback to a default animation
      }
  
      // logger.info("animation", `Playing smack animation: "${smackAnimationName}"`);
  
      // Check if animation exists
      if (!this.animations[smackAnimationName]) {
        // logger.error("animation", `Smack animation "${smackAnimationName}" not found in available animations!`);
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
          // logger.debug("animation", `Smack impact triggered at frame ${currentFrame}`);
  
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
      this.handHitboxManager.setDebugMode(enabled);
      // logger.info("animation", `Debug mode ${enabled ? "enabled" : "disabled"}`);
    }
  
    // Get current animation data
    getCurrentAnimation() {
      return {
        name: this.currentState,
        frame: this.currentFrame,
        data: this.animations[this.currentState],
        hitbox: this.handHitboxManager.getHitboxInfo(),
      };
    }
  
    // Get current hitbox information
    getHitboxInfo() {
      return this.handHitboxManager.getHitboxInfo();
    }

    reset() {
      this.sizeState = 'normal';
      if (this.trumpSprite) {
        this.trumpSprite.style.display = 'block';  // Make sure Trump is visible again
      }
      this.changeState('idle');  // Return to normal idle state
    }
    
  }
  
  window.AnimationManager = AnimationManager;