/**
 * AudioManager - Robust audio system for web game sound effects and music
 * Enhanced with better mobile support and AudioContext management
 */
class AudioManager {
  /**
   * Create a new AudioManager instance
   */
  constructor() {
    console.log("[AUDIO_FLOW] AudioManager created");

    this.debugInfo = {
      initTimestamp: Date.now(),
      audioContextCreated: false,
      clickSoundLoaded: false,
      clickSoundPlayAttempts: 0,
      firstClickTimestamp: 0,
      resumeAttempts: 0,
    };

    this.audioContextRunning = false;

    this.gameSpeed = 1.0;
    this.baseDelays = {
      catchphrase: 300, // ms to wait between success/annex and catchphrase
      grabWarning: 500, // ms before grab to play warning
      protest: 350, // ms between slap and protest sounds
      sobToProtest: 200, // ms between sob and protest sounds in successful block
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

    // Sound file definitions
    this.soundFiles = {
      ui: {
        click: "click.mp3",
        gameStart: "gameStart.mp3",
        gameOver: "gameOver.mp3",
        win: "resistanceWins.mp3",
        lose: "resistanceLoses.mp3",
        grabWarning: "grabWarning.mp3",
        resistance: "resistance.mp3",
        speedup: "speedup.mp3",
        instruction1: "instruction1.mp3",
        instruction2: "instruction2.mp3",
        instruction3: "instruction3.mp3",
        instruction: "instruction.mp3",
        aliens: "aliens.mp3",
        aliens2: "aliens2.mp3",
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
        trumpGrabbing: ["trumpGrabbing1.mp3"],
        partialAnnexCry: ["partialAnnex1.mp3", "partialAnnex2.mp3", "partialAnnex3.mp3"],
        fullAnnexCry: ["fullAnnex1.mp3", "fullAnnex2.mp3", "fullAnnex3.mp3"],
        trumpVictorySounds: ["victory1.mp3", "victory2.mp3", "victory3.mp3"],
        trumpSob: ["trumpSob1.mp3", "trumpSob2.mp3"],
        trumpYa: ["bing1.mp3", "bing2.mp3", "bing3.mp3"],
        evilLaugh: "trump-laugh.mp3",
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
          westCanadaProtestors: ["protestorsWestCan1.mp3"],
          mexicoProtestors: ["protestorsMex1.mp3"],
          greenlandProtestors: ["protestorsGreen1.mp3"],
          usaProtestors: ["protestorsUSA.mp3"],
        },
      },
      particles: {
        freedom: ["freedomSpark1.mp3", "freedomSpark2.mp3", "freedomSpark3.mp3"],
      },
      music: {
        background: "background-music.mp3",
      },
      warnings: {
        warning2: "warning2.mp3",
        warning3: "warning3.mp3",
        zwarning: "zwarning.mp3",
      },
    };

    // Catchphrase sound files
    this.catchphraseFiles = {
      canada: ["canada1.mp3", "canada2.mp3", "canada3.mp3", "canada4.mp3"],
      mexico: ["mexico1.mp3", "mexico2.mp3", "mexico3.mp3"],
      greenland: ["greenland1.mp3", "greenland2.mp3", "greenland3.mp3", "greenland4.mp3"],
      generic: ["catchphrase1.mp3", "catchphrase2.mp3", "catchphrase3.mp3"],
    };

    // Shuffle tracking
    this.shuffleTracking = {
      indices: {}, // Current index in each shuffled array
      arrays: {}, // The shuffled arrays themselves
    };

    // Audio state
    this.initialized = false;
    this.muted = false;
    this.volume = 1.0;

    // Playback state
    this.currentlyPlaying = [];
    this.backgroundMusic = null;
    this.backgroundMusicPlaying = false;
    this.activeProtestorSounds = {};
    this.loadedSounds = new Set(); // Track loaded sounds

    // Grab sound state
    this.activeGrabSound = null;
    this.grabVolumeInterval = null;
    this.currentGrabVolume = 0.2; // Starting volume for grab sounds
    this.maxGrabVolume = 1.0;
    this.grabVolumeStep = 0.05; // Amount to increase volume per interval

    // Sound path - will be adjusted during initialization
    this.soundPath = "sounds/";

    // Set up fade interval tracking
    this._fadeIntervals = {};

    // Detect mobile device once
    this.isMobile = this._isMobileDevice();
    this.isIOS = this._isIOSDevice();

    // Set up audio context
    this._setupAudioContext();

    // Not fully initialized yet - will be done on first user interaction
    console.log("[Audio] AudioManager created - waiting for user interaction to initialize");
  }

  _setupAudioContext() {
    try {
      console.log("[AUDIO_DEBUG] Setting up AudioContext");
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();

      console.log("[AUDIO_DEBUG] AudioContext created with state:", this.audioContext.state);
      console.log("[AUDIO_DEBUG] AudioContext sampleRate:", this.audioContext.sampleRate);
      console.log("[AUDIO_DEBUG] AudioContext baseLatency:", this.audioContext.baseLatency);

      if (this.audioContext.state === "suspended") {
        console.log("[AUDIO_DEBUG] AudioContext suspended - will need user interaction");
      }
    } catch (e) {
      console.warn("[AUDIO_DEBUG] Web Audio API not supported:", e.message);
      this.audioContext = null;
    }
  }

  resumeAudioContext() {
    console.log("[AUDIO_DEBUG] resumeAudioContext called from:", new Error().stack);

    if (!this.audioContext) {
      console.warn("[AUDIO_DEBUG] No AudioContext exists to resume");
      return Promise.resolve();
    }

    console.log("[AUDIO_DEBUG] AudioContext state before resume:", this.audioContext.state);

    // Add this new check to avoid unnecessary work
    if (this.audioContextRunning && this.audioContext.state === "running") {
      console.log("[AUDIO_DEBUG] AudioContext already confirmed running, skipping resume");
      return Promise.resolve(true);
    }

    if (this.audioContext.state === "suspended") {
      console.log("[AUDIO_DEBUG] Attempting to resume suspended AudioContext");

      return this.audioContext
        .resume()
        .then(() => {
          console.log("[AUDIO_DEBUG] AudioContext resumed successfully, state:", this.audioContext.state);
          console.log("[AUDIO_DEBUG] Loaded sounds count:", this.loadedSounds.size);

          // Add this line to mark context as running
          this.audioContextRunning = true;

          // If no sounds loaded, try loading essential sounds again
          if (this.loadedSounds.size === 0) {
            console.log("[AUDIO_DEBUG] No sounds loaded yet, attempting to reload essential sounds");
            this.preloadEssentialSounds();
          }
          return true;
        })
        .catch((err) => {
          console.error("[AUDIO_DEBUG] Failed to resume AudioContext:", err);
          return false;
        });
    }

    console.log("[AUDIO_DEBUG] AudioContext already running (state:", this.audioContext.state + ")");
    // Add this line to mark context as running even if it was already running
    this.audioContextRunning = true;
    return Promise.resolve(true);
  }
  // unlock() {
  //   console.log("[AUDIO_DEBUG] Unlock method called from:", new Error().stack);

