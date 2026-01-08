# Aionysus v2 - AI Wine Sommelier Platform

**Live at:** [aionysus.wine](https://aionysus.wine)
**Last Updated:** January 2026

---

## Project Overview

**Aionysus v2** is an AI-powered wine investment and e-commerce platform featuring:

| Feature | Technology | Status |
|---------|------------|--------|
| AI Sommelier | DIONYSUS (Pydantic AI on Railway) | Live |
| Chat Interface | CopilotKit + AG-UI protocol | Live |
| Voice | Hume EVI with CLM | Live |
| Dynamic Backgrounds | Unsplash API by region | Live |
| Investment Analytics | Recharts + custom components | Live |
| Authentication | Neon Auth (Google OAuth) | Live |
| Database | Neon PostgreSQL (3,835 wines) | Live |
| E-commerce | Shopify Storefront API | Pending |
| User Memory | Zep | Live |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Vercel - Next.js 16)                        │
├─────────────────────────────────────────────────────────────────┤
│  src/app/page.tsx          │  Main homepage with voice input    │
│  src/components/           │  UI components                     │
│    ├── voice-input.tsx     │  Wine glass voice button          │
│    ├── investment.tsx      │  Investment UI components         │
│    ├── charts.tsx          │  Wine charts (Recharts)           │
│    ├── DynamicBackground   │  Unsplash region backgrounds      │
│    └── providers.tsx       │  CopilotKit + Neon Auth           │
│  src/app/api/              │  API routes                       │
│    ├── copilotkit/         │  AG-UI proxy to agent             │
│    ├── hume-token/         │  Hume access tokens               │
│    └── zep-*/              │  Memory storage                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          AGENT                                   │
│            (Railway - Pydantic AI + FastAPI)                    │
├─────────────────────────────────────────────────────────────────┤
│  agent/src/agent.py                                             │
│    ├── DIONYSUS persona (wine sommelier)                        │
│    ├── /agui/              │  AG-UI protocol for CopilotKit    │
│    ├── /chat/completions   │  OpenAI-compatible for Hume CLM   │
│    └── /health             │  Health check                     │
│                                                                  │
│  Tools:                                                          │
│    ├── search_wines        │  Search by region/type/price      │
│    ├── get_wine_details    │  Single wine info                 │
│    ├── show_wine_regions   │  Region distribution chart        │
│    ├── show_wine_types     │  Type distribution chart          │
│    ├── get_investment_wines│  Top investment-grade wines       │
│    ├── show_investment_chart│ Price history visualization      │
│    ├── calculate_wine_roi  │  ROI with storage costs           │
│    ├── build_portfolio     │  Diversified portfolio builder    │
│    ├── get_food_pairings   │  Food pairing suggestions         │
│    └── show_wine_market    │  Market overview dashboard        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE                                  │
│              (Neon PostgreSQL - aionysus.wine)                  │
├─────────────────────────────────────────────────────────────────┤
│  wines (3,835 rows)                                             │
│    ├── Core: id, name, winery, region, country, grape_variety  │
│    ├── Details: vintage, wine_type, style, color, tasting_notes│
│    ├── Pricing: price_retail, price_trade                      │
│    ├── Investment: price_history (JSONB), investment_score,    │
│    │               is_investment_grade, storage_type,          │
│    │               five_year_return, liv_ex_score              │
│    └── Commerce: stock_quantity, slug, is_active               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key URLs

| Service | URL |
|---------|-----|
| Production Site | https://aionysus.wine |
| Agent (Railway) | https://aionysus-agent-production.up.railway.app |
| Agent Health | https://aionysus-agent-production.up.railway.app/health |
| AG-UI Endpoint | https://aionysus-agent-production.up.railway.app/agui/ |
| Hume CLM | https://aionysus-agent-production.up.railway.app/chat/completions |
| Vercel Dashboard | Vercel → aionysus-v2 |
| Railway Dashboard | Railway → aionysus-agent |
| Neon Console | Neon → aionysus.wine project |

---

## Environment Variables

