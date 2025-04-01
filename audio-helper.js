// /**
//  * AudioHelper - Consistent audio utility functions
//  */
// class AudioHelper {
//   /**
//    * Get the appropriate audio manager instance
//    * @param {Object} context - The calling context (this)
//    * @returns {Object|null} The audio manager instance or null
//    */
//   static getAudioManager(context) {
//     // In order of preference
//     if (context.systems && context.systems.audio) return context.systems.audio;
//     if (context.audioManager) return context.audioManager;
//     if (window.audioManager) return window.audioManager;
//     return null;
//   }

// /**
//  * Initialize or ensure audio system exists
//  * @param {Object} context - The calling context (this)
//  * @returns {Object|null} The audio manager
//  */
// static initAudioSystem(context) {
//   // Check if audio system already exists
//   let audioSystem = this.getAudioManager(context);
//   if (audioSystem) {
//     console.log("[AudioHelper] Using existing audio system");
//     return audioSystem;
//   }
  
//   try {
//     // Create new AudioManager if needed
//     if (typeof AudioManager !== 'function') {
//       console.error("[AudioHelper] AudioManager class not found");
//       return null;
//     }
    
//     console.log("[AudioHelper] Creating new AudioManager instance");
    
//     // Create a new instance
//     const newAudioManager = new AudioManager();
    
//     // Initialize it (but don't await - let it run async)
//     newAudioManager.init().catch(err => {
//       console.warn("[AudioHelper] Audio initialization failed:", err);
//     });
    
//     // Store in all possible locations to ensure consistency
//     window.audioManager = newAudioManager;
    
//     if (context.systems) {
//       context.systems.audio = newAudioManager;
//     } else if (typeof context.audioManager === 'undefined') {
//       context.audioManager = newAudioManager;
//     }
    
//     // Return the new instance
//     return newAudioManager;
//   } catch (e) {
//     console.error("[AudioHelper] Error initializing audio system:", e);
//     return null;
//   }
// }

// /**
//  * Safely play a sound with better error handling
//  * @param {Object} context - The calling context (this)
//  * @param {string} category - Sound category
//  * @param {string} name - Sound name
//  * @param {Object} options - Optional parameters (volume, etc.)
//  * @returns {Promise<HTMLAudioElement|null>} The audio element or null
//  */
// static safePlay(context, category, name, options = {}) {
//   // Get the audio manager, checking for both common patterns
//   let audio = null;
  
//   // Try to get the audio manager directly first
//   if (context && typeof context.play === 'function') {
//     // Context itself appears to be an audio manager
//     audio = context;
//   } else {
//     // Otherwise get via helper method
//     audio = this.getAudioManager(context);
//   }
  
//   if (!audio) {
//     console.warn(`[AudioHelper] No audio manager found for ${category}.${name}`);
//     return Promise.resolve(null);
//   }

//   const volume = options.volume !== undefined ? options.volume : null;
//   const isFromHelper = options.isFromHelper || false;

//   return Promise.resolve()
//     .then(() => {
//       // Prevent infinite recursion
//       if (isFromHelper) {
//         // If we're already coming from a helper, use direct play methods
//         if (typeof audio.playDirect === 'function') {
//           try {
//             // Try to find the sound path
//             let soundPath = null;
//             if (audio.soundFiles && audio.soundFiles[category] && audio.soundFiles[category][name]) {
//               soundPath = audio.soundFiles[category][name];
//               return audio.playDirect(soundPath, volume);
//             }
//           } catch (e) {
//             console.warn(`[AudioHelper] Error in direct playback fallback: ${e.message}`);
//           }
//         }
//         return null;
//       }
      
//       // Try the audio manager's safePlay first if available
//       if (typeof audio.safePlay === 'function') {
//         return audio.safePlay(category, name, volume);
//       }

//       // Fall back to regular play with catch
//       if (typeof audio.play === 'function') {
//         return audio.play(category, name, volume).catch((err) => {
//           console.warn(`[AudioHelper] Error playing ${category}.${name}: ${err.message}`);
//           return null;
//         });
//       }

