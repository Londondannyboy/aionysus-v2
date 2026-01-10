# Aionysus v2 - Development Plan

**Last Updated:** January 10, 2026
**Status:** Live at aionysus.wine

---

## Current State Summary

### Completed
- [x] Domain: aionysus.wine live on Vercel
- [x] Database: 3,835 wines with investment data in Neon PostgreSQL
- [x] Auth: Neon Auth with Google OAuth
- [x] Agent: DIONYSUS on Railway (Pydantic AI)
- [x] Voice: Hume EVI with CLM endpoint `/chat/completions`
- [x] Dynamic Backgrounds: Unsplash API for wine regions
- [x] Investment Tools: get_investment_wines, calculate_wine_roi, build_portfolio
- [x] Investment UI: Charts, ROI calculator, portfolio builder
- [x] Wine Glass Voice Button: Burgundy themed, throbbing animation
- [x] Phonetic Corrections: 30+ wine terms for voice recognition
- [x] **Wine Listing Pages** (`/wines` with search & filters)
- [x] **Wine Detail Pages** (`/wines/[slug]` with SEO/schema.org)
- [x] **Category Pages** (`/wines/category/[type]`)
- [x] **Shopping Cart** (`/cart` with localStorage)
- [x] **NavBar** with categories dropdown and cart badge
- [x] **UserMenu** dropdown with sign out
- [x] Cloudinary image support

### In Progress
- [ ] **User Context** - Agent not consistently recognizing user's name from voice

### Not Started
- [ ] Shopify Storefront API checkout
- [ ] User dashboard
- [ ] Saved wines / My Cellar
- [ ] Order history

---

## Priority 1: User Context Fix (ACTIVE)

### Problem
The agent (DIONYSUS) doesn't consistently recognize the user's name when using Hume voice or CopilotKit chat.

### Current Implementation
1. **CopilotKit Path:**
   - `providers.tsx` adds user context to RuntimeConnector instructions
   - Agent parses via `extract_user_from_instructions()`

2. **Hume EVI Path:**
   - `voice-input.tsx` configures session with `sessionSettings.systemPrompt`
   - Agent parses via `extract_user_from_hume_messages()`
   - Also scans user messages for patterns like "my name is X"

### Next Steps
1. Debug what Hume EVI actually sends to CLM endpoint
2. Add console logging in voice-input.tsx to verify session config
3. Check if Hume dashboard shows the systemPrompt being passed
4. Consider alternative: pass user info in custom metadata

### Files to Check
- `src/components/voice-input.tsx` - Lines 50-80 (session config)
- `src/components/providers.tsx` - Lines with RuntimeConnector
- `agent/src/agent.py` - Lines 1163-1208 (extract functions)

---

## Priority 2: Shopify Checkout

### Current State
- Cart uses localStorage for items
- Shopify credentials in `.env`
- No actual Shopify API calls yet

### Implementation Plan
1. Create `src/lib/shopify.ts` with Storefront API client
2. Update cart page to create Shopify checkout
3. Redirect to Shopify hosted checkout
4. Handle checkout completion webhook

### Files to Create/Update
- `src/lib/shopify.ts` (new)
- `src/app/cart/page.tsx` (update checkout button)
- `src/app/api/webhooks/shopify/route.ts` (new, for order completion)

---

## Priority 3: User Dashboard

### Routes
- `/dashboard` - Overview
- `/dashboard/cellar` - Saved wines
- `/dashboard/orders` - Order history
- `/dashboard/portfolio` - Investment tracking

### Database Schema (To Add)
```sql
CREATE TABLE user_saved_wines (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  wine_id INTEGER REFERENCES wines(id),
  saved_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, wine_id)
);

CREATE TABLE user_portfolio (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  wine_id INTEGER REFERENCES wines(id),
  quantity INTEGER DEFAULT 1,
  purchase_price DECIMAL(10,2),
  purchase_date DATE,
  shopify_order_id TEXT
);
```

---

## Completed File Structure

```
src/
├── app/
│   ├── page.tsx                      # Homepage with CopilotSidebar
│   ├── layout.tsx                    # Root layout with NavBar
│   ├── globals.css                   # Global styles
│   ├── wines/
│   │   ├── page.tsx                  # Wine listing with search/filters
│   │   ├── [slug]/
│   │   │   ├── page.tsx              # Server component (SEO)
│   │   │   └── WineDetailClient.tsx  # Client component (cart)
│   │   └── category/
│   │       └── [type]/
│   │           ├── page.tsx          # Server component
│   │           └── WineCategoryClient.tsx # Client component
│   ├── cart/
│   │   └── page.tsx                  # Shopping cart
│   └── api/
│       ├── wines/route.ts            # GET /api/wines
│       ├── copilotkit/route.ts       # AG-UI proxy
│       ├── hume-token/route.ts       # Hume access token
│       └── zep-*/                    # Memory APIs
├── components/
│   ├── NavBar.tsx                    # Navigation with categories
│   ├── UserMenu.tsx                  # User dropdown
│   ├── voice-input.tsx               # Wine glass voice button
│   ├── investment.tsx                # Investment UI components
│   ├── charts.tsx                    # Recharts components
│   ├── DynamicBackground.tsx         # Unsplash backgrounds
│   └── providers.tsx                 # CopilotKit + Neon Auth
└── lib/
    └── auth/client.ts                # Auth client
```

---

## Agent File Structure

```
agent/
├── src/
│   └── agent.py                      # DIONYSUS agent
├── pyproject.toml                    # Dependencies
└── Procfile                          # Railway deployment
```

### Agent Key Functions (agent.py)
- `extract_user_from_instructions()` - Parse CopilotKit user context
- `extract_user_from_hume_messages()` - Parse Hume CLM user context
- `build_system_prompt()` - Generate personalized system prompt
- `search_wines()` - Wine search tool
- `get_wine_details()` - Single wine lookup
- `get_investment_wines()` - Investment wines
- `calculate_wine_roi()` - ROI calculator
- `build_portfolio()` - Portfolio builder
- `/agui/` - AG-UI endpoint for CopilotKit
- `/chat/completions` - OpenAI-compatible for Hume CLM

---

## Testing Checklist

### Wine Pages
- [x] `/wines` loads with all wines
- [x] Search filters results correctly
- [x] Type filter works
- [x] Price filter works
- [x] Region filter works
- [x] Winery filter works
- [x] Category pages load correct type
- [x] Detail pages show correct wine
- [x] Add to cart updates localStorage
- [x] NavBar cart badge updates

### Voice
- [x] Wine glass button activates Hume
- [x] Voice transcription works
- [x] Agent responds with wine knowledge
- [ ] Agent knows user's name (IN PROGRESS)

### Chat
- [x] CopilotKit sidebar opens/closes
- [x] Messages send to agent
- [x] Tools render UI components
- [ ] User context passed correctly (IN PROGRESS)

---

## Environment Variables Reference

### Vercel
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

### Railway
```env
DATABASE_URL=postgresql://neondb_owner:***@ep-square-frog-abxc6js2-pooler.eu-west-2.aws.neon.tech/neondb
GROQ_API_KEY=***
ZEP_API_KEY=***
```
