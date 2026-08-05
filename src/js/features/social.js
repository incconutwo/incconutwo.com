/**
 * Handles the Connect Section Interactions, Private Vault Scramble, and Form Notifications
 */
export function initSocialLedger() {
  const items = document.querySelectorAll('.ledger-item');
  const vault = document.getElementById('private-trigger');

  if (items.length === 0) return;

  // Request DeviceOrientation permission on iOS
  if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    const requestPermission = () => {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.removeEventListener('click', requestPermission);
            window.removeEventListener('touchstart', requestPermission);
          }
        })
        .catch(console.error);
    };
    window.addEventListener('click', requestPermission, { once: true });
    window.addEventListener('touchstart', requestPermission, { once: true });
  }

  // Entrance Animation (ScrollTrigger)
  gsap.from(".ledger-item", {
    scrollTrigger: {
      trigger: ".social-ledger",
      start: "top 85%",
      toggleActions: "play none none reverse"
    },
    borderBottomColor: "rgba(255,255,255,0)",
    x: -50,
    opacity: 0,
    stagger: 0.1,
    duration: 1,
    ease: "power3.out"
  });

  // 1. Social Ledger Interaction Logic
  items.forEach(item => {
    const name = item.querySelector('.ledger-name');
    const status = item.querySelector('.ledger-status');
    const color = item.getAttribute('data-color');
    const bg = item.querySelector('.ledger-bg');
    let rect = null;

    const activate = () => {
      rect = item.getBoundingClientRect();
      item.classList.add('active');
      gsap.to(item, { color: color, duration: 0.3 });
      gsap.to(bg, { backgroundColor: color, duration: 0 });
    };

    const deactivate = () => {
      rect = null;
      item.classList.remove('active');
      gsap.to(item, { color: '#ffffff', duration: 0.3 });

      // Snap back with bounce
      gsap.to([name, status], {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)"
      });
    };

    // Pre-calculate GSAP quickTo setters for massive performance boost
    const xNameTo = gsap.quickTo(name, "x", { duration: 0.5, ease: "power3.out" });
    const yNameTo = gsap.quickTo(name, "y", { duration: 0.5, ease: "power3.out" });
    const xStatusTo = gsap.quickTo(status, "x", { duration: 0.5, ease: "power3.out" });
    const yStatusTo = gsap.quickTo(status, "y", { duration: 0.5, ease: "power3.out" });

    // Magnetic Move on MouseMove
    item.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= 768) return; // Skip on mobile for perf

      if (!rect) rect = item.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xCent = x - (rect.width / 2);
      const yCent = y - (rect.height / 2);

      xNameTo(xCent * 0.1);
      yNameTo(yCent * 0.2);
      xStatusTo(xCent * 0.05);
      yStatusTo(yCent * 0.1);
    });

    item.addEventListener('mouseenter', activate);
    item.addEventListener('mouseleave', deactivate);

    // 2. Mobile-Only Scroll Selection
    if (window.innerWidth <= 768) {
      ScrollTrigger.create({
        trigger: item,
        start: "top center",
        end: "bottom center",
        onEnter: activate,
        onEnterBack: activate,
        onLeave: deactivate,
        onLeaveBack: deactivate
      });
    }

    // 3. Mobile Gyroscope Move (Only for highlighted active item)
    const handleOrientation = (e) => {
      if (window.innerWidth > 991 && window.innerWidth > 768) return; // Keep inline with mobile breakpoint check
      if (!item.classList.contains('active')) return;

      // e.gamma is left/right roll, e.beta is front/back pitch
      let tiltX = e.gamma;
      let tiltY = e.beta;

      // Validate sensor values are present
      if (tiltX === null || tiltY === null || typeof tiltX === 'undefined' || typeof tiltY === 'undefined') {
        return;
      }

      // Calibrate tilt relative to standard viewing tilt (around 45 degrees upright)
      tiltY = tiltY - 45;

      // Clamp values to [-15, 15] for subtle displacement
      tiltX = Math.max(-15, Math.min(15, tiltX));
      tiltY = Math.max(-15, Math.min(15, tiltY));

      // Apply displacement (multipliers match PC scale/feel)
      xNameTo(tiltX * 0.8);
      yNameTo(tiltY * 1.2);
      xStatusTo(tiltX * 0.4);
      yStatusTo(tiltY * 0.6);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientationabsolute', handleOrientation);
  });

  // 3. Private Vault Security Scan Logic
  if (vault) {
    const originalTextSpan = vault.querySelector('.vault-text-original');
    const glitchTextSpan = vault.querySelector('.vault-text-glitch');
    const originalText = originalTextSpan.innerText;
    const targetText = "ACCESS DENIED";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*";
    let interval = null;

    const scrambleText = (target, text) => {
      let iteration = 0;
      clearInterval(interval);

      interval = setInterval(() => {
        target.innerText = text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return text[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3;
      }, 30);
    };

    // Scramble original text on entrance
    vault.addEventListener('mouseenter', () => {
      scrambleText(originalTextSpan, originalText);
      // Scramble glitch text so it's ready/active
      scrambleText(glitchTextSpan, targetText);
    });

    vault.addEventListener('click', () => {
      // Re-trigger scramble for punch
      scrambleText(glitchTextSpan, targetText);

      vault.style.animation = 'none';
      vault.offsetHeight; // trigger reflow
      vault.style.animation = null;
    });
  }
}

/**
 * Handle inline notification form for Support section
 */
export function initNotificationForm() {
  const container = document.getElementById('notification-form-container');
  const textarea = document.getElementById('notification-msg');
  const sendBtn = document.getElementById('notify-send-btn');
  const status = document.getElementById('notify-status-text');

  if (!container || !textarea || !sendBtn || !status) return;

  sendBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const msg = textarea.value.trim();
    if (!msg) {
      status.className = 'notify-status error';
      status.textContent = 'Please enter a message.';
      return;
    }

    sendBtn.disabled = true;
    status.className = 'notify-status info';
    status.textContent = 'Sending...';

    try {
      const response = await fetch(window.location.origin + '/api/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: msg })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        status.className = 'notify-status success';
        status.textContent = 'Notification sent successfully! ❤️';
        textarea.value = '';
        setTimeout(() => {
          status.className = 'notify-status';
          status.textContent = '';
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to send');
      }
    } catch (err) {
      status.className = 'notify-status error';
      status.textContent = err.message || 'Error sending notification.';
    } finally {
      sendBtn.disabled = false;
    }
  });
}