//       // Last resort direct play
//       if (typeof audio.playDirect === 'function') {
//         let soundPath = null;
//         try {
//           // Try to find the sound path
//           if (audio.soundFiles && audio.soundFiles[category] && audio.soundFiles[category][name]) {
//             soundPath = audio.soundFiles[category][name];
//           }
//         } catch (e) {
//           console.warn(`[AudioHelper] Could not resolve sound path: ${e.message}`);
//         }

//         if (soundPath) {
//           return audio.playDirect(soundPath, volume);
//         }
//       }

//       console.warn(`[AudioHelper] No method available to play ${category}.${name}`);
//       return null;
//     })
//     .catch((error) => {
//       console.error(`[AudioHelper] Unexpected error playing ${category}.${name}: ${error.message}`);
//       return null;
//     });
// }

//   /**
//    * Play UI click sound
//    * @param {Object} context - The calling context (this)
//    * @returns {Promise<HTMLAudioElement|null>} The audio element or null
//    */
//   static playUIClick(context) {
//     return this.safePlay(context, "ui", "click");
//   }

//   /**
//    * Safely stop the grab sound
//    * @param {Object} context - The calling context (this)
//    */
//   static stopGrabSound(context) {
//     const audio = this.getAudioManager(context);
//     if (!audio) return;

//     try {
//       if (typeof audio.stopGrabSound === "function") {
//         audio.stopGrabSound();
//       }
//     } catch (e) {
//       console.warn("Error stopping grab sound:", e);
//     }
//   }

//   /**
//    * Pause all audio (for game pause)
//    * @param {Object} context - The calling context (this)
//    */
//   static pauseAllAudio(context) {
//     const audio = this.getAudioManager(context);
//     if (!audio) return;

//     try {
//       if (typeof audio.pauseAll === "function") {
//         audio.pauseAll();
//       } else {
//         // Manual fallback
//         if (audio.backgroundMusic) {
//           audio.backgroundMusic.pause();
//         }

//         if (audio.currentlyPlaying && Array.isArray(audio.currentlyPlaying)) {
//           audio.currentlyPlaying.forEach((sound) => {
//             if (sound && !sound.paused) {
//               sound.pause();
//             }
//           });
//         }

//         if (typeof audio.stopGrabSound === "function") {
//           audio.stopGrabSound();
//         }
//       }
//     } catch (e) {
//       console.warn("Error pausing audio:", e);
//     }
//   }

//   /**
//    * Resume all audio (for game unpause)
//    * @param {Object} context - The calling context (this)
//    */
//   static resumeAllAudio(context) {
//     const audio = this.getAudioManager(context);
//     if (!audio) return;

//     try {
//       if (typeof audio.resumeAll === "function") {
//         audio.resumeAll();
//       } else {
//         // Manual fallback
//         if (audio.backgroundMusic && audio.backgroundMusicPlaying) {
//           audio.backgroundMusic.play().catch((e) => {
//             console.warn("Could not resume background music:", e);
//           });
//         }
//       }
//     } catch (e) {
//       console.warn("Error resuming audio:", e);
//     }
//   }

//   /**
//    * Start background music with built-in mobile safeguards
//    * @param {Object} context - The calling context (this)
//    * @returns {Promise<boolean>} Success flag
//    */
//   static startBackgroundMusic(context) {
//     const audio = this.getAudioManager(context);
//     if (!audio) return Promise.resolve(false);

//     // First ensure audio context is resumed (important for mobile)
//     let resumePromise = Promise.resolve();
//     if (typeof audio.resumeAudioContext === "function") {
//       resumePromise = audio.resumeAudioContext().catch((err) => {
//         console.warn("Could not resume audio context:", err);
//         return Promise.resolve(); // Continue anyway
//       });
//     } else if (typeof audio.unlock === "function") {
//       resumePromise = audio.unlock().catch((err) => {
//         console.warn("Could not unlock audio:", err);
//         return Promise.resolve(); // Continue anyway
//       });
//     }

