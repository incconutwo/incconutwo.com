/**
 * ============================================
 * SCRUBBER CONTROLLER - Robust Implementation
 * Works with Lenis & GSAP
 * ============================================
 */

class ScrubberController {
  constructor(element, options = {}) {
    if (!element) {
      console.warn('[Scrubber] No element provided');
      return;
    }

    if (element.dataset.initialized === 'true') {
      return;
    }
    element.dataset.initialized = 'true';

    this.config = {
      majorTickInterval: 10,
      minValue: 0,
      maxValue: 100,
      ...options
    };

    // Major Homepage Section Landmarks
    this.sectionsConfig = [
      { id: 'hero', name: 'Hero', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z"/></svg>` },
      { id: 'projects-section', name: 'Projects', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>` },
      { id: 'second-page', name: 'About', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` },
      { id: 'activities-page', name: 'Activities', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z"/><polygon points="12 8 8 16 16 16 12 8"/></svg>` },
      { id: 'third-page', name: 'Tech Arsenal', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>` },
      { id: 'connect-section', name: 'Connect', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>` },
      { id: 'inspiration-section', name: 'Inspiration', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>` },
      { id: 'contact-support', name: 'Contact', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` }
    ];

    this.chapters = [];

    // Auto-inject DOM structure
    this.ensureStructure(element);

    this.el = {
      container: element,
      ticksContainer: element.querySelector('.ticks-container'),
      markerPrimary: element.querySelector('.marker-primary'),
      markerGhost: element.querySelector('.marker-ghost'),
      whiteTicker: element.querySelector('.white-ticker'),
      tooltip: element.querySelector('.value-tooltip'),
      label: document.getElementById('showcaseLabel')
    };

    this.state = {
      currentValue: 0,
      isDragging: false,
      isReady: false,
      tickPositions: [],
      containerWidth: 0,
      padding: 24,
      tickGap: 8,
      tickWidth: 2,
      totalTicks: 0
    };

    // Bind methods
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleDragMove = this.handleDragMove.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

    this.init();
  }

  ensureStructure(container) {
    container.setAttribute('role', 'slider');
    container.setAttribute('aria-valuemin', '0');
    container.setAttribute('aria-valuemax', '100');
    container.setAttribute('aria-valuenow', '0');
    container.setAttribute('aria-label', 'Page scroll position');
    container.setAttribute('tabindex', '0');

    if (!container.querySelector('.ticks-container')) {
      container.innerHTML = `
        <div class="value-tooltip">0</div>
        <div class="white-ticker"></div>
        <div class="ticks-container"></div>
        <div class="marker-ghost"></div>
        <div class="marker-primary"></div>
      `;
    }
  }

  init() {
    // Use requestAnimationFrame to ensure DOM is painted
    requestAnimationFrame(() => {
      this.measureDimensions();
      this.generateTicks();
      this.attachEventListeners();
      
      const startAnimation = () => {
        setTimeout(() => {
          this.playEntranceAnimation();
        }, 100);
      };

      if (document.body.classList.contains('loaded')) {
        startAnimation();
      } else {
        // Wait for the curtain to lift (body to get 'loaded' class)
        const observer = new MutationObserver(() => {
          if (document.body.classList.contains('loaded')) {
            startAnimation();
            observer.disconnect();
          }
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      }
    });
  }

  measureDimensions() {
    const styles = getComputedStyle(document.documentElement);
    this.state.tickGap = parseInt(styles.getPropertyValue('--tick-gap')) || 8;
    this.state.tickWidth = parseInt(styles.getPropertyValue('--tick-width')) || 2;
    this.state.padding = parseInt(styles.getPropertyValue('--container-padding')) || 24;
    this.state.containerWidth = this.el.container.offsetWidth || 300;
  }

  generateTicks() {
    if (!this.el.ticksContainer) return;
    
    this.el.ticksContainer.innerHTML = '';
    const availableWidth = this.state.containerWidth - (this.state.padding * 2);
    const tickSpace = this.state.tickWidth + this.state.tickGap;
    
    this.state.totalTicks = Math.max(1, Math.floor(availableWidth / tickSpace));
    
    for (let i = 0; i < this.state.totalTicks; i++) {
      const tick = document.createElement('div');
      tick.className = 'tick';
      if (i % this.config.majorTickInterval === 0) tick.classList.add('major');
      if (this.state.isReady) {
        tick.style.transform = 'scaleY(1)';
        tick.style.opacity = '1';
      } else {
        tick.style.transform = 'scaleY(0)';
        tick.style.opacity = '0';
      }
      this.el.ticksContainer.appendChild(tick);
    }
  }

  calculatePositions() {
    if (!this.el.container || !this.el.ticksContainer) return;
    
    this.state.containerWidth = this.el.container.offsetWidth || 300;
    const ticks = this.el.ticksContainer.querySelectorAll('.tick');
    this.state.tickPositions = [];
    const containerRect = this.el.container.getBoundingClientRect();
    
    ticks.forEach((tick, index) => {
      const tickRect = tick.getBoundingClientRect();
      const x = tickRect.left - containerRect.left + (tick.offsetWidth / 2);
      const value = this.state.totalTicks > 1 
        ? Math.round((index / (this.state.totalTicks - 1)) * 100)
        : 0;
      this.state.tickPositions.push({ index, x, value, element: tick });
    });

    this.mapSectionChapters();
  }

  mapSectionChapters() {
    const h = document.documentElement;
    const b = document.body;
    const maxScroll = (h.scrollHeight || b.scrollHeight) - window.innerHeight;
    if (maxScroll <= 0) return;

    this.chapters = [];

    this.sectionsConfig.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (!el) return;

      const top = el.offsetTop;
      const pct = Math.min(100, Math.max(0, (top / maxScroll) * 100));
      const tick = this.findTickByValue(pct);

      if (tick && tick.element) {
        tick.element.classList.add('chapter-marker');
      }

      this.chapters.push({
        ...sec,
        pct,
        top,
        tick
      });
    });
  }

  getCurrentChapter(val) {
    if (!this.chapters || !this.chapters.length) {
      return { name: 'Page', icon: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`, pct: val };
    }
    let current = this.chapters[0];
    for (let i = 0; i < this.chapters.length; i++) {
      if (val >= this.chapters[i].pct - 2) {
        current = this.chapters[i];
      }
    }
    return current;
  }

  playEntranceAnimation() {
    this.calculatePositions();

    if (typeof gsap === 'undefined') {
      console.warn('[Scrubber] GSAP not found, skipping animation');
      this.onEntranceComplete(this.getScrollPercent());
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to(this.el.container, { opacity: 1, duration: 0.5 }, 0);
    
    const ticks = this.el.ticksContainer.querySelectorAll('.tick');
    if (ticks.length > 0) {
      tl.to(ticks, { 
        scaleY: 1, opacity: 1, duration: 0.3, stagger: { amount: 0.4, from: "center" } 
      }, 0.15);
    }
    
    const scrollVal = this.getScrollPercent();
    const startTick = this.findTickByValue(scrollVal);
    
    tl.to(this.el.whiteTicker, { width: startTick ? startTick.x : 0, duration: 0.6 }, 0.4);
    tl.to(this.el.markerPrimary, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.6)" }, 0.5);
    
    tl.then(() => this.onEntranceComplete(scrollVal));
  }

  onEntranceComplete(scrollVal) {
    this.state.isReady = true;
    this.el.container?.classList.add('ready');
    this.setValue(scrollVal, false);
  }

  attachEventListeners() {
    if (!this.el.container) return;

    this.el.container.addEventListener('mouseenter', this.handleMouseEnter);
    this.el.container.addEventListener('mousemove', this.handleMouseMove);
    this.el.container.addEventListener('mouseleave', this.handleMouseLeave);
    this.el.container.addEventListener('mousedown', this.handleMouseDown);
    
    document.addEventListener('mousemove', (e) => { 
      if (this.state.isDragging) this.handleDragMove(e); 
    });
    document.addEventListener('mouseup', this.handleMouseUp);
    
    // Touch support
    this.el.container.addEventListener('touchstart', (e) => { 
      e.preventDefault(); 
      this.handleMouseDown(e); 
    }, { passive: false });
    document.addEventListener('touchmove', (e) => { 
      if (this.state.isDragging) this.handleDragMove(e); 
    }, { passive: false });
    document.addEventListener('touchend', this.handleMouseUp);

    // Throttled resize handler
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(this.handleResize, 150);
    });

    // Use Lenis scroll listener if available for smoother updates
    if (window.lenis) {
      window.lenis.on('scroll', () => {
        if (this.state.isDragging) return;
        this.handleScroll();
      });
    } else {
      // Throttled native scroll handler
      let scrollTicking = false;
      window.addEventListener('scroll', () => {
        if (this.state.isDragging) return;
        if (!scrollTicking) {
          requestAnimationFrame(() => {
            this.handleScroll();
            scrollTicking = false;
          });
          scrollTicking = true;
        }
      }, { passive: true });
    }
  }

  handleResize() {
    this.measureDimensions();
    this.generateTicks();
    requestAnimationFrame(() => {
      this.calculatePositions();
      this.setValue(this.getScrollPercent(), false);
    });
  }

  handleScroll() {
    this.setValue(this.getScrollPercent(), true);
  }

  getScrollPercent() {
    const h = document.documentElement;
    const b = document.body;
    
    // Use Lenis scroll value if available for precision
    if (window.lenis) {
      const scrollTop = window.lenis.scroll;
      const scrollHeight = (h.scrollHeight || b.scrollHeight) - window.innerHeight;
      return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    }
    
    const scrollTop = h.scrollTop || b.scrollTop;
    const scrollHeight = (h.scrollHeight || b.scrollHeight) - h.clientHeight;
    return scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  }

  setPageScroll(value) {
    const h = document.documentElement;
    const b = document.body;
    const maxScroll = (h.scrollHeight || b.scrollHeight) - window.innerHeight;
    const scrollDest = (value / 100) * maxScroll;

    // Use Lenis if available for instant non-smoothed update (critical for drag)
    if (window.lenis) {
      window.lenis.scrollTo(scrollDest, { immediate: true });
    } else {
      window.scrollTo({ top: scrollDest, behavior: 'auto' });
    }
  }

  handleMouseEnter() {
    if (!this.state.isReady || this.state.isDragging) return;
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(this.el.markerGhost, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
    } else {
      this.el.markerGhost.style.opacity = '1';
    }
  }

  handleMouseMove(e) {
    if (!this.state.isReady || this.state.isDragging) return;
    const rect = this.el.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const tick = this.findNearestTick(x);
    if (tick && this.el.markerGhost) {
      if (typeof gsap !== 'undefined') {
        gsap.to(this.el.markerGhost, {
          left: tick.x - 1,
          opacity: 1,
          duration: 0.1,
          ease: 'expo.out'
        });
      } else {
        this.el.markerGhost.style.left = (tick.x - 1) + 'px';
        this.el.markerGhost.style.opacity = '1';
      }
      
      const hoverChapter = this.getCurrentChapter(tick.value);
      if (this.el.tooltip) {
        this.el.tooltip.innerHTML = `
          <span class="chapter-icon">${hoverChapter.icon}</span>
          <span class="chapter-name">${hoverChapter.name}</span>
          <span class="chapter-pct">${Math.round(tick.value)}%</span>
        `;
      }
    }
  }

  handleMouseLeave() {
    if (this.state.isDragging) return;
    if (typeof gsap !== 'undefined') {
      gsap.to(this.el.markerGhost, { opacity: 0, duration: 0.2, ease: 'power2.out' });
    } else {
      this.el.markerGhost.style.opacity = '0';
    }
  }

  handleMouseDown(e) {
    if (!this.state.isReady) return;
    this.state.isDragging = true;
    this.el.container?.classList.add('dragging', 'show-tooltip');
    
    if (typeof gsap !== 'undefined') {
      gsap.to(this.el.markerGhost, { opacity: 0, duration: 0.08 });
    } else {
      this.el.markerGhost.style.opacity = '0';
    }
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const rect = this.el.container.getBoundingClientRect();
    const tick = this.findNearestTick(clientX - rect.left);
    if (tick) {
      this.applyValue(tick, true);
      this.setPageScroll(tick.value);
    }
  }

  handleDragMove(e) {
    if (!this.state.isDragging) return;
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const rect = this.el.container.getBoundingClientRect();
    const tick = this.findNearestTick(clientX - rect.left);
    if (tick) {
      this.applyValue(tick, false);
      this.setPageScroll(tick.value);
    }
  }

  handleMouseUp() {
    if (!this.state.isDragging) return;
    this.state.isDragging = false;
    this.el.container?.classList.remove('dragging');
    
    setTimeout(() => { 
      if (!this.state.isDragging) {
        this.el.container?.classList.remove('show-tooltip'); 
      }
    }, 600);
    
    const tick = this.findTickByValue(this.state.currentValue);
    if (tick) {
      if (typeof gsap !== 'undefined') {
        gsap.to(this.el.markerPrimary, {
          left: tick.x - 1.5,
          duration: 0.35,
          ease: 'elastic.out(1, 0.5)'
        });
      } else {
        this.el.markerPrimary.style.left = (tick.x - 1.5) + 'px';
      }
    }
  }

  applyValue(tick, animate = true) {
    if (!tick) return;
    
    this.state.currentValue = tick.value;
    if (this.el.container) {
      this.el.container.setAttribute('aria-valuenow', Math.round(tick.value).toString());
    }
    
    if (animate && typeof gsap !== 'undefined') {
      gsap.to(this.el.markerPrimary, { left: tick.x - 1.5, duration: 0.25, ease: 'expo.out' });
      gsap.to(this.el.whiteTicker, { width: tick.x, duration: 0.18, ease: 'power2.out' });
    } else {
      if (this.el.markerPrimary) this.el.markerPrimary.style.left = (tick.x - 1.5) + 'px';
      if (this.el.whiteTicker) this.el.whiteTicker.style.width = tick.x + 'px';
    }
    
    // Update active tick
    this.state.tickPositions.forEach(p => {
      p.element?.classList.toggle('active', p.index === tick.index);
    });
    
    const chapter = this.getCurrentChapter(tick.value);
    if (this.el.tooltip) {
      this.el.tooltip.innerHTML = `
        <span class="chapter-icon">${chapter.icon}</span>
        <span class="chapter-name">${chapter.name}</span>
        <span class="chapter-pct">${Math.round(tick.value)}%</span>
      `;
    }
  }

  setValue(value, animate = true) {
    const tick = this.findTickByValue(value);
    if (tick) this.applyValue(tick, animate);
  }

  findNearestTick(x) {
    if (!this.state.tickPositions.length) return null;
    return this.state.tickPositions.reduce((prev, curr) => 
      Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
    );
  }

  findTickByValue(val) {
    if (!this.state.tickPositions.length) return null;
    return this.state.tickPositions.reduce((prev, curr) => 
      Math.abs(curr.value - val) < Math.abs(prev.value - val) ? curr : prev
    );
  }
}

// Expose ScrubberController globally for reveal.js layout animations
window.ScrubberController = ScrubberController;

// Auto-initialize if element exists (for standalone/astro usage)
const initScrubber = () => {
  const scrubberEl = document.getElementById('pageScrubber');
  if (scrubberEl && !scrubberEl.dataset.initialized) {
    window.scrubberInstance = new ScrubberController(scrubberEl);
    scrubberEl.dataset.initialized = 'true';
  }
};

document.addEventListener('DOMContentLoaded', initScrubber);
document.addEventListener('astro:page-load', initScrubber);

if (document.readyState !== 'loading') {
  initScrubber();
}