class AudioManager {
  /**
   * Create a new AudioManager instance
   */
  constructor() {
    // Device detection - do this once
    this.isMobile = this._isMobileDevice();
    this.isIOS = this._isIOSDevice();
    this.lowMemoryDevice = this._isLowMemoryDevice();
    this.slowConnection = this._detectSlowConnection();

    // Debug and initialization tracking
    this.debugInfo = {
      audioContextCreated: false,
      criticalSoundsLoaded: false,
      playAttempts: 0,
      firstPlayTimestamp: 0,
      resumeAttempts: 0,
    };

    // Audio state
    this.audioContextRunning = false;
    this.initialized = false;
    this.muted = false;
    this.volume = 1.0;
    this.gameSpeed = 1.0;

    // Base delay configuration
    this.baseDelays = {
      catchphrase: 300,
      grabWarning: 500,
      protest: 350,
      sobToProtest: 200,
    };

    // Adjust configs based on device capabilities
    if (this.slowConnection) {
      console.log("[AUDIO] Slow connection detected, optimizing audio loading");
      this._adjustForSlowConnection();
    }

    // Adjust paths for mobile
    if (this.isMobile) {
      this._adjustPathsForMobile();
    }

    // Enhanced priority for critical sounds - making slap sounds highest priority
    this.soundPriorities = {
      immediate: ["slap1", "slap2", "slap3", "slap4"], // Highest priority for immediate response
      critical: ["click", "gameStart", "trumpGrabbing1", "grabWarning"],
      important: ["partialAnnex1", "fullAnnex1", "stopHim", "smackThatHand", "been-very-nice-to-you"],
      background: [], // Will be filled with remaining sounds
    };

    // Sound structure - organized by purpose
    this.sounds = {
      ui: {},
      trump: {
        trumpGrabbing: [],
        partialAnnexCry: [],
        fullAnnexCry: [],
        trumpVictorySounds: [],
        trumpSob: [],
      },
      defense: {
        slap: [],
        peopleSayNo: {
          eastCanadaSaysNo: [],
          westCanadaSaysNo: [],
          mexicoSaysNo: [],
          greenlandSaysNo: [],
        },
        protestors: {
          eastCanadaProtestors: null,
          westCanadaProtestors: null,
          mexicoProtestors: null,
          greenlandProtestors: null,
          usaProtestors: null,
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

    // Direct cache for critical sounds to avoid lookup overhead
    this._criticalSoundsCache = {};

    // Audio files catalog
    this.soundFiles = {
      ui: {
        click: "click.mp3",
        gameStart: "gameStart.mp3",
        gameOver: "gameOver.mp3",
        win: "resistanceWins.mp3",
        lose: "resistanceLoses.mp3",
        grabWarning: "grabWarning.mp3",
        resistance: "resistance.mp3",
        instruction1: "instruction1.mp3",
        instruction2: "instruction2.mp3",
        instruction3: "instruction3.mp3",
        instruction: "instruction.mp3",
        aliens: "aliens.mp3",
        musk: "musk.mp3",
        growProtestors: "growProtestors.mp3",
        stopHim: "stop-him.mp3",
        smackThatHand: "smack-that-hand.mp3",
        faster: "faster.mp3",
        oopsieTradeWar: "oopsie-trade-war.mp3",
        noOneIsComingToSaveUs: "no-one-is-coming-to-save-us.mp3",
        getUpAndFight: "get-up-and-fight.mp3",
        readySetGo: "ready-set-go.mp3",
        help: "help.mp3",
        wrong: "wrong.mp3",
        uhhuh: "uhhuh.mp3",
      },
      trump: {
        trumpGrabbing1: ["trumpGrabbing1.mp3"],
        partialAnnexCry: ["partialAnnex1.mp3", "partialAnnex2.mp3", "partialAnnex3.mp3"],
        fullAnnexCry: ["fullAnnex1.mp3", "fullAnnex2.mp3", "fullAnnex3.mp3"],
        trumpVictorySounds: ["victory1.mp3", "victory2.mp3", "victory3.mp3"],
        trumpSob: ["trumpSob1.mp3", "trumpSob2.mp3"],
        trumpYa: ["ya.mp3", "great.mp3", "mmhmn.mp3"],
        beenVeryNiceToYou: "been-very-nice-to-you.mp3",
        shrink: "no.mp3",
        finalShrink: "ouchie.mp3",
      },
      resistance: {
        canada: ["canadaResist1.mp3", "canadaResist2.mp3", "canadaResist3.mp3"],
        mexico: ["mexicoResist1.mp3", "mexicoResist2.mp3", "mexicoResist3.mp3"],
        greenland: ["greenlandResist1.mp3", "greenlandResist2.mp3", "greenlandResist3.mp3"],
        usa: ["greenlandResist1.mp3", "greenlandResist2.mp3"],
      },
      defense: {
        slap: ["slap1.mp3", "slap2.mp3", "slap3.mp3", "slap4.mp3"],
        peopleSayNo: {
          eastCanadaSaysNo: [
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
          westCanadaSaysNo: [
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
          ],
          mexicoSaysNo: [
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
            "protestMex19.mp3",
            "protestMex20.mp3",
            "protestMex21.mp3",
            "protestMex22.mp3",
          ],
          greenlandSaysNo: [
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
          eastCanadaProtestors: ["protestorsEastCan1.mp3"],
          westCanadaProtestors: ["protestorsEastCan1.mp3"],
          mexicoProtestors: ["protestorsEastCan1.mp3"],
          greenlandProtestors: ["protestorsEastCan1.mp3"],
          usaProtestors: ["protestorsEastCan1.mp3"],
        },
      },
      particles: {
        freedom: ["freedomSpark1.mp3", "freedomSpark2.mp3", "freedomSpark3.mp3"],
      },
      music: {
        background: "background-music.mp3",
      },
    };

    // Catchphrase sound files - maintained for compatibility
    this.trumpShoutsAtACountry = {
      canada: ["trumpShoutsAtCanada1.mp3", "trumpShoutsAtCanada2.mp3", "trumpShoutsAtCanada3.mp3", "trumpShoutsAtCanada4.mp3"],
      mexico: ["trumpShoutsAtMexico1.mp3", "trumpShoutsAtMexico2.mp3", "trumpShoutsAtMexico3.mp3"],
      greenland: ["trumpShoutsAtGreenland1.mp3", "trumpShoutsAtGreenland2.mp3", "trumpShoutsAtGreenland3.mp3", "trumpShoutsAtGreenland4.mp3"],
      generic: ["trumpShoutsAtAnyone1.mp3", "trumpShoutsAtAnyone2.mp3", "trumpShoutsAtAnyone3.mp3"],
    };

    // Unified tracking system
    this.shuffleTracking = {
      indices: {},
      arrays: {},
    };
    
    // Centralized sound tracking
    this.loadedSounds = new Set(); // Track loaded sounds
    this.loadingPromises = {}; // Track loading promises to avoid duplicate loading
    this.currentlyPlaying = []; // Track currently playing sounds

    // Dedicated pre-loaded slap sound cache for immediate playback
    this._instantSlapSounds = [];

    // Playback state
    this.backgroundMusic = null;
    this.backgroundMusicPlaying = false;
    this.activeProtestorSounds = {};

    // Grab sound state
    this.activeGrabSound = null;
    this.grabVolumeInterval = null;
    this.currentGrabVolume = 0.2;
    this.maxGrabVolume = 1.0;
    this.grabVolumeStep = 0.05;

    // Sound path - will be adjusted during initialization
    this.soundPath = "sounds/";

    // Set up fade interval tracking
    this._fadeIntervals = {};

    // Set up audio context
    this._setupAudioContext();

    // Create primed audio pool
    if (!window._primedAudioPool) {
      window._primedAudioPool = [];
      this._prepareAudioPool(8); // Increased pool size for better immediate playback
    }

    // Prepare asset loader
    this._prepareAssetLoader();
  }

  /**
   * Initialize the audio manager
   */
  init() {
    if (this.initialized) return;

    // Resume existing AudioContext instead of creating a new one
    this.resumeAudioContext();

    // Adjust sound path for mobile devices (if not done in constructor)
    if (this.isMobile && !this.soundPath.startsWith(window.location.origin)) {
      this._adjustPathsForMobile();
    }

    this.initialized = true;

    // Start loading sounds with prioritization
    this._loadSoundsByPriority();
  }

  /**
   * Set up the audio context with proper fallbacks
   */
  _setupAudioContext() {
    // Don't create a new context if one already exists
    if (this.audioContext) return;
    
    try {
      // Only create AudioContext if one doesn't exist globally
      if (!window.sharedAudioContext) {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.sharedAudioContext = new AudioContext();
      }
      this.audioContext = window.sharedAudioContext;

      this.debugInfo.audioContextCreated = true;
    } catch (e) {
      console.warn("[AUDIO] Web Audio API not supported:", e.message);
      this.audioContext = null;
    }
  }

  /**
   * Resume the audio context (needed for user interaction on mobile)
   */
  resumeAudioContext() {
    if (!this.audioContext) {
      return Promise.resolve(false);
    }

    // Avoid unnecessary work if already running
    if (this.audioContextRunning && this.audioContext.state === "running") {
      return Promise.resolve(true);
    }

    if (this.audioContext.state === "suspended") {
      this.debugInfo.resumeAttempts++;

      return this.audioContext
        .resume()
        .then(() => {
          this.audioContextRunning = true;

          // If no sounds loaded, try loading critical sounds
          if (this.loadedSounds.size === 0) {
            this.preloadCriticalSounds();
          }
          return true;
        })
        .catch((err) => {
          console.error("[AUDIO] Failed to resume AudioContext:", err);
          return false;
        });
    }

    this.audioContextRunning = true;
    return Promise.resolve(true);
  }

  /**
   * Unlock audio playback (especially for iOS)
   */
  unlock() {
    // First try to resume the AudioContext
    return this.resumeAudioContext().then((contextResult) => {
      // For iOS, try the silent sound approach as well
      if (this.isIOS) {
        return this._unlockWithSilentSound().then((silentResult) => {
          return contextResult || silentResult;
        });
      }
      return contextResult;
    });
  }

  /**
   * Unlock audio on iOS using a silent sound
   */
  _unlockWithSilentSound() {
    return new Promise((resolve) => {
      try {
        // Use a data URI for guaranteed availability
        const silentSound = new Audio(
          "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAADAABgYGBgYGBgYGBgkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDA4ODg4ODg4ODg4ODg//////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAAAwDVxttG//sUxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
        );

        silentSound.volume = 0.01;
        const playPromise = silentSound.play();

        if (playPromise instanceof Promise) {
          playPromise
            .then(() => {
              setTimeout(() => {
                silentSound.pause();
                silentSound.src = "";
                resolve(true);
              }, 100);
            })
            .catch(() => {
              resolve(false);
            });
        } else {
          setTimeout(() => {
            silentSound.pause();
            resolve(true);
          }, 100);
        }
      } catch (e) {
        console.warn("[AUDIO] Error creating silent sound:", e.message);
        resolve(false);
      }
    });
  }

  /**
   * Configure audio for slow connections
   */
  _adjustForSlowConnection() {
    // Reduce sound priorities to load fewer sounds
    this.soundPriorities.background = this.soundPriorities.background.slice(0, 5);

    // Increase delays between loading
    this.baseDelays = {
      catchphrase: 500,
      grabWarning: 700,
      protest: 500,
      sobToProtest: 300,
    };
  }

  /**
   * Detect if the connection is slow
   */
  _detectSlowConnection() {
    // Check if we're on a slow connection
    if (navigator.connection) {
      // Use Network Information API if available
      const conn = navigator.connection;
      if (
        conn.type === "cellular" ||
        conn.effectiveType === "slow-2g" ||
        conn.effectiveType === "2g" ||
        conn.effectiveType === "3g" ||
        conn.saveData === true
      ) {
        return true;
      }
    }

    // Fallback detection based on user agent and device
    if (this.isMobile && !navigator.onLine) {
      return true;
    }

    return false;
  }

  /**
   * Detect if the device is a mobile device
   */
  _isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Detect if the device is an iOS device
   */
  _isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  /**
   * Detect if the device has low memory
   */
  _isLowMemoryDevice() {
    // Detect older/lower-end devices
    return (
      /Android 4\.|Android 5\.0|Android 5\.1/.test(navigator.userAgent) ||
      /iPhone; CPU iPhone OS (8_|9_|10_)/.test(navigator.userAgent) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 2)
    );
  }

  /**
   * Adjust sound paths for mobile devices
   */
  _adjustPathsForMobile() {
    // Use absolute paths for mobile
    const baseUrl = window.location.origin + window.location.pathname;
    this.soundPath = baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1) + "sounds/";
  }

  /**
   * Resolve a sound file path
   */
  resolvePath(filename) {
    // Handle invalid inputs safely
    if (!filename) {
      return "";
    }

    // Handle arrays as a safety backup
    if (Array.isArray(filename)) {
      if (filename.length > 0) {
        filename = filename[0];
      } else {
        return "";
      }
    }

    // Ensure filename is a string
    if (typeof filename !== "string") {
      return "";
    }

    // For absolute URLs, return as is
    if (filename.startsWith("http") || filename.startsWith("/") || filename.startsWith("data:")) {
      return filename;
    }

    // Ensure sound path ends with a slash
    const path = this.soundPath.endsWith("/") ? this.soundPath : this.soundPath + "/";
    return path + filename;
  }

  /**
   * Prepare the audio pool for reuse
   */
  _prepareAudioPool(count) {
    for (let i = 0; i < count; i++) {
      const audio = new Audio();
      audio.preload = "auto";
      window._primedAudioPool.push(audio);
    }
  }

  /**
   * Prime the audio pool for immediate playback
   */
  primeAudioPool(options = {}) {
    // Create the audio pool if it doesn't exist
    window._primedAudioPool = window._primedAudioPool || [];

    // Only play the click sound if not specifically disabled
    if (!options.skipClickSound) {
      const clickAudio = new Audio(this.resolvePath("click.mp3"));
      clickAudio.volume = 0.3;

      clickAudio
        .play()
        .then(() => {
          // Return to pool after it's done
          clickAudio.onended = () => {
            window._primedAudioPool.push(clickAudio);
          };
        })
        .catch(() => {
          // Silently fail
        });
    }

    // Pre-load all slap sounds for immediate playback
    this._preloadInstantSlapSounds();

    // Prepare the background music
    const bgMusic = new Audio(this.resolvePath("background-music.mp3"));
    bgMusic.preload = "auto";
    bgMusic.load();
    window._primedAudioPool.push(bgMusic);

    // Load critical sounds in order of importance
    this.preloadCriticalSounds();

    // Add generic audio elements
    for (let i = 0; i < 5; i++) {
      const audio = new Audio();
      window._primedAudioPool.push(audio);
    }

    return true;
  }

  /**
   * Prepare asset loader and catalog all sound paths
   */
  _prepareAssetLoader() {
    // Build a complete list of all asset paths
    this._allSoundPaths = new Set();
    this._flattenSoundFiles(this.soundFiles, this._allSoundPaths);
    this._flattenSoundFiles(this.trumpShoutsAtACountry, this._allSoundPaths);

    // Populate the background priority with all sounds not in other categories
    this._populateBackgroundSounds();
  }

  /**
   * Flatten nested sound files into a set of paths
   */
  _flattenSoundFiles(obj, pathSet, prefix = "") {
    if (!obj) return;

    if (typeof obj === "string") {
      pathSet.add(prefix + obj);
      return;
    }

    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        if (typeof item === "string") {
          pathSet.add(prefix + item);
        }
      });
      return;
    }

    // Object - recursively process
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        this._flattenSoundFiles(obj[key], pathSet, prefix);
      }
    }
  }

  /**
   * Populate background sounds list with non-priority sounds
   */
  _populateBackgroundSounds() {
    // Flatten all priority sounds into sets for quick lookup
    const immediateSet = new Set(this.soundPriorities.immediate);
    const criticalSet = new Set(this.soundPriorities.critical);
    const importantSet = new Set(this.soundPriorities.important);

    // For each sound path, check if it's in the priority lists
    this._allSoundPaths.forEach((path) => {
      // Extract base filename without path
      const baseName = path.split("/").pop();

      // If it's not already a priority sound, add to background list
      if (!immediateSet.has(baseName) && !criticalSet.has(baseName) && !importantSet.has(baseName)) {
        this.soundPriorities.background.push(baseName);
      }
    });
  }

  /**
   * Load sounds by priority tier
   */
  _loadSoundsByPriority() {
    // Only load immediate/critical sounds first
    this._loadPrioritySounds("immediate");

    // Increase delay between critical and important sounds
    setTimeout(() => {
      this.preloadCriticalSounds();
    }, 100);

    // Much longer delay for less important sounds on mobile
    const importantDelay = this.isMobile ? 2000 : 800;
    setTimeout(() => {
      this._loadPrioritySounds("important");
    }, importantDelay);

    // Background sounds should load much later, especially on mobile
    const backgroundDelay = this.isMobile ? 5000 : 3000;
    setTimeout(() => {
      this._loadPrioritySounds("background", true);
    }, backgroundDelay);
  }

  /**
   * Load sounds of a specific priority group
   */
  _loadPrioritySounds(priorityGroup, slowLoading = false) {
    const sounds = this.soundPriorities[priorityGroup] || [];

    sounds.forEach((soundName, index) => {
      // If slow loading, add delay proportional to index
      const delay = slowLoading ? index * 100 : 0;

      setTimeout(() => {
        this._loadSoundByName(soundName);
      }, delay);
    });
  }

  /**
   * Preload critical game sounds
   */
  preloadCriticalSounds() {
    if (this.debugInfo.criticalSoundsLoaded) return;

    // Ensure we're keeping track with a flag
    this.debugInfo.criticalSoundsLoaded = true;

    // Preload slap sounds first (highest priority)
    for (let i = 0; i < this.soundFiles.defense.slap.length; i++) {
      this._loadSoundWithPromise("defense", "slap", i);
    }

    // Define and load other critical sounds
    const criticalPairs = [
      ["ui", "click"],
      ["ui", "gameStart"],
      ["ui", "grabWarning"],
      ["trump", "trumpGrabbing", 0],
      ["music", "background"],
    ];

    // Load critical sounds in parallel but with controlled promises
    Promise.all(
      criticalPairs.map((pair) => {
        return this._loadSoundWithPromise(...pair);
      })
    )
      .then(() => {
        // After critical sounds, load important sounds needed in first minute
        setTimeout(() => {
          // Important feedback sounds
          this._loadSoundWithPromise("trump", "partialAnnexCry", 0);
          this._loadSoundWithPromise("trump", "trumpSob", 0);
          this._loadSoundWithPromise("trump", "trumpYa", 0);
        }, 500);
      })
      .catch((error) => {
        console.warn("[AUDIO] Error in critical sound loading:", error);
      });
  }

  /**
   * Preload slap sounds for instant playback
   */
  _preloadInstantSlapSounds() {
    // Clear any existing cached slap sounds
    this._instantSlapSounds = [];

    // Preload all slap sounds with high priority
    this.soundFiles.defense.slap.forEach((slapFile, index) => {
      const slapAudio = new Audio(this.resolvePath(slapFile));
      slapAudio.preload = "auto";

      // Set up load handler
      slapAudio.oncanplaythrough = () => {
        // Store in both regular sound structure and instant cache
        if (!this.sounds.defense.slap) {
          this.sounds.defense.slap = [];
        }
        this.sounds.defense.slap[index] = slapAudio;

        // Add to dedicated instant cache
        this._instantSlapSounds.push(slapAudio);

        // Mark as loaded
        this.loadedSounds.add(`defense.slap.${index}`);
      };

      // Force load
      slapAudio.load();
    });
  }

  /**
   * Get or create an audio element from the pool
   */
  _getOrCreatePrimedAudio() {
    // Make sure pool exists
    if (!window._primedAudioPool) {
      window._primedAudioPool = [];
    }

    // Get audio from pool or create new
    const audio = window._primedAudioPool.length > 0 ? window._primedAudioPool.pop() : new Audio();

    // Reset ALL properties including volume and src to prevent lingering issues
    audio.loop = false;
    audio.muted = false;
    audio.currentTime = 0;
    audio.volume = 1.0;
    audio.playbackRate = 1.0;

    // Reset src on mobile to avoid caching issues with previous audio
    if (this.isMobile) {
      audio.src = "";
    }

    return audio;
  }

  /**
   * Set up an audio element with standard properties
   */
  _setupAudioElement(audio, options = {}) {
    if (!audio) return audio;
    
    // Apply standard properties
    audio.loop = options.loop || false;
    audio.muted = this.muted;
    audio.volume = options.volume !== undefined ? options.volume : this.volume;
    audio.playbackRate = options.playbackRate || 1.0;
    
    // Reset playback position if requested
    if (options.resetPosition) {
      audio.currentTime = 0;
    }
    
    return audio;
  }

  /**
   * Load a sound by name
   */
  _loadSoundByName(name) {
    // Helper function to extract filename from path
    const getFilename = (path) => path.split("/").pop();

    // First check defense sounds - specifically slap which is critical
    if (Array.isArray(this.soundFiles.defense.slap)) {
      for (let i = 0; i < this.soundFiles.defense.slap.length; i++) {
        const path = this.soundFiles.defense.slap[i];
        if (getFilename(path) === name) {
          this.loadSound("defense", "slap", i);
          return;
        }
      }
    }

    // Check UI sounds
    for (const soundName in this.soundFiles.ui) {
      const filename = getFilename(this.soundFiles.ui[soundName]);
      if (filename === name || soundName === name) {
        this.loadSound("ui", soundName);
        return;
      }
    }

    // Check trump sounds
    for (const category in this.soundFiles.trump) {
      if (Array.isArray(this.soundFiles.trump[category])) {
        this.soundFiles.trump[category].forEach((path, index) => {
          if (getFilename(path) === name) {
            this.loadSound("trump", category, index);
            return;
          }
        });
      } else if (getFilename(this.soundFiles.trump[category]) === name) {
        this.loadSound("trump", category);
        return;
      }
    }

    // Check music
    for (const soundName in this.soundFiles.music) {
      const filename = getFilename(this.soundFiles.music[soundName]);
      if (filename === name || soundName === name) {
        this.loadSound("music", soundName);
        return;
      }
    }
  }

  /**
   * Load a sound with promise tracking
   */