//     return resumePromise
//       .then(() => {
//         // Try the preferred method
//         if (typeof audio.startBackgroundMusic === "function") {
//           return audio.startBackgroundMusic().catch((e) => {
//             console.warn("Background music start failed, trying fallback:", e);
//             return this._startFallbackMusic(audio);
//           });
//         } else {
//           return this._startFallbackMusic(audio);
//         }
//       })
//       .catch((error) => {
//         console.warn("Background music start error:", error);
//         return this._startFallbackMusic(audio);
//       });
//   }

//   /**
//    * Internal method for fallback music playback
//    * @private
//    * @param {Object} audio - Audio manager instance
//    * @returns {Promise<boolean>} Success flag
//    */
//   static _startFallbackMusic(audio) {
//     try {
//       // Clean up any existing fallback
//       if (audio._fallbackMusic) {
//         audio._fallbackMusic.pause();
//         audio._fallbackMusic = null;
//       }

//       // Create new Audio element
//       const music = new Audio();

//       // Try to determine the correct source
//       let musicPath;
//       if (typeof audio.resolveSoundPath === "function") {
//         musicPath = audio.resolveSoundPath("background-music.mp3", "music");
//       } else if (audio.soundFiles && audio.soundFiles.music && audio.soundFiles.music.background) {
//         musicPath = audio.soundPath ? audio.soundPath + audio.soundFiles.music.background : audio.soundFiles.music.background;
//       } else {
//         // Last resort fallback path
//         const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
//         musicPath = baseUrl + "sounds/background-music.mp3";
//       }

//       music.src = musicPath;
//       music.loop = true;
//       music.volume = 0.7;

//       // Store reference
//       audio._fallbackMusic = music;
//       audio.backgroundMusic = music;
//       audio.backgroundMusicPlaying = true;

//       // Return a promise for the play attempt
//       return music
//         .play()
//         .then(() => {
//           return true;
//         })
//         .catch((e) => {
//           console.warn("Fallback music failed to autoplay:", e);

//           // On mobile, set up to play on next user interaction
//           const playOnInteraction = function () {
//             music.play().catch((e) => console.warn("Interaction music play failed:", e));
//             document.removeEventListener("click", playOnInteraction);
//             document.removeEventListener("touchstart", playOnInteraction);
//           };

//           document.addEventListener("click", playOnInteraction, { once: true });
//           document.addEventListener("touchstart", playOnInteraction, { once: true });

//           return false;
//         });
//     } catch (e) {
//       console.warn("Could not create fallback music:", e);
//       return Promise.resolve(false);
//     }
//   }

//   /**
//    * Play successful block sound sequence
//    * @param {Object} context - The calling context (this)
//    * @param {string} country - Country identifier
//    * @returns {boolean} Success flag
//    */
//   static playSuccessfulBlock(context, country) {
//     const audio = this.getAudioManager(context);
//     if (!audio) return false;

//     let success = false;

//     // Try to use the dedicated method first
//     if (typeof audio.playSuccessfulBlock === "function") {
//       try {
//         audio.playSuccessfulBlock(country);
//         success = true;
//       } catch (e) {
//         console.warn("Error playing block sound via dedicated method:", e);
//       }
//     }

//     // If dedicated method failed, try manual sequence
//     if (!success) {
//       // First try to stop grab sound (important)
//       if (typeof audio.stopGrabSound === "function") {
//         try {
//           audio.stopGrabSound();
//         } catch (e) {
//           console.warn("Error stopping grab sound:", e);
//         }
//       }

//       // Try to play slap sound
//       try {
//         if (typeof audio.playRandom === "function") {
//           audio.playRandom("defense", "slap");
//         } else if (typeof audio.play === "function") {
//           audio.play("defense", "slap");
//         } else if (
//           typeof audio.playDirect === "function" &&
//           audio.soundFiles &&
//           audio.soundFiles.defense &&
//           audio.soundFiles.defense.slap &&
//           audio.soundFiles.defense.slap[0]
//         ) {
//           audio.playDirect(audio.soundFiles.defense.slap[0]);
//         }

//         // After a delay, play the sob sound
//         setTimeout(() => {
//           try {
//             if (typeof audio.playRandom === "function") {
//               audio.playRandom("trump", "trumpSob");
//             } else if (typeof audio.play === "function") {
//               audio.play("trump", "trumpSob");
//             } else if (
//               typeof audio.playDirect === "function" &&
//               audio.soundFiles &&
//               audio.soundFiles.trump &&
//               audio.soundFiles.trump.sob &&
//               audio.soundFiles.trump.sob[0]
//             ) {
//               audio.playDirect(audio.soundFiles.trump.sob[0]);
//             }