  //   // First try to resume the AudioContext
  //   return this.resumeAudioContext().then((contextResult) => {
  //     console.log("[AUDIO_DEBUG] resumeAudioContext result:", contextResult);

  //     // For iOS, try the silent sound approach as well
  //     if (this.isIOS) {
  //       console.log("[AUDIO_DEBUG] iOS detected, trying silent sound approach");
  //       return this._unlockWithSilentSound().then((silentResult) => {
  //         console.log("[AUDIO_DEBUG] Silent sound unlock result:", silentResult);
  //         return contextResult || silentResult;
  //       });
  //     }
  //     return contextResult;
  //   });
  // }

  _unlockWithSilentSound() {
    console.log("[AUDIO_DEBUG] Attempting to unlock with silent sound");

    return new Promise((resolve) => {
      try {
        // Try a super short silent file
        console.log("[AUDIO_DEBUG] Creating silent sound");
        let silentSound = new Audio(this.resolvePath("silent.mp3"));

        if (!silentSound) {
          console.log("[AUDIO_DEBUG] Silent sound file not found, using data URI");
          // If file doesn't exist, use a data URI
          silentSound = new Audio(
            "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAADAABgYGBgYGBgYGBgkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDA4ODg4ODg4ODg4ODg//////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAAAwDVxttG//sUxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
          );
        }

        silentSound.volume = 0.01;
        console.log("[AUDIO_DEBUG] Playing silent sound");
        const playPromise = silentSound.play();

        if (playPromise instanceof Promise) {
          playPromise
            .then(() => {
              console.log("[AUDIO_DEBUG] Silent sound played successfully");
              setTimeout(() => {
                silentSound.pause();
                silentSound.src = "";
                console.log("[AUDIO_DEBUG] Silent sound cleaned up");
                resolve(true);
              }, 100);
            })
            .catch((err) => {
              console.warn("[AUDIO_DEBUG] Silent sound failed:", err.message);
              resolve(false);
            });
        } else {
          console.log("[AUDIO_DEBUG] Play didn't return a promise, using timeout");
          setTimeout(() => {
            silentSound.pause();
            console.log("[AUDIO_DEBUG] Silent sound cleaned up (timeout)");
            resolve(true);
          }, 100);
        }
      } catch (e) {
        console.warn("[AUDIO_DEBUG] Error creating silent sound:", e.message);
        resolve(false);
      }
    });
  }

  _getOrCreatePrimedAudio() {
    // Make sure pool exists
    if (!window._primedAudioPool) {
      window._primedAudioPool = [];
    }

    // Get audio from pool or create new
    const audio = window._primedAudioPool.length > 0 ? window._primedAudioPool.pop() : new Audio();

    // Reset ALL properties including volume
    audio.loop = false;
    audio.muted = false;
    audio.currentTime = 0;
    audio.volume = 1.0;  // Reset to default volume
    audio.playbackRate = 1.0;  // Also reset playback rate for good measure

    return audio;
}

  primeAudioPool(options = {}) {
    console.log("[AUDIO_DEBUG] Priming audio pool during user gesture");

    // Create the audio pool if it doesn't exist
    window._primedAudioPool = [];

    // Only play the click sound if not specifically disabled
    if (!options.skipClickSound) {
      const clickAudio = new Audio(this.resolvePath("click.mp3"));
      clickAudio.volume = 0.3; // Normal volume for click

      // Play it properly as user feedback
      clickAudio
        .play()
        .then(() => {
          console.log("[AUDIO_DEBUG] Click sound played successfully");

          // Return to pool after it's done
          clickAudio.onended = () => {
            window._primedAudioPool.push(clickAudio);
          };
        })
        .catch((err) => {
          console.warn("[AUDIO_DEBUG] Click failed:", err);
        });
    }

    const bgMusic = new Audio(this.resolvePath("background-music.mp3"));
    bgMusic.preload = "auto";
    bgMusic.load();
    window._primedAudioPool.push(bgMusic);


    // For other sounds, just create and load them without playing
    const otherSounds = ["gameStart.mp3", "slap1.mp3", "trumpGrabbing1.mp3", "grabWarning.mp3", "resistanceLoses.mp3", "trump-laugh.mp3"];

    // Create audio elements for each sound (but don't play them yet)
    otherSounds.forEach((sound) => {
      const audio = new Audio(this.resolvePath(sound));
      audio.preload = "auto"; // Make sure browser loads it
      audio.load(); // Force loading
      window._primedAudioPool.push(audio);
      console.log(`[AUDIO_DEBUG] Prepared ${sound} without playing`);
    });

    // Add a few generic audio elements
    for (let i = 0; i < 5; i++) {
      const audio = new Audio();
      window._primedAudioPool.push(audio);
    }

    console.log(`[AUDIO_DEBUG] Primed pool size: ${window._primedAudioPool.length}`);
    return true;
  }

  loadSound(category, name, index = null) {
    // Create a unique key for tracking loaded sounds
    const soundKey = index !== null ? `${category}.${name}.${index}` : `${category}.${name}`;

    // Skip if already loaded
    if (this.loadedSounds.has(soundKey)) {
      console.log(`[AUDIO_DEBUG] Sound already loaded: ${soundKey}`);
      return;
    }

    console.log(`[AUDIO_DEBUG] Loading sound: ${soundKey}`);

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
      console.log(`[AUDIO_DEBUG] Sound loaded successfully: ${soundKey}`);

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
      console.error(`[AUDIO_DEBUG] Error loading sound ${soundPath}: ${e.type}, code: ${audio.error ? audio.error.code : "unknown"}`);

      if (this.logger) {
        this.logger.error("audio", `Error loading sound ${soundPath}: ${e.type}`);
      }
    };

    // Set source and load
    audio.src = this.resolvePath(soundPath);

    console.log(`[AUDIO_DEBUG] Audio.load() called for: ${soundKey}`);
    audio.load();

