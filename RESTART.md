# CopilotKit Demo - Restart Plan

**Last Updated**: 2025-01-06 (Night Session)
**Project**: Fractional Executive Job Platform with Voice + Chat AI

---

## Quick Context (Read First)

This is a **CopilotKit + Pydantic AI + Hume Voice** demo that lets users:
1. Chat (CopilotKit sidebar) or Voice (Hume EVI) with an AI career advisor
2. Search fractional executive jobs
3. Build a profile via conversation (location, role preferences, companies)
4. See their profile as a live 3D graph + text list

**The Brain**: Single Pydantic AI agent on Railway serves both:
- Chat via AG-UI protocol
- Voice via CLM (Custom Language Model) endpoint

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                           │
├────────────────────────────┬────────────────────────────────────┤
│     CopilotKit Sidebar     │         Hume Voice Widget          │
│     (Text Chat)            │         (Speech)                   │
└────────────┬───────────────┴─────────────────┬──────────────────┘
             │                                  │
             ▼                                  ▼
┌────────────────────────┐        ┌────────────────────────────────┐
│   Vercel (Frontend)    │        │        Hume AI Cloud           │
│   Next.js 15           │        │        EVI Voice               │
│   - CopilotKit React   │        │        Config: acb5575c-...    │
│   - LiveProfileGraph   │        └────────────┬───────────────────┘
│   - API routes         │                     │
└────────────┬───────────┘                     │
             │ AG-UI                           │ CLM (SSE)
             │                                 │
             ▼                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Railway (Agent)                               │
│                    copilotkit-agent-production.up.railway.app    │
├─────────────────────────────────────────────────────────────────┤
│  Pydantic AI Agent with tools:                                   │
│  - search_jobs          - show_user_graph                       │
│  - save_user_preference - show_jobs_chart                       │
│  - set_ambient_scene    - show_salary_insights                  │
│                                                                  │
│  Endpoints:                                                      │
│  - /agui/            → AG-UI for CopilotKit                     │
│  - /chat/completions → CLM for Hume Voice                       │
└─────────────────────────────────────────────────────────────────┘
             │                                 │
             ▼                                 ▼