/**
   * Load a sound with promise tracking
   */
_loadSoundWithPromise(category, name, index = null) {
  // Create a unique key for this sound
  const soundKey = index !== null ? `${category}.${name}.${index}` : `${category}.${name}`;

  // Don't reload if already loaded or loading
  if (this.loadedSounds.has(soundKey)) {
    return Promise.resolve(true);
  }

  if (this.loadingPromises[soundKey]) {
    return this.loadingPromises[soundKey];
  }

  // Create and track the loading promise
  const loadPromise = new Promise((resolve, reject) => {
    try {
      let soundPath;
      let destination;

      if (index !== null) {
        // Array sound (like trump.grab[0])
        if (!this.soundFiles[category] || !this.soundFiles[category][name] || !this.soundFiles[category][name][index]) {
          return resolve(false);
        }

        soundPath = this.soundFiles[category][name][index];

        // Make sure the array exists
        if (!this.sounds[category][name]) {
          this.sounds[category][name] = [];
        }

        destination = this.sounds[category][name];
      } else {
        // Named sound (like ui.click)
        if (!this.soundFiles[category] || !this.soundFiles[category][name]) {
          return resolve(false);
        }

        soundPath = this.soundFiles[category][name];
        destination = this.sounds[category];
      }

      // Get an audio element (from pool if available)
      const audio = this._getOrCreatePrimedAudio();
      audio.preload = "auto";

      // Track load success
      audio.oncanplaythrough = () => {
        if (index !== null) {
          // Push to array
          destination[index] = audio;
        } else {
          // Set named property
          destination[name] = audio;
        }

        this.loadedSounds.add(soundKey);
        delete this.loadingPromises[soundKey];

        // Special handling for slap sounds - add to instant cache
        if (category === "defense" && name === "slap") {
          if (!this._instantSlapSounds) {
            this._instantSlapSounds = [];
          }
          this._instantSlapSounds.push(audio);
        }

        // Add to critical cache if it's a critical sound
        const filename = soundPath.split("/").pop();
        if (
          this.soundPriorities.immediate.includes(filename) ||
          this.soundPriorities.critical.includes(filename) ||
          this.soundPriorities.critical.includes(name)
        ) {
          this._criticalSoundsCache[name] = audio;
        }

        resolve(true);
      };

      // Error handler
      audio.onerror = (e) => {
        console.error(`[AUDIO] Error loading sound ${soundPath}`);
        delete this.loadingPromises[soundKey];
        resolve(false); // Resolve with false instead of reject to avoid breaking promise chains
      };

      // Set source and load
      audio.src = this.resolvePath(soundPath);
      audio.load();
    } catch (error) {
      console.error(`[AUDIO] Error in sound loading: ${error.message}`);
      delete this.loadingPromises[soundKey];
      resolve(false);
    }
  });

  // Store the promise for future reference
  this.loadingPromises[soundKey] = loadPromise;

  return loadPromise;
}

