// Event handling utility
function setupEventHandlers(element, handlers) {
  if (!element) return false;

  // Remove existing handlers with clone technique
  const newElement = element.cloneNode(true);
  if (element.parentNode) {
    element.parentNode.replaceChild(newElement, element);
  }

  // Add new handlers
  Object.entries(handlers).forEach(([event, handler]) => {
    newElement.addEventListener(event, handler);
  });

  return newElement;
}

/**
 * Game Engine - Core module that coordinates all game systems
 */
class GameEngine {
  constructor(config = {}) {
    // Configuration with defaults
    this.config = {
      DEBUG_MODE: config.debug || true,
      GAME_DURATION: 168, // 2min 48sec in seconds
      ANIMATION_DELAY: 650,
      SPEED_INCREASE_INTERVAL: 16000,
      MAX_SPEED_MULTIPLIER: 3.0,
      SPEED_INCREASE_STEP: 0.5,
      AUTO_RESTART_DELAY: 20000,
      GLOBE_ANIMATION_DURATION: 4000,
      READY_TEXT_DURATION: 3500,
      TRUMP_ENTRANCE_DURATION: 2000,
      IDLE_BEFORE_GRAB_DURATION: 2000,
      INITIAL_GRAB_DELAY: 8000,
      COUNTRIES: ["canada", "mexico", "greenland"],
    };

    // Override with provided config
    Object.assign(this.config, config);

    // Core systems
    this.systems = {
      state: new GameState(this.config),
      ui: new UIManager(),
      input: new InputManager(),
      audio: null,
      animation: null,
      freedom: null,
      collision: null,
    };

    // Resource tracking for cleanup
    this.resources = {
      timeouts: [],
      intervals: [],
      animationFrames: [],
    };

    // Bind critical methods
    this._bindMethods();
  }

  _initializeGameSystems() {
    // Initialize global logger
    if (!window.logger) {
      window.logger = {
        debug: (category, message) => this.config.DEBUG_MODE && console.debug(`[${category}]`, message),
        info: (category, message) => console.info(`[${category}]`, message),
        warn: (category, message) => console.warn(`[${category}]`, message),
        error: (category, message) => console.error(`[${category}]`, message),
        trace: (category, message) => this.config.DEBUG_MODE && console.trace(`[${category}]`, message),
      };
    }

    // Initialize device utils if needed
    if (!window.DeviceUtils) {
      window.DeviceUtils = {
        isMobileDevice: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isTouchDevice: "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0,
        viewportWidth: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        viewportHeight: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
      };

      window.addEventListener("resize", () => {
        window.DeviceUtils.viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        window.DeviceUtils.viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      });
    }

    // Initialize UI and input systems
    this.systems.ui.init(document);
    this.systems.input.init(document, {
      onStartKey: this.startGame,
    });

    window.isChromeOnMobile = /Android|webOS|iPhone|iPad|iPod/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent);

    // Add specific handling for Chrome mobile
    if (window.isChromeOnMobile) {
      console.log("[Engine] Chrome mobile detected, adding special positioning handlers");

      // Add a specific CSS fix for Chrome mobile
      const chromeFix = document.createElement("style");
      chromeFix.textContent = `
@media screen and (-webkit-min-device-pixel-ratio: 0) {
#trump-sprite-container, .country-flag-overlay {
transform: translateZ(0);
will-change: transform;
position: absolute !important;
}
}
`;
      document.head.appendChild(chromeFix);

      // Add delayed positioning function specifically for Chrome mobile
      this._chromePositioningFix = () => {
        if (this.systems.ui) {
          console.log("[Engine] Applying Chrome mobile positioning fix");
          setTimeout(() => this.systems.ui.positionElements(), 500);
          setTimeout(() => this.systems.ui.positionElements(), 1000);
          setTimeout(() => this.systems.ui.positionElements(), 2000);
        }
      };

      // Apply on page load
      window.addEventListener("load", this._chromePositioningFix);
    }

    // Initialize audio system
    if (!this.systems.audio) {
      this.systems.audio = window.audioManager || new AudioManager();
      this.systems.audio.init().catch((err) => {
        console.warn("[Engine] Audio initialization failed:", err);
      });
      window.audioManager = this.systems.audio;
    }

    // Initialize remaining input handlers
    this.systems.input.addHandlers({
      onSpaceKey: this.stopGrab,
      onPauseKey: this.togglePause,
    });

    // Initialize animation system
    if (typeof AnimationManager === "function" && !this.systems.animation) {
      this.systems.animation = window.animationManager || new AnimationManager();
      this.systems.animation.setDebugMode(this.config.DEBUG_MODE);
      this.systems.animation.init();
      window.animationManager = this.systems.animation;
    }

    // Set up additional managers
    this._setupAdditionalManagers();

    // Initialize debug features if enabled
    // Initialize debug features if enabled
    if (this.config.DEBUG_MODE) {
      if (typeof DebugManager === "function") {
        // Create a UI elements reference object using the system.ui elements
        const debugElements = this.systems && this.systems.ui ? this.systems.ui.elements : {};

        const debugManager = new DebugManager(
          debugElements, // Pass existing UI elements or empty object
          this.systems.state,
          this.systems.animation
        );

        window.debugManager = debugManager;
        debugManager.init();

        // Set up debug UI
        if (this.systems.ui) {
          this.systems.ui.setupDebugPanel(debugManager);
        }

        // Connect audio to debug
        if (this.systems.audio) {
          debugManager.audioManager = this.systems.audio;

          // Add a global test function for console debugging
          window.testAudio = function (category, name) {
            return debugManager.audioManager?.play(category, name) || "AudioManager not available";
          };
        }
      }
    }

