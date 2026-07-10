/**
 * Background Fade Logic
 * Fades out WebGL background when scrolling past hero
 */
export function initBackgroundFade() {
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
export function initTextReveal() {
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
export function initGlobalTitleAnimations() {
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
export function initAboutMeAnimations() {
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
export function initActivitiesAnimations() {
  const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

  // 1. The Cards "Pop" Effect
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
      ease: isMobile ? "power2.out" : "elastic.out(1, 0.75)",
      overwrite: true
    }),
    onLeave: batch => {
      if (isMobile) return;
      gsap.to(batch, {
        opacity: 0,
        y: -50,
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
        y: 50,
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
export function initMagneticButtons() {
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
        x: x * 0.3,
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
 * Scrubber Initialization
 * Initializes the class-based scrubber component
 */
export function initScrubber() {
  const el = document.getElementById('pageScrubber');
  if (el && typeof ScrubberController !== 'undefined') {
    new ScrubberController(el);
  }
}

/**
 * 3D Tilt Effect for premium interactivity
 * Applies a subtle 3D transform on mousemove
 */
export function init3DTilt() {
  if ('ontouchstart' in window) return; // Skip on touch

  const tiltElements = document.querySelectorAll('[data-tilt]');

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
        scale: 1.05,
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
        ease: "elastic.out(1, 0.5)"
      });
    });
  });
}

/**
 * Inspiration Section Animation
 */
export function initInspiration() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".inspiration-section",
      start: "top 80%",
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

  // 5. Reveal Personal Quote (Masked Slide Up)
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
export function initContactSupportAnimations() {
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
