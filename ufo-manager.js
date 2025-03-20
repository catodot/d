// UFO Animation Manager
class UfoManager {
  constructor() {
    this.elements = {
      ufo: null,
      elon: null,
      elonContainer: null
    };
    
    this.state = {
      isAnimating: false,
      autoSpawnEnabled: true,
      debugMode: false
    };
    
    this.timers = {
      animation: null,
      elonAnimation: null
    };
    
    // Configuration
    this.config = {
      intervals: {
        min: 60000,
        max: 80000
      },
      ufoSize: {
        min: 30,
        max: 480,
        current: 20
      },
      animation: {
        duration: {
          min: 5000,
          max: 10000
        },
        wobble: {
          frequency: {
            min: 5,
            max: 15
          },
          amplitude: {
            min: 5,
            max: 15
          }
        },
        rotation: {
          min: 45,
          max: 135
        }
      },
      elon: {
        frameDuration: 300,
        displayDuration: 4000,  // How long Elon stays visible before UFO appears
        fadeOutDuration: 9000   // How long Elon's fade out animation takes
      }
    };
  }

  init() {
    if (!this.elements.ufo) {
      this.createUfoElement();
    }

    if (this.state.autoSpawnEnabled) {
      this.scheduleNextUfo();
    }

    this.addToDebugPanel();
    
    // console.log("UFO Manager initialized");
    return this;
  }

  // Element creation methods
  createUfoElement() {
    this.elements.ufo = document.createElement("img");
    this.elements.ufo.src = "images/ufo.png";
    this.elements.ufo.id = "flying-ufo";
    this.elements.ufo.alt = "UFO";
    this.elements.ufo.style.position = "absolute";
    this.elements.ufo.style.width = `${this.config.ufoSize.min}px`;
    this.elements.ufo.style.height = "auto";
    this.elements.ufo.style.zIndex = "9";
    this.elements.ufo.style.opacity = "0";
    this.elements.ufo.style.transition = "opacity 0.5s ease";
    this.elements.ufo.style.pointerEvents = "none";

    this.elements.ufo.setAttribute("aria-hidden", "true"); // Hide UFO from screen readers


    const gameScreen = document.getElementById("game-screen");
    gameScreen.appendChild(this.elements.ufo);

    // console.log("UFO element created");
  }

  createElonElement() {
    // Get map background element for positioning
    const mapBackground = document.getElementById("map-background");
    if (!mapBackground) {
      console.error("Map background not found");
      return false;
    }

    // Get map position and dimensions
    const mapRect = mapBackground.getBoundingClientRect();

    // Create a wrapper div for animation
    const wrapper = document.createElement("div");
    wrapper.id = "elon-wrapper";
    wrapper.style.position = "absolute";
    wrapper.style.left = `${mapRect.left}px`;
    wrapper.style.top = `${mapRect.top}px`;
    wrapper.style.width = `${mapRect.width}px`;
    wrapper.style.height = `${mapRect.height}px`;
    wrapper.style.zIndex = "999";
    wrapper.style.pointerEvents = "none";

    document.getElementById("game-screen").appendChild(wrapper);

    // Create image element with sprite sheet
    this.elements.elon = document.createElement("div");
    this.elements.elon.id = "elon-sprite";
    this.elements.elon.style.width = "90%";
    this.elements.elon.style.height = "90%";
    this.elements.elon.style.backgroundImage = 'url("images/musk.png")';
    this.elements.elon.style.backgroundSize = "200% 100%";
    this.elements.elon.style.backgroundPosition = "0% 0%";
    this.elements.elon.style.backgroundRepeat = "no-repeat";
    this.elements.elon.style.opacity = "0";
    this.elements.elon.style.transformOrigin = "bottom right";
    this.elements.elon.style.transform = "scale(0.2)";
    this.elements.elon.style.transition = "opacity 0.8s ease, transform 0.8s cubic-bezier(0.18, 1.25, 0.4, 1.1)";

    this.elements.elon.setAttribute("aria-hidden", "true"); // Hide Elon from screen readers


    wrapper.appendChild(this.elements.elon);
    this.elements.elonContainer = wrapper;
    
    return true;
  }