    return audio;
  }

  init() {
    console.log("[AUDIO_FLOW] AudioManager.init() called");

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
      this.soundPath = baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1) + "sounds/";

      if (this.logger) {
        this.logger.info("audio", `Mobile detected, using absolute sound path: ${this.soundPath}`);
      }
    }

    this.initialized = true;

    // Preload essential sounds that need to be available immediately
    this.loadSound("ui", "click");
    this.loadSound("ui", "gameStart");
    this.loadSound("defense", "slap", 0);
    this.loadSound("trump", "trumpGrabbing", 0);
    this.loadSound("trump", "partialAnnexCry", 0);

     // Background music
     this.loadSound("music", "background");


    if (this.logger) {
      this.logger.info("audio", "Audio system initialized");
    }
  }

  /**
   * Preload essential sounds that need to be available immediately
   */
  preloadEssentialSounds() {
    console.log("[Audio] Loading essential sounds");

    // UI sounds
    this.loadSound("ui", "click");
    this.loadSound("ui", "gameStart");
    this.loadSound("ui", "grabWarning");

    // Defense sounds
    this.loadSound("defense", "slap", 0);

    // Trump sounds
    this.loadSound("trump", "trumpGrabbing", 0);
    this.loadSound("trump", "partialAnnexCry", 0);
    this.loadSound("trump", "trumpSob", 0);
    this.loadSound("trump", "trumpYa", 0);

     // Background music
     this.loadSound("music", "background");

  }

  // Modify preloadGameSounds to use a more staged approach
  preloadGameSounds() {
    console.log("[Audio] Starting staged sound preload");

    // First load essentials (already in pool)
    const criticalSounds = ["ui.click", "ui.gameStart", "defense.slap.0", "trump.trumpGrabbing.0", "ui.grabWarning", "music.background"];

    // Load critical sounds first
    criticalSounds.forEach((sound) => {
      const [category, name, index] = sound.split(".");
      this.loadSound(category, name, index !== undefined ? parseInt(index) : null);
    });

    // Load instructional sounds next (slightly delayed)
    setTimeout(() => {
      const instructionalSounds = [
        "instruction1",
        "instruction2",
        "instruction3",
        "instruction",
        "stopHim",
        "smackThatHand",
        "oopsieTradeWar",
        "noOneIsComingToSaveUs",
        "getUpAndFight",
      ];

      instructionalSounds.forEach((name, i) => {
        setTimeout(() => this.loadSound("ui", name), i * 50);
      });
    }, 200);

    // Load sequence sounds (medium priority)
    setTimeout(() => {
      // Load trump sequence sounds
      for (let i = 0; i < this.soundFiles.trump.trumpSob.length; i++) {
        this.loadSound("trump", "trumpSob", i);
      }
      for (let i = 0; i < this.soundFiles.trump.trumpSob.length; i++) {
        this.loadSound("trump", "trumpYa", i);
      }
      for (let i = 0; i < this.soundFiles.trump.partialAnnexCry.length; i++) {
        this.loadSound("trump", "partialAnnexCry", i);
      }
      for (let i = 0; i < this.soundFiles.trump.fullAnnexCry.length; i++) {
        this.loadSound("trump", "fullAnnexCry", i);
      }
    }, 500);

    // Load protest sounds next
    setTimeout(() => this.preloadProtestSounds(), 800);

    // Background music (can be loaded last)
    setTimeout(() => this.loadSound("music", "background"), 1000);
  }

  /**
   * Load remaining game sounds after initial critical sounds
   */
  loadRemainingSounds() {
    console.log("[Audio] Loading remaining sounds");

    // Load Trump sounds in a staggered way
    for (let category in this.soundFiles.trump) {
      const files = this.soundFiles.trump[category];
      if (Array.isArray(files)) {
        for (let i = 0; i < files.length; i++) {
          setTimeout(() => {
            this.loadSound("trump", category, i);
          }, i * 100); // Stagger loading
        }
      }
    }

    // Load UI sounds
    for (const name in this.soundFiles.ui) {
      setTimeout(() => {
        this.loadSound("ui", name);
      }, 200); // Light delay
    }

    // Load defense sounds next
    setTimeout(() => {
      // Handle nested structures for defense sounds
      for (let i = 0; i < this.soundFiles.defense.slap.length; i++) {
        this.loadSound("defense", "slap", i);
      }

      // Load protests
      this.preloadProtestSounds();
    }, 1500);

    // Load catchphrases as lowest priority
    setTimeout(() => {
      this.preloadCatchphrases();
    }, 2500);
  }
  preloadProtestSounds() {
    const countries = ["eastCanada", "westCanada", "mexico", "greenland", "usa"];

    // First, load all the protestor sounds (one per country)
    countries.forEach((country) => {
      const protestorKey = country + "Protestors";

      // Check if there are protestor sounds available
      if (this.soundFiles.defense.protestors[protestorKey] && this.soundFiles.defense.protestors[protestorKey].length > 0) {
        console.log(`[AUDIO_DEBUG] Loading protestor sound for ${country}`);
        // Load the first sound (usually there's just one per country)
        const path = this.soundFiles.defense.protestors[protestorKey][0];

        // Create audio element and load it
        const audio = new Audio(this.resolvePath(path));
        audio.preload = "auto";

        // When loaded, store it properly
        audio.oncanplaythrough = () => {
          if (!this.sounds.defense.protestors) {
            this.sounds.defense.protestors = {};
          }

          this.sounds.defense.protestors[protestorKey] = audio;
          this.loadedSounds.add(`defense.protestors.${protestorKey}`);
          console.log(`[AUDIO_DEBUG] Protestor sound loaded for ${country}`);
        };

        audio.load();
      }
    });

    // Then, load all the peopleSayNo sounds (multiple per country)
    countries.forEach((country) => {
      const peopleSayNoKey = country + "SaysNo";

      const sayNoSounds = this.soundFiles.defense.peopleSayNo[peopleSayNoKey];
      if (Array.isArray(sayNoSounds) && sayNoSounds.length > 0) {
        console.log(`[AUDIO_DEBUG] Loading peopleSayNo sounds for ${country}, count: ${sayNoSounds.length}`);

        // Make sure the destination array exists
        if (!this.sounds.defense.peopleSayNo) {
          this.sounds.defense.peopleSayNo = {};
        }

        if (!this.sounds.defense.peopleSayNo[peopleSayNoKey]) {
          this.sounds.defense.peopleSayNo[peopleSayNoKey] = [];
        }

        // Load each sound with a slight delay between them
        sayNoSounds.forEach((path, index) => {
          setTimeout(() => {
            const audio = new Audio(this.resolvePath(path));
            audio.preload = "auto";

            audio.oncanplaythrough = () => {
              this.sounds.defense.peopleSayNo[peopleSayNoKey][index] = audio;
              this.loadedSounds.add(`defense.peopleSayNo.${peopleSayNoKey}.${index}`);
              console.log(`[AUDIO_DEBUG] PeopleSayNo sound loaded for ${country} [${index}]`);
            };

            audio.load();
          }, index * 100); // Stagger loading by 100ms per sound
        });
      }
    });
  }
  /**
   * Preload catchphrases
   */
  preloadCatchphrases() {
    for (const country in this.catchphraseFiles) {
      const phrases = this.catchphraseFiles[country];
      if (Array.isArray(phrases)) {
        for (let i = 0; i < phrases.length; i++) {
          setTimeout(() => {
            this.loadCatchphrase(country, i);
          }, i * 100);
        }
      }
    }
  }

  /**
   * Check if current device is mobile
   * @returns {boolean} True if mobile device
   * @private
   */
  _isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Check if current device is iOS
   * @returns {boolean} True if iOS device
   * @private
   */
  _isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  }

  /**
   * Adjust paths for mobile devices
   * @private
   */
  _adjustPathsForMobile() {
    // Use absolute paths for mobile
    const baseUrl = window.location.origin + window.location.pathname;
    this.soundPath = baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1) + "sounds/";
    console.log("[Audio] Adjusted sound path for mobile:", this.soundPath);
  }

  /**
   * Handle page visibility hidden (pause audio)
   * @private
   */
  _handlePageHidden() {
    // Pause background music when page hidden
    if (this.backgroundMusic && !this.backgroundMusic.paused) {
      this.backgroundMusic._wasPlaying = true;
      this.backgroundMusic.pause();
    }

    // Also pause any other sounds
    this.pauseAll();
  }

  /**
   * Handle page visibility visible (resume audio)
   * @private
   */
  _handlePageVisible() {
    // Resume background music when page visible again
    if (this.backgroundMusic && this.backgroundMusic._wasPlaying) {
      this.resumeAudioContext().then(() => {
        this.backgroundMusic.play().catch((e) => {
          console.warn("[Audio] Could not auto-resume background music:", e.message);
        });
        this.backgroundMusic._wasPlaying = false;
      });
    }

    // Resume other sounds
    this.resumeAll();
  }

  /**
   * Unlock audio for mobile devices - call this on user interaction
   * @returns {Promise} Resolves when audio is unlocked
   */
  unlock() {
    // First try to resume the AudioContext
    return this.resumeAudioContext().then((contextResult) => {
      // If we're on iOS, try the silent sound approach as well
      if (this.isIOS) {
        return this._unlockWithSilentSound();
      }
      return contextResult;
    });
  }

  /**
   * Unlock audio with a silent sound (mainly for iOS)
   * @returns {Promise} Resolves when silent sound completes
   * @private
   */
  _unlockWithSilentSound() {
    return new Promise((resolve) => {
      try {
        // Try a super short silent file
        const silentSound = new Audio(this.resolvePath("silent.mp3"));
        if (!silentSound) {
          // If file doesn't exist, use a data URI
          silentSound = new Audio(
            "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAADAABgYGBgYGBgYGBgkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDA4ODg4ODg4ODg4ODg//////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAAAwDVxttG//sUxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
          );
        }

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
            .catch((err) => {
              console.warn("[Audio] Silent sound failed:", err.message);
              resolve(false);
            });
        } else {
          setTimeout(() => {
            silentSound.pause();
            resolve(true);
          }, 100);
        }
      } catch (e) {
        console.warn("[Audio] Error creating silent sound:", e.message);
        resolve(false);
      }
    });
  }

  /**
   * Get the full path for a sound file
   * @param {string} filename - Sound filename
   * @returns {string} Full path to the sound
   */
  resolvePath(filename) {
    // Handle invalid inputs safely
    if (!filename) {
      console.warn("[Audio] Invalid filename provided to resolvePath");
      return "";
    }

    // Handle arrays as a safety backup
    if (Array.isArray(filename)) {
      console.warn("[Audio] Array passed to resolvePath instead of string");
      if (filename.length > 0) {
        filename = filename[0];
      } else {
        return "";
      }
    }

    // Ensure filename is a string
    if (typeof filename !== "string") {
      console.warn("[Audio] Non-string filename passed to resolvePath");
      return "";
    }

    // For absolute URLs, return as is
    if (filename.startsWith("http") || filename.startsWith("/")) {
      return filename;
    }

    // Ensure sound path ends with a slash
    const path = this.soundPath.endsWith("/") ? this.soundPath : this.soundPath + "/";

    return path + filename;
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
    audio.src = this.resolvePath(soundPath);

    audio.load();

    return audio;
  }

  /**
   * Load a protest sound
   */
  loadProtestSound(country, index) {
    // const soundKey = `defense.protest.${country}.${index}`;

    const countrySaysNo = country.endsWith("SaysNo") ? country : country + "SaysNo";
    const soundKey = `defense.peopleSayNo.${countrySaysNo}.${index}`;

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
    audio.src = this.resolvePath(soundPath);

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
    audio.src = this.resolvePath(soundPath);

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

  play(category, name, volume = null) {
    if (!this.initialized || this.muted) return Promise.resolve(null);

    // Always ensure AudioContext is resumed (crucial for mobile)
    return this.resumeAudioContext().then(() => {
      // On mobile, use direct approach for reliability
      if (this.isMobile) {
        const soundPath = this.soundFiles[category][name];
        if (soundPath) {
          const audio = this.playDirect(soundPath, volume); // Pass volume here
          return Promise.resolve(audio);
        }
      }

      // Otherwise, check if the sound exists in our cache
      if (!this.sounds[category][name]) {
        if (this.logger) {
          this.logger.debug("audio", `Sound ${category}.${name} not loaded yet, loading now...`);
        }
        this.loadSound(category, name);

        // Try direct play after a short delay
        return new Promise((resolve) => {
          setTimeout(() => {
            const soundPath = this.soundFiles[category][name];
            const audio = this.playDirect(soundPath, volume); // Pass volume here
            resolve(audio);
          }, 100);
        });
      }

      const sound = this.sounds[category][name];

      // Make sure it's a valid audio element
      if (!sound || typeof sound.play !== "function") {
        if (this.logger) {
          this.logger.warn("audio", `Invalid sound object for ${category}.${name}`);
        }
        return Promise.resolve(null);
      }

      if (this.logger) {
        this.logger.debug("audio", `Playing sound: ${category}.${name}`);
      }

      // Reset and play
      sound.currentTime = 0;
      sound.volume = volume !== null ? volume : this.volume; // Use parameter if provided

      try {
        const playPromise = sound.play();
        if (playPromise !== undefined) {
          return playPromise.catch((error) => {
            if (this.logger) {
              this.logger.warn("audio", `Audio playback prevented: ${error}, trying direct method`);
            }
            // Fall back to direct method if regular play fails
            return this.playDirect(this.soundFiles[category][name], volume); // Pass volume here
          });
        }
      } catch (e) {
        if (this.logger) {
          this.logger.error("audio", `Error playing sound: ${e.message}`);
        }
        // Fall back to direct method if regular play fails
        return Promise.resolve(this.playDirect(this.soundFiles[category][name], volume)); // Pass volume here
      }

      return Promise.resolve(sound);
    });
  }

  /**
   * Helper to get a nested property from an object
   * @param {Object} obj - Object to traverse
   * @param {Array} path - Path to the property
   * @returns {*} The property value or undefined
   * @private
   */
  _getNestedProperty(obj, path) {
    return path.reduce((prev, curr) => {
      return prev && prev[curr] !== undefined ? prev[curr] : undefined;
    }, obj);
  }

  /**
   * Fisher-Yates shuffle algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array copy
   * @private
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
   * Get a sound file with consistent, non-repeating randomization
   * @param {string} category - Sound category
   * @param {string} subcategory - Sound subcategory
   * @param {string|null} country - Optional country identifier
   * @returns {string|null} Sound file path or null if not found
   * @private
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
        soundArray = this.catchphraseFiles?.[subcategory] || this.catchphraseFiles?.generic;
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
        console.warn(`[Audio] No sounds found for ${category}.${subcategory}${country ? "." + country : ""}`);
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
      console.warn(`[Audio] Error in _getShuffledSound: ${error.message}`);

      // Fallback: if we can get the first sound from the array, return that
      if (Array.isArray(soundArray) && soundArray.length > 0) {
        return soundArray[0];
      }

      return null;
    }
  }

  /**
   * Stop the grab sound
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

// In AudioManager class

playProtestorSound(country, volume = 0.5) {
  if (this.muted) return null;

  console.log(`[DIAGNOSTIC] playProtestorSound called for ${country} with volume ${volume}`);

  return this.resumeAudioContext().then(() => {
    try {
      // Determine sound country (handle canada specially)
      let soundCountry = country;
      if (country === "canada") {
        soundCountry = Math.random() < 0.5 ? "eastCanada" : "westCanada";
        console.log(`[DIAGNOSTIC] Canada converted to ${soundCountry}`);
      }

      // Ensure it's a valid country
      if (!["eastCanada", "westCanada", "mexico", "greenland", "usa"].includes(soundCountry)) {
        console.warn(`[Audio] Unknown country for protestor sound: ${soundCountry}`);
        soundCountry = "eastCanada"; // Default fallback
      }
console.log("soundCountry");

      // Create key with "Protestors" suffix
      const protestorKey = soundCountry + "Protestors";

      // First stop any existing sound for this country
      this.stopProtestorSound(soundCountry);

      // Get sound file path - safely handle potential missing properties
      let soundFile = null;
      if (this.soundFiles?.defense?.protestors?.[protestorKey]?.[0]) {
        soundFile = this.soundFiles.defense.protestors[protestorKey][0];
      } else {
        console.warn(`[Audio] No protestor sound found for ${protestorKey}`);
        return null;
      }

      console.log(`[DIAGNOSTIC] Playing sound file: ${soundFile} for ${soundCountry}`);

      // Initialize activeProtestorSounds if needed
      if (!this.activeProtestorSounds) {
        this.activeProtestorSounds = {};
      }

      // Create and play the sound with explicit volume control
      const soundObj = new Audio(this.resolvePath(soundFile));
      
      // IMPORTANT: Apply volume before playing
      soundObj.volume = Math.min(1, Math.max(0, volume)) * this.volume; // Ensure volume is clamped and respects master volume

      // Add to currently playing list first
      this.currentlyPlaying.push(soundObj);

      // Store the reference BEFORE playing
      this.activeProtestorSounds[soundCountry] = soundObj;

      // Now play the sound
      soundObj.play().catch((e) => {
        console.warn(`[Audio] Error playing protestor sound: ${e.message}`);

        // If play fails, clean up the references
        const index = this.currentlyPlaying.indexOf(soundObj);
        if (index !== -1) {
          this.currentlyPlaying.splice(index, 1);
        }
        delete this.activeProtestorSounds[soundCountry];
      });

      return soundObj;
    } catch (error) {
      console.warn(`[DIAGNOSTIC] Error in playProtestorSound:`, error.message);
      return null;
    }
  });
}
  stopProtestorSound(country = null) {
    console.log(`[DIAGNOSTIC] stopProtestorSound called with country=${country}`);

    if (!this.activeProtestorSounds) {
      console.log(`[DIAGNOSTIC] activeProtestorSounds is null or undefined, creating empty object`);
      this.activeProtestorSounds = {};
      return;
    }

    console.log(`[DIAGNOSTIC] Current activeProtestorSounds keys:`, Object.keys(this.activeProtestorSounds));

    // Handle canada's two variants
    if (country === "canada") {
      console.log(`[DIAGNOSTIC] Handling canada by stopping eastCanada and westCanada`);
      this._stopSingleProtestorSound("eastCanada");
      this._stopSingleProtestorSound("westCanada");
    } else if (country) {
      console.log(`[DIAGNOSTIC] Stopping single sound for ${country}`);
      this._stopSingleProtestorSound(country);
    } else {
      console.log(`[DIAGNOSTIC] Stopping all protestor sounds`);
      // Stop all protestor sounds
      Object.keys(this.activeProtestorSounds).forEach((key) => {
        this._stopSingleProtestorSound(key);
      });
    }
  }

  _stopSingleProtestorSound(soundCountry) {
    console.log(`[DIAGNOSTIC] _stopSingleProtestorSound called for ${soundCountry}`);

    const sound = this.activeProtestorSounds[soundCountry];
    console.log(`[DIAGNOSTIC] Sound for ${soundCountry} exists:`, !!sound);

    if (sound) {
      console.log(`[DIAGNOSTIC] Attempting to pause sound for ${soundCountry}`);
      try {
        sound.pause();
        console.log(`[DIAGNOSTIC] Sound paused successfully`);
        sound.currentTime = 0;
        console.log(`[DIAGNOSTIC] Sound currentTime reset to 0`);

        // Also remove from currently playing
        const index = this.currentlyPlaying.indexOf(sound);
        console.log(`[DIAGNOSTIC] Sound index in currentlyPlaying:`, index);
        if (index !== -1) {
          this.currentlyPlaying.splice(index, 1);
          console.log(`[DIAGNOSTIC] Sound removed from currentlyPlaying`);
        }
      } catch (e) {
        console.log(`[DIAGNOSTIC] Error stopping sound:`, e.message);
      }

      // Delete the reference regardless of errors
      delete this.activeProtestorSounds[soundCountry];
      console.log(`[DIAGNOSTIC] Sound reference removed from activeProtestorSounds`);
    }
  }

  /**
   * Stop all protestor sounds
   */
  stopAllProtestorSounds() {
    console.log("[Audio] Stopping ALL protestor sounds");
    this.stopProtestorSound();
  }

  getSoundPath(filename) {
    return this.soundPath + filename;
  }

  /**
   * Helper to create new background music
   * @returns {Promise<boolean>} Success status
   * @private
   */
  _createNewBackgroundMusic() {
    try {
      const music = new Audio(this.resolvePath(this.soundFiles.music.background));
      music.loop = true;
      music.volume = this.volume * 0.7;

      return music
        .play()
        .then(() => {
          this.backgroundMusic = music;
          this.backgroundMusicPlaying = true;

          // Listen for ended event (shouldn't happen with loop, but just in case)
          music.addEventListener("ended", () => {
            if (this.backgroundMusicPlaying) {
              music.play().catch((e) => console.warn(`[Audio] Music loop failed:`, e.message));
            }
          });

          return true;
        })
        .catch((error) => {
          console.warn(`[Audio] Background music initial play failed:`, error.message);

          // On mobile, play on next user interaction
          const playOnInteraction = () => {
            this.resumeAudioContext().then(() => {
              music
                .play()
                .then(() => {
                  this.backgroundMusic = music;
                  this.backgroundMusicPlaying = true;
                })
                .catch((e) => console.warn(`[Audio] Interactive music play failed:`, e.message));
            });
          };

          // Set up listeners for user interaction (one-time)
          document.addEventListener("click", playOnInteraction, { once: true });
          document.addEventListener("touchstart", playOnInteraction, { once: true });

          return false;
        });
    } catch (e) {
      console.warn(`[Audio] Error creating background music:`, e.message);
      return Promise.resolve(false);
    }
  }

  // Add this method to AudioManager
  reset() {
    console.log("[Audio] Resetting audio system");

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
   * Simple fading utility for any audio element
   * @param {HTMLAudioElement} audio - Audio element to fade
   * @param {number} targetVolume - Target volume (0.0-1.0)
   * @param {number} duration - Duration in milliseconds
   * @param {Function} callback - Optional callback on completion
   * @returns {number} Interval ID for cleanup
   */
  fadeTo(audio, targetVolume, duration, callback = null) {
    if (!audio) return null;

    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const startTime = performance.now();

    // Clear any existing fade for this audio element
    if (this._fadeIntervals[audio]) {
      clearInterval(this._fadeIntervals[audio]);
    }

    // Create a new interval
    const fadeInterval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Apply volume
      audio.volume = startVolume + volumeDiff * progress;

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
        if (callback && typeof callback === "function") {
          callback();
        }
      }
    }, 50);

    // Store the interval
    this._fadeIntervals[audio] = fadeInterval;

    return fadeInterval;
  }

  /**
   * Play a UI sound by name with optional volume control
   * @param {string} category - Sound category
   * @param {string} name - Sound name
   * @param {number|null} volume - Optional volume override (0.0-1.0)
   * @returns {Promise<HTMLAudioElement|null>} Promise resolving to the audio element or null
   */
  play(category, name, volume = null) {
    console.log(`[AUDIO_FLOW] Attempting to play ${category}.${name}, initialized: ${this.initialized}, muted: ${this.muted}`);

    if (!this.initialized || this.muted) return Promise.resolve(null);

    console.log(`[AUDIO_DEBUG] Play called for: ${category}.${name}`);
    console.log(`[AUDIO_DEBUG] AudioContext state: ${this.audioContext ? this.audioContext.state : "no context"}`);
    console.log(`[AUDIO_DEBUG] Sound exists: ${!!(this.sounds[category] && this.sounds[category][name])}`);

    // Always ensure AudioContext is resumed (crucial for mobile)
    return this.resumeAudioContext().then(() => {
      // On mobile, use direct approach for reliability
      if (this.isMobile) {
        const soundPath = this.soundFiles[category][name];
        if (soundPath) {
          const audio = this.playDirect(soundPath, volume);
          return Promise.resolve(audio);
        }
      }

      // Otherwise, check if the sound exists in our cache
      if (!this.sounds[category][name]) {
        if (this.logger) {
          this.logger.debug("audio", `Sound ${category}.${name} not loaded yet, loading now...`);
        }
        this.loadSound(category, name);

        // Try direct play after a short delay
        return new Promise((resolve) => {
          setTimeout(() => {
            const soundPath = this.soundFiles[category][name];
            const audio = this.playDirect(soundPath, volume);
            resolve(audio);
          }, 100);
        });
      }

      const sound = this.sounds[category][name];

      // Make sure it's a valid audio element
      if (!sound || typeof sound.play !== "function") {
        if (this.logger) {
          this.logger.warn("audio", `Invalid sound object for ${category}.${name}`);
        }
        return Promise.resolve(null);
      }

      if (this.logger) {
        this.logger.debug("audio", `Playing sound: ${category}.${name}`);
      }

      // Reset and play
      sound.currentTime = 0;
      sound.volume = volume !== null ? volume : this.volume;

      try {
        const playPromise = sound.play();
        if (playPromise !== undefined) {
          return playPromise.catch((error) => {
            if (this.logger) {
              this.logger.warn("audio", `Audio playback prevented: ${error}, trying direct method`);
            }
            // Fall back to direct method if regular play fails
            return this.playDirect(this.soundFiles[category][name], volume);
          });
        }
      } catch (e) {
        if (this.logger) {
          this.logger.error("audio", `Error playing sound: ${e.message}`);
        }
        // Fall back to direct method if regular play fails
        return Promise.resolve(this.playDirect(this.soundFiles[category][name], volume));
      }

      return Promise.resolve(sound);
    });
  }

  /**
   * Play a sound file directly by path
   * @param {string} soundPath - Path to the sound file
   * @param {number|null} volume - Optional volume override (0.0-1.0)
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playDirect(soundPath, volume = null) {
    if (!this.initialized || this.muted) return null;

    try {
        // Get an audio element
        const audio = this._getOrCreatePrimedAudio();

        // Set properties including volume AFTER getting from pool
        audio.loop = false;
        audio.muted = false;
        audio.currentTime = 0;

        // Set source and volume
        audio.src = this.resolvePath(soundPath);
        const actualVolume = typeof volume === "number" ? volume : this.volume;
        // Set volume AFTER resetting properties
        audio.volume = actualVolume;

        // Add to tracking
        this.currentlyPlaying.push(audio);

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
        audio.src = ""; // Clear source to release memory

        // Return to pool
        if (window._primedAudioPool) {
          window._primedAudioPool.push(audio);
        }
      };

      // Play it
      console.log(`[AUDIO_DEBUG] Playing ${soundPath} (pool size: ${window._primedAudioPool?.length || 0})`);
      const playPromise = audio.play();

      if (playPromise) {
        playPromise.catch((err) => {
          console.warn(`[AUDIO_DEBUG] Play failed for ${soundPath}: ${err.message}`);

          // Return to pool on failure
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
      console.error(`[AUDIO_DEBUG] Error in playDirect: ${e.message}`);
      return null;
    }
  }

  /**
   * Play a random sound from a category
   * @param {string} category - Sound category
   * @param {string} subcategory - Sound subcategory
   * @param {string|null} country - Optional country identifier
   * @param {number|null} volume - Optional volume override
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playRandom(category, subcategory, country = null, volume = null) {
    if (!this.initialized || this.muted) return null;

    // Determine which file array to use
    let filesArray;
    if (country && subcategory === "peopleSayNo") {
      const countrySaysNo = country.endsWith("SaysNo") ? country : country + "SaysNo";
      filesArray = this.soundFiles.defense.peopleSayNo[countrySaysNo];
    } else {
      filesArray = this.soundFiles[category][subcategory];
    }

    // Make sure we have files to play
    if (!filesArray || filesArray.length === 0) {
      return null;
    }

    // Select a random file
    const randomIndex = Math.floor(Math.random() * filesArray.length);
    const soundFile = filesArray[randomIndex];

    // Play directly for reliability (especially on mobile)
    return this.playDirect(soundFile, volume);
  }

  /**
   * Play a catchphrase sound for a country
   * @param {string} country - Country identifier
   * @param {number|null} volume - Optional volume override
   * @returns {HTMLAudioElement|null} The audio element or null if failed
   */
  playCatchphrase(country, volume = null) {
    if (this.muted) return null;

    // Always ensure AudioContext is resumed first
    return this.resumeAudioContext().then(() => {
      // Handle eastCanada and westCanada as canada
      const actualCountry = country === "eastCanada" || country === "westCanada" ? "canada" : country;

      // Get catchphrase files array
      const catchphrases = this.catchphraseFiles[actualCountry] || this.catchphraseFiles.generic;

      if (!catchphrases || catchphrases.length === 0) {
        return null;
      }

      // Get shuffled sound rather than random
      const soundFile = this._getShuffledSound("catchphrase", actualCountry);

      // Play directly using the correct path
      return this._playDirect(soundFile, volume);
    });
  }

  playGrabWarning(volume = null) {
    if (this.muted) return null;

    // Scale warning time based on game speed
    const scaledWarningTime = this.baseDelays.grabWarning / Math.max(1, this.gameSpeed);

    setTimeout(() => {
      return this.forcePlayCriticalSound("ui", "grabWarning", { volume });
    }, scaledWarningTime);
  }

  /**
   * Start a grab attempt with looping sound and increasing volume
   * @param {string} country - Country being grabbed
   * @param {number|null} initialVolume - Optional initial volume override (0.0-1.0)
   * @returns {Promise<HTMLAudioElement|null>} Promise resolving to the audio element
   */
  playGrabAttempt(country, initialVolume = null) {
    if (this.muted) return null;

    // Stop any existing grab sound
    this.stopGrabSound();

    // Set initial grab volume if provided
    if (initialVolume !== null) {
      this.currentGrabVolume = initialVolume;
    }

    // Use force play for grab attempt
    return this.forcePlayCriticalSound("trump", "trumpGrabbing", {
      volume: this.currentGrabVolume * this.volume,
    }).then((grabSound) => {
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
  playSuccessfulGrab(country, volume = null) {
    if (this.muted) return null;
  
    this.stopGrabSound();
  
    return this.resumeAudioContext().then(() => {
      // Play "ya" first
      const yaFile = this._getShuffledSound("trump", "trumpYa");
      const yaSound = this._playDirect(yaFile, volume);
  
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
        const annexSound = this._playDirect(successFile, volume);
  
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

  playSuccessfulBlock(country, volume = null) {
    this.stopGrabSound();

    return this.resumeAudioContext().then(() => {
      const slapFile = this._getShuffledSound("defense", "slap");
      this._playDirect(slapFile, volume);

      // Scale both delays by game speed
      const scaledSobDelay = this.baseDelays.sobToProtest / Math.max(1, this.gameSpeed);
      const scaledProtestDelay = this.baseDelays.protest / Math.max(1, this.gameSpeed);

      setTimeout(() => {
        const sobFile = this._getShuffledSound("trump", "trumpSob");
        this._playDirect(sobFile, volume);

        setTimeout(() => {
          const protestFile = this._getShuffledSound("defense", "peopleSayNo", country);
          this._playDirect(protestFile, volume);
        }, scaledProtestDelay);
      }, scaledSobDelay);

      return true;
    });
  }

  playCountryFullyAnnexedCry(country, volume = null) {
    if (this.muted) return null;

    return this.resumeAudioContext().then(() => {
      const annexFile = this._getShuffledSound("trump", "fullAnnexCry");
      const annexSound = this._playDirect(annexFile, volume);

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
   * Force play a critical sound to ensure playback
   * @param {string} category - Sound category
   * @param {string} name - Sound name
   * @param {Object} options - Options including volume
   * @returns {Promise<HTMLAudioElement|null>} Promise resolving to the audio element
   */
  forcePlayCriticalSound(category, name, options = {}) {
    if (!this.initialized || this.muted) return Promise.resolve(null);

    console.log(`[AUDIO_DEBUG] Force-playing critical sound: ${category}.${name}`);

    // Get sound path
    let soundPath;

    if (category === "trump" && name === "trumpGrabbing") {
      soundPath = this.soundFiles.trump.trumpGrabbing[0];
    } else if (category === "ui" && name === "grabWarning") {
      soundPath = this.soundFiles.ui.grabWarning;
    } else {
      soundPath = this.soundFiles[category][name];
    }

    // Use playDirect for consistency
    return Promise.resolve(this.playDirect(soundPath, options.volume));
  }

  /**
   * Playback helper using shuffled system with direct Audio elements
   * @param {string} soundPath - Path to sound file
   * @param {number|null} volume - Optional volume override
   * @returns {HTMLAudioElement|null} The audio element
   * @private
   */
  _playDirect(soundPath, volume = null) {
    return this.playDirect(soundPath, volume);
  }

  /**
   * Play a sequence of sounds with delays between them
   * @param {Array} sequence - Array of objects with category, name, delay, and volume props
   * @returns {Promise} Resolves when sequence completes
   */
  playSequence(sequence) {
    return new Promise((resolve) => {
      const playNextSound = (index) => {
        if (index >= sequence.length) {
          resolve();
          return;
        }

        const { category, name, delay = 0, volume = null } = sequence[index];

        // Play current sound with volume parameter
        this.play(category, name, volume)
          .then((sound) => {
            // Schedule next sound after delay or sound duration
            const nextDelay = delay || (sound && sound.duration ? sound.duration * 1000 + 100 : 1500);

            setTimeout(() => {
              playNextSound(index + 1);
            }, nextDelay);
          })
          .catch(() => {
            // If sound fails, continue sequence after delay
            setTimeout(() => {
              playNextSound(index + 1);
            }, delay || 1500);
          });
      };

      // Start sequence
      playNextSound(0);
    });
  }

  startBackgroundMusic(volume = null) {
    if (!this.initialized || this.muted) return Promise.resolve(false);

    // Resume AudioContext first (mobile requirement)
    return this.resumeAudioContext().then(() => {
        try {
            // Get audio element from pool instead of creating new one
            const music = this._getOrCreatePrimedAudio();
            
            music.loop = true;
            music.src = this.resolvePath(this.soundFiles.music.background);
            
            // IMPORTANT: Reset volume to default if it was previously faded
            const defaultVolume = 0.5; // Background music plays at 50% by default
            music.volume = volume !== null ? volume : this.volume * defaultVolume;

            const playPromise = music.play();
            if (playPromise !== undefined) {
                return playPromise
                    .then(() => {
                        this.backgroundMusic = music;
                        this.backgroundMusicPlaying = true;
                        return true;
                    })
                    .catch((error) => {
                        if (window._primedAudioPool) {
                            window._primedAudioPool.push(music);
                        }
                        console.warn("[AUDIO_DEBUG] Background music prevented:", error);
                        return false;
                    });
            }

            this.backgroundMusic = music;
            this.backgroundMusicPlaying = true;
            return Promise.resolve(true);
        } catch (e) {
            console.error("[AUDIO_DEBUG] Error starting background music:", e.message);
            return Promise.resolve(false);
        }
    });
}

  /**
   * Play sound for growing protestors with volume control
   * @param {number|null} volume - Optional volume override
   * @returns {HTMLAudioElement|null} The audio element
   */
  playGrowProtestorsSound(volume = null) {
    if (this.muted) return null;

    // Always ensure AudioContext is resumed first
    return this.resumeAudioContext().then(() => {
      return this._playDirect(this.soundFiles.ui.growProtestors, volume);
    });
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
      this.backgroundMusic.volume = this.volume * 0.7;
    }

    // Update grab sound volume if active
    if (this.activeGrabSound) {
      this.activeGrabSound.volume = this.currentGrabVolume * this.volume;
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
    // Resume the AudioContext first
    this.resumeAudioContext().then(() => {
      // Resume background music if it was playing
      if (this.backgroundMusic && this.backgroundMusicPlaying) {
        this.backgroundMusic.play().catch((e) => {
          console.warn(`[Audio] Could not resume background music:`, e.message);
        });
      }

      // Resume grab sound if it was active
      if (this.activeGrabSound) {
        this.activeGrabSound.play().catch((e) => {
          console.warn(`[Audio] Could not resume grab sound:`, e.message);
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
   * @param {Object} options - Options for stopping (exceptBackgroundMusic)
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
   * Ensure sounds are loaded properly - helps with mobile issues
   */
  ensureSoundsAreLoaded() {
    // Check if any sounds are loaded
    if (this.loadedSounds.size === 0 && this.isMobile) {
      console.warn("[Audio] No sounds loaded yet, trying with alternate path");

      // Try with a different path approach for mobile
      const baseUrl = window.location.origin + window.location.pathname;
      const altPath = baseUrl.endsWith("/") ? baseUrl + "sounds/" : baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1) + "sounds/";

      if (this.soundPath !== altPath) {
        this.soundPath = altPath;

        // Reload essential sounds
        this.preloadEssentialSounds();
      }
    }
  }

  /**
   * Prepare the audio system for a game restart
   */
  prepareForRestart() {
    // Stop all sounds
    this.stopAll();

    // Reset state but keep our sound definitions
    this.volume = 1.0;
    this.muted = false;

    // Unlock audio again
    return this.unlock();
  }

  /**
   * Clean up all audio resources
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

    // Remove event listeners
    document.removeEventListener("visibilitychange", this._handlePageHidden);

    // Close audio context if possible
    if (this.audioContext && typeof this.audioContext.close === "function") {
      this.audioContext.close().catch((e) => {
        console.warn(`[Audio] Error closing AudioContext:`, e.message);
      });
    }

    console.log("[Audio] Cleanup complete");
  }
}

// Simple Audio Helper with minimal functions
class AudioHelper {
  /**
   * Get the audio manager from a context
   * @param {Object} context - The context
   * @returns {AudioManager|null} The audio manager
   */
  static getAudioManager(context) {
    if (context.systems && context.systems.audio) return context.systems.audio;
    if (context.audioManager) return context.audioManager;
    if (window.audioManager) return window.audioManager;
    return null;
  }

  /**
   * Initialize the audio system
   * @param {Object} engine - The game engine
   */
  static initAudioSystem(engine) {
    if (!window.audioManager && typeof AudioManager === "function") {
      window.audioManager = new AudioManager();
      if (engine && engine.systems) {
        engine.systems.audio = window.audioManager;
      }
    }
  }

  /**
   * Play a sound through the audio manager
   * @param {Object} context - The context
   * @param {string} category - Sound category
   * @param {string} name - Sound name
   * @param {string|null} country - Optional country
   * @param {number|null} volume - Optional volume
   * @returns {HTMLAudioElement|null} The audio element
   */
  static playSound(context, category, name, country = null, volume = null) {
    const audio = this.getAudioManager(context);
    if (!audio) return null;

    return audio.play(category, name, { volume: volume });
  }

  /**
   * Start background music
   * @param {Object} context - The context
   * @returns {Promise<boolean>} Success status
   */
  static startBackgroundMusic(context) {
    const audio = this.getAudioManager(context);
    if (!audio) return Promise.resolve(false);

    return audio.startBackgroundMusic();
  }

  /**
   * Unlock audio for mobile
   * @param {Object} context - The context
   * @returns {Promise<boolean>} Success status
   */
  static unlockAudio(context) {
    const audio = this.getAudioManager(context);
    if (!audio) return Promise.resolve(false);

    return audio.unlock();
  }

  /**
   * Set up audio in a game manager
   * @param {Object} manager - The game manager
   */
  static setupManagerAudio(manager) {
    Object.defineProperty(manager, "audio", {
      get: function () {
        return AudioHelper.getAudioManager(this);
      },
    });
  }
}

// Make it globally available
window.AudioHelper = AudioHelper;
