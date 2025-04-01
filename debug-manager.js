// New code with overly complex hip box and protester calibration that doesn't even work

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
    this.UFOManager = null;
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

togglePanel(forceState) {
  // Check current state
  const isHidden = this.panel.classList.contains("hidden");
  
  // Flip the state unless forceState is provided
  const shouldShow = (forceState !== undefined) ? forceState : isHidden;
  
  // Apply change directly
  this.panel.classList.toggle("hidden", !shouldShow);
  
  // Update button
  const toggleBtn = document.getElementById("debug-toggle");
  if (toggleBtn) {
    toggleBtn.classList.toggle("dbg-toggle-active", shouldShow);
  }
  
  // Save state
  localStorage.setItem("debugPanelVisible", shouldShow);
  
  // Update statuses
  if (shouldShow) {
    this.startStatusUpdates();
  } else {
    this.stopStatusUpdates();
  }
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
    this.UFOManager = window.UFOManager || (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.ufo);

    // Find speed manager
    this.speedManager = window.speedManager || (window.gameEngine && window.gameEngine.systems && window.gameEngine.systems.speed);

    console.log("[Debug] Connected managers:", {
      audioManager: !!this.audioManager,
      freedomManager: !!this.freedomManager,
      handHitboxManager: !!this.handHitboxManager,
      protestorHitboxManager: !!this.protestorHitboxManager,
      UFOManager: !!this.UFOManager,
      speedManager: !!this.speedManager,
    });
  }
  setupKeyBindings() {
    // Remove existing listener if it exists
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
      this._keydownHandler = null; // Clear the reference
    }
    
    // Create a new bound handler
    this._keydownHandler = (e) => {
      console.log("[Debug] Keydown event:", e.key, e.ctrlKey, e.metaKey);
      
      // Special handling for debug panel
      if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        console.log("[Debug] D key pressed, toggling panel");
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
          this._updateGameUI();
        }
      },
      { showEffect: true, small: true }
    );
    timeButtons.appendChild(setTimeBtn);
  
    // Add time buttons
    [30, 60, 120, 168].forEach((seconds) => {
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
  
    // Game speed controls - updated with all speed levels
    const speedControls = document.createElement("div");
    speedControls.className = "dbg-group";
    speedControls.innerHTML = `<div>Speed Controls:</div>`;
  
    const speedButtons = document.createElement("div");
    speedButtons.style.display = "flex";
    speedButtons.style.gap = "5px";
    speedButtons.style.marginTop = "5px";
    speedButtons.style.flexWrap = "wrap";
  
    const speedInput = document.createElement("input");
    speedInput.id = "debug-speed-input";
    speedInput.type = "number";
    speedInput.step = "0.1";
    speedInput.min = "0.1";
    speedInput.max = "5.0";
    speedInput.value = "1.0";
    speedInput.className = "dbg-input";
    speedInput.style.width = "60px";
  
    const setSpeedBtn = this.createButton(
      "Set Speed",
      () => {
        if (window.speedManager) {
          const customSpeed = parseFloat(document.getElementById("debug-speed-input").value);
          if (!isNaN(customSpeed)) {
            window.speedManager.setSpeed(customSpeed);
          }
        }
      },
      { small: true }
    );
  
    // Add buttons for all speed levels from SpeedManager
    if (window.speedManager && window.speedManager.speedLevels) {
      window.speedManager.speedLevels.forEach((level) => {
        const btn = this.createButton(
          `${level.multiplier}x ${level.name}`,
          () => {
            if (window.speedManager) {
              window.speedManager.setSpeed(level.multiplier);
            }
          },
          { small: true }
        );
        speedButtons.appendChild(btn);
      });
    } else {
      // Fallback if speed manager not available
      [0.7, 1.0, 1.3, 1.8, 2.2, 3.1, 4.0].forEach((speed) => {
        const btn = this.createButton(
          `${speed}x`,
          () => {
            if (window.speedManager) {
              window.speedManager.setSpeed(speed);
            }
          },
          { small: true }
        );
        speedButtons.appendChild(btn);
      });
    }
  
    const speedControls2 = document.createElement("div");
    speedControls2.style.display = "flex";
    speedControls2.style.gap = "5px";
    speedControls2.style.marginTop = "5px";
    speedControls2.appendChild(speedInput);
    speedControls2.appendChild(setSpeedBtn);
  
    speedControls.appendChild(speedButtons);
    speedControls.appendChild(speedControls2);
    content.appendChild(speedControls);
  
    // Tutorial controls - enhanced
    const tutorialControls = document.createElement("div");
    tutorialControls.className = "dbg-group";
    tutorialControls.innerHTML = `<div>Tutorial Controls:</div>`;
  
    const completeTutorialBtn = this.createButton(
      "Complete Tutorial",
      () => {
        if (window.speedManager) {
          window.speedManager.state.tutorialCompleted = true;
          window.speedManager._startRegularSpeedProgression();
        }
      }
    );
  
    const showInstructionBtn = this.createButton(
      "Show Instruction",
      () => {
        if (window.speedManager) {
          window.speedManager.showNextInstruction();
        }
      }
    );
  
    const resetTutorialBtn = this.createButton(
      "Reset Tutorial",
      () => {
        if (window.speedManager) {
          window.speedManager.reset();
          window.speedManager.startSpeedProgression();
        }
      }
    );
  
    tutorialControls.appendChild(completeTutorialBtn);
    tutorialControls.appendChild(showInstructionBtn);
    tutorialControls.appendChild(resetTutorialBtn);
    content.appendChild(tutorialControls);
  
    // Game flow controls with enhanced world shrink testing
    const flowControls = document.createElement("div");
    flowControls.className = "dbg-group";
  
    const startBtn = this.createButton("Start Game", () => {
      if (window.gameEngine && window.gameEngine.startGame) {
        window.gameEngine.startGame();
      }
    });
  
    const pauseBtn = this.createButton("Toggle Pause", () => {
      if (window.gameEngine && window.gameEngine.togglePause) {
        window.gameEngine.togglePause();
      }
    });
  
    const gameOverBtns = document.createElement("div");
    gameOverBtns.style.display = "flex";
    gameOverBtns.style.gap = "5px";
    gameOverBtns.style.marginTop = "5px";
    gameOverBtns.style.flexWrap = "wrap";
  
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
          window.gameEngine.endGame(false, { 
            showWorldShrinkAnimation: true,
            animationDuration: 7000,
            keepTrumpAnimating: true 
          });
        }
      },
      { className: "dbg-button small" }
    );
  
    const restartBtn = this.createButton("Restart Game", () => {
      if (window.gameEngine && window.gameEngine.restartGame) {
        window.gameEngine.restartGame();
      }
    });
  
    flowControls.appendChild(startBtn);
    flowControls.appendChild(pauseBtn);
    flowControls.appendChild(gameOverBtns);
    flowControls.appendChild(restartBtn);
    gameOverBtns.appendChild(winBtn);
    gameOverBtns.appendChild(loseBtn);
    gameOverBtns.appendChild(worldShrinkBtn);
    content.appendChild(flowControls);
  
    // Game state display
    const stateStatus = this.createStatus("game-state-status", "Game state information");
    content.appendChild(stateStatus);
  
    // Schedule state updates
    setInterval(() => this._updateGameStateDisplay(), 500);
  }
  
  // Update the game state display method
  _updateGameStateDisplay() {
    if (!this.gameState) return;
  
    const status = document.getElementById("game-state-status");
    if (!status) return;
  
    const speed = window.speedManager ? window.speedManager.getCurrentSpeed() : { multiplier: 1, name: "Normal" };
  
    status.innerHTML = `
      <div>Playing: ${this.gameState.isPlaying ? "Yes" : "No"}</div>
      <div>Paused: ${this.gameState.isPaused ? "Yes" : "No"}</div>
      <div>Time: ${this.gameState.timeRemaining}s</div>
      <div>Score: ${this.gameState.score}</div>
      <div>Speed: ${speed.multiplier.toFixed(1)}x (${speed.name})</div>
      <div>Tutorial Complete: ${window.speedManager?.state.tutorialCompleted ? "Yes" : "No"}</div>
      <div>Blocks: ${this.gameState.stats.successfulBlocks}</div>
      <div>Consecutive Hits: ${this.gameState.consecutiveHits}</div>
    `;
  }

