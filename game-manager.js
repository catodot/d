
class GameManager {
  constructor(options = {}) {
    // Configuration
    this.config = {
      DEBUG_MODE: options.debug || false,
      GAME_DURATION: 168, // 2min 48sec in seconds
      ANIMATION_DELAY: 650,
      SPEED_INCREASE_INTERVAL: 16000,
      MAX_SPEED_MULTIPLIER: 3.0,
      SPEED_INCREASE_STEP: 0.5,
      AUTO_RESTART_DELAY: 20000,

      
      GLOBE_ANIMATION_DURATION: 4000,    // Globe animation time
  READY_TEXT_DURATION: 3500,         // How long "READY..." text shows
  TRUMP_ENTRANCE_DURATION: 2000,     // Trump entrance animation time
  IDLE_BEFORE_GRAB_DURATION: 2000,   // Trump idle time before first grab
  INITIAL_GRAB_DELAY: 8000           // Keep your existing value
};

    // State & references
    this.gameState = null;
    this.elements = null;

    this.activeTimeouts = [];

    this.currentAnimationFrame = null;

    
    // Manager references
    this.managers = {
      audio: null,
      animation: null,
      freedom: null,
      speed: null,
      protestorHitbox: null,
      smack: null,
      ufo: null
    };

    // Bind methods to maintain context
    this._bindMethods();
  }

  /**
   * Bind class methods to maintain 'this' context
   * @private
   */
  _bindMethods() {
    this.initiateGrab = this.initiateGrab.bind(this);
    this.stopGrab = this.stopGrab.bind(this);
    this.grabSuccess = this.grabSuccess.bind(this);
    this.togglePause = this.togglePause.bind(this);
    this.updateCountdown = this.updateCountdown.bind(this);
    this.startGame = this.startGame.bind(this);
    this.endGame = this.endGame.bind(this);
    this.resetGameState = this.resetGameState.bind(this);
    this.updateHUD = this.updateHUD.bind(this);
    this.positionElements = this.positionElements.bind(this);
    this.positionCountryFlagOverlays = this.positionCountryFlagOverlays.bind(this);
    this.positionTrumpCharacter = this.positionTrumpCharacter.bind(this);
    this.applyGrabSuccessEffect = this.applyGrabSuccessEffect.bind(this);
    this.applyCartoonyHitEffect = this.applyCartoonyHitEffect.bind(this);
    this.showFasterNotification = this.showFasterNotification.bind(this);
    this.restartGame = this.restartGame.bind(this);
  }

  /**
   * Initialize the game manager
   * @param {Object} gameState - Game state object
   * @param {Object} elements - DOM element references
   * @returns {GameManager} The GameManager instance
   */
  init(gameState, elements) {
    this.gameState = gameState;
    this.elements = elements;

    // Store manager references from global scope
    this._initializeManagers();
    
    
    // Set up accessibility features
    this._setupAccessibility();

    if (this.config.DEBUG_MODE) {
      console.log("GameManager initialized");
    }
    
    return this;
  }

  /**
   * Initialize manager references from global scope
   * @private
   */
  _initializeManagers() {
    this.managers.audio = window.audioManager;
    this.managers.animation = window.animationManager;
    this.managers.freedom = window.freedomManager;
    this.managers.speed = window.speedManager;
    this.managers.protestorHitbox = window.protestorHitboxManager;
    this.managers.smack = window.smackManager;
    this.managers.ufo = window.ufoManager;
  }

  /**
   * Set up accessibility enhancements
   * @private
   */
  _setupAccessibility() {
    this._setupKeyboardNavigation();
    this._createScreenReaderAnnouncer();
  }

  /**
   * Set up keyboard navigation for game controls
   * @private
   */
  _setupKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      // Start game with Space or Enter from intro screen
      if ((e.key === " " || e.key === "Enter") && 
          !this.gameState.isPlaying && 
          !this.elements.screens.intro.classList.contains("hidden")) {
        e.preventDefault();
        this.startGame();
      }

      // Toggle pause with P key during gameplay
      if (e.key === "p" && this.gameState.isPlaying) {
        e.preventDefault();
        this.togglePause();
      }

