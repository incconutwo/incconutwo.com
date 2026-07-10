/**
 * Shared Poller Utility for Widgets
 * Handles visibility-aware polling to save resources
 */
export class WidgetPoller {
  constructor(updateFn, intervalMs) {
    this.updateFn = updateFn;
    this.intervalMs = intervalMs;
    this.pollInterval = null;
    this.handleVisibility = this.handleVisibility.bind(this);
  }

  start() {
    this.updateFn();
    this.pollInterval = setInterval(this.updateFn, this.intervalMs);
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  stop() {
    clearInterval(this.pollInterval);
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }

  handleVisibility() {
    if (document.hidden) {
      clearInterval(this.pollInterval);
    } else {
      this.updateFn();
      this.pollInterval = setInterval(this.updateFn, this.intervalMs);
    }
  }
}
