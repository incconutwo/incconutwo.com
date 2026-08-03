// ============================================
// HOVER CARD COMPONENT
// Context-aware pointer tracking for blur effect
// Based on: codepen.io/jh3y/pen/WbwZaNa
// ============================================

(function () {
  'use strict';

  function ContextAwareHoverCards(selector) {
    this.selector = selector || '.hover-card';
    this.cards = document.querySelectorAll(this.selector);
    this._init();
  }

  ContextAwareHoverCards.prototype._init = function () {
    var self = this;
    for (var i = 0; i < this.cards.length; i++) {
      (function (card) {
        var rect = null;
        var touchTimeout = null;

        var updatePointerCoords = function (clientX, clientY) {
          if (!rect) {
            rect = card.getBoundingClientRect();
          }
          if (!rect || rect.width === 0 || rect.height === 0) return;

          var centerX = rect.left + rect.width / 2;
          var centerY = rect.top + rect.height / 2;
          var x = (clientX - centerX) / (rect.width / 2);
          var y = (clientY - centerY) / (rect.height / 2);

          // Clamp between -1 and 1
          x = Math.max(-1, Math.min(1, x));
          y = Math.max(-1, Math.min(1, y));

          card.style.setProperty('--pointer-x', x.toFixed(3));
          card.style.setProperty('--pointer-y', y.toFixed(3));

          // 3D tilt effect on touch/pointer
          if (card.hasAttribute('data-tilt') && typeof gsap !== 'undefined') {
            var maxTilt = 6;
            var xRotate = (maxTilt * y);
            var yRotate = (-maxTilt * x);
            gsap.to(card, {
              rotationX: xRotate,
              rotationY: yRotate,
              scale: 1.02,
              duration: 0.25,
              ease: 'power1.out',
              overwrite: 'auto'
            });
          }
        };

        var resetTilt = function () {
          if (card.hasAttribute('data-tilt') && typeof gsap !== 'undefined') {
            gsap.to(card, {
              rotationX: 0,
              rotationY: 0,
              scale: 1,
              duration: 0.5,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          }
        };

        var onPointerMove = function (event) {
          updatePointerCoords(event.clientX, event.clientY);
        };

        var onTouchMove = function (event) {
          if (event.touches && event.touches.length > 0) {
            var touch = event.touches[0];
            updatePointerCoords(touch.clientX, touch.clientY);
          }
        };

        var onPointerEnter = function (event) {
          rect = card.getBoundingClientRect();
          card.addEventListener('pointermove', onPointerMove);
        };

        var onPointerLeave = function () {
          card.removeEventListener('pointermove', onPointerMove);
          card.classList.remove('is-touch-active');
          rect = null;
          resetTilt();
        };

        var onTouchStart = function (event) {
          rect = card.getBoundingClientRect();
          card.classList.add('is-touch-active');
          if (event.touches && event.touches.length > 0) {
            var touch = event.touches[0];
            updatePointerCoords(touch.clientX, touch.clientY);
          }
        };

        var onTouchEnd = function () {
          if (touchTimeout) clearTimeout(touchTimeout);
          touchTimeout = setTimeout(function () {
            card.classList.remove('is-touch-active');
            rect = null;
            resetTilt();
          }, 1200);
        };

        card.addEventListener('pointerenter', onPointerEnter);
        card.addEventListener('pointerleave', onPointerLeave);

        // Touch screen listeners
        card.addEventListener('touchstart', onTouchStart, { passive: true });
        card.addEventListener('touchmove', onTouchMove, { passive: true });
        card.addEventListener('touchend', onTouchEnd, { passive: true });
        card.addEventListener('touchcancel', onTouchEnd, { passive: true });

        card._hoverCleanup = function () {
          card.removeEventListener('pointerenter', onPointerEnter);
          card.removeEventListener('pointerleave', onPointerLeave);
          card.removeEventListener('pointermove', onPointerMove);
          card.removeEventListener('touchstart', onTouchStart);
          card.removeEventListener('touchmove', onTouchMove);
          card.removeEventListener('touchend', onTouchEnd);
          card.removeEventListener('touchcancel', onTouchEnd);
          if (touchTimeout) clearTimeout(touchTimeout);
        };
      })(this.cards[i]);
    }
  };

  ContextAwareHoverCards.prototype.destroy = function () {
    for (var i = 0; i < this.cards.length; i++) {
      if (typeof this.cards[i]._hoverCleanup === 'function') {
        this.cards[i]._hoverCleanup();
      }
    }
  };

  ContextAwareHoverCards.prototype.refresh = function () {
    this.destroy();
    this.cards = document.querySelectorAll(this.selector);
    this._init();
  };

  // Expose globally
  window.ContextAwareHoverCards = ContextAwareHoverCards;

  const initHoverCards = () => {
    if (window.hoverCardsInstance) {
      window.hoverCardsInstance.refresh();
    } else {
      window.hoverCardsInstance = new ContextAwareHoverCards();
    }
  };

  document.addEventListener('DOMContentLoaded', initHoverCards);
  document.addEventListener('astro:page-load', initHoverCards);

  if (document.readyState !== 'loading') {
    initHoverCards();
  }
})();
