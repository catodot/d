class FreedomManager {
  // Z-index constants for proper layering
  static Z_INDEXES = {
    BASE: 1000,
    CONFETTI: 1005,
    FIREWORKS: 1010,
    FLASH: 1015,
    TEXT: 1020,
    PROTESTORS: 1025,
  };

  /**
   * @param {Object} gameState - The game state object
   * @param {Object} elements - DOM elements
   * @param {Object} audioManager - Audio management system
   * @param {Object} [config] - Optional configuration
   */
  constructor(gameState, elements, audioManager, config = {}) {
    this.gameState = gameState;
    this.elements = elements;
    this.audioManager = audioManager;

    // Configuration with defaults
    this.config = {
      fullAnnexationTime: 10000, // 10 seconds after full annexation before resistance is possible
      resistanceChance: 0.05, // 5% check per second for fully annexed countries
      protestorShowDelay: 0.75, // Show protestors at 75% of annexation time
      effectsEnabled: {
        confetti: true,
        screenShake: true,
        fireworks: true,
      },
      ...config,
    };

        // Logger setup
        this.setupLogger();

    this.initProtestorHitboxManager();


    // Set up country data in a unified structure
    this.countries = {
      canada: {
        id: "canada",
        annexTime: 0,
        resistanceAvailable: false,
        protestorsShown: false,
        clickCounter: 0,
        disappearTimeout: null,
        animations: {},
      },
      mexico: {
        id: "mexico",
        annexTime: 0,
        resistanceAvailable: false,
        protestorsShown: false,
        clickCounter: 0,
        disappearTimeout: null,
        animations: {},
      },
      greenland: {
        id: "greenland",
        annexTime: 0,
        resistanceAvailable: false,
        protestorsShown: false,
        clickCounter: 0,
        disappearTimeout: null,
        animations: {},
      },
    };

    // Animation tracking
    this.activeAnimations = {
      confetti: [],
      fireworks: [],
      protestors: {},
    };

    // Create containers for particles
    this.createParticleContainers();



    // Store reference to other game systems
    this.animationManager = window.animationManager;
    this.smackManager = window.smackManager;

    this.logger.info("freedom", "Enhanced Freedom Manager initialized");
  }

  /**
   * Set up logger reference
   */
  setupLogger() {
    this.logger = window.logger || {
      debug: (category, message) => console.log(`[DEBUG] ${category}: ${message}`),
      info: (category, message) => console.log(`[INFO] ${category}: ${message}`),
      warn: (category, message) => console.warn(`[WARN] ${category}: ${message}`),
      error: (category, message) => console.error(`[ERROR] ${category}: ${message}`),
    };
  }

  /**
   * Create particle containers for visual effects
   */
  createParticleContainers() {
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) {
      return;
    }

    // Create one container per country
    Object.keys(this.countries).forEach((countryId) => {
      // Check if container already exists
      if (document.getElementById(`${countryId}-particles`)) {
        return;
      }

      const container = document.createElement("div");
      container.id = `${countryId}-particles`;
      container.className = "freedom-particles";
      container.style.position = "absolute";
      container.style.left = "0";
      container.style.top = "0";
      container.style.width = "100%";
      container.style.height = "100%";
      container.style.pointerEvents = "none";
      container.style.zIndex = FreedomManager.Z_INDEXES.BASE;
      container.style.overflow = "hidden";

      gameContainer.appendChild(container);
    });
  }


  /**
   * Modified update method to add logging around resistance checking
   * @param {number} deltaTime - Time since last frame in milliseconds
   */
  update(deltaTime) {
    if (!this.gameState.isPlaying || this.gameState.isPaused) return;

    // Convert deltaTime from ms to seconds for chance calculation
    const deltaSeconds = deltaTime / 1000;

    // Process each country
    Object.keys(this.countries).forEach((countryId) => {
      const country = this.countries[countryId];
      const gameCountry = this.gameState.countries[countryId];

      if (!gameCountry) return;

      // Check if country is fully annexed
      if (gameCountry.claims >= gameCountry.maxClaims) {
        // Update annexation timer
        country.annexTime += deltaTime;

        // Show protestors when at the configured delay threshold
        const protestorThreshold = this.config.fullAnnexationTime * this.config.protestorShowDelay;
        if (country.annexTime >= protestorThreshold && !country.protestorsShown) {
          this.logger.info("freedom", `[THRESHOLD] ${countryId} reached protestor show threshold at ${country.annexTime}ms`);
          this.showProtestors(countryId);
          country.protestorsShown = true;
        }

        // Check if country has been annexed long enough to enable resistance
        if (country.annexTime >= this.config.fullAnnexationTime && !country.resistanceAvailable) {
          country.resistanceAvailable = true;
          this.logger.info(
            "freedom",
            `[RESISTANCE AVAILABLE] ${countryId} now able to resist after ${(country.annexTime / 1000).toFixed(1)}s of full annexation`
          );

          // Show subtle indicator that resistance is possible
          this.showResistancePossibleIndicator(countryId);
        }

        // Check for resistance for countries that have been annexed long enough
        // MODIFIED: Add extra check to prevent auto-resistance if protestors are showing
        if (country.resistanceAvailable && !country.protestorsShown) {
          // Calculate per-frame chance based on per-second chance
          const frameResistanceChance = this.config.resistanceChance * deltaSeconds;

          // Random check if resistance should happen now
          if (Math.random() < frameResistanceChance) {
            this.logger.info("freedom", `[AUTO UPRISING] Random resistance triggered in ${countryId}!`);
            this.triggerCountryResistance(countryId);

            // Reset after successful resistance
            country.resistanceAvailable = false;
            country.annexTime = 0;
            country.protestorsShown = false;
            this.hideProtestors(countryId);
          }
        }
      } else {
        // Country not fully annexed, reset timer and hide protestors
        if (country.protestorsShown) {
          this.hideProtestors(countryId);
          country.protestorsShown = false;
        }
        country.annexTime = 0;
        country.resistanceAvailable = false;
      }
    });
  }

  /**
   * Show indicator that resistance is possible
   * @param {string} countryId - Country identifier
   */
  showResistancePossibleIndicator(countryId) {
    const countryElement = this.elements.countries[countryId];
    if (!countryElement) return;

    // Add pulsing glow effect
    countryElement.classList.add("resistance-possible");

    // Play subtle sound
    this.playSound("particles", "freedom", 0.4); // Lower volume
  }



  shrinkAndHideProtestors(countryId) {
    const protestorWrapper = this.countries[countryId].protestorWrapper || 
                          document.getElementById(`${countryId}-protestors-wrapper`);
    if (!protestorWrapper) return;
  
    this.logger.info("freedom", `Protestors timed out in ${countryId}, disappearing`);
  
    // Add transition for smooth shrinking animation
    protestorWrapper.style.transition = "transform 0.5s ease, opacity 0.5s ease";
    protestorWrapper.style.transform = "scale(0.1)";
    protestorWrapper.style.opacity = "0";
  
    // Hide after animation completes
    setTimeout(() => {
      this.hideProtestors(countryId);
  
      // Reset click counter
      if (this.countries[countryId]) {
        this.countries[countryId].clickCounter = 0;
      }
    }, 500);
  }


  /**
   * Create freedom celebration for country liberation
   * @param {string} countryId - Country identifier
   */
  createFreedomCelebration(countryId) {
    // Get the flag overlay to determine position
    const flagOverlay = document.getElementById(`${countryId}-flag-overlay`);
    if (!flagOverlay) {
      this.logger.error("freedom", `Flag overlay for ${countryId} not found for freedom celebration!`);
      return;
    }

    // Get the game container
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) return;

    // Get flag position and dimensions relative to the game container
    const flagRect = flagOverlay.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    // Calculate positions
    const flagLeft = flagRect.left - containerRect.left;
    const flagTop = flagRect.top - containerRect.top;
    const flagWidth = flagRect.width;
    const flagHeight = flagRect.height;

    // Screen shake effect if enabled
    if (this.config.effectsEnabled.screenShake) {
      this.addScreenShake(gameContainer);
    }

    // Create flash effect
    this.createFlashEffect(flagLeft, flagTop, flagWidth, flagHeight, gameContainer);

    // Create "RESISTANCE!" text
    this.createResistanceText(flagLeft, flagTop, flagWidth, flagHeight, gameContainer);

    // Create confetti if enabled
    if (this.config.effectsEnabled.confetti) {
      this.createConfettiBurst(flagLeft, flagTop, flagWidth, flagHeight, gameContainer);
    }
  }

  /**
   * Add screen shake effect to container
   * @param {HTMLElement} container - Container to apply shake effect
   */
  addScreenShake(container) {
    container.classList.add("screen-shake");
    setTimeout(() => {
      container.classList.remove("screen-shake");
    }, 800);
  }

  /**
   * Create flash effect for resistance event
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {HTMLElement} container - Parent container
   */
  createFlashEffect(x, y, width, height, container) {
    const flash = document.createElement("div");
    flash.className = "freedom-flash";
    flash.style.position = "absolute";
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    flash.style.width = `${width}px`;
    flash.style.height = `${height}px`;
    flash.style.borderRadius = "10%";
    flash.style.zIndex = FreedomManager.Z_INDEXES.FLASH;
    container.appendChild(flash);

    // Remove flash after animation completes
    setTimeout(() => {
      if (flash.parentNode) {
        flash.parentNode.removeChild(flash);
      }
    }, 1500);
  }

  /**
   * Create "RESISTANCE!" text for revolution event
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {HTMLElement} container - Parent container
   */
  createResistanceText(x, y, width, height, container) {
    const text = document.createElement("div");
    text.className = "freedom-text";
    text.textContent = "RESISTANCE!";
    text.style.position = "absolute";
    text.style.zIndex = FreedomManager.Z_INDEXES.TEXT;

    // Calculate center position
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Position text in the center
    const textWidth = 120; // Approximate width of the text
    text.style.left = `${centerX - textWidth / 2}px`;
    text.style.top = `${centerY - 16}px`;

    container.appendChild(text);

    // Remove text after animation
    setTimeout(() => {
      if (text.parentNode) {
        text.parentNode.removeChild(text);
      }
    }, 2000);
  }

  /**
   * Create confetti burst effect
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} width - Width
   * @param {number} height - Height
   * @param {HTMLElement} container - Parent container
   */
  createConfettiBurst(x, y, width, height, container) {
    const confettiCount = 80;

    // For each confetti piece, create it within the flag boundaries
    for (let i = 0; i < confettiCount; i++) {
      // Stagger creation slightly for better visual effect
      setTimeout(() => {
        // Generate a random position within the flag boundaries
        const padding = Math.min(5, Math.min(width, height) * 0.1);
        const startX = x + padding + Math.random() * (width - padding * 2);
        const startY = y + padding + Math.random() * (height - padding * 2);

        this.createConfettiPiece(startX, startY, container, i % 5 === 0);
      }, i * 10);
    }
  }

  /**
   * Create individual confetti piece
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {HTMLElement} container - Parent container
   * @param {boolean} isLarger - Whether this piece should be larger
   */
  createConfettiPiece(startX, startY, container, isLarger = false) {
    if (!container) return;

    // Create confetti element
    const confetti = document.createElement("div");
    confetti.className = "freedom-confetti";

    // Random confetti properties for more variety
    const shapes = ["circle", "square", "rectangle", "triangle"];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    confetti.classList.add(`confetti-${shape}`);

    // Size - occasionally make some pieces larger for variety
    const size = isLarger ? 8 + Math.random() * 8 : 4 + Math.random() * 6;
    confetti.style.width = `${size}px`;
    confetti.style.height = shape === "rectangle" ? `${size * 2}px` : `${size}px`;

    // Random vibrant color with high saturation
    const hue = Math.floor(Math.random() * 360);
    const lightness = 50 + Math.random() * 30; // Brighter colors
    confetti.style.backgroundColor = `hsl(${hue}, 100%, ${lightness}%)`;

    // Add a slight border to make it pop
    confetti.style.border = "0.5px solid rgba(0,0,0,0.3)";

    // Random rotation
    const rotation = Math.random() * 360;
    confetti.style.transform = `rotate(${rotation}deg)`;

    // Set the initial position
    confetti.style.position = "absolute";
    confetti.style.left = `${startX}px`;
    confetti.style.top = `${startY}px`;
    confetti.style.zIndex = FreedomManager.Z_INDEXES.CONFETTI;

    // Add to container
    container.appendChild(confetti);

    // Store confetti reference for potential cleanup
    const confettiRef = {
      element: confetti,
      startTime: performance.now(),
      animationCompleted: false,
    };
    this.activeAnimations.confetti.push(confettiRef);

    // Animation parameters
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 120;
    const destinationX = startX + Math.cos(angle) * distance;
    const destinationY = startY + Math.sin(angle) * distance;
    const duration = 1200 + Math.random() * 1500;

    // Control points for bezier curve
    const cp1x = startX + (destinationX - startX) * 0.3 + (Math.random() * 30 - 15);
    const cp1y = startY + (destinationY - startY) * 0.3 - Math.random() * 20;
    const cp2x = startX + (destinationX - startX) * 0.6 + (Math.random() * 30 - 15);
    const cp2y = destinationY - Math.random() * 50;

    const animateConfetti = (timestamp) => {
      if (confettiRef.animationCompleted) return;

      const elapsed = timestamp - confettiRef.startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        // Cubic bezier calculations for smooth movement
        const t = progress;
        const t_ = 1 - t;

        const currentX = Math.pow(t_, 3) * startX + 3 * Math.pow(t_, 2) * t * cp1x + 3 * t_ * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * destinationX;

        const currentY = Math.pow(t_, 3) * startY + 3 * Math.pow(t_, 2) * t * cp1y + 3 * t_ * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * destinationY;

        // Update position
        confetti.style.left = `${currentX}px`;
        confetti.style.top = `${currentY}px`;

        // Add spin animation
        const spin = rotation + progress * progress * 720 * (Math.random() > 0.5 ? 1 : -1);
        confetti.style.transform = `rotate(${spin}deg)`;

        // Fade out near the end
        if (progress > 0.7) {
          const fadeProgress = (progress - 0.7) / 0.3;
          const easeOutFade = 1 - Math.pow(fadeProgress, 2);
          confetti.style.opacity = easeOutFade.toString();
        }

        requestAnimationFrame(animateConfetti);
      } else {
        // Animation complete, clean up
        confettiRef.animationCompleted = true;

        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti);
        }

        // Remove from active animations
        const index = this.activeAnimations.confetti.indexOf(confettiRef);
        if (index !== -1) {
          this.activeAnimations.confetti.splice(index, 1);
        }
      }
    };

    requestAnimationFrame(animateConfetti);
  }

  /**
   * Create firework effect
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {HTMLElement} container - Parent container
   */
  createFireworkEffect(centerX, centerY, container) {
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      // Stagger creation slightly
      setTimeout(() => {
        this.createFireworkParticle(centerX, centerY, container);
      }, i * 10);
    }
  }

  /**
   * Create individual firework particle
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {HTMLElement} container - Parent container
   */
  createFireworkParticle(centerX, centerY, container) {
    if (!container) return;

    const particle = document.createElement("div");
    particle.className = "freedom-firework";

    // Random color for each firework particle
    const hue = Math.floor(Math.random() * 360);
    particle.style.background = `radial-gradient(circle, hsl(${hue}, 100%, 70%) 10%, transparent 70%)`;
    particle.style.boxShadow = `0 0 10px 5px hsla(${hue}, 100%, 70%, 0.8)`;

    // Random size
    const size = 5 + Math.random() * 15;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Initial position
    particle.style.position = "absolute";
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    particle.style.zIndex = FreedomManager.Z_INDEXES.FIREWORKS;

    // Add to container
    container.appendChild(particle);

    // Store reference for potential cleanup
    const fireworkRef = {
      element: particle,
      startTime: performance.now(),
      animationCompleted: false,
    };
    this.activeAnimations.fireworks.push(fireworkRef);

    // Random angle and distance
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 100;
    const destinationX = centerX + Math.cos(angle) * distance;
    const destinationY = centerY + Math.sin(angle) * distance;

    // Animation parameters
    const duration = 800 + Math.random() * 800;

    const animateParticle = (timestamp) => {
      if (fireworkRef.animationCompleted) return;

      const elapsed = timestamp - fireworkRef.startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        // Easing function for more natural movement
        const easedProgress = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Position calculation with gravity effect
        const currentX = centerX + (destinationX - centerX) * easedProgress;
        const currentY = centerY + (destinationY - centerY) * easedProgress + 50 * progress * progress;

        // Update position
        particle.style.left = `${currentX}px`;
        particle.style.top = `${currentY}px`;

        // Update opacity (fade out at the end)
        particle.style.opacity = (1 - progress * progress).toString();

        requestAnimationFrame(animateParticle);
      } else {
        // Animation complete, clean up
        fireworkRef.animationCompleted = true;

        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }

        // Remove from active animations
        const index = this.activeAnimations.fireworks.indexOf(fireworkRef);
        if (index !== -1) {
          this.activeAnimations.fireworks.splice(index, 1);
        }
      }
    };

    requestAnimationFrame(animateParticle);
  }

  triggerCountryResistance(countryId) {
    this.logger.info("freedom", `MAJOR RESISTANCE in ${countryId}!`);
  
    // Remove pulsing effect if it exists
    const countryElement = this.elements.countries[countryId];
    if (countryElement) {
      countryElement.classList.remove("resistance-possible");
    }
  
    // Reset claims to 0 (completely liberate the country)
    if (this.gameState.countries[countryId]) {
      this.gameState.countries[countryId].claims = 0;
    }
  
    // Update the flag overlay to be completely transparent
    const flagOverlay = document.getElementById(`${countryId}-flag-overlay`);
    if (flagOverlay) {
      this.logger.info("freedom", `Resetting flag opacity for ${countryId} to zero`);
      flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");
      flagOverlay.style.opacity = "0";
    }
  
    // Get the protestor wrapper/hitbox position for the celebration effects
    const protestorWrapper = this.countries[countryId].protestorWrapper;
    const hitbox = this.protestorHitboxManager ? 
      this.protestorHitboxManager.protestorHitboxes[countryId].element : null;
  
    if (protestorWrapper || hitbox) {
      // Create the freedom celebration effect at the protestor position
      this.createFreedomCelebrationAtHitbox(countryId, protestorWrapper || hitbox);
    } else {
      // Fallback to old method if no protestor elements found
      this.createFreedomCelebration(countryId);
    }
  
    // Hide protestors for this country
    this.hideProtestors(countryId);
  
    // Reset protestor state
    if (this.countries[countryId]) {
      this.countries[countryId].protestorsShown = false;
    }
  
    // Play sound effects in sequence with proper error handling
    this.playResistanceSounds(countryId);
  
    // Trigger animation via smack manager
    this.playResistanceAnimation(countryId);
  
    return true;
  }

  /**
 * Create freedom celebration at the protestor hitbox location
 * @param {string} countryId - Country identifier
 * @param {HTMLElement} element - Protestor wrapper or hitbox element
 */
