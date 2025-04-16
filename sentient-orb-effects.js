// // sentient-orb-effects.js
// // This file contains the GlitchEngine class and all the effects code

// class GlitchEngine {
//   static defaultOptions = {
//     interval: 100,
//     squashIntensity: 0.4,
//     rotationRange: 30,
//     colorShiftIntensity: 50,
//     pixelDistortionRange: 10,
//     duplicateOffset: 5,
//     scanlineFrequency: 5,
//     pixelationLevel: 3,
//     useRainbowColors: true,
//     glitchModes: ['pixelate', 'duplicate', 'scanlines', 'noise', 'fragment', 'shift', 'invert', 'slice']
//   };

//   constructor(container, options = {}) {
//     this.container = container;
//     this.options = { ...GlitchEngine.defaultOptions, ...options };
//     this.glitchElements = [];
//     this.glitchInterval = null;
//     this.cleanupFunctions = new Map();
//     this.originalStyles = new Map(); // Store original styles for proper cleanup
    
//     this.setupGlitchElements();
//   }

//   setupGlitchElements() {
//     this.glitchElements = Array.from(
//       this.container.querySelectorAll('.glitch-element')
//     );

//     console.log(`Found ${this.glitchElements.length} glitch elements`);

//     // Store original styles for all elements
//     this.glitchElements.forEach(element => {
//       // Save the original position if not already set
//       if (!element.dataset.originalPosition && getComputedStyle(element).position === 'static') {
//         element.style.position = 'relative';
//       }

//       this.originalStyles.set(element, {
//         transform: element.style.transform || '',
//         filter: element.style.filter || '',
//         clipPath: element.style.clipPath || '',
//         position: element.style.position || '',
//         zIndex: element.style.zIndex || '',
//         mixBlendMode: element.style.mixBlendMode || '',
//         backgroundColor: element.style.backgroundColor || '',
//         opacity: element.style.opacity || ''
//       });
//     });
//   }

//   startGlitching(customOptions = {}) {
//     // Merge any custom options with existing options
//     const activeOptions = { ...this.options, ...customOptions };
    
//     this.stopGlitching(); // Clear any existing interval
//     console.log("Starting glitch effects");
    
//     this.glitchInterval = setInterval(() => {
//       this.glitchElements.forEach(element => 
//         this.applyRandomGlitch(element, activeOptions)
//       );
//     }, activeOptions.interval);
//   }

//   stopGlitching() {
//     if (this.glitchInterval) {
//       clearInterval(this.glitchInterval);
//       this.glitchInterval = null;
//       console.log("Stopped glitch effects");
//     }
    
//     // Clean up all glitch elements
//     this.glitchElements.forEach(element => {
//       // Execute specific cleanup for this element
//       const cleanup = this.cleanupFunctions.get(element);
//       if (cleanup) cleanup();
      
//       // Remove any leftover overlays
//       const overlays = element.querySelectorAll('.glitch-overlay, .glitch-duplicate, .glitch-scanline, .glitch-noise, .glitch-fragment');
//       overlays.forEach(overlay => overlay.remove());
      
//       // Reset to original styles
//       const originalStyle = this.originalStyles.get(element);
//       if (originalStyle) {
//         Object.entries(originalStyle).forEach(([prop, value]) => {
//           element.style[prop] = value;
//         });
//       }
      
//       // Additional reset of any properties that might have been added
//       element.style.transform = originalStyle?.transform || '';
//       element.style.filter = originalStyle?.filter || '';
//       element.style.clipPath = originalStyle?.clipPath || '';
//       element.style.mixBlendMode = originalStyle?.mixBlendMode || '';
//       element.style.backgroundColor = originalStyle?.backgroundColor || '';
//       element.style.opacity = originalStyle?.opacity || '';
//       element.style.animation = '';
//       element.style.transition = '';
//     });
    
//     this.cleanupFunctions.clear();
//   }

//   applyRandomGlitch(element, options) {
//     // Clean up previous glitch effects first
//     const cleanup = this.cleanupFunctions.get(element);
//     if (cleanup) cleanup();
    
//     // Randomly select 1-3 glitch modes to apply
//     const numEffects = Math.floor(Math.random() * 3) + 1;
//     const selectedModes = this.shuffleArray([...options.glitchModes]).slice(0, numEffects);
    