    // Register global access point
    window.gameEngine = this;
    window.gameManager = this; // For backward compatibility
  }

  /**
   * Initialize the game engine
   * @returns {GameEngine} Self reference for chaining
   */
  init() {
    console.log("[Engine] Initializing game engine");

    // Initialize all systems
    this._initializeGameSystems();

    // Connect systems
    this._connectSystems();

    if (this.config.DEBUG_MODE) {
      this._initDebug();
    }

    if (this.systems.audio) {
      this.systems.audio.init().catch((err) => {
        console.warn("[Engine] Audio initialization failed:", err);
      });

      // Set up background music recovery
      this.systems.audio.setupBackgroundMusicRecovery();

      window.audioManager = this.systems.audio;
    }

    // Register global access point
    window.gameEngine = this;
    window.gameManager = this; // For backward compatibility

    // Add visibility change handler
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // If a grab is in progress, force-complete it immediately
        if (this.gameState.currentTarget) {
          console.log("[Engine] Window lost focus, forcing grab completion for", this.gameState.currentTarget);
          this.grabSuccess(this.gameState.currentTarget);
        }
      }
    });

    return this;
  }

  startGame() {
    console.log("[Engine] Starting new game");
  
    // Unlock audio system - CRITICAL for mobile
    this._prepareAudio();
  
    if (!this.systems.audio || !this.systems.animation) {
      this._initializeGameSystems();
    }
  
    // Reset game state
    this.systems.state.reset();
  
    // Play start sound
    this.systems.audio?.safePlay("ui", "start");
  
    // Show game screen and setup UI
    this.systems.ui.showGameScreen();
    this.systems.ui.positionElements();
  
    // Start game loop
    this._startGameLoop();
  
    // Start speed progression
    if (window.speedManager) {
      window.speedManager.startSpeedProgression();
    }
  
    // Schedule first grab after delay
    this.createTrackedTimeout(() => {
      this.initiateGrab();
    }, this.config.INITIAL_GRAB_DELAY);
  
    // Start precaching additional sounds once the game is running
    if (this.systems.audio) {
      setTimeout(() => {
        this.systems.audio.precacheFrequentSounds();
      }, 5000); // 5 seconds after game starts
    }
  }

  /**
   * End the game and show results
   * @param {boolean} playerWon - Whether player won
   * @param {Object} [options] - Optional configuration for game over
   */
  endGame(playerWon, options = {}) {
    console.log(`[Engine] Ending game, player ${playerWon ? "won" : "lost"}`);

    // Get option for keeping Trump animating
    const keepTrumpAnimating = options?.keepTrumpAnimating || false;

    // Only stop audio and animations if we're not keeping Trump animating
    if (!keepTrumpAnimating) {
      // Stop ALL audio first
      if (this.systems.audio) {
        this.systems.audio.stopBackgroundMusic();
        this.systems.audio.stopGrabSound();
        this.systems.audio.stopAll();
      }

      // Stop game loop
      this._stopGameLoop();
    }

    // Always clean up resources
    this._cleanupResources();

    // Update game state
    this.systems.state.isPlaying = false;

    // Process different ending sequences
    if (options.showWorldShrinkAnimation) {
      this.systems.ui.showWorldShrinkAnimation(
        (callback) => {
          // AFTER the world shrinks away, NOW stop all animations and audio
          if (keepTrumpAnimating) {
            if (this.systems.audio) {
              this.systems.audio.stopBackgroundMusic();
              this.systems.audio.stopGrabSound();
              this.systems.audio.stopAll();
            }

            // Stop game loop
            this._stopGameLoop();
          }

          // Show full game over screen
          this._showFullGameOverScreen(playerWon);
        },
        options.animationDuration || 4000,
        { keepTrumpAnimating }
      );
    } else if (options.showBriefGameOverScene) {
      // Original brief game over logic...
      this.systems.ui.showBriefGameOverScene(
        playerWon,
        () => {
          this._showFullGameOverScreen(playerWon);
        },
        options.briefSceneDuration || 1500
      );
    } else {
      // Directly show full game over screen
      this._showFullGameOverScreen(playerWon);
    }
  }

  /**
   * Show the full game over screen
   * @private
   * @param {boolean} playerWon - Whether player won
   */
  _showFullGameOverScreen(playerWon) {
    // Show game over screen
    this.systems.ui.showGameOverScreen(playerWon, this.systems.state);
    // Show voice recorder after a short delay
    setTimeout(() => {
      console.log("Showing voice recorder after 2-second delay");

      if (typeof openVoiceRecordingInterface === "function") {
        openVoiceRecordingInterface();
      } else {
        // Fallback: Try to show the modal directly
        const recorderModal = document.getElementById("voice-recorder-modal");
        if (recorderModal) {
          recorderModal.classList.remove("hidden");
          recorderModal.style.display = "flex";
          recorderModal.style.opacity = "1";
          recorderModal.style.visibility = "visible";

          // Initialize voice recorder if needed
          if (!window.voiceRecorder) {
            window.voiceRecorder = new VoiceRecorder();
            window.voiceRecorder.init();
          }
        }
      }
    }, 2000);

    // Schedule auto-restart
    if (this.config.AUTO_RESTART_DELAY > 0) {
      this._scheduleAutoRestart();
    }
  }

  restartGame() {
    console.log("[Engine] Restarting game");
  
    // FIRST: Hide UI elements that should be hidden during restart
    const gameOverScreen = document.getElementById("game-over-screen");
    if (gameOverScreen) {
      gameOverScreen.classList.add("hidden");
      gameOverScreen.style.display = "none";
    }
    
    // CRITICAL: Set the audio restart flag before anything else
    try {
      sessionStorage.setItem("audioNeedsRestart", "true");
    } catch (e) {
      console.warn("[Engine] Could not set audio restart flag:", e);
    }
    
    // Force re-setup of hitbox handlers
    this.systems.input._setupHitboxHandlers();
  
    // Re-unlock audio system - CRITICAL for mobile
    if (this.systems.audio) {
      try {
        const userGesture = true;
        this.systems.audio.unlock(userGesture);
  
        setTimeout(() => {
          this.systems.audio.safePlay("ui", "click");
        }, 100);
      } catch (e) {
        console.warn("[Engine] Audio system unlock error:", e);
      }
    }
    
    // Stop the game loop and clean up resources
    this._stopGameLoop();
    this._cleanupResources();
    this._resetSystems();
  
    // Reset all managers
    if (window.speedManager) window.speedManager.reset();
    if (window.smackManager) window.smackManager.reset();
    if (window.trumpHandEffects) window.trumpHandEffects.reset();
    if (window.freedomManager) window.freedomManager.reset();
    if (window.protestorHitboxManager) window.protestorHitboxManager.cleanupAll();
  
    // Reset audio - should be done after setting the restart flag
    if (this.systems.audio) {
      this.systems.audio.stopAll();
      this.systems.audio.reset();
    }
  
    // Reset game state
    this.systems.state.reset();
  
    // Reset UI elements
    this.systems.ui.resetAllElements();
  
    // Show game screen with slight delay to ensure DOM updates
    setTimeout(() => {
      const gameScreen = document.getElementById("game-screen");
      if (gameScreen) {
        gameScreen.classList.remove("hidden");
        gameScreen.style.display = "block";
      }
  
      // Start fresh game
      this.startGame();
  
      // Announce restart for screen readers
      if (this.systems.ui?.announceForScreenReaders) {
        this.systems.ui.announceForScreenReaders("Game restarted! Get ready to block!");
      }
    }, 200);
  }

  /**
   * Initiate a grab attempt by Trump
   */
  initiateGrab() {
    // Skip if game isn't actively playing
    if (!this.systems.state.isPlaying || this.systems.state.isPaused) {
      return;
    }

    // Select target country
    const targetCountry = this._selectTargetCountry();
    if (!targetCountry) {
      // Use tracked timeout for retry
      this.createTrackedTimeout(() => {
        this.initiateGrab();
      }, 500);
      return;
    }

    // Select animation for target
    const animationInfo = this._selectAnimationForCountry(targetCountry);

    // Set up grab sequence
    this._prepareGrabSequence(targetCountry, animationInfo);

    // Play audio warnings
    this.systems.audio?.safePlay("ui", "grabWarning");
    this.systems.audio?.playGrabAttempt(targetCountry);

    // Announce for screen readers
    this.systems.ui.announceForScreenReaders(`Trump is trying to grab ${targetCountry}! Smack his hand!`);

    // Start animation sequence
    this._startGrabAnimation(targetCountry, animationInfo.animationName);

    // Failsafe to complete grab if not blocked
    this.createTrackedTimeout(() => {
      if (this.systems.state.currentTarget === targetCountry) {
        console.log("[Engine] Failsafe: Force-completing grab for", targetCountry);
        this.grabSuccess(targetCountry);
      }
    }, 8000);
  }

  /**
   * Stop the grab (player successfully blocked)
   * @param {Event} event - The event that triggered the block
   */
  stopGrab(event) {
    const targetCountry = this.systems.state.currentTarget;
    if (!targetCountry) return;

    // Determine specific grab region
    const smackRegion = this._determineSmackRegion(targetCountry);

    // Stop animation
    if (this.systems.animation) {
      try {
        this.systems.animation.stop();
        this.systems.animation.changeState("idle");
      } catch (e) {
        console.warn("[Engine] Error stopping animation:", e);
      }
    }

    // Reset target immediately to prevent double-handling
    this._resetGrabTarget();

    // IMPORTANT: First stop any ongoing grab sound
    if (this.systems.audio) {
      try {
        this.systems.audio.stopGrabSound();
      } catch (e) {
        console.warn("[Engine] Error stopping grab sound:", e);
      }
    }

    // Also try global audio manager reference as failsafe
    if (window.audioManager && window.audioManager !== this.systems.audio) {
      try {
        window.audioManager.stopGrabSound();
      } catch (e) {
        console.warn("[Engine] Error stopping grab sound via global ref:", e);
      }
    }

    // Apply visual effects for the block
    if (window.trumpHandEffects) {
      window.trumpHandEffects.applyHitEffect();
      window.trumpHandEffects.highlightTargetCountry(targetCountry, false);
    } else if (this.systems.effects) {
      this.systems.effects.applyHitEffect();
      this.systems.effects.highlightTargetCountry(targetCountry, false);
    } else {
      // Fallback - direct DOM manipulation
      this._applyBasicHitEffect();
    }

    // Play sound effects
    let blockSoundPlayed = false;

    // Try systems.audio first
    if (this.systems.audio && typeof this.systems.audio.playSuccessfulBlock === "function") {
      try {
        this.systems.audio.playSuccessfulBlock(smackRegion);
        blockSoundPlayed = true;
      } catch (e) {
        console.warn("[Engine] Error playing block sound via systems.audio:", e);
      }
    }

    // Try window.audioManager if first method failed
    if (
      !blockSoundPlayed &&
      window.audioManager &&
      (window.audioManager !== this.systems.audio || typeof this.systems.audio?.playSuccessfulBlock !== "function")
    ) {
      try {
        window.audioManager.playSuccessfulBlock(smackRegion);
        blockSoundPlayed = true;
      } catch (e) {
        console.warn("[Engine] Error playing block sound via window.audioManager:", e);
      }
    }

    // Last resort fallback for audio
    if (!blockSoundPlayed) {
      try {
        if (window.audioManager?.play) {
          window.audioManager.play("defense", "slap");
          setTimeout(() => {
            window.audioManager.play("trump", "sob");
          }, 200);
        } else if (this.systems.audio?.play) {
          this.systems.audio.playRandom("defense", "slap");
          setTimeout(() => {
            this.systems.audio.playRandom("trump", "sob");
          }, 200);
        }
      } catch (e2) {
        console.warn("[Engine] All audio fallbacks failed:", e2);
      }
    }

    // Update game state and score
    this._updateScoreAfterBlock();

    // Play animation sequence for successful block
    this._playBlockAnimationSequence(smackRegion);

    // Announce for screen readers
    if (this.systems.ui?.announceForScreenReaders) {
      this.systems.ui.announceForScreenReaders(`Great job! You blocked Trump's grab on ${targetCountry}!`);
    }
  }

  /**
   * Handle a successful grab by Trump
   * @param {string} country - The country being grabbed
   */
  grabSuccess(country) {
    console.log(`[Engine] Trump successfully grabbed ${country}`);

    // Reset consecutive hits
    this.systems.state.consecutiveHits = 0;

    // Apply visual effects
    this.systems.ui.applyGrabSuccessVisuals(country);

    // Handle country-specific logic
    if (country === "eastCanada" || country === "westCanada") {
      this._handleCanadaGrab();
    } else {
      this._handleStandardCountryGrab(country);
    }
    if (this._checkGameOverCondition()) {

      // Stop UFO manager if present
      if (window.ufoManager) {
        window.ufoManager.state.autoSpawnEnabled = false;
        window.ufoManager.destroy();
      }
    
      // Stop all sounds EXCEPT background music
      if (this.systems.audio) {
        this.systems.audio.stopAll({exceptBackgroundMusic: true});
        this.systems.audio.stopGrabSound();
      }

      // Start fading out the background music over 3 seconds
      if (this.systems.audio && this.systems.audio.backgroundMusic) {
        const fadeOutDuration = 3000; // 3 seconds
        const fadeSteps = 30; // Number of volume adjustment steps
        const stepDuration = fadeOutDuration / fadeSteps;
        const startVolume = this.systems.audio.backgroundMusic.volume;
        const volumeStep = startVolume / fadeSteps;
        
        // Create interval to gradually reduce volume
        const fadeInterval = setInterval(() => {
          if (this.systems.audio.backgroundMusic) {
            const newVolume = this.systems.audio.backgroundMusic.volume - volumeStep;
            
            if (newVolume <= 0.02) {
              // If almost silent, stop music completely and clear interval
              clearInterval(fadeInterval);
              this.systems.audio.stopBackgroundMusic();
            } else {
              // Otherwise continue reducing volume
              this.systems.audio.backgroundMusic.volume = newVolume;
            }
          } else {
            // Clear interval if music no longer exists
            clearInterval(fadeInterval);
          }
        }, stepDuration);
        
        // Store the interval for proper cleanup
        if (this.resources && this.resources.intervals) {
          this.resources.intervals.push(fadeInterval);
        }
      }


      // Start with Trump's victory animation - but DON'T wait for it to finish
      if (this.systems.animation) {
        // Change to victory state but don't pass a callback
        this.systems.animation.changeState("victory");
      }

      this.systems.audio.safePlay("ui", "lose");

      // Start the world shrinking WHILE Trump is animating
      // Slight delay to let Trump start celebrating first
      setTimeout(() => {
        this.endGame(false, {
          showWorldShrinkAnimation: true,
          animationDuration: 20000,
          keepTrumpAnimating: true, // New flag to keep Trump animating
        });

       
      }, 2000);

      if (this.systems.audio) {
        // Try to play a victory/evil laugh sound
        this.systems.audio.safePlay("trump", "evilLaugh");
        console.log("laugh");
      }

      return;
    }
    // Play victory animation and continue game
    if (this.systems.animation) {
      this.systems.animation.changeState("victory", () => {
        // Continue game loop
        this.initiateGrab();
      });
    } else {
      // Fallback if no animation manager
      this.createTrackedTimeout(() => this.initiateGrab(), 1000);
    }
  }

  /**
   * Toggle game pause state
   */
  togglePause() {
    const state = this.systems.state;
    state.isPaused = !state.isPaused;

    // Update UI
    this.systems.ui.updatePauseButton(state.isPaused);

    if (state.isPaused) {
      this._pauseGame();
    } else {
      this._resumeGame();
    }
  }

  /**
   * Create a tracked timeout that will be properly cleaned up on game end
   * @param {Function} callback - Function to call when timeout completes
   * @param {number} delay - Delay in milliseconds
   * @returns {number} - Timeout ID
   */
  createTrackedTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
      // Remove from tracked timeouts first
      const index = this.resources.timeouts.indexOf(timeoutId);
      if (index !== -1) this.resources.timeouts.splice(index, 1);

      // Then execute callback
      callback();
    }, delay);

    // Track this timeout
    this.resources.timeouts.push(timeoutId);
    return timeoutId;
  }

  /**
   * Create a tracked interval that will be properly cleaned up on game end
   * @param {Function} callback - Function to call on each interval
   * @param {number} delay - Interval delay in milliseconds
   * @returns {number} - Interval ID
   */
  createTrackedInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    this.resources.intervals.push(intervalId);
    return intervalId;
  }

  // PRIVATE METHODS

  /**
   * Bind class methods to maintain 'this' context
   * @private
   */
  _bindMethods() {
    // Grab/block mechanics
    this.initiateGrab = this.initiateGrab.bind(this);
    this.stopGrab = this.stopGrab.bind(this);
    this.grabSuccess = this.grabSuccess.bind(this);

    // Game flow control
    this.togglePause = this.togglePause.bind(this);
    this.startGame = this.startGame.bind(this);
    this.endGame = this.endGame.bind(this);
    this.restartGame = this.restartGame.bind(this);

    // Resource management
    this.createTrackedTimeout = this.createTrackedTimeout.bind(this);
    this.createTrackedInterval = this.createTrackedInterval.bind(this);

    // Game loop
    this._updateGameFrame = this._updateGameFrame.bind(this);
  }

  /**
   * Set up additional game-specific managers
   * @private
   */
  _setupAdditionalManagers() {
    // Hand hitbox manager
    if (typeof HandHitboxManager === "function") {
      if (!window.handHitboxManager) {
        window.handHitboxManager = new HandHitboxManager();
      }
      this.systems.collision = window.handHitboxManager;
    }

    // Trump hand effects controller
    if (typeof TrumpHandEffectsController === "function" && this.systems.state) {
      if (!window.trumpHandEffects) {
        window.trumpHandEffects = new TrumpHandEffectsController(this.systems.state);
      }
      this.systems.effects = window.trumpHandEffects;
    }

    // Protestor hitbox manager
    if (typeof ProtestorHitboxManager === "function") {
      if (!window.protestorHitboxManager) {
        window.protestorHitboxManager = new ProtestorHitboxManager();
      }
      this.systems.protestorHitbox = window.protestorHitboxManager;
    }

    // Freedom manager
    if (typeof FreedomManager === "function") {
      if (!window.freedomManager) {
        window.freedomManager = new FreedomManager(this.systems.state, this.systems.ui.elements, this.systems.audio);
      }
      this.systems.freedom = window.freedomManager;

      // Connect protestor hitbox manager to freedom manager
      if (this.systems.protestorHitbox) {
        this.systems.freedom.protestorHitboxManager = this.systems.protestorHitbox;

        if (typeof this.systems.freedom.initProtestorHitboxManager === "function") {
          this.systems.freedom.initProtestorHitboxManager();
        }
      }
    }

    // Smack manager
    if (typeof SmackManager === "function" && this.systems.animation) {
      if (!window.smackManager) {
        window.smackManager = new SmackManager(this.systems.animation);
      }
      this.systems.smack = window.smackManager;
    }

    // Speed manager
    if (typeof GameSpeedManager === "function") {
      if (!window.speedManager) {
        window.speedManager = new GameSpeedManager(this.systems.state, this.systems.animation, this.systems.audio);
        window.speedManager.init();
      }
      this.systems.speed = window.speedManager;
    }

    // UFO manager
    if (typeof UFOManager === "function") {
      if (!window.ufoManager) {
        window.ufoManager = new UFOManager();
      }
      this.systems.ufo = window.ufoManager;
    }

    console.log("[Engine] Additional managers initialized:", {
      handHitbox: !!this.systems.collision,
      trumpEffects: !!this.systems.effects,
      protestorHitbox: !!this.systems.protestorHitbox,
      freedom: !!this.systems.freedom,
      smack: !!this.systems.smack,
      speed: !!this.systems.speed,
      ufo: !!this.systems.ufo,
    });
  }

  /**
   * Connect systems together
   * @private
   */
  _connectSystems() {
    // Connect UI to state for updates
    this.systems.ui.connectState(this.systems.state);

    // Connect input to game elements
    this.systems.input.connectUI(this.systems.ui);
  }

  /**
   * Initialize debug features
   * @private
   */
  _initDebug() {
    if (typeof DebugManager === "function") {
      // Create a UI elements reference object using the system.ui elements
      const debugElements = this.systems && this.systems.ui ? this.systems.ui.elements : {};

      const debugManager = new DebugManager(
        debugElements, // Pass existing UI elements or empty object
        this.systems.state,
        this.systems.animation
      );

      window.debugManager = debugManager;
      debugManager.init();

      // Set up debug UI
      if (this.systems.ui) {
        this.systems.ui.setupDebugPanel(debugManager);
      }

      // Connect audio to debug
      if (this.systems.audio) {
        debugManager.audioManager = this.systems.audio;

        // Add a global test function for console debugging
        window.testAudio = function (category, name) {
          return debugManager.audioManager?.play(category, name) || "AudioManager not available";
        };
      }
    }
  }

  /**
   * Start the game loop
   * @private
   */
  _startGameLoop() {
    console.log("[Engine] Starting game loop");

    // Set playing state
    this.systems.state.isPlaying = true;

    // Reset timing data
    this.systems.state.lastFrameTime = performance.now();

    // Start countdown timer
    this.systems.state.countdownTimer = this.createTrackedInterval(this._updateCountdown.bind(this), 1000);

    // Start animation loop
    this._requestAnimationFrame();
  }

  /**
   * Stop the game loop
   * @private
   */
  _stopGameLoop() {
    console.log("[Engine] Stopping game loop");

    // Cancel animation frame if it exists
    if (this.systems.state.currentAnimationFrame) {
      cancelAnimationFrame(this.systems.state.currentAnimationFrame);
      this.systems.state.currentAnimationFrame = null;
    }

    // Clear countdown timer
    if (this.systems.state.countdownTimer) {
      clearInterval(this.systems.state.countdownTimer);
      this.systems.state.countdownTimer = null;
    }
  }

  /**
   * Clean up all tracked resources
   * @private
   */
  _cleanupResources() {
    // Clear all timeouts
    this.resources.timeouts.forEach((id) => clearTimeout(id));
    this.resources.timeouts = [];

    // Clear all intervals
    this.resources.intervals.forEach((id) => clearInterval(id));
    this.resources.intervals = [];

    // Cancel all animation frames
    this.resources.animationFrames.forEach((id) => cancelAnimationFrame(id));
    this.resources.animationFrames = [];
  }

  /**
   * Reset all game systems
   * @private
   */
  _resetSystems() {
    console.log("[Engine] Resetting all systems");

    // Reset game state
    this.systems.state.reset();

    // Reset audio
    if (this.systems.audio) {
      this.systems.audio.stopAll();
      this.systems.audio.reset();
    }

    // Reset animation
    if (this.systems.animation) {
      this.systems.animation.stop();
      this.systems.animation.isPaused = false;
      this.systems.animation.changeState("idle");
    }

    // Reset freedom manager
    if (this.systems.freedom) {
      this.systems.freedom.reset();
    }

    // Reset collision detection
    if (this.systems.collision && typeof this.systems.collision.reset === "function") {
      this.systems.collision.reset();
    }

    // Reset other managers if they exist
    if (window.protestorHitboxManager) {
      window.protestorHitboxManager.cleanupAll();
    }

    if (window.speedManager) {
      window.speedManager.reset();
      window.speedManager.startSpeedProgression();
    }
  }

  /**
   * Request a new animation frame
   * @private
   */
  _requestAnimationFrame() {
    this.systems.state.currentAnimationFrame = requestAnimationFrame(this._updateGameFrame);
    this.resources.animationFrames.push(this.systems.state.currentAnimationFrame);
  }

  /**
   * Update the game on each animation frame
   * @param {number} timestamp - Current timestamp
   * @private
   */
  _updateGameFrame(timestamp) {
    // Check if game is currently playing
    if (!this.systems.state.isPlaying) {
      // Ensure grab sounds stop when game isn't playing
      if (this.systems.audio) {
        this.systems.audio.stopGrabSound();
      }
      return;
    }

    // Calculate delta time in milliseconds
    const deltaTime = timestamp - (this.systems.state.lastFrameTime || timestamp);
    this.systems.state.lastFrameTime = timestamp;

    // Update freedom system if available
    if (this.systems.freedom) {
      this.systems.freedom.update(deltaTime);
    }

    // Continue animation loop
    this._requestAnimationFrame();
  }

  /**
   * Update the countdown timer
   * @private
   */
  _updateCountdown() {
    // Skip if game is paused
    if (this.systems.state.isPaused) return;

    // Decrement time
    this.systems.state.timeRemaining--;

    // Update UI
    this.systems.ui.updateProgressBar(this.systems.state.timeRemaining, this.config.GAME_DURATION);

    this.systems.ui.updateHUD(this.systems.state);

    // Announce time at key intervals
    if (this.systems.state.timeRemaining <= 30 && this.systems.state.timeRemaining % 10 === 0) {
      this.systems.ui.announceForScreenReaders(`Warning: ${this.systems.state.timeRemaining} seconds remaining`);
    }

    // Check for time-based win condition
    if (this.systems.state.timeRemaining <= 0) {
      this.endGame(true); // Win by surviving the time limit
    }
  }

  _prepareAudio() {
    if (!this.systems.audio) return;
  
    try {
      // Stop any existing sounds first
      this.systems.audio.stopAll();
  
      // Check if we're restarting
      const needsRestart = sessionStorage.getItem("audioNeedsRestart") === "true";
      if (needsRestart) {
        sessionStorage.removeItem("audioNeedsRestart"); // Clear the flag
      }
  
      // Create and play a silent sound to unlock audio on mobile
      const silentSound = new Audio(
        "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAADAABgYGBgYGBgYGBgkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDA4ODg4ODg4ODg4ODg//////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAAAwDVxttG//sUxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
      );
      silentSound.volume = 0.01;
  
      // Try to play the silent sound (may fail on some browsers without user interaction)
      silentSound.play().catch((e) => console.log("Silent sound play prevented"));
  
      // Use the standard unlock method
      const unlockPromise = this.systems.audio.unlock();
  
      unlockPromise
        .then(() => {
          // Store that we've unlocked audio for this session
          try {
            sessionStorage.setItem("audioUnlocked", "true");
          } catch (e) {
            console.warn("[Engine] Could not store audio unlock state:", e);
          }
  
          // Start background music with appropriate timing - ALWAYS START MUSIC AFTER RESTART
          const musicStartDelay = needsRestart ? 300 : 1000;
  
          // Start background music after a short delay
          this.createTrackedTimeout(() => {
            // Force background music restart on game restart
            if (needsRestart || !this.systems.audio.backgroundMusicPlaying) {
              if (this.systems.audio.startBackgroundMusic) {
                this.systems.audio.startBackgroundMusic().catch((e) => {
                  console.warn("[Engine] Could not start background music:", e);
                  // Try fallback method
                  this._startDirectBackgroundMusic();
                });
              } else {
                // If method is missing, use fallback
                this._startDirectBackgroundMusic();
              }
            }
          }, musicStartDelay);
  
          // Load all game sounds
          this.systems.audio.preloadGameSounds();
        })
        .catch((err) => {
          console.warn("[Engine] Audio unlock failed:", err);
          // Try fallback music anyway
          this._startDirectBackgroundMusic();
        });
    } catch (e) {
      console.warn("[Engine] Error in _prepareAudio:", e);
      // Use fallback approach for audio
      this._startDirectBackgroundMusic();
    }
  }

  /**
   * Direct fallback for background music
   * @private
   */
  _startDirectBackgroundMusic() {
    console.log("[Engine] Using direct background music method");

    try {
      // Clean up any existing fallback
      if (this._fallbackMusic) {
        this._fallbackMusic.pause();
        this._fallbackMusic = null;
      }

      // Create new Audio element
      const audio = new Audio();

      // Use audio system path if available, or fallback to direct path
      let musicSrc;
      if (this.systems.audio && typeof this.systems.audio._resolvePath === "function") {
        musicSrc = this.systems.audio._resolvePath("sounds/background-music.mp3");
      } else {
        // Try to construct path
        const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
        musicSrc = baseUrl + "sounds/background-music.mp3";
      }

      audio.src = musicSrc;
      audio.loop = true;
      audio.volume = 0.7;

      // On mobile, play on next user interaction if initial play fails
      audio.play().catch((e) => {
        console.warn("[Engine] Fallback music initial play failed:", e);

        // Try playing on next user interaction
        const playOnInteraction = function () {
          audio.play().catch((e2) => console.warn("[Engine] Fallback music interaction play failed:", e2));
          document.removeEventListener("click", playOnInteraction);
          document.removeEventListener("touchstart", playOnInteraction);
        };

        document.addEventListener("click", playOnInteraction, { once: true });
        document.addEventListener("touchstart", playOnInteraction, { once: true });
      });

      // Store for cleanup
      this._fallbackMusic = audio;
    } catch (e) {
      console.warn("[Engine] Could not start fallback music:", e);
    }
  }

  /**
   * Pause the game
   * @private
   */
  _pauseGame() {
    console.log("[Engine] Pausing game in _pauseGame");

    // Stop countdown timer
    clearInterval(this.systems.state.countdownTimer);
    this.systems.state.countdownTimer = null;

    // Pause animations
    if (this.systems.animation) {
      this.systems.animation.pause();
    }

    // Show pause overlay
    this.systems.ui.createPauseOverlay();

    // Pause audio
    if (this.systems.audio && typeof this.systems.audio.pauseAll === "function") {
      this.systems.audio.pauseAll();
    }

    this.systems.ui.announceForScreenReaders("Game paused");
  }

  /**
   * Resume the game
   * @private
   */
  _resumeGame() {
    console.log("[Engine] Resuming game");

    // Remove pause overlay
    this.systems.ui.removePauseOverlay();

    // Resume timers
    this.systems.state.countdownTimer = this.createTrackedInterval(this._updateCountdown.bind(this), 1000);

    // Resume animations
    if (this.systems.animation) {
      this.systems.animation.resume();
    }

    // Restart grab sequence
    this.initiateGrab();

    // Resume audio
    if (this.systems.audio && typeof this.systems.audio.resumeAll === "function") {
      this.systems.audio.resumeAll();
    }

    this.systems.ui.announceForScreenReaders("Game resumed");
  }

  /**
   * Select a target country for grabbing
   * @private
   * @returns {string|null} The selected country name or null if none available
   */
  _selectTargetCountry() {
    const state = this.systems.state;
    const availableCountries = Object.keys(state.countries).filter((country) => {
      return state.countries[country].claims < state.countries[country].maxClaims;
    });

    if (availableCountries.length === 0) {
      return null;
    }

    return availableCountries[Math.floor(Math.random() * availableCountries.length)];
  }

  /**
   * Select an animation for the target country
   * @private
   * @param {string} targetCountry - The target country
   * @returns {Object} Animation info
   */
  _selectAnimationForCountry(targetCountry) {
    const possibleAnimations = this.systems.state.countryAnimations[targetCountry];
    const animationName = possibleAnimations[Math.floor(Math.random() * possibleAnimations.length)];

    return {
      animationName,
      isEastCanada: animationName === "grabEastCanada",
      isWestCanada: animationName === "grabWestCanada",
    };
  }

  /**
   * Prepare the grab sequence
   * @private
   * @param {string} targetCountry - The target country
   * @param {Object} animationInfo - Animation information
   */
  _prepareGrabSequence(targetCountry, animationInfo) {
    // Load country-specific sounds when targeting a country
    if (this.systems.audio && typeof this.systems.audio.loadCountrySounds === "function") {
      this.systems.audio.loadCountrySounds(targetCountry);
    }

    // Set state flags
    this.systems.state.currentTarget = targetCountry;
    this.systems.state.isEastCanadaGrab = animationInfo.isEastCanada;
    this.systems.state.isWestCanadaGrab = animationInfo.isWestCanada;

    // Check if this is the first block
    const isBeforeFirstBlock = this.systems.state.stats.successfulBlocks === 0;

    // Try multiple methods to handle the hitbox preparation
    if (window.trumpHandEffects) {
      // Preferred approach - use the effects controller
      window.trumpHandEffects.makeHittable(isBeforeFirstBlock);
      window.trumpHandEffects.highlightTargetCountry(targetCountry, true);
      // Explicitly check for prompt
      window.trumpHandEffects.updatePromptVisibility();
    } else {
      // Fallback - direct DOM manipulation
      const visual = document.getElementById("trump-hand-visual");
      const hitbox = document.getElementById("trump-hand-hitbox");

      if (hitbox) {
        hitbox.style.visibility = "visible";
        hitbox.style.pointerEvents = "auto";
        hitbox.style.display = "block";
        hitbox.style.cursor = "pointer";
        hitbox.style.zIndex = "300";
        hitbox.classList.add("hittable");
      }

      if (visual) {
        visual.style.visibility = "visible";
        visual.style.display = "block";
        visual.style.opacity = "0.5";
        visual.style.border = "2px dashed black";
        visual.classList.add("hittable");
      }
    }
  }

  /**
   * Start the grab animation
   * @private
   * @param {string} targetCountry - The target country
   * @param {string} animationName - The animation name
   */
  _startGrabAnimation(targetCountry, animationName) {
    if (!this.systems.animation) return;

    // Start the animation with completion callback
    this.systems.animation.changeState(animationName, () => {
      try {
        // FIRST: Stop the grab sound regardless of outcome
        if (this.systems.audio) {
          this.systems.audio.stopGrabSound();
        }

        // This runs when grab completes without being blocked
        if (this.systems.state.currentTarget === targetCountry && this.systems.state.isPlaying && !this.systems.state.isPaused) {
          // Handle successful grab
          this.grabSuccess(targetCountry);
        } else if (this.systems.state.isPlaying && !this.systems.state.isPaused) {
          // Grab was interrupted or blocked - start next cycle
          this.initiateGrab();
        }

        // Clean up visual elements
        this.systems.ui.cleanupGrabVisuals();
      } catch (error) {
        console.error("[Engine] Error in grab animation callback:", error);
        // Ensure we don't get stuck - reset state and continue
        this._resetGrabTarget();
        if (this.systems.state.isPlaying && !this.systems.state.isPaused) {
          this.initiateGrab();
        }
      }
    });
  }

  /**
   * Apply a basic hit effect as fallback
   * @private
   */
  _applyBasicHitEffect() {
    const gameContainer = document.getElementById("game-container") || document.body;
    gameContainer.classList.add("screen-shake");

    // Remove class after animation completes
    setTimeout(() => {
      gameContainer.classList.remove("screen-shake");
    }, 700);

    // Add simple visual effect to trump-hand-visual
    const visual = document.getElementById("trump-hand-visual");
    if (visual) {
      visual.classList.remove("hittable");
      visual.style.opacity = "1";
      visual.style.border = "none";
      visual.classList.add("hit");
    }

    // Add non-interactable to hitbox
    const hitbox = document.getElementById("trump-hand-hitbox");
    if (hitbox) {
      hitbox.classList.remove("hittable");
    }
  }

  /**
   * Determine the specific region being smacked
   * @private
   * @param {string} targetCountry - The target country
   * @returns {string} The specific region
   */
  _determineSmackRegion(targetCountry) {
    if (targetCountry === "canada") {
      if (this.systems.state.isEastCanadaGrab) {
        return "eastCanada";
      } else if (this.systems.state.isWestCanadaGrab) {
        return "westCanada";
      }
    }
    return targetCountry;
  }

  /**
   * Reset the grab target
   * @private
   */
  _resetGrabTarget() {
    this.systems.state.currentTarget = null;
    this.systems.state.isEastCanadaGrab = false;
    this.systems.state.isWestCanadaGrab = false;
  }

  /**
   * Update score after a successful block
   * @private
   */
  _updateScoreAfterBlock() {
    const state = this.systems.state;

    // Check if this is the FIRST successful block
    if (state.stats.successfulBlocks === 0 && window.handHitboxManager) {
      window.handHitboxManager.handleSuccessfulHit();
    }

    // Increase score
    state.score += 10;

    // Track consecutive hits and stats
    state.consecutiveHits++;
    state.stats.successfulBlocks++;

    // Update HUD
    this.systems.ui.updateHUD(state);

    // Announce for screen readers
    this.systems.ui.announceForScreenReaders(`Hand blocked! +10 points. Total score: ${state.score}`);
  }

  /**
   * Play the block animation sequence
   * @private
   * @param {string} smackRegion - The region being smacked
   */
  _playBlockAnimationSequence(smackRegion) {
    // Set a flag to prevent multiple animation sequences
    if (this.systems.state.isPlayingAnimationSequence) return;
    this.systems.state.isPlayingAnimationSequence = true;

    const finishSequence = () => {
      this.systems.state.isPlayingAnimationSequence = false;
      this.initiateGrab();
    };

    // Use smack manager directly from global if available
    if (window.smackManager) {
      window.smackManager.playSmackAnimation(smackRegion, () => {
        // After smack completes, play slapped animation
        if (this.systems.animation) {
          this.systems.animation.changeState("slapped", finishSequence);
        } else {
          finishSequence();
        }
      });
    } else if (this.systems.smack) {
      // Use smack manager if available
      this.systems.smack.playSmackAnimation(smackRegion, () => {
        // After smack completes, play slapped animation
        if (this.systems.animation) {
          this.systems.animation.changeState("slapped", finishSequence);
        } else {
          finishSequence();
        }
      });
    } else if (this.systems.animation) {
      // Fallback path if no smack manager
      this.systems.animation.changeState("slapped", finishSequence);
    } else {
      // Last resort fallback
      this.createTrackedTimeout(finishSequence, 1000);
    }
  }

  /**
   * Handle successful Canada grab
   * @private
   */
  _handleCanadaGrab() {
    const state = this.systems.state;

    // Increment claim on the shared Canada entity
    state.countries.canada.claims = Math.min(state.countries.canada.claims + 1, state.countries.canada.maxClaims);

    // Get current claim count
    const claimCount = state.countries.canada.claims;

    // Play appropriate sounds
    if (this.systems.audio) {
      if (claimCount < state.countries.canada.maxClaims) {
        this.systems.audio.playSuccessfulGrab("canada");
      } else {
        this.systems.audio.playCountryAnnexed("canada");
      }
    }

    // Update flag overlay
    this.systems.ui.updateFlagOverlay("canada", claimCount);

    // Announce for screen readers
    this.systems.ui.announceForScreenReaders(`Trump has claimed part of Canada! ${claimCount} out of 3 parts taken.`);
  }

  /**
   * Handle standard country grab
   * @private
   * @param {string} country - The country being grabbed
   */
  _handleStandardCountryGrab(country) {
    const state = this.systems.state;

    // Increment claim count
    state.countries[country].claims = Math.min(state.countries[country].claims + 1, state.countries[country].maxClaims);

    // Get current claim count
    const claimCount = state.countries[country].claims;

    // Play appropriate sounds
    if (this.systems.audio) {
      if (claimCount < state.countries[country].maxClaims) {
        this.systems.audio.playSuccessfulGrab(country);
      } else {
        this.systems.audio.playCountryAnnexed(country);
      }
    }

    // Update flag overlay
    this.systems.ui.updateFlagOverlay(country, claimCount);

    // Announce for screen readers
    this.systems.ui.announceForScreenReaders(`Trump has claimed part of ${country}! ${claimCount} out of 3 parts taken.`);
  }

  _checkGameOverCondition() {
    const state = this.systems.state;

    // Count annexed countries
    const countriesToCheck = this.config.COUNTRIES;
    const claimedCountries = countriesToCheck.filter((country) => state.countries[country].claims >= state.countries[country].maxClaims);

    // Update music intensity
    if (this.systems.audio) {
      this.systems.audio.updateMusicIntensity(claimedCountries.length);
    }

    // Game over if all countries are claimed
    const isGameOver = claimedCountries.length >= countriesToCheck.length;

    if (isGameOver) {
      // Only announce - DON'T end the game here
      this.systems.ui.announceForScreenReaders("All countries have fallen to Trump! Game over!");
    }

    return isGameOver;
  }
  /**
   * Schedule auto-restart after game over
   * @private
   */
  _scheduleAutoRestart() {
    this.createTrackedTimeout(() => {
      const recorderModal = document.getElementById("voice-recorder-modal");
      const thankYouModal = document.getElementById("thank-you-message");

      // Check if modals are hidden and no interaction occurred
      const canAutoRestart =
        (!recorderModal || recorderModal.classList.contains("hidden")) &&
        (!thankYouModal || thankYouModal.classList.contains("hidden")) &&
        (!window.voiceRecorder || window.voiceRecorder.userInteracted !== true);

      if (canAutoRestart) {
        this.restartGame();
      }
    }, this.config.AUTO_RESTART_DELAY);
  }
}

