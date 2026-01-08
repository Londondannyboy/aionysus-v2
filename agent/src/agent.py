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
SYSTEM_PROMPT = dedent("""
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
""")

agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
)


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
# FastAPI App with AG-UI
# =====
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import json

main_app = FastAPI(title="DIONYSUS Wine Agent")

main_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to extract user from CopilotKit instructions
@main_app.middleware("http")
async def extract_user_middleware(request: Request, call_next):
    if request.method == "POST":
        try:
            body_bytes = await request.body()
            if body_bytes:
                body = json.loads(body_bytes)
                messages = body.get("messages", [])
                for msg in messages:
                    if msg.get("role") == "system" and "User ID:" in msg.get("content", ""):
                        extract_user_from_instructions(msg["content"])
                        break

                async def receive():
                    return {"type": "http.request", "body": body_bytes}
                request = Request(request.scope, receive)
        except Exception as e:
            print(f"[Middleware] Error: {e}", file=sys.stderr)

    return await call_next(request)

# AG-UI endpoint (CopilotKit expects /agui/)
ag_ui_app = agent.to_ag_ui(deps=StateDeps(AppState()))
main_app.mount("/agui", ag_ui_app)

# Health check
@main_app.get("/health")
async def health():
    return {"status": "healthy", "agent": "DIONYSUS"}

app = main_app