createFreedomCelebrationAtHitbox(countryId, element) {
  // Get the game container
  const gameContainer = document.getElementById("game-container");
  if (!gameContainer) return;

  // Get the element's position and dimensions
  const rect = element.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();

  // Calculate positions relative to the game container
  const left = rect.left - containerRect.left;
  const top = rect.top - containerRect.top;
  const width = rect.width;
  const height = rect.height;

  // Screen shake effect if enabled
  if (this.config.effectsEnabled.screenShake) {
    this.addScreenShake(gameContainer);
  }

  // Create flash effect
  this.createFlashEffect(left, top, width, height, gameContainer);

  // Create "RESISTANCE!" text
  this.createResistanceText(left, top, width, height, gameContainer);

  // Create confetti if enabled
  if (this.config.effectsEnabled.confetti) {
    this.createConfettiBurst(left, top, width, height, gameContainer);
  }

  // Add some firework effects for more emphasis
  if (this.config.effectsEnabled.fireworks) {
    // Create fireworks at the center of the hitbox
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    this.createFireworkEffect(centerX, centerY, gameContainer);
  }
}

  /**
   * Play resistance sounds with proper error handling
   * @param {string} countryId - Country identifier
   */
  playResistanceSounds(countryId) {
    // Play main resistance sound
    this.playSound("resistance", countryId);

    // Play protest sound with slight delay
    setTimeout(() => {
      try {
        if (this.audioManager && typeof this.audioManager.playSimpleRandomProtest === "function") {
          // For Canada, handle east/west special case
          if (countryId === "canada") {
            // Randomly choose east or west Canada for protest sound
            const direction = Math.random() < 0.5 ? "eastCanada" : "westCanada";
            this.audioManager.playSimpleRandomProtest(direction);
          } else {
            this.audioManager.playSimpleRandomProtest(countryId);
          }
        } else if (this.audioManager) {
          // Fallback to regular sound method
          this.playSound("protest", countryId);
        }
      } catch (error) {
        this.logger.warn("freedom", `Error playing protest sound: ${error.message}`);
      }
    }, 300);
  }

  /**
   * Helper method for playing sounds with error handling
   * @param {string} type - Sound type
   * @param {string} id - Sound identifier
   * @param {number} [volume] - Optional volume level (0-1)
   */
  playSound(type, id, volume) {
    try {
      if (this.audioManager && typeof this.audioManager.playRandom === "function") {
        if (volume !== undefined) {
          this.audioManager.playRandom(type, id, volume);
        } else {
          this.audioManager.playRandom(type, id);
        }
      }
    } catch (error) {
      this.logger.warn("freedom", `Error playing sound ${type}/${id}: ${error.message}`);
    }
  }

  /**
   * Play resistance animation for a country
   * @param {string} countryId - Country identifier
   */
  playResistanceAnimation(countryId) {
    if (!this.smackManager) return;

    let smackAnimation = "";

    // Map country to correct animation
    if (countryId === "canada") {
      smackAnimation = Math.random() < 0.5 ? "smackEastCanada" : "smackWestCanada";
    } else if (countryId === "mexico") {
      smackAnimation = "smackMexico";
    } else if (countryId === "greenland") {
      smackAnimation = "smackGreenland";
    }

    if (smackAnimation) {
      this.logger.info("freedom", `Playing smack animation ${smackAnimation} for resistance effect`);
      this.smackManager.playSmackAnimation(smackAnimation, () => {
        this.logger.debug("freedom", "Resistance animation completed");
      });
    }
  }

  /**
   * Update flag opacity based on claims
   * @param {string} countryId - Country identifier
   */
  updateFlagOpacity(countryId) {
    const flagOverlay = document.getElementById(`${countryId}-flag-overlay`);
    if (!flagOverlay) {
      this.logger.error("freedom", `Flag overlay for ${countryId} not found!`);
      return;
    }

    const gameCountry = this.gameState.countries[countryId];
    if (!gameCountry) {
      this.logger.error("freedom", `Country ${countryId} not found in game state!`);
      return;
    }

    const claims = gameCountry.claims;

    this.logger.info("freedom", `Updating flag opacity for ${countryId} to claims level ${claims}`);

    // Remove previous opacity classes
    flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");

    // Add appropriate class based on claims
    if (claims === 0) {
      flagOverlay.style.opacity = "0"; // Use string "0" instead of number 0
    } else if (claims === 1) {
      flagOverlay.classList.add("opacity-33");
      flagOverlay.style.opacity = ""; // Clear direct opacity styling
    } else if (claims === 2) {
      flagOverlay.classList.add("opacity-66");
      flagOverlay.style.opacity = ""; // Clear direct opacity styling
    } else if (claims === 3) {
      flagOverlay.classList.add("opacity-100");
      flagOverlay.style.opacity = ""; // Clear direct opacity styling
    }
  }

  /**
   * Reset the freedom manager state
   */
  reset() {
    this.logger.info("freedom", "Resetting freedom system");

    // Clean up all effects and animations
    this.cleanupAllEffects();
    // resetProtestors();

    // Reset country states
    Object.keys(this.countries).forEach((countryId) => {
      const country = this.countries[countryId];
      country.annexTime = 0;
      country.resistanceAvailable = false;
      country.protestorsShown = false;

      // Reset visual indicators
      const countryElement = this.elements.countries[countryId];
      if (countryElement) {
        countryElement.classList.remove("resistance-possible");
      }
    });
  }

  /**
   * Clean up all effects and animations
   */
  cleanupAllEffects() {
    // Clean up all protestors
    this.cleanupAllProtestors();

    // Clean up confetti
    this.activeAnimations.confetti.forEach((confetti) => {
      if (confetti.element && confetti.element.parentNode) {
        confetti.element.parentNode.removeChild(confetti.element);
      }
      confetti.animationCompleted = true;
    });
    this.activeAnimations.confetti = [];

    // Clean up fireworks
    this.activeAnimations.fireworks.forEach((firework) => {
      if (firework.element && firework.element.parentNode) {
        firework.element.parentNode.removeChild(firework.element);
      }
      firework.animationCompleted = true;
    });
    this.activeAnimations.fireworks = [];

    // Remove any resistance indicators
    document.querySelectorAll(".resistance-possible").forEach((el) => {
      el.classList.remove("resistance-possible");
    });

    // Remove all freedom-related elements directly
    const freedomElements = document.querySelectorAll(".freedom-flash, .freedom-text, .freedom-confetti, .freedom-firework");
    freedomElements.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }

  /**
   * Debug method to set country claims
   * @param {string} countryId - Country identifier
   * @param {number} claimLevel - Number of claims to set
   * @returns {boolean} - Success status
   */
  setCountryClaims(countryId, claimLevel) {
    const gameCountry = this.gameState.countries[countryId];
    if (!gameCountry) {
      this.logger.error("freedom", `Country ${countryId} not found in gameState`);
      return false;
    }

    // Set the claim level (between 0 and maxClaims)
    const maxClaims = gameCountry.maxClaims;
    const newClaims = Math.max(0, Math.min(claimLevel, maxClaims));

    gameCountry.claims = newClaims;
    this.updateFlagOpacity(countryId);

    return true;
  }


  



