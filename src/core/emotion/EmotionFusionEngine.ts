/**
 * An interface representing a fused emotional state, combining multiple inputs.
 * @property {"FOCUSED_HIGH" | "RELAXED_CALM" | "ANXIOUS_STRESSED" | "CURIOUS_INTERESTED"} primary - The primary emotion.
 * @property {number} intensity - The intensity of the emotion, from 0 to 1.
 * @property {number} confidence - The confidence of the emotion detection, from 0 to 1.
 * @property {Record<string, number>} components - The contributions of different emotional components.
 * @property {number} timestamp - The time the emotion was fused, in epoch milliseconds.
 */
export interface FusedEmotion {
  primary: 'FOCUSED_HIGH' | 'RELAXED_CALM' | 'ANXIOUS_STRESSED' | 'CURIOUS_INTERESTED';
  intensity: number; // 0-1
  confidence: number; // 0-1
  components: Record<string, number>; // optional component contributions
  timestamp: number; // epoch ms
}

/**
 * An interface representing the emotional context of the user.
 * @property {FusedEmotion} emotion - The fused emotional state.
 * @property {string} storyContext - The current context of the story.
 * @property {string} [character] - The character the user is interacting with.
 * @property {string} [previousDialogue] - The previous line of dialogue.
 * @property {string} [location] - The current location in the story.
 * @property {number} [relationshipStatus] - The user's relationship status with the character.
 */
export interface EmotionalContext {
  emotion: FusedEmotion;
  storyContext: string;
  character?: string;
  previousDialogue?: string;
  location?: string;
  relationshipStatus?: number;
}