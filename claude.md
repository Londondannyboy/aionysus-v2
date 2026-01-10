# Aionysus v2 - AI Wine Sommelier Platform

**Live at:** [aionysus.wine](https://aionysus.wine)
**Last Updated:** January 10, 2026

---

## Project Overview

**Aionysus v2** is an AI-powered wine investment and e-commerce platform featuring:

| Feature | Technology | Status |
|---------|------------|--------|
| AI Sommelier | DIONYSUS (Pydantic AI on Railway) | **Live** |
| Chat Interface | CopilotKit + AG-UI protocol | **Live** |
| Voice | Hume EVI with CLM | **Live** |
| Wine Listings | `/wines` with search & filters | **Live** |
| Wine Detail Pages | `/wines/[slug]` with SEO | **Live** |
| Category Pages | `/wines/category/[type]` | **Live** |
| Shopping Cart | localStorage + Shopify ready | **Live** |
| NavBar | Categories dropdown + cart count | **Live** |
| Dynamic Backgrounds | Unsplash API by region | **Live** |
| Investment Analytics | Recharts + custom components | **Live** |
| Authentication | Neon Auth (Google OAuth) | **Live** |
| Database | Neon PostgreSQL (3,835 wines) | **Live** |
| E-commerce | Shopify Storefront API | **Ready** |
| User Memory | Zep | **Live** |

---

## Recent Changes (January 2026)

### Wine E-commerce Pages Created
- `/wines` - Main listing with search, type/price/region/winery filters
- `/wines/[slug]` - Product detail pages with SEO, schema.org markup, add to cart
- `/wines/category/[type]` - Category pages (red, white, rose, champagne, sparkling, dessert)
- `/cart` - Shopping cart with quantity controls, localStorage persistence
- `NavBar.tsx` - Navigation with wine categories dropdown, cart count badge
- `UserMenu.tsx` - User dropdown with sign out

### Agent User Context Improvements
- `extract_user_from_hume_messages()` - Extracts name from:
  - System prompt patterns: `Name: X`, session ID `name|aionysus_userid`
  - User messages: "my name is X", "I'm X", "call me X"
- User context placed at TOP of system prompt with explicit rules
- Falls back to cached context from CopilotKit middleware

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                    (Vercel - Next.js 16)                        │
├─────────────────────────────────────────────────────────────────┤
│  src/app/                                                        │
│    ├── page.tsx            │  Homepage with CopilotSidebar       │
│    ├── wines/                                                    │
│    │   ├── page.tsx        │  Wine listing (3,835 wines)        │
│    │   ├── [slug]/page.tsx │  Wine detail with SEO              │
│    │   └── category/[type] │  Red, white, rose, etc.            │
│    ├── cart/page.tsx       │  Shopping cart                     │
│    └── api/                                                      │
│        ├── wines/route.ts  │  GET /api/wines                    │
│        ├── copilotkit/     │  AG-UI proxy to agent              │
│        ├── hume-token/     │  Hume access tokens                │
│        └── zep-*/          │  Memory storage                    │
│                                                                  │
│  src/components/                                                 │
│    ├── NavBar.tsx          │  Navigation + categories + cart    │
│    ├── UserMenu.tsx        │  User dropdown menu                │
│    ├── voice-input.tsx     │  Wine glass voice button           │
│    ├── investment.tsx      │  Investment UI components          │
│    └── providers.tsx       │  CopilotKit + Neon Auth            │
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
│  User Context Extraction:                                        │
│    ├── extract_user_from_instructions()  │ CopilotKit           │
│    ├── extract_user_from_hume_messages() │ Hume CLM             │
│    └── _cached_user_context              │ Fallback cache       │
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
│    ├── Core: id, name, slug, winery, region, country,          │
│    │         grape_variety                                      │
│    ├── Details: vintage, wine_type, style, color, is_active    │
│    ├── Pricing: price_retail, price_trade                      │
│    ├── Investment: price_history (JSONB), investment_score,    │
│    │               is_investment_grade, storage_type,          │
│    │               five_year_return, liv_ex_score              │
│    ├── Media: image_url (Cloudinary)                           │
│    └── Commerce: stock_quantity                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key URLs

| Service | URL |
|---------|-----|
| Production Site | https://aionysus.wine |
| Wine Listings | https://aionysus.wine/wines |
| Agent (Railway) | https://aionysus-agent-production.up.railway.app |
| Agent Health | https://aionysus-agent-production.up.railway.app/health |
| AG-UI Endpoint | https://aionysus-agent-production.up.railway.app/agui/ |
| Hume CLM | https://aionysus-agent-production.up.railway.app/chat/completions |

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
NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN=***
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=aionysus.myshopify.com
```

### Railway (Agent)
```env
DATABASE_URL=postgresql://neondb_owner:***@ep-square-frog-abxc6js2-pooler.eu-west-2.aws.neon.tech/neondb
GROQ_API_KEY=***
ZEP_API_KEY=***
```

---

## Key Files

### Frontend
| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Homepage with CopilotSidebar |
| `src/app/wines/page.tsx` | Wine listing with search & filters |
| `src/app/wines/[slug]/page.tsx` | Wine detail page (server) with SEO |
| `src/app/wines/[slug]/WineDetailClient.tsx` | Wine detail (client) with cart |
| `src/app/wines/category/[type]/page.tsx` | Category pages |
| `src/app/cart/page.tsx` | Shopping cart |
| `src/app/api/wines/route.ts` | GET /api/wines API |
| `src/components/NavBar.tsx` | Navigation with categories |
| `src/components/UserMenu.tsx` | User dropdown menu |
| `src/components/voice-input.tsx` | Wine glass voice button |
| `src/components/providers.tsx` | CopilotKit + Neon Auth |

### Agent
| File | Purpose |
|------|---------|
| `agent/src/agent.py` | DIONYSUS Pydantic AI agent |
| `agent/pyproject.toml` | Python dependencies (uv) |

---

## Development Commands

```bash
# Start frontend development
npm run dev

# Start agent locally
cd agent && uv run uvicorn src.agent:app --reload --port 8000

# Deploy agent to Railway (from agent directory)
cd agent && git add . && git commit -m "msg" && git push origin main

# Build check
npm run build
```

---

## Known Issues / In Progress

### User Context (ACTIVE)
**Problem:** Hume voice may not be passing user name to CLM endpoint properly.

**Current Solution:**
- Agent extracts name from system prompt and user messages
- Falls back to cached context from CopilotKit
- Explicit rules in system prompt to respond with user's name

**To Test:**
1. Sign in to aionysus.wine
2. Open voice input (wine glass button)
3. Say "My name is [your name]" or "What is my name?"
4. Agent should recognize and use the name

### CopilotKit Chat
- Working but may need context improvement
- Uses AG-UI protocol via `/agui/` endpoint

---

## Hume EVI Configuration

- **Config ID:** `29cec14d-5272-4a79-820d-382dc0d0e801`
- **CLM Endpoint:** `/chat/completions` (OpenAI-compatible)
- **Session ID Format:** `{name}|aionysus_{userId}` or `{userId}` if no name

### Phonetic Corrections (agent.py)
```python
PHONETIC_CORRECTIONS = {
    "bow jo lay": "beaujolais",
    "shard oh nay": "chardonnay",
    "pin oh noir": "pinot noir",
    "bor doh": "bordeaux",
    "burr gun dee": "burgundy",
    # ... 30+ wine terms
}
```

---

## Shopify Integration

**Store:** aionysus.myshopify.com
**Status:** Credentials in .env, ready for Storefront API integration

The cart currently uses localStorage. Shopify integration is ready but needs:
1. Product sync (wines DB → Shopify products)
2. Storefront API checkout flow

---

## Testing the Agent

### Test Hume CLM directly:
```bash
curl -X POST https://aionysus-agent-production.up.railway.app/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "Name: Dan"},
      {"role": "user", "content": "What is my name?"}
    ]
  }'
```

### Test AG-UI (CopilotKit):
```bash
curl https://aionysus-agent-production.up.railway.app/health
```
