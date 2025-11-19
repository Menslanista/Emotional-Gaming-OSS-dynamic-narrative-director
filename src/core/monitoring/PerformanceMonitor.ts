import { dashboard } from '../dashboard/RealtimeDashboard';

/**
 * An interface for performance metrics.
 * @property {object} emotionDetection - Metrics for emotion detection.
 * @property {object} narrativeGeneration - Metrics for narrative generation.
 * @property {object} system - System-level metrics.
 */
export interface PerformanceMetrics {
  emotionDetection: {
    count: number;
    totalTime: number;
    averageTime: number;
    lastTime: number;
  };
  narrativeGeneration: {
    count: number;
    totalTime: number;
    averageTime: number;
    lastTime: number;
    apiCalls: number;
    cacheHits: number;
  };
  system: {
    startTime: number;
    uptime: number;
    memoryUsage: number;
    activeConnections: number;
  };
}

/**
 * A class for monitoring and reporting performance metrics.
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private startTime: number;

  /**
   * Creates an instance of PerformanceMonitor.
   */
  constructor() {
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.startPeriodicReporting();
  }

  /**
   * Initializes the performance metrics.
   * @returns {PerformanceMetrics} The initial metrics.
   */
  private initializeMetrics(): PerformanceMetrics {
    return {
      emotionDetection: {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        lastTime: 0,
      },
      narrativeGeneration: {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        lastTime: 0,
        apiCalls: 0,
        cacheHits: 0,
      },
      system: {
        startTime: this.startTime,
        uptime: 0,
        memoryUsage: 0,
        activeConnections: 0,
      },
    };
  }

  /**
   * Records the duration of an emotion detection event.
   * @param {number} duration - The duration of the event in milliseconds.
   */
  recordEmotionDetection(duration: number): void {
    this.metrics.emotionDetection.count++;
    this.metrics.emotionDetection.totalTime += duration;
    this.metrics.emotionDetection.lastTime = duration;
    this.metrics.emotionDetection.averageTime =
      this.metrics.emotionDetection.totalTime / this.metrics.emotionDetection.count;

    dashboard.updatePerformanceMetrics({
      emotionDetection: this.metrics.emotionDetection,
    });
  }

  /**
   * Records the duration of a narrative generation event.
   * @param {number} duration - The duration of the event in milliseconds.
   * @param {boolean} [wasCached=false] - Whether the response was cached.
   */
  recordNarrativeGeneration(duration: number, wasCached: boolean = false): void {
    this.metrics.narrativeGeneration.count++;
    this.metrics.narrativeGeneration.totalTime += duration;
    this.metrics.narrativeGeneration.lastTime = duration;
    this.metrics.narrativeGeneration.averageTime =
      this.metrics.narrativeGeneration.totalTime / this.metrics.narrativeGeneration.count;

    if (wasCached) {
      this.metrics.narrativeGeneration.cacheHits++;
    } else {
      this.metrics.narrativeGeneration.apiCalls++;
    }

    dashboard.updatePerformanceMetrics({
      narrativeGeneration: this.metrics.narrativeGeneration,
    });
  }

  /**
   * Records an API error.
   * @param {string} errorType - The type of error that occurred.
   */
  recordAPIError(errorType: string): void {
    const current = (this.metrics as any).apiErrors?.count || 0;
    dashboard.updatePerformanceMetrics({
      apiErrors: {
        type: errorType,
        timestamp: Date.now(),
        count: current + 1,
      },
    });
  }

  /**
   * Updates the system metrics.
   */
  updateSystemMetrics(): void {
    this.metrics.system.uptime = Date.now() - this.startTime;

    if (typeof process !== 'undefined' && typeof (process as any).memoryUsage === 'function') {
      this.metrics.system.memoryUsage = (process as any).memoryUsage().heapUsed / 1024 / 1024; // MB
    }

    this.metrics.system.activeConnections = dashboard.getClientCount();

    dashboard.updatePerformanceMetrics({
      system: this.metrics.system,
    });
  }

  /**
   * Gets a performance report, including recommendations.
   * @returns {PerformanceMetrics & { recommendations: string[] }} The performance report.
   */
  getPerformanceReport(): PerformanceMetrics & { recommendations: string[] } {
    this.updateSystemMetrics();

    const recommendations: string[] = [];

    if (this.metrics.emotionDetection.averageTime > 50) {
      recommendations.push(
        'Optimize emotion detection algorithms - current average: ' +
          this.metrics.emotionDetection.averageTime.toFixed(2) + 'ms',
      );
    }

    if (this.metrics.narrativeGeneration.averageTime > 200) {
      recommendations.push('Improve narrative generation performance - consider response caching');
    }

    const cacheHitRate = this.metrics.narrativeGeneration.cacheHits /
      (this.metrics.narrativeGeneration.count || 1);

    if (cacheHitRate < 0.3) {
      recommendations.push(
        'Low cache hit rate (' + (cacheHitRate * 100).toFixed(1) +
          '%) - consider expanding cache size or improving key generation',
      );
    }

    if (this.metrics.system.memoryUsage > 500) {
      recommendations.push(
        'High memory usage (' + this.metrics.system.memoryUsage.toFixed(1) + 'MB) - consider memory optimization',
      );
    }

    return {
      ...this.metrics,
      recommendations,
    };
  }

  private startPeriodicReporting(): void {
    setInterval(() => {
      this.updateSystemMetrics();

      if (this.metrics.emotionDetection.count > 0 || this.metrics.narrativeGeneration.count > 0) {
        // eslint-disable-next-line no-console
        console.log('📊 Performance Summary:', {
          emotionDetection: {
            averageTime: this.metrics.emotionDetection.averageTime.toFixed(2) + 'ms',
          },
          narrativeGeneration: {
            averageTime: this.metrics.narrativeGeneration.averageTime.toFixed(2) + 'ms',
            cacheHits: this.metrics.narrativeGeneration.cacheHits,
            apiCalls: this.metrics.narrativeGeneration.apiCalls,
          },
          system: {
            uptime: Math.round(this.metrics.system.uptime / 1000) + 's',
            memoryUsage: this.metrics.system.memoryUsage.toFixed(1) + 'MB',
            activeConnections: this.metrics.system.activeConnections,
          },
        });
      }
    }, 30_000);
  }
}