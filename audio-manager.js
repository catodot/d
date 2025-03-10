class AudioManager {
  constructor() {
    // Sound categories organized by purpose
    this.sounds = {
      ui: {}, // UI feedback sounds
      trump: {  // Trump action sounds
        grab: [],
        success: [],
        annex: [],
        victory: [],
        sob: []
      },
      resistance: {
        canada: [],
        mexico: [],
        greenland: []
      },
      particles: {
        freedom: []
      },
      defense: { // Defense-related sounds
        slap: [],
        protest: {
          eastCanada: [],
          westCanada: [],
          mexico: [],
          greenland: []
        }
      },
      music: {} // Background music
    };

    // Timing parameters for audio sequencing
    this.timingParams = {
      catchphraseDelay: 300, // ms to wait between success/annex and catchphrase
      grabWarningTime: 500,  // ms before grab to play warning
      protestDelay: 350      // ms between slap and protest sounds
    };

    // Catchphrases by country
    this.catchphrases = {
      canada: [],
      mexico: [],
      greenland: [],
      generic: []
    };

    // Sound file definitions for lazy loading
    this.soundFiles = {
      ui: {
        click: "click.mp3",
        start: "game-start.mp3",
        gameOver: "game-over.mp3",
        win: "win.mp3",
        lose: "lose.mp3",
        warning: "warning.mp3",
        resistance: "resistance.mp3"
      },
      trump: {
        grab: ["grab1.mp3", "grab2.mp3", "grab3.mp3"],
        success: ["success1.mp3", "success2.mp3", "success3.mp3"],
        annex: ["annex1.mp3", "annex2.mp3", "annex3.mp3"],
        victory: ["victory1.mp3", "victory2.mp3", "victory3.mp3"],
        sob: ["sob1.mp3", "sob2.mp3", "sob3.mp3"]
      },
      defense: {
        slap: ["slap1.mp3", "slap2.mp3", "slap3.mp3", "slap4.mp3"],
        protest: {
          eastCanada: ["protestEastCan1.mp3", "protestEastCan2.mp3", "protestEastCan3.mp3"],
          westCanada: ["protestWestCan1.mp3", "protestWestCan2.mp3", "protestWestCan3.mp3"],
          mexico: ["protestMex1.mp3", "protestMex2.mp3", "protestMex3.mp3"],
          greenland: ["protestGreen1.mp3", "protestGreen2.mp3", "protestGreen3.mp3"]
        }
      },
      music: {
        background: "background-music.mp3"
      },
      resistance: {
        canada: ["canadaResist1.mp3", "canadaResist2.mp3", "canadaResist3.mp3"],
        mexico: ["mexicoResist1.mp3", "mexicoResist2.mp3", "mexicoResist3.mp3"],
        greenland: ["greenlandResist1.mp3", "greenlandResist2.mp3"]
      },
      
      particles: {
        freedom: ["freedomSpark1.mp3", "freedomSpark2.mp3", "freedomSpark3.mp3"]
      }
    };

    

    // Catchphrase sound files
    this.catchphraseFiles = {
      canada: ["canada1.mp3", "canada2.mp3", "canada3.mp3"],
      mexico: ["mexico1.mp3", "mexico2.mp3", "mexico3.mp3"],
      greenland: ["greenland1.mp3", "greenland2.mp3"],
      generic: ["catchphrase1.mp3", "catchphrase2.mp3", "catchphrase3.mp3"]
    };

    // Sound path - will be adjusted for mobile if needed
    this.soundPath = "sounds/";

    // Audio state
    this.initialized = false;
    this.muted = false;
    this.volume = 1.0;
    this.currentlyPlaying = [];
    this.backgroundMusic = null;
    this.backgroundMusicPlaying = false;
    this.loadedSounds = new Set(); // Track loaded sounds
    this.playbackQueues = {}; // For managing shuffled playback

    // Music state
    this.musicIntensity = 0; // 0 = normal, 1-3 = increasing intensity levels
    this.musicRateInterval = null;

    // Grab sound state
    this.activeGrabSound = null;
    this.grabVolumeInterval = null;
    this.currentGrabVolume = 0.2; // Starting volume for grab sounds
    this.maxGrabVolume = 1.0;
    this.grabVolumeStep = 0.05; // Amount to increase volume per interval

    console.log("Audio Manager initialized");
  }

  /**
   * Initialize the audio system
   * IMPORTANT: Call this only after user interaction on mobile
   */
  init() {
    if (this.initialized) return;
    
    if (this.logger) {
      this.logger.info("audio", "Initializing audio system");
    }
    
    try {
      // Create audio context with proper fallbacks
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      if (this.audioContext.state === "suspended") {
        if (this.logger) {
          this.logger.warn("audio", "AudioContext is suspended, will resume on user interaction");
        }
      }
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
    
    // Adjust sound path for mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      const baseUrl = window.location.href;
      const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
      this.soundPath = basePath + 'sounds/';
      
      if (this.logger) {
        this.logger.info("audio", `Mobile detected, using absolute sound path: ${this.soundPath}`);
      }
    }
    
    this.initialized = true;
    
    // Preload essential sounds that need to be available immediately
    this.loadSound("ui", "click");
    this.loadSound("ui", "start");
    this.loadSound("defense", "slap", 0);
    this.loadSound("trump", "grab", 0);
    this.loadSound("trump", "success", 0);
    
    if (this.logger) {
      this.logger.info("audio", "Audio system initialized");
    }
  }

  /**
   * Set a logger for audio operations
   */
  setLogger(logger) {
    this.logger = logger;
    this.logger.info("audio", "Logger set in AudioManager");
  }

  /**
   * Resume the AudioContext (required for mobile after user interaction)
   */
  resumeAudioContext() {
    if (!this.audioContext) return Promise.resolve();
    
    if (this.audioContext.state === 'suspended') {
      if (this.logger) {
        this.logger.info('audio', 'Resuming suspended AudioContext');
      }
      
      return this.audioContext.resume().then(() => {
        if (this.logger) {
          this.logger.info('audio', `AudioContext resumed successfully, state: ${this.audioContext.state}`);
        }
        
        // If no sounds loaded, try loading essential sounds again
        if (this.loadedSounds.size === 0) {
          if (this.logger) {
            this.logger.warn('audio', 'No sounds loaded after resuming AudioContext, attempting to reload essential sounds');
          }
          
          this.loadSound('ui', 'click');
          this.loadSound('ui', 'start');
          this.loadSound('trump', 'grab', 0);
        }
      }).catch(err => {
        if (this.logger) {
          this.logger.error('audio', `Failed to resume AudioContext: ${err}`);
        }
      });
    }
    
    return Promise.resolve();
  }

  /**
   * Create a shuffled playback queue for a category
   */
  initPlaybackQueue(queueKey, soundArray) {
    if (!this.playbackQueues) {
      this.playbackQueues = {};
    }

    if (!this.playbackQueues[queueKey]) {
      this.playbackQueues[queueKey] = {
        originalArray: [...soundArray],
        currentQueue: [...soundArray],
        position: 0
      };

      // Shuffle the initial queue
      this.shuffleQueue(queueKey);

      if (this.logger) {
        this.logger.debug("audio", `Created playback queue for ${queueKey} with ${soundArray.length} sounds`);
      }
    }
  }

  /**
   * Shuffle a specific queue using Fisher-Yates algorithm
   */
  shuffleQueue(queueKey) {
    const queue = this.playbackQueues[queueKey];
    if (!queue) return;

    const array = queue.currentQueue;
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    queue.position = 0;

    if (this.logger) {
      this.logger.debug("audio", `Shuffled playback queue for ${queueKey}`);
    }
  }

  /**
   * Get the next sound from a queue, reshuffle if needed
   */
  getNextSoundFromQueue(queueKey) {
    const queue = this.playbackQueues[queueKey];
    if (!queue || queue.currentQueue.length === 0) return null;

    // Get sound at current position
    const sound = queue.currentQueue[queue.position];

    // Advance position
    queue.position++;

    // If we've reached the end of the queue, reshuffle
    if (queue.position >= queue.currentQueue.length) {
      if (this.logger) {
        this.logger.debug("audio", `End of queue for ${queueKey}, reshuffling`);
      }
      this.shuffleQueue(queueKey);
    }

    return sound;
  }

  /**
   * Preload all game sounds in a managed way
   */
  preloadGameSounds() {
    if (this.logger) {
      this.logger.info("audio", `Starting sound preload at ${performance.now().toFixed(0)}ms`);
    }

    // Keep track of load attempts and successes for debugging
    this.loadAttempts = 0;
    this.loadSuccesses = 0;

    // First wave: UI sounds and background music (highest priority)
    this.loadSound("ui", "click");
    this.loadSound("ui", "start");
    this.loadSound("music", "background");

    // Second wave: Essential gameplay sounds (needed early)
    this.loadSound("trump", "grab", 0);
    this.loadSound("defense", "slap", 0);
    this.loadSound("trump", "success", 0);

    // Third wave (can be deferred): Additional grab and defense sounds
    setTimeout(() => {
      // Load remaining Trump sounds
      for (let i = 1; i < this.soundFiles.trump.grab.length; i++) {
        this.loadSound("trump", "grab", i);
      }

      for (let i = 1; i < this.soundFiles.trump.success.length; i++) {
        this.loadSound("trump", "success", i);
      }
    }, 1000);

    // Fourth wave (low priority): Other sounds
    setTimeout(() => {
      this.preloadAllCatchphrases();
      this.preloadAllProtestSounds();
    }, 2000);

    // Log summary after a delay
    setTimeout(() => {
      if (this.logger) {
        this.logger.info("audio", `Sound loading status: ${this.loadSuccesses}/${this.loadAttempts} loaded`);
      }
    }, 3000);
  }

  /**
   * Preload all protest sounds
   */
  preloadAllProtestSounds() {
    console.log("Starting protest sounds preloading");
    
    ["eastCanada", "westCanada", "mexico", "greenland"].forEach(country => {
      if (this.soundFiles.defense.protest[country]) {
        for (let i = 0; i < this.soundFiles.defense.protest[country].length; i++) {
          this.loadProtestSound(country, i);
        }
      }
    });
    
    // Check loading status after a delay
    setTimeout(() => {
      const protestStatus = {};
      ["eastCanada", "westCanada", "mexico", "greenland"].forEach(country => {
        protestStatus[country] = this.sounds.defense.protest[country] ? 
                                this.sounds.defense.protest[country].length : 0;
      });
      
      console.log("Protest sounds loaded status:", protestStatus);
    }, 2000);
  }

  /**
   * Preload all catchphrases
   */
  preloadAllCatchphrases() {
    console.log("Starting catchphrase preloading");
    
    ["canada", "mexico", "greenland", "generic"].forEach(country => {
      if (this.catchphraseFiles[country]) {
        for (let i = 0; i < this.catchphraseFiles[country].length; i++) {
          this.loadCatchphrase(country, i);
        }
      }
    });
    
    // Check loading status after a delay
    setTimeout(() => {
      console.log("Catchphrases loaded status:", {
        canada: this.catchphrases.canada.length,
        mexico: this.catchphrases.mexico.length,
        greenland: this.catchphrases.greenland.length,
        generic: this.catchphrases.generic.length
      });
    }, 2000);
  }


  /**
 * Load remaining game sounds after initial critical sounds
 */
loadRemainingSounds() {
  if (!this.initialized) return;

  if (this.logger) {
    this.logger.info("audio", "Starting staged loading of remaining sounds");
  }

  // Use a queue system to load sounds gradually
  const loadQueue = [];

  // Add Trump sounds (skip the first ones we already loaded)
  for (let i = 1; i < this.soundFiles.trump.grab.length; i++) {
    loadQueue.push({ type: "normal", category: "trump", name: "grab", index: i });
  }
  
  for (let i = 1; i < this.soundFiles.trump.success.length; i++) {
    loadQueue.push({ type: "normal", category: "trump", name: "success", index: i });
  }
  
  // Add annex and victory sounds
  for (let i = 0; i < this.soundFiles.trump.annex.length; i++) {
    loadQueue.push({ type: "normal", category: "trump", name: "annex", index: i });
  }
  
  for (let i = 0; i < this.soundFiles.trump.victory.length; i++) {
    loadQueue.push({ type: "normal", category: "trump", name: "victory", index: i });
  }
  
  // Add sob sounds
  for (let i = 0; i < this.soundFiles.trump.sob.length; i++) {
    loadQueue.push({ type: "normal", category: "trump", name: "sob", index: i });
  }
  
  // Add UI sounds
  for (const name in this.soundFiles.ui) {
    if (!this.sounds.ui[name]) {
      loadQueue.push({ type: "normal", category: "ui", name });
    }
  }

  // Process the queue with delays to avoid blocking the main thread
  let queueIndex = 0;
  const processQueue = () => {
    if (queueIndex >= loadQueue.length) {
      if (this.logger) {
        this.logger.info("audio", "Finished loading all queued sounds");
      }
      return;
    }

    const item = loadQueue[queueIndex++];

    try {
      if (item.type === "normal") {
        this.loadSound(item.category, item.name, item.index);
      }
    } catch (e) {
      if (this.logger) {
        this.logger.error("audio", `Error loading sound from queue: ${e.message}`);
      }
    }

    // Schedule next item with a delay
    setTimeout(processQueue, 200);
  };

  // Start processing the queue with a small initial delay
  setTimeout(processQueue, 500);
}


  /**
   * Load a specific sound
   */
  loadSound(category, name, index = null) {
    // Create a unique key for tracking loaded sounds
    const soundKey = index !== null ? `${category}.${name}.${index}` : `${category}.${name}`;

    // Skip if already loaded
    if (this.loadedSounds.has(soundKey)) {
      return;
    }

    // Track load attempts for diagnostics
    this.loadAttempts = (this.loadAttempts || 0) + 1;

    if (this.logger) {
      this.logger.debug("audio", `Loading sound: ${soundKey}`);
    }

    let soundPath;
    let destination;

    if (index !== null) {
      // Array sound (like trump.grab[0])
      soundPath = this.soundPath + this.soundFiles[category][name][index];

      // Make sure the array exists before trying to use it
      if (!this.sounds[category][name]) {
        this.sounds[category][name] = [];
      }

      destination = this.sounds[category][name];
    } else {
      // Named sound (like ui.click)
      soundPath = this.soundPath + this.soundFiles[category][name];
      destination = this.sounds[category];
    }

    // Create and load the audio
    const audio = new Audio();
    audio.preload = "auto";

    // Track load success
    audio.oncanplaythrough = () => {
      if (this.logger) {
        this.logger.debug("audio", `Loaded sound: ${soundKey}`);
      }

      this.loadSuccesses = (this.loadSuccesses || 0) + 1;

      if (index !== null) {
        // Push to array when loaded
        destination.push(audio);
      } else {
        // Set named property when loaded
        destination[name] = audio;
      }

      this.loadedSounds.add(soundKey);
    };

    // Enhanced error handler
    audio.onerror = (e) => {
      if (this.logger) {
        this.logger.error("audio", `Error loading sound ${soundPath}: ${e.type}`);
      }
    };

    // Set source and load
    audio.src = soundPath;
    audio.load();

    return audio;
  }

  /**
   * Load a protest sound
   */
  loadProtestSound(country, index) {
    const soundKey = `defense.protest.${country}.${index}`;
  
    if (this.loadedSounds.has(soundKey)) {
      return;
    }
  
    // Ensure the country array exists
    if (!this.sounds.defense.protest[country]) {
      this.sounds.defense.protest[country] = [];
    }
  
    if (!this.soundFiles.defense.protest[country] || !this.soundFiles.defense.protest[country][index]) {
      if (this.logger) {
        this.logger.error("audio", `Invalid protest sound path for ${country}[${index}]`);
      }
      return;
    }
  
    const soundPath = this.soundPath + this.soundFiles.defense.protest[country][index];
    
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = soundPath;
  
    audio.oncanplaythrough = () => {
      // Add the sound to the array
      this.sounds.defense.protest[country].push(audio);
      this.loadedSounds.add(soundKey);
      
      // If we already have a queue for this protest sound category, update it
      const queueKey = `defense.protest.${country}`;
      if (this.playbackQueues && this.playbackQueues[queueKey]) {
        // Update the array references and re-shuffle
        this.playbackQueues[queueKey].originalArray = [...this.sounds.defense.protest[country]];
        this.playbackQueues[queueKey].currentQueue = [...this.sounds.defense.protest[country]];
        this.shuffleQueue(queueKey);
      }
    };
  
    audio.onerror = (e) => {
      if (this.logger) {
        this.logger.error("audio", `Error loading protest sound ${soundPath}:`, e);
      }
    };
  
    audio.load();
    return audio;
  }

  /**
   * Load a catchphrase sound
   */
  loadCatchphrase(country, index) {
    const soundKey = `catchphrase.${country}.${index}`;

    if (this.loadedSounds.has(soundKey)) {
      return;
    }

    // Ensure the country array exists
    if (!this.catchphrases[country]) {
      this.catchphrases[country] = [];
    }

    const soundPath = this.soundPath + this.catchphraseFiles[country][index];
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = soundPath;

    audio.oncanplaythrough = () => {
      this.catchphrases[country].push(audio);
      this.loadedSounds.add(soundKey);
    };

    audio.onerror = (e) => {
      if (this.logger) {
        this.logger.error("audio", `Error loading catchphrase ${soundPath}:`, e);
      }
    };

    audio.load();
    return audio;
  }

  /**
   * Play a UI sound by name
   */
  play(category, name) {
    if (!this.initialized || this.muted) return Promise.resolve(null);
    
    // Always ensure AudioContext is resumed (crucial for mobile)
    return this.resumeAudioContext().then(() => {
      // Check if the sound exists, load it if not
      if (!this.sounds[category][name]) {
        if (this.logger) {
          this.logger.debug('audio', `Sound ${category}.${name} not loaded yet, loading now...`);
        }
        this.loadSound(category, name);
        
        // For mobile, try with a small delay before playing
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          return new Promise(resolve => {
            setTimeout(() => {
              // Try again after a short delay
              if (this.sounds[category][name]) {
                // Sound loaded during the delay
                this.playSound(this.sounds[category][name]).then(resolve);
              } else {
                // Still not loaded, resolve with null
                if (this.logger) {
                  this.logger.warn('audio', `Could not play ${category}.${name} - still loading`);
                }
                resolve(null);
              }
            }, 100);
          });
        }
        
        return Promise.resolve(null); // Return early, the sound will be ready next time
      }
      
      const sound = this.sounds[category][name];
      
      // Make sure it's a valid audio element
      if (!sound || typeof sound.play !== 'function') {
        if (this.logger) {
          this.logger.warn('audio', `Invalid sound object for ${category}.${name}`);
        }
        return Promise.resolve(null);
      }
      
      if (this.logger) {
        this.logger.debug('audio', `Playing sound: ${category}.${name}`);
      }
      
      // Reset and play
      sound.currentTime = 0;
      sound.volume = this.volume;
      
      return this.playSound(sound);
    });
  }

  /**
   * Helper method to play a sound with error handling
   */
  playSound(sound) {
    return new Promise(resolve => {
      try {
        const playPromise = sound.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (this.logger) {
              this.logger.warn('audio', `Audio playback prevented: ${error}`);
            }
            resolve(null);
          }).then(() => {
            resolve(sound);
          });
        } else {
          resolve(sound);
        }
      } catch (e) {
        if (this.logger) {
          this.logger.error('audio', `Error playing sound: ${e.message}`);
        }
        resolve(null);
      }
    });
  }

  /**
   * Play a random sound from a category with proper queue management
   */
  playRandom(category, subcategory, country = null) {
    if (!this.initialized || this.muted) return null;
  
    const logKey = country ? `${category}.${subcategory}.${country}` : `${category}.${subcategory}`;
    
    let soundArray;
    let filesArray;
  
    // Get the appropriate array based on category and country
    if (country && subcategory === "protest") {
      if (!this.sounds.defense.protest[country]) {
        this.sounds.defense.protest[country] = [];
      }
      soundArray = this.sounds.defense.protest[country];
      filesArray = this.soundFiles.defense.protest[country];
    } else {
      soundArray = this.sounds[category][subcategory];
      filesArray = this.soundFiles[category][subcategory];
    }
  
    // If no sounds loaded yet, load the first one
    if (!soundArray || soundArray.length === 0) {
      if (this.logger) {
        this.logger.debug("audio", `No sounds loaded for ${logKey}, loading now...`);
      }
      if (country && subcategory === "protest") {
        this.loadProtestSound(country, 0);
        // Try to load additional sounds for this category immediately
        if (filesArray && filesArray.length > 1) {
          for (let i = 1; i < filesArray.length; i++) {
            this.loadProtestSound(country, i);
          }
        }
      } else {
        this.loadSound(category, subcategory, 0);
        // Try to load additional sounds for this category immediately
        if (filesArray && filesArray.length > 1) {
          for (let i = 1; i < filesArray.length; i++) {
            this.loadSound(category, subcategory, i);
          }
        }
      }
      return null;
    }
  
    // Force refresh the queue if it's been a while since we created it
    // This ensures newly loaded sounds get added to the queue
    const queueKey = logKey;
    if (!this.playbackQueues || !this.playbackQueues[queueKey] || 
        (this.playbackQueues[queueKey].originalArray.length !== soundArray.length)) {
      if (this.logger) {
        this.logger.debug("audio", `Creating/refreshing queue for ${queueKey} with ${soundArray.length} sounds`);
      }
      this.initPlaybackQueue(queueKey, soundArray);
    }
  
    // Get the next sound from the queue
    const sound = this.getNextSoundFromQueue(queueKey);
  
    // Ensure we have a valid audio element
    if (!sound || typeof sound.play !== "function") {
      if (this.logger) {
        this.logger.warn("audio", `Invalid sound object from queue ${queueKey}`);
      }
      return null;
    }
  
    // Play the sound
    sound.currentTime = 0;
    sound.volume = this.volume;
  
    try {
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          if (this.logger) {
            this.logger.warn("audio", `Audio playback prevented: ${error}`);
          }
        });
      }
  
      return sound;
    } catch (e) {
      if (this.logger) {
        this.logger.error("audio", `Error playing sound:`, e);
      }
      return null;
    }
  }

  /**
   * Play a catchphrase for a specific country
   */
  playCatchphrase(country) {
    if (!this.initialized || this.muted) return null;
    
    // Handle eastCanada and westCanada
    const actualCountry = country === "eastCanada" || country === "westCanada" ? "canada" : country;
    
    // Use country-specific catchphrases if available, otherwise use generic
    const useCountry = (this.catchphrases[actualCountry] && this.catchphrases[actualCountry].length > 0) 
      ? actualCountry 
      : "generic";
    
    // Get catchphrase array
    const catchphrases = this.catchphrases[useCountry];
    
    // If none loaded, try loading one
    if (!catchphrases || catchphrases.length === 0) {
      if (this.catchphraseFiles[useCountry]) {
        this.loadCatchphrase(useCountry, 0);
      }
      return null;
    }
    
    // Use a simple rotation through the array
    if (!this.catchphraseIndex) this.catchphraseIndex = {};
    if (!this.catchphraseIndex[useCountry]) this.catchphraseIndex[useCountry] = 0;
    
    // Get next sound and increment index
    const soundIndex = this.catchphraseIndex[useCountry];
    const sound = catchphrases[soundIndex];
    
    // Update index for next time (loop back to start if needed)
    this.catchphraseIndex[useCountry] = (soundIndex + 1) % catchphrases.length;
    
    // Play the sound
    if (sound) {
      sound.currentTime = 0;
      sound.volume = this.volume;
      sound.play().catch(e => console.error("Error playing catchphrase:", e));
      return sound;
    }
    
    return null;
  }

  /**
   * Play a warning sound before a grab
   */
  playGrabWarning() {
    if (!this.initialized || this.muted) return null;

    // Check if the sound exists, load it if not
    if (!this.sounds.ui.warning) {
      this.loadSound("ui", "warning");
      return null;
    }

    const sound = this.sounds.ui.warning;

    // Make sure it's a valid audio element
    if (!sound || typeof sound.play !== "function") {
      return null;
    }

    // Reset and play
    sound.currentTime = 0;
    sound.volume = this.volume * 0.7; // Slightly quieter than normal sounds

    try {
      sound.play().catch((error) => {
        if (this.logger) {
          this.logger.warn("audio", `Warning sound playback prevented: ${error}`);
        }
      });
      return sound;
    } catch (e) {
      return null;
    }
  }

  /**
   * Play a sound with a pitch based on resistance level
   */
  playResistanceSound(level) {
    if (!this.initialized || this.muted) return null;

    // Don't play for very low levels
    if (level < 2) return null;

    // Load the sound if needed
    if (!this.sounds.ui.resistance) {
      this.loadSound("ui", "resistance");
      return null;
    }

    const sound = this.sounds.ui.resistance;

    // Play with pitch shifting based on level
    sound.currentTime = 0;
    sound.volume = this.volume * 0.6;

    // Higher pitch for higher levels (if browser supports it)
    if (typeof sound.preservesPitch !== "undefined") {
      sound.preservesPitch = false;
    } else if (typeof sound.mozPreservesPitch !== "undefined") {
      sound.mozPreservesPitch = false;
    }

    // Adjust pitch based on resistance level (1.0 is normal)
    const pitchRate = 0.9 + level * 0.1; // Higher levels = higher pitch
    sound.playbackRate = pitchRate;

    try {
      sound.play().catch((error) => {
        if (this.logger) {
          this.logger.warn("audio", `resistance sound playback prevented: ${error}`);
        }
      });
      return sound;
    } catch (e) {
      return null;
    }
  }

  /**
   * Start a grab attempt with looping sound and increasing volume
   */
  playGrabAttempt(country) {
    if (!this.initialized || this.muted) return null;

    // Stop any existing grab sound
    this.stopGrabSound();

    // Get grab sounds array
    const soundArray = this.sounds.trump.grab;

    // If no sounds loaded yet, load the first one
    if (!soundArray || soundArray.length === 0) {
      this.loadSound("trump", "grab", 0);
      return null;
    }

    // Pick a random sound
    const randomIndex = Math.floor(Math.random() * soundArray.length);
    const sound = soundArray[randomIndex];

    // Clone the sound for our looping
    const grabSound = sound.cloneNode();
    grabSound.loop = true; // Enable looping
    grabSound.volume = this.currentGrabVolume * this.volume; // Start with lower volume

    try {
      // Play and track the sound
      grabSound.play().catch((error) => {
        if (this.logger) {
          this.logger.warn("audio", `Grab sound playback prevented: ${error}`);
        }
      });

      // Save reference to active grab sound
      this.activeGrabSound = grabSound;

      // Start increasing volume gradually
      this.grabVolumeInterval = setInterval(() => {
        if (this.activeGrabSound) {
          this.currentGrabVolume = Math.min(this.maxGrabVolume, this.currentGrabVolume + this.grabVolumeStep);
          this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
        }
      }, 300); // Increase volume every 300ms

     // Add to currently playing sounds
     this.currentlyPlaying.push(grabSound);

     return grabSound;
   } catch (e) {
     if (this.logger) {
       this.logger.error("audio", `Error playing grab sound:`, e);
     }
     return null;
   }
 }

 /**
  * Stop the grab sound when player taps or Trump succeeds
  */
 stopGrabSound() {
   // Clear the volume increase interval
   if (this.grabVolumeInterval) {
     clearInterval(this.grabVolumeInterval);
     this.grabVolumeInterval = null;
   }

   // Stop the active grab sound if there is one
   if (this.activeGrabSound) {
     this.activeGrabSound.pause();
     this.activeGrabSound.currentTime = 0;

     // Remove from currently playing sounds
     const index = this.currentlyPlaying.indexOf(this.activeGrabSound);
     if (index !== -1) {
       this.currentlyPlaying.splice(index, 1);
     }

     this.activeGrabSound = null;

     // Reset grab volume for next time
     this.currentGrabVolume = 0.2;

     if (this.logger) {
       this.logger.debug("audio", "Stopped grab sound");
     }
   }
 }

 /**
  * Play the sequence for a successful block (player slapped Trump's hand)
  */
 playSuccessfulBlock(country) {
   if (this.logger) {
     this.logger.info("audio", `Playing successful block sound sequence for ${country}`);
   }
 
   // Stop the grab sound first
   this.stopGrabSound();
 
   // Play slap sound first
   const slapSound = this.playSimpleRandom("defense", "slap");
 
   // After a delay, play the sob sound
   setTimeout(() => {
     // Play sob sound
     this.playSimpleRandom("trump", "sob");
     
     // After another delay, play the country-specific protest sound
     setTimeout(() => {
       // Play the protest sound for this specific country
       this.playSimpleRandomProtest(country);
     }, 200);
   }, 200);
 }
 
 /**
  * Simple method for playing a random sound from a category
  */
 playSimpleRandom(category, subcategory) {
   if (!this.initialized || this.muted) return null;
   
   const sounds = this.sounds[category][subcategory];
   if (!sounds || sounds.length === 0) {
     // Try to load the sound if not loaded
     if (this.soundFiles[category][subcategory]) {
       this.loadSound(category, subcategory, 0);
     }
     return null;
   }
   
   // Create index tracker for this sound category if it doesn't exist
   if (!this.soundIndex) this.soundIndex = {};
   const indexKey = `${category}.${subcategory}`;
   if (!this.soundIndex[indexKey]) this.soundIndex[indexKey] = 0;
   
   // Get current index and increment for next time
   const index = this.soundIndex[indexKey];
   this.soundIndex[indexKey] = (index + 1) % sounds.length;
   
   const sound = sounds[index];
   if (!sound) return null;
   
   // Play the sound
   sound.currentTime = 0;
   sound.volume = this.volume;
   sound.play().catch(e => console.error(`Error playing ${category}.${subcategory} sound:`, e));
   
   return sound;
 }



 
 
 /**
  * Specialized method for protest sounds
  */
 playSimpleRandomProtest(country) {
   if (!this.initialized || this.muted) return null;
   
   // Get the sounds array for this country
   const sounds = this.sounds.defense.protest[country];
   if (!sounds || sounds.length === 0) {
     console.log(`No protest sounds loaded for ${country}, loading now`);
     
     // Try to load all protest sounds for this country
     if (this.soundFiles.defense.protest[country]) {
       for (let i = 0; i < this.soundFiles.defense.protest[country].length; i++) {
         this.loadProtestSound(country, i);
       }
     }
     return null;
   }
   
   // Create index tracker for protest sounds if it doesn't exist
   if (!this.protestIndex) this.protestIndex = {};
   if (!this.protestIndex[country]) this.protestIndex[country] = 0;
   
   // Get current index and increment for next time
   const index = this.protestIndex[country];
   this.protestIndex[country] = (index + 1) % sounds.length;
   
   console.log(`Playing ${country} protest sound #${index}`);
   
   const sound = sounds[index];
   if (!sound) return null;
   
   // Play the sound
   sound.currentTime = 0;
   sound.volume = this.volume;
   sound.play().catch(e => console.error(`Error playing protest sound:`, e));
   
   return sound;
 }

 /**
  * Play a successful grab sequence (country being claimed)
  */
 playSuccessfulGrab(country) {
   if (!this.initialized || this.muted) return null;
   
   if (this.logger) {
     this.logger.info("audio", `Playing successful grab sound for ${country}`);
   }

   // Stop the grab sound first
   this.stopGrabSound();

   // Play success sound
   const successSound = this.playRandom("trump", "success");

   if (!successSound) {
     if (this.logger) {
       this.logger.warn("audio", "Failed to play success sound - not loaded yet?");
     }

     // Try to play catchphrase anyway, but with a delay
     setTimeout(() => {
       this.playCatchphrase(country);
     }, 500);
     return null;
   }

   // Get the duration if available, or use a default value
   let soundDuration = 1.5; // Default duration in seconds

   if (successSound.duration && !isNaN(successSound.duration) && successSound.duration > 0) {
     soundDuration = successSound.duration;
   } else {
     // If duration not available (might happen before the sound is fully loaded)
     successSound.addEventListener("loadedmetadata", () => {
       if (successSound.duration && !isNaN(successSound.duration)) {
         soundDuration = successSound.duration;
       }
     });
   }

   // Play catchphrase after success sound finishes (with a small gap)
   const catchphraseDelay = soundDuration * 1000 + this.timingParams.catchphraseDelay;

   // Play catchphrase after success sound finishes
   setTimeout(() => {
     this.playCatchphrase(country);
   }, catchphraseDelay);

   return successSound;
 }

 /**
  * Play country annexed sequence (final grab on a country)
  */
 playCountryAnnexed(country) {
   if (!this.initialized || this.muted) return null;
   
   if (this.logger) {
     this.logger.info("audio", `Playing country annexed sound for ${country}`);
   }

   // Play annex sound
   const annexSound = this.playRandom("trump", "annex");

   if (!annexSound) {
     if (this.logger) {
       this.logger.warn("audio", "Failed to play annex sound - not loaded yet?");
       this.loadSound("trump", "annex", 0);
     }

     // Try to play catchphrase anyway, but with a delay
     setTimeout(() => {
       this.playCatchphrase(country);
     }, 500);
     return null;
   }

   // Get the duration if available, or use a default value
   let soundDuration = 1.5; // Default duration in seconds

   if (annexSound.duration && !isNaN(annexSound.duration) && annexSound.duration > 0) {
     soundDuration = annexSound.duration;
   } else {
     // If duration not available (might happen before the sound is fully loaded)
     annexSound.addEventListener("loadedmetadata", () => {
       if (annexSound.duration && !isNaN(annexSound.duration)) {
         soundDuration = annexSound.duration;
       }
     });
   }

   // Calculate the delay using our timing parameter
   const catchphraseDelay = soundDuration * 1000 + this.timingParams.catchphraseDelay;

   // Play catchphrase after annex sound finishes
   setTimeout(() => {
     this.playCatchphrase(country);
   }, catchphraseDelay);

   return annexSound;
 }

 /**
  * Start background music
  */
 startBackgroundMusic() {
   if (!this.initialized || this.muted) return Promise.resolve(false);
   
   // Resume AudioContext first (mobile requirement)
   return this.resumeAudioContext().then(() => {
     // Lazy load background music if needed
     if (!this.sounds.music.background) {
       if (this.logger) {
         this.logger.debug('audio', 'Background music not loaded yet, loading now...');
       }
       this.loadSound('music', 'background');
       
       // On mobile, add a retry mechanism
       const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
       if (isMobile) {
         if (this.backgroundMusicRetries === undefined) {
           this.backgroundMusicRetries = 0;
         }
         
         // Allow up to 3 retries with increasing delays
         if (this.backgroundMusicRetries < 3) {
           this.backgroundMusicRetries++;
           
           const retryDelay = this.backgroundMusicRetries * 500; // Increasing delay
           
           // Try again after a delay
           return new Promise(resolve => {
             setTimeout(() => {
               this.startBackgroundMusic().then(resolve);
             }, retryDelay);
           });
         }
       }
       
       return Promise.resolve(false);
     }
     
     const music = this.sounds.music.background;
     this.backgroundMusic = music;
     
     music.loop = true;
     music.volume = this.volume * 0.5; // Lower volume for background
     
     // Return a promise for better async handling
     return new Promise((resolve) => {
       try {
         const playPromise = music.play();
         if (playPromise !== undefined) {
           playPromise
             .then(() => {
               this.backgroundMusicPlaying = true;
               // Reset retry counter on success
               this.backgroundMusicRetries = 0;
               resolve(true);
             })
             .catch(error => {
               this.backgroundMusicPlaying = false;
               resolve(false); // Don't reject, as this isn't critical
             });
         } else {
           resolve(false);
         }
       } catch (e) {
         resolve(false);
       }
     });
   });
 }

 /**
  * Update music intensity based on game state
  */
 updateMusicIntensity(annexedCountries) {
   // Calculate desired intensity (0-3)
   const newIntensity = Math.min(annexedCountries, 3);

   // If intensity hasn't changed, do nothing
   if (newIntensity === this.musicIntensity) return;

   this.musicIntensity = newIntensity;

   // Apply music effects based on intensity
   if (this.backgroundMusic) {
     switch (this.musicIntensity) {
       case 0: // Normal
         this.backgroundMusic.playbackRate = 1.0;
         this.backgroundMusic.volume = this.volume * 0.5;
         break;
       case 1: // One country annexed
         this.backgroundMusic.playbackRate = 1.05;
         this.backgroundMusic.volume = this.volume * 0.6;
         break;
       case 2: // Two countries annexed
         this.backgroundMusic.playbackRate = 1.1;
         this.backgroundMusic.volume = this.volume * 0.7;
         break;
       case 3: // Maximum intensity
         this.backgroundMusic.playbackRate = 1.15;
         this.backgroundMusic.volume = this.volume * 0.8;

         // Add a subtle "heartbeat" effect at highest intensity
         if (!this.musicRateInterval) {
           let increasing = true;
           this.musicRateInterval = setInterval(() => {
             if (!this.backgroundMusic || this.backgroundMusic.paused) return;

             if (increasing) {
               this.backgroundMusic.playbackRate += 0.01;
               if (this.backgroundMusic.playbackRate >= 1.2) increasing = false;
             } else {
               this.backgroundMusic.playbackRate -= 0.01;
               if (this.backgroundMusic.playbackRate <= 1.1) increasing = true;
             }
           }, 500);
         }
         break;
     }
   }
 }

 /**
  * Stop background music
  */
 stopBackgroundMusic() {
   if (this.backgroundMusic) {
     // Clear any intensity effects
     if (this.musicRateInterval) {
       clearInterval(this.musicRateInterval);
       this.musicRateInterval = null;
     }

     this.backgroundMusic.pause();
     this.backgroundMusic.currentTime = 0;
     this.backgroundMusicPlaying = false;
   }
 }

 /**
  * Ensure sounds are loaded properly - helps with mobile issues
  */
 ensureSoundsAreLoaded() {
   // Check if any sounds are loaded
   const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
   
   if (this.loadedSounds.size === 0 && isMobile) {
     if (this.logger) {
       this.logger.warn('audio', 'No sounds loaded yet, trying with alternate path');
     }
     
     // Try with a different path approach for mobile
     const baseUrl = window.location.origin + window.location.pathname;
     const altPath = baseUrl.endsWith('/') ? baseUrl + 'sounds/' : baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1) + 'sounds/';
     
     if (this.soundPath !== altPath) {
       this.soundPath = altPath;
       
       // Reload essential sounds
       this.loadSound('ui', 'click');
       this.loadSound('ui', 'start');
       this.loadSound('music', 'background');
       this.loadSound('trump', 'grab', 0);
       this.loadSound('defense', 'slap', 0);
     }
   }
 }

 /**
  * Toggle mute state
  */
 toggleMute() {
   this.muted = !this.muted;

   // Apply to all currently playing sounds
   this.currentlyPlaying.forEach((sound) => {
     sound.muted = this.muted;
   });

   // Apply to background music
   if (this.backgroundMusic) {
     this.backgroundMusic.muted = this.muted;
   }

   // Stop grab sound interval if muted
   if (this.muted && this.grabVolumeInterval) {
     clearInterval(this.grabVolumeInterval);
     this.grabVolumeInterval = null;
   }

   return this.muted;
 }

 /**
  * Set volume level
  */
 setVolume(level) {
   this.volume = Math.max(0, Math.min(1, level));

   // Apply to all playing sounds
   this.currentlyPlaying.forEach((sound) => {
     sound.volume = this.volume;
   });

   // Update grab sound volume
   if (this.activeGrabSound) {
     this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
   }

   // Apply to background music
   if (this.backgroundMusic) {
     this.backgroundMusic.volume = this.volume * 0.5;
   }
 }

 /**
  * Pause all audio (for when game is paused)
  */
 pauseAll() {
   // Pause background music
   if (this.backgroundMusic && !this.backgroundMusic.paused) {
     this.backgroundMusic.pause();
   }

   // Pause all currently playing sounds
   this.currentlyPlaying.forEach((sound) => {
     if (!sound.paused) {
       sound.pause();
     }
   });

   // Pause grab sound interval
   if (this.grabVolumeInterval) {
     clearInterval(this.grabVolumeInterval);
     this.grabVolumeInterval = null;
   }
 }

 /**
  * Resume audio (when game is unpaused)
  */
 resumeAll() {
   // Resume background music if it was playing
   if (this.backgroundMusic && this.backgroundMusicPlaying) {
     this.backgroundMusic.play().catch((e) => {
       if (this.logger) {
         this.logger.warn("audio", "Could not resume background music:", e);
       }
     });
   }

   // Resume grab sound if it was active
   if (this.activeGrabSound) {
     this.activeGrabSound.play().catch((e) => {
       if (this.logger) {
         this.logger.warn("audio", "Could not resume grab sound:", e);
       }
     });

     // Restart volume interval
     this.grabVolumeInterval = setInterval(() => {
       if (this.activeGrabSound) {
         this.currentGrabVolume = Math.min(this.maxGrabVolume, this.currentGrabVolume + this.grabVolumeStep);
         this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
       }
     }, 300);
   }
 }

 /**
  * Stop all sounds (for game over or reset)
  */
 stopAll() {
   this.currentlyPlaying.forEach((sound) => {
     sound.pause();
     sound.currentTime = 0;
   });

   this.currentlyPlaying = [];
   this.stopBackgroundMusic();
   this.stopGrabSound();
 }

 /**
  * Log the state of the audio system (for debugging)
  */
 logAudioState() {
   if (!this.logger) return;

   this.logger.info("audio", "=== AUDIO SYSTEM STATE ===");
   this.logger.info("audio", `Initialized: ${this.initialized}, Muted: ${this.muted}, Volume: ${this.volume}`);
   this.logger.info("audio", `Background Music Playing: ${this.backgroundMusicPlaying}`);
   this.logger.info("audio", `Currently Playing Sounds: ${this.currentlyPlaying.length}`);
   this.logger.info("audio", `Active Grab Sound: ${this.activeGrabSound ? "Yes" : "No"}`);

   // Log loaded sounds
   this.logger.info("audio", `Total Loaded Sounds: ${this.loadedSounds.size}`);

   // Log loaded sound categories
   const categories = ["ui", "trump", "defense", "music"];
   categories.forEach((category) => {
     let count = 0;

     // Count named sounds
     Object.keys(this.sounds[category]).forEach((name) => {
       if (typeof this.sounds[category][name] === "object" && !Array.isArray(this.sounds[category][name])) {
         count++;
       }
       // Count array sounds
       else if (Array.isArray(this.sounds[category][name])) {
         count += this.sounds[category][name].length;
       }
     });

     this.logger.info("audio", `${category.toUpperCase()} sounds loaded: ${count}`);
   });

   // Log loaded catchphrases
   let catchphraseCount = 0;
   Object.keys(this.catchphrases).forEach((country) => {
     catchphraseCount += this.catchphrases[country].length;
     this.logger.debug("audio", `Catchphrases for ${country}: ${this.catchphrases[country].length}`);
   });
   this.logger.info("audio", `Total catchphrases loaded: ${catchphraseCount}`);

   this.logger.info("audio", "========================");
 }
}

window.AudioManager = AudioManager;