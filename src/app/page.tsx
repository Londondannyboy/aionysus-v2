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
import { AgentState } from "@/lib/types";
import { useCoAgent, useRenderToolCall, useCopilotChat, useHumanInTheLoop } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import { useState, useCallback, useMemo, useEffect } from "react";
import { UserButton, SignedIn, SignedOut } from "@neondatabase/neon-js/auth/react/ui";
import { authClient } from "@/lib/auth/client";

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

  // Sync user to agent state when session changes (run once when user loads)
  useEffect(() => {
    console.log("🔄 User sync effect - user:", user?.name, "state.user:", state.user);
    if (user && !state.user) {
      console.log("🔄 Setting user state:", { firstName, name: user.name, email: user.email });
      setState(prev => ({
        jobs: prev?.jobs ?? [],
        search_query: prev?.search_query ?? "",
        user: {
          id: user.id,
          name: user.name,
          firstName: firstName || undefined,
          email: user.email,
        }
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Dynamic suggestions based on context
  const suggestions = useDynamicSuggestions(state, lastQuery);

  // CopilotKit chat hook for voice integration
  const { appendMessage } = useCopilotChat();

  // Handle voice input → send to CopilotKit with correct role
  // Now receives FULL transcript (no more 200 char truncation!)
  const handleVoiceMessage = useCallback((text: string, role: "user" | "assistant" = "user") => {
    console.log(`🎤 Voice (${role}):`, text.slice(0, 100) + (text.length > 100 ? '...' : ''));

    // Only track user queries for suggestions
    if (role === "user") {
      setLastQuery(text);
    }

    // Store message to Zep for memory (fire-and-forget, don't block)
    if (user?.id && text.length > 5) {
      fetch('/api/zep-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          role: role,
          content: text,
        }),
      }).catch(e => console.warn('Failed to store to Zep:', e));
    }

    // Send with correct role so Pydantic AI gets full conversation context
    const messageRole = role === "user" ? Role.User : Role.Assistant;
    appendMessage(new TextMessage({ content: text, role: messageRole }));
  }, [appendMessage, setLastQuery, user?.id]);

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

  // Search Jobs - Render multiple job cards in chat
  useRenderToolCall({
    name: "search_jobs",
    render: ({ result, status }) => {
      if (status !== "complete" || !result) return <ChartLoading title="Searching jobs..." />;

      const jobs = result.jobs || [];
      if (jobs.length === 0) {
        return (
          <div className="p-4 bg-gray-50 rounded-lg text-gray-600">
            No jobs found for "{result.query}"
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">{result.title}</h3>
          <div className="grid gap-3">
            {jobs.map((job: { title: string; company: string; location: string; salary: string; description: string; url: string }, i: number) => (
              <div key={i} className="p-4 bg-white rounded-lg shadow border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{job.title}</h4>
                    <p className="text-sm text-gray-600">{job.company}</p>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">{job.location}</span>
                </div>
                <p className="text-sm text-gray-500 mb-2">{job.salary}</p>
                {job.description && <p className="text-sm text-gray-600 mb-3">{job.description}</p>}
                <div className="flex gap-2">
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition-colors"
                  >
                    Apply Now
                  </a>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
                  >
                    View Details
                  </a>
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
                onClick={() => respond({ confirmed: true, job_id: args.job_id })}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Yes, save it
              </button>
              <button
                onClick={() => respond({ confirmed: false, job_id: args.job_id })}
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

  return (
    <CopilotSidebar
      disableSystemMessage={true}
      clickOutsideToClose={false}
      instructions={firstName ? `IMPORTANT: The user's name is ${firstName}. Always greet them personally by name and be friendly.` : undefined}
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

        {/* Auth Header */}
        <div className="absolute top-4 right-4 flex items-center gap-3">
          <SignedOut>
            <button
              onClick={() => window.location.href = '/auth/sign-in'}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur transition-colors"
            >
              Sign In
            </button>
          </SignedOut>
          <SignedIn>
            <a
              href="/profile"
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur transition-colors"
            >
              Profile
            </a>
            <UserButton />
          </SignedIn>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {firstName ? `Hey ${firstName}!` : 'Fractional Executive Platform'}
          </h1>
          <p className="text-white/80 text-lg mb-4">
            {firstName ? 'What can I help you find today?' : 'Voice + Chat powered by the full stack'}
          </p>
          <div className="flex gap-2 justify-center flex-wrap mb-6">
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur">Hume Voice</span>
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur">CopilotKit</span>
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur">AG-UI</span>
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur">A2UI</span>
            <span className="text-xs bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur">Neon DB</span>
            <span className="text-xs bg-purple-500/40 text-white px-3 py-1 rounded-full backdrop-blur">Zep Memory</span>
            <span className="text-xs bg-indigo-500/40 text-white px-3 py-1 rounded-full backdrop-blur">3D Graph</span>
          </div>

          {/* Voice Input Button */}
          <div className="flex flex-col items-center gap-2 mb-6">
            {isSessionLoading ? (
              <div className="w-16 h-16 rounded-full bg-white/20 animate-pulse flex items-center justify-center">
                <span className="text-white/60 text-xs">...</span>
              </div>
            ) : (
              <VoiceInput onMessage={handleVoiceMessage} firstName={firstName} userId={user?.id} />
            )}
            <p className="text-white/60 text-sm">{isSessionLoading ? 'Loading...' : 'Tap to speak'}</p>
          </div>
        </div>

        <JobsCard state={state} />

        {/* Architecture diagram */}
        <div className="mt-8 text-center text-white/50 text-xs max-w-md">
          <p className="font-mono">
            Voice (Hume) → CopilotKit → AG-UI → Pydantic Agent → Neon DB → A2UI/Charts
          </p>
        </div>
      </div>
    </CopilotSidebar>
  );
}
