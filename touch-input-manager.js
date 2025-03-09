// Audio Debug Enhancement
// Add this code to your main JavaScript file or a separate audio-debug.js file

class AudioDebugPanel {
  constructor(audioManager) {
    this.audioManager = audioManager;
    this.visible = false;
    this.createPanel();
    this.loadingStates = new Map(); // Track loading states for sounds
    this.errorStates = new Map();   // Track error states for sounds
    
    // Connect to the audio manager
    if (audioManager) {
      // Create hook for logging
      const originalLoad = audioManager.loadSound;
      audioManager.loadSound = (category, name, index = null) => {
        const soundKey = index !== null ? `${category}.${name}.${index}` : `${category}.${name}`;
        this.logLoading(soundKey, "loading");
        
        // Call original method
        const audio = originalLoad.call(audioManager, category, name, index);
        
        if (audio) {
          // Hook into audio events
          const originalCanPlay = audio.oncanplaythrough;
          audio.oncanplaythrough = (e) => {
            this.logLoading(soundKey, "loaded");
            if (originalCanPlay) originalCanPlay(e);
          };
          
          const originalError = audio.onerror;
          audio.onerror = (e) => {
            this.logLoading(soundKey, "error", e?.type || "unknown error");
            if (originalError) originalError(e);
          };
        }
        
        return audio;
      };
    }
  }
  
  createPanel() {
    // Check if panel already exists
    if (document.getElementById('audio-debug-overlay')) return;
    
    // Create container
    const panel = document.createElement('div');
    panel.id = 'audio-debug-overlay';
    panel.style.position = 'fixed';
    panel.style.top = '0';
    panel.style.left = '0';
    panel.style.width = '100%';
    panel.style.maxHeight = '70%';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    panel.style.color = 'white';
    panel.style.padding = '10px';
    panel.style.fontFamily = 'monospace';
    panel.style.fontSize = '12px';
    panel.style.overflow = 'auto';
    panel.style.zIndex = '10000';
    panel.style.display = 'none';
    
    // Create content
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <h3 style="margin:0;font-size:14px">Audio Debug</h3>
        <button id="audio-debug-close" style="background:red;color:white;border:none;padding:2px 6px;font-size:10px">Close</button>
      </div>
      <div id="audio-debug-context" style="margin-bottom:8px"></div>
      <div style="margin-bottom:8px">
        <button id="audio-debug-test" style="background:#007bff;color:white;border:none;padding:4px 8px;margin-right:5px">Test Audio</button>
        <button id="audio-debug-unlock" style="background:#28a745;color:white;border:none;padding:4px 8px">Unlock Audio</button>
      </div>
      <div style="margin-bottom:8px">
        <h4 style="margin:4px 0;font-size:12px">Loading Status</h4>
        <div id="audio-debug-loading" style="max-height:150px;overflow:auto;background:rgba(0,0,0,0.3);padding:5px;border-radius:3px"></div>
      </div>
      <div>
        <h4 style="margin:4px 0;font-size:12px">Audio Log</h4>
        <div id="audio-debug-log" style="max-height:150px;overflow:auto;background:rgba(0,0,0,0.3);padding:5px;border-radius:3px"></div>
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Event handlers
    document.getElementById('audio-debug-close').addEventListener('click', () => {
      this.hide();
    });
    
    document.getElementById('audio-debug-test').addEventListener('click', () => {
      this.testAudio();
    });
    
    document.getElementById('audio-debug-unlock').addEventListener('click', () => {
      this.unlockAudio();
    });
    
    // Create toggle button for mobile
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'audio-debug-toggle';
    toggleBtn.textContent = 'Audio Debug';
    toggleBtn.style.position = 'fixed';
    toggleBtn.style.bottom = '10px';
    toggleBtn.style.right = '10px';
    toggleBtn.style.backgroundColor = '#007bff';
    toggleBtn.style.color = 'white';
    toggleBtn.style.border = 'none';
    toggleBtn.style.padding = '8px 12px';
    toggleBtn.style.zIndex = '9999';
    toggleBtn.style.borderRadius = '4px';
    toggleBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    
    toggleBtn.addEventListener('click', () => {
      this.toggle();
    });
    
    document.body.appendChild(toggleBtn);
  }
  
  show() {
    const panel = document.getElementById('audio-debug-overlay');
    if (panel) {
      panel.style.display = 'block';
      this.visible = true;
      this.updateInfo();
      // Start auto-refresh
      this.startAutoRefresh();
    }
  }
  
