/**
 * ============================================
 * PROJECTS PAGE - Interactive Card Grid
 * Handles data loading, card rendering, and animations
 * ============================================
 */

(function() {
  'use strict';

  // SVG Icons
  const ICONS = {
    chrome: `<svg viewBox="0 0 24 24"><path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-3.952 6.848c.404.036.812.058 1.229.058 6.627 0 12-5.373 12-12 0-1.5-.276-2.938-.778-4.267H15.27zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728z"/></svg>`,
    github: `<svg viewBox="0 0 24 24"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>`,
    external: `<svg viewBox="0 0 24 24"><path d="M14 3v2h3.59l-9.3 9.29 1.42 1.42L19 6.41V10h2V3h-7zM5 5v14h14v-7h-2v5H7V7h5V5H5z"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
    users: `<svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    star: `<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
  };

  // Fallback data if fetch fails
  const FALLBACK_PROJECTS = [
    {
      id: "twitter-flags",
      featured: true,
      title: "X/Twitter Country Flags & Blocker",
      shortDescription: "My biggest project yet — with 900 weekly users and 250 daily active users.",
      longDescription: "The X/Twitter Country Flags & Blocker is a browser extension that automatically displays a country flag next to each Twitter/X user's name, based on the language they use on their profile.",
      links: [
        {label: "Chrome Store", url: "https://chromewebstore.google.com/detail/xtwitter-country-flags-bl/nodnkmpfejpccmenahifhgakljbepapn", kind: "chrome"},
        {label: "GitHub", url: "https://github.com/incconutwo/X-Twitter-Country-Flags-Blocker", kind: "github"}
      ],
      stats: {weeklyUsers: 900, dailyUsers: 250},
      image: "assets/images/projects/twitter-flags.webp"
    },
    {
      id: "gemini-cleaner",
      featured: false,
      title: "gemini-cleaner",
      shortDescription: "Hide \"Upgrade to Ultra\" ads and banners on Gemini for a cleaner AI experience.",
      longDescription: "Gemini Cleaner is a lightweight browser extension designed to optimize your Google Gemini experience by removing intrusive 'Upgrade to Ultra' banners and promotional ads, leaving you with a distraction-free AI interface.",
      links: [
        {label: "GitHub", url: "https://github.com/incconutwo/gemini-cleaner", kind: "github"}
      ],
      stats: null,
      image: "assets/images/projects/gemini-cleaner.png"
    }
  ];

  class ProjectsPage {
    constructor() {
      this.grid = document.getElementById('projectsGrid');
      this.projects = [];
      this.init();
    }

    async init() {
      await this.loadProjects();
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
        const response = await fetch(window.location.origin + '/data/projects.json');
        if (!response.ok) throw new Error('Failed to load');
        this.projects = await response.json();
      } catch (e) {
        console.warn('[Projects] Using fallback data:', e);
        this.projects = FALLBACK_PROJECTS;
      }
    }

    /**
     * NEW: Premium Staggered Entrance Animation
     * Uses ScrollTrigger batching with a heavier elastic feel
     */
    animateEntrance() {
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

      // Ensure ScrollTrigger sees new DOM
      ScrollTrigger.refresh();

      // Set Initial State: Tilted down, scaled down, transparent
      gsap.set(".project-card", {
        y: 100,
        opacity: 0,
        scale: 0.85,
        rotationX: 10,
        transformPerspective: 1000
      });

      // Batch Animation
      ScrollTrigger.batch(".project-card", {
        start: "top 90%",
        end: "bottom 10%",

        onEnter: batch => gsap.to(batch, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          stagger: 0.15, // Slightly slower stagger for weight
          duration: 1.2,
          ease: "elastic.out(1, 0.6)", // Heavier bounce than activities
          overwrite: true
        }),

        onLeave: batch => gsap.to(batch, {
          opacity: 0,
          y: -60, // Float up when leaving top
          scale: 0.9,
          duration: 0.6,
          ease: "power2.in",
          overwrite: true
        }),

        onEnterBack: batch => gsap.to(batch, {
          opacity: 1,
          y: 0,
          scale: 1,
          rotationX: 0,
          stagger: 0.1,
          duration: 1,
          ease: "elastic.out(1, 0.6)",
          overwrite: true
        }),

        onLeaveBack: batch => gsap.to(batch, {
          opacity: 0,
          y: 60, // Drop down when leaving bottom
          scale: 0.9,
          duration: 0.6,
          ease: "power2.in",
          overwrite: true
        })
      });
    }

    async fetchGitHubStars() {
      const starPromises = this.projects.map(async (project) => {
        const githubLink = project.links?.find(l => l.kind === 'github' || l.url.includes('github.com'));

        if (githubLink) {
          try {
            const match = githubLink.url.match(/github\.com\/([^/]+)\/([^/]+)/);
            if (match && match.length >= 3) {
              const [_, owner, repo] = match;
              const response = await fetch(window.location.origin + `/api/github/stars/${owner}/${repo}`);

              if (response.ok) {
                const data = await response.json();
                if (data.stars > 0) {
                  project.stats = {
                    ...project.stats,
                    stars: data.stars
                  };
                  // Re-render specifically just this card's stats to avoid full re-render
                  this.updateCardStats(project.id, project.stats);
                }
              }
            }
          } catch (e) {
            console.warn(`[Projects] Failed to fetch stars for ${project.title}:`, e);
          }
        }
      });

      await Promise.all(starPromises);
    }

    // Helper to update stats without killing animation state
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

    renderCards() {
      if (!this.grid) return;

      const sorted = [...this.projects].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

      let html = '';
      let auroraHeaderAdded = false;

      sorted.forEach(project => {
        if (project.id.startsWith('aurora-') && !auroraHeaderAdded) {
          html += `
            <div class="projects-group-header">
              <span class="group-title">Shared Projects</span>
              <span class="group-subtitle">with <a href="https://x.com/test_tm7873" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">@Test_tm7873</a></span>
            </div>
          `;
          auroraHeaderAdded = true;
        }
        html += this.createCard(project);
      });

      this.grid.innerHTML = html;
    }

    createCard(project) {
      const { id, featured, title, shortDescription, longDescription, links, stats, image, stamp } = project;

      const buttonsHtml = this.createButtons(links);
      const statsHtml = stats ? this.createStats(stats) : '';
      const hasImage = image ? `style="--bg:url('${image}')"` : '';
      const noImageClass = image ? '' : 'no-image';
      const stampHtml = stamp ? `<div class="project-stamp">${stamp}</div>` : '';

      return `
        <div class="project-card ${featured ? 'featured' : ''}" 
             data-id="${id}" 
             data-tilt
             tabindex="0"
             role="button"
             aria-pressed="false"
             aria-label="View details for ${title}">
          <div class="project-card-inner">
            <div class="project-face project-front ${noImageClass}" ${hasImage}>
              <div class="project-overlay"></div>
              ${stampHtml}
              <div class="project-hint">Click for details</div>
              <div class="project-content">
                ${statsHtml}
                <h3>${title}</h3>
                <p class="project-desc">${shortDescription}</p>
                <div class="project-buttons">${buttonsHtml}</div>
              </div>
            </div>
            <div class="project-face project-back ${noImageClass}" ${hasImage}>
              <div class="project-overlay"></div>
              <div class="project-hint">Click to go back</div>
              <div class="project-content">
                <h3>${title}</h3>
                <p class="project-desc long">${longDescription}</p>
                <div class="project-buttons">${buttonsHtml}</div>
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

    attachEventListeners() {
      this.grid?.addEventListener('click', (e) => {
        const card = e.target.closest('.project-card');
        if (!card) return;
        if (e.target.closest('.project-btn')) return;
        this.toggleFlip(card);
      });

      this.grid?.addEventListener('keydown', (e) => {
        const card = e.target.closest('.project-card');
        if (!card) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleFlip(card);
        }
        if (e.key === 'Escape' && card.classList.contains('is-flipped')) {
          this.toggleFlip(card, false);
        }
      });
    }

    toggleFlip(card, force) {
      const shouldFlip = force !== undefined ? force : !card.classList.contains('is-flipped');
      card.classList.toggle('is-flipped', shouldFlip);
      card.setAttribute('aria-pressed', shouldFlip);
      const id = card.dataset.id;
      if (shouldFlip) {
        history.replaceState(null, '', `#${id}`);
      } else if (location.hash === `#${id}`) {
        history.replaceState(null, '', location.pathname);
      }
    }

    handleDeepLink() {
      const hash = location.hash.slice(1);
      if (!hash) return;
      const card = this.grid?.querySelector(`[data-id="${hash}"]`);
      if (card) {
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          this.toggleFlip(card, true);
        }, 300);
      }
    }

    initTilt() {
      if ('ontouchstart' in window ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const cards = document.querySelectorAll('.project-card[data-tilt]');

      cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const multiplier = 5;
          const xRotate = (multiplier * ((y - rect.height / 2) / rect.height));
          const yRotate = -(multiplier * ((x - rect.width / 2) / rect.width));

          card.style.transform = `perspective(1200px) rotateX(${xRotate}deg) rotateY(${yRotate}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            rotationX: 0,
            rotationY: 0,
            scale: 1,
            duration: 0.5,
            ease: "power2.out"
          });
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    new ProjectsPage();
  });
})();
