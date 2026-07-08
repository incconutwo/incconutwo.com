/**
 * Main JavaScript Entry Point
 * Handles custom cursor, smooth interactions, and general page logic
 */

// Global DOM Cache to prevent excessive querying
const DOM = {
  cursor: null,
  spotifyLive: null,
  spotifyOffline: null,
  spotifyArt: null,
  spotifyTrack: null,
  spotifyArtist: null,
  spotifyStatusIcon: null,
  fmwWidget: null,
  fmwToggle: null,
  fmwLink: null,
  fmwArt: null,
  fmwTrack: null,
  fmwArtist: null,
  fhrWidget: null,
  fhrToggle: null,
  fhrIcon: null,
  fhrBpm: null,
  fhrMeta: null,
  scrubber: null,
  tiltElements: null,
  socialIcons: null,
  ledgerItems: null,
  privateVault: null
};

// Consolidated Application Bootstrap
class ApplicationBootstrap {
  static init() {
    // 1. Core DOM Caching
    this.cacheDOM();

    // 2. Foundation Setup
    // gsap.registerPlugin(ScrollTrigger); (Done in globals.js)

    // 3. Interactive UI & Effects (Immediate, layout-independent)
    initCustomCursor();
    initClickExplosions();
    initNotificationForm();

    // 4. Staggered Progressive Boot to eliminate Long Tasks (TBT)
    const runBootTasks = (offset = 0) => {
      // Task 1: Start WebGL Background & Smooth Scrolling
      setTimeout(() => {
        if (typeof initBackgroundApp === 'function') {
          initBackgroundApp();
        }
        initSmoothScroll();
      }, 50);

      // Task 2: Core visible hero animations
      setTimeout(() => {
        initBackgroundFade();
        initTextReveal();
        initGlobalTitleAnimations();
      }, offset + 150);

      // Task 3: Secondary page reveals
      setTimeout(() => {
        initAboutMeAnimations();
        initActivitiesAnimations();
      }, offset + 300);

      // Task 4: Remaining elements & ledger triggers
      setTimeout(() => {
        initSocialLedger();
        initInspiration();
      }, offset + 450);

      // Task 5: Interactive controls & footer
      setTimeout(() => {
        initContactSupportAnimations();
        initScrubber();
        initMagneticButtons();
      }, offset + 600);
    };

    // 6. Finalize Initial Load State & Staggered Animations
    if (window.appInitializedBefore) {
      document.body.classList.add('loaded');
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.style.display = 'none';
      }
      initHackerScramble();
      runBootTasks(0);
    } else {
      window.appInitializedBefore = true;
      const handleInitialLoad = () => {
        runBootTasks(800); // Shift staggered animations by 800ms to align with curtain rise
        setTimeout(() => {
          document.body.classList.add('loaded');
          initHackerScramble();
        }, 800);
      };

      if (document.readyState === 'complete') {
        handleInitialLoad();
      } else {
        window.addEventListener('load', handleInitialLoad);
      }
    }

    // 7. Defer Network/API Heavy Lifting until assets finish loading
    const runDeferredTasks = () => {
      setTimeout(() => {
        initSpotifyWidget();
        initHeartRateWidget();
      }, 2000);
    };

