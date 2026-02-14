/**
 * ============================================
 * SCRUBBER CONTROLLER - Robust Implementation
 * Works with Lenis & Anime.js v4
 * ============================================
 */

class ScrubberController {
  constructor(element, options = {}) {
    if (!element) {
      console.warn('[Scrubber] No element provided');
      return;
    }

    this.config = {
      majorTickInterval: 10,
      minValue: 0,
      maxValue: 100,
      ...options
    };

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

  /**
   * Safe anime wrapper - handles both v4 IIFE and missing anime gracefully
   */
  safeAnimate(target, props) {
    if (!target) return Promise.resolve();
    
    // Check for Anime.js v4 IIFE global
    if (typeof anime !== 'undefined' && typeof anime.animate === 'function') {
      try {
        return anime.animate(target, props);
      } catch (e) {
        console.warn('[Scrubber] Animation error:', e);
        // Fallback: apply end values directly
        this.applyFallback(target, props);
        return Promise.resolve();
      }
    }
    
    // Fallback: apply properties directly without animation
    this.applyFallback(target, props);
    return Promise.resolve();
  }

  /**
   * Apply properties directly as fallback when anime isn't available
   */
  applyFallback(target, props) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    // Handle common properties
    if (props.opacity !== undefined) {
      const val = Array.isArray(props.opacity) ? props.opacity[1] : props.opacity;
      el.style.opacity = val;
    }
    if (props.scale !== undefined) {
      const val = Array.isArray(props.scale) ? props.scale[1] : props.scale;
      el.style.transform = `scale(${val})`;
    }
    if (props.scaleY !== undefined) {
      const val = Array.isArray(props.scaleY) ? props.scaleY[1] : props.scaleY;
      el.style.transform = `scaleY(${val})`;
    }
    if (props.left !== undefined) {
      const val = Array.isArray(props.left) ? props.left[1] : props.left;
      el.style.left = typeof val === 'number' ? `${val}px` : val;
    }
    if (props.width !== undefined) {
      const val = Array.isArray(props.width) ? props.width[1] : props.width;
      el.style.width = typeof val === 'number' ? `${val}px` : val;
    }
  }

  init() {
    // Use requestAnimationFrame to ensure DOM is painted
    requestAnimationFrame(() => {
      this.measureDimensions();
      this.generateTicks();
      this.attachEventListeners();
      
      // Delay entrance animation slightly to ensure layout is stable
      setTimeout(() => {
        this.playEntranceAnimation();
      }, 100);
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
  }

  playEntranceAnimation() {
    this.calculatePositions();

    // Check for Anime.js v4 IIFE
    const hasAnime = typeof anime !== 'undefined' && typeof anime.createTimeline === 'function';
    
    if (hasAnime) {
      try {
        const timeline = anime.createTimeline({ 
          defaults: { ease: 'outExpo' }
        });

        // Container fade in
        timeline.add(this.el.container, { 
          opacity: [0, 1], 
          duration: 500 
        }, 0);

        // Ticks stagger animation
        const ticks = this.el.ticksContainer.querySelectorAll('.tick');
        if (ticks.length > 0) {
          timeline.add(ticks, {
            scaleY: [0, 1],
            opacity: [0, 1],
            delay: anime.stagger(8, { from: 'center' }),
            duration: 300
          }, 150);
        }

        // Get initial scroll value
        const scrollVal = this.getScrollPercent();
        const startTick = this.findTickByValue(scrollVal);

        // White ticker grow
        timeline.add(this.el.whiteTicker, {
          width: startTick ? startTick.x : 0,
          duration: 600
        }, 400);

        // Primary marker pop
        timeline.add(this.el.markerPrimary, {
          scale: [0, 1],
          duration: 500,
          ease: 'outElastic(1, 0.6)'
        }, 500);

        // Complete handler
        timeline.then(() => {
          this.onEntranceComplete(scrollVal);
        });

        timeline.play();
      } catch (e) {
        console.warn('[Scrubber] Timeline error, using fallback:', e);
        this.fallbackEntrance();
      }
    } else {
      // Fallback for non-anime environments
      this.fallbackEntrance();
    }
  }

  fallbackEntrance() {
    // Simple CSS-based entrance
    if (this.el.container) this.el.container.style.opacity = '1';
    
    const ticks = this.el.ticksContainer?.querySelectorAll('.tick') || [];
    ticks.forEach(tick => {
      tick.style.transform = 'scaleY(1)';
      tick.style.opacity = '1';
    });
    
    if (this.el.markerPrimary) this.el.markerPrimary.style.transform = 'scale(1)';
    
    const scrollVal = this.getScrollPercent();
    this.onEntranceComplete(scrollVal);
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

    // Debounced resize handler for performance
    const debouncedResize = this.debounce(this.handleResize, 150);
    window.addEventListener('resize', debouncedResize);

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

  debounce(func, wait = 150) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
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
    this.safeAnimate(this.el.markerGhost, { opacity: [0, 1], duration: 200, ease: 'outQuad' });
  }

  handleMouseMove(e) {
    if (!this.state.isReady || this.state.isDragging) return;
    const rect = this.el.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const tick = this.findNearestTick(x);
    if (tick && this.el.markerGhost) {
      this.safeAnimate(this.el.markerGhost, {
        left: tick.x - 1,
        opacity: 1,
        duration: 100,
        ease: 'outExpo'
      });
    }
  }

  handleMouseLeave() {
    if (this.state.isDragging) return;
    this.safeAnimate(this.el.markerGhost, { opacity: 0, duration: 200, ease: 'outQuad' });
  }

  handleMouseDown(e) {
    if (!this.state.isReady) return;
    this.state.isDragging = true;
    this.el.container?.classList.add('dragging', 'show-tooltip');
    this.safeAnimate(this.el.markerGhost, { opacity: 0, duration: 80 });
    
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
      this.safeAnimate(this.el.markerPrimary, {
        left: tick.x - 1.5,
        duration: 350,
        ease: 'outElastic(1, 0.5)'
      });
    }
  }

  applyValue(tick, animate = true) {
    if (!tick) return;
    
    this.state.currentValue = tick.value;
    
    if (animate) {
      this.safeAnimate(this.el.markerPrimary, { left: tick.x - 1.5, duration: 250, ease: 'outExpo' });
      this.safeAnimate(this.el.whiteTicker, { width: tick.x, duration: 180, ease: 'outQuad' });
    } else {
      if (this.el.markerPrimary) this.el.markerPrimary.style.left = (tick.x - 1.5) + 'px';
      if (this.el.whiteTicker) this.el.whiteTicker.style.width = tick.x + 'px';
    }
    
    // Update active tick
    this.state.tickPositions.forEach(p => {
      p.element?.classList.toggle('active', p.index === tick.index);
    });
    
    if (this.el.tooltip) this.el.tooltip.textContent = Math.round(tick.value);
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

// Auto-initialize if element exists (for standalone usage)
document.addEventListener('DOMContentLoaded', () => {
  // Initialization is handled by main.js, but provide fallback
  if (typeof window.scrubberInstance === 'undefined') {
    const scrubberEl = document.getElementById('pageScrubber');
    if (scrubberEl && !scrubberEl.dataset.initialized) {
      window.scrubberInstance = new ScrubberController(scrubberEl);
      scrubberEl.dataset.initialized = 'true';
    }
  }
}); 