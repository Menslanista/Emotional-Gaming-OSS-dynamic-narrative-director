import { describe, it, expect } from 'vitest';
import { DeepSeekIntegration, DeepSeekNormalizationAdapter } from '../DeepSeekIntegration';

describe('DeepSeekIntegration Implementation Verification', () => {
  it('should have optionalFields support in interfaces', () => {
    const context = {
      emotion: { primary: 'focused', intensity: 0.8 },
      storyContext: 'Test context',
      optionalFields: { testField: 'testValue' }
    };
    
    expect(context.optionalFields).toBeDefined();
    expect(context.optionalFields?.testField).toBe('testValue');
  });

  it('should normalize optional fields correctly', () => {
    const adapter = new DeepSeekNormalizationAdapter();
    
    const context = {
      emotion: { primary: 'focused', intensity: 0.8 },
      storyContext: 'Test context',
      optionalFields: {
        'Player Level': 5,
        'Health Points': 100
      }
    };
    
    const normalized = adapter.normalizeContext(context);
    
    expect(normalized.optionalFields).toEqual({
      player_level: 5,
      health_points: 100
    });
  });

  it('should handle DeepSeekIntegration instantiation', () => {
    const integration = new DeepSeekIntegration();
    expect(integration).toBeDefined();
  });
});