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
import dynamic from "next/dynamic";

// Dynamic import for editable 3D graph (same as dashboard - works!)
const EditableGraph3D = dynamic(
  () => import("@/components/EditableGraph3D").then(mod => mod.EditableGraph3D),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-900 flex items-center justify-center"><div className="text-white">Loading graph...</div></div> }
);
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
                      // Trigger job assessment flow via chat
                      appendMessage(new TextMessage({
                        content: `Assess my fit for the "${job.title}" job at ${job.company}`,
                        role: Role.User
                      }));
                    }}
                    className="px-3 py-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Assess match & save"
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

  // Job Match Assessment - AG-UI Card with Recruiter
  useRenderToolCall({
    name: "assess_job_match",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Assessing match..." />;
      if (result.error) return <div className="text-red-500 text-sm p-2">{result.error}</div>;

      const { job, assessment, skills, recruiter } = result;
      const isHotMatch = assessment.match_percentage >= 90 && recruiter;
      const matchColor = assessment.match_percentage >= 90 ? "text-orange-500" :
                        assessment.match_percentage >= 80 ? "text-green-500" :
                        assessment.match_percentage >= 60 ? "text-yellow-500" :
                        assessment.match_percentage >= 40 ? "text-orange-500" : "text-red-500";
      const bgColor = isHotMatch ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300" :
                      assessment.match_percentage >= 80 ? "bg-green-50 border-green-200" :
                      assessment.match_percentage >= 60 ? "bg-yellow-50 border-yellow-200" :
                      assessment.match_percentage >= 40 ? "bg-orange-50 border-orange-200" : "bg-red-50 border-red-200";

      return (
        <div className={`p-4 rounded-xl border-2 ${bgColor} max-w-md`}>
          {/* Hot Match Badge */}
          {isHotMatch && (
            <div className="mb-3 flex items-center gap-2">
              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                🔥 HOT MATCH - Active Recruitment
              </span>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900">{job.title}</h3>
              <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
            </div>
            <div className={`text-3xl font-bold ${matchColor}`}>
              {assessment.icon} {assessment.match_percentage}%
            </div>
          </div>

          {/* Match Bar */}
          <div className="h-3 bg-gray-200 rounded-full mb-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isHotMatch ? "bg-gradient-to-r from-orange-500 to-amber-500" :
                assessment.match_percentage >= 80 ? "bg-green-500" :
                assessment.match_percentage >= 60 ? "bg-yellow-500" :
                assessment.match_percentage >= 40 ? "bg-orange-500" : "bg-red-500"
              }`}
              style={{ width: `${assessment.match_percentage}%` }}
            />
          </div>

          {/* Message */}
          <p className="text-sm text-gray-700 mb-3">{assessment.message}</p>

          {/* Recruiter Card - Only for 90%+ matches */}
          {recruiter && (
            <div className="mb-4 p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
              <p className="text-xs text-orange-600 font-semibold mb-2">👤 Your Recruiter Contact</p>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{recruiter.name}</p>
                <p className="text-sm text-gray-600">{recruiter.title} @ {recruiter.company}</p>
                {recruiter.email && (
                  <p className="text-sm">
                    <a href={`mailto:${recruiter.email}`} className="text-blue-600 hover:underline">
                      {recruiter.email}
                    </a>
                  </p>
                )}
                {recruiter.phone && (
                  <p className="text-sm">
                    <a href={`tel:${recruiter.phone}`} className="text-blue-600 hover:underline">
                      {recruiter.phone}
                    </a>
                  </p>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                {recruiter.email && (
                  <a
                    href={`mailto:${recruiter.email}?subject=Interest in ${job.title} role&body=Hi ${recruiter.name},%0D%0A%0D%0AI scored ${assessment.match_percentage}% on your ${job.title} position at ${job.company} and would love to discuss the opportunity.%0D%0A%0D%0ABest regards`}
                    className="flex-1 text-center px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    📧 Email {recruiter.name.split(' ')[0]}
                  </a>
                )}
                {recruiter.calendly_url && (
                  <a
                    href={recruiter.calendly_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    📅 Book Call
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          <div className="space-y-2">
            {skills.matching.length > 0 && (
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">✓ Matching Skills</p>
                <div className="flex flex-wrap gap-1">
                  {skills.matching.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {skills.missing.length > 0 && (
              <div>
                <p className="text-xs font-medium text-red-700 mb-1">✗ Missing Skills</p>
                <div className="flex flex-wrap gap-1">
                  {skills.missing.map((s: string) => (
                    <span key={s} className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action hint */}
          {!recruiter && skills.missing.length > 0 && (
            <p className="text-xs text-gray-500 mt-3 italic">
              💡 Tip: Add missing skills to your profile to improve your match!
            </p>
          )}
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

  // Human-in-the-Loop: Skill Confirmation with Validation
  // Common validated skills list
  const VALIDATED_SKILLS = new Set([
    // Programming
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    // Frameworks
    "React", "Vue", "Angular", "Next.js", "Node.js", "Django", "Flask", "Spring", "Rails",
    // Data
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Kafka",
    // Cloud/DevOps
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD",
    // AI/ML
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch",
    // Business
    "Product Management", "Project Management", "Agile", "Scrum", "Leadership", "Strategy",
    "Marketing", "Sales", "Finance", "Operations", "HR", "Legal",
    // Executive
    "M&A", "IPO", "Board Management", "P&L Management", "Fundraising", "Investor Relations",
    "Digital Transformation", "Change Management", "Turnaround", "Scaling",
  ]);

  const normalizeSkill = (skill: string): string => {
    const lower = skill.toLowerCase().trim();
    // Find match in validated skills (case-insensitive)
    for (const valid of VALIDATED_SKILLS) {
      if (valid.toLowerCase() === lower) return valid;
    }
    // Return title case for unvalidated
    return skill.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  useHumanInTheLoop({
    name: "confirm_skill",
    description: "Confirm user's skill with validation",
    parameters: [
      { name: "skill_name", type: "string", description: "The skill to add", required: true },
      { name: "user_id", type: "string", description: "User ID", required: true },
    ],
    render: ({ args, respond, status, result }) => {
      const normalizedSkill = normalizeSkill(args.skill_name || "");
      const isValidated = VALIDATED_SKILLS.has(normalizedSkill);

      if (status === "executing" && respond) {
        return (
          <div className="p-4 bg-white rounded-lg shadow-lg border border-amber-100 max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                isValidated ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
              }`}>
                {isValidated ? "✓ Validated Skill" : "⚠ Custom Skill"}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Add "{normalizedSkill}" to your skills?
            </h3>
            {!isValidated && (
              <p className="text-sm text-amber-600 mb-3">
                This skill isn't in our standard list. It will be added as a custom skill.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/user-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: args.user_id,
                        itemType: 'skill',
                        value: normalizedSkill,
                        confirmed: true,
                        metadata: {
                          validated: isValidated,
                          original_input: args.skill_name,
                          source: 'voice_confirmed',
                        }
                      })
                    });
                  } catch (e) {
                    console.error('Failed to save skill:', e);
                  }
                  respond({ confirmed: true, skill: normalizedSkill, validated: isValidated });
                  setTimeout(() => refreshProfile(), 500);
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors text-white ${
                  isValidated ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
                Yes, add skill
              </button>
              <button
                onClick={() => respond({ confirmed: false, skill: args.skill_name })}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      }

      if (status === "complete" && result) {
        return (
          <div className="p-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
            {result.confirmed
              ? `Added ${result.skill} ${result.validated ? '✓' : '(custom)'}`
              : "Skipped"
            }
          </div>
        );
      }

      return <></>;
    },
  });

  // Human-in-the-Loop: Location Change Confirmation
  // When user wants to change location, confirm the change
  useHumanInTheLoop({
    name: "confirm_location",
    description: "Confirm user's location change",
    parameters: [
      { name: "new_location", type: "string", description: "The new location", required: true },
      { name: "current_location", type: "string", description: "Current location (if any)", required: false },
      { name: "user_id", type: "string", description: "User ID", required: true },
    ],
    render: ({ args, respond, status, result }) => {
      if (status === "executing" && respond) {
        const isChange = args.current_location && args.current_location !== args.new_location;
        return (
          <div className="p-4 bg-white rounded-lg shadow-lg border border-emerald-100 max-w-md">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                📍 Location
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {isChange
                ? `Change location from ${args.current_location} to ${args.new_location}?`
                : `Set your location to ${args.new_location}?`
              }
            </h3>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    // Delete old location first if changing
                    if (isChange) {
                      const existing = fullProfileItems.find(i => i.item_type === 'location');
                      if (existing) {
                        await fetch(`/api/user-profile?id=${existing.id}&userId=${args.user_id}`, { method: 'DELETE' });
                      }
                    }
                    await fetch('/api/user-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: args.user_id,
                        itemType: 'location',
                        value: args.new_location,
                        confirmed: true,
                        metadata: { source: 'voice_confirmed' }
                      })
                    });
                  } catch (e) {
                    console.error('Failed to save location:', e);
                  }
                  respond({ confirmed: true, location: args.new_location });
                  setTimeout(() => refreshProfile(), 300);
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Yes, confirm
              </button>
              <button
                onClick={() => respond({ confirmed: false })}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      }

      if (status === "complete" && result) {
        return (
          <div className="p-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
            {result.confirmed ? `Location set to ${result.location}` : "Cancelled"}
          </div>
        );
      }

      return <></>;
    },
  });

  // Human-in-the-Loop: Trinity Confirmation (Core Onboarding)
  // This is the FIRST thing we need to know - why is the user here?
  const TRINITY_OPTIONS = [
    {
      value: 'job_search',
      label: '🎯 Job Search',
      description: "I'm looking for a new fractional executive role",
      color: 'indigo'
    },
    {
      value: 'coaching',
      label: '🧭 Career Coaching',
      description: "I want guidance on my career direction and positioning",
      color: 'purple'
    },
    {
      value: 'lifestyle_change',
      label: '🌴 Lifestyle Change',
      description: "I'm seeking flexibility - remote work, relocation, or work-life balance",
      color: 'emerald'
    },
    {
      value: 'just_curious',
      label: '👀 Just Curious',
      description: "I'm exploring what's out there - no immediate plans",
      color: 'gray'
    },
  ];

  useHumanInTheLoop({
    name: "confirm_trinity",
    description: "Confirm user's primary purpose for using the platform",
    parameters: [
      { name: "user_id", type: "string", description: "User ID", required: true },
      { name: "suggested_trinity", type: "string", description: "Agent's suggested Trinity based on conversation", required: false },
    ],
    render: ({ args, respond, status, result }) => {
      if (status === "executing" && respond) {
        return (
          <div className="p-5 bg-white rounded-xl shadow-xl border border-indigo-100 max-w-lg">
            <div className="mb-4">
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                🔮 YOUR TRINITY
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              What brings you to Fractional Quest?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This helps us personalize your experience and connect you with the right opportunities.
            </p>

            <div className="space-y-3">
              {TRINITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={async () => {
                    // Save Trinity to profile
                    try {
                      await fetch('/api/user-profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: args.user_id,
                          itemType: 'trinity',
                          value: option.value,
                          confirmed: true,
                          metadata: {
                            label: option.label,
                            description: option.description,
                            confirmed_at: new Date().toISOString()
                          }
                        })
                      });
                    } catch (e) {
                      console.error('Failed to save Trinity:', e);
                    }
                    respond({ confirmed: true, trinity: option.value, label: option.label });
                    setTimeout(() => refreshProfile(), 500);
                  }}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all hover:shadow-md ${
                    args.suggested_trinity === option.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                  {args.suggested_trinity === option.value && (
                    <div className="text-xs text-indigo-600 mt-2 font-medium">✨ Suggested based on our conversation</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      }

      if (status === "complete" && result) {
        return (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
            <p className="text-sm text-indigo-800">
              <span className="font-semibold">Trinity confirmed:</span> {result.label}
            </p>
            <p className="text-xs text-indigo-600 mt-1">
              Your experience is now personalized to your goals.
            </p>
          </div>
        );
      }

      return <></>;
    },
  });

  // Human-in-the-Loop: Employment Status (Stage 1 Repo)
  const EMPLOYMENT_STATUS_OPTIONS = [
    { value: 'employed', label: '💼 Currently Employed', description: 'Working full-time or part-time' },
    { value: 'between_roles', label: '🔄 Between Roles', description: 'Recently left or finishing up' },
    { value: 'freelancing', label: '🚀 Freelancing/Consulting', description: 'Already working fractionally' },
    { value: 'founder', label: '🏗️ Founder/Entrepreneur', description: 'Running my own venture' },
  ];

  useHumanInTheLoop({
    name: "confirm_employment_status",
    description: "Confirm user's current employment status",
    parameters: [
      { name: "user_id", type: "string", description: "User ID", required: true },
    ],
    render: ({ args, respond, status, result }) => {
      if (status === "executing" && respond) {
        return (
          <div className="p-5 bg-white rounded-xl shadow-xl border border-blue-100 max-w-lg">
            <div className="mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                📋 STAGE 1 PROFILE
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              What's your current situation?
            </h3>
            <div className="space-y-2">
              {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={async () => {
                    try {
                      await fetch('/api/user-profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: args.user_id,
                          itemType: 'employment_status',
                          value: option.value,
                          confirmed: true,
                          metadata: { label: option.label }
                        })
                      });
                    } catch (e) {
                      console.error('Failed to save employment status:', e);
                    }
                    respond({ confirmed: true, status: option.value, label: option.label });
                    setTimeout(() => refreshProfile(), 500);
                  }}
                  className="w-full p-3 text-left rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="font-semibold text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        );
      }
      if (status === "complete" && result) {
        return (
          <div className="p-2 text-sm text-blue-700 bg-blue-50 rounded-lg">
            Status: {result.label}
          </div>
        );
      }
      return <></>;
    },
  });

  // Human-in-the-Loop: Professional Vertical (Stage 1 Repo)
  const VERTICAL_OPTIONS = [
    { value: 'technology', label: '💻 Technology', description: 'Software, IT, Engineering' },
    { value: 'finance', label: '💰 Finance', description: 'Banking, Investment, Accounting' },
    { value: 'marketing', label: '📣 Marketing', description: 'Brand, Growth, Digital' },
    { value: 'operations', label: '⚙️ Operations', description: 'Supply Chain, Process, Efficiency' },
    { value: 'hr_people', label: '👥 HR & People', description: 'Talent, Culture, L&D' },
    { value: 'sales', label: '🤝 Sales', description: 'Revenue, Partnerships, BD' },
    { value: 'product', label: '📦 Product', description: 'Product Management, Strategy' },
    { value: 'general_management', label: '🎯 General Management', description: 'CEO, COO, GM roles' },
  ];

  useHumanInTheLoop({
    name: "confirm_professional_vertical",
    description: "Confirm user's professional vertical/domain",
    parameters: [
      { name: "user_id", type: "string", description: "User ID", required: true },
    ],
    render: ({ args, respond, status, result }) => {
      if (status === "executing" && respond) {
        return (
          <div className="p-5 bg-white rounded-xl shadow-xl border border-purple-100 max-w-lg">
            <div className="mb-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                📋 STAGE 1 PROFILE
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              What's your professional domain?
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {VERTICAL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={async () => {
                    try {
                      await fetch('/api/user-profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: args.user_id,
                          itemType: 'professional_vertical',
                          value: option.value,
                          confirmed: true,
                          metadata: { label: option.label }
                        })
                      });
                    } catch (e) {
                      console.error('Failed to save vertical:', e);
                    }
                    respond({ confirmed: true, vertical: option.value, label: option.label });
                    setTimeout(() => refreshProfile(), 500);
                  }}
                  className="p-3 text-left rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
                >
                  <div className="font-semibold text-gray-900 text-sm">{option.label}</div>
                  <div className="text-xs text-gray-600">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        );
      }
      if (status === "complete" && result) {
        return (
          <div className="p-2 text-sm text-purple-700 bg-purple-50 rounded-lg">
            Vertical: {result.label}
          </div>
        );
      }
      return <></>;
    },
  });

  // Human-in-the-Loop: Connect with Coach (for Trinity = coaching)
  // Routes to Dan first for qualification, then to appropriate coach
  useHumanInTheLoop({
    name: "connect_with_coach",
    description: "Connect user with career coaching - routes to Dan for initial qualification",
    parameters: [
      { name: "user_id", type: "string", description: "User ID", required: true },
      { name: "context", type: "string", description: "Brief context about what they're looking for", required: false },
    ],
    render: ({ args, respond, status, result }) => {
      if (status === "executing" && respond) {
        return (
          <div className="p-5 bg-white rounded-xl shadow-xl border border-purple-200 max-w-md">
            <div className="mb-4">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                🧭 CAREER COACHING
              </span>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Let's find you the right guidance
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              I'd love to understand your situation better and connect you with the right support.
            </p>

            {/* Coach Card */}
            <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-100 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold text-lg">
                  DK
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Dan Keegan</p>
                  <p className="text-sm text-gray-600">Founder & Career Advisor</p>
                  <p className="text-sm text-purple-600">Fractional Quest</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-3 italic">
                "I help fractional executives find clarity on their next move"
              </p>
            </div>

            {args.context && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Your focus:</p>
                <p className="text-sm text-gray-700">{args.context}</p>
              </div>
            )}

            <div className="space-y-2">
              <a
                href="https://calendly.com/fractional-quest/intro"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  respond({ booked: true, method: 'calendly' });
                }}
                className="block w-full text-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                📅 Book a 30-min Intro Call
              </a>
              <a
                href="mailto:dan@fractional.quest?subject=Coaching Inquiry&body=Hi Dan,%0D%0A%0D%0AI'm exploring career coaching options.%0D%0A%0D%0ABest regards"
                onClick={() => {
                  respond({ booked: true, method: 'email' });
                }}
                className="block w-full text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                📧 Send an Email Instead
              </a>
              <button
                onClick={() => respond({ booked: false })}
                className="w-full text-center px-4 py-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        );
      }

      if (status === "complete" && result) {
        if (result.booked) {
          return (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800">
                {result.method === 'calendly'
                  ? "📅 Great! Looking forward to our conversation."
                  : "📧 Email sent! I'll get back to you soon."}
              </p>
            </div>
          );
        }
        return (
          <div className="p-2 text-sm text-gray-600 bg-gray-50 rounded-lg">
            No problem - I'm here whenever you're ready.
          </div>
        );
      }

      return <></>;
    },
  });

  // Fetch profile items for instructions AND graph
  const [profileItems, setProfileItems] = useState<{location?: string; role?: string; skills?: string[]; companies?: string[]; trinity?: string; trinityLabel?: string; employmentStatus?: string; vertical?: string}>({});
  const [fullProfileItems, setFullProfileItems] = useState<Array<{id: number; item_type: string; value: string; metadata: Record<string, unknown>; confirmed: boolean}>>([]);

  // Edit modal state (same pattern as dashboard)
  const [editingItem, setEditingItem] = useState<{id: number; item_type: string; value: string; metadata: Record<string, unknown>; confirmed: boolean} | null>(null);
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");

  
  // Graph edit handlers (same as dashboard)
  const handleGraphEdit = useCallback((item: {id: number; item_type: string; value: string; metadata: Record<string, unknown>; confirmed: boolean}) => {
    setEditingItem(item);
    setShowAddModal(item.item_type);
    setNewValue(item.value);
  }, []);

  const handleGraphDelete = useCallback(async (item: {id: number; item_type: string; value: string; metadata: Record<string, unknown>; confirmed: boolean}) => {
    if (!confirm(`Delete "${item.value}"?`)) return;
    try {
      await fetch(`/api/user-profile?id=${item.id}&userId=${user?.id}`, { method: "DELETE" });
      setFullProfileItems(prev => prev.filter(i => i.id !== item.id));
      refreshProfile();
    } catch (e) {
      console.error("Failed to delete:", e);
    }
  }, [user?.id, refreshProfile]);

  const handleGraphAdd = useCallback((type: string) => {
    setEditingItem(null);
    setShowAddModal(type);
    setNewValue("");
  }, []);

  const saveItem = async () => {
    if (!newValue.trim() || !showAddModal || !user?.id) return;
    try {
      if (editingItem) {
        // Delete old and create new
        await fetch(`/api/user-profile?id=${editingItem.id}&userId=${user.id}`, { method: "DELETE" });
      }
      await fetch("/api/user-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          itemType: showAddModal,
          value: newValue.trim(),
          metadata: { source: "homepage" },
          confirmed: false,
        }),
      });
      refreshProfile();
      setShowAddModal(null);
      setNewValue("");
      setEditingItem(null);
    } catch (e) {
      console.error("Failed to save:", e);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/user-profile?userId=${user.id}`);
        const data = await res.json();
        const items = data.items || [];

        // Store full items for graph
        setFullProfileItems(items);

        // Group by type for instructions
        const grouped: typeof profileItems = {};
        items.forEach((item: { item_type: string; value: string; metadata?: Record<string, unknown> }) => {
          if (item.item_type === 'location') grouped.location = item.value;
          if (item.item_type === 'role_preference') grouped.role = item.value;
          if (item.item_type === 'trinity') {
            grouped.trinity = item.value;
            grouped.trinityLabel = (item.metadata?.label as string) || item.value;
          }
          if (item.item_type === 'employment_status') {
            grouped.employmentStatus = (item.metadata?.label as string) || item.value;
          }
          if (item.item_type === 'professional_vertical') {
            grouped.vertical = (item.metadata?.label as string) || item.value;
          }
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
  // Stage 1 Repo completeness check
  const stage1Complete = !!(profileItems.trinity && profileItems.employmentStatus && profileItems.vertical);
  const missingStage1: string[] = [];
  if (!profileItems.trinity) missingStage1.push('Trinity (purpose)');
  if (!profileItems.employmentStatus) missingStage1.push('Employment Status');
  if (!profileItems.vertical) missingStage1.push('Professional Vertical');

  const agentInstructions = user
    ? `CRITICAL USER CONTEXT:
- User Name: ${firstName || user.name}
- User ID: ${user.id}
- User Email: ${user.email}

STAGE 1 PROFILE (${stage1Complete ? '✅ COMPLETE' : '⚠️ INCOMPLETE'}):
- Trinity: ${profileItems.trinity ? `${profileItems.trinityLabel} (${profileItems.trinity})` : 'Not set - MUST ASK FIRST!'}
- Employment Status: ${profileItems.employmentStatus || 'Not set'}
- Professional Vertical: ${profileItems.vertical || 'Not set'}
- Location: ${profileItems.location || 'Not set'}

EXTENDED PROFILE:
- Target Role: ${profileItems.role || 'Not set'}
- Skills: ${profileItems.skills?.join(', ') || 'None saved'}
- Companies: ${profileItems.companies?.join(', ') || 'None saved (add with URL for validation)'}

${!stage1Complete ? `⚠️ STAGE 1 INCOMPLETE - Missing: ${missingStage1.join(', ')}
Call these HITLs IN ORDER before showing jobs:
${!profileItems.trinity ? `1. confirm_trinity(user_id="${user.id}")` : ''}
${profileItems.trinity && !profileItems.employmentStatus ? `2. confirm_employment_status(user_id="${user.id}")` : ''}
${profileItems.trinity && profileItems.employmentStatus && !profileItems.vertical ? `3. confirm_professional_vertical(user_id="${user.id}")` : ''}
` : '✅ Stage 1 complete - ready to search jobs and match!'}

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
      <div className="h-screen flex flex-col bg-gray-900">
        {/* Single Navbar */}
        <nav className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
          {/* Left - Logo */}
          <div className="text-white font-bold text-lg">Fractional Quest</div>

          {/* Center - Add buttons (only when signed in) */}
          <div className="flex items-center gap-2">
            {user && [
              { type: 'location', label: '+ Location', color: '#10B981' },
              { type: 'role_preference', label: '+ Role', color: '#3B82F6' },
              { type: 'company', label: '+ Company', color: '#EC4899' },
              { type: 'skill', label: '+ Skill', color: '#F59E0B' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleGraphAdd(item.type)}
                className="px-2 py-1 text-xs rounded-full transition-colors hover:opacity-80"
                style={{
                  backgroundColor: `${item.color}20`,
                  color: item.color,
                  border: `1px solid ${item.color}40`,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right - Auth */}
          <div className="flex items-center gap-3">
            {isSessionLoading ? (
              <div className="text-gray-400 text-sm">...</div>
            ) : (
              <>
                <SignedOut>
                  <button
                    onClick={() => window.location.href = '/auth/sign-in'}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign In
                  </button>
                </SignedOut>
                <SignedIn>
                  <span className="text-white text-sm">{firstName || user?.name}</span>
                  <a href="/dashboard" className="text-gray-300 hover:text-white text-sm">Dashboard</a>
                  <UserButton />
                </SignedIn>
              </>
            )}
          </div>
        </nav>

        {/* Main Content - Graph + Voice */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {isSessionLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-white">Loading your universe...</div>
            </div>
          ) : user ? (
            <>
              {/* 3D Profile Graph - Takes most of screen (same component as dashboard!) */}
              <div className="flex-1 min-h-0">
                <EditableGraph3D
                  userId={user.id}
                  userName={firstName || user.name || 'You'}
                  items={fullProfileItems}
                  onEdit={handleGraphEdit}
                  onDelete={handleGraphDelete}
                  onAdd={handleGraphAdd}
                  height={typeof window !== 'undefined' ? window.innerHeight - 160 : 600}
                />
              </div>

              {/* Voice Input - Fixed at bottom */}
              <div className="shrink-0 bg-gray-800 border-t border-gray-700 px-4 py-3">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                  <VoiceInput onMessage={handleVoiceMessage} firstName={firstName} userId={user.id} />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">Talk to your AI assistant</p>
                    <p className="text-gray-400 text-xs">Ask about jobs, update your profile, or get recommendations</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Not signed in */
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900">
              <h1 className="text-4xl font-bold text-white mb-4">Your Career Universe</h1>
              <p className="text-gray-400 text-lg mb-8 text-center max-w-md">
                Sign in to visualize your professional profile in 3D
              </p>
              <button
                onClick={() => window.location.href = '/auth/sign-in'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                Sign In to Begin
              </button>
            </div>
          )}
        </div>

        {/* Edit Modal (same as dashboard) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? "Edit" : "Add"} {showAddModal.replace('_', ' ')}
              </h3>

              {showAddModal === "location" ? (
                <select
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select location...</option>
                  {["London", "Manchester", "Birmingham", "Remote", "Edinburgh", "Bristol", "Leeds"].map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              ) : showAddModal === "role_preference" ? (
                <select
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select role...</option>
                  {["CEO", "CFO", "CMO", "CTO", "COO", "CHRO", "CIO", "CISO", "CPO", "CRO", "VP", "Director"].map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder={showAddModal === "skill" ? "e.g., Python, Leadership, M&A" : "Enter value..."}
                  className="w-full p-3 border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(null);
                    setNewValue("");
                    setEditingItem(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveItem}
                  disabled={!newValue.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                >
                  {editingItem ? "Save Changes" : "Add"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CopilotSidebar>
  );
}
