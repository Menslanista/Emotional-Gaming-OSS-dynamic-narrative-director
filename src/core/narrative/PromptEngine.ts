import type { FusedEmotion } from '../emotion/EmotionFusionEngine';

export interface EmotionalContext {
  emotion: FusedEmotion;
  storyContext: string;
  character?: string;
  previousDialogue?: string;
  location?: string;
  relationshipStatus?: number;
}

export interface PromptTemplate {
  system: string;
  user: string;
  responseFormat: Record<string, any>;
  temperature: number;
  maxTokens: number;
}

export class PromptEngine {
  private readonly templates: Record<string, PromptTemplate> = {
    emotional_dialogue: {
      system: `You are an emotionally intelligent narrative director for Synaptic Wars, a neuro-scientific video game set in the human brain.
      
SYNAPTIC WARS CONTEXT:
- Setting: Inside the human brain, battling Tau Tanglers (corrupted proteins)
- Theme: Neuroplasticity, cognitive enhancement, mental health
- Tone: Scientific wonder mixed with epic adventure
- Characters: Neural entities, cognitive functions personified

YOUR ROLE:
- Generate dialogue that matches the player's emotional state
- Advance the neuro-themed narrative naturally
- Maintain scientific plausibility while being engaging
- Create authentic character voices for brain-themed entities`,

      user: `Generate emotionally congruent dialogue for Synaptic Wars.

PLAYER EMOTIONAL STATE:
- Primary Emotion: {emotion}
- Emotional Intensity: {intensity}%
- Confidence: {confidence}%

STORY CONTEXT:
- Current Situation: {context}
- Speaking Character: {character}
- Location: {location}
- Previous Interaction: {previous}

CHARACTER PROFILES:
- NEURON_GUARDIAN: Wise, protective, speaks in electrical metaphors
- TAU_TANGLER: Corrupting, deceptive, uses memory distortion
- SEROTONIN_SPIRIT: Healing, optimistic, uses chemical analogies
- DOPAMINE_SEEKER: Energetic, reward-focused, impatient

Generate 2-3 sentences of dialogue that:
1. Matches the emotional tone precisely
2. Advances the neural pathway narrative
3. Uses appropriate scientific metaphors
4. Feels authentic to the character
5. Maintains story coherence

Response format: JSON with dialogue, emotionalTone, and narrativeImpact`,

      responseFormat: { 
        type: 'json_object',
        schema: {
          dialogue: 'string',
          emotionalTone: 'string', 
          narrativeImpact: 'low|medium|high',
          characterConsistency: 'number'
        }
      },
      temperature: 0.7,
      maxTokens: 150
    },

    narrative_adjustment: {
      system: `You are a narrative adaptation engine for Synaptic Wars. Adjust story elements based on player engagement.`,

      user: `Analyze player emotional state and suggest narrative adjustments.

CURRENT PLAYER STATE:
- Emotional Arc: {emotionalArc}
- Engagement Level: {engagement}
- Recent Challenges: {challenges}
- Story Progress: {progress}

Suggest 2-3 specific narrative adjustments that would:
1. Enhance emotional engagement
2. Maintain appropriate challenge level  
3. Advance the neuro-scientific theme
4. Respect player agency

Focus on Synaptic Wars elements: neural pathways, cognitive functions, brain chemistry.`,

      responseFormat: {
        type: 'json_object',
        schema: {
          adjustments: 'string[]',
          rationale: 'string',
          expectedImpact: 'low|medium|high'
        }
      },
      temperature: 0.5,
      maxTokens: 200
    },

    quest_generation: {
      system: `You are a quest designer for Synaptic Wars. Create emotionally-responsive missions.`,

      user: `Generate a neuro-themed quest based on player emotional state.

PLAYER EMOTION: {emotion}
INTENSITY: {intensity}

QUEST REQUIREMENTS:
- Must involve neural pathways or brain functions
- Should match emotional tone
- Include scientific learning elements
- Provide appropriate challenge

Generate a quest with: title, objective, emotionalRationale, and scientificBasis`,

      responseFormat: {
        type: 'json_object', 
        schema: {
          title: 'string',
          objective: 'string',
          emotionalRationale: 'string',
          scientificBasis: 'string',
          difficulty: 'easy|medium|hard'
        }
      },
      temperature: 0.6,
      maxTokens: 180
    }
  };

  buildPrompt(templateName: string, context: EmotionalContext): { prompt: string; config: PromptTemplate } {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Unknown prompt template: ${templateName}`);
    }

    const prompt = template.user
      .replace('{emotion}', context.emotion.primary)
      .replace('{intensity}', (context.emotion.intensity * 100).toFixed(0))
      .replace('{confidence}', (context.emotion.confidence * 100).toFixed(0))
      .replace('{context}', context.storyContext || 'Exploring neural pathways')
      .replace('{character}', context.character || 'NEURON_GUARDIAN')
      .replace('{location}', context.location || 'Hippocampus region')
      .replace('{previous}', context.previousDialogue || 'No previous interaction');

    return { prompt, config: template };
  }

  validateResponse(response: any, templateName: string): boolean {
    const template = this.templates[templateName];
    if (!template?.responseFormat?.schema) return true;

    const schema = template.responseFormat.schema;
    
    try {
      if (!('emotionalTone' in response) && 'tone' in response) {
        (response as any).emotionalTone = (response as any).tone;
      }
      for (const [key, type] of Object.entries(schema)) {
        if (!(key in response)) {
          if (key === 'narrativeImpact' || key === 'characterConsistency') continue;
          console.warn(`Missing required field in response: ${key}`);
          return false;
        }

        // Basic type validation
        if (typeof type === 'string') {
          if (type.includes('|')) {
            // Enum validation
            const validValues = type.split('|');
            if (!validValues.includes((response as any)[key])) {
              console.warn(`Invalid value for ${key}: ${(response as any)[key]}`);
              return false;
            }
          } else if (typeof (response as any)[key] !== type) {
            console.warn(`Type mismatch for ${key}: expected ${type}, got ${typeof (response as any)[key]}`);
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Response validation error:', error);
      return false;
    }
  }

  getAvailableTemplates(): string[] {
    return Object.keys(this.templates);
  }

  createCustomTemplate(name: string, template: PromptTemplate): void {
    this.templates[name] = template;
  }
}