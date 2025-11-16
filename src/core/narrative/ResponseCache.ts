import type { EmotionalContext } from './PromptEngine';

export interface CachedResponse<T = any> {
  response: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  emotionalSignature: string;
}

export class ResponseCache<T = any> {
  private cache: Map<string, CachedResponse<T>> = new Map();
  private readonly MAX_SIZE = 100;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute

  constructor() {
    this.startCleanupInterval();
  }

  generateCacheKey(context: EmotionalContext): string {
    const intensityBand = Math.floor(context.emotion.intensity * 10) / 10; // Round to 0.1
    const emotionalSignature = `${context.emotion.primary}_${intensityBand}`;
    const contextHash = this.hashString((context.storyContext || '').substring(0, 50));
    const characterKey = context.character || 'default';
    return `${emotionalSignature}_${contextHash}_${characterKey}`;
  }

  get(context: EmotionalContext): T | null {
    const key = this.generateCacheKey(context);
    const cached = this.cache.get(key);
    
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    cached.accessCount++;
    cached.lastAccessed = Date.now();
    return cached.response;
  }

  set(context: EmotionalContext, response: T): void {
    const key = this.generateCacheKey(context);

    if (this.cache.size >= this.MAX_SIZE) {
      this.evictLeastRecentlyUsed();
    }

    const cachedResponse: CachedResponse<T> = {
      response,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      emotionalSignature: this.generateCacheKey(context),
    };

    this.cache.set(key, cachedResponse);
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, cached] of this.cache.entries()) {
      if (cached.lastAccessed < lruTime) {
        lruTime = cached.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) this.cache.delete(lruKey);
  }

  findSimilarResponses(context: EmotionalContext, similarityThreshold: number = 0.7): CachedResponse<T>[] {
    const targetKey = this.generateCacheKey(context);
    const [targetEmotion, targetIntensity] = targetKey.split('_');
    const targetIntensityNum = parseFloat(targetIntensity);

    const similar: CachedResponse<T>[] = [];

    for (const [key, cached] of this.cache.entries()) {
      const [cachedEmotion, cachedIntensity] = key.split('_');
      const cachedIntensityNum = parseFloat(cachedIntensity);

      let similarity = 0;
      if (cachedEmotion === targetEmotion) similarity += 0.6;
      const intensityDiff = Math.abs(cachedIntensityNum - targetIntensityNum);
      if (intensityDiff <= 0.2) similarity += 0.4 * (1 - intensityDiff * 5);

      if (similarity >= similarityThreshold) similar.push(cached);
    }

    return similar.sort((a, b) => b.accessCount - a.accessCount);
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, this.CLEANUP_INTERVAL);
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.TTL) this.cache.delete(key);
    }
  }

  getCacheStats(): {
    size: number;
    hitRate: number;
    mostPopular: string[];
    memoryUsage: number;
  } {
    const totalAccesses = Array.from(this.cache.values()).reduce((sum, cached) => sum + cached.accessCount, 0);
    const averageAccesses = this.cache.size > 0 ? totalAccesses / this.cache.size : 0;
    const memoryUsage = this.cache.size * 1024; // rough estimate

    const popular = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => b.accessCount - a.accessCount)
      .slice(0, 5)
      .map(([key, cached]) => `${key} (${cached.accessCount} accesses)`);

    return {
      size: this.cache.size,
      hitRate: averageAccesses,
      mostPopular: popular,
      memoryUsage,
    };
  }

  clear(): void {
    this.cache.clear();
  }
}