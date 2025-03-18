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
      // restart: document.getElementById("restart-button"),
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
    // Special handling for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Initialize AudioManager
    audioManager.init();

    // Enable detailed audio logging in debug mode
    if (DEBUG_MODE) {
      logger.toggleCategory("audio", true);
      logger.toggleLevel("info", true);
      logger.toggleLevel("debug", true);
      logger.toggleLevel("trace", true);
    }

    // Log initial audio state
    // audioManager.logAudioState();

    // Setup game controls
    setupGameControls();

    // Create FreedomManager
    window.freedomManager = new FreedomManager(gameState, elements, audioManager);

    // Create Protestor Hitbox Manager and connect to FreedomManager
    window.protestorHitboxManager = new ProtestorHitboxManager();

    // Connect the managers
    if (window.freedomManager) {
      window.freedomManager.protestorHitboxManager = window.protestorHitboxManager;

      // Call initialization method
      if (typeof window.freedomManager.initProtestorHitboxManager === "function") {
        window.freedomManager.initProtestorHitboxManager();
      }

      // Add additional debug logging
      
      // Make sure the reset method includes protestor cleanup
      const originalReset = window.freedomManager.reset;
      window.freedomManager.reset = function () {
        originalReset.apply(this, arguments);
        this.resetProtestors();
      };
      
    }

    // Initialize Animation Manager
    if (typeof AnimationManager === "function") {
      animationManager = new AnimationManager();

      // Set debug mode if needed
      if (DEBUG_MODE) {
        animationManager.setDebugMode(true);
      }

      animationManager.init();

      if (animationManager) {
        window.speedManager = new GameSpeedManager(gameState, animationManager, audioManager);
        window.speedManager.init();
      }

      // Store a reference to the handHitboxManager for easier access
      window.handHitboxManager = animationManager.handHitboxManager;

      // Initialize Smack Manager
      if (typeof SmackManager === "function") {
        window.smackManager = new SmackManager(animationManager);
      }
    } else {
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
      debugManager = new DebugManager(elements, gameState, animationManager);
      debugManager.init();

      // Set up debug panel and debug controls
      enhanceDebugPanel();

      // Fix audio debug controls
      audioDebugCleanup = fixDebugAudio();
    }

    // Initialize resize handling
    setupResponsiveHandling();

    // Keep only audio logging enabled by default
    logger.disableAllCategories();
  }

  // Improved function that creates the Trump sprite but doesn't add event listeners
  function createTrumpSprite() {
    // Get existing container
    const trumpContainer = document.getElementById("trump-sprite-container");
    const trumpSprite = document.getElementById("trump-sprite");
    const trumpHandHitBox = document.getElementById("trump-hand-hitbox");

    // Basic setup of dimensions and position
    if (trumpHandHitBox) {
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
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
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
        stopGrab(event);
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
      // NOW initialize audio system (first user interaction)
      audioManager.init();

      // Now resume audio context
      audioManager.resumeAudioContext().then(() => {
        // NOW preload only critical sounds
        audioManager.loadSound("ui", "click");

        // Try to play the click sound
        setTimeout(() => {
          audioManager
            .play("ui", "click")
            .then((sound) => {
              startGame();
            })
            .catch((error) => {
              startGame();
            });
        }, 100);
      });
    });

    // Other button event listeners
    // elements.buttons.restart.addEventListener("click", restartGame);
    // elements.buttons.share.addEventListener("click", shareResults);
  }

  // Helper to set up responsive handling
  function setupResponsiveHandling() {
    // Resize handler
    window.addEventListener("resize", () => {
      if (gameState.isPlaying) {
        setTimeout(positionElements, 100);
      }
      positionCountryFlagOverlays();
      if (window.protestorHitboxManager) {
        window.protestorHitboxManager.repositionAllHitboxes();
      }
    });

    // Orientation change handler for mobile
    window.addEventListener("orientationchange", () => {
      if (gameState.isPlaying) {
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
        return audioManager.play(category, name);
      }
      return "AudioManager not available";
    };
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
    const gameScreen = document.getElementById("stars");
    if (!stars) return;

    const numStars = 200;

    for (let i = 0; i < numStars; i++) {
      createStar(stars);
    }
  }

  function startGame() {
    // Always try to resume AudioContext on game start (user interaction)
    if (audioManager) {
      audioManager.resumeAudioContext().then(() => {
        audioManager.ensureSoundsAreLoaded();

        audioManager.stopBackgroundMusic();

        // Start background music after context is resumed
        audioManager.startBackgroundMusic();

        // Begin loading remaining sounds gradually
        setTimeout(() => {
          audioManager.loadRemainingSounds();
          audioManager.preloadAllCatchphrases();
          audioManager.preloadAllProtestSounds();
        }, 2000); // Wait 2 seconds after game start before loading more sounds
      });
    }

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

    // Make sure the map is loaded before positioning
    if (elements.game.map.complete) {
      resetGameState();
      gameState.isPlaying = true;

      // Position elements now that game is visible
      positionElements();

      // Start timers after positioning is done
      gameState.countdownTimer = setInterval(updateCountdown, 1000);
      startAnimationLoop();
    } else {
      // Wait for the map to load
      elements.game.map.onload = function () {
        resetGameState();
        gameState.isPlaying = true;

        // Position elements when map loads
        positionElements();

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
    gameState.score = 0;
    gameState.timeRemaining = 168; // 2min 48sec in seconds
    gameState.consecutiveHits = 0;

    // Clear any existing speed timer to avoid duplicates
    if (gameState.speedIncreaseInterval) {
      clearInterval(gameState.speedIncreaseInterval);
      gameState.speedIncreaseInterval = null;
    }

    // Reset game speed using the speed manager
    if (window.speedManager) {
      window.speedManager.reset();
      window.speedManager.startSpeedProgression(16000); // 16 seconds between speed increases
    } else {
      // Fallback to the original approach if speed manager isn't available
      gameState.gameSpeedMultiplier = 1.0;
      animationManager.setGameSpeed(gameState.gameSpeedMultiplier);

      // Set up simple speed increase timer
      const speedIncreaseInterval = setInterval(() => {
        if (!gameState.isPlaying || gameState.isPaused) return;

        // Increase speed by 0.5 every 16 seconds
        gameState.gameSpeedMultiplier = Math.min(3.0, gameState.gameSpeedMultiplier + 0.5);
        animationManager.setGameSpeed(gameState.gameSpeedMultiplier);

        // Show notification for speed increase
        showFasterNotification();
      }, 16000);

      // Store reference to clear on game end
      gameState.speedIncreaseInterval = speedIncreaseInterval;
    }

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
      // pauseButton.innerHTML = '<span class="icon">⏸️</span>';
      pauseButton.addEventListener("click", togglePause);
      gameControls.appendChild(pauseButton);
    }
  }

  function togglePause() {
    gameState.isPaused = !gameState.isPaused;

    const pauseButton = document.getElementById("pause-button");
    pauseButton.querySelector(".icon").textContent = gameState.isPaused ? "▶️" : "⏸️";

    if (gameState.isPaused) {
      // Stop timers when paused
      clearInterval(gameState.countdownTimer);

      // Pause animations
      animationManager.pause();

      // Show pause overlay
      const pauseOverlay = document.createElement("div");
      pauseOverlay.id = "pause-overlay";

      pauseOverlay.innerHTML = '<div class="pause-overlay-message">Game Paused</div>';
      elements.screens.game.appendChild(pauseOverlay);

      // Pause any audio
      if (audioManager && typeof audioManager.pauseAll === "function") {
        audioManager.pauseAll();
      }
    } else {
      // Remove pause overlay
      const pauseOverlay = document.getElementById("pause-overlay");
      if (pauseOverlay) {
        pauseOverlay.remove();
      }

      // Resume timers
      gameState.countdownTimer = setInterval(updateCountdown, 1000);
      startAnimationLoop();

      // Resume animations
      animationManager.resume();

      // Resume audio
      if (audioManager && typeof audioManager.resumeAll === "function") {
        audioManager.resumeAll();
      }
    }
  }

  function updateCountdown() {
    if (gameState.isPaused) return;

    gameState.timeRemaining--;

    // Update progress bar width
    const progressPercentage = ((168 - gameState.timeRemaining) / 168) * 100;
    const progressBar = document.getElementById("term-progress-bar");
    if (progressBar) {
      progressBar.style.width = `${progressPercentage}%`;
    }

    // Update label text based on progress
    const progressLabel = document.getElementById("term-progress-label");
    if (progressLabel) {
      const yearsRemaining = Math.ceil((gameState.timeRemaining / 168) * 4);
      progressLabel.textContent = `${yearsRemaining} ${yearsRemaining === 1 ? "YEAR" : "YEARS"} LEFT`;
    }

    // Update HUD (still update score even though it's hidden)
    updateHUD();

    if (gameState.timeRemaining <= 0) {
      endGame(true); // Win by surviving the time limit
    }
  }

  function updateHUD() {
    // Still update the score value even though it's hidden
    elements.hud.score.textContent = gameState.score;
  }
  
  // Simplified HUD update since we now show years in the progress bar
  function updateHUD() {
    elements.hud.score.textContent = gameState.score;
  }

  function positionElements() {
    // Get map dimensions and position
    const mapRect = elements.game.map.getBoundingClientRect();

    // Make sure the map has dimensions before calculating
    if (mapRect.width === 0 || mapRect.height === 0) {
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
  
    // Add visual effect class to the visual element
    const visual = document.getElementById("trump-hand-visual");
    const hitbox = document.getElementById("trump-hand-hitbox");
  
    // Define the event handler functions
    const handleMouseEnter = () => {
      if (visual) visual.style.opacity = "0.3"; // Higher opacity on hover
    };
    
    const handleMouseLeave = () => {
      if (visual) visual.style.opacity = "0.01"; // Back to default opacity when not hovering
    };
  
    if (visual) {
      visual.classList.add("hittable");
      visual.style.opacity = "0.01"; // Set default opacity to 0.01
      visual.style.transform = "scale(1.0)";
    }
  
    if (hitbox) {
      hitbox.classList.add("hittable"); // For the cursor
      
      // Add hover effect
      hitbox.addEventListener("mouseenter", handleMouseEnter);
      hitbox.addEventListener("mouseleave", handleMouseLeave);
    }
  
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
      
      // Clean up event listeners when animation completes
      if (hitbox) {
        hitbox.removeEventListener("mouseenter", handleMouseEnter);
        hitbox.removeEventListener("mouseleave", handleMouseLeave);
      }
    });
  
    // Play grab sound
    audioManager.playGrabAttempt(targetCountry);
  }

  function applyCartoonyHitEffect() {
    const visual = document.getElementById("trump-hand-visual");

    if (!visual) return;

    // Make sure the visual element has position relative or absolute
    const currentPosition = window.getComputedStyle(visual).position;
    if (currentPosition === "static") {
      visual.style.position = "absolute";
    }

    // Ensure the visual is fully opaque for the animation
    visual.style.opacity = "1";

    // Add a small screen shake
    const gameContainer = document.getElementById("game-container") || document.body;
    gameContainer.classList.add("screen-shake");

    // Force layout recalculation to ensure animations are applied
    void visual.offsetWidth;

 // Clean up screen shake after animations complete
 setTimeout(() => {
  gameContainer.classList.remove("screen-shake");
}, 700);
}

function stopGrab(event) {
const targetCountry = gameState.currentTarget;

const visual = document.getElementById("trump-hand-visual");
const hitbox = document.getElementById("trump-hand-hitbox");

if (visual) {
  visual.classList.remove("hittable");
  visual.style.opacity = "1"; // Force full opacity when hit starts
  visual.classList.add("hit");

  // Apply the effect setup
  applyCartoonyHitEffect();

  setTimeout(() => {
    visual.classList.remove("hit");
    visual.classList.add("animation-completed");
    // Remove the class after a short delay
    setTimeout(() => visual.classList.remove("animation-completed"), 100);
  }, 650);
}

if (hitbox) {
  hitbox.classList.remove("hittable"); // Remove cursor style
}

if (!targetCountry) {
  return;
}

// Determine specific grab region
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

// DIRECT APPROACH: Play the slap sound directly if on mobile
if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  try {
    // Create a direct path to the sound file
    const baseUrl = window.location.origin + window.location.pathname;
    const soundPath = baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1) + "sounds/slap1.mp3";

    // Create and play a new Audio element directly - bypassing the audio manager
    const directSlap = new Audio(soundPath);
    directSlap.volume = 1.0; // Full volume
    directSlap.play();
  } catch (e) {
    // Error handling
  }
}