/**
 * Method to initialize the Protestor Hitbox Manager
 */
initProtestorHitboxManager() {
  // Create the protestor hitbox manager if it doesn't exist
  if (!window.protestorHitboxManager) {
    window.protestorHitboxManager = new ProtestorHitboxManager();
    this.logger.info("freedom", "Created new Protestor Hitbox Manager");
  }
  
  this.protestorHitboxManager = window.protestorHitboxManager;
  this.logger.info("freedom", "Protestor Hitbox Manager initialized");
}


showProtestors(countryId) {
  // Clean up any existing protestors
  this.hideProtestors(countryId);
  
  this.protestorHitboxManager.selectNewRandomSpawnLocation(countryId);

  console.log(`Showing protestors for ${countryId}`);
  
  // Get the hitbox
  const hitbox = this.protestorHitboxManager.showHitbox(countryId, this);
  if (!hitbox) {
    console.error(`Failed to create protestor hitbox for ${countryId}`);
    return null;
  }
  
  // Get hitbox position and size directly from the style
  const left = parseInt(hitbox.style.left) || 0;
  const top = parseInt(hitbox.style.top) || 0;
  const width = parseInt(hitbox.style.width) || 100;
  const height = parseInt(hitbox.style.height) || 100;
  
  // Create a container for the protestor sprite
  const gameContainer = document.getElementById("game-container");
  
  // Clean up any existing elements first
  const existingElement = document.getElementById(`${countryId}-protestors-wrapper`);
  if (existingElement && existingElement.parentNode) {
    existingElement.parentNode.removeChild(existingElement);
  }
  
  // Create wrapper element
  const wrapper = document.createElement("div");
  wrapper.id = `${countryId}-protestors-wrapper`;
  wrapper.style.position = "absolute";
  wrapper.style.left = `${left}px`;
  wrapper.style.top = `${top}px`;
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.style.pointerEvents = "none"; // Hitbox handles clicks
  wrapper.style.zIndex = "10210"; // Just above the hitbox container
  
  // Create the protestors sprite element
  const protestors = document.createElement("div");
  protestors.id = `${countryId}-protestors`;
  protestors.style.width = "100%";
  protestors.style.height = "100%";
  protestors.style.backgroundImage = "url('images/protest.png')";
  protestors.style.backgroundSize = "400% 100%"; // For 4-frame sprite sheet
  protestors.style.backgroundPosition = "0% 0%";
  protestors.style.backgroundRepeat = "no-repeat";
  protestors.style.opacity = "1"; // Make fully visible immediately
  
  // Add protestors to wrapper
  wrapper.appendChild(protestors);
  
  // Add wrapper to game container
  gameContainer.appendChild(wrapper);
  
  // Store wrapper reference
  this.countries[countryId].protestorWrapper = wrapper;
  
  // Initialize click counter
  this.countries[countryId].clickCounter = 0;
  this.countries[countryId].currentScale = 1.0; // For scaling when clicked
  
  // Animation for sprite sheet
  let currentFrame = 0;
  
  const animationInterval = setInterval(() => {
    const protestorElement = document.getElementById(`${countryId}-protestors`);
    if (!protestorElement) {
      clearInterval(animationInterval);
      console.log(`Animation cleared for ${countryId} - element not found`);
      return;
    }
    
    // For 4-frame sprite sheet - cycle through frames
    currentFrame = (currentFrame + 1) % 4;
    const percentPosition = (currentFrame / 3) * 100;
    protestorElement.style.backgroundPosition = `${percentPosition}% 0%`;
    
    console.log(`Updated ${countryId} protestor animation to frame ${currentFrame}`);
  }, 300);
  
  // Store the interval for cleanup
  this.activeAnimations.protestors[countryId] = animationInterval;
  
  // Set timeout for protestors to disappear if not clicked
  this.countries[countryId].disappearTimeout = setTimeout(() => {
    this.shrinkAndHideProtestors(countryId);
  }, 7000); // 7 seconds timeout
  
  console.log(`Created protestors for ${countryId} at (${left}, ${top})`);
  
  return wrapper;
}


