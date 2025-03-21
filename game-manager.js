/**
 * GameManager class to organize the main game logic
 */
class GameManager {
  constructor(options = {}) {
    // Store configuration options
    this.DEBUG_MODE = options.debug || false;

    // Reference to game state and elements
    this.gameState = null;
    this.elements = null;

    // Game managers
    this.audioManager = null;
    this.animationManager = null;
    this.freedomManager = null;
    this.speedManager = null;
    this.protestorHitboxManager = null;
    this.smackManager = null;
    this.trumpHandEffects = null; // Reference to hand effects controller

    // Bind methods to maintain context
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
    this.showFasterNotification = this.showFasterNotification.bind(this);
    this.restartGame = this.restartGame.bind(this);
  }

  init(gameState, elements) {
    this.gameState = gameState;
    this.elements = elements;

    // Store manager references directly from window object
    this.audioManager = window.audioManager;
    this.animationManager = window.animationManager;
    this.freedomManager = window.freedomManager;
    this.speedManager = window.speedManager;
    this.protestorHitboxManager = window.protestorHitboxManager;
    this.smackManager = window.smackManager;
    this.trumpHandEffects = window.trumpHandEffects;

    // Set up accessibility features
    this.setupAccessibility();

    if (this.DEBUG_MODE) {
      console.log("GameManager initialized");
    }
    return this;
  }

  /**
   * Set up accessibility enhancements
   */
  setupAccessibility() {
    // Add keyboard navigation
    document.addEventListener("keydown", (e) => {
      // Space or Enter to start game from intro screen
      if ((e.key === " " || e.key === "Enter") && !this.gameState.isPlaying && !this.elements.screens.intro.classList.contains("hidden")) {
        e.preventDefault();
        this.startGame();
      }

      // P to pause/unpause during game
      if (e.key === "p" && this.gameState.isPlaying) {
        e.preventDefault();
        this.togglePause();
      }

      // Space to smack hand during game
      if (e.key === " " && this.gameState.isPlaying && !this.gameState.isPaused && this.gameState.currentTarget) {
        e.preventDefault();
        this.stopGrab();
      }
    });

    // Add a live region for game announcements if it doesn't exist
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
    console.log("GameManager.startGame called");

    // Always try to resume AudioContext on game start (user interaction)
    if (this.audioManager) {
      this.audioManager.resumeAudioContext().then(() => {
        this.audioManager.ensureSoundsAreLoaded();
        this.audioManager.stopBackgroundMusic();

        // Start background music after context is resumed
        this.audioManager.startBackgroundMusic();

        // Play start game sound immediately
        this.audioManager.play("ui", "start");

        // Hide intro screen, show game screen
        this.elements.screens.intro.classList.add("hidden");
        this.elements.screens.game.classList.remove("hidden");

        // Make sure the map is loaded before positioning
        if (this.elements.game.map.complete) {
          this.resetGameState();
          this.gameState.isPlaying = true;

          // Position elements now that game is visible
          this.positionElements();

          // Start timers after positioning is done
          this.gameState.countdownTimer = setInterval(this.updateCountdown, 1000);

          // Delay the first grab sequence to give player time to get oriented
          setTimeout(() => {
            // Begin first grab sequence after delay
            this.initiateGrab();

            // Begin loading remaining sounds using the optimized preload method
            this.audioManager.preloadGameSounds();
          }, 5000); // 5 second delay before first grab to allow for instructions
        } else {
          // Wait for the map to load
          this.elements.game.map.onload = () => {
            this.resetGameState();
            this.gameState.isPlaying = true;

            // Position elements when map loads
            this.positionElements();

            // Start timers after positioning is done
            this.gameState.countdownTimer = setInterval(this.updateCountdown, 1000);

            // Delay the first grab sequence with longer delay
            setTimeout(() => {
              // Begin first grab sequence after delay
              this.initiateGrab();

              // Begin loading remaining sounds using the optimized preload method
              this.audioManager.preloadGameSounds();
            }, 5000); // 5 second delay before first grab
          };
        }

        this.announceForScreenReaders("Game started! Be ready to block Trump's grabbing hand!");

        // Add stars to game screen if function exists
        if (typeof addStarsToGameScreen === "function") {
          addStarsToGameScreen();
        }
      });
    }
  }