/**
 * Game State - Manages all game data and state
 */
class GameState {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  /**
   * Reset state to initial values
   */
  reset() {
    // Core state flags
    this.isPlaying = false;
    this.isPaused = false;
    this.isPlayingAnimationSequence = false;

    // Game progress
    this.score = 0;
    this.timeRemaining = this.config.GAME_DURATION;
    this.gameSpeedMultiplier = 1.0;
    this.countdownTimer = null;
    this.currentTarget = null;
    this.consecutiveHits = 0;

    // Grab state
    this.isEastCanadaGrab = false;
    this.isWestCanadaGrab = false;

    // Animation state
    this.currentAnimationFrame = null;
    this.lastFrameTime = 0;

    // Map state
    this.mapScale = 1.0;
    this.mapOffsetX = 0;
    this.mapOffsetY = 0;

    // Statistics
    this.stats = {
      successfulBlocks: 0,
      countriesDefended: 0,
    };

    // Reset countries
    this.countries = this._createInitialCountryState();

    // Set up animation targets
    this.countryAnimations = {
      canada: ["grabEastCanada", "grabWestCanada"],
      mexico: ["grabMexico"],
      greenland: ["grabGreenland"],
    };
  }

  /**
   * Create initial country state
   * @private
   * @returns {Object} Initial country state
   */
  _createInitialCountryState() {
    const countries = {};

    if (this.config.COUNTRIES) {
      this.config.COUNTRIES.forEach((country) => {
        countries[country] = {
          claims: 0,
          maxClaims: 3, // Default max claims
        };
      });
    }

    return countries;
  }
}

