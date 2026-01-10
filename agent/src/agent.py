"""
DIONYSUS - AI Wine Sommelier Agent for Aionysus
Built with Pydantic AI + AG-UI protocol
"""
from textwrap import dedent
from typing import Optional
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.ag_ui import StateDeps
import psycopg2
import httpx
import os
import sys
import re
import json

from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
ZEP_API_KEY = os.getenv("ZEP_API_KEY", "")

# =====
# Wine Phonetic Corrections (for voice input)
# =====
PHONETIC_CORRECTIONS = {
    "bow jo lay": "beaujolais",
    "bo jo lay": "beaujolais",
    "shard oh nay": "chardonnay",
    "shar doe nay": "chardonnay",
    "pin oh noir": "pinot noir",
    "pee no nwar": "pinot noir",
    "pin oh gree": "pinot grigio",
    "bor doh": "bordeaux",
    "bore dough": "bordeaux",
    "burr gun dee": "burgundy",
    "burgan dee": "burgundy",
    "cab er nay": "cabernet",
    "cabernet so vin yon": "cabernet sauvignon",
    "mare low": "merlot",
    "mer lot": "merlot",
    "ree oz ling": "riesling",
    "reece ling": "riesling",
    "so vin yon": "sauvignon",
    "so vin yon blonk": "sauvignon blanc",
    "san sair": "sancerre",
    "shah blee": "chablis",
    "sha blee": "chablis",
    "mo zell": "moselle",
    "rum on ay con tee": "romanée-conti",
    "pet roos": "petrus",
    "shah toe": "chateau",
    "sha toe": "chateau",
    "doe main": "domaine",
    "tan nan": "tannat",
    "mall beck": "malbec",
    "groo nair": "grüner",
    "tem pran ee oh": "tempranillo",
    "neb ee oh low": "nebbiolo",
    "bar oh low": "barolo",
    "bar bar es co": "barbaresco",
    "kee an tee": "chianti",
    "bru nell oh": "brunello",
    "pro sec oh": "prosecco",
    "sham pain": "champagne",
    "ross ay": "rosé",
}

def apply_phonetic_corrections(text: str) -> str:
    """Apply wine phonetic corrections to text."""
    result = text.lower()
    for phonetic, correct in PHONETIC_CORRECTIONS.items():
        result = result.replace(phonetic, correct)
    return result


# =====
# User Context Cache (for CopilotKit instructions parsing)
# =====
_cached_user_context: dict = {}

def extract_user_from_instructions(instructions: str) -> dict:
    """Extract user info from CopilotKit instructions text."""
    result = {"user_id": None, "name": None, "email": None}
    if not instructions:
        return result

    id_match = re.search(r'User ID:\s*([a-f0-9-]+)', instructions, re.IGNORECASE)
    if id_match:
        result["user_id"] = id_match.group(1)

    name_match = re.search(r'User Name:\s*([^\n]+)', instructions, re.IGNORECASE)
    if name_match:
        result["name"] = name_match.group(1).strip()

    email_match = re.search(r'User Email:\s*([^\n]+)', instructions, re.IGNORECASE)
    if email_match:
        result["email"] = email_match.group(1).strip()

    if result["user_id"]:
        global _cached_user_context
        _cached_user_context = result
        print(f"🍷 Cached user: {result['name']} ({result['user_id'][:8]}...)", file=sys.stderr)

    return result

def get_effective_user_id(state_user) -> Optional[str]:
    if state_user and state_user.id:
        return state_user.id
    return _cached_user_context.get("user_id")

def get_effective_user_name(state_user) -> Optional[str]:
    if state_user and (getattr(state_user, 'firstName', None) or getattr(state_user, 'name', None)):
        return getattr(state_user, 'firstName', None) or state_user.name
    return _cached_user_context.get("name")


# =====
# Zep Memory Integration
# =====
_zep_client: Optional[httpx.AsyncClient] = None

