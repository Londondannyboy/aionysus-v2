# Aionysus v2 - Implementation Plan

## Current Status: Migration from copilotkit-demo

**Date Started:** 2025-01-07
**Clone Source:** `/Users/dankeegan/copilotkit-demo`
**Reference:** `/Users/dankeegan/aionysus` (original v1 for Shopify)

---

## Phase 1: Purge & Rebrand (Current)

### 1.1 Documentation
- [x] Create CLAUDE.md with wine project overview
- [x] Create plan.md (this file)
- [ ] Update README.md with wine project info

### 1.2 Package & Config
- [ ] Update package.json name to "aionysus-v2"
- [ ] Update package.json description
- [ ] Create/update .env.local with Sommelier database connection
- [ ] Remove fractional-specific dependencies (if any)

### 1.3 Delete Fractional Pages
Remove these job-focused pages:
- [ ] `src/app/fractional-cfo-jobs-uk/`
- [ ] `src/app/fractional-cto/`
- [ ] `src/app/fractional-cmo-salary/`
- [ ] `src/app/fractional-cmo-jobs-uk/`
- [ ] `src/app/fractional-jobs-london/`
- [ ] `src/app/fractional-coo/`
- [ ] `src/app/fractional-ceo/`
- [ ] `src/app/fractional-cpo-salary/`
- [ ] `src/app/fractional-jobs-uk/`
- [ ] `src/app/fractional-ceo-salary/`
- [ ] `src/app/fractional-cfo/`
- [ ] `src/app/fractional-cto-jobs-uk/`
- [ ] `src/app/hire-fractional-cmo/`
- [ ] `src/app/fractional-cfo-salary/`
- [ ] `src/app/fractional-cpo/`
- [ ] `src/app/fractional-coo-salary/`
- [ ] `src/app/fractional-ciso/`
- [ ] `src/app/hire-fractional-cto/`
- [ ] `src/app/fractional-chro-jobs-uk/`
- [ ] `src/app/fractional-cpo-jobs-uk/`
- [ ] `src/app/hire-fractional-cfo/`
- [ ] `src/app/fractional-coo-jobs-uk/`
- [ ] `src/app/fractional-ceo-jobs-uk/`
- [ ] `src/app/hire-fractional-coo/`
- [ ] `src/app/fractional-chro/`
- [ ] `src/app/fractional-cmo/`
- [ ] `src/app/fractional-ciso-salary/`
- [ ] `src/app/fractional-ciso-jobs-uk/`
- [ ] `src/app/fractional-chro-salary/`
- [ ] `src/app/fractional-cto-salary/`

### 1.4 Delete Job Components
- [ ] `src/components/job-pages/` (entire folder)
- [ ] `src/components/ServerJobGrid.tsx`
- [ ] `src/components/ui/JobCard.tsx`
- [ ] `src/components/jobs.tsx`
- [ ] `src/components/HotJobsLines.tsx`

---

## Phase 2: Database Connection

### 2.1 Connect to Sommelier
- [ ] Update DATABASE_URL in .env.local
- [ ] Test connection to wines table
- [ ] Verify 3,800+ wines accessible

### 2.2 Database Schema Updates
- [ ] Add price_history JSONB column (if not exists)
- [ ] Add investment_score column (if not exists)
- [ ] Create user_wine_preferences table (adapt from user_profile_items)

---

## Phase 3: Agent Transformation (DIONYSUS)

### 3.1 Update System Prompt
- [ ] Replace job recruiter persona with wine sommelier
- [ ] Add wine expertise context
- [ ] Add investment advisory context

### 3.2 Create Wine Tools
- [ ] `search_wines(region, type, price_range, grape_variety)`
- [ ] `get_wine_details(wine_id)`
- [ ] `recommend_wines(occasion, budget, preferences)`
- [ ] `show_investment_chart(wine_id or region)`
- [ ] `get_food_pairings(wine_id)`

### 3.3 Add Shopify Tools
- [ ] `add_to_cart(wine_id, quantity)`
- [ ] `get_cart()`
- [ ] `checkout()`

### 3.4 Phonetic Corrections
- [ ] Add wine term corrections (beaujolais, chardonnay, etc.)
- [ ] Test with voice input

---

## Phase 4: Frontend Transformation

### 4.1 Homepage Redesign
- [ ] Replace job-focused layout with wine showcase
- [ ] Add dynamic hero background (changes with region)
- [ ] Update branding (Aionysus, DIONYSUS)

### 4.2 Generative UI Components
Adapt existing:
- [ ] JobsCard → WineCard
- [ ] JobsBarChart → WinePriceChart
- [ ] SalaryAreaChart → InvestmentTrend
- [ ] MarketDashboard → WineMarketOverview
- [ ] ForceGraph3D → WineTasteProfile

Create new:
- [ ] DynamicBackground.tsx (region imagery)
- [ ] TastingWheel.tsx (flavor radar chart)
- [ ] CartSummary.tsx (Shopify cart display)

### 4.3 Wine Pages
- [ ] `/wines` - Wine catalog with filters
- [ ] `/wines/[id]` - Wine detail page (port from aionysus v1)

---

## Phase 5: Shopify Integration

### 5.1 Port from Original Aionysus
- [ ] Copy `lib/shopify.ts`
- [ ] Copy `lib/shopify-admin.ts`
- [ ] Create `src/app/api/shopify/` routes

### 5.2 Connect to Existing Store
- [ ] Verify Shopify tokens work
- [ ] Test cart creation
- [ ] Test checkout flow

---

## Phase 6: Dynamic Backgrounds (Priority Feature)

### 6.1 Region Imagery System
- [ ] Create mapping of regions to background images
- [ ] Implement context detection (which region being discussed)
- [ ] Create smooth transition effects

### 6.2 Image Sources
- [ ] Burgundy vineyards
- [ ] Bordeaux chateaux
- [ ] Champagne cellars
- [ ] Tuscany landscapes
- [ ] Napa Valley views

---

## Phase 7: Deployment

### 7.1 Railway (Agent)
- [ ] Create new Railway project: aionysus-agent
- [ ] Set environment variables
- [ ] Deploy and get URL

### 7.2 Vercel (Frontend)
- [ ] Create new Vercel project: aionysus-v2
- [ ] Set environment variables
- [ ] Deploy and get URL

### 7.3 DNS
- [ ] Point aionysus.wine to new Vercel deployment
- [ ] Verify SSL

---

## Testing Checklist

### Voice
- [ ] "Tell me about Burgundy wines" → wine list
- [ ] "What's a good wine for steak?" → recommendations
- [ ] "Add this to my cart" → Shopify cart

### Chat
- [ ] Wine search with filters
- [ ] Investment chart rendering
- [ ] Cart management

### Visual
- [ ] Dynamic background changes with region
- [ ] Wine cards display correctly
- [ ] Investment charts render

### E-commerce
- [ ] Cart creation
- [ ] Add/remove items
- [ ] Checkout redirect

---

## Notes

- Keep the CopilotKit + Pydantic AI + Zep patterns from copilotkit-demo
- The investment chart feature is a key differentiator
- Dynamic backgrounds should be the hero feature on homepage
- Reference original aionysus for Shopify patterns and wine data structure
