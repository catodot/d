class SmackManager {
  /**
   * Creates a new SmackManager instance.
   * @param {Object} animationManager - The animation manager to delegate animations to.
   */
  constructor(animationManager) {
    logger.info('animation', 'Creating Smack Manager');
    this.animationManager = animationManager;
  }
  
  /**
   * Plays a smack animation for the specified country.
   * @param {string} countryName - The name of the country to play the animation for.
   * @param {Function} onCompleteCallback - Callback to execute when animation completes.
   */
  playSmackAnimation(countryName, onCompleteCallback) {
    logger.info('animation', `Delegating smack animation for ${countryName} to AnimationManager`);
    
    // Delegate to the animationManager's playSmackAnimation method
    this.animationManager.playSmackAnimation(countryName, onCompleteCallback);
  }

  /**
   * Reset the Smack Manager to its initial state
   */
  reset() {
    logger.info('animation', 'Resetting Smack Manager');
    // If there are any ongoing smack animations, stop them
    if (this.animationManager && typeof this.animationManager.stopSmackAnimations === 'function') {
      this.animationManager.stopSmackAnimations();
    }
  }

  /**
   * Completely destroy the Smack Manager
   */
  destroy() {
    logger.info('animation', 'Destroying Smack Manager');
    
    // Stop any ongoing animations
    if (this.animationManager && typeof this.animationManager.stopSmackAnimations === 'function') {
      this.animationManager.stopSmackAnimations();
    }

    // Clear references
    this.animationManager = null;
  }
}

// Export the class to the global scope
window.SmackManager = SmackManager;