  /**
   * Reset the game state
   */
  resetGameState() {
    this.gameState.score = 0;
    this.gameState.timeRemaining = 168; // 2min 48sec in seconds
    this.gameState.consecutiveHits = 0;

    // Clear any existing speed timer to avoid duplicates
    if (this.gameState.speedIncreaseInterval) {
      clearInterval(this.gameState.speedIncreaseInterval);
      this.gameState.speedIncreaseInterval = null;
    }

    // Reset game speed using the speed manager
    if (window.speedManager) {
      window.speedManager.reset();
      window.speedManager.startSpeedProgression(16000); // 16 seconds between speed increases
    } else {
      // Fallback to the original approach if speed manager isn't available
      this.gameState.gameSpeedMultiplier = 1.0;
      this.animationManager.setGameSpeed(this.gameState.gameSpeedMultiplier);

      // Set up simple speed increase timer
      const speedIncreaseInterval = setInterval(() => {
        if (!this.gameState.isPlaying || this.gameState.isPaused) return;

        // Increase speed by 0.5 every 16 seconds
        this.gameState.gameSpeedMultiplier = Math.min(3.0, this.gameState.gameSpeedMultiplier + 0.5);
        this.animationManager.setGameSpeed(this.gameState.gameSpeedMultiplier);

        // Show notification for speed increase
        this.showFasterNotification();
      }, 16000);

      // Store reference to clear on game end
      this.gameState.speedIncreaseInterval = speedIncreaseInterval;
    }

    this.gameState.countryAnimations = {
      canada: ["grabEastCanada", "grabWestCanada"], // Randomly select one of these
      mexico: ["grabMexico"],
      greenland: ["grabGreenland"],
    };

    // Reset stats
    this.gameState.stats.successfulBlocks = 0;
    this.gameState.stats.countriesDefended = 0;

    // Reset Trump animation
    this.animationManager.changeState("idle");

    // Play start game sound
    this.audioManager.play("ui", "start");

    // Reset countries
    for (let country in this.gameState.countries) {
      this.gameState.countries[country].claims = 0;

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
    this.gameState.lastFrameTime = performance.now();
    window.startAnimationLoop();

    // Update HUD
    this.updateHUD();
  }

  /**
   * Update countdown timer
   */
  updateCountdown() {
    if (this.gameState.isPaused) return;

    this.gameState.timeRemaining--;

    // Update progress bar width
    const progressPercentage = ((168 - this.gameState.timeRemaining) / 168) * 100;
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
      const yearsRemaining = Math.ceil((this.gameState.timeRemaining / 168) * 4);
      progressLabel.textContent = `${yearsRemaining} ${yearsRemaining === 1 ? "YEAR" : "YEARS"} LEFT`;
    }

    // Update HUD
    this.updateHUD();

    // Announce time remaining at certain thresholds
    if (this.gameState.timeRemaining <= 30 && this.gameState.timeRemaining % 10 === 0) {
      this.announceForScreenReaders(`Warning: ${this.gameState.timeRemaining} seconds remaining`);
    }

    if (this.gameState.timeRemaining <= 0) {
      this.endGame(true); // Win by surviving the time limit
    }
  }