    if (document.readyState === 'complete') {
      // Shorter timeout on page navigation since page is already loaded
      setTimeout(runDeferredTasks, 200);
    } else {
      window.addEventListener('load', runDeferredTasks);
    }
  }

  static cacheDOM() {
    DOM.cursor = document.getElementById('custom-cursor');
    DOM.spotifyLive = document.getElementById('spotify-live');
    DOM.spotifyOffline = document.getElementById('spotify-offline');
    DOM.spotifyArt = document.getElementById('spotify-art');
    DOM.spotifyTrack = document.getElementById('spotify-track');
    DOM.spotifyArtist = document.getElementById('spotify-artist');
    DOM.spotifyStatusIcon = document.querySelector('.spotify-status-text');
    DOM.fmwWidget = document.getElementById('fmw-widget');
    DOM.fmwToggle = document.getElementById('fmw-toggle');
    DOM.fmwLink = document.getElementById('fmw-link');
    DOM.fmwArt = document.getElementById('fmw-art');
    DOM.fmwTrack = document.getElementById('fmw-track');
    DOM.fmwArtist = document.getElementById('fmw-artist');
    DOM.fhrWidget = document.getElementById('fhr-widget');
    DOM.fhrToggle = document.getElementById('fhr-toggle');
    DOM.fhrIcon = document.getElementById('fhr-icon');
    DOM.fhrBpm = document.getElementById('fhr-bpm');
    DOM.fhrMeta = document.getElementById('fhr-meta');
    DOM.scrubber = document.getElementById('pageScrubber');
    DOM.tiltElements = document.querySelectorAll('[data-tilt]');
    DOM.socialIcons = document.querySelectorAll('.social-icon');
    DOM.ledgerItems = document.querySelectorAll('.ledger-item');
    DOM.privateVault = document.getElementById('private-trigger');
  }
}

// Single Entry Point
const startApp = () => {
  if (document.body.dataset.appInitialized) return;
  document.body.dataset.appInitialized = 'true';
  ApplicationBootstrap.init();
};

document.addEventListener('DOMContentLoaded', startApp);
document.addEventListener('astro:page-load', startApp);

if (document.readyState !== 'loading') {
  startApp();
}

/**
 * Shared Poller Utility for Widgets
 * Handles visibility-aware polling to save resources
 */
class WidgetPoller {
  constructor(updateFn, intervalMs) {
    this.updateFn = updateFn;
    this.intervalMs = intervalMs;
    this.pollInterval = null;
    this.handleVisibility = this.handleVisibility.bind(this);
  }

  start() {
    this.updateFn();
    this.pollInterval = setInterval(this.updateFn, this.intervalMs);
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  stop() {
    clearInterval(this.pollInterval);
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }

  handleVisibility() {
    if (document.hidden) {
      clearInterval(this.pollInterval);
    } else {
      this.updateFn();
      this.pollInterval = setInterval(this.updateFn, this.intervalMs);
    }
  }
}

/**
 * Initialize Lenis Smooth Scrolling
 * "Future-proof" smooth scrolling that integrates with GSAP
 */
function initSmoothScroll() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 1.5,
  });

  // Expose to window for scrubber access
  window.lenis = lenis;

  // Integrate with GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

/**
 * Custom Cursor Logic
 * Performance optimized with requestAnimationFrame
 */
function initCustomCursor() {
  const cursor = DOM.cursor;
  if (!cursor || 'ontouchstart' in window || navigator.maxTouchPoints > 0) {
    if (cursor) cursor.style.display = 'none';
    return;
  }

  document.body.classList.add('custom-cursor-active');

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let isAnimating = false;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isAnimating) {
      isAnimating = true;
      animateCursor();
    }
  });

  function animateCursor() {
    // Smooth interpolation
    const distX = mouseX - cursorX;
    const distY = mouseY - cursorY;

    // Optimization: Stop the RAF loop when the cursor catches up to the mouse
    if (Math.abs(distX) < 0.1 && Math.abs(distY) < 0.1) {
      isAnimating = false;
      cursorX = mouseX;
      cursorY = mouseY;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      cursor.style.transform = `translate(-50%, -50%) scale(1)`;
      return;
    }

    cursorX += distX * 0.15;
    cursorY += distY * 0.15;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    // Velocity-based scaling (stretch effect)
    const vel = Math.sqrt(distX * distX + distY * distY);
    const scale = 1 + Math.min(vel / 500, 0.5); // Max scale 1.5x

    cursor.style.transform = `translate(-50%, -50%) scale(${scale})`;

    requestAnimationFrame(animateCursor);
  }

  // Event delegation for hover effects (handles dynamic elements like Spotify widget)
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .social-icon, .profile-effect-container, .project-card, .project-btn')) {
      cursor.classList.add('hovering');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .social-icon, .profile-effect-container, .project-card, .project-btn')) {
      cursor.classList.remove('hovering');
    }
  });
}