/**
 * UI Manager - Handles all DOM interactions and visual updates
 */
class UIManager {
  constructor() {
    this.elements = {
      screens: {},
      buttons: {},
      hud: {},
      game: {},
      countries: {},
      trump: null,
    };

    this.state = null;
    this.announcer = null;
  }

  /**
   * Initialize the UI manager
   * @param {Document} document - Document object
   */
  init(document) {
    // Get element references
    this._collectElementReferences(document);

    // Create screen reader announcer
    this._createScreenReaderAnnouncer(document);

    // Set up responsive handlers
    this._setupResponsiveHandlers();

    // Add accessibility attributes
    this._addAccessibilityAttributes();

    // Create the announcer for this instance
    this.announceForScreenReaders = this.announceForScreenReaders.bind(this);
  }

  /**
   * Connect to game state
   * @param {GameState} state - Game state reference
   */
  connectState(state) {
    this.state = state;
  }

  /**
   * Show the game screen
   */
  showGameScreen() {
    // Hide intro screen, show game screen
    this.elements.screens.intro.classList.add("hidden");
    this.elements.screens.game.classList.remove("hidden");

    // Create intro animations
    this._animateGameIntro();
  }

  _applyScreenShake(element, intensity = 5, duration = 5000) {
    if (!element) return;

    let startTime = null;
    const shake = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (elapsed < duration) {
        // Calculate decreasing intensity
        const currentIntensity = intensity * (1 - elapsed / duration);

        // Random offset
        const offsetX = (Math.random() - 0.5) * currentIntensity;
        const offsetY = (Math.random() - 0.5) * currentIntensity;

        // Apply transform
        element.style.transform = `translate(${offsetX}px, ${offsetY}px)`;

        // Continue shaking
        requestAnimationFrame(shake);
      } else {
        // Reset transform when done
        element.style.transform = "";
      }
    };