  hide() {
    const panel = document.getElementById('audio-debug-overlay');
    if (panel) {
      panel.style.display = 'none';
      this.visible = false;
      this.stopAutoRefresh();
    }
  }
  
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  updateInfo() {
    if (!this.visible) return;
    
    // Update AudioContext info
    const contextInfo = document.getElementById('audio-debug-context');
    if (contextInfo && this.audioManager) {
      const state = this.audioManager.audioContext ? this.audioManager.audioContext.state : 'no context';
      const initialized = this.audioManager.initialized ? 'yes' : 'no';
      const muted = this.audioManager.muted ? 'yes' : 'no';
      const backgroundPlaying = this.audioManager.backgroundMusicPlaying ? 'yes' : 'no';
      const loadedCount = this.audioManager.loadedSounds ? this.audioManager.loadedSounds.size : 0;
      
      contextInfo.innerHTML = `
        <b>AudioContext:</b> ${state} |
        <b>Initialized:</b> ${initialized} |
        <b>Muted:</b> ${muted} |
        <b>Music Playing:</b> ${backgroundPlaying} |
        <b>Loaded Sounds:</b> ${loadedCount}
      `;
    }
    
    // Update loading status
    this.updateLoadingStatus();
  }
  
  startAutoRefresh() {
    this.stopAutoRefresh(); // Clear any existing interval
    this.refreshInterval = setInterval(() => {
      this.updateInfo();
    }, 1000);
  }
  
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  logLoading(soundKey, status, error = null) {
    // Update internal state
    this.loadingStates.set(soundKey, status);
    if (error) {
      this.errorStates.set(soundKey, error);
    }
    
    // Update display if visible
    this.updateLoadingStatus();
    
    // Add to log
    this.logMessage(`Sound ${soundKey} ${status}${error ? ': ' + error : ''}`);
  }
  