  // Animation scheduling methods
  scheduleNextUfo() {
    if (!this.state.autoSpawnEnabled) return;

    if (this.timers.animation) {
      clearTimeout(this.timers.animation);
    }

    const interval = this.getRandomInterval();
    
    this.timers.animation = setTimeout(() => {
      if (this.state.autoSpawnEnabled) {
        this.flyUfo();
      }
    }, interval);

    if (this.state.debugMode) {
      console.log(`Next UFO scheduled in ${(interval / 1000).toFixed(1)} seconds`);
    }
  }
  
  getRandomInterval() {
    return Math.floor(
      Math.random() * 
      (this.config.intervals.max - this.config.intervals.min)
    ) + this.config.intervals.min;
  }



  animateElonAppearance() {
    setTimeout(() => {
      if (this.elements.elon) {
        this.elements.elon.style.opacity = "1";
        this.elements.elon.style.transform = "scale(1)";
      }
    }, 100);
  }

  startElonSpriteAnimation() {
    let currentFrame = 0;
    
    if (this.timers.elonAnimation) {
      clearInterval(this.timers.elonAnimation);
    }

    this.timers.elonAnimation = setInterval(() => {
      if (!this.elements.elon) {
        clearInterval(this.timers.elonAnimation);
        return;
      }

      currentFrame = currentFrame === 0 ? 1 : 0;
      const position = currentFrame * 100;
      this.elements.elon.style.backgroundPosition = `${position}% 0%`;
    }, this.config.elon.frameDuration);
  }



  stopElonAnimation() {
    if (this.timers.elonAnimation) {
      clearInterval(this.timers.elonAnimation);
      this.timers.elonAnimation = null;
      console.log("Cleared Elon animation interval");
    }
  }