    requestAnimationFrame(shake);
  }

  /**
   * Show a brief game over scene before the full screen
   * @param {boolean} playerWon - Whether player won
   * @param {Function} callback - Callback to show full game over screen
   * @param {number} duration - Duration to show brief scene
   */
  showBriefGameOverScene(playerWon, callback, duration = 1500) {
    // Create or get brief game over overlay
    let briefOverlay = document.getElementById("brief-game-over-overlay");
    if (!briefOverlay) {
      briefOverlay = document.createElement("div");
      briefOverlay.id = "brief-game-over-overlay";
      briefOverlay.className = "brief-game-over-overlay";
      briefOverlay.innerHTML = `
          <div class="brief-game-over-content">
              <h2>${playerWon ? "VICTORY DENIED!" : "COUNTRIES CLAIMED!"}</h2>
          </div>
      `;
      document.body.appendChild(briefOverlay);
    }

    // Show overlay
    briefOverlay.classList.add("active");

    // Hide game screen
    this.elements.screens.game.classList.add("hidden");

    // Schedule transition to full game over screen
    setTimeout(() => {
      // Remove brief overlay
      briefOverlay.classList.remove("active");
      if (briefOverlay.parentNode) {
        briefOverlay.parentNode.removeChild(briefOverlay);
      }

      // Call callback to show full game over screen
      callback();
    }, duration);
  }

  /**
   * Show game over screen
   * @param {boolean} playerWon - Whether player won
   * @param {GameState} state - Current game state
   */
  showGameOverScreen(playerWon, state) {
    // Hide game screen, show game over screen
    this.elements.screens.game.classList.add("hidden");
    this.elements.screens.gameOver.classList.remove("hidden");

    // Calculate time statistics
    const totalGameTime = state.config.GAME_DURATION;
    const timeSurvived = totalGameTime - state.timeRemaining;
    const timeDisplay = this._formatTimeSurvived(timeSurvived, totalGameTime);

    // Update game over animation
    this._updateGameOverAnimation(playerWon);

    // Update game over stats
    this._updateGameOverStats(timeDisplay, playerWon, state);

    // Announce result for screen readers
    const announcement = playerWon
      ? "Victory! You successfully defended the neighboring countries!"
      : "Game over. The neighboring countries have been claimed by Trump.";
    this.announceForScreenReaders(announcement);

    // Initialize share buttons if function exists
    if (typeof initializeShareButtonsOnGameOver === "function") {
      initializeShareButtonsOnGameOver();
    }

    // Set up restart button
    const restartButton = document.getElementById("restart-button");
    if (restartButton) {
      // Remove any existing listeners with cloning trick
      const newButton = restartButton.cloneNode(true);
      restartButton.parentNode.replaceChild(newButton, restartButton);

      // Add fresh click handler
      newButton.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("Restart button clicked directly from game over screen");
        if (window.gameEngine) {
          window.gameEngine.restartGame();
        }
      });
    }
  }

  /**
   * Position game elements based on map size
   */
  positionElements() {
    // Ensure map is loaded before positioning
    if (!this.elements.game.map || !this.state) return;

    const mapRect = this.elements.game.map.getBoundingClientRect();

    // Check if map has loaded
    if (mapRect.width === 0 || mapRect.height === 0) {
      setTimeout(() => this.positionElements(), 100);
      return;
    }

    // Calculate map scale and offset
    this.state.mapScale = mapRect.width / this.elements.game.map.naturalWidth;
    this.state.mapOffsetX = mapRect.left;
    this.state.mapOffsetY = mapRect.top;

    // Position child elements
    this.positionCountryFlagOverlays();
    this.positionTrumpCharacter();
  }

  showWorldShrinkAnimation(onCompleteCallback, duration = 8000, options = {}) {
    const keepTrumpAnimating = options?.keepTrumpAnimating || false;
    console.log("Starting smooth world shrink animation");

    // Get the game container and screen FIRST - before any function calls
    const gameContainer = this.elements.game.container;
    const gameScreen = this.elements.screens.game;

    if (!gameContainer || !gameScreen) {
      console.error("Required game elements not found");
      if (typeof onCompleteCallback === "function") onCompleteCallback();
      return;
    }

    // NOW you can apply screen shake if you added that function
    // this._applyScreenShake(gameScreen, 3, duration * 0.6);

    // Create dark overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
    overlay.style.zIndex = "9000";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.pointerEvents = "none";

    // Add game over text
    const gameOverText = document.createElement("div");
    gameOverText.textContent = "╥﹏╥";
    gameOverText.style.color = "white";
    gameOverText.style.fontSize = "clamp(14px, 5vmin, 42px)";
    gameOverText.style.fontWeight = "bold";
    gameOverText.style.textAlign = "center";
    gameOverText.style.textShadow = "2px 2px 4px rgba(0, 0, 0, 0.9)";
    gameOverText.style.opacity = "0";
    overlay.appendChild(gameOverText);
    document.body.appendChild(overlay);

    // Prepare game container for animation
    gameContainer.style.transformOrigin = "center center";

    // Create smooth manual animation using requestAnimationFrame
    let startTime = null;
    let animationFrame = null;

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;

      // Calculate progress (0 to 1)
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply smooth darkening to overlay
      overlay.style.backgroundColor = `rgba(0, 0, 0, ${progress * 0.8})`;

      // Fade in text
      if (progress < 0.5) {
        // First half: fade in the text
        gameOverText.style.opacity = (progress * 2).toString();
      } else {
        // Keep text visible
        gameOverText.style.opacity = "1";
      }

      // Use a cubic easing function for smooth deceleration
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      // Calculate scale from 1 down to 0.1
      const scale = 1 - easeOutCubic * 0.9;

      // Apply transform smoothly
      gameContainer.style.transform = `scale(${scale})`;
      gameContainer.style.opacity = (1 - easeOutCubic * 0.9).toString();

      // Continue animation until complete
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        // Animation complete, clean up
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        gameContainer.style.transform = "";
        gameContainer.style.opacity = "";

        // Stop Trump's animation if it was continuing
        if (window.animationManager && keepTrumpAnimating) {
          window.animationManager.stop();
        }

        // Hide game screen
        gameScreen.classList.add("hidden");

        // Execute callback
        if (typeof onCompleteCallback === "function") {
          onCompleteCallback();
        }
      }
    }

    // Start animation
    animationFrame = requestAnimationFrame(animate);

    // Store the animation frame ID for potential cleanup
    if (window.gameEngine && window.gameEngine.resources) {
      window.gameEngine.resources.animationFrames.push(animationFrame);
    }
  }

  /**
   * Position country flag overlays
   */
  positionCountryFlagOverlays() {
    const mapBackground = this.elements.game.map;
    if (!mapBackground) return;

    // Get map dimensions
    const mapRect = mapBackground.getBoundingClientRect();

    // Countries to position
    const countryFlags = Object.keys(this.elements.countries);

    countryFlags.forEach((country) => {
      const flagOverlay = this.elements.countries[country];
      if (!flagOverlay) return;

      // Add positioning class
      flagOverlay.classList.add("positioned-flag-overlay");

      // Add accessibility attributes
      flagOverlay.setAttribute("role", "img");
      flagOverlay.setAttribute("aria-label", `${country.charAt(0).toUpperCase() + country.slice(1)} flag overlay`);

      // Set CSS custom properties for positioning
      flagOverlay.style.setProperty("--map-width", `${mapRect.width}px`);
      flagOverlay.style.setProperty("--map-height", `${mapRect.height}px`);
      flagOverlay.style.setProperty("--map-top", `${mapRect.top}px`);
      flagOverlay.style.setProperty("--map-left", `${mapRect.left}px`);
    });
  }

  /**
   * Position Trump character
   */
  positionTrumpCharacter() {
    if (!this.elements.trump) return;

    const trumpContainer = this.elements.trump.container;
    const trumpSprite = this.elements.trump.sprite;

    if (!trumpContainer || !trumpSprite) return;

    // Get map dimensions and position - IMPORTANT: Force reflow for Chrome mobile
    const mapElement = this.elements.game.map;

    // Force layout recalculation in Chrome mobile
    if (window.isChromeOnMobile) {
      void mapElement.offsetHeight;
    }

    // Get FRESH bounding rect after forced reflow
    const mapRect = mapElement.getBoundingClientRect();

    console.log("[Chrome Debug] Map position:", mapRect.top, mapRect.left);

    // CRITICAL: For Chrome Mobile, we need to use absolute positioning with exact values
    if (window.isChromeOnMobile) {
      trumpContainer.style.position = "absolute";
      trumpContainer.style.top = `${mapRect.top}px`;
      trumpContainer.style.left = `${mapRect.left}px`;
      trumpContainer.style.width = `${mapRect.width}px`;
      trumpContainer.style.height = `${mapRect.height}px`;
      trumpContainer.style.transform = "translateZ(0)"; // Force GPU acceleration
      trumpContainer.style.willChange = "transform";

      // Apply same to other elements
      document.querySelectorAll(".country-flag-overlay").forEach((el) => {
        el.style.position = "absolute";
        el.style.transform = "translateZ(0)";
      });

      // Schedule additional positioning with delay
      setTimeout(() => {
        const newMapRect = mapElement.getBoundingClientRect();
        trumpContainer.style.top = `${newMapRect.top}px`;
        trumpContainer.style.left = `${newMapRect.left}px`;

        console.log("[Chrome Debug] Delayed positioning:", newMapRect.top, newMapRect.left);
      }, 300);
    } else {
      // Standard positioning for other browsers
      Object.assign(trumpContainer.style, {
        width: `${mapRect.width}px`,
        height: `${mapRect.height}px`,
        left: `${mapRect.left}px`,
        top: `${mapRect.top}px`,
        transformOrigin: "center top",
      });
    }

    // Configure sprite appearance - consistent for all browsers
    trumpSprite.style.width = "100%";
    trumpSprite.style.height = "100%";
    trumpSprite.style.backgroundSize = "auto 100%";
    trumpSprite.style.position = "absolute";
    trumpSprite.style.top = "0";
  }

  /**
   * Update the game HUD
   * @param {GameState} state - Game state
   */
  updateHUD(state) {
    if (this.elements.hud.score) {
      this.elements.hud.score.textContent = state.score;
    }
  }

  /**
   * Update the progress bar
   * @param {number} timeRemaining - Remaining time
   * @param {number} totalTime - Total game time
   */
  updateProgressBar(timeRemaining, totalTime) {
    const progressPercentage = ((totalTime - timeRemaining) / totalTime) * 100;

    const progressBar = document.getElementById("term-progress-bar");
    if (progressBar) {
      progressBar.style.width = `${progressPercentage}%`;

      // Update ARIA attributes for accessibility
      const progressContainer = document.getElementById("term-progress-container");
      if (progressContainer) {
        progressContainer.setAttribute("aria-valuenow", timeRemaining);
      }
    }

    // Update label text based on progress
    const progressLabel = document.getElementById("term-progress-label");
    if (progressLabel) {
      const yearsRemaining = Math.ceil((timeRemaining / totalTime) * 4);
      progressLabel.textContent = `${yearsRemaining} ${yearsRemaining === 1 ? "YEAR" : "YEARS"} LEFT`;
    }
  }

  /**
   * Update pause button appearance and accessibility
   * @param {boolean} isPaused - Whether game is paused
   */
  updatePauseButton(isPaused) {
    const pauseButton = document.getElementById("pause-button");
    if (!pauseButton) return;

    pauseButton.setAttribute("aria-pressed", isPaused ? "true" : "false");
    pauseButton.setAttribute("aria-label", isPaused ? "Resume game" : "Pause game");

    const icon = pauseButton.querySelector(".icon");
    if (icon) {
      icon.textContent = isPaused ? "▶️" : "⏸️";
    }
  }

  createPauseOverlay() {
    const pauseOverlay = document.createElement("div");
    pauseOverlay.id = "pause-overlay";
    pauseOverlay.innerHTML = '<div class="pause-overlay-message">Game Paused</div>';
    this.elements.screens.game.appendChild(pauseOverlay);
  }

  /**
   * Remove pause overlay
   */
  removePauseOverlay() {
    const pauseOverlay = document.getElementById("pause-overlay");
    if (pauseOverlay) {
      pauseOverlay.remove();
    }
  }

  /**
   * Clean up grab visuals
   */
  cleanupGrabVisuals() {
    const visual = document.getElementById("trump-hand-visual");
    const hitbox = document.getElementById("trump-hand-hitbox");

    // Remove first-time help
    const helpText = document.getElementById("first-block-help-text");
    if (helpText) helpText.remove();

    const pulseStyle = document.getElementById("first-block-pulse");
    if (pulseStyle) pulseStyle.remove();

    // Clean up visual elements
    if (visual) {
      visual.classList.remove("hittable", "first-block-help");
      visual.style.display = "none";
      visual.style.opacity = "0";
    }

    if (hitbox) {
      hitbox.classList.remove("hittable", "first-block-help");
    }

    // Remove target highlights
    document.querySelectorAll(".target-area.highlighted").forEach((el) => {
      el.classList.remove("highlighted");
    });
  }

  /**
   * Apply visual effects for successful block
   * @param {string} targetCountry - Target country
   */
  applyBlockVisualEffects(targetCountry) {
    const visual = document.getElementById("trump-hand-visual");
    const hitbox = document.getElementById("trump-hand-hitbox");

    // Use the effects controller if available
    if (window.trumpHandEffects) {
      window.trumpHandEffects.applyHitEffect();
      window.trumpHandEffects.highlightTargetCountry(targetCountry, false);
    } else if (visual) {
      // Legacy approach - direct DOM manipulation
      visual.classList.remove("hittable");
      visual.style.opacity = "1";
      visual.style.border = "none";
      visual.classList.add("hit");

      // Apply cartoon hit effect
      this.applyCartoonyHitEffect();
    }

    // Clean up hitbox
    if (hitbox) {
      hitbox.classList.remove("hittable");
    }

    // Add screen shake
    const gameContainer = document.getElementById("game-container") || document.body;
    gameContainer.classList.add("screen-shake");

    // Remove shake class after animation
    setTimeout(() => {
      gameContainer.classList.remove("screen-shake");
    }, 700);
  }

  /**
   * Apply visual effects for successful grab
   * @param {string} country - Country being grabbed
   */
  applyGrabSuccessVisuals(country) {
    const visual = document.getElementById("trump-hand-visual");
    const hitbox = document.getElementById("trump-hand-hitbox");

    // Use the effects controller if available
    if (window.trumpHandEffects) {
      window.trumpHandEffects.applyGrabSuccessEffect();
      window.trumpHandEffects.highlightTargetCountry(country, false);
    } else if (visual) {
      // Legacy approach
      visual.classList.remove("hittable");
      visual.style.display = "block";
      visual.style.opacity = "1";
      visual.classList.add("grab-success");
    }

    // Clean up hitbox
    if (hitbox) {
      hitbox.classList.remove("hittable");
    }

    // Add screen shake
    const gameContainer = document.getElementById("game-container") || document.body;
    gameContainer.classList.add("grab-screen-shake");

    // Remove shake class after animation
    setTimeout(() => {
      gameContainer.classList.remove("grab-screen-shake");
    }, 700);
  }

  /**
   * Update a country's flag overlay based on claim count
   * @param {string} country - Country to update
   * @param {number} claimCount - Number of claims
   */
  updateFlagOverlay(country, claimCount) {
    const flagOverlay = document.getElementById(`${country}-flag-overlay`);
    if (!flagOverlay) return;

    // Remove previous opacity classes
    flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");

    // Add appropriate opacity class based on claim count
    if (claimCount === 1) {
      flagOverlay.classList.add("opacity-33");
    } else if (claimCount === 2) {
      flagOverlay.classList.add("opacity-66");
    } else if (claimCount === 3) {
      flagOverlay.classList.add("opacity-100");
    }
  }

  /**
   * Add cartoon hit effect when player successfully blocks
   */
  applyCartoonyHitEffect() {
    const visual = document.getElementById("trump-hand-visual");
    if (!visual) return;

    // Set position if needed
    const currentPosition = window.getComputedStyle(visual).position;
    if (currentPosition === "static") {
      visual.style.position = "absolute";
    }

    // Ensure full opacity for animation
    visual.style.opacity = "1";

    // Add screen shake
    const gameContainer = document.getElementById("game-container") || document.body;
    gameContainer.classList.add("screen-shake");

    // Force layout recalculation
    void visual.offsetWidth;

    // Remove shake class after animation
    setTimeout(() => {
      gameContainer.classList.remove("screen-shake");
    }, 700);
  }

  /**
   * Announce message for screen readers
   * @param {string} message - Message to announce
   */
  announceForScreenReaders(message) {
    const announcer = document.getElementById("game-announcements");
    if (announcer) {
      announcer.textContent = message;
    }
  }

  resetAllElements() {
    // Reset all country flag overlays
    Object.keys(this.elements.countries).forEach((country) => {
      const flag = this.elements.countries[country];
      if (flag) {
        flag.classList.remove("opacity-33", "opacity-66", "opacity-100", "resistance-possible", "targeting-pulse");
        flag.style.opacity = "";
        flag.style.transform = "";
        flag.style.transition = "";
      }
    });
  
    // Clear any residual visual effects
    document.querySelectorAll(".screen-shake, .grab-screen-shake").forEach((el) => {
      el.classList.remove("screen-shake", "grab-screen-shake");
    });
  
    // Clear the game announcer
    const announcer = document.getElementById("game-announcements");
    if (announcer) {
      announcer.textContent = "";
    }
  
    // Clean up any lingering notification elements
    document.querySelectorAll(".speed-notification, .freedom-flash, .freedom-text, .freedom-confetti, .freedom-firework").forEach((el) => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  
    // Force update all element positions
    this.positionElements();
  }

  /**
   * Setup debug panel
   * @param {DebugManager} debugManager - Debug manager instance
   */
setupDebugPanel(debugManager) {
  const debugPanel = document.getElementById("debug-panel");
  if (!debugPanel) return;

  // Add panel header
  const title = document.createElement("div");
  title.textContent = "DEBUG PANEL";
  title.classList.add("debug-panel-title");

  // Add close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.title = "Close Debug Panel";
  closeButton.classList.add("debug-close-button");

  closeButton.addEventListener("click", () => {
    debugPanel.style.display = "none";
    // Update using the debugManager method
    if (debugManager && debugManager.togglePanel) {
      debugManager.togglePanel(false);
    }
  });

  // Add elements to panel
  debugPanel.insertBefore(closeButton, debugPanel.firstChild);
  debugPanel.insertBefore(title, debugPanel.firstChild);
}

  // PRIVATE METHODS

  /**
   * Collect references to DOM elements
   * @private
   * @param {Document} document - Document object
   */
  _collectElementReferences(document) {
    // Screen elements
    this.elements.screens = {
      intro: document.getElementById("intro-screen"),
      game: document.getElementById("game-screen"),
      gameOver: document.getElementById("game-over-screen"),
    };

    // Button elements
    this.elements.buttons = {
      start: document.getElementById("start-button"),
      restart: document.getElementById("restart-button"),
    };

    // HUD elements
    this.elements.hud = {
      time: document.getElementById("time-value"),
      score: document.getElementById("score-value"),
      finalScore: document.getElementById("final-score"),
      result: document.getElementById("game-result"),
      message: document.getElementById("game-message"),
      stats: {
        blocks: document.getElementById("blocks-stat"),
        defended: document.getElementById("defended-stat"),
        time: document.getElementById("time-stat"),
      },
    };

    // Game container elements
    this.elements.game = {
      container: document.getElementById("game-container"),
      map: document.getElementById("map-background"),
    };

    // Country elements
    this.elements.countries = {
      usa: document.getElementById("usa-flag-overlay"),
      canada: document.getElementById("canada-flag-overlay"),
      mexico: document.getElementById("mexico-flag-overlay"),
      greenland: document.getElementById("greenland-flag-overlay"),
    };

    // Trump elements
    this.elements.trump = this._createTrumpReferences(document);
  }

  /**
   * Create references to Trump-related elements
   * @private
   * @param {Document} document - Document object
   * @returns {Object} Trump element references
   */
  _createTrumpReferences(document) {
    return {
      container: document.getElementById("trump-sprite-container"),
      sprite: document.getElementById("trump-sprite"),
      hand: document.getElementById("trump-hand-hitbox"),
    };
  }

  /**
   * Create screen reader announcer element
   * @private
   * @param {Document} document - Document object
   */
  _createScreenReaderAnnouncer(document) {
    if (!document.getElementById("game-announcements")) {
      const announcer = document.createElement("div");
      announcer.id = "game-announcements";
      announcer.className = "sr-only";
      announcer.setAttribute("aria-live", "assertive");
      announcer.setAttribute("role", "log");
      document.body.appendChild(announcer);
    }
  }

  /**
   * Set up responsive handlers
   * @private
   */
  _setupResponsiveHandlers() {
    // Window resize handler
    window.addEventListener("resize", () => {
      if (this.state && this.state.isPlaying) {
        setTimeout(() => this.positionElements(), 100);
      }

      this.positionCountryFlagOverlays();

      if (window.protestorHitboxManager) {
        window.protestorHitboxManager.repositionAllHitboxes();
      }
    });

    // Orientation change handler for mobile
    window.addEventListener("orientationchange", () => {
      if (this.state && this.state.isPlaying) {
        setTimeout(() => this.positionElements(), 300);
      }

      this.positionCountryFlagOverlays();
    });
  }

  /**
   * Add accessibility attributes to game elements
   * @private
   */
  _addAccessibilityAttributes() {
    // Add screen attributes
    if (this.elements.screens.intro) {
      this.elements.screens.intro.setAttribute("aria-label", "Game introduction screen");
    }

    if (this.elements.screens.game) {
      this.elements.screens.game.setAttribute("aria-label", "Game play area");
    }

    if (this.elements.screens.gameOver) {
      this.elements.screens.gameOver.setAttribute("aria-label", "Game over results");
    }

    // Add Trump-related attributes
    if (this.elements.trump.container) {
      this.elements.trump.container.setAttribute("role", "img");
      this.elements.trump.container.setAttribute("aria-label", "Trump character");
    }

    if (this.elements.trump.sprite) {
      this.elements.trump.sprite.setAttribute("aria-hidden", "true");
    }

    if (this.elements.trump.hand) {
      this.elements.trump.hand.setAttribute("role", "button");
      this.elements.trump.hand.setAttribute("aria-label", "Block Trump's grabbing hand");
    }
  }

  /**
   * Format the time survived for display
   * @private
   * @param {number} timeSurvived - Time survived in seconds
   * @param {number} totalGameTime - Total game time in seconds
   * @returns {string} Formatted time string
   */
  _formatTimeSurvived(timeSurvived, totalGameTime) {
    // Calculate years and months based on 4-year term
    const totalYears = 4;
    const yearsSurvived = Math.floor((timeSurvived / totalGameTime) * totalYears);
    const monthsSurvived = Math.floor(((timeSurvived / totalGameTime) * totalYears * 12) % 12);

    // Create grammatically correct time display
    let timeDisplay = "";

    if (yearsSurvived > 0) {
      timeDisplay += `${yearsSurvived} ${yearsSurvived === 1 ? "year" : "years"}`;

      if (monthsSurvived > 0) {
        timeDisplay += ` and ${monthsSurvived} ${monthsSurvived === 1 ? "month" : "months"}`;
      }
    } else {
      timeDisplay = `${monthsSurvived} ${monthsSurvived === 1 ? "month" : "months"}`;
    }

    return timeDisplay;
  }

  /**
   * Update game over animation
   * @private
   * @param {boolean} playerWon - Whether player won
   */
  _updateGameOverAnimation(playerWon) {
    const trumpAnimation = document.getElementById("trump-game-over-animation");
    if (!trumpAnimation) return;

    // Remove existing animation classes
    trumpAnimation.classList.remove("trump-victory-animation", "trump-slapped-animation");

    // Add appropriate animation class
    trumpAnimation.classList.add(playerWon ? "trump-slapped-animation" : "trump-victory-animation");
  }

  /**
   * Update game over stats display
   * @private
   * @param {string} timeDisplay - Formatted time survived
   * @param {boolean} playerWon - Whether player won
   * @param {GameState} state - Game state
   */
  _updateGameOverStats(timeDisplay, playerWon, state) {
    // Update score
    if (this.elements.hud.finalScore) {
      this.elements.hud.finalScore.textContent = state.score;
    }

    // Format blocks text
    const blocks = state.stats.successfulBlocks;
    const blocksText = `${blocks} ${blocks === 1 ? "attack" : "attacks"}`;

    // Update stats text
    if (this.elements.hud.stats.blocks) {
      const statsTextElement = document.querySelector(".stats-text.game-over-stat-value");
      if (statsTextElement) {
        statsTextElement.innerHTML = `YOU BLOCKED <span id="blocks-stat">${blocksText}</span> AND SURVIVED <span id="time-stat">${timeDisplay}</span>`;
      } else {
        // Fallback if element structure is different
        this.elements.hud.stats.blocks.textContent = blocksText;
        if (this.elements.hud.stats.time) {
          this.elements.hud.stats.time.textContent = timeDisplay;
        }
      }
    }

    // Update result and message
    if (this.elements.hud.result) {
      this.elements.hud.result.textContent = playerWon ? "Victory!" : "Game Over";
    }

    if (this.elements.hud.message) {
      this.elements.hud.message.innerHTML = playerWon
        ? "You successfully defended the neighboring countries from annexation! Together we will prevail."
        : "The neighboring countries have been claimed.<br><br>Alone we fail. Together we'd be unstoppable.";
    }
  }

  _animateGameIntro() {
    // Get Trump elements
    const trumpContainer = document.getElementById("trump-sprite-container");

    // Hide Trump elements initially
    if (trumpContainer) {
      trumpContainer.style.visibility = "hidden";
    }

    // Create animation styles if not present
    if (!document.getElementById("game-intro-animations")) {
      const style = document.createElement("style");
      style.id = "game-intro-animations";
      style.textContent = `
        @keyframes world-grow {
          0% { transform: scale(0.2); opacity: 0.2; }
          40% { transform: scale(0.9); opacity: 0.5; }
          80% { transform: scale(1.02); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        .world-intro-animation {
          animation: world-grow 4s ease-out forwards;
          transform-origin: center center;
          position: relative;
        }
        
        @keyframes trump-entrance {
          0% { transform: translateY(100%) scale(0.5); opacity: 0; }
          40% { transform: translateY(10%) scale(0.9); opacity: 0.8; } /* Added intermediate step */
          70% { transform: translateY(0) scale(1.05); opacity: 1; } /* Reduced peak scale */
          85% { transform: translateY(0) scale(0.95); opacity: 1; } /* Gentler bounce */
          100% { transform: translateY(0) scale(1.0); opacity: 1; }
        }
        .trump-entrance-animation {
          animation: trump-entrance 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) forwards; /* Changed timing function */
          transform-origin: center bottom;
        }
        
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          40% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          70% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        }
      `;
      document.head.appendChild(style);
    }

    // Create globe animation wrapper
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.top = "0";
    wrapper.style.left = "0";
    wrapper.style.width = "100%";
    wrapper.style.height = "100%";
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "center";
    wrapper.style.alignItems = "center";
    wrapper.style.pointerEvents = "none";
    wrapper.classList.add("world-intro-animation");

    // Create animated map
    const animatedMap = document.createElement("div");
    animatedMap.style.width = "100%";
    animatedMap.style.height = "100%";

    if (this.elements.game.map) {
      animatedMap.style.backgroundImage = `url(${this.elements.game.map.src})`;
    }

    animatedMap.style.backgroundSize = "contain";
    animatedMap.style.backgroundPosition = "center";
    animatedMap.style.backgroundRepeat = "no-repeat";

    wrapper.appendChild(animatedMap);
    this.elements.screens.game.appendChild(wrapper);

    // Hide the actual map during animation
    if (this.elements.game.map) {
      this.elements.game.map.style.opacity = "0";
    }

    // Add "READY..." text overlay
    const readyOverlay = document.createElement("div");
    readyOverlay.className = "ready-overlay";
    readyOverlay.innerHTML = "<span>block those grabby hands!</span>";
    readyOverlay.style.position = "absolute";
    readyOverlay.style.textAlign = "center";

    readyOverlay.style.top = "50%";
    readyOverlay.style.left = "50%";
    readyOverlay.style.transform = "translate(-50%, -50%)";
    readyOverlay.style.fontSize = "3rem";
    readyOverlay.style.fontWeight = "bold";
    readyOverlay.style.color = "white";
    readyOverlay.style.textShadow = "0 0 10px rgba(0,0,0,0.8)";
    readyOverlay.style.zIndex = "100";
    readyOverlay.style.opacity = "0";
    readyOverlay.style.animation = "fade-in-out 3.5s ease-in-out forwards";

    this.elements.screens.game.appendChild(readyOverlay);

    // Schedule animation steps with overlap for smoother transition
    setTimeout(() => {
      // Show Trump container but keep opacity at 0
      if (trumpContainer) {
        trumpContainer.style.visibility = "visible";
        trumpContainer.classList.add("trump-entrance-animation");
      }

      // Start fading out the globe with a delay
      setTimeout(() => {
        // Fade out globe animation gradually
        if (wrapper) {
          wrapper.style.transition = "opacity 0.8s ease-out";
          wrapper.style.opacity = "0";

          // Remove only after transition completes
          setTimeout(() => {
            if (wrapper && wrapper.parentNode) {
              wrapper.parentNode.removeChild(wrapper);
            }
          }, 800);
        }

        // Show map gradually
        if (this.elements.game.map) {
          this.elements.game.map.style.transition = "opacity 0.8s ease-in";
          this.elements.game.map.style.opacity = "1";
        }
      }, 1000); // Start fading world while Trump is entering
    }, 3000); // Start Trump entrance earlier

    // Complete Trump entrance
    setTimeout(() => {
      if (trumpContainer) {
        trumpContainer.classList.remove("trump-entrance-animation");
      }

      // Show all Trump elements
      this._setTrumpVisibility(true);

      // Set idle animation
      if (window.animationManager) {
        window.animationManager.changeState("idle");
      }
    }, 5500); // Adjusted total time (3000 + 2500)

    // Remove ready text
    setTimeout(() => {
      if (readyOverlay && readyOverlay.parentNode) {
        readyOverlay.parentNode.removeChild(readyOverlay);
      }
    }, 3500); // Ready text duration
  }

  /**
   * Set Trump elements visibility
   * @private
   * @param {boolean} isVisible - Whether elements should be visible
   */
  _setTrumpVisibility(isVisible) {
    const trumpContainer = document.getElementById("trump-sprite-container");
    const trumpHandVisual = document.getElementById("trump-hand-visual");
    const trumpHandHitbox = document.getElementById("trump-hand-hitbox");

    const visibility = isVisible ? "visible" : "hidden";
    const pointerEvents = isVisible ? "auto" : "none";

    if (trumpContainer) trumpContainer.style.visibility = visibility;
    if (trumpHandVisual) trumpHandVisual.style.visibility = visibility;
    if (trumpHandHitbox) {
      trumpHandHitbox.style.visibility = visibility;
      trumpHandHitbox.style.pointerEvents = pointerEvents;
    }
  }
}

