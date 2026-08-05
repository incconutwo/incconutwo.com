/**
 * ============================================
 * TEXT SCRAMRAMBLE CLASS (Hacker Decode Effect)
 * ============================================
 */
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const length = newText.length;
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];

    // speed settings
    const stagger = 6;
    const duration = 16; // duration of scrambling for each char

    for (let i = 0; i < length; i++) {
      const to = newText[i] || '';
      const start = i * stagger;
      const end = start + duration;
      this.queue.push({ to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { to, start, end, char } = this.queue[i];

      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="dud">${char}</span>`;
      } else {
        // Not started yet - show underscore
        output += '_';
      }
    }

    this.el.innerHTML = output;

    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
  setPlaceholder(text) {
    this.el.innerHTML = '_'.repeat(text.length);
  }
}

/**
 * Initializes the Hacker Text Scramble Effect with Re-triggering
 */
export function initHackerScramble() {
  const el1 = document.querySelector('#scramble-1');
  const el2 = document.querySelector('#scramble-2');

  if (!el1 || !el2) return;

  const fx1 = new TextScramble(el1);
  const fx2 = new TextScramble(el2);

  // Set initial state to underscores
  fx1.setPlaceholder('I am');
  fx2.setPlaceholder('incconu_two');

  ScrollTrigger.create({
    trigger: ".hero-headline",
    start: "top 95%",
    onEnter: () => {
      fx1.setText('I am').then(() => fx2.setText('incconu_two'));
    },
    onEnterBack: () => {
      fx1.setPlaceholder('I am');
      fx2.setPlaceholder('incconu_two');
      fx1.setText('I am').then(() => fx2.setText('incconu_two'));
    }
  });
}
