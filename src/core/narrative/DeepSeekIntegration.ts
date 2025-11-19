export interface EmotionalContext {
  emotion: { primary: string; intensity: number };
  storyContext: string;
  optionalFields?: Record<string, any>;
}

export interface NarrativeResponse {
  dialogue: string;
  tone: string;
  impact: string;
  optionalFields?: Record<string, any>;
}

export class DeepSeekIntegration {
  private readonly apiKey: string | undefined;
  private readonly baseURL = 'https://api.deepseek.com/v1';
  private readonly normalizer: DeepSeekNormalizationAdapter;

  constructor(apiKey?: string, normalizer?: DeepSeekNormalizationAdapter) {
    this.apiKey = apiKey ?? process.env.DEEPSEEK_API_KEY;
    this.normalizer = normalizer ?? new DeepSeekNormalizationAdapter();
  }

  async generateEmotionalDialogue(context: EmotionalContext): Promise<NarrativeResponse> {
    // Normalize the input context
    const normalizedContext = this.normalizer.normalizeContext(context);
    
    if (!this.apiKey) {
      const fallbackResponse = this.getFallbackResponse(normalizedContext);
      return this.normalizer.normalizeResponse(fallbackResponse);
    }

    try {
      const prompt = this.buildPrompt(normalizedContext);
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
      const parsedResponse = this.parseNarrativeResponse(json);
      return this.normalizer.normalizeResponse(parsedResponse);
    } catch (e) {
      const fallbackResponse = this.getFallbackResponse(normalizedContext);
      return this.normalizer.normalizeResponse(fallbackResponse);
    }
  }

  private buildPrompt(context: EmotionalContext): string {
    const basePrompt = [
      'You are an emotionally intelligent narrative director.',
      `PLAYER EMOTION: ${context.emotion.primary}`,
      `EMOTIONAL INTENSITY: ${context.emotion.intensity}`,
      `STORY CONTEXT: ${context.storyContext}`,
    ];

    if (context.optionalFields) {
      const optionalFieldsText = Object.entries(context.optionalFields)
        .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
        .join('\n');
      basePrompt.push(optionalFieldsText);
    }

    basePrompt.push('Generate 2-3 sentences that match emotional tone. Respond with concise text.');
    
    return basePrompt.join('\n');
  }

  private parseNarrativeResponse(json: unknown): NarrativeResponse {
    // Enhanced parser that handles optional fields from DeepSeek API response
    const response = json as any;
    
    // Extract base response fields
    const dialogue = response.choices?.[0]?.message?.content || 'Stay focused; your resolve shapes the path ahead.';
    const tone = response.tone || 'encouraging';
    const impact = response.impact || 'boost_focus';
    
    // Extract optional fields if present in response
    const optionalFields: Record<string, any> = {};
    if (response.metadata) {
      optionalFields.metadata = response.metadata;
    }
    if (response.confidence) {
      optionalFields.confidence = response.confidence;
    }
    if (response.suggestions) {
      optionalFields.suggestions = response.suggestions;
    }
    
    return {
      dialogue: dialogue.trim(),
      tone,
      impact,
      ...(Object.keys(optionalFields).length > 0 && { optionalFields }),
    };
  }

  private getFallbackResponse(context: EmotionalContext): NarrativeResponse {
    const baseResponse = this.getBaseFallbackResponse(context.emotion.primary);
    
    // Include optional fields from context in fallback response
    if (context.optionalFields) {
      return {
        ...baseResponse,
        optionalFields: {
          fallback: true,
          contextFields: context.optionalFields, // Preserve original field names
          timestamp: Date.now(),
        },
      };
    }
    
    return baseResponse;
  }

  private getBaseFallbackResponse(emotionPrimary: string): NarrativeResponse {
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

    return toneMap[emotionPrimary] ?? {
      dialogue: 'Let the narrative meet you where you are.',
      tone: 'neutral',
      impact: 'stabilize',
    };
  }
}

export class DeepSeekNormalizationAdapter {
  normalizeContext(context: EmotionalContext): EmotionalContext {
    const normalized = { ...context };
    
    // Normalize emotion primary to uppercase with underscores
    if (normalized.emotion?.primary) {
      normalized.emotion.primary = normalized.emotion.primary
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/[^A-Z0-9_]/g, '');
    }
    
    // Ensure intensity is a number between 0 and 1
    if (normalized.emotion?.intensity !== undefined) {
      normalized.emotion.intensity = Math.max(0, Math.min(1, Number(normalized.emotion.intensity) || 0));
    }
    
    // Normalize optional fields
    if (normalized.optionalFields) {
      normalized.optionalFields = this.normalizeOptionalFields(normalized.optionalFields);
    }
    
    return normalized;
  }
  
  private normalizeOptionalFields(fields: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(fields)) {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      
      // Normalize specific known fields
      if (normalizedKey === 'player_level' || normalizedKey === 'level') {
        normalized.player_level = Math.max(1, Math.floor(Number(value) || 1));
      } else if (normalizedKey === 'experience_points' || normalizedKey === 'xp') {
        normalized.experience_points = Math.max(0, Number(value) || 0);
      } else if (normalizedKey === 'health' || normalizedKey === 'player_health') {
        normalized.player_health = Math.max(0, Number(value) || 100);
      } else if (normalizedKey === 'game_phase' || normalizedKey === 'phase') {
        normalized.game_phase = String(value).toLowerCase();
      } else if (normalizedKey === 'location' || normalizedKey === 'current_location') {
        normalized.current_location = String(value).trim();
      } else {
        // Default normalization for unknown fields
        normalized[normalizedKey] = this.normalizeValue(value);
      }
    }
    
    return normalized;
  }
  
  private normalizeValue(value: any): any {
    if (typeof value === 'string') {
      return value.trim();
    } else if (typeof value === 'number') {
      return value;
    } else if (typeof value === 'boolean') {
      return value;
    } else if (Array.isArray(value)) {
      return value.map(v => this.normalizeValue(v));
    } else if (value && typeof value === 'object') {
      return this.normalizeOptionalFields(value);
    }
    return String(value);
  }
  
  normalizeResponse(response: NarrativeResponse): NarrativeResponse {
    const normalized = { ...response };
    
    // Normalize dialogue - ensure it's a non-empty string
    if (!normalized.dialogue || typeof normalized.dialogue !== 'string') {
      normalized.dialogue = 'Let the narrative meet you where you are.';
    } else {
      normalized.dialogue = normalized.dialogue.trim();
    }
    
    // Normalize tone to lowercase
    if (normalized.tone) {
      normalized.tone = normalized.tone.toLowerCase();
    } else {
      normalized.tone = 'neutral';
    }
    
    // Normalize impact to lowercase with underscores
    if (normalized.impact) {
      normalized.impact = normalized.impact
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    } else {
      normalized.impact = 'stabilize';
    }
    
    // Normalize optional fields in response, but preserve certain field names
    if (normalized.optionalFields) {
      normalized.optionalFields = this.normalizeResponseOptionalFields(normalized.optionalFields);
    }
    
    return normalized;
  }

  private normalizeResponseOptionalFields(fields: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(fields)) {
      // Preserve certain field names that are commonly used in API responses
      const preservedFields = ['metadata', 'confidence', 'suggestions', 'responseTime', 'processingTime', 'model'];
      
      if (preservedFields.includes(key)) {
        normalized[key] = value; // Preserve original field name
      } else {
        // Normalize other fields
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
        normalized[normalizedKey] = this.normalizeValue(value);
      }
    }
    
    return normalized;
  }
}