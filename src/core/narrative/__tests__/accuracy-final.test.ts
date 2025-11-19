import { describe, it, expect } from 'vitest';
import { DeepSeekIntegration, DeepSeekNormalizationAdapter } from '../DeepSeekIntegration';

describe('Thorough Accuracy Verification', () => {
  it('should handle complex nested optionalFields accurately', () => {
    const adapter = new DeepSeekNormalizationAdapter();
    
    const complexContext = {
      emotion: { primary: 'focused', intensity: 0.8 },
      storyContext: 'Player in complex scenario',
      optionalFields: {
        playerStats: {
          level: 15,
          experience: 3250,
          skills: ['combat', 'magic', 'stealth'],
          attributes: { strength: 18, intelligence: 16, agility: 14 },
        },
        gameState: {
          currentQuest: 'Dragon Slayer',
          questProgress: 0.75,
          activeEffects: ['blessed', 'focused'],
        },
      },
    };

    const normalized = adapter.normalizeContext(complexContext);
    expect(normalized.optionalFields).toBeDefined();
    expect(normalized.optionalFields?.playerstats).toBeDefined();
    expect(normalized.optionalFields?.gamestate).toBeDefined();
  });

  it('should accurately clamp intensity boundaries', () => {
    const adapter = new DeepSeekNormalizationAdapter();
    
    const testCases = [
      { input: -1, expected: 0 },
      { input: 0, expected: 0 },
      { input: 0.5, expected: 0.5 },
      { input: 1, expected: 1 },
      { input: 1.5, expected: 1 },
    ];

    testCases.forEach(({ input, expected }) => {
      const context = {
        emotion: { primary: 'focused', intensity: input },
        storyContext: 'Test',
      };
      
      const normalized = adapter.normalizeContext(context);
      expect(normalized.emotion.intensity).toBe(expected);
    });
  });

  it('should accurately normalize known optional fields', () => {
    const adapter = new DeepSeekNormalizationAdapter();
    
    const context = {
      emotion: { primary: 'focused', intensity: 0.8 },
      storyContext: 'Test',
      optionalFields: {
        level: 25,
        xp: 5000,
        health: 150,
        phase: 'BOSS_BATTLE',
        location: 'Dragon\'s Lair',
      },
    };

    const normalized = adapter.normalizeContext(context);
    
    expect(normalized.optionalFields).toEqual({
      player_level: 25, // level -> player_level
      experience_points: 5000, // xp -> experience_points
      player_health: 150, // health -> player_health
      game_phase: 'boss_battle', // phase -> game_phase (lowercase)
      current_location: 'Dragon\'s Lair', // location -> current_location
    });
  });

  it('should handle DeepSeekIntegration with optionalFields accurately', async () => {
    const integration = new DeepSeekIntegration(); // No API key, will use fallback
    
    const context = {
      emotion: { primary: 'focused', intensity: 0.8 },
      storyContext: 'Test scenario',
      optionalFields: {
        playerLevel: 10,
        health: 100,
        location: 'Test Area',
      },
    };

    const response = await integration.generateEmotionalDialogue(context);
    
    expect(response).toHaveProperty('dialogue');
    expect(response).toHaveProperty('tone');
    expect(response).toHaveProperty('impact');
    expect(response.optionalFields).toBeDefined();
    expect(response.optionalFields?.fallback).toBe(true);
    expect(response.optionalFields?.contextfields).toBeDefined();
  });
});