/**
 * Background Fade Logic
 * Fades out WebGL background when scrolling past hero
 */
function initBackgroundFade() {
  const background = document.getElementById('webgl-background');
  const secondPage = document.getElementById('second-page');

  if (!background || !secondPage) return;

  const callback = (entries) => {
    entries.forEach(entry => {
      // Fade out if we are at or below the second page
      if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
        background.classList.add('fade-out');
      } else {
        background.classList.remove('fade-out');
      }
    });
  };

  const observer = new IntersectionObserver(callback, {
    rootMargin: '100px 0px 0px 0px', // Start fade early
    threshold: 0.1
  });

  observer.observe(secondPage);
}

/**
 * Masked Text Reveal Animation (GSAP)
 * Snappy, staggered reveal for hero headline
 */
function initTextReveal() {
  const items = document.querySelectorAll('.reveal-item');
  if (items.length === 0) return;

  gsap.to(items, {
    scrollTrigger: {
      trigger: ".hero-headline",
      start: "top 90%",
      toggleActions: "play none none reverse"
    },
    y: "0%",
    duration: 1.4,
    ease: "expo.out",
    stagger: 0.15
  });
}

/**
 * Global Cinematic Title Animations
 * Reusable animation for all major section headers
 */
function initGlobalTitleAnimations() {
  const titles = document.querySelectorAll('.cinematic-title');

  titles.forEach(title => {
    const accent = title.querySelector('.text-accent');

    // Vertical reveal for main title
    gsap.to(title, {
      scrollTrigger: {
        trigger: title,
        start: "top 85%",
        toggleActions: "play none none reverse"
      },
      y: 0,
      opacity: 1,
      duration: 1.5,
      ease: "power4.out"
    });

    // Horizontal slide for accent text
    if (accent) {
      gsap.to(accent, {
        scrollTrigger: {
          trigger: title,
          start: "top 85%",
          toggleActions: "play none none reverse"
        },
        x: 0,
        opacity: 1,
        duration: 1.5,
        delay: 0.2,
        ease: "power4.out"
      });
    }
  });
}

/**
 * Cinematic About Me Animations
 * Standard fade-up for info cards
 */
function initAboutMeAnimations() {
  const cards = document.querySelectorAll("#second-page .story-card");

  cards.forEach((card, i) => {
    gsap.fromTo(card,
      { y: 60, opacity: 0, scale: 0.95 },
      {
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          end: "bottom 10%",
          toggleActions: "play reverse play reverse"
        },
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "power3.out",
        delay: i * 0.1
      }
    );
  });

  // Tech Arsenal Reveal
  gsap.fromTo(".tech-arsenal",
    { scale: 0.9, opacity: 0 },
    {
      scrollTrigger: {
        trigger: ".tech-arsenal",
        start: "top 85%",
        toggleActions: "play reverse play reverse"
      },
      scale: 1,
      opacity: 1,
      duration: 1.2,
      ease: "expo.out"
    }
  );

  // Projects Header Reveal ONLY (Grid animation moved to projects.js)
  gsap.fromTo(".projects-header",
    { y: 50, opacity: 0 },
    {
      scrollTrigger: {
        trigger: ".projects-section",
        start: "top 75%",
        toggleActions: "play reverse play reverse"
      },
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out"
    }
  );
}

/**
 * UPDATED: Activities Page Animations
 * Uses ScrollTrigger.batch for a snappy, satisfying "Pop" effect
 * that works perfectly when scrolling up or down.
 */