  removeElonAfterFade() {
    // No need for additional timeout here since we're already delaying in finishUfoAnimation()
    try {
      if (this.elements.elonContainer && this.elements.elonContainer.parentNode) {
        this.elements.elonContainer.parentNode.removeChild(this.elements.elonContainer);
        console.log("Removed Elon wrapper from DOM");
      }
    } catch (e) {
      console.error("Error removing Elon wrapper:", e);
    }
    
    this.elements.elon = null;
    this.elements.elonContainer = null;
  }
  cleanupOrphanedElements() {
    const elementsToCleanup = ["elon-sprite", "elon-wrapper", "simple-elon"];

    elementsToCleanup.forEach((id) => {
      const elements = document.querySelectorAll(`#${id}`);
      if (elements.length > 0) {
        elements.forEach((el, index) => {
          try {
            if (el && el.parentNode) {
              el.parentNode.removeChild(el);
              console.log(`Removed orphaned element #${id}`);
            }
          } catch (e) {
            console.error(`Error removing orphaned element #${id}:`, e);
          }
        });
      }
    });

    const possibleOrphanContainers = document.querySelectorAll('[id*="elon"]');
    if (possibleOrphanContainers.length > 0) {
      possibleOrphanContainers.forEach((el) => {
        if (el.id !== "elon-wrapper" && el.id !== "elon-sprite" && el.id !== "simple-elon") {
          try {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
              console.log(`Removed additional element with ID ${el.id}`);
            }
          } catch (e) {
            console.error(`Error removing additional element with ID ${el.id}:`, e);
          }
        }
      });
    }
  }

  // UFO animation methods
  flyUfo() {
    if (this.state.isAnimating) return;
    this.state.isAnimating = true;

    if (this.isGameHidden()) {
      this.state.isAnimating = false;
      this.scheduleNextUfo();
      return;
    }

    // First, show Elon Musk
    this.showElonMusk();

    // Wait longer for Elon to be visible before showing UFO
    // Give Elon time to appear and animate before the UFO
    setTimeout(() => {
      this.startUfoAnimation();
    }, this.config.elon.displayDuration); // Use the configurable displayDuration
  }

  startUfoAnimation() {
    // Get viewport dimensions and flight positions
    const viewport = this.getViewportDimensions();
    const { start, end } = this.getUfoFlightPositions(viewport);
    const controlPoints = this.generateControlPoints(viewport);
    
    // Reset UFO size
    this.config.ufoSize.current = this.config.ufoSize.min;
    this.elements.ufo.style.width = `${this.config.ufoSize.current}px`;

    // Position the UFO at the starting point
    this.elements.ufo.style.left = `${start.x}px`;
    this.elements.ufo.style.top = `${start.y}px`;
    this.elements.ufo.style.opacity = "1";

    // Animation settings
    const animation = {
      rotateClockwise: Math.random() > 0.5,
      maxRotation: this.config.animation.rotation.min + Math.random() * 
                  (this.config.animation.rotation.max - this.config.animation.rotation.min),
      duration: this.config.animation.duration.min + Math.random() * 
               (this.config.animation.duration.max - this.config.animation.duration.min),
      wobble: {
        frequency: this.config.animation.wobble.frequency.min + Math.random() * 
                  (this.config.animation.wobble.frequency.max - this.config.animation.wobble.frequency.min),
        amplitude: this.config.animation.wobble.amplitude.min + Math.random() * 
                  (this.config.animation.wobble.amplitude.max - this.config.animation.wobble.amplitude.min)
      }
    };

    const startTime = performance.now();

    const animateUfo = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / animation.duration, 1);

      if (progress < 1) {
        this.updateUfoPosition(progress, start, end, controlPoints, animation);
        requestAnimationFrame(animateUfo);
      } else {
        this.finishUfoAnimation();
      }
    };

    requestAnimationFrame(animateUfo);
  }
  
  updateUfoPosition(progress, start, end, controlPoints, animation) {
    // Calculate position using bezier curve with control points
    const position = this.getBezierPoint(progress, start, end, controlPoints);

    // Add wobble
    position.y += Math.sin(progress * animation.wobble.frequency) * animation.wobble.amplitude;

    // Calculate size - grows in middle, shrinks at ends
    const sizeFactor = 4 * progress * (1 - progress); // parabolic curve peaking at 0.5
    const sizeRange = this.config.ufoSize.max - this.config.ufoSize.min;
    this.config.ufoSize.current = this.config.ufoSize.min + sizeFactor * sizeRange;

    // Set position and size
    this.elements.ufo.style.left = `${position.x}px`;
    this.elements.ufo.style.top = `${position.y}px`;
    this.elements.ufo.style.width = `${this.config.ufoSize.current}px`;

    // Apply rotation with wobble
    const rotationAmount = progress * animation.maxRotation;
    const rotation = animation.rotateClockwise ? rotationAmount : -rotationAmount;
    const rotationWobble = Math.sin(progress * animation.wobble.frequency * 1.5) * 5;
    this.elements.ufo.style.transform = `rotate(${rotation + rotationWobble}deg)`;
  }



// Add new method to clean up existing elements without removing new ones
cleanupExistingElonElements() {
  console.log("Cleaning up existing Elon elements");
  
  // First stop animations
  this.stopElonAnimation();
  
  // Remove existing elements immediately
  try {
    this.removeElonAfterFade();
    this.cleanupOrphanedElements();
  } catch (e) {
    console.error("Error during Elon cleanup:", e);
  }
}

// Modify this to be triggered manually when needed
cleanupElonElements(withTumble = false) {
  console.log("Scheduling Elon elements cleanup");
  
  // First stop animations
  this.stopElonAnimation();
  
  if (withTumble && this.elements.elon) {
    // Do the tumbling animation
    this.fadeOutElonElement();
  }
  
  // Add a proper delay before removing elements
  setTimeout(() => {
    try {
      this.removeElonAfterFade();
      this.cleanupOrphanedElements();
      console.log("Elon cleanup completed");
    } catch (e) {
      console.error("Error during Elon cleanup:", e);
    }
  }, this.config.elon.fadeOutDuration); // Use the configured fadeout duration
}

