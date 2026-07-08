/**
 * ============================================
 * CLICK MICRO-EXPLOSIONS
 * Subtle particle bursts on every click for tactile feedback
 * ============================================
 */

/**
 * Initialize Click Explosions
 * Creates rewarding particle effects at cursor position on every click.
 * Includes long-press support for continuous firing and touch compatibility.
 */
function initClickExplosions() {
  // Check if canvas-confetti is loaded
  if (typeof confetti === 'undefined') {
    console.warn('[Click Explosions] canvas-confetti not loaded. Skipping click effects.');
    return;
  }

  // Premium neon palette (Brand-inspired)
  const colors = [
    '#F15A22', // Neon Orange
    '#40E0D0', // Turquoise
    '#FF6C50', // Coral
    '#B14CFF', // Purple (Brand accent)
    '#FFFFFF'  // White highlight
  ];

  /**
   * Dual-Layered Explosion Logic (Original Premium Design)
   */
  const firePremium = (x, y, isInitial = false) => {
    const common = {
      origin: { x, y },
      colors: colors,
      disableForReducedMotion: true,
      zIndex: 2000,
      shapes: ['circle', 'square'], // Varied texture
    };

    // 1. FLASH CORE (Fast, small, intense)
    confetti({
      ...common,
      particleCount: isInitial ? 20 : 8,
      spread: 80,
      startVelocity: isInitial ? 30 : 20,
      gravity: 1.5,
      scalar: 0.4,
      ticks: 40,
    });

    // 2. SOFT GLOW (Slower, larger, drifting)
    if (isInitial || Math.random() > 0.4) {
      confetti({
        ...common,
        particleCount: isInitial ? 10 : 4,
        spread: 120,
        startVelocity: 10,
        gravity: 0.8,
        scalar: 0.8,
        ticks: 80,
        drift: (Math.random() - 0.5) * 2, // Random slight breeze
      });
    }
  };

  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

  if (isMobile) {
    // On mobile, only fire the full premium burst on completed clicks (taps)
    // This prevents touch-drag scrolling from triggering annoying confetti bursts.
    document.addEventListener('click', (e) => {
      // Skip if click was programmatically triggered without coordinates
      if (e.clientX === 0 && e.clientY === 0) return;

      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;

      firePremium(x, y, true);
    });
    return; // Exit early to avoid setting up heavy touch/mouse loops on mobile
  }
  
  let isPressing = false;
  let lastPos = { x: 0.5, y: 0.5 };
  let lastFireTime = 0;
  const FIRE_RATE = 120; // ms between bursts while holding (Faster = more intense)

  /**
   * Optimized Animation Loop
   * Smoother than setInterval and pauses when tab is inactive automatically
   */
  const loop = (time) => {
    if (isPressing) {
      if (time - lastFireTime > FIRE_RATE) {
        firePremium(lastPos.x, lastPos.y);
        lastFireTime = time;
      }
      requestAnimationFrame(loop);
    }
  };

  let lastTouchTime = 0;

  /**
   * Event Handlers
   */
  const startFiring = (e) => {
    // Prevent mouse events from firing after touch events on mobile
    if (e.type === 'mousedown' && performance.now() - lastTouchTime < 500) return;
    if (e.type === 'touchstart') lastTouchTime = performance.now();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    lastPos.x = clientX / window.innerWidth;
    lastPos.y = clientY / window.innerHeight;

    isPressing = true;

    // Initial big burst
    firePremium(lastPos.x, lastPos.y, true);

    lastFireTime = performance.now();
    requestAnimationFrame(loop);
  };

  const stopFiring = () => {
    isPressing = false;
  };

  const handleMove = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastPos.x = clientX / window.innerWidth;
    lastPos.y = clientY / window.innerHeight;
  };

  // --- Listeners ---
  document.addEventListener('mousedown', startFiring);
  window.addEventListener('mouseup', stopFiring);
  document.addEventListener('mousemove', handleMove);

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) startFiring(e);
  }, { passive: true });

  window.addEventListener('touchend', stopFiring);
  window.addEventListener('touchcancel', stopFiring);
  document.addEventListener('touchmove', handleMove, { passive: true });
}

window.initClickExplosions = initClickExplosions;
