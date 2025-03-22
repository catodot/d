class VoiceRecorder {
  constructor(options = {}) {
    // Configuration options
    this.maxRecordingLength = options.maxRecordingLength || 2000; // 2 seconds
    this.locations = ["Canada", "Greenland", "Iceland", "Turtle Island", "Other"];

    // State management
    this.recordings = [];
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.selectedLocation = "";
    this.otherLocation = "";
    this.audioStream = null;
    this.recordingStartTime = 0;
    this.timerInterval = null;

    // Playback state
    this.currentlyPlaying = null;
    this.playbackInterval = null;

    // DOM Elements
    this.elements = {
      modal: null,
      recordButton: null,
      recordLabel: null,
      recordingTimer: null,
      recordingsContainer: null,
      recordingsList: null,
      locationSelect: null,
      otherLocationContainer: null,
      otherLocationInput: null,
      sendButton: null,
      closeButton: null,
      thankYouMessage: null,
      closeThankYouButton: null
    };

    // Cloudinary config
    this.cloudName = "dvpixsxz0";
    this.uploadPreset = "catodot";
    this.uploadedUrls = [];
    
    // Detect mobile/iOS
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    this.hasTriedGeolocation = false;
  }

  init() {
    // Find all required DOM elements
    this.elements.modal = document.getElementById("voice-recorder-modal");
    this.elements.recordButton = document.getElementById("record-button");
    this.elements.recordLabel = this.elements.recordButton.querySelector(".record-label");
    this.elements.recordingTimer = document.getElementById("recording-timer");
    this.elements.recordingsContainer = document.getElementById("recordings-container");
    this.elements.recordingsList = document.getElementById("recordings-list");
    this.elements.locationSelect = document.getElementById("location-select");
    this.elements.otherLocationContainer = document.getElementById("other-location-container");
    this.elements.otherLocationInput = document.getElementById("other-location");
    this.elements.sendButton = document.getElementById("send-recording");
    this.elements.closeButton = document.getElementById("close-recorder");
    this.elements.thankYouMessage = document.getElementById("thank-you-message");
    this.elements.closeThankYouButton = document.getElementById("close-thank-you");
    
    // Initialize audio context
    this.initAudioContext();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Try to detect location
    this.fetchLocationFromIP();
    
    // Show recordings container if there are any
    if (this.recordings.length > 0) {
      this.elements.recordingsContainer.classList.remove("hidden");
    }
  }
  
  initAudioContext() {
    // Fix for iOS Safari - create and resume AudioContext on user interaction
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn("AudioContext is not supported in this browser");
      return;
    }
    
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

  setupEventListeners() {
    // Record button
    this.elements.recordButton.addEventListener("click", this.handleRecordButton.bind(this));
    this.elements.recordButton.addEventListener("touchend", (e) => {
      e.preventDefault();
      this.handleRecordButton(e);
    });
    
    // Location selection
    this.elements.locationSelect.addEventListener("change", (e) => {
      this.selectedLocation = e.target.value;
      if (this.selectedLocation === "Other") {
        this.elements.otherLocationContainer.classList.remove("hidden");
      } else {
        this.elements.otherLocationContainer.classList.add("hidden");
      }
      this.validateSendButton();
    });
    
    // Other location input
    this.elements.otherLocationInput.addEventListener("input", (e) => {
      this.otherLocation = e.target.value;
      this.validateSendButton();
    });
    
    // Send button
    this.elements.sendButton.addEventListener("click", this.handleSendButton.bind(this));
    this.elements.sendButton.addEventListener("touchend", this.handleSendButton.bind(this));
    
    // Close buttons
    this.elements.closeButton.addEventListener("click", this.closeRecorder.bind(this));
    this.elements.closeThankYouButton.addEventListener("click", () => {
      this.elements.thankYouMessage.classList.add("hidden");
    });
  }

  fetchLocationFromIP() {
    if (this.hasTriedGeolocation) return;
    this.hasTriedGeolocation = true;
    
    fetch('https://ipapi.co/json/')
      .then(response => response.json())
      .then(data => {
        const country = data.country_name;
        let matchFound = false;
        
        for (const location of this.locations) {
          if (location === country || 
              (country === "United States" && location === "Turtle Island") ||
              (country === "Denmark" && location === "Greenland")) {
            this.selectedLocation = location;
            matchFound = true;
            break;
          }
        }
        
        if (!matchFound) {
          this.selectedLocation = "Other";
          this.otherLocation = country;
        }
        
        if (this.elements.locationSelect) {
          this.elements.locationSelect.value = this.selectedLocation;
          
          if (this.selectedLocation === "Other") {
            this.elements.otherLocationContainer.classList.remove("hidden");
            this.elements.otherLocationInput.value = this.otherLocation;
          }
          
          this.validateSendButton();
        }
      })
      .catch(error => {
        console.error('Error detecting location:', error);
      });
  }

  handleRecordButton(e) {
    e.preventDefault();
    e.stopPropagation(); // Stop propagation

    
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

  startRecording() {
    if (this.isRecording) return;
    
    // Reset audio chunks
    this.audioChunks = [];
    
    // Update UI
    this.recordingStartTime = Date.now();
    this.updateTimerDisplay(this.maxRecordingLength);
    this.elements.recordButton.classList.add('recording');
    this.elements.recordLabel.textContent = "STOP";
    
    // Request microphone access
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.audioStream = stream;
        
        // Setup MediaRecorder with best available format
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
        
        try {
          this.mediaRecorder = new MediaRecorder(stream, options);
        } catch (err) {
          console.warn("Error with specified mime type, falling back to default", err);
          this.mediaRecorder = new MediaRecorder(stream);
        }
        
        // Handle recording data
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };
        
        // Handle recording stop
        this.mediaRecorder.onstop = () => {
          if (this.audioChunks.length === 0) {
            console.error("No audio data captured");
            this.resetRecording();
            return;
          }
          
          // Create audio blob and URL
          const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // Calculate duration
          const duration = (Date.now() - this.recordingStartTime) / 1000;
          // Format to whole seconds (no decimal)
          const formattedDuration = Math.round(duration);
          
          // Add to recordings
          this.recordings.push({
            blob: audioBlob,
            url: audioUrl,
            duration: formattedDuration,
            waveform: this.generateRandomWaveform()
          });
          
          // Update UI
          this.updateRecordingsList();
          this.resetRecording();
          
          // Show recordings container
          this.elements.recordingsContainer.classList.remove("hidden");
        };
        
        // Start recording
        this.mediaRecorder.start();
        this.isRecording = true;
        
        // Update timer counting down
        this.timerInterval = setInterval(() => {
          const elapsed = Date.now() - this.recordingStartTime;
          const remaining = Math.max(0, this.maxRecordingLength - elapsed);
          
          this.updateTimerDisplay(remaining);
          
          if (remaining <= 0) {
            this.stopRecording();
          }
        }, 50); // Update more frequently for smoother countdown
        
        // Safety timeout
        setTimeout(() => {
          if (this.isRecording) {
            this.stopRecording();
          }
        }, this.maxRecordingLength);
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        this.resetRecording();
        
        if (err.name === 'NotAllowedError') {
          alert('Please allow microphone access to record.');
        } else {
          alert('Error accessing microphone. Please try again.');
        }
      });
  }
  
  updateTimerDisplay(timeInMs) {
    // Format as "2.0", "1.5", "1.0", "0.5", "0"
    const seconds = timeInMs / 1000;
    
    // We want to show whole numbers only
    const displayValue = Math.ceil(seconds);
    this.elements.recordingTimer.textContent = `${displayValue}s`;
  }

  generateRandomWaveform() {
    const bars = [];
    const numBars = 10;
    
    for (let i = 0; i < numBars; i++) {
      // Generate heights between 30% and 90%
      const height = 30 + Math.floor(Math.random() * 60);
      bars.push(height);
    }
    
    return bars;
  }

  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) return;
    
    try {
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      }
    } catch (e) {
      console.error('Error stopping MediaRecorder:', e);
      this.cleanupAudioResources();
    }
    
    this.isRecording = false;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
  }

  resetRecording() {
    // Reset UI
    this.elements.recordButton.classList.remove('recording');
    this.elements.recordLabel.textContent = "RECORD";
    this.elements.recordingTimer.textContent = "2s";
    
    // Clean up
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    this.isRecording = false;
  }

  cleanupAudioResources() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    if (this.audioStream) {
      const tracks = this.audioStream.getTracks();
      tracks.forEach(track => {
        track.stop();
      });
      this.audioStream = null;
    }
    
    if (this.mediaRecorder) {
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

  updateRecordingsList() {
    const recordingsList = this.elements.recordingsList;
    recordingsList.innerHTML = "";

    if (this.recordings.length === 0) {
      return;
    }

    // Display all recordings, newest first
    [...this.recordings].reverse().forEach((recording, index) => {
      const actualIndex = this.recordings.length - 1 - index;
      const recordingElement = document.createElement("div");
      recordingElement.className = "recording-item";
      recordingElement.dataset.index = actualIndex;
      
      recordingElement.innerHTML = `
        <button class="play-button" aria-label="Play recording">
          <img src="https://catodot.github.io/d/images/play-icon.png" alt="Play">
        </button>
        
        <div class="recording-content">
          <div class="waveform-container">
            <div class="waveform-track">
              ${Array(10).fill('<div class="waveform-bar"></div>').join('')}
            </div>
            <div class="waveform-progress"></div>
          </div>
        </div>
        
        <button class="delete-button" aria-label="Delete recording">
          <img src="https://catodot.github.io/d/images/trash-icon.png" alt="Delete">
        </button>
      `;

      // Add play functionality
      const playButton = recordingElement.querySelector(".play-button");
      const waveformProgress = recordingElement.querySelector(".waveform-progress");
      
      playButton.addEventListener("click", (e) => {
        e.preventDefault();
        
        this.stopAllPlayback();
        
        const audio = new Audio(recording.url);
        
        // Make sure audio doesn't loop
        audio.loop = false;
        
        playButton.classList.add('playing');
        recordingElement.classList.add('playing');
        
        audio.addEventListener('ended', () => {
          this.stopAllPlayback();
        });
        
        audio.play()
          .then(() => {
            const duration = parseFloat(recording.duration);
            
            this.currentlyPlaying = {
              audio: audio,
              element: recordingElement,
              duration: duration
            };
            
            this.playbackInterval = setInterval(() => {
              if (!audio || audio.paused || audio.ended) {
                this.stopAllPlayback();
                return;
              }
              
              const progress = Math.min(audio.currentTime / duration, 1);
              waveformProgress.style.transform = `scaleX(${progress})`;
            }, 50);
          })
          .catch(err => {
            console.error("Playback error:", err);
            this.stopAllPlayback();
          });
      });

      // Add delete functionality
      const deleteButton = recordingElement.querySelector(".delete-button");
      deleteButton.addEventListener("click", (e) => {
        e.preventDefault();
        
        this.stopAllPlayback();
        
        // Remove from recordings array
        URL.revokeObjectURL(recording.url);
        this.recordings.splice(actualIndex, 1);
        
        // Update UI
        this.updateRecordingsList();
        
        // Hide container if no recordings
        if (this.recordings.length === 0) {
          this.elements.recordingsContainer.classList.add("hidden");
        }
        
        this.validateSendButton();
      });
      
      recordingsList.appendChild(recordingElement);
    });

    this.validateSendButton();
  }

  stopAllPlayback() {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
    
    if (this.currentlyPlaying && this.currentlyPlaying.audio) {
      try {
        this.currentlyPlaying.audio.pause();
        this.currentlyPlaying.audio.currentTime = 0;
        
        if (this.currentlyPlaying.element) {
          const playButton = this.currentlyPlaying.element.querySelector('.play-button');
          if (playButton) playButton.classList.remove('playing');
          
          this.currentlyPlaying.element.classList.remove('playing');
          
          const waveformProgress = this.currentlyPlaying.element.querySelector('.waveform-progress');
          if (waveformProgress) {
            waveformProgress.style.transform = 'scaleX(0)';
          }
        }
      } catch (e) {
        console.warn('Error stopping playback:', e);
      }
      
      this.currentlyPlaying = null;
    }
    
    // Reset all play buttons and progress bars
    if (this.elements.recordingsList) {
      const allPlayButtons = this.elements.recordingsList.querySelectorAll('.play-button');
      allPlayButtons.forEach(button => button.classList.remove('playing'));
      
      const allItems = this.elements.recordingsList.querySelectorAll('.recording-item');
      allItems.forEach(item => item.classList.remove('playing'));
      
      const allProgress = this.elements.recordingsList.querySelectorAll('.waveform-progress');
      allProgress.forEach(progress => progress.style.transform = 'scaleX(0)');
    }
  }

  validateSendButton() {
    const isValid = this.recordings.length > 0 && 
                    this.selectedLocation && 
                    (this.selectedLocation !== "Other" || this.otherLocation.trim() !== "");
    
    this.elements.sendButton.disabled = !isValid;
  }



  sendRecordings() {
    if (this.recordings.length === 0) {
        console.error('No recordings to send');
        return;
    }

    // Stop any playing audio
    this.stopAllPlayback();

    const location = this.selectedLocation === 'Other' ? 
                    this.otherLocation : 
                    this.selectedLocation;
    
    // Show loading state
    this.elements.sendButton.disabled = true;
    this.elements.sendButton.textContent = 'Uploading...';
    
    // Track uploads
    let uploadedCount = 0;
    let uploadErrors = 0;
    this.uploadedUrls = [];
    
    // Process each recording with better error handling
    this.recordings.forEach((recording, index) => {
        const fileName = `voice_${location.replace(/\s+/g, '_')}_${Date.now()}_${index}`;
        
        const formData = new FormData();
        formData.append('file', recording.blob);
        formData.append('upload_preset', this.uploadPreset);
        formData.append('tags', location);
        formData.append('context', `location=${location}`);
        formData.append('resource_type', 'video'); // Cloudinary uses 'video' for audio files
        // formData.append('format', 'mp3'); // Force MP3 format
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
  


  handleUploadCompletion(hasError = false) {
    this.elements.sendButton.disabled = false;
    this.elements.sendButton.textContent = "SEND RECORDING";
    
    if (hasError) {
      alert('Some uploads failed. Please try again.');
      return;
    }
    
    // Success - show thank you message
    this.showThankYouMessage();
    
    // Clean up
    this.recordings.forEach(recording => {
      URL.revokeObjectURL(recording.url);
    });
    
    this.recordings = [];
    this.elements.recordingsContainer.classList.add("hidden");
    this.elements.recordingsList.innerHTML = "";
    this.elements.modal.classList.add("hidden");
  }

  showThankYouMessage() {
    this.elements.thankYouMessage.classList.remove("hidden");
  }

  closeRecorder() {
    this.stopAllPlayback();
    this.elements.modal.classList.add("hidden");
  }

  show() {
    this.elements.modal.classList.remove("hidden");
  }
}

// Make it globally available
window.VoiceRecorder = VoiceRecorder;