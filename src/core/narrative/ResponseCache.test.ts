import { describe, it, expect, beforeEach } from 'vitest';
import { ResponseCache } from './ResponseCache';
import type { EmotionalContext, FusedEmotion } from '../emotion/EmotionFusionEngine';

describe('ResponseCache', () => {
  let responseCache: ResponseCache<any>;
  let testContext: EmotionalContext;

  beforeEach(() => {
    responseCache = new ResponseCache<any>();
    
    const testEmotion: FusedEmotion = {
      primary: 'FOCUSED_HIGH',
      intensity: 0.8,
      confidence: 0.9,
      components: {},
      timestamp: Date.now()
    };

    testContext = {
      emotion: testEmotion,
      storyContext: 'Testing cache functionality',
      character: 'TEST_CHARACTER'
    };
  });

  describe('Cache Operations', () => {
    it('should store and retrieve responses', () => {
      const testResponse = {
        dialogue: 'Test dialogue response',
        emotionalTone: 'intense',
        storyImpact: 'medium' as const,
        confidence: 0.9
      };

      responseCache.set(testContext, testResponse);
      const retrieved = responseCache.get(testContext);

      expect(retrieved).toEqual(testResponse);
    });

    it('should generate consistent cache keys', () => {
      const key1 = responseCache.generateCacheKey(testContext);
      const key2 = responseCache.generateCacheKey(testContext);

      expect(key1).toBe(key2);
    });
  });
});