/**
 * Input Manager - Handles all user input
 */
class InputManager {
  constructor() {
    this.handlers = {
      onSpaceKey: null,
      onPauseKey: null,
      onStartKey: null,
    };

    this.ui = null;
    this.document = null;
  }

  /**
   * Initialize input manager
   * @param {Document} document - Document object
   * @param {Object} handlers - Event handlers
   */
  init(document, handlers) {
    this.document = document;
    this.handlers = handlers;

    this._setupKeyboardHandlers();
    this._setupButtonHandlers();
    this._setupHitboxHandlers();
  }

  /**
   * Add additional handlers after initial setup
   * @param {Object} handlers - Event handlers to add
   */
  addHandlers(handlers) {
    // Add these handlers to existing ones
    this.handlers = { ...this.handlers, ...handlers };

    // Re-setup keyboard handlers
    this._setupKeyboardHandlers();

    // Re-setup hitbox handlers
    this._setupHitboxHandlers();
  }

  /**
   * Connect to UI manager
   * @param {UIManager} ui - UI manager reference
   */
  connectUI(ui) {
    this.ui = ui;
  }

  // PRIVATE METHODS

  /**
   * Set up keyboard handlers
   * @private
   */
  _setupKeyboardHandlers() {
    // Remove any existing keyboard listeners first
    if (this._keyboardHandler) {
      this.document.removeEventListener("keydown", this._keyboardHandler);
    }

    // Create a new handler function that we can reference later for removal
    this._keyboardHandler = (e) => {
      // Start game with Space or Enter from intro screen
      if (
        (e.key === " " || e.key === "Enter") &&
        this.handlers.onStartKey &&
        document.getElementById("intro-screen") &&
        !document.getElementById("intro-screen").classList.contains("hidden")
      ) {
        e.preventDefault();
        this.handlers.onStartKey();
      }

      // Toggle pause with P key during gameplay
      if (e.key === "p" && this.handlers.onPauseKey) {
        e.preventDefault();
        this.handlers.onPauseKey();
      }

      // Block hand with Space during gameplay
      if (e.key === " " && this.handlers.onSpaceKey) {
        e.preventDefault();
        this.handlers.onSpaceKey();
      }
    };

    // Add the new handler
    this.document.addEventListener("keydown", this._keyboardHandler);
  }

