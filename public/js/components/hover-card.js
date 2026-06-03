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

        var onPointerMove = function (event) {
          if (!rect) {
            rect = card.getBoundingClientRect();
          }
          var centerX = rect.left + rect.width / 2;
          var centerY = rect.top + rect.height / 2;
          var x = (event.clientX - centerX) / (rect.width / 2);
          var y = (event.clientY - centerY) / (rect.height / 2);

          card.style.setProperty('--pointer-x', x.toFixed(3));
          card.style.setProperty('--pointer-y', y.toFixed(3));
        };

        var onPointerEnter = function () {
          rect = card.getBoundingClientRect();
          card.addEventListener('pointermove', onPointerMove);
        };

        var onPointerLeave = function () {
          card.removeEventListener('pointermove', onPointerMove);
          rect = null;
        };

        card.addEventListener('pointerenter', onPointerEnter);
        card.addEventListener('pointerleave', onPointerLeave);

        card._hoverCleanup = function () {
          card.removeEventListener('pointerenter', onPointerEnter);
          card.removeEventListener('pointerleave', onPointerLeave);
          card.removeEventListener('pointermove', onPointerMove);
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

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.hoverCardsInstance = new ContextAwareHoverCards();
    });
  } else {
    window.hoverCardsInstance = new ContextAwareHoverCards();
  }
})();