/**
 * Load a sound into the cache
 */
loadSound(category, name, index = null) {
  // Create a unique key for tracking loaded sounds
  const soundKey = index !== null ? `${category}.${name}.${index}` : `${category}.${name}`;

  // Skip if already loaded
  if (this.loadedSounds.has(soundKey)) {
    return null;
  }

  let soundPath;
  let destination;

  try {
    if (index !== null) {
      // Array sound (like trump.grab[0])
      if (!this.soundFiles[category] || !this.soundFiles[category][name] || !this.soundFiles[category][name][index]) {
        return null;
      }

      soundPath = this.soundFiles[category][name][index];

      // Make sure the array exists
      if (!this.sounds[category][name]) {
        this.sounds[category][name] = [];
      }

      destination = this.sounds[category][name];
    } else {
      // Named sound (like ui.click)
      if (!this.soundFiles[category] || !this.soundFiles[category][name]) {
        return null;
      }

      soundPath = this.soundFiles[category][name];
      destination = this.sounds[category];
    }

    // Create and load the audio (try to get from pool)
    const audio = this._getOrCreatePrimedAudio();
    audio.preload = "auto";

    // Track load success
    audio.oncanplaythrough = () => {
      if (index !== null) {
        // Store in array
        if (index >= destination.length) {
          // Fill array up to this index
          for (let i = destination.length; i < index; i++) {
            destination[i] = null;
          }
          destination[index] = audio;
        } else {
          destination[index] = audio;
        }
      } else {
        // Store as property
        destination[name] = audio;
      }

      this.loadedSounds.add(soundKey);

      // Special handling for slap sounds - add to instant cache
      if (category === "defense" && name === "slap") {
        if (!this._instantSlapSounds) {
          this._instantSlapSounds = [];
        }
        this._instantSlapSounds.push(audio);
      }

      // Add to critical cache if it's critical
      const filename = soundPath.split("/").pop();
      if (
        this.soundPriorities.immediate.includes(filename) ||
        this.soundPriorities.critical.includes(filename) ||
        this.soundPriorities.critical.includes(name)
      ) {
        this._criticalSoundsCache[name] = audio;
      }
    };

    // Error handler
    audio.onerror = (e) => {
      console.error(`[AUDIO] Error loading sound ${soundPath}`);
    };

    // Set source and load
    audio.src = this.resolvePath(soundPath);
    audio.load();

    return audio;
  } catch (error) {
    console.error(`[AUDIO] Error loading sound: ${error.message}`);
    return null;
  }
}

