/**
 * Enhanced FreedomManager - Creates dramatic country resistance events
 */
class FreedomManager {
  constructor(gameState, elements, audioManager) {
    this.gameState = gameState;
    this.elements = elements;
    this.audioManager = audioManager;
    
    // Configuration
    this.fullAnnexationTime = 10000; // 10 seconds after full annexation before resistance is possible
    this.resistanceChance = 0.05; // 5% check per second for fully annexed countries
    
    // Track annexation times for each country
    this.annexationTimers = {
      canada: { fullAnnexTime: 0, resistanceAvailable: false },
      mexico: { fullAnnexTime: 0, resistanceAvailable: false },
      greenland: { fullAnnexTime: 0, resistanceAvailable: false }
    };
    
    // Create container for freedom celebrations
    this.createParticleContainers();
    
    // Logger reference (from game state)
    this.logger = window.logger || { 
      debug: function(category, message) { console.log(`[DEBUG] ${category}: ${message}`); },
      info: function(category, message) { console.log(`[INFO] ${category}: ${message}`); },
      warn: function(category, message) { console.warn(`[WARN] ${category}: ${message}`); },
      error: function(category, message) { console.error(`[ERROR] ${category}: ${message}`); }
    };
    
    // For animation triggering
    this.animationManager = window.animationManager;
    this.smackManager = window.smackManager;
    
    this.logger.info("freedom", "Enhanced Freedom Manager initialized");
  }
  
  // Set up particle containers for each country
  createParticleContainers() {
    const countries = ['canada', 'mexico', 'greenland'];
    
    countries.forEach(country => {
      // Check if container already exists
      if (document.getElementById(`${country}-particles`)) {
        return;
      }
      
      const container = document.createElement('div');
      container.id = `${country}-particles`;
      container.className = 'freedom-particles';
      container.style.zIndex = "1000"; // Ensure high z-index
      document.getElementById('game-container').appendChild(container);
    });
  }
  
  // Update method called each frame
  update(deltaTime) {
    if (!this.gameState.isPlaying || this.gameState.isPaused) return;
    
    // Convert deltaTime from ms to seconds for chance calculation
    const deltaSeconds = deltaTime / 1000;
    
    Object.keys(this.annexationTimers).forEach(country => {
      const countryState = this.gameState.countries[country];
      const annexTimer = this.annexationTimers[country];
      
      // Check if country is fully annexed
      if (countryState.claims >= countryState.maxClaims) {
        // Update annexation timer
        annexTimer.fullAnnexTime += deltaTime;
        
        // Check if country has been annexed long enough to enable resistance
        if (annexTimer.fullAnnexTime >= this.fullAnnexationTime && !annexTimer.resistanceAvailable) {
          annexTimer.resistanceAvailable = true;
          this.logger.info("freedom", `${country} now able to resist after ${(annexTimer.fullAnnexTime/1000).toFixed(1)}s of full annexation`);
          
          // Show subtle indicator that resistance is possible
          this.showResistancePossibleIndicator(country);
        }
        
        // Check for resistance for countries that have been annexed long enough
        if (annexTimer.resistanceAvailable) {
          // Calculate per-frame chance based on per-second chance
          const frameResistanceChance = this.resistanceChance * deltaSeconds;
          
          // Random check if resistance should happen now
          if (Math.random() < frameResistanceChance) {
            this.logger.info("freedom", `UPRISING TRIGGERED in ${country}!`);
            this.triggerCountryResistance(country);
            
            // Reset after successful resistance
            annexTimer.resistanceAvailable = false;
            annexTimer.fullAnnexTime = 0;
          }
        }
      } else {
        // Country not fully annexed, reset timer
        annexTimer.fullAnnexTime = 0;
        annexTimer.resistanceAvailable = false;
      }
    });
  }
  
  // Show subtle indicator that resistance is possible
  showResistancePossibleIndicator(country) {
    const countryElement = this.elements.countries[country];
    if (!countryElement) return;
    
    // Add pulsing glow effect
    countryElement.classList.add('resistance-possible');
    
    // Play subtle sound
    if (this.audioManager) {
      // Play at low volume
      this.audioManager.playRandom("particles", "freedom");
    }
  }




  // Corrected method to ensure effects are restricted to the proper country
createFreedomCelebration(country) {
  // Use the flag overlay to determine country position
  const flagOverlay = document.getElementById(`${country}-flag-overlay`);
  if (!flagOverlay) {
    this.logger.error("freedom", `Flag overlay for ${country} not found for freedom celebration!`);
    return;
  }
  
  // Use the game container as reference
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) return;
  
