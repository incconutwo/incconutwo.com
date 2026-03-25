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
    this._onPointerMove = this._onPointerMove.bind(this);
    this._init();
  }

  ContextAwareHoverCards.prototype._onPointerMove = function (event) {
    for (var i = 0; i < this.cards.length; i++) {
      var card = this.cards[i];
      var rect = card.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;

      var x = (event.clientX - centerX) / (rect.width / 2);
      var y = (event.clientY - centerY) / (rect.height / 2);

      card.style.setProperty('--pointer-x', x.toFixed(3));
      card.style.setProperty('--pointer-y', y.toFixed(3));
    }
  };

  ContextAwareHoverCards.prototype._init = function () {
    document.addEventListener('pointermove', this._onPointerMove);
  };

  ContextAwareHoverCards.prototype.destroy = function () {
    document.removeEventListener('pointermove', this._onPointerMove);
  };

  ContextAwareHoverCards.prototype.refresh = function () {
    this.cards = document.querySelectorAll(this.selector);
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