handleProtestorClick(countryId) {
  const country = this.countries[countryId];
  if (!country) {
    this.logger.error("freedom", `Click handler called but country ${countryId} not found in data`);
    return;
  }
  
  // Log the click event
  this.logger.info("freedom", `[CLICK EVENT] Protestor clicked in ${countryId}`);
  
  // Clear any existing timeout
  if (country.disappearTimeout) {
    clearTimeout(country.disappearTimeout);
  }
  
  // Increment click counter
  const oldClickCount = country.clickCounter || 0;
  country.clickCounter = oldClickCount + 1;
  
  // Get the protestor wrapper
  const protestorWrapper = country.protestorWrapper || document.getElementById(`${countryId}-protestors-wrapper`);
  if (!protestorWrapper) {
    this.logger.error("freedom", `Protestor wrapper element not found for ${countryId}`);
    return;
  }
  
  // Get the protestor sprite element
  const protestorSprite = document.getElementById(`${countryId}-protestors`);
  if (!protestorSprite) {
    this.logger.error("freedom", `Protestor sprite element not found for ${countryId}`);
    return;
  }
  
  // Play click sound
  this.playSound("protest", countryId, 0.5);
  
  if (country.clickCounter >= 3) {
    // Trigger liberation after 3 clicks
    this.triggerCountryResistance(countryId);
    country.clickCounter = 0;
  } else if (country.clickCounter === 2) {
    // Change sprite to heart version after second click
    protestorSprite.style.backgroundImage = "url('images/protestHeart.png')";
    this.logger.info("freedom", `[SPRITE CHANGE] Changed protestor sprite to protestHeart.png for ${countryId}`);
    
    // Store the scale factor
    const oldScale = country.currentScale || 1;
    country.currentScale = oldScale * 1.25;
    
    // Apply the scale using transform
    protestorWrapper.style.transition = "transform 0.3s ease"; // Add smooth transition
    protestorWrapper.style.transform = `scale(${country.currentScale})`;
    
    // Set new timeout
    country.disappearTimeout = setTimeout(() => {
      this.shrinkAndHideProtestors(countryId);
    }, 7000);
  } else {
    // First click behavior (original sprite)
    
    // Store the scale factor
    const oldScale = country.currentScale || 1;
    country.currentScale = oldScale * 1.25;
    
    // Apply the scale using transform
    protestorWrapper.style.transition = "transform 0.3s ease"; // Add smooth transition
    protestorWrapper.style.transform = `scale(${country.currentScale})`;
    
    // Set new timeout
    country.disappearTimeout = setTimeout(() => {
      this.shrinkAndHideProtestors(countryId);
    }, 7000);
  }
}

