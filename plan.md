# Aionysus v2 - Comprehensive Development Plan

**Last Updated:** January 2026
**Status:** Live at aionysus.wine

---

## Current State

### Completed
- [x] Domain: aionysus.wine live on Vercel
- [x] Database: 3,835 wines with investment data in Neon PostgreSQL
- [x] Auth: Neon Auth with Google OAuth
- [x] Agent: DIONYSUS on Railway (pydantic-ai-slim 1.40.0)
- [x] Voice: Hume EVI with CLM endpoint `/chat/completions`
- [x] Dynamic Backgrounds: Unsplash API for wine regions
- [x] Investment Tools: get_investment_wines, calculate_wine_roi, build_portfolio
- [x] Investment UI: Charts, ROI calculator, portfolio builder
- [x] Wine Glass Voice Button: Burgundy themed, throbbing animation
- [x] Phonetic Corrections: 30+ wine terms for voice recognition

### In Progress
- [ ] AG-UI chat responses (version mismatch being resolved)
- [ ] Wine listing pages
- [ ] Navigation with categories

### Not Started
- [ ] Product detail pages
- [ ] Search functionality
- [ ] Shopify cart integration
- [ ] User dashboard

---

## Phase 1: Navigation & Wine Discovery (Priority)

### 1.1 Navbar Component
**Create:** `src/components/Navbar.tsx`

```
[Logo] | [Search Bar] | [Categories ▼] | [Cart 🛒] | [User 👤]
```

**Features:**
- Sticky navbar with blur background
- Search with autocomplete
- Dropdown for categories
- Cart icon with item count
- User menu (sign in/profile)

### 1.2 Category Dropdown
**Structure:**
```
Browse Wines
├── By Type
│   ├── Red Wines
│   ├── White Wines
│   ├── Rosé
│   ├── Sparkling
│   └── Dessert
├── By Region
│   ├── France
│   │   ├── Bordeaux
│   │   ├── Burgundy
│   │   └── Champagne
│   ├── Italy
│   │   ├── Tuscany
│   │   └── Piedmont
│   └── More...
├── Investment Grade
└── Price Ranges
    ├── Under £50
    ├── £50 - £100
    ├── £100 - £500
    └── £500+
```

### 1.3 Wine Listing Pages

**Routes to create:**
| Route | Purpose |
|-------|---------|
| `/wines` | All wines with filters |
| `/wines/red` | Red wines |
| `/wines/white` | White wines |
| `/wines/sparkling` | Sparkling/Champagne |
| `/wines/rose` | Rosé wines |
| `/wines/region/[region]` | By region (bordeaux, burgundy, etc.) |
| `/wines/investment` | Investment-grade wines only |

**Components needed:**
- `src/components/wine/WineGrid.tsx` - Responsive grid of wine cards
- `src/components/wine/WineCard.tsx` - Individual wine card
- `src/components/wine/WineFilters.tsx` - Sidebar/drawer filters
- `src/components/wine/SortDropdown.tsx` - Sort options
- `src/components/wine/Pagination.tsx` - Page navigation

**Filter options:**
- Wine type
- Region/Country
- Price range (slider)
- Vintage range
- Investment score (if investment page)
- Grape variety

### 1.4 Wine Product Page

**Route:** `/wine/[slug]`

**Sections:**
1. **Hero**
   - Large wine image
   - Name, winery, vintage
   - Region badge
   - Investment score badge (if applicable)

2. **Purchase**
   - Price (retail & trade)
   - Quantity selector
   - Add to Cart button
   - Stock status

3. **Details**
   - Grape variety
   - Alcohol %
   - Bottle size
   - Classification

4. **Tasting Notes**
   - AI-enhanced description
   - Flavor profile tags

5. **Investment Data** (if investment-grade)
   - Investment score
   - 5-year return
   - Price history chart
   - Liv-ex score
   - Storage recommendation

6. **Food Pairings**
   - AI-generated pairings
   - Pairing icons

7. **Similar Wines**
   - Recommendations grid

---

## Phase 2: Search Functionality

### 2.1 Search API
**Route:** `src/app/api/wines/search/route.ts`

**Parameters:**
- `q` - Search query (name, winery, region, grape)
- `type` - Wine type filter
- `region` - Region filter
- `minPrice` / `maxPrice` - Price range
- `minVintage` / `maxVintage` - Vintage range
- `investmentGrade` - Boolean filter
- `sort` - price_asc, price_desc, score_desc, vintage_desc
- `page` / `limit` - Pagination

### 2.2 Search UI
- Navbar search with debounced autocomplete
- Search results page at `/search?q=...`
- Recent searches (localStorage)
- Popular searches suggestions

---

## Phase 3: Shopify E-commerce

### 3.1 Environment Setup
```env
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=aionysus-3.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=xxx
SHOPIFY_ADMIN_API_TOKEN=xxx
```

### 3.2 Cart System
**Files:**
- `src/context/CartContext.tsx` - Cart state management
- `src/components/cart/CartDrawer.tsx` - Slide-out cart
- `src/components/cart/CartItem.tsx` - Cart line item
- `src/components/cart/CartSummary.tsx` - Subtotal, checkout button

**Features:**
- Add/remove items
- Update quantities
- Persistent cart (localStorage + Shopify)
- Real-time stock validation

### 3.3 Product Sync
- Sync wine database IDs with Shopify product IDs
- Match by SKU or name
- Update stock levels

