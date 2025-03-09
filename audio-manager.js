class AudioManager {
  constructor() {
    // Sound categories
    this.sounds = {
      ui: {},
      trump: {
        grab: [],
        success: [],
        annex: [],
        victory: []
      },
      defense: {
        slap: [],
        protest: {
          canada: [],
          mexico: [],
          greenland: []
        }
      },
      music: {}
    };

    this.timingParams = {
      catchphraseDelay: 300, // ms to wait between success/annex and catchphrase
      grabWarningTime: 500,  // ms before grab to play warning
      protestDelay: 350      // ms between slap and protest sounds
    };
    
    // Catchphrases
    this.catchphrases = {
      canada: [],
      mexico: [],
      greenland: [],
      generic: []
    };

    this.musicIntensity = 0; // 0 = normal, 1-3 = increasing intensity levels
    this.musicRateInterval = null;
    
    // Sound file definitions for lazy loading
    this.soundFiles = {
      ui: {
        click: "click.mp3",
        start: "game-start.mp3",
        gameOver: "game-over.mp3",
        win: "win.mp3",
        lose: "lose.mp3",
        warning: "warning.mp3",
        resilience: "resilience.mp3"


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
      }
    };
    
    this.catchphraseFiles = {
      canada: ["canada1.mp3", "canada2.mp3", "canada3.mp3"],
      mexico: ["mexico1.mp3", "mexico2.mp3", "mexico3.mp3"],
      greenland: ["greenland1.mp3", "greenland2.mp3"],
      generic: ["catchphrase1.mp3", "catchphrase2.mp3", "catchphrase3.mp3"]
    };
    
    // Sound path
    this.soundPath = "sounds/";
    
    // State
    this.initialized = false;
    this.muted = false;
    this.volume = 1.0;
    this.currentlyPlaying = [];
    this.backgroundMusic = null;
    this.backgroundMusicPlaying = false;
    this.loadedSounds = new Set(); // Track loaded sounds
    
    // Grab sound state
    this.activeGrabSound = null;
    this.grabVolumeInterval = null;
    this.currentGrabVolume = 0.2; // Starting volume for grab sounds
    this.maxGrabVolume = 1.0;
    this.grabVolumeStep = 0.05; // Amount to increase volume per interval

    console.log("Audio Manager initialized");
  }


  // Create a method to initialize a playback queue for a category
initPlaybackQueue(queueKey, soundArray) {
  // If queue doesn't exist, create it
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
      this.logger.debug('audio', `Created playback queue for ${queueKey} with ${soundArray.length} sounds`);
    }
  }
}

// Method to shuffle a specific queue
shuffleQueue(queueKey) {
  const queue = this.playbackQueues[queueKey];
  if (!queue) return;
  
  // Fisher-Yates shuffle algorithm
  const array = queue.currentQueue;
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  
  queue.position = 0;
  
  if (this.logger) {
    this.logger.debug('audio', `Shuffled playback queue for ${queueKey}`);
  }
}

// Get the next sound from a queue, reshuffle if needed
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
      this.logger.debug('audio', `End of queue for ${queueKey}, reshuffling`);
    }
    this.shuffleQueue(queueKey);
  }
  
  return sound;
}
  
  setLogger(logger) {
    this.logger = logger;
    this.logger.info('audio', 'Logger set in AudioManager');
  }
  
  init() {
    if (this.initialized) return;

    if (this.logger) {
      this.logger.info('audio', 'Initializing audio system');
    }

    const initStartTime = performance.now();
console.log(`[MOBILE-DEBUG] AudioManager init started at ${initStartTime}ms`);

    

    
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Check if context is suspended (common on mobile)
      if (this.audioContext.state === 'suspended') {
        if (this.logger) {
          this.logger.warn('audio', 'AudioContext is suspended, will resume on user interaction');
        }
      }
      
      if (this.logger) {
        this.logger.debug('audio', `AudioContext created successfully with state: ${this.audioContext.state}`);
      }
    } catch(e) {
      console.warn("Web Audio API not supported:", e);
    }
    
    this.initialized = true;
      
    // Preload essential UI sounds
    this.loadSound('ui', 'click');
    this.loadSound('ui', 'start');
    
    // Preload one sound from each critical game sound category
    this.loadSound('defense', 'slap', 0); // Load first slap sound
    this.loadSound('trump', 'grab', 0);   // Load first grab sound
    this.loadSound('trump', 'success', 0); // Load first success sound
    
    if (this.logger) {
      this.logger.info('audio', 'Audio system initialized');
    }
  }

  resumeAudioContext() {
    console.log(`[MOBILE-DEBUG] resumeAudioContext called at ${performance.now()}ms`);

    if (!this.audioContext) return Promise.resolve();
    
    if (this.audioContext.state === 'suspended') {
      if (this.logger) {
        this.logger.info('audio', 'Resuming suspended AudioContext');
      }
      
      return this.audioContext.resume().then(() => {
        console.log(`[MOBILE-DEBUG] AudioContext resumed at ${performance.now()}ms`);

        if (this.logger) {
          this.logger.info('audio', `AudioContext resumed successfully, state: ${this.audioContext.state}`);
        }
      }).catch(err => {
        if (this.logger) {
          this.logger.error('audio', `Failed to resume AudioContext: ${err}`);
        }
      });
    }
    
    return Promise.resolve();
  }
  
