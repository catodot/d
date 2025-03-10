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


    // countries: {
    //   canada: {
    //     claims: 0,
    //     maxClaims: 3,
    //     canResist: false,
    //     annexedTime: 0
    //   },
    //   mexico: {
    //     claims: 0,
    //     maxClaims: 3,
    //     canResist: false,
    //     annexedTime: 0
    //   },
    //   greenland: {
    //     claims: 0,
    //     maxClaims: 3,
    //     canResist: false,
    //     annexedTime: 0
    //   }
    // },


    
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
      share: document.getElementById("share-button"),
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
    meters: {
      canada: {
        container: document.getElementById("canada-meter"),
        occupation: document.getElementById("canada-occupation"),
        resistance: document.getElementById("canada-resistance"),
      },
      mexico: {
        container: document.getElementById("mexico-meter"),
        occupation: document.getElementById("mexico-occupation"),
        resistance: document.getElementById("mexico-resistance"),
      },
      greenland: {
        container: document.getElementById("greenland-meter"),
        occupation: document.getElementById("greenland-occupation"),
        resistance: document.getElementById("greenland-resistance"),
      },
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

  function init() {
    logger.info("gameState", "Initializing game");

    // Special handling for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      logger.info("device", "Mobile device detected, adding special audio handling");
    }

    // Initialize AudioManager
    audioManager.init(); // find me
    audioManager.setLogger(logger);

    // Enable detailed audio logging in debug mode
    if (DEBUG_MODE) {
      logger.toggleCategory("audio", true);
      logger.toggleLevel("info", true);
      logger.toggleLevel("debug", true);
      logger.toggleLevel("trace", true);
    }

    // Log initial audio state
    audioManager.logAudioState();

    // Setup game controls
    setupGameControls();

    window.freedomManager = new FreedomManager(gameState, elements, audioManager);

    // Initialize Animation Manager
    if (typeof AnimationManager === "function") {
      logger.debug("animation", "Creating AnimationManager instance");

      animationManager = new AnimationManager();

      // Set debug mode if needed
      if (DEBUG_MODE) {
        animationManager.setDebugMode(true);
      }

      animationManager.init();

      // Initialize Smack Manager
      if (typeof SmackManager === "function") {
        logger.debug("animation", "Creating SmackManager instance");
        window.smackManager = new SmackManager(animationManager);
      } else {
        logger.error("animation", "SmackManager not found!");
      }
    } else {
      logger.error("animation", "AnimationManager not found!");
      return; // Exit if AnimationManager is not available
    }

    // Create Trump sprite elements
    const trumpElements = createTrumpSprite();

    // Fix mobile touch handling (improved version that fully replaces event handlers)
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
    let audioDebugCleanup = null;
    if (DEBUG_MODE && typeof DebugManager === "function") {
      logger.debug("debug", "Initializing DebugManager");
      debugManager = new DebugManager(elements, gameState, animationManager);
      debugManager.init();

      // Set up debug panel and debug controls
      enhanceDebugPanel();

      // Fix audio debug controls
      audioDebugCleanup = fixDebugAudio();
    }

    // Initialize resize handling
    setupResponsiveHandling();

    // logger.info("gameState", "Game initialization complete");

    // Keep only audio logging enabled by default
    logger.disableAllCategories();
    // logger.toggleCategory("audio", true);
  }

  // Improved function that creates the Trump sprite but doesn't add event listeners
  function createTrumpSprite() {
    // Get existing container
    const trumpContainer = document.getElementById("trump-sprite-container");
    const trumpSprite = document.getElementById("trump-sprite");
    const handHitbox = document.getElementById("hand-hitbox");

    // Basic setup of dimensions and position
    if (handHitbox) {
      handHitbox.classList.add("hand-hitbox");

      // Make hitbox more visible for debugging
      if (DEBUG_MODE) {
        handHitbox.classList.add("hand-hitbox-debug");
      }

      logger.info("input", "Trump sprite created - event handlers will be added separately");
    }

    return {
      container: trumpContainer,
      sprite: trumpSprite,
      hand: handHitbox,
    };
  }

  // Improved function to fix mobile touch handling
  function fixMobileTouchHandling() {
    const handHitbox = document.getElementById("hand-hitbox");
    if (!handHitbox) {
      logger.error("input", "Hand hitbox not found for touch handling setup");
      return;
    }

    // Log what we're doing
    logger.info("input", "Setting up improved touch handling for mobile");

    // Make hitbox larger on mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      handHitbox.style.width = "80px";
      handHitbox.style.height = "80px";

      logger.debug("input", "Increased hitbox size for mobile");
    }

    // Clone the element to remove all existing event listeners
    const newHitbox = handHitbox.cloneNode(true);
    handHitbox.parentNode.replaceChild(newHitbox, handHitbox);

    // Add click handler for desktop
    newHitbox.addEventListener("click", function (event) {
      // Prevent default behaviors
      event.preventDefault();
      event.stopPropagation();

      logger.debug("input", "Hand click detected");

      // Only process if we have a valid target
      if (gameState.currentTarget && gameState.isPlaying && !gameState.isPaused) {
        logger.info("input", `Click defense against ${gameState.currentTarget}`);
        stopGrab(event);
      } else {
        logger.debug("input", "Click ignored - no valid target");
      }
    });

    // Add touch handler for mobile with proper options
    newHitbox.addEventListener(
      "touchstart",
      function (event) {
        // Always prevent default first to avoid scrolling/zooming
        event.preventDefault();
        event.stopPropagation();

        logger.debug("input", "Hand touch detected");

        // Provide haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }

        // Only process if we have a valid target
        if (gameState.currentTarget && gameState.isPlaying && !gameState.isPaused) {
          logger.info("input", `Touch defense against ${gameState.currentTarget}`);
          stopGrab(event);
        } else {
          logger.debug("input", "Touch ignored - no valid target");
        }
      },
      { passive: false }
    ); // passive: false is crucial for preventing scrolling on iOS

    logger.info("input", "Touch and click handlers set up successfully");

    // Also prevent scrolling on the game container for mobile
    if (isMobile) {
      const gameContainer = document.getElementById("game-container");
      if (gameContainer) {
        gameContainer.addEventListener(
          "touchmove",
          function (e) {
            if (gameState.isPlaying) {
              e.preventDefault();
            }
          },
          { passive: false }
        );

        logger.debug("input", "Added touchmove prevention to game container");
      }
    }
  }

  // Helper to set up event listeners
  function setupEventListeners() {
    // Start button click handler with audio initialization
    elements.buttons.start.addEventListener("click", function () {
      console.log("Start button clicked, initializing audio for the first time...");

      // NOW initialize audio system (first user interaction)
      audioManager.init();

      // Now resume audio context
      audioManager.resumeAudioContext().then(() => {
        console.log("AudioContext resumed, now loading critical sounds");

        // NOW preload only critical sounds
        audioManager.loadSound("ui", "click");

        // Try to play the click sound
        setTimeout(() => {
          console.log("Playing first sound...");
          audioManager
            .play("ui", "click")
            .then((sound) => {
              console.log("First sound played successfully:", !!sound);
              startGame();
            })
            .catch((error) => {
              console.error("Error playing first sound:", error);
              startGame();
            });
        }, 100);
      });
    });

    // Other button event listeners
    elements.buttons.restart.addEventListener("click", restartGame);
    elements.buttons.share.addEventListener("click", shareResults);
  }

  // Helper to set up responsive handling
  function setupResponsiveHandling() {
    // Resize handler
    window.addEventListener("resize", () => {
      if (gameState.isPlaying) {
        logger.debug("rendering", "Window resize detected, repositioning elements");
        setTimeout(positionElements, 100);
      }
      positionCountryFlagOverlays();
    });

    // Orientation change handler for mobile
    window.addEventListener("orientationchange", () => {
      if (gameState.isPlaying) {
        logger.debug("rendering", "Orientation change detected, repositioning elements");
        setTimeout(positionElements, 300);
      }
      positionCountryFlagOverlays();
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
        console.log(`Testing audio: ${category}.${name}`);
        return audioManager.play(category, name);
      }
      return "AudioManager not available";
    };

    logger.info("debug", "Audio debug functions initialized");
  }

  function setupAudio() {
    // Create audio controls for the game
    const audioControls = document.createElement("div");
    audioControls.id = "audio-controls";
    audioControls.classList.add("game-controls");

    audioControls.innerHTML = `
      <button id="toggle-audio" class="control-button">
        <span class="icon">🔊</span>
      </button>
    `;

    // Add to game screen
    elements.screens.game.appendChild(audioControls);

    // Get audio button
    const toggleAudioBtn = document.getElementById("toggle-audio");
    if (!toggleAudioBtn) return;

    // Handle both click and touch events
    const handleToggleAudio = function () {
      const muted = audioManager.toggleMute();
      this.querySelector(".icon").textContent = muted ? "🔇" : "🔊";

      // Always try to resume AudioContext on user interaction
      audioManager.resumeAudioContext();
    };

    toggleAudioBtn.addEventListener("click", handleToggleAudio);
    toggleAudioBtn.addEventListener("touchend", function (e) {
      e.preventDefault(); // Prevent double events on touch devices
      handleToggleAudio.call(this);
    });
  }

  function addStarsToGameScreen() {
    const gameScreen = document.getElementById("game-screen");
    if (!gameScreen) return;

    // Use the same number of stars as the intro screen
    const numStars = 200;

    // Create stars using your existing function
    for (let i = 0; i < numStars; i++) {
      createStar(gameScreen);
    }
  }

  function startGame() {
    console.log(`[MOBILE-DEBUG] startGame called at ${performance.now()}ms`);

    // Always try to resume AudioContext on game start (user interaction)
    if (audioManager) {
      audioManager.resumeAudioContext().then(() => {
        audioManager.ensureSoundsAreLoaded();

        // Start background music after context is resumed
        audioManager.startBackgroundMusic();

        // Begin loading remaining sounds gradually
        setTimeout(() => {
          audioManager.loadRemainingSounds();
          audioManager.preloadAllCatchphrases();
          audioManager.preloadAllProtestSounds(); // Add this line
        }, 2000); // Wait 2 seconds after game start before loading more sounds
      });
    }

    logger.info("gameState", "Starting game");

    // If debug manager is active, reset any edit mode
    if (debugManager) {
      // Remove any editing UI elements
      if (debugManager.doneEditingBtn) {
        debugManager.doneEditingBtn.remove();
        debugManager.doneEditingBtn = null;
      }
    }

    // Hide intro screen, show game screen
    elements.screens.intro.classList.add("hidden");
    elements.screens.game.classList.remove("hidden");
    logger.debug("rendering", "Switched from intro to game screen");

    // Make sure the map is loaded before positioning
    if (elements.game.map.complete) {
      resetGameState();
      gameState.isPlaying = true;

      // Position elements now that game is visible
      positionElements();
      logger.debug("rendering", "Map already loaded, game elements positioned");

      // Start timers after positioning is done
      gameState.countdownTimer = setInterval(updateCountdown, 1000);
      startAnimationLoop();
    } else {
      // Wait for the map to load
      logger.debug("rendering", "Waiting for map to load");
      elements.game.map.onload = function () {
        resetGameState();
        gameState.isPlaying = true;

        // Position elements when map loads
        positionElements();
        logger.debug("rendering", "Map loaded, game elements positioned");

        // Start timers after positioning is done
        gameState.countdownTimer = setInterval(updateCountdown, 1000);
        startAnimationLoop();
      };
    }

    addStarsToGameScreen();
  }

  function updateGameFrame(timestamp) {
    if (!gameState.isPlaying) return;

    // Calculate delta time in milliseconds
    const deltaTime = timestamp - (gameState.lastFrameTime || timestamp);
    gameState.lastFrameTime = timestamp;

    // Update freedom mechanics
    if (window.freedomManager) {
      window.freedomManager.update(deltaTime);
    }

    // Continue animation loop
    requestAnimationFrame(updateGameFrame);
  }

  function resetGameState() {
    logger.info("gameState", "Resetting game state");

    gameState.score = 0;
    gameState.timeRemaining = 168; // 2min 48sec in seconds
    gameState.consecutiveHits = 0;

    // Clear any existing speed timer to avoid duplicates
    if (gameState.speedIncreaseInterval) {
      clearInterval(gameState.speedIncreaseInterval);
      gameState.speedIncreaseInterval = null;
    }

    // Reset game speed
    gameState.gameSpeedMultiplier = 1.0;
    animationManager.setGameSpeed(gameState.gameSpeedMultiplier);

    // Set up simple speed increase timer
    const speedIncreaseInterval = setInterval(() => {
      if (!gameState.isPlaying || gameState.isPaused) return;

      // Increase speed by 0.1 every 16 seconds (just like the example)
      gameState.gameSpeedMultiplier = Math.min(3.0, gameState.gameSpeedMultiplier + 0.5);
      animationManager.setGameSpeed(gameState.gameSpeedMultiplier);

      console.log(`Game speed increased to ${gameState.gameSpeedMultiplier.toFixed(2)}x`);
    }, 16000);

    // Store reference to clear on game end
    gameState.speedIncreaseInterval = speedIncreaseInterval;

    // Add this map to track which animation to use for each country
    gameState.countryAnimations = {
      canada: ["grabEastCanada", "grabWestCanada"], // Randomly select one of these
      mexico: ["grabMexico"],
      greenland: ["grabGreenland"],
    };

    // Reset stats
    gameState.stats.successfulBlocks = 0;
    gameState.stats.countriesDefended = 0;

    // Reset Trump animation
    animationManager.changeState("idle");

    // Play start game sound
    audioManager.play("ui", "start");

    // Start background music after a short delay
    setTimeout(() => {
      audioManager.startBackgroundMusic();
    }, 1000);

    // Reset countries
    for (let country in gameState.countries) {
      gameState.countries[country].claims = 0;

      const flagOverlay = document.getElementById(`${country}-flag-overlay`);
      if (flagOverlay) {
        flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");
        flagOverlay.style.opacity = 0;
      }
    }
    if (window.freedomManager) {
      window.freedomManager.reset();
    }

    // Start animation frame for freedom mechanics
    gameState.lastFrameTime = performance.now();
    requestAnimationFrame(updateGameFrame);

    // Update HUD
    updateHUD();
    logger.debug("gameState", "Game state reset complete");
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
      pauseButton.innerHTML = '<span class="icon">⏸️</span>';
      pauseButton.addEventListener("click", togglePause);
      gameControls.appendChild(pauseButton);
    }
  }

  function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    logger.info("gameState", `Game ${gameState.isPaused ? "paused" : "resumed"}`);

    const pauseButton = document.getElementById("pause-button");
    pauseButton.querySelector(".icon").textContent = gameState.isPaused ? "▶️" : "⏸️";

    if (gameState.isPaused) {
      // Stop timers when paused
      clearInterval(gameState.countdownTimer);
      logger.debug("gameState", "Game timers cleared");

      // Pause animations
      animationManager.pause();

      // Show pause overlay
      const pauseOverlay = document.createElement("div");
      pauseOverlay.id = "pause-overlay";

      pauseOverlay.innerHTML = '<div class="pause-overlay-message">Game Paused</div>';
      elements.screens.game.appendChild(pauseOverlay);
      logger.debug("rendering", "Pause overlay added");

      // Pause any audio
      if (audioManager && typeof audioManager.pauseAll === "function") {
        audioManager.pauseAll();
      }
    } else {
      // Remove pause overlay
      const pauseOverlay = document.getElementById("pause-overlay");
      if (pauseOverlay) {
        pauseOverlay.remove();
        logger.debug("rendering", "Pause overlay removed");
      }

      // Resume timers
      gameState.countdownTimer = setInterval(updateCountdown, 1000);
      startAnimationLoop();
      logger.debug("gameState", "Game timers restored");

      // Resume animations
      animationManager.resume();

      // Resume audio
      if (audioManager && typeof audioManager.resumeAll === "function") {
        audioManager.resumeAll();
      }
    }
  }

  function updateHUD() {
    elements.hud.time.textContent = gameState.timeRemaining;
    elements.hud.score.textContent = gameState.score;
  }

  function updateCountdown() {
    if (gameState.isPaused) return;

    gameState.timeRemaining--;
    updateHUD();

    if (gameState.timeRemaining <= 0) {
      endGame(true); // Win by surviving the time limit
    }
  }

  function positionElements() {
    // Get map dimensions and position
    const mapRect = elements.game.map.getBoundingClientRect();

    // Make sure the map has dimensions before calculating
    if (mapRect.width === 0 || mapRect.height === 0) {
      console.warn("Map dimensions are zero, retrying in 100ms");
      setTimeout(positionElements, 100);
      return;
    }

    gameState.mapScale = mapRect.width / elements.game.map.naturalWidth;
    gameState.mapOffsetX = mapRect.left;
    gameState.mapOffsetY = mapRect.top;

    positionCountryFlagOverlays();

    // Position Trump character
    positionTrumpCharacter();
  }

  function positionCountryFlagOverlays() {
    const mapBackground = elements.game.map;
    if (!mapBackground) {
      console.error("Map background element not found");
      return;
    }

    // Get the map's current dimensions and position
    const mapRect = mapBackground.getBoundingClientRect();

    const countryFlags = ["canada", "mexico", "greenland"];

    countryFlags.forEach((country) => {
      const flagOverlay = document.getElementById(`${country}-flag-overlay`);
      if (!flagOverlay) return;

      // Add a class that handles positioning based on map
      flagOverlay.classList.add("positioned-flag-overlay");

      // Set CSS custom properties if needed for precise positioning
      flagOverlay.style.setProperty("--map-width", `${mapRect.width}px`);
      flagOverlay.style.setProperty("--map-height", `${mapRect.height}px`);
      flagOverlay.style.setProperty("--map-top", `${mapRect.top}px`);
      flagOverlay.style.setProperty("--map-left", `${mapRect.left}px`);
    });
  }

  function positionTrumpCharacter() {
    const trumpContainer = document.getElementById("trump-sprite-container");
    const trumpSprite = document.getElementById("trump-sprite");

    if (!trumpContainer || !trumpSprite) return;

    const mapRect = elements.game.map.getBoundingClientRect();

    // Set Trump container to match the map's size and position
    trumpContainer.style.width = mapRect.width + "px";
    trumpContainer.style.height = mapRect.height + "px";
    trumpContainer.style.left = mapRect.left + "px";
    trumpContainer.style.top = mapRect.top + "px";

    // Set transform origin to center top to prevent downward drift
    trumpContainer.style.transformOrigin = "center top";

    // Ensure the Trump sprite fills the container properly
    trumpSprite.style.width = "100%";
    trumpSprite.style.height = "100%";
    trumpSprite.style.backgroundSize = "auto 100%"; // Keep aspect ratio, fill height
    trumpSprite.style.position = "absolute";
    trumpSprite.style.top = "0"; // Reset position to top
  }

  function startAnimationLoop() {
    // Start with idle animation
    animationManager.changeState("idle", () => {
      // When idle completes, start a grab
      initiateGrab();
    });
  }

  function initiateGrab() {
    if (!gameState.isPlaying || gameState.isPaused) {
      return;
    }

    // Select a country to grab (your existing code for country selection)
    const availableCountries = Object.keys(gameState.countries).filter((country) => {
      return gameState.countries[country].claims < gameState.countries[country].maxClaims;
    });

    if (availableCountries.length === 0) {
      startAnimationLoop(); // Restart loop if no countries left
      return;
    }

    // Select random country and animation (your existing code)
    const targetCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)];
    const possibleAnimations = gameState.countryAnimations[targetCountry];
    const animationName = possibleAnimations[Math.floor(Math.random() * possibleAnimations.length)];

    // Set necessary state flags
    gameState.currentTarget = targetCountry;
    gameState.isEastCanadaGrab = animationName === "grabEastCanada";
    gameState.isWestCanadaGrab = animationName === "grabWestCanada";

    // Play warning sound
    audioManager.playGrabWarning();

    // Play the grab animation
    animationManager.changeState(animationName, () => {
      // This runs if grab completes without being blocked
      if (gameState.currentTarget === targetCountry && gameState.isPlaying && !gameState.isPaused) {
        // Handle successful grab
        grabSuccess(targetCountry);
      } else if (gameState.isPlaying && !gameState.isPaused) {
        // Grab was interrupted or blocked - start next cycle
        startAnimationLoop();
      }
    });

    // Play grab sound
    audioManager.playGrabAttempt(targetCountry);
  }

  function stopGrab(event) {
    const targetCountry = gameState.currentTarget;
    if (!targetCountry) {
      logger.debug("input", "stopGrab called but no current target");
      return;
    }

    // Determine specific grab region (keep this part)
    const smackCountry =
      targetCountry === "canada"
        ? gameState.isEastCanadaGrab
          ? "eastCanada"
          : gameState.isWestCanadaGrab
          ? "westCanada"
          : targetCountry
        : targetCountry;

    // Reset target immediately to prevent double-handling
    gameState.currentTarget = null;
    gameState.isEastCanadaGrab = false;
    gameState.isWestCanadaGrab = false;

    // Play sound effect
    audioManager.playSuccessfulBlock(smackCountry);

    // Increase score
    gameState.score += 10;
    logger.debug("gameState", `Score increased to ${gameState.score}`);

    // Track consecutive hits and stats
    gameState.consecutiveHits++;
    gameState.stats.successfulBlocks++;

    // Update HUD
    updateHUD();

    // Handle animation sequence with clear transitions
    if (window.smackManager) {
      logger.debug("animation", `Playing smack animation for ${smackCountry}`);

      smackManager.playSmackAnimation(smackCountry, () => {
        // After smack completes, play slapped animation
        logger.debug("animation", "Smack impact triggered, changing to slapped animation");

        animationManager.changeState("slapped", () => {
          // After slapped completes, restart animation loop
          logger.debug("animation", "Slapped animation completed, starting next cycle");
          startAnimationLoop();
        });
      });
    } else {
      // Fallback path if no smack manager
      logger.warn("animation", "SmackManager not found, using fallback animation transition");

      animationManager.changeState("slapped", () => {
        startAnimationLoop();
      });
    }
  }

  function grabSuccess(country) {
    audioManager.logAudioState();

    logger.debug("gameState", `grabSuccess called for ${country} from: ${new Error().stack.split("\n")[2]}`);

    // Reset consecutive hits
    gameState.consecutiveHits = 0;

    logger.info("gameState", `Grab succeeded on ${country}`);

    // Reset current target
    gameState.currentTarget = null;

    // Handle East/West Canada special case
    if (country === "eastCanada" || country === "westCanada") {
      // Increment claim on the shared Canada entity
      gameState.countries.canada.claims = Math.min(gameState.countries.canada.claims + 1, gameState.countries.canada.maxClaims);

      // Get current claim count from the shared Canada entity
      const claimCount = gameState.countries.canada.claims;
      logger.debug("gameState", `Canada claim count: ${claimCount}/${gameState.countries.canada.maxClaims}`);

      // Play appropriate sounds based on grab count
      if (claimCount < gameState.countries.canada.maxClaims) {
        // First and second grabs - success sound
        audioManager.playSuccessfulGrab("canada");
      } else {
        // Final grab (complete annexation) - annexation sound
        audioManager.playCountryAnnexed("canada");
        logger.info("gameState", `Canada fully annexed`);
      }

      // Update flag overlay
      const flagOverlay = document.getElementById(`canada-flag-overlay`);
      if (flagOverlay) {
        // Remove previous opacity classes
        flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");

        if (claimCount === 1) {
          flagOverlay.classList.add("opacity-33");
        } else if (claimCount === 2) {
          flagOverlay.classList.add("opacity-66");
        } else if (claimCount === 3) {
          flagOverlay.classList.add("opacity-100");
        }
      }
    } else {
      // Normal processing for other countries
      gameState.countries[country].claims = Math.min(gameState.countries[country].claims + 1, gameState.countries[country].maxClaims);

      // Get current claim count
      const claimCount = gameState.countries[country].claims;
      logger.debug("gameState", `${country} claim count: ${claimCount}/${gameState.countries[country].maxClaims}`);

      // Play appropriate sounds based on grab count
      if (claimCount < gameState.countries[country].maxClaims) {
        // First and second grabs - success sound
        audioManager.playSuccessfulGrab(country);
      } else {
        // Final grab (complete annexation) - annexation sound
        audioManager.playCountryAnnexed(country);
      }

      // Update flag overlay
      const flagOverlay = document.getElementById(`${country}-flag-overlay`);
      if (flagOverlay) {
        // Remove previous opacity classes
        flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");

        if (claimCount === 1) {
          flagOverlay.classList.add("opacity-33");
        } else if (claimCount === 2) {
          flagOverlay.classList.add("opacity-66");
        } else if (claimCount === 3) {
          flagOverlay.classList.add("opacity-100");
        }
      }
    }

    // Check if country is fully claimed
    let checkCountry = country;
    if (country === "eastCanada" || country === "westCanada") {
      checkCountry = "canada";
    }

    const claimCount = gameState.countries[checkCountry].claims;
    if (claimCount >= gameState.countries[checkCountry].maxClaims) {
      // Count total annexed countries
      const annexedCount = Object.keys(gameState.countries).filter((c) => gameState.countries[c].claims >= gameState.countries[c].maxClaims).length;

      // Update music intensity
      audioManager.updateMusicIntensity(annexedCount);

      // Check if all countries are claimed (lose condition)
      const countriesToCheck = ["canada", "mexico", "greenland"];
      const claimedCountries = countriesToCheck.filter((c) => gameState.countries[c].claims >= gameState.countries[c].maxClaims);

      logger.debug("gameState", `${claimedCountries.length}/${countriesToCheck.length} countries fully claimed`);

      if (claimedCountries.length >= countriesToCheck.length) {
        logger.info("gameState", "All countries claimed - ending game (lose)");
        endGame(false); // Game over, player lost
        return;
      }
    }
    logger.debug("animation", "Playing victory animation after successful grab");
    animationManager.changeState("victory", () => {
      // Continue animation loop
      startAnimationLoop();
    });
  }

  function restartGame() {
    // Play UI click sound
    audioManager.play("ui", "click");

    // Reset flag overlays
    const flagOverlays = document.querySelectorAll(".country-flag-overlay");
    flagOverlays.forEach((overlay) => {
      // Remove any opacity classes
      overlay.classList.remove("opacity-33", "opacity-66", "opacity-100");

      // Reset opacity to 0
      overlay.style.opacity = "0";
    });
    elements.screens.gameOver.classList.add("hidden");
    elements.screens.game.classList.remove("hidden");

    resetGameState();

    gameState.countdownTimer = setInterval(updateCountdown, 1000);
    startAnimationLoop();

    gameState.isPlaying = true;

    // Make sure everything is positioned correctly
    setTimeout(positionElements, 100);

    setTimeout(() => {
      audioManager.startBackgroundMusic();
    }, 1000);
  }

  function endGame(playerWon) {
    audioManager.logAudioState();

    if (debugManager) {
      debugManager.cleanup();
    }

    audioManager.stopAll();
    audioManager.stopBackgroundMusic();

    gameState.isPlaying = false;

    // Clear timers
    clearInterval(gameState.countdownTimer);

    if (gameState.speedIncreaseInterval) {
      clearInterval(gameState.speedIncreaseInterval);
    }

    // Reset game speed
    gameState.gameSpeedMultiplier = 1.0;
    animationManager.setGameSpeed(gameState.gameSpeedMultiplier);

    // Stop any ongoing animations
    animationManager.stop();

    // Hide game screen, show game over screen
    elements.screens.game.classList.add("hidden");
    elements.screens.gameOver.classList.remove("hidden");

    // Calculate time survived (starting time - remaining time)
    const totalGameTime = 168; // 2min 48sec
    const timeSurvived = totalGameTime - gameState.timeRemaining;

    // Update game over screen - with null checks
    if (elements.hud.finalScore) elements.hud.finalScore.textContent = gameState.score;
    if (elements.hud.stats.blocks) elements.hud.stats.blocks.textContent = gameState.stats.successfulBlocks;

    // Check if defended-stat exists before updating it
    // This element might be commented out in the HTML
    if (elements.hud.stats.defended && elements.hud.stats.defended.textContent !== undefined) {
      elements.hud.stats.defended.textContent = gameState.stats.countriesDefended;
    }

    if (elements.hud.stats.time) elements.hud.stats.time.textContent = timeSurvived;

    if (playerWon) {
      if (elements.hud.result) elements.hud.result.textContent = "Victory!";
      if (elements.hud.message)
        elements.hud.message.innerHTML = "You successfully defended the neighboring countries from annexation! Together we will prevail.";
      audioManager.play("ui", "win");

      // Trump looks defeated
      animationManager.changeState("slapped");
    } else {
      if (elements.hud.result) elements.hud.result.textContent = "Game Over";
      if (elements.hud.message)
        elements.hud.message.innerHTML = "The neighboring countries have been claimed.<br><br>Alone we fail. Together we'd be unstoppable.";
      audioManager.play("ui", "lose");

      // Trump looks victorious
      animationManager.changeState("victory");
    }
  }
  function shareResults() {
    // Calculate time survived (starting time - remaining time when game ended)
    const totalGameTime = 168; // 2min 48sec
    const timeSurvived = totalGameTime - gameState.timeRemaining;

    const text = `I scored ${gameState.score} points in Presidential Grab, a satirical resistance game! I defended countries from annexation for ${timeSurvived} seconds. Can you do better?`;

    if (navigator.share) {
      navigator
        .share({
          title: "Presidential Grab Game",
          text: text,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      alert("Share this message:\n\n" + text);
    }
  }

  // Initialize game when page loads
  init();
});
