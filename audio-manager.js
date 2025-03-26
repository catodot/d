/**
 * AudioManager - Comprehensive audio system for game sound effects and music
 */
class AudioManager {
  /**
   * Create a new AudioManager instance
   */
  constructor() {
    // Sound categorization for lazy loading
    this.essentialSounds = [];
    this.earlySounds = [];
    this.countrySounds = {};
    this._loadedCountries = {};

    // Initialize sound categories
    this.categorizeSoundsByPriority();

    // Sound structure - organized by purpose
    this.sounds = {
      ui: {},
      trump: {
        grab: [],
        success: [],
        annex: [],
        victory: [],
        sob: [],
      },
      defense: {
        slap: [],
        protest: {
          eastCanada: [],
          westCanada: [],
          mexico: [],
          greenland: [],
        },
        protestors: {
          eastCanada: null,
          westCanada: null,
          mexico: null,
          greenland: null,
        },
      },
      resistance: {
        canada: [],
        mexico: [],
        greenland: [],
      },
      particles: {
        freedom: [],
      },
      music: {},
    };
    

    // Sound file definitions for loading
    this.soundFiles = {
      ui: {
        click: "click.mp3",
        start: "gameStart.mp3",
        gameOver: "gameOver.mp3",
        win: "resistanceWins.mp3",
        lose: "resistanceLoses.mp3",
        grabWarning: "grabWarning.mp3",
        resistance: "resistance.mp3",
        speedup: "speedup.mp3",
        instruction1: "instruction1.mp3",
        instruction2: "instruction2.mp3",
        instruction3: "instruction3.mp3",
        aliens: "aliens.mp3",
        musk: "musk.mp3",
        growProtestors: "growProtestors.mp3",
        instruction: "instruction.mp3",
        stopHim: "stop-him.mp3",
        smackThatHand: "smack-that-hand.mp3",
        faster: "faster.mp3",
        oopsieTradeWar: "oopsie-trade-war.mp3",
        noOneIsComingToSaveUs: "no-one-is-coming-to-save-us.mp3",
        getUpAndFight: "get-up-and-fight.mp3",
      },
      trump: {
        grab: ["grab1.mp3"],
        success: ["partialAnnex1.mp3", "partialAnnex2.mp3", "partialAnnex3.mp3"],
        annex: ["fullAnnex1.mp3", "fullAnnex2.mp3", "fullAnnex3.mp3"],
        victory: ["victory1.mp3"],
        sob: ["trumpSob1.mp3", "trumpSob2.mp3"],
        evilLaugh: ["trump-laugh.mp3"],

      },
      defense: {
        slap: ["slap1.mp3", "slap2.mp3", "slap3.mp3", "slap4.mp3"],
        protest: {
          eastCanada: [
            "protestEastCan1.mp3",
            "protestEastCan2.mp3",
            "protestEastCan3.mp3",
            "protestEastCan4.mp3",
            "protestEastCan5.mp3",
            "protestEastCan6.mp3",
            "protestEastCan7.mp3",
            "protestEastCan8.mp3",
            "protestEastCan9.mp3",
            "protestEastCan10.mp3",
            "protestEastCan11.mp3",
            "protestEastCan12.mp3",
            "protestEastCan13.mp3",
            "protestEastCan14.mp3",
            "protestEastCan15.mp3",
            "protestEastCan16.mp3",
            "protestEastCan17.mp3",
          ],
          westCanada: [
            "protestWestCan1.mp3",
            "protestWestCan2.mp3",
            "protestWestCan3.mp3",
            "protestWestCan4.mp3",
            "protestWestCan5.mp3",
            "protestWestCan6.mp3",
            "protestWestCan7.mp3",
            "protestWestCan8.mp3",
            "protestWestCan9.mp3",
            "protestWestCan10.mp3",
            "protestWestCan11.mp3",
            "protestWestCan12.mp3",
            "protestWestCan13.mp3",
            "protestWestCan14.mp3",
            "protestWestCan15.mp3",
            "protestWestCan16.mp3",
          ],
          mexico: [
            "protestMex1.mp3",
            "protestMex2.mp3",
            "protestMex3.mp3",
            "protestMex4.mp3",
            "protestMex5.mp3",
            "protestMex6.mp3",
            "protestMex7.mp3",
            "protestMex8.mp3",
            "protestMex9.mp3",
            "protestMex10.mp3",
            "protestMex11.mp3",
            "protestMex12.mp3",
            "protestMex13.mp3",
            "protestMex14.mp3",
            "protestMex15.mp3",
            "protestMex16.mp3",
            "protestMex17.mp3",
            "protestMex18.mp3",
          ],
          greenland: [
            "protestGreen1.mp3",
            "protestGreen2.mp3",
            "protestGreen3.mp3",
            "protestGreen4.mp3",
            "protestGreen5.mp3",
            "protestGreen6.mp3",
            "protestGreen7.mp3",
          ],
        },
        protestors: {
          eastCanada: ["protestorsEastCan1.mp3"],
          westCanada: ["protestorsWestCan1.mp3"],
          mexico: ["protestorsMex1.mp3"],
          greenland: ["protestorsGreen1.mp3"],
        },
      },
      // resistance: {
      //   canada: ["canadaResist1.mp3", "canadaResist2.mp3", "canadaResist3.mp3"],
      //   mexico: ["mexicoResist1.mp3", "mexicoResist2.mp3", "mexicoResist3.mp3"],
      //   greenland: ["greenlandResist1.mp3", "greenlandResist2.mp3"],
      // },
      particles: {
        freedom: ["freedomSpark1.mp3", "freedomSpark2.mp3", "freedomSpark3.mp3"],
      },
      music: {
        background: "background-music.mp3",
      },
    };

    // Catchphrase sound files
    this.catchphraseFiles = {
      canada: ["canada1.mp3", "canada2.mp3", "canada3.mp3", "canada4.mp3"],
      mexico: ["mexico1.mp3", "mexico2.mp3", "mexico3.mp3"],
      greenland: ["greenland1.mp3", "greenland2.mp3", "greenland3.mp3", "greenland4.mp3"],
      generic: ["catchphrase1.mp3", "catchphrase2.mp3", "catchphrase3.mp3"],
    };

    // Timing parameters
    this.timingParams = {
      catchphraseDelay: 300, // ms between success/annex and catchphrase
      grabWarningTime: 500, // ms before grab to play warning
      protestDelay: 350, // ms between slap and protest sounds
    };

    // Shuffle tracking
    this.shuffleTracking = {
      indices: {}, // Current index in each shuffled array
      arrays: {}, // The shuffled arrays themselves
    };

    // Audio state
    this.initialized = false;
    this.hasInitialized = false;
    this.muted = false;
    this.volume = 1.0;
    this.useDirect = false; // Whether to use direct Audio elements instead of AudioContext

    // Sound path - will be set during initialization
    this.soundPath = "sounds/";

    // Playback state
    this.currentlyPlaying = [];
    this.backgroundMusic = null;
    this.backgroundMusicPlaying = false;
    this.loadedSounds = new Set();
    this.activeProtestorSounds = {};

    // Music state
    this.musicIntensity = 0;
    this.musicRateInterval = null;

    // Grab sound state
    this.activeGrabSound = null;
    this.grabVolumeInterval = null;
    this.currentGrabVolume = 0.2;
    this.maxGrabVolume = 1.0;
    this.grabVolumeStep = 0.05;

    // Loading state
    this.loadQueue = [];
    this.processingQueue = false;
    this.loadErrors = [];
    this.maxLoadRetries = 2;

    // Logger setup
    this.logger = window.logger || {
      debug: (cat, msg) => console.debug(`[${cat}]`, msg),
      info: (cat, msg) => console.info(`[${cat}]`, msg),
      warn: (cat, msg) => console.warn(`[${cat}]`, msg),
      error: (cat, msg) => console.error(`[${cat}]`, msg),
    };
  }

