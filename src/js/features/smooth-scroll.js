/**
 * Initialize Lenis Smooth Scrolling
 * "Future-proof" smooth scrolling that integrates with GSAP and hash navigation
 */
export function initSmoothScroll() {
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
  if (typeof ScrollTrigger !== 'undefined') {
    lenis.on('scroll', ScrollTrigger.update);
  }

  if (typeof gsap !== 'undefined') {
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  // 1. Initial Hash Scroll Handling (e.g., coming from /projects or external link to /#projects-section)
  const scrollToCurrentHash = () => {
    // Prevent forced hash scroll if the user just reloaded the page (preserves their scroll position)
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length > 0 && navEntries[0].type === 'reload') {
      return; 
    }

    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return;
    const targetEl = document.querySelector(hash);
    if (targetEl) {
      // Delay slightly to allow layout calculations and preloader curtain rise to complete
      setTimeout(() => {
        lenis.scrollTo(targetEl, { duration: 1.2, force: true, lock: true });
      }, 1200);
    }
  };

  if (document.readyState === 'complete') {
    scrollToCurrentHash();
  } else {
    window.addEventListener('load', scrollToCurrentHash);
  }

  // 2. Global Anchor Click Delegator for smooth scrolling to sections
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Check if the link target is on the current page
    const [path, hash] = href.split('#');
    const isSamePath = !path || path === '' || path === '/' || path === window.location.pathname || path.includes(window.location.host) || path.includes('incconutwo.com');

    if (isSamePath && hash) {
      const targetEl = document.getElementById(hash) || document.querySelector(`#${hash}`);
      if (targetEl) {
        e.preventDefault();
        e.stopPropagation(); // Prevent Astro router from intercepting

        // If detail overlay or open modal is active, close it
        if (document.body.classList.contains('no-scroll')) {
          document.body.classList.remove('no-scroll');
          document.documentElement.classList.remove('no-scroll');
        }

        lenis.scrollTo(targetEl, { duration: 1.2, force: true });
        
        // Push state, but consider using replaceState to not clutter history
        history.pushState(null, '', `#${hash}`);
      }
    }
  }, { capture: true });
}

