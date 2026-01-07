# Aionysus v2 - AI Wine Sommelier

An AI-powered wine e-commerce platform featuring voice-first recommendations, investment insights, and dynamic region-based UI.

## Features

- **DIONYSUS Agent** - AI sommelier powered by Pydantic AI
- **CopilotKit Chat** - Generative UI with wine cards, charts
- **Hume Voice** - Voice-first wine recommendations
- **Dynamic Backgrounds** - Region imagery changes as you explore wines
- **Investment Charts** - Wine value trends over time
- **Shopify Integration** - Full cart and checkout

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS
- **Backend**: Pydantic AI agent on Railway
- **Database**: Neon PostgreSQL (Sommelier - 3,800+ wines)
- **Voice**: Hume EVI
- **Memory**: Zep Cloud
- **E-commerce**: Shopify Storefront API

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your keys
```

3. Start development:
```bash
npm run dev
```

## Documentation

- See `CLAUDE.md` for project architecture
- See `plan.md` for implementation roadmap

## Related

- Original Aionysus: https://aionysus.wine
- Clone source: copilotkit-demo

## License

MIT