  // Get flag position and dimensions RELATIVE to the game container
  const flagRect = flagOverlay.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();
  
  // Calculate positions relative to the container
  const flagLeft = flagRect.left - containerRect.left;
  const flagTop = flagRect.top - containerRect.top;
  const flagWidth = flagRect.width;
  const flagHeight = flagRect.height;
  
  // Log positions for debugging
  console.log(`Flag ${country} position: left=${flagLeft}, top=${flagTop}, width=${flagWidth}, height=${flagHeight}`);
  
  // Add screen shake
  gameContainer.classList.add('screen-shake');
  setTimeout(() => {
    gameContainer.classList.remove('screen-shake');
  }, 800);
  
  // Create a flash effect over the flag
  const flash = document.createElement('div');
  flash.className = 'freedom-flash';
  flash.style.position = 'absolute';
  flash.style.left = `${flagLeft}px`;
  flash.style.top = `${flagTop}px`;
  flash.style.width = `${flagWidth}px`;
  flash.style.height = `${flagHeight}px`;
  flash.style.borderRadius = '10%';
  flash.style.zIndex = '9995';
  gameContainer.appendChild(flash);
  
  // Remove flash after animation completes
  setTimeout(() => {
    flash.remove();
  }, 1500);
  
  // Create "FREEDOM!" text centered on the flag
  const text = document.createElement('div');
  text.className = 'freedom-text';
  text.textContent = 'RESISTANCE!';
  text.style.position = 'absolute';
  text.style.zIndex = '9999';
  
  // Calculate center of flag relative to container
  const centerX = flagLeft + (flagWidth / 2);
  const centerY = flagTop + (flagHeight / 2);
  
  // Position text in the center of the flag
  const textWidth = 120; // Approximate width of the text
  text.style.left = `${centerX - (textWidth/2)}px`;
  text.style.top = `${centerY - 16}px`;
  
  gameContainer.appendChild(text);
  
  // Remove text after animation
  setTimeout(() => {
    text.remove();
  }, 2000);
  
  // Create confetti burst from the flag
  const confettiCount = 80;
  
  // For each confetti piece, create it within the flag boundaries
  for (let i = 0; i < confettiCount; i++) {
    // Stagger creation slightly for better visual effect
    setTimeout(() => {
      // Generate a random position within the flag boundaries
      // Use padding to ensure it's well within the flag
      const padding = Math.min(5, Math.min(flagWidth, flagHeight) * 0.1);
      const x = flagLeft + padding + Math.random() * (flagWidth - padding * 2);
      const y = flagTop + padding + Math.random() * (flagHeight - padding * 2);
      
      this.createConfettiPiece(x, y, gameContainer, i % 5 === 0);
    }, i * 10); 
  }
}