function initActivitiesAnimations() {
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

  // 1. The Cards "Pop" Effect
  // Batch allows elements to animate in groups as they enter the viewport
  ScrollTrigger.batch(".activity-chip", {
    start: "top 90%",
    end: "bottom 10%",
    once: isMobile,
    onEnter: batch => gsap.to(batch, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotationX: 0,
      stagger: 0.05,
      duration: 0.8,
      ease: isMobile ? "power2.out" : "elastic.out(1, 0.75)", // Smooth fade-up on mobile, bouncy pop on desktop
      overwrite: true
    }),
    onLeave: batch => {
      if (isMobile) return;
      gsap.to(batch, {
        opacity: 0,
        y: -50, // Exit UP when scrolling down past them
        scale: 0.9,
        duration: 0.5,
        ease: "power2.in",
        overwrite: true
      });
    },
    onEnterBack: batch => {
      if (isMobile) return;
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotationX: 0,
        stagger: 0.05,
        duration: 0.8,
        ease: "elastic.out(1, 0.75)",
        overwrite: true
      });
    },
    onLeaveBack: batch => {
      if (isMobile) return;
      gsap.to(batch, {
        opacity: 0,
        y: 50, // Exit DOWN when scrolling up past them
        scale: 0.9,
        duration: 0.5,
        ease: "power2.in",
        overwrite: true
      });
    }
  });

  // Set initial state for batching
  gsap.set(".activity-chip", {
    y: isMobile ? 20 : 50,
    opacity: 0,
    scale: isMobile ? 0.95 : 0.8,
    rotationX: isMobile ? 0 : 15,
    transformPerspective: 1000
  });

  // 2. Hobby Block (Simple fade)
  gsap.fromTo(".hobby-block",
    { y: 40, opacity: 0 },
    {
      scrollTrigger: {
        trigger: ".hobby-block",
        start: "top 90%",
        toggleActions: "play reverse play reverse"
      },
      y: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out"
    }
  );

  init3DTilt(); // Keep existing tilt logic
}

/**
 * NEW: Magnetic Buttons
 * Makes buttons physically stick to the cursor slightly
 */
function initMagneticButtons() {
  const magnets = document.querySelectorAll('.project-btn, .back-link, .social-icon');

  if (window.matchMedia("(pointer: coarse)").matches) return; // Disable on touch

  magnets.forEach(btn => {
    let rect = null;

    btn.addEventListener('mouseenter', () => {
      rect = btn.getBoundingClientRect();
    });

    btn.addEventListener('mousemove', (e) => {
      if (!rect) rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Move button towards mouse (Magnetic effect)
      gsap.to(btn, {
        x: x * 0.3, // Strength
        y: y * 0.3,
        duration: 0.3,
        ease: "power2.out"
      });

      // Move child svg/text slightly more for depth
      gsap.to(btn.children, {
        x: x * 0.1,
        y: y * 0.1,
        duration: 0.3,
        ease: "power2.out"
      });
    });

    btn.addEventListener('mouseleave', () => {
      rect = null;
      // Snap back
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.4)"
      });
      gsap.to(btn.children, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1, 0.4)"
      });
    });
  });
}

/**
 * Spotify Widget Logic
 * Polls the backend for current track info
 * Optimized: Pauses polling when tab is inactive to save resources
 */
