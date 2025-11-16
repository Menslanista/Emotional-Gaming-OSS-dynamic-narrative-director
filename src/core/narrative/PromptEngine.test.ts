import { describe, it, expect, beforeEach } from 'vitest';
import { PromptEngine } from './PromptEngine';
import type { EmotionalContext, FusedEmotion } from '../emotion/EmotionFusionEngine';

describe('PromptEngine', () => {
  let promptEngine: PromptEngine;
  let testContext: EmotionalContext;

  beforeEach(() => {
    promptEngine = new PromptEngine();
    
    const testEmotion: FusedEmotion = {
      primary: 'FOCUSED_HIGH',
      intensity: 0.8,
      confidence: 0.9,
      components: {},
      timestamp: Date.now()
    };

    testContext = {
      emotion: testEmotion,
      storyContext: 'Battling Tau Tanglers in the hippocampus',
      character: 'NEURON_GUARDIAN',
      location: 'Memory formation pathway',
      previousDialogue: 'The neural pathways are under attack!'
    };
  });

  describe('Prompt Building', () => {
    it('should build emotional dialogue prompts correctly', () => {
      const { prompt, config } = promptEngine.buildPrompt('emotional_dialogue', testContext);
      
      expect(prompt).toContain('FOCUSED_HIGH');
      expect(prompt).toContain('80%');
      expect(prompt).toContain('NEURON_GUARDIAN');
      expect(config.temperature).toBe(0.7);
    });

    it('should validate response formats', () => {
      const validResponse = {
        dialogue: 'Test dialogue',
        emotionalTone: 'intense',
        narrativeImpact: 'medium',
        characterConsistency: 0.8
      };

      const invalidResponse = {
        dialogue: 'Test',
        emotionalTone: 'invalid_tone'
      } as any;

      expect(promptEngine.validateResponse(validResponse, 'emotional_dialogue')).toBe(true);
      expect(promptEngine.validateResponse(invalidResponse, 'emotional_dialogue')).toBe(false);
    });
  });
});