  /**
   * Set up button handlers
   * @private
   */
  _setupButtonHandlers() {
    // Start button
    const startButton = document.getElementById("start-button");
    if (startButton && this.handlers.onStartKey) {
      // Remove all existing listeners
      const newStartButton = startButton.cloneNode(true);
      startButton.parentNode.replaceChild(newStartButton, startButton);

      newStartButton.addEventListener("click", (e) => {
        e.preventDefault(); // Prevent default behavior
        console.log("Start button clicked");

        try {
          // Try to unlock audio
          if (window.audioManager) {
            window.audioManager.init();
            window.audioManager.unlock();

            // Store unlocked state
            try {
              sessionStorage.setItem("audioUnlocked", "true");
            } catch (e) {
              console.warn("Could not store audio unlock state:", e);
            }

            // Play click sound
            window.audioManager.safePlay("ui", "click");
          }
        } catch (err) {
          console.warn("Audio setup failed:", err);
        }

        // Start game
        this.handlers.onStartKey();
      });
    }

    // Directly attach restart handler to the document to catch all instances
    document.addEventListener("click", (e) => {
      if (e.target.id === "restart-button" || e.target.closest("#restart-button")) {
        e.preventDefault(); // Prevent default behavior
        console.log("Restart button clicked - global handler");

        try {
          // Play click sound
          if (window.audioManager) {
            window.audioManager.safePlay("ui", "click");
          }
        } catch (e) {
          console.warn("Failed to play restart click sound:", e);
        }

        // Perform a game restart
        if (window.gameEngine) {
          window.gameEngine.restartGame();
        }
      }
    });
  }

  /**
   * Set up Trump hand hitbox handlers
   * @private
   */
  _setupHitboxHandlers() {
    // Get the hitbox element
    const trumpHandHitBox = document.getElementById("trump-hand-hitbox");
    if (!trumpHandHitBox || !this.handlers.onSpaceKey) return;

    // Remove existing listeners if they exist
    if (this._hitboxHandlers) {
      Object.entries(this._hitboxHandlers).forEach(([event, handler]) => {
        trumpHandHitBox.removeEventListener(event, handler);
      });
    }

    // Create unified handler for all hitbox events
    const handleHitboxEvent = (event) => {
      if (event.cancelable) {
        event.preventDefault();
      }
      event.stopPropagation();

      if (this.handlers.onSpaceKey) {
        this.handlers.onSpaceKey(event);
      }
    };

    // Store handlers for later removal
    this._hitboxHandlers = {
      click: handleHitboxEvent,
      touchstart: handleHitboxEvent,
      mousedown: handleHitboxEvent,
    };

    // Add event listeners
    Object.entries(this._hitboxHandlers).forEach(([event, handler]) => {
      trumpHandHitBox.addEventListener(event, handler, { passive: false });
    });

    // Special handler for touchend to prevent ghost clicks
    trumpHandHitBox.addEventListener("touchend", (e) => e.preventDefault(), { passive: false });

    // Update reference in hitbox manager
    if (window.handHitboxManager) {
      window.handHitboxManager.trumpHandHitBox = trumpHandHitBox;
    }
  }
}

