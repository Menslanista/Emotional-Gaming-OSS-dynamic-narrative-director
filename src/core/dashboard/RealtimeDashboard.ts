/**
 * A record of performance metrics.
 */
type MetricsUpdate = Record<string, any>;

/**
 * A class for managing and broadcasting real-time performance metrics.
 */
class RealtimeDashboard {
  private clients = 0;
  private latestMetrics: MetricsUpdate = {};

  /**
   * Updates the performance metrics with the latest data.
   * @param {MetricsUpdate} update - The metrics update to apply.
   */
  updatePerformanceMetrics(update: MetricsUpdate): void {
    this.latestMetrics = { ...this.latestMetrics, ...update };
    // In a real implementation, push to websocket clients or UI state
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log('RealtimeDashboard update:', Object.keys(update));
    }
  }

  /**
   * Gets the current number of connected clients.
   * @returns {number} The number of clients.
   */
  getClientCount(): number {
    return this.clients;
  }

  /**
   * Sets the number of connected clients.
   * @param {number} count - The number of clients.
   */
  setClientCount(count: number): void {
    this.clients = Math.max(0, Math.floor(count));
  }

  /**
   * Gets the latest performance metrics.
   * @returns {MetricsUpdate} The latest metrics.
   */
  getLatestMetrics(): MetricsUpdate {
    return this.latestMetrics;
  }
}

export const dashboard = new RealtimeDashboard();