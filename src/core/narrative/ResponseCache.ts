import type { EmotionalContext } from './PromptEngine';

/**
 * An interface for a cached response.
 * @property {T} response - The cached response.
 * @property {number} timestamp - The time the response was cached.
 * @property {number} accessCount - The number of times the response has been accessed.
 * @property {number} lastAccessed - The last time the response was accessed.
 * @property {string} emotionalSignature - The emotional signature of the response.
 */
export interface CachedResponse<T = any> {
  response: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  emotionalSignature: string;
}

/**
 * A class for caching responses from a language model.
 * @template T
 */
export class ResponseCache<T = any> {
  private cache: Map<string, CachedResponse<T>> = new Map();
  private readonly MAX_SIZE = 100;
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private readonly CLEANUP_INTERVAL = 60 * 1000; // 1 minute

  /**
   * Creates an instance of ResponseCache.
   */
  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Generates a cache key for a given emotional context.
   * @param {EmotionalContext} context - The emotional context.
   * @returns {string} The cache key.
   */
  generateCacheKey(context: EmotionalContext): string {
    const intensityBand = Math.floor(context.emotion.intensity * 10) / 10; // Round to 0.1
    const emotionalSignature = `${context.emotion.primary}_${intensityBand}`;
    const contextHash = this.hashString((context.storyContext || '').substring(0, 50));
    const characterKey = context.character || 'default';
    return `${emotionalSignature}_${contextHash}_${characterKey}`;
  }

  /**
   * Gets a cached response for a given emotional context.
   * @param {EmotionalContext} context - The emotional context.
   * @returns {T | null} The cached response, or null if it's not in the cache.
   */
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

  /**
   * Caches a response for a given emotional context.
   * @param {EmotionalContext} context - The emotional context.
   * @param {T} response - The response to cache.
   */
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

  /**
   * Evicts the least recently used item from the cache.
   */
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

  /**
   * Finds similar responses in the cache.
   * @param {EmotionalContext} context - The emotional context to find similar responses for.
   * @param {number} [similarityThreshold=0.7] - The similarity threshold.
   * @returns {CachedResponse<T>[]} An array of similar cached responses.
   */
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

  /**
   * Hashes a string.
   * @param {string} str - The string to hash.
   * @returns {string} The hashed string.
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }

  /**
   * Starts the cache cleanup interval.
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Cleans up expired items from the cache.
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.TTL) this.cache.delete(key);
    }
  }

  /**
   * Gets statistics about the cache.
   * @returns {{ size: number; hitRate: number; mostPopular: string[]; memoryUsage: number; }} The cache statistics.
   */
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

  /**
   * Clears the cache.
   */
  clear(): void {
    this.cache.clear();
  }
}