  updateLoadingStatus() {
    if (!this.visible) return;
    
    const loadingElement = document.getElementById('audio-debug-loading');
    if (!loadingElement) return;
    
    let html = '';
    const sortedEntries = [...this.loadingStates.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    
    for (const [key, status] of sortedEntries) {
      let color = '';
      switch (status) {
        case 'loading': color = '#FFA500'; break; // Orange
        case 'loaded': color = '#00FF00'; break;  // Green
        case 'error': color = '#FF0000'; break;   // Red
      }
      
      const error = this.errorStates.get(key);
      
      html += `<div style="margin-bottom:4px;">
        <span style="color:${color}">${status}</span>: ${key}
        ${error ? `<span style="color:#FF0000">(${error})</span>` : ''}
      </div>`;
    }
    
    loadingElement.innerHTML = html || '<i>No sounds loaded yet</i>';
  }
  
  logMessage(message) {
    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;
    
    // Add to log element if visible
    const logElement = document.getElementById('audio-debug-log');
    if (logElement) {
      const entry = document.createElement('div');
      entry.textContent = formattedMessage;
      logElement.appendChild(entry);
      
      // Auto-scroll to bottom
      logElement.scrollTop = logElement.scrollHeight;
      
      // Limit log size
      while (logElement.childNodes.length > 50) {
        logElement.removeChild(logElement.firstChild);
      }
    }
    
    // Also log to console
    console.log(`[AudioDebug] ${message}`);
  }
  
  testAudio() {
    this.logMessage('Testing audio playback...');
    
    // Create a short beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Log audioContext state
    this.logMessage(`Test AudioContext state: ${audioContext.state}`);
    
    // Try to resume AudioContext
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        this.logMessage(`AudioContext resumed: ${audioContext.state}`);
      }).catch(err => {
        this.logMessage(`Error resuming AudioContext: ${err.message}`);
      });
    }
    
    try {
      // Create oscillator
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // 10% volume
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2); // Play for 0.2 second
      
      this.logMessage('Test beep sound played successfully');
    } catch (e) {
      this.logMessage(`Error playing test sound: ${e.message}`);
    }
    
    // Also test HTML5 Audio
    try {
      const testSound = new Audio();
      testSound.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU9vT18A';
      
      testSound.oncanplaythrough = () => {
        this.logMessage('HTML5 Audio loaded successfully');
        
        testSound.play()
          .then(() => {
            this.logMessage('HTML5 Audio played successfully');
          })
          .catch(err => {
            this.logMessage(`HTML5 Audio play failed: ${err.message}`);
          });
      };
      
      testSound.onerror = (e) => {
        this.logMessage(`HTML5 Audio load failed: ${e.type}`);
      };
      
      testSound.load();
    } catch (e) {
      this.logMessage(`Error with HTML5 Audio: ${e.message}`);
    }
    
    // Test actual game sound if audioManager available
    if (this.audioManager) {
      this.logMessage('Testing game audio system...');
      
      // Try to resume the game's AudioContext
      if (this.audioManager.audioContext) {
        const state = this.audioManager.audioContext.state;
        this.logMessage(`Game AudioContext state: ${state}`);
        
        if (state === 'suspended') {
          this.audioManager.audioContext.resume()
            .then(() => {
              this.logMessage(`Game AudioContext resumed: ${this.audioManager.audioContext.state}`);
            })
            .catch(err => {
              this.logMessage(`Failed to resume game AudioContext: ${err.message}`);
            });
        }
      }
      
      // Try to play a UI sound
      setTimeout(() => {
        this.logMessage('Attempting to play UI click sound...');
        
        if (this.audioManager.play) {
          this.audioManager.play('ui', 'click')
            .then(sound => {
              if (sound) {
                this.logMessage('UI click sound played successfully');
              } else {
                this.logMessage('UI click sound failed to play');
              }
            })
            .catch(err => {
              this.logMessage(`Error playing UI click: ${err.message}`);
            });
        } else {
          this.logMessage('AudioManager.play() method not available');
        }
      }, 500);
    }
  }
  
  unlockAudio() {
    this.logMessage('Attempting to unlock audio...');
    
    // Create and play a silent sound
    const silentSound = new Audio();
    silentSound.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    
    silentSound.play()
      .then(() => {
        this.logMessage('Silent sound played successfully - audio should be unlocked');
      })
      .catch(err => {
        this.logMessage(`Silent sound failed: ${err.message}`);
      });
    
    // Try to unlock game's audio context
    if (this.audioManager && this.audioManager.audioContext) {
      const state = this.audioManager.audioContext.state;
      this.logMessage(`Game AudioContext state before unlock: ${state}`);
      
      this.audioManager.audioContext.resume()
        .then(() => {
          this.logMessage(`Game AudioContext after unlock: ${this.audioManager.audioContext.state}`);
        })
        .catch(err => {
          this.logMessage(`Failed to resume game AudioContext: ${err.message}`);
        });
    }
    
    // Try to create a temporary AudioContext
    try {
      const tempContext = new (window.AudioContext || window.webkitAudioContext)();
      this.logMessage(`Temporary AudioContext state: ${tempContext.state}`);
      
      tempContext.resume()
        .then(() => {
          this.logMessage(`Temporary AudioContext resumed: ${tempContext.state}`);
          
          // Create a short silent sound
          const oscillator = tempContext.createOscillator();
          const gainNode = tempContext.createGain();
          
          gainNode.gain.value = 0.01; // Almost silent
          oscillator.connect(gainNode);
          gainNode.connect(tempContext.destination);
          
          oscillator.start(0);
          oscillator.stop(tempContext.currentTime + 0.1);
          
          this.logMessage('Audio unlock sequence completed');
        })
        .catch(err => {
          this.logMessage(`Failed to resume temporary AudioContext: ${err.message}`);
        });
    } catch (e) {
      this.logMessage(`Error creating temporary AudioContext: ${e.message}`);
    }
  }
}

// Create a function to attach the debug panel to your game
function attachAudioDebugger() {
  // Find your AudioManager instance
  const audioManager = window.audioManager;
  
  if (!audioManager) {
    console.warn('AudioManager not found, creating debug panel without AudioManager connection');
  }
  
  // Create the debug panel
  window.audioDebugger = new AudioDebugPanel(audioManager);
  
  // Log browser info for debugging
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  console.log(`Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);
  console.log(`User agent: ${navigator.userAgent}`);
  
  // Add ability to show debug with URL parameter
  if (window.location.search.includes('audiodebug=true')) {
    window.audioDebugger.show();
  }
  
  return window.audioDebugger;
}

// Create debug shortcut - press D + A + 1 keys together to show debug panel
let keySequence = [];
document.addEventListener('keydown', (e) => {
  keySequence.push(e.key.toLowerCase());
  
  // Only keep last 3 keys
  if (keySequence.length > 3) {
    keySequence.shift();
  }
  
  // Check for D+A+1 combination (in any order)
  if (keySequence.includes('d') && keySequence.includes('a') && keySequence.includes('1')) {
    if (window.audioDebugger) {
      window.audioDebugger.toggle();
    } else {
      attachAudioDebugger();
      window.audioDebugger.show();
    }
    keySequence = []; // Reset sequence
  }
});

// Initialize the debugger when the page loads
window.addEventListener('load', () => {
  // Wait a short while to ensure AudioManager is created first
  setTimeout(attachAudioDebugger, 500);
});
