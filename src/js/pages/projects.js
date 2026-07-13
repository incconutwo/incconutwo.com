/**
 * ============================================
 * PROJECTS PAGE - Interactive Card Grid
 * Handles data loading, card rendering, and animations
 * ============================================
 */

(function () {
  'use strict';

  // SVG Icons
  const ICONS = {
    chrome: `<svg viewBox="0 0 24 24"><path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.952 6.848c.404.036.812.058 1.229.058 6.627 0 12-5.373 12-12 0-1.5-.276-2.938-.778-4.267H15.27zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728z"/></svg>`,
    github: `<svg viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`,
    external: `<svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.3 9.29 1.42 1.42L19 6.41V10h2V3h-7zM5 5v14h14v-7h-2v5H7V7h5V5H5z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    users: `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    star: `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    chevronLeft: `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`
  };

  class ProjectsPage {
    constructor() {
      this.grid = document.getElementById('projectsGrid');
      this.projects = [];
      this.detailOverlay = null;
      this.isDetailOpen = false;
      this._carouselIndex = 0;
      this._carouselSlides = [];
      this._carouselTouchStartX = 0;
      this.init();
    }

    async init() {
      await this.loadProjects();
      this.createDetailOverlay();
      this.renderCards();

      // Register ScrollTrigger plugin for entrance animation
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }

      // Trigger Animation immediately after render
      this.animateEntrance();

      // Fetch stats in background
      this.fetchGitHubStars();

      this.attachEventListeners();
      this.handleDeepLink();
      this.initTilt();
    }

    async loadProjects() {
      try {
        const cached = sessionStorage.getItem('portfolio_projects');
        if (cached) {
          this.projects = JSON.parse(cached);
          this.loadProjectsBackground();
          return;
        }
      } catch (e) {
        console.warn('[Projects] Failed to read from sessionStorage:', e);
      }

      await this.fetchProjectsFresh();
    }

    async fetchProjectsFresh() {
      try {
        const response = await fetch(window.location.origin + '/data/projects.json?v=' + Date.now());
        if (!response.ok) throw new Error('Failed to load');
        this.projects = await response.json();
        sessionStorage.setItem('portfolio_projects', JSON.stringify(this.projects));
      } catch (e) {
        console.error('[Projects] Failed to load projects:', e);
        this.projects = [];
      }
    }

    async loadProjectsBackground() {
      try {
        const response = await fetch(window.location.origin + '/data/projects.json?v=' + Date.now());
        if (response.ok) {
          const freshProjects = await response.json();

          const cleanForComparison = (projects) => {
            return projects.map(p => {
              const cleanP = { ...p };
              if (cleanP.stats) {
                cleanP.stats = { ...cleanP.stats };
                delete cleanP.stats.stars;
              }
              return cleanP;
            });
          };

          if (JSON.stringify(cleanForComparison(freshProjects)) !== JSON.stringify(cleanForComparison(this.projects))) {
            // Keep stars from current projects if they exist
            this.projects = freshProjects.map(freshP => {
              const currentP = this.projects.find(p => p.id === freshP.id);
              if (currentP && currentP.stats && currentP.stats.stars !== undefined) {
                freshP.stats = { ...freshP.stats, stars: currentP.stats.stars };
              }
              return freshP;
            });

            sessionStorage.setItem('portfolio_projects', JSON.stringify(this.projects));
            this.renderCards();
            this.initTilt();
          }
        }
      } catch (e) {
        console.warn('[Projects] Background refresh failed:', e);
      }
    }

    // ============================================
    // DETAIL OVERLAY
    // ============================================

    /**
     * Create the full-screen detail overlay (once, reused for all projects).
     * The carousel is rebuilt each time a project is opened via _buildCarousel().
     */
    createDetailOverlay() {
      const existing = document.getElementById('projectDetailOverlay');
      if (existing) {
        existing.remove();
      }
      const overlay = document.createElement('div');
      overlay.className = 'project-detail-overlay';
      overlay.id = 'projectDetailOverlay';
      overlay.innerHTML = `
        <div class="project-detail-bg"></div>
        <div class="project-detail-overlay-inner">
          <button class="project-detail-close" aria-label="Close project details">
            ${ICONS.back}
            <span>Back to projects</span>
          </button>
          <div class="project-detail-layout">
            <div class="project-detail-left">
              <div class="project-detail-top">
                <div class="project-detail-stats"></div>
                <h1 class="project-detail-title"></h1>
              </div>
              <div class="project-detail-center">
                <p class="project-detail-desc"></p>
              </div>
              <div class="project-detail-bottom">
                <div class="project-detail-buttons"></div>
              </div>
            </div>
            <div class="project-detail-right">
              <div class="project-detail-carousel">
                <div class="carousel-track-wrapper">
                  <button class="carousel-arrow carousel-arrow-prev" aria-label="Previous screenshot">
                    ${ICONS.chevronLeft}
                  </button>
                  <div class="carousel-viewport">
                    <div class="carousel-track"></div>
                  </div>
                  <button class="carousel-arrow carousel-arrow-next" aria-label="Next screenshot">
                    ${ICONS.chevronRight}
                  </button>
                </div>
                <div class="carousel-dots"></div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
      this.detailOverlay = overlay;

      // Wire carousel arrow buttons
      overlay.querySelector('.carousel-arrow-prev').addEventListener('click', () => {
        this._carouselGoTo(this._carouselIndex - 1);
      });
      overlay.querySelector('.carousel-arrow-next').addEventListener('click', () => {
        this._carouselGoTo(this._carouselIndex + 1);
      });

      // Touch / swipe support on the viewport
      const viewport = overlay.querySelector('.carousel-viewport');
      viewport.addEventListener('touchstart', (e) => {
        this._carouselTouchStartX = e.touches[0].clientX;
      }, { passive: true });
      viewport.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - this._carouselTouchStartX;
        if (Math.abs(dx) > 40) this._carouselGoTo(this._carouselIndex + (dx < 0 ? 1 : -1));
      }, { passive: true });

      // Click screenshot to view fullscreen on mobile
      viewport.addEventListener('click', (e) => {
        const img = e.target.closest('.carousel-img');
        if (!img) return;

        // Check if on mobile/tablet (touch device or small screen)
        const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;
        if (!isMobile) return;

        // Filter out placeholder slides
        const realScreenshots = this._carouselSlides.filter(s => s !== '__placeholder__');
        if (realScreenshots.length === 0) return;

        // Find the index of the clicked screenshot in the filtered list
        const clickedSrc = this._carouselSlides[this._carouselIndex];
        const realIndex = realScreenshots.indexOf(clickedSrc);

        // Open fullscreen carousel modal
        this.openFullscreenViewer(realScreenshots, realIndex >= 0 ? realIndex : 0);
      });
    }

    /**
     * Build carousel slides from project data.
     *
     * ──────────────────────────────────────────────────────────
     * HOW TO ADD SCREENSHOTS FOR A PROJECT
     * ──────────────────────────────────────────────────────────
     * In projects.json, add image file paths to the "screenshots"
     * array for any project. Example:
     *
     *   "screenshots": [
     *     "assets/images/projects/my-project-screen1.webp",
     *     "assets/images/projects/my-project-screen2.png",
     *     "assets/images/projects/my-project-screen3.webp"
     *   ]
     *
     * Leave "screenshots": [] to show animated placeholders instead.
     * ──────────────────────────────────────────────────────────
     */
    _buildCarousel(project) {
      const track = this.detailOverlay.querySelector('.carousel-track');
      const dotsEl = this.detailOverlay.querySelector('.carousel-dots');
      const prevBtn = this.detailOverlay.querySelector('.carousel-arrow-prev');
      const nextBtn = this.detailOverlay.querySelector('.carousel-arrow-next');

      const hasReal = Array.isArray(project.screenshots) && project.screenshots.length > 0;
      const shots = hasReal
        ? project.screenshots.map(src => this.resolveImagePath(src))
        : ['__placeholder__', '__placeholder__', '__placeholder__'];

      this._carouselSlides = shots;
      this._carouselIndex = 0;

      // Render slides as a horizontal strip inside the track
      track.innerHTML = shots.map((src, i) => {
        if (src === '__placeholder__') {
          return `
            <div class="carousel-slide" data-index="${i}" aria-hidden="${i !== 0}">
              <div class="carousel-placeholder">
                <div class="placeholder-shimmer"></div>
                <span class="placeholder-label">Screenshot ${i + 1}</span>
              </div>
            </div>`;
        }
        return `
          <div class="carousel-slide" data-index="${i}" aria-hidden="${i !== 0}">
            <img src="${src}" alt="Screenshot ${i + 1}" class="carousel-img" loading="lazy" draggable="false">
          </div>`;
      }).join('');

      // Render dots
      dotsEl.innerHTML = shots.map((_, i) =>
        `<span class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}" role="button" aria-label="Go to screenshot ${i + 1}"></span>`
      ).join('');

      dotsEl.querySelectorAll('.carousel-dot').forEach(dot => {
        dot.addEventListener('click', () => this._carouselGoTo(+dot.dataset.index));
      });

      // Hide arrows when only one slide
      const multi = shots.length > 1;
      prevBtn.style.display = multi ? '' : 'none';
      nextBtn.style.display = multi ? '' : 'none';

      // Jump to first slide without animation
      this._carouselGoTo(0, false);
    }

    /**
     * Navigate the carousel to a given slide index (wraps around).
     * @param {number}  index
     * @param {boolean} animate - use GSAP transition (default true)
     */
    _carouselGoTo(index, animate = true) {
      const count = this._carouselSlides.length;
      if (!count) return;
      index = ((index % count) + count) % count;
      this._carouselIndex = index;

      const track = this.detailOverlay.querySelector('.carousel-track');
      const dotsEl = this.detailOverlay.querySelector('.carousel-dots');

      if (animate && typeof gsap !== 'undefined') {
        gsap.to(track, { x: `-${index * 100}%`, duration: 0.6, ease: 'power4.out' });
      } else {
        track.style.transition = 'none';
        track.style.transform = `translateX(-${index * 100}%)`;
        requestAnimationFrame(() => { track.style.transition = ''; });
      }

      // Sync dots
      dotsEl.querySelectorAll('.carousel-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });

      // Update aria-hidden on slides
      track.querySelectorAll('.carousel-slide').forEach((slide, i) => {
        slide.setAttribute('aria-hidden', i !== index);
      });
    }

    // ============================================
    // OPEN / CLOSE DETAIL
    // ============================================

    openDetail(projectId) {
      const project = this.projects.find(p => p.id === projectId);
      if (!project) return;

      const overlay = this.detailOverlay;
      const bg = overlay.querySelector('.project-detail-bg');
      const title = overlay.querySelector('.project-detail-title');
      const desc = overlay.querySelector('.project-detail-desc');
      const buttons = overlay.querySelector('.project-detail-buttons');
      const stats = overlay.querySelector('.project-detail-stats');

      // Background blur layer (use image, fallback to first screenshot, else fallback to CSS gradient)
      const bgImageUrl = this.resolveImagePath(project.image || (project.screenshots && project.screenshots.length > 0 ? project.screenshots[0] : null));
      if (bgImageUrl) {
        bg.style.backgroundImage = `url('${bgImageUrl}')`;
        bg.classList.remove('no-image');
      } else {
        bg.style.backgroundImage = '';
        bg.classList.add('no-image');
      }

      // Text content
      title.textContent = project.title;
      desc.textContent = project.longDescription || project.shortDescription;
      buttons.innerHTML = this.createButtons(project.links);
      stats.innerHTML = project.stats ? this.createStats(project.stats) : '';



      // Build carousel from project.screenshots
      this._buildCarousel(project);

      // Show overlay & lock scroll
      overlay.classList.add('is-open');
      document.body.classList.add('no-scroll');
      document.documentElement.classList.add('no-scroll');
      this.isDetailOpen = true;

      history.replaceState(null, '', `#${projectId}`);

      // Entrance animation
      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline();
        tl.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
        tl.fromTo(overlay.querySelector('.project-detail-title'),
          { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.2');
        tl.fromTo(overlay.querySelector('.project-detail-desc'),
          { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.4');
        tl.fromTo(overlay.querySelector('.project-detail-buttons'),
          { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.3');
        tl.fromTo(overlay.querySelector('.project-detail-carousel'),
          { x: 80, opacity: 0, scale: 0.9 }, { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' }, '-=0.4');
        tl.fromTo(overlay.querySelector('.project-detail-close'),
          { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, '-=0.5');
      }
    }

    closeDetail() {
      if (!this.isDetailOpen) return;
      const overlay = this.detailOverlay;

      if (typeof gsap !== 'undefined') {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.35,
          ease: 'power2.in',
          onComplete: () => {
            overlay.classList.remove('is-open');
            document.body.classList.remove('no-scroll');
            document.documentElement.classList.remove('no-scroll');
            this.isDetailOpen = false;
          }
        });
      } else {
        overlay.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
        document.documentElement.classList.remove('no-scroll');
        this.isDetailOpen = false;
      }

      history.replaceState(null, '', location.pathname);
    }

    /**
     * Mobile Fullscreen Screenshot Carousel Modal with Swipe & Keyboard support
     */
    openFullscreenViewer(screenshots, initialIndex) {
      const modal = document.createElement('div');
      modal.className = 'screenshot-fullscreen-modal';

      // Setup HTML layout containing slides, arrows, and dots indicators
      modal.innerHTML = `
        <div class="fullscreen-close-btn">${ICONS.close}</div>
        <div class="fullscreen-carousel-track-wrapper">
          <button class="fullscreen-arrow fullscreen-arrow-prev" aria-label="Previous screenshot">
            ${ICONS.chevronLeft}
          </button>
          <div class="fullscreen-carousel-viewport">
            <div class="fullscreen-carousel-track">
              ${screenshots.map((src, i) => `
                <div class="fullscreen-carousel-slide">
                  <img src="${src}" alt="Screenshot ${i + 1}" class="fullscreen-img" draggable="false">
                </div>
              `).join('')}
            </div>
          </div>
          <button class="fullscreen-arrow fullscreen-arrow-next" aria-label="Next screenshot">
            ${ICONS.chevronRight}
          </button>
        </div>
        <div class="fullscreen-carousel-dots">
          ${screenshots.map((_, i) => `
            <span class="fullscreen-carousel-dot${i === initialIndex ? ' active' : ''}" data-index="${i}" role="button"></span>
          `).join('')}
        </div>
      `;
      document.body.appendChild(modal);

      // Force page-flow animation triggers
      requestAnimationFrame(() => {
        modal.classList.add('active');
      });

      let currentIndex = initialIndex;
      const track = modal.querySelector('.fullscreen-carousel-track');
      const dots = modal.querySelectorAll('.fullscreen-carousel-dot');

      const goToSlide = (idx, animate = true) => {
        idx = ((idx % screenshots.length) + screenshots.length) % screenshots.length;
        currentIndex = idx;

        if (animate && typeof gsap !== 'undefined') {
          gsap.to(track, { x: `-${idx * 100}%`, duration: 0.4, ease: 'power2.out' });
        } else {
          track.style.transform = `translateX(-${idx * 100}%)`;
        }

        // Highlight selected navigation dots
        dots.forEach((dot, i) => {
          dot.classList.toggle('active', i === idx);
        });
      };

      // Set initial slide immediately
      goToSlide(currentIndex, false);

      // Bind button clicks
      modal.querySelector('.fullscreen-arrow-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(currentIndex - 1);
      });
      modal.querySelector('.fullscreen-arrow-next').addEventListener('click', (e) => {
        e.stopPropagation();
        goToSlide(currentIndex + 1);
      });

      dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          goToSlide(+dot.dataset.index);
        });
      });

      // Swipe / gesture detection logic
      let startX = 0;
      const viewport = modal.querySelector('.fullscreen-carousel-viewport');
      viewport.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 45) {
          goToSlide(currentIndex + (dx < 0 ? 1 : -1));
        }
      }, { passive: true });

      // Clean cleanup closure functions
      const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
        document.removeEventListener('keydown', handleKeyDown);
      };

      modal.querySelector('.fullscreen-close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('fullscreen-carousel-slide') || e.target.classList.contains('fullscreen-carousel-viewport')) {
          closeModal();
        }
      });

      // Keyboard listeners
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
        if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
      };
      document.addEventListener('keydown', handleKeyDown);
    }

    // ============================================
    // CARD ANIMATIONS
    // ============================================

    animateEntrance() {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

      ScrollTrigger.refresh();

      const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window;

      gsap.set('.project-card', {
        y: isMobile ? 30 : 100,
        opacity: 0,
        scale: isMobile ? 0.95 : 0.85,
        rotationX: isMobile ? 0 : 10,
        transformPerspective: 1000
      });

      if (isMobile) {
        ScrollTrigger.batch('.project-card', {
          start: 'top 95%',
          once: true,
          onEnter: batch => gsap.to(batch, {
            opacity: 1, y: 0, scale: 1, rotationX: 0,
            stagger: 0.1, duration: 0.8, ease: 'power2.out', overwrite: true
          })
        });

        // Failsafe: if Lenis/smooth-scroll breaks ScrollTrigger on mobile,
        // force-show all cards after 2s so the grid is never permanently blank.
        setTimeout(() => {
          const hidden = document.querySelectorAll('.project-card');
          hidden.forEach(card => {
            const opacity = parseFloat(gsap.getProperty(card, 'opacity'));
            if (opacity < 0.5) {
              gsap.to(card, { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 0.6, ease: 'power2.out', overwrite: true });
            }
          });
        }, 2000);
      } else {
        ScrollTrigger.batch('.project-card', {
          start: 'top 90%',
          end: 'bottom 10%',

          onEnter: batch => gsap.to(batch, {
            opacity: 1, y: 0, scale: 1, rotationX: 0,
            stagger: 0.15, duration: 1.2, ease: 'elastic.out(1, 0.6)', overwrite: true
          }),
          onLeave: batch => gsap.to(batch, {
            opacity: 0, y: -60, scale: 0.9, duration: 0.6, ease: 'power2.in', overwrite: true
          }),
          onEnterBack: batch => gsap.to(batch, {
            opacity: 1, y: 0, scale: 1, rotationX: 0,
            stagger: 0.1, duration: 1, ease: 'elastic.out(1, 0.6)', overwrite: true
          }),
          onLeaveBack: batch => gsap.to(batch, {
            opacity: 0, y: 60, scale: 0.9, duration: 0.6, ease: 'power2.in', overwrite: true
          })
        });
      }
    }

    // ============================================
    // GITHUB STARS
    // ============================================

    async fetchGitHubStars() {
      let cache = {};
      try {
        const cached = sessionStorage.getItem('github_stars_cache');
        if (cached) {
          cache = JSON.parse(cached);
        }
      } catch (e) {
        console.warn('[Projects] Failed to read stars cache:', e);
      }

      let cacheUpdated = false;

      const starPromises = this.projects.map(async (project) => {
        const githubLink = project.links?.find(l => l.kind === 'github' || l.url.includes('github.com'));
        if (!githubLink) return;
        try {
          const match = githubLink.url.match(/github\.com\/([^/]+)\/([^/]+)/);
          if (match && match.length >= 3) {
            const [_, owner, repo] = match;
            const repoKey = `${owner}/${repo}`;

            if (cache[repoKey] !== undefined) {
              project.stats = { ...project.stats, stars: cache[repoKey] };
              this.updateCardStats(project.id, project.stats);
              return;
            }

            const response = await fetch(window.location.origin + `/api/github/stars/${owner}/${repo}`);
            if (response.ok) {
              const data = await response.json();
              if (data.stars >= 0) {
                cache[repoKey] = data.stars;
                cacheUpdated = true;
                project.stats = { ...project.stats, stars: data.stars };
                this.updateCardStats(project.id, project.stats);
              }
            }
          }
        } catch (e) {
          console.warn(`[Projects] Failed to fetch stars for ${project.title}:`, e);
        }
      });
      await Promise.all(starPromises);

      if (cacheUpdated) {
        try {
          sessionStorage.setItem('github_stars_cache', JSON.stringify(cache));
        } catch (e) {
          console.warn('[Projects] Failed to save stars cache:', e);
        }
      }
    }

    updateCardStats(id, stats) {
      const card = this.grid?.querySelector(`.project-card[data-id="${id}"]`);
      if (card) {
        const frontContent = card.querySelector('.project-front .project-content');
        const existingStats = frontContent.querySelector('.project-stats');
        const newStatsHtml = this.createStats(stats);
        if (existingStats) {
          existingStats.outerHTML = newStatsHtml;
        } else {
          frontContent.insertAdjacentHTML('afterbegin', newStatsHtml);
        }
      }
    }

    // ============================================
    // RENDERING
    // ============================================

    renderCards() {
      if (!this.grid) return;

      // Group projects
      const extensionProjects = this.projects.filter(p => p.group === 'chrome/firefox extensions');
      const websiteProjects = this.projects.filter(p => p.group === 'websites');
      const windhawkProjects = this.projects.filter(p => p.group === 'windhawk/windows mod');
      const jihawiProjects = this.projects.filter(p => p.group === 'Jihawi Apps');
      const sharedProjects = this.projects.filter(p => p.group === 'Aurora Ecosystem');

      // Sort each group (featured first)
      const sortByFeatured = (arr) => [...arr].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

      const sortedExtensions = sortByFeatured(extensionProjects);
      const sortedWebsites = sortByFeatured(websiteProjects);
      const sortedWindhawk = sortByFeatured(windhawkProjects);
      const sortedJihawi = sortByFeatured(jihawiProjects);
      const sortedShared = sortByFeatured(sharedProjects);

      let html = '';

      // 1. chrome/firefox extensions
      if (sortedExtensions.length > 0) {
        html += `
          <div class="projects-group-header subgroup-header">
            <span class="group-title">chrome/firefox extensions</span>
          </div>
        `;
        sortedExtensions.forEach(project => {
          html += this.createCard(project);
        });
      }

      // 2. websites
      if (sortedWebsites.length > 0) {
        html += `
          <div class="projects-group-header subgroup-header">
            <span class="group-title">websites</span>
          </div>
        `;
        sortedWebsites.forEach(project => {
          html += this.createCard(project);
        });
      }

      // 3. windhawk/windows mod
      html += `
        <div class="projects-group-header subgroup-header">
          <span class="group-title">windhawk/windows mod</span>
        </div>
      `;
      if (sortedWindhawk.length > 0) {
        sortedWindhawk.forEach(project => {
          html += this.createCard(project);
        });
      } else {
        html += `
          <div class="project-card coming-soon-card" tabindex="-1" role="presentation">
            <div class="project-card-inner">
              <div class="project-face project-front no-image">
                <div class="project-overlay"></div>
                <div class="project-content">
                  <h3>Coming Soon</h3>
                  <p class="project-desc">A new project will be added here soon. Stay tuned!</p>
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // 4. Jihawi Projects
      if (sortedJihawi.length > 0) {
        html += `
          <div class="projects-group-header">
            <span class="group-title">Jihawi 2026</span>
          </div>
        `;
        sortedJihawi.forEach(project => {
          html += this.createCard(project);
        });
      }

      // 5. Shared Projects
      if (sortedShared.length > 0) {
        html += `
          <div class="projects-group-header">
            <span class="group-title">Shared Projects</span>
            <span class="group-subtitle">with <a href="https://x.com/test_tm7873" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">@Test_tm7873</a></span>
          </div>
        `;
        sortedShared.forEach(project => {
          html += this.createCard(project);
        });
      }
      this.grid.innerHTML = html;
    }

    resolveImagePath(imgPath) {
      if (!imgPath) return '';
      if (imgPath.startsWith('/') || imgPath.startsWith('http') || imgPath.startsWith('data:')) {
        return imgPath;
      }
      return '/' + imgPath;
    }

    createCard(project) {
      const { id, featured, title, shortDescription, links, stats, image, screenshots } = project;
      const statsHtml = stats ? this.createStats(stats) : '';

      // Background fallback chain matching detail page background selection
      const bgImageUrl = this.resolveImagePath(image || (screenshots && screenshots.length > 0 ? screenshots[0] : null));

      const hasBg = !!bgImageUrl;
      const bgStyle = hasBg ? `style="--bg: url('${bgImageUrl}');"` : '';
      const bgClass = hasBg ? '' : 'no-image';

      return `
        <div class="project-card ${featured ? 'featured' : ''}"
             data-id="${id}"
             data-tilt
             tabindex="0"
             role="button"
             aria-label="View details for ${title}">
          <div class="project-card-inner">
            <div class="project-face project-front ${bgClass}" ${bgStyle}>
              <div class="project-overlay"></div>
              
              <div class="project-hint">Click to view</div>
              <div class="project-content">
                ${statsHtml}
                <h3>${title}</h3>
                <p class="project-desc">${shortDescription}</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    createButtons(links) {
      if (!links || !links.length) return '';
      return links.map((link, i) => {
        const icon = ICONS[link.kind] || ICONS.external;
        const isPrimary = i === 0 && link.kind === 'chrome';
        return `
          <a href="${link.url}"
             target="_blank"
             rel="noopener noreferrer"
             class="project-btn ${isPrimary ? 'primary' : ''}"
             onclick="event.stopPropagation()">
            ${icon}
            <span>${link.label}</span>
          </a>
        `;
      }).join('');
    }

    createStats(stats) {
      return `
        <div class="project-stats">
          ${stats.weeklyUsers ? `<span class="project-stat">${ICONS.users} ${stats.weeklyUsers} weekly</span>` : ''}
          ${stats.dailyUsers ? `<span class="project-stat">${ICONS.users} ${stats.dailyUsers} daily</span>` : ''}
          ${stats.stars ? `<span class="project-stat is-star">${ICONS.star} ${stats.stars} stars</span>` : ''}
        </div>
      `;
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    attachEventListeners() {
      // Card click → open detail
      this.grid?.addEventListener('click', (e) => {
        const card = e.target.closest('.project-card');
        if (!card) return;
        if (e.target.closest('.project-btn')) return;
        this.openDetail(card.dataset.id);
      });

      // Card keyboard
      this.grid?.addEventListener('keydown', (e) => {
        const card = e.target.closest('.project-card');
        if (!card) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openDetail(card.dataset.id);
        }
      });

      // Close button
      this.detailOverlay?.querySelector('.project-detail-close')?.addEventListener('click', () => {
        this.closeDetail();
      });

      // Escape key + carousel left/right arrows
      document.addEventListener('keydown', (e) => {
        if (!this.isDetailOpen) return;
        if (e.key === 'Escape') this.closeDetail();
        if (e.key === 'ArrowLeft') this._carouselGoTo(this._carouselIndex - 1);
        if (e.key === 'ArrowRight') this._carouselGoTo(this._carouselIndex + 1);
      });

      // Prevent link clicks from bubbling to close
      this.detailOverlay?.addEventListener('click', (e) => {
        if (e.target.closest('.project-btn')) e.stopPropagation();
      });
    }

    handleDeepLink() {
      const hash = location.hash.slice(1);
      if (!hash) return;
      const card = this.grid?.querySelector(`[data-id="${hash}"]`);
      if (card) {
        setTimeout(() => this.openDetail(hash), 300);
      }
    }

    // ============================================
    // TILT EFFECT
    // ============================================

    initTilt() {
      if ('ontouchstart' in window ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      document.querySelectorAll('.project-card[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const isFeatured = card.classList.contains('featured');
          const mult = isFeatured ? 1.5 : 3;
          const xRotate = mult * ((y - rect.height / 2) / rect.height);
          const yRotate = -mult * ((x - rect.width / 2) / rect.width);
          card.style.transform = `perspective(1200px) rotateX(${xRotate}deg) rotateY(${yRotate}deg) scale(0.95)`;
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, { rotationX: 0, rotationY: 0, scale: 1, duration: 0.5, ease: 'power2.out' });
        });
      });
    }
  }

  window.ProjectsPage = ProjectsPage;

  const startProjects = () => {
    if (document.body.dataset.projectsInitialized) return;
    document.body.dataset.projectsInitialized = 'true';
    new ProjectsPage();
  };

  document.addEventListener('DOMContentLoaded', startProjects);
  document.addEventListener('astro:page-load', startProjects);

  if (document.readyState !== 'loading') {
    startProjects();
  }
})();
