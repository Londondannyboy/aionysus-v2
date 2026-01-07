# Aionysus v2 - AI Wine Sommelier Platform

## Project Overview

**Aionysus v2** is an AI-powered wine e-commerce platform featuring:
- **DIONYSUS** - AI sommelier agent (Pydantic AI)
- **CopilotKit** - Chat interface with generative UI
- **Hume Voice** - Voice-first wine recommendations
- **Dynamic Backgrounds** - Region imagery that changes based on wine discussion
- **Investment Charts** - Wine value trends using recharts
- **Shopify Integration** - Full cart and checkout flow
- **Zep Memory** - Remembers user wine preferences

## Origin

This project was cloned from `copilotkit-demo` (fractional jobs platform) on 2025-01-07.
The base project had excellent CopilotKit + Pydantic AI + Zep integration that we're adapting for wine.

---

## Architecture

```
Frontend (Next.js 16)              Backend (Pydantic AI on Railway)
├── src/app/page.tsx               ├── agent/src/agent.py
├── src/components/                │   ├── DIONYSUS persona
│   ├── wine/                      │   ├── Wine search tools
│   │   ├── WineCard.tsx           │   ├── Investment tools
│   │   ├── InvestmentChart.tsx    │   ├── Shopify cart tools
│   │   └── RegionBackground.tsx   │   └── Zep memory
│   ├── charts.tsx                 └── Neon PostgreSQL (Sommelier)
│   ├── ForceGraph3D.tsx
│   └── voice-input.tsx
└── src/app/api/
    ├── hume-token/
    ├── zep-store/
    ├── zep-context/
    ├── copilotkit/
    └── shopify/
```

---

## Database: Sommelier (Neon)

**Connection:**
```
DATABASE_URL=postgresql://neondb_owner:npg_aT0PxdZwmD9i@ep-sweet-wildflower-abmn8fp7-pooler.eu-west-2.aws.neon.tech/neondb
```

**Schema (existing from aionysus v1):**
```sql
-- wines table (3,800+ wines)
CREATE TABLE wines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  winery TEXT,
  region TEXT,
  country TEXT,
  grape_variety TEXT,
  vintage INTEGER,
  wine_type TEXT,
  style TEXT,
  color TEXT,
  price_retail DECIMAL(10,2),
  price_trade DECIMAL(10,2),
  bottle_size TEXT,
  tasting_notes TEXT,
  critic_scores JSONB,
  drinking_window TEXT,
  classification TEXT,
  image_url TEXT,
  stock_quantity INTEGER,
  case_size INTEGER,
  is_active BOOLEAN DEFAULT true,
  slug TEXT UNIQUE
);
```

---

## Agent Persona: DIONYSUS

Wine sommelier AI assistant with:
- Expert wine knowledge (regions, varietals, vintages)
- Investment advice for fine wines
- Food pairing recommendations
- Personalized via Zep memory

### Phonetic Corrections for Voice

```python
PHONETIC_CORRECTIONS = {
    "bow jo lay": "beaujolais",
    "shard oh nay": "chardonnay",
    "pin oh noir": "pinot noir",
    "bor doh": "bordeaux",
    "burr gun dee": "burgundy",
    "cab er nay": "cabernet",
    "mare low": "merlot",
    "shah toe": "chateau",
    "doe main": "domaine",
}
```

---

## Wine Tools (Pydantic AI Agent)

| Tool | Purpose |
|------|---------|
| `search_wines` | Search by region, type, price, grape |
| `get_wine_details` | Full info for specific wine |
| `recommend_wines` | AI recommendations for occasion/budget |
| `show_investment_chart` | Price trends over time |
| `get_food_pairings` | Food suggestions for wine |
| `add_to_cart` | Add wine to Shopify cart |
| `checkout` | Redirect to Shopify checkout |

---

## Environment Variables

```env
# Database (Sommelier)
DATABASE_URL=postgresql://neondb_owner:npg_aT0PxdZwmD9i@ep-sweet-wildflower-abmn8fp7-pooler.eu-west-2.aws.neon.tech/neondb

# Shopify (from aionysus v1)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=aionysus-3.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=...
SHOPIFY_ADMIN_API_TOKEN=...

# Voice, Memory, Auth - configure as needed
HUME_API_KEY=...
ZEP_API_KEY=...
GOOGLE_API_KEY=...
```

---

## Migration Progress

- [x] Clone from copilotkit-demo
- [x] Create CLAUDE.md
- [ ] Purge fractional/jobs references
- [ ] Update package.json
- [ ] Connect Sommelier database
- [ ] Create DIONYSUS agent
- [ ] Port Shopify integration
- [ ] Implement dynamic backgrounds
- [ ] Deploy

---

## Related Projects

- `/Users/dankeegan/aionysus` - Original v1 (reference for Shopify)
- `/Users/dankeegan/copilotkit-demo` - Clone source
