// // ENHANCED PARTICLES CODE
// function enhancedCreateParticles(x, y) {
//     if (window.logger) {
//         logger.debug('particles', `Creating particles at (${x}, ${y})`);
//         const perfTimer = logger.time('performance', 'Particle creation');
//     }
    
//     const colors = ['#ffd700', '#ff4500', '#ffffff', '#c10000', '#1e90ff']; // Gold, Orange-red, White, Dark red, Blue
//     const particleCount = 20; // More particles for better effect
    
//     for (let i = 0; i < particleCount; i++) {
//       const particle = document.createElement("div");
//       particle.className = "particle";
//       document.body.appendChild(particle);
  
//       // Random size with larger range
//       const size = Math.random() * 10 + 5;
//       particle.style.width = `${size}px`;
//       particle.style.height = `${size}px`;
      
//       // Random color from our palette
//       particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
//       // Add a slight glow effect
//       particle.style.boxShadow = `0 0 ${Math.random() * 5 + 2}px ${particle.style.backgroundColor}`;
  
//       // Position at click/tap point
//       particle.style.left = `${x}px`;
//       particle.style.top = `${y}px`;
  
//       // Random direction and speed with higher variation
//       const angle = Math.random() * Math.PI * 2;
//       const speed = Math.random() * 8 + 3; // Faster particles
//       const vx = Math.cos(angle) * speed;
//       const vy = Math.sin(angle) * speed;
  
//       // Animate particle with longer lifetime
//       let posX = x;
//       let posY = y;
//       let opacity = 1;
//       let gravity = 0.1;
//       let lifetime = 100 + Math.random() * 50; // Longer lifetime with randomness
//       let frame = 0;
  
//       const animateParticle = () => {
//         frame++;
//         if (opacity <= 0 || frame > lifetime) {
//           particle.remove();
//           return;
//         }
  
//         posX += vx;
//         posY += vy + gravity;
//         gravity += 0.05;
//         opacity = 1 - (frame / lifetime); // Smoother fading
  
//         particle.style.left = `${posX}px`;
//         particle.style.top = `${posY}px`;
//         particle.style.opacity = opacity;
        
//         // Add slight rotation for some particles
//         if (i % 3 === 0) {
//           particle.style.transform = `rotate(${frame * 5}deg)`;
//         }
  
//         requestAnimationFrame(animateParticle);
//       };
  
//       requestAnimationFrame(animateParticle);
//     }
    
//     if (window.logger && logger.time) {
//         perfTimer.end();
//     }
// }
  
// // Add CSS enhancements for particles
// function addParticleEnhancements() {
//     const particleCssEnhancements = `
//     /* Enhanced Particle Effects */
//     .particle {
//       position: absolute;
//       border-radius: 50%;
//       pointer-events: none;
//       z-index: 6;
//       transform-origin: center center;
//       animation: particlePulse 0.5s infinite alternate;
//     }
    
//     @keyframes particlePulse {
//       0% { transform: scale(1); }
//       100% { transform: scale(1.1); }
//     }
//     `;
  
//     const styleEl = document.createElement('style');
//     styleEl.type = 'text/css';
//     styleEl.appendChild(document.createTextNode(particleCssEnhancements));
//     document.head.appendChild(styleEl);
    
//     if (window.logger) {
//         logger.info('particles', 'Particle visual enhancements added');
//     } else {
//         console.log('Particle visual enhancements added');
//     }
// }
  
// // Initialize effects
// function initEffects() {
//     if (window.logger) {
//         logger.info('particles', 'Initializing visual effects...');
//     } else {
//         console.log("Initializing visual effects...");
//     }
    
//     // Add particle CSS enhancements
//     addParticleEnhancements();
    
//     // Override the createParticles function
//     window.createParticles = enhancedCreateParticles;
//     createParticles = enhancedCreateParticles;
    
//     if (window.logger) {
//         logger.info('particles', 'Visual effects initialized!');
//     } else {
//         console.log("Visual effects initialized!");
//     }
// }
  
// // Initialize on load
// document.addEventListener("DOMContentLoaded", function() {
//     setTimeout(initEffects, 500);
// });
  
// // Expose function for manual calling
// window.initEffectsManually = initEffects;