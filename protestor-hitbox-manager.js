class ProtestorHitboxManager {
    constructor() {
      logger.info("protestor-hitbox", "Creating Protestor Hitbox Manager");
  
      // State tracking
      this.protestorHitboxes = {
        canada: { element: null, isVisible: false, scale: 1.0 },
        mexico: { element: null, isVisible: false, scale: 1.0 },
        greenland: { element: null, isVisible: false, scale: 1.0 },
      };
  
      this.isDebugMode = false;
  
      // Reference to the map element for scaling calculations
      this.mapElement = document.getElementById("map-background");
  
      // Calibrated at map scale: 0.24
      // Multiple spawn locations for each country (will be scaled based on map size)
      // These are the natural coordinates relative to the original map size
      this.spawnLocations = {
        canada: [
          {
            x: 1120,
            y: 1624,
            width: 295,
            height: 295,
            calibrationScale: 0.24,
          },
          {
            x: 980,
            y: 1520,
            width: 295,
            height: 295,
            calibrationScale: 0.24,
          },
          {
            x: 1250,
            y: 1480,
            width: 295,
            height: 295,
            calibrationScale: 0.24,
          },
        ],
        mexico: [
          {
            x: 1102,
            y: 2536,
            width: 300,
            height: 300,
            calibrationScale: 0.24,
          },
          {
            x: 1050,
            y: 2450,
            width: 300,
            height: 300,
            calibrationScale: 0.24,
          },
          {
            x: 1180,
            y: 2510,
            width: 300,
            height: 300,
            calibrationScale: 0.24,
          },
        ],
        greenland: [
          {
            x: 2192,
            y: 577,
            width: 300,
            height: 300,
            calibrationScale: 0.24,
          },
          {
            x: 2080,
            y: 520,
            width: 300,
            height: 300,
            calibrationScale: 0.24,
          },
          {
            x: 2300,
            y: 620,
            width: 300,
            height: 300,
            calibrationScale: 0.24,
          },
        ],
      };
  
      // Store currently selected coordinates for each country
      this.currentCoordinates = {};
  
      // Reference to the currently associated freedom manager
      this.freedomManager = null;
  
      // Initialize the manager
      this.init();
    }
  
    init() {
      logger.debug("protestor-hitbox", "Initializing protestor hitboxes");
  
      // Create container for hitboxes if it doesn't exist
      this.ensureHitboxContainer();
  
      // Select random spawn locations for each country
      this.selectRandomSpawnLocations();
  
      // Pre-create hitboxes but keep them hidden initially
      Object.keys(this.protestorHitboxes).forEach((countryId) => {
        this.createHitbox(countryId);
      });
  
      // Check if debug mode is enabled
      this.isDebugMode = document.body.classList.contains("debug-mode");
  
      // Set up resize listener
      window.addEventListener("resize", () => this.repositionAllHitboxes());
    }
  
    selectRandomSpawnLocations() {
      Object.keys(this.spawnLocations).forEach((countryId) => {
        const locations = this.spawnLocations[countryId];
        if (locations && locations.length > 0) {
          // Select a random location from the array
          const randomIndex = Math.floor(Math.random() * locations.length);
          this.currentCoordinates[countryId] = locations[randomIndex];
          
          logger.debug(
            "protestor-hitbox", 
            `Selected random spawn location ${randomIndex} for ${countryId}`
          );
        }
      });
    }
  
    // Select a new random spawn location for a specific country
    selectNewRandomSpawnLocation(countryId) {
      const locations = this.spawnLocations[countryId];
      if (locations && locations.length > 0) {
        const randomIndex = Math.floor(Math.random() * locations.length);
        this.currentCoordinates[countryId] = locations[randomIndex];
        
        logger.debug(
          "protestor-hitbox", 
          `Selected new random spawn location ${randomIndex} for ${countryId}`
        );
        
        // Reposition hitbox if it's visible
        if (this.protestorHitboxes[countryId].isVisible) {
          this.positionHitbox(countryId);
        }
      }
    }
  
    ensureHitboxContainer() {
      let container = document.getElementById("protestor-hitboxes-container");
  
      if (!container) {
        container = document.createElement("div");
        container.id = "protestor-hitboxes-container";
        container.style.position = "absolute";
        container.style.left = "0";
        container.style.top = "0";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.pointerEvents = "none";
        container.style.zIndex = "3005"; // Should match FreedomManager.Z_INDEXES.PROTESTORS
  
        // Add to game container
        const gameContainer = document.getElementById("game-container");
        if (gameContainer) {
          gameContainer.appendChild(container);
          logger.debug("protestor-hitbox", "Created protestor hitboxes container");
        } else {
          logger.error("protestor-hitbox", "Game container not found, cannot create hitbox container");
        }
      }
  
      this.container = container;
      return container;
    }
  
    createHitbox(countryId) {
      // Clean up any existing hitbox first
      this.removeHitbox(countryId);
  
      // Create new hitbox element
      const hitbox = document.createElement("div");
      hitbox.id = `${countryId}-protestor-hitbox`;
      hitbox.className = "protestor-hitbox";
      hitbox.style.position = "absolute";
      hitbox.style.pointerEvents = "all";
      hitbox.style.cursor = "pointer";
      hitbox.style.display = "none"; // Start hidden

      hitbox.setAttribute("role", "button");
hitbox.setAttribute("aria-label", `Support ${countryId.charAt(0).toUpperCase() + countryId.slice(1)} protestors`);
  
      // Add debug styling if in debug mode
      if (this.isDebugMode) {
        hitbox.style.border = "2px dashed red";
        hitbox.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
      }
  
      // Store reference to the element
      this.protestorHitboxes[countryId].element = hitbox;
      this.protestorHitboxes[countryId].scale = 1.0; // Reset scale
  
      // Add to container
      if (this.container) {
        this.container.appendChild(hitbox);
        logger.debug("protestor-hitbox", `Created protestor hitbox for ${countryId}`);
      }
  
      return hitbox;
    }
  
    removeHitbox(countryId) {
      const existingHitbox = this.protestorHitboxes[countryId].element;
      if (existingHitbox && existingHitbox.parentNode) {
        existingHitbox.parentNode.removeChild(existingHitbox);
        logger.debug("protestor-hitbox", `Removed existing protestor hitbox for ${countryId}`);
      }
      this.protestorHitboxes[countryId].element = null;
      this.protestorHitboxes[countryId].isVisible = false;
      this.protestorHitboxes[countryId].scale = 1.0;
    }
  
    showHitbox(countryId, freedomManager) {
      if (!this.protestorHitboxes[countryId]) {
        logger.error("protestor-hitbox", `Invalid country ID: ${countryId}`);
        return null;
      }
  
      // Store reference to the freedom manager for click handling
      this.freedomManager = freedomManager;
  
      // Create or ensure hitbox exists
      let hitbox = this.protestorHitboxes[countryId].element;
      if (!hitbox) {
        hitbox = this.createHitbox(countryId);
      }
  
      // Position the hitbox
      this.positionHitbox(countryId);
  
      // Make it visible
      hitbox.style.display = "block";
      this.protestorHitboxes[countryId].isVisible = true;
  
      // Add click handler that calls the freedomManager's handleProtestorClick
      this.setClickHandler(countryId, hitbox, freedomManager);
  
      logger.info("protestor-hitbox", `Showing protestor hitbox for ${countryId}`);
  
      return hitbox;
    }
  
    hideHitbox(countryId) {
      const hitboxInfo = this.protestorHitboxes[countryId];
      if (hitboxInfo && hitboxInfo.element) {
        hitboxInfo.element.style.display = "none";
        hitboxInfo.isVisible = false;
        logger.debug("protestor-hitbox", `Hidden protestor hitbox for ${countryId}`);
      }
    }
  
    positionHitbox(countryId) {
      const hitbox = this.protestorHitboxes[countryId].element;
      if (!hitbox) return;
  
      // Get the current coordinates for this country
      const baseCoords = this.currentCoordinates[countryId];
      if (!baseCoords) {
        logger.error("protestor-hitbox", `No coordinates defined for ${countryId}`);
        return;
      }
  
      // Get the map element
      const mapElement = document.getElementById("map-background");
      if (!mapElement) {
        logger.error("protestor-hitbox", "Map element not found");
        return;
      }
  
      // Get the map element's position and dimensions
      const mapRect = mapElement.getBoundingClientRect();
      const gameContainer = document.getElementById("game-container");
      const containerRect = gameContainer.getBoundingClientRect();
  
      // Calculate the map's offset within the game container
      const mapOffsetX = mapRect.left - containerRect.left;
      const mapOffsetY = mapRect.top - containerRect.top;
  
      // Current map scale relative to its natural size
      const currentMapScale = mapRect.width / mapElement.naturalWidth;
  
      // Get the hitbox scale (for growing with clicks)
      const hitboxScale = this.protestorHitboxes[countryId].scale || 1.0;
  
      // Scale the natural coordinates to the current display size
      const scaledX = baseCoords.x * currentMapScale;
      const scaledY = baseCoords.y * currentMapScale;
      const scaledWidth = baseCoords.width * currentMapScale * hitboxScale;
      const scaledHeight = baseCoords.height * currentMapScale * hitboxScale;
  
      // Center adjustment for growing hitbox
      const widthDiff = (scaledWidth - baseCoords.width * currentMapScale) / 2;
      const heightDiff = (scaledHeight - baseCoords.height * currentMapScale) / 2;
  
      // Position with centering adjustment, relative to the map's position
      hitbox.style.left = `${mapOffsetX + scaledX - widthDiff}px`;
      hitbox.style.top = `${mapOffsetY + scaledY - heightDiff}px`;
      hitbox.style.width = `${scaledWidth}px`;
      hitbox.style.height = `${scaledHeight}px`;
  
      // Log the positioning details for debugging
      console.log("Positioning details:", {
        countryId,
        baseCoords,
        currentMapScale,
        mapOffsetX,
        mapOffsetY,
        scaledX,
        scaledY,
        finalX: mapOffsetX + scaledX - widthDiff,
        finalY: mapOffsetY + scaledY - heightDiff,
      });
  
      logger.debug(
        "protestor-hitbox",
        `Positioned protestor hitbox for ${countryId} at map-relative (${scaledX}, ${scaledY}), absolute (${mapOffsetX + scaledX}, ${
          mapOffsetY + scaledY
        })`
      );
    }
  
    calculateScaleFactor(countryId) {
      if (!this.mapElement) {
        logger.error("protestor-hitbox", "Map element not found for scaling calculation");
        return 1.0;
      }
  
      // Calculate current map scale compared to natural size
      const currentMapScale = this.mapElement.clientWidth / this.mapElement.naturalWidth;
  
      // Use the calibration scale stored with the coordinates
      const baseCoords = this.currentCoordinates[countryId];
      const referenceScale = baseCoords.calibrationScale || 1.0;
  
      // Calculate the adjustment needed
      const scaleFactor = currentMapScale / referenceScale;
  
      // Add detailed logging
      console.log(`Protestor ${countryId} scaling:`, {
        currentMapScale,
        referenceScale,
        resultingScaleFactor: scaleFactor,
        baseX: baseCoords.x,
        baseY: baseCoords.y,
        scaledX: baseCoords.x * scaleFactor,
        scaledY: baseCoords.y * scaleFactor,
      });
  
      return scaleFactor;
    }
  
    scaleCoordinates(baseCoords, scaleFactor, hitboxScale = 1.0) {
      return {
        x: Math.round(baseCoords.x * scaleFactor),
        y: Math.round(baseCoords.y * scaleFactor),
        width: Math.round(baseCoords.width * scaleFactor * hitboxScale),
        height: Math.round(baseCoords.height * scaleFactor * hitboxScale),
      };
    }
  
    setClickHandler(countryId, hitbox, freedomManager) {
      // Remove existing event listeners to prevent duplicates
      const clone = hitbox.cloneNode(true);
      if (hitbox.parentNode) {
        hitbox.parentNode.replaceChild(clone, hitbox);
      }
  
      // Update reference
      this.protestorHitboxes[countryId].element = clone;
      hitbox = clone;
  
      // Create a logger function to inspect click events
      const logClick = (eventName, event) => {
        logger.info("protestor-hitbox", `${eventName} detected on protestor hitbox for ${countryId}`);
  
        // Log position data for debugging
        const rect = hitbox.getBoundingClientRect();
        const x = event.clientX || (event.touches && event.touches[0].clientX) || 0;
        const y = event.clientY || (event.touches && event.touches[0].clientY) || 0;
  
        logger.debug("protestor-hitbox", `Click coordinates: (${x}, ${y}), Hitbox: (${rect.left}, ${rect.top}, ${rect.width}, ${rect.height})`);
  
        // Check if click is within the bounds
        const isInside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  
        logger.debug("protestor-hitbox", `Click inside hitbox: ${isInside}`);
      };
  
      // Add click handler for desktop
      hitbox.addEventListener("click", (event) => {
        event.stopPropagation();
        logClick("Click", event);
  
        if (freedomManager && typeof freedomManager.handleProtestorClick === "function") {
          freedomManager.handleProtestorClick(countryId);
        } else {
          logger.error("protestor-hitbox", "Freedom manager or handler function not available");
        }
      });
  
      // Add touch handlers for mobile
      hitbox.addEventListener(
        "touchstart",
        (event) => {
          event.preventDefault();
          event.stopPropagation();
          logClick("Touch", event);
  
          if (freedomManager && typeof freedomManager.handleProtestorClick === "function") {
            freedomManager.handleProtestorClick(countryId);
          } else {
            logger.error("protestor-hitbox", "Freedom manager or handler function not available");
          }
        },
        { passive: false }
      );
    }
  
    updateSize(countryId, scaleFactor) {
      // Update the scale for this country
      const currentScale = this.protestorHitboxes[countryId].scale || 1.0;
      this.protestorHitboxes[countryId].scale = currentScale * scaleFactor;
  
      logger.debug("protestor-hitbox", `Updating scale for ${countryId} from ${currentScale} to ${this.protestorHitboxes[countryId].scale}`);
  
      // Reposition based on the new scale
      this.positionHitbox(countryId);
    }
  
    setDebugMode(enabled) {
      this.isDebugMode = enabled;
  
      // Update all existing hitboxes
      Object.keys(this.protestorHitboxes).forEach((countryId) => {
        const hitbox = this.protestorHitboxes[countryId].element;
        if (!hitbox) return;
  
        if (enabled) {
          hitbox.style.border = "2px dashed red";
          hitbox.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
        } else {
          hitbox.style.border = "none";
          hitbox.style.backgroundColor = "transparent";
        }
      });
  
      logger.debug("protestor-hitbox", `Debug mode ${enabled ? "enabled" : "disabled"} for protestor hitboxes`);
    }
  
    // Call this when the window is resized to reposition all visible hitboxes
    repositionAllHitboxes() {
      Object.keys(this.protestorHitboxes).forEach((countryId) => {
        if (this.protestorHitboxes[countryId].isVisible) {
          this.positionHitbox(countryId);
        }
      });
  
      logger.debug("protestor-hitbox", "Repositioned all visible protestor hitboxes");
    }
  
    // Clean up all hitboxes
    cleanupAll() {
      Object.keys(this.protestorHitboxes).forEach((countryId) => {
        this.removeHitbox(countryId);
      });
  
      logger.info("protestor-hitbox", "Cleaned up all protestor hitboxes");
    }
  }
  
  // Make available to window
  window.ProtestorHitboxManager = ProtestorHitboxManager;