  /**
   * Initialize the audio system
   * @returns {Promise} Resolves when initialization is complete
   */
  init() {
    if (this.hasInitialized) {
      this.logger.info("audio", "Already initialized, resuming context");
      return this.resumeAudioContext();
    }

    try {
      // Set up audio context with fallbacks
      if (!window.audioContext) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.audioContext = new AudioContext();
      }
      this.audioContext = window.audioContext;

      // Check if mobile device and adjust settings
      if (this.isMobileDevice()) {
        this.useDirect = true; // Always use direct mode on mobile
        this.adjustPathsForMobile();
      }

      this.hasInitialized = true;
      this.initialized = true;

      // Load essential sounds first
      this.loadEssentialSounds();

      return Promise.resolve();
    } catch (e) {
      this.logger.warn("audio", `Web Audio API not supported: ${e.message}`);

      // Fallback to direct audio mode
      this.hasInitialized = true;
      this.initialized = true;
      this.useDirect = true;

      // Still try to load essential sounds
      this.loadEssentialSounds();

      return Promise.resolve();
    }
  }

  /**
   * Categorize sounds by priority for optimized loading
   */
  categorizeSoundsByPriority() {
    // Tier 1: Essential sounds needed immediately (< 500KB total)
    this.essentialSounds = [
      { category: "ui", name: "click" }, // UI feedback
      { category: "ui", name: "start" }, // Game start
      { category: "ui", name: "grabWarning" }, // Warning before grab
      { category: "trump", name: "grab", index: 0 }, // Grab attempt sound
      { category: "music", name: "background" }, // Background music
    ];

    // Tier 2: Sounds needed for first interaction (< 1MB total)
    this.earlySounds = [
      { category: "defense", name: "slap", index: 0 }, // First slap
      { category: "trump", name: "success", index: 0 }, // First success sound
      { category: "trump", name: "sob", index: 0 }, // First sob sound
      { category: "ui", name: "gameOver" }, // Game over sound
      { category: "ui", name: "aliens" },
      { category: "ui", name: "musk" },
      { category: "ui", name: "growProtestors" },
      { category: "ui", name: "instruction" },
      { category: "ui", name: "stopHim" },
      { category: "ui", name: "smackThatHand" },
      { category: "ui", name: "faster" },
      { category: "ui", name: "oopsieTradeWar" },
      { category: "ui", name: "noOneIsComingToSaveUs" },
      { category: "ui", name: "getUpAndFight" },
    ];

    // Special effects to preload during gameplay
    this.specialEffects = [
      { category: "particles", name: "freedom", index: 0 }, // 80KB
      { category: "ui", name: "aliens" }, // 32KB
      { category: "ui", name: "musk" }, // 32KB
      { category: "ui", name: "growProtestors" }, // 52KB
    ];

    // Tier 3: Country-specific sounds loaded when a country is targeted
    this.countrySounds = {
      canada: [
        { category: "catchphrase", name: "canada", index: 0 },
        { category: "defense.protest", name: "eastCanada", index: 0 },
        { category: "defense.protest", name: "westCanada", index: 0 },
      ],
      mexico: [
        { category: "catchphrase", name: "mexico", index: 0 },
        { category: "defense.protest", name: "mexico", index: 0 },
      ],
      greenland: [
        { category: "catchphrase", name: "greenland", index: 0 },
        { category: "defense.protest", name: "greenland", index: 0 },
      ],
    };
  }

  /**
   * Check if current device is mobile
   * @returns {boolean} True if mobile device
   */
  isMobileDevice() {
    return window.DeviceUtils?.isMobileDevice || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Adjust paths for mobile devices
   */
  adjustPathsForMobile() {
    const baseUrl = window.location.origin + window.location.pathname;
    this.soundPath = baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1) + "sounds/";
    this.logger.info("audio", `Adjusted sound path for mobile: ${this.soundPath}`);
  }

  /**
   * Resume the audio context - important for mobile browsers
   * @returns {Promise} Resolves when context is resumed
   */
  resumeAudioContext() {
    if (!this.audioContext) {
      try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
      } catch (e) {
        this.logger.warn("audio", `Failed to create AudioContext: ${e.message}`);
        this.useDirect = true;
        return Promise.resolve();
      }
    }

    if (this.audioContext.state === "suspended") {
      return this.audioContext
        .resume()
        .then(() => {
          this.logger.info("audio", "AudioContext resumed successfully");
          if (this.loadedSounds.size === 0) {
            this.loadEssentialSounds();
          }
        })
        .catch((err) => {
          this.logger.warn("audio", `Failed to resume AudioContext: ${err.message}`);
          this.useDirect = true;
        });
    }

    return Promise.resolve();
  }

  /**
   * Load essential sounds for immediate game start
   */
  loadEssentialSounds() {
    // Clear queue
    this.loadQueue = [];

    // Add essential sounds to queue
    this.essentialSounds.forEach((sound) => {
      this.queueSound(sound.category, sound.name, sound.index);
    });

    // Process queue
    this.processLoadQueue();

    // Queue early sounds after a short delay
    setTimeout(() => {
      this.earlySounds.forEach((sound) => {
        this.queueSound(sound.category, sound.name, sound.index);
      });
      this.processLoadQueue();
    }, 1000);
  }

  /**
   * Load country-specific sounds when targeting a country
   * @param {string} country - Country identifier
   */
  loadCountrySounds(country) {
    if (!this.countrySounds[country]) return;

    // Check if already loaded to avoid duplication
    if (this._loadedCountries && this._loadedCountries[country]) return;

    // Mark this country as loaded
    if (!this._loadedCountries) this._loadedCountries = {};
    this._loadedCountries[country] = true;

    // Queue country-specific sounds
    this.countrySounds[country].forEach((sound) => {
      this.queueSound(sound.category, sound.name, sound.index);
    });

    // Process queue
    this.processLoadQueue();
  }

  /**
   * Load protest sounds for a specific country
   * @param {string} country - Country identifier
   */
  loadProtestSoundsForCountry(country) {
    // Don't reload if we already have enough sounds loaded
    const minSoundsToLoad = 3; // Minimum number of sounds to ensure are loaded

    let countryField = country;

    // Get the sound array and check how many are already loaded
    const soundArray = this.getNestedProperty(this.sounds, ["defense", "protest", countryField]);

    if (!soundArray) {
      // Create empty array if it doesn't exist
      let current = this.sounds;
      ["defense", "protest"].forEach((part) => {
        if (!current[part]) current[part] = {};
        current = current[part];
      });
      if (!current[countryField]) current[countryField] = [];
    }

    const loadedCount = Array.isArray(soundArray) ? soundArray.length : 0;

    // If we have enough sounds, no need to load more
    if (loadedCount >= minSoundsToLoad) return;

    // Otherwise, load a few more sounds
    const soundFiles = this.getNestedProperty(this.soundFiles, ["defense", "protest", countryField]);
    if (!soundFiles || !Array.isArray(soundFiles)) return;

    // Load a few more random sounds
    const soundsToLoad = Math.min(minSoundsToLoad - loadedCount, soundFiles.length - loadedCount);
    const alreadyLoadedIndices = new Set(Array.from({ length: loadedCount }, (_, i) => i));

    // Find indices that haven't been loaded yet
    const availableIndices = [];
    for (let i = 0; i < soundFiles.length; i++) {
      if (!alreadyLoadedIndices.has(i)) {
        availableIndices.push(i);
      }
    }

    // Randomly select indices to load
    const indicesToLoad = [];
    for (let i = 0; i < soundsToLoad; i++) {
      if (availableIndices.length === 0) break;
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      indicesToLoad.push(availableIndices[randomIndex]);
      availableIndices.splice(randomIndex, 1);
    }

    // Queue the selected sounds
    indicesToLoad.forEach((index) => {
      this.queueSound(`defense.protest`, countryField, index);
    });

    // Process queue
    this.processLoadQueue();
  }

  /**
   * Queue a sound for loading
   * @param {string} category - Sound category
   * @param {string} name - Sound name
   * @param {number|null} index - Array index if applicable
   */
  queueSound(category, name, index = null) {
    // Special case for catchphrases
    if (category === "catchphrase") {
      // Don't queue if we know the file doesn't exist or has already been queued
      const soundKey = `catchphrase.${name}.${index}`;
      if (this.loadedSounds.has(soundKey) || this.loadErrors.includes(soundKey)) {
        return;
      }

      // Use the correct file path from catchphraseFiles
      const files = this.catchphraseFiles[name];
      if (!files || !files[index]) {
        // Record this as an error and don't queue
        this.loadErrors.push(soundKey);
        return;
      }
    }

    this.loadQueue.push({ category, name, index, retryCount: 0 });
  }

  /**
   * Process audio load queue with better error handling
   */
  processLoadQueue() {
    if (this.processingQueue || this.loadQueue.length === 0) return;

    this.processingQueue = true;

    const item = this.loadQueue.shift();

    // Skip known error files
    const soundKey = item.index !== null ? `${item.category}.${item.name}.${item.index}` : `${item.category}.${item.name}`;

    if (this.loadErrors.includes(soundKey)) {
      // Continue to next item immediately
      setTimeout(() => {
        this.processingQueue = false;
        this.processLoadQueue();
      }, 0);
      return;
    }

    this.loadSoundWithRetry(item.category, item.name, item.index, item.retryCount).finally(() => {
      // Continue after a short delay
      setTimeout(() => {
        this.processingQueue = false;
        this.processLoadQueue();
      }, 50);
    });
  }


  /**
 * Fade audio volume from current to target over a duration
 * @param {HTMLAudioElement} audio - Audio element to fade
 * @param {number} targetVolume - Target volume (0.0-1.0)
 * @param {number} duration - Fade duration in milliseconds
 * @param {Function|null} callback - Optional callback on completion
 * @returns {number} Interval ID for cleanup
 */
  fadeTo(audio, targetVolume, duration, callback = null) {
    if (!audio) return null;
  
  const startVolume = audio.volume;
  const volumeDiff = targetVolume - startVolume;
  const startTime = performance.now();
  
  // Clear any existing fade for this audio element
  if (this._fadeIntervals && this._fadeIntervals[audio]) {
    clearInterval(this._fadeIntervals[audio]);
  }
  
  // Initialize the fade intervals object if it doesn't exist
  if (!this._fadeIntervals) this._fadeIntervals = {};
  
  // Create a new interval
  const fadeInterval = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Apply eased volume
    const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Smoother easing
    audio.volume = startVolume + (volumeDiff * easedProgress);
    
    // Log only at certain intervals to reduce console spam
    if (Math.round(progress * 10) % 2 === 0) {
      this.logger.debug("audio", `Fading audio: ${(audio.volume).toFixed(2)}`);
    }
    
    // If complete
    if (progress >= 1) {
      clearInterval(fadeInterval);
      delete this._fadeIntervals[audio];
      
      // If we faded to zero, stop the audio
      if (targetVolume <= 0.02) {
        audio.pause();
        audio.currentTime = 0;
      }
      
      // Execute callback if provided
      if (callback && typeof callback === 'function') {
        callback();
      }
    }
  }, 50); // Run the fade at 20fps for smooth transition
  
  // Store the interval
  this._fadeIntervals[audio] = fadeInterval;
  
  return fadeInterval;
}

  /**
   * Load a sound with retry logic
   * @param {string} category - Sound category
   * @param {string} name - Sound name
   * @param {number|null} index - Array index if applicable
   * @param {number} retryCount - Number of retry attempts
   * @returns {Promise} Resolves when sound is loaded
   */
  loadSoundWithRetry(category, name, index = null, retryCount = 0) {
    if (category === "catchphrase") {
      return Promise.resolve(); // Just succeed immediately
    }

    return new Promise((resolve) => {
      try {
        // Create a unique key for tracking loaded sounds
        const soundKey = index !== null ? `${category}.${name}.${index}` : `${category}.${name}`;

        // Skip if already loaded
        if (this.loadedSounds.has(soundKey)) {
          resolve();
          return;
        }

        let soundPath;
        let destination;

        // Handle nested category structures
        if (index !== null) {
          // Array sound (like trump.grab[0])
          if (category.includes(".")) {
            // Handle nested paths like 'defense.protest'
            const parts = category.split(".");
            soundPath = this.getNestedProperty(this.soundFiles, [...parts, name, index]);
          } else {
            soundPath = this.soundFiles[category]?.[name]?.[index];
          }

          // Ensure destination array exists
          if (category.includes(".")) {
            const parts = category.split(".");
            let current = this.sounds;
            for (let i = 0; i < parts.length; i++) {
              if (!current[parts[i]]) {
                current[parts[i]] = i === parts.length - 1 ? [] : {};
              }
              current = current[parts[i]];
            }
            if (!current[name]) {
              current[name] = [];
            }
            destination = current[name];
          } else {
            if (!this.sounds[category]) {
              this.sounds[category] = {};
            }
            if (!this.sounds[category][name]) {
              this.sounds[category][name] = [];
            }
            destination = this.sounds[category][name];
          }
        } else {
          // Named sound (like ui.click)
          if (category.includes(".")) {
            const parts = category.split(".");
            soundPath = this.getNestedProperty(this.soundFiles, [...parts, name]);

            // Navigate to destination
            let current = this.sounds;
            for (let i = 0; i < parts.length - 1; i++) {
              if (!current[parts[i]]) {
                current[parts[i]] = {};
              }
              current = current[parts[i]];
            }
            destination = current[parts[parts.length - 1]];
          } else {
            soundPath = this.soundFiles[category]?.[name];
            destination = this.sounds[category];
          }
        }

        if (!soundPath) {
          this.logger.warn("audio", `Sound file not found for ${category}.${name}${index !== null ? `[${index}]` : ""}`);
          resolve();
          return;
        }

        // Create and load the audio
        const audio = new Audio();

        // Set up success handler
        audio.oncanplaythrough = () => {
          if (index !== null) {
            // Push to array when loaded
            destination.push(audio);
          } else {
            // Set named property when loaded
            destination[name] = audio;
          }

          this.loadedSounds.add(soundKey);
          resolve();
        };

        // Set up error handler with retry logic
        audio.onerror = (e) => {
          this.logger.warn("audio", `Error loading sound ${soundPath}: ${e.type}`);

          if (retryCount < this.maxLoadRetries) {
            this.logger.info("audio", `Retrying load for ${soundPath}, attempt ${retryCount + 1}`);
            // Add back to queue with increased retry count
            this.loadQueue.push({
              category,
              name,
              index,
              retryCount: retryCount + 1,
            });
          } else {
            // Track persistent errors
            this.loadErrors.push({ category, name, index, error: e.type });
          }
          resolve(); // Resolve anyway to continue queue
        };

        // Set timeout for stalled loads
        const timeout = setTimeout(() => {
          if (!this.loadedSounds.has(soundKey)) {
            this.logger.warn("audio", `Timeout loading sound ${soundPath}`);

            if (retryCount < this.maxLoadRetries) {
              // Add back to queue with increased retry count
              this.loadQueue.push({
                category,
                name,
                index,
                retryCount: retryCount + 1,
              });
            } else {
              this.loadErrors.push({ category, name, index, error: "timeout" });
            }
            resolve(); // Resolve anyway to continue queue
          }
        }, 5000);

        // Set source and load
        audio.src = this.resolveSoundPath(soundPath);
        audio.load();

        // Clean up timeout on success
        audio.addEventListener("canplaythrough", () => clearTimeout(timeout), { once: true });
      } catch (err) {
        this.logger.error("audio", `Error in loadSoundWithRetry for ${category}.${name}: ${err.message}`);
        resolve(); // Resolve anyway to continue queue
      }
    });
  }

  /**
   * Helper to get a nested property from an object
   * @param {Object} obj - Object to traverse
   * @param {Array} path - Path to the property
   * @returns {*} The property value or undefined
   */
  getNestedProperty(obj, path) {
    return path.reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  }