//     // Create cleanup function for this element
//     const cleanupFunctions = [];
    
//     // Apply base transformations
//     const squashStretch = this.generateSquashStretch(options.squashIntensity);
//     const rotation = this.generateRotation(options.rotationRange);
    
//     element.style.transform = `
//       scale(${squashStretch.scaleX}, ${squashStretch.scaleY}) 
//       rotate(${rotation}deg)
//       translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 10}px)
//     `;
    
//     // Apply selected glitch modes
//     selectedModes.forEach(mode => {
//       switch(mode) {
//         case 'pixelate':
//           cleanupFunctions.push(this.applyPixelation(element, options));
//           break;
//         case 'duplicate':
//           cleanupFunctions.push(this.applyDuplication(element, options));
//           break;
//         case 'scanlines':
//           cleanupFunctions.push(this.applyScanlines(element, options));
//           break;
//         case 'noise':
//           cleanupFunctions.push(this.applyNoise(element, options));
//           break;
//         case 'fragment':
//           cleanupFunctions.push(this.applyFragmentation(element, options));
//           break;
//         case 'shift':
//           cleanupFunctions.push(this.applyRGBShift(element, options));
//           break;
//         case 'invert':
//           cleanupFunctions.push(this.applyInvertedDuplicate(element, options));
//           break;
//         case 'slice':
//           cleanupFunctions.push(this.applySlices(element, options));
//           break;
//       }
//     });
    
//     // Store cleanup function for this element
//     this.cleanupFunctions.set(element, () => {
//       cleanupFunctions.forEach(fn => fn());
//     });
//   }

//   // Utility method to shuffle an array
//   shuffleArray(array) {
//     const newArray = [...array];
//     for (let i = newArray.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
//     }
//     return newArray;
//   }

//   generateSquashStretch(intensity) {
//     return {
//       scaleX: 1 + (Math.random() - 0.5) * intensity,
//       scaleY: 1 + (Math.random() - 0.5) * intensity
//     };
//   }

//   generateRotation(range) {
//     return (Math.random() - 0.5) * range;
//   }

//   generateVibrantColor() {
//     const hue = Math.floor(Math.random() * 360);
//     return `hsl(${hue}, 100%, 65%)`; // More vibrant colors with higher saturation
//   }

//   generateRainbowColor(index = null) {
//     const hue = index !== null ? index * 40 % 360 : Math.floor(Math.random() * 360);
//     return `hsl(${hue}, 100%, 65%)`; // Brighter rainbow colors
//   }

//   createPositionedOverlay(element, className) {
//     const overlay = document.createElement('div');
//     overlay.classList.add(className);
    
//     // Ensure overlay covers the entire element regardless of positioning
//     overlay.style.position = 'absolute';
//     overlay.style.top = '0';
//     overlay.style.left = '0';
//     overlay.style.width = '100%';
//     overlay.style.height = '100%';
//     overlay.style.pointerEvents = 'none';
    
//     element.appendChild(overlay);
//     return overlay;
//   }

//   applyPixelation(element, options) {
//     const pixelSize = Math.floor(Math.random() * options.pixelationLevel) + 1;
    
//     // Create pixelation overlay
//     const overlay = this.createPositionedOverlay(element, 'glitch-overlay');
//     overlay.style.backdropFilter = `pixelate(${pixelSize}px)`;
    
//     // Apply random mix-blend-mode
//     const blendModes = ['multiply', 'screen', 'overlay', 'difference', 'exclusion'];
//     overlay.style.mixBlendMode = blendModes[Math.floor(Math.random() * blendModes.length)];
    
//     return () => overlay.remove();
//   }

//   applyDuplication(element, options) {
//     const duplicates = Math.floor(Math.random() * 3) + 1;
//     const cleanupFns = [];
    
//     for (let i = 0; i < duplicates; i++) {
//       const duplicate = this.createPositionedOverlay(element, 'glitch-duplicate');
      
//       // Random offsets centered around the element
//       duplicate.style.transform = `translate(${(Math.random() - 0.5) * options.duplicateOffset * 2}px, ${(Math.random() - 0.5) * options.duplicateOffset * 2}px)`;
//       duplicate.style.zIndex = '-1';
      
