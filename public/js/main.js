/**
 * Main JavaScript Entry Point
 * Handles custom cursor, smooth interactions, and general page logic
 */

window.addEventListener('load', () => {
  // Small timeout to ensure Three.js is ready
  setTimeout(() => {
    document.body.classList.add('loaded');
    initHackerScramble();
  }, 800);
});

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll(); // Initialize Lenis first
  gsap.registerPlugin(ScrollTrigger);
  initCustomCursor();
  initSocialIconHovers();
  initBackgroundFade();
  initTextReveal();
  initGlobalTitleAnimations();
  initAboutMeAnimations();
  initActivitiesAnimations();
  initSpotifyWidget();
  initScrubber();
  initSocialLedger();
  initInspiration();
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
 * Custom Cursor with smooth follow
 */
function initCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;
  
  // Check for touch device
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
  const icons = document.querySelectorAll('.social-icon');
  
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
      toggleActions: "restart none none none"
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
        toggleActions: "restart none none none"
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
          toggleActions: "restart none none none"
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
 * Parallax effects and scroll-triggered reveals
 */
function initAboutMeAnimations() {
  // Staggered Cards Reveal with Parallax (Scoped)
  const cards = document.querySelectorAll("#second-page .story-card");
  cards.forEach((card, i) => {
    // Reveal using fromTo for stability on restart
    gsap.fromTo(card, 
      {
        y: 100,
        rotationX: 10,
        opacity: 0
      },
      {
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
          toggleActions: "restart none none none"
        },
        y: 0,
        rotationX: 0,
        opacity: 1,
        duration: 1.2,
        ease: "power3.out",
        delay: i * 0.15
      }
    );

    // Parallax effect
    const speed = card.getAttribute('data-speed') || 1;
    gsap.to(card, {
      scrollTrigger: {
        trigger: "#second-page .story-grid",
        start: "top bottom",
        end: "bottom top",
        scrub: 1
      },
      y: -50 * speed,
      ease: "none"
    });
  });

  // Tech Arsenal Reveal (Third Page)
  gsap.from(".tech-arsenal", {
    scrollTrigger: {
      trigger: ".tech-arsenal",
      start: "top 90%",
      toggleActions: "restart none none none"
    },
    scale: 0.95,
    opacity: 0,
    duration: 1.2,
    ease: "expo.out"
  });

  // Projects Section Reveal
  gsap.from(".projects-header, .projects-grid", {
    scrollTrigger: {
      trigger: ".projects-section",
      start: "top 85%",
      toggleActions: "restart none none none"
    },
    y: 50,
    opacity: 0,
    duration: 1,
    stagger: 0.2,
    ease: "power3.out"
  });
}

/**
 * Activities Page Animations
 * Staggered entrance and 3D tilt effects
 */
function initActivitiesAnimations() {
  // Staggered Chip Reveal
  gsap.from(".activity-chip", {
    scrollTrigger: {
      trigger: ".activities-grid",
      start: "top 85%",
      toggleActions: "restart none none none"
    },
    y: 50,
    opacity: 0,
    rotation: 5,
    duration: 0.8,
    stagger: {
      amount: 0.8,
      from: "random"
    },
    ease: "back.out(1.7)",
    immediateRender: false
  });

  // Hobby Block Reveal
  gsap.from(".hobby-block", {
    scrollTrigger: {
      trigger: ".hobby-block",
      start: "top 95%",
      toggleActions: "restart none none none"
    },
    y: 30,
    opacity: 0,
    duration: 1,
    ease: "power2.out",
    delay: 0.5,
    immediateRender: false
  });

  init3DTilt();
}

/**
 * Spotify Widget Logic
 * Polls the backend for current track info
 * Optimized: Pauses polling when tab is inactive to save resources
 */
function initSpotifyWidget() {
  const offlineState = document.getElementById('spotify-offline');
  const liveState = document.getElementById('spotify-live');
  
  // Elements to update
  const elArt = document.getElementById('spotify-art');
  const elTrack = document.getElementById('spotify-track');
  const elArtist = document.getElementById('spotify-artist');
  const elStatusIcon = document.querySelector('.spotify-status-text');

  let pollInterval;

  async function updateWidget() {
    if (document.hidden) return; 

    try {
      // Use absolute path for robustness (works regardless of current URL depth)
      const response = await fetch('/api/spotify/now-playing');
      const data = await response.json();

      if (data.isPlaying && data.track) {
        // --- PLAYING STATE ---
        if (offlineState) offlineState.style.display = 'none';
        
        if (liveState) {
          liveState.style.display = 'flex';
          void liveState.offsetWidth; // Force reflow
          liveState.classList.add('active');
          liveState.href = data.spotifyUrl;
        }

        if (elArt) elArt.src = data.albumArt;
        if (elTrack) elTrack.textContent = data.track;
        if (elArtist) elArtist.textContent = data.artist;

      } else {
        // --- OFFLINE / RECENTLY PLAYED STATE ---
        if (liveState) {
          liveState.classList.remove('active');
          liveState.style.display = 'none';
        }
        
        if (offlineState) offlineState.style.display = 'flex';
        
        if (elStatusIcon && data.statusText) {
          elStatusIcon.textContent = data.statusText === "Recently Played" 
            ? "Recently Played" 
            : "Not Playing";
        }
      }

    } catch (error) {
      console.warn("Spotify Widget Error:", error);
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
  const el = document.getElementById('pageScrubber');
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

  const tiltElements = document.querySelectorAll('[data-tilt]');

  tiltElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const multiplier = 10; // Tilt intensity
      
      const xRotate = (multiplier * ((y - rect.height / 2) / rect.height)); 
      const yRotate = -(multiplier * ((x - rect.width / 2) / rect.width));

      gsap.to(el, {
        rotationX: xRotate,
        rotationY: yRotate,
        duration: 0.5,
        ease: "power2.out"
      });
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.5,
        ease: "power2.out"
      });
    });
  });
}

/**
 * Handles the Connect Section Interactions
 */
function initSocialLedger() {
  const items = document.querySelectorAll('.ledger-item');
  const vault = document.getElementById('private-trigger');

  // Entrance Animation (ScrollTrigger)
  gsap.from(".ledger-item", {
    scrollTrigger: {
      trigger: ".social-ledger",
      start: "top 85%",
      toggleActions: "restart none none none"
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
    
    // Magnetic Move on MouseMove
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const xCent = x - (rect.width / 2);
      const yCent = y - (rect.height / 2);
      
      gsap.to(name, {
        x: xCent * 0.1,
        y: yCent * 0.2,
        duration: 0.5,
        ease: "power3.out"
      });

      gsap.to(status, {
        x: xCent * 0.05,
        y: yCent * 0.1,
        duration: 0.5,
        ease: "power3.out"
      });
    });

    item.addEventListener('mouseenter', () => {
      gsap.to(item, { color: color, duration: 0.3 });
      gsap.to(item.querySelector('.ledger-bg'), { color: color, duration: 0 });
    });

    item.addEventListener('mouseleave', () => {
      gsap.to(item, { color: '#ffffff', duration: 0.3 });
      
      // Snap back with bounce
      gsap.to([name, status], {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)"
      });
    });
  });

  // 2. Private Vault Security Scan Logic
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
      toggleActions: "restart none none none"
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