//             // Then after another delay, play country-specific protest
//             setTimeout(() => {
//               if (typeof audio.playRandom === "function") {
//                 audio.playRandom("defense", "peopleSayNo", country);
//               }
//             }, 350); // Use typical protest delay
//           } catch (e2) {
//             console.warn("Error playing sob sound:", e2);
//           }
//         }, 200);

//         success = true;
//       } catch (e) {
//         console.warn("Error playing slap sound:", e);
//       }
//     }

//     return success;
//   }

//   /**
//    * Stop all audio with options
//    * @param {Object} context - The calling context (this)
//    * @param {Object} options - Options {exceptBackgroundMusic: boolean}
//    */
//   static stopAllAudio(context, options = {}) {
//     const audio = this.getAudioManager(context);
//     if (!audio) return;

//     try {
//       // Try to use the dedicated method
//       if (typeof audio.stopAll === "function") {
//         audio.stopAll(options);
//         return;
//       }

//       // Manual fallback implementation

//       // Stop grab sound first (important)
//       if (typeof audio.stopGrabSound === "function") {
//         try {
//           audio.stopGrabSound();
//         } catch (e) {
//           console.warn("Error stopping grab sound:", e);
//         }
//       }

//       // Stop background music if not excepted
//       if (!options.exceptBackgroundMusic) {
//         if (typeof audio.stopBackgroundMusic === "function") {
//           try {
//             audio.stopBackgroundMusic();
//           } catch (e) {
//             console.warn("Error stopping background music:", e);
//           }
//         } else if (audio.backgroundMusic) {
//           audio.backgroundMusic.pause();
//           audio.backgroundMusic.currentTime = 0;
//           audio.backgroundMusicPlaying = false;
//         }
//       }

//       // Stop all currently playing sounds
//       if (Array.isArray(audio.currentlyPlaying)) {
//         audio.currentlyPlaying.forEach((sound) => {
//           if (sound) {
//             try {
//               sound.pause();
//               sound.currentTime = 0;
//             } catch (e) {
//               console.warn("Error stopping sound:", e);
//             }
//           }
//         });

//         // Clear the array
//         audio.currentlyPlaying = [];
//       }

//       // Stop protestor sounds if method exists
//       if (typeof audio.stopAllProtestorSounds === "function") {
//         try {
//           audio.stopAllProtestorSounds();
//         } catch (e) {
//           console.warn("Error stopping protestor sounds:", e);
//         }
//       }
//     } catch (e) {
//       console.warn("Error in stopAllAudio:", e);
//     }
//   }

//   /**
//    * Play a random sound from a category
//    * @param {Object} context - The calling context (this)
//    * @param {string} category - Sound category
//    * @param {string} subcategory - Sound subcategory
//    * @param {string|null} country - Optional country for country-specific sounds
//    * @param {number|null} volume - Optional volume override
//    * @returns {HTMLAudioElement|null} The audio element or null
//    */
//   static playRandom(context, category, subcategory, country = null, volume = null) {
//     const audio = this.getAudioManager(context);
//     if (!audio) return null;

//     try {
//       // Use dedicated method if available
//       if (typeof audio.playRandom === "function") {
//         return audio.playRandom(category, subcategory, country, volume);
//       }

//       // Manual implementation for critical cases
//       let soundFile = null;
//       let soundArray = null;

//       // Try to find the appropriate sound array
//       if (country && subcategory === "peopleSayNo") {
//         // Handle protest sounds with country
//         if (audio.soundFiles && audio.soundFiles.defense && audio.soundFiles.defense.protest && audio.soundFiles.defense.protest[country]) {
//           soundArray = audio.soundFiles.defense.protest[country];
//         }
//       } else if (audio.soundFiles && audio.soundFiles[category] && audio.soundFiles[category][subcategory]) {
//         soundArray = audio.soundFiles[category][subcategory];
//       }