┌─────────────────────────┐    ┌──────────────────────────────────┐
│      Neon PostgreSQL    │    │         Zep Cloud Memory         │
│      - jobs table       │    │         - Conversation facts     │
│      - user_profile_    │    │         - Auto-extraction        │
│        items table      │    │                                  │
└─────────────────────────┘    └──────────────────────────────────┘
```

---

## Key Files

### Frontend (Vercel)
| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main page with CopilotKit, Voice, Profile Graph |
| `src/components/LiveProfileGraph.tsx` | 3D graph + text list of user profile |
| `src/components/voice-input.tsx` | Hume voice widget wrapper |
| `src/app/api/user-profile/route.ts` | CRUD for profile items |
| `src/app/api/zep-context/route.ts` | Fetch Zep memory facts |
| `src/app/api/hume-token/route.ts` | Hume access token |

### Agent (Railway)
| File | Purpose |
|------|---------|
| `agent/src/agent.py` | Pydantic AI agent with all tools |
| `agent/Procfile` | Railway start command |
| `agent/pyproject.toml` | Python dependencies |

---

## Environment Variables

### Vercel (.env.local)
```env
DATABASE_URL=postgresql://neondb_owner:npg_9mG4aJRxgtpz@ep-wandering-darkness-abiq57ia-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
ZEP_API_KEY=z_1dWlkIjoiMmNkYWVjZjktYTU5Ny00ZDlkLWIyMWItNTZjOWI5OTE5MTE4In0...
HUME_API_KEY=FS313vtpHE8svozXdt7hAs3m0U4rd0dJwV1VW0fWF9cewu79
HUME_SECRET_KEY=4LF8hFTCcMhbl3fbuOO8UGAKpoXdJ91xWjnSUTrCfhsV8GN20A2Xkgs0Y4tPXXbN
NEXT_PUBLIC_HUME_CONFIG_ID=acb5575c-e22f-44c0-a9c8-b03305d1ea92
```

### Railway (agent)
```env
DATABASE_URL=postgresql://neondb_owner:npg_9mG4aJRxgtpz@ep-wandering-darkness-abiq57ia-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
ZEP_API_KEY=z_1dWlkIjoiMmNkYWVjZjktYTU5Ny00ZDlkLWIyMWItNTZjOWI5OTE5MTE4In0...
GOOGLE_API_KEY=AIzaSyD... (for Gemini model)
```

---

## Database Schema

### user_profile_items
```sql
CREATE TABLE user_profile_items (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL,  -- 'location', 'role_preference', 'company', 'skill'
  value TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, value)
);
```

**Single-value fields** (only ONE per user):
- `location` - replaces on new value
- `role_preference` - replaces on new value

**Multi-value fields** (many per user):
- `skill`
- `company`

---

## Current Issues to Fix

### 1. Voice not triggering save_user_preference
**Status**: Just deployed fix (direct DB save)
**Test**: Say "I'm based in Manchester" → check if saves to Neon
**Debug**: `railway logs | grep "💾"`

### 2. Company HITL input field
**Status**: Added event.stopPropagation() fix
**Test**: Say "I work at Google" → type job title → confirm
**Issue**: CopilotKit sidebar may intercept keyboard

### 3. Duplicate profile items
**Status**: Just deployed single-value replace logic
**Test**: Say "I'm in London" then "I'm in Manchester" → should replace

### 4. Agent not calling save_user_preference
**Possible cause**: System prompt not clear enough
**Fix**: Check agent logs, may need stronger prompt

---

## Testing Checklist

```
[ ] Frontend loads at localhost:3000
[ ] Profile graph shows (even if empty)
[ ] Voice button appears and connects
[ ] Chat sidebar opens
[ ] "Show me CTO jobs" → job cards render
[ ] "I'm in London" → saves to Neon, graph updates
[ ] "I work at Sony" → HITL popup appears
[ ] HITL job title input works
[ ] Graph shows green pulse on update
[ ] Single location (no duplicates)
```

---

## How to Resume Development

### 1. Start Local Dev
```bash
cd /Users/dankeegan/copilotkit-demo

# Terminal 1: Frontend
npm run dev

# Terminal 2: Agent (optional, using Railway)
cd agent && uv run uvicorn src.agent:app --reload --port 8000
```

### 2. Deploy Changes
```bash
# Frontend (auto on push)
git add -A && git commit -m "message" && git push

# Agent (manual)
cd agent && railway up
```

### 3. Check Logs
```bash
# Railway agent logs
railway logs

# Vercel logs
vercel logs copilotkit-demo --follow
```

### 4. Database Check
```bash
node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT * FROM user_profile_items LIMIT 10\`.then(console.log);
"
```

---

## What the User (Dan) Was Working On

1. **Profile building via voice** - Say preferences, they save and show in graph
2. **Company validation with HITL** - Confirm company + add job title
3. **Single-value fields** - Only one location/role allowed
4. **Visual feedback** - Green pulse when graph updates
5. **Clean labels** - No verbose Zep facts, just "London", "CTO", "Sony"

---

## Immediate Next Tasks

1. **Verify save_user_preference works** from voice
2. **Test company HITL** end-to-end with job title input
3. **Clean up duplicate data** in user's profile
4. **Add "change location?" confirmation** when replacing
5. **URL validation** for company confirmation

---

## Key User ID for Testing
```
Dan Keegan: 5e421f23-16a6-42de-a4a4-fa412414f1d8
Email: keegan.dan@gmail.com
```

---

## Reference: Agent Tools

| Tool | Type | Purpose |
|------|------|---------|
| `save_user_preference` | Backend | Save location/role/skill to Neon |
| `confirm_company` | Frontend HITL | Validate company with URL + job title |
| `search_jobs` | Backend | Query jobs from Neon |
| `show_user_graph` | Backend | Generate 3D graph data |
| `show_jobs_chart` | Backend | Bar chart of jobs by role |
| `show_salary_insights` | Backend | Salary range chart |
| `set_ambient_scene` | Backend | Change Unsplash background |

---

## Git Repo
```
https://github.com/Londondannyboy/copilot-fractional.quest.git
Branch: main
```