fadeOutElonElement() {
  if (this.elements.elon) {
    // Change transform origin to center
    this.elements.elon.style.transformOrigin = "center center";
    
    // Faster opacity fade, slower falling motion
    this.elements.elon.style.transition = "opacity 0.8s ease, transform 2.5s cubic-bezier(0.4, 0.1, 0.2, 1)";
    
    // Short timeout to ensure the new properties are applied
    setTimeout(() => {
      this.elements.elon.style.transform = "scale(0) translate(0px, 300px) rotate(-360deg)";
      this.elements.elon.style.opacity = "0";
    }, 10);
    
    console.log("Elon tumbling away");
  }
}

// Add automatic cleanup after a timeout when showing Elon by itself
showElonMusk(autoCleanup = false) {
  console.log("showElonMusk called - attempting to show Elon Musk");

  if (this.isGameHidden()) {
    console.log("Game screen is hidden, not showing Elon");
    return;
  }

  // Don't clean up elements when we're first showing Elon
  // Only clean up existing elements if there are any
  if (document.getElementById("elon-wrapper")) {
    this.cleanupExistingElonElements();
  }
  
  if (!this.createElonElement()) {
    return;
  }

  this.animateElonAppearance();
  this.startElonSpriteAnimation();

  // Add auto cleanup option for standalone test
  if (autoCleanup) {
    setTimeout(() => {
      this.cleanupElonElements(true); // Clean up with tumble after display duration
    }, this.config.elon.displayDuration + 5000); // Add extra 5 seconds to display duration for standalone test
  }

  console.log("Started Elon animation with pop-up effect and continuous looping");
}

// Modify the test button to enable auto cleanup
createDebugControls() {
  // Create UFO debug section
  const heading = document.createElement("h3");
  heading.textContent = "UFO Controls";
  heading.style.marginTop = "15px";

  const container = document.createElement("div");
  container.id = "ufo-debug-controls";
  container.style.marginBottom = "10px";

  // Create test button
  container.appendChild(this.createButton("Test UFO Flight", () => this.flyUfo()));

  // Create toggle button
  const toggleButton = this.createButton(
    this.state.autoSpawnEnabled ? "Disable Auto UFO" : "Enable Auto UFO", 
    () => {
      const enabled = this.toggleAutoSpawn();
      toggleButton.textContent = enabled ? "Disable Auto UFO" : "Enable Auto UFO";
    }
  );
  container.appendChild(toggleButton);

  // Add Elon Musk test button with tumble option
  container.appendChild(this.createButton("Test Elon Only", () => {
    // Set autoCleanup to true for the test button
    this.showElonMusk(true);
    
    // Still add the manual tumble button for immediate control
    setTimeout(() => {
      // First check if the button already exists
      if (!document.getElementById("tumble-elon-button")) {
        const tumbleButton = this.createButton("Tumble Elon Away Now", () => {
          this.cleanupElonElements(true); // true means with tumble animation
        });
        tumbleButton.id = "tumble-elon-button";
        container.appendChild(tumbleButton);
      }
    }, 500);
  }));

  // Add cleanup button
  container.appendChild(this.createButton("Clean Up Elements", () => this.cleanupElonElements(false)));

  return { heading, container };
}

