import { WidgetPoller } from '../utils/poller.js';

/**
 * Spotify Widget Logic
 * Polls the backend for current track info
 * Optimized: Pauses polling when tab is inactive to save resources
 */
export function initSpotifyWidget() {
  const offlineState = document.getElementById('spotify-offline');
  const liveState = document.getElementById('spotify-live');

  let lastAlbumArt = null;

  function extractAverageColor(imgElement) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const sampleSize = 10;
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      ctx.drawImage(imgElement, 0, 0, sampleSize, sampleSize);

      const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

      let bestColor = null;
      let maxVibrancy = -1;

      let rSum = 0, gSum = 0, bSum = 0, count = 0;

      for (let i = 0; i < imgData.length; i += 4) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        if (a < 200) continue;

        rSum += r;
        gSum += g;
        bSum += b;
        count++;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const vibrancy = max - min;
        const brightness = (r + g + b) / 3;

        // Skip extremely dark (near black) or extremely bright (near white) colors
        if (brightness < 30 || brightness > 235) continue;

        if (vibrancy > maxVibrancy) {
          maxVibrancy = vibrancy;
          bestColor = { r, g, b };
        }
      }

      // If we found a color with a decent amount of saturation/vibrancy, use it!
      if (bestColor && maxVibrancy > 30) {
        return bestColor;
      }

      // Fallback to average color if the image is mostly gray/monochrome
      if (count > 0) {
        return {
          r: Math.round(rSum / count),
          g: Math.round(gSum / count),
          b: Math.round(bSum / count)
        };
      }

      return null;
    } catch (e) {
      console.warn('[Spotify Widget] Color extraction failed:', e);
      return null;
    }
  }

  // Elements to update
  const elArt = document.getElementById('spotify-art');
  const elTrack = document.getElementById('spotify-track');
  const elArtist = document.getElementById('spotify-artist');
  const elStatusIcon = document.querySelector('.spotify-status-text');

  // Floating widgets
  const fmwWidget = document.getElementById('fmw-widget');
  const fmwToggle = document.getElementById('fmw-toggle');
  const fmwLink = document.getElementById('fmw-link');
  const fmwArt = document.getElementById('fmw-art');
  const fmwTrack = document.getElementById('fmw-track');
  const fmwArtist = document.getElementById('fmw-artist');

  // Floating widget toggle listener
  if (fmwToggle && fmwWidget) {
    fmwToggle.addEventListener('click', () => {
      fmwWidget.classList.toggle('retracted');
    });
  }

  // Prevent scroll wheel and touchmove events from bubbling to Lenis/page scroll
  const topTracksList = document.getElementById('spotify-top-tracks-list');
  if (topTracksList) {
    topTracksList.addEventListener('wheel', (e) => {
      e.stopPropagation();
    }, { passive: true });
    topTracksList.addEventListener('touchmove', (e) => {
      e.stopPropagation();
    }, { passive: true });
  }
  let topTracksCached = null;

  async function fetchTopTracks() {
    try {
      const response = await fetch(window.location.origin + '/api/spotify/top-tracks');
      if (response.ok) {
        topTracksCached = await response.json();
        renderTopTracks();
      }
    } catch (e) {
      console.warn('🎵 Top Tracks error:', e.message || e);
    }
  }

  function renderTopTracks() {
    const listEl = document.getElementById('spotify-top-tracks-list');
    if (!listEl || !topTracksCached) return;

    const tracksToRender = topTracksCached;
    listEl.innerHTML = tracksToRender.map(track => `
      <a href="${track.url || '#'}" target="_blank" class="top-track-row" rel="noopener noreferrer">
        <img src="${track.albumArt || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}" alt="${track.name}" class="top-track-art">
        <div class="top-track-info">
          <span class="top-track-name">${track.name}</span>
          <span class="top-track-artist">${track.artist}</span>
        </div>
      </a>
    `).join('');
  }

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

      const spotifyCard = document.getElementById('spotify-card');

      if (data.track && data.isPlaying) {
        // --- HAS TRACK DATA AND ACTIVELY PLAYING ---
        if (spotifyCard) spotifyCard.classList.remove('is-offline');
        if (offlineState) offlineState.style.display = 'none';

        if (liveState) {
          liveState.style.display = 'flex';
          // Fix: Prevent synchronous layout reflow
          requestAnimationFrame(() => {
            liveState.classList.add('active');
          });
          liveState.href = data.spotifyUrl;
        }

        if (elArt && data.albumArt) {
          if (lastAlbumArt !== data.albumArt) {
            lastAlbumArt = data.albumArt;
            elArt.crossOrigin = "Anonymous";
            elArt.src = data.albumArt;
            elArt.onload = () => {
              try {
                const color = extractAverageColor(elArt);
                if (color && window.gradientApp && typeof window.gradientApp.setDynamicSpotifyColor === 'function') {
                  window.gradientApp.setDynamicSpotifyColor(color.r, color.g, color.b);
                }
              } catch (err) {
                console.warn('[Spotify Widget] Error extracting color:', err);
              }
            };
          }
        }
        if (elTrack) elTrack.textContent = data.track;
        if (elArtist) elArtist.textContent = data.artist;

        if (elStatusIcon) {
          elStatusIcon.textContent = 'Now Playing';
        }

        // Update floating widget
        if (fmwWidget) {
          fmwWidget.classList.add('visible');
          if (fmwLink) fmwLink.href = data.spotifyUrl;
          if (fmwArt && data.albumArt) fmwArt.src = data.albumArt;
          if (fmwTrack) fmwTrack.textContent = data.track;
          if (fmwArtist) fmwArtist.textContent = data.artist;
        }

      } else {
        // --- OFFLINE OR NOT PLAYING ---
        if (spotifyCard) spotifyCard.classList.add('is-offline');
        if (liveState) {
          liveState.classList.remove('active');
          liveState.style.display = 'none';
        }

        if (offlineState) offlineState.style.display = 'flex';

        if (elStatusIcon) {
          elStatusIcon.textContent = 'No Music is Playing';
        }

        if (fmwWidget) {
          fmwWidget.classList.remove('visible');
        }

        if (lastAlbumArt !== null) {
          lastAlbumArt = null;
          if (window.gradientApp && typeof window.gradientApp.setColorScheme === 'function') {
            window.gradientApp.setColorScheme(5); // Reset back to default Scheme 5
          }
        }
      }

    } catch (error) {
      console.warn('🎵 Music Widget Error:', error.message || error);
      const spotifyCard = document.getElementById('spotify-card');
      if (spotifyCard) spotifyCard.classList.add('is-offline');
      if (liveState) liveState.style.display = 'none';
      if (offlineState) offlineState.style.display = 'flex';
      if (lastAlbumArt !== null) {
        lastAlbumArt = null;
        if (window.gradientApp && typeof window.gradientApp.setColorScheme === 'function') {
          window.gradientApp.setColorScheme(5);
        }
      }
    }
  }

  const poller = new WidgetPoller(updateWidget, 15000);
  poller.start();
  fetchTopTracks();
}