// Add this method to preload all game sounds
preloadGameSounds() {

  if (this.logger) {
    this.logger.info('audio', `TIMING: Starting sound preload at ${performance.now().toFixed(0)}ms`);
    this.logger.info('audio', `Device: ${/iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'iOS' : /Android/i.test(navigator.userAgent) ? 'Android' : 'Desktop'}`);
  }


  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const deviceInfo = isMobile ? 'mobile' : 'desktop';
  
  if (this.logger) {
    this.logger.info('audio', `Preloading game sounds on ${deviceInfo}: ${navigator.userAgent}`);
    this.logger.info('audio', `AudioContext state: ${this.audioContext ? this.audioContext.state : 'none'}`);
  }
  
  // Keep track of load attempts and successes for debugging
  this.loadAttempts = 0;
  this.loadSuccesses = 0;
  
  // Start with UI sounds and background music (highest priority)
  this.loadSound('ui', 'click');
  this.loadSound('ui', 'start');
  this.loadSound('music', 'background');
  
  // Load grab and defense sounds (needed early)
  this.loadSound('trump', 'grab', 0);
  this.loadSound('defense', 'slap', 0);
  this.loadSound('trump', 'success', 0);
  
  // Load remaining Trump sounds with error handling
  try {
    for (let i = 1; i < this.soundFiles.trump.grab.length; i++) {
      this.loadSound('trump', 'grab', i);
    }
    
    for (let i = 1; i < this.soundFiles.trump.success.length; i++) {
      this.loadSound('trump', 'success', i);
    }
    
    for (let i = 0; i < this.soundFiles.trump.annex.length; i++) {
      this.loadSound('trump', 'annex', i);
    }
    
    for (let i = 0; i < this.soundFiles.trump.victory.length; i++) {
      this.loadSound('trump', 'victory', i);
    }
    
    for (let i = 0; i < this.soundFiles.trump.sob.length; i++) {
      this.loadSound('trump', 'sob', i);
    }
  } catch (e) {
    if (this.logger) {
      this.logger.error('audio', `Error loading Trump sounds: ${e.message}`);
    }
  }
  
  // Load remaining defense sounds with error handling
  try {
    for (let i = 1; i < this.soundFiles.defense.slap.length; i++) {
      this.loadSound('defense', 'slap', i);
    }
    
    // Protest sounds for each country
    ['eastCanada', 'westCanada', 'canada', 'mexico', 'greenland'].forEach(country => {
      if (this.soundFiles.defense.protest[country]) {
        for (let i = 0; i < this.soundFiles.defense.protest[country].length; i++) {
          this.loadProtestSound(country, i);
        }
      }
    });
  } catch (e) {
    if (this.logger) {
      this.logger.error('audio', `Error loading defense sounds: ${e.message}`);
    }
  }
  
  // Load catchphrases with error handling
  try {
    ['canada', 'mexico', 'greenland', 'generic'].forEach(country => {
      if (this.catchphraseFiles[country]) {
        for (let i = 0; i < this.catchphraseFiles[country].length; i++) {
          this.loadCatchphrase(country, i);
        }
      }
    });
  } catch (e) {
    if (this.logger) {
      this.logger.error('audio', `Error loading catchphrases: ${e.message}`);
    }
  }
  
  // Log summary of load attempts - this will help diagnose the issues
  if (this.logger) {
    this.logger.info('audio', `Sound loading initiated: ${this.loadAttempts} attempted`);
    
    // Check again in 3 seconds to see how many actually loaded
    setTimeout(() => {
      if (this.logger) {
        this.logger.info('audio', `Sound loading status after 3s: ${this.loadSuccesses}/${this.loadAttempts} loaded`);
        this.logger.info('audio', `Loaded sounds: ${Array.from(this.loadedSounds).join(', ')}`);
      }
    }, 3000);
  }
}

