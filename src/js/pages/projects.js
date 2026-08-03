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
    chrome: `<svg viewBox="0 0 15 15" fill="none"><path d="M2.50278 1.90694C3.82927 0.720967 5.58034 0 7.5 0C10.3784 0 12.8778 1.62097 14.1351 4H7.5C6.0459 4 4.79892 4.88673 4.27029 6.14895L2.50278 1.90694Z" fill="currentColor"/><path d="M1.74548 2.68942C0.655856 3.99152 0 5.66907 0 7.5C0 10.8241 2.16179 13.6427 5.15637 14.6267L7.96726 10.9691C7.8144 10.9895 7.65843 11 7.5 11C5.83646 11 4.44398 9.83942 4.08809 8.28377C4.06875 8.25563 4.052 8.22508 4.03835 8.1923L1.74548 2.68942Z" fill="currentColor"/><path d="M6.2149 14.8904C6.63245 14.9624 7.06184 15 7.5 15C11.6426 15 15 11.6426 15 7.5C15 6.62148 14.849 5.77828 14.5715 4.99492C14.5482 4.99827 14.5243 5 14.5 5H9.94949C10.5978 5.63526 11 6.52066 11 7.5C11 8.42321 10.6426 9.26293 10.0585 9.88832C10.0546 9.89383 10.0506 9.89928 10.0465 9.90468L6.2149 14.8904Z" fill="currentColor"/><path d="M5 7.5C5 6.11929 6.11929 5 7.5 5C8.88071 5 10 6.11929 10 7.5C10 8.88071 8.88071 10 7.5 10C6.11929 10 5 8.88071 5 7.5Z" fill="currentColor"/></svg>`,
    github: `<svg viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`,
    external: `<svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.3 9.29 1.42 1.42L19 6.41V10h2V3h-7zM5 5v14h14v-7h-2v5H7V7h5V5H5z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    users: `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    star: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
    back: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    chevronLeft: `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`,
    chevronRight: `<svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
    nexus: `<svg viewBox="250 210 520 570"><path d="M765.2 609.1c-3.1-10.1-7.6-19.8-12.9-29.3-3.1-5.7-6.9-11.3-11-17.3 6.9-30.8 7.6-62.9 1.9-94.1-2.8-14.8-6.9-29.3-12.6-43.4 2.8-7.6 5.3-15.1 7.6-22.7 2.8-10.1 4.4-21.1 5-32.7.3-5.4.3-10.7 0-15.7-.3-14.5-4.7-24.9-10.4-32.1-1.6-2.5-3.8-4.7-6-6.6l-4.4-4.4c-5.3-5-11-10.1-16.7-14.8-12.9-10.7-25.2-19.2-37.1-26.1-5.4-3.1-12.9-7.2-21.7-10.1-5-1.6-9.4-2.5-14.2-3.1-1.9-.3-4.1-.3-6-.3-9.1 0-16.1 2.2-19.2 3.5h-.3c-14.2 4.4-27.7 11.6-42.5 21.7-4.4-.9-8.8-1.9-13.2-2.5-18.6-3.1-38.1-4.1-57.3-2.5-18.3 1.3-36.5 5-53.5 10.7-7.2 2.5-14.2 5-20.8 7.9-10.1-3.8-21.4-7.2-34-9.1-8.2-1.3-16.7-1.9-24.5-1.9h-.3c-4.1 0-8.2.3-12 .6-12 .3-20.8 4.4-27.1 9.1-2.8 1.9-5.3 4.1-7.6 6.6l-4.4 4.4c-5 5-9.8 10.7-14.5 16.4-10.4 12.9-18.9 24.9-25.8 36.8-3.1 5.4-7.2 12.6-10.1 21.4-1.6 4.7-2.5 9.1-3.1 13.5-1.9 12 1.3 21.4 2.5 25.2v.3c6 18.3 15.4 34 23 45-.9 3.8-1.6 7.9-2.2 12-2.8 19.2-3.5 38.7-1.6 57.9 1.9 18.3 5.7 36.5 11.3 52.9 1.3 3.1 2.2 6.3 3.5 9.1-.3.9-.6 1.9-.9 2.8-4.1 11-9.4 25.5-11.6 41.9-1.3 7.9-1.6 16.1-1.6 23.6 0 3.8.3 7.2.6 10.7.3 10.7 3.8 18.9 7.9 25.2 2.2 3.5 5 6.6 8.2 9.4l4.4 4.4c5.3 5 11 10.1 16.7 14.8 12.9 10.7 25.2 19.2 37.1 26.1 5.3 3.1 12.9 7.2 21.7 10.1 5 1.6 9.4 2.5 14.2 3.1 1.9.3 4.1.3 6 .3 9.1 0 16.1-2.5 19.2-2.2h.3c15.1-5 29.6-12.6 45.9-24.2 2.2.3 4.7.9 6.9 1.3 18.9 3.5 38.4 5 57.6 3.8 18.6-.9 37.1-4.4 54.8-9.8 6-1.9 12.3-4.1 18.3-6.6 11.3 4.4 23.9 8.8 38.1 11 8.8 1.6 17.3 2.2 25.8 2.2h.3c4.1 0 8.2-.3 12-.6 12-.6 20.8-4.4 27.1-9.1 2.8-2.2 5.4-4.4 7.6-6.9l3.8-3.8c10.1-10.7 19.8-22.3 28.3-34.3 7.9-11 16.7-24.2 22.3-40.3 1.6-4.7 2.8-8.8 3.5-13.2 1.8-12.8-1.1-22.2-2.3-26zm-72.9-35.9c-13.4-13.8-36.2-30.8-79-49.5l11.6-22-89.1 23.9L568 608l12.9-24.5c11 5 19.2 10.1 27.4 16.1 12.6 8.8 24.2 18.6 34 29 23.8 24.1 36.3 48.8 33.1 69.2l-.4.2-1.6.3c-11 1.3-23 .6-35.2-2.2h-.3c-13.2-3.5-26.3-8.4-39.5-14.5-25.9 13.2-55.3 20.8-86.4 20.8-21.4 0-41.9-3.6-61.1-10.1 13.5-13.6 29.9-36.3 47.9-77.4l22 11.6-23.9-89.1-82.8 31.6 24.9 13.5c-5 11-10.1 19.2-16.1 27.4-8.8 12.6-18.6 24.2-29 34-24.1 23.8-48.8 36.3-69.2 33.1l-.4-.4-.3-1.6c-1.3-11-.6-23 2.2-35.2v-.3c3.7-14 9-27.9 15.6-41.9-13-25.7-20.3-54.8-20.3-85.6 0-19.9 3.1-39.1 8.8-57.1 13.3 13.9 36.2 31.2 79.7 50.2l-11.6 22 89.1-23.9-31.8-83.4-13.3 25.2c-11-5-19.2-10.1-27.4-16.1-12.6-8.8-24.2-18.6-34-29-23.6-24-36.2-48.5-33.1-68.8l.7-.7 1.6-.3c11-1.3 23-.6 35.2 2.2h.3c11.7 3.1 23.4 7.3 35.1 12.5C448 330 479 321.6 512 321.6c21.7 0 42.5 3.7 61.9 10.3-14 13.2-31.4 36.1-50.6 80l-22-11.6 23.9 89.1 83.1-31.5-25.2-13.5c5-11 10.1-19.2 16.1-27.4 8.8-12.6 18.6-24.2 29-34 24.1-23.8 48.8-36.3 69.2-33.1l.4.4.3 1.6c1.3 11 .6 23-2.2 35.2v.3c-3.4 12.8-8.2 25.7-14 38.5 13.2 25.9 20.6 55.1 20.6 86.2-.1 21.3-3.7 41.9-10.2 61.1z" fill="currentColor"/></svg>`
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

      // Filter & Search State
      this.currentFilter = 'All';
      this.searchQuery = '';

      // Featured/Expand State
      this.FEATURED_IDS = ['twitter-flags', 'taskbar-dock-animation-plus', 'aurora-chatgpt'];
      this.isFeaturedMode = false;
      this.isExpanded = false;

      this.init();
    }

    async init() {
      await this.loadProjects();
      this.createDetailOverlay();

      // Detect featured mode from the section's data-mode attribute
      const section = document.getElementById('projects-section');
      this.isFeaturedMode = section?.dataset.mode === 'featured';

      this.renderCards();

      // Register ScrollTrigger plugin for entrance animation
      if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }

      // Trigger Animation immediately after render
      this.animateEntrance();

      // Fetch stats in background
      this.fetchGitHubStars();
      this.fetchWindhawkUsers();

      this.attachEventListeners();
      this.attachFilterListeners();
      this.handleDeepLink();
      this.initTilt();

      // Setup expand button for featured mode
      if (this.isFeaturedMode) {
        this.setupExpandButton();
      }
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
                delete cleanP.stats.users;
              }
              return cleanP;
            });
          };

          if (JSON.stringify(cleanForComparison(freshProjects)) !== JSON.stringify(cleanForComparison(this.projects))) {
            // Keep stars and users from current projects if they exist
            this.projects = freshProjects.map(freshP => {
              const currentP = this.projects.find(p => p.id === freshP.id);
              if (currentP && currentP.stats) {
                const currentStats = {};
                if (currentP.stats.stars !== undefined) currentStats.stars = currentP.stats.stars;
                if (currentP.stats.users !== undefined) currentStats.users = currentP.stats.users;
                freshP.stats = { ...freshP.stats, ...currentStats };
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
        if (project.hideStars) return;
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

    async fetchWindhawkUsers() {
      const windhawkProjects = this.projects.filter(p => p.group === 'windhawk/windows mod');
      if (!windhawkProjects.length) return;

      let cache = {};
      try {
        const cached = sessionStorage.getItem('windhawk_users_cache');
        if (cached) {
          cache = JSON.parse(cached);
        }
      } catch (e) {
        console.warn('[Projects] Failed to read Windhawk cache:', e);
      }

      let cacheUpdated = false;

      const userPromises = windhawkProjects.map(async (project) => {
        const modId = project.id;
        try {
          if (cache[modId] !== undefined) {
            const cachedData = cache[modId];
            const usersCount = typeof cachedData === 'object' ? cachedData.users : cachedData;
            const ratingVal = typeof cachedData === 'object' ? cachedData.rating : undefined;
            const ratingUsersVal = typeof cachedData === 'object' ? cachedData.ratingUsers : undefined;
            project.stats = { ...project.stats, users: usersCount };
            if (ratingVal !== undefined) project.stats.rating = ratingVal;
            if (ratingUsersVal !== undefined) project.stats.ratingUsers = ratingUsersVal;
            this.updateCardStats(project.id, project.stats);
            return;
          }

          const response = await fetch(window.location.origin + `/api/windhawk/users/${modId}`);
          if (response.ok) {
            const data = await response.json();
            if (data && (data.users >= 0 || typeof data === 'object')) {
              const usersCount = data.users !== undefined ? data.users : data;
              cache[modId] = data;
              cacheUpdated = true;
              project.stats = {
                ...project.stats,
                users: usersCount,
                rating: data.rating,
                ratingUsers: data.ratingUsers
              };
              this.updateCardStats(project.id, project.stats);
            }
          }
        } catch (e) {
          console.warn(`[Projects] Failed to fetch Windhawk users for ${project.title}:`, e);
        }
      });
      await Promise.all(userPromises);

      if (cacheUpdated) {
        try {
          sessionStorage.setItem('windhawk_users_cache', JSON.stringify(cache));
        } catch (e) {
          console.warn('[Projects] Failed to save Windhawk cache:', e);
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

      // Also update project detail overlay panel if open
      if (this.isDetailOpen && this.detailOverlay) {
        const detailStats = this.detailOverlay.querySelector('.project-detail-stats');
        if (detailStats && stats) {
          detailStats.innerHTML = this.createStats(stats);
        }
      }
    }

    // ============================================
    // FILTER & SEARCH LISTENERS
    // ============================================

    attachFilterListeners() {
      const searchInput = document.getElementById('projectsSearch');
      const clearBtn = document.getElementById('clearSearch');
      const filterBtns = document.querySelectorAll('.filter-btn');
      const filtersContainer = document.getElementById('projectsFilters');
      const navPrev = document.getElementById('filterNavPrev');
      const navNext = document.getElementById('filterNavNext');

      // 1. Initial Calculation of Category Count Badges
      this.updateCategoryCounts();

      // 2. Mouse-Wheel Horizontal Scroll Conversion for PC Users
      if (filtersContainer) {
        filtersContainer.addEventListener('wheel', (e) => {
          // If content overflows, convert vertical wheel scroll to horizontal scroll
          if (filtersContainer.scrollWidth > filtersContainer.clientWidth) {
            e.preventDefault();
            filtersContainer.scrollLeft += e.deltaY;
          }
        }, { passive: false });

        // Arrow Nav Visibility Handler
        const updateNavVisibility = () => {
          if (!navPrev || !navNext) return;
          const { scrollLeft, scrollWidth, clientWidth } = filtersContainer;
          navPrev.style.display = scrollLeft > 10 ? 'flex' : 'none';
          navNext.style.display = (scrollLeft + clientWidth < scrollWidth - 10) ? 'flex' : 'none';
        };

        filtersContainer.addEventListener('scroll', updateNavVisibility);
        window.addEventListener('resize', updateNavVisibility);
        updateNavVisibility();

        navPrev?.addEventListener('click', () => {
          filtersContainer.scrollBy({ left: -200, behavior: 'smooth' });
        });

        navNext?.addEventListener('click', () => {
          filtersContainer.scrollBy({ left: 200, behavior: 'smooth' });
        });
      }

      // 3. Keyboard Shortcut Listener: Press '/' to focus search
      document.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== searchInput) {
          const activeTag = document.activeElement?.tagName;
          if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
            e.preventDefault();
            searchInput?.focus();
          }
        }
      });

      // 4. Search Input Handling
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          if (this.isFeaturedMode) {
            this.expandAllProjects(false);
          }
          this.searchQuery = e.target.value.toLowerCase().trim();
          if (clearBtn) clearBtn.style.display = this.searchQuery ? 'flex' : 'none';
          this.updateGridWithAnimation();
        });
      }

      // 5. Clear Search Button
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          if (searchInput) {
            searchInput.value = '';
            this.searchQuery = '';
            clearBtn.style.display = 'none';
            this.updateGridWithAnimation();
            searchInput.focus();
          }
        });
      }

      // 6. Category Filter Buttons
      filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (this.isFeaturedMode) {
            this.expandAllProjects(false);
          }
          filterBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
          });

          const clickedBtn = e.currentTarget;
          clickedBtn.classList.add('active');
          clickedBtn.setAttribute('aria-selected', 'true');
          
          this.currentFilter = clickedBtn.getAttribute('data-filter');

          // Smoothly center the active pill in viewport on mobile horizontal scroll
          if (window.innerWidth < 1024) {
            clickedBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }

          this.updateGridWithAnimation();
        });
      });
    }

    // Dynamic Category Count Calculation
    updateCategoryCounts() {
      const counts = {
        'All': this.projects.length
      };

      this.projects.forEach(p => {
        let grps = [p.group];
        if (p.group === 'Aurora Ecosystem') grps.push('chrome/firefox extensions');
        if (p.id === 'windhawk-taskbar-ai-quota') grps.push('windhawk/windows mod');
        
        grps.forEach(g => {
          counts[g] = (counts[g] || 0) + 1;
        });
      });

      document.querySelectorAll('.filter-count').forEach(el => {
        const key = el.getAttribute('data-count-for');
        if (key && counts[key] !== undefined) {
          el.textContent = counts[key];
        } else {
          el.textContent = '0';
        }
      });
    }

    async updateGridWithAnimation() {
      // 1. Fade out current cards quickly
      if (typeof gsap !== 'undefined') {
        await gsap.to('.project-card, .projects-group-header, .no-results', { 
          opacity: 0, 
          y: 15, 
          scale: 0.97,
          duration: 0.18, 
          stagger: 0.02,
          ease: "power2.in"
        });
      }
      
      // 2. Re-render HTML with new filtered data
      this.renderCards();

      // 3. Re-initialize Vanilla JS Tilt effect on new cards
      this.initTilt();
      
      // 4. Force GSAP ScrollTrigger to recalculate layout heights
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }

      // 5. Fade new cards back in
      if (typeof gsap !== 'undefined') {
        gsap.fromTo('.project-card:not(.coming-soon-card), .projects-group-header', 
          { opacity: 0, y: 25, scale: 0.97 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.04, ease: "power3.out" }
        );
      }
    }

    // ============================================
    // FEATURED MODE: EXPAND IN PLACE
    // ============================================

    setupExpandButton() {
      const expandBtn = document.getElementById('projectsExpandBtn');
      const countEl = document.getElementById('expandProjectCount');
      if (!expandBtn) return;

      // Dynamically update the remaining project count
      const remainingCount = this.projects.length - this.FEATURED_IDS.length;
      if (countEl) {
        countEl.textContent = `${remainingCount}+`;
      }

      expandBtn.addEventListener('click', () => this.expandAllProjects(true));
    }

    async expandAllProjects(scrollToTop = false) {
      if (this.isExpanded) return;
      this.isExpanded = true;
      this.isFeaturedMode = false;

      const expandWrapper = document.getElementById('projectsExpandWrapper');

      // 1. Fade out the expand button
      if (typeof gsap !== 'undefined' && expandWrapper) {
        await gsap.to(expandWrapper, {
          opacity: 0,
          y: -10,
          duration: 0.3,
          ease: 'power2.in'
        });
        expandWrapper.remove();
      } else if (expandWrapper) {
        expandWrapper.remove();
      }

      // 2. Smooth scroll to top of projects section if requested
      if (scrollToTop) {
        const section = document.getElementById('projects-section');
        if (section) {
          if (window.lenis) {
            window.lenis.scrollTo(section, { duration: 1.2 });
          } else {
            section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }

      // 3. Re-render all projects (full mode)
      this.renderCards();
      this.initTilt();

      // 4. Animate the newly revealed project cards
      if (typeof gsap !== 'undefined') {
        const allCards = this.grid.querySelectorAll('.project-card, .projects-group-header');
        const newElements = Array.from(allCards);

        gsap.fromTo(newElements,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            stagger: 0.04,
            duration: 0.45,
            ease: 'power2.out',
            overwrite: true
          }
        );
      }

      // 5. Recalculate scroll heights
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }

    // ============================================
    // RENDERING
    // ============================================

    renderCards() {
      if (!this.grid) return;

      // 1. Apply Search and Filter
      let visibleProjects = this.projects.filter(p => {
        // In featured mode, only show the 3 flagship projects
        if (this.isFeaturedMode) {
          return this.FEATURED_IDS.includes(p.id);
        }

        // Match Filter
        let matchesFilter = false;
        if (this.currentFilter === 'All') {
          matchesFilter = true;
        } else if (this.currentFilter === 'chrome/firefox extensions') {
          matchesFilter = p.group === 'chrome/firefox extensions' || p.group === 'Aurora Ecosystem';
        } else if (this.currentFilter === 'windhawk/windows mod') {
          matchesFilter = p.group === 'windhawk/windows mod' || p.id === 'windhawk-taskbar-ai-quota';
        } else {
          matchesFilter = p.group === this.currentFilter;
        }
        
        // Match Search (Title or Description)
        const searchLower = this.searchQuery;
        const matchesSearch = !searchLower || 
                              p.title.toLowerCase().includes(searchLower) || 
                              p.shortDescription.toLowerCase().includes(searchLower);

        return matchesFilter && matchesSearch;
      });

      // In featured mode, maintain the specific order of FEATURED_IDS
      if (this.isFeaturedMode) {
        const idOrder = this.FEATURED_IDS;
        visibleProjects.sort((a, b) => idOrder.indexOf(a.id) - idOrder.indexOf(b.id));
      }

      if (visibleProjects.length === 0) {
        this.grid.innerHTML = `
          <div class="no-results">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.3; margin-bottom: 1rem;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <p>No projects found matching your criteria.</p>
          </div>
        `;
        return;
      }

      // 2. Group the VISIBLE projects instead of all projects
      const extensionProjects = visibleProjects.filter(p => p.group === 'chrome/firefox extensions');
      const websiteProjects = visibleProjects.filter(p => p.group === 'websites');
      const windhawkProjects = visibleProjects.filter(p => p.group === 'windhawk/windows mod');
      const jihawiProjects = visibleProjects.filter(p => p.group === 'Jihawi Apps');
      const sharedProjects = visibleProjects.filter(p => p.group === 'Aurora Ecosystem');
      const oneTimeCommitProjects = visibleProjects.filter(p => p.group === '1 time commit');
      const modDistributionProjects = visibleProjects.filter(p => p.group === 'Mod Distribution & Mirrors');

      const sortByFeatured = (arr) => [...arr].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

      let html = '';

      // In featured mode, render cards flat without group headers
      if (this.isFeaturedMode) {
        visibleProjects.forEach(project => html += this.createCard(project));
        this.grid.innerHTML = html;
        return;
      }

      // 1. chrome/firefox extensions
      if (extensionProjects.length > 0) {
        html += `<div class="projects-group-header subgroup-header"><span class="group-title">chrome/firefox extensions</span></div>`;
        sortByFeatured(extensionProjects).forEach(project => html += this.createCard(project));
      }

      // 2. websites
      if (websiteProjects.length > 0) {
        html += `<div class="projects-group-header subgroup-header"><span class="group-title">websites</span></div>`;
        sortByFeatured(websiteProjects).forEach(project => html += this.createCard(project));
      }

      // 3. windhawk/windows mod
      if (this.currentFilter === 'All' || this.currentFilter === 'windhawk/windows mod') {
        html += `<div class="projects-group-header subgroup-header"><span class="group-title"><span style="display: inline-block;">windhawk/</span><span style="display: inline-block;">windows</span> mod</span></div>`;
        if (windhawkProjects.length > 0) {
          sortByFeatured(windhawkProjects).forEach(project => html += this.createCard(project));
        } else if (this.searchQuery === '') {
          html += `<div class="project-card coming-soon-card" tabindex="-1" role="presentation"><div class="project-card-inner"><div class="project-face project-front no-image"><div class="project-overlay"></div><div class="project-content"><h3>Coming Soon</h3><p class="project-desc">A new project will be added here soon. Stay tuned!</p></div></div></div></div>`;
        }
      }

      // 4. Jihawi Projects
      if (jihawiProjects.length > 0) {
        html += `<div class="projects-group-header"><span class="group-title">Jihawi 2026</span></div>`;
        sortByFeatured(jihawiProjects).forEach(project => html += this.createCard(project));
      }

      // 5. Shared Projects
      if (sharedProjects.length > 0) {
        html += `<div class="projects-group-header"><span class="group-title">Shared Projects</span><span class="group-subtitle">with <a href="https://x.com/test_tm7873" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">@Test_tm7873</a></span></div>`;
        sortByFeatured(sharedProjects).forEach(project => html += this.createCard(project));
      }

      // 6. 1 Time Commits
      if (oneTimeCommitProjects.length > 0) {
        html += `<div class="projects-group-header"><span class="group-title">1 Time Commits</span></div>`;
        sortByFeatured(oneTimeCommitProjects).forEach(project => html += this.createCard(project));
      }

      // 7. Mod Distribution & Mirrors
      if (modDistributionProjects.length > 0) {
        html += `<div class="projects-group-header subgroup-header"><span class="group-title">Community Mirrors & Mod Distribution</span></div>`;
        sortByFeatured(modDistributionProjects).forEach(project => html += this.createCard(project));
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
      let html = '';
      if (links && links.length) {
        html = links.map((link, i) => {
          const icon = ICONS[link.kind] || ICONS.external;
          const isPrimary = i === 0 && link.kind === 'chrome';
          const isInternalSection = link.url && link.url.includes('#projects-section');
          const targetAttr = isInternalSection ? '' : 'target="_blank" rel="noopener noreferrer"';
          return `
            <a href="${link.url}"
               ${targetAttr}
               class="project-btn ${isPrimary ? 'primary' : ''}"
               onclick="event.stopPropagation()">
              ${icon}
              <span>${link.label}</span>
            </a>
          `;
        }).join('');
      }

      // Always append a direct contact action button in the detail modal
      html += `
        <button type="button" class="project-btn contact-project-btn" id="modalContactBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          <span>Get in Touch</span>
        </button>
      `;

      return html;
    }

    createStats(stats) {
      const ratingHtml = stats.rating
        ? `<span class="project-stat is-star">${ICONS.star} ${(stats.rating / 2).toFixed(1)} rating ${stats.ratingUsers ? `(${stats.ratingUsers})` : ''}</span>`
        : (stats.stars ? `<span class="project-stat is-star">${ICONS.star} ${stats.stars} stars</span>` : '');

      let userText = '';
      if (stats.usersText) {
        userText = stats.usersText;
      } else if (stats.users) {
        userText = `${stats.users} active users`;
      }

      return `
        <div class="project-stats">
          ${userText ? `<span class="project-stat">${ICONS.users} ${userText}</span>` : ''}
          ${stats.weeklyUsers ? `<span class="project-stat">${ICONS.users} ${stats.weeklyUsers} weekly</span>` : ''}
          ${stats.dailyUsers ? `<span class="project-stat">${ICONS.users} ${stats.dailyUsers} daily</span>` : ''}
          ${ratingHtml}
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

      // Delegate click on contact button inside detail overlay
      this.detailOverlay?.addEventListener('click', (e) => {
        const contactBtn = e.target.closest('#modalContactBtn');
        if (contactBtn) {
          e.preventDefault();
          e.stopPropagation();

          // 1. Close overlay
          this.closeDetail();

          // 2. Smooth-scroll to contact section on homepage
          setTimeout(() => {
            const contactSection = document.getElementById('contact-support');
            if (contactSection) {
              if (window.lenis) {
                window.lenis.scrollTo(contactSection, { duration: 1.2 });
              } else {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }, 380);
        }
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
        if (card.dataset.tiltBound) return;
        card.dataset.tiltBound = 'true';

        let rect = null;

        card.addEventListener('mouseenter', () => {
          rect = card.getBoundingClientRect();
        });

        card.addEventListener('mousemove', (e) => {
          if (!rect) rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          const isFeatured = card.classList.contains('featured');
          // Scale maxTilt down for wide featured cards so visual pixel displacement matches regular cards
          const maxTilt = isFeatured ? 1.5 : 3.5;
          const scaleAmount = isFeatured ? 1.008 : 1.015;

          const xRotate = (maxTilt * ((y - rect.height / 2) / (rect.height / 2)));
          const yRotate = (-maxTilt * ((x - rect.width / 2) / (rect.width / 2)));

          if (typeof gsap !== 'undefined') {
            gsap.to(card, {
              rotationX: xRotate,
              rotationY: yRotate,
              scale: scaleAmount,
              duration: 0.25,
              ease: 'power1.out',
              overwrite: 'auto'
            });
          }
        });

        card.addEventListener('mouseleave', () => {
          rect = null;
          if (typeof gsap !== 'undefined') {
            gsap.to(card, {
              rotationX: 0,
              rotationY: 0,
              scale: 1,
              duration: 0.5,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          }
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