//       // Get a random sound if we found an array
//       if (soundArray && Array.isArray(soundArray) && soundArray.length > 0) {
//         const randomIndex = Math.floor(Math.random() * soundArray.length);
//         soundFile = soundArray[randomIndex];
//       }

//       // Play the sound if we found one
//       if (soundFile && typeof audio.playDirect === "function") {
//         return audio.playDirect(soundFile, volume);
//       }

//       return null;
//     } catch (e) {
//       console.warn(`Error in playRandom for ${category}.${subcategory}:`, e);
//       return null;
//     }
//   }

//   /**
//    * Play appropriate sound for country grab/annexation
//    * @param {Object} context - The calling context (this)
//    * @param {string} country - Country identifier
//    * @param {boolean} isFullAnnexation - If true, play annexation sound
//    * @returns {HTMLAudioElement|null} The audio element or null
//    */
//   static playCountryGrab(context, country, isFullAnnexation = false) {
//     const audio = this.getAudioManager(context);
//     if (!audio || !country) return null;

//     try {
//       // Stop any existing grab sound first
//       if (typeof audio.stopGrabSound === "function") {
//         audio.stopGrabSound();
//       }

//       // Try to load country-specific sounds
//       if (typeof audio.loadCountrySounds === "function") {
//         audio.loadCountrySounds(country);
//       }

//       // Use dedicated methods if available
//       if (isFullAnnexation) {
//         if (typeof audio.playCountryAnnexed === "function") {
//           return audio.playCountryAnnexed(country);
//         } else if (typeof audio.playTrumpClaimSound === "function") {
//           return audio.playTrumpClaimSound(country, true);
//         }
//       } else {
//         if (typeof audio.playSuccessfulGrab === "function") {
//           return audio.playSuccessfulGrab(country);
//         } else if (typeof audio.playTrumpClaimSound === "function") {
//           return audio.playTrumpClaimSound(country, false);
//         }
//       }

//       // Fallback implementation
//       const soundType = isFullAnnexation ? "annex" : "partialAnnexCry";

//       // Try to play the sound using playRandom
//       if (typeof audio.playRandom === "function") {
//         const sound = audio.playRandom("trump", soundType);

//         // Try to play a catchphrase after a delay
//         const catchphraseDelay = 1500;
//         setTimeout(() => {
//           if (typeof audio.playCatchphrase === "function") {
//             audio.playCatchphrase(country);
//           } else if (typeof audio.playRandom === "function" && audio.catchphraseFiles) {
//             audio.playRandom("catchphrase", country);
//           }
//         }, catchphraseDelay);

//         return sound;
//       }

//       return this.safePlay(context, "trump", soundType);
//     } catch (e) {
//       console.warn(`Error in playCountryGrab for ${country}:`, e);
//       return null;
//     }
//   }
// /**
//  * Unlock audio on mobile - call on user interaction
//  * @param {Object} context - The calling context (this)
//  * @returns {Promise<boolean>} Success flag
//  */
// static unlockAudio(context) {
//   const audio = this.getAudioManager(context);
//   if (!audio) return Promise.resolve(false);

//   // Try to create and play a silent sound
//   try {
//     const silentSound = new Audio(
//       "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAGAAADAABgYGBgYGBgYGBgkJCQkJCQkJCQkJCQwMDAwMDAwMDAwMDA4ODg4ODg4ODg4ODg//////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAAAwDVxttG//sUxAADwAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV"
//     );
//     silentSound.volume = 0.01;
//     silentSound.play().catch((e) => console.log("Silent sound play prevented"));
//   } catch (e) {
//     console.warn("Silent sound creation failed:", e);
//   }

//   // Check if the audio manager has the internal unlock method to avoid recursion
//   if (typeof audio._unlockAudioInternal === 'function') {
//     return audio._unlockAudioInternal(true);
//   }
  
//   // Otherwise try standard unlock
//   if (typeof audio.unlock === 'function') {
//     try {
//       return audio.unlock();
//     } catch (e) {
//       console.warn("Direct audio unlock failed:", e);
//     }
//   }
  