function initSpotifyWidget() {
  const offlineState = DOM.spotifyOffline;
  const liveState = DOM.spotifyLive;

  // Elements to update
  const elArt = DOM.spotifyArt;
  const elTrack = DOM.spotifyTrack;
  const elArtist = DOM.spotifyArtist;
  const elStatusIcon = DOM.spotifyStatusIcon;

  // Floating widget toggle listener
  if (DOM.fmwToggle && DOM.fmwWidget) {
    DOM.fmwToggle.addEventListener('click', () => {
      DOM.fmwWidget.classList.toggle('retracted');
    });
  }

  let pollInterval;

  async function updateWidget() {
    if (document.hidden) return;

    try {
      const response = await fetch(window.location.origin + '/api/spotify/now-playing');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Log for debugging
      if (data.error) {
        console.warn('🎵 Music Widget:', data.error);
      }

      if (data.track && data.isPlaying) {
        // --- HAS TRACK DATA AND ACTIVELY PLAYING ---
        if (offlineState) offlineState.style.display = 'none';

        if (liveState) {
          liveState.style.display = 'flex';
          // Fix: Prevent synchronous layout reflow
          requestAnimationFrame(() => {
            liveState.classList.add('active');
          });
          liveState.href = data.spotifyUrl;
        }

        if (elArt && data.albumArt) elArt.src = data.albumArt;
        if (elTrack) elTrack.textContent = data.track;
        if (elArtist) elArtist.textContent = data.artist;

        if (elStatusIcon) {
          elStatusIcon.textContent = 'Now Playing';
        }

        // Update floating widget
        if (DOM.fmwWidget) {
          DOM.fmwWidget.classList.add('visible');
          if (DOM.fmwLink) DOM.fmwLink.href = data.spotifyUrl;
          if (DOM.fmwArt && data.albumArt) DOM.fmwArt.src = data.albumArt;
          if (DOM.fmwTrack) DOM.fmwTrack.textContent = data.track;
          if (DOM.fmwArtist) DOM.fmwArtist.textContent = data.artist;
        }

      } else {
        // --- OFFLINE OR NOT PLAYING ---
        if (liveState) {
          liveState.classList.remove('active');
          liveState.style.display = 'none';
        }

        if (offlineState) offlineState.style.display = 'flex';

        if (elStatusIcon) {
          elStatusIcon.textContent = 'No Music is Playing';
        }

        if (DOM.fmwWidget) {
          DOM.fmwWidget.classList.remove('visible');
        }
      }

    } catch (error) {
      console.warn('🎵 Music Widget Error:', error.message || error);
      if (liveState) liveState.style.display = 'none';
      if (offlineState) offlineState.style.display = 'flex';
    }
  }

  const poller = new WidgetPoller(updateWidget, 15000);
  poller.start();
}

/**
 * Heart Rate Widget Logic
 * Polls the Cloudflare Workers API for live heart rate
 * Only displays the widget if actively updated (within 5 minutes)
 */
function initHeartRateWidget() {
  const widgetEl = DOM.fhrWidget;
  const toggleEl = DOM.fhrToggle;
  const iconEl = DOM.fhrIcon;
  const bpmEl = DOM.fhrBpm;
  const metaEl = DOM.fhrMeta;

  if (toggleEl && widgetEl) {
    toggleEl.addEventListener('click', () => {
      widgetEl.classList.toggle('retracted');
    });
  }

  let pollInterval;

  async function updateWidget() {
    if (document.hidden) return;

    const API_URL = "https://hr-dashboard.tnemoroccan.workers.dev/api/hr";
    const REQUEST_TIMEOUT_MS = 3000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(API_URL, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.hr > 0) {
        const now = Date.now();
        const recordTime = data.ts > 9999999999 ? data.ts : data.ts * 1000;
        const diffSeconds = Math.floor((now - recordTime) / 1000);

        // Actively updated: within 5 minutes (300 seconds) (Temporarily 10000 for testing)
        if (diffSeconds <= 10000) {
          if (widgetEl) widgetEl.classList.add('visible');
          if (bpmEl) bpmEl.textContent = data.hr;

          let timeString = `${diffSeconds}s ago`;
          if (diffSeconds > 60) timeString = `${Math.floor(diffSeconds / 60)}m ${diffSeconds % 60}s ago`;
          if (diffSeconds < 5) timeString = "Just now";

          if (metaEl) metaEl.textContent = `Updated: ${timeString}`;

          // Micro-animation: adjust heartbeat animation speed based on BPM
          if (iconEl) {
            iconEl.classList.add('pulse');
            iconEl.style.animationDuration = `${60 / data.hr}s`;
          }
        } else {
          // Stale data (> 5 mins) -> hide widget
          if (widgetEl) widgetEl.classList.remove('visible');
          if (iconEl) iconEl.classList.remove('pulse');
        }
      } else {
        // Invalid HR data
        if (widgetEl) widgetEl.classList.remove('visible');
        if (iconEl) iconEl.classList.remove('pulse');
      }
    } catch (error) {
      console.warn("❤️ Heart Rate Widget Fetch failed:", error.message || error);
      if (widgetEl) widgetEl.classList.remove('visible');
      if (iconEl) iconEl.classList.remove('pulse');
    }
  }

  const poller = new WidgetPoller(updateWidget, 5000);
  poller.start();
}