hideProtestors(countryId) {
  this.logger.info("freedom", `[HIDE] Hiding protestors for ${countryId}`);
  
  // Clear animation interval
  if (this.activeAnimations.protestors[countryId]) {
    clearInterval(this.activeAnimations.protestors[countryId]);
    delete this.activeAnimations.protestors[countryId];
    this.logger.debug("freedom", `[CLEANUP] Cleared animation interval for ${countryId}`);
  }
  
  // Clear disappear timeout
  if (this.countries[countryId] && this.countries[countryId].disappearTimeout) {
    clearTimeout(this.countries[countryId].disappearTimeout);
    this.countries[countryId].disappearTimeout = null;
    this.logger.debug("freedom", `[CLEANUP] Cleared disappear timeout for ${countryId}`);
  }
  
  // Hide the hitbox using ProtestorHitboxManager
  if (this.protestorHitboxManager) {
    this.protestorHitboxManager.hideHitbox(countryId);
  }
  
  // Remove the protestor wrapper element if it exists
  const protestorWrapper = this.countries[countryId]?.protestorWrapper || 
                          document.getElementById(`${countryId}-protestors-wrapper`);
  if (protestorWrapper && protestorWrapper.parentNode) {
    protestorWrapper.parentNode.removeChild(protestorWrapper);
    this.logger.debug("freedom", `[CLEANUP] Removed protestor wrapper element for ${countryId}`);
  }
  
  // Clear the wrapper reference
  if (this.countries[countryId]) {
    this.countries[countryId].protestorWrapper = null;
    this.countries[countryId].protestorsShown = false;
    this.logger.debug("freedom", `[STATE] Updated protestorsShown to false for ${countryId}`);
  }
}

