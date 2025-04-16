// document.addEventListener('DOMContentLoaded', function() {
//     const screen = document.getElementById("stars");
//     if (!screen) {
//       console.error("Stars container not found!");
//       return;
//     }
    
//     // Just create normal white stars
//     for (let i = 0; i < 200; i++) {
//         const star = document.createElement("div");
//         star.className = "star";
        
//         // Random position
//         const x = Math.random() * 100;
//         const y = Math.random() * 100;
        
//         // Random size (mostly small, some medium)
//         const size = Math.random() < 0.7 ? 
//           Math.random() * 2 + 1 : // Small stars
//           Math.random() * 3 + 2;  // Medium stars
        
//         // Basic star styling
//         star.style.cssText = `
//           left: ${x}%;
//           top: ${y}%;
//           width: ${size}px;
//           height: ${size}px;
//           --duration: ${3 + Math.random() * 4}s;
//           --delay: ${Math.random() * 5}s;
//           --brightness: ${0.6 + Math.random() * 0.4};
//         `;
        
//         screen.appendChild(star);
//       }
  
//     // Now create our fancy orb with special positioning
//     createSentientOrb(screen);
//   });
  
//   // Calculate safe position for our special orb
//   function calculateSafePosition() {
//     const isMobile = window.innerWidth <= 768;
//     const mapEl = document.getElementById('map-background');
//     const hudEl = document.getElementById('game-hud');
//     const progressEl = document.getElementById('term-progress-container');
  
//     // Get bounding boxes of UI elements to avoid
//     const interfering = [mapEl, hudEl, progressEl]
//       .filter(el => el)
//       .map(el => el.getBoundingClientRect());
  
//     // Try positions based on device type
//     const positions = isMobile ? 
//       [{ x: 85, y: 20 }] : // Mobile: top right
//       [{ x: 90, y: 50 }];  // Desktop: right side
  
//     // Return first position that doesn't overlap UI
//     for (const pos of positions) {
//       const overlaps = interfering.some(rect => {
//         const orbX = (pos.x / 100) * window.innerWidth;
//         const orbY = (pos.y / 100) * window.innerHeight;
//         return !(orbX + 20 < rect.left || 
//                 orbX - 20 > rect.right || 
//                 orbY + 20 < rect.top || 
//                 orbY - 20 > rect.bottom);
//       });
      
//       if (!overlaps) return pos;
//     }
  
//     // Fallback position
//     return isMobile ? { x: 85, y: 20 } : { x: 90, y: 50 };
//   }
  
//   function createSentientOrb(container) {
//     const orb = document.createElement('div');
//     orb.className = 'sentient-orb glitch-element';
    
//     const pos = calculateSafePosition();
    
//     orb.style.cssText = `
//       position: absolute;
//       left: ${pos.x}%;
//       top: ${pos.y}%;
//       width: 3px;
//       height: 3px;
//       backgroundColor: white;
//       border: 1px solid white;

      
//       border-radius: 50%;
//       z-index: 1000;
//       cursor: pointer;
//       pointer-events: auto;
//       transition: transform 0.3s ease;
//     `;
  
//     // Click handling
//     orb.addEventListener('click', (event) => {
//       event.stopPropagation();
//       if (!orb.dataset.glitching) {
//         orb.dataset.glitching = 'true';
//         loadGlitchEffects()
//           .then(() => {
//             activateSentientOrbGlitch();
//             setTimeout(() => orb.dataset.glitching = '', 8000);
//           })
//           .catch(error => {
//             console.error('Failed to load glitch effects:', error);
//             orb.dataset.glitching = '';
//           });
//       }
//     });
  
//     container.appendChild(orb);
//     return orb;
//   }
  
//   // Load glitch effects when needed
//   function loadGlitchEffects() {
//     if (window.glitchEffectsLoaded) {
//       return Promise.resolve();
//     }
    
//     return new Promise((resolve, reject) => {
//       const script = document.createElement('script');
//       script.src = 'sentient-orb-effects.js';
//       script.onload = () => {
//         window.glitchEffectsLoaded = true;
//         resolve();
//       };
//       script.onerror = reject;
//       document.head.appendChild(script);
//     });
//   }