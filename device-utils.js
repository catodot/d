/**
 * Utility for consistent device detection across the game
 */
const DeviceUtils = {
    // Device detection results
    isMobileDevice: false,
    isTouchDevice: false,
    viewportWidth: 0,
    viewportHeight: 0,
    
    // Initialize device detection immediately
    init() {
      // Detect mobile device
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileByUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isMobileViewport = (window.innerWidth < 768);
      this.isMobileDevice = isMobileByUA || isMobileViewport;
      
      // Detect touch capability
      this.isTouchDevice = ('ontouchstart' in window) || 
                           (navigator.maxTouchPoints > 0) || 
                           (navigator.msMaxTouchPoints > 0);
      
      // Store viewport dimensions
      this.viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      this.viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      
      // Add resize listener to update dimensions
      window.addEventListener('resize', this.handleResize.bind(this));
      
      // console.log(`Device detected: Mobile=${this.isMobileDevice}, Touch=${this.isTouchDevice}, Viewport=${this.viewportWidth}x${this.viewportHeight}`);
      
      return this;
    },
    
    // Update dimensions on resize
    handleResize() {
      this.viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
      this.viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
    },
    
    // Convenience methods
    isMobile() {
      return this.isMobileDevice;
    },
    
    isTouch() {
      return this.isTouchDevice;
    },
    
    getWidth() {
      return this.viewportWidth;
    },
    
    getHeight() {
      return this.viewportHeight;
    }
  };
  
  // Initialize immediately on script load
  if (typeof window !== 'undefined') {
    window.DeviceUtils = DeviceUtils.init();
  }