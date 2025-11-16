# Development Setup

## Prerequisites
- Node.js 18+
- npm 9+

## Install
```bash
npm install
```

## Environment Variables
Create `.env.local` in the project root with:
```
DEEPSEEK_API_KEY=your_key_here
```

## Scripts
- `npm run dev` – start Vite dev server
- `npm run build` – build production bundle
- `npm run test` – run unit tests
- `npm run lint` – lint codebase
- `npm run format:check` – check formatting

## Troubleshooting
- Clear `node_modules` and reinstall if deps conflict.
- Ensure ports 5173/4173 are available for dev/preview.