//       // Apply vibrant color overlay
//       const color = options.useRainbowColors ? this.generateRainbowColor(i) : this.generateVibrantColor();
//       duplicate.style.backgroundColor = color;
//       duplicate.style.opacity = '0.6'; // Slightly higher opacity for more impact
//       duplicate.style.mixBlendMode = 'screen';
      
//       cleanupFns.push(() => duplicate.remove());
//     }
    
//     return () => cleanupFns.forEach(fn => fn());
//   }

//   applyScanlines(element, options) {
//     const scanlineContainer = this.createPositionedOverlay(element, 'glitch-scanline');
//     scanlineContainer.style.overflow = 'hidden';
    
//     const scanlineCount = Math.floor(Math.random() * 10) + 5;
//     const scanlineHeight = 100 / scanlineCount;
    
//     for (let i = 0; i < scanlineCount; i++) {
//       if (Math.random() > 0.7) continue; // Skip some scanlines randomly
      
//       const scanline = document.createElement('div');
//       scanline.style.position = 'absolute';
//       scanline.style.top = `${i * scanlineHeight}%`;
//       scanline.style.left = '0';
//       scanline.style.width = '100%';
//       scanline.style.height = `${scanlineHeight}%`;
      
//       // Random horizontal offset centered on element
//       const offset = (Math.random() - 0.5) * 20;
//       scanline.style.transform = `translateX(${offset}px)`;
      
//       // Vibrant color and opacity
//       const color = options.useRainbowColors ? this.generateRainbowColor(i) : this.generateVibrantColor();
//       scanline.style.backgroundColor = color;
//       scanline.style.opacity = '0.4'; // Slightly higher opacity
//       scanline.style.mixBlendMode = 'screen';
      
//       scanlineContainer.appendChild(scanline);
//     }
    
//     return () => scanlineContainer.remove();
//   }

//   applyNoise(element, options) {
//     const noiseOverlay = this.createPositionedOverlay(element, 'glitch-noise');
//     noiseOverlay.style.backgroundImage = this.generateNoisePattern(options);
//     noiseOverlay.style.backgroundSize = '100px 100px';
//     noiseOverlay.style.opacity = '0.5'; // Slightly higher opacity for visibility
//     noiseOverlay.style.mixBlendMode = 'overlay';
    
//     return () => noiseOverlay.remove();
//   }
  
//   generateNoisePattern(options) {
//     // Create an SVG data URI with colored noise
//     const svgSize = 100;
//     const pixelSize = 5;
//     let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}">`;
    
//     for (let x = 0; x < svgSize; x += pixelSize) {
//       for (let y = 0; y < svgSize; y += pixelSize) {
//         if (Math.random() > 0.7) {
//           const color = options.useRainbowColors ? 
//             this.generateRainbowColor(x + y) : 
//             this.generateVibrantColor();
          
//           svgContent += `<rect x="${x}" y="${y}" width="${pixelSize}" height="${pixelSize}" fill="${color}" />`;
//         }
//       }
//     }
    
//     svgContent += '</svg>';
//     return `url('data:image/svg+xml;base64,${btoa(svgContent)}')`;
//   }

//   applyFragmentation(element, options) {
//     const fragmentCount = Math.floor(Math.random() * 5) + 2;
//     const fragmentContainer = this.createPositionedOverlay(element, 'glitch-fragment-container');
//     const cleanupFns = [];
    
//     for (let i = 0; i < fragmentCount; i++) {
//       const fragment = document.createElement('div');
//       fragment.classList.add('glitch-fragment');
      
//       // Position and size
//       const height = 100 / fragmentCount;
//       fragment.style.position = 'absolute';
//       fragment.style.top = `${i * height}%`;
//       fragment.style.left = '0';
//       fragment.style.width = '100%';
//       fragment.style.height = `${height}%`;
//       fragment.style.overflow = 'hidden';
//       fragment.style.pointerEvents = 'none';
      
//       // Apply random offset centered on the fragment
//       const xOffset = (Math.random() - 0.5) * 20;
//       fragment.style.transform = `translateX(${xOffset}px)`;
      
//       // Color overlay with vibrant colors
//       if (Math.random() > 0.5) {
//         const color = options.useRainbowColors ? this.generateRainbowColor(i) : this.generateVibrantColor();
//         fragment.style.backgroundColor = color;
//         fragment.style.mixBlendMode = 'screen';
//         fragment.style.opacity = '0.5';
//       }
      
//       fragmentContainer.appendChild(fragment);
//     }
    
