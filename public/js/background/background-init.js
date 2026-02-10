/**
 * Background Initialization Script
 * Initializes the WebGL liquid gradient with Scheme 5
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('webgl-background') || document.body;
  const app = new LiquidGradientApp(container);

  if (app.gradientBackground) {
    app.setColorScheme(5);
  }

  window.gradientApp = app;
});