//   // If none of the above methods worked, try to create/resume AudioContext directly
//   try {
//     if (audio.audioContext) {
//       return audio.audioContext.resume()
//         .then(() => {
//           console.log("AudioContext resumed directly in helper");
//           return true;
//         })
//         .catch(e => {
//           console.warn("Helper AudioContext resume failed:", e);
//           return false;
//         });
//     }
//   } catch (e) {
//     console.warn("Helper AudioContext access failed:", e);
//   }

//   return Promise.resolve(false);
// }

//   /**
//    * Prepare audio for game start - good for mobile initialization
//    * @param {Object} context - The calling context (this)
//    * @param {boolean} playStartSound - Whether to play the game start sound
//    * @returns {Promise<boolean>} Success flag
//    */
//   static prepareAudio(context, playStartSound = true) {
//     const audio = this.getAudioManager(context);
//     if (!audio) return Promise.resolve(false);

//     // Determine if we need to restart
//     let needsRestart = false;
//     try {
//       needsRestart = sessionStorage.getItem("audioNeedsRestart") === "true";
//       if (needsRestart) {
//         sessionStorage.removeItem("audioNeedsRestart");
//       }
//     } catch (e) {
//       console.warn("Could not check audio restart state:", e);
//     }

//     // Stop any existing sounds first
//     this.stopAllAudio(context);

//     // Unlock audio for mobile
//     return this.unlockAudio(context).then((unlocked) => {
//       // Play start sound if requested
//       if (unlocked && playStartSound) {
//         this.safePlay(context, "ui", "gameStart");
//       }

//       // Start background music with appropriate timing
//       const musicStartDelay = needsRestart ? 300 : 1000;

//       // Start background music after a delay
//       setTimeout(() => {
//         this.startBackgroundMusic(context).then((success) => {
//           if (!success) {
//             console.warn("Background music start failed in prepareAudio");
//           }
//         });
//       }, musicStartDelay);

//       // Preload game sounds
//       if (typeof audio.preloadGameSounds === "function") {
//         setTimeout(() => {
//           audio.preloadGameSounds();
//         }, 2000);
//       }

//       return unlocked;
//     });
//   }

//   /**
//    * Fade audio volume from current to target over a duration
//    * @param {Object} context - The calling context (this)
//    * @param {HTMLAudioElement} audio - Audio element to fade
//    * @param {number} targetVolume - Target volume (0-1)
//    * @param {number} duration - Fade duration in milliseconds
//    * @param {Function} callback - Optional callback on completion
//    * @returns {number} Interval ID for cleanup
//    */
//   static fadeTo(context, audio, targetVolume, duration, callback = null) {
//     if (!audio) return null;

//     const startVolume = audio.volume;
//     const volumeDiff = targetVolume - startVolume;
//     const startTime = performance.now();

//     // Clear any existing fade for this audio element
//     if (this._fadeIntervals && this._fadeIntervals[audio]) {
//       clearInterval(this._fadeIntervals[audio]);
//     }

//     // Initialize the fade intervals object if it doesn't exist
//     if (!this._fadeIntervals) this._fadeIntervals = {};

//     // Create a new interval
//     const fadeInterval = setInterval(() => {
//       const elapsed = performance.now() - startTime;
//       const progress = Math.min(elapsed / duration, 1);

//       // Apply eased volume
//       const easedProgress = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Smoother easing
//       audio.volume = startVolume + volumeDiff * easedProgress;

//       // If complete
//       if (progress >= 1) {
//         clearInterval(fadeInterval);
//         delete this._fadeIntervals[audio];

//         // If we faded to zero, stop the audio
//         if (targetVolume <= 0.02) {
//           audio.pause();
//           audio.currentTime = 0;
//         }

//         // Execute callback if provided
//         if (callback && typeof callback === "function") {
//           callback();
//         }
//       }
//     }, 50); // Run the fade at 20fps for smooth transition

//     // Store the interval
//     this._fadeIntervals[audio] = fadeInterval;

//     return fadeInterval;
//   }

//   /**
//    * Fade out background music and stop it
//    * @param {Object} context - The calling context (this)
//    * @param {number} duration - Fade duration in milliseconds
//    * @returns {number|null} Interval ID or null if failed
//    */
//   static fadeOutBackgroundMusic(context, duration = 3000) {
//     const audio = this.getAudioManager(context);
//     if (!audio || !audio.backgroundMusic) return null;