finishUfoAnimation() {
  this.elements.ufo.style.opacity = "0";
  
  // Initiate Elon tumbling downward animation
  if (this.elements.elon) {
    this.fadeOutElonElement();
    
    // Only remove Elon after the fadeout completes
    setTimeout(() => {
      this.cleanupElonElements(false); // false means no tumble since we already did it
    }, this.config.elon.fadeOutDuration + 100);
  }
  
  this.state.isAnimating = false;
  this.scheduleNextUfo();
}

  getViewportDimensions() {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  getUfoFlightPositions(viewport) {
    // Random starting position (off-screen)
    const startSide = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let start = this.getPositionFromSide(startSide, viewport);

    // Random ending position (off-screen)
    // Don't exit on the same side as entry for more interesting paths
    const endSide = (startSide + 1 + Math.floor(Math.random() * 2)) % 4;
    let end = this.getPositionFromSide(endSide, viewport);

    return { start, end };
  }
  
  getPositionFromSide(side, viewport) {
    const ufoSize = this.config.ufoSize.min;
    
    switch (side) {
      case 0: // top
        return { 
          x: Math.random() * viewport.width,
          y: -ufoSize 
        };
      case 1: // right
        return { 
          x: viewport.width + ufoSize,
          y: Math.random() * viewport.height 
        };
      case 2: // bottom
        return { 
          x: Math.random() * viewport.width,
          y: viewport.height + ufoSize 
        };
      case 3: // left
        return { 
          x: -ufoSize,
          y: Math.random() * viewport.height 
        };
    }
  }

  generateControlPoints(viewport) {
    const numControlPoints = Math.floor(Math.random() * 3) + 2;
    const controlPoints = [];
    const margin = 100;

    for (let i = 0; i < numControlPoints; i++) {
      const cpX = Math.random() * (viewport.width + 2 * margin) - margin;
      const cpY = Math.random() * (viewport.height + 2 * margin) - margin;
      controlPoints.push({ x: cpX, y: cpY });
    }

    return controlPoints;
  }

  // Bezier curve calculation
  getBezierPoint(t, start, end, controlPoints) {
    const points = [start, ...controlPoints, end];

    while (points.length > 1) {
      const newPoints = [];
      for (let i = 0; i < points.length - 1; i++) {
        newPoints.push({
          x: (1 - t) * points[i].x + t * points[i + 1].x,
          y: (1 - t) * points[i].y + t * points[i + 1].y,
        });
      }
      points.length = 0;
      points.push(...newPoints);
    }

    return points[0];
  }

  // Utility methods
  isGameHidden() {
    const gameScreen = document.getElementById("game-screen");
    return gameScreen && gameScreen.classList.contains("hidden");
  }

  toggleAutoSpawn() {
    this.state.autoSpawnEnabled = !this.state.autoSpawnEnabled;

    if (this.state.autoSpawnEnabled) {
      this.scheduleNextUfo();
    } else if (this.timers.animation) {
      clearTimeout(this.timers.animation);
      this.timers.animation = null;
    }

    return this.state.autoSpawnEnabled;
  }

  setDebugMode(enabled) {
    this.state.debugMode = enabled;
  }

  // Debug panel integration
  addToDebugPanel() {
    setTimeout(() => {
      const debugPanel = document.getElementById("debug-panel");
      if (!debugPanel) {
        console.log("Debug panel not found, UFO debug controls not added");
        return;
      }

      const controls = this.createDebugControls();
      debugPanel.appendChild(controls.heading);
      debugPanel.appendChild(controls.container);
          }, 1000);
  }
  

  
  createButton(text, clickHandler) {
    const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", clickHandler);
    return button;
  }

  // Add to UfoManager class
destroy() {
  // Cancel all timers
  if (this.timers.animation) {
    clearTimeout(this.timers.animation);
    this.timers.animation = null;
  }
  
  if (this.timers.elonAnimation) {
    clearInterval(this.timers.elonAnimation);
    this.timers.elonAnimation = null;
  }
  
  // Hide the UFO element
  if (this.elements.ufo) {
    this.elements.ufo.style.opacity = "0";
  }

  
  
  // Clean up Elon
  this.cleanupElonElements();
  
  // Disable auto spawning
  this.state.autoSpawnEnabled = false;
  this.state.isAnimating = false;
  
  console.log("UFO Manager destroyed");
}
}

// Initialize when the document is ready
document.addEventListener("DOMContentLoaded", function () {
  // Create and initialize the UFO manager
  window.ufoManager = new UfoManager().init();

  // Add UFO initialization to the game's init function if it exists
  const originalInit = window.init;
  if (typeof originalInit === "function") {
    window.init = function () {
      originalInit.apply(this, arguments);

      // Make sure UFO manager is initialized
      if (!window.ufoManager) {
        window.ufoManager = new UfoManager().init();
      }
    };
  }
});