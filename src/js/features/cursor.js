/**
 * Custom Cursor Logic
 * Performance optimized with requestAnimationFrame
 */
export function initCustomCursor() {
  const cursor = document.getElementById('custom-cursor');
  if (cursor) cursor.setAttribute('aria-hidden', 'true');
  if (!cursor || 'ontouchstart' in window || navigator.maxTouchPoints > 0) {
    if (cursor) cursor.style.display = 'none';
    return;
  }

  document.body.classList.add('custom-cursor-active');

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let isAnimating = false;

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isAnimating) {
      isAnimating = true;
      animateCursor();
    }
  });

  function animateCursor() {
    // Smooth interpolation
    const distX = mouseX - cursorX;
    const distY = mouseY - cursorY;

    // Optimization: Stop the RAF loop when the cursor catches up to the mouse
    if (Math.abs(distX) < 0.1 && Math.abs(distY) < 0.1) {
      isAnimating = false;
      cursorX = mouseX;
      cursorY = mouseY;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      cursor.style.transform = `translate(-50%, -50%) scale(1)`;
      return;
    }

    cursorX += distX * 0.15;
    cursorY += distY * 0.15;

    cursor.style.left = cursorX + 'px';
    cursor.style.top = cursorY + 'px';

    // Velocity-based scaling (stretch effect)
    const vel = Math.sqrt(distX * distX + distY * distY);
    const scale = 1 + Math.min(vel / 500, 0.5); // Max scale 1.5x

    cursor.style.transform = `translate(-50%, -50%) scale(${scale})`;

    requestAnimationFrame(animateCursor);
  }

  // Event delegation for hover effects (handles dynamic elements like Spotify widget)
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('a, button, .social-icon, .profile-effect-container, .project-card, .project-btn')) {
      cursor.classList.add('hovering');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('a, button, .social-icon, .profile-effect-container, .project-card, .project-btn')) {
      cursor.classList.remove('hovering');
    }
  });
}
