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

  let prevX = 0;
  let prevY = 0;
  let currentScale = 1;
  let targetScale = 1;
  let animFrameId = null;

  function updateScale() {
    currentScale += (targetScale - currentScale) * 0.2;
    cursor.style.transform = `translate(-50%, -50%) scale(${currentScale.toFixed(3)})`;

    // Gradually decay target scale back to 1 when mouse slows down or stops
    targetScale += (1 - targetScale) * 0.15;

    if (Math.abs(currentScale - 1) > 0.005 || Math.abs(targetScale - 1) > 0.005) {
      animFrameId = requestAnimationFrame(updateScale);
    } else {
      currentScale = 1;
      targetScale = 1;
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      animFrameId = null;
    }
  }

  // Instant 1:1 positioning (0ms lag) + velocity scaling on move/shake
  document.addEventListener('mousemove', (e) => {
    // 1. Position snaps 1:1 instantly with zero lag
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';

    // 2. Velocity scaling calculation for shake/fast movement
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    const dist = Math.hypot(dx, dy);
    prevX = e.clientX;
    prevY = e.clientY;

    const speedScale = 1 + Math.min(dist / 30, 0.6); // Scale up to 1.6x on fast movement/shake
    if (speedScale > targetScale) {
      targetScale = speedScale;
    }

    if (!animFrameId) {
      animFrameId = requestAnimationFrame(updateScale);
    }
  });

  // Hover states stay active
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