      // Block hand with Space during gameplay
      if (e.key === " " && 
          this.gameState.isPlaying && 
          !this.gameState.isPaused && 
          this.gameState.currentTarget) {
        e.preventDefault();
        this.stopGrab();
      }
    });
  }

  /**
   * Create screen reader announcer element
   * @private
   */
  _createScreenReaderAnnouncer() {
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
   * Announce important game events for screen readers
   * @param {string} message - Message to announce
   */
  announceForScreenReaders(message) {
    const announcer = document.getElementById("game-announcements");
    if (announcer) {
      announcer.textContent = message;
    }
  }

  /**
   * Start the game
   */
  startGame() {
    // Ensure audio is properly initialized
    if (this.managers.audio) {
      this.managers.audio.resumeAudioContext().then(() => {
        this._showGameScreen();
        this._initializeGameplay();
      });
    } else {
      this._showGameScreen();
      this._initializeGameplay();
    }
  }

  /**
   * Prepare audio for game start
   * @private
   */
  _prepareAudio() {
    this.managers.audio.ensureSoundsAreLoaded();
    this.managers.audio.stopBackgroundMusic();
    this.managers.audio.startBackgroundMusic();
    this.managers.audio.play("ui", "start");
  }

  _startGameAudio() {
    if (this.managers.audio) {
      this.managers.audio.stopBackgroundMusic();
      this.managers.audio.startBackgroundMusic();
      this.managers.audio.play("ui", "start");
    }
  }

  _showGameScreen() {
    // Hide game elements initially
    this.elements.screens.intro.classList.add("hidden");
    this.elements.screens.game.classList.remove("hidden");
    
    // Get all the elements we'll need
    const trumpContainer = document.getElementById("trump-sprite-container");
    const trumpHandVisual = document.getElementById("trump-hand-visual");
    const trumpHandHitbox = document.getElementById("trump-hand-hitbox");
    const gameContainer = document.getElementById("game-container");
    
    // Hide Trump elements initially
    this._setTrumpVisibility(false);
    
    // Create the globe animation wrapper
    const wrapper = this._createGlobeAnimationWrapper();
    this.elements.screens.game.appendChild(wrapper);
    
    // Hide the actual map during animation
    if (this.elements.game.map) {
      this.elements.game.map.style.opacity = "0";
    }
    
    // Preload sounds during animations
    if (this.managers.audio) {
      this.managers.audio.preloadGameSounds();
    }
    
    // Add "READY..." text overlay
    const readyOverlay = this._createReadyTextOverlay();
    this.elements.screens.game.appendChild(readyOverlay);
    
    // STEP 1: Globe animation complete
    setTimeout(() => {
      // Clean up globe animation
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
      if (this.elements.game.map) {
        this.elements.game.map.style.opacity = "1";
      }
      
      // STEP 2: Add Trump entrance animation class
      if (trumpContainer) {
        trumpContainer.style.visibility = "visible";
        trumpContainer.classList.add("trump-entrance-animation");
        
      }
      
      // STEP 3: Trump entrance animation complete
      setTimeout(() => {
        // Remove entrance class and show all Trump elements
        if (trumpContainer) {
          trumpContainer.classList.remove("trump-entrance-animation");
        }
        
        this._setTrumpVisibility(true);
        
        // Set idle animation
        if (this.managers.animation) {
          this.managers.animation.changeState("idle");
        }
        
        // Ready to start gameplay
        this._initializeGameplay();
        
      }, this.config.TRUMP_ENTRANCE_DURATION);
      
    }, this.config.GLOBE_ANIMATION_DURATION);
    
    // Remove ready text after its duration
    setTimeout(() => {
      if (readyOverlay && readyOverlay.parentNode) {
        readyOverlay.parentNode.removeChild(readyOverlay);
      }
    }, this.config.READY_TEXT_DURATION);
  }

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

  
  _createGlobeAnimationWrapper() {
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
    
    // Add or ensure animation style exists
    if (!document.getElementById("world-intro-animation-style")) {
      const style = document.createElement("style");
      style.id = "world-intro-animation-style";
      style.textContent = `
        @keyframes world-grow {
          0% { transform: scale(0.2); opacity: 0.2; }
          40% { transform: scale(0.9); opacity: 0.5; }
          80% { transform: scale(1.02); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        .world-intro-animation {
          animation: world-grow ${this.config.GLOBE_ANIMATION_DURATION/1000}s ease-out forwards;
          transform-origin: center center;
          position: relative;
        }
        
        /* Add Trump entrance animation */
        @keyframes trump-entrance {
          0% { transform: translateY(100%) scale(0.5); opacity: 0; }
          60% { transform: translateY(0) scale(1.1); opacity: 1; }
          80% { transform: translateY(0) scale(0.9); opacity: 1; }
          100% { transform: translateY(0) scale(1.0); opacity: 1; }
        }
        .trump-entrance-animation {
          animation: trump-entrance ${this.config.TRUMP_ENTRANCE_DURATION/1000}s ease-out forwards;
          transform-origin: center bottom;
        }
      `;
      document.head.appendChild(style);
    }
    
    wrapper.classList.add("world-intro-animation");
    
    // Create animated map
    const animatedMap = document.createElement("div");
    animatedMap.style.width = "100%";
    animatedMap.style.height = "100%";
    animatedMap.style.backgroundImage = `url(${this.elements.game.map.src})`;
    animatedMap.style.backgroundSize = "contain";
    animatedMap.style.backgroundPosition = "center";
    animatedMap.style.backgroundRepeat = "no-repeat";
    
    wrapper.appendChild(animatedMap);
    return wrapper;
  }


  _createReadyTextOverlay() {
    const readyOverlay = document.createElement("div");
    readyOverlay.className = "ready-overlay";
    readyOverlay.innerHTML = "<span>READY...</span>";
    readyOverlay.style.position = "absolute";
    readyOverlay.style.top = "50%";
    readyOverlay.style.left = "50%";
    readyOverlay.style.transform = "translate(-50%, -50%)";
    readyOverlay.style.fontSize = "48px";
    readyOverlay.style.fontWeight = "bold";
    readyOverlay.style.color = "white";
    readyOverlay.style.textShadow = "0 0 10px rgba(0,0,0,0.8)";
    readyOverlay.style.zIndex = "100";
    readyOverlay.style.opacity = "0";
    
    // Add fade animation
    if (!document.getElementById("fade-animations")) {
      const style = document.createElement("style");
      style.id = "fade-animations";
      style.textContent = `
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
    
    readyOverlay.style.animation = `fade-in-out ${this.config.READY_TEXT_DURATION/1000}s ease-in-out forwards`;
    return readyOverlay;
  }
  

/**
 * Create a tracked timeout that will be properly cleaned up on game end
 * @param {Function} callback - Function to call when timeout completes
 * @param {number} delay - Delay in milliseconds
 * @returns {number} - Timeout ID
 */
createTrackedTimeout(callback, delay) {
  const timeoutId = setTimeout(() => {
    // Remove from active timeouts first
    const index = this.activeTimeouts.indexOf(timeoutId);
    if (index !== -1) this.activeTimeouts.splice(index, 1);
    
    // Then execute callback
    callback();
  }, delay);
  
  // Track this timeout
  this.activeTimeouts.push(timeoutId);
  return timeoutId;
}

  /**
   * Initialize gameplay after showing game screen
   * @private
   */
  _initializeGameplay() {
    if (this.managers.audio && window.DeviceUtils && window.DeviceUtils.isMobileDevice) {
      console.log("Setting up audio unlocking for mobile");
      this.managers.audio.unlockAudioForMobile();
    }
    // Position game elements based on map state
    if (this.elements.game.map.complete) {
      this._startGameSession();
    } else {
      // Wait for map to load before starting
      this.elements.game.map.onload = () => this._startGameSession();
    }
  }

  _startGameSession() {
    this.resetGameState();
    
    // Set playing state immediately
    this.gameState.isPlaying = true;
    this.positionElements();
    
    // Start background music explicitly
    if (this.managers.audio) {
      console.log("GameManager requesting background music start");
      const isMobile = window.DeviceUtils && window.DeviceUtils.isMobileDevice;
      
      // On mobile, don't stop the music as this might interrupt playback
      if (!isMobile) {
        this.managers.audio.stopBackgroundMusic();
      }
      
      this.managers.audio.startBackgroundMusic()
        .then(started => {
          console.log("Background music start result:", started);
        });
    }
    
    // Play start sound
    if (this.managers.audio) {
      this.managers.audio.play("ui", "start").catch(e => {
        console.warn("Failed to play start sound:", e);
      });
    }
    
    // Start game timers
    this.gameState.countdownTimer = setInterval(this.updateCountdown, 1000);
    
    
    // Start animation loop
    if (typeof window.startAnimationLoop === 'function') {
      window.startAnimationLoop();
    }
    
    // Announce game start
    this.announceForScreenReaders("Game started! Be ready to block Trump's grabbing hand!");
    
    // Add stars if function exists
    if (typeof addStarsToGameScreen === "function") {
      addStarsToGameScreen();
    }
    
    // Begin first grab sequence after a delay
    this.createTrackedTimeout(() => {
      this.initiateGrab();
      
      // Preload remaining game sounds
      if (this.managers.audio) {
        this.managers.audio.preloadGameSounds();
      }
    }, this.config.INITIAL_GRAB_DELAY);
  }
  

  resetGameState() {
    // Cancel any pending animation frames
    if (this.gameState.currentAnimationFrame) {
      cancelAnimationFrame(this.gameState.currentAnimationFrame);
      this.gameState.currentAnimationFrame = null;
    }
  
    // Clear all active timeouts
    this.activeTimeouts.forEach(id => clearTimeout(id));
    this.activeTimeouts = [];
    
    // Reset animation sequence flag if it exists
    this.isPlayingAnimationSequence = false;
    
    // Reset core game values
    this.gameState.score = 0;
    this.gameState.timeRemaining = this.config.GAME_DURATION;
    this.gameState.consecutiveHits = 0;
    this.gameState.currentTarget = null;
    
    // Clear any existing speed timer
    this._resetSpeedProgression();
    
    // Reset state for countries
    this._resetCountries();
    
    // Reset animation state
    if (this.managers.animation) {
      this.managers.animation.stop();
      this.managers.animation.isPaused = false;
      this.managers.animation.changeState("idle");
    }
    

    
    // Reset freedom manager if available
    if (this.managers.freedom) {
      this.managers.freedom.reset();
    }
    
    // Start animation loop
    this.gameState.lastFrameTime = performance.now();
    window.startAnimationLoop();
    
    // Update HUD
    this.updateHUD();
  }
  /**
   * Reset speed progression system
   * @private
   */
  _resetSpeedProgression() {
    // Clear existing timer if present
    if (this.gameState.speedIncreaseInterval) {
      clearInterval(this.gameState.speedIncreaseInterval);
      this.gameState.speedIncreaseInterval = null;
    }

    // Use speed manager if available
    if (this.managers.speed) {
      this.managers.speed.reset();
      this.managers.speed.startSpeedProgression(this.config.SPEED_INCREASE_INTERVAL);
    } else {
      // Fallback to basic speed progression
      this.gameState.gameSpeedMultiplier = 1.0;
      if (this.managers.animation) {
        this.managers.animation.setGameSpeed(this.gameState.gameSpeedMultiplier);
      }

      // Set up simple speed increase timer
      const speedIncreaseInterval = setInterval(() => {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;

        // Increase speed by configured step
        this.gameState.gameSpeedMultiplier = Math.min(
          this.config.MAX_SPEED_MULTIPLIER, 
          this.gameState.gameSpeedMultiplier + this.config.SPEED_INCREASE_STEP
        );
        
        if (this.managers.animation) {
          this.managers.animation.setGameSpeed(this.gameState.gameSpeedMultiplier);
        }

        // Show notification for speed increase
        this.showFasterNotification();
      }, this.config.SPEED_INCREASE_INTERVAL);

      // Store reference to clear on game end
      this.gameState.speedIncreaseInterval = speedIncreaseInterval;
    }
  }

  /**
   * Reset country state
   * @private
   */
  _resetCountries() {
    // Reset stats
    this.gameState.stats.successfulBlocks = 0;
    this.gameState.stats.countriesDefended = 0;

    // Set up animation targets
    this.gameState.countryAnimations = {
      canada: ["grabEastCanada", "grabWestCanada"],
      mexico: ["grabMexico"],
      greenland: ["grabGreenland"],
    };

    // Reset all country states
    for (let country in this.gameState.countries) {
      this.gameState.countries[country].claims = 0;

      const flagOverlay = document.getElementById(`${country}-flag-overlay`);
      if (flagOverlay) {
        flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");
        flagOverlay.style.opacity = 0;
      }
    }
  }

  /**
   * Update countdown timer
   */
  updateCountdown() {
    // Skip if game is paused
    if (this.gameState.isPaused) return;

    // Decrement time
    this.gameState.timeRemaining--;

    // Update progress bar
    this._updateProgressBar();
    
    // Update HUD
    this.updateHUD();

    // Announce time at key intervals
    this._announceTimeRemaining();

    // Check for time-based win condition
    if (this.gameState.timeRemaining <= 0) {
      this.endGame(true); // Win by surviving the time limit
    }
  }

  /**
   * Update the progress bar
   * @private
   */
  _updateProgressBar() {
    const progressPercentage = (
      (this.config.GAME_DURATION - this.gameState.timeRemaining) / 
      this.config.GAME_DURATION
    ) * 100;
    
    const progressBar = document.getElementById("term-progress-bar");
    if (progressBar) {
      progressBar.style.width = `${progressPercentage}%`;

      // Update ARIA attributes for accessibility
      const progressContainer = document.getElementById("term-progress-container");
      if (progressContainer) {
        progressContainer.setAttribute("aria-valuenow", this.gameState.timeRemaining);
      }
    }

    // Update label text based on progress
    const progressLabel = document.getElementById("term-progress-label");
    if (progressLabel) {
      const yearsRemaining = Math.ceil((this.gameState.timeRemaining / this.config.GAME_DURATION) * 4);
      progressLabel.textContent = `${yearsRemaining} ${yearsRemaining === 1 ? "YEAR" : "YEARS"} LEFT`;
    }
  }

  /**
   * Announce time remaining at certain thresholds
   * @private
   */
  _announceTimeRemaining() {
    if (this.gameState.timeRemaining <= 30 && this.gameState.timeRemaining % 10 === 0) {
      this.announceForScreenReaders(`Warning: ${this.gameState.timeRemaining} seconds remaining`);
    }
  }

  /**
   * Update the HUD
   */
  updateHUD() {
    if (this.elements.hud.score) {
      this.elements.hud.score.textContent = this.gameState.score;
    }
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    this.gameState.isPaused = !this.gameState.isPaused;
    
    // Update pause button state
    this._updatePauseButton();
    
    if (this.gameState.isPaused) {
      this._pauseGame();
    } else {
      this._resumeGame();
    }
  }

  /**
   * Update pause button appearance and accessibility
   * @private
   */
  _updatePauseButton() {
    const pauseButton = document.getElementById("pause-button");
    if (!pauseButton) return;
    
    pauseButton.setAttribute("aria-pressed", this.gameState.isPaused ? "true" : "false");
    pauseButton.setAttribute("aria-label", this.gameState.isPaused ? "Resume game" : "Pause game");
    pauseButton.querySelector(".icon").textContent = this.gameState.isPaused ? "▶️" : "⏸️";
  }

  /**
   * Pause the game
   * @private
   */
  _pauseGame() {
    // Stop timers
    clearInterval(this.gameState.countdownTimer);
    
    // Pause animations
    if (this.managers.animation) {
      this.managers.animation.pause();
    }
    
    // Show pause overlay
    this._createPauseOverlay();
    
    // Pause audio
    if (this.managers.audio && typeof this.managers.audio.pauseAll === "function") {
      this.managers.audio.pauseAll();
    }
    
    this.announceForScreenReaders("Game paused");
  }

  /**
   * Create the pause overlay
   * @private
   */
  _createPauseOverlay() {
    const pauseOverlay = document.createElement("div");
    pauseOverlay.id = "pause-overlay";
    pauseOverlay.innerHTML = '<div class="pause-overlay-message">Game Paused</div>';
    this.elements.screens.game.appendChild(pauseOverlay);
  }

  /**
   * Resume the game
   * @private
   */
  _resumeGame() {
    // Remove pause overlay
    const pauseOverlay = document.getElementById("pause-overlay");
    if (pauseOverlay) {
      pauseOverlay.remove();
    }
    
    // Resume timers
    this.gameState.countdownTimer = setInterval(this.updateCountdown, 1000);
    
    // Resume animations
    if (this.managers.animation) {
      this.managers.animation.resume();
    }
    
    // Restart grab sequence
    this.initiateGrab();
    
    // Resume audio
    if (this.managers.audio && typeof this.managers.audio.resumeAll === "function") {
      this.managers.audio.resumeAll();
    }
    
    this.announceForScreenReaders("Game resumed");
  }

  /**
   * Show notification for speed increase
   * @param {string} message - Message to display
   * @param {number} duration - Duration in milliseconds
   */
  showFasterNotification(message = "FASTER!", duration = 3000) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = "speed-notification";
    notification.textContent = message;
    
    // Add accessibility attributes
    notification.setAttribute("role", "alert");
    notification.setAttribute("aria-live", "assertive");
    
    // Add to game screen
    const gameScreen = document.getElementById("game-screen");
    if (gameScreen) {
      gameScreen.appendChild(notification);
      
      // Remove after duration
      setTimeout(() => {
        notification.classList.add("fade-out");
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 500); // Fade out transition duration
      }, duration);
    }
    
    // Announce for screen readers
    this.announceForScreenReaders(message);
  }

  /**
   * Position game elements based on map size
   */
  positionElements() {
    // Get map dimensions
    const mapRect = this.elements.game.map.getBoundingClientRect();
    
    // Check if map has loaded
    if (mapRect.width === 0 || mapRect.height === 0) {
      setTimeout(() => this.positionElements(), 100);
      return;
    }
    
    // Calculate map scale and offset
    this.gameState.mapScale = mapRect.width / this.elements.game.map.naturalWidth;
    this.gameState.mapOffsetX = mapRect.left;
    this.gameState.mapOffsetY = mapRect.top;
    
    // Position child elements
    this.positionCountryFlagOverlays();
    this.positionTrumpCharacter();
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
    const countryFlags = ["canada", "mexico", "greenland"];
    
    countryFlags.forEach((country) => {
      const flagOverlay = document.getElementById(`${country}-flag-overlay`);
      if (!flagOverlay) return;
      
      // Add positioning class
      flagOverlay.classList.add("positioned-flag-overlay");
      
      // Add accessibility attributes
      flagOverlay.setAttribute("role", "img");
      flagOverlay.setAttribute(
        "aria-label", 
        `${country.charAt(0).toUpperCase() + country.slice(1)} flag overlay`
      );
      
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
    
    const trumpContainer = document.getElementById("trump-sprite-container");
    const trumpSprite = document.getElementById("trump-sprite");
    
    if (!trumpContainer || !trumpSprite) return;
    
    const mapRect = this.elements.game.map.getBoundingClientRect();
    
    // Size and position container
    trumpContainer.style.width = mapRect.width + "px";
    trumpContainer.style.height = mapRect.height + "px";
    trumpContainer.style.left = mapRect.left + "px";
    trumpContainer.style.top = mapRect.top + "px";
    trumpContainer.style.transformOrigin = "center top";
    
    // Configure sprite appearance
    trumpSprite.style.width = "100%";
    trumpSprite.style.height = "100%";
    trumpSprite.style.backgroundSize = "auto 100%";
    trumpSprite.style.position = "absolute";
    trumpSprite.style.top = "0";
  }

  /**
   * Start a grab sequence
   */
  initiateGrab() {
    
    // Skip if game isn't actively playing
    if (!this.gameState.isPlaying || this.gameState.isPaused) {
      return;
    }
    
    // Select target country
    const targetCountry = this._selectTargetCountry();
    if (!targetCountry) {
  
      // Use tracked timeout for retry instead of immediate recursion
      this.createTrackedTimeout(() => {
        this.initiateGrab();
      }, 500);
      return;
    }  
    // Select animation for target
    const { animationName } = this._selectAnimationForCountry(targetCountry);
    
    // Set up grab sequence
    this._prepareGrabSequence(targetCountry, animationName);
    
    // Play audio warnings
    if (this.managers.audio) {
      console.log("playing sonic warning");

      this.managers.audio.playGrabWarning();
      this.managers.audio.playGrabAttempt(targetCountry);
    }
    
    // Announce for screen readers
    this.announceForScreenReaders(`Trump is trying to grab ${targetCountry}! Smack his hand!`);
    
    // Start animation sequence
    this._startGrabAnimation(targetCountry, animationName);
  }

  /**
   * Select a target country for grabbing
   * @private
   * @returns {string|null} The selected country name or null if none available
   */
  _selectTargetCountry() {
    const availableCountries = Object.keys(this.gameState.countries).filter((country) => {
      return this.gameState.countries[country].claims < this.gameState.countries[country].maxClaims;
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
   * @returns {Object} Animation info with name and type
   */
  _selectAnimationForCountry(targetCountry) {
    const possibleAnimations = this.gameState.countryAnimations[targetCountry];
    const animationName = possibleAnimations[Math.floor(Math.random() * possibleAnimations.length)];
    
    return { 
      animationName,
      isEastCanada: animationName === "grabEastCanada",
      isWestCanada: animationName === "grabWestCanada"
    };
  }

  /**
   * Prepare the grab sequence visual elements and state
   * @private
   * @param {string} targetCountry - The target country
   * @param {string} animationName - The animation name
   */
  _prepareGrabSequence(targetCountry, animationName) {
    // Set state flags
    this.gameState.currentTarget = targetCountry;
    this.gameState.isEastCanadaGrab = animationName === "grabEastCanada";
    this.gameState.isWestCanadaGrab = animationName === "grabWestCanada";
    
    // Get visual elements
    const visual = document.getElementById("trump-hand-visual");
    const hitbox = document.getElementById("trump-hand-hitbox");
    
    // Check if this is the first block
    const isBeforeFirstBlock = this.gameState.stats.successfulBlocks === 0;
    
    // Use TrumpHandEffects or fallback to direct DOM manipulation
    // Use TrumpHandEffects or fallback to direct DOM manipulation
if (window.trumpHandEffects) {
  window.trumpHandEffects.makeHittable(isBeforeFirstBlock);
  window.trumpHandEffects.highlightTargetCountry(targetCountry, true);
} else {
  const hitbox = document.getElementById("trump-hand-hitbox");
  if (hitbox) {
    hitbox.style.visibility = "visible";
    hitbox.style.pointerEvents = "auto";
    this._legacyPrepareGrabVisuals(visual, hitbox, isBeforeFirstBlock);
  }
}
  }

  /**
   * Legacy method to prepare grab visuals (direct DOM manipulation)
   * @private
   * @param {HTMLElement} visual - The visual element
   * @param {HTMLElement} hitbox - The hitbox element
   * @param {boolean} isBeforeFirstBlock - Whether this is before the first block
   */

  /**
   * Start the grab animation
   * @private
   * @param {string} targetCountry - The target country
   * @param {string} animationName - The animation name
   */
  _startGrabAnimation(targetCountry, animationName) {
    
    if (!this.managers.animation) return;
    
    // Start the animation with completion callback
    this.managers.animation.changeState(animationName, () => {
      const visual = document.getElementById("trump-hand-visual");
      const hitbox = document.getElementById("trump-hand-hitbox");
      
      // This runs when grab completes without being blocked
      if (this.gameState.currentTarget === targetCountry && 
          this.gameState.isPlaying && 
          !this.gameState.isPaused) {
        // Handle successful grab
        this.grabSuccess(targetCountry);
      } else if (this.gameState.isPlaying && !this.gameState.isPaused) {
        // Grab was interrupted or blocked - start next cycle
        this.initiateGrab();
      }

      // Clean up event listeners
      this._cleanupGrabEventListeners(hitbox);

      // Hide the visual completely when animation completes
      if (visual && !window.trumpHandEffects) {
        visual.style.display = "none";
        visual.style.opacity = "0";
        visual.style.border = "none";
        visual.classList.remove("hittable");
      }
    });
  }

  /**
   * Clean up grab sequence event listeners
   * @private
   * @param {HTMLElement} hitbox - The hitbox element
   */
  _cleanupGrabEventListeners(hitbox) {
    if (!hitbox) return;
    
    const isBeforeFirstBlock = this.gameState.stats.successfulBlocks === 0;
    
    if (isBeforeFirstBlock) {
      if (hitbox._enterHandler) hitbox.removeEventListener("mouseenter", hitbox._enterHandler);
      if (hitbox._leaveHandler) hitbox.removeEventListener("mouseleave", hitbox._leaveHandler);
      hitbox._enterHandler = null;
      hitbox._leaveHandler = null;
    }
  }

  /**
   * Stop the grab (player successfully blocked)
   * @param {Event} event - The event that triggered the block
   */
  stopGrab(event) {
    const targetCountry = this.gameState.currentTarget;
    if (!targetCountry) return;
    
    // Get visual elements
    const visual = document.getElementById("trump-hand-visual");
    const hitbox = document.getElementById("trump-hand-hitbox");
    
    // Apply visual effects for the block
    this._applyBlockVisualEffects(visual, hitbox);
    
    // Determine specific grab region
    const smackCountry = this._determineSmackRegion(targetCountry);
    
    // Reset target immediately to prevent double-handling
    this._resetGrabTarget();
    
    // Play sound effects
    this._playBlockSoundEffects(smackCountry);
    
    // Update game state and score
    this._updateScoreAfterBlock();
    
    // Play animation sequence for successful block
    this._playBlockAnimationSequence(smackCountry);
  }

  /**
   * Apply visual effects for a successful block
   * @private
   * @param {HTMLElement} visual - The visual element
   * @param {HTMLElement} hitbox - The hitbox element
   */
  _applyBlockVisualEffects(visual, hitbox) {
    const targetCountry = this.gameState.currentTarget;
    
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
      
      // Handle animation timing
      setTimeout(() => {
        visual.classList.remove("hit");
        visual.classList.add("animation-completed");
        
        setTimeout(() => {
          visual.classList.remove("animation-completed");
          visual.style.display = "none";
          visual.style.opacity = "0";
        }, 100);
      }, this.config.ANIMATION_DELAY);
    }
    
    // Clean up hitbox
    if (hitbox) {
      this._cleanupGrabEventListeners(hitbox);
      hitbox.classList.remove("hittable");
    }
  }

  /**
   * Determine the specific region being smacked
   * @private
   * @param {string} targetCountry - The target country
   * @returns {string} The specific region being smacked
   */
  _determineSmackRegion(targetCountry) {
    if (targetCountry === "canada") {
      if (this.gameState.isEastCanadaGrab) {
        return "eastCanada";
      } else if (this.gameState.isWestCanadaGrab) {
        return "westCanada";
      }
    }
    return targetCountry;
  }

  /**
   * Reset the grab target to prevent double-handling
   * @private
   */
  _resetGrabTarget() {
    this.gameState.currentTarget = null;
    this.gameState.isEastCanadaGrab = false;
    this.gameState.isWestCanadaGrab = false;
  }
  _playBlockSoundEffects(smackCountry) {
    // Check if we're on mobile
    const isMobile = window.DeviceUtils && window.DeviceUtils.isMobileDevice;
    
    if (isMobile && !this.managers.audio) {
      // Only use direct audio approach if the audio manager is not available
      try {
        const baseUrl = window.location.origin + window.location.pathname;
        const soundPath = baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1) + "sounds/slap1.mp3";
        const directSlap = new Audio(soundPath);
        directSlap.volume = 1.0;
        directSlap.play();
      } catch (e) {
        // Silently handle any errors
      }
    } else if (this.managers.audio) {
      // Use the audio manager for all other cases
      this.managers.audio.playSuccessfulBlock(smackCountry);
    }
  }

  _updateScoreAfterBlock() {
    // Check if this is the FIRST successful block (before we increment the counter)
    if (this.gameState.stats.successfulBlocks === 0 && window.handHitboxManager) {
      // First successful block, remove the prompt
      window.handHitboxManager.handleSuccessfulHit();
    }
    
    // Increase score
    this.gameState.score += 10;
  
    // Track consecutive hits and stats
    this.gameState.consecutiveHits++;
    this.gameState.stats.successfulBlocks++;
  
    // Update HUD
    this.updateHUD();
  
    // Announce for screen readers
    this.announceForScreenReaders(`Hand blocked! +10 points. Total score: ${this.gameState.score}`);
  }

  _playBlockAnimationSequence(smackCountry) {
    // Set a flag to prevent multiple animation sequences from starting
    if (this.isPlayingAnimationSequence) return;
    this.isPlayingAnimationSequence = true;
    
    const finishSequence = () => {
      this.isPlayingAnimationSequence = false;
      this.initiateGrab();
    };
    
    if (this.managers.smack) {
      // Use smack manager if available
      this.managers.smack.playSmackAnimation(smackCountry, () => {
        // After smack completes, play slapped animation
        if (this.managers.animation) {
          this.managers.animation.changeState("slapped", finishSequence);
        } else {
          finishSequence();
        }
      });
    } else if (this.managers.animation) {
      // Fallback path if no smack manager
      this.managers.animation.changeState("slapped", finishSequence);
    } else {
      // Last resort fallback
      setTimeout(finishSequence, 1000);
    }
  }

  grabSuccess(country) {
    // Reset consecutive hits
    this.gameState.consecutiveHits = 0;
  
    // Use TrumpHandEffects controller if available
    if (window.trumpHandEffects) {
      window.trumpHandEffects.handleGrabSuccess();
    } else {
      // Legacy approach - direct DOM manipulation
      this._applyGrabSuccessVisuals(country);
    }
  
    // Handle country-specific logic
    if (country === "eastCanada" || country === "westCanada") {
      this._handleCanadaGrab();
    } else {
      this._handleStandardCountryGrab(country);
    }
  
    // Check for game over condition
    if (this._checkGameOverCondition()) {
      this.endGame(false); // Game over, player lost
      return;
    }
  
    // Play victory animation and continue game
    if (this.managers.animation) {
      this.managers.animation.changeState("victory", () => {
        // Continue animation loop
        this.initiateGrab();
      });
    } else {
      // Fallback if no animation manager
      setTimeout(() => this.initiateGrab(), 1000);
    }
  }

  /**
   * Apply visual effects for a successful grab
   * @private
   * @param {string} country - The country being grabbed
   */
  _applyGrabSuccessVisuals(country) {
    const visual = document.getElementById("trump-hand-visual");
    const hitbox = document.getElementById("trump-hand-hitbox");

    // Use the effects controller if available
    if (window.trumpHandEffects) {
      window.trumpHandEffects.applyGrabSuccessEffect();
      window.trumpHandEffects.highlightTargetCountry(country, false);
    } else if (visual) {
      // Legacy approach - direct DOM manipulation
      visual.classList.remove("hittable");

      // Ensure visibility before applying effects
      visual.style.display = "block";
      visual.style.opacity = "1";

      // Add the success class
      visual.classList.add("grab-success");

      // Apply the effect setup
      this.applyGrabSuccessEffect();

      // Handle animation timing
      setTimeout(() => {
        visual.classList.remove("grab-success");
        visual.classList.add("animation-completed");

        setTimeout(() => {
          visual.classList.remove("animation-completed");
          visual.style.display = "none";
          visual.style.opacity = "0";
        }, 100);
      }, this.config.ANIMATION_DELAY);
    }

    // Clean up hitbox
    if (hitbox) {
      hitbox.classList.remove("hittable");
    }
  }

  /**
   * Handle a successful grab of Canada
   * @private
   */
  _handleCanadaGrab() {
    // Increment claim on the shared Canada entity
    this.gameState.countries.canada.claims = Math.min(
      this.gameState.countries.canada.claims + 1, 
      this.gameState.countries.canada.maxClaims
    );

    // Get current claim count
    const claimCount = this.gameState.countries.canada.claims;

    // Play appropriate sounds based on grab count
    if (this.managers.audio) {
      if (claimCount < this.gameState.countries.canada.maxClaims) {
        // First and second grabs
        this.managers.audio.playSuccessfulGrab("canada");
      } else {
        // Final grab (complete annexation)
        this.managers.audio.playCountryAnnexed("canada");
      }
    }

    // Update flag overlay
    this._updateFlagOverlay("canada", claimCount);

    // Announce for screen readers
    this.announceForScreenReaders(`Trump has claimed part of Canada! ${claimCount} out of 3 parts taken.`);
  }

  /**
   * Handle a successful grab of a standard country
   * @private
   * @param {string} country - The country being grabbed
   */
  _handleStandardCountryGrab(country) {
    
    // Log previous and new claim counts
    const previousClaims = this.gameState.countries[country].claims;

    // Increment claim count
    this.gameState.countries[country].claims = Math.min(
      this.gameState.countries[country].claims + 1, 
      this.gameState.countries[country].maxClaims
    );


    // Get current claim count
    const claimCount = this.gameState.countries[country].claims;
      
    // Play appropriate sounds based on grab count
    if (this.managers.audio) {
      if (claimCount < this.gameState.countries[country].maxClaims) {
        // First and second grabs
        this.managers.audio.playSuccessfulGrab(country);
      } else {
        // Final grab (complete annexation)
        this.managers.audio.playCountryAnnexed(country);
      }
    }

    // Update flag overlay
    this._updateFlagOverlay(country, claimCount);

    // Announce for screen readers
    this.announceForScreenReaders(`Trump has claimed part of ${country}! ${claimCount} out of 3 parts taken.`);
  }

  /**
   * Update a country's flag overlay based on claim count
   * @private
   * @param {string} country - The country to update
   * @param {number} claimCount - The number of claims
   */
  _updateFlagOverlay(country, claimCount) {
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
   * Check if game over condition has been met
   * @private
   * @returns {boolean} True if game over condition is met
   */
  _checkGameOverCondition() {
    // Count annexed countries
    const countriesToCheck = ["canada", "mexico", "greenland"];
    const claimedCountries = countriesToCheck.filter((c) => 
      this.gameState.countries[c].claims >= this.gameState.countries[c].maxClaims
    );

    // Update music intensity if audio manager exists
    if (this.managers.audio) {
      this.managers.audio.updateMusicIntensity(claimedCountries.length);
    }

    // Game over if all countries are claimed
    return claimedCountries.length >= countriesToCheck.length;
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
   * Add grab success effect when Trump successfully grabs a country
   */
  applyGrabSuccessEffect() {
    const visual = document.getElementById("trump-hand-visual");
    if (!visual) return;

    // Ensure full opacity
    visual.style.opacity = "1";

    // Set position if needed
    const currentPosition = window.getComputedStyle(visual).position;
    if (currentPosition === "static") {
      visual.style.position = "absolute";
    }

    // Add success class
    visual.classList.add("grab-success");

    // Create additional shards
    for (let i = 3; i <= 8; i++) {
      const shard = document.createElement("div");
      shard.className = `shard${i}`;
      visual.appendChild(shard);
    }

    // Add screen shake
    const gameContainer = document.getElementById("game-container") || document.body;
    gameContainer.classList.add("grab-screen-shake");

    // Force layout recalculation
    void visual.offsetWidth;

    // Clean up after animation
    setTimeout(() => {
      gameContainer.classList.remove("grab-screen-shake");

      // Remove shard elements
      setTimeout(() => {
        for (let i = 3; i <= 8; i++) {
          const shard = visual.querySelector(`.shard${i}`);
          if (shard) visual.removeChild(shard);
        }
        visual.classList.remove("grab-success");
      }, 100);
    }, 700);
  }

  /**
   * Restart the game
   */
  restartGame() {

    this.activeTimeouts.forEach(id => clearTimeout(id));
    this.activeTimeouts = [];

    sessionStorage.setItem('gameRestarted', 'true');

    // Play UI sound
    if (this.managers.audio) {
      this.managers.audio.play("ui", "click");
    }

    // Reset visual state
    this._resetVisualState();
    
    // Reset managers
    this._resetGameManagers();
    
    // Reset game state and start new game
    this._startNewGame();

    // Announce restart for screen readers
    this.announceForScreenReaders("Game restarted! Get ready to block!");
  }

  /**
   * Reset visual state for game restart
   * @private
   */
  _resetVisualState() {
    // Reset flag overlays
    const flagOverlays = document.querySelectorAll(".country-flag-overlay");
    flagOverlays.forEach((overlay) => {
      overlay.classList.remove("opacity-33", "opacity-66", "opacity-100");
      overlay.style.opacity = "0";
    });

    // Hide game over screen, show game screen
    this.elements.screens.gameOver.classList.add("hidden");
    this.elements.screens.game.classList.remove("hidden");
  }

 
  _resetGameManagers() {
    console.log("[DEBUG] _resetGameManagers called, managers state:", {
      audio: !!this.managers.audio,
      animation: !!this.managers.animation,
      freedom: !!this.managers.freedom,
      speed: !!this.managers.speed,
      protestorHitbox: !!this.managers.protestorHitbox
    });
  
    // Reset audio
    if (this.managers.audio) {
      this.managers.audio.stopAll();
      this.managers.audio.stopBackgroundMusic();
    }
  
    // Reset animation with improved handling
    if (this.managers.animation) {
      this.managers.animation.stop();
      
      // Ensure the animation is not paused
      this.managers.animation.isPaused = false;
      
      // Reset to idle state
      this.managers.animation.changeState("idle");
    }
  
    // Reset speed manager
    if (this.managers.speed) {
      this.managers.speed.reset();
      this.managers.speed.startSpeedProgression();
    }
  
    // Reset freedom manager
    if (this.managers.freedom) {
      console.log("[DEBUG] Resetting freedom manager");
      this.managers.freedom.reset();
    }
  
    // Reset protestor hitboxes
    if (this.managers.protestorHitbox) {
      console.log("[DEBUG] Cleaning up protestor hitboxes");
      this.managers.protestorHitbox.cleanupAll();
    }
  }

/**
 * Start a new game after restart
 * @private
 */
_startNewGame() {
  // Reset game state
  this.resetGameState();

  // Restart countdown timer
  this.gameState.countdownTimer = setInterval(this.updateCountdown, 1000);

  // Reposition elements
  this.positionElements();

  // Set playing state
  this.gameState.isPlaying = true;

  // Restart animation and grab sequence
  window.startAnimationLoop();
  
  // IMPORTANT: Schedule the first grab - this is the missing piece
  this.createTrackedTimeout(() => {
    this.initiateGrab();
  }, this.config.INITIAL_GRAB_DELAY);

  // Restart background music
  setTimeout(() => {
    if (this.managers.audio) {
      this.managers.audio.startBackgroundMusic();
    }
  }, 1000);
}

  /**
   * End the game
   * @param {boolean} playerWon - Whether the player won
   */
  endGame(playerWon) {
    // Cancel animation frame if it exists
    if (this.currentAnimationFrame) {
      cancelAnimationFrame(this.currentAnimationFrame);
      this.currentAnimationFrame = null;
    }
  
    // Also cancel the game's animation frame if it exists
    if (this.gameState.currentAnimationFrame) {
      cancelAnimationFrame(this.gameState.currentAnimationFrame);
      this.gameState.currentAnimationFrame = null;
    }
  
    // Clear all timeouts
    this.activeTimeouts.forEach(id => clearTimeout(id));
    this.activeTimeouts = [];
    
    // Stop game state
    this.gameState.isPlaying = false;

    // Clean up game systems
    this._cleanupGameSystems();
    
    // Show game over screen
    this._showGameOverScreen(playerWon);
    
    // Schedule auto-restart if appropriate
    this._scheduleAutoRestart();
  }

  /**
   * Clean up game systems for game end
   * @private
   */
  _cleanupGameSystems() {
    // Stop audio
    if (this.managers.audio) {
      this.managers.audio.stopAll();
      this.managers.audio.stopBackgroundMusic();
      this.managers.audio.destroyAllListeners();
    }

    // Clear timers
    clearInterval(this.gameState.countdownTimer);

    // Stop speed progression
    if (this.managers.speed) {
      this.managers.speed.stopSpeedProgression();
    } else if (this.gameState.speedIncreaseInterval) {
      clearInterval(this.gameState.speedIncreaseInterval);
    }

    // Stop animations
    if (this.managers.animation) {
      this.managers.animation.stop();
      
      // Set final animation state based on outcome
      // this.managers.animation.changeState(playerWon ? "slapped" : "victory");
      
      // Reset game speed
      this.gameState.gameSpeedMultiplier = 1.0;
      this.managers.animation.setGameSpeed(this.gameState.gameSpeedMultiplier);
    }

    // Clean up other managers
    if (this.managers.freedom) {
      this.managers.freedom.destroy();
      this.managers.freedom.reset();
    }

    if (this.managers.ufo) {
      this.managers.ufo.destroy();
    }
  }

  /**
   * Show the game over screen
   * @private
   * @param {boolean} playerWon - Whether the player won
   */
  _showGameOverScreen(playerWon) {
    // Hide game screen, show game over screen
    this.elements.screens.game.classList.add("hidden");
    this.elements.screens.gameOver.classList.remove("hidden");

    // Calculate time statistics
    const totalGameTime = this.config.GAME_DURATION;
    const timeSurvived = totalGameTime - this.gameState.timeRemaining;
    const timeDisplay = this._formatTimeSurvived(timeSurvived, totalGameTime);

    // Update game over animation
    this._updateGameOverAnimation(playerWon);

    // Update game over stats
    this._updateGameOverStats(timeDisplay, playerWon);

    // Play appropriate sound
    if (this.managers.audio) {
      this.managers.audio.play("ui", playerWon ? "win" : "lose");
    }

    // Announce result for screen readers
    const announcement = playerWon 
      ? "Victory! You successfully defended the neighboring countries!"
      : "Game over. The neighboring countries have been claimed by Trump.";
    this.announceForScreenReaders(announcement);

    // Initialize share buttons if function exists
    if (typeof initializeShareButtonsOnGameOver === "function") {
      initializeShareButtonsOnGameOver();
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
   * @param {boolean} playerWon - Whether the player won
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
   * @param {boolean} playerWon - Whether the player won
   */
  _updateGameOverStats(timeDisplay, playerWon) {
    // Update score
    if (this.elements.hud.finalScore) {
      this.elements.hud.finalScore.textContent = this.gameState.score;
    }

    // Format blocks text
    const blocks = this.gameState.stats.successfulBlocks;
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

  /**
   * Schedule auto-restart if appropriate
   * @private
   */
  _scheduleAutoRestart() {
    setTimeout(() => {
      const recorderModal = document.getElementById("voice-recorder-modal");
      const thankYouModal = document.getElementById("thank-you-message");
      
      // Check if both modals are hidden AND no interaction occurred
      const canAutoRestart = (!recorderModal || recorderModal.classList.contains('hidden')) && 
                             (!thankYouModal || thankYouModal.classList.contains('hidden')) &&
                             (!window.voiceRecorder || !window.voiceRecorder.hasUserInteracted());
                             
      if (canAutoRestart) {
        this.restartGame();
      }
    }, this.config.AUTO_RESTART_DELAY);
  }
}