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

  // Delegated click handler for any [data-copy] element
  document.addEventListener('click', (e) => {
    const copyTarget = e.target.closest('[data-copy]');
    if (!copyTarget) return;

    const copyText = copyTarget.getAttribute('data-copy');
    if (!copyText) return;

    // Write to clipboard
    navigator.clipboard.writeText(copyText).then(() => {
      showToast(copyText);
    }).catch(err => {
      console.warn('Clipboard write failed:', err);
      // Fallback method
      const textInput = document.createElement('input');
      textInput.value = copyText;
      document.body.appendChild(textInput);
      textInput.select();
      document.execCommand('copy');
      document.body.removeChild(textInput);
      showToast(copyText);
    });
  });
}