  /**
   * Update the HUD
   */
  updateHUD() {
    this.elements.hud.score.textContent = this.gameState.score;
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    this.gameState.isPaused = !this.gameState.isPaused;

    const pauseButton = document.getElementById("pause-button");
    if (pauseButton) {
      // Update aria-pressed based on current state
      pauseButton.setAttribute("aria-pressed", this.gameState.isPaused ? "true" : "false");

      // Also update the aria-label to match the current action
      pauseButton.setAttribute("aria-label", this.gameState.isPaused ? "Resume game" : "Pause game");

      const iconElement = pauseButton.querySelector(".icon");
      if (iconElement) {
        iconElement.textContent = this.gameState.isPaused ? "▶️" : "⏸️";
      }
    }

    if (this.gameState.isPaused) {
      // Stop timers when paused
      clearInterval(this.gameState.countdownTimer);

      // Pause animations
      this.animationManager.pause();

      // Show pause overlay
      const pauseOverlay = document.createElement("div");
      pauseOverlay.id = "pause-overlay";

      pauseOverlay.innerHTML = '<div class="pause-overlay-message">Game Paused</div>';
      this.elements.screens.game.appendChild(pauseOverlay);

      // Pause any audio
      if (this.audioManager && typeof this.audioManager.pauseAll === "function") {
        this.audioManager.pauseAll();
      }

      this.announceForScreenReaders("Game paused");
    } else {
      // Remove pause overlay
      const pauseOverlay = document.getElementById("pause-overlay");
      if (pauseOverlay) {
        pauseOverlay.remove();
      }

      // Resume timers
      this.gameState.countdownTimer = setInterval(this.updateCountdown, 1000);
      this.initiateGrab();

      // Resume animations
      this.animationManager.resume();

      // Resume audio
      if (this.audioManager && typeof this.audioManager.resumeAll === "function") {
        this.audioManager.resumeAll();
      }

      this.announceForScreenReaders("Game resumed");
    }
  }

  /**
   * Show notification for speed increase
   */
  showFasterNotification(message = "FASTER!", duration = 3000) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = "speed-notification";
    notification.textContent = message;

    // Make notification accessible
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

