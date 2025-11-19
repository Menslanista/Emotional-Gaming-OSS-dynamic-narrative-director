/**
 * An interface for the emotional context provided to the DeepSeek API.
 * @property {object} emotion - The user's emotion.
 * @property {string} emotion.primary - The primary emotion.
 * @property {number} emotion.intensity - The intensity of the emotion.
 * @property {string} storyContext - The current context of the story.
 */
export interface EmotionalContext {
  emotion: { primary: string; intensity: number };
  storyContext: string;
}

/**
 * An interface for the narrative response from the DeepSeek API.
 * @property {string} dialogue - The generated dialogue.
 * @property {string} tone - The tone of the dialogue.
 * @property {string} impact - The impact of the dialogue on the narrative.
 */
export interface NarrativeResponse {
  dialogue: string;
  tone: string;
  impact: string;
}

/**
 * A class for integrating with the DeepSeek API to generate narrative content.
 */
export class DeepSeekIntegration {
  private readonly apiKey: string | undefined;
  private readonly baseURL = 'https://api.deepseek.com/v1';

  /**
   * Creates an instance of DeepSeekIntegration.
   * @param {string} [apiKey] - The DeepSeek API key.
   */
  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.DEEPSEEK_API_KEY;
  }

  /**
   * Generates emotionally congruent dialogue using the DeepSeek API.
   * @param {EmotionalContext} context - The emotional context.
   * @returns {Promise<NarrativeResponse>} The generated narrative response.
   */
  async generateEmotionalDialogue(context: EmotionalContext): Promise<NarrativeResponse> {
    if (!this.apiKey) {
      return this.getFallbackResponse(context);
    }

    try {
      const prompt = this.buildPrompt(context);
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });

      const json = await response.json();
      return this.parseNarrativeResponse(json);
    } catch (e) {
      return this.getFallbackResponse(context);
    }
  }

  private buildPrompt(context: EmotionalContext): string {
    return [
      'You are an emotionally intelligent narrative director.',
      `PLAYER EMOTION: ${context.emotion.primary}`,
      `EMOTIONAL INTENSITY: ${context.emotion.intensity}`,
      `STORY CONTEXT: ${context.storyContext}`,
      'Generate 2-3 sentences that match emotional tone. Respond with concise text.',
    ].join('\n');
  }

  private parseNarrativeResponse(_json: unknown): NarrativeResponse {
    // Placeholder parser: refine with strict schema once API contracts are finalized
    return {
      dialogue: 'Stay focused; your resolve shapes the path ahead.',
      tone: 'encouraging',
      impact: 'boost_focus',
    };
  }

  private getFallbackResponse(context: EmotionalContext): NarrativeResponse {
    const toneMap: Record<string, NarrativeResponse> = {
      FOCUSED_HIGH: {
        dialogue: 'Stay focused; your resolve shapes the path ahead.',
        tone: 'encouraging',
        impact: 'boost_focus',
      },
      RELAXED_CALM: {
        dialogue: 'Breathe easy; the world unfolds at your pace.',
        tone: 'calm',
        impact: 'maintain_flow',
      },
      ANXIOUS_STRESSED: {
        dialogue: 'You are safe; take a moment and steady yourself.',
        tone: 'reassuring',
        impact: 'reduce_stress',
      },
      CURIOUS_INTERESTED: {
        dialogue: 'Lean into discovery; every question opens a new door.',
        tone: 'inquisitive',
        impact: 'spark_curiosity',
      },
    };

    return toneMap[context.emotion.primary] ?? {
      dialogue: 'Let the narrative meet you where you are.',
      tone: 'neutral',
      impact: 'stabilize',
    };
  }
}