/**
 * Scrubber Initialization
 * Initializes the class-based scrubber component
 */
function initScrubber() {
  const el = DOM.scrubber;
  if (el && typeof ScrubberController !== 'undefined') {
    new ScrubberController(el);
  }
}

/**
 * 3D Tilt Effect for premium interactivity
 * Applies a subtle 3D transform on mousemove
 */
function init3DTilt() {
  if ('ontouchstart' in window) return; // Skip on touch

  const tiltElements = DOM.tiltElements;

  tiltElements.forEach(el => {
    let rect = null;

    el.addEventListener('mouseenter', () => {
      rect = el.getBoundingClientRect();
    });

    el.addEventListener('mousemove', (e) => {
      if (!rect) rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const multiplier = 10; // Tilt intensity

      const xRotate = (multiplier * ((y - rect.height / 2) / rect.height));
      const yRotate = -(multiplier * ((x - rect.width / 2) / rect.width));

      gsap.to(el, {
        rotationX: xRotate,
        rotationY: yRotate,
        scale: 1.05, // Subtle lift
        duration: 0.4,
        ease: "power2.out"
      });
    });

    el.addEventListener('mouseleave', () => {
      rect = null;
      gsap.to(el, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)" // Catchy bounce back
      });
    });
  });
}

/**
 * Handles the Connect Section Interactions
 */