/**
 * Heart Rate Widget Logic
 * Polls the Cloudflare Workers API for live heart rate
 * Only displays the widget if actively updated (within 5 minutes)
 */
export function initHeartRateWidget() {
  const widgetEl = document.getElementById('fhr-widget');
  const toggleEl = document.getElementById('fhr-toggle');
  const iconEl = document.getElementById('fhr-icon');
  const bpmEl = document.getElementById('fhr-bpm');
  const metaEl = document.getElementById('fhr-meta');

  if (toggleEl && widgetEl) {
    toggleEl.addEventListener('click', () => {
      widgetEl.classList.toggle('retracted');
    });
  }

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
 * Lichess Stats Widget
 * Fetches stats via backend proxy to hide the username from search engines and AI crawlers
 */
export async function initLichessStats() {
  const blitzEl = document.getElementById('lichess-blitz');
  const rapidEl = document.getElementById('lichess-rapid');
  const gamesEl = document.getElementById('lichess-games-count');

  if (!blitzEl || !rapidEl || !gamesEl) return;

  const CACHE_KEY = 'lichess_stats_cache_v2';
  const CACHE_TIME_KEY = 'lichess_stats_cache_time_v2';
  const ONE_HOUR = 60 * 60 * 1000;

  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

  const renderStats = (data) => {
    blitzEl.textContent = data.blitz || '-';
    rapidEl.textContent = data.rapid || '-';
    gamesEl.textContent = (data.games || 0).toLocaleString();
  };

  // Serve from cache if valid
  if (cachedData && cachedTime && (Date.now() - cachedTime < ONE_HOUR)) {
    try {
      renderStats(JSON.parse(cachedData));
      return;
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  try {
    const response = await fetch(window.location.origin + '/api/lichess/stats');
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
      renderStats(data);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn('♟️ Lichess Stats Widget Error:', error.message || error);
    if (cachedData) {
      try {
        renderStats(JSON.parse(cachedData));
      } catch (e) { }
    }
  }
}

/**
 * Steam Status Widget
 * Fetches status via backend proxy to hide the username from search engines and AI crawlers
 */
export async function initSteamWidget() {
  const cardEl = document.getElementById('steam-card');
  const statusEl = document.getElementById('steam-status');
  const gameEl = document.getElementById('steam-game');
  const iconEl = document.getElementById('steam-icon');

  if (!cardEl || !statusEl || !gameEl) return;

  const CACHE_KEY = 'steam_status_cache';
  const CACHE_TIME_KEY = 'steam_status_cache_time';
  const FIVE_MINUTES = 5 * 60 * 1000;

  const renderStatus = (data) => {
    // 1. Reset classes
    statusEl.className = 'steam-badge';
    cardEl.classList.remove('in-game-active');

    // 2. Set Status Badge
    statusEl.textContent = data.status || 'Offline';
    if (data.status === 'In-Game' || data.isPlaying) {
      statusEl.classList.add('in-game');
      cardEl.classList.add('in-game-active');
      gameEl.innerHTML = `<span style="color:#66c0f4; font-weight:700;">Playing ${data.game}</span>`;
    } else if (data.status === 'Online') {
      statusEl.classList.add('online');
      gameEl.textContent = `Online - Last played: ${data.game}`;
    } else {
      statusEl.classList.add('offline');
      gameEl.textContent = `Offline - Last played: ${data.game}`;
    }

    // 3. Playtime info
    if (data.playtime && !data.isPlaying) {
      gameEl.textContent += ` (${data.playtime})`;
    }
  };

  const cachedData = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

  // Serve from cache if valid
  if (cachedData && cachedTime && (Date.now() - cachedTime < FIVE_MINUTES)) {
    try {
      renderStatus(JSON.parse(cachedData));
      return;
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  async function fetchStatus() {
    try {
      const response = await fetch(window.location.origin + '/api/steam/status');
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        renderStatus(data);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('🎮 Steam Status Widget Error:', error.message || error);
      if (cachedData) {
        try {
          renderStatus(JSON.parse(cachedData));
        } catch (e) { }
      }
    }
  }

  // Poll steam status every 30 seconds
  const poller = new WidgetPoller(fetchStatus, 30000);
  poller.start();
  fetchStatus();
}

