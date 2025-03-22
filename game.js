// Main game script
document.addEventListener("DOMContentLoaded", function () {
  // Configuration
  const CONFIG = {
    DEBUG_MODE: true,
    GAME_DEFAULTS: {
      initialTime: 60,
      baseSpeedMultiplier: 1.0,
      countryMaxClaims: 3
    },
    COUNTRIES: ['canada', 'mexico', 'greenland']
  };

  // Core game state
  const gameState = createInitialGameState();
  
  // DOM element references
  const elements = createElementReferences();
  
  // Core systems
  const systems = {
    logger: new GameLogger(),
    audio: new AudioManager(),
    animation: null,
    debug: null
  };
  
  // Initialize game on load
  init();

  /**
   * Creates initial game state object
   * @returns {Object} The initial game state
   */
  function createInitialGameState() {
    const countries = {};
    
    CONFIG.COUNTRIES.forEach(country => {
      countries[country] = {
        claims: 0,
        maxClaims: CONFIG.GAME_DEFAULTS.countryMaxClaims
      };
    });
    
    return {
      isPlaying: false,
      isPaused: false,
      score: 0,
      timeRemaining: CONFIG.GAME_DEFAULTS.initialTime,
      gameSpeedMultiplier: CONFIG.GAME_DEFAULTS.baseSpeedMultiplier,
      countdownTimer: null,
      currentTarget: null,
      consecutiveHits: 0,
      stats: {
        successfulBlocks: 0,
        countriesDefended: 0,
      },
      mapScale: 1.0,
      mapOffsetX: 0,
      mapOffsetY: 0,
      countries: countries,
      lastFrameTime: 0
    };
  }

  /**
   * Creates references to DOM elements
   * @returns {Object} Object containing DOM element references
   */
  function createElementReferences() {
    return {
      screens: {
        intro: document.getElementById("intro-screen"),
        game: document.getElementById("game-screen"),
        gameOver: document.getElementById("game-over-screen"),
      },
      buttons: {
        start: document.getElementById("start-button"),
        restart: document.getElementById("restart-button"),
      },
      hud: {
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
      },
      game: {
        container: document.getElementById("game-container"),
        map: document.getElementById("map-background"),
      },
      countries: {
        usa: document.getElementById("usa-flag-overlay"),
        canada: document.getElementById("canada-flag-overlay"),
        mexico: document.getElementById("mexico-flag-overlay"),
        greenland: document.getElementById("greenland-flag-overlay"),
      },
      debug: {
        panel: document.getElementById("debug-panel"),
        toggleHitbox: document.getElementById("toggle-hitbox"),
        calibrateButton: document.getElementById("calibrate-button"),
        testAnimation: document.getElementById("test-animation"),
      },
      trump: null  // Will be populated during initialization
    };
  }

  /**
   * Main game initialization function
   */
  function init() {
    // Set up global references
    window.logger = systems.logger;
    window.audioManager = systems.audio;
    
    // Initialize systems in correct order
    initializeSystems();
    
    // Set up game components
    setupGameComponents();
    
    // Set up event handlers
    setupEventHandlers();
    
    // Initialize debug features if enabled
    if (CONFIG.DEBUG_MODE) {
      initializeDebugFeatures();
    }
    
    // Initialize GameManager last
    window.gameManager = new GameManager({ debug: CONFIG.DEBUG_MODE });
    window.gameManager.init(gameState, elements);
  }

  /**
   * Initialize core game systems
   */
  function initializeSystems() {
    // Initialize the logger
    // systems.logger.init();
    if (CONFIG.DEBUG_MODE) {
      // systems.logger.createDebugUI();
      systems.logger.toggleCategory("audio", true);
      systems.logger.toggleLevel("info", true);
      systems.logger.toggleLevel("debug", true);
      systems.logger.toggleLevel("trace", true);
    } else {
      systems.logger.disableAllCategories();
    }
    
    // Initialize audio system
    systems.audio.init();
    window.audioManager = systems.audio;

    // Initialize animation system if available
    if (typeof AnimationManager === "function") {
      systems.animation = new AnimationManager();
      window.animationManager = systems.animation;
      
      if (CONFIG.DEBUG_MODE) {
        systems.animation.setDebugMode(true);
      }
      
      systems.animation.init();
    }
  }

  function setupGameComponents() {
    console.log("[DEBUG] Setting up game components - START");
    
    // Create Trump character elements
    elements.trump = createTrumpSprite();
    
    // Create specialized managers
    console.log("[DEBUG] Creating managers...");
    console.log("[DEBUG] Creating FreedomManager");
    window.freedomManager = new FreedomManager(gameState, elements, systems.audio);
    console.log("[DEBUG] Creating ProtestorHitboxManager");
    window.protestorHitboxManager = new ProtestorHitboxManager();
    console.log("[DEBUG] Creating TrumpHandEffectsController");
    window.trumpHandEffects = new TrumpHandEffectsController(gameState);
    
    // Connect managers
    console.log("[DEBUG] Connecting managers...");
    if (window.freedomManager && window.protestorHitboxManager) {
      window.freedomManager.protestorHitboxManager = window.protestorHitboxManager;
      
      if (typeof window.freedomManager.initProtestorHitboxManager === "function") {
        console.log("[DEBUG] Initializing protestor hitbox manager");
        window.freedomManager.initProtestorHitboxManager();
      }
    }
    
    // Log the state of the game objects
    console.log("[DEBUG] Manager states:", {
      freedomManager: !!window.freedomManager,
      protestorHitboxManager: !!window.protestorHitboxManager,
      trumpHandEffects: !!window.trumpHandEffects
    });
    
    // Initialize speed and interaction managers
    if (systems.animation) {
      window.speedManager = new GameSpeedManager(gameState, systems.animation, systems.audio);
      window.speedManager.init();
      
      window.handHitboxManager = systems.animation.handHitboxManager;
      
      if (typeof SmackManager === "function") {
        window.smackManager = new SmackManager(systems.animation);
      }
    }
    
    // Apply mobile optimizations
    applyMobileOptimizations();
    
    // Set up UI components
    setupUIComponents();
  }

  /**
   * Set up UI components for the game
   */
  function setupUIComponents() {
    setupGameControls();
    setupAudioControls();
    setupEarthShake();
    addAccessibilityAttributes();
    
    // Position country flags when map loads
    elements.game.map.onload = function() {
      positionCountryFlagOverlays();
    };
  }

  /**
   * Create the Trump sprite and related elements
   * @returns {Object} Trump sprite elements
   */
  function createTrumpSprite() {
    const trumpContainer = document.getElementById("trump-sprite-container");
    const trumpSprite = document.getElementById("trump-sprite");
    const trumpHandHitBox = document.getElementById("trump-hand-hitbox");

    // Add accessibility attributes
    if (trumpContainer) {
      trumpContainer.setAttribute("role", "img");
      trumpContainer.setAttribute("aria-label", "Trump character");
    }
    
    if (trumpSprite) {
      trumpSprite.setAttribute("aria-hidden", "true");
    }
    
    if (trumpHandHitBox) {
      trumpHandHitBox.setAttribute("role", "button");
      trumpHandHitBox.setAttribute("aria-label", "Block Trump's grabbing hand");
      trumpHandHitBox.classList.add("trump-hand-hitbox");

      // Make hitbox more visible in debug mode
      if (CONFIG.DEBUG_MODE) {
        trumpHandHitBox.classList.add("trump-hand-hitbox-debug");
      }
    }

    return {
      container: trumpContainer,
      sprite: trumpSprite,
      hand: trumpHandHitBox,
    };
  }

  /**
   * Apply special optimizations for mobile devices
   */
  function applyMobileOptimizations() {
    const isMobile = detectMobileDevice();
    
    if (isMobile) {
      document.body.classList.add('mobile-device');
      
      // Apply other mobile-specific adjustments
      if (elements.trump && elements.trump.hand) {
        elements.trump.hand.style.width = "90px";
        elements.trump.hand.style.height = "90px";
      }
    }
  }

  /**
   * Detect if user is on a mobile device
   * @returns {boolean} True if mobile device detected
   */
  function detectMobileDevice() {
    return window.DeviceUtils ? 
           window.DeviceUtils.isMobileDevice : 
           /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  /**
   * Add accessibility attributes to game elements
   */
  function addAccessibilityAttributes() {
    if (elements.screens.intro) {
      elements.screens.intro.setAttribute("aria-label", "Game introduction screen");
    }
    if (elements.screens.game) {
      elements.screens.game.setAttribute("aria-label", "Game play area");
    }
    if (elements.screens.gameOver) {
      elements.screens.gameOver.setAttribute("aria-label", "Game over results");
    }
  }

  /**
   * Set up game control buttons
   */
  function setupGameControls() {
    const gameControls = document.querySelector(".game-controls") || document.createElement("div");
  
    if (!gameControls.id) {
      gameControls.id = "game-controls";
      gameControls.classList.add("game-controls");
      elements.screens.game.appendChild(gameControls);
    }
  
    // Add pause button if needed
    if (!document.getElementById("pause-button")) {
      const pauseButton = document.createElement("button");
      pauseButton.id = "pause-button";
      pauseButton.classList.add("control-button");
      pauseButton.innerHTML = '<span class="icon"></span>';
      
      pauseButton.setAttribute("aria-label", "Pause game");
      pauseButton.setAttribute("aria-pressed", "false");
      
      pauseButton.addEventListener("click", () => window.gameManager.togglePause());
      gameControls.appendChild(pauseButton);
    }
  }

  /**
   * Set up audio control buttons
   */
  function setupAudioControls() {
    // Skip if controls already exist
    if (document.getElementById("audio-controls")) {
      return;
    }

    // Create audio controls container
    const audioControls = document.createElement("div");
    audioControls.id = "audio-controls";
    audioControls.classList.add("game-controls");

    // Create mute toggle button
    audioControls.innerHTML = `
      <button id="toggle-audio" class="control-button">X</button>
    `;

    // Add to game screen
    elements.screens.game.appendChild(audioControls);

    // Set up toggle button functionality
    const toggleAudioBtn = document.getElementById("toggle-audio");
    if (toggleAudioBtn) {
      toggleAudioBtn.addEventListener("click", function() {
        const muted = systems.audio.toggleMute();
        this.textContent = muted ? "O" : "X";
        systems.audio.resumeAudioContext();
      });
    }
  }

  /**
   * Set up earth shake effect for missed clicks
   */
  function setupEarthShake() {
    const gameContainer = document.getElementById("game-container");
    
    if (!gameContainer) return;
    
    // Create the earth-shake animation style if needed
    if (!document.getElementById('earth-click-shake-style')) {
      const style = document.createElement('style');
      style.id = 'earth-click-shake-style';
      style.innerHTML = `
        .earth-click-shake {
          animation: earth-click-shake 0.3s ease-in-out;
        }
        
        @keyframes earth-click-shake {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-1px, 1px) rotate(-0.1deg); }
          50% { transform: translate(1px, -1px) rotate(0.1deg); }
          75% { transform: translate(-1px, 0px) rotate(0deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add click listener to apply shake effect
    gameContainer.addEventListener("click", function(event) {
      // Don't shake if game is paused or not playing
      if (!gameState.isPlaying || gameState.isPaused) return;
      
      // Get the target element of the click
      const target = event.target;
      
      // Check if the clicked element is a hitbox or a child of a hitbox
      const isHitbox = target.classList.contains("trump-hand-hitbox") || 
                       target.classList.contains("protestor-hitbox") ||
                       target.closest(".trump-hand-hitbox") ||
                       target.closest(".protestor-hitbox");
      
      // If we didn't click on a hitbox, shake the earth
      if (!isHitbox) {
        // Add the shake animation class
        gameContainer.classList.add("earth-click-shake");
  
        // Force layout recalculation for animation
        void gameContainer.offsetWidth;
  
        // Remove the animation class after completion
        setTimeout(() => {
          gameContainer.classList.remove("earth-click-shake");
        }, 300);
      }
    });
    
    systems.logger.debug("game", "Earth click shake handler initialized");
  }

  /**
   * Set up event handlers for the game
   */
  function setupEventHandlers() {
    // Set up button event listeners
    setupButtonHandlers();
    
    // Set up hitbox event handlers
    setupHitboxHandlers();
    
    // Set up responsive handlers
    setupResponsiveHandlers();
  }

  /**
   * Set up handlers for game buttons
   */
  function setupButtonHandlers() {
    // Start button handler
    if (elements.buttons.start) {
      elements.buttons.start.addEventListener("click", function() {
        console.log("Start button clicked");
        
        systems.audio.init();
        
        systems.audio.resumeAudioContext().then(() => {
          console.log("Audio context resumed");
          
          systems.audio.loadEssentialSounds();
          
          setTimeout(() => {
            systems.audio
              .play("ui", "click")
              .then(() => {
                systems.audio.preloadAllCatchphrases();
                window.gameManager.startGame();
              })
              .catch(() => {
                window.gameManager.startGame();
              });
          }, 100);
        });
      });
    }
    
    // Restart button handler
    if (elements.buttons.restart) {
      elements.buttons.restart.addEventListener("click", function() {
        console.log("Restart button clicked");
        
        systems.audio.init();
        
        systems.audio.resumeAudioContext().then(() => {
          console.log("Audio context resumed for restart");
          
          systems.audio.play("ui", "click").catch(() => {
            console.log("Click sound playback failed");
          });
          
          if (window.gameManager) {
            window.gameManager.restartGame();
          }
        });
      });
    }
  }

  /**
   * Set up handlers for hitbox interactions
   */
  function setupHitboxHandlers() {
    // Get the hitbox element
    const trumpHandHitBox = document.getElementById("trump-hand-hitbox");
    if (!trumpHandHitBox) return;
    
    // Clone to remove existing listeners
    const newHitbox = trumpHandHitBox.cloneNode(true);
    trumpHandHitBox.parentNode.replaceChild(newHitbox, trumpHandHitBox);
    
    // Update reference in hitbox manager
    if (window.handHitboxManager) {
      window.handHitboxManager.trumpHandHitBox = newHitbox;
    }
    
    // Create unified handler for all hitbox events
    const handleHitboxEvent = (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (gameState.currentTarget && gameState.isPlaying && !gameState.isPaused) {
        window.gameManager.stopGrab(event);
      }
    };
    
    // Add event listeners with passive: false for better performance
    newHitbox.addEventListener("click", handleHitboxEvent, { passive: false });
    newHitbox.addEventListener("touchstart", handleHitboxEvent, { passive: false });
    newHitbox.addEventListener("touchend", (e) => e.preventDefault(), { passive: false });
    newHitbox.addEventListener("mousedown", handleHitboxEvent, { passive: false });
  }

  /**
   * Set up responsive handlers for window resize events
   */
  function setupResponsiveHandlers() {
    // Window resize handler
    window.addEventListener("resize", handleWindowResize);
    
    // Orientation change handler for mobile
    window.addEventListener("orientationchange", handleOrientationChange);
  }

  /**
   * Handle window resize events
   */
  function handleWindowResize() {
    if (gameState.isPlaying) {
      setTimeout(() => window.gameManager.positionElements(), 100);
    }
    
    window.gameManager.positionCountryFlagOverlays();
    
    if (window.protestorHitboxManager) {
      window.protestorHitboxManager.repositionAllHitboxes();
    }
  }

  /**
   * Handle orientation change events
   */
  function handleOrientationChange() {
    if (gameState.isPlaying) {
      setTimeout(() => window.gameManager.positionElements(), 300);
    }
    
    window.gameManager.positionCountryFlagOverlays();
  }

  /**
   * Initialize debug features
   */
  function initializeDebugFeatures() {
    // Create debug manager if available
    if (typeof DebugManager === "function") {
      systems.debug = new DebugManager(elements, gameState, systems.animation);
      window.debugManager = systems.debug;
      systems.debug.init();
      
      setupDebugPanel();
      setupDebugAudio();
    }
  }

  /**
   * Set up the debug panel
   */
  function setupDebugPanel() {
    const debugPanel = document.getElementById("debug-panel");
    if (!debugPanel) return;
    
    // Style the debug panel
    debugPanel.classList.add("debug-panel-styles");
    debugPanel.style.display = "none";
    
    // Create toggle button
    const debugToggle = document.createElement("div");
    debugToggle.id = "debug-toggle";
    debugToggle.classList.add("debug-toggle-styles");
    debugToggle.textContent = " ";
    debugToggle.title = "Toggle Debug Panel";
    document.body.appendChild(debugToggle);
    
    // Add toggle functionality
    debugToggle.addEventListener("click", () => {
      const isVisible = debugPanel.style.display === "block";
      debugPanel.style.display = isVisible ? "none" : "block";
      debugToggle.style.backgroundColor = isVisible ? 
        "rgba(255, 0, 0, 0.1)" : "rgba(0, 128, 0, 0.9)";
    });
    
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
      debugToggle.style.backgroundColor = "rgba(255, 0, 0, 0.9)";
    });
    
    // Add elements to panel
    debugPanel.insertBefore(closeButton, debugPanel.firstChild);
    debugPanel.insertBefore(title, debugPanel.firstChild);
  }

  /**
   * Set up debug audio tools
   */
  function setupDebugAudio() {
    if (!CONFIG.DEBUG_MODE || !systems.debug || !systems.audio) return;
    
    // Connect audio manager to debug manager
    systems.debug.audioManager = systems.audio;
    
    // Add a global test function for console debugging
    window.testAudio = function(category, name) {
      if (systems.audio) {
        return systems.audio.play(category, name);
      }
      return "AudioManager not available";
    };
  }

  /**
   * Add stars to the game background
   */
  function addStarsToGameScreen() {
    const stars = document.getElementById("stars");
    if (!stars) return;
    
    // Adjust star count based on device
    const isMobile = detectMobileDevice();
    const numStars = isMobile ? 100 : 200;
    
    for (let i = 0; i < numStars; i++) {
      createStar(stars);
    }
  }

  function updateGameFrame(timestamp) {
    // Skip if game is not playing
    if (!gameState.isPlaying) return;
  
    // Calculate delta time in milliseconds
    const deltaTime = timestamp - (gameState.lastFrameTime || timestamp);
    gameState.lastFrameTime = timestamp;
  
    // Update freedom manager if available - with extra safety checks
    if (window.freedomManager) {
      // Call update with try/catch to ensure errors don't break the animation loop
      try {
        // Call the update method with the calculated delta time
        window.freedomManager.update(deltaTime);
      } catch (err) {
        console.error("[ANIMATION] Error calling freedomManager.update:", err);
      }
    }
  
    // Continue animation loop
    requestAnimationFrame(updateGameFrame);
  }

  window.startAnimationLoop = function() {
    console.log("[DEBUG] startAnimationLoop called with freedomManager:", !!window.freedomManager);
    
    // Reset last frame time
    gameState.lastFrameTime = performance.now();
    
    // IMPORTANT: Make sure freedomManager is ready for update calls
    if (window.freedomManager) {
      console.log("[DEBUG] Ensuring freedomManager update method is callable");
      
      // Force an initial update to kick-start the process
      try {
        window.freedomManager.update(16); // 16ms is roughly one frame at 60 FPS
        console.log("[DEBUG] Initial freedomManager update call succeeded");
      } catch (err) {
        console.error("[DEBUG] Error calling freedomManager.update:", err);
      }
    }
    
    // Start animation frame loop
    requestAnimationFrame(updateGameFrame);
    
    // Begin first grab sequence
    if (window.gameManager) {
      window.gameManager.initiateGrab();
    }
  };
});