/**
 * Load a catchphrase sound
 */
loadCatchphrase(country, index) {
  const soundKey = `catchphrase.${country}.${index}`;

  if (this.loadedSounds.has(soundKey)) {
    return null;
  }

  if (!this.trumpShoutsAtACountry || !this.trumpShoutsAtACountry[country] || !this.trumpShoutsAtACountry[country][index]) {
    return null;
  }

  try {
    // Ensure the country array exists
    if (!this.catchphrases) {
      this.catchphrases = {};
    }

    if (!this.catchphrases[country]) {
      this.catchphrases[country] = [];
    }

    const soundPath = this.trumpShoutsAtACountry[country][index];
    const audio = this._getOrCreatePrimedAudio();
    audio.preload = "auto";
    audio.src = this.resolvePath(soundPath);

    audio.oncanplaythrough = () => {
      this.catchphrases[country][index] = audio;
      this.loadedSounds.add(soundKey);
    };

    audio.load();
    return audio;
  } catch (error) {
    console.error(`[AUDIO] Error loading catchphrase: ${error.message}`);
    return null;
  }
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
_shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get a shuffled sound from a category
 */
_getShuffledSound(category, subcategory, country = null) {
  // Determine which array to use
  let soundArray;
  let soundKey;

  try {
    if (category === "particles" && subcategory === "freedom") {
      soundArray = this.soundFiles.particles?.freedom;
      soundKey = "particles.freedom";
    } else if (country && subcategory === "peopleSayNo") {
      // Handle protest sounds with country name + "SaysNo"
      const countrySaysNo = country.endsWith("SaysNo") ? country : country + "SaysNo";
      soundArray = this.soundFiles.defense?.peopleSayNo?.[countrySaysNo];
      soundKey = `defense.peopleSayNo.${countrySaysNo}`;
    } else if (category === "resistance" && subcategory) {
      soundArray = this.soundFiles.resistance?.[subcategory];
      soundKey = `resistance.${subcategory}`;
    } else if (category === "catchphrase") {
      soundArray = this.trumpShoutsAtACountry?.[subcategory] || this.trumpShoutsAtACountry?.generic;
      soundKey = `catchphrase.${subcategory}`;
    } else if (category === "trump" && subcategory) {
      soundArray = this.soundFiles.trump?.[subcategory];
      soundKey = `trump.${subcategory}`;
    } else if (this.soundFiles?.[category]?.[subcategory]) {
      soundArray = this.soundFiles[category][subcategory];
      soundKey = `${category}.${subcategory}`;
    }

    // If no sounds available, return null
    if (!soundArray || soundArray.length === 0) {
      return null;
    }

    // If not an array, just return it directly
    if (!Array.isArray(soundArray)) {
      return soundArray;
    }

    // If only one sound in array, return that
    if (soundArray.length === 1) {
      return soundArray[0];
    }

    // If we don't have a shuffled array for this sound category yet, create one
    if (!this.shuffleTracking.arrays[soundKey]) {
      // Create an array of indices
      const indices = Array.from({ length: soundArray.length }, (_, i) => i);

      // Shuffle the indices
      this.shuffleTracking.arrays[soundKey] = this._shuffleArray(indices);
      this.shuffleTracking.indices[soundKey] = 0;
    }

    // Get the current position in the shuffled array
    const position = this.shuffleTracking.indices[soundKey] || 0;

    // Get the index from the shuffled array
    const soundIndex = this.shuffleTracking.arrays[soundKey][position];

    // Increment position
    this.shuffleTracking.indices[soundKey] = (position + 1) % soundArray.length;

    // Return a single sound file path
    return soundArray[soundIndex];
  } catch (error) {
    // Fallback: if we can get the first sound from the array, return that
    if (Array.isArray(soundArray) && soundArray.length > 0) {
      return soundArray[0];
    }

    return null;
  }
}

/**
 * Play a sound
 */
play(category, name, volume = null) {
  if (!this.initialized || this.muted) return Promise.resolve(null);

  this.debugInfo.playAttempts++;
  if (!this.debugInfo.firstPlayTimestamp) {
    this.debugInfo.firstPlayTimestamp = Date.now();
  }

  // Special fast path for slap sounds - highest priority for immediate response
  if (category === "defense" && name === "slap") {
    // Don't wait for audio context or promises for slap sounds
    // Return the result directly, not wrapped in a promise
    return Promise.resolve(this._playInstantSlap(volume));
  }

  // Resume AudioContext first (crucial for mobile)
  return this.resumeAudioContext().then(() => {
    // FAST PATH: Check critical sounds cache first for immediate playback
    if (this._criticalSoundsCache[name]) {
      const criticalSound = this._criticalSoundsCache[name];
      return this._playAudioElement(criticalSound, volume);
    }

    // Check if the sound exists in our cache
    if (this.sounds[category] && this.sounds[category][name]) {
      const sound = this.sounds[category][name];
      return this._playAudioElement(sound, volume);
    }

    // Not in cache - need to check if we need to load it
    if (!this.loadedSounds.has(`${category}.${name}`)) {
      // If high priority sound, load immediately
      const isHighPriority =
        this.soundPriorities.immediate.includes(name) ||
        this.soundPriorities.critical.includes(name) ||
        this.soundPriorities.important.includes(name);

      if (isHighPriority) {
        // Load then play immediately
        return this._loadSoundWithPromise(category, name).then(() => {
          if (this.sounds[category] && this.sounds[category][name]) {
            return this._playAudioElement(this.sounds[category][name], volume);
          } else {
            // Fall back to direct method
            return this.playDirect(this.soundFiles[category][name], volume);
          }
        });
      } else {
        // For low priority, load in background but play direct now
        this.loadSound(category, name);
        return Promise.resolve(this.playDirect(this.soundFiles[category][name], volume));
      }
    }

    // Fall back to direct play
    return Promise.resolve(this.playDirect(this.soundFiles[category][name], volume));
  });
}

/**
 * Play a sound from a randomly selected file within a category
 */
playRandom(category, subcategory, country = null, volume = null) {
  if (!this.initialized || this.muted) return null;

  // Determine which file to play using the shuffle system
  const soundFile = this._getShuffledSound(category, subcategory, country);
  if (!soundFile) return null;

  // Special fast-path for slap sounds
  if (category === "defense" && subcategory === "slap") {
    return this._playInstantSlap(volume);
  }

  // Play directly for reliability (especially on mobile)
  return this.playDirect(soundFile, volume);
}

/**
 * Play an audio element immediately
 */
_playAudioElement(audioElement, volume = null) {
  if (!audioElement || typeof audioElement.play !== "function") {
    return Promise.resolve(null);
  }

  // Reset and play
  audioElement.currentTime = 0;
  audioElement.volume = volume !== null ? volume : this.volume;

  try {
    const playPromise = audioElement.play();

    // Add to currently playing
    this.currentlyPlaying.push(audioElement);

    if (playPromise !== undefined) {
      return playPromise.catch((error) => {
        // Remove from currently playing if failed
        const index = this.currentlyPlaying.indexOf(audioElement);
        if (index !== -1) {
          this.currentlyPlaying.splice(index, 1);
        }

        // Fall back to direct method
        if (error.name === "NotAllowedError") {
          // This is likely due to user interaction requirement
          // Return direct play as fallback
          return this.playDirect(audioElement.src, volume);
        }

        return null;
      });
    }

    return Promise.resolve(audioElement);
  } catch (e) {
    // Remove from currently playing if failed
    const index = this.currentlyPlaying.indexOf(audioElement);
    if (index !== -1) {
      this.currentlyPlaying.splice(index, 1);
    }

    // Try direct play as fallback
    return Promise.resolve(this.playDirect(audioElement.src, volume));
  }
}

/**
 * Play a slap sound with optimized path for instant response
 */
_playInstantSlap(volume = null) {
  // If we have instant slap sounds ready
  if (this._instantSlapSounds && this._instantSlapSounds.length > 0) {
    // Get a random slap sound from the pre-loaded cache
    const randomIndex = Math.floor(Math.random() * this._instantSlapSounds.length);
    const slapSound = this._instantSlapSounds[randomIndex];

    if (slapSound) {
      // Clone the audio element for immediate playback
      // This is a technique to avoid waiting for previous playback to finish
      const clonedSlap = slapSound.cloneNode();
      clonedSlap.volume = volume !== null ? volume : this.volume;

      // CRITICAL CHANGE: Play without awaiting promises or audio context resuming
      try {
        clonedSlap.play();
      } catch (e) {
        // Silent catch - we'll proceed anyway
      }

      // Add to currently playing
      this.currentlyPlaying.push(clonedSlap);

      // Set up cleanup handler
      clonedSlap.onended = () => {
        const index = this.currentlyPlaying.indexOf(clonedSlap);
        if (index !== -1) {
          this.currentlyPlaying.splice(index, 1);
        }

        // Clean up this temporary clone
        clonedSlap.onended = null;
      };

      return clonedSlap;
    }
  }

  // Fall back to direct method if instant cache isn't available
  const slapPath = this.soundFiles.defense.slap[0];
  return this.playDirect(slapPath, volume);
}

/**
 * Play a sound directly (create a new audio element)
 */
playDirect(soundPath, volume = null) {
  if (!this.initialized || this.muted) return null;

  try {
    // Get an audio element from pool
    const audio = this._getOrCreatePrimedAudio();

    // Set properties
    audio.loop = false;
    audio.muted = false;
    audio.currentTime = 0;

    // Set source and volume
    audio.src = this.resolvePath(soundPath);
    audio.volume = volume !== null ? volume : this.volume;

    // Add to tracking
    this.currentlyPlaying.push(audio);

    // Set up ended handler for cleanup
    audio.onended = () => {
      // Remove from playing list
      const index = this.currentlyPlaying.indexOf(audio);
      if (index !== -1) {
        this.currentlyPlaying.splice(index, 1);
      }

      // Clear the callback to prevent memory leaks
      audio.onended = null;

      // Reset audio element
      audio.pause();
      audio.currentTime = 0;
      audio.src = "";

      // Return to pool
      if (window._primedAudioPool) {
        window._primedAudioPool.push(audio);
      }
    };

    // Play it
    const playPromise = audio.play();

    if (playPromise) {
      playPromise.catch(() => {
        // Remove from currently playing on failure
        const index = this.currentlyPlaying.indexOf(audio);
        if (index !== -1) {
          this.currentlyPlaying.splice(index, 1);
        }

        // Return to pool
        if (window._primedAudioPool) {
          window._primedAudioPool.push(audio);
        }
      });
    }

    return audio;
  } catch (e) {
    return null;
  }
}



playProtestorSound(country, volume = 0.5) {
  console.log("playing protestor sound, country is " + country);
  
  if (this.muted) return null;

  // STOP any existing sound for this country first
  this.stopProtestorSound(country);

  // if (this.isMobile || this.isIOS) {
  //   return this._playMobileProtestorSound(country, volume);
  // }

  return this.resumeAudioContext().then(() => {
    try {
      // Determine sound country (handle canada specially)
      let soundCountry = country === "canada" ? (Math.random() < 0.5 ? "eastCanada" : "westCanada") : country;

      // Validate country
      const validCountries = ["eastCanada", "westCanada", "mexico", "greenland", "usa"];
      if (!validCountries.includes(soundCountry)) {
        soundCountry = "eastCanada"; // Default fallback
      }

      const protestorKey = soundCountry + "Protestors";
      const soundFile = this.soundFiles.defense.protestors[protestorKey]?.[0];

      if (!soundFile) return null;

      // Create audio element
      const soundObj = this._getOrCreatePrimedAudio();
      soundObj.src = this.resolvePath(soundFile);
      // soundObj.loop = true; // Ensure looping < - removed this because of bugs

      // Apply volume with additional safety
      soundObj.volume = Math.min(1, Math.max(0, volume)) * this.volume;

      // Ensure activeProtestorSounds exists
      this.activeProtestorSounds = this.activeProtestorSounds || {};

      // Play and store the sound
      return soundObj
        .play()
        .then(() => {
          this.activeProtestorSounds[soundCountry] = soundObj;
          this.currentlyPlaying.push(soundObj);
          return soundObj;
        })
        .catch((e) => {
          console.warn(`[AUDIO] Protestor sound failed for ${soundCountry}:`, e);
          return null;
        });
    } catch (error) {
      console.error("[AUDIO] Protestor sound error:", error);
      return null;
    }
  });
}

/**
 * Play protestor sound optimized for mobile
 */
_playMobileProtestorSound(country, volume = 0.5) {
  console.log("play mobile protestor sound");

  // Create a new audio element each time for mobile (don't reuse)
  const soundObj = new Audio();

  // Determine sound country
  let soundCountry = country === "canada" ? (Math.random() < 0.5 ? "eastCanada" : "westCanada") : country;

  const protestorKey = soundCountry + "Protestors";
  const soundFile = this.soundFiles.defense.protestors[protestorKey]?.[0];

  if (!soundFile) return null;

  // Set source and properties
  soundObj.src = this.resolvePath(soundFile);
  // soundObj.loop = true; <- removed this vbecause of bugs
  soundObj.volume = Math.min(1, Math.max(0, volume)) * this.volume;

  // Track this sound
  this.activeProtestorSounds = this.activeProtestorSounds || {};
  this.activeProtestorSounds[soundCountry] = soundObj;
  this.currentlyPlaying.push(soundObj);

  // Play with native promise handling
  return soundObj.play().catch((e) => {
    console.warn(`[AUDIO] Mobile protestor sound failed:`, e);
    return null;
  });
}

/**
 * Stop a protestor sound for a country
 */
stopProtestorSound(country = null) {
  console.log("stop protestor sound for", country);

  // Ensure activeProtestorSounds exists
  this.activeProtestorSounds = this.activeProtestorSounds || {};

  // Special handling for canada
  const countriesToStop = country === "canada" ? ["eastCanada", "westCanada"] : country ? [country] : Object.keys(this.activeProtestorSounds);

  countriesToStop.forEach((key) => {
    this._stopSingleProtestorSound(key);
  });
}

/**
 * Stop a single protestor sound
 */
_stopSingleProtestorSound(soundCountry) {
  console.log("stop single protestor sound");

  const sound = this.activeProtestorSounds[soundCountry];

  if (sound) {
    try {
      // Force-end the sound
      sound.pause();
      sound.currentTime = 0;
      sound.src = ""; // Completely unload the audio

      // Remove from currently playing
      const index = this.currentlyPlaying.findIndex((s) => s === sound);
      if (index !== -1) {
        this.currentlyPlaying.splice(index, 1);
      }
    } catch (e) {
      console.warn(`[AUDIO] Error stopping protestor sound for ${soundCountry}`);
    }

    // Delete the reference
    delete this.activeProtestorSounds[soundCountry];
  }
}

/**
 * Stop all protestor sounds
 */
stopAllProtestorSounds() {
  console.log("stop all protestor sounds");

  // Comprehensive stop of ALL protestor sounds
  if (!this.activeProtestorSounds) {
    this.activeProtestorSounds = {};
    return;
  }

  Object.keys(this.activeProtestorSounds).forEach((key) => {
    this._stopSingleProtestorSound(key);
  });
}

/**
 * Play grab warning sound with delay
 */
playGrabWarning(volume = null) {
  if (this.muted) return null;

  // Scale warning time based on game speed
  const scaledWarningTime = this.baseDelays.grabWarning / Math.max(1, this.gameSpeed);

  setTimeout(() => {
    return this.play("ui", "grabWarning", volume);
  }, scaledWarningTime);
}

/**
 * Play grab attempt sound
 */
playGrabAttempt(country, initialVolume = null) {
  if (this.muted) return null;

  // Stop any existing grab sound
  this.stopGrabSound();

  // Set initial grab volume if provided
  if (initialVolume !== null) {
    this.currentGrabVolume = initialVolume;
  }

  // Try to play from cached first
  if (this._criticalSoundsCache["trumpGrabbing1"]) {
    const grabSound = this._criticalSoundsCache["trumpGrabbing1"];
    grabSound.currentTime = 0;
    grabSound.volume = this.currentGrabVolume * this.volume;
    grabSound.loop = true;

    const playPromise = grabSound.play();
    if (playPromise) {
      playPromise
        .then(() => {
          this.activeGrabSound = grabSound;
          this.currentlyPlaying.push(grabSound);

          // Start increasing volume gradually
          this.grabVolumeInterval = setInterval(() => {
            if (this.activeGrabSound) {
              this.currentGrabVolume = Math.min(this.maxGrabVolume, this.currentGrabVolume + this.grabVolumeStep);
              this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
            }
          }, 300);

          return grabSound;
        })
        .catch(() => {
          // Fallback to standard play
          return this._standardGrabAttempt(country, initialVolume);
        });
    }

    return Promise.resolve(grabSound);
  } else {
    // Standard approach
    return this._standardGrabAttempt(country, initialVolume);
  }
}

/**
 * Standard grab attempt sound playback
 */
_standardGrabAttempt(country, initialVolume) {
  return this.play("trump", "trumpGrabbing", this.currentGrabVolume * this.volume).then((grabSound) => {
    if (grabSound) {
      grabSound.loop = true;
      this.activeGrabSound = grabSound;

      // Start increasing volume gradually
      this.grabVolumeInterval = setInterval(() => {
        if (this.activeGrabSound) {
          this.currentGrabVolume = Math.min(this.maxGrabVolume, this.currentGrabVolume + this.grabVolumeStep);
          this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
        }
      }, 300);
    }
    return grabSound;
  });
}

/**
 * Stop grab sound
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
 * Play a sequence of sounds for successful grab
 */
playSuccessfulGrab(country, volume = null) {
  if (this.muted) return null;

  this.stopGrabSound();

  return this.resumeAudioContext().then(() => {
    // Play "ya" first
    const yaFile = this._getShuffledSound("trump", "trumpYa");
    const yaSound = this.playDirect(yaFile, volume);

    // Default duration if we can't get it from audio element
    let yaDuration = 0.2; // shorter default since ya is short
    if (yaSound && yaSound.duration && !isNaN(yaSound.duration)) {
      yaDuration = yaSound.duration;
    }

    // Scale first delay based on game speed
    const annexDelay = (yaDuration * 1000) / Math.max(1, this.gameSpeed);

    // Play annex cry after ya
    setTimeout(() => {
      const successFile = this._getShuffledSound("trump", "partialAnnexCry");
      const annexSound = this.playDirect(successFile, volume);

      // Get annex sound duration for next delay
      let annexDuration = 1.5; // default duration
      if (annexSound && annexSound.duration && !isNaN(annexSound.duration)) {
        annexDuration = annexSound.duration;
      }

      // Calculate catchphrase delay based on annex duration
      const catchphraseDelay = (annexDuration * 1000 + this.baseDelays.catchphrase) / Math.max(1, this.gameSpeed);

      // Play catchphrase after annex finishes
      setTimeout(() => {
        this.playCatchphrase(country, volume);
      }, catchphraseDelay);
    }, annexDelay);

    return yaSound;
  });
}






/**
   * Play a sequence of sounds for successful block
   */
playSuccessfulBlock(country, volume = null) {
  this.stopGrabSound();

  // First play the slap sound immediately using the optimized path
  this._playInstantSlap(volume);

  // Queue up the additional sounds AFTER the slap - this won't block the slap sound
  setTimeout(() => {
    this.resumeAudioContext().then(() => {
      // Scale both delays by game speed
      const scaledSobDelay = this.baseDelays.sobToProtest / Math.max(1, this.gameSpeed);
      const scaledProtestDelay = this.baseDelays.protest / Math.max(1, this.gameSpeed);

      setTimeout(() => {
        const sobFile = this._getShuffledSound("trump", "trumpSob");
        this.playDirect(sobFile, volume);

        setTimeout(() => {
          const protestFile = this._getShuffledSound("defense", "peopleSayNo", country);
          this.playDirect(protestFile, volume);
        }, scaledProtestDelay);
      }, scaledSobDelay);
    });
  }, 0);

  return Promise.resolve(true);
}

/**
 * Play sounds for country fully annexed
 */
playCountryFullyAnnexedCry(country, volume = null) {
  if (this.muted) return null;

  return this.resumeAudioContext().then(() => {
    const annexFile = this._getShuffledSound("trump", "fullAnnexCry");
    const annexSound = this.playDirect(annexFile, volume);

    let soundDuration = 1.5;
    if (annexSound && annexSound.duration && !isNaN(annexSound.duration)) {
      soundDuration = annexSound.duration;
    }

    // Scale delay based on game speed
    const scaledDelay = (soundDuration * 1000 + this.baseDelays.catchphrase) / Math.max(1, this.gameSpeed);

    setTimeout(() => {
      this.playCatchphrase(country, volume);
    }, scaledDelay);

    return annexSound;
  });
}

/**
 * Play a catchphrase for a country
 */
playCatchphrase(country, volume = null) {
  if (this.muted) return null;

  // Always ensure AudioContext is resumed first
  return this.resumeAudioContext().then(() => {
    // Handle eastCanada and westCanada as canada
    const actualCountry = country === "eastCanada" || country === "westCanada" ? "canada" : country;

    // Get catchphrase files array
    const catchphrases = this.trumpShoutsAtACountry[actualCountry] || this.trumpShoutsAtACountry.generic;

    if (!catchphrases || catchphrases.length === 0) {
      return null;
    }

    // Get shuffled sound rather than random
    const soundFile = this._getShuffledSound("catchphrase", actualCountry);

    // Play directly using the correct path
    return this.playDirect(soundFile, volume);
  });
}

/**
 * Play sound for growing protestors
 */
playGrowProtestorsSound(volume = null) {
  if (this.muted) return null;

  // Always ensure AudioContext is resumed first
  return this.resumeAudioContext().then(() => {
    return this.playDirect(this.soundFiles.ui.growProtestors, volume);
  });
}

/**
 * Fade audio to a target volume over time
 */
fadeTo(audio, targetVolume, duration, callback = null) {
  if (!audio) return null;

  const startVolume = audio.volume;
  const volumeDiff = targetVolume - startVolume;
  const startTime = performance.now();

  // Generate a unique ID for this fade
  const fadeId = Date.now() + Math.random().toString(36).substr(2, 5);

  // Clear any existing fade for this audio element
  if (this._fadeIntervals[fadeId]) {
    clearInterval(this._fadeIntervals[fadeId]);
  }

  // Create a new interval
  const fadeInterval = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Apply volume (check if audio still exists)
    if (audio) {
      audio.volume = startVolume + volumeDiff * progress;
    }

    // If complete or audio no longer exists
    if (progress >= 1 || !audio) {
      clearInterval(fadeInterval);
      delete this._fadeIntervals[fadeId];

      // If we faded to zero and audio still exists, stop it
      if (audio && targetVolume <= 0.02) {
        audio.pause();
        audio.currentTime = 0;
      }

      // Execute callback if provided
      if (callback && typeof callback === "function") {
        callback();
      }
    }
  }, 50);

  // Store the interval with unique ID
  this._fadeIntervals[fadeId] = fadeInterval;

  return fadeInterval;
}

