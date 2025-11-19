# Dynamic Narrative Director

Emotionally intelligent narrative framework with real-time EEG emotion detection, DeepSeek integration, and a web dashboard. This project aims to create a dynamic storytelling experience that adapts to the user's emotional state in real-time.

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Lint and format check
npm run lint
npm run format:check
```

## Project Structure

```
src/
  core/
    dashboard/RealtimeDashboard.ts
    device/MuseConnector.ts
    emotion/EEGEmotionMapper.ts
    emotion/EmotionFusionEngine.ts
    monitoring/PerformanceMonitor.ts
    narrative/DeepSeekIntegration.ts
    narrative/PromptEngine.ts
    narrative/ResponseCache.ts
  test/
    setup.ts
  App.tsx
  main.tsx
```

## Core Components

### Dashboard

- **RealtimeDashboard**: Manages and broadcasts real-time performance metrics.

### Device

- **MuseConnector**: Connects to and streams data from a Muse EEG device.

### Emotion

- **EEGEmotionMapper**: Maps EEG data to emotional states.
- **EmotionFusionEngine**: Defines interfaces for fused emotional states and emotional context.

### Monitoring

- **PerformanceMonitor**: Monitors and reports performance metrics.

### Narrative

- **DeepSeekIntegration**: Integrates with the DeepSeek API to generate narrative content.
- **PromptEngine**: Builds and manages prompts for a language model.
- **ResponseCache**: Caches responses from a language model.

## Usage

### Connecting to a Muse Device

To connect to a Muse device, create an instance of the `MuseConnector` and call the `requestAndConnect` method. You can then register a handler to receive EEG samples.

```typescript
import { MuseConnector } from './src/core/device/MuseConnector';

const connector = new MuseConnector();

async function connect() {
  await connector.requestAndConnect();
  connector.onSample((sample) => {
    console.log('Received EEG sample:', sample);
  });
}
```

### Mapping EEG to Emotions

The `EEGEmotionMapper` can be used to map EEG samples to emotional states.

```typescript
import { EEGEmotionMapper } from './src/core/emotion/EEGEmotionMapper';

const mapper = new EEGEmotionMapper();

// Assuming you have an array of EEG samples and a sample rate
const emotionalState = mapper.mapToEmotionalState(
  mapper.analyzeFrequencyBands(eegSamples, sampleRate)
);
```

### Generating Narrative Content

The `DeepSeekIntegration` class can be used to generate narrative content based on the user's emotional state.

```typescript
import { DeepSeekIntegration } from './src/core/narrative/DeepSeekIntegration';

const integration = new DeepSeekIntegration();

async function generateDialogue(emotion, storyContext) {
  const response = await integration.generateEmotionalDialogue({
    emotion,
    storyContext,
  });
  console.log('Generated dialogue:', response.dialogue);
}
```

## Environment

- Create an `.env.local` file and set `DEEPSEEK_API_KEY`.
- See `.env.example` for the expected variables.

## License

MIT
