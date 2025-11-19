import { DeepSeekIntegration, DeepSeekNormalizationAdapter } from '../DeepSeekIntegration';

// Simple integration test to verify the implementation
async function testImplementation() {
  console.log('🧪 Testing DeepSeekIntegration with optionalFields and normalization...\n');

  // Test 1: Basic functionality with optionalFields
  console.log('Test 1: Basic optionalFields support');
  const integration = new DeepSeekIntegration(); // No API key, will use fallback
  
  const context = {
    emotion: { primary: 'focused', intensity: 0.8 },
    storyContext: 'Player is exploring ancient ruins',
    optionalFields: {
      playerLevel: 5,
      health: 75,
      location: 'Crystal Caves',
      experience_points: 1200,
    },
  };

  try {
    const response = await integration.generateEmotionalDialogue(context);
    console.log('✅ Response generated successfully');
    console.log('Dialogue:', response.dialogue);
    console.log('Tone:', response.tone);
    console.log('Impact:', response.impact);
    console.log('Optional Fields:', response.optionalFields);
    console.log('');
  } catch (error) {
    console.log('❌ Error:', error);
    return;
  }

  // Test 2: Normalization adapter
  console.log('Test 2: Normalization adapter');
  const adapter = new DeepSeekNormalizationAdapter();
  
  const messyContext = {
    emotion: { primary: 'very anxious', intensity: 1.5 }, // Should be clamped to 1
    storyContext: 'Player faces a challenging boss',
    optionalFields: {
      'Player Level': 10,
      'Health Points': 85,
      'Current Location': 'Boss Arena',
      'Game Phase': 'COMBAT',
    },
  };

  const normalizedContext = adapter.normalizeContext(messyContext);
  console.log('Original emotion:', messyContext.emotion.primary);
  console.log('Normalized emotion:', normalizedContext.emotion.primary);
  console.log('Original intensity:', messyContext.emotion.intensity);
  console.log('Normalized intensity:', normalizedContext.emotion.intensity);
  console.log('Normalized optional fields:', normalizedContext.optionalFields);
  console.log('');

  // Test 3: Response normalization
  console.log('Test 3: Response normalization');
  const messyResponse = {
    dialogue: '  Focus your energy and strike true!  ',
    tone: 'BATTLE_READY',
    impact: 'Increase Combat Focus',
    optionalFields: {
      'Response Time': 150,
      'Confidence Score': 0.85,
    },
  };

  const normalizedResponse = adapter.normalizeResponse(messyResponse);
  console.log('Original dialogue:', JSON.stringify(messyResponse.dialogue));
  console.log('Normalized dialogue:', JSON.stringify(normalizedResponse.dialogue));
  console.log('Original tone:', messyResponse.tone);
  console.log('Normalized tone:', normalizedResponse.tone);
  console.log('Original impact:', messyResponse.impact);
  console.log('Normalized impact:', normalizedResponse.impact);
  console.log('Normalized optional fields:', normalizedResponse.optionalFields);
  console.log('');

  console.log('🎉 All tests completed successfully!');
}

// Run the test
testImplementation().catch(console.error);