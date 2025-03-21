// Main game script
document.addEventListener("DOMContentLoaded", function () {
  // Debug mode - set to true during development, false for production
  const DEBUG_MODE = true;

  const audioManager = new AudioManager();
  let animationManager;
  let debugManager;

  // Game State
  const gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    timeRemaining: 60,
    baseGrabInterval: 2000, // Time between grabs at normal speed (ms)
    gameSpeedMultiplier: 1.0, // Base speed multiplier (1.0 = normal)
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
    countries: {
      canada: {
        claims: 0,
        maxClaims: 3,
      },
      mexico: {
        claims: 0,
        maxClaims: 3,
      },
      greenland: {
        claims: 0,
        maxClaims: 3,
      },
    },
    lastFrameTime: 0,
  };

  // Game Elements
  const elements = {
    screens: {
      intro: document.getElementById("intro-screen"),
      game: document.getElementById("game-screen"),
      gameOver: document.getElementById("game-over-screen"),
    },
    buttons: {
      start: document.getElementById("start-button"),
      restart: document.getElementById("restart-button"),
      // share: document.getElementById("share-button"),
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
  };
  
  // Create logger
  const logger = new GameLogger();
  window.logger = logger;

  if (DEBUG_MODE) {
    document.addEventListener("DOMContentLoaded", () => {
      logger.createDebugUI();
    });
  }

  function updateGameFrame(timestamp) {
    // Check if game is currently playing
    if (!gameState.isPlaying) return;
  
    // Calculate delta time in milliseconds
    const deltaTime = timestamp - (gameState.lastFrameTime || timestamp);
    gameState.lastFrameTime = timestamp;
  
    // Update freedom mechanics if freedom manager exists
    if (window.freedomManager) {
      window.freedomManager.update(deltaTime);
    }
  
    // Continue animation loop
    requestAnimationFrame(updateGameFrame);
  }
  
  // Add a global function to start the animation loop
  // window.startAnimationLoop = function() {
  //   // Request first animation frame to start the loop
  //   requestAnimationFrame(updateGameFrame);
  // };

  function init() {
    // Create global references BEFORE initializing other managers
    window.audioManager = audioManager;
    audioManager.init(); // Initialize audio manager first
  
    // Initialize Animation Manager
    if (typeof AnimationManager === "function") {
      window.animationManager = new AnimationManager();
  
      // Set debug mode if needed
      if (DEBUG_MODE) {
        window.animationManager.setDebugMode(true);
      }
  
      window.animationManager.init();
    }
  
    // Create other managers
    window.freedomManager = new FreedomManager(gameState, elements, audioManager);
    window.protestorHitboxManager = new ProtestorHitboxManager();
    window.trumpHandEffects = new TrumpHandEffectsController(gameState);

    
    // Connect freedom manager and protestor hitbox manager
    if (window.freedomManager) {
      window.freedomManager.protestorHitboxManager = window.protestorHitboxManager;
  
      if (typeof window.freedomManager.initProtestorHitboxManager === "function") {
        window.freedomManager.initProtestorHitboxManager();
      }
    }
  
    // Initialize speed and smack managers
    if (window.animationManager) {
      window.speedManager = new GameSpeedManager(gameState, window.animationManager, audioManager);
      window.speedManager.init();
  
      window.handHitboxManager = window.animationManager.handHitboxManager;
  
      if (typeof SmackManager === "function") {
        window.smackManager = new SmackManager(window.animationManager);
      }
    }
  
    // Special handling for mobile devices
    const isMobile = window.DeviceUtils ? window.DeviceUtils.isMobileDevice : 
                     /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
    // Apply mobile-specific class if needed
    if (isMobile) {
      document.body.classList.add('mobile-device');
    }
  
    // Enable detailed audio logging in debug mode
    if (DEBUG_MODE) {
      logger.toggleCategory("audio", true);
      logger.toggleLevel("info", true);
      logger.toggleLevel("debug", true);
      logger.toggleLevel("trace", true);
    }
  
    // Add ARIA attributes to screen elements
    if (elements.screens.intro) {
      elements.screens.intro.setAttribute("aria-label", "Game introduction screen");
    }
    if (elements.screens.game) {
      elements.screens.game.setAttribute("aria-label", "Game play area");
    }
    if (elements.screens.gameOver) {
      elements.screens.gameOver.setAttribute("aria-label", "Game over results");
    }
  
    // Setup game controls
    setupGameControls();
    setupAudio();
  
    // Create Trump sprite elements
    const trumpElements = createTrumpSprite();
  
    // Fix mobile touch handling
    fixMobileTouchHandling();
  
    // Position country flags when map loads
    elements.game.map.onload = function () {
      positionCountryFlagOverlays();
    };
  
    // Store reference to trump elements
    elements.trump = trumpElements;
  
    // Add event listeners
    setupEventListeners();
  
    // Initialize Debug Manager if in debug mode
    if (DEBUG_MODE && typeof DebugManager === "function") {
      window.debugManager = new DebugManager(elements, gameState, window.animationManager);
      window.debugManager.init();
  
      // Set up debug panel and debug controls
      enhanceDebugPanel();
      fixDebugAudio();
    }
  
    setupEarthShake();
    setupResponsiveHandling();
  
    // Keep only audio logging enabled by default
    logger.disableAllCategories();
  
    // Initialize GameManager LAST
    window.gameManager = new GameManager({ debug: DEBUG_MODE });
    window.gameManager.init(gameState, elements);
  }

  function setupEarthShake() {
    const gameContainer = document.getElementById("game-container");
    
    if (!gameContainer) return;
    
    // Create the earth-click-shake style if it doesn't exist
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
        // Add a small screen shake (like in your existing code)
        gameContainer.classList.add("earth-click-shake");
  
        // Force layout recalculation to ensure animations are applied
        void gameContainer.offsetWidth;
  
        // Clean up screen shake after animations complete
        setTimeout(() => {
          gameContainer.classList.remove("earth-click-shake");
        }, 300);
      }
    });
    
    logger.debug("game", "Earth click shake handler initialized");
  }

  function createTrumpSprite() {
    // Get existing container
    const trumpContainer = document.getElementById("trump-sprite-container");
    const trumpSprite = document.getElementById("trump-sprite");
    const trumpHandHitBox = document.getElementById("trump-hand-hitbox");

    // Add ARIA attributes
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

      // Make hitbox more visible for debugging
      if (DEBUG_MODE) {
        trumpHandHitBox.classList.add("trump-hand-hitbox-debug");
      }
    }

    return {
      container: trumpContainer,
      sprite: trumpSprite,
      hand: trumpHandHitBox,
    };
  }

  function getHitboxInfo() {
    if (animationManager && animationManager.handHitboxManager) {
      return animationManager.getHitboxInfo();
    }
    return null;
  }

  // In fixMobileTouchHandling function:
  function fixMobileTouchHandling() {
    // Get the hitbox element through the manager for consistency
    const trumpHandHitBox = document.getElementById("trump-hand-hitbox");
    if (!trumpHandHitBox) {
      return;
    }

    // Make hitbox larger on mobile for easier tapping
    const isMobile = window.DeviceUtils ? window.DeviceUtils.isMobileDevice : 
                     /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      trumpHandHitBox.style.width = "90px"; // Increased from 80px
      trumpHandHitBox.style.height = "90px"; // Increased from 80px
    }

    // Clone the element to remove all existing event listeners
    const newHitbox = trumpHandHitBox.cloneNode(true);
    trumpHandHitBox.parentNode.replaceChild(newHitbox, trumpHandHitBox);

    // Update the reference in handHitboxManager after replacing element
    if (window.handHitboxManager) {
      window.handHitboxManager.trumpHandHitBox = newHitbox;
    }

    // Quick response handler function to reduce redundancy
    const handleHitboxEvent = (event) => {
      // Prevent default behaviors
      event.preventDefault();
      event.stopPropagation();

      // Only process if we have a valid target and game is playing
      if (gameState.currentTarget && gameState.isPlaying && !gameState.isPaused) {
        window.gameManager.stopGrab(event);
      }
    };

    // Add click handler for desktop
    newHitbox.addEventListener("click", handleHitboxEvent, { passive: false });

    // Add touch handlers for mobile with passive: false for best performance
    newHitbox.addEventListener("touchstart", handleHitboxEvent, { passive: false });
    newHitbox.addEventListener("touchend", (e) => e.preventDefault(), { passive: false });

    // Add mousedown for immediate response
    newHitbox.addEventListener("mousedown", handleHitboxEvent, { passive: false });
  }

  function setupEventListeners() {
    // Start button click handler with audio initialization
    elements.buttons.start.addEventListener("click", function () {
      console.log("Start button clicked");
  
      // NOW initialize audio system (first user interaction)
      audioManager.init();
  
      // Now resume audio context
      audioManager.resumeAudioContext().then(() => {
        // NOW preload only critical sounds
        console.log("Audio context resumed");
  
        // Preload essential UI sounds
        audioManager.loadEssentialSounds();
  
        // Try to play the click sound
        setTimeout(() => {
          audioManager
            .play("ui", "click")
            .then((sound) => {
              // Preload catchphrases
              audioManager.preloadAllCatchphrases();
              
              // Start the game
              window.gameManager.startGame();
            })
            .catch((error) => {
              window.gameManager.startGame();
            });
        }, 100);
      });
    });
  }

  // Helper to set up responsive handling
  function setupResponsiveHandling() {
    // Resize handler
    window.addEventListener("resize", () => {
      if (gameState.isPlaying) {
        setTimeout(() => window.gameManager.positionElements(), 100);
      }
      window.gameManager.positionCountryFlagOverlays();
      if (window.protestorHitboxManager) {
        window.protestorHitboxManager.repositionAllHitboxes();
      }
    });

    // Orientation change handler for mobile
    window.addEventListener("orientationchange", () => {
      if (gameState.isPlaying) {
        setTimeout(() => window.gameManager.positionElements(), 300);
      }
      window.gameManager.positionCountryFlagOverlays();
    });
  }

  // Simplified debug panel enhancement
  function enhanceDebugPanel() {
    // Find the debug panel
    const debugPanel = document.getElementById("debug-panel");
    if (!debugPanel) return;

    // Apply improved styling
    debugPanel.classList.add("debug-panel-styles");
    debugPanel.style.display = "none";

    // Create toggle button
    const debugToggle = document.createElement("div");
    debugToggle.id = "debug-toggle";

    // Style toggle button
    debugToggle.classList.add("debug-toggle-styles");

    debugToggle.textContent = " ";
    debugToggle.title = "Toggle Debug Panel";

    // Add to document
    document.body.appendChild(debugToggle);

    // Toggle functionality
    debugToggle.addEventListener("click", () => {
      const isVisible = debugPanel.style.display === "block";
      debugPanel.style.display = isVisible ? "none" : "block";
      debugToggle.style.backgroundColor = isVisible ? "rgba(255, 0, 0, 0.1)" : "rgba(0, 128, 0, 0.9)";
    });

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.title = "Close Debug Panel";
    closeButton.classList.add("debug-close-button");

    closeButton.addEventListener("click", () => {
      debugPanel.style.display = "none";
      debugToggle.style.backgroundColor = "rgba(255, 0, 0, 0.9)";
    });

    const title = document.createElement("div");
    title.textContent = "DEBUG PANEL";
    title.classList.add("debug-panel-title");
    // Insert close button and title
    debugPanel.insertBefore(closeButton, debugPanel.firstChild);
    debugPanel.insertBefore(title, debugPanel.firstChild);
  }

  function fixDebugAudio() {
    // Simplified version
    if (!DEBUG_MODE || !debugManager || !audioManager) return;

    // Connect the audioManager to debugManager
    debugManager.audioManager = audioManager;

    // Add a test function for console
    window.testAudio = function (category, name) {
      if (audioManager) {
        return audioManager.play(category, name);
      }
      return "AudioManager not available";
    };
  }

  function setupAudio() {
    // Only create the controls if they don't already exist
    if (document.getElementById("audio-controls")) {
      return;
    }

    // Create audio controls for the game
    const audioControls = document.createElement("div");
    audioControls.id = "audio-controls";
    audioControls.classList.add("game-controls");

    // Simple text button
    audioControls.innerHTML = `
      <button id="toggle-audio" class="control-button">X</button>
    `;

    // Add to game screen
    elements.screens.game.appendChild(audioControls);

    // Get audio button
    const toggleAudioBtn = document.getElementById("toggle-audio");
    if (!toggleAudioBtn) return;

    // Handle audio toggle
    toggleAudioBtn.addEventListener("click", function () {
      const muted = audioManager.toggleMute();
      this.textContent = muted ? "O" : "X";

      // Resume AudioContext on user interaction
      audioManager.resumeAudioContext();
    });
  }

  function addStarsToGameScreen() {
    const stars = document.getElementById("stars");
    if (!stars) return;

    // Reduce star count on mobile devices
    const isMobile = window.DeviceUtils ? window.DeviceUtils.isMobileDevice : 
                     /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    const numStars = isMobile ? 100 : 200;

    for (let i = 0; i < numStars; i++) {
      createStar(stars);
    }
  }

  function setupGameControls() {
    const gameControls = document.querySelector(".game-controls") || document.createElement("div");
  
    if (!gameControls.id) {
      gameControls.id = "game-controls";
      gameControls.classList.add("game-controls");
      elements.screens.game.appendChild(gameControls);
    }
  
    // Add pause button if it doesn't exist
    if (!document.getElementById("pause-button")) {
      const pauseButton = document.createElement("button");
      pauseButton.id = "pause-button";
      pauseButton.classList.add("control-button");
      pauseButton.innerHTML = '<span class="icon"></span>';
      
      // Set initial ARIA attributes here (only once)
      pauseButton.setAttribute("aria-label", "Pause game");
      pauseButton.setAttribute("aria-pressed", "false");
      
      pauseButton.addEventListener("click", () => window.gameManager.togglePause());
      gameControls.appendChild(pauseButton);
    }
  }



  // // Add a global function to start animation loop
  // window.startAnimationLoop = function() {
  //   window.gameManager.initiateGrab();
  // };

  window.startAnimationLoop = function() {
    // Reset last frame time
    gameState.lastFrameTime = performance.now();
  
    // Start animation frame loop
    requestAnimationFrame(updateGameFrame);
  
    // Begin first grab sequence
    if (window.gameManager) {
      window.gameManager.initiateGrab();
    }
  };

  

  // Initialize game when page loads
  init();
});