/**
 * Modified cleanupAllProtestors to work with ProtestorHitboxManager
 * This replaces the existing cleanupAllProtestors method in FreedomManager
 */
cleanupAllProtestors() {
  // Clear all animation intervals
  Object.keys(this.activeAnimations.protestors).forEach(countryId => {
    if (this.activeAnimations.protestors[countryId]) {
      clearInterval(this.activeAnimations.protestors[countryId]);
    }
  });
  this.activeAnimations.protestors = {};
  
  // Clean up all hitboxes if we have a hitbox manager
  if (this.protestorHitboxManager) {
    this.protestorHitboxManager.cleanupAll();
  }
  
  // Update country states
  Object.keys(this.countries).forEach(countryId => {
    if (this.countries[countryId]) {
      this.countries[countryId].protestorsShown = false;
      if (this.countries[countryId].disappearTimeout) {
        clearTimeout(this.countries[countryId].disappearTimeout);
        this.countries[countryId].disappearTimeout = null;
      }
    }
  });
  
  this.logger.info("freedom", "All protestors cleaned up");
}

resetProtestors() {
  // Clean up all protestors
  this.cleanupAllProtestors();
  
  // Reset the hitbox manager if it exists
  if (this.protestorHitboxManager) {
    this.protestorHitboxManager.cleanupAll();
  }
}











  /**
   * Debug method to annex a country
   * @param {string} countryId - Country identifier
   * @returns {boolean} - Success status
   */
  annexCountry(countryId) {
    const gameCountry = this.gameState.countries[countryId];
    if (!gameCountry) {
      this.logger.error("freedom", `Country ${countryId} not found in gameState`);
      return false;
    }

    // Set claims to max
    gameCountry.claims = gameCountry.maxClaims;

    // Update the flag overlay
    this.updateFlagOpacity(countryId);

    return true;
  }

  /**
   * Debug method to make a country ready for resistance
   * @param {string} countryId - Country identifier
   * @returns {boolean} - Success status
   */
  makeResistanceReady(countryId) {
    const country = this.countries[countryId];
    if (!country) {
      this.logger.error("freedom", `Country ${countryId} not found in countries`);
      return false;
    }

    // First make sure the country is fully annexed
    this.annexCountry(countryId);

    // Set the annexation timer to the threshold
    country.annexTime = this.config.fullAnnexationTime;
    country.resistanceAvailable = true;

    // Show the resistance indicator
    this.showResistancePossibleIndicator(countryId);

    return true;
  }
  

  /**
   * Debug method to trigger protestors
   * @param {string} countryId - Country identifier
   * @returns {boolean} - Success status
   */
  debugShowProtestors(countryId) {
    const gameCountry = this.gameState.countries[countryId];
    if (!gameCountry) {
      this.logger.error("freedom", `Country ${countryId} not found for debug protestors`);
      return false;
    }

    const wrapper = this.showProtestors(countryId);
    if (this.countries[countryId]) {
      this.countries[countryId].protestorsShown = true;
    }

    return !!wrapper;
  }

  /**
   * Immediately trigger resistance for a country (for debug/testing)
   * @param {string} countryId - Country identifier
   * @returns {boolean} - Success status
   */
  debugTriggerResistance(countryId) {
    if (!this.gameState.countries[countryId]) {
      this.logger.error("freedom", `Country ${countryId} not found for debug resistance`);
      return false;
    }

    return this.triggerCountryResistance(countryId);
  }

  // Add to FreedomManager class
