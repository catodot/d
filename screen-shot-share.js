
function initializeSocialSharing() {
  console.log("Setting up social sharing functionality");

  // Get references to buttons
  const shareBtn = document.getElementById("share-button");

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const action = shareBtn.getAttribute('data-action');
      
      console.log("Share button clicked, action:", action); // Debug log

      if (action === "record-voice") {
        console.log("Opening voice recording interface"); // Debug log
        openVoiceRecordingInterface();
      } else if (action === "external-link") {
        const link = shareBtn.getAttribute('data-link');
        if (link) {
          window.open(link, "_blank");
        }
      } else {
        console.log("No action specified for button");
      }
    });
  }
}

function openVoiceRecordingInterface() {
  const recorderModal = document.getElementById("voice-recorder-modal");
  const recorderContainer = document.getElementById("voice-recorder-container");
  
  if (recorderModal && recorderContainer) {
    console.log("Showing voice recorder modal"); // Debug log
    
    // Explicitly remove hidden class and set display
    recorderModal.classList.remove('hidden');
    recorderModal.style.display = 'flex';
    recorderModal.style.opacity = '1';
    recorderModal.style.visibility = 'visible';

    // Ensure container is visible
    recorderContainer.style.display = 'block';
    recorderContainer.style.opacity = '1';

    // Create voice recorder if not exists
    if (!window.voiceRecorder) {
      window.voiceRecorder = new VoiceRecorder();
    }
    
    // Initialize with container
    window.voiceRecorder.init("voice-recorder-container");
  } else {
    console.error("Recorder modal or container not found!");
    console.log("Recorder Modal:", recorderModal);
    console.log("Recorder Container:", recorderContainer);
  }
}

function setupVoiceRecorderModal() {
  const closeBtn = document.getElementById('close-recorder');
  const recorderModal = document.getElementById('voice-recorder-modal');

  if (closeBtn && recorderModal) {
    closeBtn.addEventListener('click', () => {
      recorderModal.classList.add('hidden');
      recorderModal.style.display = 'none';
      recorderModal.style.opacity = '0';
      recorderModal.style.visibility = 'hidden';
    });
  } else {
    console.error("Close button or modal not found");
    console.log("Close Button:", closeBtn);
    console.log("Recorder Modal:", recorderModal);
  }
}

// Call this when initializing your app
document.addEventListener('DOMContentLoaded', setupVoiceRecorderModal);

// Ensure social sharing is initialized after the game over screen is shown
function initializeShareButtonsOnGameOver() {
  console.log("Initializing share buttons"); // Debug log
  
  // Short timeout to ensure all game-over elements are fully rendered
  setTimeout(() => {
    initializeSocialSharing();
  }, 100);
}

