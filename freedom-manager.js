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
      this.resistanceChance = 0.05; // 5% check per second for fully annexed countries (rare but dramatic)
      this.particleBurstCount = 15; // Number of particles to create during a resistance event
      
      // Track annexation times for each country
      this.annexationTimers = {
        canada: { fullAnnexTime: 0, resistanceAvailable: false },
        mexico: { fullAnnexTime: 0, resistanceAvailable: false },
        greenland: { fullAnnexTime: 0, resistanceAvailable: false }
      };
      
      // Create container for freedom particles
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
      
      // Debug path for particle images
      this.debugParticleImages();
    }
    
    // For debugging particle image paths
    debugParticleImages() {
      const basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
      
      this.logger.info("freedom", "Base path for images: " + basePath);
      this.logger.info("freedom", "Checking for particle images:");
      
      // List of particle images to check
      const particleImages = [
        'images/particle1.png',
        'images/particle1.png',
        'images/particle1.png',
        'images/particle1.png',
        'images/ufo.png'
      ];

      
      particleImages.forEach(imagePath => {
        const img = new Image();
        img.onload = () => {
          this.logger.info("freedom", `✅ Image loaded: ${imagePath}`);
        };
        img.onerror = () => {
          this.logger.error("freedom", `❌ Image failed to load: ${imagePath}`);
          // If asset folder path is wrong, suggest creating the folder
          this.logger.info("freedom", `Create folder structure and add images at: ${basePath}${imagePath}`);
        };
        img.src = imagePath;
      });
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
            
            // Log more detailed information about resistance checks (rarely)
            if (Math.random() < 0.01) { // Only log occasionally to avoid spam
              this.logger.debug("freedom", `Resistance check for ${country}: ${(frameResistanceChance * 100).toFixed(2)}% chance`);
            }
            
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
      const countryElement = document.getElementById(country);
      if (!countryElement) return;
      
      // Add pulsing glow effect
      countryElement.classList.add('resistance-possible');
      
      // Spawn a few initial particles to hint at coming resistance
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          this.spawnParticle(country, 0.5); // Half opacity
        }, i * 300);
      }
      
      // Play subtle sound
      if (this.audioManager) {
        // Play at low volume
        this.audioManager.playRandom("particles", "freedom");
      }
    }
    
    // Trigger a major resistance event
    triggerCountryResistance(country) {
      this.logger.info("freedom", `MAJOR RESISTANCE in ${country}!`);
      
      // Remove pulsing effect if it exists
      const countryElement = document.getElementById(country);
      if (countryElement) {
        countryElement.classList.remove('resistance-possible');
      }
      
      // Reduce claims by 1
      const countryState = this.gameState.countries[country];
      countryState.claims = Math.max(0, countryState.claims - 1);
      
      // Play strong resistance sound
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
      
      // Use existing animation system - leverage SmackManager for animation
      if (this.smackManager) {
        // Determine which animation to play based on country
        let smackAnimation = "";
        if (country === "canada") {
          // Randomly select east or west Canada
          smackAnimation = Math.random() < 0.5 ? "smackEastCanada" : "smackWestCanada";
        } else if (country === "mexico") {
          smackAnimation = "smackMexico";
        } else if (country === "greenland") {
          smackAnimation = "smackGreenland";
        }
        
        // Play the animation
        if (smackAnimation) {
          this.logger.info("freedom", `Playing smack animation ${smackAnimation} for resistance effect`);
          this.smackManager.playSmackAnimation(smackAnimation, () => {
            this.logger.debug("freedom", "Resistance animation completed");
          });
        }
      }
      
      // Create a major particle burst
      this.createResistanceBurst(country);
      
      // Add a dramatic visual effect to the flag
      this.applyFlagResistanceEffect(country);
      
      // Update flag opacity (ensure it's properly reduced)
      this.updateFlagOpacity(country);
      
      // Trigger country highlight effect
      this.triggerResistanceEffect(country, true); // true = major effect
      
      return true; // Return true to indicate success (for debug functions)
    }
    
    // Create a burst of many particles
    createResistanceBurst(country) {
      const logParticleDetails = true; // Set to true to debug particle creation
      
      // Create multiple particles in a staggered pattern
      for (let i = 0; i < this.particleBurstCount; i++) {
        setTimeout(() => {
          if (logParticleDetails && i === 0) {
            this.logger.info("freedom", `Creating particle burst for ${country}`);
          }
          this.spawnParticle(country, 1.0, true, logParticleDetails && i === 0); // full opacity, larger size, log first particle
        }, i * 100); // Stagger creation for better visual effect
      }
      
      // Create a special "uprising" animation
      this.createUprisingAnimation(country);
    }
    
    createUprisingAnimation(country) {
        const container = document.getElementById(`${country}-particles`);
        if (!container) {
          this.logger.error("freedom", `Particle container for ${country} not found!`);
          return;
        }
        
        // Use elements object instead of getElementById
        const countryElement = this.elements.countries[country];
        if (!countryElement) {
          this.logger.error("freedom", `Country element ${country} not found in elements.countries!`);
          return;
        }
      
      // Get country position
      const countryRect = countryElement.getBoundingClientRect();
      
      // Create uprising element
      const uprising = document.createElement('div');
      uprising.className = 'resistance-uprising';
      
      // Position in middle of country
      const centerX = countryRect.left + (countryRect.width / 2);
      const centerY = countryRect.top + (countryRect.height / 2);
      
      uprising.style.left = `${centerX - 75}px`; // Center the 150px wide element
      uprising.style.top = `${centerY - 75}px`;  // Center the 150px tall element
      
      // Log positioning details
      this.logger.info("freedom", `Creating uprising at (${centerX}, ${centerY}) for ${country}`);
      
      // Add to container
      container.appendChild(uprising);
      
      // Remove after animation completes
      setTimeout(() => {
        uprising.remove();
      }, 2500);
    }
    
    spawnParticle(country, opacity = 1.0, larger = false, logDetails = false) {
        const container = document.getElementById(`${country}-particles`);
        if (!container) {
          this.logger.error("freedom", `Particle container for ${country} not found!`);
          return;
        }
        
        // Use elements object instead of getElementById
        const countryElement = this.elements.countries[country];
        if (!countryElement) {
          this.logger.error("freedom", `Country element ${country} not found in elements.countries!`);
          return;
        }
      
      // Get country position
      const countryRect = countryElement.getBoundingClientRect();
      
      // Create particle element
      const particle = document.createElement('div');
      particle.className = 'resistance-particle';
      
      // Add variation to particles
      const particleType = Math.floor(Math.random() * 4) + 1; // 1-4
      particle.classList.add(`resistance-particle-${particleType}`);
      
      // Make larger if requested
      if (larger) {
        particle.classList.add('resistance-particle-large');
      }
      
      // Randomly position within country bounds
      const padding = 10; // Padding inside country boundaries
      const xPos = (padding + Math.random() * (countryRect.width - 2 * padding)) + countryRect.left;
      const yPos = (padding + Math.random() * (countryRect.height - 2 * padding)) + countryRect.top;
      
      // Set particle style
      particle.style.left = `${xPos}px`;
      particle.style.top = `${yPos}px`;
      particle.style.transform = `rotate(${Math.random() * 30 - 15}deg)`; // Random slight rotation
      particle.style.opacity = opacity;
      

      particle.style.backgroundImage = "none";
      particle.textContent = ["0", "o", "x", "X"][particleType - 1];
      particle.style.fontSize = larger ? "36px" : "24px";
      particle.style.color = "white";
      particle.style.textShadow = "0 0 5px rgba(80, 201, 14, 0.7)";
      
      // Log details of first particle for debugging
      if (logDetails) {
        this.logger.info("freedom", `Creating particle type ${particleType} at (${xPos.toFixed(0)}, ${yPos.toFixed(0)}) for ${country}`);
        this.logger.info("freedom", `Country rect: (${countryRect.left.toFixed(0)}, ${countryRect.top.toFixed(0)}) ${countryRect.width.toFixed(0)}x${countryRect.height.toFixed(0)}`);
      }
      
      // Add particle to container
      container.appendChild(particle);
      
      // Play particle sound (occasionally)
      if (Math.random() < 0.3 && this.audioManager) { // 30% chance
        this.audioManager.playRandom("particles", "freedom");
      }
      
      // Animate and remove after animation completes
      setTimeout(() => {
        particle.remove();
      }, larger ? 3000 : 2000); // Longer duration for larger particles
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
        flagOverlay.style.opacity = 0;
      } else if (claims === 1) {
        flagOverlay.classList.add("opacity-33");
      } else if (claims === 2) {
        flagOverlay.classList.add("opacity-66");
      } else if (claims === 3) {
        flagOverlay.classList.add("opacity-100");
      }
    }
    
    // Apply a special effect to the flag when resistance happens
    applyFlagResistanceEffect(country) {
      const flagOverlay = document.getElementById(`${country}-flag-overlay`);
      if (!flagOverlay) {
        this.logger.error("freedom", `Flag overlay for ${country} not found!`);
        return;
      }
      
      // Add resistance effect to flag
      flagOverlay.classList.add('flag-resistance-effect');
      
      // Remove effect after animation completes
      setTimeout(() => {
        flagOverlay.classList.remove('flag-resistance-effect');
      }, 2000);
    }

    debugElementsStructure() {
  this.logger.info("freedom", "Debugging elements structure:");
  if (!this.elements) {
    this.logger.error("freedom", "No elements object provided!");
    return;
  }
  
  this.logger.info("freedom", "Available elements keys: " + Object.keys(this.elements).join(", "));
  
  if (this.elements.countries) {
    this.logger.info("freedom", "Available countries: " + Object.keys(this.elements.countries).join(", "));
  } else {
    this.logger.error("freedom", "No elements.countries object found!");
  }
}
    
    triggerResistanceEffect(country, major = false) {
        // Use elements object instead of getElementById
        const countryElement = this.elements.countries[country];
        if (!countryElement) {
          this.logger.error("freedom", `Country element ${country} not found in elements.countries!`);
          return;
        }
      
      // Add resistance effect class
      countryElement.classList.add(major ? 'major-resistance-effect' : 'resistance-effect');
      
      // Remove class after animation completes
      setTimeout(() => {
        countryElement.classList.remove(major ? 'major-resistance-effect' : 'resistance-effect');
      }, major ? 2000 : 1000);
    }
    
    // Forcibly set a country's claim level (for debugging)
    setCountryClaims(country, claimLevel) {
      if (!this.gameState.countries[country]) {
        this.logger.error("freedom", `Country ${country} not found in gameState`);
        return false;
      }
      
      // Set the claim level (between 0 and maxClaims)
      const maxClaims = this.gameState.countries[country].maxClaims;
      const newClaims = Math.max(0, Math.min(claimLevel, maxClaims));
      
      this.gameState.countries[country].claims = newClaims;
      this.logger.info("freedom", `Set ${country} claims to ${newClaims}`);
      
      // Update the flag overlay
      this.updateFlagOpacity(country);
      
      return true;
    }
    
    // Make a country fully annexed (for debugging)
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
      
      this.logger.info("freedom", `Fully annexed ${country}`);
      return true;
    }
    
    // Make a country ready for resistance (for debugging)
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
      
      this.logger.info("freedom", `${country} is now ready for resistance`);
      return true;
    }
    
    // Reset all freedom timers and claims
    reset() {
      this.logger.info("freedom", "Resetting freedom system");
      
      Object.keys(this.annexationTimers).forEach(country => {
        this.annexationTimers[country].fullAnnexTime = 0;
        this.annexationTimers[country].resistanceAvailable = false;
        
        // Remove any resistance-possible effects
        const countryElement = document.getElementById(country);
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
          flagOverlay.classList.remove("opacity-33", "opacity-66", "opacity-100", "flag-resistance-effect");
          flagOverlay.style.opacity = 0;
        }
      });
      
      // Clear all particles
      document.querySelectorAll('.resistance-particle, .resistance-uprising').forEach(element => {
        element.remove();
      });
    }
  }
  
  window.FreedomManager = FreedomManager;