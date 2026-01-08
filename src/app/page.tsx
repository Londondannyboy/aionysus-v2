"use client";

import {
  WineRegionChart, WineTypeChart,
  WineMarketDashboard, ChartLoading
} from "@/components/charts";
import {
  InvestmentWinesGrid, InvestmentPriceChart, ROICalculator,
  PortfolioBuilder, InvestmentLoading
} from "@/components/investment";
import { ForceGraph3DComponent, ForceGraphLoading } from "@/components/ForceGraph3D";
import { VoiceInput } from "@/components/voice-input";
import { DynamicBackground } from "@/components/DynamicBackground";
import { AgentState, Wine } from "@/lib/types";
import { useCoAgent, useRenderToolCall, useCopilotChat } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { UserButton, SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react/ui";
import { authClient } from "@/lib/auth/client";

// Wine Card Component for search results
function WineCard({ wine, onAddToCart }: { wine: Wine; onAddToCart?: (wine: Wine) => void }) {
  return (
    <div className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-rose-300 hover:shadow-lg transition-all duration-200">
      {/* Wine Image */}
      {wine.image_url && (
        <div className="mb-3 h-32 overflow-hidden rounded-lg bg-gray-100">
          <img
            src={wine.image_url}
            alt={wine.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
          />
        </div>
      )}

      {/* Wine Info */}
      <div className="mb-2">
        <h4 className="font-semibold text-gray-900 group-hover:text-rose-700 transition-colors line-clamp-1">
          {wine.name}
        </h4>
        <p className="text-sm text-gray-600">{wine.winery}</p>
      </div>

      {/* Region & Type */}
      <div className="flex flex-wrap gap-2 mb-3">
        {wine.region && (
          <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full">
            {wine.region}
          </span>
        )}
        {wine.wine_type && (
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
            {wine.wine_type}
          </span>
        )}
        {wine.vintage && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
            {wine.vintage}
          </span>
        )}
      </div>

      {/* Price & Action */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        {wine.price_retail && (
          <span className="text-lg font-bold text-rose-700">
            £{wine.price_retail.toFixed(2)}
          </span>
        )}
        {onAddToCart && (
          <button
            onClick={() => onAddToCart(wine)}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg font-medium transition-colors"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}

// Dynamic suggestions based on conversation
function useDynamicSuggestions(state: AgentState, lastQuery: string) {
  return useMemo(() => {
    const suggestions = [];
    const query = lastQuery.toLowerCase();

    if (query.includes('burgundy') || query.includes('pinot')) {
      suggestions.push({ title: "Burgundy Reds", message: "Show me red Burgundy wines" });
      suggestions.push({ title: "Investment", message: "Which Burgundy wines are good investments?" });
    } else if (query.includes('bordeaux') || query.includes('cabernet')) {
      suggestions.push({ title: "Bordeaux Wines", message: "Show me Bordeaux wines" });
      suggestions.push({ title: "Price Trends", message: "Show Bordeaux price trends" });
    } else if (query.includes('champagne') || query.includes('sparkling')) {
      suggestions.push({ title: "Champagne", message: "Show me champagne options" });
      suggestions.push({ title: "Celebrations", message: "Best champagne for celebrations?" });
    } else if (state.wines?.length > 0) {
      suggestions.push({ title: "More Details", message: "Tell me more about the first wine" });
      suggestions.push({ title: "Food Pairings", message: "What food pairs with these wines?" });
      suggestions.push({ title: "Investment", message: "Are any of these good investments?" });
    } else {
      // Default suggestions
      suggestions.push({ title: "Red Wines", message: "Show me red wines under £50" });
      suggestions.push({ title: "Wine Regions", message: "Show wines by region" });
      suggestions.push({ title: "Investment", message: "What wines are good investments?" });
      suggestions.push({ title: "Recommendations", message: "Recommend a wine for dinner" });
    }

    return suggestions.slice(0, 4);
  }, [state.wines, lastQuery]);
}

export default function WinePage() {
  const [themeColor] = useState("#722F37"); // Burgundy
  const [lastQuery, setLastQuery] = useState("");

  return (
    <main style={{ "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties}>
      <WineContent lastQuery={lastQuery} setLastQuery={setLastQuery} />
    </main>
  );
}

function WineContent({ lastQuery, setLastQuery }: {
  lastQuery: string;
  setLastQuery: (q: string) => void;
}) {
  // Auth
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const user = session?.user;
  const firstName = user?.name?.split(' ')[0] || null;

  // Agent state
  const { state, setState } = useCoAgent<AgentState>({
    name: "wine_agent",
    initialState: {
      wines: [],
      search_query: "",
      user: undefined,
      scene: undefined,
      cart: undefined,
    },
  });

  // Sync user to agent state
  useEffect(() => {
    if (user && (!state.user || state.user.id !== user.id)) {
      setState(prev => ({
        wines: prev?.wines ?? [],
        search_query: prev?.search_query ?? "",
        scene: prev?.scene,
        cart: prev?.cart,
        user: {
          id: user.id,
          name: user.name,
          firstName: firstName || undefined,
          email: user.email,
          saved_wines: prev?.user?.saved_wines ?? [],
        }
      }));
    }
  }, [user?.id, firstName, setState, state.user]);

  // Dynamic suggestions
  const suggestions = useDynamicSuggestions(state, lastQuery);

  // CopilotKit chat
  const { appendMessage } = useCopilotChat();

  // Voice message handler
  const userIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const handleVoiceMessage = useCallback((text: string, role: "user" | "assistant" = "user") => {
    console.log(`🍷 Voice (${role}):`, text.slice(0, 100));

    if (role === "user") {
      setLastQuery(text);
    }

    // Store to Zep
    const currentUserId = userIdRef.current;
    if (currentUserId && text.length > 5) {
      fetch('/api/zep-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, role, content: text }),
      }).catch(e => console.warn('Failed to store to Zep:', e));
    }

    const messageRole = role === "user" ? Role.User : Role.Assistant;
    appendMessage(new TextMessage({ content: text, role: messageRole }));
  }, [appendMessage, setLastQuery]);

  // Add to cart handler
  const handleAddToCart = useCallback((wine: Wine) => {
    appendMessage(new TextMessage({
      content: `Add "${wine.name}" to my cart`,
      role: Role.User
    }));
  }, [appendMessage]);

  // === GENERATIVE UI: Wine Charts ===
  useRenderToolCall({
    name: "show_wine_regions",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Loading regions..." />;
      return <WineRegionChart data={result.chartData || []} title={result.title} subtitle={result.subtitle} />;
    },
  }, []);

  useRenderToolCall({
    name: "show_wine_types",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Loading types..." />;
      return <WineTypeChart data={result.chartData || []} title={result.title} subtitle={result.subtitle} />;
    },
  }, []);

  useRenderToolCall({
    name: "show_investment_chart",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <InvestmentLoading title="Loading price trends..." />;
      return (
        <InvestmentPriceChart
          data={result.chartData || []}
          title={result.title}
          subtitle={result.subtitle}
          investmentScore={result.investmentScore}
          fiveYearReturn={result.fiveYearReturn}
        />
      );
    },
  }, []);

  useRenderToolCall({
    name: "show_wine_market",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Loading market data..." />;
      return <WineMarketDashboard data={result} />;
    },
  }, []);

  // === GENERATIVE UI: Wine Search Results ===
  useRenderToolCall({
    name: "search_wines",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Searching wines..." />;

      const wines = result.wines || [];
      if (wines.length === 0) {
        return (
          <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl text-center">
            <span className="text-3xl mb-2 block">🍷</span>
            <p className="text-gray-600 font-medium">No wines found for "{result.query}"</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-lg">{result.title}</h3>
            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-medium">
              {wines.length} found
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wines.slice(0, 6).map((wine: Wine, i: number) => (
              <WineCard key={wine.id || i} wine={wine} onAddToCart={handleAddToCart} />
            ))}
          </div>
        </div>
      );
    },
  }, [handleAddToCart]);

  // === GENERATIVE UI: Food Pairings ===
  useRenderToolCall({
    name: "get_food_pairings",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Finding pairings..." />;

      return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
          <h3 className="font-bold text-gray-900 text-lg mb-4">🍽️ Food Pairings</h3>
          <div className="space-y-3">
            {(result.pairings || []).map((pairing: string, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <span className="text-2xl">{['🥩', '🧀', '🐟', '🥗', '🍝'][i % 5]}</span>
                <span className="text-gray-700">{pairing}</span>
              </div>
            ))}
          </div>
          {result.tips && (
            <p className="mt-4 text-sm text-gray-600 italic">{result.tips}</p>
          )}
        </div>
      );
    },
  }, []);

  // === GENERATIVE UI: Taste Profile Graph ===
  useRenderToolCall({
    name: "show_taste_profile",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ForceGraphLoading title="Building taste profile..." />;
      return (
        <div className="space-y-2">
          <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full font-medium">
            Your Wine Preferences
          </span>
          <ForceGraph3DComponent data={result} height={400} />
        </div>
      );
    },
  }, []);

  // === GENERATIVE UI: Investment Wines Grid ===
  useRenderToolCall({
    name: "get_investment_wines",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <InvestmentLoading title="Finding investment wines..." />;
      const wines = (result.wines || []).map((w: Record<string, unknown>) => ({
        id: w.id as number,
        name: w.name as string,
        region: w.region as string,
        vintage: w.vintage as number | undefined,
        price: w.price as number | undefined,
        investmentScore: w.investment_score as number | undefined,
        fiveYearReturn: w.five_year_return as number | undefined,
        storageType: w.storage_type as string | undefined,
        livExScore: w.liv_ex_score as number | undefined,
      }));
      return <InvestmentWinesGrid wines={wines} title={result.title || "Investment Wines"} />;
    },
  }, []);

  // === GENERATIVE UI: ROI Calculator ===
  useRenderToolCall({
    name: "calculate_wine_roi",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <InvestmentLoading title="Calculating ROI..." />;
      return <ROICalculator data={result} />;
    },
  }, []);

  // === GENERATIVE UI: Portfolio Builder ===
  useRenderToolCall({
    name: "build_portfolio",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <InvestmentLoading title="Building portfolio..." />;
      return <PortfolioBuilder data={result} />;
    },
  }, []);

  // Build agent instructions
  const agentInstructions = user
    ? `CRITICAL USER CONTEXT:
- User Name: ${firstName || user.name}
- User ID: ${user.id}
- User Email: ${user.email}

You are DIONYSUS, an expert AI wine sommelier for Aionysus.
Help users discover wines, understand investment potential, and find perfect pairings.
Our database has 3,800+ wines from regions worldwide.

When the user asks about wines, use the available tools:
- search_wines: Find wines by region, type, price, grape variety
- show_investment_chart: Show price trends for investment wines
- get_investment_wines: Show top investment-grade wines
- calculate_wine_roi: Calculate ROI for wine investments
- build_portfolio: Build diversified wine investment portfolio
- show_wine_regions: Display wines by region
- show_wine_types: Show wine type distribution
- get_food_pairings: Suggest food pairings
- add_to_cart: Add wine to shopping cart
- checkout: Process checkout via Shopify

Be knowledgeable but approachable. Use wine terminology naturally.
For investment queries, highlight scores, 5-year returns, and storage options.
Remember user preferences via Zep memory.`
    : `You are DIONYSUS, an expert AI wine sommelier for Aionysus.
Help users discover wines from our collection of 3,800+ bottles.
Encourage sign-in for personalized recommendations and purchase.`;

  return (
    <CopilotSidebar
      clickOutsideToClose={false}
      instructions={agentInstructions}
      labels={{
        title: "DIONYSUS",
        initial: firstName
          ? `Welcome back, ${firstName}! What wine shall we explore today?`
          : "Welcome to Aionysus. Ask me about wines, regions, or investments.",
      }}
      suggestions={suggestions}
    >
      {/* Dynamic Background */}
      <DynamicBackground scene={state.scene} />

      <div className="min-h-screen flex flex-col">
        {/* Navbar */}
        <nav className="h-14 bg-black/30 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍷</span>
            <span className="text-white font-bold text-xl tracking-wide">Aionysus</span>
          </div>

          <div className="flex items-center gap-4">
            {isSessionLoading ? (
              <div className="text-white/60 text-sm">...</div>
            ) : (
              <>
                <SignedOut>
                  <button
                    onClick={() => window.location.href = '/auth/sign-in'}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign In
                  </button>
                </SignedOut>
                <SignedIn>
                  <span className="text-white text-sm">{firstName || user?.name}</span>
                  <UserButton />
                </SignedIn>
              </>
            )}
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
              Discover Fine Wines
            </h1>
            <p className="text-xl text-white/80 mb-8">
              3,800+ wines from the world's premier regions.
              <br />
              Curated by AI. Investment-grade quality.
            </p>

            {/* Voice Input */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <VoiceInput
                onMessage={handleVoiceMessage}
                firstName={firstName}
                userId={user?.id}
              />
              <p className="text-white/60 text-sm mt-4">
                Ask DIONYSUS about wines, regions, or investment opportunities
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-black/20 backdrop-blur-md py-8 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: "🍇", label: "By Region", query: "Show wines by region" },
              { icon: "🍷", label: "Red Wines", query: "Show me red wines" },
              { icon: "📈", label: "Investments", query: "What wines are good investments?" },
              { icon: "🍽️", label: "Pairings", query: "Wine pairing suggestions" },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  setLastQuery(action.query);
                  appendMessage(new TextMessage({ content: action.query, role: Role.User }));
                }}
                className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <span className="text-3xl">{action.icon}</span>
                <span className="text-white text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black/40 py-4 px-6 text-center text-white/40 text-sm">
          Aionysus - AI-Powered Wine Discovery | Powered by DIONYSUS
        </footer>
      </div>
    </CopilotSidebar>
  );
}
