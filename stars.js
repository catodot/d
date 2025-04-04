      document.addEventListener("DOMContentLoaded", function () {
        const screen = document.getElementById("stars");
        const numStars = 200;

        // Create stars
        for (let i = 0; i < numStars; i++) {
          createStar(screen);
        }
      });

      function createStar(container) {
            // console.log("stars");
            
        // Check if we're on a mobile device and reduce particles
        const isMobile = window.DeviceUtils ? window.DeviceUtils.isMobile() : false;

      
        const star = document.createElement("div");
        star.className = "star";
      
        // Reduce particle size/complexity on mobile
        const sizeFactor = isMobile ? 0.7 : 1.0;
      
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
      
        // Random size (smaller stars are more common)
        const size = (Math.random() < 0.8 ? Math.random() * 2 + 1 : Math.random() * 3 + 2) * sizeFactor;
      
        // Random animation duration and delay
        const duration = 3 + Math.random() * 7 + "s";
        const delay = Math.random() * 10 + "s";
      
        // Random brightness (some stars are brighter than others)
        const brightness = 0.5 + Math.random() * 0.5;
      
        // Apply styles
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.setProperty("--duration", duration);
        star.style.setProperty("--delay", delay);
        star.style.setProperty("--brightness", brightness);
      
        container.appendChild(star);
      }
      
