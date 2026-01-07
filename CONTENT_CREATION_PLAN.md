# Fractional Quest v2 - Content Creation Plan

## Project Overview
Migrating fractional.quest (v1) to copilotkit-demo (v2) with:
- CopilotKit AI sidebar on every page
- Hume voice widget on every page
- Improved SEO with rich snippets
- Consistent design system
- Full content preservation (word count must not drop)

**Repository**: `/Users/dankeegan/copilotkit-demo`
**Source (for reference)**: `/Users/dankeegan/fractional.quest`

---

## ✅ COMPLETED PAGES

### Hiring Guide Pages (Services)
| Page | Lines | Status |
|------|-------|--------|
| `/hire-fractional-cmo` | 700+ | ✅ Complete |
| `/hire-fractional-cto` | 700+ | ✅ Complete |
| `/hire-fractional-cfo` | 700+ | ✅ Complete |
| `/hire-fractional-coo` | 700+ | ✅ Complete |

### Jobs UK Pages
| Page | Lines | Status |
|------|-------|--------|
| `/fractional-cmo-jobs-uk` | 650+ | ✅ Complete |
| `/fractional-jobs-london` | 74 | ✅ Exists (thin) |
| `/fractional-jobs-uk` | exists | ✅ Exists (thin) |
| `/fractional-cfo-jobs-uk` | exists | ✅ Exists (thin) |

### Components Ported
- ✅ `FAQ.tsx` with CMO_FAQS, CFO_FAQS, CTO_FAQS, COO_FAQS arrays
- ✅ `WebPageSchema.tsx` + `FAQPageSchema.tsx`
- ✅ `ServerJobGrid.tsx`
- ✅ `HotJobsLines.tsx`
- ✅ `RoleCalculator.tsx` + `IR35Calculator.tsx`
- ✅ `LazyYouTube.tsx`
- ✅ `Breadcrumbs.tsx`
- ✅ `ExpertProfile.tsx` + `CaseStudy.tsx`
- ✅ `HireProcessStepper.tsx`
- ✅ `JobPostingSchema.tsx` (job listing rich snippets)
- ✅ `RoleContentHub.tsx` (internal linking)
- ✅ `RoleNews.tsx` (category news)

---

## 📋 REMAINING PAGES TO CREATE

### Priority 1: Jobs UK Pages (High Traffic)
These pages get significant Google clicks. Use `/fractional-cmo-jobs-uk` as template.

| Page | Clicks/day | Role Category | Color Theme |
|------|-----------|---------------|-------------|
| `/fractional-cto-jobs-uk` | 14 | Engineering | Cyan |
| `/fractional-coo-jobs-uk` | 11 | Operations | Slate |
| `/fractional-cfo-jobs-uk` | 8 | Finance | Emerald |
| `/fractional-chro-jobs-uk` | 5 | HR | Purple |
| `/fractional-ceo-jobs-uk` | 5 | Executive | Gold |
| `/fractional-cpo-jobs-uk` | 6 | Product | Indigo |
| `/fractional-ciso-jobs-uk` | 8 | Security | Red |

### Priority 2: Role Definition Pages
| Page | Purpose |
|------|---------|
| `/fractional-cfo` | What is a Fractional CFO |
| `/fractional-cto` | What is a Fractional CTO |
| `/fractional-cmo` | What is a Fractional CMO |
| `/fractional-coo` | What is a Fractional COO |

### Priority 3: Salary Guide Pages
| Page | Purpose |
|------|---------|
| `/fractional-cfo-salary` | CFO salary UK guide |
| `/fractional-cto-salary` | CTO salary UK guide |
| `/fractional-cmo-salary` | CMO salary UK guide |
| `/fractional-coo-salary` | COO salary UK guide |

### Priority 4: Additional Services Pages
| Page | Purpose |
|------|---------|
| `/fractional-cfo-services` | CFO services offering |
| `/fractional-cto-services` | CTO services offering |
| `/fractional-cmo-services` | CMO services offering |
| `/fractional-coo-services` | COO services offering |

