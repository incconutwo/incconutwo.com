/**
 * Main JavaScript Entry Point (Bootstrapper)
 * Orchestrates staggered progressive boots of modular feature sets
 */

// 1. Import dynamic features
import { initSmoothScroll } from './features/smooth-scroll.js';
import { initCustomCursor } from './features/cursor.js';
import { initHackerScramble } from './features/scramble.js';
import { initSpotifyWidget, initHeartRateWidget, initLichessStats, initSteamWidget } from './features/widgets.js';

import { initSocialLedger, initNotificationForm } from './features/social.js';
import { initClipboardCopy } from './features/clipboard.js';

// 2. Import layouts & scroll animations
import {
  initBackgroundFade,
  initTextReveal,
  initGlobalTitleAnimations,
  initAboutMeAnimations,
  initActivitiesAnimations,
  initInspiration,
  initContactSupportAnimations,
  initScrubber,
  initMagneticButtons
} from './animations/reveal.js';

// Consolidated Application Bootstrap orchestrator
class ApplicationBootstrap {
  static init() {
    // A. Interactive UI & cursor setup (Immediate, layout-independent)
    initCustomCursor();
    initClickExplosions();
    initNotificationForm();
    initClipboardCopy();

    // B. Staggered Progressive Boot to eliminate Long Tasks (TBT)
    const runBootTasks = (offset = 0) => {
      // Task 1: Start WebGL Background & Smooth Scrolling
      setTimeout(() => {
        if (typeof initBackgroundApp === 'function') {
          initBackgroundApp();
        }
        initSmoothScroll();
      }, 50);

      // Task 2: Core visible hero animations
      setTimeout(() => {
        initBackgroundFade();
        initTextReveal();
        initGlobalTitleAnimations();
      }, offset + 150);

      // Task 3: Secondary page reveals
      setTimeout(() => {
        initAboutMeAnimations();
        initActivitiesAnimations();
      }, offset + 300);

      // Task 4: Remaining elements & ledger triggers
      setTimeout(() => {
        initSocialLedger();
        initInspiration();
      }, offset + 450);

      // Task 5: Interactive controls & footer
      setTimeout(() => {
        initContactSupportAnimations();
        initScrubber();
        initMagneticButtons();
      }, offset + 600);
    };

    // C. Finalize Initial Load State & Staggered Animations
    if (window.appInitializedBefore) {
      document.body.classList.add('loaded');
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.style.display = 'none';
      }
      initHackerScramble();
      runBootTasks(0);
    } else {
      window.appInitializedBefore = true;
      const handleInitialLoad = () => {
        runBootTasks(800); // Shift staggered animations by 800ms to align with curtain rise
        setTimeout(() => {
          document.body.classList.add('loaded');
          initHackerScramble();
        }, 800);
      };

      if (document.readyState === 'complete') {
        handleInitialLoad();
      } else {
        window.addEventListener('load', handleInitialLoad);
      }
    }

    // D. Defer Network/API Heavy Lifting until assets finish loading
    const runDeferredTasks = () => {
      setTimeout(() => {
        initSpotifyWidget();
        initLichessStats();
        initSteamWidget();
      }, 2000);
    };


    if (document.readyState === 'complete') {
      // Shorter timeout on page navigation since page is already loaded
      setTimeout(runDeferredTasks, 200);
    } else {
      window.addEventListener('load', runDeferredTasks);
    }
  }
}

// Single Entry Point
const startApp = () => {
  if (document.body.dataset.appInitialized) return;
  document.body.dataset.appInitialized = 'true';
  ApplicationBootstrap.init();
};

document.addEventListener('DOMContentLoaded', startApp);
document.addEventListener('astro:page-load', startApp);

if (document.readyState !== 'loading') {
  startApp();
}