// Call this function during game start or on first user interaction
loadRemainingSounds() {
  if (!this.shouldLoadRemainingSounds) return;
  this.shouldLoadRemainingSounds = false;
  
  if (this.logger) {
    this.logger.info('audio', 'Starting staged loading of remaining sounds');
  }
  
  // Use a queue system to load sounds gradually without blocking gameplay
  const loadQueue = [];
  
  // Add Trump sounds to queue (skip the first ones we already loaded)
  for (let i = 1; i < this.soundFiles.trump.grab.length; i++) {
    loadQueue.push({ type: 'normal', category: 'trump', name: 'grab', index: i });
  }
  
  // Add success sounds
  for (let i = 0; i < this.soundFiles.trump.success.length; i++) {
    loadQueue.push({ type: 'normal', category: 'trump', name: 'success', index: i });
  }
  
  // Add other sound types...
  // (Add remaining sound types to the queue with similar structure)
  
  // Background music (medium priority)
  loadQueue.push({ type: 'normal', category: 'music', name: 'background' });
  
  // Process the queue gradually - load 1 sound every 200ms
  let queueIndex = 0;
  const processQueue = () => {
    if (queueIndex >= loadQueue.length) {
      if (this.logger) {
        this.logger.info('audio', 'Finished loading all sounds');
      }
      return;
    }
    
    const item = loadQueue[queueIndex++];
    
    try {
      if (item.type === 'normal') {
        this.loadSound(item.category, item.name, item.index);
      } else if (item.type === 'protest') {
        this.loadProtestSound(item.country, item.index);
      } else if (item.type === 'catchphrase') {
        this.loadCatchphrase(item.country, item.index);
      }
    } catch (e) {
      if (this.logger) {
        this.logger.error('audio', `Error loading sound from queue: ${e.message}`);
      }
    }
    
    // Schedule next item with a delay to avoid blocking the main thread
    setTimeout(processQueue, 200);
  };
  
  // Start processing the queue
  setTimeout(processQueue, 500);
}
    


