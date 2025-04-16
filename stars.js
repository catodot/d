
// Only initialize basic star field on load, not the glitch effects
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initializing basic star field");
  
  const screen = document.getElementById("stars");
  if (!screen) return;
  
  const numStars = 200;
  let sentientOrbCreated = false;

  // Create stars with better distribution
  for (let i = 0; i < numStars; i++) {
    const star = createStar(screen);
    
    // Placement logic for sentient orb (improved to use percentages)
    const x = parseFloat(star.style.left);
    const y = parseFloat(star.style.top);
    
    // Create sentient orb in a more visible location but not dead center
    if (!sentientOrbCreated && 
        ((x > 20 && x < 30) || (x > 70 && x < 80)) && 
        (y > 30 && y < 70)) {
      console.log("Created sentient orb at", { x, y });
      createBasicSentientOrb(star);
      sentientOrbCreated = true;
      
      // Make it stand out more
      star.style.width = '8px';
      star.style.height = '8px';
      star.style.backgroundColor = '#ff00ff';
      star.style.boxShadow = '0 0 15px 5px rgba(255, 0, 255, 0.7)';
    }
  }
});

// Create a basic star
function createStar(container) {
  const star = document.createElement("div");
  star.className = "star";
  
  // Improved spatial distribution to avoid clustering in corners
  const distribution = Math.random();
  let x, y;
  
  if (distribution < 0.7) {
    // 70% chance of using uniform distribution across the entire screen
    x = Math.random() * 100;
    y = Math.random() * 100;
  } else if (distribution < 0.85) {
    // 15% chance of placing star in a central area
    x = 30 + Math.random() * 40;
    y = 30 + Math.random() * 40;
  } else {
    // 15% chance of placing along the edges (but not corners)
    if (Math.random() < 0.5) {
      // Horizontal edge
      x = Math.random() * 100;
      y = Math.random() < 0.5 ? Math.random() * 15 : 85 + Math.random() * 15;
    } else {
      // Vertical edge
      x = Math.random() < 0.5 ? Math.random() * 15 : 85 + Math.random() * 15;
      y = Math.random() * 100;
    }
  }
  
  // Improved size variation
  let sizeCategory = Math.random();
  let size;
  
  if (sizeCategory < 0.7) {
    // Small stars (70%)
    size = Math.random() * 2 + 1;
  } else if (sizeCategory < 0.9) {
    // Medium stars (20%)
    size = Math.random() * 3 + 2;
  } else {
    // Large stars (10%)
    size = Math.random() * 4 + 3;
  }
  
  // Duration, delay and brightness
  const duration = 3 + Math.random() * 7 + "s";
  const delay = Math.random() * 10 + "s";
  const brightness = 0.6 + Math.random() * 0.4; // Brighter stars
  
  // Apply star properties
  star.style.left = `${x}%`;
  star.style.top = `${y}%`;
  star.style.width = `${size}px`;
  star.style.height = `${size}px`;
  star.style.setProperty("--duration", duration);
  star.style.setProperty("--delay", delay);
  star.style.setProperty("--brightness", brightness);
  star.style.pointerEvents = 'auto';
  
  // star.style.pointerEvents = 'all';


  // Small chance of colored stars with vibrant colors
  if (Math.random() < 0.2) {
    const hue = Math.random() * 360;
    star.style.backgroundColor = `hsl(${hue}, 100%, 80%)`;
    star.style.boxShadow = `0 0 ${size * 1.5}px hsl(${hue}, 100%, 70%)`;
  }

  container.appendChild(star);
  return star;
}

// Create basic sentient orb without all the glitch effects - just the appearance and click handler
function createBasicSentientOrb(star) {
  console.log("Creating basic sentient orb");
  
  star.classList.add('sentient-orb');
  star.style.zIndex = '1000';
  star.style.pointerEvents = 'auto';
  star.style.cursor = 'pointer';
  
  // Make the sentient orb more noticeable with vibrant colors
  star.style.width = '10px';
  star.style.height = '10px';
  star.style.background = 'radial-gradient(circle, rgb(237, 237, 237), rgba(0,255,255,1) 100%)';
  star.style.boxShadow = '0 0 15px 5px rgba(255, 0, 255, 0.8)';
  star.style.pointerEvents = 'all';

  // Pulse animation
  star.style.animation = 'pulse 2s infinite alternate';
  
  // Add pulse keyframes if they don't exist
  if (!document.querySelector('#sentient-orb-pulse')) {
    const style = document.createElement('style');
    style.id = 'sentient-orb-pulse';
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); box-shadow: 0 0 10px 2px rgba(255, 0, 255, 0.7); }
        100% { transform: scale(1.5); box-shadow: 0 0 15px 5px rgba(0, 255, 255, 0.9); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // When clicked, dynamically load the full glitch code
  star.addEventListener('click', function(event) {
    event.stopPropagation();
    loadGlitchEffects().then(() => {
      // After loading, call the activate function from the newly loaded code
      activateSentientOrbGlitch();
    }).catch(error => {
      console.error("Failed to load glitch effects:", error);
    });
  });
  
  return star;
}

// Function to dynamically load the glitch effects code
function loadGlitchEffects() {
  if (window.glitchEffectsLoaded) {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    // Create script element for the full glitch code
    const script = document.createElement('script');
    script.src = 'sentient-orb-effects.js'; // Create this file with the GlitchEngine class and effects
    script.onload = () => {
      window.glitchEffectsLoaded = true;
      console.log("Glitch effects code loaded successfully");
      resolve();
    };
    script.onerror = (error) => {
      console.error("Error loading glitch effects:", error);
      reject(error);
    };
    
    // Add script to document
    document.head.appendChild(script);
  });
}