// Also use the audioManager (both approaches for redundancy)
if (audioManager) {
  audioManager.playSuccessfulBlock(smackCountry);
}

// Increase score
gameState.score += 10;

// Track consecutive hits and stats
gameState.consecutiveHits++;
gameState.stats.successfulBlocks++;

// Update HUD
updateHUD();

// Handle animation sequence with clear transitions
if (window.smackManager) {
  smackManager.playSmackAnimation(smackCountry, () => {
    // After smack completes, play slapped animation
    animationManager.changeState("slapped", () => {
      // After slapped completes, restart animation loop
      startAnimationLoop();
    });
  });
} else {
  // Fallback path if no smack manager
  animationManager.changeState("slapped", () => {
    startAnimationLoop();
  });
}
}

function grabSuccess(country) {
// audioManager.logAudioState();

// Reset consecutive hits
gameState.consecutiveHits = 0;

const visual = document.getElementById("trump-hand-visual");
const hitbox = document.getElementById("trump-hand-hitbox");

if (visual) {
  visual.classList.remove("hittable");

  // IMPORTANT: Make sure the visual is visible before applying effects
  visual.style.display = "block";
  visual.style.opacity = ".2";

  // Add the class AFTER ensuring visibility
  visual.classList.add("grab-success");

  // Apply the effect setup
  applyGrabSuccessEffect();

  // This timing matches stopGrab
  setTimeout(() => {
    visual.classList.remove("grab-success");
    visual.classList.add("animation-completed");
    // Remove the class after a short delay
    setTimeout(() => visual.classList.remove("animation-completed"), 100);
  }, 650);
}

if (hitbox) {
  hitbox.classList.remove("hittable");
}

// Reset current target
gameState.currentTarget = null;

// Handle East/West Canada special case
if (country === "eastCanada" || country === "westCanada") {
  // Increment claim on the shared Canada entity
  gameState.countries.canada.claims = Math.min(gameState.countries.canada.claims + 1, gameState.countries.canada.maxClaims);

  // Get current claim count from the shared Canada entity
  const claimCount = gameState.countries.canada.claims;

  // Play appropriate sounds based on grab count
  if (claimCount < gameState.countries.canada.maxClaims) {
    // First and second grabs - success sound
    audioManager.playSuccessfulGrab("canada");
  } else {
    // Final grab (complete annexation) - annexation sound
    audioManager.playCountryAnnexed("canada");
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

  if (claimedCountries.length >= countriesToCheck.length) {
    endGame(false); // Game over, player lost
    return;
  }
}

animationManager.changeState("victory", () => {
  // Continue animation loop
  startAnimationLoop();
});
}

function applyGrabSuccessEffect() {
const visual = document.getElementById("trump-hand-visual");

if (!visual) return;

// Ensure full opacity
visual.style.opacity = "1";

// Make sure the visual element has position relative or absolute
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

// Add a small screen shake (reduced intensity)
const gameContainer = document.getElementById("game-container") || document.body;
gameContainer.classList.add("grab-screen-shake");

// Force layout recalculation to ensure animations are applied
void visual.offsetWidth;

// Clean up screen shake after animations complete
setTimeout(() => {
  gameContainer.classList.remove("grab-screen-shake");

  // Remove shard elements after animation completes
  setTimeout(() => {
    for (let i = 3; i <= 8; i++) {
      const shard = visual.querySelector(`.shard${i}`);
      if (shard) visual.removeChild(shard);
    }
    visual.classList.remove("grab-success");
  }, 100);
}, 700);
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

audioManager.stopBackgroundMusic();

setTimeout(() => {
  audioManager.startBackgroundMusic();
}, 1000);
}

function updateGameOverAnimation(playerWon) {
const trumpAnimation = document.getElementById("trump-game-over-animation");

// Remove any existing animation classes
trumpAnimation.classList.remove("trump-victory-animation", "trump-slapped-animation");

// Add the appropriate animation class based on game outcome
if (playerWon) {
  trumpAnimation.classList.add("trump-slapped-animation");
} else {
  trumpAnimation.classList.add("trump-victory-animation");
}
}

function endGame(playerWon) {
// audioManager.logAudioState();

if (debugManager) {
  debugManager.cleanup();
}

// Stop the game state
gameState.isPlaying = false;

// Clean up audio
audioManager.stopAll();
audioManager.stopBackgroundMusic();
audioManager.destroyAllListeners();

// Clear timers
clearInterval(gameState.countdownTimer);

// Stop speed progression
if (window.speedManager) {
  window.speedManager.stopSpeedProgression();
} else if (gameState.speedIncreaseInterval) {
  clearInterval(gameState.speedIncreaseInterval);
}

// Clean up animation manager
animationManager.stop();

// Clean up freedom manager (protestors)
if (window.freedomManager) {
  // Full reset of freedom manager
  window.freedomManager.destroy();
  window.freedomManager.reset();
}

// Clean up UFO manager (Elon/UFO)
if (window.ufoManager) {
  window.ufoManager.destroy();
}

// Reset game speed
gameState.gameSpeedMultiplier = 1.0;
animationManager.setGameSpeed(gameState.gameSpeedMultiplier);

// Hide game screen, show game over screen
elements.screens.game.classList.add("hidden");
elements.screens.gameOver.classList.remove("hidden");

const totalGameTime = 168; // 2min 48sec
const timeSurvived = totalGameTime - gameState.timeRemaining;

// Calculate years and months survived
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

updateGameOverAnimation(playerWon);

// Update game over screen with meaningful stats
if (elements.hud.finalScore) elements.hud.finalScore.textContent = gameState.score;

// Create grammatically correct blocks text
const blocks = gameState.stats.successfulBlocks;
const blocksText = `${blocks} ${blocks === 1 ? "attack" : "attacks"}`;

// Update stats text with proper grammar
if (elements.hud.stats.blocks) {
  // Change this to update the entire sentence instead of just the number
  const statsTextElement = document.querySelector(".stats-text.game-over-stat-value");
  if (statsTextElement) {
    statsTextElement.innerHTML = `YOU BLOCKED <span id="blocks-stat">${blocksText}</span> AND SURVIVED <span id="time-stat">${timeDisplay}</span>`;
  } else {
    // Fallback if the element structure is different
    elements.hud.stats.blocks.textContent = blocksText;
    if (elements.hud.stats.time) elements.hud.stats.time.textContent = timeDisplay;
  }
}

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

// Also update the share function for grammatical correctness
function shareResults() {
  // Calculate time survived (starting time - remaining time when game ended)
  const totalGameTime = 168; // 2min 48sec
  const timeSurvived = totalGameTime - gameState.timeRemaining;

  // Create grammatically correct text for sharing
  const blocks = gameState.stats.successfulBlocks;
  const blocksText = `${blocks} ${blocks === 1 ? "attack" : "attacks"}`;

  const text = `I scored ${gameState.score} points in Shout! Smack! Fight back!! You blocked ${blocksText} and survived for ${timeDisplay}. Can you do better?`;

  if (navigator.share) {
    navigator
      .share({
        title: "Shout! Smack! Fight back! Game",
        text: text,
        url: window.location.href,
      })
      .catch(console.error);
  } else {
    // Fallback for browsers that don't support Web Share API
    alert("Share this message:\n\n" + text);
  }
}

initializeShareButtonsOnGameOver();
setTimeout(() => {
  restartGame();
}, 20000); // 10 seconds
}

// Initialize game when page loads
init();
});