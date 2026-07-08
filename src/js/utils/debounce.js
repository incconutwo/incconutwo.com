/**
 * Debounce Utility
 * Ensures a function only executes after the specified delay has passed
 * without the function being called again.
 * Prevents performance issues from rapid-fire events like resize.
 */
export default function debounce(func, wait = 150) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