//     return () => fragmentContainer.remove();
//   }

//   applyRGBShift(element, options) {
//     const rgbShiftAmount = Math.random() * 10 + 5;
    
//     // Apply RGB shift using filter with more intensity
//     const originalFilter = element.style.filter;
//     element.style.filter = `
//       drop-shadow(${rgbShiftAmount}px 0 0 rgba(255,0,0,0.7))
//       drop-shadow(-${rgbShiftAmount}px 0 0 rgba(0,255,255,0.7))
//     `;
    
//     return () => {
//       element.style.filter = originalFilter;
//     };
//   }

//   applyInvertedDuplicate(element, options) {
//     const invertedDuplicate = this.createPositionedOverlay(element, 'glitch-duplicate');
    
//     // Position with random offset centered on the element
//     invertedDuplicate.style.transform = `translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 10}px)`;
//     invertedDuplicate.style.zIndex = '-1';
    
//     // Apply inverted colors with higher contrast
//     invertedDuplicate.style.filter = 'invert(1) contrast(1.5)';
//     invertedDuplicate.style.mixBlendMode = 'difference';
//     invertedDuplicate.style.opacity = '0.8'; // Higher opacity for more impact
    
//     return () => invertedDuplicate.remove();
//   }

//   applySlices(element, options) {
//     // Save original clip-path to restore later
//     const originalClipPath = element.style.clipPath;
    
//     // Create a dynamic clip path with horizontal or vertical slices
//     const isHorizontal = Math.random() > 0.5;
//     const sliceCount = Math.floor(Math.random() * 5) + 3;
//     const sliceSize = 100 / sliceCount;
//     let clipPathParts = [];
    
//     for (let i = 0; i < sliceCount; i++) {
//       if (Math.random() > 0.3) { // Some slices may be missing
//         if (isHorizontal) {
//           const yStart = i * sliceSize;
//           const yEnd = (i + 1) * sliceSize;
//           // Center the x-offset around 0 to avoid shifting everything to one side
//           const xOffset = (Math.random() - 0.5) * 10;
          
//           clipPathParts.push(`
//             polygon(
//               ${xOffset}% ${yStart}%, 
//               ${100 + xOffset}% ${yStart}%, 
//               ${100 + xOffset}% ${yEnd}%, 
//               ${xOffset}% ${yEnd}%
//             )
//           `);
//         } else {
//           const xStart = i * sliceSize;
//           const xEnd = (i + 1) * sliceSize;
//           // Center the y-offset around 0
//           const yOffset = (Math.random() - 0.5) * 10;
          
//           clipPathParts.push(`
//             polygon(
//               ${xStart}% ${yOffset}%, 
//               ${xEnd}% ${yOffset}%, 
//               ${xEnd}% ${100 + yOffset}%, 
//               ${xStart}% ${100 + yOffset}%
//             )
//           `);
//         }
//       }
//     }
    
//     if (clipPathParts.length > 0) {
//       element.style.clipPath = clipPathParts.join(',');
//     }
    
//     return () => {
//       element.style.clipPath = originalClipPath;
//     };
//   }
// }

// // Generate a vibrant noise pattern with brighter colors
// function generateVibrantNoisePattern() {
//   // Create an SVG data URI with bright colored noise
//   const svgSize = 200;
//   const pixelSize = 2;
//   let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}">`;
  
//   for (let x = 0; x < svgSize; x += pixelSize) {
//     for (let y = 0; y < svgSize; y += pixelSize) {
//       if (Math.random() > 0.7) {
//         const hue = (x + y) % 360;
//         // Increase saturation and lightness for more vibrant colors
//         const color = `hsl(${hue}, 100%, 70%)`;
//         svgContent += `<rect x="${x}" y="${y}" width="${pixelSize}" height="${pixelSize}" fill="${color}" />`;
//       }
//     }
//   }
  
//   svgContent += '</svg>';
//   return `url('data:image/svg+xml;base64,${btoa(svgContent)}')`;
// }