/**
 * Start background music
 */
startBackgroundMusic(volume = null) {
  if (!this.initialized || this.muted) return Promise.resolve(false);

  // Resume AudioContext first (mobile requirement)
  return this.resumeAudioContext().then(() => {
    try {
      // Prioritize loading and using a cached background music track
      if (this.sounds.music && this.sounds.music.background) {
        const music = this.sounds.music.background;
        music.loop = true;
        music.volume = volume !== null ? volume : this.volume * 0.5; // Lower default volume

        const playPromise = music.play();
        if (playPromise !== undefined) {
          return playPromise
            .then(() => {
              this.backgroundMusic = music;
              this.backgroundMusicPlaying = true;
              return true;
            })
            .catch((error) => {
              // Try fallback approach
              return this._createNewBackgroundMusic(volume);
            });
        }

        this.backgroundMusic = music;
        this.backgroundMusicPlaying = true;
        return Promise.resolve(true);
      } else {
        // Fallback to creating new background music
        return this._createNewBackgroundMusic(volume);
      }
    } catch (e) {
      console.error("[AUDIO] Error starting background music:", e.message);
      return Promise.resolve(false);
    }
  });
}

/**
 * Create new background music instance
 */
_createNewBackgroundMusic(volume = null) {
  try {
    // Get an audio element from the pool
    const music = this._getOrCreatePrimedAudio();
    music.loop = true;
    music.src = this.resolvePath(this.soundFiles.music.background);
    music.volume = volume !== null ? volume : this.volume * 0.5; // Use 50% volume by default

    return music
      .play()
      .then(() => {
        this.backgroundMusic = music;
        this.backgroundMusicPlaying = true;

        // Listen for ended event (shouldn't happen with loop, but just in case)
        music.addEventListener("ended", () => {
          if (this.backgroundMusicPlaying) {
            music.play().catch((e) => console.warn(`[AUDIO] Music loop failed:`, e.message));
          }
        });

        return true;
      })
      .catch((error) => {
        console.warn(`[AUDIO] Background music play failed:`, error.message);

        // On mobile, set up play on next interaction
        if (this.isMobile) {
          const playOnInteraction = () => {
            this.resumeAudioContext().then(() => {
              music
                .play()
                .then(() => {
                  this.backgroundMusic = music;
                  this.backgroundMusicPlaying = true;
                })
                .catch((e) => {});
            });
          };

          // Set up listeners for user interaction (one-time)
          document.addEventListener("click", playOnInteraction, { once: true });
          document.addEventListener("touchstart", playOnInteraction, { once: true });
        }

        return false;
      });
  } catch (e) {
    console.warn(`[AUDIO] Error creating background music:`, e.message);
    return Promise.resolve(false);
  }
}

