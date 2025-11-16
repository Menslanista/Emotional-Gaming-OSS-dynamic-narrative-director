type MetricsUpdate = Record<string, any>;

class RealtimeDashboard {
  private clients = 0;
  private latestMetrics: MetricsUpdate = {};

  updatePerformanceMetrics(update: MetricsUpdate): void {
    this.latestMetrics = { ...this.latestMetrics, ...update };
    // In a real implementation, push to websocket clients or UI state
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.log('RealtimeDashboard update:', Object.keys(update));
    }
  }

  getClientCount(): number {
    return this.clients;
  }

  setClientCount(count: number): void {
    this.clients = Math.max(0, Math.floor(count));
  }

  getLatestMetrics(): MetricsUpdate {
    return this.latestMetrics;
  }
}

export const dashboard = new RealtimeDashboard();