// // Generate random clip-path shapes with better distribution
// function generateRandomShape() {
//   const shapeTypes = [
//     // Triangle
//     () => {
//       const x1 = Math.random() * 100;
//       const y1 = Math.random() * 100;
//       const x2 = Math.random() * 100;
//       const y2 = Math.random() * 100;
//       const x3 = Math.random() * 100;
//       const y3 = Math.random() * 100;
//       return `polygon(${x1}% ${y1}%, ${x2}% ${y2}%, ${x3}% ${y3}%)`;
//     },
//     // Quadrilateral
//     () => {
//       const x1 = Math.random() * 100;
//       const y1 = Math.random() * 100;
//       const x2 = Math.random() * 100;
//       const y2 = Math.random() * 100;
//       const x3 = Math.random() * 100;
//       const y3 = Math.random() * 100;
//       const x4 = Math.random() * 100;
//       const y4 = Math.random() * 100;
//       return `polygon(${x1}% ${y1}%, ${x2}% ${y2}%, ${x3}% ${y3}%, ${x4}% ${y4}%)`;
//     },
//     // Irregular shape
//     () => {
//       let points = '';
//       const pointCount = Math.floor(Math.random() * 5) + 3;
//       for (let i = 0; i < pointCount; i++) {
//         const angle = (i / pointCount) * 2 * Math.PI;
//         const radius = 30 + Math.random() * 20;
//         const x = 50 + radius * Math.cos(angle);
//         const y = 50 + radius * Math.sin(angle);
//         points += `${x}% ${y}% `;
//       }
//       return `polygon(${points})`;
//     },
//     // Random inset
//     () => {
//       const top = Math.random() * 40;
//       const right = Math.random() * 40;
//       const bottom = Math.random() * 40;
//       const left = Math.random() * 40;
//       return `inset(${top}% ${right}% ${bottom}% ${left}%)`;
//     },
//     // Ellipse
//     () => {
//       const rx = 25 + Math.random() * 25;
//       const ry = 25 + Math.random() * 25;
//       const cx = Math.random() * 100;
//       const cy = Math.random() * 100;
//       return `ellipse(${rx}% ${ry}% at ${cx}% ${cy}%)`;
//     }
//   ];
  
//   // Select a random shape type
//   const shapeGenerator = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
//   return shapeGenerator();
// }

// // Function to activate the sentient orb glitch effects
// function activateSentientOrbGlitch() {
//   console.log("Activating sentient orb glitch effect");
  
//   // Find the container to apply glitch effects to
//   const container = document.body;
//   if (!container) {
//     console.error("No container found for glitch effects");
//     return;
//   }
  
//   // Initialize the glitch engine
//   const glitchEngine = new GlitchEngine(container, {
//     interval: 150, // Slightly slower rate for gentler effects
//     squashIntensity: 0.15, // Less intense squashing
//     glitchModes: ['pixelate', 'duplicate', 'scanlines', 'noise', 'shift', 'invert']
//   });
  
//   // Add glitch-element class to important elements in the document
//   // This makes them targets for the glitch effects
//   const elementsToGlitch = [
//     // Start with the stars container
//     document.getElementById('stars'),
//     // Add the sentient orb itself
//     document.querySelector('.sentient-orb'),
//     // Add any other important elements in your page that should glitch
//     // You may need to adjust this based on your HTML structure
//   ].filter(el => el !== null); // Filter out any null elements
  
//   // Add glitch-element class to all elements to be glitched
//   elementsToGlitch.forEach(el => {
//     if (el) {
//       el.classList.add('glitch-element');
//       // Ensure pointer events work
//       el.style.pointerEvents = 'auto';
//     }
//   });
  
//   // Create a glitch text effect
//   createGlitchText();
  
//   // Create chaos fragments that float around
//   createChaosFragments();
  
//   // Add a class to body for global glitch effects via CSS
//   document.body.classList.add('sentient-orb-activated');
  
//   // Start the glitch engine
//   glitchEngine.startGlitching();
  
//   // Set a timeout to stop the effect after a while
//   setTimeout(() => {
//     stopGlitchEffect(glitchEngine);
//   }, 8000); // Stop after 8 seconds
  
//   // Return the glitch engine for potential later use
//   return glitchEngine;
// }

// // Function to create the glitch text that appears
// function createGlitchText() {
//   console.log("Creating glitch text");
  
//   // Check if it already exists and remove it if it does
//   const existingText = document.getElementById('sentient-orb-text');
//   if (existingText) {
//     existingText.parentNode.removeChild(existingText);
//   }
  
//   // Create glitch text
//   const glitchText = document.createElement('div');
//   glitchText.id = 'sentient-orb-text';
  
