class DebugManager {
  constructor(gameElements, gameState, animationManager) {
    logger.info("debug", "Creating Debug Manager");

    this.enabled = true;
    this.elements = gameElements;
    this.gameState = gameState;
    this.animationManager = animationManager;

    // Reference to animations - use animationManager if available, or create an empty object as fallback
    this.trumpAnimations = window.trumpAnimations || (animationManager ? animationManager.animations : {});

    // Debug panel elements
    this.panel = null;
    this.controls = {};

    // Track edit mode state
    this.isEditingMode = false;
    this.doneEditingBtn = null;

    // Calibration state
    this.calibration = {
      isCalibrating: false,
      originalAnimState: null,
      currentAnimation: null,
      frameCoordinates: [],
      wasPlaying: false,
      originalHandlerClick: null,
      originalHandlerTouch: null,
      originalContainerClick: null,
    };

    logger.debug("debug", "Debug Manager initialized");
  }

  // Initialize debugging tools
  init() {
    if (!this.enabled) return;

    logger.info("debug", "Initializing debug tools");

    this.createDebugPanel();
    this.setupBasicControls();
    this.setupHitboxControls();
    this.setupDeveloperControls();
    this.setupAnimationControls();
    this.setupAudioControls();
    this.setupResistanceControls();
    this.setupProtestorControls(); // Add this line

    // Initialize calibration state
    this.protestorCalibration = {
      isCalibrating: false,
      country: null,
      wasPlaying: false,
      wasPaused: false,
      originalCoordinates: null,
      locationIndex: 0, // Which spawn location we're currently editing
      totalLocations: 3, // Default number of locations to create
    };

    // Show the panel by default when in debug mode
    this.panel.style.display = "block";

    logger.info("debug", "Debug panel initialized and displayed");
  }
  // Create the debug panel
  createDebugPanel() {
    this.panel = document.getElementById("debug-panel");
    if (!this.panel) {
      console.error("Debug panel element not found");
      return;
    }
  }

  // Setup basic debug controls
  setupBasicControls() {
    // Toggle hitbox visibility
    const toggleHitbox = this.elements.debug.toggleHitbox;
    if (toggleHitbox) {
      toggleHitbox.addEventListener("click", () => this.toggleHitboxVisibility());
    }

    // Test animation button
    const testAnimation = this.elements.debug.testAnimation;
    if (testAnimation) {
      testAnimation.addEventListener("click", () => this.showAnimationTestDialog());
    }
  }

  // Setup hitbox calibration controls
  setupHitboxControls() {
    const calibrateButton = document.createElement("button");
    calibrateButton.id = "calibrate-button";
    calibrateButton.textContent = "Calibrate Hitboxes";
    calibrateButton.addEventListener("click", () => this.startCalibration());
    this.panel.appendChild(calibrateButton);
  }

