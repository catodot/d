// UFO Animation Manager
class UFOManager {
  constructor(audioManager, options = {}) {
    this.audioManager = audioManager;
    this.elements = {
      ufo: null,
      elon: null,
      elonContainer: null,
    };

    this.state = {
      isAnimating: false,
      autoSpawnEnabled: true,
      debugMode: false,
    };

    this.timers = {
      animation: null,
      elonAnimation: null,
    };

    // Configuration
    this.config = {
      intervals: {
        min: 60000, //60 seconds (1 minute) gap
        max: 80000, //80 seconds (1 minute and 20 seconds)  - calculate a random wait time between 60-80 seconds before showing Elon again
      },
      ufoSize: {
        min: 30,
        max: 480,
        current: 20,
      },
      animation: {
        duration: {
          min: 5000,
          max: 10000,
        },
        wobble: {
          frequency: {
            min: 5,
            max: 15,
          },
          amplitude: {
            min: 5,
            max: 15,
          },
        },
        rotation: {
          min: 45,
          max: 135,
        },
      },
      elon: {
        frameDuration: 300,
        displayDuration: 400, // How long Elon stays visible before UFO appears
        fadeOutDuration: 9000, // How long Elon's fade out animation takes
      },
    };

    this.handleKeyboardEvent = this.handleKeyboardEvent.bind(this);

    this.elonHitboxManager = null;
  }

  handleKeyboardEvent(event) {
    // Check if 'e' key is pressed
    if (event.key.toLowerCase() === "e") {
      // Prevent default action
      event.preventDefault();

      // Only show Elon if not already animating
      if (!this.state.isAnimating) {
        this.showElonMusk(true);
      }
    }
  }

