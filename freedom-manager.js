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
    console.log("[DEBUG] FreedomManager constructor called");
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

  update(deltaTime) {
    if (!this.gameState.isPlaying || this.gameState.isPaused) return;
  
    // Convert deltaTime from ms to seconds for chance calculation
    const deltaSeconds = deltaTime / 1000;
  
    // Process each country
    Object.keys(this.countries).forEach((countryId) => {
      const country = this.countries[countryId];
      const gameCountry = this.gameState.countries[countryId];
  
      if (!gameCountry) return;
  
      // FIXED: Only update annexation time and show protestors for FULLY annexed countries
      if (gameCountry.claims >= gameCountry.maxClaims) {
        // Update annexation timer
        country.annexTime += deltaTime;
  
        // Original threshold for showing protestors
        const protestorThreshold = this.config.fullAnnexationTime * this.config.protestorShowDelay;
        
        if (country.annexTime >= protestorThreshold && !country.protestorsShown) {
          this.logger.info("freedom", `[THRESHOLD] ${countryId} reached protestor show threshold at ${country.annexTime}ms`);
          const result = this.showProtestors(countryId);
          country.protestorsShown = !!result;
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
  createResistanceText(x, y, width, height, container) {
    const text = document.createElement("div");
    text.className = "freedom-text";
    text.textContent = ".";
    text.style.position = "absolute";
    text.style.zIndex = FreedomManager.Z_INDEXES.TEXT;
    
    // MUCH larger text
    text.style.fontSize = "1rem";
    
    // Thicker outline
    text.style.webkitTextStroke = ".5px black";
    text.style.textStroke = ".5px black";
    
    // More vibrant color
    const hue = Math.floor(Math.random() * 60); // Randomize between red-yellow
    text.style.color = `hsl(${hue}, 100%, 50%)`;
    // text.style.fontFamily = "'Rock Salt', cursive, sans-serif";
    text.style.fontWeight = "900";
    
    // Add more dramatic text shadow
    // text.style.textShadow = "4px 4px 0 #000";
    
    // Calculate center position
    const centerX = x + width / 2;
    const centerY = y + height / 2;
  
    // Position to allow for animation
    const textWidth = 300; // Generous width estimate
    text.style.width = `${textWidth}px`;
    text.style.left = `${centerX - textWidth/2}px`;
    text.style.top = `${centerY - 30}px`;
    text.style.textAlign = "center";
    
    container.appendChild(text);
    
    // Random starting rotation for more dynamism
    const startRotation = -10 + Math.random() * 20;
    
    // Create unique animation ID to avoid conflicts
    const animationId = `resistance-text-${Date.now()}`;
    
    // Create custom keyframes for this specific instance
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ${animationId} {
        0% {
          transform: scale(0.1) rotate(${startRotation - 15}deg);
          opacity: 0;
        }
        15% {
          transform: scale(1.6) rotate(${startRotation + 10}deg);
          opacity: 1;
        }
        30% {
          transform: scale(1.1) rotate(${startRotation - 8}deg);
          opacity: 1;
        }
        45% {
          transform: scale(1.4) rotate(${startRotation + 6}deg);
          opacity: 1;
        }
        65% {
          transform: scale(1.2) rotate(${startRotation - 4}deg);
          opacity: 1;
        }
        80% {
          transform: scale(1.3) rotate(${startRotation + 2}deg);
          opacity: 0.9;
        }
        100% {
          transform: scale(2.5) rotate(${startRotation}deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Apply the animation
    text.style.animation = `${animationId} 2.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards`;
  
    // Remove text and style after animation
    setTimeout(() => {
      if (text.parentNode) {
        text.parentNode.removeChild(text);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 2500);
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

  



// Add this method to the FreedomManager class
createAdditionalProtestors(countryId, clickCount) {
  const wrapper = document.getElementById(`${countryId}-protestors-wrapper`);
  if (!wrapper) return;
  
  // Remove any previous additional protestors
  document.querySelectorAll(`.${countryId}-additional-protestor`).forEach(el => {
    if (el.parentNode) el.parentNode.removeChild(el);
  });
  
  // Only add additional protestors after first click
  if (clickCount < 1) return;
  
  // Get the base protestor dimensions and position
  const baseRect = wrapper.getBoundingClientRect();
  const gameContainer = document.getElementById("game-container");
  const containerRect = gameContainer.getBoundingClientRect();
  
  // Calculate relative position to game container
  const left = parseInt(wrapper.style.left) || 0;
  const top = parseInt(wrapper.style.top) || 0;
  const width = parseInt(wrapper.style.width) || 100;
  const height = parseInt(wrapper.style.height) || 100;
  
  // Create 1-2 additional protestors based on click count
  const count = Math.min(clickCount, 2);
  
  for (let i = 0; i < count; i++) {
    // Create a new protestor element
    const additionalProtestor = document.createElement("div");
    additionalProtestor.className = `${countryId}-additional-protestor`;
    additionalProtestor.style.position = "absolute";
    
    // Slightly different position offsets for each protestor
    // These offsets create a small group effect
    const offsetX = -20 + (i * 30);  // Spreading out horizontally  
    const offsetY = -10 - (i * 5);   // Slightly higher than the original
    
    additionalProtestor.style.left = `${left + offsetX}px`;
    additionalProtestor.style.top = `${top + offsetY}px`;
    additionalProtestor.style.width = `${width * 0.8}px`;     // Slightly smaller
    additionalProtestor.style.height = `${height * 0.8}px`;   // Slightly smaller
    additionalProtestor.style.zIndex = "10209";  // Below the main protestor
    additionalProtestor.style.backgroundImage = "url('images/protest.png')";
    additionalProtestor.style.backgroundSize = "400% 100%";
    additionalProtestor.style.backgroundPosition = "0% 0%";
    additionalProtestor.style.backgroundRepeat = "no-repeat";
    additionalProtestor.style.pointerEvents = "none";
    additionalProtestor.style.opacity = "0.9";
    additionalProtestor.style.transformOrigin = "bottom center";
    
    // Add to game container
    gameContainer.appendChild(additionalProtestor);
    
    // Start animation
    let currentFrame = i % 4;  // Start on different frames for variety
    
    const animationInterval = setInterval(() => {
      currentFrame = (currentFrame + 1) % 4;
      const percentPosition = (currentFrame / 3) * 100;
      additionalProtestor.style.backgroundPosition = `${percentPosition}% 0%`;
    }, 350); // Slightly different timing from main protestor
    
    // Store interval for cleanup
    this.activeAnimations.protestors[`${countryId}-additional-${i}`] = animationInterval;
  }
}









  createFireworkEffect(centerX, centerY, container) {
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      // Stagger creation slightly
      setTimeout(() => {
        this.createFireworkParticle(centerX, centerY, container);
      }, i * 10);
    }
  }



  triggerCountryResistance(countryId) {
    this.logger.info("freedom", `MAJOR RESISTANCE in ${countryId}!`);
    
    // Stop any ongoing protestor sounds first
    if (this.audioManager && typeof this.audioManager.stopProtestorSounds === "function") {
      if (countryId === "canada") {
        this.audioManager.stopProtestorSounds("eastCanada");
        this.audioManager.stopProtestorSounds("westCanada");
      } else {
        this.audioManager.stopProtestorSounds(countryId);
      }
    }

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

  createConfettiPiece(startX, startY, container, isLarger = false) {
    if (!container) return;
  
    // Create confetti element
    const confetti = document.createElement("div");
    confetti.className = "freedom-confetti";
  
    // Performance optimization: use CSS properties that are cheap to animate
    confetti.style.willChange = "transform, opacity";
    
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
  
    // Add black border for cartoon look
    confetti.style.border = "1px solid black";
  
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
    
    // Initial rotation
    const rotation = Math.random() * 360;
    confetti.style.transform = `rotate(${rotation}deg)`;

    
    // Use simpler animation path on mobile
    const simplifiedPath = window.DeviceUtils.isMobileDevice;
  
    const animateConfetti = (timestamp) => {
      if (confettiRef.animationCompleted) return;
  
      const elapsed = timestamp - confettiRef.startTime;
      const progress = Math.min(elapsed / duration, 1);
  
      if (progress < 1) {
        let currentX, currentY;
        
        if (simplifiedPath) {
          // Linear path for mobile (more efficient)
          currentX = startX + (destinationX - startX) * progress;
          currentY = startY + (destinationY - startY) * progress;
        } else {
          // Cubic bezier calculations for smooth movement on desktop
          const t = progress;
          const t_ = 1 - t;
  
          currentX = Math.pow(t_, 3) * startX + 3 * Math.pow(t_, 2) * t * cp1x + 3 * t_ * Math.pow(t, 2) * cp2x + Math.pow(t, 3) * destinationX;
          currentY = Math.pow(t_, 3) * startY + 3 * Math.pow(t_, 2) * t * cp1y + 3 * t_ * Math.pow(t, 2) * cp2y + Math.pow(t, 3) * destinationY;
        }
  
        // Update position
        confetti.style.left = `${currentX}px`;
        confetti.style.top = `${currentY}px`;
  
        // Simplified rotation on mobile
        if (simplifiedPath) {
          const spin = rotation + progress * 360 * (Math.random() > 0.5 ? 1 : -1);
          confetti.style.transform = `rotate(${spin}deg)`;
        } else {
          // Add spin animation
          const spin = rotation + progress * progress * 720 * (Math.random() > 0.5 ? 1 : -1);
          confetti.style.transform = `rotate(${spin}deg)`;
  
          // Instead of fading out, shrink at the end
          if (progress > 0.7) {
            const scale = 1 - ((progress - 0.7) / 0.3) * 0.7; // Don't scale all the way to 0
            confetti.style.transform = `rotate(${spin}deg) scale(${scale})`;
          }
        }
  
        // Optimize animation frame rate on mobile
        if (simplifiedPath && progress % 0.1 !== 0) {
          // Skip some frames on mobile
          setTimeout(() => requestAnimationFrame(animateConfetti), 16);
        } else {
          requestAnimationFrame(animateConfetti);
        }
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
  
  createFireworkParticle(centerX, centerY, container) {
    if (!container) return;
  
    const particle = document.createElement("div");
    particle.className = "freedom-firework";
  
    // Focus on streamers and simple shapes
    const particleTypes = ["spark", "circle", "spark"]; // More sparks
    const particleType = particleTypes[Math.floor(Math.random() * particleTypes.length)];
  
    // Vibrant colors
    const hue = Math.floor(Math.random() * 360);
    
    // Particle styling
    if (particleType === "circle") {
      particle.style.backgroundColor = `hsl(${hue}, 100%, 60%)`;
      particle.style.borderRadius = "50%";
    } 
    else if (particleType === "spark") {
      // Elongated spark - streamer-like
      const sparkAngle = Math.random() * 360;
      particle.style.backgroundColor = `hsl(${hue}, 100%, 65%)`;
      particle.style.borderRadius = "40% 40% 5% 5%";
      particle.style.transform = `rotate(${sparkAngle}deg)`;
    }
  
    // Always add black border
    particle.style.border = "2px solid black";
    
    // Larger size
    const size = particleType === "spark" ? 6 + Math.random() * 12 : 10 + Math.random() * 15;
    
    particle.style.width = `${size}px`;
    if (particleType === "spark") {
      // Sparks are elongated like streamers
      particle.style.height = `${size * (3 + Math.random())}px`;
    } else {
      particle.style.height = `${size}px`;
    }
  
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
  
    // MUCH wider spread
    const angle = Math.random() * Math.PI * 2;
    const distance = 80 + Math.random() * 180; // Wider distribution
    const destinationX = centerX + Math.cos(angle) * distance;
    const destinationY = centerY + Math.sin(angle) * distance;
  
    // Longer duration for slower movement
    const duration = 1500 + Math.random() * 1000;
    
    // Use gentle arc paths for more natural movement
    const useArc = true;
  
    const animateParticle = (timestamp) => {
      if (fireworkRef.animationCompleted) return;
  
      const elapsed = timestamp - fireworkRef.startTime;
      const progress = Math.min(elapsed / duration, 1);
  
      if (progress < 1) {
        let currentX, currentY;
        
        if (useArc) {
          // Arc path with gentle gravity
          const easedProgress = progress;
          currentX = centerX + (destinationX - centerX) * easedProgress;
          
          // Arc effect - gentler, wider arc
          const verticalOffset = Math.sin(progress * Math.PI) * 60; // Higher arc
          const gravity = Math.pow(progress, 2) * 40; // Very gentle gravity
          currentY = centerY + (destinationY - centerY) * easedProgress - verticalOffset + gravity;
        } else {
          // Straight path (not really used now)
          const easedProgress = Math.pow(progress, 0.8);
          currentX = centerX + (destinationX - centerX) * easedProgress;
          currentY = centerY + (destinationY - centerY) * easedProgress;
        }
  
        // Update position
        particle.style.left = `${currentX}px`;
        particle.style.top = `${currentY}px`;
  
        // Very minimal rotation - mostly just follow the arc path
        if (particleType === "spark") {
          // Calculate angle based on movement direction
          const dx = currentX - parseFloat(particle.style.left || centerX);
          const dy = currentY - parseFloat(particle.style.top || centerY);
          let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
          
          // Add very slight wobble
          angle += Math.sin(progress * Math.PI * 2) * 5;
          
          particle.style.transform = `rotate(${angle}deg)`;
        } else {
          // Almost no rotation for circles
          const rotation = progress * 30 * (Math.random() > 0.5 ? 1 : -1);
          particle.style.transform = `rotate(${rotation}deg)`;
        }
        
        // Simple exit - just fade
        if (progress > 0.8) {
          const exitScale = 1 - ((progress - 0.8) / 0.2);
          particle.style.opacity = exitScale.toString();
        }
  
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
  
  // Function to create the celebration with fewer particles
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
  
    // Create confetti if enabled - FEWER BUT BIGGER CONFETTI
    if (this.config.effectsEnabled.confetti) {
      // Reduce confetti count significantly
      const confettiCount = 60; // Fewer, more impactful pieces
      
      // Create confetti from multiple points with WIDER spread
      const points = [
        { x: flagLeft + flagWidth * 0.2, y: flagTop + flagHeight * 0.3 },
        { x: flagLeft + flagWidth * 0.5, y: flagTop + flagHeight * 0.5 },
        { x: flagLeft + flagWidth * 0.8, y: flagTop + flagHeight * 0.4 }
      ];
      
      // Distribute confetti across the points with longer delay
      for (let i = 0; i < confettiCount; i++) {
        // Stagger creation for better visual effect
        setTimeout(() => {
          // Choose a random point from our defined points
          const point = points[Math.floor(Math.random() * points.length)];
          
          // Add more random variation around the point for wider spread
          const startX = point.x + (Math.random() * 50 - 25);
          const startY = point.y + (Math.random() * 50 - 25);
  
          this.createConfettiPiece(startX, startY, gameContainer, i % 2 === 0); // More large pieces
        }, i * 15); // Slightly slower creation rate
      }
    }
    
    // Add firework bursts - FEWER BUT MORE SPREAD OUT
    if (this.config.effectsEnabled.fireworks) {
      // Just a few strategic burst locations with wide spread
      const burstLocations = [
        { x: flagLeft + flagWidth * 0.3, y: flagTop + flagHeight * 0.3, delay: 0 },
        { x: flagLeft + flagWidth * 0.7, y: flagTop + flagHeight * 0.4, delay: 300 },
        { x: flagLeft + flagWidth * 0.5, y: flagTop + flagHeight * 0.2, delay: 600 }
      ];
      
      burstLocations.forEach(burst => {
        setTimeout(() => {
          // Fewer particles per burst, but each one more impactful
          const particleCount = 15 + Math.floor(Math.random() * 10);
          for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
              this.createFireworkParticle(burst.x, burst.y, gameContainer);
            }, i * 15); // Slower creation for less overwhelming
          }
        }, burst.delay);
      });
    }
  }
  
  // And the hitbox version with same parameters
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
  
    // Create confetti if enabled - FEWER BUT BIGGER CONFETTI
    if (this.config.effectsEnabled.confetti) {
      // Reduce confetti count
      const confettiCount = 20; // Fewer, more impactful pieces
      
      // Create confetti from multiple points with WIDER spread
      const points = [
        { x: left + width * 0.2, y: top + height * 0.3 },
        { x: left + width * 0.5, y: top + height * 0.5 },
        { x: left + width * 0.8, y: top + height * 0.4 }
      ];
      
      // Distribute confetti across the points
      for (let i = 0; i < confettiCount; i++) {
        // Stagger creation for better visual effect
        setTimeout(() => {
          // Choose a random point from our defined points
          const point = points[Math.floor(Math.random() * points.length)];
          
          // Add more random variation around the point for wider spread
          const startX = point.x + (Math.random() * 50 - 25);
          const startY = point.y + (Math.random() * 50 - 25);
  
          this.createConfettiPiece(startX, startY, gameContainer, i % 2 === 0); // More large pieces
        }, i * 15); // Slightly slower creation rate
      }
    }
    
    // Add firework bursts - FEWER BUT MORE SPREAD OUT
    if (this.config.effectsEnabled.fireworks) {
      // Just a few strategic burst locations with wide spread
      const burstLocations = [
        { x: left + width * 0.3, y: top + height * 0.3, delay: 0 },
        { x: left + width * 0.7, y: top + height * 0.4, delay: 300 },
        { x: left + width * 0.5, y: top + height * 0.2, delay: 600 }
      ];
      
      burstLocations.forEach(burst => {
        setTimeout(() => {
          // Fewer particles per burst, but each one more impactful
          const particleCount = 15 + Math.floor(Math.random() * 10);
          for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
              this.createFireworkParticle(burst.x, burst.y, gameContainer);
            }, i * 15); // Slower creation for less overwhelming
          }
        }, burst.delay);
      });
    }
  }


  playResistanceSounds(countryId) {
   // Stop any ongoing sounds first to avoid overlapping
  if (this.audioManager) {
    if (typeof this.audioManager.stopProtestorSounds === "function") {
      this.audioManager.stopProtestorSounds(countryId);
    }
  }

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
    console.log("[DEBUG] FreedomManager.reset() called");

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

  playProtestSound(countryId, volume = 0.5) {
    try {
      // Determine which country sound to use
      let soundCountry = countryId;
      if (countryId === "canada") {
        // Randomly choose east or west Canada
        soundCountry = Math.random() < 0.5 ? "eastCanada" : "westCanada";
        console.log(`Selected ${soundCountry} for canada protest sound`);
      }
      
      // Use the protestor-specific sounds in AudioManager
      if (this.audioManager && typeof this.audioManager.playProtestorSound === "function") {
        console.log(`Trying to play protestor sound for ${soundCountry} at volume ${volume}`);
        this.audioManager.playProtestorSound(soundCountry, 0, volume);
      } else {
        // Fallback to regular sound method
        this.playSound("defense", "protest", soundCountry, volume);
      }
    } catch (error) {
      this.logger.warn("freedom", `Error playing protest sound: ${error.message}`);
    }
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


  



  initProtestorHitboxManager() {
    console.log("[FREEDOM DEBUG] Initializing protestor hitbox manager connection");
    
    // Create the protestor hitbox manager if it doesn't exist
    if (!window.protestorHitboxManager) {
      console.log("[FREEDOM DEBUG] Creating new ProtestorHitboxManager");
      window.protestorHitboxManager = new ProtestorHitboxManager();
      this.logger.info("freedom", "Created new Protestor Hitbox Manager");
    } else {
      console.log("[FREEDOM DEBUG] Using existing ProtestorHitboxManager");
    }
    
    this.protestorHitboxManager = window.protestorHitboxManager;
    console.log("[FREEDOM DEBUG] ProtestorHitboxManager reference established:", !!this.protestorHitboxManager);
    this.logger.info("freedom", "Protestor Hitbox Manager initialized");
  }

// Modified handleProtestorClick method for more protestors with specific positioning
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
  
  // Get a fresh reference to the protestor wrapper and sprite elements
  const protestorWrapper = document.getElementById(`${countryId}-protestors-wrapper`);
  const protestorSprite = document.getElementById(`${countryId}-protestors`);
  
  if (!protestorWrapper || !protestorSprite) {
    this.logger.error("freedom", `Protestor elements not found for ${countryId}`);
    return;
  }
  
  // Store the wrapper reference in country data
  country.protestorWrapper = protestorWrapper;
  
  // Calculate volume based on click count
  const volume = Math.min(0.5 + (country.clickCounter * 0.2), 1.0);
  
  // Play click sound with increasing volume
  this.playProtestSound(countryId, volume);
  
  // Create additional protestors
  const gameContainer = document.getElementById("game-container");
  if (gameContainer && protestorWrapper) {
    // Clean up any previous additional protestors
    document.querySelectorAll(`.additional-protestor-${countryId}`).forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // Clean up previous animation intervals
    if (this.activeAnimations.extraProtestors) {
      for (let key in this.activeAnimations.extraProtestors) {
        if (key.startsWith(`${countryId}-`)) {
          clearInterval(this.activeAnimations.extraProtestors[key]);
          delete this.activeAnimations.extraProtestors[key];
        }
      }
    }
    
    // Calculate position relative to the main protestor
    const rect = protestorWrapper.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    const left = rect.left - containerRect.left;
    const top = rect.top - containerRect.top;
    const width = rect.width;
    const height = rect.height;
    
    if (country.clickCounter === 1) {
      // First click: Add 2 protestors widely spread from the original
      const positions = [
        { offsetX: -60, offsetY: -25, scale: 0.8 },  // Far left
        { offsetX: 60, offsetY: -25, scale: 0.8 }    // Far right
      ];
      
      createAdditionalProtestors(positions);
    } 
    else if (country.clickCounter === 2) {
      // Second click: Add 4 protestors in a very clear pattern
      const positions = [
        { offsetX: -70, offsetY: -30, scale: 0.8 },   // Far upper left
        { offsetX: 70, offsetY: -30, scale: 0.8 },    // Far upper right
        { offsetX: -40, offsetY: 25, scale: 0.75 },   // Lower left
        { offsetX: 40, offsetY: 25, scale: 0.75 }     // Lower right
      ];
      
      createAdditionalProtestors(positions);
    }
    

    // Helper function to create the additional protestors
    function createAdditionalProtestors(positions) {
      positions.forEach((pos, i) => {
        // Create the protestor element
        const additionalProtestor = document.createElement("div");
        additionalProtestor.id = `${countryId}-additional-protestor-${i}`;
        additionalProtestor.className = `additional-protestor-${countryId}`;
        additionalProtestor.style.position = "absolute";
        
        // Position with specified offsets
        additionalProtestor.style.left = `${left + pos.offsetX}px`;
        additionalProtestor.style.top = `${top + pos.offsetY}px`;
        additionalProtestor.style.width = `${width * pos.scale}px`;
        additionalProtestor.style.height = `${height * pos.scale}px`;
        additionalProtestor.style.backgroundImage = "url('images/protest.png')";
        additionalProtestor.style.backgroundSize = "400% 100%";
        additionalProtestor.style.backgroundPosition = `${(i % 4) * 33}% 0%`;
        additionalProtestor.style.backgroundRepeat = "no-repeat";
        additionalProtestor.style.zIndex = "10209";
        additionalProtestor.style.pointerEvents = "none";
        
        // Add to game container
        gameContainer.appendChild(additionalProtestor);
        
        // Set up animation
        let frame = i % 4;
        const interval = setInterval(() => {
          frame = (frame + 1) % 4;
          const percentPosition = (frame / 3) * 100;
          
          // Get a fresh reference to the specific protestor
          const el = document.getElementById(`${countryId}-additional-protestor-${i}`);
          if (el) {
            el.style.backgroundPosition = `${percentPosition}% 0%`;
          } else {
            clearInterval(interval);
          }
        }, 300 + (i * 40)); // Slight timing variation
        
        // Store interval for cleanup
        if (!this.activeAnimations.extraProtestors) {
          this.activeAnimations.extraProtestors = {};
        }
        this.activeAnimations.extraProtestors[`${countryId}-${i}`] = interval;
      });
    }
  }
  
  // CRITICAL CHANGE: Stop all CSS animations and transitions before applying transform
  protestorWrapper.style.animation = "none";
  protestorWrapper.style.transition = "none";
  void protestorWrapper.offsetWidth; // Force browser reflow to apply style changes
  
  // Get original position values
  const originalPosition = {
    left: protestorWrapper.style.left,
    top: protestorWrapper.style.top,
    width: protestorWrapper.style.width,
    height: protestorWrapper.style.height
  };
  
  // KEY FIX: Set transform-origin to bottom center so it grows upward
  protestorWrapper.style.transformOrigin = "bottom center";
  
  if (country.clickCounter >= 3) {
    // Trigger liberation after 3 clicks
    this.triggerCountryResistance(countryId);
    country.clickCounter = 0;
  } else if (country.clickCounter === 2) {
    // Change sprite to heart version on second click
    protestorSprite.style.backgroundImage = "url('images/protestHeart.png')";
    this.logger.info("freedom", `[SPRITE CHANGE] Changed protestor sprite to protestHeart.png for ${countryId}`);
    
    // Apply dramatic scaling (1.75x) with bounce effect
    protestorWrapper.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
    protestorWrapper.style.transform = "scale(1.75)";
    
    // Set timeout for protestors to disappear if not clicked
    country.disappearTimeout = setTimeout(() => {
      this.shrinkAndHideProtestors(countryId);
    }, 7000);
  } else {
    // First click behavior
    // Apply moderate scaling (1.4x)
    protestorWrapper.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
    protestorWrapper.style.transform = "scale(1.4)";
    
    // Set timeout for protestors to disappear if not clicked
    country.disappearTimeout = setTimeout(() => {
      this.shrinkAndHideProtestors(countryId);
    }, 7000);
  }
  
  // Ensure the wrapper remains correctly positioned
  protestorWrapper.style.position = "absolute";
  protestorWrapper.style.left = originalPosition.left;
  protestorWrapper.style.top = originalPosition.top;
  protestorWrapper.style.width = originalPosition.width;
  protestorWrapper.style.height = originalPosition.height;
  protestorWrapper.style.zIndex = "10210"; // Keep above hitbox
}

shrinkAndHideProtestors(countryId) {
  const protestorWrapper = document.getElementById(`${countryId}-protestors-wrapper`);
  if (!protestorWrapper) return;

  this.logger.info("freedom", `Protestors timed out in ${countryId}, disappearing`);
  
  // Clear any existing transitions/animations first
  protestorWrapper.style.animation = "none";
  protestorWrapper.style.transition = "none";
  void protestorWrapper.offsetWidth; // Force reflow
  
  // Get original position
  const originalPosition = {
    left: protestorWrapper.style.left,
    top: protestorWrapper.style.top,
    width: protestorWrapper.style.width,
    height: protestorWrapper.style.height
  };
  
  // Set transform-origin to bottom center for shrinking back into ground
  protestorWrapper.style.transformOrigin = "bottom center";
  
  // Set up transitions for smooth disappearance
  protestorWrapper.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";
  protestorWrapper.style.opacity = "0";
  
  // Scale vertically more than horizontally to simulate sinking into ground
  protestorWrapper.style.transform = "scale(1, 0.2) translateY(10px)";
  
  // Ensure correct positioning is maintained
  protestorWrapper.style.position = "absolute";
  protestorWrapper.style.left = originalPosition.left;
  protestorWrapper.style.top = originalPosition.top;
  protestorWrapper.style.width = originalPosition.width;
  protestorWrapper.style.height = originalPosition.height;
  
  // Hide after animation completes
  setTimeout(() => {
    this.hideProtestors(countryId);
    
    // Reset click counter
    if (this.countries[countryId]) {
      this.countries[countryId].clickCounter = 0;
    }
  }, 500);
}

// Keep this implementation and remove the duplicate
showProtestors(countryId) {
  console.log(`[FREEDOM DEBUG] Beginning showProtestors for ${countryId}`);

  this.hideProtestors(countryId);
  
  console.log(`[FREEDOM DEBUG] Selecting spawn location for ${countryId}`);
  this.protestorHitboxManager.selectNewRandomSpawnLocation(countryId);

  this.logger.info("freedom", `Showing protestors for ${countryId}`);
  
  // Get the hitbox
  console.log(`[FREEDOM DEBUG] Calling showHitbox for ${countryId}`);
  const hitbox = this.protestorHitboxManager.showHitbox(countryId, this);
  if (!hitbox) {
    console.error(`[FREEDOM ERROR] Failed to create protestor hitbox for ${countryId}`);
    this.logger.error("freedom", `Failed to create protestor hitbox for ${countryId}`);
    return null;
  }
  
  console.log(`[FREEDOM DEBUG] Hitbox created successfully for ${countryId}`);
  
  
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
  wrapper.style.transformOrigin = "bottom center"; // Key addition: set grow from bottom
  
  // Create the protestors sprite element
  const protestors = document.createElement("div");
  protestors.id = `${countryId}-protestors`;
  protestors.style.width = "100%";
  protestors.style.height = "100%";
  protestors.style.backgroundImage = "url('images/protest.png')";
  protestors.style.backgroundSize = "400% 100%"; // For 4-frame sprite sheet
  protestors.style.backgroundPosition = "0% 0%";
  protestors.style.backgroundRepeat = "no-repeat";
  protestors.style.opacity = "0"; // Start invisible for fade-in
  protestors.style.transition = "opacity 0.3s ease-out"; // Smooth fade-in
  
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
      this.logger.debug("freedom", `Animation cleared for ${countryId} - element not found`);
      return;
    }
    
    // For 4-frame sprite sheet - cycle through frames
    currentFrame = (currentFrame + 1) % 4;
    const percentPosition = (currentFrame / 3) * 100;
    protestorElement.style.backgroundPosition = `${percentPosition}% 0%`;
  }, 300);
  
  // Store the interval for cleanup
  this.activeAnimations.protestors[countryId] = animationInterval;
  
  // Add grow-from-ground animation
  wrapper.style.transform = "scale(1, 0.2) translateY(10px)"; // Start small from ground
  
  // Fade in protestors after a short delay
  setTimeout(() => {
    // Now grow up with transition
    wrapper.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out";
    wrapper.style.transform = "scale(1, 1)"; // Grow to full size
    protestors.style.opacity = "1"; // Fade in the sprite
    
    // Play protest sound on appearance
    this.playProtestSound(countryId, 0.3); // Start with low volume
  }, 100);
  
  // Set timeout for protestors to disappear if not clicked
  this.countries[countryId].disappearTimeout = setTimeout(() => {
    this.shrinkAndHideProtestors(countryId);
  }, 7000); // 7 seconds timeout
  
  this.logger.debug("freedom", `Created protestors for ${countryId} at (${left}, ${top})`);
  
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
  
  // Get a fresh reference to the protestor wrapper and sprite elements
  const protestorWrapper = document.getElementById(`${countryId}-protestors-wrapper`);
  const protestorSprite = document.getElementById(`${countryId}-protestors`);
  
  if (!protestorWrapper || !protestorSprite) {
    this.logger.error("freedom", `Protestor elements not found for ${countryId}`);
    return;
  }
  
  // Store the wrapper reference in country data
  country.protestorWrapper = protestorWrapper;
  
  // Calculate volume based on click count
  const volume = Math.min(0.5 + (country.clickCounter * 0.2), 1.0);
  
  // Play click sound with increasing volume
  this.playProtestSound(countryId, volume);
  
  // Create additional protestors
  const gameContainer = document.getElementById("game-container");
  if (gameContainer && protestorWrapper) {
    // Clean up any previous additional protestors
    document.querySelectorAll(`.additional-protestor-${countryId}`).forEach(el => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
    
    // Clean up previous animation intervals
    if (this.activeAnimations.extraProtestors) {
      for (let key in this.activeAnimations.extraProtestors) {
        if (key.startsWith(`${countryId}-`)) {
          clearInterval(this.activeAnimations.extraProtestors[key]);
          delete this.activeAnimations.extraProtestors[key];
        }
      }
    }
    
    // Calculate position relative to the main protestor
    const rect = protestorWrapper.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    const left = rect.left - containerRect.left;
    const top = rect.top - containerRect.top;
    const width = rect.width;
    const height = rect.height;
    
    // Only add additional protestors after first click
    const count = Math.min(country.clickCounter, 2);
    
    for (let i = 0; i < count; i++) {
      // Create the protestor element
      const additionalProtestor = document.createElement("div");
      additionalProtestor.id = `${countryId}-additional-protestor-${i}`;
      additionalProtestor.className = `additional-protestor-${countryId}`;
      additionalProtestor.style.position = "absolute";
      
      // Position with offsets
      const offsetX = -20 + (i * 30);
      const offsetY = -15;
      
      additionalProtestor.style.left = `${left + offsetX}px`;
      additionalProtestor.style.top = `${top + offsetY}px`;
      additionalProtestor.style.width = `${width * 0.85}px`;
      additionalProtestor.style.height = `${height * 0.85}px`;
      additionalProtestor.style.backgroundImage = "url('images/protest.png')";
      additionalProtestor.style.backgroundSize = "400% 100%";
      additionalProtestor.style.backgroundPosition = `${(i % 4) * 33}% 0%`;
      additionalProtestor.style.backgroundRepeat = "no-repeat";
      additionalProtestor.style.zIndex = "10209";
      additionalProtestor.style.pointerEvents = "none";
      
      // Add to game container
      gameContainer.appendChild(additionalProtestor);
      
      // Set up animation
      let frame = i % 4;
      const interval = setInterval(() => {
        frame = (frame + 1) % 4;
        const percentPosition = (frame / 3) * 100;
        
        // Get a fresh reference to the specific protestor
        const el = document.getElementById(`${countryId}-additional-protestor-${i}`);
        if (el) {
          el.style.backgroundPosition = `${percentPosition}% 0%`;
        } else {
          clearInterval(interval);
        }
      }, 300 + (i * 50));
      
      // Store interval for cleanup
      if (!this.activeAnimations.extraProtestors) {
        this.activeAnimations.extraProtestors = {};
      }
      this.activeAnimations.extraProtestors[`${countryId}-${i}`] = interval;
    }
  }
  
  // CRITICAL CHANGE: Stop all CSS animations and transitions before applying transform
  protestorWrapper.style.animation = "none";
  protestorWrapper.style.transition = "none";
  void protestorWrapper.offsetWidth; // Force browser reflow to apply style changes
  
  // Get original position values
  const originalPosition = {
    left: protestorWrapper.style.left,
    top: protestorWrapper.style.top,
    width: protestorWrapper.style.width,
    height: protestorWrapper.style.height
  };
  
  // KEY FIX: Set transform-origin to bottom center so it grows upward
  protestorWrapper.style.transformOrigin = "bottom center";
  
  if (country.clickCounter >= 3) {
    // Trigger liberation after 3 clicks
    this.triggerCountryResistance(countryId);
    country.clickCounter = 0;
  } else if (country.clickCounter === 2) {
    // Change sprite to heart version on second click
    protestorSprite.style.backgroundImage = "url('images/protestHeart.png')";
    this.logger.info("freedom", `[SPRITE CHANGE] Changed protestor sprite to protestHeart.png for ${countryId}`);
    
    // Apply dramatic scaling (1.75x) with bounce effect
    protestorWrapper.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
    protestorWrapper.style.transform = "scale(1.75)";
    
    // Set timeout for protestors to disappear if not clicked
    country.disappearTimeout = setTimeout(() => {
      this.shrinkAndHideProtestors(countryId);
    }, 7000);
  } else {
    // First click behavior
    // Apply moderate scaling (1.4x)
    protestorWrapper.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
    protestorWrapper.style.transform = "scale(1.4)";
    
    // Set timeout for protestors to disappear if not clicked
    country.disappearTimeout = setTimeout(() => {
      this.shrinkAndHideProtestors(countryId);
    }, 7000);
  }
  
  // Ensure the wrapper remains correctly positioned
  protestorWrapper.style.position = "absolute";
  protestorWrapper.style.left = originalPosition.left;
  protestorWrapper.style.top = originalPosition.top;
  protestorWrapper.style.width = originalPosition.width;
  protestorWrapper.style.height = originalPosition.height;
  protestorWrapper.style.zIndex = "10210"; // Keep above hitbox
}

hideProtestors(countryId) {
  this.logger.info("freedom", `[HIDE] Hiding protestors for ${countryId}`);
  
  // Clean up additional protestors
  document.querySelectorAll(`.additional-protestor-${countryId}`).forEach(el => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // Stop sounds with correct country variants
  if (this.audioManager && typeof this.audioManager.stopProtestorSounds === "function") {
    if (countryId === "canada") {
      // For Canada, we need to stop both eastCanada and westCanada sounds
      this.audioManager.stopProtestorSounds("eastCanada");
      this.audioManager.stopProtestorSounds("westCanada");
    } else {
      this.audioManager.stopProtestorSounds(countryId);
    }
  }
  
  // Clean up animation intervals for additional protestors
  if (this.activeAnimations.extraProtestors) {
    for (let key in this.activeAnimations.extraProtestors) {
      if (key.startsWith(`${countryId}-`)) {
        clearInterval(this.activeAnimations.extraProtestors[key]);
        delete this.activeAnimations.extraProtestors[key];
      }
    }
  }
  
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

// Also update shrinkAndHideProtestors to animate the additional protestors
shrinkAndHideProtestors(countryId) {
  const protestorWrapper = document.getElementById(`${countryId}-protestors-wrapper`);
  if (!protestorWrapper) return;

  this.logger.info("freedom", `Protestors timed out in ${countryId}, disappearing`);
  
  // Clear any existing transitions/animations first
  protestorWrapper.style.animation = "none";
  protestorWrapper.style.transition = "none";
  void protestorWrapper.offsetWidth; // Force reflow
  
  // Get original position
  const originalPosition = {
    left: protestorWrapper.style.left,
    top: protestorWrapper.style.top,
    width: protestorWrapper.style.width,
    height: protestorWrapper.style.height
  };
  
  // Set transform-origin to bottom center for shrinking back into ground
  protestorWrapper.style.transformOrigin = "bottom center";
  
  // Set up transitions for smooth disappearance
  protestorWrapper.style.transition = "transform 0.5s ease-out, opacity 0.5s ease-out";
  protestorWrapper.style.opacity = "0";
  
  // Scale vertically more than horizontally to simulate sinking into ground
  protestorWrapper.style.transform = "scale(1, 0.2) translateY(10px)";
  
  // Also animate additional protestors
  document.querySelectorAll(`.additional-protestor-${countryId}`).forEach(el => {
    el.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
    el.style.opacity = "0";
    el.style.transform = "scale(1, 0.2) translateY(10px)";
  });
  
  // Ensure correct positioning is maintained
  protestorWrapper.style.position = "absolute";
  protestorWrapper.style.left = originalPosition.left;
  protestorWrapper.style.top = originalPosition.top;
  protestorWrapper.style.width = originalPosition.width;
  protestorWrapper.style.height = originalPosition.height;
  
  // Hide after animation completes
  setTimeout(() => {
    this.hideProtestors(countryId);
    
    // Reset click counter
    if (this.countries[countryId]) {
      this.countries[countryId].clickCounter = 0;
    }
  }, 500);
}

// Also update cleanupAllProtestors method to clean up additional protestors
cleanupAllProtestors() {
  // Clear all animation intervals
  Object.keys(this.activeAnimations.protestors).forEach(countryId => {
    if (this.activeAnimations.protestors[countryId]) {
      clearInterval(this.activeAnimations.protestors[countryId]);
    }
  });
  this.activeAnimations.protestors = {};
  
  // Stop all protestor sounds
  if (this.audioManager && typeof this.audioManager.stopAllProtestorSounds === "function") {
    this.audioManager.stopAllProtestorSounds();
  }

  // Clean up all extraProtestors animation intervals
  if (this.activeAnimations.extraProtestors) {
    for (let key in this.activeAnimations.extraProtestors) {
      clearInterval(this.activeAnimations.extraProtestors[key]);
    }
    this.activeAnimations.extraProtestors = {};
  }
  
  // Remove all additional protestor elements
  document.querySelectorAll('[class^="additional-protestor-"]').forEach(el => {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
  
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

  if (this.audioManager) {
    if (typeof this.audioManager.stopAllProtestorSounds === "function") {
      this.audioManager.stopAllProtestorSounds();
    }
    // If you have a general stopAll method, this would be a good place to call it
    if (typeof this.audioManager.stopAll === "function") {
      this.audioManager.stopAll();
    }
  }
  
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