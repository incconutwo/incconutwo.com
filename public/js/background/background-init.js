/**
 * Background Initialization Script
 * Initializes the WebGL liquid gradient with Scheme 5
 */

function initBackgroundApp() {
  const container = document.getElementById('webgl-background');
  if (!container || window.gradientApp) return;

  const app = new LiquidGradientApp(container);

  if (app.gradientBackground) {
    app.setColorScheme(5);
  }

  window.gradientApp = app;
}