/**
 * Resolve a sound file path
 * @param {string} filename - Sound file name
 * @param {string} category - Optional category
 * @param {string} country - Optional country
 * @returns {string} Complete file path
 */
resolveSoundPath(filename, category = null, country = null) {
  // First, ensure filename is a string
  if (filename === null || filename === undefined) {
    this.logger.error("audio", "Sound filename is null or undefined");
    // Return a fallback path or empty string
    return "";
  }

  // Convert to string explicitly in case it's not already
  filename = String(filename);

  // Handle catchphrase files specially
  if (category === "catchphrase" && country) {
    // Get catchphrase file from the correct structure
    return this.soundPath + this.catchphraseFiles[country][filename] || this.soundPath + this.catchphraseFiles.generic[0]; // Fallback
  }

  // Regular path resolution
  if (filename.startsWith("http") || filename.startsWith("/")) {
    return filename;
  }

  // Ensure soundPath ends with slash
  const path = this.soundPath.endsWith("/") ? this.soundPath : this.soundPath + "/";
  return path + filename;
}

  /**
   * Preload commonly used game sounds
   */
  preloadGameSounds() {
    this.logger.info("audio", "Selectively preloading game sounds");

    // First, ensure all essential and early sounds are loaded
    this.essentialSounds.forEach((sound) => {
      this.queueSound(sound.category, sound.name, sound.index);
    });

    this.earlySounds.forEach((sound) => {
      this.queueSound(sound.category, sound.name, sound.index);
    });

    // Load one sound from each country for initial experience
    Object.keys(this.countrySounds).forEach((country) => {
      this.countrySounds[country].slice(0, 2).forEach((sound) => {
        this.queueSound(sound.category, sound.name, sound.index);
      });
    });

    // Start processing queue
    this.processLoadQueue();
  }

  /**
   * Precache frequently used sounds
   */
  precacheFrequentSounds() {
    // Load one of each type of frequent sound
    const frequentSounds = [
      { category: "defense", name: "slap", maxIndex: 3 }, // Load all slap sounds
      { category: "trump", name: "sob", maxIndex: 1 }, // Load all sob sounds
      { category: "trump", name: "success", maxIndex: 2 }, // Load all success sounds
      { category: "trump", name: "annex", maxIndex: 2 }, // Load all annex sounds
    ];

    frequentSounds.forEach((sound) => {
      for (let i = 0; i <= sound.maxIndex; i++) {
        this.queueSound(sound.category, sound.name, i);
      }
    });

    // Process queue
    this.processLoadQueue();
  }

  /**
   * Play a sound directly - more reliable especially on mobile
   * @param {string} soundPath - Path to sound file
   * @param {number|null} volume - Optional volume override
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playDirect(soundPath, volume = null) {
    if (!this.initialized || this.muted) return null;

    try {
      // Create a new Audio element for more reliable playback
      const audio = new Audio(this.resolveSoundPath(soundPath));

      // Set volume, using global volume as multiplier if specific volume provided
      audio.volume = volume !== null ? volume * this.volume : this.volume;

      // Track for pause/mute management
      this.currentlyPlaying.push(audio);

      // Remove from tracking when done
      audio.onended = () => {
        const index = this.currentlyPlaying.indexOf(audio);
        if (index !== -1) {
          this.currentlyPlaying.splice(index, 1);
        }
      };

      // Play the sound
      const promise = audio.play();

      // Handle play errors
      if (promise !== undefined) {
        promise.catch((error) => {
          this.logger.warn("audio", `Direct audio playback prevented: ${error.message}`);

          // Remove from tracking if play failed
          const index = this.currentlyPlaying.indexOf(audio);
          if (index !== -1) {
            this.currentlyPlaying.splice(index, 1);
          }
        });
      }

      return audio;
    } catch (e) {
      this.logger.warn("audio", `Error playing direct sound: ${e.message}`);
      return null;
    }
  }

  /**
   * Play a sound by category and name
   * @param {string} category - Sound category
   * @param {string} name - Sound name
   * @param {number|null} volume - Optional volume override
   * @returns {Promise<HTMLAudioElement|null>} Promise resolving to audio element or null
   */
  play(category, name, volume = null) {
    if (!this.initialized || this.muted) return Promise.resolve(null);

    // Always ensure AudioContext is resumed (crucial for mobile)
    return this.resumeAudioContext().then(() => {
      try {
        // If using direct mode (mobile or fallback), play directly
        if (this.useDirect) {
          let soundPath;

          // Handle nested categories
          if (category.includes(".")) {
            const parts = category.split(".");
            soundPath = this.getNestedProperty(this.soundFiles, [...parts, name]);
          } else {
            soundPath = this.soundFiles[category]?.[name];
          }

          if (soundPath) {
            const audio = this.playDirect(soundPath, volume);
            return Promise.resolve(audio);
          } else {
            this.logger.warn("audio", `Sound not found for ${category}.${name}`);
            return Promise.resolve(null);
          }
        }

        // For AudioContext mode, check if sound is loaded
        let sound;

        // Handle nested categories
        if (category.includes(".")) {
          const parts = category.split(".");
          sound = this.getNestedProperty(this.sounds, [...parts, name]);
        } else {
          sound = this.sounds[category]?.[name];
        }

        // If sound not loaded yet, try loading and use direct fallback
        if (!sound) {
          // Queue for loading
          if (category.includes(".")) {
            const parts = category.split(".");
            this.queueSound(parts.join("."), name);
          } else {
            this.queueSound(category, name);
          }

          // Process the queue
          this.processLoadQueue();

          // Try direct play as fallback
          return new Promise((resolve) => {
            setTimeout(() => {
              let soundPath;
              if (category.includes(".")) {
                const parts = category.split(".");
                soundPath = this.getNestedProperty(this.soundFiles, [...parts, name]);
              } else {
                soundPath = this.soundFiles[category]?.[name];
              }

              if (soundPath) {
                const audio = this.playDirect(soundPath, volume);
                resolve(audio);
              } else {
                resolve(null);
              }
            }, 100);
          });
        }

        // Make sure it's a valid audio element
        if (!sound || typeof sound.play !== "function") {
          return Promise.reject(new Error(`Invalid sound object for ${category}.${name}`));
        }

        // Reset and play
        sound.currentTime = 0;
        sound.volume = volume !== null ? volume * this.volume : this.volume;

        const playPromise = sound.play();
        if (playPromise !== undefined) {
          return playPromise.catch((error) => {
            this.logger.warn("audio", `Error playing ${category}.${name}: ${error.message}`);

            // Fall back to direct method if regular play fails
            let soundPath;
            if (category.includes(".")) {
              const parts = category.split(".");
              soundPath = this.getNestedProperty(this.soundFiles, [...parts, name]);
            } else {
              soundPath = this.soundFiles[category]?.[name];
            }

            if (soundPath) {
              return this.playDirect(soundPath, volume);
            }
            return null;
          });
        }

        return Promise.resolve(sound);
      } catch (error) {
        this.logger.warn("audio", `Error in play method for ${category}.${name}: ${error.message}`);

        // Fall back to direct method
        let soundPath;
        if (category.includes(".")) {
          const parts = category.split(".");
          soundPath = this.getNestedProperty(this.soundFiles, [...parts, name]);
        } else {
          soundPath = this.soundFiles[category]?.[name];
        }

        if (soundPath) {
          return Promise.resolve(this.playDirect(soundPath, volume));
        }
        return Promise.resolve(null);
      }
    });
  }

  /**
   * Safe play method with error handling
   * @param {string} category - Sound category
   * @param {string} name - Sound name
   * @param {number|null} volume - Optional volume override
   * @returns {Promise<HTMLAudioElement|null>} Promise resolving to audio element or null
   */
  safePlay(category, name, volume = null) {
    try {
      return this.play(category, name, volume);
    } catch (err) {
      this.logger.warn("audio", `Failed to play sound ${category}/${name}: ${err.message}`);
      return Promise.resolve(null);
    }
  }

  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array copy
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get a shuffled sound from a category
   * @param {string} category - Sound category
   * @param {string} subcategory - Sound subcategory
   * @param {string|null} country - Optional country identifier
   * @returns {string|null} Path to sound file or null
   */
  getShuffledSound(category, subcategory, country = null) {
    // Determine which array to use
    let soundArray;
    let soundKey;

    if (country && subcategory === "protest") {
      // Handle protest sounds with country
      soundArray = this.getNestedProperty(this.soundFiles, ["defense", "protest", country]);
      soundKey = `defense.protest.${country}`;
    } else if (category === "resistance" && subcategory) {
      // Handle resistance sounds with country
      soundArray = this.soundFiles.resistance?.[subcategory];
      soundKey = `resistance.${subcategory}`;
    } else if (category === "catchphrase") {
      // Handle catchphrases
      soundArray = this.catchphraseFiles[subcategory] || this.catchphraseFiles.generic;
      soundKey = `catchphrase.${subcategory}`;
    } else if (subcategory && typeof this.soundFiles[category]?.[subcategory] === "object") {
      // Handle nested subcategories
      soundArray = this.soundFiles[category][subcategory];
      soundKey = `${category}.${subcategory}`;
    } else {
      // Simple case
      soundArray = this.soundFiles[category]?.[subcategory];
      soundKey = `${category}.${subcategory}`;
    }

    // If no sounds available, return null
    if (!soundArray || soundArray.length === 0) {
      this.logger.warn("audio", `No sounds found for ${soundKey}`);
      return null;
    }

    if (soundArray.length === 1) {
      return soundArray[0];
    }

    // If we don't have a shuffled array for this sound category yet, create one
    if (!this.shuffleTracking.arrays[soundKey]) {
      // Create an array of indices
      const indices = Array.from({ length: soundArray.length }, (_, i) => i);

      // Shuffle the indices
      this.shuffleTracking.arrays[soundKey] = this.shuffleArray(indices);
      this.shuffleTracking.indices[soundKey] = 0;

      // Log that we've initialized a shuffle
      this.logger.debug("audio", `Initialized shuffle for ${soundKey} with ${indices.length} sounds`);
    }

    // Get the current position in the shuffled array
    const position = this.shuffleTracking.indices[soundKey];

    // Get the index from the shuffled array
    const soundIndex = this.shuffleTracking.arrays[soundKey][position];

    // Increment position
    this.shuffleTracking.indices[soundKey]++;

    // If we've reached the end, create a NEW shuffle (not reshuffling the same array)
    if (this.shuffleTracking.indices[soundKey] >= soundArray.length) {
      // Create a fresh array of indices
      const indices = Array.from({ length: soundArray.length }, (_, i) => i);

      // Create a completely new shuffle
      this.shuffleTracking.arrays[soundKey] = this.shuffleArray(indices);
      this.shuffleTracking.indices[soundKey] = 0;

      this.logger.debug("audio", `Recreated shuffle for ${soundKey} after playing all ${soundArray.length} sounds`);
    }

    // Return the sound file path
    return soundArray[soundIndex];
  }

  /**
   * Play a random sound from a category using the shuffle system
   * @param {string} category - Sound category
   * @param {string} subcategory - Sound subcategory
   * @param {string|null} country - Optional country identifier
   * @param {number|null} volume - Optional volume override
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playRandom(category, subcategory, country = null, volume = null) {
    if (!this.initialized || this.muted) return null;

    // Get a sound file using our shuffled method
    const soundFile = this.getShuffledSound(category, subcategory, country);

    // If no sound file is available, return null
    if (!soundFile) {
      this.logger.warn("audio", `Could not find sound to play for ${category}.${subcategory}${country ? "." + country : ""}`);
      return null;
    }

    // Play directly for reliability
    return this.playDirect(soundFile, volume);
  }

  playCatchphrase(country, volume = null) {
    if (!this.initialized || this.muted) return null;

    // Handle eastCanada and westCanada
    const actualCountry = country === "eastCanada" || country === "westCanada" ? "canada" : country;

    // Get catchphrase files array
    const catchphrases = this.catchphraseFiles[actualCountry] || this.catchphraseFiles.generic;

    if (!catchphrases || catchphrases.length === 0) {
      return null;
    }

    // Pick a random file
    const randomIndex = Math.floor(Math.random() * catchphrases.length);
    const soundFile = catchphrases[randomIndex];

    // Play directly using the correct path
    return this.playDirect(soundFile, volume);
  }

  /**
   * Play a warning sound before a grab
   * @param {number|null} volume - Optional volume override
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playGrabWarning(volume = null) {
    if (!this.initialized || this.muted) return null;

    // Play warning sound directly
    const effectiveVolume = volume !== null ? volume : this.volume * 0.7;
    return this.playDirect(this.soundFiles.ui.grabWarning, effectiveVolume);
  }

  /**
   * Start a grab attempt with looping sound and increasing volume
   * @param {string} country - Country being grabbed
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playGrabAttempt(country) {
    if (!this.initialized || this.muted) return null;

    // Stop any existing grab sound
    this.stopGrabSound();

    try {
      // Get a sound file using our shuffled method
      const soundFile = this.getShuffledSound("trump", "grab");

      if (!soundFile) {
        return null;
      }

      // Create a new audio element
      const grabSound = new Audio(this.resolveSoundPath(soundFile));
      grabSound.loop = true;
      grabSound.volume = this.currentGrabVolume * this.volume;

      // Play the sound
      grabSound.play().catch((error) => {
        this.logger.warn("audio", `Grab sound playback prevented: ${error.message}`);
      });

      // Save reference to active grab sound
      this.activeGrabSound = grabSound;

      // Start increasing volume gradually
      this.grabVolumeInterval = setInterval(() => {
        if (this.activeGrabSound) {
          this.currentGrabVolume = Math.min(this.maxGrabVolume, this.currentGrabVolume + this.grabVolumeStep);
          this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
        }
      }, 300);

      // Add to currently playing sounds
      this.currentlyPlaying.push(grabSound);

      return grabSound;
    } catch (e) {
      this.logger.warn("audio", `Error playing grab sound: ${e.message}`);
      return null;
    }
  }


  // For protestor growth
  playGrowProtestorsSound(volume = null) {
    return this.safePlay("ui", "growProtestors", volume);
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
    }
  }

  /**
   * Play a successful grab sequence (country being claimed)
   * @param {string} country - Country being grabbed
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playSuccessfulGrab(country) {
    if (!this.initialized || this.muted) return null;

    // Stop the grab sound first
    this.stopGrabSound();

    // Get shuffled success sound
    const successFile = this.getShuffledSound("trump", "success");

    // Play success sound directly
    const successSound = this.playDirect(successFile);

    // Default duration if we can't get it from the audio element
    let soundDuration = 1.5;

    // Try to get actual duration
    if (successSound && successSound.duration && !isNaN(successSound.duration) && successSound.duration > 0) {
      soundDuration = successSound.duration;
    }

    // Play catchphrase after success sound finishes
    const catchphraseDelay = soundDuration * 1000 + this.timingParams.catchphraseDelay;

    setTimeout(() => {
      this.playRandom("catchphrase", country);
    }, catchphraseDelay);

    return successSound;
  }

  /**
   * Play the sequence for a successful block (player slapped Trump's hand)
   * @param {string} country - Country being protected
   */
  playSuccessfulBlock(country) {
    // Stop the grab sound first
    this.stopGrabSound();

    // Always play slap sound with direct Audio for reliability using shuffle
    const slapFile = this.getShuffledSound("defense", "slap");
    this.playDirect(slapFile);

    // Preload more protest sounds for this country for future use
    this.loadProtestSoundsForCountry(country);

    // After a delay, play the sob sound using shuffle system
    setTimeout(() => {
      // Play sob sound using shuffled system
      this.playRandom("trump", "sob");

      // After another delay, play the country-specific protest sound
      setTimeout(() => {
        // Play protest sound using shuffled system
        this.playRandom("defense", "protest", country);
      }, this.timingParams.protestDelay);
    }, 200);
  }

  playTrumpClaimSound(country, isFullAnnexation = false) {
    if (!this.initialized || this.muted) return null;

    // Stop the grab sound first
    this.stopGrabSound();

    // Get shuffled sound based on annexation type
    const soundType = isFullAnnexation ? "annex" : "success";
    const soundFile = this.getShuffledSound("trump", soundType);

    // Play sound directly
    const sound = this.playDirect(soundFile);

    // Default duration if we can't get it from the audio element
    let soundDuration = 1.5;

    // Try to get actual duration
    if (sound && sound.duration && !isNaN(sound.duration) && sound.duration > 0) {
      soundDuration = sound.duration;
    }

    // Play catchphrase after sound finishes
    const catchphraseDelay = soundDuration * 1000 + this.timingParams.catchphraseDelay;

    setTimeout(() => {
      this.playRandom("catchphrase", country);
    }, catchphraseDelay);

    return sound;
  }

  /**
   * Play country annexed sequence (final grab on a country)
   * @param {string} country - Country being annexed
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playCountryAnnexed(country) {
    if (!this.initialized || this.muted) return null;

    // Get shuffled annex sound
    const annexFile = this.getShuffledSound("trump", "annex");

    // Play annex sound directly
    const annexSound = this.playDirect(annexFile);

    // Default duration if we can't get it from the audio element
    let soundDuration = 1.5;

    // Try to get actual duration
    if (annexSound && annexSound.duration && !isNaN(annexSound.duration) && annexSound.duration > 0) {
      soundDuration = annexSound.duration;
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
   * Play a resistance sound with improved error handling
   * @param {string} country - Country identifier
   * @param {number|null} volume - Optional volume override
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playResistanceSound(country, volume = null) {
    if (!this.initialized || this.muted) return null;

    try {
      // Check if resistance sounds exist for this country
      if (!this.soundFiles.resistance || !this.soundFiles.resistance[country]) {
        this.logger.warn("audio", `No resistance sounds defined for ${country}`);
        return null;
      }

      // Get shuffled resistance sound for country
      const soundFile = this.getShuffledSound("resistance", country);

      // If no sound file is available, fall back to a grab sound
      if (!soundFile) {
        this.logger.warn("audio", `Falling back to grab sound for ${country} resistance`);
        return this.playRandom("trump", "grab", null, volume);
      }

      // Play directly for reliability
      return this.playDirect(soundFile, volume);
    } catch (e) {
      this.logger.warn("audio", `Error playing resistance sound for ${country}: ${e.message}`);
      return null;
    }
  }

  /**
   * Play a protestor background sound
   * @param {string} country - Country identifier
   * @param {number} index - Sound index
   * @param {number|null} volume - Optional volume override
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playProtestorSound(country, index = 0, volume = null) {
    if (!this.initialized || this.muted) return null;

    try {
      // Stop any existing sound for this country
      this.stopProtestorSounds(country);

      // Determine sound array
      let soundArray;
      if (country === "eastCanada" || country === "westCanada") {
        soundArray = this.soundFiles.defense.protestors[country];
      } else {
        soundArray = this.soundFiles.defense.protestors[country];
      }

      if (!soundArray || soundArray.length === 0) {
        this.logger.warn("audio", `No protestor sounds for ${country}`);
        return null;
      }

      // Get sound file - use index if within bounds, otherwise use first sound
      const soundIndex = index >= 0 && index < soundArray.length ? index : 0;
      const soundFile = soundArray[soundIndex];

      // Play sound
      const protestorSound = this.playDirect(soundFile, volume);

      // Store for later cleanup
      if (protestorSound) {
        this.activeProtestorSounds[country] = protestorSound;
      }

      return protestorSound;
    } catch (e) {
      this.logger.warn("audio", `Error playing protestor sound: ${e.message}`);
      return null;
    }
  }

  /**
   * Stop protestor sounds for a specific country
   * @param {string} country - Country identifier
   */
  stopProtestorSounds(country) {
    const sound = this.activeProtestorSounds[country];
    if (sound) {
      sound.pause();
      sound.currentTime = 0;
      delete this.activeProtestorSounds[country];
    }
  }

  /**
   * Stop all protestor sounds
   */
  stopAllProtestorSounds() {
    Object.keys(this.activeProtestorSounds).forEach((country) => {
      this.stopProtestorSounds(country);
    });
  }

  startBackgroundMusic() {
    if (!this.initialized || this.muted) return Promise.resolve(false);

    // Resume AudioContext first (mobile requirement)
    return this.resumeAudioContext()
      .then(() => {
        try {
          // Always create a new Audio element for background music
          const music = new Audio(this.resolveSoundPath(this.soundFiles.music.background));
          music.loop = true;
          music.volume = this.volume * 0.9;

          // Play the music
          return music
            .play()
            .then(() => {
              // Store reference to the background music
              this.backgroundMusic = music;
              this.backgroundMusicPlaying = true;
              return true;
            })
            .catch((error) => {
              this.logger.warn("audio", `Background music playback prevented: ${error.message}`);
              // Try a smaller fallback audio or direct play as last resort
              return this._startDirectBackgroundMusic();
            });
        } catch (e) {
          this.logger.warn("audio", `Error creating background music: ${e.message}`);
          return this._startDirectBackgroundMusic();
        }
      })
      .catch(() => {
        // If AudioContext resumption fails, try direct method
        return this._startDirectBackgroundMusic();
      });
  }

  _startDirectBackgroundMusic() {
    try {
      const audio = new Audio();
      audio.src = this.resolveSoundPath(this.soundFiles.music.background);
      audio.loop = true;
      audio.volume = 0.7;

      const playPromise = audio.play();
      if (playPromise) {
        return playPromise
          .then(() => {
            this.backgroundMusic = audio;
            this.backgroundMusicPlaying = true;
            return true;
          })
          .catch(() => false);
      }

      this.backgroundMusic = audio;
      this.backgroundMusicPlaying = true;
      return Promise.resolve(true);
    } catch (e) {
      return Promise.resolve(false);
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
   * Update music intensity based on game state
   * @param {number} annexedCountries - Number of annexed countries
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
          this.backgroundMusic.volume = this.volume * 0.9;
          break;
        case 1: // One country annexed
          this.backgroundMusic.playbackRate = 1.05;
          this.backgroundMusic.volume = this.volume * 0.96;
          break;
        case 2: // Two countries annexed
          this.backgroundMusic.playbackRate = 1.1;
          this.backgroundMusic.volume = this.volume * 0.97;
          break;
        case 3: // Maximum intensity
          this.backgroundMusic.playbackRate = 1.15;
          this.backgroundMusic.volume = this.volume * 0.98;

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
   * Toggle mute state
   * @returns {boolean} New mute state
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
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    // Clamp to valid range
    this.volume = Math.max(0, Math.min(1, volume));

    // Apply to all currently playing sounds
    this.currentlyPlaying.forEach((sound) => {
      sound.volume = this.volume;
    });

    // Apply to background music
    if (this.backgroundMusic) {
      // Maintain intensity volume adjustment
      let intensityMult = 0.9;
      switch (this.musicIntensity) {
        case 1:
          intensityMult = 0.96;
          break;
        case 2:
          intensityMult = 0.97;
          break;
        case 3:
          intensityMult = 0.98;
          break;
      }
      this.backgroundMusic.volume = this.volume * intensityMult;
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
        this.logger.warn("audio", `Could not resume background music: ${e.message}`);
      });
    }

    // Resume grab sound if it was active
    if (this.activeGrabSound) {
      this.activeGrabSound.play().catch((e) => {
        this.logger.warn("audio", `Could not resume grab sound: ${e.message}`);
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


prepareForRestart() {
  // First stop all sounds
  this.stopAll();
  
  // Reset state but keep our loaded sounds
  this.volume = 1.0;
  this.muted = false;
  this.musicIntensity = 0;
  
  // Clear any ongoing processes
  if (this.musicRateInterval) {
    clearInterval(this.musicRateInterval);
    this.musicRateInterval = null;
  }
  
  if (this.grabVolumeInterval) {
    clearInterval(this.grabVolumeInterval);
    this.grabVolumeInterval = null;
  }
  
  // Try to resume the audio context
  return this.resumeAudioContext();
}
// Stop currently playing sounds but don't reset state

  stopAll(options = {}) {
    // Stop and clear all currently playing sounds
    this.currentlyPlaying.forEach((sound) => {
      sound.pause();
      sound.currentTime = 0;
    });
    this.currentlyPlaying = [];
  
    // Stop background music if not excepted
    if (!options.exceptBackgroundMusic) {
      this.stopBackgroundMusic();
    }
  
    // Stop grab sound
    this.stopGrabSound();
  
    // Stop all protestor sounds
    this.stopAllProtestorSounds();
  }

  // Reset state variables, call stopAll

  reset() {
    this.stopAll();
  
    // Reset state variables but preserve our sound buffers
    this.volume = 1.0;
    this.muted = false;
    this.musicIntensity = 0;
    this.currentGrabVolume = 0.2;
    this.currentlyPlaying = [];
    this.activeProtestorSounds = {};
    this.backgroundMusicPlaying = false;
  
    // Clear any intervals
    if (this.musicRateInterval) {
      clearInterval(this.musicRateInterval);
      this.musicRateInterval = null;
    }
    
    if (this.grabVolumeInterval) {
      clearInterval(this.grabVolumeInterval);
      this.grabVolumeInterval = null;
    }
  
    // Very important - restore initialized state
    this.initialized = true;
  }

  /**
   * Helper method to unlock audio
   * @returns {Promise} Resolves when audio context is resumed
   */
  unlock() {
    return this.resumeAudioContext();
  }


// Full cleanup including intervals, for when game ends

cleanupAllAudio() {
  console.log("[Audio] Complete audio cleanup initiated");
  
  // Stop all audio
  this.stopAll({exceptBackgroundMusic: false});
  
  // Clear any ongoing fades
  if (this._fadeIntervals) {
    Object.keys(this._fadeIntervals).forEach(key => {
      clearInterval(this._fadeIntervals[key]);
    });
    this._fadeIntervals = {};
  }
  
  // Clear other intervals
  if (this.grabVolumeInterval) {
    clearInterval(this.grabVolumeInterval);
    this.grabVolumeInterval = null;
  }
  
  if (this.musicRateInterval) {
    clearInterval(this.musicRateInterval);
    this.musicRateInterval = null;
  }
  
  // Reset state
  this.activeGrabSound = null;
  this.currentGrabVolume = 0.2;
  this.backgroundMusicPlaying = false;
  this.activeProtestorSounds = {};
  this.currentlyPlaying = [];
  
  console.log("[Audio] Cleanup complete");
}
}