/**
 * Stop background music
 */
stopBackgroundMusic() {
  if (this.backgroundMusic) {
    this.backgroundMusic.pause();
    this.backgroundMusic.currentTime = 0;

    // Reset volume before returning to pool
    this.backgroundMusic.volume = this.volume * 0.5; // Reset to default

    // Return to pool for reuse
    if (window._primedAudioPool) {
      window._primedAudioPool.push(this.backgroundMusic);
    }

    this.backgroundMusicPlaying = false;
    this.backgroundMusic = null;
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
 * Set global volume
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
    this.backgroundMusic.volume = this.volume * 0.5;
  }

  // Update grab sound volume if active
  if (this.activeGrabSound) {
    this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
  }
}

/**
 * Set game speed (affects timing of sound sequences)
 */
setGameSpeed(speed) {
  this.gameSpeed = speed;
}

/**
 * Stop all sounds except background music
 */
stopAllExceptBackgroundMusic() {
  // Get a reference to the background music before stopping anything
  const bgMusic = this.backgroundMusic;

  // Stop all currently playing sounds except background music
  this.currentlyPlaying.forEach((sound) => {
    // Skip background music
    if (sound !== bgMusic) {
      try {
        sound.pause();
        sound.currentTime = 0;
        // Remove onended callback to prevent further handling
        sound.onended = null;
      } catch (e) {
        console.warn("[AUDIO] Error stopping sound in stopAllExceptBackgroundMusic:", e);
      }
    }
  });

  // Filter background music out of currently playing list
  this.currentlyPlaying = this.currentlyPlaying.filter((sound) => sound === bgMusic);

  // Stop all protestor sounds
  this.stopAllProtestorSounds();

  // Stop grab sound
  this.stopGrabSound();

  // Clear any active fades except those for background music
  Object.keys(this._fadeIntervals).forEach((key) => {
    // Only clear if not related to background music
    if (!key.includes("backgroundMusic")) {
      clearInterval(this._fadeIntervals[key]);
      delete this._fadeIntervals[key];
    }
  });

  // Clear active grab sound and interval
  if (this.grabVolumeInterval) {
    clearInterval(this.grabVolumeInterval);
    this.grabVolumeInterval = null;
  }
  this.activeGrabSound = null;

  // Reset grab volume for next time
  this.currentGrabVolume = 0.2;
}