// Improved confetti piece creation with smoother falling
createConfettiPiece(startX, startY, gameContainer, isLarger = false) {
  if (!gameContainer) return;
  
  // Create confetti element
  const confetti = document.createElement('div');
  confetti.className = 'freedom-confetti';
  
  // Random confetti properties for more variety
  const shapes = ['circle', 'square', 'rectangle', 'triangle'];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  confetti.classList.add(`confetti-${shape}`);
  
  // Size - occasionally make some pieces larger for variety
  const size = isLarger ? 8 + Math.random() * 8 : 4 + Math.random() * 6;
  confetti.style.width = `${size}px`;
  confetti.style.height = shape === 'rectangle' ? `${size * 2}px` : `${size}px`;
  
  // Random vibrant color with high saturation
  const hue = Math.floor(Math.random() * 360);
  const lightness = 50 + Math.random() * 30; // Brighter colors
  confetti.style.backgroundColor = `hsl(${hue}, 100%, ${lightness}%)`;
  
  // Add a slight border to make it pop
  confetti.style.border = '0.5px solid rgba(0,0,0,0.3)';
  
  // Random rotation
  const rotation = Math.random() * 360;
  confetti.style.transform = `rotate(${rotation}deg)`;
  
  // Set the initial position
  confetti.style.position = 'absolute';
  confetti.style.left = `${startX}px`;
  confetti.style.top = `${startY}px`;
  confetti.style.zIndex = '9997';
  
  // Add to container
  gameContainer.appendChild(confetti);
  
  // Random trajectory parameters - make confetti explode outward
  const angle = Math.random() * Math.PI * 2;
  const distance = 40 + Math.random() * 120; // How far it flies
  const destinationX = startX + Math.cos(angle) * distance;
  const destinationY = startY + Math.sin(angle) * distance;
  
  // Animation duration with slight randomness - longer for smoother animation
  const duration = 1200 + Math.random() * 1500;
  
  // Control points for bezier curve to make smoother falling
  const cp1x = startX + (destinationX - startX) * 0.3 + (Math.random() * 30 - 15);
  const cp1y = startY + (destinationY - startY) * 0.3 - (Math.random() * 20);
  const cp2x = startX + (destinationX - startX) * 0.6 + (Math.random() * 30 - 15);
  const cp2y = destinationY - (Math.random() * 50);
  
  // Animate with cubic bezier for smoother movement
  const startTime = performance.now();
  
  function animateConfetti(timestamp) {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Smoother falling using cubic bezier curve
    if (progress < 1) {
      // Cubic bezier calculation for position
      const t = progress;
      const t_ = 1 - t;
      
      // Cubic bezier formula
      const currentX = 
        Math.pow(t_, 3) * startX + 
        3 * Math.pow(t_, 2) * t * cp1x + 
        3 * t_ * Math.pow(t, 2) * cp2x + 
        Math.pow(t, 3) * destinationX;
        
      const currentY = 
        Math.pow(t_, 3) * startY + 
        3 * Math.pow(t_, 2) * t * cp1y + 
        3 * t_ * Math.pow(t, 2) * cp2y + 
        Math.pow(t, 3) * destinationY;
      
      // Update position
      confetti.style.left = `${currentX}px`;
      confetti.style.top = `${currentY}px`;
      
      // Add spin animation - pieces rotate as they fall
      // Smoother rotation with easing
      const spin = rotation + (progress * progress * 720) * (Math.random() > 0.5 ? 1 : -1);
      confetti.style.transform = `rotate(${spin}deg)`;
      
      // Smoother opacity transition
      if (progress > 0.7) {
        const fadeProgress = (progress - 0.7) / 0.3;
        const easeOutFade = 1 - Math.pow(fadeProgress, 2);
        confetti.style.opacity = easeOutFade;
      }
      
      requestAnimationFrame(animateConfetti);
    } else {
      confetti.remove();
    }
  }
  
  requestAnimationFrame(animateConfetti);
}
  // Create individual firework particles
  createFireworkParticle(centerX, centerY) {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;
    
    const particle = document.createElement('div');
    particle.className = 'freedom-firework';
    
    // Random color for each firework particle
    const hue = Math.floor(Math.random() * 360);
    particle.style.background = `radial-gradient(circle, hsl(${hue}, 100%, 70%) 10%, transparent 70%)`;
    particle.style.boxShadow = `0 0 10px 5px hsla(${hue}, 100%, 70%, 0.8)`;
    
    // Random size
    const size = 5 + Math.random() * 15;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Initial position
    particle.style.left = `${centerX}px`;
    particle.style.top = `${centerY}px`;
    
    // Random angle and distance
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 100;
    const destinationX = centerX + Math.cos(angle) * distance;
    const destinationY = centerY + Math.sin(angle) * distance;
    
    // Add to container
    gameContainer.appendChild(particle);
    
    // Animate using JavaScript for more control
    const startTime = performance.now();
    const duration = 800 + Math.random() * 800; // 0.8-1.6 seconds
    
    function animateParticle(timestamp) {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for more natural movement
      const easedProgress = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      // Position calculation with gravity effect
      const currentX = centerX + (destinationX - centerX) * easedProgress;
      const currentY = centerY + (destinationY - centerY) * easedProgress + (50 * progress * progress); // Add gravity
      
      // Update position
      particle.style.left = `${currentX}px`;
      particle.style.top = `${currentY}px`;
      
      // Update opacity (fade out at the end)
      particle.style.opacity = 1 - (progress * progress);
      
      // Continue animation or remove
      if (progress < 1) {
        requestAnimationFrame(animateParticle);
      } else {
        particle.remove();
      }
    }
    
    requestAnimationFrame(animateParticle);
  }
  
  // Trigger a country resistance event (complete liberation)
  triggerCountryResistance(country) {
    this.logger.info("freedom", `MAJOR RESISTANCE in ${country}!`);
    
    // Remove pulsing effect if it exists
    const countryElement = this.elements.countries[country];
    if (countryElement) {
      countryElement.classList.remove('resistance-possible');
    }
    
    // Reset claims to 0 (completely liberate the country)
    this.gameState.countries[country].claims = 0;
    
    // Update the flag overlay to be completely transparent
    const flagOverlay = document.getElementById(`${country}-flag-overlay`);
    if (flagOverlay) {
      this.logger.info("freedom", `Resetting flag opacity for ${country} to zero`);
      flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");
      flagOverlay.style.opacity = "0"; // Use string "0" instead of number 0
    }
    
    // Create the new cartoony freedom celebration effect
    this.createFreedomCelebration(country);
    
    // Play resistance sound
    if (this.audioManager) {
      // Play resistance sound
      this.audioManager.playRandom("resistance", country);
      
      // Also play a protest sound for added effect
      setTimeout(() => {
        // For Canada, handle east/west special case
        if (country === "canada") {
          // Randomly choose east or west Canada for protest sound
          const direction = Math.random() < 0.5 ? "eastCanada" : "westCanada";
          this.audioManager.playSimpleRandomProtest(direction);
        } else {
          this.audioManager.playSimpleRandomProtest(country);
        }
      }, 300);
    }
    
    // Use existing animation system for hand animation
    if (this.smackManager) {
      let smackAnimation = "";
      if (country === "canada") {
        smackAnimation = Math.random() < 0.5 ? "smackEastCanada" : "smackWestCanada";
      } else if (country === "mexico") {
        smackAnimation = "smackMexico";
      } else if (country === "greenland") {
        smackAnimation = "smackGreenland";
      }
      
      if (smackAnimation) {
        this.logger.info("freedom", `Playing smack animation ${smackAnimation} for resistance effect`);
        this.smackManager.playSmackAnimation(smackAnimation, () => {
          this.logger.debug("freedom", "Resistance animation completed");
        });
      }
    }
    
    return true;
  }
  
  // Update flag overlay opacity based on claims
  updateFlagOpacity(country) {
    const flagOverlay = document.getElementById(`${country}-flag-overlay`);
    if (!flagOverlay) {
      this.logger.error("freedom", `Flag overlay for ${country} not found!`);
      return;
    }
    
    const claims = this.gameState.countries[country].claims;
    
    this.logger.info("freedom", `Updating flag opacity for ${country} to claims level ${claims}`);
    
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
  
// Reset all freedom timers and claims
reset() {
  this.logger.info("freedom", "Resetting freedom system");
  
  Object.keys(this.annexationTimers).forEach(country => {
    this.annexationTimers[country].fullAnnexTime = 0;
    this.annexationTimers[country].resistanceAvailable = false;
    
    // Remove any resistance-possible effects
    const countryElement = this.elements.countries[country];
    if (countryElement) {
      countryElement.classList.remove('resistance-possible');
    }
    
    // Reset claims to 0
    if (this.gameState.countries[country]) {
      this.gameState.countries[country].claims = 0;
    }
    
    // Reset flag overlay
    const flagOverlay = document.getElementById(`${country}-flag-overlay`);
    if (flagOverlay) {
      flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100");
      flagOverlay.style.opacity = "0"; // Use string "0" for opacity
    }
  });
  
  // Clear all celebration elements
  document.querySelectorAll('.freedom-flash, .freedom-text, .freedom-confetti').forEach(element => {
    element.remove();
  });
}
  
  // Debug methods
  setCountryClaims(country, claimLevel) {
    if (!this.gameState.countries[country]) {
      this.logger.error("freedom", `Country ${country} not found in gameState`);
      return false;
    }
    
    // Set the claim level (between 0 and maxClaims)
    const maxClaims = this.gameState.countries[country].maxClaims;
    const newClaims = Math.max(0, Math.min(claimLevel, maxClaims));
    
    this.gameState.countries[country].claims = newClaims;
    this.updateFlagOpacity(country);
    
    return true;
  }
  
  annexCountry(country) {
    if (!this.gameState.countries[country]) {
      this.logger.error("freedom", `Country ${country} not found in gameState`);
      return false;
    }
    
    // Set claims to max
    const maxClaims = this.gameState.countries[country].maxClaims;
    this.gameState.countries[country].claims = maxClaims;
    
    // Update the flag overlay
    this.updateFlagOpacity(country);
    
    return true;
  }
  
  makeResistanceReady(country) {
    if (!this.annexationTimers[country]) {
      this.logger.error("freedom", `Country ${country} not found in annexationTimers`);
      return false;
    }
    
    // First make sure the country is fully annexed
    this.annexCountry(country);
    
    // Set the annexation timer to the threshold
    this.annexationTimers[country].fullAnnexTime = this.fullAnnexationTime;
    this.annexationTimers[country].resistanceAvailable = true;
    
    // Show the resistance indicator
    this.showResistancePossibleIndicator(country);
    
    return true;
  }
}

window.FreedomManager = FreedomManager;