// Initialize the game when document is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("Initializing game...");

  // Create and initialize game engine
  const engine = new GameEngine({
    debug: true,
  });

  engine.init();

  // Global access for debugging
  window.gameEngine = engine;
});

/**
 * GameSpeedManager handles game speed progression and tutorial instructions
 */
class GameSpeedManager {
  /**
   * Create a new GameSpeedManager
   * @param {Object} gameState - The game state object
   * @param {Object} animationManager - The animation manager
   * @param {Object} audioManager - The audio manager
   */
  constructor(gameState, animationManager, audioManager) {
    // System references
    this.gameState = gameState;
    this.animationManager = animationManager;
    this.audioManager = audioManager;

    // Configuration
    this.config = {
      NOTIFICATION_DURATION: 5100,
      INITIAL_INSTRUCTION_DELAY: 10500,
      INSTRUCTION_INTERVAL: 12000,
      TUTORIAL_TIMEOUT: 45000,
      DEFAULT_SPEED_INTERVAL: 16000,
    };

    // Speed levels configuration
    this.speedLevels = [
      { multiplier: 0.7, name: "Tutorial", sound: "tutorial" },
      { multiplier: 1.5, name: "Faster?", sound: "faster" },
      { multiplier: 2.0, name: "oopsie trade war", sound: "oopsieTradeWar" },
      { multiplier: 2.5, name: "no one is coming to save us", sound: "noOneIsComingToSaveUs" }, // Changed to existing sound as fallback
      { multiplier: 3.0, name: "get up and fight", sound: "getUpAndFight" }, // Changed to existing sound as fallback
    ];

    // Tutorial instruction messages
    this.instructionMessages = [
      { text: "STOP HIM!", audio: "stopHim" },
      { text: "SMACK THAT HAND!", audio: "smackThatHand" },
      { text: "STOP HIM!", audio: "stopHim" },
      { text: "CLICK ON TRUMPS HAND AS HE GRABS A COUNTRY!", audio: "instruction" },
    ];

    // State variables
    this.state = {
      currentSpeedIndex: 0,
      initialInstructionsShown: false,
      currentInstructionIndex: 0,
      tutorialCompleted: false,
      initialBlockCount: 0,
    };

    // Timers
    this.timers = {
      speedIncreaseInterval: null,
      instructionTimeout: null,
      tutorialFailsafeTimeout: null,
    };
  }

  /**
   * Initialize the manager
   */
  init() {
    // Nothing needed here for initialization
  }

  /**
   * Show an on-screen notification
   * @param {string} message - The message to display
   */
  showNotification(message) {
    // Create notification element
    const notification = this._createNotificationElement(message);

    // Add to game screen
    const gameScreen = document.getElementById("game-screen");
    if (gameScreen) {
      gameScreen.appendChild(notification);

      // Remove after animation completes
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, this.config.NOTIFICATION_DURATION);
    }
  }

  /**
   * Create a notification element
   * @private
   * @param {string} message - The message to display
   * @returns {HTMLElement} The notification element
   */
  _createNotificationElement(message) {
    const notification = document.createElement("div");
    notification.className = "speed-notification";
    notification.textContent = message;

    // Add accessibility attributes
    notification.setAttribute("role", "alert");
    notification.setAttribute("aria-live", "assertive");

    return notification;
  }

  /**
   * Start the speed progression system
   * @param {number} intervalMs - Milliseconds between speed increases
   */
  startSpeedProgression(intervalMs = this.config.DEFAULT_SPEED_INTERVAL) {
    // Clear any existing timers
    this.stopSpeedProgression();

    // Initialize tutorial state
    this._initializeTutorial();

    // Schedule initial instructions if not shown yet
    if (!this.state.initialInstructionsShown) {
      this.showInitialInstructions();
    }
  }

  /**
   * Initialize tutorial state
   * @private
   */
  _initializeTutorial() {
    // Capture initial block count to detect when player has blocked
    this.state.initialBlockCount = this.gameState.stats.successfulBlocks;
    this.state.tutorialCompleted = false;

    // Reset to initial tutorial speed
    this.state.currentSpeedIndex = 0;
    this.setSpeed(this.speedLevels[0].multiplier);
  }

  /**
   * Check if the tutorial has been completed
   * @returns {boolean} True if tutorial is completed
   */
  checkTutorialCompletion() {
    // Tutorial is complete if player has made a successful block
    if (this.gameState.stats.successfulBlocks > this.state.initialBlockCount) {
      if (!this.state.tutorialCompleted) {
        console.log("Tutorial completed! Player has successfully blocked.");
        this.state.tutorialCompleted = true;

        // Clean up tutorial timers
        this._cleanupTutorialTimers();

        // Start the speed progression now that tutorial is complete
        this._startRegularSpeedProgression();
      }
      return true;
    }
    return false;
  }

  /**
   * Clean up tutorial timers
   * @private
   */
  _cleanupTutorialTimers() {
    // Clear instruction timeout
    if (this.timers.instructionTimeout) {
      clearTimeout(this.timers.instructionTimeout);
      this.timers.instructionTimeout = null;
    }

    // Clear existing speed interval
    if (this.timers.speedIncreaseInterval) {
      clearInterval(this.timers.speedIncreaseInterval);
      this.timers.speedIncreaseInterval = null;
    }
  }

  /**
   * Start regular speed progression after tutorial
   * @private
   */
  _startRegularSpeedProgression() {
    // Set up interval for speed increases
    this.timers.speedIncreaseInterval = setInterval(() => {
      if (!this.gameState.isPlaying || this.gameState.isPaused) return;

      if (this.state.currentSpeedIndex < this.speedLevels.length - 1) {
        this.increaseSpeed();
      }
    }, this.config.DEFAULT_SPEED_INTERVAL);

    // Store reference in game state for cleanup
    this.gameState.speedIncreaseInterval = this.timers.speedIncreaseInterval;
  }

  /**
   * Show initial tutorial instructions
   */
  showInitialInstructions() {
    this.state.initialInstructionsShown = true;
    this.state.currentInstructionIndex = 0;

    // Clear any existing timeout
    if (this.timers.instructionTimeout) {
      clearTimeout(this.timers.instructionTimeout);
    }

    // Show the first instruction after a delay
    this.timers.instructionTimeout = setTimeout(() => {
      this.showNextInstruction();
    }, this.config.INITIAL_INSTRUCTION_DELAY);

    // Set up failsafe to exit tutorial after timeout
    this._setupTutorialFailsafe();
  }

  /**
   * Set up failsafe timer to exit tutorial mode if player doesn't block
   * @private
   */
  _setupTutorialFailsafe() {
    this.timers.tutorialFailsafeTimeout = setTimeout(() => {
      if (!this.state.tutorialCompleted) {
        console.log("Tutorial timeout reached. Auto-completing tutorial.");
        this.state.tutorialCompleted = true;

        // Clean up timers
        this._cleanupTutorialTimers();

        // Start regular speed progression
        this._startRegularSpeedProgression();
      }
    }, this.config.TUTORIAL_TIMEOUT);
  }

  /**
   * Show the next instruction in the tutorial sequence
   */
  showNextInstruction() {
    // Skip if tutorial is already completed
    if (this.checkTutorialCompletion()) {
      return;
    }

    // Reset to beginning if we've shown all instructions
    if (this.state.currentInstructionIndex >= this.instructionMessages.length) {
      this.state.currentInstructionIndex = 0;
    }

    // Show current instruction
    this._displayCurrentInstruction();

    // Schedule next instruction if tutorial not completed
    this._scheduleNextInstruction();
  }

  /**
   * Display the current instruction
   * @private
   */
  _displayCurrentInstruction() {
    const instruction = this.instructionMessages[this.state.currentInstructionIndex];

    // Show visual notification
    this.showNotification(instruction.text);

    // Play audio if available
    if (this.audioManager && instruction.audio) {
      this.audioManager.play("ui", instruction.audio);
    }

    // Move to next instruction for next time
    this.state.currentInstructionIndex++;
  }

  /**
   * Schedule the next instruction
   * @private
   */
  _scheduleNextInstruction() {
    this.timers.instructionTimeout = setTimeout(() => {
      // Check again if tutorial is completed before showing next instruction
      if (!this.state.tutorialCompleted) {
        this.showNextInstruction();
      }
    }, this.config.INSTRUCTION_INTERVAL);
  }

  /**
   * Stop the speed progression system and clear all timers
   */
  stopSpeedProgression() {
    // Clear all timers
    this._clearAllTimers();

    // Clean up any notifications
    this._removeAllNotifications();
  }

  /**
   * Clear all timers
   * @private
   */
  _clearAllTimers() {
    if (this.timers.speedIncreaseInterval) {
      clearInterval(this.timers.speedIncreaseInterval);
      this.timers.speedIncreaseInterval = null;
    }

    if (this.timers.instructionTimeout) {
      clearTimeout(this.timers.instructionTimeout);
      this.timers.instructionTimeout = null;
    }

    if (this.timers.tutorialFailsafeTimeout) {
      clearTimeout(this.timers.tutorialFailsafeTimeout);
      this.timers.tutorialFailsafeTimeout = null;
    }
  }

  /**
   * Remove all notification elements
   * @private
   */
  _removeAllNotifications() {
    const gameScreen = document.getElementById("game-screen");
    if (gameScreen) {
      const notifications = gameScreen.querySelectorAll(".speed-notification");
      notifications.forEach((notification) => {
        notification.remove();
      });
    }
  }

  /**
   * Increase the game speed to the next level
   * @returns {boolean} True if speed was increased
   */
  increaseSpeed() {
    // Only increase speed if tutorial is completed
    if (!this.state.tutorialCompleted) {
      return false;
    }

    // Check if we can increase to next level
    if (this.state.currentSpeedIndex < this.speedLevels.length - 1) {
      // Move to next speed level
      this.state.currentSpeedIndex++;
      const newSpeed = this.speedLevels[this.state.currentSpeedIndex];

      // Apply the new speed
      this.setSpeed(newSpeed.multiplier);

      // Show notification
      this.showNotification(newSpeed.name.toUpperCase() + "!");

      // Play appropriate sound
      this._playSpeedChangeSound(newSpeed);

      console.log(`Game speed increased to ${newSpeed.multiplier.toFixed(2)}x (${newSpeed.name})`);

      return true;
    }
    return false;
  }

  /**
   * Play the appropriate sound for a speed change
   * @private
   * @param {Object} speedLevel - The speed level object
   */
  _playSpeedChangeSound(speedLevel) {
    if (!this.audioManager) return;

    if (speedLevel.sound) {
      // Try to play the specific sound for this level
      this.audioManager.play("ui", speedLevel.sound).catch((error) => {
        // Fall back to generic speedup sound if specific one isn't available
        console.log(`Couldn't play speed sound ${speedLevel.sound}, falling back to generic`);
        this.audioManager.play("ui", "speedup");
      });
    } else {
      // Use generic speedup sound if no specific one is defined
      this.audioManager.play("ui", "speedup");
    }
  }

  /**
   * Set the game speed to a specific multiplier
   * @param {number} multiplier - Speed multiplier value
   */
  setSpeed(multiplier) {
    this.gameState.gameSpeedMultiplier = multiplier;

    // Update animation speed
    if (this.animationManager && typeof this.animationManager.setGameSpeed === "function") {
      this.animationManager.setGameSpeed(multiplier);
    }
  }

  /**
   * Get the current speed information
   * @returns {Object} Current speed info with multiplier and name
   */
  getCurrentSpeed() {
    return {
      multiplier: this.gameState.gameSpeedMultiplier,
      name: this.speedLevels[this.state.currentSpeedIndex].name,
    };
  }

  /**
   * Reset the speed manager to initial state
   */
  reset() {
    // Stop all timers
    this.stopSpeedProgression();

    // Reset state variables
    this.state.currentSpeedIndex = 0;
    this.state.initialInstructionsShown = false;
    this.state.currentInstructionIndex = 0;
    this.state.tutorialCompleted = false;
    this.state.initialBlockCount = 0;

    // Reset speed to initial value
    this.setSpeed(this.speedLevels[0].multiplier);
  }

  /**
   * Clean up resources used by the manager
   */
  destroy() {
    // Reset state and clean up
    this.reset();

    // Remove any lingering UI elements
    this._removeAllNotifications();
  }
}
window.GameSpeedManager = GameSpeedManager;