/**
 * Pause all sounds
 */
pauseAll() {
  // Always try to maintain AudioContext state
  if (this.audioContext && this.audioContext.state === "running") {
    try {
      // Suspend AudioContext to prevent unnecessary processing
      this.audioContext.suspend().catch(console.warn);
    } catch (e) {
      console.warn("[AUDIO] Could not suspend AudioContext:", e.message);
    }
  }

  // Pause background music
  if (this.backgroundMusic && !this.backgroundMusic.paused) {
    // Store the playing state for potential resume
    this.backgroundMusic._wasPlaying = true;
    this.backgroundMusic.pause();
  }

  // Pause all currently playing sounds
  this.currentlyPlaying.forEach((sound) => {
    if (sound && !sound.paused && typeof sound.pause === "function") {
      sound.pause();
    }
  });

  // Pause grab sound interval
  if (this.grabVolumeInterval) {
    clearInterval(this.grabVolumeInterval);
    this.grabVolumeInterval = null;
  }

  // Stop all protestor sounds
  this.stopAllProtestorSounds();
}

/**
 * Resume all sounds
 */
resumeAll() {
  // Safely resume AudioContext (critical for mobile/Safari)
  this.resumeAudioContext().then((contextResumed) => {
    if (!contextResumed) {
      console.warn("[AUDIO] Could not resume AudioContext");
    }

    // Resume background music if it was playing
    if (this.backgroundMusic && this.backgroundMusicPlaying) {
      this.backgroundMusic.play().catch((e) => {
        console.warn(`[AUDIO] Could not resume background music:`, e.message);
      });
    }

    // Resume grab sound if it was active
    if (this.activeGrabSound) {
      this.activeGrabSound.play().catch((e) => {
        console.warn(`[AUDIO] Could not resume grab sound:`, e.message);
      });

      // Restart volume interval
      this.grabVolumeInterval = setInterval(() => {
        if (this.activeGrabSound) {
          this.currentGrabVolume = Math.min(this.maxGrabVolume, this.currentGrabVolume + this.grabVolumeStep);
          this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
        }
      }, 300);
    }
  });
}