  init(gameEngine) {
    if (!this.elements.ufo) {
      this.createUfoElement();
    }
  
    // Store reference to the game engine
    this.gameEngine = gameEngine;
  
    if (this.state.autoSpawnEnabled) {
      // Add a minimum delay before starting the spawning mechanism
      setTimeout(() => {
        this.scheduleNextUfo();
      }, 20000); // 20s delay
    }
  
  
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

  scheduleNextUfo() {
    if (!this.state.autoSpawnEnabled) return;
    
    // Don't schedule if game isn't playing
    if (this.gameEngine && (!this.gameEngine.systems.state.isPlaying || this.gameEngine.systems.state.isPaused)) {
      // console.log("Game paused or not playing, delaying UFO scheduling");
      // Try again in 5 seconds
      if (this.timers.animation) {
        clearTimeout(this.timers.animation);
      }
      this.timers.animation = setTimeout(() => this.scheduleNextUfo(), 5000);
      return;
    }
    
    const interval = this.getRandomInterval();

    this.timers.animation = setTimeout(() => {
      if (this.state.autoSpawnEnabled) {
        this.flyUfo();
      }
    }, interval);

    if (this.state.debugMode) {
      // console.log(`Next UFO scheduled in ${(interval / 1000).toFixed(1)} seconds`);
    }
  }


  pause() {
    // Pause UFO spawning and movement
    this.state.autoSpawnEnabled = false;
    // Pause any active UFOs
    this.pauseActiveUFOs();
  }
  
  resume() {
    // Restore UFO spawning
    this.state.autoSpawnEnabled = true;
    // Resume any paused UFOs
    this.resumeActiveUFOs();
  }

  getRandomInterval() {
    return Math.floor(Math.random() * (this.config.intervals.max - this.config.intervals.min)) + this.config.intervals.min;
  }

  animateElonAppearance() {
    setTimeout(() => {
      if (this.elements.elon) {
        // Explicitly set transform origin to bottom center
        this.elements.elon.style.transformOrigin = "bottom center";

        // Start from bottom, scaled down, and slightly pushed up
        this.elements.elon.style.transform = "scale(0) translateY(100%)";
        this.elements.elon.style.opacity = "0";

        // Short timeout to ensure initial state is set
        requestAnimationFrame(() => {
          // Grow up with a bouncy effect
          this.elements.elon.style.transition = "all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
          this.elements.elon.style.transform = "scale(1) translateY(0)";
          this.elements.elon.style.opacity = "1";
        });
      }
    }, 100);
  }

  // startElonSpriteAnimation() {
  //   let currentFrame = 0;

  //   if (this.timers.elonAnimation) {
  //     clearInterval(this.timers.elonAnimation);
  //   }

  //   // Instead of using backgroundPosition, we'll use two separate div elements
  //   // Create two elements for each frame if they don't exist
  //   if (!this.elements.elonFrame0 && !this.elements.elonFrame1) {
  //     // Clone the original element to create frame containers
  //     this.elements.elonFrame0 = this.elements.elon.cloneNode(false);
  //     this.elements.elonFrame0.id = "elon-frame-0";
  //     this.elements.elonFrame0.style.backgroundPosition = "0% 0%";

  //     this.elements.elonFrame1 = this.elements.elon.cloneNode(false);
  //     this.elements.elonFrame1.id = "elon-frame-1";
  //     this.elements.elonFrame1.style.backgroundPosition = "100% 0%";
  //     this.elements.elonFrame1.style.display = "none";

  //     // Add both frames to the parent
  //     this.elements.elon.appendChild(this.elements.elonFrame0);
  //     this.elements.elon.appendChild(this.elements.elonFrame1);
  //   }

  //   this.timers.elonAnimation = setInterval(() => {
  //     if (!this.elements.elon) {
  //       clearInterval(this.timers.elonAnimation);
  //       return;
  //     }

  //     // Toggle frame
  //     currentFrame = currentFrame === 0 ? 1 : 0;

  //     // Show current frame, hide the other
  //     if (currentFrame === 0) {
  //       this.elements.elonFrame0.style.display = "block";
  //       this.elements.elonFrame1.style.display = "none";
  //     } else {
  //       this.elements.elonFrame0.style.display = "none";
  //       this.elements.elonFrame1.style.display = "block";
  //     }
  //   }, this.config.elon.frameDuration);
  // }

  stopElonAnimation() {
    if (this.timers.elonAnimation) {
      clearInterval(this.timers.elonAnimation);
      this.timers.elonAnimation = null;
      // console.log("Cleared Elon animation interval");
    }
  }

  cleanupElonElements(options = {}) {
    // console.log("Cleaning up Elon elements");

    // Stop animations first
    this.stopElonAnimation();

    // Apply cartoony disappear animation
    if (options.withTumble && this.elements.elon) {
      // Use spring physics for a bouncy effect
      this.elements.elon.style.transition = `transform 1.2s cubic-bezier(.17,.67,.4,1.8)`;

      // Initial "squish up" before the jump
      setTimeout(() => {
        this.elements.elon.style.transform = `scale(1.2, 0.8) translateY(10px)`;
      }, 10);

      // Then big bounce up and rotate
      setTimeout(() => {
        this.elements.elon.style.transform = `scale(0.8) translate(120px, -300px) rotate(30deg)`;
        // Only start fading after the bounce starts
        this.elements.elon.style.transition = `transform 1s cubic-bezier(.17,.67,.4,1.8), opacity 0.3s ease`;
        this.elements.elon.style.opacity = "0.9";
      }, 150);

      // Final disappear with spin
      setTimeout(() => {
        this.elements.elon.style.transform = `scale(0.2) translate(350px, -500px) rotate(720deg)`;
        this.elements.elon.style.opacity = "0";
      }, 400);

      // console.log("Elon bouncing away with cartoon physics");
    }

    // Remove elements after delay
    const removeDelay = options.withTumble ? 1500 : 0;

    setTimeout(() => {
      try {
        // Remove wrapper if it exists
        if (this.elements.elonContainer && this.elements.elonContainer.parentNode) {
          this.elements.elonContainer.parentNode.removeChild(this.elements.elonContainer);
          // console.log("Removed Elon wrapper from DOM");
        }

        // Clear element references
        this.elements.elon = null;
        this.elements.elonContainer = null;

        // Find and remove orphaned elements
        const elementsToCleanup = ["elon-sprite", "elon-wrapper", "simple-elon"];
        elementsToCleanup.forEach((id) => {
          const elements = document.querySelectorAll(`#${id}`);
          if (elements.length > 0) {
            elements.forEach((el) => {
              if (el && el.parentNode) {
                el.parentNode.removeChild(el);
                // console.log(`Removed orphaned element #${id}`);
              }
            });
          }
        });

        // Find and remove any other elements with elon in the ID
        const possibleOrphanContainers = document.querySelectorAll('[id*="elon"]');
        if (possibleOrphanContainers.length > 0) {
          possibleOrphanContainers.forEach((el) => {
            if (el.id !== "elon-wrapper" && el.id !== "elon-sprite" && el.id !== "simple-elon") {
              if (el.parentNode) {
                el.parentNode.removeChild(el);
                // console.log(`Removed additional element with ID ${el.id}`);
              }
            }
          });
        }
      } catch (e) {
        console.error("Error during Elon cleanup:", e);
      }
    }, removeDelay);
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
              // console.log(`Removed orphaned element #${id}`);
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
              // console.log(`Removed additional element with ID ${el.id}`);
            }
          } catch (e) {
            console.error(`Error removing additional element with ID ${el.id}:`, e);
          }
        }
      });
    }
  }

  _isGameOver() {
    // Check if the game's state indicates it's over
    return document.body.classList.contains("game-over") || (window.gameEngine && window.gameEngine.gameOver);
  }

  // UFO animation methods
  flyUfo() {
    if (this.state.isAnimating || this._isGameOver()) return;
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
    if (this.audioManager) {
      // Resume audio context first for mobile Safari
      if (typeof this.audioManager.resumeAudioContext === 'function') {
        this.audioManager.resumeAudioContext().then(() => {
          this.audioManager.play("ui", "aliens", 0.8);
        });
      } else {
        // Fallback if resumeAudioContext doesn't exist
        this.audioManager.play("ui", "aliens", 0.8);
      }
    }
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
      maxRotation: this.config.animation.rotation.min + Math.random() * (this.config.animation.rotation.max - this.config.animation.rotation.min),
      duration: this.config.animation.duration.min + Math.random() * (this.config.animation.duration.max - this.config.animation.duration.min),
      wobble: {
        frequency:
          this.config.animation.wobble.frequency.min +
          Math.random() * (this.config.animation.wobble.frequency.max - this.config.animation.wobble.frequency.min),
        amplitude:
          this.config.animation.wobble.amplitude.min +
          Math.random() * (this.config.animation.wobble.amplitude.max - this.config.animation.wobble.amplitude.min),
      },
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

      // console.log("Elon tumbling away");
    }
  }

  showElonMusk(autoCleanup = false) {
    // console.log("showElonMusk called - attempting to show Elon Musk");

    if (this.isGameHidden()) {
      // console.log("Game screen is hidden, not showing Elon");
      return;
    }

    // Clean up any existing Elon elements and hitboxes
    if (document.getElementById("elon-wrapper")) {
      this.cleanupElonElements({ immediate: true });
    }

    // Destroy previous hitbox if it exists
    if (this.elonHitboxManager) {
      this.elonHitboxManager.destroy();
      this.elonHitboxManager = null;
    }

    if (!this.createElonElement()) {
      return;
    }

    // Play appearance sound
    // if (window.audioManager) {
    //   window.audioManager.play("ui", "musk");
    // }

    if (this.audioManager) {
      // Resume audio context first for mobile Safari
      if (typeof this.audioManager.resumeAudioContext === 'function') {
        this.audioManager.resumeAudioContext().then(() => {
          this.audioManager.play("ui", "musk", 0.8);
        });
      } else {
        // Fallback if resumeAudioContext doesn't exist
        this.audioManager.play("ui", "musk", 0.8);
      }
    }
    // Create hitbox for Elon
    this.createElonHitbox();

    this.animateElonAppearance();
    this.startElonSpriteAnimation();

    // Add auto cleanup option for standalone test
    if (autoCleanup) {
      setTimeout(() => {
        this.cleanupElonMusk(); // New method to clean up both Elon and his hitbox
      }, this.config.elon.displayDuration + 5000);
    }

    // console.log("Started Elon animation with pop-up effect and continuous looping");
  }

  createElonElement() {
    const mapBackground = document.getElementById("map-background");
    const gameContainer = document.getElementById("game-container");

    if (!mapBackground || !gameContainer) {
      console.error("Required elements not found for Elon positioning");
      return false;
    }

    const mapRect = mapBackground.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    const wrapper = document.createElement("div");
    wrapper.id = "elon-wrapper";
    wrapper.style.position = "absolute";
    wrapper.style.left = `${mapRect.left - containerRect.left}px`;
    wrapper.style.top = `${mapRect.top - containerRect.top}px`;
    wrapper.style.width = `${mapRect.width}px`;
    wrapper.style.height = `${mapRect.height}px`;
    wrapper.style.zIndex = "999";
    wrapper.style.pointerEvents = "none";

    gameContainer.appendChild(wrapper);

    // Create a container element for Elon
    this.elements.elon = document.createElement("div");
    this.elements.elon.id = "elon-sprite";

    const spriteSize = Math.round(mapRect.width * 0.2);
    this.elements.elon.style.width = `${spriteSize}px`;
    this.elements.elon.style.height = `${spriteSize}px`;
    this.elements.elon.style.position = "absolute";

    // Fixed pixel value positioning
    const leftPos = Math.round(mapRect.width * 0.15);
    const topPos = Math.round(mapRect.height * 0.05);

    this.elements.elon.style.left = `${leftPos}px`;
    this.elements.elon.style.top = `${topPos}px`;
    this.elements.elon.style.opacity = "0";
    this.elements.elon.style.transformOrigin = "bottom center";
    this.elements.elon.style.transform = "scale(0.2)";
    this.elements.elon.style.transition = "opacity 0.8s ease, transform 0.8s cubic-bezier(0.18, 1.25, 0.4, 1.1)";

    // Create two separate image elements for the frames
    this.elements.elonFrame0 = document.createElement("div");
    this.elements.elonFrame0.id = "elon-frame-0";
    this.elements.elonFrame0.style.width = "100%";
    this.elements.elonFrame0.style.height = "100%";
    this.elements.elonFrame0.style.backgroundImage = 'url("images/musk.png")';
    this.elements.elonFrame0.style.backgroundSize = "200% 100%";
    this.elements.elonFrame0.style.backgroundPosition = "0% 0%";
    this.elements.elonFrame0.style.backgroundRepeat = "no-repeat";
    this.elements.elonFrame0.style.position = "absolute";
    this.elements.elonFrame0.style.top = "0";
    this.elements.elonFrame0.style.left = "0";

    this.elements.elonFrame1 = document.createElement("div");
    this.elements.elonFrame1.id = "elon-frame-1";
    this.elements.elonFrame1.style.width = "100%";
    this.elements.elonFrame1.style.height = "100%";
    this.elements.elonFrame1.style.backgroundImage = 'url("images/musk.png")';
    this.elements.elonFrame1.style.backgroundSize = "200% 100%";
    this.elements.elonFrame1.style.backgroundPosition = "100% 0%";
    this.elements.elonFrame1.style.backgroundRepeat = "no-repeat";
    this.elements.elonFrame1.style.position = "absolute";
    this.elements.elonFrame1.style.top = "0";
    this.elements.elonFrame1.style.left = "0";
    this.elements.elonFrame1.style.display = "none";

    // Add both frames to the container
    this.elements.elon.appendChild(this.elements.elonFrame0);
    this.elements.elon.appendChild(this.elements.elonFrame1);

    // Add the container to the wrapper
    wrapper.appendChild(this.elements.elon);
    this.elements.elonContainer = wrapper;

    // Store original position for reference
    this.elonOriginalPosition = {
      left: leftPos,
      top: topPos,
    };

    // console.log("Elon element created with separate frame elements");
    return true;
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

      // Toggle frame
      currentFrame = currentFrame === 0 ? 1 : 0;

      // Show current frame, hide the other
      if (currentFrame === 0) {
        this.elements.elonFrame0.style.display = "block";
        this.elements.elonFrame1.style.display = "none";
      } else {
        this.elements.elonFrame0.style.display = "none";
        this.elements.elonFrame1.style.display = "block";
      }
    }, this.config.elon.frameDuration);
  }

  cleanupElonElements(options = {}) {
    // console.log("Cleaning up Elon elements");

    // Stop animations first
    this.stopElonAnimation();

    // Apply cartoony disappear animation
    if (options.withTumble && this.elements.elon) {
      // Use spring physics for a bouncy effect
      this.elements.elon.style.transition = `transform 1.2s cubic-bezier(.17,.67,.4,1.8)`;

      // Initial "squish up" before the jump
      setTimeout(() => {
        this.elements.elon.style.transform = `scale(1.2, 0.8) translateY(10px)`;
      }, 10);

      // Then big bounce up and rotate
      setTimeout(() => {
        this.elements.elon.style.transform = `scale(0.8) translate(120px, -300px) rotate(30deg)`;
        // Only start fading after the bounce starts
        this.elements.elon.style.transition = `transform 1s cubic-bezier(.17,.67,.4,1.8), opacity 0.3s ease`;
        this.elements.elon.style.opacity = "0.9";
      }, 150);

      // Final disappear with spin
      setTimeout(() => {
        this.elements.elon.style.transform = `scale(0.2) translate(350px, -500px) rotate(720deg)`;
        this.elements.elon.style.opacity = "0";
      }, 400);

      // console.log("Elon bouncing away with cartoon physics");
    }

    // Remove elements after delay
    const removeDelay = options.withTumble ? 1500 : 0;

    setTimeout(() => {
      try {
        // Remove wrapper if it exists
        if (this.elements.elonContainer && this.elements.elonContainer.parentNode) {
          this.elements.elonContainer.parentNode.removeChild(this.elements.elonContainer);
          // console.log("Removed Elon wrapper from DOM");
        }

        // Clear element references
        this.elements.elon = null;
        this.elements.elonContainer = null;
        this.elements.elonFrame0 = null;
        this.elements.elonFrame1 = null;
        this.elonOriginalPosition = null;

        // Find and remove orphaned elements
        const elementsToCleanup = ["elon-sprite", "elon-wrapper", "simple-elon", "elon-frame-0", "elon-frame-1"];
        elementsToCleanup.forEach((id) => {
          const elements = document.querySelectorAll(`#${id}`);
          if (elements.length > 0) {
            elements.forEach((el) => {
              if (el && el.parentNode) {
                el.parentNode.removeChild(el);
                // console.log(`Removed orphaned element #${id}`);
              }
            });
          }
        });

        // Find and remove any other elements with elon in the ID
        const possibleOrphanContainers = document.querySelectorAll('[id*="elon"]');
        if (possibleOrphanContainers.length > 0) {
          possibleOrphanContainers.forEach((el) => {
            if (el.id !== "elon-wrapper" && el.id !== "elon-sprite" && el.id !== "simple-elon") {
              if (el.parentNode) {
                el.parentNode.removeChild(el);
                // console.log(`Removed additional element with ID ${el.id}`);
              }
            }
          });
        }
      } catch (e) {
        console.error("Error during Elon cleanup:", e);
      }
    }, removeDelay);
  }



  createElonHitbox() {
    this.removeElonHitbox();

    const elonSprite = this.elements.elon;
    const elonWrapper = this.elements.elonContainer;
    const mapBackground = document.getElementById("map-background");
    const gameContainer = document.getElementById("game-container");

    if (!elonSprite || !elonWrapper || !mapBackground || !gameContainer) {
      console.error("Required elements not found for Elon hitbox");
      return;
    }

    this.elonHitbox = document.createElement("div");
    this.elonHitbox.id = "elon-hitbox";
    this.elonHitbox.style.position = "absolute";
    this.elonHitbox.style.zIndex = "1000";
    // this.elonHitbox.style.backgroundColor = "rgba(255,0,0,0.2)";
    // this.elonHitbox.style.border = "2px solid red";
    this.elonHitbox.style.pointerEvents = "all";
    this.elonHitbox.style.cursor = "pointer";

    // New approach for mobile compatibility
    const computedSprite = window.getComputedStyle(elonSprite);
    const computedWrapper = window.getComputedStyle(elonWrapper);

    // Use translation to correctly offset the hitbox
    const spriteWidth = parseFloat(computedSprite.width);
    const spriteHeight = parseFloat(computedSprite.height);
    const wrapperLeft = parseFloat(computedWrapper.left);
    const wrapperTop = parseFloat(computedWrapper.top);
    const spriteLeft = parseFloat(computedSprite.left);
    const spriteTop = parseFloat(computedSprite.top);

    this.elonHitbox.style.width = `${spriteWidth}px`;
    this.elonHitbox.style.height = `${spriteHeight}px`;

    // Precise positioning: wrapper position + sprite offset within wrapper
    this.elonHitbox.style.left = `${wrapperLeft + spriteLeft}px`;
    this.elonHitbox.style.top = `${wrapperTop + spriteTop}px`;

    this.elonHitbox.addEventListener("click", (e) => {
      e.stopPropagation();
    
// In the click event handler:
if (this.audioManager) {
  // Resume audio context first
  if (typeof this.audioManager.resumeAudioContext === 'function') {
    this.audioManager.resumeAudioContext().then(() => {
      this.audioManager.playRandom("defense", "slap", null, 0.8);
    });
  } else {
    // Fallback if resumeAudioContext doesn't exist
    this.audioManager.playRandom("defense", "slap", null, 0.8);
  }
}
    
      this.cleanupElonMusk();
    });

    gameContainer.appendChild(this.elonHitbox);

    // console.log("Elon hitbox created:", {
    //   width: this.elonHitbox.style.width,
    //   height: this.elonHitbox.style.height,
    //   left: this.elonHitbox.style.left,
    //   top: this.elonHitbox.style.top,
    // });
  }

  // Method to remove Elon hitbox
  removeElonHitbox() {
    if (this.elonHitbox && this.elonHitbox.parentElement) {
      this.elonHitbox.parentElement.removeChild(this.elonHitbox);
      this.elonHitbox = null;
    }
  }



  finishUfoAnimation() {
    this.elements.ufo.style.opacity = "0";

    // Initiate Elon tumbling downward animation
    if (this.elements.elon) {
      this.fadeOutElonElement();

      // Only remove Elon after the fadeout completes
      setTimeout(() => {
        this.cleanupElonElements({ withTumble: false }); // Use options object for clarity
      }, this.config.elon.fadeOutDuration + 100);
    }

    this.state.isAnimating = false;
    this.scheduleNextUfo();
  }

  getViewportDimensions() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
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
          y: -ufoSize,
        };
      case 1: // right
        return {
          x: viewport.width + ufoSize,
          y: Math.random() * viewport.height,
        };
      case 2: // bottom
        return {
          x: Math.random() * viewport.width,
          y: viewport.height + ufoSize,
        };
      case 3: // left
        return {
          x: -ufoSize,
          y: Math.random() * viewport.height,
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


  setDebugMode(enabled) {
    this.state.debugMode = enabled;
  }



  cleanupElonMusk() {
    // Cleanup Elon elements with tumble
    this.cleanupElonElements({ withTumble: true });

    // Remove Elon hitbox
    this.removeElonHitbox();
  }

  reset(){
    // welll 
  }

  // Update destroy method in UFOManager class
  destroy() {
    // Stop auto-spawn
    this.state.autoSpawnEnabled = false;

    // Clear any pending timeouts
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
    this.cleanupElonElements({ immediate: true });

    // Disable auto spawning
    this.state.autoSpawnEnabled = false;
    this.state.isAnimating = false;

    // console.log("UFO Manager destroyed");
  }
}

