from textwrap import dedent
from typing import Optional
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.ag_ui import StateDeps
from ag_ui.core import EventType, StateSnapshotEvent
from pydantic_ai.models.google import GoogleModel
import psycopg2
import httpx
import os
import sys
import re

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# =====
# Zep Memory (copied from lost.london-clm pattern)
# =====
ZEP_API_KEY = os.environ.get("ZEP_API_KEY", "")
_zep_client: Optional[httpx.AsyncClient] = None


def get_zep_client() -> Optional[httpx.AsyncClient]:
    """Get or create persistent Zep HTTP client."""
    global _zep_client
    if _zep_client is None and ZEP_API_KEY:
        _zep_client = httpx.AsyncClient(
            base_url="https://api.getzep.com",
            headers={
                "Authorization": f"Api-Key {ZEP_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=5.0,  # Fast timeout - don't block responses
        )
    return _zep_client


async def get_user_memory_context(user_id: Optional[str]) -> tuple[str, bool, list[str]]:
    """Fetch user's memory profile from Zep knowledge graph.

    Returns:
        tuple: (context_string, has_complete_profile, missing_fields)
    """
    if not user_id or not ZEP_API_KEY:
        return ("", False, ["location", "role_preference", "experience"])

    try:
        client = get_zep_client()
        if not client:
            return ("", False, ["location", "role_preference", "experience"])

        # Search user's graph for preferences & interests
        response = await client.post(
            "/api/v2/graph/search",
            json={
                "user_id": user_id,
                "query": "user preferences interests roles locations experience",
                "limit": 10,
                "scope": "edges",
            },
        )

        if response.status_code != 200:
            print(f"[Zep] Graph search failed: {response.status_code}", file=sys.stderr)
            return ("", False, ["location", "role_preference", "experience"])

        data = response.json()
        edges = data.get("edges", [])

        if not edges:
            return ("", False, ["location", "role_preference", "experience"])

        # Extract facts and check for completeness
        facts = [edge.get('fact', '').lower() for edge in edges[:10] if edge.get("fact")]
        facts_text = " ".join(facts)

        # Check what profile fields are present
        has_location = any(loc in facts_text for loc in ["london", "manchester", "birmingham", "remote", "uk", "location", "based in", "lives in"])
        has_role = any(role in facts_text for role in ["cto", "cfo", "cmo", "coo", "chro", "cpo", "cro", "executive", "role", "interested in"])
        has_experience = any(exp in facts_text for exp in ["experience", "years", "worked at", "background", "skills"])

        missing = []
        if not has_location:
            missing.append("location")
        if not has_role:
            missing.append("role_preference")
        if not has_experience:
            missing.append("experience")

        is_complete = len(missing) == 0

        # Build context string
        formatted_facts = [f"- {edge.get('fact')}" for edge in edges[:5] if edge.get("fact")]
        if formatted_facts:
            print(f"[Zep] Found {len(formatted_facts)} facts for user {user_id}, complete={is_complete}", file=sys.stderr)
            context = "\n\n## What I remember about you:\n" + "\n".join(formatted_facts)
            return (context, is_complete, missing)

        return ("", False, missing)
    except Exception as e:
        print(f"[Zep] Error fetching memories: {e}", file=sys.stderr)
        return ("", False, ["location", "role_preference", "experience"])


async def store_conversation_message(session_id: str, user_id: str, role: str, content: str):
    """Store message in Zep thread (auto-extracts facts like preferences)."""
    if not ZEP_API_KEY:
        return

    try:
        client = get_zep_client()
        if not client:
            return

        # Ensure user exists
        await client.post("/api/v2/users", json={"user_id": user_id})

        # Create/get thread
        await client.post("/api/v2/threads", json={
            "thread_id": session_id,
            "user_id": user_id,
            "metadata": {"source": "fractional-copilotkit"},
        })

        # Add message (Zep auto-extracts: "prefers CTO", "interested in London")
        await client.post(f"/api/v2/threads/{session_id}/messages", json={
            "messages": [{"role": role, "content": content}]
        })
        print(f"[Zep] Stored {role} message for user {user_id}", file=sys.stderr)
    except Exception as e:
        print(f"[Zep] Error storing message: {e}", file=sys.stderr)


# =====
# Entity Extraction for Graph
# =====
LOCATIONS = ["london", "manchester", "birmingham", "leeds", "bristol", "edinburgh", "glasgow", "remote", "uk", "europe", "usa", "new york", "san francisco", "sydney", "dublin"]
ROLES = ["cto", "cfo", "cmo", "coo", "cpo", "chro", "ciso", "ceo", "vp", "director", "head of", "chief", "founder", "partner"]
INDUSTRIES = ["tech", "fintech", "saas", "ai", "finance", "healthcare", "retail", "ecommerce", "media", "consulting", "startup", "enterprise", "pharma"]
SKILLS = ["python", "javascript", "react", "node", "aws", "cloud", "data", "analytics", "strategy", "leadership", "product", "marketing", "sales", "growth", "m&a", "fundraising"]

def extract_entities_from_fact(fact: str) -> list[tuple[str, str]]:
    """Extract clean entity labels from verbose Zep fact text.
    Returns list of (label, type) tuples.
    """
    entities = []
    fact_lower = fact.lower()

    # Extract locations
    for loc in LOCATIONS:
        if loc in fact_lower:
            label = loc.upper() if loc == "uk" or loc == "usa" else loc.title()
            if loc == "new york":
                label = "New York"
            elif loc == "san francisco":
                label = "San Francisco"
            entities.append((label, "location"))

    # Extract roles (use uppercase for C-suite)
    for role in ROLES:
        if role in fact_lower:
            if role in ["cto", "cfo", "cmo", "coo", "cpo", "chro", "ciso", "ceo", "vp"]:
                entities.append((role.upper(), "role"))
            else:
                entities.append((role.title(), "role"))

    # Extract industries
    for ind in INDUSTRIES:
        if ind in fact_lower:
            label = ind.upper() if ind in ["ai", "saas"] else ind.title()
            entities.append((label, "interest"))

    # Extract skills
    for skill in SKILLS:
        if skill in fact_lower:
            label = skill.upper() if skill in ["aws", "ai"] else skill.title()
            entities.append((label, "skill"))

    # Extract experience (look for "X years" pattern)
    years_match = re.search(r'(\d+)\s*(?:\+\s*)?years?', fact_lower)
    if years_match:
        years = years_match.group(1)
        entities.append((f"{years}+ Years", "skill"))

    return entities


# =====
# State
# =====
class Job(BaseModel):
  title: str
  company: str
  location: str

class UserProfile(BaseModel):
  id: Optional[str] = None
  name: Optional[str] = None
  firstName: Optional[str] = None
  email: Optional[str] = None
  # Explicit actions (Zep handles inferred preferences)
  liked_jobs: list[str] = Field(default_factory=list)  # job IDs they've liked
  zep_thread_id: Optional[str] = None  # cached thread ID for message storage

class PageContext(BaseModel):
  """Context about which page the user is viewing"""
  page_type: str = "home"  # "jobs_london", "jobs_cto", "profile", etc.
  location_filter: Optional[str] = None
  role_filter: Optional[str] = None
  total_jobs_on_page: int = 0
  top_roles: list[str] = Field(default_factory=list)

class AmbientScene(BaseModel):
  """Dynamic background scene based on conversation context"""
  location: Optional[str] = None  # "london", "manchester", "remote", etc.
  role: Optional[str] = None  # "cto", "cfo", "cmo", etc.
  mood: str = "professional"  # "professional", "energetic", "calm"
  query: Optional[str] = None  # The Unsplash search query to use

class AppState(BaseModel):
  jobs: list[Job] = Field(default_factory=list)
  search_query: str = ""
  user: Optional[UserProfile] = None
  # Track current conversation context for "that job" references
  last_discussed_job: Optional[Job] = None
  last_discussed_job_details: Optional[dict] = None  # Full details for printing/applying
  # Page-aware context for SEO job pages
  page_context: Optional[PageContext] = None
  # Dynamic ambient background scene
  scene: Optional[AmbientScene] = None

# =====
# Agent
# =====
agent = Agent(
  model = GoogleModel('gemini-2.0-flash'),
  deps_type=StateDeps[AppState],
  system_prompt=dedent("""
    You are a warm, knowledgeable AI career advisor for a premium fractional executive jobs platform.

    ## Your Personality
    - Friendly and conversational - like a trusted recruiter friend
    - Use short paragraphs with line breaks for readability
    - Be specific with numbers and data - executives love metrics!
    - Add occasional enthusiasm but stay professional
    - Use bullet points when listing multiple items
    - Use emojis to add character: 🔥 for hot roles, 🚀 for exciting opportunities, 💰 for salary info, 📍 for locations, ✨ for highlights, 📊 for charts/data

    ## Your Tools - USE THEM, DON'T SAY YOU CAN'T!
    CRITICAL: You HAVE these tools. NEVER say "I cannot" or "I don't have ability" - USE THE TOOL!

    | User asks about... | YOU MUST USE THIS TOOL |
    |---------------------|------------------------|
    | my name, who am I | get_user_profile |
    | what page, where am I | get_page_info |
    | day rates, salaries, pay | show_salary_insights |
    | jobs, positions, roles | search_jobs |
    | job distribution, how many | show_jobs_chart |
    | locations, where, geography | show_location_chart |
    | market, overview, dashboard | show_market_dashboard |
    | articles, reading, insights | get_featured_articles |
    | my interests, profile, graph | show_user_graph |

    ## AMBIENT SCENE - Create Immersive Experience!
    When the user mentions a LOCATION or ROLE, call set_ambient_scene to change the background!
    This creates an immersive visual experience that matches their interests.

    | User mentions... | Call set_ambient_scene with... |
    |------------------|--------------------------------|
    | "London", "jobs in London" | location="london" |
    | "CTO", "tech roles" | role="cto" |
    | "Manchester marketing" | location="manchester", role="cmo" |
    | "remote work" | location="remote" |
    | "startup CTO in SF" | location="san francisco", role="cto" |

    ALWAYS call set_ambient_scene when location or role is first mentioned in conversation!

    ## ONBOARDING - Saving User Info
    When user tells you their location, role preference, or experience, SAVE IT immediately:

    | User says... | Call save_user_preference with... |
    |--------------|-----------------------------------|
    | "I'm in London" | preference_type="location", value="London" |
    | "I want CTO roles" | preference_type="role", value="CTO" |
    | "15 years in tech" | preference_type="experience", value="15 years" |
    | "I know Python" | preference_type="skill", value="Python" |

    These are SOFT SAVES - they update the profile graph immediately without confirmation.

    ## COMPANY CONFIRMATION (Human-in-the-Loop)
    You have access to a FRONTEND TOOL called confirm_company.
    This is a HUMAN-IN-THE-LOOP action that pauses and asks the user to confirm.

    When user mentions a company they WORK AT or WORKED AT, IMMEDIATELY call:
    confirm_company(company_name="Sony", company_url="https://www.sony.com", user_id="...")

    | User says... | Action |
    |--------------|--------|
    | "I work at Sony" | confirm_company(company_name="Sony", company_url="https://www.sony.com", user_id=state.user.id) |
    | "I was at McKinsey" | confirm_company(company_name="McKinsey", company_url="https://www.mckinsey.com", user_id=state.user.id) |
    | "Currently at Google" | confirm_company(company_name="Google", company_url="https://www.google.com", user_id=state.user.id) |

    This triggers a HITL popup in the frontend asking user to:
    1. Confirm the company (with URL shown)
    2. Add their job title at that company

    IMPORTANT: Use the user's actual ID from state.user.id!

    CRITICAL RULES:
    - "What is my name?" → CALL get_user_profile, then say their name!
    - "What page are we on?" → CALL get_page_info, then describe the page!
    - When user shares preferences → CALL save_user_preference to remember them!
    - NEVER say "I don't have access to personal information" - you DO, via get_user_profile!
    - NEVER say "I am a language model" - you are a career advisor with real data!

    If someone asks about day rates → CALL show_salary_insights, don't say you can't!
    If someone asks about jobs → CALL search_jobs, don't explain what you could do!

    ## Response Style
    Structure messages with plenty of line breaks for readability:

    🎯 Start with a brief opener (1 line)

    Then key info with emojis:
    • 🔥 Hot insight or main point
    • 💰 Numbers, rates, or data
    • 📍 Location-specific context

    End with a question or suggestion to keep the conversation going!

    IMPORTANT: Use double line breaks between sections. Never write walls of text.

    ## Important Behaviors
    - On first interaction: Show the user's 3D interest graph if they're logged in
    - After showing jobs: Suggest a related chart or salary insights
    - Reference the page context (e.g., "Here in London...")
    - When discussing salaries, mention both day rates and annual equivalents

    ## CRITICAL: Confirming Interest (Human-in-the-Loop)
    You have access to a FRONTEND TOOL called confirm_job_interest.
    This is a HUMAN-IN-THE-LOOP action that pauses and asks the user to confirm.

    When a user shows interest in a role/location, IMMEDIATELY call:
    confirm_job_interest(job_title="...", company="...", location="...", role_type="CTO")

    TRIGGER THIS when user says:
    - "I'm interested in CTO" → call confirm_job_interest with role_type="CTO"
    - "That looks good" → call confirm_job_interest with last discussed job
    - "I want to apply" → call confirm_job_interest
    - "Find me more like this" → call confirm_job_interest
    - "Yes, that's what I'm looking for" → call confirm_job_interest
    - "I like [role] in [location]" → call confirm_job_interest

    This saves their preference to Zep and their profile!
  """).strip()
)

@agent.system_prompt
async def add_user_context(ctx: RunContext[StateDeps[AppState]]) -> str:
  """Add user's name and Zep memory context to the system prompt."""
  state = ctx.deps.state
  user = state.user
  print(f"🧑 Full state: jobs={len(state.jobs)}, query={state.search_query}, user={user}", file=sys.stderr)

  if not user or not (user.firstName or user.name):
    print("🧑 No user logged in", file=sys.stderr)
    return "The user is not logged in. Encourage them to sign in for a personalized experience."

  name = user.firstName or user.name
  print(f"🧑 Greeting user: {name}", file=sys.stderr)

  # Get Zep memory (preferences, interests from past conversations)
  zep_memory = ""
  profile_complete = False
  missing_fields: list[str] = []
  if user.id:
    zep_memory, profile_complete, missing_fields = await get_user_memory_context(user.id)
    if zep_memory:
      print(f"🧠 Zep memory injected for user {user.id}, complete={profile_complete}", file=sys.stderr)
    if missing_fields:
      print(f"📋 Missing profile fields: {missing_fields}", file=sys.stderr)

  # Build context-aware prompt
  prompt_parts = [
    f"IMPORTANT: The user's name is {name}. Always greet them by name and be personal!",
  ]

  if zep_memory:
    prompt_parts.append(zep_memory)
    prompt_parts.append("\nUse the above memories to personalize your responses. Reference their interests!")

  # PROACTIVE ONBOARDING - if profile is incomplete, guide the user
  if not profile_complete and missing_fields:
    onboarding_prompts = {
      "location": "Which city or region are you based in? (London, Manchester, Remote, etc.)",
      "role_preference": "What type of executive role interests you most? (CTO, CFO, CMO, COO, CHRO, etc.)",
      "experience": "Tell me about your background - how many years of experience do you have?",
    }

    # Build onboarding instructions
    first_missing = missing_fields[0]
    prompt_parts.append(f"""

## 🎯 ONBOARDING MODE - Profile Incomplete!
This user's profile is missing: {', '.join(missing_fields)}

CRITICAL: Before recommending jobs, you MUST gather this info naturally:

**First question to ask (if conversation allows):**
"{onboarding_prompts.get(first_missing, 'Tell me about yourself!')}"

**Conversation flow:**
1. Greet warmly: "Hi {name}! Great to meet you."
2. Ask the first missing question naturally
3. After they answer, confirm and ask the next
4. Once you have all info, THEN recommend jobs

**Example opener:**
"Hi {name}! 👋 I'd love to help find your perfect fractional role. To get started, {onboarding_prompts.get(first_missing, 'could you tell me a bit about yourself?')}"

REMEMBER: Their answers will be stored automatically. Just have a natural conversation!
""")
  elif not zep_memory:
    # New user with no memory at all
    prompt_parts.append(f"""

## 🎯 NEW USER - Start Onboarding!
This is a new user with no profile yet.

**Your first message should be:**
"Hi {name}! 👋 Welcome to Fractional Quest! I'm here to help you find the perfect executive role.

To get us started, which city are you based in - London, Manchester, or are you looking for remote opportunities?"

Then follow up with role preference and experience questions.
""")

  # Add current conversation context (for "that job" references)
  if state.last_discussed_job:
    job = state.last_discussed_job
    details = state.last_discussed_job_details or {}
    prompt_parts.append(f"""
## Current Conversation Context:
The user just looked at this job:
- Title: {job.title}
- Company: {job.company}
- Location: {job.location}
- Salary: £{details.get('salary_min', 0)//1000}k - £{details.get('salary_max', 0)//1000}k

When the user says "that job", "this one", "it", or similar references, they mean THIS job.
If they ask to "print it", "save it", "apply", or "tell me more", use this job's details.""")

  # Add page context (for SEO job pages)
  if state.page_context:
    pc = state.page_context
    location = pc.location_filter or "UK"
    roles = ", ".join(pc.top_roles[:3]) if pc.top_roles else "various roles"
    print(f"📍 Page context: {pc.page_type}, {location}, {pc.total_jobs_on_page} jobs", file=sys.stderr)
    prompt_parts.append(f"""
## Current Page Context:
User is viewing: {location.upper()} JOBS PAGE
- Total jobs on page: {pc.total_jobs_on_page}
- Top roles: {roles}

When user says "jobs here", "these roles", "this area" → they mean {location}.
When they say "show me more" → search for more {location} jobs.
Proactively mention: "I see you're looking at {location} roles..."
If they ask about specific roles, filter within {location} first.""")

  return "\n".join(prompt_parts)

# =====
# Tools
# =====
@agent.tool
def get_user_profile(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Get the current user's profile information.
  Call this when user asks 'what is my name', 'who am I', 'my profile', etc.
  Returns their name, email, and preferences."""
  state = ctx.deps.state
  user = state.user
  if not user:
    return {"logged_in": False, "message": "User is not logged in"}

  return {
    "logged_in": True,
    "name": user.firstName or user.name or "Unknown",
    "email": user.email,
    "liked_jobs": user.liked_jobs,
  }

@agent.tool
def get_page_info(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Get information about the current page the user is viewing.
  Call this when user asks 'what page', 'where am I', 'current page', etc."""
  state = ctx.deps.state
  pc = state.page_context
  if not pc:
    return {"page": "main", "location": None, "jobs_count": 0}

  return {
    "page": pc.page_type,
    "location": pc.location_filter,
    "jobs_count": pc.total_jobs_on_page,
    "top_roles": pc.top_roles,
  }

@agent.tool
async def save_user_preference(ctx: RunContext[StateDeps[AppState]], preference_type: str, value: str) -> dict:
  """Save a user preference to their profile (soft save - no confirmation needed).
  This updates the profile graph immediately.

  IMPORTANT: Call this whenever user mentions location, role interest, or skills!
  Examples:
  - "I'm in London" → save_user_preference("location", "London")
  - "I want CMO roles" → save_user_preference("role_preference", "CMO")
  - "I have 20 years experience" → save_user_preference("experience", "20+ years")

  Args:
    preference_type: One of 'location', 'role_preference', 'skill', or 'experience'
    value: The value they provided (e.g., 'London', 'CTO', 'Python')

  Returns:
    Confirmation that preference was saved
  """
  state = ctx.deps.state
  user = state.user

  if not user or not user.id:
    print(f"💾 Cannot save - no user logged in", file=sys.stderr)
    return {"saved": False, "message": "User not logged in"}

  # Map preference_type to item_type for database
  item_type_map = {
    "location": "location",
    "role": "role_preference",
    "role_preference": "role_preference",
    "skill": "skill",
    "experience": "skill",
  }
  item_type = item_type_map.get(preference_type, preference_type)

  try:
    # Save directly to Neon database
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
      INSERT INTO user_profile_items (user_id, item_type, value, metadata, confirmed)
      VALUES (%s, %s, %s, %s, %s)
      ON CONFLICT (user_id, item_type, value)
      DO UPDATE SET updated_at = NOW()
      RETURNING id
    """, (user.id, item_type, value, '{"source": "voice_detected"}', False))
    conn.commit()
    result = cur.fetchone()
    cur.close()
    conn.close()
    print(f"💾 Saved to Neon: {item_type}={value} (id={result[0] if result else 'updated'})", file=sys.stderr)

    # Also store to Zep for memory context
    fact_messages = {
      "location": f"User is based in {value}",
      "role_preference": f"User is interested in {value} roles",
      "skill": f"User has experience with {value}",
    }
    message = fact_messages.get(item_type, f"User preference: {value}")
    await store_conversation_message(
      session_id=f"profile_{user.id}",
      user_id=user.id,
      role="user",
      content=message
    )

    print(f"💾 Saved preference: {item_type}={value} for user {user.id}", file=sys.stderr)
    return {"saved": True, "type": item_type, "value": value, "graph_updated": True}
  except Exception as e:
    print(f"💾 Error saving preference: {e}", file=sys.stderr)
    return {"saved": False, "error": str(e)}

@agent.tool
def get_jobs(ctx: RunContext[StateDeps[AppState]]) -> list[dict]:
  """Get the current list of jobs in state."""
  return [j.model_dump() for j in ctx.deps.state.jobs]

@agent.tool
async def search_jobs(ctx: RunContext[StateDeps[AppState]], query: str) -> dict:
  """Search for jobs and show results as interactive cards in the chat.
  Use this when user asks to 'show jobs', 'find roles', 'search for positions', etc.
  Returns job cards that render in the chat interface."""
  print(f"🔍 Searching: {query}", file=sys.stderr)

  # Extract keywords from query
  query_lower = query.lower()

  # Detect limit from query (e.g., "2 most recent", "show me 3 jobs")
  import re
  limit_match = re.search(r'\b(\d+)\s*(most recent|jobs|roles|positions)?', query_lower)
  limit = int(limit_match.group(1)) if limit_match and int(limit_match.group(1)) <= 10 else 10
  print(f"🔍 Limit detected: {limit}", file=sys.stderr)

  # Known role types to look for
  role_keywords = ["cto", "cfo", "cmo", "coo", "chro", "cpo", "cro", "ciso", "cio"]
  found_role = None
  for role in role_keywords:
    if role in query_lower:
      found_role = role.upper()
      break

  # Known locations to look for
  location_keywords = ["london", "manchester", "birmingham", "remote", "bristol", "leeds", "edinburgh"]
  found_location = None
  for loc in location_keywords:
    if loc in query_lower:
      found_location = loc
      break

  # Use page context if no location specified
  state = ctx.deps.state
  if not found_location and state.page_context and state.page_context.location_filter:
    found_location = state.page_context.location_filter.lower()
    print(f"🔍 Using page context location: {found_location}", file=sys.stderr)

  # Build query
  conn = psycopg2.connect(DATABASE_URL)
  cur = conn.cursor()

  if found_role and found_location:
    # Search by both role and location
    print(f"🔍 Filtering by role={found_role}, location={found_location}", file=sys.stderr)
    cur.execute("""
      SELECT title, company, location, salary_min, salary_max, description
      FROM test_jobs
      WHERE (title ILIKE %s OR role_type ILIKE %s) AND location ILIKE %s
      ORDER BY id DESC
      LIMIT %s
    """, (f"%{found_role}%", f"%{found_role}%", f"%{found_location}%", limit))
  elif found_role:
    # Search by role only
    print(f"🔍 Filtering by role={found_role}", file=sys.stderr)
    cur.execute("""
      SELECT title, company, location, salary_min, salary_max, description
      FROM test_jobs
      WHERE title ILIKE %s OR role_type ILIKE %s
      ORDER BY id DESC
      LIMIT %s
    """, (f"%{found_role}%", f"%{found_role}%", limit))
  elif found_location:
    # Search by location only
    print(f"🔍 Filtering by location={found_location}", file=sys.stderr)
    cur.execute("""
      SELECT title, company, location, salary_min, salary_max, description
      FROM test_jobs
      WHERE location ILIKE %s
      ORDER BY id DESC
      LIMIT %s
    """, (f"%{found_location}%", limit))
  else:
    # Fallback: search all fields with original query words
    # Split query into words and search for any match
    words = [w for w in query_lower.split() if len(w) > 2 and w not in ['the', 'and', 'for', 'all', 'jobs', 'show', 'find', 'positions', 'roles', 'fractional', 'most', 'recent']]
    if words:
      search_term = f"%{words[0]}%"
      print(f"🔍 Fallback search for: {words[0]}", file=sys.stderr)
    else:
      search_term = "%"
      print(f"🔍 Showing all jobs", file=sys.stderr)
    cur.execute("""
      SELECT title, company, location, salary_min, salary_max, description
      FROM test_jobs
      ORDER BY id DESC
      LIMIT %s
    """, (limit,))

  rows = cur.fetchall()
  cur.close()
  conn.close()
  print(f"🔍 Found {len(rows)} jobs", file=sys.stderr)

  # Update state for JobsCard sidebar
  jobs = [Job(title=r[0], company=r[1] or "Unknown", location=r[2] or "Remote") for r in rows]
  ctx.deps.state.jobs = jobs
  ctx.deps.state.search_query = query

  # Track the first job for "that job" references
  if rows:
    first_job = rows[0]
    ctx.deps.state.last_discussed_job = jobs[0]
    ctx.deps.state.last_discussed_job_details = {
      "title": first_job[0],
      "company": first_job[1] or "Unknown",
      "location": first_job[2] or "Remote",
      "salary_min": first_job[3],
      "salary_max": first_job[4],
      "description": first_job[5],
    }
    print(f"📌 Tracked last discussed job: {jobs[0].title} at {jobs[0].company}", file=sys.stderr)

  # Return data for chat rendering via useRenderToolCall
  job_cards = []
  for r in rows:
    salary_text = f"£{r[3]//1000}k - £{r[4]//1000}k" if r[3] and r[4] else "Competitive"
    # Generate search URL for the role type (these pages exist on fractional.quest)
    role_slug = query.lower().replace(' ', '-')
    role_url_map = {
      "cto": "https://fractional.quest/fractional-cto-jobs-uk",
      "cfo": "https://fractional.quest/fractional-cfo-jobs-uk",
      "cmo": "https://fractional.quest/fractional-cmo-jobs-uk",
      "coo": "https://fractional.quest/fractional-coo-jobs-uk",
      "chro": "https://fractional.quest/fractional-chro-jobs-uk",
      "cpo": "https://fractional.quest/fractional-cpo-jobs-uk",
      "cro": "https://fractional.quest/fractional-cro-jobs-uk",
    }
    job_url = role_url_map.get(query.lower(), f"https://fractional.quest/fractional-jobs")
    job_cards.append({
      "title": r[0],
      "company": r[1] or "Unknown",
      "location": r[2] or "Remote",
      "salary": salary_text,
      "description": (r[5] or "")[:150] + "..." if r[5] and len(r[5]) > 150 else (r[5] or ""),
      "url": job_url
    })

  return {
    "jobs": job_cards,
    "total": len(job_cards),
    "query": query,
    "title": f"Found {len(job_cards)} {query} positions"
  }

@agent.tool
def show_jobs_chart(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Show an interactive bar chart of job distribution by role type."""
  print("📊 Generating role distribution chart")
  conn = psycopg2.connect(DATABASE_URL)
  cur = conn.cursor()
  cur.execute("""
    SELECT role_type, COUNT(*) as count
    FROM test_jobs
    GROUP BY role_type ORDER BY count DESC
  """)
  rows = cur.fetchall()
  cur.close()
  conn.close()
  print(f"📊 Chart data: {rows}")
  return {
    "chartData": [{"name": r[0], "jobs": r[1], "fill": ["#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e", "#f97316", "#eab308"][i % 8]} for i, r in enumerate(rows)],
    "title": "Fractional Executive Roles Distribution",
    "subtitle": "Live data from test_jobs"
  }

@agent.tool
def show_location_chart(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Show a pie chart of jobs by geographic location."""
  print("🌍 Generating location chart")
  conn = psycopg2.connect(DATABASE_URL)
  cur = conn.cursor()
  cur.execute("""
    SELECT location, COUNT(*) as count
    FROM test_jobs
    GROUP BY location ORDER BY count DESC
  """)
  rows = cur.fetchall()
  cur.close()
  conn.close()
  print(f"🌍 Location data: {rows}")
  return {
    "chartData": [{"name": r[0], "jobs": r[1]} for r in rows],
    "title": "Jobs by Location",
    "subtitle": "Geographic distribution from test_jobs"
  }

@agent.tool
def show_salary_insights(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Show salary range insights by executive role type as an area chart."""
  print("💰 Generating salary insights")
  # Simulated market data based on industry standards
  salary_data = [
    {"role": "CEO", "min": 250, "max": 500, "avg": 375},
    {"role": "CFO", "min": 200, "max": 400, "avg": 300},
    {"role": "CTO", "min": 180, "max": 380, "avg": 280},
    {"role": "CMO", "min": 150, "max": 320, "avg": 235},
    {"role": "COO", "min": 170, "max": 350, "avg": 260},
    {"role": "CHRO", "min": 140, "max": 280, "avg": 210},
    {"role": "CRO", "min": 160, "max": 340, "avg": 250},
    {"role": "CPO", "min": 150, "max": 300, "avg": 225},
  ]
  return {
    "chartData": salary_data,
    "title": "Fractional Executive Day Rates (£)",
    "subtitle": "Market rate ranges by role"
  }

@agent.tool
def show_market_dashboard(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Show a comprehensive market dashboard with multiple metrics."""
  print("📈 Generating market dashboard")
  conn = psycopg2.connect(DATABASE_URL)
  cur = conn.cursor()

  cur.execute("SELECT COUNT(*) FROM test_jobs")
  total_jobs = cur.fetchone()[0]

  cur.execute("SELECT COUNT(DISTINCT company) FROM test_jobs")
  total_companies = cur.fetchone()[0]

  cur.execute("SELECT AVG(salary_max) FROM test_jobs WHERE salary_max IS NOT NULL")
  avg_salary = cur.fetchone()[0] or 150000

  cur.execute("""
    SELECT role_type, COUNT(*) as cnt
    FROM test_jobs
    GROUP BY role_type ORDER BY cnt DESC LIMIT 5
  """)
  top_roles = cur.fetchall()

  cur.close()
  conn.close()
  print(f"📈 Dashboard: {total_jobs} jobs, {total_companies} companies")

  return {
    "metrics": {
      "totalJobs": total_jobs,
      "totalCompanies": total_companies,
      "remoteJobs": 0,
      "avgDayRate": f"£{int(avg_salary/1000)}k"
    },
    "topRoles": [{"name": r[0], "count": r[1]} for r in top_roles],
    "title": "Fractional Executive Market Dashboard",
    "lastUpdated": "Live"
  }

@agent.tool
def get_featured_articles(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Get featured articles about fractional executive work with images."""
  print("📰 Getting featured articles")
  articles = [
    {
      "title": "The Rise of Fractional Executives",
      "description": "How the fractional model is transforming C-suite hiring",
      "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop",
      "url": "https://fractional.quest/fractional-executive-meaning",
      "source": "Fractional Quest"
    },
    {
      "title": "CFO vs Fractional CFO: Which Do You Need?",
      "description": "A guide to choosing the right finance leadership model",
      "image": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop",
      "url": "https://fractional.quest/fractional-cfo-jobs-uk",
      "source": "Industry Guide"
    },
    {
      "title": "Tech Leadership on Demand",
      "description": "Why startups are choosing fractional CTOs",
      "image": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=200&fit=crop",
      "url": "https://fractional.quest/fractional-cto-jobs-uk",
      "source": "Tech Insights"
    },
    {
      "title": "The Future of Executive Work",
      "description": "Portfolio careers and the new C-suite paradigm",
      "image": "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop",
      "url": "https://fractional.quest/fractional-roles",
      "source": "Forbes"
    }
  ]
  return {"articles": articles, "title": "Featured Insights"}

@agent.tool
def show_a2ui_job_card(ctx: RunContext[StateDeps[AppState]], role: str) -> dict:
  """Show a rich A2UI job card widget for a specific role. Returns A2UI JSON format."""
  print(f"🎨 Generating A2UI card for: {role}")

  conn = psycopg2.connect(DATABASE_URL)
  cur = conn.cursor()
  cur.execute("""
    SELECT title, company, location, salary_min, salary_max, description
    FROM test_jobs
    WHERE title ILIKE %s OR role_type ILIKE %s
    LIMIT 1
  """, (f"%{role}%", f"%{role}%"))
  row = cur.fetchone()
  cur.close()
  conn.close()
  print(f"🎨 Found job: {row}")

  if not row:
    return {"a2ui": {"type": "text", "text": f"No {role} jobs found"}}

  salary_text = f"💰 £{row[3]//1000}k - £{row[4]//1000}k" if row[3] and row[4] else ""

  # Generate job URL slug from title and company
  slug = f"{row[0].lower().replace(' ', '-')}-{row[1].lower().replace(' ', '-')}"
  job_url = f"https://fractional.quest/job/{slug}"

  # Return A2UI JSON format with clickable links
  return {
    "a2ui": {
      "type": "card",
      "children": [
        {
          "type": "image",
          "url": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=150&fit=crop",
          "alt": "Executive office"
        },
        {"type": "text", "variant": "h2", "text": row[0]},
        {"type": "text", "variant": "body", "text": f"🏢 {row[1]}"},
        {"type": "text", "variant": "caption", "text": f"📍 {row[2]}"},
        {"type": "text", "variant": "caption", "text": salary_text},
        {"type": "text", "variant": "body", "text": row[5] or ""},
        {"type": "link", "text": "View full job details →", "url": job_url},
        {
          "type": "row",
          "children": [
            {"type": "button", "label": "Apply Now", "variant": "primary", "url": job_url},
            {"type": "button", "label": "View More Jobs", "variant": "secondary", "url": "https://fractional.quest/jobs"}
          ]
        }
      ]
    },
    "title": f"Featured {role} Position"
  }

@agent.tool
async def show_user_graph(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Show an interactive 3D force graph visualization of the user's interests, skills, and job preferences.
  This displays a beautiful 3D graph with the user at the center and their interests radiating outward.
  Use this when the user asks about their profile, interests, repo, or wants to see their data visualized."""
  print("🌌 Generating user interest graph")

  state = ctx.deps.state
  user = state.user

  if not user or not user.id:
    return {
      "nodes": [{"id": "guest", "type": "user", "label": "Guest"}],
      "edges": [],
      "title": "Sign in to see your personalized graph"
    }

  user_name = user.firstName or user.name or "You"
  nodes = [{"id": "user", "type": "user", "label": user_name}]
  edges = []

  # Fetch facts from Zep
  try:
    client = get_zep_client()
    if client:
      response = await client.post(
        "/api/v2/graph/search",
        json={
          "user_id": user.id,
          "query": "preferences interests roles locations skills jobs experience",
          "limit": 20,
          "scope": "edges",
        },
      )

      if response.status_code == 200:
        data = response.json()
        zep_edges = data.get("edges", [])
        print(f"🌌 Found {len(zep_edges)} facts for graph")

        # Transform Zep facts into graph nodes and edges
        for i, edge in enumerate(zep_edges[:15]):  # Limit to 15 for performance
          fact = edge.get("fact", "")
          edge_name = edge.get("name", "RELATES_TO")

          if not fact:
            continue

          # Extract clean entities from fact text
          fact_lower = fact.lower()
          extracted = extract_entities_from_fact(fact)

          for entity_label, entity_type in extracted:
            # Deduplicate by checking if label already exists
            if any(n.get("label", "").lower() == entity_label.lower() for n in nodes):
              continue

            node_id = f"node_{len(nodes)}"
            nodes.append({
              "id": node_id,
              "type": entity_type,
              "label": entity_label
            })
            edges.append({
              "source": "user",
              "target": node_id,
              "type": edge_name,
              "label": edge_name.replace("_", " ").title()
            })
  except Exception as e:
    print(f"🌌 Error fetching Zep facts: {e}", file=sys.stderr)

  # Add some default nodes if graph is empty (besides user)
  if len(nodes) == 1:
    # Add placeholder nodes to show structure
    default_interests = [
      ("CTO Roles", "role"),
      ("London", "location"),
      ("Startup Experience", "skill"),
    ]
    for i, (label, node_type) in enumerate(default_interests):
      node_id = f"default_{i}"
      nodes.append({"id": node_id, "type": node_type, "label": label})
      edges.append({"source": "user", "target": node_id, "type": "EXAMPLE", "label": "Example"})

  print(f"🌌 Graph: {len(nodes)} nodes, {len(edges)} edges")

  return {
    "nodes": nodes,
    "edges": edges,
    "title": f"{user_name}'s Interest Graph"
  }

@agent.tool
def show_a2ui_stats_widget(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Show an A2UI statistics widget with live market data."""
  print("📊 Generating A2UI stats widget")

  conn = psycopg2.connect(DATABASE_URL)
  cur = conn.cursor()

  cur.execute("SELECT COUNT(*) FROM test_jobs")
  total = cur.fetchone()[0]

  cur.execute("SELECT COUNT(DISTINCT company) FROM test_jobs")
  companies = cur.fetchone()[0]

  cur.execute("SELECT AVG(salary_max) FROM test_jobs WHERE salary_max IS NOT NULL")
  avg_salary = cur.fetchone()[0] or 150000

  cur.close()
  conn.close()
  print(f"📊 Stats: {total} jobs, {companies} companies")

  return {
    "a2ui": {
      "type": "card",
      "children": [
        {"type": "text", "variant": "h1", "text": "📈 Market Snapshot"},
        {
          "type": "row",
          "children": [
            {
              "type": "column",
              "children": [
                {"type": "text", "variant": "h2", "text": str(total)},
                {"type": "text", "variant": "caption", "text": "Active Jobs"}
              ]
            },
            {
              "type": "column",
              "children": [
                {"type": "text", "variant": "h2", "text": str(companies)},
                {"type": "text", "variant": "caption", "text": "Companies"}
              ]
            },
            {
              "type": "column",
              "children": [
                {"type": "text", "variant": "h2", "text": f"£{int(avg_salary/1000)}k"},
                {"type": "text", "variant": "caption", "text": "Avg Salary"}
              ]
            }
          ]
        },
        {"type": "divider"},
        {"type": "text", "variant": "body", "text": "Live data from test_jobs table"}
      ]
    },
    "title": "Market Statistics"
  }

@agent.tool
def set_ambient_scene(ctx: RunContext[StateDeps[AppState]], location: str = None, role: str = None) -> dict:
  """Change the ambient background scene based on conversation context.
  Call this when the user mentions a specific location or role type to create an immersive experience.

  Args:
    location: City or area (e.g., "london", "manchester", "remote", "new york")
    role: Executive role type (e.g., "cto", "cfo", "cmo", "startup")

  Returns:
    Confirmation and the Unsplash search query being used
  """
  print(f"🎨 Setting ambient scene: location={location}, role={role}", file=sys.stderr)

  # Build an evocative search query for Unsplash
  query_parts = []

  if location:
    location_queries = {
      "london": "london skyline cityscape",
      "manchester": "manchester city urban",
      "birmingham": "birmingham england city",
      "bristol": "bristol harbour city",
      "remote": "home office modern workspace",
      "new york": "new york manhattan skyline",
      "san francisco": "san francisco bay area",
    }
    query_parts.append(location_queries.get(location.lower(), f"{location} city skyline"))

  if role:
    role_queries = {
      "cto": "technology startup office",
      "cfo": "finance corporate office",
      "cmo": "creative marketing agency",
      "coo": "modern business operations",
      "chro": "diverse team collaboration",
      "cpo": "product design studio",
      "startup": "startup office modern",
    }
    query_parts.append(role_queries.get(role.lower(), f"{role} professional"))

  # Combine or use defaults
  if query_parts:
    search_query = " ".join(query_parts)
  else:
    search_query = "executive business professional"

  # Update state with scene info
  state = ctx.deps.state
  state.scene = AmbientScene(
    location=location,
    role=role,
    mood="professional",
    query=search_query
  )

  print(f"🎨 Scene query: {search_query}", file=sys.stderr)

  return {
    "scene_updated": True,
    "location": location,
    "role": role,
    "query": search_query,
    "message": f"Background updated to show {search_query}"
  }

# =====
# Unified FastAPI App with AG-UI + CLM endpoints
# =====
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse
import json
import asyncio

# AG-UI app for CopilotKit
ag_ui_app = agent.to_ag_ui(deps=StateDeps(AppState()))

# Main app with CLM endpoint
main_app = FastAPI(title="Fractional Quest Agent", description="Unified agent for Voice + Chat")

# CORS for cross-origin requests
main_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def parse_session_id(session_id: str | None) -> dict:
    """
    Parse custom session ID format: "firstName|fractional_userId|location:London,jobs:25"
    """
    if not session_id:
        return {"first_name": "", "user_id": "", "page_context": None}

    parts = session_id.split("|")
    first_name = parts[0] if len(parts) > 0 else ""
    session_part = parts[1] if len(parts) > 1 else ""
    user_id = session_part.replace("fractional_", "").replace("fractional_anon_", "")

    page_context = None
    if len(parts) > 2 and parts[2]:
        page_context = {}
        for p in parts[2].split(","):
            if ":" in p:
                key, val = p.split(":", 1)
                if key == "location":
                    page_context["location"] = val
                elif key == "jobs":
                    page_context["total_jobs"] = int(val)

    return {
        "first_name": first_name,
        "user_id": user_id,
        "page_context": page_context,
    }


def extract_session_id(request: Request, body: dict) -> str | None:
    """Extract session ID from various sources."""
    session_id = body.get("custom_session_id") or body.get("session_id")
    if session_id:
        return session_id

    metadata = body.get("metadata", {})
    session_id = metadata.get("custom_session_id") or metadata.get("session_id")
    if session_id:
        return session_id

    for header in ["x-hume-session-id", "x-session-id", "x-custom-session-id"]:
        session_id = request.headers.get(header)
        if session_id:
            return session_id

    return request.query_params.get("custom_session_id")


async def stream_sse_response(content: str, msg_id: str):
    """Stream OpenAI-compatible SSE chunks - required by Hume EVI."""
    words = content.split(' ')
    for i, word in enumerate(words):
        chunk = {
            "id": msg_id,
            "object": "chat.completion.chunk",
            "created": 1700000000,
            "model": "fractional-agent",
            "choices": [{
                "index": 0,
                "delta": {
                    "content": word + (' ' if i < len(words) - 1 else ''),
                    "role": "assistant" if i == 0 else None
                },
                "finish_reason": None
            }]
        }
        yield f"data: {json.dumps(chunk)}\n\n"
        await asyncio.sleep(0.01)  # Small delay for natural streaming

    # Final chunk
    final = {
        "id": msg_id,
        "object": "chat.completion.chunk",
        "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]
    }
    yield f"data: {json.dumps(final)}\n\n"
    yield "data: [DONE]\n\n"


async def run_agent_for_clm(user_message: str, state: AppState, conversation_history: list = None) -> str:
    """Run the Pydantic AI agent and return the text response.

    Args:
        user_message: The latest user message
        state: Current app state with user profile
        conversation_history: List of previous messages for context
    """
    try:
        from pydantic_ai.ag_ui import StateDeps
        from pydantic_ai.messages import ModelMessage, ModelRequest, UserPromptPart

        deps = StateDeps(state)

        # Build message history for multi-turn context
        message_history = []
        if conversation_history:
            for msg in conversation_history[:-1]:  # Exclude last (current) message
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if isinstance(content, str) and content.strip():
                    # Convert to Pydantic AI message format
                    if role == "user":
                        message_history.append(
                            ModelRequest(parts=[UserPromptPart(content=content)])
                        )
                    elif role == "assistant":
                        # For assistant messages, we need ModelResponse
                        from pydantic_ai.messages import ModelResponse, TextPart
                        message_history.append(
                            ModelResponse(parts=[TextPart(content=content)])
                        )

        print(f"[CLM] Running agent with {len(message_history)} history messages", file=sys.stderr)

        # Run agent with history
        result = await agent.run(
            user_message,
            deps=deps,
            message_history=message_history if message_history else None
        )

        # Extract text from result
        if hasattr(result, 'data') and result.data:
            return str(result.data)
        elif hasattr(result, 'output'):
            return str(result.output)
        else:
            return str(result)
    except Exception as e:
        print(f"[CLM] Agent error: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return ""


def is_name_question(query: str) -> bool:
    """Check if user is asking about their name."""
    q = query.lower()
    return any(phrase in q for phrase in ['my name', 'who am i', 'what am i called'])


def is_page_question(query: str) -> bool:
    """Check if user is asking about the current page."""
    q = query.lower()
    return any(phrase in q for phrase in ['what page', 'where are we', 'which page', 'current page'])


@main_app.post("/chat/completions")
async def clm_endpoint(request: Request):
    """
    CLM endpoint for Hume EVI - OpenAI-compatible SSE streaming.
    This gives voice the SAME brain as CopilotKit chat.
    """
    body = await request.json()
    messages = body.get("messages", [])

    # Extract session info
    session_id = extract_session_id(request, body)
    parsed = parse_session_id(session_id)
    first_name = parsed["first_name"]
    user_id = parsed["user_id"]
    page_context = parsed["page_context"]

    print(f"[CLM] User: {first_name or 'anon'}, ID: {user_id or 'none'}", file=sys.stderr)
    if page_context:
        print(f"[CLM] Page: {page_context}", file=sys.stderr)

    # Get last user message
    user_msg = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            content = msg.get("content", "")
            if isinstance(content, str):
                user_msg = content
                break

    print(f"[CLM] Query: {user_msg[:80]}...", file=sys.stderr)

    # Handle name question directly (fast path)
    if is_name_question(user_msg):
        if first_name:
            response_text = f"Your name is {first_name}! I remembered that from when you logged in."
        else:
            response_text = "I don't know your name yet. You can tell me, or sign in so I can remember you!"
        msg_id = f"chatcmpl-{hash(user_msg) % 100000}"
        return StreamingResponse(stream_sse_response(response_text, msg_id), media_type="text/event-stream")

    # Handle page question directly (fast path)
    if is_page_question(user_msg):
        if page_context and page_context.get("location"):
            loc = page_context["location"]
            jobs = page_context.get("total_jobs", "several")
            response_text = f"We're on the {loc} jobs page. There are {jobs} fractional executive positions here. Want me to show you the roles?"
        else:
            response_text = "We're on the main fractional jobs page. Which location interests you - London, Manchester, or somewhere else?"
        msg_id = f"chatcmpl-{hash(user_msg) % 100000}"
        return StreamingResponse(stream_sse_response(response_text, msg_id), media_type="text/event-stream")

    # Build state for agent
    user_profile = UserProfile(
        id=user_id if user_id else None,
        firstName=first_name if first_name else None,
    ) if user_id or first_name else None

    page_ctx = PageContext(
        page_type=f"jobs_{page_context['location'].lower()}" if page_context and page_context.get('location') else "main",
        location_filter=page_context.get("location") if page_context else None,
        total_jobs_on_page=page_context.get("total_jobs", 0) if page_context else 0,
    ) if page_context else None

    state = AppState(
        jobs=[],
        search_query="",
        user=user_profile,
        page_context=page_ctx,
    )

    # Run the agent with conversation history
    response_text = await run_agent_for_clm(user_msg, state, conversation_history=messages)

    # Fallback if agent fails
    if not response_text:
        if first_name:
            response_text = f"Hi {first_name}! I can help you find fractional executive roles. What type of position interests you - CTO, CFO, CMO, COO, or CHRO?"
        else:
            response_text = "I can help you find fractional executive roles. What type of position interests you?"

    print(f"[CLM] Response: {response_text[:80]}...", file=sys.stderr)

    # Store to Zep (fire and forget)
    if user_id and user_msg:
        asyncio.create_task(store_conversation_message(
            session_id=f"voice_{session_id or 'unknown'}",
            user_id=user_id,
            role="user",
            content=user_msg
        ))
        asyncio.create_task(store_conversation_message(
            session_id=f"voice_{session_id or 'unknown'}",
            user_id=user_id,
            role="assistant",
            content=response_text
        ))

    # Return SSE streaming response (required by Hume EVI)
    msg_id = f"chatcmpl-{hash(user_msg) % 100000}"
    return StreamingResponse(
        stream_sse_response(response_text, msg_id),
        media_type="text/event-stream"
    )


@main_app.get("/chat/completions")
async def clm_health():
    return {"status": "ok", "message": "Use POST for chat completions"}


@main_app.get("/")
async def health():
    return {"status": "ok", "service": "fractional-quest-agent", "endpoints": ["/chat/completions (CLM)", "/* (AG-UI)"]}


# Mount AG-UI app for CopilotKit (catch-all)
main_app.mount("/agui", ag_ui_app)

# Export main app
app = main_app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
