# Dynamic Narrative Director

Emotionally intelligent narrative framework with real-time EEG emotion detection, DeepSeek integration, and a web dashboard. Phase 1 focuses on infrastructure, emotion detection core, narrative API, and CI/CD.

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
    emotion/EEGEmotionMapper.ts
    narrative/DeepSeekIntegration.ts
  App.tsx
  main.tsx
```

## Environment

- Create an `.env.local` file and set `DEEPSEEK_API_KEY`.
- See `.env.example` for the expected variables.

## License

MIT