---

## 🔧 HOW TO CREATE JOBS UK PAGES

### Step 1: Copy Template
```bash
cp src/app/fractional-cmo-jobs-uk/page.tsx src/app/fractional-cto-jobs-uk/page.tsx
```

### Step 2: Find/Replace
| Find | Replace With |
|------|--------------|
| `Marketing` | `Engineering` |
| `cmo` | `cto` |
| `CMO` | `CTO` |
| `amber` | `cyan` |
| `orange` | `teal` |
| `pink` | `blue` |

### Step 3: Update Imports
```typescript
// Change this:
import { FAQ, CMO_FAQS } from '@/components/seo/FAQ'

// To this:
import { FAQ, CTO_FAQS } from '@/components/seo/FAQ'
```

### Step 4: Update Metadata
```typescript
export const metadata: Metadata = {
  title: 'Fractional CTO Jobs UK | Part-Time CTO & Technology Leadership Roles 2025',
  description: 'Fractional CTO jobs UK for experienced technology leaders...',
  keywords: 'fractional cto jobs uk, fractional cto uk, part time cto...',
  // ... etc
}
```

### Step 5: Update Hero Image
Use role-appropriate image from Unsplash:
- CTO: Tech/coding image
- CFO: Finance/numbers image
- COO: Operations/process image

### Step 6: Update Editorial Content
Each role needs unique editorial content covering:
- Rise of fractional [role] in UK
- Why demand is growing
- Types of fractional [role] roles
- Salary/rate benchmarks
- Requirements
- Location breakdown

### Step 7: Update FAQ
Reference correct FAQ array:
```typescript
<FAQ items={CTO_FAQS} title="" />
<FAQPageSchema faqs={CTO_FAQS} />
```

### Step 8: Update RoleNews Category
```typescript
<RoleNews category="Engineering" title="Latest UK Fractional CTO News" limit={3} />
```

### Step 9: Update RoleContentHub
```typescript
<RoleContentHub currentRole="cto" />
```

---

## 📊 ROLE CATEGORY MAPPINGS

| Role | Database `role_category` | FAQ Import | News Category |
|------|-------------------------|------------|---------------|
| CMO | Marketing | CMO_FAQS | Marketing |
| CTO | Engineering | CTO_FAQS | Engineering |
| CFO | Finance | CFO_FAQS | Finance |
| COO | Operations | COO_FAQS | Operations |
| CHRO | HR | CHRO_FAQS | HR |
| CEO | Executive | CEO_FAQS | Executive |
| CPO | Product | CPO_FAQS | Product |
| CISO | Security | CISO_FAQS | Security |

---

## 🎨 COLOR THEMES BY ROLE

| Role | Primary | Gradient Start | Gradient End |
|------|---------|----------------|--------------|
| CMO | amber-600 | amber-600 | pink-500 |
| CTO | cyan-600 | cyan-600 | blue-500 |
| CFO | emerald-600 | emerald-600 | teal-500 |
| COO | slate-600 | slate-600 | gray-500 |
| CHRO | purple-600 | purple-600 | violet-500 |
| CEO | gold/amber | amber-500 | orange-500 |
| CPO | indigo-600 | indigo-600 | purple-500 |
| CISO | red-600 | red-600 | rose-500 |

---

## 📁 KEY FILES REFERENCE

### Templates
| File | Use For |
|------|---------|
| `src/app/fractional-cmo-jobs-uk/page.tsx` | Jobs UK pages template |
| `src/app/hire-fractional-cmo/page.tsx` | Hiring guide pages template |