loadSound(category, name, index = null) {
  
  // Create a unique key for tracking loaded sounds
  const soundKey = index !== null 
    ? `${category}.${name}.${index}` 
    : `${category}.${name}`;

    const startTime = performance.now();

    
  // Skip if already loaded
  if (this.loadedSounds.has(soundKey)) {
    if (this.logger) {
      this.logger.debug('audio', `TIMING: Loading ${soundKey} at ${startTime.toFixed(0)}ms`);
    }
    return;
  }
  
  // Track load attempts for diagnostics
  this.loadAttempts = (this.loadAttempts || 0) + 1;
  
  if (this.logger) {
    this.logger.debug('audio', `Loading sound: ${soundKey} (attempt #${this.loadAttempts})`);
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
  
  // Set shorter timeout for mobile devices
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    audio.timeout = 8000; // 8 second timeout on mobile
  }
  
  // Track load success
  audio.oncanplaythrough = () => {
    const loadTime = performance.now();
    if (this.logger) {
      this.logger.info('audio', `TIMING: Sound ${soundKey} loaded at ${loadTime.toFixed(0)}ms (took ${(loadTime - startTime).toFixed(0)}ms)`);
    }


    this.loadSuccesses = (this.loadSuccesses || 0) + 1;
    
    if (this.logger) {
      this.logger.trace('audio', `Loaded sound: ${soundKey} (success #${this.loadSuccesses})`);
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
  
  // Track load error
  audio.onerror = (e) => {
    if (this.logger) {
      this.logger.error('audio', `Error loading sound ${soundPath}: ${e.type}`);
    }
  };
  
  // Set source and load
  audio.src = soundPath;
  audio.load();
  
  return audio;
}


  // Load a country-specific protest sound
  loadProtestSound(country, index) {
    const soundKey = `defense.protest.${country}.${index}`;
    
    if (this.loadedSounds.has(soundKey)) {
      if (this.logger) {
        this.logger.trace('audio', `Protest sound already loaded: ${soundKey}`);
      }
      return;
    }
    
    // Ensure the country array exists
    if (!this.sounds.defense.protest[country]) {
      this.sounds.defense.protest[country] = [];
    }
    
    const soundPath = this.soundPath + this.soundFiles.defense.protest[country][index];
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = soundPath;
    
    audio.oncanplaythrough = () => {
      if (this.logger) {
        this.logger.trace('audio', `Loaded protest sound: ${soundPath}`);
      }
      this.sounds.defense.protest[country].push(audio);
      this.loadedSounds.add(soundKey);
    };
    
    audio.onerror = (e) => {
      if (this.logger) {
        this.logger.error('audio', `Error loading protest sound ${soundPath}:`, e);
      }
    };
    
    audio.load();
    return audio;
  }
    
  // Load a catchphrase
  loadCatchphrase(country, index) {
    const soundKey = `catchphrase.${country}.${index}`;
    
    if (this.loadedSounds.has(soundKey)) {
      if (this.logger) {
        this.logger.trace('audio', `Catchphrase already loaded: ${soundKey}`);
      }
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
      if (this.logger) {
        this.logger.trace('audio', `Loaded catchphrase: ${soundPath}`);
      }
      this.catchphrases[country].push(audio);
      this.loadedSounds.add(soundKey);
    };

    audio.onerror = (e) => {
      if (this.logger) {
        this.logger.error('audio', `Error loading catchphrase ${soundPath}:`, e);
      }
    };
    
    audio.load();
    return audio;
  }
    
  // Play a named sound with lazy loading
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
            this.logger.error('audio', `Error playing sound ${category}.${name}:`, e);
          }
          resolve(null);
        }
      });
    });
  }

  playResilienceSound(level) {
    if (!this.initialized || this.muted) return null;
    
    // Don't play for very low levels
    if (level < 2) return null;
    
    if (this.logger) {
      this.logger.info('audio', `Playing resilience level ${level} sound`);
    }
    
    // Load the sound if needed
    if (!this.sounds.ui.resilience) {
      if (this.logger) {
        this.logger.debug('audio', `Resilience sound not loaded yet, loading now...`);
      }
      this.loadSound('ui', 'resilience');
      return null;
    }
    
    const sound = this.sounds.ui.resilience;
    
    // Play with pitch shifting based on level
    sound.currentTime = 0;
    sound.volume = this.volume * 0.6;
    
    // Higher pitch for higher levels (if browser supports it)
    if (typeof sound.preservesPitch !== 'undefined') {
      sound.preservesPitch = false;
    } else if (typeof sound.mozPreservesPitch !== 'undefined') {
      sound.mozPreservesPitch = false;
    }
    
    // Adjust pitch based on resilience level (1.0 is normal)
    const pitchRate = 0.9 + (level * 0.1); // Higher levels = higher pitch
    sound.playbackRate = pitchRate;
    
    try {
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (this.logger) {
            this.logger.warn('audio', `Resilience sound playback prevented: ${error}`);
          }
        });
      }
    } catch (e) {
      if (this.logger) {
        this.logger.error('audio', `Error playing resilience sound:`, e);
      }
    }
    
    return sound;
  }


  playGrabWarning() {
    if (!this.initialized || this.muted) return null;
    
    if (this.logger) {
      this.logger.info('audio', `Playing grab warning sound`);
    }
    
    // Check if the sound exists, load it if not
    if (!this.sounds.ui.warning) {
      if (this.logger) {
        this.logger.debug('audio', `Warning sound not loaded yet, loading now...`);
      }
      this.loadSound('ui', 'warning');
      return null;
    }
    
    const sound = this.sounds.ui.warning;
    
    // Make sure it's a valid audio element
    if (!sound || typeof sound.play !== 'function') {
      if (this.logger) {
        this.logger.warn('audio', `Invalid warning sound object`);
      }
      return null;
    }
    
    // Reset and play
    sound.currentTime = 0;
    sound.volume = this.volume * 0.7; // Slightly quieter than normal sounds
    
    try {
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (this.logger) {
            this.logger.warn('audio', `Warning sound playback prevented: ${error}`);
          }
        });
      }
    } catch (e) {
      if (this.logger) {
        this.logger.error('audio', `Error playing warning sound:`, e);
      }
    }
    
    return sound;
  }
    
  playRandom(category, subcategory, country = null) {
    if (!this.initialized || this.muted) return null;
    
    const logKey = country ? `${category}.${subcategory}.${country}` : `${category}.${subcategory}`;
    if (this.logger) {
      this.logger.debug('audio', `Attempting to play random sound from ${logKey}`);
    }
    
    let soundArray;
    let filesArray;
    
    // Get the appropriate array based on category and country
    if (country && subcategory === 'protest') {
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
        this.logger.debug('audio', `No sounds loaded for ${logKey}, loading now...`);
      }
      if (country && subcategory === 'protest') {
        this.loadProtestSound(country, 0);
      } else {
        this.loadSound(category, subcategory, 0);
      }
      return null;
    }
    
    // Initialize the playback queue if it doesn't exist
    this.initPlaybackQueue(logKey, soundArray);
    
    // Get the next sound from the queue
    const sound = this.getNextSoundFromQueue(logKey);
    
    // Ensure we have a valid audio element
    if (!sound || typeof sound.play !== 'function') {
      if (this.logger) {
        this.logger.warn('audio', `Invalid sound object from queue ${logKey}`);
      }
      return null;
    }
    
    if (this.logger) {
      const queuePosition = this.playbackQueues[logKey].position - 1;
      const queueLength = this.playbackQueues[logKey].currentQueue.length;
      this.logger.debug('audio', `Playing queued sound from ${logKey} (position: ${queuePosition}/${queueLength})`);
    }
    
    // If not all sounds in this category are loaded, load the next one
    if (soundArray.length < filesArray.length) {
      if (country && subcategory === 'protest') {
        this.loadProtestSound(country, soundArray.length);
      } else {
        this.loadSound(category, subcategory, soundArray.length);
      }
    }
      
    // Ensure we don't play the sound if it's already playing
    if (sound.currentTime > 0 && !sound.paused) {
      // Clone the sound for simultaneous playback
      const clonedSound = sound.cloneNode();
      clonedSound.volume = this.volume;
      
      try {
        // Play and track the sound
        const playPromise = clonedSound.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (this.logger) {
              this.logger.warn('audio', `Audio playback prevented: ${error}`);
            }
          });
        }
        
        this.currentlyPlaying.push(clonedSound);
        
        // Remove from tracking once played
        clonedSound.onended = () => {
          const index = this.currentlyPlaying.indexOf(clonedSound);
          if (index !== -1) {
            this.currentlyPlaying.splice(index, 1);
          }
          if (this.logger) {
            this.logger.trace('audio', `Sound from ${logKey} finished playing (cloned)`);
          }
        };
        
        return clonedSound;
      } catch (e) {
        if (this.logger) {
          this.logger.error('audio', `Error playing cloned sound:`, e);
        }
        return null;
      }
    } else {
      // Play the original sound
      sound.currentTime = 0;
      sound.volume = this.volume;
      
      try {
        const playPromise = sound.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (this.logger) {
              this.logger.warn('audio', `Audio playback prevented: ${error}`);
            }
          });
        }
        
        // Add end event listener for better tracking
        const originalOnEnded = sound.onended;
        sound.onended = (e) => {
          if (this.logger) {
            this.logger.trace('audio', `Sound from ${logKey} finished playing`);
          }
          if (originalOnEnded) originalOnEnded(e);
        };
        
        return sound;
      } catch (e) {
        if (this.logger) {
          this.logger.error('audio', `Error playing sound:`, e);
        }
        return null;
      }
    }
  }
    
  playCatchphrase(country) {
    if (!this.initialized || this.muted) return null;
    
    // Determine which country to use
    const useCountry = (this.catchphrases[country] && this.catchphrases[country].length > 0) 
      ? country 
      : 'generic';
    
    if (this.logger) {
      this.logger.info('audio', `Playing catchphrase for ${country}, using ${useCountry} sounds`);
    }
    
    // Get the catchphrase array
    const catchphraseArray = this.catchphrases[useCountry];
    const filesArray = this.catchphraseFiles[useCountry];
    
    // If no catchphrases loaded yet, load the first one
    if (!catchphraseArray || catchphraseArray.length === 0) {
      this.loadCatchphrase(useCountry, 0);
      if (this.logger) {
        this.logger.debug('audio', `No catchphrases loaded for ${useCountry}, loading now...`);
      }
      return null;
    }
    
    // Initialize playback queue for this country's catchphrases
    const queueKey = `catchphrase.${useCountry}`;
    this.initPlaybackQueue(queueKey, catchphraseArray);
    
    // Get the next catchphrase from the queue
    const sound = this.getNextSoundFromQueue(queueKey);
    
    if (this.logger) {
      const queuePosition = this.playbackQueues[queueKey].position - 1;
      const queueLength = this.playbackQueues[queueKey].currentQueue.length;
      this.logger.debug('audio', `Selected catchphrase for ${useCountry} (position: ${queuePosition}/${queueLength})`);
    }
    
    // If not all catchphrases in this category are loaded, load the next one
    if (catchphraseArray.length < filesArray.length) {
      this.loadCatchphrase(useCountry, catchphraseArray.length);
    }
    
    // Make sure it's a valid audio element
    if (!sound || typeof sound.play !== 'function') {
      if (this.logger) {
        this.logger.warn('audio', `Invalid catchphrase from queue ${queueKey}`);
      }
      return null;
    }
    
    // Play the catchphrase
    sound.currentTime = 0;
    sound.volume = this.volume;
    
    try {
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (this.logger) {
            this.logger.warn('audio', `Catchphrase playback prevented: ${error}`);
          }
        });
      }
      
      // Add end event listener for better tracking
      const originalOnEnded = sound.onended;
      sound.onended = (e) => {
        if (this.logger) {
          this.logger.trace('audio', `Catchphrase for ${useCountry} finished playing`);
        }
        if (originalOnEnded) originalOnEnded(e);
      };
      
      return sound;
    } catch (e) {
      if (this.logger) {
        this.logger.error('audio', `Error playing catchphrase:`, e);
      }
      return null;
    }
  }
    
  // Start a grab attempt with looping sound and increasing volume
  playGrabAttempt(country) {
    if (this.logger) {
      this.logger.info('audio', `Playing grab attempt sound for ${country}`);
    }
    
    // Stop any existing grab sound
    this.stopGrabSound();
    
    // Play a random grab sound
    const soundArray = this.sounds.trump.grab;
    
    // If no sounds loaded yet, load the first one
    if (!soundArray || soundArray.length === 0) {
      if (this.logger) {
        this.logger.debug('audio', 'No grab sounds loaded, loading now...');
      }
      this.loadSound('trump', 'grab', 0);
      return null;
    }
    
    // Pick a random sound
    const randomIndex = Math.floor(Math.random() * soundArray.length);
    const sound = soundArray[randomIndex];
    
    if (this.logger) {
      this.logger.debug('audio', `Selected grab sound (index: ${randomIndex}/${soundArray.length-1})`);
    }
    
    // Clone the sound for our looping
    const grabSound = sound.cloneNode();
    grabSound.loop = true; // Enable looping
    grabSound.volume = this.currentGrabVolume * this.volume; // Start with lower volume
    
    try {
      // Play and track the sound
      const playPromise = grabSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (this.logger) {
            this.logger.warn('audio', `Grab sound playback prevented: ${error}`);
          }
        });
      }
      
      // Save reference to active grab sound
      this.activeGrabSound = grabSound;
      
      // Start increasing volume gradually
      this.grabVolumeInterval = setInterval(() => {
        if (this.activeGrabSound) {
          this.currentGrabVolume = Math.min(this.maxGrabVolume, this.currentGrabVolume + this.grabVolumeStep);
          this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
          
          if (this.logger && this.currentGrabVolume >= this.maxGrabVolume) {
            this.logger.debug('audio', 'Grab sound reached max volume');
          }
        }
      }, 300); // Increase volume every 300ms
      
      // Add to currently playing sounds
      this.currentlyPlaying.push(grabSound);
      
      return grabSound;
    } catch (e) {
      if (this.logger) {
        this.logger.error('audio', `Error playing grab sound:`, e);
      }
      return null;
    }
  }
  
  // Stop the grab sound when player taps or Trump succeeds
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
        this.logger.debug('audio', 'Stopped grab sound');
      }
    }
  }
    

  playSuccessfulBlock(country) {
    if (this.logger) {
      this.logger.info('audio', `Playing successful block sound sequence for ${country}`);
    }
    
    // Stop the grab sound first
    this.stopGrabSound();
    
    // Play slap sound first
    const slapSound = this.playRandom('defense', 'slap');
    
    if (!slapSound) {
      if (this.logger) {
        this.logger.warn('audio', 'Failed to play slap sound - not loaded yet?');
      }
      
      // If slap failed, try to play the sequence anyway after a delay
      setTimeout(() => {
        this.playFullSequence(country);
      }, 300);
      return;
    }
    
    // Start sob sound slightly before slap finishes (about 80% into the slap sound)
    // Most slap sounds are around 300-500ms, so we'll use a 200ms delay
    setTimeout(() => {
      if (this.logger) {
        this.logger.debug('audio', 'Playing sob sound during end of slap');
      }
      
      // Play sob sound (Trump's reaction)
      const sobSound = this.playRandom('trump', 'sob');
      if (sobSound) {
        // Set the volume to be appropriate
        sobSound.volume = this.volume * 0.4;
        
        // Wait for sob to start before playing protest
        setTimeout(() => {
          // Play country-specific protest sound
          if (this.logger) {
            this.logger.debug('audio', `Playing protest sound for ${country} after sob`);
          }
          
          if (country === 'eastCanada' || country === 'westCanada') {
            this.playRandom('defense', 'protest', country);
          } else {
            this.playRandom('defense', 'protest', country);
          }
        }, 150); // 150ms after sob starts
        
      } else {
        // If sob sound failed, still play protest
        if (this.logger) {
          this.logger.warn('audio', 'Failed to play sob sound - playing protest anyway');
        }
        
        // Play country-specific protest sound
        if (country === 'eastCanada' || country === 'westCanada') {
          this.playRandom('defense', 'protest', country);
        } else {
          this.playRandom('defense', 'protest', country);
        }
      }
    }, 200); // 200ms after slap starts - the sob will overlap with end of slap
  }
  
  // Helper method to play protest and sob together
  playProtestAndSob(country) {
    // For East/West Canada, use the specific protest sound
    let protestSound;
    if (country === 'eastCanada' || country === 'westCanada') {
      protestSound = this.playRandom('defense', 'protest', country);
      if (!protestSound && this.logger) {
        this.logger.warn('audio', `Failed to play protest sound for ${country} - not loaded yet?`);
      }
    } else {
      protestSound = this.playRandom('defense', 'protest', country);
      if (!protestSound && this.logger) {
        this.logger.warn('audio', `Failed to play protest sound for ${country} - not loaded yet?`);
      }
    }
    
    // Play sob sound simultaneously with the protest sound, but very quietly
    const sobSound = this.playRandom('trump', 'sob');
    if (sobSound) {
      // Set the volume to be very low (20% of normal volume)
      sobSound.volume = this.volume * 0.2;
      
      if (this.logger) {
        this.logger.debug('audio', 'Playing sob sound at reduced volume');
      }
    } else if (this.logger) {
      this.logger.warn('audio', 'Failed to play sob sound - not loaded yet?');
    }
  }
  
  playSuccessfulGrab(country) {
    if (this.logger) {
      this.logger.info('audio', `Playing successful grab sound for ${country}`);
    }
    
    // Stop the grab sound first
    this.stopGrabSound();
    
    // Play success sound
    const successSound = this.playRandom('trump', 'success');
    
    if (!successSound) {
      if (this.logger) {
        this.logger.warn('audio', 'Failed to play success sound - not loaded yet?');
      }
      
      // Try to play catchphrase anyway, but with a delay
      setTimeout(() => {
        this.playCatchphrase(country);
      }, 500);
      return;
    }
    

     // Get the duration if available, or use a default value
  let soundDuration = 1.5; // Default duration in seconds
  
  if (successSound.duration && !isNaN(successSound.duration) && successSound.duration > 0) {
    soundDuration = successSound.duration;
    if (this.logger) {
      this.logger.debug('audio', `Success sound duration: ${soundDuration}s`);
    }
  } else {
    // If duration not available (might happen before the sound is fully loaded)
    successSound.addEventListener('loadedmetadata', () => {
      if (successSound.duration && !isNaN(successSound.duration)) {
        soundDuration = successSound.duration;
        if (this.logger) {
          this.logger.debug('audio', `Success sound duration updated: ${soundDuration}s`);
        }
      }
    });
  }
  
    // Play catchphrase after success sound finishes (with a small gap)
    const catchphraseDelay = (soundDuration * 1000) + 200;
    
    if (this.logger) {
      this.logger.debug('audio', `Scheduling catchphrase to play after ${catchphraseDelay}ms`);
    }
    
    // Play catchphrase after success sound finishes (with the calculated delay)
  setTimeout(() => {
    this.playCatchphrase(country);
  }, catchphraseDelay);
  
  return successSound;
}

