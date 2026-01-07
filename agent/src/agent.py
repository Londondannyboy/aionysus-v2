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
# User Context Cache (for CopilotKit instructions parsing)
# =====
# When CopilotKit passes user info in instructions, we cache it here
# so tools can access it even when state.user is None
_cached_user_context: dict = {}

def extract_user_from_instructions(instructions: str) -> dict:
    """Extract user info from CopilotKit instructions text."""
    result = {"user_id": None, "name": None, "email": None}

    if not instructions:
        return result

    # Look for User ID pattern
    import re
    id_match = re.search(r'User ID:\s*([a-f0-9-]+)', instructions, re.IGNORECASE)
    if id_match:
        result["user_id"] = id_match.group(1)

    # Look for User Name pattern
    name_match = re.search(r'User Name:\s*([^\n]+)', instructions, re.IGNORECASE)
    if name_match:
        result["name"] = name_match.group(1).strip()

    # Look for Email pattern
    email_match = re.search(r'User Email:\s*([^\n]+)', instructions, re.IGNORECASE)
    if email_match:
        result["email"] = email_match.group(1).strip()

    if result["user_id"]:
        global _cached_user_context
        _cached_user_context = result
        print(f"📋 Cached user from instructions: {result['name']} ({result['user_id'][:8]}...)", file=sys.stderr)

    return result

def get_effective_user_id(state_user) -> Optional[str]:
    """Get user ID from state or cached instructions."""
    if state_user and state_user.id:
        return state_user.id
    if _cached_user_context.get("user_id"):
        return _cached_user_context["user_id"]
    return None

def get_effective_user_name(state_user) -> Optional[str]:
    """Get user name from state or cached instructions."""
    if state_user and (state_user.firstName or state_user.name):
        return state_user.firstName or state_user.name
    if _cached_user_context.get("name"):
        return _cached_user_context["name"]
    return None


# =====
# Page Context Cache (for CopilotKit instructions parsing)
# =====
# When CopilotKit passes page info in instructions, we cache it here
# so the system prompt and tools can access it even when state.page_context is None
_cached_page_context: dict = {}

def extract_page_context_from_instructions(instructions: str) -> dict:
    """Extract page context from CopilotKit instructions text.

    Looks for patterns like:
    - ## PAGE CONTEXT (for agent parsing)
      Page Type: services
      Role Type: CMO
    - ## Service Page Context: Fractional CMO
    - Current Page: hire-fractional-cmo
    """
    global _cached_page_context
    import re
    result = {"page_type": None, "role_type": None, "is_services_page": False}

    if not instructions:
        return result

    # NEW FORMAT: Look for structured PAGE CONTEXT block
    # Page Type: services
    page_type_match = re.search(r'Page Type:\s*(\w+)', instructions, re.IGNORECASE)
    role_type_match = re.search(r'Role Type:\s*(\w+)', instructions, re.IGNORECASE)

    if page_type_match and role_type_match:
        page_type = page_type_match.group(1).lower()
        role = role_type_match.group(1).upper()
        result["page_type"] = f"{page_type}_{role.lower()}"
        result["role_type"] = role
        result["is_services_page"] = page_type == "services"

        _cached_page_context = result
        print(f"📍 Cached page context (new format): {page_type} page for {role}", file=sys.stderr)
        return result

    # LEGACY FORMAT: Look for "Service Page Context: Fractional {ROLE}"
    service_match = re.search(r'Service Page Context:\s*Fractional\s+(\w+)', instructions, re.IGNORECASE)
    if service_match:
        role = service_match.group(1).upper()
        result["page_type"] = f"services_{role.lower()}"
        result["role_type"] = role
        result["is_services_page"] = True

        _cached_page_context = result
        print(f"📍 Cached page context from instructions: services page for {role}", file=sys.stderr)
        return result

    # Look for "Current Page: {page_type}"
    page_match = re.search(r'Current Page:\s*([^\n]+)', instructions, re.IGNORECASE)
    if page_match:
        page_type = page_match.group(1).strip().lower()
        result["page_type"] = page_type

        _cached_page_context = result
        print(f"📍 Cached page context from instructions: {page_type}", file=sys.stderr)
        return result

    # Look for job page context patterns
    jobs_match = re.search(r'(?:jobs?|listings?)\s+(?:page|for)\s+([^\n,]+)', instructions, re.IGNORECASE)
    if jobs_match:
        location = jobs_match.group(1).strip()
        result["page_type"] = f"jobs_{location.lower()}"
        result["location_filter"] = location

        _cached_page_context = result
        print(f"📍 Cached page context from instructions: jobs page for {location}", file=sys.stderr)

    return result