//   // Choose a random phrase
//   const phrases = [
//     "SYSTEM BREACH",
//     "ACCESS GRANTED",
//     "REALITY GLITCH",
//     "CTRL ALT DELETE",
//     "SYSTEM FAILURE",
//     "REALITY ERROR",
//     "SENTIENT ORB"
//   ];
//   const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  
//   // Create the glitching text element
//   const textElement = document.createElement('span');
//   textElement.className = 'glitch';
//   textElement.setAttribute('data-text', phrase);
//   textElement.textContent = phrase;
  
//   glitchText.appendChild(textElement);
//   document.body.appendChild(glitchText);
  
//   // Ensure the text is centered properly
//   glitchText.style.position = 'fixed';
//   glitchText.style.top = '50%';
//   glitchText.style.left = '50%';
//   glitchText.style.transform = 'translate(-50%, -50%)';
//   glitchText.style.zIndex = '10000';
  
//   // Set a timeout to remove the text
//   setTimeout(() => {
//     if (glitchText && glitchText.parentNode) {
//       glitchText.parentNode.removeChild(glitchText);
//     }
//   }, 7000); // Remove slightly before the main effect ends
// }

// // Function to create floating chaos fragments in the background
// function createChaosFragments() {
//   console.log("Creating chaos fragments");
  
//   // Create a container for all the chaos fragments if it doesn't exist
//   let chaosContainer = document.getElementById('sentient-orb-chaos');
//   if (chaosContainer) {
//     // Remove existing container if it exists
//     chaosContainer.parentNode.removeChild(chaosContainer);
//   }
  
//   chaosContainer = document.createElement('div');
//   chaosContainer.id = 'sentient-orb-chaos';
//   chaosContainer.style.position = 'fixed';
//   chaosContainer.style.top = '0';
//   chaosContainer.style.left = '0';
//   chaosContainer.style.width = '100%';
//   chaosContainer.style.height = '100%';
//   chaosContainer.style.zIndex = '9999';
//   chaosContainer.style.pointerEvents = 'none';
//   chaosContainer.style.overflow = 'hidden';
  
//   document.body.appendChild(chaosContainer);
  
//   // Create several random floating fragments
//   const fragmentCount = 15; // Adjust based on performance needs
  
//   // Pastel colors for the fragments
//   const pastelColors = [
//     'rgba(255,182,193,0.7)', // Pink
//     'rgba(173,216,230,0.7)', // Light blue
//     'rgba(221,160,221,0.7)', // Plum
//     'rgba(152,251,152,0.7)', // Pale green
//     'rgba(255,228,181,0.7)', // Moccasin
//     'rgba(176,224,230,0.7)', // Powder blue
//     'rgba(255,218,185,0.7)', // Peach
//     'rgba(216,191,216,0.7)'  // Thistle
//   ];
  
//   for (let i = 0; i < fragmentCount; i++) {
//     const fragment = document.createElement('div');
//     fragment.className = 'chaos-fragment';
    
//     // Random size
//     const size = 30 + Math.random() * 100;
//     fragment.style.width = `${size}px`;
//     fragment.style.height = `${size}px`;
    
//     // Random position - ensure full coverage of the viewport
//     fragment.style.position = 'absolute';
//     fragment.style.left = `${Math.random() * 100}%`;
//     fragment.style.top = `${Math.random() * 100}%`;
    
//     // Random rotation and scale for variety
//     fragment.style.transform = `rotate(${Math.random() * 360}deg) scale(${0.5 + Math.random()})`;
    
//     // Random shape using clip-path
//     fragment.style.clipPath = generateRandomShape();
    
//     // Random pastel color
//     const colorIndex = Math.floor(Math.random() * pastelColors.length);
//     fragment.style.backgroundColor = pastelColors[colorIndex];
    
//     // Random blend mode for interesting visual effects (using screen for brightness)
//     const blendModes = ['screen', 'overlay', 'hard-light', 'soft-light'];
//     fragment.style.mixBlendMode = blendModes[Math.floor(Math.random() * blendModes.length)];
    
//     // Add to the container
//     chaosContainer.appendChild(fragment);
//   }
  
//   // Set a timeout to remove the chaos container
//   setTimeout(() => {
//     if (chaosContainer && chaosContainer.parentNode) {
//       chaosContainer.parentNode.removeChild(chaosContainer);
//     }
//   }, 7500); // Remove slightly before the main effect ends
// }