playCountryAnnexed(country) {
  if (this.logger) {
    this.logger.info('audio', `Playing country annexed sound for ${country}`);
  }
  
  // Play annex sound
  const annexSound = this.playRandom('trump', 'annex');
  
  if (!annexSound) {
    if (this.logger) {
      this.logger.warn('audio', 'Failed to play annex sound - not loaded yet?');
      // Try to load an annex sound for next time
      this.loadSound('trump', 'annex', 0);
    }
    
    // Try to play catchphrase anyway, but with a delay
    setTimeout(() => {
      this.playCatchphrase(country);
    }, 500);
    return;
  }
  
  // Get the duration if available, or use a default value
  let soundDuration = 1.5; // Default duration in seconds
  
  if (annexSound.duration && !isNaN(annexSound.duration) && annexSound.duration > 0) {
    soundDuration = annexSound.duration;
    if (this.logger) {
      this.logger.debug('audio', `Annex sound duration: ${soundDuration}s`);
    }
  } else {
    // If duration not available (might happen before the sound is fully loaded)
    annexSound.addEventListener('loadedmetadata', () => {
      if (annexSound.duration && !isNaN(annexSound.duration)) {
        soundDuration = annexSound.duration;
        if (this.logger) {
          this.logger.debug('audio', `Annex sound duration updated: ${soundDuration}s`);
        }
      }
    });
  }
  
  // Calculate the delay using our timing parameter
  const catchphraseDelay = (soundDuration * 1000) + this.timingParams.catchphraseDelay;
  
  if (this.logger) {
    this.logger.debug('audio', `Scheduling catchphrase to play after ${catchphraseDelay}ms`);
  }
  
  // Play catchphrase after annex sound finishes (with the calculated delay)
  setTimeout(() => {
    this.playCatchphrase(country);
  }, catchphraseDelay);
  
  return annexSound;
}


