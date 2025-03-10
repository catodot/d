// UFO Animation Manager
class UfoManager {
  constructor() {
    this.ufoElement = null;
    this.isAnimating = false;
    this.autoSpawnEnabled = true;
    this.animationTimeout = null;
    this.debugMode = false;
    
    // Configuration
    this.minInterval = 40000; // 10 seconds
    this.maxInterval = 60000; // 60 seconds
    this.ufoSize = {
      min: 30,    // minimum size in pixels
      max: 480,    // maximum size in pixels
      current: 20 // initial size
    };
    
    // Add to debug panel if available
    this.addToDebugPanel();
  }
  
  init() {
    // Create UFO element if it doesn't exist
    if (!this.ufoElement) {
      this.createUfoElement();
    }
    
    // Start auto-spawning
    if (this.autoSpawnEnabled) {
      this.scheduleNextUfo();
    }
    
    console.log("UFO Manager initialized");
    return this;
  }
  
  createUfoElement() {
    this.ufoElement = document.createElement('img');
    this.ufoElement.src = 'images/ufo.png';
    this.ufoElement.id = 'flying-ufo';
    this.ufoElement.alt = 'UFO';
    this.ufoElement.style.position = 'absolute';
    this.ufoElement.style.width = `${this.ufoSize.min}px`;
    this.ufoElement.style.height = 'auto';
    this.ufoElement.style.zIndex = '9'; // Above game elements but below UI
    this.ufoElement.style.opacity = '0';
    this.ufoElement.style.transition = 'opacity 0.5s ease';
    this.ufoElement.style.pointerEvents = 'none'; // Don't interfere with clicks
    
    // Add to game screen
    const gameScreen = document.getElementById('game-screen') || document.body;
    gameScreen.appendChild(this.ufoElement);
    
    console.log("UFO element created");
  }
  
  scheduleNextUfo() {
    if (!this.autoSpawnEnabled) return;
    
    // Clear any existing timeout
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
    }
    
    // Random interval between min and max
    const interval = Math.floor(Math.random() * (this.maxInterval - this.minInterval)) + this.minInterval;
    
    this.animationTimeout = setTimeout(() => {
      if (this.autoSpawnEnabled) {
        this.flyUfo();
      }
    }, interval);
    
