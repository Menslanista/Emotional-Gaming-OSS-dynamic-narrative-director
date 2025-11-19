import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DeepSeekIntegration,
  DeepSeekNormalizationAdapter,
  EmotionalContext,
  NarrativeResponse,
} from '../DeepSeekIntegration';

// Mock fetch globally
global.fetch = vi.fn();

describe('DeepSeekIntegration', () => {
  let integration: DeepSeekIntegration;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = fetch as ReturnType<typeof vi.fn>;
    integration = new DeepSeekIntegration('test-api-key');
  });

  describe('optionalFields support', () => {
    it('should include optionalFields in prompt when provided', async () => {
      const context: EmotionalContext = {
        emotion: { primary: 'focused', intensity: 0.8 },
        storyContext: 'Player is exploring a dark cave',
        optionalFields: {
          playerLevel: 5,
          health: 75,
          location: 'Crystal Caves',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Press onward; your torch reveals hidden paths.' } }],
          tone: 'adventurous',
          impact: 'boost_courage',
        }),
      });

      const response = await integration.generateEmotionalDialogue(context);

      expect(response).toMatchObject({
        dialogue: 'Press onward; your torch reveals hidden paths.',
        tone: 'adventurous',
        impact: 'boost_courage',
      });

      // Verify the prompt includes optional fields
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.messages[0].content).toContain('PLAYERLEVEL: 5');
      expect(requestBody.messages[0].content).toContain('PLAYER_HEALTH: 75');
      expect(requestBody.messages[0].content).toContain('CURRENT_LOCATION: Crystal Caves');
    });

    it('should handle empty optionalFields gracefully', async () => {
      const context: EmotionalContext = {
        emotion: { primary: 'focused', intensity: 0.8 },
        storyContext: 'Player is exploring',
        optionalFields: {},
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Stay focused on your path.' } }],
        }),
      });

      const response = await integration.generateEmotionalDialogue(context);

      expect(response.dialogue).toBe('Stay focused on your path.');
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.messages[0].content).not.toContain('undefined');
    });

    it('should handle optionalFields in fallback responses', async () => {
      const integrationNoKey = new DeepSeekIntegration(); // No API key
      
      const context: EmotionalContext = {
        emotion: { primary: 'FOCUSED_HIGH', intensity: 0.9 },
        storyContext: 'Critical moment',
        optionalFields: {
          playerLevel: 10,
          bossFight: true,
        },
      };

      const response = await integrationNoKey.generateEmotionalDialogue(context);

      expect(response.optionalFields).toEqual({
        fallback: true,
        contextfields: {
          playerlevel: 10,
          bossfight: true,
        },
        timestamp: expect.any(Number),
      });
    });

    it('should parse optionalFields from API response', async () => {
      const context: EmotionalContext = {
        emotion: { primary: 'curious', intensity: 0.7 },
        storyContext: 'Player discovers ancient ruins',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Ancient wisdom awaits your discovery.' } }],
          tone: 'mysterious',
          impact: 'spark_discovery',
          metadata: { responseTime: 150, model: 'deepseek-chat' },
          confidence: 0.85,
          suggestions: ['Explore deeper', 'Look for clues'],
        }),
      });

      const response = await integration.generateEmotionalDialogue(context);

      expect(response).toMatchObject({
        dialogue: 'Ancient wisdom awaits your discovery.',
        tone: 'mysterious',
        impact: 'spark_discovery',
        optionalFields: {
          metadata: { model: 'deepseek-chat' },
          confidence: 0.85,
          suggestions: ['Explore deeper', 'Look for clues'],
        },
      });
    });
  });

  describe('DeepSeekNormalizationAdapter', () => {
    let adapter: DeepSeekNormalizationAdapter;

    beforeEach(() => {
      adapter = new DeepSeekNormalizationAdapter();
    });

    describe('normalizeContext', () => {
      it('should normalize emotion primary to uppercase with underscores', () => {
        const context: EmotionalContext = {
          emotion: { primary: 'very focused', intensity: 0.8 },
          storyContext: 'Test context',
        };

        const normalized = adapter.normalizeContext(context);

        expect(normalized.emotion.primary).toBe('VERY_FOCUSED');
      });

      it('should clamp intensity between 0 and 1', () => {
        const context: EmotionalContext = {
          emotion: { primary: 'focused', intensity: 1.5 },
          storyContext: 'Test context',
        };

        const normalized = adapter.normalizeContext(context);

        expect(normalized.emotion.intensity).toBe(1);
      });

      it('should normalize optional fields', () => {
        const context: EmotionalContext = {
          emotion: { primary: 'focused', intensity: 0.8 },
          storyContext: 'Test context',
          optionalFields: {
            'Player Level': 5,
            'Health Points': 100,
            'Current Location': 'Crystal Cave',
          },
        };

        const normalized = adapter.normalizeContext(context);

        expect(normalized.optionalFields).toEqual({
          player_level: 5,
          health_points: 100,
          current_location: 'Crystal Cave',
        });
      });

      it('should normalize known optional fields to specific formats', () => {
        const context: EmotionalContext = {
          emotion: { primary: 'focused', intensity: 0.8 },
          storyContext: 'Test context',
          optionalFields: {
            level: 7,
            xp: 1500,
            health: 85,
            phase: 'EXPLORATION',
            location: 'Dark Forest',
          },
        };

        const normalized = adapter.normalizeContext(context);

        expect(normalized.optionalFields).toEqual({
          player_level: 7,
          experience_points: 1500,
          player_health: 85,
          game_phase: 'exploration',
          current_location: 'Dark Forest',
        });
      });
    });

    describe('normalizeResponse', () => {
      it('should normalize dialogue, tone, and impact', () => {
        const response: NarrativeResponse = {
          dialogue: '  Stay focused on your journey!  ',
          tone: 'ENCOURAGING',
          impact: 'Boost Focus',
        };

        const normalized = adapter.normalizeResponse(response);

        expect(normalized).toEqual({
          dialogue: 'Stay focused on your journey!',
          tone: 'encouraging',
          impact: 'boost_focus',
        });
      });

      it('should handle missing fields with defaults', () => {
        const response: NarrativeResponse = {
          dialogue: '',
          tone: '',
          impact: '',
        };

        const normalized = adapter.normalizeResponse(response);

        expect(normalized).toEqual({
          dialogue: 'Let the narrative meet you where you are.',
          tone: 'neutral',
          impact: 'stabilize',
        });
      });

      it('should normalize optional fields in response', () => {
        const response: NarrativeResponse = {
          dialogue: 'Test dialogue',
          tone: 'neutral',
          impact: 'stabilize',
          optionalFields: {
            'Response Time': 150,
            'Confidence Score': 0.85,
          },
        };

        const normalized = adapter.normalizeResponse(response);

        expect(normalized.optionalFields).toEqual({
          response_time: 150,
          confidence_score: 0.85,
        });
      });
    });
  });

  describe('Integration with normalization adapter', () => {
    let adapter: DeepSeekNormalizationAdapter;
    let integration: DeepSeekIntegration;

    beforeEach(() => {
      adapter = new DeepSeekNormalizationAdapter();
      integration = new DeepSeekIntegration('test-key', adapter);
    });

    it('should normalize context before processing', async () => {
      const context: EmotionalContext = {
        emotion: { primary: 'very anxious', intensity: 1.2 },
        storyContext: 'Player faces a challenging puzzle',
        optionalFields: {
          'Player Health': 60,
          'Difficulty Level': 'hard',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Take a deep breath and analyze carefully.' } }],
        }),
      });

      const response = await integration.generateEmotionalDialogue(context);

      // Verify context was normalized
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.messages[0].content).toContain('VERY_ANXIOUS');
      expect(requestBody.messages[0].content).toContain('1'); // intensity clamped to 1
      expect(requestBody.messages[0].content).toContain('PLAYER_HEALTH: 60');
      expect(requestBody.messages[0].content).toContain('DIFFICULTY_LEVEL: hard');
    });

    it('should normalize response after API call', async () => {
      const context: EmotionalContext = {
        emotion: { primary: 'focused', intensity: 0.8 },
        storyContext: 'Player is in combat',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '  Focus your energy!  ' } }],
          tone: 'BATTLE_READY',
          impact: 'Increase Combat Focus',
        }),
      });

      const response = await integration.generateEmotionalDialogue(context);

      expect(response).toEqual({
        dialogue: 'Focus your energy!',
        tone: 'battle_ready',
        impact: 'increase_combat_focus',
      });
    });

    it('should handle API errors with normalized fallback', async () => {
      const context: EmotionalContext = {
        emotion: { primary: 'curious', intensity: 0.7 },
        storyContext: 'Player explores new area',
        optionalFields: {
          exploration_level: 3,
        },
      };

      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const response = await integration.generateEmotionalDialogue(context);

      expect(response.optionalFields).toMatchObject({
        fallback: true,
        contextfields: {
          exploration_level: 3,
        },
        timestamp: expect.any(Number),
      });
    });
  });
});