### Components
| File | Purpose |
|------|---------|
| `src/components/seo/FAQ.tsx` | FAQ accordion + all FAQ arrays |
| `src/components/seo/WebPageSchema.tsx` | WebPage JSON-LD |
| `src/components/seo/FAQPageSchema.tsx` | FAQPage JSON-LD |
| `src/components/seo/JobPostingSchema.tsx` | JobPosting JSON-LD |
| `src/components/ServerJobGrid.tsx` | Server-rendered job cards |
| `src/components/HotJobsLines.tsx` | Scrolling job ticker |
| `src/components/RoleCalculator.tsx` | Day rate calculator |
| `src/components/IR35Calculator.tsx` | IR35 tax calculator |
| `src/components/RoleContentHub.tsx` | Internal linking section |
| `src/components/RoleNews.tsx` | Category news articles |
| `src/components/ExpertProfile.tsx` | E-E-A-T author profile |
| `src/components/CaseStudy.tsx` | E-E-A-T case study |
| `src/components/LazyYouTube.tsx` | Lazy-loaded YouTube embeds |
| `src/components/Breadcrumbs.tsx` | Breadcrumb navigation |
| `src/components/HireProcessStepper.tsx` | 4-step hiring process |

### Configuration
| File | Purpose |
|------|---------|
| `src/lib/seo-config.ts` | Role configs, breadcrumbs |
| `src/lib/db.ts` | Neon database wrapper |
| `src/app/globals.css` | Design system |

---

## 🗄️ DATABASE QUERIES

### UK Location Filter (use in all UK pages)
```sql
(country ILIKE '%UK%' OR country ILIKE '%United Kingdom%'
 OR location ILIKE '%UK%' OR location ILIKE '%London%'
 OR location ILIKE '%Manchester%' OR location ILIKE '%Edinburgh%'
 OR location ILIKE '%Birmingham%' OR location ILIKE '%Bristol%'
 OR location ILIKE '%Leeds%' OR location ILIKE '%Glasgow%'
 OR location ILIKE '%England%' OR location ILIKE '%Scotland%'
 OR location ILIKE '%Wales%')
```

### Jobs Query Template
```sql
SELECT id, slug, title, company_name, location, country, city,
       is_remote, workplace_type, compensation, role_category,
       skills_required, posted_date, description_snippet
FROM jobs
WHERE is_active = true
  AND role_category = '[CATEGORY]'
  AND title NOT ILIKE '%interim%'
  AND [UK_FILTER]
ORDER BY posted_date DESC NULLS LAST
LIMIT 20
```

---

## ✅ PAGE CHECKLIST

For each new page, verify:

- [ ] Correct metadata (title, description, keywords)
- [ ] Canonical URL set
- [ ] Hero image with role-appropriate styling
- [ ] Stats bar with live data
- [ ] HotJobsLines ticker
- [ ] ServerJobGrid (server-rendered)
- [ ] RoleCalculator
- [ ] Editorial content (2000+ words)
- [ ] LazyYouTube videos (2 per page)
- [ ] IR35Calculator
- [ ] FAQ section with FAQPageSchema
- [ ] ExpertProfile + ExpertProfileSchema
- [ ] CaseStudy + CaseStudySchema
- [ ] RoleNews
- [ ] RoleContentHub
- [ ] Related pages links
- [ ] CTA section
- [ ] Build passes (`npm run build`)
- [ ] Commit and push

---

## 🚀 COMMANDS

```bash
# Navigate to project
cd /Users/dankeegan/copilotkit-demo

# Create new page directory
mkdir -p src/app/fractional-[role]-jobs-uk

# Build to verify
npm run build

# Local dev
npm run dev

# Commit and push
git add .
git commit -m "Add [role] jobs UK page"
git push
```

---

## 📈 SUCCESS METRICS

1. **All pages build successfully** - No TypeScript errors
2. **SEO preserved** - Same titles, meta, FAQs, schema as v1
3. **Word count maintained** - 2000+ words per page
4. **Rich snippets enabled** - JobPosting, FAQPage, VideoObject schemas
5. **Internal linking complete** - RoleContentHub on all pages
6. **E-E-A-T signals** - ExpertProfile + CaseStudy on all pages

---

## 🔗 USEFUL URLS

- **Repo**: https://github.com/Londondannyboy/copilot-fractional.quest
- **Vercel**: Auto-deploys on push
- **Original v1**: /Users/dankeegan/fractional.quest

---

*Last updated: 2025-01-07*