function initSocialLedger() {
  const items = DOM.ledgerItems;
  const vault = DOM.privateVault;

  // Request DeviceOrientation permission on iOS
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    const requestPermission = () => {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.removeEventListener('click', requestPermission);
            window.removeEventListener('touchstart', requestPermission);
          }
        })
        .catch(console.error);
    };
    window.addEventListener('click', requestPermission, { once: true });
    window.addEventListener('touchstart', requestPermission, { once: true });
  }

  // Entrance Animation (ScrollTrigger)
  gsap.from(".ledger-item", {
    scrollTrigger: {
      trigger: ".social-ledger",
      start: "top 85%",
      toggleActions: "play none none reverse"
    },
    borderBottomColor: "rgba(255,255,255,0)",
    x: -50,
    opacity: 0,
    stagger: 0.1,
    duration: 1,
    ease: "power3.out"
  });

  // 1. Social Ledger Interaction Logic
  items.forEach(item => {
    const name = item.querySelector('.ledger-name');
    const status = item.querySelector('.ledger-status');
    const color = item.getAttribute('data-color');
    const bg = item.querySelector('.ledger-bg');
    let rect = null;

    const activate = () => {
      rect = item.getBoundingClientRect();
      item.classList.add('active');
      gsap.to(item, { color: color, duration: 0.3 });
      gsap.to(bg, { color: color, duration: 0 });
    };

    const deactivate = () => {
      rect = null;
      item.classList.remove('active');
      gsap.to(item, { color: '#ffffff', duration: 0.3 });

      // Snap back with bounce
      gsap.to([name, status], {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)"
      });
    };

    // Pre-calculate GSAP quickTo setters for massive performance boost
    const xNameTo = gsap.quickTo(name, "x", { duration: 0.5, ease: "power3.out" });
    const yNameTo = gsap.quickTo(name, "y", { duration: 0.5, ease: "power3.out" });
    const xStatusTo = gsap.quickTo(status, "x", { duration: 0.5, ease: "power3.out" });
    const yStatusTo = gsap.quickTo(status, "y", { duration: 0.5, ease: "power3.out" });

    // Magnetic Move on MouseMove
    item.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= 768) return; // Skip on mobile for perf

      if (!rect) rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xCent = x - (rect.width / 2);
      const yCent = y - (rect.height / 2);

      xNameTo(xCent * 0.1);
      yNameTo(yCent * 0.2);
      xStatusTo(xCent * 0.05);
      yStatusTo(yCent * 0.1);
    });

    item.addEventListener('mouseenter', activate);
    item.addEventListener('mouseleave', deactivate);

    // 2. Mobile-Only Scroll Selection
    if (window.innerWidth <= 768) {
      ScrollTrigger.create({
        trigger: item,
        start: "top center",
        end: "bottom center",
        onEnter: activate,
        onEnterBack: activate,
        onLeave: deactivate,
        onLeaveBack: deactivate
      });
    }

    // 3. Mobile Gyroscope Move (Only for highlighted active item)
    const handleOrientation = (e) => {
      if (window.innerWidth > 991 && window.innerWidth > 768) return; // Keep inline with mobile breakpoint check
      if (!item.classList.contains('active')) return;

      // e.gamma is left/right roll, e.beta is front/back pitch
      let tiltX = e.gamma;
      let tiltY = e.beta;

      // Validate sensor values are present
      if (tiltX === null || tiltY === null || typeof tiltX === 'undefined' || typeof tiltY === 'undefined') {
        return;
      }

      // Calibrate tilt relative to standard viewing tilt (around 45 degrees upright)
      tiltY = tiltY - 45;

      // Clamp values to [-15, 15] for subtle displacement
      tiltX = Math.max(-15, Math.min(15, tiltX));
      tiltY = Math.max(-15, Math.min(15, tiltY));

      // Apply displacement (multipliers match PC scale/feel)
      xNameTo(tiltX * 0.8);
      yNameTo(tiltY * 1.2);
      xStatusTo(tiltX * 0.4);
      yStatusTo(tiltY * 0.6);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientationabsolute', handleOrientation);
  });

  // 3. Private Vault Security Scan Logic
  if (vault) {
    const originalTextSpan = vault.querySelector('.vault-text-original');
    const glitchTextSpan = vault.querySelector('.vault-text-glitch');
    const originalText = originalTextSpan.innerText;
    const targetText = "ACCESS DENIED";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*";
    let interval = null;

    const scrambleText = (target, text) => {
      let iteration = 0;
      clearInterval(interval);

      interval = setInterval(() => {
        target.innerText = text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3;
      }, 30);
    };

    // Scramble original text on entrance
    vault.addEventListener('mouseenter', () => {
      scrambleText(originalTextSpan, originalText);
      // Scramble glitch text so it's ready/active
      scrambleText(glitchTextSpan, targetText);
    });

    vault.addEventListener('click', () => {
      // Re-trigger scramble for punch
      scrambleText(glitchTextSpan, targetText);

      vault.style.animation = 'none';
      vault.offsetHeight; // trigger reflow
      vault.style.animation = null;
    });
  }
}

/**
 * Inspiration Section Animation
 */
