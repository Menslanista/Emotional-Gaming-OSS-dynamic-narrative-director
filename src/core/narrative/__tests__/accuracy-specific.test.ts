import { describe, it, expect } from 'vitest';
import { DeepSeekNormalizationAdapter } from '../DeepSeekIntegration';

describe('Accuracy Tests - Normalization Adapter', () => {
  it('should preserve response metadata field names', () => {
    const adapter = new DeepSeekNormalizationAdapter();
    
    const response = {
      dialogue: 'Test response',
      tone: 'neutral',
      impact: 'stabilize',
      optionalFields: {
        metadata: { responseTime: 250, model: 'deepseek-chat' },
        confidence: 0.95,
        suggestions: ['suggestion1', 'suggestion2'],
      },
    };

    const normalized = adapter.normalizeResponse(response);
    
    // These fields should be preserved exactly as-is
    expect(normalized.optionalFields?.metadata).toEqual({ responseTime: 250, model: 'deepseek-chat' });
    expect(normalized.optionalFields?.confidence).toBe(0.95);
    expect(normalized.optionalFields?.suggestions).toEqual(['suggestion1', 'suggestion2']);
  });

  it('should preserve context field names in fallback responses', () => {
    const adapter = new DeepSeekNormalizationAdapter();
    
    const context = {
      emotion: { primary: 'focused', intensity: 0.8 },
      storyContext: 'Test context',
      optionalFields: {
        bossName: 'Ancient Dragon',
        playerHealth: 100,
        fightPhase: 'final',
      },
    };

    const normalized = adapter.normalizeContext(context);
    
    // Context fields should be normalized for the prompt
    expect(normalized.optionalFields?.boss_name).toBe('Ancient Dragon');
    expect(normalized.optionalFields?.player_health).toBe(100);
    expect(normalized.optionalFields?.fight_phase).toBe('final');
  });
});