### 3.4 Agent Cart Tools
```python
@agent.tool
async def add_to_cart(wine_id: int, quantity: int = 1):
    """Add wine to shopping cart."""

@agent.tool
async def view_cart():
    """Show current cart contents."""

@agent.tool
async def checkout():
    """Redirect to Shopify checkout."""
```

---

## Phase 4: User Features

### 4.1 User Dashboard
**Route:** `/dashboard`

**Sections:**
- Welcome message with name
- Recent orders
- Saved wines count
- Investment portfolio value (if any)

### 4.2 My Cellar (Saved Wines)
**Route:** `/dashboard/cellar`

- Save wines to wishlist
- Add notes
- Track price changes
- Get restock alerts

### 4.3 Order History
**Route:** `/dashboard/orders`

- Past purchases from Shopify
- Order status
- Reorder functionality

### 4.4 Investment Portfolio
**Route:** `/dashboard/portfolio`

- Track owned wines
- Current value vs purchase price
- Performance charts
- Diversification analysis

---

## Phase 5: Database Updates

### New Tables
```sql
-- User saved wines (wishlist/cellar)
CREATE TABLE user_saved_wines (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  wine_id INTEGER REFERENCES wines(id),
  saved_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, wine_id)
);

-- User wine portfolio (owned wines)
CREATE TABLE user_portfolio (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  wine_id INTEGER REFERENCES wines(id),
  quantity INTEGER DEFAULT 1,
  purchase_price DECIMAL(10,2),
  purchase_date DATE,
  storage_location TEXT,
  shopify_order_id TEXT
);

-- Price alerts
CREATE TABLE price_alerts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  wine_id INTEGER REFERENCES wines(id),
  target_price DECIMAL(10,2),
  alert_type TEXT CHECK (alert_type IN ('below', 'above')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Phase 6: SEO & Performance

### 6.1 Static Generation
- Pre-render wine pages with `generateStaticParams`
- ISR with 1-hour revalidation
- Sitemap generation for all wines

### 6.2 SEO
- Wine-specific JSON-LD schema
- OpenGraph images
- Meta descriptions from tasting notes
- Canonical URLs

### 6.3 Performance
- Image optimization with next/image
- Lazy loading wine grids
- Skeleton loading states
- Edge caching

---

## Implementation Priority

### Immediate (This Week)
1. [ ] Fix AG-UI chat responses
2. [ ] Create Navbar with search placeholder
3. [ ] Create `/wines` listing page
4. [ ] Create WineCard and WineGrid components
5. [ ] Add basic filtering

### Short Term (Next 2 Weeks)
1. [ ] Wine product pages `/wine/[slug]`
2. [ ] Category routes
3. [ ] Search functionality
4. [ ] Shopify cart integration

### Medium Term (Month)
1. [ ] User dashboard
2. [ ] Saved wines / My Cellar
3. [ ] Order history
4. [ ] Investment portfolio tracking

### Long Term
1. [ ] Price alerts
2. [ ] Advanced recommendations
3. [ ] Social features
4. [ ] Mobile app

---

## File Structure (Target)

```
src/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout with Navbar
│   ├── wines/
│   │   ├── page.tsx               # All wines
│   │   ├── [type]/page.tsx        # By type
│   │   ├── region/[region]/page.tsx
│   │   └── investment/page.tsx
│   ├── wine/
│   │   └── [slug]/page.tsx        # Product detail
│   ├── search/
│   │   └── page.tsx               # Search results
│   ├── dashboard/
│   │   ├── page.tsx               # Dashboard home
│   │   ├── cellar/page.tsx        # Saved wines
│   │   ├── orders/page.tsx        # Order history
│   │   └── portfolio/page.tsx     # Investment tracking
│   └── api/
│       ├── wines/
│       │   ├── route.ts           # GET wines
│       │   ├── search/route.ts    # Search endpoint
│       │   └── [id]/route.ts      # Single wine
│       ├── cart/
│       │   └── route.ts           # Cart operations
│       └── ...existing
├── components/
│   ├── Navbar.tsx                 # Main navigation
│   ├── wine/
│   │   ├── WineCard.tsx
│   │   ├── WineGrid.tsx
│   │   ├── WineFilters.tsx
│   │   ├── WineDetail.tsx
│   │   └── SimilarWines.tsx
│   ├── cart/
│   │   ├── CartDrawer.tsx
│   │   ├── CartItem.tsx
│   │   └── CartSummary.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   └── SearchResults.tsx
│   └── ...existing
├── context/
│   └── CartContext.tsx
└── lib/
    ├── db.ts
    ├── shopify.ts
    └── ...existing
```

---

## Environment Variables (Complete)

```env
# Database
DATABASE_URL=postgresql://...

# Agent
NEXT_PUBLIC_AGENT_URL=https://aionysus-agent-production.up.railway.app

# Auth
NEON_AUTH_BASE_URL=https://...

# Voice
HUME_API_KEY=...
HUME_SECRET_KEY=...
NEXT_PUBLIC_HUME_API_KEY=...
NEXT_PUBLIC_HUME_CONFIG_ID=29cec14d-5272-4a79-820d-382dc0d0e801

# Memory
ZEP_API_KEY=...

# Shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=aionysus-3.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=...
SHOPIFY_ADMIN_API_TOKEN=...

# Images
UNSPLASH_ACCESS_KEY=...
```
