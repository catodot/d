class DebugManager {
  constructor(gameElements, gameState, animationManager) {
    logger.info('debug', 'Creating Debug Manager');

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
    
    logger.debug('debug', 'Debug Manager initialized');
  }

  // Initialize debugging tools
  init() {
    if (!this.enabled) return;
 
    logger.info('debug', 'Initializing debug tools');
    
    this.createDebugPanel();
    this.setupBasicControls();
    this.setupHitboxControls();
    this.setupDeveloperControls();
    this.setupAnimationControls();
 
    // Show the panel
    this.panel.style.display = "block";
 
    logger.info('debug', 'Debug panel initialized and displayed');
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

  // Setup developer controls
  setupDeveloperControls() {
    // Add a heading for dev controls
    const devHeading = document.createElement("h3");
    devHeading.textContent = "Developer Controls";
    devHeading.style.marginTop = "15px";
    this.panel.appendChild(devHeading);

    // Create container for developer controls
    const devControls = document.createElement("div");
    devControls.id = "dev-controls";
    devControls.style.marginBottom = "10px";
    this.panel.appendChild(devControls);

    // Add time adjustment
    const timeControl = document.createElement("div");
    timeControl.innerHTML = `
        <label>Time: <input type="number" id="dev-time" min="10" max="300" value="60" style="width: 50px;"></label>
        <button id="dev-set-time">Set</button>
      `;
    devControls.appendChild(timeControl);

    // Add animation flow testing
    const animFlowTest = document.createElement("div");
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
            logger.debug('debug', 'Animation sequence test complete');
          });
        });
      });
    });
  }

  setupAnimationControls() {
    // Create animation controls section
    const animHeading = document.createElement("h3");
    animHeading.textContent = "Animation Controls";
    animHeading.style.marginTop = "15px";
    this.panel.appendChild(animHeading);
  
    // Create container for animation controls
    const animControls = document.createElement("div");
    animControls.id = "anim-controls";
    animControls.style.marginBottom = "10px";
    this.panel.appendChild(animControls);
  
    // Add animation duration controls
    const durationControls = document.createElement("div");
    durationControls.innerHTML = `
      <div style="margin-bottom: 5px;">
        <label>Idle Frame Time (ms): 
          <input type="number" id="idle-frame-time" min="50" max="1000" value="800" style="width: 60px;">
        </label>
        <button id="set-idle-time">Set</button>
      </div>
      <div style="margin-bottom: 5px;">
        <label>Grab Frame Time (ms): 
          <input type="number" id="grab-frame-time" min="50" max="1000" value="800" style="width: 60px;">
        </label>
        <button id="set-grab-time">Set</button>
      </div>
      <div style="margin-bottom: 5px;">
        <label>Slap Frame Time (ms): 
          <input type="number" id="slap-frame-time" min="50" max="1000" value="100" style="width: 60px;">
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
    animInfo.style.marginTop = "10px";
    animInfo.style.padding = "5px";
    animInfo.style.backgroundColor = "rgba(0,0,0,0.3)";
    animInfo.style.borderRadius = "3px";
    animInfo.innerHTML = `
      <div><strong>Current Animation:</strong> <span id="current-anim-name">idle</span></div>
      <div><strong>Current Frame:</strong> <span id="current-anim-frame">0</span></div>
      <div><strong>Loop Count:</strong> <span id="current-loop-count">0</span></div>
    `;
    animControls.appendChild(animInfo);
  
    // Add refresh button to update animation info
    const refreshBtn = document.createElement("button");
    refreshBtn.textContent = "Refresh Info";
    refreshBtn.style.marginTop = "5px";
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
        logger.debug('debug', `Set grab interval to ${interval}ms`);
      }
    });
  }
  
  updateAnimationTiming(animName, frameTime) {
    if (!this.animationManager || !this.animationManager.animations[animName]) return;
    
    // Update the animation's frame duration
    this.animationManager.animations[animName].frameDuration = frameTime;
    
    // Log the change
    logger.debug('debug', `Updated ${animName} frame time to ${frameTime}ms`);
    
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
    
    logger.debug('debug', `Updated ${animName} to loop ${loops} times`);
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
  }

  // Toggle hitbox visibility
  toggleHitboxVisibility() {
    document.body.classList.toggle("debug-mode");
    const handHitbox = document.getElementById("hand-hitbox");
    
    const isDebugMode = document.body.classList.contains("debug-mode");
    logger.info('debug', `Toggled hitbox visibility: ${isDebugMode ? 'visible' : 'hidden'}`);
    
    // If animation manager exists, update its debug mode
    if (this.animationManager) {
      this.animationManager.setDebugMode(isDebugMode);
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
    dialog.style.position = "absolute";
    dialog.style.zIndex = "2000";
    dialog.style.top = "50%";
    dialog.style.left = "50%";
    dialog.style.transform = "translate(-50%, -50%)";
    dialog.style.backgroundColor = "rgba(0,0,0,0.8)";
    dialog.style.padding = "15px";
    dialog.style.borderRadius = "5px";
    dialog.style.color = "white";

    dialog.appendChild(animSelect);

    const testBtn = document.createElement("button");
    testBtn.textContent = "Test";
    testBtn.addEventListener("click", () => {
      const selectedAnimation = animSelect.value;
      if (this.animationManager) {
        // If transitioning to a grab animation, go through idle first
        const isGrabAnim = selectedAnimation.startsWith("grab");
        if (isGrabAnim && this.animationManager.currentState !== "idle") {
          logger.debug('debug', `Transitioning through idle first before ${selectedAnimation}`);
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
    loopCountInput.style.margin = "10px 0";
    loopCountInput.innerHTML = `
      <label>Loop Count: <input type="number" id="test-loops" min="1" max="10" value="2" style="width: 40px;"></label>
    `;
    dialog.appendChild(loopCountInput);

    const frameTimeInput = document.createElement("div");
    frameTimeInput.style.margin = "10px 0";
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


  setupAudioControls() {
    // Add a heading for audio controls
    const audioHeading = document.createElement("h3");
    audioHeading.textContent = "Audio Debug";
    audioHeading.style.marginTop = "15px";
    this.panel.appendChild(audioHeading);
  
    // Create container for audio controls
    const audioControls = document.createElement("div");
    audioControls.id = "audio-debug-controls";
    audioControls.style.marginBottom = "10px";
    this.panel.appendChild(audioControls);
  
    // Add audio test buttons
    audioControls.innerHTML = `
      <div style="margin-bottom: 5px;">Test Sounds:</div>
      <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px;">
        <button class="audio-test-btn" data-category="ui" data-name="click">UI Click</button>
        <button class="audio-test-btn" data-category="ui" data-name="start">Game Start</button>
        <button class="audio-test-btn" data-category="ui" data-name="win">Win</button>
        <button class="audio-test-btn" data-category="ui" data-name="lose">Lose</button>
      </div>
      <div style="margin-bottom: 5px;">Test Effects:</div>
      <div style="display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px;">
        <button class="audio-test-btn" data-category="trump" data-name="grab">Trump Grab</button>
        <button class="audio-test-btn" data-category="trump" data-name="success">Trump Success</button>
        <button class="audio-test-btn" data-category="trump" data-name="annex">Trump Annex</button>
        <button class="audio-test-btn" data-category="defense" data-name="slap">Defense Slap</button>
      </div>
      <div style="margin-bottom: 5px;">Music Control:</div>
      <div style="display: flex; flex-wrap: wrap; gap: 5px;">
        <button id="start-music-btn">Start Music</button>
        <button id="stop-music-btn">Stop Music</button>
        <button id="toggle-mute-btn">Toggle Mute</button>
        <select id="music-intensity">
          <option value="0">Normal</option>
          <option value="1">Intensity 1</option>
          <option value="2">Intensity 2</option>
          <option value="3">Max Intensity</option>
        </select>
      </div>
      <div style="margin: 10px 0;">
        <label>Volume: <input type="range" id="volume-control" min="0" max="100" value="100" style="width: 100%;"></label>
        <button id="unlock-audio-btn">🔓 Unlock Audio</button>
      </div>
      <div style="margin: 10px 0;">
        <div>Audio Status:</div>
        <div id="audio-status" style="font-size: 10px; background: rgba(0,0,0,0.2); padding: 5px; margin-top: 5px;">
          Not initialized
        </div>
      </div>
    `;
  
    // Get audio manager reference
    const audioManager = window.audioManager;
    if (!audioManager) {
      logger.error('debug', 'AudioManager not found for debug controls');
      return;
    }
  
    // Add event listeners for all audio test buttons
    const audioTestButtons = document.querySelectorAll('.audio-test-btn');
    audioTestButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category');
        const name = btn.getAttribute('data-name');
        if (category && name) {
          if (name === 'grab') {
            // Special case for grab sound
            audioManager.playGrabAttempt('canada');
          } else {
            // Normal sound
            audioManager.play(category, name);
          }
          logger.debug('audio', `Test playing ${category}.${name}`);
        }
      });
    });
  
    // Add listeners for music controls
    document.getElementById('start-music-btn').addEventListener('click', () => {
      audioManager.startBackgroundMusic();
      logger.debug('audio', 'Manually started background music');
    });
  
    document.getElementById('stop-music-btn').addEventListener('click', () => {
      audioManager.stopBackgroundMusic();
      logger.debug('audio', 'Manually stopped background music');
    });
  
    document.getElementById('toggle-mute-btn').addEventListener('click', () => {
      const muted = audioManager.toggleMute();
      document.getElementById('toggle-mute-btn').textContent = muted ? 'Unmute' : 'Mute';
      logger.debug('audio', `Audio ${muted ? 'muted' : 'unmuted'}`);
    });
  
    document.getElementById('music-intensity').addEventListener('change', (e) => {
      const intensity = parseInt(e.target.value);
      audioManager.updateMusicIntensity(intensity);
      logger.debug('audio', `Set music intensity to ${intensity}`);
    });
  
    document.getElementById('volume-control').addEventListener('input', (e) => {
      const volume = parseInt(e.target.value) / 100;
      audioManager.setVolume(volume);
      logger.debug('audio', `Set volume to ${volume.toFixed(2)}`);
    });
  
    document.getElementById('unlock-audio-btn').addEventListener('click', () => {
      // Create and play a silent sound to unlock audio on mobile
      this.unlockAudio();
      
      // Also explicitly resume the AudioContext
      if (audioManager.audioContext && audioManager.audioContext.state === 'suspended') {
        audioManager.audioContext.resume().then(() => {
          logger.debug('audio', `AudioContext resumed: ${audioManager.audioContext.state}`);
          this.updateAudioStatus();
        });
      }
      
      logger.debug('audio', 'Manual audio unlock attempted');
    });
  
    // Start periodic audio status updates
    this.startAudioStatusUpdates();
  }
  
  // Add this helper method for audio unlock
  unlockAudio() {
    // Create a silent sound
    const silentSound = new Audio();
    silentSound.src = "data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";
    silentSound.load();
    silentSound.play().catch(e => {
      logger.debug('audio', 'Silent sound playback prevented (expected): ' + e);
    });
    
    // Also try to restart AudioContext
    const audioManager = window.audioManager;
    if (audioManager && audioManager.audioContext) {
      audioManager.audioContext.resume();
    }
  }
  
  // Add method to update audio status display
  updateAudioStatus() {
    const audioManager = window.audioManager;
    const statusElement = document.getElementById('audio-status');
    
    if (!audioManager || !statusElement) return;
    
    let status = '';
    
    if (!audioManager.initialized) {
      status = 'Not initialized';
    } else {
      status = `AudioContext: ${audioManager.audioContext ? audioManager.audioContext.state : 'None'}<br>`;
      status += `Muted: ${audioManager.muted}<br>`;
      status += `Volume: ${audioManager.volume.toFixed(2)}<br>`;
      status += `Music Playing: ${audioManager.backgroundMusicPlaying}<br>`;
      status += `Music Intensity: ${audioManager.musicIntensity}<br>`;
      status += `Active Sounds: ${audioManager.currentlyPlaying.length}<br>`;
      status += `Loaded Sounds: ${audioManager.loadedSounds ? audioManager.loadedSounds.size : 'Unknown'}`;
    }
    
    statusElement.innerHTML = status;
  }
  
  // Add method to start periodic audio status updates
  startAudioStatusUpdates() {
    this.audioStatusInterval = setInterval(() => {
      this.updateAudioStatus();
    }, 1000);
  }
  
  // Add to stopAnimationInfoUpdates method to stop audio updates too
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

  testCountryGrab(country) {
    if (!this.gameState.isPlaying) {
      logger.warn('debug', 'Cannot test grab: game not started');
      alert("Start the game first");
      return;
    }
   
    logger.info('debug', `Testing grab on ${country}`);
   
    // Grab function references from the window
    const grabAttempt = window.audioManager ? window.audioManager.playGrabAttempt.bind(window.audioManager) : null;
    const grabSuccess = window.grabSuccess;
   
    // Cancel any current grab
    if (this.gameState.currentTarget) {
      logger.debug('debug', `Canceling current grab on ${this.gameState.currentTarget}`);
      const countryPath = document.getElementById(this.gameState.currentTarget);
      if (countryPath) countryPath.classList.remove("targeted");
      this.gameState.currentTarget = null;
    }
   
    // Clear any pending grab
    if (this.gameState.grabTimer) {
      clearTimeout(this.gameState.grabTimer);
    }
   
    // Set target country (handle East/West Canada special case)
    if (country === 'eastCanada' || country === 'westCanada') {
      this.gameState.currentTarget = 'canada';
      this.gameState.isEastCanadaGrab = country === 'eastCanada';
      this.gameState.isWestCanadaGrab = country === 'westCanada';
    } else {
      this.gameState.currentTarget = country;
      this.gameState.isEastCanadaGrab = false;
      this.gameState.isWestCanadaGrab = false;
    }
   
    // Highlight country
    const countryPath = document.getElementById(this.gameState.currentTarget);
    if (countryPath) {
      countryPath.classList.add("targeted");
    }
   
    // Play grab sound
    if (grabAttempt) {
      grabAttempt(this.gameState.currentTarget);
    }
   
    // Change animation - use the specific East/West animation if applicable
    let animationName;
    if (country === 'eastCanada') {
      animationName = 'grabEastCanada';
    } else if (country === 'westCanada') {
      animationName = 'grabWestCanada';
    } else {
      animationName = `grab${country.charAt(0).toUpperCase() + country.slice(1)}`;
    }
    
    logger.debug('debug', `Setting animation to ${animationName}`);
    
    if (this.animationManager) {
      // Always transition through idle first for consistent animation flow
      if (this.animationManager.currentState !== "idle") {
        logger.debug('debug', `Transitioning to idle before grab test`);
        this.animationManager.changeState("idle", () => {
          logger.debug('debug', `Now transitioning to grab animation ${animationName}`);
          this.animationManager.changeState(animationName, () => {
            // If animation completed without being stopped (player didn't block)
            if (this.gameState.currentTarget && this.gameState.isPlaying && !this.gameState.isPaused) {
              logger.debug('debug', `Test grab complete, processing success for ${this.gameState.currentTarget}`);
              if (grabSuccess) grabSuccess(this.gameState.currentTarget);
            }
          });
        });
      } else {
        // Already in idle, proceed directly to grab
        this.animationManager.changeState(animationName, () => {
          // If animation completed without being stopped (player didn't block)
          if (this.gameState.currentTarget && this.gameState.isPlaying && !this.gameState.isPaused) {
            logger.debug('debug', `Test grab complete, processing success for ${this.gameState.currentTarget}`);
            if (grabSuccess) grabSuccess(this.gameState.currentTarget);
          }
        });
      }
    } else if (typeof window.changeAnimationState === "function") {
      window.changeAnimationState(animationName);
    }
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
    dialog.style.position = "absolute";
    dialog.style.zIndex = "2000";
    dialog.style.top = "20%";
    dialog.style.left = "20%";
    dialog.style.transform = "translate(-50%, -50%)";
    dialog.style.backgroundColor = "rgba(0,0,0,0.8)";
    dialog.style.padding = "15px";
    dialog.style.borderRadius = "5px";
    dialog.style.color = "white";
    dialog.style.maxWidth = "300px";

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
    startBtn.textContent = "Start Calibration";
    startBtn.addEventListener("click", () => {
      this.beginCalibration(animSelect.value, wasPlaying);
      dialog.remove();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => {
      dialog.remove();
      // Resume game if it was playing
      if (wasPlaying) {
        this.gameState.isPlaying = true;
        this.gameState.countdownTimer = setInterval(window.updateCountdown, 1000);
        window.scheduleNextGrab();
      }
    });

    dialog.appendChild(startBtn);
    dialog.appendChild(cancelBtn);
    document.body.appendChild(dialog);
  }

  // Make the hitbox draggable for calibration
  makeHitboxDraggable() {
    const hitbox = document.getElementById("hand-hitbox");
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
    display.textContent = `X: ${coords.x}, Y: ${coords.y}, W: ${coords.width}, H: ${coords.height}`;

    // Update full output
    const output = document.getElementById("calib-output");
    output.textContent = this.formatCoordinatesOutput();
  }

  beginCalibration(animationName, wasPlaying) {
    console.log("Beginning calibration for animation:", animationName);
    
    // Reset calibration state
    this.calibration = {
      isCalibrating: true,
      originalAnimState: this.gameState.animation ? this.gameState.animation.currentState : null,
      currentAnimation: animationName,
      frameCoordinates: [],
      wasPlaying: wasPlaying,
      originalHandlerClick: null,
      originalHandlerTouch: null,
      originalContainerClick: null,
    };
  
    // Force debug mode for hitbox visibility
    document.body.classList.add("debug-mode");
  
    // Override event handlers to prevent game actions
    const handHitbox = document.getElementById("hand-hitbox");
    if (handHitbox) {
      this.calibration.originalHandlerClick = handHitbox.onclick;
      this.calibration.originalHandlerTouch = handHitbox.ontouchstart;
  
      handHitbox.onclick = null;
      handHitbox.ontouchstart = null;
    } else {
      console.error("Hand hitbox not found for calibration");
    }
  
    // Create calibration panel
    const panel = document.createElement("div");
    panel.id = "calibration-panel";
    panel.style.position = "absolute";
    panel.style.zIndex = "2001";
    panel.style.bottom = "50px";
    panel.style.right = "10px";
    panel.style.backgroundColor = "rgba(0,0,0,0.8)";
    panel.style.color = "white";
    panel.style.padding = "10px";
    panel.style.borderRadius = "5px";
    panel.style.maxWidth = "300px";
  
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
    
        const handHitbox = document.getElementById("hand-hitbox");
        if (handHitbox) {
          handHitbox.style.left = `${x}px`;
          handHitbox.style.top = `${y}px`;
    
          // Update stored coordinates
          const currentFrame = parseInt(document.getElementById("current-frame").textContent);
          this.calibration.frameCoordinates[currentFrame] = {
            x: Math.round(x),
            y: Math.round(y),
            width: 50,
            height: 50,
          };
    
          this.updateCoordsDisplay(currentFrame);
        }
      };
    } else {
      console.error("Trump sprite container not found");
    }
    }
    
    // Update calibration frame
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
    
      // Update hand hitbox position
      const handHitbox = document.getElementById("hand-hitbox");
      if (!handHitbox) {
        console.error("Hand hitbox not found when updating frame");
        return;
      }
      
      const coords = this.calibration.frameCoordinates[frameIndex];
      if (!coords) {
        console.error(`No coordinates found for frame ${frameIndex}`);
        return;
      }
    
      console.log(`Setting hitbox to position x:${coords.x}, y:${coords.y}, w:${coords.width}, h:${coords.height}`);
      
      handHitbox.style.left = `${coords.x}px`;
      handHitbox.style.top = `${coords.y}px`;
      handHitbox.style.width = `${coords.width}px`;
      handHitbox.style.height = `${coords.height}px`;
      handHitbox.style.display = "block";
    
      // Make hitbox visible for calibration
      handHitbox.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
      handHitbox.style.border = "2px solid red";
    
      this.updateCoordsDisplay(frameIndex);
    }
    
    // Format coordinates as JavaScript object
    formatCoordinatesOutput() {
      const animName = this.calibration.currentAnimation;
    
      let output = `${animName}: {\n`;
      output += `  spriteSheet: "images/trump-${animName.replace(/([A-Z])/g, "-$1").toLowerCase()}-sprite.png",\n`;
      output += `  frameCount: ${this.calibration.frameCoordinates.length},\n`;
      output += `  frameDuration: 800,\n`; // Updated to 800ms to match our animations
      output += `  looping: true,\n`;
      output += `  maxLoops: 4,\n`; // Default to 4 loops for grab animations
      output += `  handVisible: true,\n`;
      output += `  handCoordinates: [\n`;
    
      this.calibration.frameCoordinates.forEach((coords, index) => {
        output += `    { x: ${coords.x}, y: ${coords.y}, width: ${coords.width}, height: ${coords.height} }`;
        if (index < this.calibration.frameCoordinates.length - 1) {
          output += ",";
        }
        output += ` // Frame ${index}\n`;
      });
    
      output += `  ]\n},`;
    
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
          alert("Coordinates copied to clipboard! You'll need to update your code with these values.");
        })
        .catch((err) => {
          console.error("Error copying to clipboard:", err);
          alert("Failed to copy to clipboard. See console for details.");
        });
    
      // Also update the animation object in the current session
      if (this.animationManager && this.animationManager.animations[this.calibration.currentAnimation]) {
        console.log("Updating animationManager with new coordinates");
        this.animationManager.animations[this.calibration.currentAnimation].handCoordinates = [...this.calibration.frameCoordinates];
      } else if (this.trumpAnimations && this.trumpAnimations[this.calibration.currentAnimation]) {
        console.log("Updating trumpAnimations with new coordinates");
        this.trumpAnimations[this.calibration.currentAnimation].handCoordinates = [...this.calibration.frameCoordinates];
      } else {
        console.warn("No animation object found to update with new coordinates");
      }
    
      this.endCalibration();
    }
    
    // Cancel calibration
    cancelCalibration() {
      this.endCalibration();
    }
    
    // End calibration
    endCalibration() {
      // Remove calibration panel
      const panel = document.getElementById("calibration-panel");
      if (panel) panel.remove();
    
      // Restore event handlers
      const handHitbox = document.getElementById("hand-hitbox");
      if (handHitbox) {
        handHitbox.onclick = this.calibration.originalHandlerClick;
        handHitbox.ontouchstart = this.calibration.originalHandlerTouch;
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
    
      // Resume game if it was playing
      if (this.calibration.wasPlaying) {
        this.gameState.isPlaying = true;
        this.gameState.countdownTimer = setInterval(window.updateCountdown, 1000);
        window.scheduleNextGrab();
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
    
    // Schedule next grab (used by developer controls)
    scheduleNextGrab() {
      if (typeof window.scheduleNextGrab === "function") {
        // Check current animation state before scheduling
        if (this.animationManager) {
          const currentState = this.animationManager.currentState;
          // Only schedule if not in the middle of a grab or victory
          if (!currentState.startsWith("grab") && currentState !== "victory") {
            window.scheduleNextGrab();
          } else {
            logger.debug('debug', `Not scheduling next grab - animation ${currentState} in progress`);
          }
        } else {
          window.scheduleNextGrab();
        }
      }
    }
    
    // Clean up all debugging resources
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
    
      // End any calibration
      if (this.calibration.isCalibrating) {
        this.endCalibration();
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
    
    // Only set these if they're defined
    if (typeof trumpAnimations !== 'undefined') {
      window.trumpAnimations = trumpAnimations;
    }
    
    if (typeof updateHUD === 'function') {
      window.updateHUD = updateHUD;
    }
    
    if (typeof updateCountdown === 'function') {
      window.updateCountdown = updateCountdown;
    }
    
    if (typeof scheduleNextGrab === 'function') {
      window.scheduleNextGrab = scheduleNextGrab;
    }
    
    if (typeof grabSuccess === 'function') {
      window.grabSuccess = grabSuccess;
    }