/**
 * Stop all sounds
 */
stopAll(options = {}) {
  // Stop and clear all currently playing sounds
  this.currentlyPlaying.forEach((sound) => {
    if (sound && typeof sound.pause === "function") {
      sound.pause();
      sound.currentTime = 0;
      sound.onended = null; // Clear callback
      sound.src = ""; // Release memory
    }
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

  // Clear any active fades
  Object.keys(this._fadeIntervals).forEach((key) => {
    clearInterval(this._fadeIntervals[key]);
  });
  this._fadeIntervals = {};
}

/**
 * Reset the audio manager
 */
reset() {
  // Stop all sounds
  this.stopAll();

  // Reset state but keep sound definitions
  this.volume = 1.0;
  this.muted = false;
  this.currentGrabVolume = 0.2;

  // Clear any active intervals
  if (this.grabVolumeInterval) {
    clearInterval(this.grabVolumeInterval);
    this.grabVolumeInterval = null;
  }

  // Reset active sound tracking
  this.activeGrabSound = null;
  this.activeProtestorSounds = {};

  // Return a fresh audio context
  return this.resumeAudioContext();
}

/**
 * Prepare for game restart
 */
prepareForRestart() {
  // Clear any playing sounds that might still be active
  this.activeSounds = {};
  this.activeProtestorSounds = {};

  // Ensure audio context is ready
  this.resumeAudioContext()
    .then(() => {
      // Use _prepareAudioPool instead of initializeAudioPool
      if (window._primedAudioPool && window._primedAudioPool.length < 5) {
        this._prepareAudioPool(5);
      }

      // Preload critical sounds instead of generic preloadSounds
      this.preloadCriticalSounds();

      // Ensure slap sounds are pre-loaded for immediate response
      this._preloadInstantSlapSounds();

      // Load background music if needed
      if (!this.sounds.music || !this.sounds.music.background) {
        this.loadSound("music", "background");
      }
    })
    .catch((e) => {
      console.warn("[AUDIO] Error preparing audio for restart:", e);
    });
}

/**
 * Clean up resources
 */
cleanup() {
  // Stop all sounds first
  this.stopAll();

  // Clear any intervals
  if (this.grabVolumeInterval) {
    clearInterval(this.grabVolumeInterval);
    this.grabVolumeInterval = null;
  }

  Object.keys(this._fadeIntervals).forEach((key) => {
    clearInterval(this._fadeIntervals[key]);
  });
  this._fadeIntervals = {};

  // Close audio context if possible
  if (this.audioContext && typeof this.audioContext.close === "function") {
    this.audioContext.close().catch((e) => {
      console.warn(`[AUDIO] Error closing AudioContext:`, e.message);
    });
  }
}

/**
 * Load sounds for a specific country
 */
loadCountrySounds(country) {
  // Determine which country we're actually targeting
  let targetCountry = country;

  // Special handling for Canada regions
  if (country === "eastCanada" || country === "westCanada") {
    targetCountry = "canada";
  }

  // Load corresponding resistance sounds
  if (this.soundFiles.resistance[targetCountry]) {
    const soundArray = this.soundFiles.resistance[targetCountry];
    for (let i = 0; i < Math.min(2, soundArray.length); i++) {
      this.loadSound("resistance", targetCountry, i);
    }
  }

  // Load corresponding protest sounds
  if (country === "canada") {
    // Load both east and west Canada protest sounds
    this._preloadProtestSoundsForCountry("eastCanada");
    this._preloadProtestSoundsForCountry("westCanada");
  } else {
    this._preloadProtestSoundsForCountry(country);
  }

  // Load catchphrase sounds
  if (this.trumpShoutsAtACountry[targetCountry]) {
    for (let i = 0; i < Math.min(2, this.trumpShoutsAtACountry[targetCountry].length); i++) {
      this.loadCatchphrase(targetCountry, i);
    }
  }
}

/**
 * Preload for mobile devices
 */
preloadForMobile() {
  // Focus only on critical sounds for gameplay
  const criticalSounds = [
    ["defense", "slap", 0],
    ["defense", "slap", 1],
    ["ui", "click"],
    ["ui", "grabWarning"],
    ["trump", "trumpGrabbing", 0],
    ["trump", "trumpSob", 0],
  ];

  // Load each critical sound with staggered timing
  criticalSounds.forEach((soundInfo, index) => {
    setTimeout(() => {
      this._loadSoundWithPromise(...soundInfo);
    }, index * 150); // Staggered loading with 150ms between each
  });

  // Prepare some audio elements for immediate use
  for (let i = 0; i < 3; i++) {
    const audio = new Audio();
    audio.preload = "auto";
    window._primedAudioPool.push(audio);
  }
}

/**
 * Preload protest sounds for a country
 */
_preloadProtestSoundsForCountry(country) {
  const countrySaysNo = country.endsWith("SaysNo") ? country : country + "SaysNo";

  // Preload protestor sound if available
  const protestorKey = country + "Protestors";
  if (this.soundFiles.defense?.protestors?.[protestorKey]?.[0]) {
    const path = this.soundFiles.defense.protestors[protestorKey][0];

    const audio = new Audio(this.resolvePath(path));
    audio.preload = "auto";

    audio.oncanplaythrough = () => {
      if (!this.sounds.defense.protestors) {
        this.sounds.defense.protestors = {};
      }

      this.sounds.defense.protestors[protestorKey] = audio;
      this.loadedSounds.add(`defense.protestors.${protestorKey}`);
    };

    audio.load();
  }

  // Preload sayNo sounds - but be more selective on mobile
  const sayNoSounds = this.soundFiles.defense?.peopleSayNo?.[countrySaysNo];
  if (Array.isArray(sayNoSounds) && sayNoSounds.length > 0) {
    // On low memory devices, only load a few samples
    const loadCount = this.lowMemoryDevice ? Math.min(2, sayNoSounds.length) : Math.min(4, sayNoSounds.length);

    // Ensure the destination array exists
    if (!this.sounds.defense.peopleSayNo) {
      this.sounds.defense.peopleSayNo = {};
    }

    if (!this.sounds.defense.peopleSayNo[countrySaysNo]) {
      this.sounds.defense.peopleSayNo[countrySaysNo] = [];
    }

    // Load selected sounds with a slight delay between them
    for (let i = 0; i < loadCount; i++) {
      setTimeout(() => {
        const audio = new Audio(this.resolvePath(sayNoSounds[i]));
        audio.preload = "auto";

        audio.oncanplaythrough = () => {
          this.sounds.defense.peopleSayNo[countrySaysNo][i] = audio;
          this.loadedSounds.add(`defense.peopleSayNo.${countrySaysNo}.${i}`);
        };

        audio.load();
      }, i * 100); // Stagger loading
    }
  }
}
}

// Make it globally available
window.AudioManager = AudioManager;

