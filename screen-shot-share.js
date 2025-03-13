/**
 * Simple function to initialize sharing functionality (without auto-restart)
 */
function initializeSocialSharing() {
    console.log("Setting up social sharing functionality");
    
    // Get references to buttons
    const downloadBtn = document.getElementById('download-screenshot');
    const twitterBtn = document.getElementById('share-twitter');
    const facebookBtn = document.getElementById('share-facebook');
    const blueskyBtn = document.getElementById('share-bluesky');
    const mastodonBtn = document.getElementById('share-mastodon');
    const shareBtn = document.getElementById('share-button');
    
    // Add native share button if supported
    if (navigator.share && !document.querySelector('.native-share-button')) {
      const buttonsRow = document.querySelector('.social-buttons-row');
      if (buttonsRow) {
        const nativeShareBtn = document.createElement('button');
        nativeShareBtn.className = 'social-button native-share-button';
        nativeShareBtn.setAttribute('aria-label', 'Share');
        nativeShareBtn.textContent = '↑';
        buttonsRow.insertBefore(nativeShareBtn, buttonsRow.firstChild);
        
        // Set up native share handler
        nativeShareBtn.addEventListener('click', () => shareContent('native'));
      }
    }
    
    // Set up button click handlers
    if (downloadBtn) downloadBtn.addEventListener('click', () => captureAndDownload());
    if (twitterBtn) twitterBtn.addEventListener('click', () => shareContent('twitter'));
    if (facebookBtn) facebookBtn.addEventListener('click', () => shareContent('facebook'));
    if (blueskyBtn) blueskyBtn.addEventListener('click', () => shareContent('bluesky'));
    if (mastodonBtn) mastodonBtn.addEventListener('click', () => shareContent('mastodon'));
    if (shareBtn) shareBtn.addEventListener('click', () => shareContent(navigator.share ? 'native' : 'twitter'));
    
    // Helper function to get share text
    function getShareText() {
      const score = document.getElementById('final-score')?.textContent || '0';
      const blocksText = document.getElementById('blocks-stat')?.textContent || '0 attacks';
      const timeText = document.getElementById('time-stat')?.textContent || '0 months';
      
      return `I scored ${score} points in Presidential Grab! Blocked ${blocksText} and survived for ${timeText}. Join the resistance!`;
    }
    
    // Function to capture screenshot and download
    function captureAndDownload() {
      const gameOverScreen = document.getElementById('game-over-screen');
      if (!gameOverScreen) return;
      
      // Use html2canvas to capture the screen
      html2canvas(gameOverScreen).then(canvas => {
        // Get the score for filename
        const score = document.getElementById('final-score')?.textContent || '0';
        
        // Create download link
        const link = document.createElement('a');
        link.download = `presidential-grab-score-${score}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        // Copy share text to clipboard
        const shareText = getShareText();
        navigator.clipboard.writeText(shareText)
          .then(() => {
            // Show visual feedback
            if (downloadBtn) {
              downloadBtn.textContent = '✓';
              setTimeout(() => {
                downloadBtn.textContent = '↓';
              }, 2000);
            }
          })
          .catch(err => console.log('Could not copy text:', err));
      }).catch(err => {
        console.error('Screenshot capture failed:', err);
      });
    }
    
    // Function to share content
    function shareContent(platform) {
      const shareText = getShareText();
      const shareUrl = window.location.href;
      
      switch(platform) {
        case 'native':
          if (navigator.share) {
            navigator.share({
              title: 'Presidential Grab Game',
              text: shareText,
              url: shareUrl
            }).catch(err => console.log('Share failed:', err));
          }
          break;
          
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
          
        case 'facebook':
          window.open(`https://www.facebook.com/dialog/feed?app_id=452384931538596&link=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}&display=popup&redirect_uri=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
          
        case 'bluesky':
          window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`, '_blank');
          break;
          
        case 'mastodon':
          window.open(`https://mastodon.social/share?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
      }
    }
  }
  
  // Call this function at the end of your endGame function
  function initializeShareButtonsOnGameOver() {
    // Short timeout to ensure all game-over elements are fully rendered
    setTimeout(initializeSocialSharing, 100);
  }