/**
 * Update game state display
 * @private
 */
_updateGameStateDisplay() {
    if (!this.gameState) return;

    const status = document.getElementById("game-state-status");
    if (!status) return;

    const speed = window.speedManager ? window.speedManager.getCurrentSpeed() : { multiplier: 1, name: "Normal" };

    status.innerHTML = `
        <div>Playing: ${this.gameState.isPlaying ? "Yes" : "No"}</div>
        <div>Paused: ${this.gameState.isPaused ? "Yes" : "No"}</div>
        <div>Time: ${this.gameState.timeRemaining}s</div>
        <div>Score: ${this.gameState.score}</div>
        <div>Speed: ${speed.multiplier.toFixed(1)}x (${speed.name})</div>
        <div>Tutorial Complete: ${window.speedManager?.state.tutorialCompleted ? "Yes" : "No"}</div>
        <div>Blocks: ${this.gameState.stats.successfulBlocks}</div>
        <div>Consecutive Hits: ${this.gameState.consecutiveHits}</div>
    `;
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
  
    // Add test for 'victory' animation
    const testVictoryBtn = this.createButton("Test Victory Animation", () => {
      if (this.animationManager) {
        this.animationManager.changeState("victory", () => {
          // Return to idle after animation completes
          this.animationManager.changeState("idle");
        });
      }
    });
  
    sequenceControls.appendChild(testGrabBtn);
    sequenceControls.appendChild(testBlockBtn);
    sequenceControls.appendChild(testVictoryBtn);
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
  
    // Add button to highlight a country
    const highlightCountryBtn = this.createButton("Highlight Country", () => {
      const country = document.getElementById("debug-protestor-country")?.value || "mexico";
      if (window.trumpHandEffects) {
        window.trumpHandEffects.highlightTargetCountry(country, true);
      }
    });
  
    effectControls.appendChild(hitEffectBtn);
    effectControls.appendChild(grabEffectBtn);
    effectControls.appendChild(highlightCountryBtn);
    content.appendChild(effectControls);
  
    
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
  
    // Audio Context Controls
    const contextControls = document.createElement("div");
    contextControls.className = "dbg-group";
  
    const resumeContextBtn = this.createButton("Resume Audio Context", () => {
      if (this.audioManager && typeof this.audioManager.resumeAudioContext === "function") {
        this.audioManager.resumeAudioContext();
      }
    });
  
    const unlockBtn = this.createButton("Unlock Audio", () => {
      if (this.audioManager && typeof this.audioManager.unlock === "function") {
        this.audioManager.unlock();
      }
    });
  
    const primePoolBtn = this.createButton("Prime Audio Pool", () => {
      if (this.audioManager && typeof this.audioManager.primeAudioPool === "function") {
        this.audioManager.primeAudioPool();
      }
    });
  
    contextControls.appendChild(resumeContextBtn);
    contextControls.appendChild(unlockBtn);
    contextControls.appendChild(primePoolBtn);
    content.appendChild(contextControls);
  
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
  
    const fadeOutBtn = this.createButton("Fade Out Music", () => {
      if (this.audioManager && typeof this.audioManager.fadeTo === "function" && this.audioManager.backgroundMusic) {
        this.audioManager.fadeTo(
          this.audioManager.backgroundMusic,
          0, // Target volume
          2000, // Duration in ms
          () => {
            this.audioManager.stopBackgroundMusic();
          }
        );
      }
    });
  
    musicControls.appendChild(musicTitle);
    musicControls.appendChild(startMusicBtn);
    musicControls.appendChild(stopMusicBtn);
    musicControls.appendChild(fadeOutBtn);
    content.appendChild(musicControls);
  
    // Sound test categories
    const soundCategories = [
      {
        id: "ui",
        name: "UI Sounds",
        sounds: ["click", "gameStart", "gameOver", "win", "lose", "grabWarning", "instruction", "stopHim", "smackThatHand", "faster", "aliens", "musk", "growProtestors"],
      },
      { 
        id: "trump", 
        name: "Trump Sounds", 
        sounds: ["trumpGrabbing", "partialAnnexCry", "trumpSob", "trumpYa", "evilLaugh"] 
      },
      { 
        id: "defense", 
        name: "Defense Sounds", 
        sounds: ["slap", "peopleSayNo"] 
      }
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
              this.audioManager.play(category.id, sound);
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
    ["eastCanada", "westCanada", "mexico", "greenland"].forEach((country) => {
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
      "Play Protest",
      () => {
        const country = countrySelector.value;
        if (this.audioManager && typeof this.audioManager.playProtestorSound === "function") {
          this.audioManager.playProtestorSound(country);
        }
      },
      { small: true }
    );
  
    const stopProtestBtn = this.createButton(
      "Stop Protest",
      () => {
        const country = countrySelector.value;
        if (this.audioManager && typeof this.audioManager.stopProtestorSound === "function") {
          this.audioManager.stopProtestorSound(country);
        }
      },
      { small: true }
    );
  
    countrySoundControls.appendChild(countryTitle);
    countrySoundControls.appendChild(countrySelector);
    countrySoundControls.appendChild(document.createElement("br"));
    countrySoundControls.appendChild(testCatchphraseBtn);
    countrySoundControls.appendChild(testProtestBtn);
    countrySoundControls.appendChild(stopProtestBtn);
    content.appendChild(countrySoundControls);
  
    // Game event sound tests
    const gameEventSounds = document.createElement("div");
    gameEventSounds.className = "dbg-group";
    gameEventSounds.innerHTML = `<div>Game Event Sounds:</div>`;
  
    const successfulBlockBtn = this.createButton("Successful Block", () => {
      if (this.audioManager && typeof this.audioManager.playSuccessfulBlock === "function") {
        this.audioManager.playSuccessfulBlock("mexico");
      }
    });
  
    const successfulGrabBtn = this.createButton("Successful Grab", () => {
      if (this.audioManager && typeof this.audioManager.playSuccessfulGrab === "function") {
        this.audioManager.playSuccessfulGrab("mexico");
      }
    });
    
    const annexBtn = this.createButton("Full Annexation", () => {
      if (this.audioManager && typeof this.audioManager.playCountryFullyAnnexedCry === "function") {
        this.audioManager.playCountryFullyAnnexedCry("mexico");
      }
    });
  
    gameEventSounds.appendChild(successfulBlockBtn);
    gameEventSounds.appendChild(successfulGrabBtn);
    gameEventSounds.appendChild(annexBtn);
    content.appendChild(gameEventSounds);
  
    // Audio system control and status
    const systemControls = document.createElement("div");
    systemControls.className = "dbg-group";
  
    const stopAllBtn = this.createButton("Stop All Sounds", () => {
      if (this.audioManager && typeof this.audioManager.stopAll === "function") {
        this.audioManager.stopAll();
      }
    });
  
    const resetBtn = this.createButton("Reset Audio System", () => {
      if (this.audioManager && typeof this.audioManager.reset === "function") {
        this.audioManager.reset();
      }
    });
  
    systemControls.appendChild(stopAllBtn);
    systemControls.appendChild(resetBtn);
    content.appendChild(systemControls);
  
    // Add audio status display
    const audioStatus = this.createStatus("audio-status", "Audio system status");
    content.appendChild(audioStatus);
  
    // Update status periodically
    setInterval(() => {
      if (!this.audioManager) return;
      
      const status = document.getElementById("audio-status");
      if (!status) return;
  
      status.innerHTML = `
        <div>Context: ${this.audioManager.audioContext?.state || "none"}</div>
        <div>Initialized: ${this.audioManager.initialized ? "Yes" : "No"}</div>
        <div>Muted: ${this.audioManager.muted ? "Yes" : "No"}</div>
        <div>Volume: ${this.audioManager.volume?.toFixed(2) || "1.00"}</div>
        <div>Playing Sounds: ${this.audioManager.currentlyPlaying?.length || 0}</div>
        <div>Music Playing: ${this.audioManager.backgroundMusicPlaying ? "Yes" : "No"}</div>
        <div>Loaded Sounds: ${this.audioManager.loadedSounds?.size || 0}</div>
      `;
    }, 500);
  }

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
  
    // Add button for growing protestors
    const growProtestorsBtn = this.createButton("Grow Protestors", () => {
      const country = countrySelector.value;
      if (this.freedomManager && typeof this.freedomManager.growProtestors === "function") {
        this.freedomManager.growProtestors(country);
      } else if (this.audioManager) {
        // Fall back to just playing the sound
        this.audioManager.play("ui", "growProtestors");
      }
    });
  
    actionControls.appendChild(annexBtn);
    actionControls.appendChild(resistanceReadyBtn);
    actionControls.appendChild(triggerResistanceBtn);
    actionControls.appendChild(celebrationBtn);
    actionControls.appendChild(growProtestorsBtn);
    content.appendChild(actionControls);
  
    // Resistance status display
    const resistanceStatus = this.createStatus("resistance-status", "Resistance status information");
    content.appendChild(resistanceStatus);
  }
  
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
      // code goes here
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
      // protestor calibration goes here?
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

  setupUfoControlsSection() {
    const { content } = this.createSection("ufo", "UFO & Easter Eggs");
  
    // UFO controls
    if (this.UFOManager || window.UFOManager) {
      const ufoControls = document.createElement("div");
      ufoControls.className = "dbg-group";
  
      const showUfoBtn = this.createButton("Show UFO", () => {
        const ufo = this.UFOManager || window.UFOManager;
        if (ufo && typeof ufo.flyUfo === "function") {
          ufo.flyUfo();
        }
      });
  
      const hideUfoBtn = this.createButton("Hide UFO", () => {
        const ufo = this.UFOManager || window.UFOManager;
        if (ufo && this.elements && this.elements.ufo) {
          ufo.elements.ufo.style.opacity = "0";
        }
      });
  
  
      ufoControls.appendChild(showUfoBtn);
      ufoControls.appendChild(hideUfoBtn);
      content.appendChild(ufoControls);
    }
  
    // Elon appearance
    const elonControls = document.createElement("div");
    elonControls.className = "dbg-group";
  
    const showElonBtn = this.createButton("Show Elon", () => {
      const ufo = this.UFOManager || window.UFOManager;
      if (ufo && typeof ufo.showElonMusk === "function") {
        // Pass true to indicate this is a standalone test that should auto-cleanup
        ufo.showElonMusk(true);
  
        // Play sound if available
        if (this.audioManager) {
          this.audioManager.play("ui", "musk");
        }
      }
    });
  
    const cleanupElonBtn = this.createButton("Clean Up Elon", () => {
      const ufo = this.UFOManager || window.UFOManager;
      if (ufo) {
        if (typeof ufo.cleanupElonMusk === "function") {
          ufo.cleanupElonMusk();
        } else if (typeof ufo.cleanupElonElements === "function") {
          ufo.cleanupElonElements({ withTumble: true });
          ufo.removeElonHitbox && ufo.removeElonHitbox();
        }
      }
    });
  
    elonControls.appendChild(showElonBtn);
    elonControls.appendChild(cleanupElonBtn);
    content.appendChild(elonControls);
  
    // Aliens sound effect
    const aliensControls = document.createElement("div");
    aliensControls.className = "dbg-group";
  
    const playAliensBtn = this.createButton("Play Aliens Sound", () => {
      if (this.audioManager) {
        if (typeof this.audioManager.resumeAudioContext === "function") {
          this.audioManager.resumeAudioContext().then(() => {
            this.audioManager.play("ui", "aliens", 0.8);
          });
        } else {
          this.audioManager.play("ui", "aliens", 0.8);
        }
      }
    });
  
    aliensControls.appendChild(playAliensBtn);
    content.appendChild(aliensControls);
  
    // Add extra options for debugging
    const debugOptions = document.createElement("div");
    debugOptions.className = "dbg-group";
  
    const checkOrphanedBtn = this.createButton("Check Orphaned Elon Elements", () => {
      const ufo = this.UFOManager || window.UFOManager;
      if (ufo && typeof ufo.cleanupOrphanedElements === "function") {
        ufo.cleanupOrphanedElements();
      } else {
        // Fallback cleanup logic
        document.querySelectorAll('[id*="elon"]').forEach(el => {
          if (el && el.parentNode) {
            console.log(`Found and removing orphaned element: ${el.id}`);
            el.parentNode.removeChild(el);
          }
        });
      }
    });
  
    debugOptions.appendChild(checkOrphanedBtn);
    content.appendChild(debugOptions);
  
    // Add UFO Status display
    if (this.UFOManager || window.UFOManager) {
      const ufoStatus = this.createStatus("ufo-status", "UFO status information");
      content.appendChild(ufoStatus);
  
      // Update UFO status periodically
      setInterval(() => {
        const ufo = this.UFOManager || window.UFOManager;
        if (!ufo) return;
        
        const status = document.getElementById("ufo-status");
        if (!status) return;
  
        // Check if Elon elements exist
        const elonExists = !!document.getElementById("elon-sprite") || 
                            !!document.getElementById("elon-wrapper") ||
                            !!document.getElementById("elon-hitbox");
  
        status.innerHTML = `
          <div>Auto Spawn: ${ufo.state?.autoSpawnEnabled ? "Enabled" : "Disabled"}</div>
          <div>Animating: ${ufo.state?.isAnimating ? "Yes" : "No"}</div>
          <div>Elon Visible: ${elonExists ? "Yes" : "No"}</div>
          <div>UFO Visible: ${ufo.elements?.ufo?.style.opacity !== "0" ? "Yes" : "No"}</div>
        `;
      }, 500);
    }
  }

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
  
    // Memory usage monitoring
    const memoryControls = document.createElement("div");
    memoryControls.className = "dbg-group";
  
    const memoryMonitor = document.createElement("div");
    memoryMonitor.id = "debug-memory-monitor";
    memoryMonitor.className = "dbg-status";
    memoryMonitor.textContent = "Memory: --";
  
    // Add memory monitoring if performance API is available
    if (performance && performance.memory) {
      const checkMemoryBtn = this.createButton("Check Memory", () => {
        try {
          const memory = performance.memory;
          const usedHeap = Math.round(memory.usedJSHeapSize / (1024 * 1024));
          const totalHeap = Math.round(memory.totalJSHeapSize / (1024 * 1024));
          memoryMonitor.textContent = `Memory: ${usedHeap}MB / ${totalHeap}MB`;
        } catch (e) {
          memoryMonitor.textContent = "Memory: Not available";
        }
      });
      memoryControls.appendChild(checkMemoryBtn);
      memoryControls.appendChild(memoryMonitor);
      content.appendChild(memoryControls);
    }
  
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
      <div><strong>Chrome Mobile:</strong> ${window.isChromeOnMobile ? "Yes" : "No"}</div>
    `;
  
    content.appendChild(infoControls);
  
    // Page events monitoring
    const eventsControls = document.createElement("div");
    eventsControls.className = "dbg-group";
  
    // Create a toggle for enabling event monitoring
    const toggleEventsBtn = this.createButton("Monitor Events", () => {
      if (!this._eventMonitoringActive) {
        this._startEventMonitoring();
        toggleEventsBtn.textContent = "Stop Monitoring";
      } else {
        this._stopEventMonitoring();
        toggleEventsBtn.textContent = "Monitor Events";
      }
    });
  
    const clearEventsBtn = this.createButton("Clear Events", () => {
      const eventsLog = document.getElementById("debug-events-log");
      if (eventsLog) {
        eventsLog.innerHTML = "";
      }
    });
  
    const eventsLog = document.createElement("div");
    eventsLog.id = "debug-events-log";
    eventsLog.className = "dbg-log";
    eventsLog.style.maxHeight = "150px";
    eventsLog.style.overflowY = "auto";
    eventsLog.style.marginTop = "5px";
    eventsLog.style.fontSize = "12px";
    eventsLog.style.whiteSpace = "pre-wrap";
    eventsLog.style.border = "1px solid #ccc";
    eventsLog.style.padding = "5px";
  
    eventsControls.appendChild(toggleEventsBtn);
    eventsControls.appendChild(clearEventsBtn);
    eventsControls.appendChild(eventsLog);
    content.appendChild(eventsControls);
  
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
  
  // Add event monitoring methods
  _startEventMonitoring() {
    this._eventMonitoringActive = true;
    this._eventsToMonitor = ["click", "touchstart", "mousedown", "keydown"];
    this._eventHandlers = {};
  
    // Create a log entry for each event
    const logEvent = (type, e) => {
      const eventsLog = document.getElementById("debug-events-log");
      if (!eventsLog) return;
  
      // Create a simplified event info string
      let infoString = `${type}: `;
      
      if (type === "keydown") {
        infoString += `key=${e.key}, code=${e.code}`;
      } else {
        infoString += `target=${e.target.tagName || "unknown"}`;
        if (e.clientX !== undefined) {
          infoString += `, pos=(${e.clientX}, ${e.clientY})`;
        }
      }
  
      // Add the log entry
      const entry = document.createElement("div");
      entry.textContent = infoString;
      eventsLog.insertBefore(entry, eventsLog.firstChild);
  
      // Limit log size
      if (eventsLog.children.length > 20) {
        eventsLog.removeChild(eventsLog.lastChild);
      }
    };
  
    // Add listeners for each event type
    this._eventsToMonitor.forEach(type => {
      this._eventHandlers[type] = (e) => logEvent(type, e);
      document.addEventListener(type, this._eventHandlers[type]);
    });
  }
  
  _stopEventMonitoring() {
    this._eventMonitoringActive = false;
  
    // Remove all event listeners
    if (this._eventsToMonitor && this._eventHandlers) {
      this._eventsToMonitor.forEach(type => {
        if (this._eventHandlers[type]) {
          document.removeEventListener(type, this._eventHandlers[type]);
        }
      });
    }
  
    this._eventsToMonitor = null;
    this._eventHandlers = {};
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
}

// Make the DebugManager globally available
window.DebugManager = DebugManager;