def get_effective_page_context(state_page_context):
    """Get page context from state or cached instructions."""
    if state_page_context:
        return state_page_context
    if _cached_page_context.get("page_type"):
        return _cached_page_context
    return None


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
# Unread Messages Check
# =====
def get_unread_messages(user_id: Optional[str]) -> list[dict]:
    """Fetch unread messages from recruiters/admins for this user.

    Returns list of unread messages with sender info.
    """
    if not user_id or not DATABASE_URL:
        return []

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Get unread messages with sender details
        cur.execute("""
            SELECT
                m.id,
                m.from_user_id,
                m.content,
                m.created_at,
                ut.display_name,
                ut.company,
                ut.title,
                ut.type
            FROM messages m
            LEFT JOIN user_types ut ON m.from_user_id = ut.user_id
            WHERE m.to_user_id = %s AND m.read_at IS NULL
            ORDER BY m.created_at DESC
            LIMIT 5
        """, (user_id,))

        rows = cur.fetchall()
        conn.close()

        messages = []
        for row in rows:
            messages.append({
                "id": row[0],
                "from_user_id": row[1],
                "content": row[2][:200] + "..." if len(row[2] or "") > 200 else row[2],
                "created_at": str(row[3]) if row[3] else None,
                "sender_name": row[4] or "Unknown",
                "sender_company": row[5],
                "sender_title": row[6],
                "sender_type": row[7] or "recruiter",
            })

        if messages:
            print(f"📬 Found {len(messages)} unread messages for user {user_id}", file=sys.stderr)

        return messages

    except Exception as e:
        print(f"[Messages] Error fetching unread: {e}", file=sys.stderr)
        return []


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

    ## 🔮 STAGE 1 ONBOARDING - TRINITY FIRST! (CRITICAL!)

    Check the "STAGE 1 PROFILE" section in your instructions. If it says "⚠️ INCOMPLETE",
    you MUST gather the missing info BEFORE showing jobs or taking other actions!

    **Trinity Options** (Why are they here?):
    - job_search: Looking for a new fractional role
    - coaching: Want career guidance and positioning help
    - lifestyle_change: Seeking flexibility, remote work, relocation
    - just_curious: Exploring, no immediate plans

    **Employment Status Options**:
    - employed: Currently working
    - between_roles: Recently left or finishing up
    - freelancing: Already working fractionally
    - founder: Running own venture

    **Professional Vertical Options**:
    - technology, finance, marketing, operations, hr_people, sales, product, general_management

    ### STAGE 1 FLOW (IN ORDER!):
    1. Check Trinity → if missing, call confirm_trinity(user_id=...)
    2. Check Employment Status → if missing, call confirm_employment_status(user_id=...)
    3. Check Professional Vertical → if missing, call confirm_professional_vertical(user_id=...)
    4. ONLY THEN proceed with jobs/coaching/etc.

    | User says... | If Stage 1 Incomplete | If Stage 1 Complete |
    |--------------|----------------------|---------------------|
    | "Show me jobs" | "Let me learn about you first..." → Stage 1 HITLs | search_jobs() |
    | "Find CTO roles" | "Before we search, a few quick questions..." → Stage 1 HITLs | search_jobs("CTO") |
    | "What's available?" | "Let's start by understanding your journey..." → Stage 1 HITLs | Depends on Trinity |

    ### ROUTING BY TRINITY (after Stage 1 complete):
    | Trinity | What to do |
    |---------|------------|
    | job_search | Full job search, matching, recruiter connections at 90%+ |
    | coaching | Ask 1-2 context questions, then call connect_with_coach(user_id=..., context="...") |
    | lifestyle_change | Understand constraints (location, hours) → filter jobs accordingly |
    | just_curious | Show market overview, let them explore casually |

    ### COACHING FLOW (Trinity = coaching):
    When user's Trinity is "coaching", DON'T try to be a coach yourself!
    Instead:
    1. Ask a brief context question: "What's the biggest career challenge you're facing right now?"
    2. Once they share, call: connect_with_coach(user_id=..., context="<their challenge>")
    3. This shows them Dan's booking card for a real coaching conversation

    Example:
    User: "I need help figuring out my next move"
    Agent: "I'd love to help! What's the biggest question on your mind about your career right now?"
    User: "I'm not sure if I should go fractional or find another full-time role"
    Agent: *calls connect_with_coach(context="Deciding between fractional vs full-time")* → Shows booking card

    ### COMPANY VALIDATION:
    When user adds a company, it's UNVALIDATED until:
    1. They provide a URL
    2. They confirm via confirm_company HITL
    Companies with URLs can be linked to other users at same company!

    ## CRITICAL: Use Instructions Context for Profile Questions!

    The frontend passes you CRITICAL USER CONTEXT in the system instructions with:
    - User Name, User ID, User Email
    - Location, Target Role, Skills, Companies

    **For simple profile questions, ANSWER DIRECTLY from that context - DO NOT call a tool!**

    | User asks... | HOW TO ANSWER |
    |--------------|---------------|
    | "What is my name?" | Answer directly: "Your name is {User Name}" |
    | "What is my email?" | Answer directly: "Your email is {User Email}" |
    | "What are my skills?" | Answer directly: "Your skills include: {Skills}" |
    | "What is my target role?" | Answer directly: "Your target role is {Target Role}" |
    | "Where am I located?" | Answer directly: "You're based in {Location}" |
    | "What companies have I worked at?" | Answer directly: "You've worked at: {Companies}" |

    ONLY call show_user_graph if user explicitly asks to SEE their profile graph/visualization.

    ## Your Tools - USE THEM, DON'T SAY YOU CAN'T!
    CRITICAL: You HAVE these tools. NEVER say "I cannot" or "I don't have ability" - USE THE TOOL!

    | User asks about... | YOU MUST USE THIS TOOL |
    |---------------------|------------------------|
    | show my profile graph, visualize | show_user_graph |
    | what page, where am I | get_page_info |
    | day rates, salaries, pay | show_salary_insights |
    | jobs, positions, roles | search_jobs |
    | job distribution, how many | show_jobs_chart |
    | locations, where, geography | show_location_chart |
    | market, overview, dashboard | show_market_dashboard |
    | articles, reading, insights | get_featured_articles |

    ## AMBIENT SCENE - ALWAYS CALL THIS SILENTLY
    When user mentions ANY location or role, IMMEDIATELY call set_ambient_scene.
    Do NOT announce this - just do it silently in the background.

    Examples - call set_ambient_scene for:
    - "I'm in London" → set_ambient_scene(location="london")
    - "Manchester" → set_ambient_scene(location="manchester")
    - "CTO roles" → set_ambient_scene(role="cto")
    - "remote work" → set_ambient_scene(location="remote")

    ## LOCATION CONFIRMATION (Human-in-the-Loop)
    You have access to a FRONTEND TOOL called confirm_location.
    This is a HUMAN-IN-THE-LOOP action that confirms location changes.

    CRITICAL: When user mentions a location they're based in, call confirm_location!

    **Trigger phrases** (ANY of these → confirm_location):
    - "I'm in [X]"
    - "I'm based in [X]"
    - "I live in [X]"
    - "I'm from [X]"
    - "My location is [X]"
    - "I moved to [X]"

    | User says... | Action |
    |--------------|--------|
    | "I'm in London" | confirm_location(new_location="London", current_location=<from instructions>, user_id=...) |
    | "I moved to Manchester" | confirm_location(new_location="Manchester", current_location=<from instructions>, user_id=...) |

    ⚠️ Pass the current_location from the user's profile in the instructions context!

    ## ROLE PREFERENCES - Use save_user_preference
    For target roles, you can still use save_user_preference since they change less often:

    | User says... | Action |
    |--------------|--------|
    | "I want CTO roles" | save_user_preference("role_preference", "CTO") |
    | "Looking for CMO positions" | save_user_preference("role_preference", "CMO") |

    ## COMPANY CONFIRMATION (Human-in-the-Loop)
    You have access to a FRONTEND TOOL called confirm_company.
    This is a HUMAN-IN-THE-LOOP action that pauses and asks the user to confirm.

    CRITICAL: When user mentions ANY company they work/worked at, call confirm_company!

    **Trigger phrases** (ANY of these → confirm_company):
    - "I work at [X]"
    - "I worked at [X]"
    - "I used to work at [X]"
    - "I was at [X]"
    - "Previously at [X]"
    - "Currently at [X]"
    - "I'm at [X]"
    - "I joined [X]"
    - "My company is [X]"
    - "I left [X]"
    - "Former [X] employee"

    | User says... | Action |
    |--------------|--------|
    | "I work at Sony" | confirm_company(company_name="Sony", ...) |
    | "I was at McKinsey" | confirm_company(company_name="McKinsey", ...) |
    | "I used to work at Sony PlayStation" | confirm_company(company_name="Sony PlayStation", ...) |
    | "Previously at Google" | confirm_company(company_name="Google", ...) |

    ⚠️ NEVER save company names using save_user_preference("skill", ...)!
    Companies are NOT skills. Always use confirm_company for employment history.

    This triggers a HITL popup in the frontend asking user to:
    1. Confirm the company (with URL shown)
    2. Add their job title at that company

    IMPORTANT: Use the user's actual ID from state.user.id!

    ## SKILL CONFIRMATION (Human-in-the-Loop)
    You have access to a FRONTEND TOOL called confirm_skill.
    This is a HUMAN-IN-THE-LOOP action that validates and confirms skills.

    CRITICAL: When user mentions a skill they have, call confirm_skill!

    **Trigger phrases** (ANY of these → confirm_skill):
    - "I know [X]"
    - "I'm skilled in [X]"
    - "I can do [X]"
    - "I have experience with [X]"
    - "I've worked with [X]"
    - "My skills include [X]"
    - "I'm good at [X]"
    - "I specialize in [X]"

    | User says... | Action |
    |--------------|--------|
    | "I know Python" | confirm_skill(skill_name="Python", user_id=...) |
    | "I'm skilled in marketing" | confirm_skill(skill_name="Marketing", user_id=...) |
    | "I have M&A experience" | confirm_skill(skill_name="M&A", user_id=...) |

    The frontend will:
    1. Check if it's a validated skill (from a standard list)
    2. Show green badge for validated skills, amber for custom skills
    3. Let user confirm before adding

    ⚠️ Do NOT use save_user_preference("skill", ...) for skills!
    Always use confirm_skill so the user can validate!

    CRITICAL RULES:
    - "What is my name/email/skills/role/location?" → ANSWER DIRECTLY from the instructions context!
    - "What page are we on?" → CALL get_page_info, then describe the page!
    - When user shares preferences → Use the HITL tools (confirm_location, confirm_skill, confirm_company)
    - NEVER say "I don't have access to personal information" - you DO, in the instructions!
    - NEVER say "I am a language model" - you are a career advisor with real data!
    - NEVER call a tool for simple profile questions - the data is in your instructions!

    ## GETTING USER ID FOR HITL TOOLS - CRITICAL!
    ⚠️ NEVER ASK THE USER FOR THEIR USER ID! You already have it!

    The User ID is ALWAYS in your system instructions. Look for the line:
    "- User ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

    Extract that UUID and use it directly in your HITL tool calls.

    ❌ WRONG: "I need your user ID to confirm the skill. Could you please provide it?"
    ✅ RIGHT: Just call confirm_skill(skill_name="Design", user_id="5e421f23-16a6-42de-a4a4-fa412414f1d8")

    The user_id is a UUID like: 5e421f23-16a6-42de-a4a4-fa412414f1d8
    Find it in your instructions and USE IT IMMEDIATELY without asking!

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

    ## JOB ASSESSMENT FLOW (assess_job_match)
    When user asks to assess their fit for a job, ALWAYS call assess_job_match!

    **Trigger phrases** (ANY of these → assess_job_match):
    - "Assess my fit for..."
    - "Am I qualified for..."
    - "Should I apply to..."
    - "How well do I match..."
    - "Is this job right for me?"
    - User clicks heart/save button on a job card

    | User says... | Action |
    |--------------|--------|
    | "Assess my fit for the CTO job at TechCorp" | assess_job_match(job_title="CTO") |
    | "Am I qualified for this job?" | assess_job_match() ← uses last_discussed_job |
    | "Should I apply?" | assess_job_match() then offer to save if good match |

    After showing assessment, if match is 60%+:
    - Say something like "Good match! Would you like me to save this job for you?"
    - If they say yes, call confirm_job_interest

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

  # Get effective user info (from state OR cached from CopilotKit instructions)
  user_id = get_effective_user_id(user)
  name = get_effective_user_name(user)

  if not name and not user_id:
    print("🧑 No user logged in (no state, no cached instructions)", file=sys.stderr)
    return "The user is not logged in. Encourage them to sign in for a personalized experience."

  # If we have cached user from instructions but no state.user
  if not user and _cached_user_context.get("name"):
    name = _cached_user_context["name"]
    user_id = _cached_user_context.get("user_id")
    print(f"🧑 Using cached user from instructions: {name}", file=sys.stderr)
  elif name:
    print(f"🧑 Greeting user: {name}", file=sys.stderr)

  # Get Zep memory (preferences, interests from past conversations)
  zep_memory = ""
  profile_complete = False
  missing_fields: list[str] = []
  if user_id:
    zep_memory, profile_complete, missing_fields = await get_user_memory_context(user_id)
    if zep_memory:
      print(f"🧠 Zep memory injected for user {user_id}, complete={profile_complete}", file=sys.stderr)
    if missing_fields:
      print(f"📋 Missing profile fields: {missing_fields}", file=sys.stderr)

  # Check for unread messages from recruiters/coaches
  unread_messages = []
  if user_id:
    unread_messages = get_unread_messages(user_id)

  # Build context-aware prompt
  prompt_parts = [
    f"IMPORTANT: The user's name is {name}. Always greet them by name and be personal!",
  ]

  # 📬 UNREAD MESSAGES - Surface naturally in greeting
  if unread_messages:
    msg_count = len(unread_messages)
    first_msg = unread_messages[0]
    sender = first_msg.get("sender_name", "Someone")
    company = first_msg.get("sender_company", "")
    sender_title = first_msg.get("sender_title", "")
    preview = first_msg.get("content", "")[:100]

    sender_intro = f"{sender}"
    if company:
      sender_intro += f" from {company}"
    if sender_title:
      sender_intro += f" ({sender_title})"

    prompt_parts.append(f"""

## 📬 UNREAD MESSAGES - MENTION THIS FIRST!
{name} has {msg_count} unread message{'s' if msg_count > 1 else ''} from recruiters/coaches.

**Latest message from {sender_intro}:**
"{preview}..."

**CRITICAL: In your FIRST response, naturally mention:**
"Hey {name}! Quick heads up - {sender} {'from ' + company if company else ''} just messaged you about an opportunity. Want me to read it out?"

Or if continuing conversation:
"By the way, you've got a new message from {sender}. Shall I tell you what they said?"

This is a REAL message from a REAL recruiter - make it feel special!
User can say "yes read it", "tell me more", or "later" to handle it.
""")

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

  # Add page context (for SEO job pages OR services pages)
  # First check state.page_context, then fall back to cached page context from instructions
  effective_pc = get_effective_page_context(state.page_context)

  if effective_pc:
    # Check if it's a dict (from cached) or PageContext object (from state)
    if isinstance(effective_pc, dict):
      # Cached page context from instructions
      page_type = effective_pc.get("page_type", "unknown")
      is_services = effective_pc.get("is_services_page", False)
      role_type = effective_pc.get("role_type")
      location = effective_pc.get("location_filter", "UK")

      if is_services and role_type:
        print(f"📍 Page context (cached): services page for {role_type}", file=sys.stderr)
        prompt_parts.append(f"""
## Current Page Context: SERVICES PAGE
User is on the "Hire a Fractional {role_type}" services page.

This is NOT a job listings page - it's our services/sales page explaining:
- What a Fractional {role_type} does
- Our pricing tiers (Starter £3k, Growth £6k, Scale £9k per month)
- How the engagement process works

When user asks about:
- Pricing → Explain our three tiers
- "How does it work" → Explain our 4-step process (Discovery, Proposal, Strategy, Partnership)
- Availability → We match them with a {role_type} from our network
- Whether it's right for them → Ask about their company stage, budget, goals

You're in CONSULTATIVE mode - help them understand if Fractional {role_type} is right for them.""")
      else:
        print(f"📍 Page context (cached): {page_type}", file=sys.stderr)
        prompt_parts.append(f"""
## Current Page Context:
User is on: {page_type}
Location filter: {location}

Tailor your responses to this context.""")
    else:
      # PageContext object from state (existing behavior for job pages)
      pc = effective_pc
      location = pc.location_filter or "UK"
      roles = ", ".join(pc.top_roles[:3]) if pc.top_roles else "various roles"
      print(f"📍 Page context (state): {pc.page_type}, {location}, {pc.total_jobs_on_page} jobs", file=sys.stderr)
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

  # Use effective user info (from state or cached from CopilotKit instructions)
  user_id = get_effective_user_id(user)
  name = get_effective_user_name(user)
  email = _cached_user_context.get("email") if not user else user.email

  if not user_id and not name:
    return {"logged_in": False, "message": "User is not logged in"}

  return {
    "logged_in": True,
    "user_id": user_id,
    "name": name or "Unknown",
    "email": email,
    "liked_jobs": user.liked_jobs if user else [],
  }

