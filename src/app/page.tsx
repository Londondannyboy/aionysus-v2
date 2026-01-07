"use client";

import { JobsCard } from "@/components/jobs";
import {
  JobsBarChart, JobsPieChart, SalaryAreaChart,
  MarketDashboard, ArticlesGrid, ChartLoading
} from "@/components/charts";
import { ForceGraph3DComponent, ForceGraphLoading } from "@/components/ForceGraph3D";
import { A2UIRenderer, A2UILoading } from "@/components/a2ui-renderer";
import { VoiceInput } from "@/components/voice-input";
import { DynamicBackground } from "@/components/DynamicBackground";
import { LiveProfileGraph } from "@/components/LiveProfileGraph";
import { UserProfileSection } from "@/components/UserProfileSection";
import { AgentState } from "@/lib/types";
import { useCoAgent, useRenderToolCall, useCopilotChat, useHumanInTheLoop } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { UserButton, SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react/ui";
import { authClient } from "@/lib/auth/client";
import { usePathname } from "next/navigation";

// Messages badge component
function MessagesBadge({ userId }: { userId?: string }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const fetchUnread = async () => {
      try {
        const res = await fetch(`/api/messages?userId=${userId}&unreadOnly=true`);
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
      } catch (e) {
        console.error('Failed to fetch unread messages:', e);
      }
    };

    fetchUnread();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}

// Dynamic suggestions based on context
function useDynamicSuggestions(state: AgentState, lastQuery: string) {
  return useMemo(() => {
    const suggestions = [];
    const query = lastQuery.toLowerCase();

    // If they searched for a role, suggest related actions
    if (query.includes('cto') || state.search_query?.includes('CTO')) {
      suggestions.push({ title: "CTO Salaries", message: "What are CTO salary ranges?" });
      suggestions.push({ title: "CFO Jobs", message: "Show me CFO positions" });
      suggestions.push({ title: "Tech Market", message: "Show the market dashboard" });
    } else if (query.includes('cfo') || state.search_query?.includes('CFO')) {
      suggestions.push({ title: "CFO Salaries", message: "What are CFO salary ranges?" });
      suggestions.push({ title: "CTO Jobs", message: "Show me CTO positions" });
      suggestions.push({ title: "Finance Articles", message: "Show featured articles" });
    } else if (query.includes('chart') || query.includes('visual')) {
      suggestions.push({ title: "Location Chart", message: "Show jobs by location" });
      suggestions.push({ title: "Role Distribution", message: "Show role distribution chart" });
      suggestions.push({ title: "Search Jobs", message: "Find me CMO roles in London" });
    } else if (state.jobs?.length > 0) {
      // They have jobs loaded - suggest deeper exploration
      suggestions.push({ title: "Salary Insights", message: "What are the salary ranges?" });
      suggestions.push({ title: "Job Details", message: "Tell me more about the first job" });
      suggestions.push({ title: "Location Chart", message: "Show jobs by location" });
    } else {
      // Default suggestions
      suggestions.push({ title: "CTO Jobs", message: "Show me CTO positions" });
      suggestions.push({ title: "Market Dashboard", message: "Show the market dashboard" });
      suggestions.push({ title: "Salary Chart", message: "What are executive salary ranges?" });
      suggestions.push({ title: "Featured Articles", message: "Show featured articles" });
    }

    return suggestions.slice(0, 4);
  }, [state.jobs, state.search_query, lastQuery]);
}

export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#6366f1");
  const [lastQuery, setLastQuery] = useState("");

  return (
    <main style={{ "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties}>
      <YourMainContent themeColor={themeColor} lastQuery={lastQuery} setLastQuery={setLastQuery} />
    </main>
  );
}

function YourMainContent({ themeColor, lastQuery, setLastQuery }: {
  themeColor: string;
  lastQuery: string;
  setLastQuery: (q: string) => void;
}) {
  // Get current page path for context
  const pathname = usePathname();

  // Parse pathname to human-readable page context
  const getPageContext = (path: string): string => {
    if (path === "/" || path === "") return "Homepage - main job search and profile view";
    if (path === "/dashboard") return "Dashboard - managing messages, connections, and profile";
    if (path.includes("fractional-jobs-london")) return "London Jobs page - focused on London fractional executive positions";
    if (path.includes("fractional-cto")) return "CTO Jobs page - focused on Chief Technology Officer roles";
    if (path.includes("fractional-cfo")) return "CFO Jobs page - focused on Chief Financial Officer roles";
    if (path.includes("fractional-cmo")) return "CMO Jobs page - focused on Chief Marketing Officer roles";
    if (path.includes("fractional-coo")) return "COO Jobs page - focused on Chief Operating Officer roles";
    if (path.includes("fractional-chro")) return "CHRO Jobs page - focused on Chief HR Officer roles";
    if (path.includes("profile")) return "Profile page - viewing/editing user profile";
    return `Page: ${path}`;
  };

  const pageContext = getPageContext(pathname);

  // Get user's first name from Neon Auth
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const user = session?.user;
  const firstName = user?.name?.split(' ')[0] || null;

  const { state, setState } = useCoAgent<AgentState>({
    name: "my_agent",
    initialState: {
      jobs: [],
      search_query: "",
      user: undefined,
      scene: undefined,  // Dynamic background scene
    },
  });

  // Refresh trigger for live profile graph - increment to force update
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0);
  const refreshProfile = useCallback(() => {
    setProfileRefreshTrigger(prev => prev + 1);
    console.log("📊 Profile refresh triggered");
  }, []);

  // Sync user to agent state when session changes
  // IMPORTANT: Always sync if user exists but state.user doesn't match (handles state resets)
  useEffect(() => {
    console.log("🔄 User sync effect - user:", user?.name, "state.user:", state.user?.name);
    if (user && (!state.user || state.user.id !== user.id)) {
      console.log("🔄 Setting user state:", { id: user.id, firstName, name: user.name, email: user.email });
      setState(prev => ({
        jobs: prev?.jobs ?? [],
        search_query: prev?.search_query ?? "",
        scene: prev?.scene,
        user: {
          id: user.id,
          name: user.name,
          firstName: firstName || undefined,
          email: user.email,
          liked_jobs: prev?.user?.liked_jobs ?? [],
        }
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Dynamic suggestions based on context
  const suggestions = useDynamicSuggestions(state, lastQuery);

  // CopilotKit chat hook for voice integration
  const { appendMessage } = useCopilotChat();

  // Use ref for user.id to prevent callback recreation on auth complete
  const userIdRef = useRef<string | undefined>(user?.id);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  // Handle voice input → send to CopilotKit with correct role
  // Stable callback - uses refs to prevent recreation
  const handleVoiceMessage = useCallback((text: string, role: "user" | "assistant" = "user") => {
    console.log(`🎤 Voice (${role}):`, text.slice(0, 100) + (text.length > 100 ? '...' : ''));

    // Only track user queries for suggestions
    if (role === "user") {
      setLastQuery(text);
    }

    // Store message to Zep for memory (fire-and-forget, don't block)
    const currentUserId = userIdRef.current;
    if (currentUserId && text.length > 5) {
      fetch('/api/zep-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          role: role,
          content: text,
        }),
      }).catch(e => console.warn('Failed to store to Zep:', e));
    }

    // Send with correct role so Pydantic AI gets full conversation context
    const messageRole = role === "user" ? Role.User : Role.Assistant;
    appendMessage(new TextMessage({ content: text, role: messageRole }));
  }, [appendMessage, setLastQuery]); // Removed user?.id - using ref instead

  // AG-UI Generative UI: Charts
  useRenderToolCall({
    name: "show_jobs_chart",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Loading..." />;
      return <JobsBarChart data={result.chartData || []} title={result.title} subtitle={result.subtitle} />;
    },
  }, []);

  useRenderToolCall({
    name: "show_location_chart",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Loading..." />;
      return <JobsPieChart data={result.chartData || []} title={result.title} subtitle={result.subtitle} />;
    },
  }, []);

  useRenderToolCall({
    name: "show_salary_insights",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Loading..." />;
      return <SalaryAreaChart data={result.chartData || []} title={result.title} subtitle={result.subtitle} />;
    },
  }, []);

  useRenderToolCall({
    name: "show_market_dashboard",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Loading..." />;
      return <MarketDashboard data={result} />;
    },
  }, []);

  useRenderToolCall({
    name: "get_featured_articles",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Loading..." />;
      return <ArticlesGrid articles={result.articles || []} title={result.title} />;
    },
  }, []);

  // Search Jobs - Render polished job cards in chat
  useRenderToolCall({
    name: "search_jobs",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Searching jobs..." />;

      const jobs = result.jobs || [];
      if (jobs.length === 0) {
        return (
          <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl text-center">
            <span className="text-3xl mb-2 block">🔍</span>
            <p className="text-gray-600 font-medium">No jobs found for "{result.query}"</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-lg">{result.title}</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              {jobs.length} found
            </span>
          </div>

          {/* Job Cards */}
          <div className="space-y-3">
            {jobs.map((job: { title: string; company: string; location: string; salary: string; description: string; url: string; role_type?: string }, i: number) => (
              <div
                key={i}
                className="group p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
              >
                {/* Top row: Title + Role badge */}
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                      {job.title}
                    </h4>
                    <p className="text-sm text-gray-600 font-medium">{job.company}</p>
                  </div>
                  {job.role_type && (
                    <span className="shrink-0 text-xs bg-indigo-600 text-white px-2.5 py-1 rounded-full font-semibold">
                      {job.role_type}
                    </span>
                  )}
                </div>

                {/* Meta row: Location + Salary */}
                <div className="flex flex-wrap gap-3 mb-3 text-sm">
                  <span className="flex items-center gap-1 text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {job.location}
                  </span>
                  {job.salary && (
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {job.salary}
                    </span>
                  )}
                </div>

                {/* Description */}
                {job.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Apply Now →
                  </a>
                  <button
                    onClick={() => {
                      // Could trigger save to profile
                      console.log('Save job:', job.title);
                    }}
                    className="px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Save job"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    },
  }, []);

  // A2UI Widgets
  useRenderToolCall({
    name: "show_a2ui_job_card",
    render: ({ result, status }) => {
      if (status !== "complete" || !result?.a2ui) return <A2UILoading title="Rendering A2UI..." />;
      return (
        <div className="space-y-2">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">A2UI Widget</span>
          <A2UIRenderer widget={result.a2ui} />
        </div>
      );
    },
  }, []);

  useRenderToolCall({
    name: "show_a2ui_stats_widget",
    render: ({ result, status }) => {
      if (status !== "complete" || !result?.a2ui) return <A2UILoading title="Rendering A2UI..." />;
      return (
        <div className="space-y-2">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">A2UI Widget</span>
          <A2UIRenderer widget={result.a2ui} />
        </div>
      );
    },
  }, []);

  // 3D Force Graph - User's Interest Graph
  useRenderToolCall({
    name: "show_user_graph",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ForceGraphLoading title="Building your interest graph..." />;
      return (
        <div className="space-y-2">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">3D Interest Graph</span>
          <ForceGraph3DComponent data={result} height={400} />
        </div>
      );
    },
  }, []);

  // Ambient Scene - Dynamic background (no UI needed, just state sync)
  useRenderToolCall({
    name: "set_ambient_scene",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <></>;
      // The background updates via state.scene, just show a subtle confirmation
      return (
        <div className="text-xs text-gray-500 italic">
          Background updated to {result.query}
        </div>
      );
    },
  }, []);

  // Human-in-the-Loop: Job Interest Confirmation
  // When the agent finds a job the user might like, they can confirm/reject
  useHumanInTheLoop({
    name: "confirm_job_interest",
    description: "Ask user to confirm interest in a specific job",
    parameters: [
      { name: "job_id", type: "string", description: "The job ID", required: true },
      { name: "job_title", type: "string", description: "The job title", required: true },
      { name: "company", type: "string", description: "The company name", required: true },
      { name: "location", type: "string", description: "The job location", required: false },
    ],
    render: ({ args, respond, status, result }) => {
      if (status === "executing" && respond) {
        return (
          <div className="p-4 bg-white rounded-lg shadow-lg border border-indigo-100 max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                Human-in-the-Loop
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Interested in this role?</h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-gray-800">{args.job_title}</p>
              <p className="text-sm text-gray-600">{args.company}</p>
              {args.location && <p className="text-sm text-gray-500">{args.location}</p>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  respond({ confirmed: true, job_id: args.job_id });
                  // Refresh profile graph after HITL confirmation
                  setTimeout(() => refreshProfile(), 500);
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Yes, save it
              </button>
              <button
                onClick={() => {
                  respond({ confirmed: false, job_id: args.job_id });
                  // Also refresh on rejection to update preferences
                  setTimeout(() => refreshProfile(), 500);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        );
      }

      if (status === "complete" && result) {
        return (
          <div className="p-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
            {result.confirmed ? "Added to your saved jobs" : "Skipped"}
          </div>
        );
      }

      return <></>;
    },
  });

  // Human-in-the-Loop: Company Confirmation
  // When user mentions a company, confirm and get job title
  const [companyJobTitle, setCompanyJobTitle] = useState("");
  useHumanInTheLoop({
    name: "confirm_company",
    description: "Confirm user's company and get their job title",
    parameters: [
      { name: "company_name", type: "string", description: "The company name", required: true },
      { name: "company_url", type: "string", description: "Company website URL", required: false },
      { name: "user_id", type: "string", description: "User ID", required: true },
    ],
    render: ({ args, respond, status, result }) => {
      if (status === "executing" && respond) {
        return (
          <div className="p-4 bg-white rounded-lg shadow-lg border border-orange-100 max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                Confirm Company
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">You worked at {args.company_name}?</h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-gray-800">{args.company_name}</p>
              {args.company_url && (
                <a
                  href={args.company_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {args.company_url}
                </a>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Your job title there:</label>
              <input
                type="text"
                value={companyJobTitle}
                onChange={(e) => setCompanyJobTitle(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onKeyUp={(e) => e.stopPropagation()}
                placeholder="e.g., CTO, VP Engineering, Director"
                autoComplete="off"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  // Save to Neon
                  try {
                    await fetch('/api/user-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: args.user_id,
                        itemType: 'company',
                        value: args.company_name,
                        confirmed: true,
                        metadata: {
                          company_url: args.company_url,
                          job_title: companyJobTitle || 'Not specified',
                        }
                      })
                    });
                  } catch (e) {
                    console.error('Failed to save company:', e);
                  }
                  respond({ confirmed: true, company: args.company_name, job_title: companyJobTitle });
                  setCompanyJobTitle("");
                  setTimeout(() => refreshProfile(), 500);
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Yes, confirm
              </button>
              <button
                onClick={() => {
                  respond({ confirmed: false, company: args.company_name });
                  setCompanyJobTitle("");
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Not this company
              </button>
            </div>
          </div>
        );
      }

      if (status === "complete" && result) {
        return (
          <div className="p-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
            {result.confirmed ? `Added ${result.company} to your profile` : "Skipped"}
          </div>
        );
      }

      return <></>;
    },
  });

  // Fetch profile items for instructions
  const [profileItems, setProfileItems] = useState<{location?: string; role?: string; skills?: string[]; companies?: string[]}>({});

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/user-profile?userId=${user.id}`);
        const data = await res.json();
        const items = data.items || [];

        // Group by type
        const grouped: typeof profileItems = {};
        items.forEach((item: { item_type: string; value: string }) => {
          if (item.item_type === 'location') grouped.location = item.value;
          if (item.item_type === 'role_preference') grouped.role = item.value;
          if (item.item_type === 'skill') {
            if (!grouped.skills) grouped.skills = [];
            grouped.skills.push(item.value);
          }
          if (item.item_type === 'company') {
            if (!grouped.companies) grouped.companies = [];
            grouped.companies.push(item.value);
          }
        });
        setProfileItems(grouped);
      } catch (e) {
        console.error('Failed to fetch profile for instructions:', e);
      }
    };

    fetchProfile();
  }, [user?.id, profileRefreshTrigger]);

  // Build instructions with FULL user context including profile items AND page context
  const agentInstructions = user
    ? `CRITICAL USER CONTEXT:
- User Name: ${firstName || user.name}
- User ID: ${user.id}
- User Email: ${user.email}
- Location: ${profileItems.location || 'Not set'}
- Target Role: ${profileItems.role || 'Not set'}
- Skills: ${profileItems.skills?.join(', ') || 'None saved'}
- Companies: ${profileItems.companies?.join(', ') || 'None saved'}

PAGE CONTEXT:
- Current Page: ${pageContext}
- URL Path: ${pathname}

When user asks about their profile, skills, companies, location, etc., use the above info.
When they ask about messages, use their User ID for database lookups.
When they mention "jobs here" or "on this page", reference the current page context.
If they're on a specific role page (CTO, CFO, etc.), assume they're interested in that role type.
Always greet them as ${firstName || user.name} and be friendly.`
    : `PAGE CONTEXT:
- Current Page: ${pageContext}
- URL Path: ${pathname}

This user is not logged in. Encourage them to sign in for personalized recommendations.
Reference the page context when discussing jobs.`;

  return (
    <CopilotSidebar
      disableSystemMessage={true}
      clickOutsideToClose={false}
      instructions={agentInstructions}
      labels={{
        title: "Fractional AI",
        initial: firstName ? `Hey ${firstName}! Ask me about fractional executive jobs, salaries, or market trends.` : "Welcome! Use voice or text to explore jobs, charts, and A2UI widgets.",
      }}
      suggestions={suggestions}
    >
      <div
        className="min-h-screen flex justify-center items-center flex-col transition-colors duration-300 p-8 relative"
      >
        {/* Dynamic Unsplash Background */}
        <DynamicBackground scene={state.scene} />

        {/* Auth Header with Messages Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          {/* Show loading state while session is being checked */}
          {isSessionLoading ? (
            <div className="bg-white/20 text-white/60 px-4 py-2 rounded-lg backdrop-blur animate-pulse">
              Loading...
            </div>
          ) : (
            <>
              <SignedOut>
                <button
                  onClick={() => window.location.href = '/auth/sign-in'}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur transition-colors"
                >
                  Sign In
                </button>
              </SignedOut>
              <SignedIn>
            {/* Messages button with badge - clicks to open sidebar and ask about messages */}
            <button
              onClick={() => {
                // Send a message to CopilotKit to read messages
                appendMessage(new TextMessage({ content: "Read my messages", role: Role.User }));
              }}
              className="relative bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg backdrop-blur transition-colors"
              title="Messages - Click to read"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <MessagesBadge userId={user?.id} />
            </button>
            <a
              href="/dashboard"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur transition-colors"
            >
              Dashboard
            </a>
                <UserButton />
              </SignedIn>
            </>
          )}
        </div>

        {/* Main Content - Graph + Voice */}
        <div className="flex flex-col items-center gap-6">
          {/* Greeting */}
          <h1 className="text-3xl font-bold text-white drop-shadow-lg text-center">
            {firstName ? `Hey ${firstName}!` : 'Welcome'}
          </h1>

          {/* User Profile Section - Edit and view profile data */}
          {isSessionLoading ? (
            <div className="w-full max-w-md bg-black/40 backdrop-blur-md rounded-xl p-6 animate-pulse">
              <div className="h-32 bg-white/10 rounded-lg" />
            </div>
          ) : (
            <>
              <SignedIn>
                <div className="w-full max-w-md">
                  <UserProfileSection
                    userId={user?.id}
                    userName={firstName || undefined}
                    refreshTrigger={profileRefreshTrigger}
                    onProfileUpdate={refreshProfile}
                  />
                </div>
              </SignedIn>

              {/* Not signed in - prompt */}
              <SignedOut>
                <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 text-center border border-white/10 max-w-sm">
                  <p className="text-white/80 mb-4">Sign in to see your profile graph</p>
                  <button
                    onClick={() => window.location.href = '/auth/sign-in'}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              </SignedOut>
            </>
          )}

          {/* Voice Input Button */}
          <div className="flex flex-col items-center gap-2">
            {isSessionLoading ? (
              <div className="w-20 h-20 rounded-full bg-white/20 animate-pulse flex items-center justify-center">
                <span className="text-white/60 text-xs">...</span>
              </div>
            ) : (
              <VoiceInput onMessage={handleVoiceMessage} firstName={firstName} userId={user?.id} />
            )}
            <p className="text-white/60 text-sm">{isSessionLoading ? 'Loading...' : 'Tap to speak'}</p>
          </div>

          {/* Tech stack badges */}
          <div className="flex gap-2 justify-center flex-wrap max-w-md">
            <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">Hume</span>
            <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">CopilotKit</span>
            <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">Pydantic AI</span>
            <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">Zep</span>
            <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">Neon</span>
          </div>
        </div>
      </div>
    </CopilotSidebar>
  );
}
