class SmackManager {
  constructor(animationManager) {
    logger.info('animation', 'Creating Smack Manager');
    
    this.animationManager = animationManager;
  }
  
  playSmackAnimation(countryName, onCompleteCallback) {
    logger.info('animation', `Delegating smack animation for ${countryName} to AnimationManager`);
    
    // Simply delegate to the animationManager's playSmackAnimation method
    this.animationManager.playSmackAnimation(countryName, onCompleteCallback);
  }
}

// Make the class available globally
window.SmackManager = SmackManager;