//     return this.fadeTo(context, audio.backgroundMusic, 0, duration, () => {
//       // Once completely faded out, stop the music
//       if (typeof audio.stopBackgroundMusic === "function") {
//         audio.stopBackgroundMusic();
//       } else {
//         audio.backgroundMusic.pause();
//         audio.backgroundMusic.currentTime = 0;
//         audio.backgroundMusicPlaying = false;
//       }
//     });
//   }

//   /**
//  * Play a warning sound before a grab
//  * @param {Object} context - The calling context (this)
//  * @param {number|null} volume - Optional volume override
//  * @returns {HTMLAudioElement|null} The audio element or null
//  */
// static playGrabWarning(context, volume = null) {
//   const audio = this.getAudioManager(context);
//   if (!audio) return null;
  
//   try {
//     if (typeof audio.playGrabWarning === 'function') {
//       return audio.playGrabWarning(volume);
//     } else {
//       return this.safePlay(context, "ui", "grabWarning", {volume: volume || 0.7});
//     }
//   } catch (e) {
//     console.warn("Error playing grab warning:", e);
//     return null;
//   }
// }

// /**
//  * Start a grab attempt with appropriate sounds
//  * @param {Object} context - The calling context (this)
//  * @param {string} country - Target country
//  * @returns {HTMLAudioElement|null} The audio element or null
//  */
// static playGrabAttempt(context, country) {
//   const audio = this.getAudioManager(context);
//   if (!audio) return null;
  
//   try {
//     if (typeof audio.playGrabAttempt === 'function') {
//       return audio.playGrabAttempt(country);
//     } else if (typeof audio.playRandom === 'function') {
//       return audio.playRandom("trump", "trumpGrabbing", null, 0.6);
//     } else {
//       return this.safePlay(context, "trump", "trumpGrabbing", {volume: 0.6});
//     }
//   } catch (e) {
//     console.warn("Error playing grab attempt:", e);
//     return null;
//   }
// }



// /**
//  * Play speed change sound
//  * @param {Object} context - The calling context (this)
//  * @param {Object} speedLevel - Speed level object with optional sound property
//  */
// static playSpeedChangeSound(context, speedLevel) {
//   if (speedLevel && speedLevel.sound) {
//     this.safePlay(context, "ui", speedLevel.sound).catch(() => {
//       // Fall back to generic speedup sound
//       this.safePlay(context, "ui", "speedup");
//     });
//   } else {
//     this.safePlay(context, "ui", "speedup");
//   }
// }

// /**
//  * Play instruction sound with text notification
//  * @param {Object} context - The calling context (this)
//  * @param {Object} instruction - Instruction object with text and audio
//  * @param {Function} showNotification - Function to show visual notification
//  */
// static playInstruction(context, instruction, showNotification) {
//   // Show visual notification
//   if (typeof showNotification === 'function') {
//     showNotification(instruction.text);
//   }
  
//   // Play audio if available
//   if (instruction.audio) {
//     this.safePlay(context, "ui", instruction.audio);
//   }
// }

// /**
//  * Set up audio access for a game manager component
//  * @param {Object} manager - The game manager instance
//  */
// static setupManagerAudio(manager) {
//   // Add consistent audio methods to the manager
//   manager.playSound = function(category, name, options = {}) {
//     return AudioHelper.safePlay(this, category, name, options);
//   };
  
//   manager.playRandomSound = function(category, subcategory, country = null, volume = null) {
//     return AudioHelper.playRandom(this, category, subcategory, country, volume);
//   };
  
//   manager.stopAllSounds = function(options = {}) {
//     AudioHelper.stopAllAudio(this, options);
//   };
  
//   manager.playUIClick = function() {
//     return AudioHelper.playUIClick(this);
//   };
  
//   // Make sure audio manager reference is available
//   manager.getAudioManager = function() {
//     return AudioHelper.getAudioManager(this);
//   };
// }
// }

// // Make it globally available
// window.AudioHelper = AudioHelper;
