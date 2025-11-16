export interface EmotionalContext {
  emotion: { primary: string; intensity: number };
  storyContext: string;
}

export interface NarrativeResponse {
  dialogue: string;
  tone: string;
  impact: string;
}

export class DeepSeekIntegration {
  private readonly apiKey: string | undefined;
  private readonly baseURL = 'https://api.deepseek.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.DEEPSEEK_API_KEY;
  }

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