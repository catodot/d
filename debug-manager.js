class DebugManager {
  /**
   * Create a new DebugManager instance
   * @param {Object} gameElements - UI element references
   * @param {Object} gameState - Game state reference
   * @param {Object} animationManager - Animation manager reference
   */
  constructor(gameElements, gameState, animationManager) {
    this.enabled = true;
    this.elements = gameElements || {};
    this.gameState = gameState || {};
    this.animationManager = animationManager;

    // Reference to other game managers
    this.audioManager = null;
    this.freedomManager = null;
    this.handHitboxManager = null;
    this.protestorHitboxManager = null;
    this.ufoManager = null;
    this.speedManager = null;

    // Debug panel elements
    this.panel = null;
    this.sections = {};
    this.controls = {};

    // Track open/closed state of collapsible sections
    this.sectionStates = {};

    // Animation tracking and states
    this.animInfoInterval = null;
    this.resistanceStatusInterval = null;

    // Calibration state
    this.calibration = {
      isCalibrating: false,
      originalAnimState: null,
      currentAnimation: null,
      frameCoordinates: [],
      wasPlaying: false,
      wasPaused: false,
      originalHandlerClick: null,
      originalHandlerTouch: null,
      originalContainerClick: null,
    };

    // Protestor calibration state
    this.protestorCalibration = {
      isCalibrating: false,
      country: null,
      wasPlaying: false,
      wasPaused: false,
      originalCoordinates: null,
      locationIndex: 0,
      totalLocations: 3,
    };

    // Bind methods for event handling
    this._bindMethods();

    console.log("[Debug] Debug Manager created");
  }

  /**
   * Bind class methods to maintain 'this' context
   * @private
   */
  _bindMethods() {
    this.togglePanel = this.togglePanel.bind(this);
    this.toggleSectionVisibility = this.toggleSectionVisibility.bind(this);
    this.updateAnimationInfo = this.updateAnimationInfo.bind(this);
    this.updateResistanceStatus = this.updateResistanceStatus.bind(this);
    this.setupKeyBindings = this.setupKeyBindings.bind(this);
  }

  /**
   * Initialize the debug manager and create the debug panel
   */
  init() {
    if (!this.enabled) return;

    console.log("[Debug] Initializing debug tools");

    // Find or create the debug panel
    this.createDebugPanel();

    // Add toggle button to show/hide debug panel
    this.createToggleButton();

    // Set up all sections
    this.setupGameControlsSection();
    this.setupAnimationControlsSection();
    this.setupHitboxControlsSection();
    this.setupAudioControlsSection();
    this.setupResistanceControlsSection();
    this.setupProtestorControlsSection();
    this.setupUfoControlsSection();
    this.setupPerformanceControlsSection();

    // Initialize panel state
    this.panel.classList.toggle("hidden", localStorage.getItem("debugPanelVisible") !== "true");

    // Restore section visibility states from localStorage
    this.restoreSectionStates();

    // Set up key bindings for quick debug actions
    this.setupKeyBindings();

    // Connect to other managers if they exist
    this.connectManagers();

    // Start status updates
    this.startStatusUpdates();

    console.log("[Debug] Debug panel initialized");

    return this;
  }

  /**
   * Create the main debug panel
   */
  createDebugPanel() {
    // Look for existing panel first
    this.panel = document.getElementById("debug-panel");

    // Create new panel if it doesn't exist
    if (!this.panel) {
      this.panel = document.createElement("div");
      this.panel.id = "debug-panel";
      this.panel.className = "dbg-panel";
      document.body.appendChild(this.panel);
    } else {
    }

    // Add panel title
    const title = document.createElement("div");
    title.className = "dbg-panel-title";
    title.innerHTML = "<span>DEBUG TOOLS</span>";
    this.panel.appendChild(title);

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.className = "dbg-close-button";
    closeButton.textContent = "×";
    closeButton.addEventListener("click", () => this.togglePanel(false));
    title.appendChild(closeButton);
  }
  createToggleButton() {
    let toggleBtn = document.getElementById("debug-toggle");

    // Create if it doesn't exist
    if (!toggleBtn) {
      toggleBtn = document.createElement("div");
      toggleBtn.id = "debug-toggle";
      toggleBtn.className = "dbg-toggle";
      toggleBtn.textContent = "D";
      toggleBtn.title = "Toggle Debug Panel";
      document.body.appendChild(toggleBtn);
    }

    // Update toggle button appearance based on panel visibility
    const isVisible = localStorage.getItem("debugPanelVisible") === "true";
    toggleBtn.classList.toggle("dbg-toggle-active", isVisible);

    // Remove any existing click handlers first
    const oldButton = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(oldButton, toggleBtn);

    // Add click handler
    oldButton.addEventListener("click", (e) => {
      console.log("[Debug] Toggle button clicked");
      this.togglePanel();
    });
}

  /**
   * Toggle the debug panel visibility
   * @param {boolean|undefined} forceState - Force a specific state
   */
  togglePanel(forceState) {
    console.log("[Debug] Toggle Panel called with forceState:", forceState);
    console.log("[Debug] Current panel classes:", this.panel.classList.toString());

    // Use classList instead of direct style manipulation
    const panel = this.panel;
    const toggleBtn = document.getElementById("debug-toggle");

    // Determine new visibility state
    const newState = forceState !== undefined ? forceState : panel.classList.contains("hidden");

    console.log("[Debug] Calculated new state:", newState);

    // Toggle panel visibility
    panel.classList.toggle("hidden", !newState);

    // Update toggle button
    if (toggleBtn) {
      toggleBtn.classList.toggle("dbg-toggle-active", newState);
      console.log("[Debug] Toggle button classes:", toggleBtn.classList.toString());
    }

    // Save state to localStorage
    localStorage.setItem("debugPanelVisible", newState);

    // Resume/stop status updates based on visibility
    if (newState) {
      this.startStatusUpdates();
    } else {
      this.stopStatusUpdates();
    }

    console.log("[Debug] Panel final classes:", this.panel.classList.toString());
  }

  /**
   * Create a collapsible section in the debug panel
   * @param {string} id - Section ID
   * @param {string} title - Section title
   * @param {boolean} fullWidth - Whether the content should be full width
   * @returns {Object} Object containing section elements
   */
  createSection(id, title, fullWidth = false) {
    const section = document.createElement("div");
    section.id = `debug-section-${id}`;
    section.className = "dbg-section";

    const header = document.createElement("div");
    header.className = "dbg-section-header";
    header.innerHTML = `<span>${title}</span><span class="toggle-icon">▼</span>`;
    header.addEventListener("click", () => this.toggleSectionVisibility(id));

    const content = document.createElement("div");
    content.id = `debug-section-content-${id}`;
    content.className = fullWidth ? "dbg-section-content full-width" : "dbg-section-content";

    // Check if section should start hidden
    if (this.sectionStates[id] === false) {
      content.classList.add("hidden");
      header.querySelector(".toggle-icon").textContent = "►";
    }

    section.appendChild(header);
    section.appendChild(content);
    this.panel.appendChild(section);

    this.sections[id] = {
      section,
      header,
      content,
    };

    return this.sections[id];
  }

  /**
   * Toggle section visibility
   * @param {string} id - Section ID
   */
  toggleSectionVisibility(id) {
    const section = this.sections[id];
    if (!section) return;

    const content = section.content;
    const icon = section.header.querySelector(".toggle-icon");

    const isHidden = content.classList.toggle("hidden");
    icon.textContent = isHidden ? "►" : "▼";

    // Save state to localStorage
    this.sectionStates[id] = !isHidden;
    this.saveSectionStates();
  }

  /**
   * Save section visibility states to localStorage
   */
  saveSectionStates() {
    localStorage.setItem("debugSectionStates", JSON.stringify(this.sectionStates));
  }

  /**
   * Restore section visibility states from localStorage
   */
  restoreSectionStates() {
    try {
      const savedStates = localStorage.getItem("debugSectionStates");
      if (savedStates) {
        this.sectionStates = JSON.parse(savedStates);
      }
    } catch (e) {
      console.error("Error restoring debug section states:", e);
      this.sectionStates = {};
    }
  }

  /**
   * Create a button element
   * @param {string} text - Button text
   * @param {Function} clickHandler - Click handler function
   * @param {Object} options - Button options
   * @returns {HTMLButtonElement} The created button
   */
  createButton(text, clickHandler, options = {}) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = options.className || "dbg-button";

    if (options.fullWidth) {
      button.classList.add("full-width");
    }

    if (options.small) {
      button.classList.add("small");
    }

    button.addEventListener("click", (e) => {
      if (clickHandler) {
        clickHandler(e);
      }

      if (options.showEffect) {
        this.showButtonEffect(button);
      }
    });

    if (options.tooltip) {
      button.title = options.tooltip;
    }

    return button;
  }

  /**
   * Show a button click effect
   * @param {HTMLButtonElement} button - The button element
   */
  showButtonEffect(button) {
    button.classList.add("button-active");
    setTimeout(() => {
      button.classList.remove("button-active");
    }, 300);
  }

  /**
   * Create a status display element
   * @param {string} id - Status element ID
   * @param {string} defaultText - Default text
   * @returns {HTMLDivElement} The created status element
   */
  createStatus(id, defaultText) {
    const status = document.createElement("div");
    status.id = id;
    status.className = "dbg-status";
    status.textContent = defaultText || "Status information will appear here";
    return status;
  }

  /**
   * Connect to other game managers
   */
  connectManagers() {
    // Find audio manager
    this.audioManager = window.audioManager || (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.audio);

    // Find freedom manager
    this.freedomManager = window.freedomManager || (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.freedom);

    // Find hitbox managers
    this.handHitboxManager = window.handHitboxManager || (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.collision);

    this.protestorHitboxManager =
      window.protestorHitboxManager || (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.protestorHitbox);

    // Find UFO manager
    this.ufoManager = window.ufoManager || (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.ufo);

    // Find speed manager
    this.speedManager = window.speedManager || (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.speed);

    console.log("[Debug] Connected managers:", {
      audioManager: !!this.audioManager,
      freedomManager: !!this.freedomManager,
      handHitboxManager: !!this.handHitboxManager,
      protestorHitboxManager: !!this.protestorHitboxManager,
      ufoManager: !!this.ufoManager,
      speedManager: !!this.speedManager,
    });
  }
  setupKeyBindings() {
    // Remove existing listener if it exists
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
    }
  
    // Create a new bound handler
    this._keydownHandler = (e) => {
      console.log("[Debug] Keydown event:", e.key, e.ctrlKey, e.metaKey);
  
      // Special handling for debug panel
      if (e.key.toLowerCase() === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        console.log("[Debug] Ctrl+D pressed, toggling panel");
        this.togglePanel();
        return;
      }
  
      if (e.key.toLowerCase() === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this._togglePause();
        return;
      }
  
      // Only activate other shortcuts when debug panel is NOT hidden
      if (this.panel.classList.contains('hidden')) return;
      
      // Avoid capturing when user is typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Debug key bindings
      switch (e.key.toLowerCase()) {
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this.toggleHitboxVisibility();
          }
          break;
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this._startCalibration();
          }
          break;
        case 'h':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            this._testAnimationSequence();
          }
          break;
      }
    };
  
    // Add new listener
    document.addEventListener('keydown', this._keydownHandler);
  }

  /**
   * Start status update timers
   */
  startStatusUpdates() {
    // Animation info updates
    if (!this.animInfoInterval) {
      this.animInfoInterval = setInterval(() => {
        this.updateAnimationInfo();
      }, 200);
    }

    // Resistance status updates
    if (!this.resistanceStatusInterval && this.freedomManager) {
      this.resistanceStatusInterval = setInterval(() => {
        this.updateResistanceStatus();
      }, 500);
    }
  }

  /**
   * Stop status update timers
   */
  stopStatusUpdates() {
    if (this.animInfoInterval) {
      clearInterval(this.animInfoInterval);
      this.animInfoInterval = null;
    }

    if (this.resistanceStatusInterval) {
      clearInterval(this.resistanceStatusInterval);
      this.resistanceStatusInterval = null;
    }
  }

  /**
   * Game controls section
   */
  setupGameControlsSection() {
    const { content } = this.createSection("game", "Game Controls");

    // Time control
    const timeControls = document.createElement("div");
    timeControls.className = "dbg-group";
    timeControls.innerHTML = `
        <div class="dbg-label">
          Time:
          <input type="number" id="debug-time-input" class="dbg-input" min="1" max="180" value="${this.gameState?.timeRemaining || 60}">
          sec
        </div>
      `;

    const timeButtons = document.createElement("div");
    timeButtons.style.display = "flex";
    timeButtons.style.gap = "5px";
    timeButtons.style.marginTop = "5px";

    // Create set time button
    const setTimeBtn = this.createButton(
      "Set Time",
      () => {
        const newTime = parseInt(document.getElementById("debug-time-input").value);
        if (newTime && newTime > 0 && this.gameState) {
          this.gameState.timeRemaining = newTime;

          // Update UI
          this._updateGameUI();
          this.showButtonEffect(setTimeBtn);
        }
      },
      { showEffect: true, small: true }
    );
    timeButtons.appendChild(setTimeBtn);

    // Add time buttons
    [10, 30, 60, 120].forEach((seconds) => {
      const btn = this.createButton(
        `${seconds}s`,
        () => {
          if (this.gameState) {
            this.gameState.timeRemaining = seconds;
            document.getElementById("debug-time-input").value = seconds;
            this._updateGameUI();
          }
        },
        { small: true }
      );
      timeButtons.appendChild(btn);
    });

    timeControls.appendChild(timeButtons);
    content.appendChild(timeControls);

    // Score controls
    const scoreControls = document.createElement("div");
    scoreControls.className = "dbg-group";
    scoreControls.innerHTML = `
        <div class="dbg-label">
          Score:
          <input type="number" id="debug-score-input" class="dbg-input" min="0" max="9999" value="${this.gameState?.score || 0}">
        </div>
      `;

    const setScoreBtn = this.createButton(
      "Set Score",
      () => {
        const newScore = parseInt(document.getElementById("debug-score-input").value);
        if (newScore >= 0 && this.gameState) {
          this.gameState.score = newScore;
          this._updateGameUI();
        }
      },
      { showEffect: true }
    );
    scoreControls.appendChild(setScoreBtn);
    content.appendChild(scoreControls);

    // Game flow controls
    const flowControls = document.createElement("div");
    flowControls.className = "dbg-group";

    const startBtn = this.createButton("Start Game", () => {
      if (window.gameEngine && window.gameEngine.startGame) {
        window.gameEngine.startGame();
      } else if (window.startGame) {
        window.startGame();
      }
    });

    const pauseBtn = this.createButton("Toggle Pause", () => {
      this._togglePause();
    });

    const gameOverBtns = document.createElement("div");
    gameOverBtns.style.display = "flex";
    gameOverBtns.style.gap = "5px";
    gameOverBtns.style.marginTop = "5px";

    const winBtn = this.createButton(
      "Win Game",
      () => {
        if (window.gameEngine && window.gameEngine.endGame) {
          window.gameEngine.endGame(true);
        }
      },
      { className: "dbg-button small" }
    );

    const loseBtn = this.createButton(
      "Lose Game",
      () => {
        if (window.gameEngine && window.gameEngine.endGame) {
          window.gameEngine.endGame(false);
        }
      },
      { className: "dbg-button small" }
    );

    const worldShrinkBtn = this.createButton(
      "World Shrink",
      () => {
        if (window.gameEngine && window.gameEngine.endGame) {
          window.gameEngine.endGame(false, { showWorldShrinkAnimation: true });
        }
      },
      { className: "dbg-button small" }
    );

    const restartBtn = this.createButton("Restart Game", () => {
      if (window.gameEngine && window.gameEngine.restartGame) {
        window.gameEngine.restartGame();
      }
    });

    gameOverBtns.appendChild(winBtn);
    gameOverBtns.appendChild(loseBtn);
    gameOverBtns.appendChild(worldShrinkBtn);

    flowControls.appendChild(startBtn);
    flowControls.appendChild(pauseBtn);
    flowControls.appendChild(gameOverBtns);
    flowControls.appendChild(restartBtn);
    content.appendChild(flowControls);

    // Game speed controls
    if (this.speedManager) {
      const speedControls = document.createElement("div");
      speedControls.className = "dbg-group";
      speedControls.innerHTML = `<div>Game Speed:</div>`;

      const speedButtons = document.createElement("div");
      speedButtons.style.display = "flex";
      speedButtons.style.gap = "5px";
      speedButtons.style.marginTop = "5px";

      [0.5, 0.8, 1.0, 1.5, 2.0, 3.0].forEach((speed) => {
        const btn = this.createButton(
          `${speed}x`,
          () => {
            if (this.speedManager) {
              this.speedManager.setSpeed(speed);
            } else if (this.gameState) {
              this.gameState.gameSpeedMultiplier = speed;
            }
          },
          { small: true }
        );
        speedButtons.appendChild(btn);
      });

      speedControls.appendChild(speedButtons);
      content.appendChild(speedControls);
    }

    // Game state display
    const stateStatus = this.createStatus("game-state-status", "Game state information");
    content.appendChild(stateStatus);

    // Schedule state updates
    setInterval(() => this._updateGameStateDisplay(), 500);
  }

  /**
   * Update game UI
   * @private
   */
  _updateGameUI() {
    // Try different methods to update UI
    if (typeof window.updateHUD === "function") {
      window.updateHUD();
    } else if (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.ui) {
      window.gameEngine.systems.ui.updateHUD(this.gameState);
      window.gameEngine.systems.ui.updateProgressBar(this.gameState.timeRemaining, this.gameState.config?.GAME_DURATION || 168);
    }
  }

  /**
   * Toggle game pause state
   * @private
   */
  _togglePause() {
    if (window.gameEngine && window.gameEngine.togglePause) {
      window.gameEngine.togglePause();
    } else if (this.gameState) {
      this.gameState.isPaused = !this.gameState.isPaused;

      // Update UI pause button if it exists
      const pauseButton = document.getElementById("pause-button");
      if (pauseButton) {
        pauseButton.setAttribute("aria-pressed", this.gameState.isPaused ? "true" : "false");
      }
    }
  }

  /**
   * Update game state display
   * @private
   */
  _updateGameStateDisplay() {
    if (!this.gameState) return;

    const status = document.getElementById("game-state-status");
    if (!status) return;

    status.innerHTML = `
        <div>Playing: ${this.gameState.isPlaying ? "Yes" : "No"}</div>
        <div>Paused: ${this.gameState.isPaused ? "Yes" : "No"}</div>
        <div>Time: ${this.gameState.timeRemaining}s</div>
        <div>Score: ${this.gameState.score}</div>
        <div>Speed: ${this.gameState.gameSpeedMultiplier?.toFixed(1) || "1.0"}x</div>
      `;
  }

  /**
   * Animation controls section
   */
  setupAnimationControlsSection() {
    const { content } = this.createSection("animations", "Animation Controls");

    // Get available animations
    let animationStates = [];
    if (this.animationManager && this.animationManager.animations) {
      animationStates = Object.keys(this.animationManager.animations);
    }

    // Create animation selector
    const animSelector = document.createElement("select");
    animSelector.id = "debug-anim-select";
    animSelector.className = "dbg-select";

    animationStates.forEach((state) => {
      const option = document.createElement("option");
      option.value = state;
      option.textContent = state;
      animSelector.appendChild(option);
    });

    const animControls = document.createElement("div");
    animControls.className = "dbg-group";
    animControls.innerHTML = `<div class="dbg-label">Animation: </div>`;
    animControls.appendChild(animSelector);
    content.appendChild(animControls);

    // Animation playback controls
    const playbackControls = document.createElement("div");
    playbackControls.className = "dbg-group controls-margin-bottom";

    const playBtn = this.createButton("Play", () => {
      if (this.animationManager) {
        const selectedAnim = animSelector.value;
        this.animationManager.changeState(selectedAnim);
      }
    });

    const stopBtn = this.createButton("Stop", () => {
      if (this.animationManager) {
        this.animationManager.stop();
        this.animationManager.changeState("idle");
      }
    });

    const pauseBtn = this.createButton("Pause/Resume", () => {
      if (this.animationManager) {
        if (this.animationManager.isPaused) {
          this.animationManager.resume();
        } else {
          this.animationManager.pause();
        }
      }
    });

    // Frame controls
    const frameControls = document.createElement("div");
    frameControls.style.display = "flex";
    frameControls.style.gap = "5px";
    frameControls.style.marginTop = "5px";

    const prevFrameBtn = this.createButton(
      "◀",
      () => {
        if (this.animationManager) {
          const currentFrame = this.animationManager.currentFrame || 0;
          this.animationManager.setFrame(Math.max(0, currentFrame - 1));
        }
      },
      { small: true }
    );

    const frameInput = document.createElement("input");
    frameInput.type = "number";
    frameInput.id = "debug-frame-input";
    frameInput.className = "dbg-input";
    frameInput.min = 0;
    frameInput.max = 10;
    frameInput.value = this.animationManager?.currentFrame || 0;
    frameInput.style.width = "40px";

    const setFrameBtn = this.createButton(
      "Set",
      () => {
        if (this.animationManager) {
          const frame = parseInt(frameInput.value);
          this.animationManager.setFrame(frame);
        }
      },
      { small: true }
    );

    const nextFrameBtn = this.createButton(
      "▶",
      () => {
        if (this.animationManager) {
          const currentFrame = this.animationManager.currentFrame || 0;
          const currentAnim = this.animationManager.animations[this.animationManager.currentState];
          const maxFrame = currentAnim ? currentAnim.frameCount - 1 : 0;
          this.animationManager.setFrame(Math.min(maxFrame, currentFrame + 1));
        }
      },
      { small: true }
    );

    frameControls.appendChild(prevFrameBtn);
    frameControls.appendChild(frameInput);
    frameControls.appendChild(setFrameBtn);
    frameControls.appendChild(nextFrameBtn);

    playbackControls.appendChild(playBtn);
    playbackControls.appendChild(stopBtn);
    playbackControls.appendChild(pauseBtn);
    playbackControls.appendChild(frameControls);
    content.appendChild(playbackControls);

    // Calibration controls
    const calibrationControls = document.createElement("div");
    calibrationControls.className = "dbg-group";

    const calibrateBtn = this.createButton(
      "Calibrate Hitbox",
      () => {
        this._startCalibration();
      },
      { tooltip: "Enter hitbox calibration mode (Ctrl+S)" }
    );

    // When in calibration mode, use the whole map to position hitbox
    calibrationControls.appendChild(calibrateBtn);
    content.appendChild(calibrationControls);

    // Test sequences
    const sequenceControls = document.createElement("div");
    sequenceControls.className = "dbg-group";

    const testGrabBtn = this.createButton("Test Grab Sequence", () => {
      if (window.gameEngine && window.gameEngine.initiateGrab) {
        window.gameEngine.initiateGrab();
      }
    });

    const testBlockBtn = this.createButton(
      "Test Block Sequence",
      () => {
        this._testAnimationSequence();
      },
      { tooltip: "Test the block animation sequence (Ctrl+H)" }
    );

    sequenceControls.appendChild(testGrabBtn);
    sequenceControls.appendChild(testBlockBtn);
    content.appendChild(sequenceControls);

    // Animation info display
    const animInfo = this.createStatus("anim-info-status", "Animation information will appear here");
    content.appendChild(animInfo);
  }

  /**
   * Update animation info display
   */
  updateAnimationInfo() {
    const infoElement = document.getElementById("anim-info-status");
    if (!infoElement || !this.animationManager) return;

    try {
      const currentAnim = this.animationManager.getCurrentAnimation();
      if (!currentAnim) return;

      const hitboxInfo = this.animationManager.getHitboxInfo() || {};

      infoElement.innerHTML = `
          <div>State: ${currentAnim.name}</div>
          <div>Frame: ${currentAnim.frame}/${(currentAnim.data?.frameCount || 1) - 1}</div>
          ${
            currentAnim.data?.handVisible
              ? `<div>Hitbox: ${hitboxInfo.visible ? "Visible" : "Hidden"}</div>
             <div>Hitbox Pos: (${hitboxInfo.x || 0}, ${hitboxInfo.y || 0})</div>
             <div>Size: ${hitboxInfo.width || 0}×${hitboxInfo.height || 0}</div>`
              : ""
          }
        `;
    } catch (e) {
      infoElement.textContent = "Error updating animation info: " + e.message;
    }
  }

  /**
   * Hitbox controls section
   */
  setupHitboxControlsSection() {
    const { content } = this.createSection("hitbox", "Hitbox Controls");

    // Toggle hitbox visibility
    const visibilityControls = document.createElement("div");
    visibilityControls.className = "dbg-group";

    const toggleVisibilityBtn = this.createButton(
      "Toggle Hitbox Overlay",
      () => {
        this.toggleHitboxVisibility();
      },
      { showEffect: true, tooltip: "Toggle hitbox visibility (Ctrl+A)" }
    );

    visibilityControls.appendChild(toggleVisibilityBtn);
    content.appendChild(visibilityControls);

    // Hitbox size controls
    const sizeControls = document.createElement("div");
    sizeControls.className = "dbg-group";
    sizeControls.innerHTML = `
        <div class="dbg-label">
          Width:
          <input type="number" id="debug-hitbox-width" class="dbg-input" min="50" max="1000" value="300">
        </div>
        <div class="dbg-label">
          Height:
          <input type="number" id="debug-hitbox-height" class="dbg-input" min="50" max="1000" value="300">
        </div>
      `;

    const setSizeBtn = this.createButton(
      "Set Size",
      () => {
        const width = parseInt(document.getElementById("debug-hitbox-width").value);
        const height = parseInt(document.getElementById("debug-hitbox-height").value);

        if (isNaN(width) || isNaN(height)) return;

        if (this.handHitboxManager) {
          this.handHitboxManager.adjustHitboxSize(width, height);
        }
      },
      { showEffect: true }
    );

    sizeControls.appendChild(setSizeBtn);
    content.appendChild(sizeControls);

    // Hitbox test buttons
    const testControls = document.createElement("div");
    testControls.className = "dbg-group";

    const makeHittableBtn = this.createButton("Make Hittable", () => {
      if (window.trumpHandEffects) {
        const isFirstBlock = this.gameState?.stats?.successfulBlocks === 0;
        window.trumpHandEffects.makeHittable(isFirstBlock);
      } else if (this.handHitboxManager && this.handHitboxManager.showHitbox) {
        this.handHitboxManager.showHitbox();
      }
    });

    const hideHitboxBtn = this.createButton("Hide Hitbox", () => {
      if (window.trumpHandEffects) {
        window.trumpHandEffects.resetVisual();
      } else if (this.handHitboxManager && this.handHitboxManager.hideHitbox) {
        this.handHitboxManager.hideHitbox();
      }
    });

    testControls.appendChild(makeHittableBtn);
    testControls.appendChild(hideHitboxBtn);
    content.appendChild(testControls);

    // Add effect test buttons
    const effectControls = document.createElement("div");
    effectControls.className = "dbg-group";

    const hitEffectBtn = this.createButton("Test Hit Effect", () => {
      if (window.trumpHandEffects) {
        window.trumpHandEffects.applyHitEffect();
      } else if (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.ui) {
        window.gameEngine.systems.ui.applyBlockVisualEffects("mexico");
      }
    });

    const grabEffectBtn = this.createButton("Test Grab Effect", () => {
      if (window.trumpHandEffects) {
        window.trumpHandEffects.applyGrabSuccessEffect();
      } else if (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.ui) {
        window.gameEngine.systems.ui.applyGrabSuccessVisuals("mexico");
      }
    });

    effectControls.appendChild(hitEffectBtn);
    effectControls.appendChild(grabEffectBtn);
    content.appendChild(effectControls);

    // Hitbox calibration data export
    const exportControls = document.createElement("div");
    exportControls.className = "dbg-group";

    const exportBtn = this.createButton(
      "Export Calibration Data",
      () => {
        this._exportHitboxData();
      },
      { tooltip: "Export current hitbox calibration data" }
    );

    exportControls.appendChild(exportBtn);
    content.appendChild(exportControls);
  }

  /**
   * Toggle hitbox visibility debugging
   */
  toggleHitboxVisibility() {
    // Toggle global debug body class
    document.body.classList.toggle("debug-mode");

    // Notify hitbox managers of debug mode change
    const isDebugMode = document.body.classList.contains("debug-mode");

    if (this.handHitboxManager && typeof this.handHitboxManager.setDebugMode === "function") {
      this.handHitboxManager.setDebugMode(isDebugMode);
    }

    if (this.protestorHitboxManager && typeof this.protestorHitboxManager.setDebugMode === "function") {
      this.protestorHitboxManager.setDebugMode(isDebugMode);
    }

    if (this.animationManager && typeof this.animationManager.setDebugMode === "function") {
      this.animationManager.setDebugMode(isDebugMode);
    }

    console.log(`[Debug] Hitbox debug mode ${isDebugMode ? "enabled" : "disabled"}`);
  }

  /**
   * Test animation sequence
   * @private
   */
  _testAnimationSequence() {
    // First stop any existing animations
    if (this.animationManager) {
      this.animationManager.stop();
    }

    // Randomly select a country to smack
    const countries = ["eastCanada", "westCanada", "mexico", "greenland"];
    const country = countries[Math.floor(Math.random() * countries.length)];

    // Play smack animation using smackManager
    if (window.smackManager && typeof window.smackManager.playSmackAnimation === "function") {
      window.smackManager.playSmackAnimation(country, () => {
        // After smack completes, play slapped animation
        if (this.animationManager) {
          this.animationManager.changeState("slapped", () => {
            // Then go back to idle
            this.animationManager.changeState("idle");
          });
        }
      });
    } else if (this.animationManager) {
      // Fallback if no smack manager
      this.animationManager.changeState(`smack${country.charAt(0).toUpperCase() + country.slice(1)}`, () => {
        this.animationManager.changeState("slapped", () => {
          this.animationManager.changeState("idle");
        });
      });
    }
  }

  /**
   * Exports the current hitbox calibration data
   * @private
   */
  _exportHitboxData() {
    if (!this.animationManager || !this.animationManager.animations) {
      console.error("[Debug] No animation data available to export");
      return;
    }

    // Build export data object
    const exportData = {};

    // For each grab animation, export the hitbox coordinates
    Object.keys(this.animationManager.animations)
      .filter((anim) => anim.startsWith("grab"))
      .forEach((anim) => {
        const animData = this.animationManager.animations[anim];
        if (animData && animData.handCoordinates) {
          exportData[anim] = {
            handCoordinates: animData.handCoordinates,
            calibrationScale: animData.calibrationScale || 0.23, // Default if not set
          };
        }
      });

    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);

    // Create download link
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hitbox-calibration-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);

    console.log("[Debug] Exported hitbox calibration data");
  }

  /**
   * Audio controls section
   */
  setupAudioControlsSection() {
    const { content } = this.createSection("audio", "Audio Controls");

    // Volume Controls
    const volumeControls = document.createElement("div");
    volumeControls.className = "dbg-group";
    volumeControls.innerHTML = `
        <div class="dbg-label">
          Volume:
          <input type="range" id="debug-volume-slider" min="0" max="1" step="0.1" value="${this.audioManager?.volume || 1}" style="width: 100px;">
          <span id="debug-volume-value">${this.audioManager?.volume || 1}</span>
        </div>
      `;

    const volumeSlider = volumeControls.querySelector("#debug-volume-slider");
    const volumeValue = volumeControls.querySelector("#debug-volume-value");

    volumeSlider.addEventListener("input", () => {
      const vol = parseFloat(volumeSlider.value);
      volumeValue.textContent = vol.toFixed(1);

      if (this.audioManager && typeof this.audioManager.setVolume === "function") {
        this.audioManager.setVolume(vol);
      }
    });

    const muteBtn = this.createButton("Toggle Mute", () => {
      if (this.audioManager && typeof this.audioManager.toggleMute === "function") {
        const isMuted = this.audioManager.toggleMute();
        muteBtn.textContent = isMuted ? "Unmute" : "Toggle Mute";
      }
    });

    volumeControls.appendChild(muteBtn);
    content.appendChild(volumeControls);

    // Music controls
    const musicControls = document.createElement("div");
    musicControls.className = "dbg-group";

    const musicTitle = document.createElement("div");
    musicTitle.textContent = "Background Music:";
    musicTitle.style.marginBottom = "5px";

    const startMusicBtn = this.createButton("Start Music", () => {
      if (this.audioManager && typeof this.audioManager.startBackgroundMusic === "function") {
        this.audioManager.startBackgroundMusic();
      }
    });

    const stopMusicBtn = this.createButton("Stop Music", () => {
      if (this.audioManager && typeof this.audioManager.stopBackgroundMusic === "function") {
        this.audioManager.stopBackgroundMusic();
      }
    });

    const musicIntensityBtns = document.createElement("div");
    musicIntensityBtns.style.display = "flex";
    musicIntensityBtns.style.gap = "5px";
    musicIntensityBtns.style.marginTop = "5px";

    [0, 1, 2, 3].forEach((intensity) => {
      const btn = this.createButton(
        `Level ${intensity}`,
        () => {
          if (this.audioManager && typeof this.audioManager.updateMusicIntensity === "function") {
            this.audioManager.updateMusicIntensity(intensity);
          }
        },
        { small: true }
      );
      musicIntensityBtns.appendChild(btn);
    });

    musicControls.appendChild(musicTitle);
    musicControls.appendChild(startMusicBtn);
    musicControls.appendChild(stopMusicBtn);
    musicControls.appendChild(document.createTextNode("Music Intensity:"));
    musicControls.appendChild(musicIntensityBtns);
    content.appendChild(musicControls);

    // Sound test categories
    const soundCategories = [
      {
        id: "ui",
        name: "UI Sounds",
        sounds: ["click", "start", "gameOver", "win", "lose", "grabWarning", "resistance", "instruction", "stopHim", "smackThatHand", "faster"],
      },
      { id: "trump", name: "Trump Sounds", sounds: ["grab", "success", "annex", "victory", "sob", "evilLaugh"] },
      { id: "defense", name: "Defense Sounds", sounds: ["slap", "protest"] },
      { id: "special", name: "Special Effects", sounds: ["aliens", "musk", "growProtestors"] },
    ];

    soundCategories.forEach((category) => {
      const categoryControls = document.createElement("div");
      categoryControls.className = "dbg-group";

      const categoryTitle = document.createElement("div");
      categoryTitle.textContent = category.name + ":";
      categoryTitle.style.marginBottom = "5px";

      const soundButtons = document.createElement("div");
      soundButtons.style.display = "flex";
      soundButtons.style.flexWrap = "wrap";
      soundButtons.style.gap = "5px";

      category.sounds.forEach((sound) => {
        const btn = this.createButton(
          sound,
          () => {
            if (this.audioManager) {
              if (typeof this.audioManager.play === "function") {
                this.audioManager.play(category.id, sound);
              } else if (typeof this.audioManager.safePlay === "function") {
                this.audioManager.safePlay(category.id, sound);
              }
            }
          },
          { small: true }
        );
        soundButtons.appendChild(btn);
      });

      categoryControls.appendChild(categoryTitle);
      categoryControls.appendChild(soundButtons);
      content.appendChild(categoryControls);
    });

    // Country-specific sound tests
    const countrySoundControls = document.createElement("div");
    countrySoundControls.className = "dbg-group";

    const countryTitle = document.createElement("div");
    countryTitle.textContent = "Country Sounds:";
    countryTitle.style.marginBottom = "5px";

    const countrySelector = document.createElement("select");
    countrySelector.className = "dbg-select";
    countrySelector.style.marginRight = "5px";
    ["canada", "eastCanada", "westCanada", "mexico", "greenland"].forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      countrySelector.appendChild(option);
    });

    const testCatchphraseBtn = this.createButton(
      "Catchphrase",
      () => {
        const country = countrySelector.value;
        if (this.audioManager && typeof this.audioManager.playCatchphrase === "function") {
          this.audioManager.playCatchphrase(country);
        }
      },
      { small: true }
    );

    const testProtestBtn = this.createButton(
      "Protest",
      () => {
        const country = countrySelector.value;
        if (this.audioManager && typeof this.audioManager.playRandom === "function") {
          this.audioManager.playRandom("defense", "protest", country);
        }
      },
      { small: true }
    );

    const testGrabAudioBtn = this.createButton(
      "Grab",
      () => {
        if (this.audioManager && typeof this.audioManager.playGrabAttempt === "function") {
          this.audioManager.playGrabAttempt(countrySelector.value);
        }
      },
      { small: true }
    );

    const testSuccessAudioBtn = this.createButton(
      "Success",
      () => {
        if (this.audioManager && typeof this.audioManager.playSuccessfulGrab === "function") {
          this.audioManager.playSuccessfulGrab(countrySelector.value);
        }
      },
      { small: true }
    );

    const testAnnexAudioBtn = this.createButton(
      "Annex",
      () => {
        if (this.audioManager && typeof this.audioManager.playCountryAnnexed === "function") {
          this.audioManager.playCountryAnnexed(countrySelector.value);
        }
      },
      { small: true }
    );

    countrySoundControls.appendChild(countryTitle);
    countrySoundControls.appendChild(countrySelector);
    countrySoundControls.appendChild(document.createElement("br"));
    countrySoundControls.appendChild(testCatchphraseBtn);
    countrySoundControls.appendChild(testProtestBtn);
    countrySoundControls.appendChild(testGrabAudioBtn);
    countrySoundControls.appendChild(testSuccessAudioBtn);
    countrySoundControls.appendChild(testAnnexAudioBtn);
    content.appendChild(countrySoundControls);

    // Audio system control and status
    const systemControls = document.createElement("div");
    systemControls.className = "dbg-group";

    const unlockAudioBtn = this.createButton("Unlock Audio", () => {
      if (this.audioManager) {
        if (typeof this.audioManager.unlock === "function") {
          this.audioManager.unlock();
        } else if (typeof this.audioManager.resumeAudioContext === "function") {
          this.audioManager.resumeAudioContext();
        }
      }
    });

    const stopAllBtn = this.createButton("Stop All Sounds", () => {
      if (this.audioManager && typeof this.audioManager.stopAll === "function") {
        this.audioManager.stopAll();
      }
    });

    systemControls.appendChild(unlockAudioBtn);
    systemControls.appendChild(stopAllBtn);
    content.appendChild(systemControls);
  }

  /**
   * Resistance controls section
   */
  setupResistanceControlsSection() {
    const { content } = this.createSection("resistance", "Resistance Controls");

    // Country flags controls
    const flagControls = document.createElement("div");
    flagControls.className = "dbg-group";

    const countrySelector = document.createElement("select");
    countrySelector.className = "dbg-select";
    countrySelector.style.marginRight = "5px";
    ["canada", "mexico", "greenland"].forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      countrySelector.appendChild(option);
    });

    // Flag opacity buttons
    const opacityControls = document.createElement("div");
    opacityControls.style.display = "flex";
    opacityControls.style.flexWrap = "wrap";
    opacityControls.style.gap = "5px";
    opacityControls.style.marginTop = "5px";

    [0, 1, 2, 3].forEach((claims) => {
      const btn = this.createButton(
        `Set ${claims}/3`,
        () => {
          const country = countrySelector.value;

          // Try the freedom manager first
          if (this.freedomManager && typeof this.freedomManager.setCountryClaims === "function") {
            this.freedomManager.setCountryClaims(country, claims);
          }
          // Then try game state direct update
          else if (this.gameState && this.gameState.countries && this.gameState.countries[country]) {
            this.gameState.countries[country].claims = claims;

            // Also update UI overlay if possible
            if (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.ui) {
              window.gameEngine.systems.ui.updateFlagOverlay(country, claims);
            }
          }
        },
        { small: true }
      );
      opacityControls.appendChild(btn);
    });

    flagControls.appendChild(document.createTextNode("Country: "));
    flagControls.appendChild(countrySelector);
    flagControls.appendChild(opacityControls);
    content.appendChild(flagControls);

    // Resistance action buttons
    const actionControls = document.createElement("div");
    actionControls.className = "dbg-group";

    const annexBtn = this.createButton("Fully Annex Country", () => {
      const country = countrySelector.value;
      if (this.freedomManager && typeof this.freedomManager.annexCountry === "function") {
        this.freedomManager.annexCountry(country);
      }
    });

    const resistanceReadyBtn = this.createButton("Make Resistance Ready", () => {
      const country = countrySelector.value;
      if (this.freedomManager && typeof this.freedomManager.makeResistanceReady === "function") {
        this.freedomManager.makeResistanceReady(country);
      }
    });

    const triggerResistanceBtn = this.createButton("Trigger Resistance", () => {
      const country = countrySelector.value;
      if (this.freedomManager && typeof this.freedomManager.triggerCountryResistance === "function") {
        this.freedomManager.triggerCountryResistance(country);
      }
    });

    const celebrationBtn = this.createButton("Create Celebration", () => {
      const country = countrySelector.value;
      if (this.freedomManager && typeof this.freedomManager.createFreedomCelebration === "function") {
        this.freedomManager.createFreedomCelebration(country);
      }
    });

    actionControls.appendChild(annexBtn);
    actionControls.appendChild(resistanceReadyBtn);
    actionControls.appendChild(triggerResistanceBtn);
    actionControls.appendChild(celebrationBtn);
    content.appendChild(actionControls);

    // Resistance status display
    const resistanceStatus = this.createStatus("resistance-status", "Resistance status information");
    content.appendChild(resistanceStatus);
  }

  /**
   * Update resistance status display
   */
  updateResistanceStatus() {
    if (!this.freedomManager) return;

    const statusElement = document.getElementById("resistance-status");
    if (!statusElement) return;

    try {
      let statusHTML = "";

      // For each country, show resistance status
      Object.keys(this.freedomManager.countries).forEach((country) => {
        const countryData = this.freedomManager.countries[country];
        const gameCountry = this.gameState && this.gameState.countries ? this.gameState.countries[country] : null;

        statusHTML += `
            <div style="margin-bottom: 5px;">
              <strong>${country}:</strong> 
              ${gameCountry ? `${gameCountry.claims}/${gameCountry.maxClaims} claims` : "Unknown"} |
              Annexed: ${countryData.annexTime ? (countryData.annexTime / 1000).toFixed(1) + "s" : "No"} |
              Ready: ${countryData.resistanceAvailable ? "Yes" : "No"} |
              Protestors: ${countryData.protestorsShown ? "Shown" : "Hidden"}
            </div>
          `;
      });

      statusElement.innerHTML = statusHTML;
    } catch (e) {
      statusElement.textContent = "Error updating resistance status: " + e.message;
    }
  }

  /**
   * Protestor controls section
   */
  setupProtestorControlsSection() {
    const { content } = this.createSection("protestors", "Protestor Controls");

    // Country selector
    const countrySelector = document.createElement("select");
    countrySelector.id = "debug-protestor-country";
    countrySelector.className = "dbg-select";
    ["canada", "mexico", "greenland"].forEach((country) => {
      const option = document.createElement("option");
      option.value = country;
      option.textContent = country;
      countrySelector.appendChild(option);
    });

    const selectorWrapper = document.createElement("div");
    selectorWrapper.className = "dbg-group";
    selectorWrapper.appendChild(document.createTextNode("Country: "));
    selectorWrapper.appendChild(countrySelector);
    content.appendChild(selectorWrapper);

    // Protestor action buttons
    const actionControls = document.createElement("div");
    actionControls.className = "dbg-group";

    const showProtestorsBtn = this.createButton("Show Protestors", () => {
      const country = document.getElementById("debug-protestor-country").value;
      if (this.freedomManager && typeof this.freedomManager.showProtestors === "function") {
        this.freedomManager.showProtestors(country);
      }
    });

    const hideProtestorsBtn = this.createButton("Hide Protestors", () => {
      const country = document.getElementById("debug-protestor-country").value;
      if (this.freedomManager && typeof this.freedomManager.hideProtestors === "function") {
        this.freedomManager.hideProtestors(country);
      }
    });

    const simulateClickBtn = this.createButton("Simulate Click", () => {
      const country = document.getElementById("debug-protestor-country").value;
      if (this.freedomManager && typeof this.freedomManager.handleProtestorClick === "function") {
        this.freedomManager.handleProtestorClick(country);
      }
    });

    const cleanupAllBtn = this.createButton("Clean Up All Protestors", () => {
      if (this.freedomManager && typeof this.freedomManager.cleanupAllProtestors === "function") {
        this.freedomManager.cleanupAllProtestors();
      }
    });

    actionControls.appendChild(showProtestorsBtn);
    actionControls.appendChild(hideProtestorsBtn);
    actionControls.appendChild(simulateClickBtn);
    actionControls.appendChild(cleanupAllBtn);
    content.appendChild(actionControls);

    // Protestor calibration controls
    const calibrationControls = document.createElement("div");
    calibrationControls.className = "dbg-group";

    const calibrateProtestorsBtn = this.createButton("Calibrate Protestors", () => {
      this._startProtestorCalibration();
    });

    calibrationControls.appendChild(calibrateProtestorsBtn);
    content.appendChild(calibrationControls);

    // Additional controls for updating protestors
    const updateControls = document.createElement("div");
    updateControls.className = "dbg-group";

    const scaleSizeBtn = this.createButton("Scale Size", () => {
      const country = document.getElementById("debug-protestor-country").value;
      const scaleFactor = 1.2; // 20% larger

      if (this.protestorHitboxManager && typeof this.protestorHitboxManager.updateSize === "function") {
        this.protestorHitboxManager.updateSize(country, scaleFactor);
      }
    });

    const resetSizeBtn = this.createButton("Reset Size", () => {
      const country = document.getElementById("debug-protestor-country").value;

      if (this.protestorHitboxManager) {
        // Use 1.0 scale to reset
        if (typeof this.protestorHitboxManager.updateSize === "function") {
          this.protestorHitboxManager.updateSize(country, 1.0);
        }
        // Or try completely rebuilding
        else if (typeof this.protestorHitboxManager.cleanupAll === "function") {
          this.protestorHitboxManager.cleanupAll();
        }
      }
    });

    const repositionBtn = this.createButton("Reposition All", () => {
      if (this.protestorHitboxManager && typeof this.protestorHitboxManager.repositionAllHitboxes === "function") {
        this.protestorHitboxManager.repositionAllHitboxes();
      }
    });

    updateControls.appendChild(scaleSizeBtn);
    updateControls.appendChild(resetSizeBtn);
    updateControls.appendChild(repositionBtn);
    content.appendChild(updateControls);
  }

  /**
   * UFO controls section
   */
  setupUfoControlsSection() {
    const { content } = this.createSection("ufo", "UFO & Easter Eggs");

    // UFO controls
    if (this.ufoManager || window.ufoManager) {
      const ufoControls = document.createElement("div");
      ufoControls.className = "dbg-group";

      const showUfoBtn = this.createButton("Show UFO", () => {
        const ufo = this.ufoManager || window.ufoManager;
        if (ufo && typeof ufo.showUfo === "function") {
          ufo.showUfo();
        }
      });

      const hideUfoBtn = this.createButton("Hide UFO", () => {
        const ufo = this.ufoManager || window.ufoManager;
        if (ufo && typeof ufo.hideUfo === "function") {
          ufo.hideUfo();
        }
      });

      const abductTrumpBtn = this.createButton("Abduct Trump", () => {
        const ufo = this.ufoManager || window.ufoManager;
        if (ufo && typeof ufo.abductTrump === "function") {
          ufo.abductTrump();
        }
      });

      ufoControls.appendChild(showUfoBtn);
      ufoControls.appendChild(hideUfoBtn);
      ufoControls.appendChild(abductTrumpBtn);
      content.appendChild(ufoControls);
    }

    // Elon appearance
    const elonControls = document.createElement("div");
    elonControls.className = "dbg-group";

    const showElonBtn = this.createButton("Show Elon", () => {
      if (this.animationManager && this.animationManager.animations?.muskAppearance) {
        this.animationManager.changeState("muskAppearance");
      }

      // Also play the sound if available
      if (this.audioManager) {
        if (typeof this.audioManager.play === "function") {
          this.audioManager.play("ui", "musk");
        } else if (typeof this.audioManager.safePlay === "function") {
          this.audioManager.safePlay("ui", "musk");
        }
      }
    });

    elonControls.appendChild(showElonBtn);
    content.appendChild(elonControls);

    // Aliens sound effect
    const aliensControls = document.createElement("div");
    aliensControls.className = "dbg-group";

    const playAliensBtn = this.createButton("Play Aliens Sound", () => {
      if (this.audioManager) {
        if (typeof this.audioManager.play === "function") {
          this.audioManager.play("ui", "aliens");
        } else if (typeof this.audioManager.safePlay === "function") {
          this.audioManager.safePlay("ui", "aliens");
        }
      }
    });

    aliensControls.appendChild(playAliensBtn);
    content.appendChild(aliensControls);
  }

  /**
   * Performance controls section
   */
  setupPerformanceControlsSection() {
    const { content } = this.createSection("performance", "Performance Controls");

    // Debug class toggle
    const debugModeControls = document.createElement("div");
    debugModeControls.className = "dbg-group";

    const toggleDebugClassBtn = this.createButton("Toggle Debug Class", () => {
      document.body.classList.toggle("debug-mode");
    });

    debugModeControls.appendChild(toggleDebugClassBtn);
    content.appendChild(debugModeControls);

    // Frame rate monitoring
    const fpsControls = document.createElement("div");
    fpsControls.className = "dbg-group";

    const fpsMonitor = document.createElement("div");
    fpsMonitor.id = "debug-fps-monitor";
    fpsMonitor.className = "dbg-status";
    fpsMonitor.textContent = "FPS: --";

    const toggleFpsBtn = this.createButton("Monitor FPS", () => {
      if (!this._fpsMonitorActive) {
        this._startFpsMonitoring();
        toggleFpsBtn.textContent = "Stop Monitoring";
      } else {
        this._stopFpsMonitoring();
        toggleFpsBtn.textContent = "Monitor FPS";
      }
    });

    fpsControls.appendChild(toggleFpsBtn);
    fpsControls.appendChild(fpsMonitor);
    content.appendChild(fpsControls);

    // Browser info
    const infoControls = document.createElement("div");
    infoControls.className = "dbg-group";

    // Collect browser and device info
    const isMobile = window.DeviceUtils?.isMobileDevice || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const isTouchDevice =
      window.DeviceUtils?.isTouchDevice || "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    infoControls.innerHTML = `
        <div><strong>Browser:</strong> ${navigator.userAgent.split(/[()]/)[1] || navigator.userAgent}</div>
        <div><strong>Device:</strong> ${isMobile ? "Mobile" : "Desktop"} / ${isTouchDevice ? "Touch" : "No Touch"}</div>
        <div><strong>Viewport:</strong> ${viewportWidth}×${viewportHeight}</div>
      `;

    content.appendChild(infoControls);

    // Clear cache and reload
    const cacheControls = document.createElement("div");
    cacheControls.className = "dbg-group";

    const reloadBtn = this.createButton("Reload Page", () => {
      window.location.reload();
    });

    const hardReloadBtn = this.createButton(
      "Hard Reload (Clear Cache)",
      () => {
        window.location.reload(true);
      },
      { className: "dbg-button warning" }
    );

    cacheControls.appendChild(reloadBtn);
    cacheControls.appendChild(hardReloadBtn);
    content.appendChild(cacheControls);
  }

  /**
   * Start FPS monitoring
   * @private
   */
  _startFpsMonitoring() {
    if (this._fpsMonitorActive) return;

    this._fpsMonitorActive = true;
    this._frameCount = 0;
    this._lastFpsUpdateTime = performance.now();

    const updateFps = () => {
      this._frameCount++;

      const now = performance.now();
      const elapsed = now - this._lastFpsUpdateTime;

      // Update FPS every 500ms
      if (elapsed >= 500) {
        const fps = Math.round(this._frameCount / (elapsed / 1000));

        const fpsMonitor = document.getElementById("debug-fps-monitor");
        if (fpsMonitor) {
          fpsMonitor.textContent = `FPS: ${fps}`;
          // Color-code based on performance
          if (fps >= 55) {
            fpsMonitor.style.color = "#5d5";
          } else if (fps >= 30) {
            fpsMonitor.style.color = "#dd5";
          } else {
            fpsMonitor.style.color = "#d55";
          }
        }

        this._frameCount = 0;
        this._lastFpsUpdateTime = now;
      }

      if (this._fpsMonitorActive) {
        this._fpsAnimFrame = requestAnimationFrame(updateFps);
      }
    };

    this._fpsAnimFrame = requestAnimationFrame(updateFps);
  }

  /**
   * Stop FPS monitoring
   * @private
   */
  _stopFpsMonitoring() {
    this._fpsMonitorActive = false;

    if (this._fpsAnimFrame) {
      cancelAnimationFrame(this._fpsAnimFrame);
      this._fpsAnimFrame = null;
    }

    const fpsMonitor = document.getElementById("debug-fps-monitor");
    if (fpsMonitor) {
      fpsMonitor.textContent = "FPS: --";
      fpsMonitor.style.color = "";
    }
  }

  /**
   * Start hitbox calibration mode
   * @private
   */
  _startCalibration() {
    if (!this.animationManager) {
      console.error("[Debug] Cannot calibrate: animation manager not available");
      return;
    }

    // Get current animation state
    this.calibration.originalAnimState = this.animationManager.currentState;
    this.calibration.wasPlaying = this.animationManager.animationInterval !== null;
    this.calibration.wasPaused = this.animationManager.isPaused;

    // Stop current animation
    this.animationManager.stop();
    this.animationManager.isPaused = true;

    // Setup grab animation selector
    const grabAnimations = Object.keys(this.animationManager.animations).filter((anim) => anim.startsWith("grab"));

    if (grabAnimations.length === 0) {
      console.error("[Debug] No grab animations found for calibration");
      return;
    }

    // Create calibration panel
    this._createCalibrationPanel(grabAnimations);
  }

  /**
   * Create calibration panel for hitbox adjustment
   * @private
   * @param {Array} grabAnimations - List of grab animation names
   */
  _createCalibrationPanel(grabAnimations) {
    // Remove any existing panel
    const existingPanel = document.getElementById("calibration-panel");
    if (existingPanel) {
      existingPanel.remove();
    }

    // Create new panel
    const panel = document.createElement("div");
    panel.id = "calibration-panel";

    // Panel title
    const title = document.createElement("h3");
    title.textContent = "Hitbox Calibration";
    title.style.margin = "0 0 10px 0";
    panel.appendChild(title);

    // Animation selector
    const animLabel = document.createElement("div");
    animLabel.textContent = "Animation:";
    panel.appendChild(animLabel);

    const animSelector = document.createElement("select");
    animSelector.style.width = "100%";
    animSelector.style.marginBottom = "10px";

    grabAnimations.forEach((anim) => {
      const option = document.createElement("option");
      option.value = anim;
      option.textContent = anim;
      animSelector.appendChild(option);
    });

    panel.appendChild(animSelector);

    // Frame selector
    const frameLabel = document.createElement("div");
    frameLabel.textContent = "Frame:";
    panel.appendChild(frameLabel);

    const frameControls = document.createElement("div");
    frameControls.style.display = "flex";
    frameControls.style.gap = "5px";
    frameControls.style.marginBottom = "10px";

    const frameSelector = document.createElement("select");
    frameSelector.id = "calibration-frame-selector";
    frameSelector.style.flex = "1";

    // Add frame options (will be updated when animation is selected)
    [0, 1].forEach((frame) => {
      const option = document.createElement("option");
      option.value = frame;
      option.textContent = `Frame ${frame}`;
      frameSelector.appendChild(option);
    });

    frameControls.appendChild(frameSelector);
    panel.appendChild(frameControls);

    // Position inputs
    const positionControls = document.createElement("div");
    positionControls.style.display = "grid";
    positionControls.style.gridTemplateColumns = "auto 1fr";
    positionControls.style.gap = "5px";
    positionControls.style.alignItems = "center";
    positionControls.style.marginBottom = "10px";

    // X position
    const xLabel = document.createElement("div");
    xLabel.textContent = "X:";
    positionControls.appendChild(xLabel);

    const xInput = document.createElement("input");
    xInput.id = "calibration-x";
    xInput.type = "number";
    xInput.style.width = "100%";
    positionControls.appendChild(xInput);

    // Y position
    const yLabel = document.createElement("div");
    yLabel.textContent = "Y:";
    positionControls.appendChild(yLabel);

    const yInput = document.createElement("input");
    yInput.id = "calibration-y";
    yInput.type = "number";
    yInput.style.width = "100%";
    positionControls.appendChild(yInput);

    // Width
    const widthLabel = document.createElement("div");
    widthLabel.textContent = "Width:";
    positionControls.appendChild(widthLabel);

    const widthInput = document.createElement("input");
    widthInput.id = "calibration-width";
    widthInput.type = "number";
    widthInput.style.width = "100%";
    positionControls.appendChild(widthInput);

    // Height
    const heightLabel = document.createElement("div");
    heightLabel.textContent = "Height:";
    positionControls.appendChild(heightLabel);

    const heightInput = document.createElement("input");
    heightInput.id = "calibration-height";
    heightInput.type = "number";
    heightInput.style.width = "100%";
    positionControls.appendChild(heightInput);

    panel.appendChild(positionControls);

    // Calibration scale
    const scaleLabel = document.createElement("div");
    scaleLabel.textContent = "Calibration Scale:";
    panel.appendChild(scaleLabel);

    const scaleInput = document.createElement("input");
    scaleInput.id = "calibration-scale";
    scaleInput.type = "number";
    scaleInput.step = "0.01";
    scaleInput.style.width = "100%";
    scaleInput.value = "0.23"; // Default calibration scale
    scaleInput.style.marginBottom = "10px";
    panel.appendChild(scaleInput);

    // Action buttons
    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "5px";
    buttonRow.style.marginTop = "10px";

    const applyBtn = document.createElement("button");
    applyBtn.textContent = "Apply";
    applyBtn.style.flex = "1";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.flex = "1";

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Export";
    exportBtn.style.flex = "1";

    buttonRow.appendChild(applyBtn);
    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(exportBtn);
    panel.appendChild(buttonRow);

    // Add status message area
    const statusMsg = document.createElement("div");
    statusMsg.id = "calibration-status";
    statusMsg.style.marginTop = "10px";
    statusMsg.style.fontSize = "12px";
    statusMsg.style.color = "#aaa";
    panel.appendChild(statusMsg);

    // Add panel to document
    document.body.appendChild(panel);

    // Setup event handlers
    this._setupCalibrationEventHandlers(
      animSelector,
      frameSelector,
      xInput,
      yInput,
      widthInput,
      heightInput,
      scaleInput,
      applyBtn,
      cancelBtn,
      exportBtn
    );

    // Initialize with first animation
    animSelector.dispatchEvent(new Event("change"));

    // Mark as calibrating
    this.calibration.isCalibrating = true;

    console.log("[Debug] Started hitbox calibration mode");
    this._updateCalibrationStatus("Click on map to position hitbox");
  }

  /**
   * Setup event handlers for calibration panel
   * @private
   */
  _setupCalibrationEventHandlers(animSelector, frameSelector, xInput, yInput, widthInput, heightInput, scaleInput, applyBtn, cancelBtn, exportBtn) {
    // Animation selector change handler
    animSelector.addEventListener("change", () => {
      const selectedAnim = animSelector.value;

      // Store current animation
      this.calibration.currentAnimation = selectedAnim;

      // Get animation data
      const animData = this.animationManager.animations[selectedAnim];

      // Update frame selector options
      frameSelector.innerHTML = "";
      for (let i = 0; i < animData.frameCount; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `Frame ${i}`;
        frameSelector.appendChild(option);
      }

      // Reset calibration coordinates array if needed
      if (!this.calibration.frameCoordinates[selectedAnim]) {
        // Initialize with existing coordinates or defaults
        this.calibration.frameCoordinates[selectedAnim] = [];

        for (let i = 0; i < animData.frameCount; i++) {
          // Use existing coordinates if available, otherwise defaults
          if (animData.handCoordinates && animData.handCoordinates[i]) {
            this.calibration.frameCoordinates[selectedAnim][i] = { ...animData.handCoordinates[i] };
          } else {
            this.calibration.frameCoordinates[selectedAnim][i] = {
              x: 300,
              y: 300,
              width: 300,
              height: 300,
            };
          }
        }
      }

      // Update scale input
      scaleInput.value = animData.calibrationScale || 0.23;

      // Switch to this animation and first frame
      this.animationManager.changeState(selectedAnim);
      this.animationManager.setFrame(0);

      // Trigger frame selector change
      frameSelector.selectedIndex = 0;
      frameSelector.dispatchEvent(new Event("change"));
    });

    // Frame selector change handler
    frameSelector.addEventListener("change", () => {
      const selectedAnim = animSelector.value;
      const selectedFrame = parseInt(frameSelector.value);

      // Set animation to this frame
      this.animationManager.setFrame(selectedFrame);

      // Update coordinate inputs
      const coords = this.calibration.frameCoordinates[selectedAnim][selectedFrame];
      if (coords) {
        xInput.value = coords.x;
        yInput.value = coords.y;
        widthInput.value = coords.width;
        heightInput.value = coords.height;

        // Position hitbox with these coordinates
        this._updateHitboxWithCoordinates(coords);
      }
    });

    // Coordinate input change handlers
    [xInput, yInput, widthInput, heightInput].forEach((input) => {
      input.addEventListener("change", () => {
        const selectedAnim = animSelector.value;
        const selectedFrame = parseInt(frameSelector.value);

        // Get updated values
        const newCoords = {
          x: parseInt(xInput.value),
          y: parseInt(yInput.value),
          width: parseInt(widthInput.value),
          height: parseInt(heightInput.value),
        };

        // Update stored coordinates
        this.calibration.frameCoordinates[selectedAnim][selectedFrame] = newCoords;

        // Update hitbox position
        this._updateHitboxWithCoordinates(newCoords);
      });
    });

    // Store original click handlers
    this._storeOriginalHandlers();

    // Map click handler for easier positioning
    const mapElement = document.getElementById("map-background") || document.getElementById("game-container");

    if (mapElement) {
      // Add new click handler
      mapElement.addEventListener(
        "click",
        (this._handleCalibrationMapClick = (e) => {
          const selectedAnim = animSelector.value;
          const selectedFrame = parseInt(frameSelector.value);

          // Get coordinates relative to map
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Update position (center hitbox on click point)
          const width = parseInt(widthInput.value);
          const height = parseInt(heightInput.value);

          const newCoords = {
            x: Math.round(x - width / 2),
            y: Math.round(y - height / 2),
            width: width,
            height: height,
          };

          // Update inputs
          xInput.value = newCoords.x;
          yInput.value = newCoords.y;

          // Update stored coordinates
          this.calibration.frameCoordinates[selectedAnim][selectedFrame] = newCoords;

          // Update hitbox position
          this._updateHitboxWithCoordinates(newCoords);

          this._updateCalibrationStatus(`Set position to (${newCoords.x}, ${newCoords.y})`);
        })
      );
    }

    // Apply button handler
    applyBtn.addEventListener("click", () => {
      this._applyCalibrationChanges(scaleInput.value);
    });

    // Cancel button handler
    cancelBtn.addEventListener("click", () => {
      this._cancelCalibration();
    });

    // Export button handler
    exportBtn.addEventListener("click", () => {
      this._exportCalibrationData();
    });
  }

  /**
   * Store original event handlers before calibration
   * @private
   */
  _storeOriginalHandlers() {
    const hitboxElement = document.getElementById("trump-hand-hitbox");
    if (hitboxElement) {
      // Clone original handlers using attributes
      this.calibration.originalHandlerClick = hitboxElement.onclick;
      this.calibration.originalHandlerTouch = hitboxElement.ontouchstart;

      // Temporarily remove handlers
      hitboxElement.onclick = null;
      hitboxElement.ontouchstart = null;
    }

    // Also disable game container click handler if it exists
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      this.calibration.originalContainerClick = gameContainer.onclick;
      gameContainer.onclick = null;
    }
  }

  /**
   * Update hitbox with specified coordinates
   * @private
   * @param {Object} coords - Coordinates to apply
   */
  // In DebugManager._updateHitboxWithCoordinates method
  _updateHitboxWithCoordinates(coords) {
    // Create a debug overlay element instead of modifying the game element
    let debugHitbox = document.getElementById("debug-hitbox-overlay");

    if (!debugHitbox) {
      debugHitbox = document.createElement("div");
      debugHitbox.id = "debug-hitbox-overlay";
      debugHitbox.style.position = "absolute";
      debugHitbox.style.pointerEvents = "none";
      debugHitbox.style.border = "2px dashed red";
      debugHitbox.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
      debugHitbox.style.zIndex = "1000"; // Above game elements
      document.body.appendChild(debugHitbox);
    }

    // Position the debug overlay instead of the actual hitbox
    debugHitbox.style.left = `${coords.x}px`;
    debugHitbox.style.top = `${coords.y}px`;
    debugHitbox.style.width = `${coords.width}px`;
    debugHitbox.style.height = `${coords.height}px`;

    // Keep the actual game element untouched
    // NO direct modifications to trump-hand-hitbox
  }

  /**
   * Apply calibration changes to animation data
   * @private
   * @param {string} scaleValue - Calibration scale to apply
   */
  _applyCalibrationChanges(scaleValue) {
    // Get animation manager
    if (!this.animationManager || !this.animationManager.animations) {
      console.error("[Debug] Cannot apply changes: animation manager not available");
      return;
    }

    // Go through all calibrated animations
    Object.keys(this.calibration.frameCoordinates).forEach((animName) => {
      const animData = this.animationManager.animations[animName];
      if (!animData) return;

      // Update hand coordinates
      animData.handCoordinates = [...this.calibration.frameCoordinates[animName]];

      // Update calibration scale
      animData.calibrationScale = parseFloat(scaleValue) || 0.23;
    });

    // Update status
    this._updateCalibrationStatus("Changes applied successfully!");

    // Don't exit calibration mode to allow for further adjustments
  }

  /**
   * Cancel calibration and restore original state
   * @private
   */
  _cancelCalibration() {
    this._exitCalibrationMode();
  }

  _exitCalibrationMode() {
    // Remove debug overlay
    const debugHitbox = document.getElementById("debug-hitbox-overlay");
    if (debugHitbox) debugHitbox.parentNode.removeChild(debugHitbox);

    // Remove calibration panel
    const panel = document.getElementById("calibration-panel");
    if (panel) {
      panel.remove();
    }

    // ONLY restore animation state through the animation manager
    if (this.animationManager) {
      this.animationManager.resume();
    }

    // Restore original click handlers
    this._restoreOriginalHandlers();

    // Clean up map click handler
    const mapElement = document.getElementById("map-background") || document.getElementById("game-container");
    if (mapElement && this._handleCalibrationMapClick) {
      mapElement.removeEventListener("click", this._handleCalibrationMapClick);
      this._handleCalibrationMapClick = null;
    }

    // Reset calibration state
    this.calibration.isCalibrating = false;

    console.log("[Debug] Exited hitbox calibration mode");
  }

  /**
   * Restore original event handlers after calibration
   * @private
   */
  _restoreOriginalHandlers() {
    const hitboxElement = document.getElementById("trump-hand-hitbox");
    if (hitboxElement) {
      // Restore original handlers
      hitboxElement.onclick = this.calibration.originalHandlerClick;
      hitboxElement.ontouchstart = this.calibration.originalHandlerTouch;
    }

    // Restore game container click handler
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.onclick = this.calibration.originalContainerClick;
    }
  }

  /**
   * Export calibration data
   * @private
   */
  _exportCalibrationData() {
    if (!this.animationManager || !this.animationManager.animations) {
      console.error("[Debug] No animation data available to export");
      return;
    }

    // Build export data object
    const exportData = {};

    // Export all calibrated animations
    Object.keys(this.calibration.frameCoordinates).forEach((animName) => {
      const animData = this.animationManager.animations[animName];
      if (!animData) return;

      // Get calibration scale
      const scale = document.getElementById("calibration-scale");
      const scaleValue = scale ? parseFloat(scale.value) : 0.23;

      exportData[animName] = {
        handCoordinates: this.calibration.frameCoordinates[animName],
        calibrationScale: scaleValue,
      };
    });

    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);

    // Create download link
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hitbox-calibration-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);

    this._updateCalibrationStatus("Calibration data exported");
  }

  /**
   * Update calibration status message
   * @private
   * @param {string} message - Status message
   */
  _updateCalibrationStatus(message) {
    const status = document.getElementById("calibration-status");
    if (status) {
      status.textContent = message;
    }
  }

  /**
   * Start protestor calibration mode
   * @private
   */
  _startProtestorCalibration() {
    if (!this.protestorHitboxManager) {
      console.error("[Debug] Cannot calibrate: protestor hitbox manager not available");
      return;
    }

    // Save game state
    this.protestorCalibration.wasPlaying = this.gameState?.isPlaying || false;
    this.protestorCalibration.wasPaused = this.gameState?.isPaused || false;

    // Pause game
    if (this.gameState) {
      this.gameState.isPaused = true;
    }

    // Get country from selector
    this.protestorCalibration.country = document.getElementById("debug-protestor-country").value;

    // Get coordinates for this country
    if (this.protestorHitboxManager.spawnLocations && this.protestorHitboxManager.spawnLocations[this.protestorCalibration.country]) {
      this.protestorCalibration.originalCoordinates = JSON.parse(
        JSON.stringify(this.protestorHitboxManager.spawnLocations[this.protestorCalibration.country])
      );

      this.protestorCalibration.totalLocations = this.protestorHitboxManager.spawnLocations[this.protestorCalibration.country].length || 3;
    }

    // Create protestor calibration panel
    this._createProtestorCalibrationPanel();
  }

  /**
   * Create protestor calibration panel
   * @private
   */
  _createProtestorCalibrationPanel() {
    // Remove any existing panel
    const existingPanel = document.getElementById("calibration-panel");
    if (existingPanel) {
      existingPanel.remove();
    }

    // Create new panel
    const panel = document.createElement("div");
    panel.id = "calibration-panel";

    // Panel title
    const title = document.createElement("h3");
    title.textContent = `Protestor Calibration: ${this.protestorCalibration.country}`;
    title.style.margin = "0 0 10px 0";
    panel.appendChild(title);

    // Location selector
    const locationLabel = document.createElement("div");
    locationLabel.textContent = "Location:";
    panel.appendChild(locationLabel);

    const locationControls = document.createElement("div");
    locationControls.style.display = "flex";
    locationControls.style.gap = "5px";
    locationControls.style.marginBottom = "10px";

    const locationSelector = document.createElement("select");
    locationSelector.id = "protestor-location-selector";
    locationSelector.style.flex = "1";

    // Add location options
    for (let i = 0; i < this.protestorCalibration.totalLocations; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `Location ${i + 1}`;
      locationSelector.appendChild(option);
    }

    locationControls.appendChild(locationSelector);
    panel.appendChild(locationControls);

    // Position inputs
    const positionControls = document.createElement("div");
    positionControls.style.display = "grid";
    positionControls.style.gridTemplateColumns = "auto 1fr";
    positionControls.style.gap = "5px";
    positionControls.style.alignItems = "center";
    positionControls.style.marginBottom = "10px";

    // X position
    const xLabel = document.createElement("div");
    xLabel.textContent = "X:";
    positionControls.appendChild(xLabel);

    const xInput = document.createElement("input");
    xInput.id = "protestor-x";
    xInput.type = "number";
    xInput.style.width = "100%";
    positionControls.appendChild(xInput);

    // Y position
    const yLabel = document.createElement("div");
    yLabel.textContent = "Y:";
    positionControls.appendChild(yLabel);

    const yInput = document.createElement("input");
    yInput.id = "protestor-y";
    yInput.type = "number";
    yInput.style.width = "100%";
    positionControls.appendChild(yInput);

    // Width
    const widthLabel = document.createElement("div");
    widthLabel.textContent = "Width:";
    positionControls.appendChild(widthLabel);

    const widthInput = document.createElement("input");
    widthInput.id = "protestor-width";
    widthInput.type = "number";
    widthInput.style.width = "100%";
    positionControls.appendChild(widthInput);

    // Height
    const heightLabel = document.createElement("div");
    heightLabel.textContent = "Height:";
    positionControls.appendChild(heightLabel);

    const heightInput = document.createElement("input");
    heightInput.id = "protestor-height";
    heightInput.type = "number";
    heightInput.style.width = "100%";
    positionControls.appendChild(heightInput);

    panel.appendChild(positionControls);

    // Calibration scale
    const scaleLabel = document.createElement("div");
    scaleLabel.textContent = "Calibration Scale:";
    panel.appendChild(scaleLabel);

    const scaleInput = document.createElement("input");
    scaleInput.id = "protestor-scale";
    scaleInput.type = "number";
    scaleInput.step = "0.01";
    scaleInput.style.width = "100%";
    scaleInput.value = "0.24"; // Default protestor calibration scale
    scaleInput.style.marginBottom = "10px";
    panel.appendChild(scaleInput);

    // Preview button
    const previewBtn = document.createElement("button");
    previewBtn.textContent = "Preview Protestors";
    previewBtn.style.width = "100%";
    previewBtn.style.marginBottom = "10px";
    panel.appendChild(previewBtn);

    // Action buttons
    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.gap = "5px";
    buttonRow.style.marginTop = "10px";

    const applyBtn = document.createElement("button");
    applyBtn.textContent = "Apply";
    applyBtn.style.flex = "1";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.flex = "1";

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Export";
    exportBtn.style.flex = "1";

    buttonRow.appendChild(applyBtn);
    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(exportBtn);
    panel.appendChild(buttonRow);

    // Add status message area
    const statusMsg = document.createElement("div");
    statusMsg.id = "protestor-status";
    statusMsg.style.marginTop = "10px";
    statusMsg.style.fontSize = "12px";
    statusMsg.style.color = "#aaa";
    panel.appendChild(statusMsg);

    // Add panel to document
    document.body.appendChild(panel);

    // Setup event handlers
    this._setupProtestorCalibrationEventHandlers(
      locationSelector,
      xInput,
      yInput,
      widthInput,
      heightInput,
      scaleInput,
      previewBtn,
      applyBtn,
      cancelBtn,
      exportBtn
    );

    // Initialize with first location
    locationSelector.dispatchEvent(new Event("change"));

    // Mark as calibrating
    this.protestorCalibration.isCalibrating = true;

    console.log("[Debug] Started protestor calibration mode");
    this._updateProtestorCalibrationStatus("Click on map to position protestors");
  }

  /**
   * Setup event handlers for protestor calibration panel
   * @private
   */
  _setupProtestorCalibrationEventHandlers(
    locationSelector,
    xInput,
    yInput,
    widthInput,
    heightInput,
    scaleInput,
    previewBtn,
    applyBtn,
    cancelBtn,
    exportBtn
  ) {
    const country = this.protestorCalibration.country;

    // Location selector change handler
    locationSelector.addEventListener("change", () => {
      const locationIndex = parseInt(locationSelector.value);
      this.protestorCalibration.locationIndex = locationIndex;

      // Get location data
      const spawnLocations = this.protestorHitboxManager.spawnLocations[country];
      if (spawnLocations && spawnLocations[locationIndex]) {
        const locationData = spawnLocations[locationIndex];

        // Update inputs
        xInput.value = locationData.x;
        yInput.value = locationData.y;
        widthInput.value = locationData.width;
        heightInput.value = locationData.height;
        scaleInput.value = locationData.calibrationScale || 0.24;

        // Update preview
        this._updateProtestorPreview(locationData);
      }
    });

    // Coordinate input change handlers
    [xInput, yInput, widthInput, heightInput, scaleInput].forEach((input) => {
      input.addEventListener("change", () => {
        const locationIndex = parseInt(locationSelector.value);

        // Get updated values
        const newCoords = {
          x: parseInt(xInput.value),
          y: parseInt(yInput.value),
          width: parseInt(widthInput.value),
          height: parseInt(heightInput.value),
          calibrationScale: parseFloat(scaleInput.value),
        };

        // Update stored coordinates
        if (this.protestorHitboxManager.spawnLocations[country] && this.protestorHitboxManager.spawnLocations[country][locationIndex]) {
          Object.assign(this.protestorHitboxManager.spawnLocations[country][locationIndex], newCoords);

          // Update preview
          this._updateProtestorPreview(newCoords);
        }
      });
    });

    // Map click handler
    const mapElement = document.getElementById("map-background") || document.getElementById("game-container");

    if (mapElement) {
      // Add new click handler
      mapElement.addEventListener(
        "click",
        (this._handleProtestorMapClick = (e) => {
          const locationIndex = parseInt(locationSelector.value);

          // Get coordinates relative to map
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Update position (center on click point)
          const width = parseInt(widthInput.value);
          const height = parseInt(heightInput.value);

          const newCoords = {
            x: Math.round(x - width / 2),
            y: Math.round(y - height / 2),
            width: width,
            height: height,
            calibrationScale: parseFloat(scaleInput.value),
          };

          // Update inputs
          xInput.value = newCoords.x;
          yInput.value = newCoords.y;

          // Update stored coordinates
          if (this.protestorHitboxManager.spawnLocations[country] && this.protestorHitboxManager.spawnLocations[country][locationIndex]) {
            Object.assign(this.protestorHitboxManager.spawnLocations[country][locationIndex], newCoords);

            // Update preview
            this._updateProtestorPreview(newCoords);
          }

          this._updateProtestorCalibrationStatus(`Set position to (${newCoords.x}, ${newCoords.y})`);
        })
      );
    }

    // Preview button handler
    previewBtn.addEventListener("click", () => {
      this._previewProtestors();
    });

    // Apply button handler
    applyBtn.addEventListener("click", () => {
      this._applyProtestorCalibrationChanges();
    });

    // Cancel button handler
    cancelBtn.addEventListener("click", () => {
      this._cancelProtestorCalibration();
    });

    // Export button handler
    exportBtn.addEventListener("click", () => {
      this._exportProtestorCalibrationData();
    });
  }

  /**
   * Update protestor preview during calibration
   * @private
   * @param {Object} coords - Coordinates to preview
   */
  _updateProtestorPreview(coords) {
    // Create or update preview element
    let previewElement = document.getElementById("protestor-preview");

    if (!previewElement) {
      previewElement = document.createElement("div");
      previewElement.id = "protestor-preview";
      previewElement.style.position = "absolute";
      previewElement.style.pointerEvents = "none";
      previewElement.style.border = "2px dashed blue";
      previewElement.style.backgroundColor = "rgba(0, 0, 255, 0.2)";
      previewElement.style.zIndex = "3000";
      document.body.appendChild(previewElement);
    }

    // Position preview
    previewElement.style.left = `${coords.x}px`;
    previewElement.style.top = `${coords.y}px`;
    previewElement.style.width = `${coords.width}px`;
    previewElement.style.height = `${coords.height}px`;
    previewElement.style.display = "block";
  }

  /**
   * Preview protestors in game
   * @private
   */
  _previewProtestors() {
    const country = this.protestorCalibration.country;

    // Hide any existing preview
    const previewElement = document.getElementById("protestor-preview");
    if (previewElement) {
      previewElement.style.display = "none";
    }

    // Hide any existing protestors first
    if (this.freedomManager && typeof this.freedomManager.hideProtestors === "function") {
      this.freedomManager.hideProtestors(country);
    }

    // Show protestors using current coordinates
    if (this.freedomManager && typeof this.freedomManager.showProtestors === "function") {
      this.freedomManager.showProtestors(country);

      this._updateProtestorCalibrationStatus("Showing protestors preview. Click Apply when satisfied.");
    }
  }

  /**
   * Apply protestor calibration changes
   * @private
   */
  _applyProtestorCalibrationChanges() {
    // Hide any preview protestors
    const country = this.protestorCalibration.country;

    if (this.freedomManager && typeof this.freedomManager.hideProtestors === "function") {
      this.freedomManager.hideProtestors(country);
    }

    this._updateProtestorCalibrationStatus("Changes applied successfully!");

    // Don't exit calibration mode to allow for further adjustments
  }

  /**
   * Cancel protestor calibration and restore original state
   * @private
   */
  _cancelProtestorCalibration() {
    // Restore original coordinates
    if (this.protestorHitboxManager && this.protestorHitboxManager.spawnLocations && this.protestorCalibration.originalCoordinates) {
      const country = this.protestorCalibration.country;
      this.protestorHitboxManager.spawnLocations[country] = JSON.parse(JSON.stringify(this.protestorCalibration.originalCoordinates));
    }

    // Exit calibration mode
    this._exitProtestorCalibrationMode();
  }

  /**
   * Exit protestor calibration mode
   * @private
   */
  _exitProtestorCalibrationMode() {
    // Remove calibration panel
    const panel = document.getElementById("calibration-panel");
    if (panel) {
      panel.remove();
    }

    // Remove preview element
    const previewElement = document.getElementById("protestor-preview");
    if (previewElement && previewElement.parentNode) {
      previewElement.parentNode.removeChild(previewElement);
    }

    // Hide any preview protestors
    const country = this.protestorCalibration.country;
    if (this.freedomManager && typeof this.freedomManager.hideProtestors === "function") {
      this.freedomManager.hideProtestors(country);
    }

    // Remove map click handler
    const mapElement = document.getElementById("map-background") || document.getElementById("game-container");
    if (mapElement && this._handleProtestorMapClick) {
      mapElement.removeEventListener("click", this._handleProtestorMapClick);
      this._handleProtestorMapClick = null;
    }

    // Restore game state
    if (this.gameState) {
      this.gameState.isPaused = this.protestorCalibration.wasPaused;
    }

    // Reset calibration state
    this.protestorCalibration.isCalibrating = false;

    console.log("[Debug] Exited protestor calibration mode");
  }

  /**
   * Export protestor calibration data
   * @private
   */
  _exportProtestorCalibrationData() {
    if (!this.protestorHitboxManager || !this.protestorHitboxManager.spawnLocations) {
      console.error("[Debug] No protestor data available to export");
      return;
    }

    // Build export data object
    const exportData = {
      spawnLocations: {},
    };

    // Copy spawn locations data
    Object.keys(this.protestorHitboxManager.spawnLocations).forEach((country) => {
      exportData.spawnLocations[country] = JSON.parse(JSON.stringify(this.protestorHitboxManager.spawnLocations[country]));
    });

    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);

    // Create download link
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `protestor-calibration-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);

    this._updateProtestorCalibrationStatus("Protestor calibration data exported");
  }

  /**
   * Update protestor calibration status message
   * @private
   * @param {string} message - Status message
   */
  _updateProtestorCalibrationStatus(message) {
    const status = document.getElementById("protestor-status");
    if (status) {
      status.textContent = message;
    }
  }
}

// Make the DebugManager globally available
window.DebugManager = DebugManager;
