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
    initSmoothScroll();
    gsap.registerPlugin(ScrollTrigger);

    // 3. Interactive UI & Effects
    initCustomCursor();
    initSocialIconHovers();
    initClickExplosions();
    initMagneticButtons();

    // 4. Core Visuals
    initBackgroundFade();
    initTextReveal();
    initGlobalTitleAnimations();

    // 5. Section Specifics
    initAboutMeAnimations();
    initActivitiesAnimations();
    initSocialLedger();
    initInspiration();
    initContactSupportAnimations();
    initNotificationForm();
    initScrubber();

    // 6. Finalize Initial Load State
    setTimeout(() => {
      document.body.classList.add('loaded'); 
      initHackerScramble();
    }, 800);

    // 7. Defer Network/API Heavy Lifting until assets finish loading
    window.addEventListener('load', () => {
      setTimeout(() => {
        initSpotifyWidget();
      }, 2000); 
    });
  }

  static cacheDOM() {
    DOM.cursor = document.getElementById('custom-cursor');
    DOM.spotifyLive = document.getElementById('spotify-live');
    DOM.spotifyOffline = document.getElementById('spotify-offline');
    DOM.spotifyArt = document.getElementById('spotify-art');
    DOM.spotifyTrack = document.getElementById('spotify-track');
    DOM.spotifyArtist = document.getElementById('spotify-artist');
    DOM.spotifyStatusIcon = document.querySelector('.spotify-status-text');
    DOM.scrubber = document.getElementById('pageScrubber');
    DOM.tiltElements = document.querySelectorAll('[data-tilt]');
    DOM.socialIcons = document.querySelectorAll('.social-icon');
    DOM.ledgerItems = document.querySelectorAll('.ledger-item');
    DOM.privateVault = document.getElementById('private-trigger');
  }
}

// Single Entry Point
document.addEventListener('DOMContentLoaded', () => {
  ApplicationBootstrap.init();
});

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
  if (!cursor || ('ontouchstart' in window)) return; // Disable on touch devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    cursor.style.display = 'none';
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
 * Social Icon Hover Sound/Haptic (optional enhancement)
 */
function initSocialIconHovers() {
  const icons = DOM.socialIcons;
  
  icons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      // Could add subtle haptic feedback or sound here
    });
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
  // 1. The Cards "Pop" Effect
  // Batch allows elements to animate in groups as they enter the viewport
  ScrollTrigger.batch(".activity-chip", {
    start: "top 90%",
    end: "bottom 10%",
    onEnter: batch => gsap.to(batch, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotationX: 0,
      stagger: 0.05,
      duration: 0.8,
      ease: "elastic.out(1, 0.75)", // Bouncy entrance
      overwrite: true
    }),
    onLeave: batch => gsap.to(batch, {
      opacity: 0,
      y: -50, // Exit UP when scrolling down past them
      scale: 0.9,
      duration: 0.5,
      ease: "power2.in",
      overwrite: true
    }),
    onEnterBack: batch => gsap.to(batch, {
      opacity: 1,
      y: 0,
      scale: 1,
      rotationX: 0,
      stagger: 0.05,
      duration: 0.8,
      ease: "elastic.out(1, 0.75)",
      overwrite: true
    }),
    onLeaveBack: batch => gsap.to(batch, {
      opacity: 0,
      y: 50, // Exit DOWN when scrolling up past them
      scale: 0.9,
      duration: 0.5,
      ease: "power2.in",
      overwrite: true
    })
  });

  // Set initial state for batching
  gsap.set(".activity-chip", {
    y: 50,
    opacity: 0,
    scale: 0.8,
    rotationX: 15,
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

      if (data.track) {
        // --- HAS TRACK DATA (Playing OR Recently Played) ---
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
          elStatusIcon.textContent = data.isPlaying ? 'Now Playing' : 'Recently Played';
        }

      } else {
        // --- TRULY OFFLINE ---
        if (liveState) {
          liveState.classList.remove('active');
          liveState.style.display = 'none';
        }
        
        if (offlineState) offlineState.style.display = 'flex';
        
        if (elStatusIcon) {
          elStatusIcon.textContent = data.statusText || 'Not Playing';
        }
      }

    } catch (error) {
      console.warn('🎵 Music Widget Error:', error.message || error);
      if(liveState) liveState.style.display = 'none';
      if(offlineState) offlineState.style.display = 'flex';
    }
  }

  // Initial Call
  updateWidget();

  // Smart Polling
  function startPolling() {
    // Poll every 15s
    pollInterval = setInterval(updateWidget, 15000);
  }

  function stopPolling() {
    clearInterval(pollInterval);
  }

  // Handle visibility changes
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopPolling();
    } else {
      updateWidget(); // Update immediately upon return
      startPolling();
    }
  });

  // Start initially
  startPolling();
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