    if (this.debugMode) {
      console.log(`Next UFO scheduled in ${(interval/1000).toFixed(1)} seconds`);
    }
  }
  
  flyUfo() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    // Check if screen is hidden or game is paused
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen && gameScreen.classList.contains('hidden')) {
      this.isAnimating = false;
      this.scheduleNextUfo();
      return;
    }
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Reset UFO size
    this.ufoSize.current = this.ufoSize.min;
    this.ufoElement.style.width = `${this.ufoSize.current}px`;
    
    // Random starting position (off-screen)
    const startSide = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let startX, startY;
    
    switch (startSide) {
      case 0: // top
        startX = Math.random() * viewportWidth;
        startY = -this.ufoSize.min;
        break;
      case 1: // right
        startX = viewportWidth + this.ufoSize.min;
        startY = Math.random() * viewportHeight;
        break;
      case 2: // bottom
        startX = Math.random() * viewportWidth;
        startY = viewportHeight + this.ufoSize.min;
        break;
      case 3: // left
        startX = -this.ufoSize.min;
        startY = Math.random() * viewportHeight;
        break;
    }
    
    // Random ending position (off-screen)
    // Don't exit on the same side as entry for more interesting paths
    const endSide = (startSide + 1 + Math.floor(Math.random() * 2)) % 4;
    let endX, endY;
    
    switch (endSide) {
      case 0: // top
        endX = Math.random() * viewportWidth;
        endY = -this.ufoSize.min;
        break;
      case 1: // right
        endX = viewportWidth + this.ufoSize.min;
        endY = Math.random() * viewportHeight;
        break;
      case 2: // bottom
        endX = Math.random() * viewportWidth;
        endY = viewportHeight + this.ufoSize.min;
        break;
      case 3: // left
        endX = -this.ufoSize.min;
        endY = Math.random() * viewportHeight;
        break;
    }
    
    // Generate 2-4 control points for the bezier path
    const numControlPoints = Math.floor(Math.random() * 3) + 2;
    const controlPoints = [];
    
    for (let i = 0; i < numControlPoints; i++) {
      // Control points should be within the visible area plus some margin
      const margin = 100;
      const cpX = Math.random() * (viewportWidth + 2 * margin) - margin;
      const cpY = Math.random() * (viewportHeight + 2 * margin) - margin;
      controlPoints.push({ x: cpX, y: cpY });
    }
    
    // Position the UFO at the starting point
    this.ufoElement.style.left = `${startX}px`;
    this.ufoElement.style.top = `${startY}px`;
    this.ufoElement.style.opacity = '1';
    
    // Generate random rotation for the flight
    const rotateClockwise = Math.random() > 0.5;
    const maxRotation = 45 + Math.random() * 90; // Reduced from 360 to 45-135 degrees
    
    // Animation settings
    const duration = 5000 + Math.random() * 5000; // 5-10 seconds
    const startTime = performance.now();
    
    // Add subtle wobble
    const wobbleFrequency = 5 + Math.random() * 10;
    const wobbleAmplitude = 5 + Math.random() * 10;
    
    // Animation function
    const animateUfo = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 1) {
        // Calculate position using bezier curve with control points
        const position = this.getBezierPoint(progress, 
          { x: startX, y: startY }, 
          { x: endX, y: endY },
          controlPoints
        );
        
        // Add wobble
        const wobble = Math.sin(progress * wobbleFrequency) * wobbleAmplitude;
        position.y += wobble;
        
        // Calculate size - grows in middle, shrinks at ends
        const sizeFactor = 4 * progress * (1 - progress); // parabolic curve peaking at 0.5
        const sizeRange = this.ufoSize.max - this.ufoSize.min;
        this.ufoSize.current = this.ufoSize.min + sizeFactor * sizeRange;
        
        // Set position and size
        this.ufoElement.style.left = `${position.x}px`;
        this.ufoElement.style.top = `${position.y}px`;
        this.ufoElement.style.width = `${this.ufoSize.current}px`;
        
        const rotationAmount = progress * maxRotation;
        const rotation = rotateClockwise ? rotationAmount : -rotationAmount;
        // Add a slight wobble to the rotation for realism
        const rotationWobble = Math.sin(progress * wobbleFrequency * 1.5) * 5; // Small 5-degree wobble
        this.ufoElement.style.transform = `rotate(${rotation + rotationWobble}deg)`;

        // Continue animation
        requestAnimationFrame(animateUfo);
      } else {
        // Animation completed
        this.ufoElement.style.opacity = '0';
        this.isAnimating = false;
        
        // this.scheduleElonAppearance();

        // Schedule next UFO
        this.scheduleNextUfo();
      }
    };
    
    // Start animation
    requestAnimationFrame(animateUfo);
  }
  
  // Calculate point on a bezier curve with multiple control points
  getBezierPoint(t, start, end, controlPoints) {
    // De Casteljau's algorithm for multiple control points
    const points = [start, ...controlPoints, end];
    
    while (points.length > 1) {
      const newPoints = [];
      for (let i = 0; i < points.length - 1; i++) {
        newPoints.push({
          x: (1 - t) * points[i].x + t * points[i + 1].x,
          y: (1 - t) * points[i].y + t * points[i + 1].y
        });
      }
      points.length = 0;
      points.push(...newPoints);
    }
    
    return points[0];
  }
  
  toggleAutoSpawn() {
    this.autoSpawnEnabled = !this.autoSpawnEnabled;
    
    if (this.autoSpawnEnabled) {
      this.scheduleNextUfo();
    } else {
      if (this.animationTimeout) {
        clearTimeout(this.animationTimeout);
        this.animationTimeout = null;
      }
    }
    
    return this.autoSpawnEnabled;
  }
  
  setDebugMode(enabled) {
    this.debugMode = enabled;
  }
  
  scheduleElonAppearance() {
    // Schedule Elon to appear 10 seconds after UFO
    setTimeout(() => {
      this.showElonMusk();
    }, 10000);
    
    if (this.debugMode) {
      console.log("Elon Musk appearance scheduled in 10 seconds");
    }
  }

  showElonMusk() {
    console.log("showElonMusk called - attempting to show Elon Musk");
    
    // Don't show on game over or pause screens
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen && gameScreen.classList.contains('hidden')) {
      console.log("Game screen is hidden, not showing Elon");
      return;
    }
    
    // Create Elon element if it doesn't exist
    if (!this.elonElement) {
      this.elonElement = document.createElement('img');
      this.elonElement.src = 'images/musk.png';
      this.elonElement.id = 'elon-musk';
      this.elonElement.alt = 'Elon Musk';
      this.elonElement.style.position = 'absolute';
      this.elonElement.style.width = '0px';
      this.elonElement.style.height = 'auto';
      this.elonElement.style.zIndex = '9999'; // High z-index to be above all
      this.elonElement.style.opacity = '0';
      this.elonElement.style.transition = 'opacity 0.5s ease';
      this.elonElement.style.pointerEvents = 'none'; // Don't interfere with clicks
      // Remove red border
      
      // Add to game screen
      const gameScreen = document.getElementById('game-screen') || document.body;
      gameScreen.appendChild(this.elonElement);
      
      console.log("Elon Musk element created and appended to", gameScreen.id || "body");
    }
    
    // Position Elon slightly left and down from center (10% offset)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Animation settings - SLOWER growth
    const maxSize = 200;
    const growDuration = 2000; // Increased from 1000 to 2000 for slower growth
    const stayDuration = 2000;
    const shrinkDuration = 1200; // Also increased for consistency
    
    // Calculate positioning that allows growth from bottom center
    // Apply the 10% offset left and down from center
    const centerX = Math.floor(viewportWidth / 2);
    const centerY = Math.floor(viewportHeight / 2);
    const offsetX = Math.floor(viewportWidth * 0.1); // 10% of width
    const offsetY = Math.floor(viewportHeight * 0.1); // 10% of height
    
    // Position is now center with 10% offset, and will anchor from bottom center
    const elonX = centerX - offsetX;
    const elonY = centerY + offsetY;
    
    console.log("Positioning Elon at:", elonX, elonY);
    
    // Set position
    this.elonElement.style.left = `${elonX}px`;
    this.elonElement.style.top = `${elonY}px`;
    
    // Set transform origin to bottom center for growth from bottom
    this.elonElement.style.transformOrigin = 'center bottom';
    
    // Reset styles before animation
    this.elonElement.style.width = '0px';
    this.elonElement.style.opacity = '1';
    
    console.log("Starting Elon animation with slower growth");
    
    // Start animation sequence
    const startTime = performance.now();
    
    const animateElon = (timestamp) => {
      const elapsed = timestamp - startTime;
      
      // Grow phase
      if (elapsed < growDuration) {
        const progress = elapsed / growDuration;
        const size = progress * maxSize;
        this.elonElement.style.width = `${size}px`;
        
        // Calculate horizontal position to keep centered as it grows
        // No need to adjust for each frame since we're using transform-origin
        
        requestAnimationFrame(animateElon);
      } 
      // Stay phase
      else if (elapsed < growDuration + stayDuration) {
        this.elonElement.style.width = `${maxSize}px`;
        requestAnimationFrame(animateElon);
      } 
      // Shrink phase
      else if (elapsed < growDuration + stayDuration + shrinkDuration) {
        const shrinkElapsed = elapsed - (growDuration + stayDuration);
        const progress = shrinkElapsed / shrinkDuration;
        const size = maxSize * (1 - progress);
        this.elonElement.style.width = `${size}px`;
        
        // Start fading out in the last half of shrinking
        if (progress > 0.5) {
          this.elonElement.style.opacity = 2 * (1 - progress);
        }
        
        requestAnimationFrame(animateElon);
      } else {
        // Animation complete
        console.log("Animation complete, hiding Elon");
        this.elonElement.style.width = '0px';
        this.elonElement.style.opacity = '0';
      }
    };
    
    requestAnimationFrame(animateElon);
  }
  
  addToDebugPanel() {
    // Wait a moment to make sure debug panel is loaded
    setTimeout(() => {
      const debugPanel = document.getElementById('debug-panel');
      if (!debugPanel) {
        console.log("Debug panel not found, UFO debug controls not added");
        return;
      }
      
      // Create UFO debug section
      const ufoHeading = document.createElement('h3');
      ufoHeading.textContent = 'UFO Controls';
      ufoHeading.style.marginTop = '15px';
      debugPanel.appendChild(ufoHeading);
      
      const ufoControls = document.createElement('div');
      ufoControls.id = 'ufo-debug-controls';
      ufoControls.style.marginBottom = '10px';
      
      // Create test button
      const testButton = document.createElement('button');
      testButton.textContent = 'Test UFO Flight';
      testButton.addEventListener('click', () => this.flyUfo());
      ufoControls.appendChild(testButton);
      
      // Create toggle button
      const toggleButton = document.createElement('button');
      toggleButton.textContent = this.autoSpawnEnabled ? 'Disable Auto UFO' : 'Enable Auto UFO';
      toggleButton.addEventListener('click', () => {
        const enabled = this.toggleAutoSpawn();
        toggleButton.textContent = enabled ? 'Disable Auto UFO' : 'Enable Auto UFO';
      });
      ufoControls.appendChild(toggleButton);
      
      // Add Elon Musk test button
      const elonButton = document.createElement('button');
      elonButton.textContent = 'Test Elon Appearance';
      elonButton.addEventListener('click', () => this.showElonMusk());
      ufoControls.appendChild(elonButton);
      
      debugPanel.appendChild(ufoControls);
      console.log("UFO debug controls added to debug panel");
    }, 1000);
  }
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Create and initialize the UFO manager
  window.ufoManager = new UfoManager().init();
  
  // Add UFO initialization to the game's init function if it exists
  const originalInit = window.init;
  if (typeof originalInit === 'function') {
    window.init = function() {
      originalInit.apply(this, arguments);
      
      // Make sure UFO manager is initialized
      if (!window.ufoManager) {
        window.ufoManager = new UfoManager().init();
      }
    };
  }
});