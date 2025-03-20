class VoiceRecorder {
    constructor(options = {}) {
        // Configuration options
        this.maxRecordingLength = options.maxRecordingLength || 3000; // 3 seconds
        this.locations = [
            'Canada', 
            'Greenland', 
            'Iceland', 
            'Turtle Island', 
            'Other'
        ];

        // State management
        this.recordings = [];
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.selectedLocation = '';
        this.otherLocation = '';

        // DOM Elements
        this.elements = {
            container: null,
            recordButton: null,
            locationSelect: null,
            otherLocationInput: null,
            sendButton: null,
            recordingsList: null,
            closeButton: null
        };
    }

    // Initialize the recorder interface
    init(containerId) {
        this.elements.container = document.getElementById(containerId);
        if (!this.elements.container) {
            console.error('Container not found:', containerId);
            return;
        }

        this.render();
        this.setupEventListeners();
    }

    // Render the entire interface
    render() {
        this.elements.container.innerHTML = `
        <div class="voice-recorder-container">
            <button class="close-button" id="close-recorder">✕</button>
            
                <div class="header">
                    <h2>Record Your Voice</h2>
                    <p>Add your voice to the game. Tell Trump to stop, in your own words. 2 seconds or less</p>
                </div>
    
                <button class="record-button" id="record-button">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                </button>
    
                <div class="recordings-list" id="recordings-list">
                    <!-- Recordings will be dynamically added here -->
                </div>
    
                <div class="location-selector">
                    <select id="location-select">
                        <option value="">Choose a location</option>
                        ${this.locations.map(loc => `<option value="${loc}">${loc}</option>`).join('')}
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
                    Send Recordings
                </button>
            </div>
        `;

        // Cache elements
        this.elements.recordButton = this.elements.container.querySelector('#record-button');
        this.elements.locationSelect = this.elements.container.querySelector('#location-select');
        this.elements.otherLocationContainer = this.elements.container.querySelector('#other-location-container');
        this.elements.otherLocationInput = this.elements.container.querySelector('#other-location');
        this.elements.recordingsList = this.elements.container.querySelector('#recordings-list');
        this.elements.sendButton = this.elements.container.querySelector('#send-recordings');
        this.elements.closeButton = this.elements.container.querySelector('#close-recorder');
    }

    // Set up all event listeners
    setupEventListeners() {
        // Record button
        this.elements.recordButton.addEventListener('click', () => this.startRecording());

        // Location select
        this.elements.locationSelect.addEventListener('change', (e) => {
            const location = e.target.value;
            this.selectedLocation = location;
            
            // Toggle other location input
            this.elements.otherLocationContainer.style.display = 
                location === 'Other' ? 'block' : 'none';
            
            this.validateSendButton();
        });

        // Other location input
        this.elements.otherLocationInput.addEventListener('input', (e) => {
            this.otherLocation = e.target.value;
            this.validateSendButton();
        });

        // Send button
        this.elements.sendButton.addEventListener('click', () => this.sendRecordings());

        // Close button
        this.elements.closeButton.addEventListener('click', () => this.closeRecorder());
    }

    // Start recording
    startRecording() {
        if (this.isRecording) return;

        this.audioChunks = [];
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.mediaRecorder = new MediaRecorder(stream);
                
                this.mediaRecorder.ondataavailable = (event) => {
                    this.audioChunks.push(event.data);
                };
                
                this.mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    this.recordings.push({
                        url: audioUrl,
                        duration: '0:03'
                    });
                    
                    this.updateRecordingsList();
                    stream.getTracks().forEach(track => track.stop());
                };
                
                this.mediaRecorder.start();
                this.isRecording = true;
                
                // Style record button
                this.elements.recordButton.classList.add('bg-red-500', 'animate-pulse');
                this.elements.recordButton.disabled = true;
                
                // Stop recording after max length
                setTimeout(() => {
                    this.stopRecording();
                }, this.maxRecordingLength);
            })
            .catch(err => {
                console.error('Error accessing microphone:', err);
                alert('Please allow microphone access to record');
            });
    }

    // Stop recording
    stopRecording() {
        if (!this.isRecording) return;
        
        this.mediaRecorder.stop();
        this.isRecording = false;
        
        // Reset record button
        this.elements.recordButton.classList.remove('bg-red-500', 'animate-pulse');
        this.elements.recordButton.disabled = false;
    }

    updateRecordingsList() {
        const recordingsList = this.elements.container.querySelector('#recordings-list');
        
        recordingsList.innerHTML = ''; // Clear existing list
        
        if (this.recordings.length === 0) {
            return;
        }
    
        this.recordings.forEach((recording, index) => {
            const recordingElement = document.createElement('div');
            recordingElement.className = 'recording-item';
            recordingElement.innerHTML = `
                <button class="play-btn">▶️</button>
                <div class="recording-details">
                    <div class="recording-waveform"></div>
                    <div class="recording-time">0:03 • ${this.selectedLocation}</div>
                </div>
                <button class="delete-btn">🗑️</button>
            `;
            
            // Play recording
            const playBtn = recordingElement.querySelector('.play-btn');
            playBtn.addEventListener('click', () => {
                const audio = new Audio(recording.url);
                audio.play().catch(error => {
                    console.error('Error playing audio:', error);
                });
            });
    
            // Delete recording
            const deleteBtn = recordingElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                // Revoke the previous object URL to free up memory
                URL.revokeObjectURL(recording.url);
                
                this.recordings.splice(index, 1);
                this.updateRecordingsList();
                this.validateSendButton();
            });
    
            recordingsList.appendChild(recordingElement);
        });
    
        // Validate send button
        this.validateSendButton();
    }
    // Validate send button state
    validateSendButton() {
        const isValid = this.recordings.length > 0 && 
            this.selectedLocation && 
            (this.selectedLocation !== 'Other' || this.otherLocation.trim() !== '');

        this.elements.sendButton.disabled = !isValid;
        this.elements.sendButton.classList.toggle('bg-gray-400', !isValid);
        this.elements.sendButton.classList.toggle('bg-green-500', isValid);
        this.elements.sendButton.classList.toggle('cursor-not-allowed', !isValid);
        this.elements.sendButton.classList.toggle('hover:bg-green-600', isValid);
    }
    

    showThankYouMessage() {
        const thankYouModal = document.getElementById('thank-you-message');
        const closeThankYouBtn = document.getElementById('close-thank-you');
        
        if (thankYouModal) {
            thankYouModal.classList.remove('hidden');
            
            const closeHandler = () => {
                thankYouModal.classList.add('hidden');
                closeThankYouBtn.removeEventListener('click', closeHandler);
            };
            
            closeThankYouBtn.addEventListener('click', closeHandler);
        }
    }

    sendRecordings() {
        console.log('Sending recordings:', this.recordings);
        console.log('Location:', this.selectedLocation === 'Other' ? this.otherLocation : this.selectedLocation);
        
        // Revoke object URLs before clearing
        this.recordings.forEach(recording => {
            URL.revokeObjectURL(recording.url);
        });
        
        // TODO: Implement actual send logic
        // alert('Recordings would be sent here (backend not implemented)');
        
        // Show thank you message instead of alert
        this.showThankYouMessage();
        
        // Optional: Clear recordings after sending
        this.recordings = [];
        this.updateRecordingsList();
        
        // Close the recorder modal
        const recorderModal = document.getElementById('voice-recorder-modal');
        if (recorderModal) {
            recorderModal.classList.add('hidden');
        }
    }

    closeRecorder() {
        const recorderModal = document.getElementById('voice-recorder-modal');
        if (recorderModal) {
            recorderModal.classList.add('hidden');
            
            // Reset the recorder state
            this.reset();
        }
    }

    hasUserInteracted() {
        return this.recordings.length > 0 || 
               (this.selectedLocation && 
                (this.selectedLocation !== 'Other' || this.otherLocation.trim() !== ''));
    }
    
    reset() {
        this.recordings = [];
        this.selectedLocation = '';
        this.otherLocation = '';
        this.updateRecordingsList();
    }
}