class TouchInputManager {
  constructor(gameState, logger) {
    this.gameState = gameState;
    this.logger = logger || console;
    this.handHitbox = document.getElementById("hand-hitbox");
    this.initialized = false;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Callback that will be set by the game
    this.onHandInteraction = null;
  }

  init() {
    this.logger.info("input", "Initializing TouchInputManager");

    if (!this.handHitbox) {
      this.logger.error("input", "Hand hitbox element not found");
      return false;
    }

    // Configure hand hitbox
    this.configureHandHitbox();

    // Apply mobile optimizations
    if (this.isMobile) {
      this.applyMobileOptimizations();
    }

    this.initialized = true;
    return true;
  }

  // Set the callback function that will be called when the hand is touched/clicked
  setHandInteractionCallback(callback) {
    if (typeof callback === "function") {
      this.onHandInteraction = callback;
      this.logger.debug("input", "Hand interaction callback set");
    } else {
      this.logger.error("input", "Invalid hand interaction callback provided");
    }
  }

  configureHandHitbox() {
    // Remove existing listeners
    this.handHitbox.removeEventListener("click", this.handleHandClick);
    this.handHitbox.removeEventListener("touchstart", this.handleHandTouch);

    // Configure styles
    this.handHitbox.style.position = "absolute";
    this.handHitbox.style.zIndex = "2000";
    this.handHitbox.style.cursor = "pointer";
    this.handHitbox.style.pointerEvents = "all";

    // Expand hitbox for mobile
    if (this.isMobile) {
      this.handHitbox.style.width = "80px";
      this.handHitbox.style.height = "80px";
    }

    // Add bound event listeners
    this.handHitbox.addEventListener("click", this.handleHandClick.bind(this));
    this.handHitbox.addEventListener("touchstart", this.handleHandTouch.bind(this), { passive: false });

    this.logger.info("input", "Hand hitbox configured for input");
  }

  handleHandClick(event) {
    this.logger.info("input", "Hand clicked");

    // Prevent default
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Call the callback if set
    if (this.onHandInteraction) {
      this.onHandInteraction(event);
    }
  }

  handleHandTouch(event) {
    this.logger.info("input", "Hand touched");

    // Always prevent default
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    // Visual feedback
    this.showTouchFeedback();

    // Call the callback if set
    if (this.onHandInteraction) {
      this.onHandInteraction(event);
    }
  }

  showTouchFeedback() {
    // Create a ripple effect for visual feedback
    const ripple = document.createElement("div");
    ripple.className = "touch-ripple";
    ripple.style.position = "absolute";
    ripple.style.width = "100%";
    ripple.style.height = "100%";
    ripple.style.backgroundColor = "rgba(255, 255, 255, 0.4)";
    ripple.style.borderRadius = "50%";
    ripple.style.transform = "scale(0)";
    ripple.style.animation = "ripple 0.5s ease-out";

    // Add keyframe animation if it doesn't exist
    if (!document.getElementById("touch-feedback-style")) {
      const style = document.createElement("style");
      style.id = "touch-feedback-style";
      style.textContent = `
        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    this.handHitbox.appendChild(ripple);

    // Remove after animation completes
    setTimeout(() => {
      if (ripple.parentNode === this.handHitbox) {
        this.handHitbox.removeChild(ripple);
      }
    }, 500);
  }

  applyMobileOptimizations() {
    this.logger.info("input", "Applying mobile touch optimizations");

    // Add guidance for mobile users
    this.showMobileGuidance();

    // Prevent scrolling on game container
    const gameContainer = document.getElementById("game-container");
    if (gameContainer) {
      gameContainer.style.touchAction = "manipulation";

      // Ensure no scroll/zoom on touch
      gameContainer.addEventListener(
        "touchmove",
        (e) => {
          if (this.gameState.isPlaying) {
            e.preventDefault();
          }
        },
        { passive: false }
      );
    }

    // Make buttons bigger on mobile
    document.querySelectorAll("button").forEach((btn) => {
      if (!btn.classList.contains("control-button")) {
        btn.style.minHeight = "44px";
        btn.style.minWidth = "44px";
        btn.style.fontSize = "16px";
      }
    });
  }

  showMobileGuidance() {
    const gameScreen = document.getElementById("game-screen");
    if (!gameScreen) return;

    const guidance = document.createElement("div");
    guidance.id = "mobile-guidance";
    guidance.style.position = "absolute";
    guidance.style.top = "100px";
    guidance.style.left = "50%";
    guidance.style.transform = "translateX(-50%)";
    guidance.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    guidance.style.color = "white";
    guidance.style.padding = "10px 15px";
    guidance.style.borderRadius = "20px";
    guidance.style.fontSize = "14px";
    guidance.style.zIndex = "1000";
    guidance.style.textAlign = "center";
    guidance.style.transition = "opacity 1s";
    guidance.innerHTML = "Tap Trump's hand when he reaches for countries!";

    gameScreen.appendChild(guidance);

    // Fade out after a few seconds
    setTimeout(() => {
      guidance.style.opacity = "0";
      setTimeout(() => guidance.remove(), 1000);
    }, 5000);
  }

  // Show the hitbox visually for debugging
  showHitbox(show) {
    if (!this.handHitbox) return;

    if (show) {
      this.handHitbox.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
      this.handHitbox.style.border = "2px solid red";
    } else {
      this.handHitbox.style.backgroundColor = "transparent";
      this.handHitbox.style.border = "none";
    }
  }
}
