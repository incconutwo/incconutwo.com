/**
 * Background Initialization Script
 * Initializes the WebGL liquid gradient with Scheme 5
 */

function initBackgroundApp() {
  const container = document.getElementById('webgl-background');
  if (!container) return;

  if (window.gradientApp) {
    if (typeof window.gradientApp.destroy === 'function') {
      window.gradientApp.destroy();
    }
    window.gradientApp = null;
  }

  const app = new LiquidGradientApp(container);

  if (app.gradientBackground) {
    app.setColorScheme(5);
  }

  window.gradientApp = app;
}

window.initBackgroundApp = initBackgroundApp;