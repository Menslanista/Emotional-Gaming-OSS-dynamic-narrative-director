import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DeepSeekIntegration,
  DeepSeekNormalizationAdapter,
  EmotionalContext,
  NarrativeResponse,
} from '../DeepSeekIntegration';

// Mock fetch globally
global.fetch = vi.fn();

describe('DeepSeekIntegration - Thorough Accuracy Tests', () => {
  let integration: DeepSeekIntegration;
  let adapter: DeepSeekNormalizationAdapter;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = fetch as ReturnType<typeof vi.fn>;
    adapter = new DeepSeekNormalizationAdapter();
    integration = new DeepSeekIntegration('test-api-key', adapter);
  });

  describe('Accuracy Tests for optionalFields Support', () => {
    it('should accurately handle complex nested optionalFields', async () => {
      const context: EmotionalContext = {
        emotion: { primary: 'focused', intensity: 0.8 },
        storyContext: 'Player in complex scenario',
        optionalFields: {
          playerStats: {
            level: 15,
            experience: 3250,
            skills: ['combat', 'magic', 'stealth'],
            attributes: {
              strength: 18,
              intelligence: 16,
              agility: 14,
            },
          },
          gameState: {
            currentQuest: 'Dragon Slayer',
            questProgress: 0.75,
            activeEffects: ['blessed', 'focused'],
          },
          environment: {
            timeOfDay: 'dusk',
            weather: 'stormy',
            location: {
              region: 'Northern Wastes',
              coordinates: { x: 1250, y: 840 },
            },
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Your focus sharpens as the storm approaches.' } }],
          tone: 'intense',
          impact: 'heighten_awareness',
          metadata: { complexity: 'high', processingTime: 250 },
        }),
      });

      const response = await integration.generateEmotionalDialogue(context);

      expect(response).toHaveProperty('dialogue');
      expect(response).toHaveProperty('tone');
      expect(response).toHaveProperty('impact');
      expect(response.optionalFields).toBeDefined();
      expect(response.optionalFields?.metadata).toEqual({ complexity: 'high', processingTime: 250 });

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const prompt = requestBody.messages[0].content;
      
      expect(prompt).toContain('PLAYERSTATS:');
      expect(prompt).toContain('GAMESTATE:');
      expect(prompt).toContain('ENVIRONMENT:');
    });

    it('should accurately handle empty and null optionalFields values', async () => {
      const context: EmotionalContext = {
        emotion: { primary: 'neutral', intensity: 0.5 },
        storyContext: 'Testing edge cases',
        optionalFields: {
          emptyString: '',
          nullValue: null,
          undefinedValue: undefined,
          zeroValue: 0,
          falseValue: false,
          emptyArray: [],
          emptyObject: {},
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'You maintain your composure.' } }],
        }),
      });

      const response = await integration.generateEmotionalDialogue(context);
      expect(response.dialogue).toBe('You maintain your composure.');

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const prompt = requestBody.messages[0].content;
      
      expect(prompt).toContain('EMPTYSTRING: ');
      expect(prompt).toContain('NULLVALUE: null');
      expect(prompt).toContain('UNDEFINEDVALUE: undefined');
      expect(prompt).toContain('ZEROVALUE: 0');
      expect(prompt).toContain('FALSEVALUE: false');
      expect(prompt).toContain('EMPTYARRAY: ');
      expect(prompt).toContain('EMPTYOBJECT: ');
    });

    it('should accurately preserve optionalFields in fallback responses', async () => {
      const integrationNoKey = new DeepSeekIntegration(); // No API key
      
      const context: EmotionalContext = {
        emotion: { primary: 'anxious', intensity: 0.9 },
        storyContext: 'Critical boss fight',
        optionalFields: {
          bossName: 'Ancient Dragon',
          bossHealth: 10000,
          playerHealth: 250,
          fightPhase: 'final_form',
          timeRemaining: '2:30',
        },
      };

      const response = await integrationNoKey.generateEmotionalDialogue(context);

      expect(response.optionalFields).toBeDefined();
      expect(response.optionalFields?.fallback).toBe(true);
      expect(response.optionalFields?.contextfields).toEqual({
        bossName: 'Ancient Dragon',
        bossHealth: 10000,
        playerHealth: 250,
        fightPhase: 'final_form',
        timeRemaining: '2:30',
      });
      expect(response.optionalFields?.timestamp).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('Accuracy Tests for Normalization Adapter', () => {
    it('should accurately normalize emotion names with various formats', () => {
      const testCases = [
        { input: 'very focused', expected: 'VERY_FOCUSED' },
        { input: 'super anxious', expected: 'SUPER_ANXIOUS' },
        { input: 'extremely curious', expected: 'EXTREMELY_CURIOUS' },
        { input: 'mildly relaxed', expected: 'MILDLY_RELAXED' },
        { input: 'FOCUSED_HIGH', expected: 'FOCUSED_HIGH' },
      ];

      testCases.forEach(({ input, expected }) => {
        const context: EmotionalContext = {
          emotion: { primary: input, intensity: 0.5 },
          storyContext: 'Test',
        };
        
        const normalized = adapter.normalizeContext(context);
        expect(normalized.emotion.primary).toBe(expected);
      });
    });

    it('should accurately clamp intensity values at boundaries', () => {
      const testCases = [
        { input: -1, expected: 0 },
        { input: 0, expected: 0 },
        { input: 0.5, expected: 0.5 },
        { input: 1, expected: 1 },
        { input: 1.5, expected: 1 },
      ];

      testCases.forEach(({ input, expected }) => {
        const context: EmotionalContext = {
          emotion: { primary: 'focused', intensity: input },
          storyContext: 'Test',
        };
        
        const normalized = adapter.normalizeContext(context);
        expect(normalized.emotion.intensity).toBe(expected);
      });
    });
  });
});