    // Also announce for screen readers
    this.announceForScreenReaders(message);
  }

  /**
   * Position game elements based on map size
   */
  positionElements() {
    // Get map dimensions and position
    const mapRect = this.elements.game.map.getBoundingClientRect();

    // Make sure the map has dimensions before calculating
    if (mapRect.width === 0 || mapRect.height === 0) {
      setTimeout(() => this.positionElements(), 100);
      return;
    }

    this.gameState.mapScale = mapRect.width / this.elements.game.map.naturalWidth;
    this.gameState.mapOffsetX = mapRect.left;
    this.gameState.mapOffsetY = mapRect.top;

    this.positionCountryFlagOverlays();
    this.positionTrumpCharacter();
  }

  /**
   * Position country flag overlays
   */
  positionCountryFlagOverlays() {
    const mapBackground = this.elements.game.map;
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

      flagOverlay.setAttribute("role", "img");
      flagOverlay.setAttribute("aria-label", `${country.charAt(0).toUpperCase() + country.slice(1)} flag overlay`);

      // Set CSS custom properties if needed for precise positioning
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

  /**
   * Start a grab sequence
   */
  initiateGrab() {
    if (!this.gameState.isPlaying || this.gameState.isPaused) {
      return;
    }

    // Select a country to grab
    const availableCountries = Object.keys(this.gameState.countries).filter((country) => {
      return this.gameState.countries[country].claims < this.gameState.countries[country].maxClaims;
    });

    if (availableCountries.length === 0) {
      this.initiateGrab(); // Restart loop if no countries left
      return;
    }

    // Select random country and animation
    const targetCountry = availableCountries[Math.floor(Math.random() * availableCountries.length)];
    const possibleAnimations = this.gameState.countryAnimations[targetCountry];
    const animationName = possibleAnimations[Math.floor(Math.random() * possibleAnimations.length)];

    // Set necessary state flags
    this.gameState.currentTarget = targetCountry;
    this.gameState.isEastCanadaGrab = animationName === "grabEastCanada";
    this.gameState.isWestCanadaGrab = animationName === "grabWestCanada";

    // Play warning sound
    this.audioManager.playGrabWarning();

    // Announce for screen readers
    this.announceForScreenReaders(`Trump is trying to grab ${targetCountry}! Smack his hand!`);

    // Handle visual effects using the controller
    const isFirstBlock = this.gameState.stats.successfulBlocks === 0;
    
    if (this.trumpHandEffects) {
      // Use the new API method for grab start
      this.trumpHandEffects.handleGrabStart(targetCountry, isFirstBlock);
    }

    // Play the grab animation
    this.animationManager.changeState(animationName, () => {
      // This runs when grab completes without being blocked
      if (this.gameState.currentTarget === targetCountry && this.gameState.isPlaying && !this.gameState.isPaused) {
        // Handle successful grab
        this.grabSuccess(targetCountry);
      } else if (this.gameState.isPlaying && !this.gameState.isPaused) {
        // Grab was interrupted or blocked - start next cycle
        this.initiateGrab();
      }
    });

    // Play grab sound
    this.audioManager.playGrabAttempt(targetCountry);
  }

  /**
   * Stop the grab (player successfully blocked)
   */
  stopGrab(event) {
    const targetCountry = this.gameState.currentTarget;
    
    // Handle visual effects using the controller
    if (this.trumpHandEffects) {
      // Use the new API method for grab block
      this.trumpHandEffects.handleGrabBlocked();
    }

    if (!targetCountry) {
      return;
    }

    // Determine specific grab region
    const smackCountry =
      targetCountry === "canada"
        ? this.gameState.isEastCanadaGrab
          ? "eastCanada"
          : this.gameState.isWestCanadaGrab
          ? "westCanada"
          : targetCountry
        : targetCountry;

    // Reset target immediately to prevent double-handling
    this.gameState.currentTarget = null;
    this.gameState.isEastCanadaGrab = false;
    this.gameState.isWestCanadaGrab = false;

    // DIRECT APPROACH: Play the slap sound directly if on mobile
    if (window.DeviceUtils && window.DeviceUtils.isMobileDevice) {
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
    if (this.audioManager) {
      this.audioManager.playSuccessfulBlock(smackCountry);
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

    // Handle animation sequence with clear transitions
    if (window.smackManager) {
      this.smackManager.playSmackAnimation(smackCountry, () => {
        // After smack completes, play slapped animation
        this.animationManager.changeState("slapped", () => {
          // After slapped completes, restart animation loop
          this.initiateGrab();
        });
      });
    } else {
      // Fallback path if no smack manager
      this.animationManager.changeState("slapped", () => {
        this.initiateGrab();
      });
    }
  }

  /**
   * Handle successful grab by Trump
   */
  grabSuccess(country) {
    // Reset consecutive hits
    this.gameState.consecutiveHits = 0;

    // Handle visual effects using the controller
    if (this.trumpHandEffects) {
      // Use the new API method for grab success
      this.trumpHandEffects.handleGrabSuccess();
    }

    // Reset current target
    this.gameState.currentTarget = null;

    // Handle East/West Canada special case
    if (country === "eastCanada" || country === "westCanada") {
      // Increment claim on the shared Canada entity
      this.gameState.countries.canada.claims = Math.min(this.gameState.countries.canada.claims + 1, this.gameState.countries.canada.maxClaims);

      // Get current claim count from the shared Canada entity
      const claimCount = this.gameState.countries.canada.claims;

      // Play appropriate sounds based on grab count
      if (claimCount < this.gameState.countries.canada.maxClaims) {
        // First and second grabs - success sound
        this.audioManager.playSuccessfulGrab("canada");
      } else {
        // Final grab (complete annexation) - annexation sound
        this.audioManager.playCountryAnnexed("canada");
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

      // Announce for screen readers
      this.announceForScreenReaders(`Trump has claimed part of Canada! ${claimCount} out of 3 parts taken.`);
    } else {
      // Normal processing for other countries
      this.gameState.countries[country].claims = Math.min(this.gameState.countries[country].claims + 1, this.gameState.countries[country].maxClaims);

      // Get current claim count
      const claimCount = this.gameState.countries[country].claims;

      // Play appropriate sounds based on grab count
      if (claimCount < this.gameState.countries[country].maxClaims) {
        // First and second grabs - success sound
        this.audioManager.playSuccessfulGrab(country);
      } else {
        // Final grab (complete annexation) - annexation sound
        this.audioManager.playCountryAnnexed(country);
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

      // Announce for screen readers
      this.announceForScreenReaders(`Trump has claimed part of ${country}! ${claimCount} out of 3 parts taken.`);
    }

    // Check if country is fully claimed
    let checkCountry = country;
    if (country === "eastCanada" || country === "westCanada") {
      checkCountry = "canada";
    }

    const claimCount = this.gameState.countries[checkCountry].claims;
    if (claimCount >= this.gameState.countries[checkCountry].maxClaims) {
      // Count total annexed countries
      const annexedCount = Object.keys(this.gameState.countries).filter(
        (c) => this.gameState.countries[c].claims >= this.gameState.countries[c].maxClaims
      ).length;

      // Update music intensity
      this.audioManager.updateMusicIntensity(annexedCount);

      // Announce for screen readers
      this.announceForScreenReaders(`${checkCountry} has been completely annexed by Trump!`);

      // Check if all countries are claimed (lose condition)
      const countriesToCheck = ["canada", "mexico", "greenland"];
      const claimedCountries = countriesToCheck.filter((c) => this.gameState.countries[c].claims >= this.gameState.countries[c].maxClaims);

      if (claimedCountries.length >= countriesToCheck.length) {
        this.endGame(false); // Game over, player lost
        return;
      }
    }

    this.animationManager.changeState("victory", () => {
      // Continue animation loop
      this.initiateGrab();
    });
  }

  /**
   * Restart the game
   */
  restartGame() {
    // Play UI click sound
    this.audioManager.play("ui", "click");

    // Reset flag overlays
    const flagOverlays = document.querySelectorAll(".country-flag-overlay");
    flagOverlays.forEach((overlay) => {
      overlay.classList.remove("opacity-33", "opacity-66", "opacity-100");
      overlay.style.opacity = "0";
    });

    // Hide game over screen, show game screen
    this.elements.screens.gameOver.classList.add("hidden");
    this.elements.screens.game.classList.remove("hidden");

    // Instead of destroying, RESET managers
    if (this.audioManager) {
      this.audioManager.stopAll();
      this.audioManager.stopBackgroundMusic();
    }

    if (window.animationManager) {
      window.animationManager.stop(); // Stop, don't destroy
      window.animationManager.changeState("idle"); // Reset to initial state
    }

    if (window.speedManager) {
      window.speedManager.reset(); // Use existing reset method
      window.speedManager.startSpeedProgression();
    }

    if (window.freedomManager) {
      window.freedomManager.reset();
    }

    if (window.protestorHitboxManager) {
      window.protestorHitboxManager.cleanupAll(); // Clean up, don't fully destroy
    }

    // Reset game state
    this.resetGameState();

    // Restart countdown timer
    this.gameState.countdownTimer = setInterval(this.updateCountdown, 1000);

    // Reposition all game elements
    this.positionElements();

    // Start game state
    this.gameState.isPlaying = true;

    // Restart animation and grab sequence
    window.startAnimationLoop();

    // Restart background music
    setTimeout(() => {
      this.audioManager.startBackgroundMusic();
    }, 1000);

    // Announce restart for screen readers
    this.announceForScreenReaders("Game restarted! Get ready to block!");
  }

  /**
   * End the game
   */
  endGame(playerWon) {
    // Stop the game state
    this.gameState.isPlaying = false;

    // Clean up audio
    this.audioManager.stopAll();
    this.audioManager.stopBackgroundMusic();
    this.audioManager.destroyAllListeners();

    // Clear timers
    clearInterval(this.gameState.countdownTimer);

    // Stop speed progression
    if (window.speedManager) {
      window.speedManager.stopSpeedProgression();
    } else if (this.gameState.speedIncreaseInterval) {
      clearInterval(this.gameState.speedIncreaseInterval);
    }

    // Clean up animation manager
    this.animationManager.stop();

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
    this.gameState.gameSpeedMultiplier = 1.0;
    this.animationManager.setGameSpeed(this.gameState.gameSpeedMultiplier);

    // Hide game screen, show game over screen
    this.elements.screens.game.classList.add("hidden");
    this.elements.screens.gameOver.classList.remove("hidden");

    const totalGameTime = 168; // 2min 48sec
    const timeSurvived = totalGameTime - this.gameState.timeRemaining;

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

    this.updateGameOverAnimation(playerWon);

    // Update game over screen with meaningful stats
    if (this.elements.hud.finalScore) this.elements.hud.finalScore.textContent = this.gameState.score;

    // Create grammatically correct blocks text
    const blocks = this.gameState.stats.successfulBlocks;
    const blocksText = `${blocks} ${blocks === 1 ? "attack" : "attacks"}`;

    // Update stats text with proper grammar
    if (this.elements.hud.stats.blocks) {
      // Change this to update the entire sentence instead of just the number
      const statsTextElement = document.querySelector(".stats-text.game-over-stat-value");
      if (statsTextElement) {
        statsTextElement.innerHTML = `YOU BLOCKED <span id="blocks-stat">${blocksText}</span> AND SURVIVED <span id="time-stat">${timeDisplay}</span>`;
      } else {
        // Fallback if the element structure is different
        this.elements.hud.stats.blocks.textContent = blocksText;
        if (this.elements.hud.stats.time) this.elements.hud.stats.time.textContent = timeDisplay;
      }
    }

    if (playerWon) {
      if (this.elements.hud.result) this.elements.hud.result.textContent = "Victory!";
      if (this.elements.hud.message)
        this.elements.hud.message.innerHTML = "You successfully defended the neighboring countries from annexation! Together we will prevail.";
      this.audioManager.play("ui", "win");

      // Trump looks defeated
      this.animationManager.changeState("slapped");

      // Announce for screen readers
      this.announceForScreenReaders("Victory! You successfully defended the neighboring countries!");
    } else {
      if (this.elements.hud.result) this.elements.hud.result.textContent = "Game Over";
      if (this.elements.hud.message)
        this.elements.hud.message.innerHTML = "The neighboring countries have been claimed.<br><br>Alone we fail. Together we'd be unstoppable.";
      this.audioManager.play("ui", "lose");

      // Trump looks victorious
      this.animationManager.changeState("victory");

      // Announce for screen readers
      this.announceForScreenReaders("Game over. The neighboring countries have been claimed by Trump.");
    }

    // Initialize share buttons
    if (typeof initializeShareButtonsOnGameOver === "function") {
      initializeShareButtonsOnGameOver();
    }

    // Auto-restart after delay if no interaction with the voice recorder
    setTimeout(() => {
      const recorderModal = document.getElementById("voice-recorder-modal");
      const thankYouModal = document.getElementById("thank-you-message");
      
      // Check if both modals are hidden AND no interaction occurred
      if ((!recorderModal || recorderModal.classList.contains('hidden')) && 
          (!thankYouModal || thankYouModal.classList.contains('hidden')) &&
          (!window.voiceRecorder || !window.voiceRecorder.hasUserInteracted())) {
          this.restartGame();
      }
    }, 20000); // 20 seconds
  }

  /**
   * Update the game over animation based on win/loss
   */
  updateGameOverAnimation(playerWon) {
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
}