### Vercel (Frontend)
```env
DATABASE_URL=postgresql://neondb_owner:***@ep-square-frog-abxc6js2-pooler.eu-west-2.aws.neon.tech/neondb
NEXT_PUBLIC_AGENT_URL=https://aionysus-agent-production.up.railway.app
NEON_AUTH_BASE_URL=https://ep-square-frog-abxc6js2.neonauth.eu-west-2.aws.neon.tech/neondb/auth
NEXT_PUBLIC_HUME_CONFIG_ID=29cec14d-5272-4a79-820d-382dc0d0e801
HUME_API_KEY=***
HUME_SECRET_KEY=***
NEXT_PUBLIC_HUME_API_KEY=***
ZEP_API_KEY=***
```

### Railway (Agent)
```env
DATABASE_URL=postgresql://neondb_owner:***@ep-square-frog-abxc6js2-pooler.eu-west-2.aws.neon.tech/neondb
GROQ_API_KEY=***
ZEP_API_KEY=***
```

---

## Wine Investment Data

### Investment Columns
| Column | Type | Description |
|--------|------|-------------|
| price_history | JSONB | Array of {year, price, trend, volume} |
| investment_score | DECIMAL(3,1) | 1-10 score based on appreciation + prestige |
| is_investment_grade | BOOLEAN | True if score >= 7 or high-value region |
| storage_type | VARCHAR(20) | 'bonded', 'private_cellar', 'retail' |
| five_year_return | DECIMAL(5,1) | Percentage return over 5 years |
| liv_ex_score | INTEGER | Liv-ex rating (70-100) for investment wines |

### Investment-Grade Criteria
- Region: Bordeaux, Burgundy, Champagne, Tuscany, Piedmont, Rhône, Napa
- Classification: First Growth, Grand Cru, Premier Cru, Super Tuscan
- Price: >= £100 retail OR >= £500 any region

---

## Voice Input

### Hume Configuration
- **Config ID:** `29cec14d-5272-4a79-820d-382dc0d0e801`
- **CLM Endpoint:** `/chat/completions` (OpenAI-compatible)
- **System Prompt:** DIONYSUS wine sommelier persona

### Phonetic Corrections
```python
PHONETIC_CORRECTIONS = {
    "bow jo lay": "beaujolais",
    "shard oh nay": "chardonnay",
    "pin oh noir": "pinot noir",
    "bor doh": "bordeaux",
    "burr gun dee": "burgundy",
    "shah toe": "chateau",
    "doe main": "domaine",
    # ... 30+ wine terms
}
```

---

## Generative UI Components

### AG-UI Tool Renderers (page.tsx)
| Tool | Component | Purpose |
|------|-----------|---------|
| show_wine_regions | WineRegionChart | Bar chart by region |
| show_wine_types | WineTypeChart | Pie chart by type |
| show_investment_chart | InvestmentPriceChart | Area chart with price history |
| get_investment_wines | InvestmentWinesGrid | Grid of investment wine cards |
| calculate_wine_roi | ROICalculator | ROI breakdown with costs |
| build_portfolio | PortfolioBuilder | Portfolio pie chart + holdings |
| search_wines | WineCard grid | Search results display |
| get_food_pairings | Pairing cards | Food suggestions |
| show_taste_profile | ForceGraph3D | 3D taste profile graph |

---

## Development Commands

```bash
# Start development (frontend + local agent)
npm run dev

# Start frontend only
npm run dev:ui

# Start agent only
cd agent && uv run uvicorn src.agent:app --reload --port 8000

# Deploy agent to Railway
cd agent && railway up

# Update agent dependencies
cd agent && uv lock --upgrade && uv sync
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main homepage with CopilotSidebar |
| `src/components/voice-input.tsx` | Wine glass voice button |
| `src/components/investment.tsx` | Investment UI components |
| `src/components/DynamicBackground.tsx` | Unsplash region backgrounds |
| `src/components/providers.tsx` | CopilotKit + Neon Auth providers |
| `src/app/api/copilotkit/route.ts` | AG-UI proxy route |
| `agent/src/agent.py` | DIONYSUS Pydantic AI agent |
| `scripts/add-investment-data.mjs` | Mock investment data generator |

---

## Roadmap

See `plan.md` for comprehensive development plan.

### Immediate Priorities
1. Fix AG-UI chat responses
2. Add Navbar with search and categories
3. Create wine listing pages (`/wines`)
4. Create wine product pages (`/wine/[slug]`)
5. Integrate Shopify cart

### Future Features
- User dashboard with saved wines
- Investment portfolio tracking
- Price alerts
- Order history
