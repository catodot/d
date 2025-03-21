class VoiceRecorder {
  constructor(options = {}) {
    // Configuration options
    this.maxRecordingLength = options.maxRecordingLength || 3000; // 3 seconds
    this.locations = ["Canada", "Greenland", "Iceland", "Turtle Island", "Other"];

    // State management
    this.recordings = [];
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.selectedLocation = "";
    this.otherLocation = "";
    this.audioStream = null; // Track the stream to ensure proper cleanup
    this.userInteracted = false;
    this.audioContext = null;

    this.hasTriedGeolocation = false;

    // Playback state
    this.currentlyPlaying = null;
    this.playbackInterval = null;

    // DOM Elements
    this.elements = {
      container: null,
      recordButton: null,
      locationSelect: null,
      otherLocationInput: null,
      sendButton: null,
      recordingsList: null,
      closeButton: null,
    };

    this.cloudName = "dvpixsxz0";
    this.uploadPreset = "catodot";
    this.uploadedUrls = [];
    
    // Detect mobile/iOS
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  fetchLocationFromIP() {
    if (this.hasTriedGeolocation) return;
    this.hasTriedGeolocation = true;
    
    // Use a free IP geolocation API
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        // Get country name from response
        const country = data.country_name;
        
        // Check if the country matches any of our location options
        let matchFound = false;
        
        // Try to find a match in our locations array
        for (const location of this.locations) {
          if (location === country || 
              (country === "United States" && location === "Turtle Island") ||
              (country === "Denmark" && location === "Greenland")) {
            this.selectedLocation = location;
            matchFound = true;
            break;
          }
        }
        
        // If no direct match, set to "Other" and fill in the country
        if (!matchFound) {
          this.selectedLocation = "Other";
          this.otherLocation = country;
        }
        
        // Update the UI to reflect the selected location
        if (this.elements.locationSelect) {
          this.elements.locationSelect.value = this.selectedLocation;
          
          // If "Other" was selected, show the input field and fill it
          if (this.selectedLocation === "Other") {
            this.elements.otherLocationContainer.style.display = "block";
            this.elements.otherLocationInput.value = this.otherLocation;
          }
          
          // Trigger the change event after setting the value
          this.elements.locationSelect.dispatchEvent(new Event('change'));
          
          this.validateSendButton();
        }
      })
      .catch(error => {
        console.error('Error fetching location from IP:', error);
      });
  }

  // Initialize the recorder interface
  init(containerId) {
    this.elements.container = document.getElementById(containerId);
    if (!this.elements.container) {
      console.error("Container not found:", containerId);
      return;
    }
  
    this.render();
    this.initAudioContext();
    this.setupEventListeners();
    
    // Try to get the user's location from their IP
    this.fetchLocationFromIP();
  }

  // Initialize Audio Context for iOS and other mobile devices
  initAudioContext() {
    // Fix for iOS Safari - create and resume AudioContext on user interaction
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext();
    
    if (this.audioContext.state === 'suspended') {
      const resumeOnInteraction = () => {
        this.audioContext.resume().then(() => {
          console.log('AudioContext resumed successfully');
        }).catch(err => {
          console.error('Failed to resume AudioContext:', err);
        });
        
        document.removeEventListener('touchstart', resumeOnInteraction);
        document.removeEventListener('click', resumeOnInteraction);
      };
      
      document.addEventListener('touchstart', resumeOnInteraction);
      document.addEventListener('click', resumeOnInteraction);
    }
  }

  // Render the entire interface
  render() {
    this.elements.container.innerHTML = `
        <div class="voice-recorder-container">
            <button class="close-button" id="close-recorder">✕</button>
            
            <div class="header">
                <h2>Record Your Voice</h2>
                <p>Tell Trump to stop, in your own words, in 3 seconds or less</p>
            </div>

            <div class="record-button-container">
                <button class="record-button" id="record-button">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                </button>
                <div class="recording-timer" id="recording-timer">0.0s</div>
            </div>

            <div class="recordings-list" id="recordings-list">
                <!-- Recordings will be dynamically added here -->
            </div>

            <div class="location-selector">
                <select id="location-select">
                    <option value="">Where are you?</option>
                    ${this.locations.map((loc) => `<option value="${loc}">${loc}</option>`).join("")}
                </select>
                <div id="other-location-container" class="other-location" style="display:none;">
                    <input 
                        type="text" 
                        id="other-location" 
                        placeholder="Enter your location"
                        style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px;"
                    >
                </div>
            </div>

            <button 
                id="send-recordings" 
                class="send-recordings-btn" 
                disabled
            >
                Send
            </button>
        </div>
    `;

    // Cache elements
    this.elements.recordButton = this.elements.container.querySelector("#record-button");
    this.elements.recordingTimer = this.elements.container.querySelector("#recording-timer");
    this.elements.locationSelect = this.elements.container.querySelector("#location-select");
    this.elements.otherLocationContainer = this.elements.container.querySelector("#other-location-container");
    this.elements.otherLocationInput = this.elements.container.querySelector("#other-location");
    this.elements.recordingsList = this.elements.container.querySelector("#recordings-list");
    this.elements.sendButton = this.elements.container.querySelector("#send-recordings");
    this.elements.closeButton = this.elements.container.querySelector("#close-recorder");
  }

  // Set up all event listeners
  setupEventListeners() {
    // Record button with user interaction tracking - handle both click and touch events
    this.elements.recordButton.addEventListener("click", this.handleRecordButton.bind(this));
    this.elements.recordButton.addEventListener("touchend", this.handleRecordButton.bind(this));

    // Location select with user interaction tracking
    this.elements.locationSelect.addEventListener("change", (e) => {
      this.userInteracted = true;
      const location = e.target.value;
      this.selectedLocation = location;

      // Toggle other location input
      this.elements.otherLocationContainer.style.display = location === "Other" ? "block" : "none";

      this.validateSendButton();
    });

    // Other location input with user interaction tracking
    this.elements.otherLocationInput.addEventListener("input", (e) => {
      this.userInteracted = true;
      this.otherLocation = e.target.value;
      this.validateSendButton();
    });

    // Send button
    this.elements.sendButton.addEventListener("click", this.handleSendButton.bind(this));
    this.elements.sendButton.addEventListener("touchend", this.handleSendButton.bind(this));

    // Close button
    this.elements.closeButton.addEventListener("click", this.closeRecorder.bind(this));
    this.elements.closeButton.addEventListener("touchend", this.closeRecorder.bind(this));
  }

  // Handler for record button to prevent duplicate events on mobile
  handleRecordButton(e) {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Stop propagation
    
    this.userInteracted = true;
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  // Handler for send button
  handleSendButton(e) {
    e.preventDefault();
    e.stopPropagation();
    
    this.userInteracted = true;
    this.sendRecordings();
  }

  // Improved recording start with visual feedback and mobile support
  startRecording() {
    if (this.isRecording) return;
    
    this.userInteracted = true;
    this.audioChunks = [];
    
    // Reset timer
    this.recordingStartTime = Date.now();
    this.elements.recordingTimer.textContent = "0.0s";
    
    // Add a visual indicator immediately that we're trying to record
    this.elements.recordButton.classList.add('recording-pending');
    
    // Set up audio constraints based on device
    const audioConstraints = this.isIOS ? 
      { audio: { echoCancellation: true, noiseSuppression: true } } : 
      { audio: true };
    
    navigator.mediaDevices.getUserMedia(audioConstraints)
      .then(stream => {
        this.audioStream = stream; // Save reference for cleanup
        
        // Try different MIME types for better mobile compatibility
        let options;
        
        // Test different MIME types for better compatibility
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          options = { mimeType: 'audio/ogg;codecs=opus' };
        }
        
        try {
          this.mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
        } catch (err) {
          console.warn("Error with specified mime type, falling back to default", err);
          this.mediaRecorder = new MediaRecorder(stream);
        }
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        
        this.mediaRecorder.onstop = () => {
          if (this.audioChunks.length === 0) {
            console.error("No audio data captured");
            this.elements.recordButton.classList.remove('recording-pending', 'recording-active');
            return;
          }
          
          // Get MIME type from recorder
          const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
          
          // Create blob with the recorded MIME type
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Calculate actual duration
          const duration = (Date.now() - this.recordingStartTime) / 1000;
          const formattedDuration = duration.toFixed(1);
          
          this.recordings.push({
            blob: audioBlob,
            url: audioUrl,
            duration: formattedDuration,
            waveform: this.generateRandomWaveform()
          });
          
          this.updateRecordingsList();
          
          // Clean up stream properly
          this.cleanupAudioResources();
        };
        
        // Start recording with mobile-friendly timeslice (more frequent data events)
        this.mediaRecorder.start(this.isMobile ? 100 : 500);
        this.isRecording = true;
        
        // Update UI
        this.elements.recordButton.classList.remove('recording-pending');
        this.elements.recordButton.classList.add('recording-active');
        
        // Start timer update
        this.timerInterval = setInterval(() => {
          const elapsed = (Date.now() - this.recordingStartTime) / 1000;
          this.elements.recordingTimer.textContent = `${elapsed.toFixed(1)}s`;
          
          // Check if we've reached max recording time
          if (elapsed >= this.maxRecordingLength / 1000) {
            this.stopRecording();
          }
        }, 100);
        
        // Stop recording after max length
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, this.maxRecordingLength);
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        this.elements.recordButton.classList.remove('recording-pending');
        
        // Show a more specific error message
        if (err.name === 'NotAllowedError') {
          alert('Please allow microphone access to record. You may need to allow it in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          alert('No microphone device found. Please connect a microphone.');
        } else {
          alert('Error accessing microphone: ' + err.message);
        }
        
        this.isRecording = false;
      });
  }

  // Generate random waveform data for visualization
  generateRandomWaveform() {
    const bars = [];
    const numBars = 20;
    
    for (let i = 0; i < numBars; i++) {
      // Generate heights between 30% and 90%
      const height = 30 + Math.floor(Math.random() * 60);
      bars.push(height);
    }
    
    return bars;
  }

  // Improved cleanup for audio resources
  cleanupAudioResources() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    if (this.audioStream) {
      // Stop all tracks and remove them
      const tracks = this.audioStream.getTracks();
      tracks.forEach(track => {
        track.stop();
        this.audioStream.removeTrack(track);
      });
      this.audioStream = null;
    }
    
    if (this.mediaRecorder) {
      // Only try to stop if it's not already inactive
      if (this.mediaRecorder.state !== 'inactive') {
        try {
          this.mediaRecorder.stop();
        } catch (e) {
          console.warn('Error stopping MediaRecorder:', e);
        }
      }
      this.mediaRecorder = null;
    }
    
    this.isRecording = false;
  }

  // Stop recording with proper cleanup
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;
    
    try {
      // Only call stop if the state is recording
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    } catch (e) {
      console.error('Error stopping MediaRecorder:', e);
      this.cleanupAudioResources();
    }
    
    // Reset record button
    this.elements.recordButton.classList.remove('recording-active', 'recording-pending');
    
    // Clear timer interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Set isRecording to false
    this.isRecording = false;
  }

  // Better memory management for recordings list with improved visuals
  updateRecordingsList() {
    const recordingsList = this.elements.recordingsList;

    // Clear existing list content
    recordingsList.innerHTML = "";

    if (this.recordings.length === 0) {
      return;
    }

    this.recordings.forEach((recording, index) => {
      const recordingElement = document.createElement("div");
      recordingElement.className = "recording-item";
      recordingElement.dataset.index = index;
      
      // Generate waveform HTML
      const waveformBars = recording.waveform.map(height => 
        `<div class="waveform-bar" style="height: ${height}%"></div>`
      ).join('');
      
      recordingElement.innerHTML = `
        <button class="play-btn" aria-label="Play recording">▶️</button>
        <div class="recording-details">
          <div class="recording-waveform">
            <div class="waveform-bars">
              ${waveformBars}
            </div>
            <div class="waveform-progress"></div>
          </div>
          <div class="recording-time">
            <span>${recording.duration}s</span>
            <span>${this.selectedLocation}</span>
          </div>
        </div>
        <button class="delete-btn" aria-label="Delete recording">🗑️</button>
      `;

      // Play recording with visual feedback and mobile support
      const playBtn = recordingElement.querySelector(".play-btn");
      const waveformProgress = recordingElement.querySelector(".waveform-progress");
      
      const playHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Stop any currently playing audio
        this.stopAllPlayback();
        
        // Create new audio element for playback
        const audio = new Audio(recording.url);
        
        // For iOS, we need to handle this specially
        if (this.isIOS) {
          // Ensure audio context is running
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
          }
          
          // Add event listeners to track playback
          audio.addEventListener('canplaythrough', () => {
            playBtn.textContent = "⏸️";
            recordingElement.classList.add('playing');
            audio.play()
              .catch(err => {
                console.error("iOS playback error:", err);
                this.stopAllPlayback();
              });
          });
          
          audio.addEventListener('error', (e) => {
            console.error("iOS audio loading error:", e);
            this.stopAllPlayback();
          });
          
          // Load the audio (needed for iOS)
          audio.load();
        } else {
          // Non-iOS playback is simpler
          this.currentlyPlaying = {
            audio: audio,
            element: recordingElement,
            duration: parseFloat(recording.duration),
            startTime: Date.now()
          };
          
          // Mark as playing
          recordingElement.classList.add('playing');
          playBtn.textContent = "⏸️";
          
          // Play the audio
          audio.play()
            .catch((error) => {
              console.error("Error playing audio:", error);
              this.stopAllPlayback();
            });
        }
        
        // For both iOS and non-iOS, set up progress tracking
        this.currentlyPlaying = {
          audio: audio,
          element: recordingElement,
          duration: parseFloat(recording.duration),
          startTime: Date.now()
        };
        
        // Set up progress tracking
        this.playbackInterval = setInterval(() => {
          const elapsed = (Date.now() - this.currentlyPlaying.startTime) / 1000;
          const progress = Math.min(elapsed / this.currentlyPlaying.duration, 1);
          waveformProgress.style.width = `${progress * 100}%`;
          
          if (progress >= 1) {
            this.stopAllPlayback();
          }
        }, 50);
        
        audio.onended = () => {
          this.stopAllPlayback();
        };
      };
      
      // Add both click and touch handlers for playback
      playBtn.addEventListener("click", playHandler);
      playBtn.addEventListener("touchend", playHandler);

      // Delete recording with mobile support
      const deleteBtn = recordingElement.querySelector(".delete-btn");
      const deleteHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Stop if this recording is playing
        if (this.currentlyPlaying && this.currentlyPlaying.element === recordingElement) {
          this.stopAllPlayback();
        }
        
        // Revoke the URL to free memory
        URL.revokeObjectURL(recording.url);
        
        // Remove the recording
        this.recordings.splice(index, 1);
        this.updateRecordingsList();
        this.validateSendButton();
      };
      
      deleteBtn.addEventListener("click", deleteHandler);
      deleteBtn.addEventListener("touchend", deleteHandler);

      recordingsList.appendChild(recordingElement);
    });

    // Validate send button
    this.validateSendButton();
  }

  // Stop all audio playback and reset UI
  stopAllPlayback() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    
    if (this.currentlyPlaying) {
      try {
        this.currentlyPlaying.audio.pause();
        this.currentlyPlaying.audio.currentTime = 0;
        this.currentlyPlaying.element.classList.remove('playing');
        const playBtn = this.currentlyPlaying.element.querySelector('.play-btn');
        if (playBtn) playBtn.textContent = "▶️";
      } catch (e) {
        console.warn('Error stopping playback:', e);
      }
      this.currentlyPlaying = null;
    }
    
    // Reset all progress bars
    const allProgressBars = this.elements.recordingsList.querySelectorAll('.waveform-progress');
    allProgressBars.forEach(bar => {
      bar.style.width = '0%';
    });
    
    // Reset all playing states
    const allRecordings = this.elements.recordingsList.querySelectorAll('.recording-item');
    allRecordings.forEach(item => {
      item.classList.remove('playing');
      const btn = item.querySelector('.play-btn');
      if (btn) btn.textContent = "▶️";
    });
  }

  // Validate send button state
  validateSendButton() {
    const isValid = this.recordings.length > 0 && this.selectedLocation && (this.selectedLocation !== "Other" || this.otherLocation.trim() !== "");

    this.elements.sendButton.disabled = !isValid;
    this.elements.sendButton.classList.toggle("disabled", !isValid);
  }

  showThankYouMessage() {
    // Stop any playing audio before showing thank you
    this.stopAllPlayback();
    
    const thankYouModal = document.getElementById("thank-you-message");
    const closeThankYouBtn = document.getElementById("close-thank-you");

    if (thankYouModal) {
      thankYouModal.classList.remove("hidden");

      const closeHandler = (e) => {
        e.preventDefault();
        thankYouModal.classList.add("hidden");
        closeThankYouBtn.removeEventListener("click", closeHandler);
        closeThankYouBtn.removeEventListener("touchend", closeHandler);
      };

      closeThankYouBtn.addEventListener("click", closeHandler);
      closeThankYouBtn.addEventListener("touchend", closeHandler);
    }
  }

  handleUploadCompletion(hasError = false) {
    // Reset button state
    this.elements.sendButton.disabled = false;
    this.elements.sendButton.textContent = 'Send';
    
    if (hasError) {
        alert('Some uploads failed. Please try again.');
        return;
    }
    
    // Show thank you message
    this.showThankYouMessage();
    
    // Revoke object URLs before clearing
    this.recordings.forEach(recording => {
        URL.revokeObjectURL(recording.url);
    });
    
    // Clear recordings
    this.recordings = [];
    this.updateRecordingsList();
    
    // Close the recorder modal
    const recorderModal = document.getElementById('voice-recorder-modal');
    if (recorderModal) {
        recorderModal.classList.add('hidden');
    }
  }

  // Updated sendRecordings method with better mobile support
  sendRecordings() {
    if (this.recordings.length === 0) {
        console.error('No recordings to send');
        return;
    }

    // Stop any playing audio
    this.stopAllPlayback();

    const location = this.selectedLocation === 'Other' ? this.otherLocation : this.selectedLocation;
    
    // Show loading state
    this.elements.sendButton.disabled = true;
    this.elements.sendButton.textContent = 'Uploading...';
    
    // Track uploads
    let uploadedCount = 0;
    let uploadErrors = 0;
    this.uploadedUrls = [];
    
    // Process each recording with better error handling
    this.recordings.forEach((recording, index) => {
        const fileName = `voice_${location}_${Date.now()}_${index}`;
        
        const formData = new FormData();
        formData.append('file', recording.blob);
        formData.append('upload_preset', this.uploadPreset);
        formData.append('tags', location);
        formData.append('context', `location=${location}`);
        formData.append('resource_type', 'video'); // Cloudinary uses 'video' for audio files
        
        // Specify audio format conversion
        formData.append('format', 'mp3'); // Force MP3 format
        formData.append('public_id', `audio/new/${fileName}`); // No extension, Cloudinary adds it
        
        // Create a timeout for the upload
        const uploadTimeout = setTimeout(() => {
            console.error('Upload timeout for recording ' + index);
            uploadedCount++;
            uploadErrors++;
            
            if (uploadedCount === this.recordings.length) {
                this.handleUploadCompletion(uploadErrors > 0);
            }
        }, 30000); // 30 second timeout
        
        // Upload to Cloudinary with proper error handling
        fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/upload`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            clearTimeout(uploadTimeout);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.secure_url) {
                this.uploadedUrls.push(data.secure_url);
            } else {
                throw new Error('No URL in response');
            }
            
            uploadedCount++;
            
            // When all uploads are complete
            if (uploadedCount === this.recordings.length) {
                this.handleUploadCompletion(uploadErrors > 0);
            }
        })
        .catch(error => {
            clearTimeout(uploadTimeout);
            console.error('Upload error:', error);
            uploadedCount++;
            uploadErrors++;
            
            if (uploadedCount === this.recordings.length) {
                this.handleUploadCompletion(uploadErrors > 0);
            }
        });
    });
  }

  closeRecorder() {
    // Stop any playing audio
    this.stopAllPlayback();
    
    const recorderModal = document.getElementById("voice-recorder-modal");
    if (recorderModal) {
      recorderModal.classList.add("hidden");

      // Reset the recorder state
      this.reset();
    }
  }

  hasUserInteracted() {
    return this.userInteracted || 
           this.recordings.length > 0 || 
           (this.selectedLocation && (this.selectedLocation !== "Other" || this.otherLocation.trim() !== ""));
  }

  // Better memory cleanup on reset
  reset() {
    // Stop any playing audio
    this.stopAllPlayback();
    
    // Clean up all recordings properly
    this.recordings.forEach(recording => {
      URL.revokeObjectURL(recording.url);
    });
    
    this.recordings = [];
    this.selectedLocation = "";
    this.otherLocation = "";
    this.audioChunks = [];
    this.cleanupAudioResources();
    this.updateRecordingsList();
    
    // Don't reset userInteracted flag - we want to remember if they engaged with it
  }
}

// Make it globally available
window.VoiceRecorder = VoiceRecorder;