  setupResistanceControls() {
    // Add a heading for resistance controls
    const resistanceHeading = document.createElement("h3");
    resistanceHeading.textContent = "Resistance Testing";
    resistanceHeading.classList.add("debug-section-heading");
    this.panel.appendChild(resistanceHeading);

    // Create container for resistance controls
    const resistanceControls = document.createElement("div");
    resistanceControls.id = "resistance-debug-controls";
    resistanceControls.classList.add("dev-controls-section"); // Reuse existing class for consistency
    resistanceControls.style.marginBottom = "10px";
    this.panel.appendChild(resistanceControls);

    // Country selection dropdown with label
    const countrySelectDiv = document.createElement("div");
    countrySelectDiv.classList.add("controls-margin-bottom"); // Reuse existing class

    const countryLabel = document.createElement("label");
    countryLabel.textContent = "Country: ";
    countrySelectDiv.appendChild(countryLabel);

    const countrySelect = document.createElement("select");
    countrySelect.id = "resistance-country-select";

    // Add options
    const countries = ["canada", "mexico", "greenland"];
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country.charAt(0).toUpperCase() + country.slice(1);
      countrySelect.appendChild(option);
    });

    countrySelectDiv.appendChild(countrySelect);
    resistanceControls.appendChild(countrySelectDiv);

    // Claims control
    const claimsControlDiv = document.createElement("div");
    claimsControlDiv.classList.add("controls-margin-bottom");

    const claimsLabel = document.createElement("label");
    claimsLabel.textContent = "Claims: ";
    claimsControlDiv.appendChild(claimsLabel);

    const claimsInput = document.createElement("input");
    claimsInput.type = "number";
    claimsInput.id = "resistance-claims";
    claimsInput.min = "0";
    claimsInput.max = "3";
    claimsInput.value = "0";
    claimsInput.classList.add("input-narrow");
    claimsControlDiv.appendChild(claimsInput);

    const setClaimsBtn = document.createElement("button");
    setClaimsBtn.textContent = "Set Claims";
    setClaimsBtn.id = "set-claims-btn";
    claimsControlDiv.appendChild(setClaimsBtn);

    resistanceControls.appendChild(claimsControlDiv);

    // Action buttons row 1
    const buttonRow1 = document.createElement("div");
    buttonRow1.classList.add("controls-margin-bottom");

    const annexBtn = document.createElement("button");
    annexBtn.textContent = "Annex Country";
    annexBtn.id = "annex-country-btn";
    buttonRow1.appendChild(annexBtn);

    const readyBtn = document.createElement("button");
    readyBtn.textContent = "Make Ready";
    readyBtn.id = "make-ready-btn";
    buttonRow1.appendChild(readyBtn);

    resistanceControls.appendChild(buttonRow1);

    // Action buttons row 2
    const buttonRow2 = document.createElement("div");
    buttonRow2.classList.add("controls-margin-bottom");

    const triggerBtn = document.createElement("button");
    triggerBtn.textContent = "Trigger Resistance";
    triggerBtn.id = "trigger-resistance-btn";
    buttonRow2.appendChild(triggerBtn);

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset All";
    resetBtn.id = "reset-resistance-btn";
    buttonRow2.appendChild(resetBtn);

    resistanceControls.appendChild(buttonRow2);

    // Status display
    const statusDisplay = document.createElement("div");
    statusDisplay.id = "resistance-status";
    statusDisplay.classList.add("debug-status-div");
    statusDisplay.style.fontSize = "10px";
    statusDisplay.style.marginTop = "10px";
    statusDisplay.textContent = "Select a country and use the controls above";

    resistanceControls.appendChild(statusDisplay);

    // Add event listeners
    this.setupResistanceEventListeners();

    // Start periodic updates
    this.startResistanceStatusUpdates();
  }

  setupResistanceEventListeners() {
    // Set claims button
    document.getElementById("set-claims-btn").addEventListener("click", () => {
      const country = document.getElementById("resistance-country-select").value;
      const claims = parseInt(document.getElementById("resistance-claims").value);

      if (window.freedomManager) {
        window.freedomManager.setCountryClaims(country, claims);
        this.showButtonEffect(document.getElementById("set-claims-btn"));
      } else {
        console.error("FreedomManager not available");
      }
    });

    // Annex Country button
    document.getElementById("annex-country-btn").addEventListener("click", () => {
      const country = document.getElementById("resistance-country-select").value;

      if (window.freedomManager) {
        window.freedomManager.annexCountry(country);
        this.showButtonEffect(document.getElementById("annex-country-btn"));
      } else {
        console.error("FreedomManager not available");
      }
    });

    // Make Resistance Ready button
    document.getElementById("make-ready-btn").addEventListener("click", () => {
      const country = document.getElementById("resistance-country-select").value;

      if (window.freedomManager) {
        window.freedomManager.makeResistanceReady(country);
        this.showButtonEffect(document.getElementById("make-ready-btn"));
      } else {
        console.error("FreedomManager not available");
      }
    });

    // Trigger Resistance button
    document.getElementById("trigger-resistance-btn").addEventListener("click", () => {
      const country = document.getElementById("resistance-country-select").value;

      if (window.freedomManager) {
        window.freedomManager.triggerCountryResistance(country);
        this.showButtonEffect(document.getElementById("trigger-resistance-btn"));
      } else {
        console.error("FreedomManager not available");
      }
    });

    // Reset Resistance button
    document.getElementById("reset-resistance-btn").addEventListener("click", () => {
      if (window.freedomManager) {
        window.freedomManager.reset();
        this.showButtonEffect(document.getElementById("reset-resistance-btn"));
      } else {
        console.error("FreedomManager not available");
      }
    });
  }

  startResistanceStatusUpdates() {
    // Set up periodic updates of status
    this.resistanceStatusInterval = setInterval(() => {
      this.updateResistanceStatus();
    }, 500);
  }

  updateResistanceStatus() {
    const statusDisplay = document.getElementById("resistance-status");
    if (!statusDisplay) return;

    const country = document.getElementById("resistance-country-select")?.value;
    if (!country) return;

    if (!window.freedomManager || !window.freedomManager.gameState) {
      statusDisplay.textContent = "FreedomManager not available";
      return;
    }

    const gameState = window.freedomManager.gameState;

    if (!gameState.countries[country]) {
      statusDisplay.textContent = "Country data not found";
      return;
    }

    const countryData = gameState.countries[country];
    const claims = countryData.claims || 0;
    const maxClaims = countryData.maxClaims || 3;

    // Add null checks to handle cases when these properties don't exist yet
    const annexTime = (countryData.annexedTime || 0) / 1000; // Convert to seconds
    const resistReady = countryData.canResist || false;

    statusDisplay.innerHTML = `
      <strong>${country.toUpperCase()}</strong>: ${claims}/${maxClaims} claims<br>
      Annexation Time: ${annexTime.toFixed(1)}s / ${window.freedomManager.fullAnnexationTime / 1000 || "?"}s<br>
      Resistance Ready: ${resistReady ? "YES" : "NO"}
    `;
  }

  // Setup developer controls
  setupDeveloperControls() {
    // Add a heading for dev controls
    const devHeading = document.createElement("h3");
    devHeading.textContent = "Developer Controls";
    devHeading.classList.add("debug-section-heading");
    this.panel.appendChild(devHeading);

    // Create container for developer controls
    const devControls = document.createElement("div");
    devControls.id = "dev-controls";
    devControls.classList.add("dev-controls-section");
    this.panel.appendChild(devControls);

    // Add time adjustment
    const timeControl = document.createElement("div");
    timeControl.classList.add("controls-margin-bottom"); // Reusable class
    timeControl.innerHTML = `
      <label>Time: <input type="number" id="dev-time" min="10" max="300" value="60" style="width: 50px;"></label>
      <button id="dev-set-time">Set</button>
    `;
    devControls.appendChild(timeControl);

    // Add animation flow testing
    const animFlowTest = document.createElement("div");
    animFlowTest.classList.add("controls-margin-bottom");
    animFlowTest.innerHTML = `
      <label>Test Animation Sequence:</label>
      <button id="test-sequence">Run Full Sequence</button>
    `;
    devControls.appendChild(animFlowTest);

    // Add event listeners
    document.getElementById("dev-set-time").addEventListener("click", () => {
      const newTime = parseInt(document.getElementById("dev-time").value);
      if (newTime && newTime > 0) {
        this.gameState.timeRemaining = newTime;
        this.updateHUD();
      }
    });

    document.getElementById("test-sequence").addEventListener("click", () => {
      this.testAnimationSequence();
    });
  }

  // New method to test full animation sequence
  testAnimationSequence() {
    if (!this.animationManager) {
      alert("Animation manager not found");
      return;
    }

    // Start with idle
    this.animationManager.changeState("idle", () => {
      // After idle completes, go to grab
      this.animationManager.changeState("grabWestCanada", () => {
        // After grab completes, go to victory
        this.animationManager.changeState("victory", () => {
          // After victory completes, go back to idle
          this.animationManager.changeState("idle", () => {
            logger.debug("debug", "Animation sequence test complete");
          });
        });
      });
    });
  }

  setupAnimationControls() {
    // Create animation controls section
    const animHeading = document.createElement("h3");
    animHeading.textContent = "Animation Controls";
    animHeading.classList.add("debug-section-heading");
    this.panel.appendChild(animHeading);

    // Create container for animation controls
    const animControls = document.createElement("div");
    animControls.id = "anim-controls";
    animControls.classList.add("anim-controls-section");
    this.panel.appendChild(animControls);

    const durationControls = document.createElement("div");
    durationControls.innerHTML = `
      <div class="controls-margin-bottom">
        <label>Idle Frame Time (ms): 
          <input type="number" id="idle-frame-time" min="50" max="1000" value="800" class="input-medium">
        </label>
        <button id="set-idle-time">Set</button>
      </div>
      <div class="controls-margin-bottom">
        <label>Grab Frame Time (ms): 
          <input type="number" id="grab-frame-time" min="50" max="1000" value="800" class="input-medium">
        </label>
        <button id="set-grab-time">Set</button>
      </div>
      <div class="controls-margin-bottom">
        <label>Slap Frame Time (ms): 
          <input type="number" id="slap-frame-time" min="50" max="1000" value="100" class="input-medium">
        </label>
        <button id="set-slap-time">Set</button>
      </div>
    `;
    animControls.appendChild(durationControls);

    // Add loop count controls
    const loopControls = document.createElement("div");
    loopControls.innerHTML = `
      <div style="margin-bottom: 5px;">
        <label>Idle Loops: 
          <input type="number" id="idle-loops" min="1" max="10" value="4" style="width: 60px;">
        </label>
        <button id="set-idle-loops">Set</button>
      </div>
      <div style="margin-bottom: 5px;">
        <label>Grab Loops: 
          <input type="number" id="grab-loops" min="1" max="10" value="4" style="width: 60px;">
        </label>
        <button id="set-grab-loops">Set</button>
      </div>
      <div style="margin-bottom: 5px;">
        <label>Victory Loops: 
          <input type="number" id="victory-loops" min="1" max="10" value="2" style="width: 60px;">
        </label>
        <button id="set-victory-loops">Set</button>
      </div>
      <div style="margin-bottom: 5px;">
        <label>Reaction Loops: 
          <input type="number" id="reaction-loops" min="1" max="10" value="2" style="width: 60px;">
        </label>
        <button id="set-reaction-loops">Set</button>
      </div>
    `;
    animControls.appendChild(loopControls);

    // Add animation sequence timing controls
    const sequenceControls = document.createElement("div");
    sequenceControls.innerHTML = `
      <div style="margin-bottom: 5px;">
        <label>Grab Interval (ms): 
          <input type="number" id="grab-interval" min="500" max="5000" value="2000" style="width: 60px;">
        </label>
        <button id="set-grab-interval">Set</button>
      </div>
    `;
    animControls.appendChild(sequenceControls);

    // Add current animation info display
    const animInfo = document.createElement("div");
    animInfo.id = "anim-info";
    animInfo.classList.add("controls-margin-bottom"); // Reuse for margin
    animInfo.innerHTML = `
      <div><strong>Current Animation:</strong> <span id="current-anim-name">idle</span></div>
      <div><strong>Current Frame:</strong> <span id="current-anim-frame">0</span></div>
      <div><strong>Loop Count:</strong> <span id="current-loop-count">0</span></div>
    `;
    animControls.appendChild(animInfo);

    // Add refresh button to update animation info
    const refreshBtn = document.createElement("button");
    refreshBtn.textContent = "Refresh Info";
    refreshBtn.classList.add("controls-margin-top"); // New class for top margin
    refreshBtn.addEventListener("click", () => this.updateAnimationInfo());
    animControls.appendChild(refreshBtn);

    // Add event listeners for all animation control buttons
    this.addAnimationControlListeners();

    // Start periodic updates of animation info
    this.startAnimationInfoUpdates();
  }

  addAnimationControlListeners() {
    // Idle frame time
    document.getElementById("set-idle-time").addEventListener("click", () => {
      const newTime = parseInt(document.getElementById("idle-frame-time").value);
      if (newTime && newTime > 0 && this.animationManager) {
        this.updateAnimationTiming("idle", newTime);
        this.updateAnimationTiming("victory", newTime);
      }
    });

    // Grab frame time
    document.getElementById("set-grab-time").addEventListener("click", () => {
      const newTime = parseInt(document.getElementById("grab-frame-time").value);
      if (newTime && newTime > 0 && this.animationManager) {
        this.updateAnimationTiming("grabEastCanada", newTime);
        this.updateAnimationTiming("grabWestCanada", newTime);
        this.updateAnimationTiming("grabMexico", newTime);
        this.updateAnimationTiming("grabGreenland", newTime);
      }
    });

    // Slap frame time
    document.getElementById("set-slap-time").addEventListener("click", () => {
      const newTime = parseInt(document.getElementById("slap-frame-time").value);
      if (newTime && newTime > 0 && this.animationManager) {
        this.updateAnimationTiming("slapped", newTime);
        this.updateAnimationTiming("smackEastCanada", newTime);
        this.updateAnimationTiming("smackWestCanada", newTime);
        this.updateAnimationTiming("smackMexico", newTime);
        this.updateAnimationTiming("smackGreenland", newTime);
      }
    });

    // Idle loops
    document.getElementById("set-idle-loops").addEventListener("click", () => {
      const loops = parseInt(document.getElementById("idle-loops").value);
      if (loops && loops > 0 && this.animationManager) {
        this.updateAnimationLoops("idle", loops);
      }
    });

    // Grab loops
    document.getElementById("set-grab-loops").addEventListener("click", () => {
      const loops = parseInt(document.getElementById("grab-loops").value);
      if (loops && loops > 0 && this.animationManager) {
        this.updateAnimationLoops("grabEastCanada", loops);
        this.updateAnimationLoops("grabWestCanada", loops);
        this.updateAnimationLoops("grabMexico", loops);
        this.updateAnimationLoops("grabGreenland", loops);
      }
    });

    // Victory loops
    document.getElementById("set-victory-loops").addEventListener("click", () => {
      const loops = parseInt(document.getElementById("victory-loops").value);
      if (loops && loops > 0 && this.animationManager) {
        this.updateAnimationLoops("victory", loops);
      }
    });

    // Reaction loops
    document.getElementById("set-reaction-loops").addEventListener("click", () => {
      const loops = parseInt(document.getElementById("reaction-loops").value);
      if (loops && loops > 0 && this.animationManager) {
        this.updateAnimationLoops("slapped", loops);
      }
    });

    // Grab interval
    document.getElementById("set-grab-interval").addEventListener("click", () => {
      const interval = parseInt(document.getElementById("grab-interval").value);
      if (interval && interval > 0) {
        this.gameState.baseGrabInterval = interval;
        logger.debug("debug", `Set grab interval to ${interval}ms`);
      }
    });
  }

  updateAnimationTiming(animName, frameTime) {
    if (!this.animationManager || !this.animationManager.animations[animName]) return;

    // Update the animation's frame duration
    this.animationManager.animations[animName].frameDuration = frameTime;

    // Log the change
    logger.debug("debug", `Updated ${animName} frame time to ${frameTime}ms`);

    // If this is the current animation, restart it to apply changes
    if (this.animationManager.currentState === animName) {
      const currentLoopCount = this.animationManager.loopCount;
      const maxLoops = this.animationManager.maxLoops;
      const currentCallback = this.animationManager.onAnimationEnd;

      this.animationManager.stop();
      this.animationManager.changeState(animName, currentCallback);

      // Try to restore loop state
      this.animationManager.loopCount = currentLoopCount;
      this.animationManager.maxLoops = maxLoops;
    }
  }

  updateAnimationLoops(animName, loops) {
    if (!this.animationManager || !this.animationManager.animations[animName]) return;

    // Update the animation's max loops
    this.animationManager.animations[animName].maxLoops = loops;

    logger.debug("debug", `Updated ${animName} to loop ${loops} times`);
  }

  updateAnimationInfo() {
    if (!this.animationManager) return;

    const currentName = document.getElementById("current-anim-name");
    const currentFrame = document.getElementById("current-anim-frame");
    const currentLoop = document.getElementById("current-loop-count");

    if (currentName && currentFrame && currentLoop) {
      currentName.textContent = this.animationManager.currentState || "none";
      currentFrame.textContent = this.animationManager.currentFrame || 0;
      currentLoop.textContent = `${this.animationManager.loopCount || 0}/${this.animationManager.maxLoops || 1}`;
    }
  }

  startAnimationInfoUpdates() {
    // Update animation info every 200ms
    this.animInfoInterval = setInterval(() => {
      this.updateAnimationInfo();
    }, 200);
  }

  stopAnimationInfoUpdates() {
    if (this.animInfoInterval) {
      clearInterval(this.animInfoInterval);
      this.animInfoInterval = null;
    }

    if (this.audioStatusInterval) {
      clearInterval(this.audioStatusInterval);
      this.audioStatusInterval = null;
    }
  }

  toggleHitboxVisibility() {
    document.body.classList.toggle("debug-mode");

    const isDebugMode = document.body.classList.contains("debug-mode");
    logger.info("debug", `Toggled hitbox visibility: ${isDebugMode ? "visible" : "hidden"}`);

    // If animation manager exists, update its debug mode
    if (this.animationManager) {
      this.animationManager.setDebugMode(isDebugMode);

      // Also update the HandHitboxManager directly if available
      if (this.animationManager.handHitboxManager) {
        this.animationManager.handHitboxManager.setDebugMode(isDebugMode);
      }
    }
  }

  // Show animation test dialog
  showAnimationTestDialog() {
    // Get animation names from either animation manager or game state
    let animationStates = [];
    if (this.animationManager && this.animationManager.animations) {
      animationStates = Object.keys(this.animationManager.animations);
    } else if (window.trumpAnimations) {
      animationStates = Object.keys(window.trumpAnimations);
    }

    const animSelect = document.createElement("select");
    animSelect.id = "animation-select";

    animationStates.forEach((state) => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      animSelect.appendChild(option);
    });

    // Create a dialog for animation testing
    const dialog = document.createElement("div");
    dialog.classList.add("animation-test-dialog");
    dialog.appendChild(animSelect);

    const testBtn = document.createElement("button");
    testBtn.textContent = "Test";
    testBtn.addEventListener("click", () => {
      const selectedAnimation = animSelect.value;
      if (this.animationManager) {
        // If transitioning to a grab animation, go through idle first
        const isGrabAnim = selectedAnimation.startsWith("grab");
        if (isGrabAnim && this.animationManager.currentState !== "idle") {
          logger.debug("debug", `Transitioning through idle first before ${selectedAnimation}`);
          this.animationManager.changeState("idle", () => {
            this.animationManager.changeState(selectedAnimation);
          });
        } else {
          this.animationManager.changeState(selectedAnimation);
        }
      } else if (typeof changeAnimationState === "function") {
        changeAnimationState(selectedAnimation);
      }
    });

    const loopCountInput = document.createElement("div");
    loopCountInput.classList.add("dialog-input-margin");
    loopCountInput.innerHTML = `
      <label>Loop Count: <input type="number" id="test-loops" min="1" max="10" value="2" style="width: 40px;"></label>
    `;
    dialog.appendChild(loopCountInput);

    const frameTimeInput = document.createElement("div");
    frameTimeInput.innerHTML = `
      <label>Frame Time (ms): <input type="number" id="test-frame-time" min="100" max="1000" value="800" style="width: 40px;"></label>
    `;
    dialog.appendChild(frameTimeInput);

    const updateBtn = document.createElement("button");
    updateBtn.textContent = "Update Settings";
    updateBtn.addEventListener("click", () => {
      const selectedAnimation = animSelect.value;
      const loopCount = parseInt(document.getElementById("test-loops").value);
      const frameTime = parseInt(document.getElementById("test-frame-time").value);

      if (this.animationManager && selectedAnimation) {
        if (loopCount && loopCount > 0) {
          this.updateAnimationLoops(selectedAnimation, loopCount);
        }

        if (frameTime && frameTime > 0) {
          this.updateAnimationTiming(selectedAnimation, frameTime);
        }
      }
    });

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", () => {
      dialog.remove();
    });

    dialog.appendChild(testBtn);
    dialog.appendChild(updateBtn);
    dialog.appendChild(closeBtn);
    document.body.appendChild(dialog);
  }

  // Add a helper method for button effect
  showButtonEffect(button) {
    const originalBg = button.style.backgroundColor;
    button.classList.add("button-active");
    setTimeout(() => {
      button.style.backgroundColor = originalBg;
    }, 300);
  }

  setupAudioControls() {
    // Add a heading for audio controls
    const audioHeading = document.createElement("h3");
    audioHeading.textContent = "Audio Debug";
    audioHeading.classList.add("debug-section-heading");
    this.panel.appendChild(audioHeading);

    // Create container for audio controls
    const audioControls = document.createElement("div");
    audioControls.id = "audio-debug-controls";
    audioControls.style.marginBottom = "10px";
    this.panel.appendChild(audioControls);

    // Simple button creation helper function that includes audio manager access
    const createAudioButton = (text, callback) => {
      const button = document.createElement("button");
      button.textContent = text;
      button.classList.add("audio-debug-button");

      button.addEventListener("click", () => {
        // Always get the latest reference when button is clicked
        const audioManager = this.getAudioManager();
        if (audioManager) {
          callback(audioManager);
        } else {
          console.error("AudioManager not available");
          alert("AudioManager not available. Check console for details.");
        }
      });
      return button;
    };

    // Create basic UI sound buttons
    const uiSoundDiv = document.createElement("div");
    uiSoundDiv.innerHTML = "<div class='uiBtn'>UI Sounds:</div>";
    audioControls.appendChild(uiSoundDiv);

    const uiButtonsDiv = document.createElement("div");
    uiButtonsDiv.classList.add("audio-debug-button-container");

    // UI sound buttons
    uiButtonsDiv.appendChild(
      createAudioButton("Click", (am) => {
        am.play("ui", "click");
      })
    );

    uiButtonsDiv.appendChild(
      createAudioButton("Start", (am) => {
        am.play("ui", "start");
      })
    );

    uiButtonsDiv.appendChild(
      createAudioButton("Win", (am) => {
        am.play("ui", "win");
      })
    );

    uiButtonsDiv.appendChild(
      createAudioButton("Lose", (am) => {
        am.play("ui", "lose");
      })
    );

    audioControls.appendChild(uiButtonsDiv);

    // Create game effect sound buttons
    const effectSoundDiv = document.createElement("div");
    effectSoundDiv.innerHTML = "<div class='uiBtn'>Game Effects:</div>";
    audioControls.appendChild(effectSoundDiv);

    const effectButtonsDiv = document.createElement("div");
    effectButtonsDiv.classList.add("audio-debug-button-container");

    // Game effect buttons - use playRandom for proper shuffling
    effectButtonsDiv.appendChild(
      createAudioButton("Grab", (am) => {
        am.playGrabAttempt("canada");
      })
    );

    effectButtonsDiv.appendChild(
      createAudioButton("Success", (am) => {
        am.playRandom("trump", "success");
      })
    );

    effectButtonsDiv.appendChild(
      createAudioButton("Annex", (am) => {
        am.playRandom("trump", "annex");
      })
    );

    effectButtonsDiv.appendChild(
      createAudioButton("Slap", (am) => {
        am.playRandom("defense", "slap");
      })
    );

    effectButtonsDiv.appendChild(
      createAudioButton("Victory", (am) => {
        am.playRandom("trump", "victory");
      })
    );

    effectButtonsDiv.appendChild(
      createAudioButton("Sob", (am) => {
        am.playRandom("trump", "sob");
      })
    );

    audioControls.appendChild(effectButtonsDiv);

    // Create protest sound buttons
    const protestDiv = document.createElement("div");
    protestDiv.innerHTML = "<div class='uiBtn'>Protest Sounds:</div>";
    audioControls.appendChild(protestDiv);

    const protestButtonsDiv = document.createElement("div");
    protestButtonsDiv.classList.add("audio-debug-button-container");

    // Protest sound buttons
    protestButtonsDiv.appendChild(
      createAudioButton("Canada East", (am) => {
        am.playRandom("defense", "protest", "eastCanada");
      })
    );

    protestButtonsDiv.appendChild(
      createAudioButton("Canada West", (am) => {
        am.playRandom("defense", "protest", "westCanada");
      })
    );

    protestButtonsDiv.appendChild(
      createAudioButton("Mexico", (am) => {
        am.playRandom("defense", "protest", "mexico");
      })
    );

    protestButtonsDiv.appendChild(
      createAudioButton("Greenland", (am) => {
        am.playRandom("defense", "protest", "greenland");
      })
    );

    audioControls.appendChild(protestButtonsDiv);

    // Create catchphrase buttons
    const catchphraseDiv = document.createElement("div");
    catchphraseDiv.innerHTML = "<div class='uiBtn'>Catchphrases:</div>";
    audioControls.appendChild(catchphraseDiv);

    const catchphraseButtonsDiv = document.createElement("div");
    catchphraseButtonsDiv.classList.add("audio-debug-button-container");

    // Catchphrase buttons
    catchphraseButtonsDiv.appendChild(
      createAudioButton("Canada", (am) => {
        am.playCatchphrase("canada");
      })
    );

    catchphraseButtonsDiv.appendChild(
      createAudioButton("Mexico", (am) => {
        am.playCatchphrase("mexico");
      })
    );

    catchphraseButtonsDiv.appendChild(
      createAudioButton("Greenland", (am) => {
        am.playCatchphrase("greenland");
      })
    );

    catchphraseButtonsDiv.appendChild(
      createAudioButton("Generic", (am) => {
        am.playCatchphrase("generic");
      })
    );

    audioControls.appendChild(catchphraseButtonsDiv);

    // Create country-specific action buttons
    const countryDiv = document.createElement("div");
    countryDiv.innerHTML = "<div class='uiBtn'>Complete Actions:</div>";
    audioControls.appendChild(countryDiv);

    const countryButtonsDiv = document.createElement("div");
    countryButtonsDiv.classList.add("audio-debug-button-container");

    // Country action buttons
    countryButtonsDiv.appendChild(
      createAudioButton("Block Canada", (am) => {
        am.playSuccessfulBlock("eastCanada");
      })
    );

    countryButtonsDiv.appendChild(
      createAudioButton("Block Mexico", (am) => {
        am.playSuccessfulBlock("mexico");
      })
    );

    countryButtonsDiv.appendChild(
      createAudioButton("Block Greenland", (am) => {
        am.playSuccessfulBlock("greenland");
      })
    );

    countryButtonsDiv.appendChild(
      createAudioButton("Successful Canada", (am) => {
        am.playSuccessfulGrab("canada");
      })
    );

    countryButtonsDiv.appendChild(
      createAudioButton("Successful Mexico", (am) => {
        am.playSuccessfulGrab("mexico");
      })
    );

    countryButtonsDiv.appendChild(
      createAudioButton("Successful Greenland", (am) => {
        am.playSuccessfulGrab("greenland");
      })
    );

    countryButtonsDiv.appendChild(
      createAudioButton("Annex Canada", (am) => {
        am.playCountryAnnexed("canada");
      })
    );

    countryButtonsDiv.appendChild(
      createAudioButton("Annex Mexico", (am) => {
        am.playCountryAnnexed("mexico");
      })
    );

    countryButtonsDiv.appendChild(
      createAudioButton("Annex Greenland", (am) => {
        am.playCountryAnnexed("greenland");
      })
    );

    audioControls.appendChild(countryButtonsDiv);

    // Music controls
    const musicDiv = document.createElement("div");
    musicDiv.innerHTML = "<div class='uiBtn'>Music Controls:</div>";
    audioControls.appendChild(musicDiv);

    const musicButtonsDiv = document.createElement("div");
    musicButtonsDiv.classList.add("audio-debug-button-container");

    // Music buttons
    musicButtonsDiv.appendChild(
      createAudioButton("Start Music", (am) => {
        am.startBackgroundMusic();
      })
    );

    musicButtonsDiv.appendChild(
      createAudioButton("Stop Music", (am) => {
        am.stopBackgroundMusic();
      })
    );

    const muteBtn = createAudioButton("Toggle Mute", (am) => {
      const muted = am.toggleMute();
      muteBtn.textContent = muted ? "Unmute" : "Mute";
    });
    musicButtonsDiv.appendChild(muteBtn);

    audioControls.appendChild(musicButtonsDiv);

    // Music intensity
    const intensityDiv = document.createElement("div");
    intensityDiv.classList.add("intensity-control");

    const intensityLabel = document.createElement("div");
    intensityLabel.textContent = "Music Intensity:";
    intensityDiv.appendChild(intensityLabel);

    const intensitySelect = document.createElement("select");
    for (let i = 0; i <= 3; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i === 0 ? "Normal" : `Level ${i}`;
      intensitySelect.appendChild(option);
    }

    intensitySelect.addEventListener("change", (e) => {
      const audioManager = this.getAudioManager();
      if (audioManager) {
        const intensity = parseInt(e.target.value);
        audioManager.updateMusicIntensity(intensity);
      }
    });

    intensityDiv.appendChild(intensitySelect);
    audioControls.appendChild(intensityDiv);

    // Volume control
    const volumeDiv = document.createElement("div");
    volumeDiv.classList.add("volume-control");

    const volumeLabel = document.createElement("div");
    volumeLabel.textContent = "Volume:";
    volumeDiv.appendChild(volumeLabel);

    const volumeSlider = document.createElement("input");
    volumeSlider.type = "range";
    volumeSlider.min = "0";
    volumeSlider.max = "100";
    volumeSlider.value = "100";
    volumeSlider.classList.add("volume-slider");

    volumeSlider.addEventListener("input", (e) => {
      const audioManager = this.getAudioManager();
      if (audioManager) {
        const volume = parseInt(e.target.value) / 100;
        audioManager.setVolume(volume);
      }
    });

    volumeDiv.appendChild(volumeSlider);
    audioControls.appendChild(volumeDiv);

    // Add debug status text
    const statusDiv = document.createElement("div");
    statusDiv.classList.add("debug-status-div");

    const audioManager = this.getAudioManager();
    // statusDiv.textContent = audioManager
    //   ? "AudioManager found and connected"
    //   : "AudioManager NOT FOUND - buttons may not work";

    audioControls.appendChild(statusDiv);
  }

  // Helper method to safely get the audio manager
  getAudioManager() {
    // Try different ways to access the AudioManager
    return this.audioManager || window.audioManager || (this.debugManager && this.debugManager.audioManager);
  }

  // Start hitbox calibration process
  startCalibration() {
    // Pause the game completely
    const wasPlaying = this.gameState.isPlaying;
    if (wasPlaying) {
      this.gameState.isPlaying = false;
      clearTimeout(this.gameState.grabTimer);
      clearInterval(this.gameState.countdownTimer);
    }

    // Create calibration UI
    const dialog = document.createElement("div");
    dialog.classList.add("calibration-dialog");

    const title = document.createElement("h3");
    title.textContent = "Hitbox Calibration";
    dialog.appendChild(title);

    // Animation selector
    const animSelect = document.createElement("select");
    const animationStates = ["grabEastCanada", "grabWestCanada", "grabMexico", "grabGreenland"];

    animationStates.forEach((state) => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      animSelect.appendChild(option);
    });

    dialog.appendChild(animSelect);

    // Buttons
    const startBtn = document.createElement("button");
    startBtn.classList.add("calibration-dialog-button");

    startBtn.textContent = "Start Calibration";
    startBtn.addEventListener("click", () => {
      this.beginCalibration(animSelect.value, wasPlaying);
      dialog.remove();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.classList.add("calibration-dialog-button");

    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      dialog.remove();
      // Resume game if it was playing
      if (wasPlaying) {
        this.gameState.isPlaying = true;
        this.gameState.countdownTimer = setInterval(window.updateCountdown, 1000);
        if (typeof window.scheduleNextGrab === "function") {
          window.scheduleNextGrab();
        } else {
          console.warn("scheduleNextGrab function not available, continuing without it");
        }
      }
    });

    dialog.appendChild(startBtn);
    dialog.appendChild(cancelBtn);
    document.body.appendChild(dialog);
  }

  // Make the hitbox draggable for calibration
  makeHitboxDraggable() {
    const hitbox = document.getElementById("trump-hand-hitbox");
    let isDragging = false;
    let offsetX, offsetY;

    // Remove existing listeners
    const newHitbox = hitbox.cloneNode(true);
    hitbox.parentNode.replaceChild(newHitbox, hitbox);

    // Add new drag listeners
    newHitbox.addEventListener("mousedown", (e) => {
      if (!this.calibration.isCalibrating) return;

      isDragging = true;
      const hitboxRect = newHitbox.getBoundingClientRect();
      offsetX = e.clientX - hitboxRect.left;
      offsetY = e.clientY - hitboxRect.top;

      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const container = document.getElementById("trump-sprite-container");
      const containerRect = container.getBoundingClientRect();

      const x = e.clientX - containerRect.left - offsetX;
      const y = e.clientY - containerRect.top - offsetY;

      newHitbox.style.left = `${x}px`;
      newHitbox.style.top = `${y}px`;

      // Update stored coordinates
      const currentFrame = parseInt(document.getElementById("current-frame").textContent);
      this.calibration.frameCoordinates[currentFrame] = {
        x: Math.round(x),
        y: Math.round(y),
        width: parseInt(newHitbox.style.width) || 50,
        height: parseInt(newHitbox.style.height) || 50,
      };

      this.updateCoordsDisplay(currentFrame);
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
  }

  // Update coordinates display
  updateCoordsDisplay(frameIndex) {
    const coords = this.calibration.frameCoordinates[frameIndex];
    const display = document.getElementById("coords-display");
    if (display && coords) {
      display.textContent = `X: ${coords.x}, Y: ${coords.y}, W: ${coords.width}, H: ${coords.height}`;

      // Update full output
      const output = document.getElementById("calib-output");
      if (output) {
        output.textContent = this.formatCoordinatesOutput();
      }
    }
  }

  beginCalibration(animationName, wasPlaying) {
    console.log("Beginning calibration for animation:", animationName);

    // Pause the game properly if it's running
    if (wasPlaying) {
      // Use the game's existing pause function
      if (typeof window.togglePause === "function") {
        // Only pause if not already paused
        if (!this.gameState.isPaused) {
          window.togglePause();
          console.log("Game paused for calibration");
        }
      } else {
        // Fallback to manual pause approach
        this.gameState.isPlaying = false;
        if (this.gameState.grabTimer) clearTimeout(this.gameState.grabTimer);
        if (this.gameState.countdownTimer) clearInterval(this.gameState.countdownTimer);
        console.log("Game manually paused (no togglePause function available)");
      }
    }

    // Reset calibration state
    this.calibration = {
      isCalibrating: true,
      originalAnimState: this.animationManager ? this.animationManager.currentState : null,
      currentAnimation: animationName,
      frameCoordinates: [],
      wasPlaying: wasPlaying,
      wasPaused: this.gameState.isPaused, // Remember if the game was already paused
      originalHandlerClick: null,
      originalHandlerTouch: null,
      originalContainerClick: null,
    };

    // Force debug mode for hitbox visibility
    document.body.classList.add("debug-mode");

    // Override event handlers to prevent game actions
    const trumpHandHitBox = document.getElementById("trump-hand-hitbox");
    if (trumpHandHitBox) {
      this.calibration.originalHandlerClick = trumpHandHitBox.onclick;
      this.calibration.originalHandlerTouch = trumpHandHitBox.ontouchstart;

      trumpHandHitBox.onclick = null;
      trumpHandHitBox.ontouchstart = null;
    } else {
      console.error("Hand hitbox not found for calibration");
    }

    // Create calibration panel
    const panel = document.createElement("div");
    panel.id = "calibration-panel";
    panel.classList.add("calibration-panel");

    // Get frame count from your animation system
    let frameCount = 5; // Default frame count
    if (this.animationManager && this.animationManager.animations[animationName]) {
      frameCount = this.animationManager.animations[animationName].frameCount;
      console.log(`Got frameCount ${frameCount} from animationManager`);
    } else if (this.trumpAnimations && this.trumpAnimations[animationName]) {
      frameCount = this.trumpAnimations[animationName].frameCount;
      console.log(`Got frameCount ${frameCount} from trumpAnimations`);
    } else {
      console.warn(`No animation data found for ${animationName}, using default frameCount`);
    }

    panel.innerHTML = `
        <h4>Calibrating: ${animationName}</h4>
        <div>Frame: <span id="current-frame">0</span>/<span id="total-frames">${frameCount - 1}</span></div>
        <div id="coords-display"></div>
        <button id="prev-frame">Previous Frame</button>
        <button id="next-frame">Next Frame</button>
        <button id="save-coords">Save Coordinates</button>
        <button id="cancel-calib">Cancel</button>
        <div id="calib-output" style="margin-top:10px;font-size:10px;max-height:100px;overflow-y:auto;"></div>
      `;

    document.body.appendChild(panel);

    // Add the mobile toggle now that panel exists
    const mobileToggle = document.createElement("div");
    mobileToggle.classList.add("controls-margin-bottom");
    mobileToggle.innerHTML = `
      <label>
        <input type="checkbox" id="mobile-coords-toggle"> Calibrate for Mobile
      </label>
    `;

    // Insert it before the coords display
    const coordsDisplay = document.getElementById("coords-display");
    if (coordsDisplay) {
      coordsDisplay.parentNode.insertBefore(mobileToggle, coordsDisplay);
    }

    // Add event listener for mobile toggle
    const mobileToggleElem = document.getElementById("mobile-coords-toggle");
    if (mobileToggleElem) {
      mobileToggleElem.addEventListener("change", (e) => {
        const isMobileCalibration = e.target.checked;

        // Switch coordinate sets
        if (isMobileCalibration) {
          // Save current desktop coordinates
          this.calibration.desktopCoordinates = [...this.calibration.frameCoordinates];

          // Load mobile coordinates if they exist
          if (
            this.animationManager &&
            this.animationManager.animations[this.calibration.currentAnimation]  &&
            this.animationManager.animations[this.calibration.currentAnimation].deviceCoordinates.mobile
          ) {
            this.calibration.frameCoordinates = [...this.animationManager.animations[this.calibration.currentAnimation].deviceCoordinates.mobile];
          } else {
            // Create default mobile coordinates if none exist
            this.calibration.frameCoordinates = this.calibration.frameCoordinates.map((coord) => ({
              x: Math.floor(coord.x / 2),
              y: Math.floor(coord.y / 2),
              width: Math.floor(coord.width / 2),
              height: Math.floor(coord.height / 2),
            }));
          }
        } else {
          // Switch back to desktop coordinates
          if (this.calibration.desktopCoordinates) {
            this.calibration.frameCoordinates = [...this.calibration.desktopCoordinates];
          }
        }

        // Update current frame display
        const currentFrame = parseInt(document.getElementById("current-frame").textContent);
        this.updateCalibrationFrame(currentFrame);
      });
    }

    // Initialize coordinates array
    let originalCoords = [];

    // Get existing coordinates if available
    if (this.animationManager && this.animationManager.animations[animationName] && this.animationManager.animations[animationName].handCoordinates) {
      originalCoords = this.animationManager.animations[animationName].handCoordinates;
      console.log("Using coordinates from animation manager:", originalCoords);
    } else if (this.trumpAnimations && this.trumpAnimations[animationName] && this.trumpAnimations[animationName].handCoordinates) {
      originalCoords = this.trumpAnimations[animationName].handCoordinates;
      console.log("Using coordinates from trumpAnimations:", originalCoords);
    } else {
      console.warn("No existing coordinates found for this animation");
    }

    // Make deep copy to avoid reference issues
    originalCoords.forEach((coord) => {
      this.calibration.frameCoordinates.push({ ...coord });
    });

    // Fill with defaults if needed
    while (this.calibration.frameCoordinates.length < frameCount) {
      this.calibration.frameCoordinates.push({ x: 100, y: 50, width: 50, height: 50 });
    }

    console.log("Frame coordinates initialized:", this.calibration.frameCoordinates);

    // IMPORTANT: Stop any running animations first
    if (this.animationManager) {
      console.log("Stopping animation manager");
      this.animationManager.stop();
    }

    // Also clear any animation intervals from the game state
    if (this.gameState.animation && this.gameState.animation.interval) {
      console.log("Clearing game state animation interval");
      clearInterval(this.gameState.animation.interval);
      this.gameState.animation.interval = null;
    }

    // Set animation to the calibration target but do not start the animation loop
    if (this.animationManager) {
      console.log(`Setting animation to ${animationName} without playing`);
      // Use internal methods to avoid starting the animation loop
      const animation = this.animationManager.animations[animationName];
      if (animation) {
        this.animationManager.currentState = animationName;
        // Update sprite but don't start interval
        if (this.animationManager.trumpSprite) {
          this.animationManager.trumpSprite.style.backgroundImage = `url('${animation.spriteSheet}')`;
        }
      } else {
        console.error(`Animation ${animationName} not found in animationManager`);
      }
    } else if (typeof window.changeAnimationState === "function") {
      console.log(`Using window.changeAnimationState to set animation to ${animationName}`);
      window.changeAnimationState(animationName);
      // Stop animation from playing automatically
      if (this.gameState.animation && this.gameState.animation.interval) {
        clearInterval(this.gameState.animation.interval);
        this.gameState.animation.interval = null;
      }
    } else {
      console.error("No way to set animation state found");
    }

    // Show first frame
    this.updateCalibrationFrame(0);

    // Add event listeners
    document.getElementById("prev-frame").addEventListener("click", () => {
      const currentFrame = parseInt(document.getElementById("current-frame").textContent);
      if (currentFrame > 0) {
        this.updateCalibrationFrame(currentFrame - 1);
      }
    });

    document.getElementById("next-frame").addEventListener("click", () => {
      const currentFrame = parseInt(document.getElementById("current-frame").textContent);
      const totalFrames = parseInt(document.getElementById("total-frames").textContent);
      if (currentFrame < totalFrames) {
        this.updateCalibrationFrame(currentFrame + 1);
      }
    });

    document.getElementById("save-coords").addEventListener("click", () => {
      this.saveCalibration();
    });

    document.getElementById("cancel-calib").addEventListener("click", () => {
      this.cancelCalibration();
    });

    // Make the hitbox draggable
    this.makeHitboxDraggable();

    // Also allow clicking in the sprite container to position the hitbox
    const trumpContainer = document.getElementById("trump-sprite-container");
    if (trumpContainer) {
      this.calibration.originalContainerClick = trumpContainer.onclick;
      trumpContainer.onclick = (e) => {
        if (!this.calibration.isCalibrating) return;

        const containerRect = trumpContainer.getBoundingClientRect();
        const x = e.clientX - containerRect.left - 25; // Center the 50px hitbox
        const y = e.clientY - containerRect.top - 25;

        const trumpHandHitBox = document.getElementById("trump-hand-hitbox");
        if (trumpHandHitBox) {
          trumpHandHitBox.style.left = `${x}px`;
          trumpHandHitBox.style.top = `${y}px`;

          // Update stored coordinates
          const currentFrame = parseInt(document.getElementById("current-frame").textContent);
          this.calibration.frameCoordinates[currentFrame] = {
            x: Math.round(x),
            y: Math.round(y),
            width: parseInt(trumpHandHitBox.style.width) || 50,
            height: parseInt(trumpHandHitBox.style.height) || 50,
          };

          this.updateCoordsDisplay(currentFrame);
        }
      };
    } else {
      console.error("Trump sprite container not found");
    }
  }

  updateCalibrationFrame(frameIndex) {
    console.log(`Updating to calibration frame ${frameIndex}`);

    // Update the frame counter
    const currentFrameElement = document.getElementById("current-frame");
    if (currentFrameElement) {
      currentFrameElement.textContent = frameIndex;
    }

    // Update the animation frame visually
    if (this.animationManager) {
      console.log(`Using animationManager.setFrame(${frameIndex})`);
      this.animationManager.setFrame(frameIndex);
    } else if (this.gameState.animation) {
      console.log(`Using gameState animation system`);
      this.gameState.animation.currentFrame = frameIndex;
      if (typeof window.updateAnimationFrame === "function") {
        window.updateAnimationFrame(frameIndex);
      } else {
        console.error("window.updateAnimationFrame function not found");
      }
    } else {
      console.error("No animation system available to update frame");
    }

    // Important: Always use the calibration's saved coordinates
    const coords = this.calibration.frameCoordinates[frameIndex];
    if (!coords) {
      console.error(`No coordinates found for frame ${frameIndex}`);
      return;
    }

    // Apply the saved coordinates directly to the hitbox
    const trumpHandHitBox = document.getElementById("trump-hand-hitbox");
    if (!trumpHandHitBox) {
      console.error("Hand hitbox not found when updating frame");
      return;
    }

    console.log(`Setting hitbox to position x:${coords.x}, y:${coords.y}, w:${coords.width}, h:${coords.height}`);

    trumpHandHitBox.style.left = `${coords.x}px`;
    trumpHandHitBox.style.top = `${coords.y}px`;
    trumpHandHitBox.style.width = `${coords.width}px`;
    trumpHandHitBox.style.height = `${coords.height}px`;
    trumpHandHitBox.style.display = "block";

    // Make hitbox visible for calibration
    trumpHandHitBox.style.backgroundColor = "rgba(255, 0, 0, 0.4)";
    trumpHandHitBox.style.border = "2px solid red";

    // Skip the HandHitboxManager for now since we're manually positioning
    // This prevents it from overriding our custom positions

    // Update the hitbox size controls
    if (!document.getElementById("hitbox-width-input")) {
      const sizeControls = document.createElement("div");
      sizeControls.classList.add("controls-margin-bottom");
      sizeControls.innerHTML = `
        <div>
          <label>Width: <input type="number" id="hitbox-width-input" min="20" max="200" value="${coords.width}" style="width: 50px;"></label>
          <label>Height: <input type="number" id="hitbox-height-input" min="20" max="200" value="${coords.height}" style="width: 50px;"></label>
          <button id="apply-size-btn">Apply Size</button>
        </div>
      `;

      // Insert before the coords display
      const coordsDisplay = document.getElementById("coords-display");
      coordsDisplay.parentNode.insertBefore(sizeControls, coordsDisplay);

      // Add event listener
      document.getElementById("apply-size-btn").addEventListener("click", () => {
        const width = parseInt(document.getElementById("hitbox-width-input").value);
        const height = parseInt(document.getElementById("hitbox-height-input").value);
        const currentFrame = parseInt(document.getElementById("current-frame").textContent);

        // Update size in the calibration data
        this.calibration.frameCoordinates[currentFrame].width = width;
        this.calibration.frameCoordinates[currentFrame].height = height;

        // Update the actual hitbox
        const trumpHandHitBox = document.getElementById("trump-hand-hitbox");
        if (trumpHandHitBox) {
          trumpHandHitBox.style.width = `${width}px`;
          trumpHandHitBox.style.height = `${height}px`;
        }

        this.updateCoordsDisplay(currentFrame);
      });
    } else {
      // Just update the values if controls already exist
      document.getElementById("hitbox-width-input").value = coords.width;
      document.getElementById("hitbox-height-input").value = coords.height;
    }

    this.updateCoordsDisplay(frameIndex);
  }

  formatCoordinatesOutput() {
    const animName = this.calibration.currentAnimation;
    const isMobileCalibration = document.getElementById("mobile-coords-toggle")?.checked || false;

    // Get the map for reference size calculation
    const mapElem = document.getElementById("map-background");
    const mapScale = mapElem ? mapElem.clientWidth / mapElem.naturalWidth : 1.0;

    let output = `${animName}: {\n`;

    // For our new approach, we'll always store base coordinates relative to natural map size
    output += `  // Base coordinates for ${animName} (calibrated at scale ${mapScale.toFixed(2)})\n`;
    output += `  handCoordinates: [\n`;

    this.calibration.frameCoordinates.forEach((coords, index) => {
      // Calculate coordinates relative to the natural map size
      const naturalX = Math.round(coords.x / mapScale);
      const naturalY = Math.round(coords.y / mapScale);
      const naturalWidth = Math.round(coords.width / mapScale);
      const naturalHeight = Math.round(coords.height / mapScale);

      output += `    { x: ${naturalX}, y: ${naturalY}, width: ${naturalWidth}, height: ${naturalHeight} }`;
      if (index < this.calibration.frameCoordinates.length - 1) {
        output += ",";
      }
      output += ` // Frame ${index}\n`;
    });

    output += `  ],\n`;

    // Include a reference to the scale at which these coordinates were calibrated
    output += `  calibrationScale: ${mapScale.toFixed(2)},\n`;

    output += `},`;

    return output;
  }
  saveCalibration() {
    // Copy to clipboard
    const formattedOutput = this.formatCoordinatesOutput();

    console.log("Saving calibration:", formattedOutput);

    navigator.clipboard
      .writeText(formattedOutput)
      .then(() => {
        console.log("Coordinates copied to clipboard!");
        alert("Coordinates copied to clipboard! These coordinates will be automatically scaled at runtime.");
      })
      .catch((err) => {
        console.error("Error copying to clipboard:", err);
        alert("Failed to copy to clipboard. See console for details.");
      });

    // Get the map for reference scale
    const mapElem = document.getElementById("map-background");
    const mapScale = mapElem ? mapElem.clientWidth / mapElem.naturalWidth : 1.0;

    // Convert coordinates to be relative to natural map size
    const naturalCoordinates = this.calibration.frameCoordinates.map((coords) => ({
      x: Math.round(coords.x / mapScale),
      y: Math.round(coords.y / mapScale),
      width: Math.round(coords.width / mapScale),
      height: Math.round(coords.height / mapScale),
    }));

    // Update the animation object in the current session
    if (this.animationManager && this.animationManager.animations[this.calibration.currentAnimation]) {
      console.log("Updating animationManager with new coordinates");

      // Store natural size coordinates
      this.animationManager.animations[this.calibration.currentAnimation].handCoordinates = [...naturalCoordinates];

      // Also store the calibration scale for reference
      this.animationManager.animations[this.calibration.currentAnimation].calibrationScale = mapScale;

      // Make sure the HandHitboxManager gets updated too
      if (this.animationManager.handHitboxManager) {
        // Re-set the animation data to ensure it gets the updated coordinates
        this.animationManager.handHitboxManager.setAnimationsData(this.animationManager.animations);
      }
    } else if (this.trumpAnimations && this.trumpAnimations[this.calibration.currentAnimation]) {
      console.log("Updating trumpAnimations with new coordinates");
      this.trumpAnimations[this.calibration.currentAnimation].handCoordinates = [...naturalCoordinates];
      this.trumpAnimations[this.calibration.currentAnimation].calibrationScale = mapScale;
    } else {
      console.warn("No animation object found to update with new coordinates");
    }

    this.endCalibration();
  }
  // Cancel calibration
  cancelCalibration() {
    this.endCalibration();
  }

  endCalibration() {
    // Remove calibration panel
    const panel = document.getElementById("calibration-panel");
    if (panel) panel.remove();

    // Restore event handlers
    const trumpHandHitBox = document.getElementById("trump-hand-hitbox");
    if (trumpHandHitBox) {
      trumpHandHitBox.onclick = this.calibration.originalHandlerClick;
      trumpHandHitBox.ontouchstart = this.calibration.originalHandlerTouch;
    }

    // Restore container click handler
    const trumpContainer = document.getElementById("trump-sprite-container");
    if (trumpContainer && this.calibration.originalContainerClick) {
      trumpContainer.onclick = this.calibration.originalContainerClick;
    }

    // Restore original animation state
    if (this.animationManager) {
      // Always transition to idle first for consistent animation flow
      this.animationManager.changeState("idle", () => {
        // Only change from idle to another state if needed
        if (this.calibration.originalAnimState && this.calibration.originalAnimState !== "idle") {
          this.animationManager.changeState(this.calibration.originalAnimState);
        }
      });
    } else if (typeof window.changeAnimationState === "function") {
      window.changeAnimationState("idle", () => {
        if (this.calibration.originalAnimState && this.calibration.originalAnimState !== "idle") {
          window.changeAnimationState(this.calibration.originalAnimState);
        }
      });
    }

    // Resume game if it was playing and not already paused before calibration
    if (this.calibration.wasPlaying && !this.calibration.wasPaused) {
      // Use togglePause to resume the game if it's paused and was not paused originally
      if (typeof window.togglePause === "function" && this.gameState.isPaused) {
        window.togglePause();
        console.log("Game resumed after calibration using togglePause");
      } else {
        // Fallback to manual resume
        this.gameState.isPlaying = true;
        this.gameState.countdownTimer = setInterval(window.updateCountdown, 1000);

        if (typeof window.scheduleNextGrab === "function") {
          try {
            window.scheduleNextGrab();
          } catch (err) {
            console.warn("scheduleNextGrab function not available or failed:", err);
            // Continue with next available approach
            if (typeof window.startAnimationLoop === "function") {
              window.startAnimationLoop();
            }
          }
        } else if (typeof window.startAnimationLoop === "function") {
          window.startAnimationLoop();
        }
        console.log("Game manually resumed (no togglePause function available)");
      }
    }

    // Reset calibration state
    this.calibration.isCalibrating = false;

    // Remove debug mode unless it was on before
    if (!this.enabled) {
      document.body.classList.remove("debug-mode");
    }
  }
  // Update the game HUD (used by developer controls)
  updateHUD() {
    if (typeof window.updateHUD === "function") {
      window.updateHUD();
    } else {
      // Fallback if updateHUD isn't available
      const timeElement = document.getElementById("time-value");
      const scoreElement = document.getElementById("score-value");

      if (timeElement) timeElement.textContent = this.gameState.timeRemaining;
      if (scoreElement) scoreElement.textContent = this.gameState.score;
    }
  }

  setupProtestorControls() {
    // Add a heading for protestor controls
    const protestorHeading = document.createElement("h3");
    protestorHeading.textContent = "Protestor Testing";
    protestorHeading.classList.add("debug-section-heading");
    this.panel.appendChild(protestorHeading);

    // Create container for protestor controls
    const protestorControls = document.createElement("div");
    protestorControls.id = "protestor-debug-controls";
    protestorControls.classList.add("dev-controls-section");
    protestorControls.style.marginBottom = "10px";
    this.panel.appendChild(protestorControls);

    // Country selection
    const countrySelectDiv = document.createElement("div");
    countrySelectDiv.classList.add("controls-margin-bottom");

    const countryLabel = document.createElement("label");
    countryLabel.textContent = "Country: ";
    countrySelectDiv.appendChild(countryLabel);

    const countrySelect = document.createElement("select");
    countrySelect.id = "protestor-country-select";

    // Add options
    const countries = ["canada", "mexico", "greenland"];
    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country.charAt(0).toUpperCase() + country.slice(1);
      countrySelect.appendChild(option);
    });

    countrySelectDiv.appendChild(countrySelect);
    protestorControls.appendChild(countrySelectDiv);

    // Action buttons
    const actionButtonsDiv = document.createElement("div");
    actionButtonsDiv.classList.add("controls-margin-bottom");

    const showBtn = document.createElement("button");
    showBtn.textContent = "Show Protestors";
    showBtn.id = "show-protestors-btn";
    actionButtonsDiv.appendChild(showBtn);

    const hideBtn = document.createElement("button");
    hideBtn.textContent = "Hide Protestors";
    hideBtn.id = "hide-protestors-btn";
    actionButtonsDiv.appendChild(hideBtn);

    const clickBtn = document.createElement("button");
    clickBtn.textContent = "Simulate Click";
    clickBtn.id = "click-protestors-btn";
    actionButtonsDiv.appendChild(clickBtn);

    protestorControls.appendChild(actionButtonsDiv);

    // Hitbox visibility toggle
    const hitboxVisibilityDiv = document.createElement("div");
    hitboxVisibilityDiv.classList.add("controls-margin-bottom");

    const hitboxVisLabel = document.createElement("label");
    hitboxVisLabel.innerHTML = `<input type="checkbox" id="show-protestor-hitboxes"> Show Protestor Hitboxes`;
    hitboxVisibilityDiv.appendChild(hitboxVisLabel);

    protestorControls.appendChild(hitboxVisibilityDiv);

    // Calibration button
    const calibrateDiv = document.createElement("div");
    calibrateDiv.classList.add("controls-margin-bottom");

    const calibrateBtn = document.createElement("button");
    calibrateBtn.textContent = "Calibrate Protestor Hitboxes";
    calibrateBtn.id = "calibrate-protestors-btn";
    calibrateDiv.appendChild(calibrateBtn);

    protestorControls.appendChild(calibrateDiv);

    // Status display
    const statusDisplay = document.createElement("div");
    statusDisplay.id = "protestor-status";
    statusDisplay.classList.add("debug-status-div");
    statusDisplay.style.fontSize = "10px";
    statusDisplay.style.marginTop = "10px";
    statusDisplay.textContent = "Select a country and use the controls above";

    protestorControls.appendChild(statusDisplay);

    // Add event listeners
    this.setupProtestorEventListeners();
  }

  setupProtestorEventListeners() {
    // Show protestors button
    document.getElementById("show-protestors-btn").addEventListener("click", () => {
      const country = document.getElementById("protestor-country-select").value;

      if (window.freedomManager) {
        window.freedomManager.debugShowProtestors(country);
        this.showButtonEffect(document.getElementById("show-protestors-btn"));
      } else {
        console.error("FreedomManager not available");
      }
    });

    // Hide protestors button
    document.getElementById("hide-protestors-btn").addEventListener("click", () => {
      const country = document.getElementById("protestor-country-select").value;

      if (window.freedomManager) {
        window.freedomManager.hideProtestors(country);
        this.showButtonEffect(document.getElementById("hide-protestors-btn"));
      } else {
        console.error("FreedomManager not available");
      }
    });

    // Simulate click button
    document.getElementById("click-protestors-btn").addEventListener("click", () => {
      const country = document.getElementById("protestor-country-select").value;

      if (window.freedomManager) {
        window.freedomManager.handleProtestorClick(country);
        this.showButtonEffect(document.getElementById("click-protestors-btn"));
      } else {
        console.error("FreedomManager not available");
      }
    });

    // Toggle hitbox visibility
    document.getElementById("show-protestor-hitboxes").addEventListener("change", (e) => {
      if (window.protestorHitboxManager) {
        window.protestorHitboxManager.setDebugMode(e.target.checked);
      } else {
        console.error("ProtestorHitboxManager not available");
      }
    });

    // Calibrate button
    document.getElementById("calibrate-protestors-btn").addEventListener("click", () => {
      this.startProtestorCalibration();
    });
  }

  startProtestorCalibration() {
    if (!window.protestorHitboxManager) {
      alert("ProtestorHitboxManager not found!");
      return;
    }

    // Create calibration dialog
    const dialog = document.createElement("div");
    dialog.classList.add("calibration-dialog");

    const title = document.createElement("h3");
    title.textContent = "Protestor Hitbox Calibration";
    dialog.appendChild(title);

    // Country selector
    const countrySelect = document.createElement("select");
    const countries = ["canada", "mexico", "greenland"];

    countries.forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country.charAt(0).toUpperCase() + country.slice(1);
      countrySelect.appendChild(option);
    });

    dialog.appendChild(countrySelect);

    // Buttons
    const startBtn = document.createElement("button");
    startBtn.textContent = "Start Calibration";
    startBtn.classList.add("calibration-dialog-button");
    startBtn.addEventListener("click", () => {
      this.beginProtestorCalibration(countrySelect.value);
      dialog.remove();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.classList.add("calibration-dialog-button");
    cancelBtn.addEventListener("click", () => {
      dialog.remove();
    });

    dialog.appendChild(startBtn);
    dialog.appendChild(cancelBtn);
    document.body.appendChild(dialog);
  }

  beginProtestorCalibration(countryId) {
    if (!window.protestorHitboxManager) {
      alert("ProtestorHitboxManager not found!");
      return;
    }
  
    // Save game state
    const wasPlaying = this.gameState.isPlaying;
    const wasPaused = this.gameState.isPaused;
    
    // Pause the game if needed
    if (wasPlaying && !wasPaused) {
      if (typeof window.togglePause === "function") {
        window.togglePause();
      } else {
        this.gameState.isPaused = true;
      }
    }
    
    // Store calibration state
    this.protestorCalibration = {
      isCalibrating: true,
      country: countryId,
      wasPlaying: wasPlaying,
      wasPaused: wasPaused,
      locationIndex: 0,
      totalLocations: window.protestorHitboxManager.spawnLocations[countryId]?.length || 3,
      originalCoordinates: JSON.parse(JSON.stringify(window.protestorHitboxManager.spawnLocations[countryId] || []))
    };
    
    // Force debug mode for hitbox visibility
    document.body.classList.add("debug-mode");
    window.protestorHitboxManager.setDebugMode(true);
    
    // Show country's protestor hitbox for calibration
    if (window.freedomManager) {
      window.freedomManager.debugShowProtestors(countryId);
    }
    
    // Create calibration panel
    const panel = document.createElement("div");
    panel.id = "protestor-calibration-panel";
    panel.classList.add('calibration-panel');
    
    panel.innerHTML = `
      <h4>Calibrating Protestor: ${countryId}</h4>
      <div id="protestor-coords-display"></div>
      <div class="controls-margin-bottom">
        <label>Location: 
          <select id="location-index-select"></select>
        </label>
        <button id="add-location-btn">+</button>
        <button id="remove-location-btn">-</button>
      </div>
      <div class="controls-margin-bottom">
        <label>X: <input type="number" id="protestor-x" style="width: 50px;"></label>
        <label>Y: <input type="number" id="protestor-y" style="width: 50px;"></label>
      </div>
      <div class="controls-margin-bottom">
        <label>Width: <input type="number" id="protestor-width" style="width: 50px;"></label>
        <label>Height: <input type="number" id="protestor-height" style="width: 50px;"></label>
      </div>
      <button id="update-protestor-position">Update Position</button>
      <button id="save-protestor-position">Save Position</button>
      <button id="cancel-protestor-calib">Cancel</button>
      <div id="protestor-calib-output" style="margin-top:10px;font-size:10px;max-height:100px;overflow-y:auto;"></div>
    `;
    
    document.body.appendChild(panel);
    
    // Populate location selector
    this.populateLocationSelect();
    
    // Set initial values based on the first location
    this.updateLocationFields(0);
    
    // Add event listeners for location selector
    document.getElementById("location-index-select").addEventListener("change", (e) => {
      const index = parseInt(e.target.value);
      this.protestorCalibration.locationIndex = index;
      this.updateLocationFields(index);
    });
    
    // Add/remove location buttons
    document.getElementById("add-location-btn").addEventListener("click", () => {
      this.addProtestorLocation();
    });
    
    document.getElementById("remove-location-btn").addEventListener("click", () => {
      this.removeProtestorLocation();
    });
    
    // Add event listeners
    document.getElementById("update-protestor-position").addEventListener("click", () => {
      const x = parseInt(document.getElementById("protestor-x").value);
      const y = parseInt(document.getElementById("protestor-y").value);
      const width = parseInt(document.getElementById("protestor-width").value);
      const height = parseInt(document.getElementById("protestor-height").value);
      
      // Update the hitbox
      const hitbox = window.protestorHitboxManager.protestorHitboxes[countryId].element;
      if (hitbox) {
        hitbox.style.left = `${x}px`;
        hitbox.style.top = `${y}px`;
        hitbox.style.width = `${width}px`;
        hitbox.style.height = `${height}px`;
        
        this.updateProtestorCoordsDisplay(x, y, width, height);
      }
    });
    
    document.getElementById("save-protestor-position").addEventListener("click", () => {
      this.saveProtestorCalibration();
    });
    
    document.getElementById("cancel-protestor-calib").addEventListener("click", () => {
      this.cancelProtestorCalibration();
    });
    
    // Make the hitbox draggable
    this.makeProtestorHitboxDraggable(countryId);
  }
  
  // New method to populate location selector
  populateLocationSelect() {
    const select = document.getElementById("location-index-select");
    if (!select) return;
    
    // Clear existing options
    select.innerHTML = "";
    
    // Add options for each location
    for (let i = 0; i < this.protestorCalibration.totalLocations; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Location ${i + 1}`;
      select.appendChild(option);
    }
    
    // Set current selection
    select.value = this.protestorCalibration.locationIndex;
  }
  
  // New method to update form fields based on selected location
  updateLocationFields(index) {
    const countryId = this.protestorCalibration.country;
    const locations = window.protestorHitboxManager.spawnLocations[countryId] || [];
    
    // Get the location data
    const location = locations[index] || { x: 1000, y: 1000, width: 300, height: 300, calibrationScale: 0.24 };
    
    // Get the map for scaling
    const mapElem = document.getElementById("map-background");
    const mapScale = mapElem ? (mapElem.clientWidth / mapElem.naturalWidth) : 0.24;
    
    // Calculate screen coordinates
    const screenX = Math.round(location.x * mapScale);
    const screenY = Math.round(location.y * mapScale);
    const screenWidth = Math.round(location.width * mapScale);
    const screenHeight = Math.round(location.height * mapScale);
    
    // Update form fields
    document.getElementById("protestor-x").value = screenX;
    document.getElementById("protestor-y").value = screenY;
    document.getElementById("protestor-width").value = screenWidth;
    document.getElementById("protestor-height").value = screenHeight;
    
    // Update hitbox position
    const hitbox = window.protestorHitboxManager.protestorHitboxes[countryId].element;
    if (hitbox) {
      hitbox.style.left = `${screenX}px`;
      hitbox.style.top = `${screenY}px`;
      hitbox.style.width = `${screenWidth}px`;
      hitbox.style.height = `${screenHeight}px`;
    }
    
    this.updateProtestorCoordsDisplay(screenX, screenY, screenWidth, screenHeight);
  }
  
  // Methods to add/remove locations
  addProtestorLocation() {
    const countryId = this.protestorCalibration.country;
    
    // Increment location count
    this.protestorCalibration.totalLocations++;
    
    // Add a new location based on the current one
    const currentIndex = this.protestorCalibration.locationIndex;
    const locations = window.protestorHitboxManager.spawnLocations[countryId] || [];
    const baseLocation = locations[currentIndex] || locations[0] || { x: 1000, y: 1000, width: 300, height: 300, calibrationScale: 0.24 };
    
    // Create a slightly offset new location
    const newLocation = {
      x: baseLocation.x + 100,
      y: baseLocation.y + 50,
      width: baseLocation.width,
      height: baseLocation.height,
      calibrationScale: baseLocation.calibrationScale
    };
    
    // Add to the array
    if (!window.protestorHitboxManager.spawnLocations[countryId]) {
      window.protestorHitboxManager.spawnLocations[countryId] = [];
    }
    window.protestorHitboxManager.spawnLocations[countryId].push(newLocation);
    
    // Update the select dropdown
    this.populateLocationSelect();
    
    // Switch to the new location
    document.getElementById("location-index-select").value = this.protestorCalibration.totalLocations - 1;
    this.protestorCalibration.locationIndex = this.protestorCalibration.totalLocations - 1;
    
    // Update fields
    this.updateLocationFields(this.protestorCalibration.locationIndex);
  }
  
  removeProtestorLocation() {
    if (this.protestorCalibration.totalLocations <= 1) {
      alert("Cannot remove the last location");
      return;
    }
    
    const countryId = this.protestorCalibration.country;
    const currentIndex = this.protestorCalibration.locationIndex;
    
    // Remove the current location
    if (window.protestorHitboxManager.spawnLocations[countryId]) {
      window.protestorHitboxManager.spawnLocations[countryId].splice(currentIndex, 1);
    }
    
    // Decrement location count
    this.protestorCalibration.totalLocations--;
    
    // Update location index if needed
    if (this.protestorCalibration.locationIndex >= this.protestorCalibration.totalLocations) {
      this.protestorCalibration.locationIndex = this.protestorCalibration.totalLocations - 1;
    }
    
    // Update the select dropdown
    this.populateLocationSelect();
    
    // Update fields
    this.updateLocationFields(this.protestorCalibration.locationIndex);
  }


  makeProtestorHitboxDraggable(countryId) {
    const hitbox = window.protestorHitboxManager.protestorHitboxes[countryId].element;
    if (!hitbox) return;

    let isDragging = false;
    let offsetX, offsetY;

    // Remove existing listeners and clone
    const newHitbox = hitbox.cloneNode(true);
    hitbox.parentNode.replaceChild(newHitbox, hitbox);
    window.protestorHitboxManager.protestorHitboxes[countryId].element = newHitbox;

    // Add new mouse handlers
    newHitbox.addEventListener("mousedown", (e) => {
      isDragging = true;
      const hitboxRect = newHitbox.getBoundingClientRect();
      offsetX = e.clientX - hitboxRect.left;
      offsetY = e.clientY - hitboxRect.top;

      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;

      const x = e.clientX - offsetX;
      const y = e.clientY - offsetY;

      newHitbox.style.left = `${x}px`;
      newHitbox.style.top = `${y}px`;

      // Update input fields
      document.getElementById("protestor-x").value = x;
      document.getElementById("protestor-y").value = y;

      this.updateProtestorCoordsDisplay(x, y, parseInt(newHitbox.style.width), parseInt(newHitbox.style.height));
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });

    // Also add click handler to the game container for easier positioning
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.addEventListener("click", (e) => {
        if (!this.protestorCalibration || !this.protestorCalibration.isCalibrating) return;

        const rect = gameContainer.getBoundingClientRect();
        const x = e.clientX - rect.left - parseInt(newHitbox.style.width) / 2;
        const y = e.clientY - rect.top - parseInt(newHitbox.style.height) / 2;

        newHitbox.style.left = `${x}px`;
        newHitbox.style.top = `${y}px`;

        document.getElementById("protestor-x").value = x;
        document.getElementById("protestor-y").value = y;

        this.updateProtestorCoordsDisplay(x, y, parseInt(newHitbox.style.width), parseInt(newHitbox.style.height));
      });
    }
  }

  updateProtestorCoordsDisplay(x, y, width, height) {
    const display = document.getElementById("protestor-coords-display");
    if (display) {
      display.textContent = `X: ${x}, Y: ${y}, W: ${width}, H: ${height}`;

      // Get the map for reference scale
      const mapElem = document.getElementById("map-background");
      const mapScale = mapElem ? mapElem.clientWidth / mapElem.naturalWidth : 1.0;

      // Calculate natural coordinates
      const naturalX = Math.round(x / mapScale);
      const naturalY = Math.round(y / mapScale);
      const naturalWidth = Math.round(width / mapScale);
      const naturalHeight = Math.round(height / mapScale);

      // Update output
      const output = document.getElementById("protestor-calib-output");
      if (output) {
        output.textContent = this.formatProtestorCoordinatesOutput(
          this.protestorCalibration.country,
          naturalX,
          naturalY,
          naturalWidth,
          naturalHeight,
          mapScale
        );
      }
    }
  }

  formatProtestorCoordinatesOutput(countryId, locations, mapScale) {
    let result = `// Spawn locations for ${countryId} protestors\n`;
    result += `this.spawnLocations = {\n`;
    result += `  ...this.spawnLocations,\n`;
    result += `  ${countryId}: [\n`;
    
    locations.forEach((loc, index) => {
      result += `    {\n`;
      result += `      x: ${loc.x},\n`;
      result += `      y: ${loc.y},\n`;
      result += `      width: ${loc.width},\n`;
      result += `      height: ${loc.height},\n`;
      result += `      calibrationScale: ${mapScale.toFixed(2)}\n`;
      result += `    }${index < locations.length - 1 ? ',' : ''}\n`;
    });
    
    result += `  ]\n`;
    result += `};\n`;
    result += `// Calibrated at map scale: ${mapScale.toFixed(2)}`;
    
    return result;
  }
  
  saveProtestorCalibration() {
    const countryId = this.protestorCalibration.country;
    
    // Get the map for scaling
    const mapElem = document.getElementById("map-background");
    const mapScale = mapElem ? (mapElem.clientWidth / mapElem.naturalWidth) : 1.0;
    
    // Get current values from form
    const x = parseInt(document.getElementById("protestor-x").value);
    const y = parseInt(document.getElementById("protestor-y").value);
    const width = parseInt(document.getElementById("protestor-width").value);
    const height = parseInt(document.getElementById("protestor-height").value);
    
    // Calculate natural coordinates
    const naturalX = Math.round(x / mapScale);
    const naturalY = Math.round(y / mapScale);
    const naturalWidth = Math.round(width / mapScale);
    const naturalHeight = Math.round(height / mapScale);
    
    // Update the current location
    const currentIndex = this.protestorCalibration.locationIndex;
    if (!window.protestorHitboxManager.spawnLocations[countryId]) {
      window.protestorHitboxManager.spawnLocations[countryId] = [];
    }
    
    // Ensure the array has enough elements
    while (window.protestorHitboxManager.spawnLocations[countryId].length <= currentIndex) {
      window.protestorHitboxManager.spawnLocations[countryId].push({
        x: 1000,
        y: 1000,
        width: 300,
        height: 300,
        calibrationScale: mapScale
      });
    }
    
    // Update the location
    window.protestorHitboxManager.spawnLocations[countryId][currentIndex] = {
      x: naturalX,
      y: naturalY,
      width: naturalWidth,
      height: naturalHeight,
      calibrationScale: mapScale
    };
    
    // Generate output for all locations
    const output = this.formatProtestorCoordinatesOutput(
      countryId,
      window.protestorHitboxManager.spawnLocations[countryId],
      mapScale
    );
    
    // Copy to clipboard
    navigator.clipboard
      .writeText(output)
      .then(() => {
        console.log("Protestor coordinates copied to clipboard!");
        alert("Protestor coordinates copied to clipboard!");
      })
      .catch((err) => {
        console.error("Error copying to clipboard:", err);
        alert("Failed to copy to clipboard. See console for details.");
      });
    
    // Update the display
    const outputElement = document.getElementById("protestor-calib-output");
    if (outputElement) {
      outputElement.textContent = output;
    }
  }

  cancelProtestorCalibration() {
    // Restore original coordinates
    if (window.protestorHitboxManager && this.protestorCalibration) {
      const countryId = this.protestorCalibration.country;

      // Restore the original coordinates
      window.protestorHitboxManager.defaultCoordinates[countryId] = {
        ...this.protestorCalibration.originalCoordinates,
      };

      // Reposition the hitbox
      window.protestorHitboxManager.positionHitbox(countryId);
    }

    this.endProtestorCalibration();
  }

  endProtestorCalibration() {
    // Remove calibration panel
    const panel = document.getElementById("protestor-calibration-panel");
    if (panel) panel.remove();

    // Hide protestors if needed
    if (window.freedomManager && this.protestorCalibration) {
      window.freedomManager.hideProtestors(this.protestorCalibration.country);
    }

    // Resume game if it was playing and not already paused
    if (this.protestorCalibration && this.protestorCalibration.wasPlaying && !this.protestorCalibration.wasPaused) {
      if (typeof window.togglePause === "function" && this.gameState.isPaused) {
        window.togglePause();
      } else {
        this.gameState.isPaused = false;
      }
    }

    // Reset debug mode
    if (!this.enabled) {
      document.body.classList.remove("debug-mode");
    }

    // Reset protestor calibration state
    // Update protestorCalibration initialization in setupProtestorControls()
    this.protestorCalibration = {
      isCalibrating: false,
      country: null,
      wasPlaying: false,
      wasPaused: false,
      originalCoordinates: null,
      locationIndex: 0, // Which spawn location we're currently editing
      totalLocations: 3, // Default number of locations to create
    };
  }

  cleanup() {
    // Reset any layers
    this.setEditModeLayering(false);

    // Remove any drag points
    document.querySelectorAll(".drag-point").forEach((point) => point.remove());

    // Remove any done editing button
    if (this.doneEditingBtn) {
      this.doneEditingBtn.remove();
      this.doneEditingBtn = null;
    }

    if (this.resistanceStatusInterval) {
      clearInterval(this.resistanceStatusInterval);
      this.resistanceStatusInterval = null;
    }

    // End any calibration
    if (this.calibration.isCalibrating) {
      this.endCalibration();
    }

    // End any protestor calibration
    if (this.protestorCalibration && this.protestorCalibration.isCalibrating) {
      this.endProtestorCalibration();
    }

    // Stop animation info updates
    this.stopAnimationInfoUpdates();
  }

  // Set layer ordering for editing mode
  setEditModeLayering(isEditMode) {
    const trumpContainer = document.getElementById("trump-sprite-container");
    const interactiveOverlay = document.getElementById("interactive-overlay");

    if (trumpContainer && interactiveOverlay) {
      if (isEditMode) {
        // When editing countries or drag points, SVG overlay should be on top
        trumpContainer.style.zIndex = "1"; // Below the SVG
        interactiveOverlay.style.zIndex = "5"; // Above Trump
      } else {
        // Default game state - Trump on top
        trumpContainer.style.zIndex = "3"; // Above the SVG
        interactiveOverlay.style.zIndex = "2"; // Below Trump
      }
    }
  }
}

// Make the class available globally
window.DebugManager = DebugManager;