// In FreedomManager, enhance the destroy() method
destroy() {
  // Clean up timers
  Object.keys(this.countries).forEach(countryId => {
    if (this.countries[countryId].disappearTimeout) {
      clearTimeout(this.countries[countryId].disappearTimeout);
      this.countries[countryId].disappearTimeout = null;
    }
  });
  
  // Clean up all visual effects and animations
  this.cleanupAllEffects();
  
  // Enhanced protestor cleanup
  this.cleanupAllProtestors();
  
  // Force removal of any remaining protestor elements (belt and suspenders approach)
  document.querySelectorAll('[id$="-protestors-wrapper"]').forEach(el => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
  
  document.querySelectorAll('[id$="-protestors"]').forEach(el => {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  });
  
  // Clean up hitbox manager if it exists
  if (this.protestorHitboxManager) {
    this.protestorHitboxManager.cleanupAll();
  }
  
  // Reset internal state
  Object.keys(this.countries).forEach(countryId => {
    this.countries[countryId].annexTime = 0;
    this.countries[countryId].resistanceAvailable = false;
    this.countries[countryId].protestorsShown = false;
    this.countries[countryId].clickCounter = 0;
  });
  
  this.logger.info("freedom", "Freedom Manager destroyed");
}
}



// Export the FreedomManager globally
window.FreedomManager = FreedomManager;