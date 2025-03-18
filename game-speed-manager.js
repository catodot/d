// GameSpeedManager.js
class GameSpeedManager {
  constructor(gameState, animationManager, audioManager) {
    this.gameState = gameState;
    this.animationManager = animationManager;
    this.audioManager = audioManager;
    this.speedLevels = [
      { multiplier: 1.0, name: "Normal" },
      { multiplier: 1.5, name: "Faster?" },
      { multiplier: 2.0, name: "oopsie trade war" },
      { multiplier: 2.5, name: "all mine!" },
      { multiplier: 3.0, name: "gimme gimme" }
    ];
    this.currentSpeedIndex = 0;
    this.speedIncreaseInterval = null;
    this.notificationElement = null;
  }

  init() {
   
  }

  startSpeedProgression(intervalMs = 16000) {
    // Clear any existing interval
    this.stopSpeedProgression();
    
    // Reset to initial speed
    this.currentSpeedIndex = 0;
    this.setSpeed(this.speedLevels[0].multiplier);
    
    // Set up interval for speed increases
    this.speedIncreaseInterval = setInterval(() => {
      if (!this.gameState.isPlaying || this.gameState.isPaused) return;
      
      if (this.currentSpeedIndex < this.speedLevels.length - 1) {
        this.increaseSpeed();
      }
    }, intervalMs);
    
    // Store interval in gameState for cleanup
    this.gameState.speedIncreaseInterval = this.speedIncreaseInterval;
  }
  
  stopSpeedProgression() {
    if (this.speedIncreaseInterval) {
      clearInterval(this.speedIncreaseInterval);
      this.speedIncreaseInterval = null;
    }
  }
  
  increaseSpeed() {
    if (this.currentSpeedIndex < this.speedLevels.length - 1) {
      this.currentSpeedIndex++;
      const newSpeed = this.speedLevels[this.currentSpeedIndex];
      
      // Set the new speed
      this.setSpeed(newSpeed.multiplier);
      
      // Show notification
      this.showSpeedNotification(newSpeed.name);
      
      // Play sound if available
      if (this.audioManager && typeof this.audioManager.play === 'function') {
        this.audioManager.play("ui", "speedup");
      }
      
      console.log(`Game speed increased to ${newSpeed.multiplier.toFixed(2)}x (${newSpeed.name})`);
      
      return true;
    }
    return false;
  }
  
  setSpeed(multiplier) {
    this.gameState.gameSpeedMultiplier = multiplier;
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
  
  showSpeedNotification(speedName) {
    // Remove any existing notification
    if (this.notificationElement) {
      this.notificationElement.remove();
    }
    
    // Create new notification
    this.notificationElement = document.createElement("div");
    this.notificationElement.classList.add("speed-notification");
    this.notificationElement.textContent = speedName.toUpperCase() + "!";
    
    // Add to game screen
    const gameScreen = document.getElementById("game-screen");
    if (gameScreen) {
      gameScreen.appendChild(this.notificationElement);
    
      // Remove after animation completes
      setTimeout(() => {
        if (this.notificationElement) {
          this.notificationElement.remove();
          this.notificationElement = null;
        }
      }, 1500); // Match the animation duration
    }
  }
  
  reset() {
    this.stopSpeedProgression();
    this.currentSpeedIndex = 0;
    this.setSpeed(this.speedLevels[0].multiplier);
    
    // Remove any active notification
    if (this.notificationElement) {
      this.notificationElement.remove();
      this.notificationElement = null;
    }
  }
}