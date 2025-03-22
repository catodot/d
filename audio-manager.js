class AudioManager {
  constructor() {
    // Sound categories organized by purpose
    this.sounds = {
      ui: {},
      trump: {
        grab: [],
        success: [],
        annex: [],
        victory: [],
        sob: [],
      },
      resistance: { canada: [], mexico: [], greenland: [] },
      particles: { freedom: [] },
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
      music: {},
    };

    this.shuffledSoundIndexes = {}; // Tracks the current position in each shuffled array
    this.shuffledSoundArrays = {}; // Stores the shuffled arrays
    this.shuffledCatchphraseIndexes = {}; // For catchphrases
    this.shuffledCatchphraseArrays = {}; // For catchphrases

    // Timing parameters for audio sequencing
    this.timingParams = {
      catchphraseDelay: 300, // ms to wait between success/annex and catchphrase
      grabWarningTime: 500, // ms before grab to play warning
      protestDelay: 350, // ms between slap and protest sounds
    };

    // Catchphrases by country
    this.catchphrases = {
      canada: [],
      mexico: [],
      greenland: [],
      generic: [],
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
        resistance: "resistance.mp3",
        speedup: "speedup.mp3",
        // Add new instruction audio files - simple naming
        instruction1: "instruction1.mp3",
        instruction2: "instruction2.mp3",
        instruction3: "instruction3.mp3",
      },
      trump: {
        grab: ["grab1.mp3"],
        success: ["success1.mp3", "success2.mp3", "success3.mp3"],
        annex: ["annex1.mp3", "annex2.mp3", "annex3.mp3"],
        victory: ["victory1.mp3"],
        sob: ["sob1.mp3", "sob2.mp3"],
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
            "protestWestCan17.mp3",
            "protestWestCan18.mp3",
            "protestWestCan19.mp3",
            "protestWestCan20.mp3",
            "protestWestCan21.mp3",
          ],
          mexico: [
            "protestMex1.mp3",
            "protestMex2.mp3",
            "protestMex3.mp3",
            "protestMex4.mp3",
            "protestMex5.mp3",
            "protestMex6.mp3",
            "protestMex7.mp3",
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
      music: {
        background: "background-music.mp3",
      },
      resistance: {
        canada: ["canadaResist1.mp3", "canadaResist2.mp3", "canadaResist3.mp3"],
        mexico: ["mexicoResist1.mp3", "mexicoResist2.mp3", "mexicoResist3.mp3"],
        greenland: ["greenlandResist1.mp3", "greenlandResist2.mp3"],
      },
      particles: {
        freedom: ["freedomSpark1.mp3", "freedomSpark2.mp3", "freedomSpark3.mp3", "freedomSpark4.mp3"],
      },
    };

    // Catchphrase sound files
    this.catchphraseFiles = {
      canada: ["canada1.mp3", "canada2.mp3", "canada3.mp3", "canada4.mp3"],
      mexico: ["mexico1.mp3", "mexico2.mp3", "mexico3.mp3"],
      greenland: ["greenland1.mp3", "greenland2.mp3", "greenland3.mp3", "greenland4.mp3"],
      generic: ["catchphrase1.mp3", "catchphrase2.mp3", "catchphrase3.mp3"],
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

    // Music state
    this.musicIntensity = 0; // 0 = normal, 1-3 = increasing intensity levels
    this.musicRateInterval = null;

    // Grab sound state
    this.activeGrabSound = null;
    this.grabVolumeInterval = null;
    this.currentGrabVolume = 0.2; // Starting volume for grab sounds
    this.maxGrabVolume = 1.0;
    this.grabVolumeStep = 0.05; // Amount to increase volume per interval

    // console.log("Audio Manager initialized");
    this.loadErrors = [];
    this.maxLoadRetries = 2;
    this.audioLoadQueue = [];
    this.isProcessingQueue = false;

    // Track if we've already initialized
    this.hasInitialized = false;
  }

  /**
   * Initialize the audio system
   * IMPORTANT: Call this only after user interaction on mobile
   */
  init() {
    if (this.hasInitialized) {
      console.log("AudioManager already initialized, resuming context");
      return this.resumeAudioContext();
    }
    try {
      // Create audio context with proper fallbacks
      if (!window.audioContext) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.audioContext = new AudioContext();
      }
      this.audioContext = window.audioContext;

      // Adjust sound path for mobile devices
      if (window.DeviceUtils && window.DeviceUtils.isMobileDevice) {
        const baseUrl = window.location.origin + window.location.pathname;
        this.soundPath = baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1) + "sounds/";
      }

      this.hasInitialized = true;
      this.initialized = true;

      // Preload only the most essential sounds initially
      this.loadEssentialSounds();

      return Promise.resolve();
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
      // Fallback to a no-audio mode
      this.hasInitialized = true;
      this.initialized = false;
      return Promise.reject(e);
    }
  }

  loadEssentialSounds() {
    // Clear queue and add only essential sounds
    this.audioLoadQueue = [
      { category: "ui", name: "click" },
      { category: "ui", name: "start" },
      { category: "defense", name: "slap", index: 0 },
      { category: "trump", name: "grab", index: 0 },
    ];

    // Start queue processing
    this.processAudioQueue();
  }

  /**
   * Process audio load queue with rate limiting
   */
  processAudioQueue() {
    if (this.isProcessingQueue || this.audioLoadQueue.length === 0) return;

    this.isProcessingQueue = true;

    // Process next item in queue
    const item = this.audioLoadQueue.shift();
    this.loadSoundWithRetry(item.category, item.name, item.index).finally(() => {
      // Continue after a short delay for browser breathing room
      setTimeout(() => {
        this.isProcessingQueue = false;
        this.processAudioQueue();
      }, 50);
    });
  }

  loadSoundWithRetry(category, name, index = null, retryCount = 0) {
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

        // Handle nested categories (like "defense.protest")
        const categories = category.split(".");
        let soundFileRef = this.soundFiles;
        let soundsRef = this.sounds;

        // Navigate through the nested categories
        for (let i = 0; i < categories.length; i++) {
          const cat = categories[i];
          if (!soundFileRef[cat]) {
            console.warn(`Invalid category path: ${category}`);
            resolve();
            return;
          }
          soundFileRef = soundFileRef[cat];
          soundsRef = soundsRef[cat];
        }

        if (index !== null) {
          // Array sound (like defense.protest.eastCanada[0])
          if (!soundFileRef[name] || !soundFileRef[name][index]) {
            console.warn(`Invalid sound path for ${category}.${name}[${index}]`);
            resolve();
            return;
          }
          soundPath = soundFileRef[name][index];

          // Make sure the destination array exists
          if (!soundsRef[name]) {
            soundsRef[name] = [];
          }
          destination = soundsRef[name];
        } else {
          // Named sound (like ui.click)
          if (!soundFileRef[name]) {
            console.warn(`Invalid sound path for ${category}.${name}`);
            resolve();
            return;
          }
          soundPath = soundFileRef[name];
          destination = soundsRef;
        }

        // Create and load the audio with proper error handling
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
          console.warn(`Error loading sound ${soundPath}:`, e.type);

          if (retryCount < this.maxLoadRetries) {
            console.log(`Retrying load for ${soundPath}, attempt ${retryCount + 1}`);
            // Add back to queue with increased retry count
            this.audioLoadQueue.push({
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
            console.warn(`Timeout loading sound ${soundPath}`);

            if (retryCount < this.maxLoadRetries) {
              // Add back to queue with increased retry count
              this.audioLoadQueue.push({
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
        audio.src = this.getSoundPath(soundPath);
        audio.load();

        // Clean up timeout on success
        audio.addEventListener("canplaythrough", () => clearTimeout(timeout), { once: true });
        // Also clean up timeout on error
        audio.addEventListener("error", () => clearTimeout(timeout), { once: true });
      } catch (err) {
        console.error(`Error in loadSoundWithRetry for ${category}.${name}:`, err);
        resolve(); // Resolve anyway to continue queue
      }
    });
  }

  resumeAudioContext() {
    if (!this.audioContext) {
      // Try to reinitialize if context is missing
      try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
      } catch (e) {
        console.warn("Failed to create AudioContext:", e);
        return Promise.resolve();
      }
    }

    if (this.audioContext.state === "suspended") {
      return this.audioContext
        .resume()
        .then(() => {
          console.log("AudioContext resumed successfully");
          // Retry loading essential sounds if we have none loaded
          if (this.loadedSounds.size === 0) {
            this.loadEssentialSounds();
          }
        })
        .catch((err) => {
          console.warn("Failed to resume AudioContext:", err);
        });
    }

    return Promise.resolve();
  }

  preloadGameSounds() {
    // Clear existing queue and start with most critical sounds
    this.audioLoadQueue = [
      { category: "ui", name: "click" },
      { category: "ui", name: "start" },
      { category: "defense", name: "slap", index: 0 },
      { category: "trump", name: "grab", index: 0 },
      { category: "trump", name: "success", index: 0 },
      { category: "ui", name: "warning" },
    ];

    // Start processing queue
    this.processAudioQueue();

    // After a delay, add second wave of important sounds
    setTimeout(() => {
      // Add UI instructions and background music
      this.audioLoadQueue.push(
        { category: "ui", name: "instruction1" },
        { category: "ui", name: "instruction2" },
        { category: "ui", name: "instruction3" },
        { category: "music", name: "background" },
        { category: "trump", name: "sob", index: 0 }
      );
    }, 3000); // Increased from 1000 to 3000

    // After a longer delay, queue the remaining sounds
    setTimeout(() => {
      this.queueRemainingAudio();
    }, 8000); // Increased from 5000 to 8000
  }

  queueRemainingAudio() {
    // Add trump sounds with priority
    for (let category in this.soundFiles.trump) {
      const files = this.soundFiles.trump[category];
      for (let i = 0; i < files.length; i++) {
        // Skip index 0 for categories we already loaded
        if (i === 0 && (category === "grab" || category === "success" || category === "sob")) continue;

        this.audioLoadQueue.push({ category: "trump", name: category, index: i });
      }
    }

    // Queue remaining UI sounds
    for (const name in this.soundFiles.ui) {
      // Skip already queued sounds
      if (["click", "start", "warning", "instruction1", "instruction2", "instruction3"].includes(name)) continue;

      this.audioLoadQueue.push({ category: "ui", name: name });
    }

    // Queue some protest sounds (will add more later)
    ["eastCanada", "westCanada", "mexico", "greenland"].forEach((country) => {
      if (this.soundFiles.defense.protest[country]) {
        // Just load the first few for each country initially
        const count = Math.min(2, this.soundFiles.defense.protest[country].length);
        for (let i = 0; i < count; i++) {
          this.audioLoadQueue.push({ category: "defense.protest", name: country, index: i });
        }
      }
    });
  }

  /**
   * Preload all protest sounds
   */
  preloadAllProtestSounds() {
    ["eastCanada", "westCanada", "mexico", "greenland"].forEach((country) => {
      if (this.soundFiles.defense.protest[country]) {
        for (let i = 0; i < this.soundFiles.defense.protest[country].length; i++) {
          this.loadProtestSound(country, i);
        }
      }
    });
  }

  preloadAllProtestorSounds() {
    ["eastCanada", "westCanada", "mexico", "greenland"].forEach((country) => {
      if (this.soundFiles.defense.protestors[country]) {
        for (let i = 0; i < this.soundFiles.defense.protestors[country].length; i++) {
          this.loadProtestorSound(country, i);
        }
      }
    });
  }

  loadProtestorSound(country) {
    const soundKey = `defense.protestors.${country}`;

    if (this.loadedSounds.has(soundKey)) {
      return;
    }

    const soundPath = this.soundFiles.defense.protestors[country][0];

    const audio = new Audio();
    audio.preload = "auto";
    audio.src = this.getSoundPath(soundPath);

    audio.oncanplaythrough = () => {
      // Store the sound directly
      this.sounds.defense.protestors[country] = audio;
      this.loadedSounds.add(soundKey);
    };

    audio.onerror = (e) => {
      console.warn(`Error loading protestor sound ${soundPath}:`, e);
    };

    audio.load();
    return audio;
  }

  /**
   * Preload all catchphrases
   */
  preloadAllCatchphrases() {
    ["canada", "mexico", "greenland", "generic"].forEach((country) => {
      if (this.catchphraseFiles[country]) {
        for (let i = 0; i < this.catchphraseFiles[country].length; i++) {
          this.loadCatchphrase(country, i);
        }
      }
    });
  }

  /**
   * Create a complete file path for a sound
   */
  getSoundPath(filename) {
    return this.soundPath + filename;
  }

  handleError(context, error, fallback = null) {
    // Log the error
    console.warn(`Audio error (${context}): ${error.message}`);

    // Track error for analytics if needed
    if (window.logger && typeof window.logger.error === "function") {
      window.logger.error("audio", `${context}: ${error.message}`);
    }

    // Execute fallback if provided
    if (typeof fallback === "function") {
      try {
        return fallback();
      } catch (fallbackError) {
        console.warn(`Fallback error (${context}): ${fallbackError.message}`);
      }
    }

    return null;
  }


  playDirect(soundPath, volume = null) {
    if (!this.initialized || this.muted) return Promise.resolve(null);
  
    try {
      console.log(`Attempting direct play of: ${soundPath}`);
      
      // Create a new Audio element for more reliable playback
      const audio = new Audio(this.getSoundPath(soundPath));
  
      // Set volume
      audio.volume = volume !== null ? volume : this.volume;
      
      // For iOS, set a short timeout to let Audio initialize
      const isIOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
      
      if (isIOS) {
        return new Promise((resolve) => {
          setTimeout(() => {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.warn("iOS direct audio play error:", error);
                // Try again with user interaction
                this.queueSoundForNextInteraction(soundPath, volume);
              });
            }
            resolve(audio);
          }, 100);
        });
      }
  
      // Play the sound for other platforms
      const playPromise = audio.play();
  
      // Handle play errors
      if (playPromise !== undefined) {
        return playPromise
          .then(() => audio)
          .catch((error) => {
            console.warn("Direct audio playback prevented:", error);
            // Queue for next user interaction
            this.queueSoundForNextInteraction(soundPath, volume);
            return null;
          });
      }
  
      return Promise.resolve(audio);
    } catch (e) {
      console.warn("Error playing direct sound:", e.message);
      return Promise.resolve(null);
    }
  }
  
  // Add this helper method for mobile
  queueSoundForNextInteraction(soundPath, volume) {
    if (!this.pendingSounds) {
      this.pendingSounds = [];
      
      // Set up a one-time listener for user interaction
      const playQueuedSounds = () => {
        const sounds = [...this.pendingSounds]; // Copy the array
        this.pendingSounds = []; // Clear the queue
        
        // Play each sound with a small delay
        sounds.forEach((sound, index) => {
          setTimeout(() => {
            const audio = new Audio(this.getSoundPath(sound.path));
            audio.volume = sound.volume !== null ? sound.volume : this.volume;
            audio.play().catch(e => console.warn("Queued sound play failed:", e));
          }, index * 100);
        });
        
        // Remove the event listeners
        ['touchstart', 'mousedown', 'keydown'].forEach(event => {
          document.removeEventListener(event, playQueuedSounds);
        });
      };
      
      // Add event listeners for user interaction
      ['touchstart', 'mousedown', 'keydown'].forEach(event => {
        document.addEventListener(event, playQueuedSounds, { once: true });
      });
    }
    
    // Add the sound to the queue
    this.pendingSounds.push({ path: soundPath, volume });
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

    let soundPath;
    let destination;

    if (index !== null) {
      // Array sound (like trump.grab[0])
      soundPath = this.soundFiles[category][name][index];

      // Make sure the array exists before trying to use it
      if (!this.sounds[category][name]) {
        this.sounds[category][name] = [];
      }

      destination = this.sounds[category][name];
    } else {
      // Named sound (like ui.click)
      soundPath = this.soundFiles[category][name];
      destination = this.sounds[category];
    }

    // Create and load the audio
    const audio = new Audio();
    audio.preload = "auto";

    // Track load success
    audio.oncanplaythrough = () => {
      if (index !== null) {
        // Push to array when loaded
        destination.push(audio);
      } else {
        // Set named property when loaded
        destination[name] = audio;
      }

      this.loadedSounds.add(soundKey);
    };

    // Error handler
    audio.onerror = (e) => {
      console.warn(`Error loading sound ${soundPath}:`, e.type);
    };

    // Set source and load
    audio.src = this.getSoundPath(soundPath);
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
      console.warn(`Invalid protest sound path for ${country}[${index}]`);
      return;
    }

    const soundPath = this.soundFiles.defense.protest[country][index];

    const audio = new Audio();
    audio.preload = "auto";
    audio.src = this.getSoundPath(soundPath);

    audio.oncanplaythrough = () => {
      // Add the sound to the array
      this.sounds.defense.protest[country].push(audio);
      this.loadedSounds.add(soundKey);
    };

    audio.onerror = (e) => {
      console.warn(`Error loading protest sound ${soundPath}:`, e);
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

    const soundPath = this.catchphraseFiles[country][index];
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = this.getSoundPath(soundPath);

    audio.oncanplaythrough = () => {
      this.catchphrases[country].push(audio);
      this.loadedSounds.add(soundKey);
    };

    audio.onerror = (e) => {
      console.warn(`Error loading catchphrase ${soundPath}:`, e);
    };

    audio.load();
    return audio;
  }

  play(category, name) {
    if (!this.initialized || this.muted) return Promise.resolve(null);

    return this.resumeAudioContext().then(() => {
      // Prefer direct playback for reliability, especially on mobile
      const soundPath = this.soundFiles[category][name];
      if (!soundPath) {
        return Promise.reject(new Error(`Sound not found: ${category}.${name}`));
      }

      // Try to use cached sound if available
      if (this.sounds[category][name] && !window.DeviceUtils.isMobileDevice) {
        const sound = this.sounds[category][name];
        if (sound && typeof sound.play === "function") {
          sound.currentTime = 0;
          sound.volume = this.volume;

          try {
            return sound.play().catch(() => {
              // Fall back to direct method if cached play fails
              return this.playDirect(soundPath);
            });
          } catch (e) {
            // Fall back to direct method
            return this.playDirect(soundPath);
          }
        }
      }

      // Direct play (more reliable for mobile)
      return this.playDirect(soundPath);
    });
  }

  /**
   * Get a sound from an array with shuffle-play behavior (no repeats until all are played)
   * @param {string} category - The sound category
   * @param {string} subcategory - The sound subcategory
   * @param {string} country - Optional country for protest sounds
   * @returns {string} - The path to the sound file
   */
  getShuffledSound(category, subcategory, country = null) {
    // Determine which array to use
    let soundArray;
    let soundKey;

    if (country && subcategory === "protest") {
      soundArray = this.soundFiles.defense.protest[country];
      soundKey = `defense.protest.${country}`;
    } else {
      soundArray = this.soundFiles[category][subcategory];
      soundKey = `${category}.${subcategory}`;
    }

    // If no sounds available, return null
    if (!soundArray || soundArray.length === 0) {
      return null;
    }

    // If we don't have a shuffled array for this sound category yet, create one
    if (!this.shuffledSoundArrays[soundKey]) {
      // Create an array of indices
      const indices = Array.from({ length: soundArray.length }, (_, i) => i);

      // Shuffle the indices
      this.shuffledSoundArrays[soundKey] = this.shuffleArray(indices);
      this.shuffledSoundIndexes[soundKey] = 0;
    }

    // Get the current position in the shuffled array
    const position = this.shuffledSoundIndexes[soundKey];

    // Get the index from the shuffled array
    const soundIndex = this.shuffledSoundArrays[soundKey][position];

    // Increment position
    this.shuffledSoundIndexes[soundKey]++;

    // If we've reached the end, reshuffle and start over
    if (this.shuffledSoundIndexes[soundKey] >= soundArray.length) {
      this.shuffledSoundArrays[soundKey] = this.shuffleArray(this.shuffledSoundArrays[soundKey]);
      this.shuffledSoundIndexes[soundKey] = 0;
    }

    // Return the sound file path
    return soundArray[soundIndex];
  }

  /**
   * Get a shuffled catchphrase sound
   * @param {string} country - The country for catchphrase
   * @returns {string} - The path to the catchphrase sound file
   */
  getShuffledCatchphrase(country) {
    // Handle eastCanada and westCanada
    const actualCountry = country === "eastCanada" || country === "westCanada" ? "canada" : country;

    // Use country-specific catchphrases if available, otherwise use generic
    const useCountry = this.catchphrases[actualCountry] && this.catchphrases[actualCountry].length > 0 ? actualCountry : "generic";

    const soundArray = this.catchphraseFiles[useCountry];
    const soundKey = `catchphrase.${useCountry}`;

    // If no sounds available, return null
    if (!soundArray || soundArray.length === 0) {
      return null;
    }

    // If we're on mobile, just use the first sound for reliability
    if (window.DeviceUtils.isMobileDevice) {
      return soundArray[0];
    }

    // If we don't have a shuffled array for this catchphrase yet, create one
    if (!this.shuffledCatchphraseArrays[soundKey]) {
      // Create an array of indices
      const indices = Array.from({ length: soundArray.length }, (_, i) => i);

      // Shuffle the indices
      this.shuffledCatchphraseArrays[soundKey] = this.shuffleArray(indices);
      this.shuffledCatchphraseIndexes[soundKey] = 0;
    }

    // Get the current position in the shuffled array
    const position = this.shuffledCatchphraseIndexes[soundKey];

    // Get the index from the shuffled array
    const soundIndex = this.shuffledCatchphraseArrays[soundKey][position];

    // Increment position
    this.shuffledCatchphraseIndexes[soundKey]++;

    // If we've reached the end, reshuffle and start over
    if (this.shuffledCatchphraseIndexes[soundKey] >= soundArray.length) {
      this.shuffledCatchphraseArrays[soundKey] = this.shuffleArray(this.shuffledCatchphraseArrays[soundKey]);
      this.shuffledCatchphraseIndexes[soundKey] = 0;
    }

    // Return the sound file path
    return soundArray[soundIndex];
  }

  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array - The array to shuffle
   * @returns {Array} - A new shuffled array
   */
  shuffleArray(array) {
    // Create a copy to avoid modifying the original
    const shuffled = [...array];

    // Perform Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  playProtestorSound(country, intensityLevel = 0, volume = 0.5) {
    console.log(`[SOUND START] Playing protestor sound for ${country} at volume ${volume}`);

    if (!this.initialized || this.muted) {
      console.log(`[SOUND ERROR] Audio system not initialized or muted`);
      return null;
    }

    // Create new audio from the original source
    const originalSound = this.sounds.defense.protestors[country];
    if (!originalSound) {
      console.log(`[SOUND ERROR] No loaded protestor sound available for ${country}`);
      return null;
    }

    // Create a new Audio object for this play instance
    const audio = new Audio(originalSound.src);
    audio.volume = volume * this.volume;

    // Add an ID for tracking in logs
    const audioId = `${country}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    audio.dataset.audioId = audioId;

    console.log(`[SOUND CREATE] Created new audio element with ID ${audioId} for ${country}`);

    // Store the audio in an array for tracking
    if (!this.activeProtestorSounds) {
      this.activeProtestorSounds = {};
    }
    if (!this.activeProtestorSounds[country]) {
      this.activeProtestorSounds[country] = [];
    }
    this.activeProtestorSounds[country].push(audio);

    console.log(`[SOUND TRACK] Now tracking ${this.activeProtestorSounds[country].length} sounds for ${country}`);

    // Play the sound
    audio.play().catch((e) => {
      console.log(`[SOUND ERROR] Error playing protestor sound: ${e}`);
    });

    // Clean up completed sounds
    audio.onended = () => {
      console.log(`[SOUND END] Sound ${audioId} for ${country} ended naturally`);
      const index = this.activeProtestorSounds[country].indexOf(audio);
      if (index !== -1) {
        this.activeProtestorSounds[country].splice(index, 1);
        console.log(
          `[SOUND CLEANUP] Removed ended sound ${audioId} from tracking. ${this.activeProtestorSounds[country].length} sounds remain for ${country}`
        );
      }
      this.stopAllPlayback();
    };

    return audio;
  }

  stopProtestorSounds(country) {
    console.log(`[SOUND STOP] Attempting to stop all protestor sounds for ${country}`);

    // Stop all tracked sounds for this country
    if (this.activeProtestorSounds && this.activeProtestorSounds[country]) {
      console.log(`[SOUND STOP] Found ${this.activeProtestorSounds[country].length} active sounds to stop for ${country}`);

      this.activeProtestorSounds[country].forEach((audio) => {
        if (audio) {
          const audioId = audio.dataset.audioId || "unknown";
          console.log(`[SOUND STOP] Stopping sound ${audioId} for ${country}`);

          // Force stop
          audio.pause();
          audio.currentTime = 0;

          console.log(`[SOUND STOP] Successfully stopped sound ${audioId}`);
        }
      });

      // Clear the array
      const count = this.activeProtestorSounds[country].length;
      this.activeProtestorSounds[country] = [];
      console.log(`[SOUND CLEANUP] Cleared tracking array for ${country}, removed ${count} sounds`);
    } else {
      console.log(`[SOUND STOP] No active sounds found to stop for ${country}`);
    }
  }

  stopAllProtestorSounds() {
    console.log(`[SOUND STOP ALL] Attempting to stop ALL protestor sounds`);

    if (this.activeProtestorSounds) {
      const countries = Object.keys(this.activeProtestorSounds);
      console.log(`[SOUND STOP ALL] Found ${countries.length} countries with active sounds: ${countries.join(", ")}`);

      countries.forEach((country) => {
        this.stopProtestorSounds(country);
      });
    } else {
      console.log(`[SOUND STOP ALL] No active protestor sounds tracking array found`);
    }
  }

  /**
   * Play a random sound from a category using the shuffle system
   */
  playRandom(category, subcategory, country = null) {
    if (!this.initialized || this.muted) return null;

    // Get a sound file using our shuffled method
    const soundFile = this.getShuffledSound(category, subcategory, country);

    // If no sound file is available, return null
    if (!soundFile) {
      return null;
    }

    // Play directly for reliability
    return this.playDirect(soundFile);
  }

  playCatchphrase(country) {
    if (!this.initialized || this.muted) return Promise.resolve(null);
  
    // Get shuffled catchphrase sound file
    const soundFile = this.getShuffledCatchphrase(country);
  
    // If no sound file is available, return null
    if (!soundFile) {
      return Promise.resolve(null);
    }
  
    console.log(`Playing catchphrase for ${country}: ${soundFile}`);
    
    // For mobile, use a more direct approach
    if (window.DeviceUtils && window.DeviceUtils.isMobileDevice) {
      try {
        // Create the full path explicitly
        const fullPath = this.getSoundPath(soundFile);
        console.log(`Full catchphrase path: ${fullPath}`);
        
        const audio = new Audio(fullPath);
        audio.volume = this.volume;
        
        // Play directly with a short delay
        setTimeout(() => {
          audio.play().catch(e => {
            console.warn(`Mobile catchphrase play failed: ${e}`);
            // Try to queue for next user interaction as fallback
            this.queueSoundForNextInteraction(soundFile, this.volume);
          });
        }, 50);
        
        return Promise.resolve(audio);
      } catch (e) {
        console.warn(`Error creating catchphrase audio: ${e}`);
        return Promise.resolve(null);
      }
    }
    
    // Use standard approach for non-mobile
    return this.playDirect(soundFile);
  }

  /**
   * Play a warning sound before a grab
   */
  playGrabWarning() {
    if (!this.initialized || this.muted) return null;

    // Play directly for reliability
    const audio = this.playDirect(this.soundFiles.ui.warning, this.volume * 0.7);

    return audio;
  }

  /**
   * Play a sound with a pitch based on resistance level
   */
  playResistanceSound(level) {
    if (!this.initialized || this.muted) return null;

    // Don't play for very low levels
    if (level < 2) return null;

    try {
      // Create new audio element
      const audio = new Audio(this.getSoundPath(this.soundFiles.ui.resistance));

      // Set volume
      audio.volume = this.volume * 0.6;

      // Higher pitch for higher levels (if browser supports it)
      if (typeof audio.preservesPitch !== "undefined") {
        audio.preservesPitch = false;
      } else if (typeof audio.mozPreservesPitch !== "undefined") {
        audio.mozPreservesPitch = false;
      }

      // Adjust pitch based on resistance level (1.0 is normal)
      const pitchRate = 0.9 + level * 0.1; // Higher levels = higher pitch
      audio.playbackRate = pitchRate;

      // Play the sound
      audio.play().catch((error) => {
        console.warn(`Resistance sound playback prevented: ${error}`);
      });

      return audio;
    } catch (e) {
      console.warn(`Error playing resistance sound: ${e.message}`);
      return null;
    }
  }

  playGrabAttempt(country) {
    if (!this.initialized || this.muted) return Promise.resolve(null);
  
    // Stop any existing grab sound
    this.stopGrabSound();
  
    console.log(`Playing grab attempt for ${country}`);
  
    try {
      // Get a sound file using our shuffled method
      const soundFile = this.getShuffledSound("trump", "grab");
  
      if (!soundFile) {
        return Promise.resolve(null);
      }
  
      const fullPath = this.getSoundPath(soundFile);
      console.log(`Using grab sound: ${fullPath}`);
  
      // Create a new audio element
      const grabSound = new Audio(fullPath);
      grabSound.loop = true;
      grabSound.volume = this.currentGrabVolume * this.volume;
  
      // On mobile, we may need a different approach
      if (window.DeviceUtils && window.DeviceUtils.isMobileDevice) {
        // For mobile, use a simpler non-looping approach
        grabSound.loop = false;
        
        // Play the sound with our improved direct method
        return this.playDirect(soundFile, this.currentGrabVolume * this.volume)
          .then(audio => {
            if (audio) {
              // Save reference
              this.activeGrabSound = audio;
              this.currentlyPlaying.push(audio);
            }
            return audio;
          });
      }
  
      // Standard desktop approach
      const playPromise = grabSound.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn(`Grab sound playback error: ${error}`);
          
          // Fall back to non-looping sound
          this.playDirect(soundFile, this.currentGrabVolume * this.volume);
        });
      }
  
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
  
      return Promise.resolve(grabSound);
    } catch (e) {
      console.warn(`Error playing grab sound: ${e.message}`);
      return Promise.resolve(null);
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
    }
  }

  /**
   * Play the sequence for a successful block (player slapped Trump's hand)
   */
  playSuccessfulBlock(country) {
    // Stop the grab sound first
    this.stopGrabSound();

    // Always play slap sound with direct Audio for reliability using shuffle
    const slapFile = this.getShuffledSound("defense", "slap");
    this.playDirect(slapFile);

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

  /**
   * Play a successful grab sequence (country being claimed)
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
      this.playCatchphrase(country);
    }, catchphraseDelay);

    return successSound;
  }

  /**
   * Play country annexed sequence (final grab on a country)
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

// In AudioManager class, modify the startBackgroundMusic method:
startBackgroundMusic() {
  if (!this.initialized || this.muted) return Promise.resolve(false);
  
  console.log("Starting background music");
  
  // If already playing, don't restart
  if (this.backgroundMusic && this.backgroundMusicPlaying && !this.backgroundMusic.paused) {
    console.log("Background music already playing");
    return Promise.resolve(true);
  }
  
  // Make sure the AudioContext is resumed first
  return this.resumeAudioContext().then(() => {
    try {
      // IMPORTANT: Stop any existing music before creating a new instance
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
      }
      
      // Create new Audio element for background music
      const music = new Audio();
      
      // Set attributes before setting source (important for mobile)
      music.loop = true;
      music.volume = this.volume * 0.8;
      music.preload = "auto";
      
      // The full path to the background music
      const musicPath = this.getSoundPath(this.soundFiles.music.background);
      console.log(`Music path: ${musicPath}`);
      
      // Set the source
      music.src = musicPath;
      
      // Store reference immediately
      this.backgroundMusic = music;
      
      // For mobile devices, we need special handling
      const isMobile = window.DeviceUtils && window.DeviceUtils.isMobileDevice;
      
      if (isMobile) {
        console.log("Mobile background music handling");
        
        // Add event listener to keep track of when music stops unexpectedly
        music.addEventListener('pause', () => {
          // Only auto-resume if we think it should be playing and it's not at the beginning
          if (this.backgroundMusicPlaying && music.currentTime > 0.1) {
            console.log("Background music unexpectedly paused, attempting to resume");
            // Try to resume after a short delay
            setTimeout(() => {
              if (this.backgroundMusicPlaying) {
                music.play().catch(e => console.warn("Failed to auto-resume music:", e));
              }
            }, 100);
          }
        });
        
        // Try to play immediately
        const playPromise = music.play();
        
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log("Background music started successfully");
            this.backgroundMusicPlaying = true;
          }).catch(e => {
            console.warn("Mobile background music failed to start:", e);
            // Save for later play on interaction
            this.pendingBackgroundMusic = music;
            
            // Try to play on user interaction
            this.playOnNextInteraction(music);
          });
        }
      } else {
        // Desktop handling
        music.play().then(() => {
          console.log("Background music started on desktop");
          this.backgroundMusicPlaying = true;
        }).catch(e => {
          console.warn("Background music failed to start:", e);
        });
      }
      
      return true;
    } catch (e) {
      console.error("Background music error:", e);
      return false;
    }
  });
}
  
  // Add a helper method to play on next interaction
  playOnNextInteraction(audioElement) {
    if (!this.interactionListeners) {
      this.interactionListeners = new Set();
      
      const playAllPending = () => {
        console.log("User interaction detected, playing pending audio");
        
        // Try to play the background music if it exists
        if (this.pendingBackgroundMusic) {
          this.pendingBackgroundMusic.play()
            .then(() => {
              console.log("Background music started after interaction");
              this.backgroundMusicPlaying = true;
            })
            .catch(e => console.warn("Still failed to play background music:", e));
        }
        
        // Try to play all other pending audio elements
        this.interactionListeners.forEach(audio => {
          if (audio && !audio.paused) return;
          
          audio.play().catch(e => console.warn("Failed to play audio after interaction:", e));
        });
        
        // Clear the set after playing
        this.interactionListeners.clear();
        
        // Remove the event listeners
        ['touchstart', 'mousedown', 'keydown'].forEach(evt => {
          document.removeEventListener(evt, playAllPending);
        });
      };
      
      // Add event listeners for common user interactions
      ['touchstart', 'mousedown', 'keydown'].forEach(evt => {
        document.addEventListener(evt, playAllPending, { once: true });
      });
    }
    
    // Add this audio element to the pending set
    this.interactionListeners.add(audioElement);
  }


  unlockAudioForMobile() {
    // If not mobile, don't bother
    if (!window.DeviceUtils || !window.DeviceUtils.isMobileDevice) return;
    
    console.log("Setting up mobile audio unlock");
    
    // Create a silent audio element for unlocking
    const unlockSound = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjMyLjEwNAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooA//9k=");
    unlockSound.load();
    
    // Try to play the silent sound on first interaction
    const unlockAudio = () => {
      console.log("Trying to unlock audio on mobile");
      unlockSound.play()
        .then(() => {
          console.log("Audio context unlocked on mobile");
          
          // Now try to play any pending background music
          if (this.pendingBackgroundMusic) {
            this.pendingBackgroundMusic.play()
              .then(() => {
                console.log("Successfully started background music after unlock");
                this.backgroundMusicPlaying = true;
              })
              .catch(e => console.warn("Still couldn't play background music:", e));
          }
          
          // Resume AudioContext if it exists
          if (this.audioContext && this.audioContext.state === "suspended") {
            this.audioContext.resume()
              .then(() => console.log("AudioContext resumed after interaction"))
              .catch(e => console.warn("AudioContext resume failed:", e));
          }
        })
        .catch(e => console.warn("Couldn't unlock audio:", e));
      
      // Clean up the event listeners
      ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(evt => {
        document.removeEventListener(evt, unlockAudio);
      });
    };
    
    // Add interaction listeners for the unlock
    ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(evt => {
      document.addEventListener(evt, unlockAudio, { once: true });
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
    // Check if we need to load essential sounds
    if (this.loadedSounds.size < 4) {
      // Minimum essential sounds
      console.log("Loading essential sounds");
      this.loadEssentialSounds();
      return;
    }

    // Only preload game sounds if not already queued
    if (this.audioLoadQueue.length === 0 && this.loadedSounds.size < 10) {
      console.log("Loading game sounds");
      this.preloadGameSounds();
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
      this.backgroundMusic.volume = this.volume * 0.8;
    }
  }


// In AudioManager - add a proper cleanup method
stopAllPlayback() {
  // Stop all sounds immediately
  this.stopAll();
  this.stopGrabSound();
  this.stopAllProtestorSounds();
  
  // Cancel all pending actions
  if (this.grabVolumeInterval) {
    clearInterval(this.grabVolumeInterval);
    this.grabVolumeInterval = null;
  }
  
  if (this.musicRateInterval) {
    clearInterval(this.musicRateInterval);
    this.musicRateInterval = null;
  }
  
  // Empty the queue
  this.audioLoadQueue = [];
  this.isProcessingQueue = false;
}

destroy() {
    // Stop all sounds first
    this.stopAll();
    this.stopBackgroundMusic();
    this.stopAllProtestorSounds();

    // Explicitly release all audio elements
    for (const category in this.sounds) {
      if (typeof this.sounds[category] === 'object') {
        for (const name in this.sounds[category]) {
          if (Array.isArray(this.sounds[category][name])) {
            // Handle arrays of sounds
            this.sounds[category][name].forEach(sound => {
              if (sound instanceof HTMLAudioElement) {
                sound.oncanplaythrough = null;
                sound.onerror = null;
                sound.onended = null;
                sound.pause();
                sound.src = '';
              }
            });
            this.sounds[category][name] = [];
          } else if (this.sounds[category][name] instanceof HTMLAudioElement) {
            // Handle individual sounds
            const sound = this.sounds[category][name];
            sound.oncanplaythrough = null;
            sound.onerror = null;
            sound.onended = null;
            sound.pause();
            sound.src = '';
            this.sounds[category][name] = null;
          }
        }
      }
    }

    // Clear all catchphrases
    for (const country in this.catchphrases) {
      if (Array.isArray(this.catchphrases[country])) {
        this.catchphrases[country].forEach(sound => {
          if (sound instanceof HTMLAudioElement) {
            sound.oncanplaythrough = null;
            sound.onerror = null;
            sound.pause();
            sound.src = '';
          }
        });
        this.catchphrases[country] = [];
      }
    }

    // Reset state
    this.shuffledSoundIndexes = {};
    this.shuffledSoundArrays = {};
    this.shuffledCatchphraseIndexes = {};
    this.shuffledCatchphraseArrays = {};
    this.loadedSounds.clear();
    this.loadErrors = [];
    this.audioLoadQueue = [];
    this.isProcessingQueue = false;
    
    // Close AudioContext properly
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        console.warn("Error closing AudioContext:", e);
      }
      this.audioContext = null;
    }
    
    // Reset flags
    this.initialized = false;
    this.hasInitialized = false;
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
        console.warn("Could not resume background music:", e);
      });
    }

    // Resume grab sound if it was active
    if (this.activeGrabSound) {
      this.activeGrabSound.play().catch((e) => {
        console.warn("Could not resume grab sound:", e);
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
   * Clean up event listeners on all sounds
   */
  destroyAllListeners() {
    // Clean up event listeners on all sounds
    for (const category in this.sounds) {
      if (typeof this.sounds[category] === "object") {
        // Handle arrays of sounds
        for (const name in this.sounds[category]) {
          if (Array.isArray(this.sounds[category][name])) {
            this.sounds[category][name].forEach((sound) => {
              sound.oncanplaythrough = null;
              sound.onerror = null;
            });
          } else if (this.sounds[category][name] instanceof HTMLAudioElement) {
            // Handle individual sounds
            this.sounds[category][name].oncanplaythrough = null;
            this.sounds[category][name].onerror = null;
          }
        }
      }
    }

    // Clean up catchphrase listeners
    for (const country in this.catchphrases) {
      if (Array.isArray(this.catchphrases[country])) {
        this.catchphrases[country].forEach((sound) => {
          sound.oncanplaythrough = null;
          sound.onerror = null;
        });
      }
    }
  }

  reset() {
    // Stop all currently playing sounds
    this.stopAll();

    // Reset volume to default
    this.volume = 1.0;
    this.muted = false;

    // Stop background music
    this.stopBackgroundMusic();

    // Clear music intensity and related intervals
    this.musicIntensity = 0;
    if (this.musicRateInterval) {
      clearInterval(this.musicRateInterval);
      this.musicRateInterval = null;
    }

    // Reset grab sound state
    this.stopGrabSound();
    this.currentGrabVolume = 0.2;

    // Clear tracking of currently playing sounds
    this.currentlyPlaying = [];

    // Clear protestor sound tracking
    if (this.activeProtestorSounds) {
      Object.keys(this.activeProtestorSounds).forEach((country) => {
        this.stopProtestorSounds(country);
      });
    }

    // Reinitialize audio system
    this.initialized = false;
    this.init();
  }

  destroy() {
    // Stop all sounds first
    this.stopAll();
    this.stopBackgroundMusic();
    this.stopAllProtestorSounds();

    // Explicitly release all audio elements
    for (const category in this.sounds) {
      if (typeof this.sounds[category] === "object") {
        for (const name in this.sounds[category]) {
          if (Array.isArray(this.sounds[category][name])) {
            // Handle arrays of sounds
            this.sounds[category][name].forEach((sound) => {
              if (sound instanceof HTMLAudioElement) {
                sound.oncanplaythrough = null;
                sound.onerror = null;
                sound.onended = null;
                sound.pause();
                sound.src = "";
              }
            });
            this.sounds[category][name] = [];
          } else if (this.sounds[category][name] instanceof HTMLAudioElement) {
            // Handle individual sounds
            const sound = this.sounds[category][name];
            sound.oncanplaythrough = null;
            sound.onerror = null;
            sound.onended = null;
            sound.pause();
            sound.src = "";
            this.sounds[category][name] = null;
          }
        }
      }
    }

    // Clear all catchphrases
    for (const country in this.catchphrases) {
      if (Array.isArray(this.catchphrases[country])) {
        this.catchphrases[country].forEach((sound) => {
          if (sound instanceof HTMLAudioElement) {
            sound.oncanplaythrough = null;
            sound.onerror = null;
            sound.pause();
            sound.src = "";
          }
        });
        this.catchphrases[country] = [];
      }
    }

    // Reset state
    this.shuffledSoundIndexes = {};
    this.shuffledSoundArrays = {};
    this.shuffledCatchphraseIndexes = {};
    this.shuffledCatchphraseArrays = {};
    this.loadedSounds.clear();
    this.loadErrors = [];
    this.audioLoadQueue = [];
    this.isProcessingQueue = false;

    // Close AudioContext properly
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        console.warn("Error closing AudioContext:", e);
      }
      this.audioContext = null;
    }

    // Reset flags
    this.initialized = false;
    this.hasInitialized = false;
  }
}

window.AudioManager = AudioManager;
