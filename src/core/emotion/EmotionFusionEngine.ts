export interface FusedEmotion {
  primary: 'FOCUSED_HIGH' | 'RELAXED_CALM' | 'ANXIOUS_STRESSED' | 'CURIOUS_INTERESTED';
  intensity: number; // 0-1
  confidence: number; // 0-1
  components: Record<string, number>; // optional component contributions
  timestamp: number; // epoch ms
}

export interface EmotionalContext {
  emotion: FusedEmotion;
  storyContext: string;
  character?: string;
  previousDialogue?: string;
  location?: string;
  relationshipStatus?: number;
}