@agent.tool
def get_page_info(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Get information about the current page the user is viewing.
  Call this when user asks 'what page', 'where am I', 'current page', etc."""
  state = ctx.deps.state

  # Use effective page context (state or cached from instructions)
  effective_pc = get_effective_page_context(state.page_context)

  if not effective_pc:
    return {"page": "main", "location": None, "jobs_count": 0}

  # Handle dict (cached) vs PageContext object (state)
  if isinstance(effective_pc, dict):
    page_type = effective_pc.get("page_type", "unknown")
    is_services = effective_pc.get("is_services_page", False)
    role_type = effective_pc.get("role_type")

    if is_services:
      return {
        "page": f"services_{role_type.lower() if role_type else 'unknown'}",
        "page_type": "services",
        "role": role_type,
        "is_services_page": True,
        "description": f"Hire a Fractional {role_type} services page"
      }
    else:
      return {
        "page": page_type,
        "location": effective_pc.get("location_filter"),
        "jobs_count": 0,
      }
  else:
    # PageContext object from state
    pc = effective_pc
    return {
      "page": pc.page_type,
      "location": pc.location_filter,
      "jobs_count": pc.total_jobs_on_page,
      "top_roles": pc.top_roles,
    }

@agent.tool
async def save_user_preference(ctx: RunContext[StateDeps[AppState]], preference_type: str, value: str) -> dict:
  """Save a user preference to their profile.

  SINGLE-VALUE FIELDS (replace existing):
  - location: Only ONE location allowed. New value REPLACES old.
  - role_preference: Only ONE target role. New value REPLACES old.

  ⚠️ FOR SKILLS: Use confirm_skill() instead! It validates and gets user confirmation.
  ⚠️ FOR COMPANIES: Use confirm_company() instead! It gets job title too.

  Examples:
  - "I'm in London" → save_user_preference("location", "London")
  - "I want CMO roles" → save_user_preference("role_preference", "CMO")
  - "I know Python" → confirm_skill("Python", user_id) ← NOT save_user_preference!

  Args:
    preference_type: One of 'location', 'role_preference' (NOT skill or company!)
    value: The value (e.g., 'London', 'CTO')

  Returns:
    Confirmation with old value if replacing
  """
  state = ctx.deps.state
  user = state.user

  if not user or not user.id:
    print(f"💾 Cannot save - no user logged in", file=sys.stderr)
    return {"saved": False, "message": "User not logged in"}

  # Map preference_type to item_type
  item_type_map = {
    "location": "location",
    "role": "role_preference",
    "role_preference": "role_preference",
    "skill": "skill",
    "experience": "skill",
  }
  item_type = item_type_map.get(preference_type, preference_type)

  # Single-value fields - only one allowed
  SINGLE_VALUE_TYPES = ["location", "role_preference"]

  # Valid options for validated fields
  VALID_ROLES = [
    "CEO", "CFO", "CMO", "CTO", "COO", "CHRO", "CIO", "CISO", "CPO", "CRO",
    "VP ENGINEERING", "VP SALES", "VP MARKETING", "VP OPERATIONS", "VP PRODUCT",
    "DIRECTOR", "MANAGING DIRECTOR", "GENERAL MANAGER",
    "BOARD MEMBER", "NON-EXECUTIVE DIRECTOR", "ADVISOR"
  ]

  VALID_LOCATIONS = [
    "London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool",
    "Edinburgh", "Bristol", "Sheffield", "Newcastle", "Nottingham", "Cardiff",
    "Belfast", "Leicester", "Southampton", "Brighton", "Oxford", "Cambridge",
    "Reading", "Milton Keynes", "Remote", "Hybrid"
  ]

  # Normalize value based on type to prevent case duplicates
  def normalize_value(val: str, typ: str) -> str:
    """Normalize values to consistent case."""
    if typ == "location":
      # Title case for locations: "manchester" → "Manchester"
      return val.strip().title()
    elif typ == "role_preference":
      # Uppercase for roles: "cto" → "CTO"
      return val.strip().upper()
    elif typ == "skill":
      # Title case for skills: "python" → "Python"
      return val.strip().title()
    else:
      return val.strip()

  normalized_value = normalize_value(value, item_type)

  # Smart validation for location and role values
  # Accept if it matches known values, or looks like a real location/role
  if item_type == "role_preference":
    # Check if it's a known executive role (or variation)
    role_upper = normalized_value.upper()
    matched_role = None

    # Direct match
    if role_upper in VALID_ROLES:
      matched_role = role_upper
    else:
      # Fuzzy match - check for partial matches
      for valid_role in VALID_ROLES:
        if role_upper in valid_role or valid_role in role_upper:
          matched_role = valid_role
          break
        # Handle common variations
        if role_upper.replace(" ", "") == valid_role.replace(" ", ""):
          matched_role = valid_role
          break

    if matched_role:
      normalized_value = matched_role
    else:
      # Reject obviously invalid values (less than 2 chars, no letters, etc.)
      if len(normalized_value) < 2 or not any(c.isalpha() for c in normalized_value):
        print(f"💾 Invalid role: {value}", file=sys.stderr)
        return {"saved": False, "error": f"'{value}' doesn't look like a valid job title. Try: CEO, CFO, CMO, CTO, etc."}
      # Accept other reasonable-looking roles
      print(f"💾 Accepting custom role: {normalized_value}", file=sys.stderr)

  if item_type == "location":
    # Check if it's a known location
    matched_location = None
    value_lower = normalized_value.lower()

    for valid_loc in VALID_LOCATIONS:
      if value_lower == valid_loc.lower():
        matched_location = valid_loc
        break
      # Partial match for city names
      if value_lower in valid_loc.lower() or valid_loc.lower() in value_lower:
        matched_location = valid_loc
        break

    if matched_location:
      normalized_value = matched_location
    else:
      # Reject obviously invalid values
      if len(normalized_value) < 2 or not any(c.isalpha() for c in normalized_value):
        print(f"💾 Invalid location: {value}", file=sys.stderr)
        return {"saved": False, "error": f"'{value}' doesn't look like a valid location."}
      # Accept other reasonable-looking locations (could be a city we don't know)
      normalized_value = normalized_value.title()  # Ensure proper case
      print(f"💾 Accepting custom location: {normalized_value}", file=sys.stderr)

  try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    old_value = None

    # For single-value fields, check if one exists and replace it
    if item_type in SINGLE_VALUE_TYPES:
      # Get existing value (case-insensitive search)
      cur.execute("""
        SELECT id, value FROM user_profile_items
        WHERE user_id = %s AND item_type = %s
        LIMIT 1
      """, (user.id, item_type))
      existing = cur.fetchone()

      if existing:
        old_value = existing[1]
        if old_value.lower() == normalized_value.lower():
          # Same value, no change needed
          cur.close()
          conn.close()
          return {"saved": False, "message": f"Already set to {normalized_value}", "no_change": True}

        # Delete old value (replace)
        cur.execute("""
          DELETE FROM user_profile_items
          WHERE user_id = %s AND item_type = %s
        """, (user.id, item_type))
        print(f"💾 Replacing {item_type}: {old_value} → {normalized_value}", file=sys.stderr)

    # Insert new value (using normalized value)
    cur.execute("""
      INSERT INTO user_profile_items (user_id, item_type, value, metadata, confirmed)
      VALUES (%s, %s, %s, %s, %s)
      ON CONFLICT (user_id, item_type, value) DO UPDATE SET updated_at = NOW()
      RETURNING id
    """, (user.id, item_type, normalized_value, '{"source": "voice_detected"}', False))

    conn.commit()
    result = cur.fetchone()
    cur.close()
    conn.close()

    print(f"💾 Saved to Neon: {item_type}={normalized_value} (id={result[0] if result else 'updated'})", file=sys.stderr)

    # Auto-update ambient scene when location or role changes
    if item_type == "location":
      location_queries = {
        "london": "london skyline cityscape",
        "manchester": "manchester city urban",
        "birmingham": "birmingham england city",
        "remote": "home office modern workspace",
        "hybrid": "modern coworking space",
      }
      query = location_queries.get(normalized_value.lower(), f"{normalized_value} city skyline")
      state.scene = AmbientScene(location=normalized_value, query=query)
      print(f"🎨 Auto-updated scene for location: {normalized_value}", file=sys.stderr)
    elif item_type == "role_preference":
      role_queries = {
        "CTO": "technology startup office modern",
        "CFO": "finance corporate office",
        "CMO": "creative marketing agency",
        "COO": "modern business operations",
        "CEO": "executive boardroom luxury",
      }
      query = role_queries.get(normalized_value, f"{normalized_value} professional executive")
      state.scene = AmbientScene(role=normalized_value, query=query)
      print(f"🎨 Auto-updated scene for role: {normalized_value}", file=sys.stderr)

    # Store to Zep
    fact_messages = {
      "location": f"User is based in {normalized_value}",
      "role_preference": f"User is interested in {normalized_value} roles",
      "skill": f"User has experience with {normalized_value}",
    }
    message = fact_messages.get(item_type, f"User preference: {normalized_value}")
    await store_conversation_message(
      session_id=f"profile_{user.id}",
      user_id=user.id,
      role="user",
      content=message
    )

    response = {"saved": True, "type": item_type, "value": normalized_value, "graph_updated": True}
    if old_value:
      response["replaced"] = old_value
      response["message"] = f"Changed {item_type} from {old_value} to {normalized_value}"

    print(f"💾 Saved preference: {item_type}={normalized_value} for user {user.id}", file=sys.stderr)
    return response

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
      SELECT title, company, location, salary_min, salary_max, description, role_type
      FROM test_jobs
      WHERE (title ILIKE %s OR role_type ILIKE %s) AND location ILIKE %s
      ORDER BY id DESC
      LIMIT %s
    """, (f"%{found_role}%", f"%{found_role}%", f"%{found_location}%", limit))
  elif found_role:
    # Search by role only
    print(f"🔍 Filtering by role={found_role}", file=sys.stderr)
    cur.execute("""
      SELECT title, company, location, salary_min, salary_max, description, role_type
      FROM test_jobs
      WHERE title ILIKE %s OR role_type ILIKE %s
      ORDER BY id DESC
      LIMIT %s
    """, (f"%{found_role}%", f"%{found_role}%", limit))
  elif found_location:
    # Search by location only
    print(f"🔍 Filtering by location={found_location}", file=sys.stderr)
    cur.execute("""
      SELECT title, company, location, salary_min, salary_max, description, role_type
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
      SELECT title, company, location, salary_min, salary_max, description, role_type
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
      "url": job_url,
      "role_type": r[6] if len(r) > 6 else None  # Include role type badge
    })

  return {
    "jobs": job_cards,
    "total": len(job_cards),
    "query": query,
    "title": f"Found {len(job_cards)} {query} positions"
  }

@agent.tool
async def assess_job_match(ctx: RunContext[StateDeps[AppState]], job_title: Optional[str] = None) -> dict:
  """Assess how well the user matches a specific job.

  Call this when user wants to:
  - Like/save a job (❤️)
  - Apply to a job
  - Know if they're a good fit
  - "Am I qualified for this?"
  - "Should I apply?"

  Returns a match assessment with:
  - Match percentage (0-100)
  - Matching skills
  - Missing skills/requirements
  - Recommendation (apply/upskill/skip)
  - Recruiter details if 90%+ match on active recruitment job
  """
  print(f"📊 Assessing job match for: {job_title or 'last discussed job'}", file=sys.stderr)

  state = ctx.deps.state
  user = state.user
  user_id = get_effective_user_id(user)

  # Get job details including recruiter info
  job = None
  recruiter = None
  job_required_skills = []

  if job_title:
    # Search for specific job with recruiter info
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("""
      SELECT j.title, j.company, j.location, j.salary_min, j.salary_max,
             j.description, j.role_type, j.required_skills, j.is_active_recruitment,
             j.recruiter_id, u.display_name, u.company as recruiter_company,
             u.title as recruiter_title, u.email, u.phone, u.calendly_url
      FROM test_jobs j
      LEFT JOIN user_types u ON j.recruiter_id = u.user_id
      WHERE LOWER(j.title) LIKE %s
      LIMIT 1
    """, (f"%{job_title.lower()}%",))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
      job = {
        "title": row[0], "company": row[1], "location": row[2],
        "salary_min": row[3], "salary_max": row[4],
        "description": row[5], "role_type": row[6],
        "is_active_recruitment": row[8]
      }
      # Parse required_skills JSON
      if row[7]:
        try:
          import json
          job_required_skills = json.loads(row[7]) if isinstance(row[7], str) else row[7]
        except:
          job_required_skills = []
      # Get recruiter info if active recruitment
      if row[8] and row[9]:  # is_active_recruitment and recruiter_id
        recruiter = {
          "name": row[10],
          "company": row[11],
          "title": row[12],
          "email": row[13],
          "phone": row[14],
          "calendly_url": row[15]
        }
        print(f"📊 Active recruitment job - recruiter: {recruiter['name']}", file=sys.stderr)
  elif state.last_discussed_job_details:
    job = state.last_discussed_job_details

  if not job:
    return {"error": "No job to assess. Search for jobs first or specify a job title."}

  # Get user's profile from Neon
  user_skills = []
  user_location = None
  user_companies = []

  if user_id:
    try:
      conn = psycopg2.connect(DATABASE_URL)
      cur = conn.cursor()
      cur.execute("""
        SELECT item_type, value FROM user_profile_items WHERE user_id = %s
      """, (user_id,))
      for row in cur.fetchall():
        if row[0] == 'skill':
          user_skills.append(row[1].lower())
        elif row[0] == 'location':
          user_location = row[1].lower()
        elif row[0] == 'company':
          user_companies.append(row[1].lower())
      cur.close()
      conn.close()
    except Exception as e:
      print(f"Error fetching profile: {e}", file=sys.stderr)

  # Use job's required_skills if available, otherwise extract from description
  job_desc = (job.get("description") or "").lower()
  job_location = (job.get("location") or "").lower()

  if job_required_skills:
    required_skills = [s.lower() for s in job_required_skills]
  else:
    # Fallback: extract from description
    skill_keywords = [
      "python", "javascript", "react", "aws", "azure", "sql", "leadership",
      "strategy", "m&a", "fundraising", "p&l", "marketing", "sales", "finance",
      "operations", "digital transformation", "agile", "product", "design",
      "ai", "machine learning", "data", "analytics", "growth", "b2b", "saas",
      "fintech", "architecture", "scaling", "ecommerce", "digital"
    ]
    required_skills = [s for s in skill_keywords if s in job_desc]

  matching_skills = [s for s in required_skills if s in user_skills]
  missing_skills = [s for s in required_skills if s not in user_skills]

  # Calculate match percentage
  skill_match = len(matching_skills) / max(len(required_skills), 1) * 60  # Skills = 60%
  location_match = 20 if (user_location and user_location in job_location) or "remote" in job_location else 0
  experience_match = 20 if user_companies else 10  # Having company experience = 20%

  total_match = min(100, int(skill_match + location_match + experience_match))

  # Determine recommendation
  if total_match >= 90:
    recommendation = "hot_match"
    icon = "🔥"
    message = "Hot match! You're an excellent fit for this role."
  elif total_match >= 80:
    recommendation = "strong_match"
    icon = "🚀"
    message = "Excellent fit! You match most requirements."
  elif total_match >= 60:
    recommendation = "good_match"
    icon = "⚡"
    message = "Good potential! Consider highlighting your relevant experience."
  elif total_match >= 40:
    recommendation = "partial_match"
    icon = "⚠️"
    message = "Some gaps. You might want to upskill first."
  else:
    recommendation = "low_match"
    icon = "❌"
    message = "Significant gaps. Consider building more relevant experience."

  result = {
    "job": {
      "title": job["title"],
      "company": job.get("company", "Unknown"),
      "location": job.get("location", "Remote"),
      "role_type": job.get("role_type"),
      "is_active_recruitment": job.get("is_active_recruitment", False)
    },
    "assessment": {
      "match_percentage": total_match,
      "icon": icon,
      "recommendation": recommendation,
      "message": message
    },
    "skills": {
      "matching": [s.title() for s in matching_skills],
      "missing": [s.title() for s in missing_skills],
      "user_has": [s.title() for s in user_skills]
    },
    "location_match": location_match > 0,
    "user_id": user_id
  }

  # Add recruiter info for 90%+ match on active recruitment jobs
  if total_match >= 90 and recruiter and job.get("is_active_recruitment"):
    result["recruiter"] = recruiter
    result["assessment"]["message"] = f"🔥 Hot match! {recruiter['name']} from {recruiter['company']} is actively recruiting for this role."
    print(f"📊 90%+ match on recruiter job - showing recruiter: {recruiter['name']}", file=sys.stderr)

  return result

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

  # Use effective user ID (from state or cached instructions)
  user_id = get_effective_user_id(user)
  user_name = get_effective_user_name(user) or "You"

  if not user_id:
    return {
      "nodes": [{"id": "guest", "type": "user", "label": "Guest"}],
      "edges": [],
      "title": "Sign in to see your personalized graph"
    }

  nodes = [{"id": "user", "type": "user", "label": user_name}]
  edges = []

  # Map item_type to node_type for graph
  TYPE_MAPPING = {
    "location": "location",
    "role_preference": "role",
    "company": "interest",  # Use interest for companies
    "skill": "skill",
  }

  # PRIMARY: Fetch profile from Neon database (same source as profile panel)
  try:
    if DATABASE_URL:
      conn = psycopg2.connect(DATABASE_URL)
      cur = conn.cursor()
      cur.execute("""
        SELECT item_type, value, metadata
        FROM user_profile_items
        WHERE user_id = %s
        ORDER BY created_at DESC
      """, (user_id,))
      items = cur.fetchall()
      cur.close()
      conn.close()

      print(f"🌌 Found {len(items)} profile items in Neon")

      for item_type, value, metadata in items:
        node_type = TYPE_MAPPING.get(item_type, "fact")

        # Skip if already exists (dedupe)
        if any(n.get("label", "").lower() == value.lower() for n in nodes):
          continue

        node_id = f"neon_{len(nodes)}"
        nodes.append({
          "id": node_id,
          "type": node_type,
          "label": value,
          "data": metadata if metadata else {}
        })

        # Create edge label based on type
        edge_labels = {
          "location": "Located In",
          "role_preference": "Interested In",
          "company": "Worked At",
          "skill": "Has Skill",
        }
        edges.append({
          "source": "user",
          "target": node_id,
          "type": item_type.upper(),
          "label": edge_labels.get(item_type, "Related")
        })
  except Exception as e:
    print(f"🌌 Error fetching Neon profile: {e}", file=sys.stderr)

  # Add some default nodes if graph is empty (besides user)
  if len(nodes) == 1:
    # Add placeholder nodes to show structure
    default_interests = [
      ("Your Location", "location"),
      ("Your Target Role", "role"),
      ("Your Skills", "skill"),
    ]
    for i, (label, node_type) in enumerate(default_interests):
      node_id = f"default_{i}"
      nodes.append({"id": node_id, "type": node_type, "label": label})
      edges.append({"source": "user", "target": node_id, "type": "EXAMPLE", "label": "Add via chat"})

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
# Messaging Tools
# =====
@agent.tool
def get_my_messages(ctx: RunContext[StateDeps[AppState]]) -> dict:
  """Get the user's unread messages from recruiters and coaches.
  Call this when user asks 'what messages', 'my inbox', 'any messages', 'read messages', etc.

  Returns list of unread messages with sender info.
  """
  state = ctx.deps.state
  user = state.user

  # Use effective user ID (from state or cached from CopilotKit instructions)
  user_id = get_effective_user_id(user)

  if not user_id:
    return {"messages": [], "error": "User not logged in"}

  messages = get_unread_messages(user_id)

  return {
    "unread_count": len(messages),
    "messages": messages,
    "summary": f"You have {len(messages)} unread message{'s' if len(messages) != 1 else ''}" if messages else "No unread messages"
  }


@agent.tool
def read_full_message(ctx: RunContext[StateDeps[AppState]], message_id: int) -> dict:
  """Read the full content of a specific message and mark it as read.
  Call this when user wants to hear/see a complete message.

  Args:
    message_id: The ID of the message to read

  Returns:
    Full message content and sender details
  """
  state = ctx.deps.state
  user = state.user

  # Use effective user ID (from state or cached from CopilotKit instructions)
  user_id = get_effective_user_id(user)

  if not user_id:
    return {"error": "User not logged in"}

  if not DATABASE_URL:
    return {"error": "Database not configured"}

  try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Get full message
    cur.execute("""
      SELECT
        m.id, m.from_user_id, m.content, m.created_at,
        ut.display_name, ut.company, ut.title, ut.type
      FROM messages m
      LEFT JOIN user_types ut ON m.from_user_id = ut.user_id
      WHERE m.id = %s AND m.to_user_id = %s
    """, (message_id, user_id))

    row = cur.fetchone()
    if not row:
      conn.close()
      return {"error": "Message not found"}

    # Mark as read
    cur.execute("""
      UPDATE messages SET read_at = NOW() WHERE id = %s
    """, (message_id,))
    conn.commit()
    conn.close()

    print(f"📬 Read message {message_id} for user {user_id}", file=sys.stderr)

    return {
      "message_id": row[0],
      "from_user_id": row[1],
      "content": row[2],
      "sent_at": str(row[3]) if row[3] else None,
      "sender_name": row[4] or "Unknown",
      "sender_company": row[5],
      "sender_title": row[6],
      "sender_type": row[7] or "recruiter",
      "marked_read": True
    }

  except Exception as e:
    print(f"[Messages] Error reading message: {e}", file=sys.stderr)
    return {"error": str(e)}


@agent.tool
def reply_to_message(ctx: RunContext[StateDeps[AppState]], to_user_id: str, content: str) -> dict:
  """Send a reply message to a recruiter or coach.
  Call this when user wants to respond to a message.

  Args:
    to_user_id: The user ID of the person to reply to
    content: The message content to send

  Returns:
    Confirmation of message sent
  """
  state = ctx.deps.state
  user = state.user

  # Use effective user ID (from state or cached from CopilotKit instructions)
  user_id = get_effective_user_id(user)

  if not user_id:
    return {"sent": False, "error": "User not logged in"}

  if not DATABASE_URL:
    return {"sent": False, "error": "Database not configured"}

  if not content or len(content.strip()) < 2:
    return {"sent": False, "error": "Message too short"}

  try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    # Insert reply
    cur.execute("""
      INSERT INTO messages (from_user_id, to_user_id, content)
      VALUES (%s, %s, %s)
      RETURNING id
    """, (user_id, to_user_id, content.strip()))

    new_id = cur.fetchone()[0]
    conn.commit()
    conn.close()

    print(f"📬 Sent reply {new_id} from {user_id} to {to_user_id}", file=sys.stderr)

    return {
      "sent": True,
      "message_id": new_id,
      "to_user_id": to_user_id,
      "preview": content[:50] + "..." if len(content) > 50 else content
    }

  except Exception as e:
    print(f"[Messages] Error sending reply: {e}", file=sys.stderr)
    return {"sent": False, "error": str(e)}


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


# Middleware to extract user AND page context from CopilotKit instructions
@main_app.middleware("http")
async def extract_context_middleware(request: Request, call_next):
    """Extract user and page context from CopilotKit instructions before processing."""
    # Only process POST requests that might contain messages
    if request.method == "POST":
        try:
            # Read and restore body
            body_bytes = await request.body()
            if body_bytes:
                body = json.loads(body_bytes)
                messages = body.get("messages", [])

                # Look for system messages with user/page context
                for msg in messages:
                    role = msg.get("role", "")
                    content = msg.get("content", "")

                    if role == "system":
                        # Extract user context
                        if "User ID:" in content:
                            extracted = extract_user_from_instructions(content)
                            if extracted.get("user_id"):
                                print(f"🔐 Middleware extracted user: {extracted.get('name')} ({extracted.get('user_id')[:8]}...)", file=sys.stderr)

                        # Extract page context (services pages, job pages, etc.)
                        if "Service Page Context:" in content or "Current Page:" in content or "jobs" in content.lower():
                            page_ctx = extract_page_context_from_instructions(content)
                            if page_ctx.get("page_type"):
                                print(f"📍 Middleware extracted page: {page_ctx.get('page_type')}", file=sys.stderr)

                # Reconstruct request with body
                async def receive():
                    return {"type": "http.request", "body": body_bytes}

                request = Request(request.scope, receive)
        except Exception as e:
            print(f"[Middleware] Error extracting context: {e}", file=sys.stderr)

    return await call_next(request)


def parse_session_id(session_id: str | None) -> dict:
    """
    Parse custom session ID format:
    - Jobs page: "firstName|fractional_userId|location:London,jobs:25"
    - Services page: "firstName|fractional_userId|services:CMO"
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
                    page_context["page_type"] = "jobs"
                elif key == "jobs":
                    page_context["total_jobs"] = int(val)
                elif key == "services":
                    page_context["page_type"] = "services"
                    page_context["role_type"] = val.upper()
                    page_context["is_services_page"] = True

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

    # DEBUG: Log all possible session ID sources
    print(f"[CLM] === SESSION ID DEBUG ===", file=sys.stderr)
    print(f"[CLM] body.custom_session_id: {body.get('custom_session_id')}", file=sys.stderr)
    print(f"[CLM] body.session_id: {body.get('session_id')}", file=sys.stderr)
    print(f"[CLM] metadata: {body.get('metadata', {})}", file=sys.stderr)
    print(f"[CLM] x-hume-session-id header: {request.headers.get('x-hume-session-id')}", file=sys.stderr)
    print(f"[CLM] x-session-id header: {request.headers.get('x-session-id')}", file=sys.stderr)

    # Extract session info
    session_id = extract_session_id(request, body)
    print(f"[CLM] Final extracted session_id: {session_id}", file=sys.stderr)

    parsed = parse_session_id(session_id)
    first_name = parsed["first_name"]
    user_id = parsed["user_id"]
    page_context = parsed["page_context"]

    print(f"[CLM] Parsed: name={first_name}, id={user_id}, page={page_context}", file=sys.stderr)

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
        if page_context and page_context.get("is_services_page"):
            # Services page response
            role = page_context.get("role_type", "executive")
            response_text = f"We're on the Hire a Fractional {role} services page. I can explain our pricing, how it works, and help you decide if fractional {role} leadership is right for your company."
        elif page_context and page_context.get("location"):
            # Jobs page response
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

    # Build page context - handle both jobs and services pages
    page_ctx = None
    if page_context:
        if page_context.get("is_services_page"):
            # Services page: cache the context for system prompt
            global _cached_page_context
            _cached_page_context = {
                "page_type": f"services_{page_context.get('role_type', 'unknown').lower()}",
                "role_type": page_context.get("role_type"),
                "is_services_page": True
            }
            print(f"📍 [CLM] Services page for {page_context.get('role_type')}", file=sys.stderr)
            # PageContext object doesn't have is_services_page, so we rely on cached context
            page_ctx = PageContext(
                page_type=f"services_{page_context.get('role_type', 'unknown').lower()}",
                location_filter=None,
                total_jobs_on_page=0,
            )
        else:
            # Jobs page
            page_ctx = PageContext(
                page_type=f"jobs_{page_context['location'].lower()}" if page_context.get('location') else "main",
                location_filter=page_context.get("location"),
                total_jobs_on_page=page_context.get("total_jobs", 0),
            )

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
