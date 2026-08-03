/**
 * Interactive Copy to Clipboard with Glassmorphism Toast Notification
 */
export function initClipboardCopy() {
  // Create container for toasts if not already created
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  function showToast(text) {
    const toast = document.createElement('div');
    toast.className = 'toast-card';
    toast.innerHTML = `
      <div class="toast-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2DC653" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <span class="toast-message">Copied <strong>${escapeHtml(text)}</strong> to clipboard!</span>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto dismiss
    setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2800);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Avoid scrolling to bottom or visual disruption on mobile
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.setAttribute('readonly', '');

    document.body.appendChild(textArea);

    // iOS Safari selection support
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textArea);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      textArea.setSelectionRange(0, 999999);
    } else {
      textArea.select();
    }

    let successful = false;
    try {
      successful = document.execCommand('copy');
    } catch (err) {
      console.error('[Clipboard] ExecCommand fallback failed:', err);
    }

    document.body.removeChild(textArea);
    return successful;
  }

  function performCopy(copyText) {
    // Check if navigator.clipboard is available and writeText function exists
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(copyText).then(() => {
        showToast(copyText);
      }).catch((err) => {
        console.warn('[Clipboard] Async writeText failed, trying fallback:', err);
        if (fallbackCopyTextToClipboard(copyText)) {
          showToast(copyText);
        }
      });
    } else {
      // Direct fallback for non-HTTPS or unsupported mobile browsers
      if (fallbackCopyTextToClipboard(copyText)) {
        showToast(copyText);
      }
    }
  }

  // Delegated click handler for any [data-copy] element
  document.addEventListener('click', (e) => {
    // If the click was directly on a copy badge or copy button inside a link, handle copy exclusively
    const copyBadge = e.target.closest('.copy-hint-badge, .copy-email-btn');
    if (copyBadge) {
      const parentCopy = copyBadge.closest('[data-copy]');
      if (parentCopy) {
        e.preventDefault();
        e.stopPropagation();
        const copyText = parentCopy.getAttribute('data-copy');
        if (copyText) performCopy(copyText);
        return;
      }
    }

    const copyTarget = e.target.closest('[data-copy]');
    if (!copyTarget) return;

    // If it's a button, prevent default
    if (copyTarget.tagName === 'BUTTON' || copyTarget.classList.contains('copy-email-btn')) {
      e.preventDefault();
    }

    const copyText = copyTarget.getAttribute('data-copy');
    if (!copyText) return;

    performCopy(copyText);
  });
}