// // Function to stop the glitch effect
// function stopGlitchEffect(glitchEngine) {
//   console.log("Stopping glitch effect");
  
//   // Stop the glitch engine
//   if (glitchEngine) {
//     glitchEngine.stopGlitching();
//   }

//   const styleElements = document.head.querySelectorAll('style');
//   styleElements.forEach(style => {
//     if (style.textContent.includes('orbPulse') || 
//         style.textContent.includes('glitch') || 
//         style.textContent.includes('ripple')) {
//       style.remove();
//     }
//   });
  
//   // Remove the activated class from body
//   document.body.classList.remove('sentient-orb-activated');
  
//   // Clean up any remaining elements
//   const glitchText = document.getElementById('sentient-orb-text');
//   if (glitchText) {
//     glitchText.parentNode.removeChild(glitchText);
//   }
  
//   const chaosContainer = document.getElementById('sentient-orb-chaos');
//   if (chaosContainer) {
//     chaosContainer.parentNode.removeChild(chaosContainer);
//   }
  
//   // Reset any elements that had glitch-element class added
//   document.querySelectorAll('.glitch-element').forEach(el => {
//     if (!el.classList.contains('sentient-orb')) {
//       el.classList.remove('glitch-element');
//     }
//   });
  
//   console.log("Glitch effect cleanup complete");
  
//   // Let the world know the sentient orb has gone back to sleep
//   // showMessage("SYSTEM RESTORED");
// }

// // Override GlitchEngine.applyDuplication to use pastel colors
// // Override GlitchEngine.applyDuplication to use pastel colors
// GlitchEngine.prototype.applyDuplication = function(element, options) {
//   const duplicates = Math.floor(Math.random() * 3) + 1;
//   const cleanupFns = [];
  
//   // Pastel colors array
//   const pastelColors = [
//     'rgba(255,182,193,0.7)', // Pink
//     'rgba(173,216,230,0.7)', // Light blue
//     'rgba(221,160,221,0.7)', // Plum
//     'rgba(152,251,152,0.7)', // Pale green
//     'rgba(255,228,181,0.7)', // Moccasin
//     'rgba(176,224,230,0.7)', // Powder blue
//     'rgba(255,218,185,0.7)', // Peach
//     'rgba(216,191,216,0.7)'  // Thistle
//   ];
  
//   for (let i = 0; i < duplicates; i++) {
//     const duplicate = this.createPositionedOverlay(element, 'glitch-duplicate');
    
//     // Random offsets centered around the element (gentler)
//     duplicate.style.transform = `translate(${(Math.random() - 0.5) * options.duplicateOffset}px, ${(Math.random() - 0.5) * options.duplicateOffset}px)`;
//     duplicate.style.zIndex = '-1';
    
//     // Apply pastel color overlay
//     const colorIndex = Math.floor(Math.random() * pastelColors.length);
//     duplicate.style.backgroundColor = pastelColors[colorIndex];
//     duplicate.style.opacity = '0.6'; 
//     duplicate.style.mixBlendMode = 'screen'; // 'screen' for brighter colors
    
//     cleanupFns.push(() => duplicate.remove());
//   }
  
//   return () => cleanupFns.forEach(fn => fn());
// };


// // Helper function to show a temporary message
// function showMessage(message, duration = 3000) {
//   const messageElement = document.createElement('div');
//   messageElement.style.position = 'fixed';
//   messageElement.style.top = '20%';
//   messageElement.style.left = '50%';
//   messageElement.style.transform = 'translate(-50%, -50%)';
//   messageElement.style.padding = '15px 30px';
//   messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
//   messageElement.style.color = '#fff';
//   messageElement.style.fontSize = '24px';
//   messageElement.style.borderRadius = '5px';
//   messageElement.style.zIndex = '999999';
//   messageElement.style.textAlign = 'center';
//   messageElement.textContent = message;
  
//   document.body.appendChild(messageElement);
  
//   setTimeout(() => {
//     if (messageElement.parentNode) {
//       messageElement.parentNode.removeChild(messageElement);
//     }
//   }, duration);
// }

// // Define the global glitchEffectsLoaded flag to prevent multiple loads
// window.glitchEffectsLoaded = true;
// console.log("Sentient orb effects loaded successfully");