def get_zep_client() -> Optional[httpx.AsyncClient]:
    global _zep_client
    if _zep_client is None and ZEP_API_KEY:
        _zep_client = httpx.AsyncClient(
            base_url="https://api.getzep.com",
            headers={
                "Authorization": f"Api-Key {ZEP_API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=5.0,
        )
    return _zep_client

async def get_user_wine_preferences(user_id: Optional[str]) -> tuple[str, list[str]]:
    """Fetch user's wine preferences from Zep."""
    if not user_id or not ZEP_API_KEY:
        return ("", [])

    try:
        client = get_zep_client()
        if not client:
            return ("", [])

        response = await client.post(
            "/api/v2/graph/search",
            json={
                "user_id": user_id,
                "query": "wine preferences regions varietals taste red white sparkling",
                "limit": 10,
                "scope": "edges",
            },
        )

        if response.status_code != 200:
            return ("", [])

        data = response.json()
        edges = data.get("edges", [])

        if not edges:
            return ("", [])

        facts = [edge.get('fact', '') for edge in edges[:5] if edge.get("fact")]
        if facts:
            context = "\n\n## Wine preferences I remember:\n" + "\n".join(f"- {f}" for f in facts)
            return (context, facts)

        return ("", [])
    except Exception as e:
        print(f"[Zep] Error: {e}", file=sys.stderr)
        return ("", [])


# =====
# State Model
# =====
class UserProfile(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    firstName: Optional[str] = None
    email: Optional[str] = None
    saved_wines: list[int] = Field(default_factory=list)

class AmbientScene(BaseModel):
    region: Optional[str] = None
    wine_type: Optional[str] = None
    mood: Optional[str] = None
    query: Optional[str] = None

class CartItem(BaseModel):
    wine_id: int
    quantity: int = 1

class Cart(BaseModel):
    items: list[CartItem] = Field(default_factory=list)
    shopify_cart_id: Optional[str] = None

class AppState(BaseModel):
    wines: list[dict] = Field(default_factory=list)
    search_query: str = ""
    user: Optional[UserProfile] = None
    scene: Optional[AmbientScene] = None
    cart: Optional[Cart] = None


# =====
# Groq Model Setup
# =====
from pydantic_ai.models.groq import GroqModel

model = GroqModel(
    model_name="llama-3.3-70b-versatile",
    # Uses GROQ_API_KEY env var automatically
)


# =====
# DIONYSUS Agent
# =====
def build_system_prompt(user_name: Optional[str] = None, zep_context: str = "") -> str:
    """Build system prompt with optional user context."""
    # User context MUST be at the top and explicit
    if user_name:
        user_section = f"""
## CRITICAL USER CONTEXT - READ THIS FIRST!
**The user's name is: {user_name}**

RULES YOU MUST FOLLOW:
1. When asked "What is my name?" → Answer: "Your name is {user_name}!"
2. ALWAYS greet them as {user_name} in your first response
3. NEVER say "I don't have access to your name" - YOU DO, it's {user_name}!
4. NEVER say "I don't have personal information" - the name is RIGHT HERE!
5. Address {user_name} by name naturally in conversation

{zep_context if zep_context else f"This is {user_name}'s first conversation with you."}
"""
    else:
        user_section = """
## USER CONTEXT
The user is not logged in or name was not provided. Ask them for their name if relevant.
"""

    return dedent(f"""
{user_section}

You are DIONYSUS, an expert AI wine sommelier for Aionysus.
You help users discover fine wines, understand investment potential, and find perfect food pairings.

## Your Expertise:
- 3,800+ wines from premier regions worldwide
- Investment-grade wines and market trends
- Food pairing recommendations
- Regional knowledge (Burgundy, Bordeaux, Champagne, Tuscany, Napa, etc.)

## Your Personality:
- Knowledgeable but approachable
- Use wine terminology naturally
- Be enthusiastic about great wines
- Help both beginners and connoisseurs

## Available Tools:

### Discovery & Search:
- search_wines: Find wines by region, type, price, grape
- get_wine_details: Get full details for a specific wine
- show_wine_regions: Display wine distribution by region
- show_wine_types: Show wine type distribution

### Investment Tools (USE THESE FOR HNW CLIENTS):
- get_investment_wines: Get top investment-grade wines with scores
- show_investment_chart: Display price trends with real historical data
- calculate_wine_roi: Calculate ROI including storage costs (bonded vs private)
- build_portfolio: Create diversified wine investment portfolio
- show_wine_market: Market overview dashboard

### Lifestyle:
- get_food_pairings: Suggest food pairings for wines
- add_to_cart: Add wine to shopping cart
- save_wine_preference: Remember user preferences

## Investment Expertise:
- Investment-grade wines have scores from 1-10
- 5-year return data available for all wines
- Storage types: 'bonded' (duty-free, lower cost) vs 'private_cellar'
- Liv-ex scores for premium wines (70-100 scale)
- When discussing investment, ALWAYS show charts and ROI calculations

## CRITICAL: Dynamic Backgrounds
When discussing a specific wine region, UPDATE THE SCENE to show that region!
- User asks about Burgundy → set scene.region = "burgundy"
- User asks about red wines → set scene.wine_type = "red"
- This triggers dynamic background changes in the UI

## Response Guidelines:
- Keep responses concise but informative
- Always use the appropriate tool when searching for wines
- When showing wines, limit to 6-8 at a time
- Include prices in GBP (£)
- Mention vintage when relevant
""").strip()


# Create agent with dynamic system prompt
agent = Agent(
    model=model,
    system_prompt=build_system_prompt(),  # Default prompt
)


# Dynamic system prompt that includes user context
@agent.system_prompt
async def get_dynamic_system_prompt(ctx: RunContext[StateDeps[AppState]]) -> str:
    """Generate system prompt with user context."""
    user_name = None
    zep_context = ""

    # Try to get user from state
    if ctx.deps.state and ctx.deps.state.user:
        user_name = ctx.deps.state.user.firstName or ctx.deps.state.user.name
        user_id = ctx.deps.state.user.id

        # Fetch Zep context
        if user_id and ZEP_API_KEY:
            try:
                zep_ctx, _ = await get_user_wine_preferences(user_id)
                if zep_ctx:
                    zep_context = zep_ctx
            except:
                pass

    # Fall back to cached context
    if not user_name and _cached_user_context.get("name"):
        user_name = _cached_user_context.get("name")

    if user_name:
        print(f"🍷 AG-UI request for: {user_name}", file=sys.stderr)

    return build_system_prompt(user_name, zep_context)


# =====
# Wine Tools
# =====
@agent.tool
async def search_wines(
    ctx: RunContext[StateDeps[AppState]],
    region: Optional[str] = None,
    wine_type: Optional[str] = None,
    grape_variety: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 10,
) -> dict:
    """Search for wines with filters.

    Args:
        region: Wine region (e.g., Burgundy, Bordeaux, Tuscany)
        wine_type: Type of wine (Red, White, Rosé, Sparkling, Dessert)
        grape_variety: Grape variety (e.g., Pinot Noir, Chardonnay)
        min_price: Minimum price in GBP
        max_price: Maximum price in GBP
        limit: Maximum results to return
    """
    if not DATABASE_URL:
        return {"wines": [], "error": "Database not configured", "title": "Search Error"}

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Build dynamic query
        conditions = ["is_active = true"]
        params = []

        if region:
            region = apply_phonetic_corrections(region)
            conditions.append("LOWER(region) LIKE %s OR LOWER(country) LIKE %s")
            params.extend([f"%{region.lower()}%", f"%{region.lower()}%"])

        if wine_type:
            conditions.append("LOWER(wine_type) LIKE %s")
            params.append(f"%{wine_type.lower()}%")

        if grape_variety:
            grape_variety = apply_phonetic_corrections(grape_variety)
            conditions.append("LOWER(grape_variety) LIKE %s")
            params.append(f"%{grape_variety.lower()}%")

        if min_price:
            conditions.append("price_retail >= %s")
            params.append(min_price)

        if max_price:
            conditions.append("price_retail <= %s")
            params.append(max_price)

        params.append(limit)

        query = f"""
            SELECT id, name, winery, region, country, grape_variety, vintage,
                   wine_type, style, color, price_retail, tasting_notes,
                   critic_scores, image_url, slug
            FROM wines
            WHERE {' AND '.join(conditions)}
            ORDER BY price_retail DESC
            LIMIT %s
        """

        cur.execute(query, params)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        wines = []
        for row in rows:
            wines.append({
                "id": row[0],
                "name": row[1],
                "winery": row[2],
                "region": row[3],
                "country": row[4],
                "grape_variety": row[5],
                "vintage": row[6],
                "wine_type": row[7],
                "style": row[8],
                "color": row[9],
                "price_retail": float(row[10]) if row[10] else None,
                "tasting_notes": row[11],
                "critic_scores": row[12],
                "image_url": row[13],
                "slug": row[14],
            })

        # Update state with results
        ctx.deps.state.wines = wines
        ctx.deps.state.search_query = f"{region or ''} {wine_type or ''} {grape_variety or ''}".strip()

        # Update scene for dynamic background
        if region:
            ctx.deps.state.scene = AmbientScene(region=region.lower())
        elif wine_type:
            ctx.deps.state.scene = AmbientScene(wine_type=wine_type.lower())

        title = f"Found {len(wines)} wines"
        if region:
            title = f"{region.title()} Wines"
        elif wine_type:
            title = f"{wine_type.title()} Wines"

        print(f"🍷 Search: {len(wines)} wines found", file=sys.stderr)
        return {"wines": wines, "title": title, "query": ctx.deps.state.search_query}

    except Exception as e:
        print(f"🍷 Search error: {e}", file=sys.stderr)
        return {"wines": [], "error": str(e), "title": "Search Error"}


@agent.tool
async def get_wine_details(
    ctx: RunContext[StateDeps[AppState]],
    wine_name: str,
) -> dict:
    """Get detailed information about a specific wine."""
    if not DATABASE_URL:
        return {"error": "Database not configured"}

    try:
        wine_name = apply_phonetic_corrections(wine_name)
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute("""
            SELECT id, name, winery, region, country, grape_variety, vintage,
                   wine_type, style, color, price_retail, price_trade,
                   tasting_notes, critic_scores, drinking_window, classification,
                   image_url, stock_quantity, slug
            FROM wines
            WHERE LOWER(name) LIKE %s AND is_active = true
            LIMIT 1
        """, [f"%{wine_name.lower()}%"])

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {"error": f"Wine '{wine_name}' not found"}

        wine = {
            "id": row[0],
            "name": row[1],
            "winery": row[2],
            "region": row[3],
            "country": row[4],
            "grape_variety": row[5],
            "vintage": row[6],
            "wine_type": row[7],
            "style": row[8],
            "color": row[9],
            "price_retail": float(row[10]) if row[10] else None,
            "price_trade": float(row[11]) if row[11] else None,
            "tasting_notes": row[12],
            "critic_scores": row[13],
            "drinking_window": row[14],
            "classification": row[15],
            "image_url": row[16],
            "stock_quantity": row[17],
            "slug": row[18],
        }

        # Update scene for dynamic background
        if wine.get("region"):
            ctx.deps.state.scene = AmbientScene(region=wine["region"].lower())

        return {"wine": wine}

    except Exception as e:
        return {"error": str(e)}


@agent.tool
async def show_wine_regions(
    ctx: RunContext[StateDeps[AppState]],
    limit: int = 10,
) -> dict:
    """Show wine distribution by region for visualization."""
    if not DATABASE_URL:
        return {"chartData": [], "title": "Regions"}

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute("""
            SELECT region, COUNT(*) as count
            FROM wines
            WHERE is_active = true AND region IS NOT NULL
            GROUP BY region
            ORDER BY count DESC
            LIMIT %s
        """, [limit])

        rows = cur.fetchall()
        cur.close()
        conn.close()

        chart_data = [{"name": row[0], "wines": row[1]} for row in rows]

        return {
            "chartData": chart_data,
            "title": "Wines by Region",
            "subtitle": f"Top {limit} wine regions"
        }

    except Exception as e:
        return {"chartData": [], "error": str(e)}


@agent.tool
async def show_wine_types(
    ctx: RunContext[StateDeps[AppState]],
) -> dict:
    """Show wine distribution by type (Red, White, etc.)."""
    if not DATABASE_URL:
        return {"chartData": [], "title": "Wine Types"}

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute("""
            SELECT wine_type, COUNT(*) as count
            FROM wines
            WHERE is_active = true AND wine_type IS NOT NULL
            GROUP BY wine_type
            ORDER BY count DESC
        """)

        rows = cur.fetchall()
        cur.close()
        conn.close()

        chart_data = [{"name": row[0], "count": row[1]} for row in rows]

        return {
            "chartData": chart_data,
            "title": "Wine Types",
            "subtitle": "Distribution by type"
        }

    except Exception as e:
        return {"chartData": [], "error": str(e)}


@agent.tool
async def get_investment_wines(
    ctx: RunContext[StateDeps[AppState]],
    limit: int = 10,
    min_score: float = 7.0,
    region: Optional[str] = None,
) -> dict:
    """Get top investment-grade wines sorted by investment score.

    Args:
        limit: Number of wines to return (default 10)
        min_score: Minimum investment score (1-10, default 7.0)
        region: Optional region filter
    """
    if not DATABASE_URL:
        return {"wines": [], "error": "Database not configured"}

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        query = """
            SELECT id, name, region, vintage, price_retail, investment_score,
                   five_year_return, storage_type, liv_ex_score
            FROM wines
            WHERE is_investment_grade = true
              AND investment_score >= %s
        """
        params = [min_score]

        if region:
            query += " AND LOWER(region) LIKE %s"
            params.append(f"%{region.lower()}%")
            ctx.deps.state.scene = AmbientScene(region=region.lower())

        query += " ORDER BY investment_score DESC LIMIT %s"
        params.append(limit)

        cur.execute(query, params)
        rows = cur.fetchall()

        wines = []
        for row in rows:
            wines.append({
                "id": row[0],
                "name": row[1],
                "region": row[2],
                "vintage": row[3],
                "price": float(row[4]) if row[4] else None,
                "investmentScore": float(row[5]) if row[5] else None,
                "fiveYearReturn": float(row[6]) if row[6] else None,
                "storageType": row[7],
                "livExScore": row[8],
            })

        cur.close()
        conn.close()

        return {
            "wines": wines,
            "count": len(wines),
            "title": f"Top Investment Wines" + (f" from {region.title()}" if region else ""),
        }
    except Exception as e:
        print(f"[Investment] Error: {e}", file=sys.stderr)
        return {"wines": [], "error": str(e)}


@agent.tool
async def show_investment_chart(
    ctx: RunContext[StateDeps[AppState]],
    wine_id: Optional[int] = None,
    wine_name: Optional[str] = None,
    region: Optional[str] = None,
) -> dict:
    """Show price trend chart for a specific wine or region.

    Args:
        wine_id: Specific wine ID to show price history
        wine_name: Search for wine by name
        region: Show average trends for a region
    """
    if not DATABASE_URL:
        return {"chartData": [], "error": "Database not configured"}

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        if wine_id:
            cur.execute("""
                SELECT name, region, price_history, investment_score, five_year_return
                FROM wines WHERE id = %s
            """, [wine_id])
        elif wine_name:
            cur.execute("""
                SELECT name, region, price_history, investment_score, five_year_return
                FROM wines WHERE LOWER(name) LIKE %s
                LIMIT 1
            """, [f"%{wine_name.lower()}%"])
        elif region:
            # Get average for region
            cur.execute("""
                SELECT 'Region Average' as name, %s as region,
                       (SELECT price_history FROM wines
                        WHERE is_investment_grade = true
                        AND LOWER(region) LIKE %s
                        ORDER BY investment_score DESC LIMIT 1),
                       AVG(investment_score), AVG(five_year_return)
                FROM wines
                WHERE is_investment_grade = true AND LOWER(region) LIKE %s
            """, [region.title(), f"%{region.lower()}%", f"%{region.lower()}%"])
            ctx.deps.state.scene = AmbientScene(region=region.lower())
        else:
            # Get top investment wine
            cur.execute("""
                SELECT name, region, price_history, investment_score, five_year_return
                FROM wines WHERE is_investment_grade = true
                ORDER BY investment_score DESC LIMIT 1
            """)

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {"chartData": [], "error": "Wine not found"}

        name, wine_region, price_history, inv_score, five_yr = row

        # Parse price history JSON
        import json
        chart_data = json.loads(price_history) if price_history else []

        if wine_region:
            ctx.deps.state.scene = AmbientScene(region=wine_region.lower().split()[0])

        return {
            "chartData": chart_data,
            "title": f"{name} Price Trend",
            "subtitle": f"Investment Score: {inv_score}/10 | 5yr Return: {five_yr}%",
            "wineName": name,
            "region": wine_region,
            "investmentScore": float(inv_score) if inv_score else None,
            "fiveYearReturn": float(five_yr) if five_yr else None,
        }
    except Exception as e:
        print(f"[Investment Chart] Error: {e}", file=sys.stderr)
        return {"chartData": [], "error": str(e)}


@agent.tool
async def calculate_wine_roi(
    ctx: RunContext[StateDeps[AppState]],
    wine_id: Optional[int] = None,
    wine_name: Optional[str] = None,
    investment_amount: float = 1000,
    holding_years: int = 5,
    storage_type: str = "bonded",
) -> dict:
    """Calculate ROI for wine investment including storage costs.

    Args:
        wine_id: Specific wine ID
        wine_name: Search wine by name
        investment_amount: Amount to invest in GBP (default £1000)
        holding_years: Years to hold (default 5)
        storage_type: 'bonded' or 'private_cellar' (affects costs)
    """
    if not DATABASE_URL:
        return {"error": "Database not configured"}

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        if wine_id:
            cur.execute("""
                SELECT name, price_retail, investment_score, five_year_return, region
                FROM wines WHERE id = %s
            """, [wine_id])
        else:
            cur.execute("""
                SELECT name, price_retail, investment_score, five_year_return, region
                FROM wines WHERE LOWER(name) LIKE %s LIMIT 1
            """, [f"%{wine_name.lower()}%"])

        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {"error": "Wine not found"}

        name, price, inv_score, five_yr_return, region = row
        price = float(price) if price else 100
        annual_return = (float(five_yr_return) / 5) if five_yr_return else 8.0

        # Storage costs per case per year
        storage_costs = {
            "bonded": 15,  # £15/case/year in bonded warehouse (duty-free)
            "private_cellar": 8,  # £8/case/year self-storage
        }

        # Insurance (0.5% of value per year)
        insurance_rate = 0.005

        # Calculate bottles/cases
        bottles = int(investment_amount / price)
        cases = bottles / 12

        # Calculate returns
        projected_value = investment_amount * ((1 + annual_return / 100) ** holding_years)
        gross_return = projected_value - investment_amount

        # Calculate costs
        storage_cost = storage_costs.get(storage_type, 15) * cases * holding_years
        insurance_cost = investment_amount * insurance_rate * holding_years

        # Duty (if not bonded) - approximately 25% of value
        duty_cost = 0 if storage_type == "bonded" else investment_amount * 0.25

        total_costs = storage_cost + insurance_cost + duty_cost
        net_return = gross_return - total_costs
        roi_percentage = (net_return / investment_amount) * 100

        if region:
            ctx.deps.state.scene = AmbientScene(region=region.lower().split()[0])

        return {
            "wine": name,
            "investmentAmount": investment_amount,
            "bottles": bottles,
            "holdingYears": holding_years,
            "storageType": storage_type,
            "projectedValue": round(projected_value, 2),
            "grossReturn": round(gross_return, 2),
            "costs": {
                "storage": round(storage_cost, 2),
                "insurance": round(insurance_cost, 2),
                "duty": round(duty_cost, 2),
                "total": round(total_costs, 2),
            },
            "netReturn": round(net_return, 2),
            "roiPercentage": round(roi_percentage, 1),
            "annualizedReturn": round(annual_return, 1),
        }
    except Exception as e:
        print(f"[ROI Calculator] Error: {e}", file=sys.stderr)
        return {"error": str(e)}


@agent.tool
async def build_portfolio(
    ctx: RunContext[StateDeps[AppState]],
    budget: float = 10000,
    risk_level: str = "medium",
) -> dict:
    """Build a diversified wine investment portfolio.

    Args:
        budget: Total investment budget in GBP (default £10,000)
        risk_level: 'low', 'medium', or 'high' risk tolerance
    """
    if not DATABASE_URL:
        return {"error": "Database not configured"}

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Risk profiles
        profiles = {
            "low": {"min_score": 8.5, "regions": ["bordeaux", "burgundy"], "vintage_min": 2000},
            "medium": {"min_score": 7.0, "regions": ["bordeaux", "burgundy", "champagne", "tuscany"], "vintage_min": 1990},
            "high": {"min_score": 6.0, "regions": None, "vintage_min": 1980},
        }

        profile = profiles.get(risk_level, profiles["medium"])

        query = """
            SELECT id, name, region, vintage, price_retail, investment_score, five_year_return
            FROM wines
            WHERE is_investment_grade = true
              AND investment_score >= %s
              AND price_retail <= %s
              AND vintage >= %s
        """
        params = [profile["min_score"], budget * 0.4, profile["vintage_min"]]

        if profile["regions"]:
            region_conditions = " OR ".join(["LOWER(region) LIKE %s" for _ in profile["regions"]])
            query += f" AND ({region_conditions})"
            params.extend([f"%{r}%" for r in profile["regions"]])

        query += " ORDER BY investment_score DESC LIMIT 20"

        cur.execute(query, params)
        candidates = cur.fetchall()
        cur.close()
        conn.close()

        # Diversify selection
        portfolio = []
        regions_included = set()
        total_cost = 0

        for row in candidates:
            wine_id, name, region, vintage, price, score, five_yr = row
            price = float(price) if price else 0

            # Diversification: max 2 wines per region
            region_key = (region or "unknown").lower()
            if sum(1 for p in portfolio if p["region"].lower() == region_key) >= 2:
                continue

            if total_cost + price <= budget and len(portfolio) < 6:
                portfolio.append({
                    "id": wine_id,
                    "name": name,
                    "region": region,
                    "vintage": vintage,
                    "price": price,
                    "investmentScore": float(score) if score else None,
                    "fiveYearReturn": float(five_yr) if five_yr else None,
                    "allocation": 0,  # Will calculate below
                })
                total_cost += price
                regions_included.add(region_key)

        # Calculate allocations
        for wine in portfolio:
            wine["allocation"] = round((wine["price"] / total_cost) * 100, 1) if total_cost > 0 else 0

        # Calculate portfolio metrics
        avg_score = sum(w["investmentScore"] or 0 for w in portfolio) / len(portfolio) if portfolio else 0
        avg_return = sum(w["fiveYearReturn"] or 0 for w in portfolio) / len(portfolio) if portfolio else 0

        return {
            "portfolio": portfolio,
            "totalCost": round(total_cost, 2),
            "remainingBudget": round(budget - total_cost, 2),
            "diversification": {
                "wineCount": len(portfolio),
                "regionCount": len(regions_included),
                "regions": list(regions_included),
            },
            "metrics": {
                "avgInvestmentScore": round(avg_score, 1),
                "avgFiveYearReturn": round(avg_return, 1),
                "riskLevel": risk_level,
            },
            "title": f"Wine Portfolio (£{budget:,.0f} - {risk_level.title()} Risk)",
        }
    except Exception as e:
        print(f"[Portfolio Builder] Error: {e}", file=sys.stderr)
        return {"error": str(e)}


@agent.tool
async def get_food_pairings(
    ctx: RunContext[StateDeps[AppState]],
    wine_type: Optional[str] = None,
    wine_name: Optional[str] = None,
) -> dict:
    """Get food pairing suggestions for a wine type or specific wine."""

    pairings_db = {
        "red": ["Beef steak", "Lamb chops", "Hard aged cheeses", "Mushroom risotto", "Dark chocolate"],
        "white": ["Grilled fish", "Chicken", "Soft cheeses", "Seafood pasta", "Caesar salad"],
        "rosé": ["Mediterranean dishes", "Light salads", "Grilled vegetables", "Sushi", "Fruit desserts"],
        "sparkling": ["Oysters", "Caviar", "Fried appetizers", "Soft cheese", "Celebration cake"],
        "dessert": ["Foie gras", "Blue cheese", "Fruit tarts", "Crème brûlée", "Dark chocolate"],
    }

    tips_db = {
        "red": "Serve at 16-18°C. Decant bold reds for 30-60 minutes.",
        "white": "Serve chilled at 8-12°C. Fuller whites can be served slightly warmer.",
        "rosé": "Serve well chilled at 6-10°C. Perfect for warm weather.",
        "sparkling": "Serve very cold at 6-8°C. Use flute glasses to preserve bubbles.",
        "dessert": "Serve chilled. The wine should be sweeter than the dessert.",
    }

    wine_type_lower = (wine_type or "red").lower()
    pairings = pairings_db.get(wine_type_lower, pairings_db["red"])
    tips = tips_db.get(wine_type_lower, "")

    return {
        "pairings": pairings,
        "tips": tips,
        "wine_type": wine_type_lower,
    }


@agent.tool
async def save_wine_preference(
    ctx: RunContext[StateDeps[AppState]],
    preference_type: str,
    value: str,
) -> dict:
    """Save user's wine preference (region, grape, style preference)."""
    user_id = get_effective_user_id(ctx.deps.state.user)

    if not user_id:
        return {"saved": False, "message": "Please sign in to save preferences"}

    # Store to Zep (auto-extracts as fact)
    if ZEP_API_KEY:
        try:
            client = get_zep_client()
            if client:
                await client.post("/api/v2/users", json={"user_id": user_id})
                await client.post(f"/api/v2/threads/wine-prefs-{user_id}/messages", json={
                    "messages": [{
                        "role": "user",
                        "content": f"User prefers {preference_type}: {value}"
                    }]
                })
        except Exception as e:
            print(f"[Zep] Error saving preference: {e}", file=sys.stderr)

    return {"saved": True, "preference_type": preference_type, "value": value}


@agent.tool
async def show_wine_market(
    ctx: RunContext[StateDeps[AppState]],
) -> dict:
    """Show wine market overview dashboard."""
    if not DATABASE_URL:
        return {"error": "Database not configured"}

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Get metrics
        cur.execute("SELECT COUNT(*) FROM wines WHERE is_active = true")
        total_wines = cur.fetchone()[0]

        cur.execute("SELECT COUNT(DISTINCT region) FROM wines WHERE is_active = true")
        total_regions = cur.fetchone()[0]

        cur.execute("SELECT AVG(price_retail) FROM wines WHERE is_active = true AND price_retail > 0")
        avg_price = cur.fetchone()[0] or 0

        cur.execute("""
            SELECT vintage, COUNT(*) as count
            FROM wines
            WHERE is_active = true AND vintage IS NOT NULL
            GROUP BY vintage
            ORDER BY count DESC
            LIMIT 1
        """)
        top_vintage_row = cur.fetchone()
        top_vintage = str(top_vintage_row[0]) if top_vintage_row else "N/A"

        # Top regions
        cur.execute("""
            SELECT region, COUNT(*) as count
            FROM wines
            WHERE is_active = true AND region IS NOT NULL
            GROUP BY region
            ORDER BY count DESC
            LIMIT 5
        """)
        top_regions = [{"name": row[0], "count": row[1]} for row in cur.fetchall()]

        cur.close()
        conn.close()

        return {
            "metrics": {
                "totalWines": total_wines,
                "totalRegions": total_regions,
                "avgPrice": f"£{avg_price:.0f}",
                "topVintage": top_vintage,
            },
            "topRegions": top_regions,
            "title": "Wine Market Overview",
            "lastUpdated": "Live data",
        }

    except Exception as e:
        return {"error": str(e)}


# =====
# FastAPI App with AG-UI + OpenAI-compatible endpoint for Hume CLM
# =====
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic_ai.models.groq import GroqModel
import json
import asyncio
import uuid
import time

main_app = FastAPI(title="DIONYSUS Wine Agent")

main_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to extract user from CopilotKit/AG-UI instructions
@main_app.middleware("http")
async def extract_user_middleware(request: Request, call_next):
    if request.method == "POST":
        try:
            body_bytes = await request.body()
            if body_bytes:
                body = json.loads(body_bytes)

                # DEBUG: Log request structure for AG-UI endpoints
                path = str(request.url.path)
                if "/agui" in path:
                    print(f"🔍 AG-UI request to {path}:", file=sys.stderr)
                    print(f"   Keys: {list(body.keys())}", file=sys.stderr)
                    if body.get("state"):
                        print(f"   State keys: {list(body.get('state', {}).keys()) if isinstance(body.get('state'), dict) else type(body.get('state'))}", file=sys.stderr)
                    if body.get("context"):
                        print(f"   Context: {body.get('context')[:200] if isinstance(body.get('context'), str) else len(body.get('context'))} items", file=sys.stderr)

                # Check OpenAI format (messages array)
                messages = body.get("messages", [])
                for msg in messages:
                    content = msg.get("content", "")
                    if msg.get("role") == "system" and ("User ID:" in content or "User Name:" in content):
                        extract_user_from_instructions(content)
                        break

                # Check AG-UI format (context field with instructions)
                context = body.get("context", [])
                for ctx in context:
                    if isinstance(ctx, dict):
                        # Check for instructions in context
                        desc = ctx.get("description", "")
                        if "User ID:" in desc or "User Name:" in desc:
                            extract_user_from_instructions(desc)
                            break

                # Check AG-UI state for user info
                state = body.get("state", {})
                if isinstance(state, dict) and state.get("user"):
                    user_data = state.get("user", {})
                    if user_data.get("id"):
                        global _cached_user_context
                        _cached_user_context = {
                            "user_id": user_data.get("id"),
                            "name": user_data.get("firstName") or user_data.get("name"),
                            "email": user_data.get("email"),
                        }
                        print(f"🍷 User from AG-UI state: {_cached_user_context.get('name')}", file=sys.stderr)

                async def receive():
                    return {"type": "http.request", "body": body_bytes}
                request = Request(request.scope, receive)
        except Exception as e:
            print(f"[Middleware] Error: {e}", file=sys.stderr)

    return await call_next(request)

# AG-UI endpoint (CopilotKit expects /agui/)
ag_ui_app = agent.to_ag_ui(deps=StateDeps(AppState()))
main_app.mount("/agui", ag_ui_app)


# =====
# OpenAI-compatible /chat/completions endpoint for Hume CLM
# =====
def extract_user_from_hume_messages(messages: list, system_prompt: str = "") -> dict:
    """Extract user info from Hume's messages and system prompt."""
    result = {"name": None, "user_id": None}

    # First check system prompt
    if system_prompt:
        # Look for "Name: X" pattern
        name_match = re.search(r'Name:\s*([^\n]+)', system_prompt)
        if name_match:
            name = name_match.group(1).strip()
            if name and name.lower() != 'guest wine enthusiast':
                result["name"] = name

        # Look for session ID with user name: "name|aionysus_userid"
        session_match = re.search(r'([^|]+)\|aionysus_([a-f0-9-]+)', system_prompt)
        if session_match:
            if session_match.group(1).strip():
                result["name"] = session_match.group(1).strip()
            result["user_id"] = session_match.group(2)

    # Also scan user messages for "my name is X" or "I'm X" patterns
    if not result["name"]:
        for msg in messages:
            if msg.get("role") == "user":
                content = msg.get("content", "").lower()
                # Pattern: "my name is Dan" or "I'm Dan" or "Hello, my name is Dan"
                name_patterns = [
                    r"my name is\s+([a-zA-Z]+)",
                    r"i'm\s+([a-zA-Z]+)",
                    r"i am\s+([a-zA-Z]+)",
                    r"call me\s+([a-zA-Z]+)",
                    r"this is\s+([a-zA-Z]+)",
                ]
                for pattern in name_patterns:
                    match = re.search(pattern, content, re.IGNORECASE)
                    if match:
                        potential_name = match.group(1).strip().title()
                        # Filter out common non-name words
                        if potential_name.lower() not in ['here', 'there', 'interested', 'looking', 'wondering', 'asking']:
                            result["name"] = potential_name
                            print(f"🎤 Found name in user message: {potential_name}", file=sys.stderr)
                            break
                if result["name"]:
                    break

    return result


@main_app.post("/chat/completions")
async def chat_completions(request: Request):
    """OpenAI-compatible chat completions endpoint for Hume CLM integration."""
    try:
        body = await request.json()
        messages = body.get("messages", [])
        stream = body.get("stream", True)

        # DEBUG: Log what Hume sends us
        print(f"🎤 Hume CLM request received:", file=sys.stderr)
        print(f"   Messages count: {len(messages)}", file=sys.stderr)
        for i, msg in enumerate(messages):
            role = msg.get("role", "?")
            content = msg.get("content", "")[:200]  # First 200 chars
            print(f"   [{i}] {role}: {content}...", file=sys.stderr)

        # Extract conversation from messages
        conversation = []
        system_prompt = None
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                system_prompt = content
                print(f"🎤 Found system prompt ({len(content)} chars), contains 'Name:': {'Name:' in content}", file=sys.stderr)
            else:
                conversation.append({"role": role, "content": content})

        # Extract user context from Hume's system prompt AND user messages
        user_context = extract_user_from_hume_messages(messages, system_prompt or "")
        user_name = user_context.get("name")
        user_id = user_context.get("user_id")

        # Also check cached context from middleware
        if not user_name and _cached_user_context.get("name"):
            user_name = _cached_user_context.get("name")
        if not user_id and _cached_user_context.get("user_id"):
            user_id = _cached_user_context.get("user_id")

        print(f"🎤 Hume CLM - User: {user_name or 'anonymous'}", file=sys.stderr)

        # Get the last user message
        user_message = ""
        for msg in reversed(conversation):
            if msg["role"] == "user":
                user_message = msg["content"]
                break

        if not user_message:
            user_message = "Hello"

        # Apply phonetic corrections
        user_message = apply_phonetic_corrections(user_message)

        # Fetch Zep context if we have a user ID
        zep_context = ""
        if user_id and ZEP_API_KEY:
            try:
                zep_ctx, _ = await get_user_wine_preferences(user_id)
                if zep_ctx:
                    zep_context = zep_ctx
                    print(f"🧠 Zep context loaded for Hume", file=sys.stderr)
            except Exception as e:
                print(f"[Hume Zep] Error: {e}", file=sys.stderr)

        # Build personalized system prompt - USER CONTEXT MUST BE FIRST AND EXPLICIT
        if user_name:
            user_section = f"""
## CRITICAL - USER IDENTITY (READ THIS FIRST!)
**The user's name is: {user_name}**

MANDATORY RULES:
1. If asked "What is my name?" → Say "Your name is {user_name}!"
2. Greet them as {user_name} warmly
3. NEVER say "I don't have your name" - YOU DO, it's {user_name}!
4. NEVER say "I don't have personal information" - the name is RIGHT HERE!
5. Address {user_name} by name naturally

{zep_context if zep_context else f"This is {user_name}'s first conversation with you."}
"""
        else:
            user_section = """
## USER CONTEXT
No user name provided. You may ask for their name if relevant.
"""

        # Create a simple agent for Hume (without tools - just chat)
        hume_agent = Agent(
            model=GroqModel("llama-3.3-70b-versatile"),
            system_prompt=dedent(f"""
{user_section}

You are DIONYSUS, an expert AI wine sommelier for Aionysus.
You have deep knowledge of wines, regions, investments, and pairings.
Keep responses concise for voice - 1-2 sentences unless asked for details.
Be warm, knowledgeable, and approachable.

{system_prompt or ''}
            """).strip(),
        )

        if stream:
            # Streaming response for Hume
            async def generate():
                response_id = f"chatcmpl-{uuid.uuid4().hex[:8]}"
                created = int(time.time())

                try:
                    # Run the agent
                    result = await hume_agent.run(user_message)
                    # Extract the actual text from AgentRunResult
                    if hasattr(result, 'output'):
                        response_text = str(result.output)
                    elif hasattr(result, 'data'):
                        response_text = str(result.data)
                    else:
                        response_text = str(result)
                    # Clean up any AgentRunResult wrapper if it slipped through
                    if response_text.startswith("AgentRunResult("):
                        import re
                        match = re.search(r'output=["\'](.+?)["\']', response_text)
                        if match:
                            response_text = match.group(1)

                    # Stream the response in chunks
                    words = response_text.split()
                    for i, word in enumerate(words):
                        chunk = {
                            "id": response_id,
                            "object": "chat.completion.chunk",
                            "created": created,
                            "model": "dionysus-1",
                            "choices": [{
                                "index": 0,
                                "delta": {"content": word + (" " if i < len(words) - 1 else "")},
                                "finish_reason": None
                            }]
                        }
                        yield f"data: {json.dumps(chunk)}\n\n"
                        await asyncio.sleep(0.02)  # Small delay for streaming effect

                    # Send finish
                    finish_chunk = {
                        "id": response_id,
                        "object": "chat.completion.chunk",
                        "created": created,
                        "model": "dionysus-1",
                        "choices": [{
                            "index": 0,
                            "delta": {},
                            "finish_reason": "stop"
                        }]
                    }
                    yield f"data: {json.dumps(finish_chunk)}\n\n"
                    yield "data: [DONE]\n\n"

                except Exception as e:
                    error_chunk = {
                        "id": response_id,
                        "object": "chat.completion.chunk",
                        "created": created,
                        "model": "dionysus-1",
                        "choices": [{
                            "index": 0,
                            "delta": {"content": f"I apologize, I encountered an issue. Please try again."},
                            "finish_reason": "stop"
                        }]
                    }
                    yield f"data: {json.dumps(error_chunk)}\n\n"
                    yield "data: [DONE]\n\n"
                    print(f"[Hume CLM Error] {e}", file=sys.stderr)

            return StreamingResponse(
                generate(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        else:
            # Non-streaming response
            result = await hume_agent.run(user_message)
            # Extract the actual text from AgentRunResult
            if hasattr(result, 'output'):
                response_text = str(result.output)
            elif hasattr(result, 'data'):
                response_text = str(result.data)
            else:
                response_text = str(result)
            # Clean up any AgentRunResult wrapper if it slipped through
            if response_text.startswith("AgentRunResult("):
                import re
                match = re.search(r'output=["\'](.+?)["\']', response_text)
                if match:
                    response_text = match.group(1)

            return {
                "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": "dionysus-1",
                "choices": [{
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": response_text
                    },
                    "finish_reason": "stop"
                }],
                "usage": {
                    "prompt_tokens": len(user_message.split()),
                    "completion_tokens": len(response_text.split()),
                    "total_tokens": len(user_message.split()) + len(response_text.split())
                }
            }

    except Exception as e:
        print(f"[Hume CLM Error] {e}", file=sys.stderr)
        return {
            "error": {
                "message": str(e),
                "type": "server_error",
                "code": 500
            }
        }


# Health check
@main_app.get("/health")
async def health():
    return {"status": "healthy", "agent": "DIONYSUS"}

app = main_app
