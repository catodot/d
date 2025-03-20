class GameSpeedManager {
  constructor(gameState, animationManager, audioManager) {
    this.gameState = gameState;
    this.animationManager = animationManager;
    this.audioManager = audioManager;
    
    // Add a very slow initial level for beginners
    this.speedLevels = [
      { multiplier: 0.7, name: "Tutorial", sound: "tutorial" },
      { multiplier: 1.0, name: "gimme", sound: "normal" },
      { multiplier: 1.5, name: "Faster?", sound: "faster" },
      { multiplier: 2.0, name: "oopsie trade war", sound: "tradew" },
      { multiplier: 2.5, name: "no one is coming to save us", sound: "allmine" },
      { multiplier: 3.0, name: "naptime for donny?", sound: "gimme" },
      { multiplier: 3.0, name: "get up and fight", sound: "gimme" }
    ];
    
    this.instructionMessages = [
      { text: "SMACK HIS HAND AWAY!", audio: "instruction1" },
      { text: "SMACK THAT HAND!", audio: "instruction1" },
      { text: "CLICK ON THE HAND!", audio: "instruction2" },
      { text: "STOP HIM!", audio: "instruction3" },
      { text: "CLICK ON TRUMPS HAND AS HE GRABS A COUNTRY!", audio: "instruction3" },

    ];
    
    this.currentSpeedIndex = 0;
    this.speedIncreaseInterval = null;
    this.instructionTimeout = null;
    this.initialInstructionsShown = false;
    this.currentInstructionIndex = 0;
    this.tutorialCompleted = false;
    this.initialBlockCount = 0;
  }

  init() {
    // Nothing needed here
  }
  
  showNotification(message) {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = "speed-notification";
    notification.textContent = message;
    
    // Make notification accessible
    notification.setAttribute("role", "alert");
    notification.setAttribute("aria-live", "assertive");
    
    // Add to game screen
    const gameScreen = document.getElementById("game-screen");
    if (gameScreen) {
      gameScreen.appendChild(notification);
      
      // The CSS animation will handle showing and hiding
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 5100); // Just slightly longer than animation duration
    }
  }

  startSpeedProgression(intervalMs = 16000) {
    // Clear any existing interval
    this.stopSpeedProgression();
    
    // Capture initial block count to detect when player has blocked
    this.initialBlockCount = this.gameState.stats.successfulBlocks;
    this.tutorialCompleted = false;
    
    // Reset to initial slow speed for beginners
    this.currentSpeedIndex = 0;
    this.setSpeed(this.speedLevels[0].multiplier);
    
    // Do NOT start speed increases yet - wait until tutorial is completed
    
    // Schedule initial instructions
    if (!this.initialInstructionsShown) {
      this.showInitialInstructions();
    }
  }
  checkTutorialCompletion() {
    // If the player has already blocked a grab, consider tutorial complete
    if (this.gameState.stats.successfulBlocks > this.initialBlockCount) {
      // Player has blocked at least once!
      if (!this.tutorialCompleted) {
        console.log("Tutorial completed! Player has successfully blocked.");
        this.tutorialCompleted = true;
        
        // Clear any pending instruction timeouts
        if (this.instructionTimeout) {
          clearTimeout(this.instructionTimeout);
          this.instructionTimeout = null;
        }
        
        // Clear any existing speed interval to prevent duplicates
        if (this.speedIncreaseInterval) {
          clearInterval(this.speedIncreaseInterval);
          this.speedIncreaseInterval = null;
        }
        
        // NOW start the speed progression (intervals)
        const intervalMs = 16000; // 16 seconds between speed increases
        this.speedIncreaseInterval = setInterval(() => {
          if (!this.gameState.isPlaying || this.gameState.isPaused) return;
          
          if (this.currentSpeedIndex < this.speedLevels.length - 1) {
            this.increaseSpeed();
          }
        }, intervalMs);
        
        // Store reference for cleanup
        this.gameState.speedIncreaseInterval = this.speedIncreaseInterval;
      }
      return true;
    }
    return false;
  }
  
  showInitialInstructions() {
    this.initialInstructionsShown = true;
    this.currentInstructionIndex = 0;
    
    // Clear any existing timeout
    if (this.instructionTimeout) {
      clearTimeout(this.instructionTimeout);
    }
    
    // Show the first instruction after a short delay
    this.instructionTimeout = setTimeout(() => {
      this.showNextInstruction();
    }, 1500); // 1.5 seconds after game starts
    
    // Add a failsafe timeout to exit tutorial mode after 45 seconds
    // even if player hasn't successfully blocked
    this.tutorialFailsafeTimeout = setTimeout(() => {
      if (!this.tutorialCompleted) {
        console.log("Tutorial timeout reached. Auto-completing tutorial.");
        this.tutorialCompleted = true;
        
        // Clear any pending instruction timeouts
        if (this.instructionTimeout) {
          clearTimeout(this.instructionTimeout);
          this.instructionTimeout = null;
        }
        
        // Start the speed progression
        const intervalMs = 16000; // 16 seconds between speed increases
        this.speedIncreaseInterval = setInterval(() => {
          if (!this.gameState.isPlaying || this.gameState.isPaused) return;
          
          if (this.currentSpeedIndex < this.speedLevels.length - 1) {
            this.increaseSpeed();
          }
        }, intervalMs);
        
        // Store reference for cleanup
        this.gameState.speedIncreaseInterval = this.speedIncreaseInterval;
      }
    }, 45000); // 45 seconds timeout
  }
  showNextInstruction() {
    // First check if the tutorial is already completed
    if (this.checkTutorialCompletion()) {
      return; // Stop showing instructions
    }
    
    // If we've run through all instructions, start over
    if (this.currentInstructionIndex >= this.instructionMessages.length) {
      this.currentInstructionIndex = 0;
    }
    
    // Show the current instruction
    const instruction = this.instructionMessages[this.currentInstructionIndex];
    this.showNotification(instruction.text);
    
    // Play audio instruction if available
    if (this.audioManager && instruction.audio) {
      this.audioManager.play("ui", instruction.audio);
    }
    
    // Move to next instruction for next time
    this.currentInstructionIndex++;
    
    // Schedule next instruction (only if tutorial not completed)
    this.instructionTimeout = setTimeout(() => {
      // Check again if tutorial is completed before showing next instruction
      if (!this.tutorialCompleted) {
        this.showNextInstruction();
      }
    }, 12000); // Increased from 7000 to 12000 (12 seconds between instructions)
  }
  
  stopSpeedProgression() {
    if (this.speedIncreaseInterval) {
      clearInterval(this.speedIncreaseInterval);
      this.speedIncreaseInterval = null;
    }
    
    if (this.instructionTimeout) {
      clearTimeout(this.instructionTimeout);
      this.instructionTimeout = null;
    }
    
    if (this.tutorialFailsafeTimeout) {
      clearTimeout(this.tutorialFailsafeTimeout);
      this.tutorialFailsafeTimeout = null;
    }
    
    // Clean up any notifications
    const gameScreen = document.getElementById("game-screen");
    if (gameScreen) {
      const notifications = gameScreen.querySelectorAll(".speed-notification");
      notifications.forEach(notification => {
        notification.remove();
      });
    }
  }
  
  increaseSpeed() {
    // Only show speed notifications if tutorial is completed
    if (!this.tutorialCompleted) {
      return false;
    }
    
    if (this.currentSpeedIndex < this.speedLevels.length - 1) {
      this.currentSpeedIndex++;
      const newSpeed = this.speedLevels[this.currentSpeedIndex];
      
      // Set the new speed
      this.setSpeed(newSpeed.multiplier);
      
      // Show notification
      this.showNotification(newSpeed.name.toUpperCase() + "!");
      
      // Play specific sound for this speed level if available
      if (this.audioManager) {
        if (newSpeed.sound) {
          // Try to play the specific sound for this level
          this.audioManager.play("ui", newSpeed.sound)
            .catch(error => {
              // Fall back to generic speedup sound if specific one isn't available
              console.log(`Couldn't play speed sound ${newSpeed.sound}, falling back to generic`);
              this.audioManager.play("ui", "speedup");
            });
        } else {
          // Use generic speedup sound if no specific one is defined
          this.audioManager.play("ui", "speedup");
        }
      }
      
      console.log(`Game speed increased to ${newSpeed.multiplier.toFixed(2)}x (${newSpeed.name})`);
      
      return true;
    }
    return false;
  }
  
  setSpeed(multiplier) {
    this.gameState.gameSpeedMultiplier = multiplier;
    
    // Update animation speed
    if (this.animationManager && typeof this.animationManager.setGameSpeed === 'function') {
      this.animationManager.setGameSpeed(multiplier);
    }
  }
  
  getCurrentSpeed() {
    return {
      multiplier: this.gameState.gameSpeedMultiplier,
      name: this.speedLevels[this.currentSpeedIndex].name
    };
  }
  
  reset() {
    this.stopSpeedProgression(); // Stop all timers and notifications
    this.currentSpeedIndex = 0; // Reset to initial speed
    this.setSpeed(this.speedLevels[0].multiplier); // Set to base speed
    this.initialInstructionsShown = false;
    this.currentInstructionIndex = 0;
    this.tutorialCompleted = false;
    this.initialBlockCount = 0;
  }
  
  destroy() {
    // Instead of full destruction, just do a comprehensive reset
    this.reset();
    
    // Remove any lingering UI elements
    const gameScreen = document.getElementById("game-screen");
    if (gameScreen) {
      const notifications = gameScreen.querySelectorAll(".speed-notification");
      notifications.forEach(notification => notification.remove());
    }
  }
}