function initInspiration() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".inspiration-section",
      start: "top 80%", // Starts when section enters view
      end: "bottom bottom",
      toggleActions: "play none none reverse"
    }
  });

  // 1. Reveal Label
  tl.from(".inspiration-label", {
    y: 20,
    opacity: 0,
    duration: 0.6,
    ease: "power2.out"
  });

  // 2. Reveal Classic Quote (Blur In)
  tl.from(".classic-quote .quote-text", {
    filter: "blur(10px)",
    opacity: 0,
    y: 30,
    duration: 1,
    ease: "power3.out"
  }, "-=0.4");

  // 3. Draw the connector line (Fill downwards)
  tl.to(".connector-line", {
    height: "100%",
    duration: 1.2,
    ease: "power2.inOut"
  }, "-=0.5");

  tl.to(".connector-node", {
    scale: 1,
    duration: 0.4,
    ease: "back.out(1.7)"
  }, "-=0.2");

  // 4. Reveal Personal Tag
  tl.to(".personal-tag", {
    y: 0,
    opacity: 1,
    duration: 0.5
  });

  // 5. Reveal Personal Quote (Masked Slide Up - Butter Smooth)
  tl.to(".personal-quote .quote-text", {
    y: "0%",
    duration: 1.5,
    ease: "power3.out"
  }, "-=0.3");
}

/**
 * Contact & Support Section Animations (GSAP)
 * Snappy fade-up for cards
 */
function initContactSupportAnimations() {
  const cards = document.querySelectorAll('.contact-support-section .glass-card');
  if (cards.length === 0) return;

  cards.forEach((card, i) => {
    gsap.fromTo(card,
      { y: 50, opacity: 0, scale: 0.95 },
      {
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          toggleActions: "play none none reverse"
        },
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "power3.out",
        delay: i * 0.15
      }
    );
  });
}

/**
 * Handle inline notification form for Support section
 */
function initNotificationForm() {
  const container = document.getElementById('notification-form-container');
  const textarea = document.getElementById('notification-msg');
  const sendBtn = document.getElementById('notify-send-btn');
  const status = document.getElementById('notify-status-text');

  if (!container || !textarea || !sendBtn || !status) return;

  sendBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const msg = textarea.value.trim();
    if (!msg) {
      status.className = 'notify-status error';
      status.textContent = 'Please enter a message.';
      return;
    }

    sendBtn.disabled = true;
    status.className = 'notify-status info';
    status.textContent = 'Sending...';

    try {
      const response = await fetch(window.location.origin + '/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: msg })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        status.className = 'notify-status success';
        status.textContent = 'Notification sent successfully! ❤️';
        textarea.value = '';
        setTimeout(() => {
          status.className = 'notify-status';
          status.textContent = '';
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (err) {
      status.className = 'notify-status error';
      status.textContent = err.message || 'Error sending notification.';
    } finally {
      sendBtn.disabled = false;
    }
  });
}

/**
 * ============================================
 * TEXT SCRAMBLE CLASS (Hacker Decode Effect)
 * ============================================
 */
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const length = newText.length;
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];

    // speed settings
    const stagger = 6;
    const duration = 16; // duration of scrambling for each char

    for (let i = 0; i < length; i++) {
      const to = newText[i] || '';
      const start = i * stagger;
      const end = start + duration;
      this.queue.push({ to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { to, start, end, char } = this.queue[i];

      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        // Not started yet - show underscore
        output += '_';
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
  setPlaceholder(text) {
    this.el.innerHTML = '_'.repeat(text.length);
  }
}

/**
 * Initializes the Hacker Text Scramble Effect with Re-triggering
 */
function initHackerScramble() {
  const el1 = document.querySelector('#scramble-1');
  const el2 = document.querySelector('#scramble-2');

  if (!el1 || !el2) return;

  const fx1 = new TextScramble(el1);
  const fx2 = new TextScramble(el2);

  // Set initial state to underscores
  fx1.setPlaceholder('I am');
  fx2.setPlaceholder('incconu_two');

  ScrollTrigger.create({
    trigger: ".hero-headline",
    start: "top 95%",
    onEnter: () => {
      fx1.setText('I am').then(() => fx2.setText('incconu_two'));
    },
    onEnterBack: () => {
      fx1.setPlaceholder('I am');
      fx2.setPlaceholder('incconu_two');
      fx1.setText('I am').then(() => fx2.setText('incconu_two'));
    }
  });
}