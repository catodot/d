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

    this.shuffledSoundIndexes = {}; // Tracks the current position in each shuffled array
    this.shuffledSoundArrays = {}; // Stores the shuffled arrays
    this.shuffledCatchphraseIndexes = {}; // For catchphrases
    this.shuffledCatchphraseArrays = {}; // For catchphrases

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
          mexico: ["protestMex1.mp3", "protestMex2.mp3", "protestMex3.mp3", "protestMex4.mp3", "protestMex5.mp3", "protestMex6.mp3", "protestMex7.mp3"],
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
    
    // Detect mobile device once
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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
    if (this.isMobile) {
      const baseUrl = window.location.origin + window.location.pathname;
      this.soundPath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1) + 'sounds/';
      
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
          this.loadSound('defense', 'slap', 0);
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
   * Preload all game sounds in a managed way
   */
  preloadGameSounds() {
    if (this.logger) {
      this.logger.info("audio", `Starting sound preload at ${performance.now().toFixed(0)}ms`);
    }

    // First wave: UI sounds and critical gameplay sounds
    this.loadSound("ui", "click");
    this.loadSound("ui", "start");
    this.loadSound("music", "background");
    this.loadSound("defense", "slap", 0);
    this.loadSound("trump", "grab", 0);
    this.loadSound("trump", "success", 0);
    this.loadSound("trump", "sob", 0);

    // Second wave (deferred): Additional sounds
    setTimeout(() => {
      this.loadRemainingSounds();
    }, 1000);
  }

  /**
   * Load remaining game sounds after initial critical sounds
   */
  loadRemainingSounds() {
    if (!this.initialized) return;

    if (this.logger) {
      this.logger.info("audio", "Starting staged loading of remaining sounds");
    }

    // Trump sounds
    for (let category in this.soundFiles.trump) {
      const files = this.soundFiles.trump[category];
      for (let i = 0; i < files.length; i++) {
        setTimeout(() => {
          this.loadSound("trump", category, i);
        }, i * 100); // Stagger loading
      }
    }
    
    // UI sounds
    for (const name in this.soundFiles.ui) {
      setTimeout(() => {
        this.loadSound("ui", name);
      }, 200); // Light delay
    }

    // Catchphrases and protest sounds (lower priority)
    setTimeout(() => {
      this.preloadAllCatchphrases();
      this.preloadAllProtestSounds();
    }, 2000);
  }

  /**
   * Preload all protest sounds
   */
  preloadAllProtestSounds() {
    ["eastCanada", "westCanada", "mexico", "greenland"].forEach(country => {
      if (this.soundFiles.defense.protest[country]) {
        for (let i = 0; i < this.soundFiles.defense.protest[country].length; i++) {
          this.loadProtestSound(country, i);
        }
      }
    });
  }

  /**
   * Preload all catchphrases
   */
  preloadAllCatchphrases() {
    ["canada", "mexico", "greenland", "generic"].forEach(country => {
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

  /**
   * Universal method to play a sound directly with a new Audio element
   * This is more reliable on mobile devices
   */
  playDirect(soundPath, volume = null) {
    if (!this.initialized || this.muted) return null;
    
    try {
      // Create a new Audio element for more reliable playback
      const audio = new Audio(this.getSoundPath(soundPath));
      
      // Set volume
      audio.volume = volume !== null ? volume : this.volume;
      
      // Play the sound
      const promise = audio.play();
      
      // Handle play errors
      if (promise !== undefined) {
        promise.catch(error => {
          if (this.logger) {
            this.logger.warn('audio', `Direct audio playback prevented: ${error}`);
          }
        });
      }
      
      return audio;
    } catch (e) {
      if (this.logger) {
        this.logger.error('audio', `Error playing direct sound: ${e.message}`);
      }
      return null;
    }
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

    if (this.logger) {
      this.logger.debug("audio", `Loading sound: ${soundKey}`);
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
      if (this.logger) {
        this.logger.debug("audio", `Loaded sound: ${soundKey}`);
      }

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
      if (this.logger) {
        this.logger.error("audio", `Error loading sound ${soundPath}: ${e.type}`);
      }
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
      if (this.logger) {
        this.logger.error("audio", `Invalid protest sound path for ${country}[${index}]`);
      }
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

    const soundPath = this.catchphraseFiles[country][index];
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = this.getSoundPath(soundPath);

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
      // On mobile, use direct approach for reliability
      if (this.isMobile) {
        const soundPath = this.soundFiles[category][name];
        if (soundPath) {
          const audio = this.playDirect(soundPath);
          return Promise.resolve(audio);
        }
      }
      
      // Otherwise, check if the sound exists in our cache
      if (!this.sounds[category][name]) {
        if (this.logger) {
          this.logger.debug('audio', `Sound ${category}.${name} not loaded yet, loading now...`);
        }
        this.loadSound(category, name);
        
        // Try direct play after a short delay
        return new Promise(resolve => {
          setTimeout(() => {
            const soundPath = this.soundFiles[category][name];
            const audio = this.playDirect(soundPath);
            resolve(audio);
          }, 100);
        });
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
      
      try {
        const playPromise = sound.play();
        if (playPromise !== undefined) {
          return playPromise.catch(error => {
            if (this.logger) {
              this.logger.warn('audio', `Audio playback prevented: ${error}, trying direct method`);
            }
            // Fall back to direct method if regular play fails
            return this.playDirect(this.soundFiles[category][name]);
          });
        }
      } catch (e) {
        if (this.logger) {
          this.logger.error('audio', `Error playing sound: ${e.message}`);
        }
        // Fall back to direct method if regular play fails
        return Promise.resolve(this.playDirect(this.soundFiles[category][name]));
      }
      
      return Promise.resolve(sound);
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
      
      if (this.logger) {
        this.logger.debug("audio", `Created new shuffled array for ${soundKey} with ${indices.length} sounds`);
      }
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
      
      if (this.logger) {
        this.logger.debug("audio", `Reshuffled array for ${soundKey} after playing all sounds`);
      }
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
    const useCountry = (this.catchphrases[actualCountry] && this.catchphrases[actualCountry].length > 0) 
      ? actualCountry 
      : "generic";
    
    const soundArray = this.catchphraseFiles[useCountry];
    const soundKey = `catchphrase.${useCountry}`;
    
    // If no sounds available, return null
    if (!soundArray || soundArray.length === 0) {
      return null;
    }
    
    // If we're on mobile, just use the first sound for reliability
    if (this.isMobile) {
      return soundArray[0];
    }
    
    // If we don't have a shuffled array for this catchphrase yet, create one
    if (!this.shuffledCatchphraseArrays[soundKey]) {
      // Create an array of indices
      const indices = Array.from({ length: soundArray.length }, (_, i) => i);
      
      // Shuffle the indices
      this.shuffledCatchphraseArrays[soundKey] = this.shuffleArray(indices);
      this.shuffledCatchphraseIndexes[soundKey] = 0;
      
      if (this.logger) {
        this.logger.debug("audio", `Created new shuffled catchphrase array for ${soundKey} with ${indices.length} sounds`);
      }
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
      
      if (this.logger) {
        this.logger.debug("audio", `Reshuffled catchphrase array for ${soundKey} after playing all sounds`);
      }
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

  /**
   * Play a catchphrase for a specific country
   */
  playCatchphrase(country) {
    if (!this.initialized || this.muted) return null;
    
    // Get shuffled catchphrase sound file
    const soundFile = this.getShuffledCatchphrase(country);
    
    // If no sound file is available, return null
    if (!soundFile) {
      return null;
    }
    
    // Play directly for reliability
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
      audio.play().catch(error => {
        if (this.logger) {
          this.logger.warn("audio", `Resistance sound playback prevented: ${error}`);
        }
      });
      
      return audio;
    } catch (e) {
      if (this.logger) {
        this.logger.error("audio", `Error playing resistance sound: ${e.message}`);
      }
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

    try {
      // Get a sound file using our shuffled method
      const soundFile = this.getShuffledSound("trump", "grab");
      
      if (!soundFile) {
        return null;
      }
      
      // Create a new audio element
      const grabSound = new Audio(this.getSoundPath(soundFile));
      grabSound.loop = true;
      grabSound.volume = this.currentGrabVolume * this.volume;
      
      // Play the sound
      grabSound.play().catch(error => {
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
      }, 300);
      
      // Add to currently playing sounds
      this.currentlyPlaying.push(grabSound);
      
      return grabSound;
    } catch (e) {
      if (this.logger) {
        this.logger.error("audio", `Error playing grab sound: ${e.message}`);
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
/**
   * Play the sequence for a successful block (player slapped Trump's hand)
   */
playSuccessfulBlock(country) {
  // Stop the grab sound first
  this.stopGrabSound();
  
  if (this.logger) {
    this.logger.info("audio", `Playing successful block sound sequence for ${country}`);
  }
  
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
  
  if (this.logger) {
    this.logger.info("audio", `Playing successful grab sound for ${country}`);
  }

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
  
  if (this.logger) {
    this.logger.info("audio", `Playing country annexed sound for ${country}`);
  }

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
 * Start background music
 */
startBackgroundMusic() {
  if (!this.initialized || this.muted) return Promise.resolve(false);
  
  // Resume AudioContext first (mobile requirement)
  return this.resumeAudioContext().then(() => {
    try {
      // Always create a new Audio element for background music
      const music = new Audio(this.getSoundPath(this.soundFiles.music.background));
      music.loop = true;
      music.volume = this.volume * 0.5; // Lower volume for background
      
      // Play the music
      const playPromise = music.play();
      if (playPromise !== undefined) {
        return playPromise.then(() => {
          // Store reference to the background music
          this.backgroundMusic = music;
          this.backgroundMusicPlaying = true;
          return true;
        }).catch(error => {
          if (this.logger) {
            this.logger.warn("audio", `Background music prevented: ${error}`);
          }
          return false;
        });
      }
      
      // Store reference to the background music
      this.backgroundMusic = music;
      this.backgroundMusicPlaying = true;
      return Promise.resolve(true);
    } catch (e) {
      if (this.logger) {
        this.logger.error("audio", `Error starting background music: ${e.message}`);
      }
      return Promise.resolve(false);
    }
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
  if (this.loadedSounds.size === 0 && this.isMobile) {
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
      this.loadSound('defense', 'slap', 0);
      this.loadSound('trump', 'grab', 0);
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
  this.logger.info("audio", `Total Loaded Sounds: ${this.loadedSounds.size}`);
  this.logger.info("audio", "========================");
}
}

window.AudioManager = AudioManager;