startBackgroundMusic() {
  if (!this.initialized || this.muted) return Promise.resolve(false);
  
if (this.logger) {
  this.logger.info('audio', `TIMING: Starting background music at ${performance.now().toFixed(0)}ms`);
}
  
  // Resume AudioContext first (mobile requirement)
  return this.resumeAudioContext().then(() => {
    // Lazy load background music if needed
    if (!this.sounds.music.background) {
      if (this.logger) {
        this.logger.debug('audio', 'Background music not loaded yet, loading now...');
      }
      this.loadSound('music', 'background');
      
      // Try again in a second
      return new Promise(resolve => {
        setTimeout(() => {
          this.startBackgroundMusic().then(resolve);
        }, 1000);
      });
    }
    
    const music = this.sounds.music.background;
    this.backgroundMusic = music;
    
    music.loop = true;
    music.volume = this.volume * 0.5; // Lower volume for background
    
    // Return a promise for better async handling
    return new Promise((resolve, reject) => {
      try {
        const playPromise = music.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              this.backgroundMusicPlaying = true;
              if (this.logger) {
                this.logger.debug('audio', 'Background music playing successfully');
              }
              resolve(true);
            })
            .catch(error => {
              if (this.logger) {
                this.logger.warn('audio', `Music playback prevented: ${error}`);
              }
              this.backgroundMusicPlaying = false;
              resolve(false); // Don't reject, as this isn't critical
            });
        } else {
          resolve(false);
        }
      } catch (e) {
        if (this.logger) {
          this.logger.error('audio', 'Error playing background music:', e);
        }
        resolve(false);
      }
    });
  });
}

  updateMusicIntensity(annexedCountries) {
    // Calculate desired intensity (0-3)
    const newIntensity = Math.min(annexedCountries, 3);
    
    // If intensity hasn't changed, do nothing
    if (newIntensity === this.musicIntensity) return;
    
    this.musicIntensity = newIntensity;
    
    if (this.logger) {
      this.logger.info('audio', `Updating music intensity to level ${this.musicIntensity}`);
    }
    
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
    
  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      // Clear any intensity effects
      if (this.musicRateInterval) {
        clearInterval(this.musicRateInterval);
        this.musicRateInterval = null;
      }
      
      if (this.logger) {
        this.logger.info('audio', 'Stopping background music');
      }
      this.backgroundMusic.pause();
      this.backgroundMusic.currentTime = 0;
      this.backgroundMusicPlaying = false;
    }
  }
    
  // Mute control
  toggleMute() {
    this.muted = !this.muted;
    if (this.logger) {
      this.logger.info('audio', `Audio ${this.muted ? 'muted' : 'unmuted'}`);
    }
    
    // Apply to all currently playing sounds
    this.currentlyPlaying.forEach(sound => {
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
    
  // Volume control
  setVolume(level) {
    this.volume = Math.max(0, Math.min(1, level));
    
    // Apply to all playing sounds
    this.currentlyPlaying.forEach(sound => {
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
  
  // Pause all audio
  pauseAll() {
    // Pause background music
    if (this.backgroundMusic && !this.backgroundMusic.paused) {
      this.backgroundMusic.pause();
      if (this.logger) {
        this.logger.debug('audio', 'Background music paused');
      }
    }
    
    // Pause all currently playing sounds
    this.currentlyPlaying.forEach(sound => {
      if (!sound.paused) {
        sound.pause();
        if (this.logger) {
          this.logger.trace('audio', 'Sound paused');
        }
      }
    });
    
    // Pause grab sound interval
    if (this.grabVolumeInterval) {
      clearInterval(this.grabVolumeInterval);
      this.grabVolumeInterval = null;
      if (this.logger) {
        this.logger.debug('audio', 'Grab volume interval paused');
      }
    }
    
    if (this.logger) {
      this.logger.info('audio', 'All audio paused');
    }
  }
    
  // Resume audio
  resumeAll() {
    // Resume background music if it was playing
    if (this.backgroundMusic && this.backgroundMusicPlaying) {
      this.backgroundMusic.play().catch(e => {
        if (this.logger) {
          this.logger.warn('audio', 'Could not resume background music:', e);
        }
      });
      if (this.logger) {
        this.logger.debug('audio', 'Background music resumed');
      }
    }
    
    // Resume grab sound if it was active
    if (this.activeGrabSound) {
      this.activeGrabSound.play().catch(e => {
        if (this.logger) {
          this.logger.warn('audio', 'Could not resume grab sound:', e);
        }
      });
      
      // Restart volume interval
      this.grabVolumeInterval = setInterval(() => {
        if (this.activeGrabSound) {
          this.currentGrabVolume = Math.min(this.maxGrabVolume, this.currentGrabVolume + this.grabVolumeStep);
          this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
          if (this.logger && this.currentGrabVolume >= this.maxGrabVolume) {
            this.logger.trace('audio', 'Resumed grab sound reached max volume');
          }
        }
      }, 300);
      
      if (this.logger) {
        this.logger.debug('audio', 'Grab sound and volume interval resumed');
      }
    }
    
    if (this.logger) {
      this.logger.info('audio', 'All audio resumed');
    }
  }
    
  // Stop all sounds
  stopAll() {
    if (this.logger) {
      this.logger.info('audio', 'Stopping all sounds');
    }
    
    this.currentlyPlaying.forEach(sound => {
      sound.pause();
      sound.currentTime = 0;
    });
    
    this.currentlyPlaying = [];
    this.stopBackgroundMusic();
    this.stopGrabSound();
    
    if (this.logger) {
      this.logger.debug('audio', 'All sounds stopped and reset');
    }
  }
  
  // Diagnostic method to log the state of the audio system
  logAudioState() {
    if (!this.logger) return;
    
    this.logger.info('audio', '=== AUDIO SYSTEM STATE ===');
    this.logger.info('audio', `Initialized: ${this.initialized}, Muted: ${this.muted}, Volume: ${this.volume}`);
    this.logger.info('audio', `Background Music Playing: ${this.backgroundMusicPlaying}`);
    this.logger.info('audio', `Currently Playing Sounds: ${this.currentlyPlaying.length}`);
    this.logger.info('audio', `Active Grab Sound: ${this.activeGrabSound ? 'Yes' : 'No'}`);
    
    // Log loaded sounds
    this.logger.info('audio', `Total Loaded Sounds: ${this.loadedSounds.size}`);
    
    // Log loaded sound categories
    const categories = ['ui', 'trump', 'defense', 'music'];
    categories.forEach(category => {
      let count = 0;
      
      // Count named sounds
      Object.keys(this.sounds[category]).forEach(name => {
        if (typeof this.sounds[category][name] === 'object' && !Array.isArray(this.sounds[category][name])) {
          count++;
        }
        // Count array sounds
        else if (Array.isArray(this.sounds[category][name])) {
          count += this.sounds[category][name].length;
        }
      });
      
      this.logger.info('audio', `${category.toUpperCase()} sounds loaded: ${count}`);
    });
    
    // Log loaded catchphrases
    let catchphraseCount = 0;
    Object.keys(this.catchphrases).forEach(country => {
      catchphraseCount += this.catchphrases[country].length;
      this.logger.debug('audio', `Catchphrases for ${country}: ${this.catchphrases[country].length}`);
    });
    this.logger.info('audio', `Total catchphrases loaded: ${catchphraseCount}`);
    
    this.logger.info('audio', '========================');
  }
}
  
window.AudioManager = AudioManager;
