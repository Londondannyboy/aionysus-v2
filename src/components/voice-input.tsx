"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";

interface PageContext {
  location?: string;
  totalJobs?: number;
  topRoles?: string[];
  // Page type for context
  pageType?: 'jobs' | 'services' | 'hiring_guide' | 'guide' | 'salary' | 'home';
  roleType?: string;  // CMO, CTO, CFO, COO for role-specific pages
  // Rich page context (for clarity)
  pageH1?: string;      // The main H1 headline of the page
  pageUrl?: string;     // The URL path e.g., "/hire-fractional-cmo"
  pageDescription?: string;  // Brief description of what the page is about
}

interface VoiceButtonProps {
  onMessage: (text: string, role?: "user" | "assistant") => void;
  firstName?: string | null;
  userId?: string | null;  // For stable session ID
  pageContext?: PageContext;  // Context about current page
}

// Session storage keys for persistence across remounts
const SESSION_GREETED_KEY = 'hume_greeted_session';
const SESSION_LAST_INTERACTION_KEY = 'hume_last_interaction';

// Helper to get/set session storage safely (SSR-safe)
function getSessionValue(key: string, defaultValue: number | boolean): number | boolean {
  if (typeof window === 'undefined') return defaultValue;
  const stored = sessionStorage.getItem(key);
  if (stored === null) return defaultValue;
  return key.includes('time') ? parseInt(stored, 10) : stored === 'true';
}

function setSessionValue(key: string, value: number | boolean): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(key, String(value));
}

// Inner component using voice hook
function VoiceButton({ onMessage, firstName, userId, pageContext }: VoiceButtonProps) {
  const { connect, disconnect, status, messages, error, sendUserInput } = useVoice();
  const [isPending, setIsPending] = useState(false);
  const lastSentMsgId = useRef<string | null>(null);

  // Use sessionStorage-backed refs for persistence across remounts
  const greetedThisSession = useRef(getSessionValue(SESSION_GREETED_KEY, false) as boolean);
  const lastInteractionTime = useRef(getSessionValue(SESSION_LAST_INTERACTION_KEY, 0) as number);

  // Debug logging
  useEffect(() => {
    console.log("🔊 Voice status:", status.value, error);
  }, [status, error]);

  // Forward BOTH user AND assistant messages to CopilotKit for full context
  useEffect(() => {
    // Get all conversation messages (user + assistant)
    const conversationMsgs = messages.filter(
      (m: any) => (m.type === "user_message" || m.type === "assistant_message") && m.message?.content
    );

    if (conversationMsgs.length > 0) {
      const lastMsg = conversationMsgs[conversationMsgs.length - 1] as any;
      const msgId = lastMsg?.id || `${conversationMsgs.length}-${lastMsg?.message?.content?.slice(0, 20)}`;

      // Only send if this is a new message we haven't sent before
      if (lastMsg?.message?.content && msgId !== lastSentMsgId.current) {
        const isUser = lastMsg.type === "user_message";
        console.log(`🎤 Forwarding ${isUser ? 'user' : 'assistant'} to CopilotKit:`, lastMsg.message.content.slice(0, 50));
        lastSentMsgId.current = msgId;

        // Forward FULL content to CopilotKit with role indicator
        // This fixes the truncation issue - Pydantic AI now sees complete voice transcript
        onMessage(lastMsg.message.content, isUser ? "user" : "assistant");
      }
    }
  }, [messages, onMessage]);

  const handleToggle = useCallback(async () => {
    if (status.value === "connected") {
      // Track disconnect time for returning user detection - persist to sessionStorage
      const now = Date.now();
      lastInteractionTime.current = now;
      setSessionValue(SESSION_LAST_INTERACTION_KEY, now);
      disconnect();
    } else {
      setIsPending(true);
      try {
        console.log("🎤 Fetching Hume token...");
        const res = await fetch("/api/hume-token");
        const { accessToken } = await res.json();

        // Fetch Zep context if user is logged in
        let zepContext = "";
        if (userId) {
          try {
            const zepRes = await fetch(`/api/zep-context?userId=${userId}`);
            const zepData = await zepRes.json();
            if (zepData.context) {
              zepContext = zepData.context;
              console.log("🧠 Zep context loaded:", zepData.facts?.length || 0, "facts");
            }
          } catch (e) {
            console.warn("Failed to fetch Zep context:", e);
          }
        }

        // Detect if this is a quick reconnect (< 5 mins)
        const timeSinceLastInteraction = lastInteractionTime.current > 0
          ? Date.now() - lastInteractionTime.current
          : Infinity;
        const isQuickReconnect = timeSinceLastInteraction < 5 * 60 * 1000; // 5 minutes
        const wasGreeted = greetedThisSession.current;

        // Build system prompt with STRONG anti-re-greeting logic
        let greetingInstruction = "";
        if (wasGreeted || isQuickReconnect) {
          greetingInstruction = `⚠️ CRITICAL - DO NOT GREET:
This user has ALREADY been greeted in this session.
- DO NOT say "Hi ${firstName}", "Hello", "Hey there", or any greeting
- DO NOT introduce yourself
- DO NOT say "lovely to meet you" or "nice to meet you"
- Simply continue the conversation naturally
- If you must acknowledge them, just say "I'm here" or "What's next?"
Previous greeting was ${Math.round(timeSinceLastInteraction / 1000)}s ago - they're the SAME person, same session.`;
        } else {
          greetingInstruction = firstName
            ? `This is the FIRST connection. Greet once: "Hi ${firstName}!" - but NEVER re-greet after this.`
            : `This is the FIRST connection. Give a brief warm greeting - but NEVER re-greet after this.`;
        }

        // Build page context section - different for jobs vs services pages
        let pageContextSection = "";
        if (pageContext?.pageType === 'services' && pageContext?.roleType) {
          // SERVICES PAGE context - include H1 and description if available
          const h1 = pageContext.pageH1 || `Hire a Fractional ${pageContext.roleType}`;
          const url = pageContext.pageUrl || `/hire-fractional-${pageContext.roleType.toLowerCase()}`;
          const desc = pageContext.pageDescription || `Strategic ${pageContext.roleType} leadership without the full-time commitment.`;

          pageContextSection = `
PAGE_CONTEXT: SERVICES PAGE
=== CRITICAL: YOU MUST KNOW THIS PAGE ===
Page URL: ${url}
Page H1: "${h1}"
Page Description: "${desc}"
Page Type: Fractional ${pageContext.roleType} Services Page

This is NOT a job listings page - it's our SERVICES/SALES page explaining:
- What a Fractional ${pageContext.roleType} does
- Our pricing tiers (Starter £3k, Growth £6k, Scale £9k per month)
- How the engagement process works (Discovery → Proposal → Strategy → Partnership)

Your role here is CONSULTATIVE:
- Help them understand if Fractional ${pageContext.roleType} is right for their company
- Explain pricing when asked
- Answer questions about the process
- Guide interested visitors toward booking a discovery call

When they ask "what page is this" or "where am I", you MUST say:
"We're on the ${h1} services page at ${url}."
DO NOT say "main page" or "jobs page" - we are on ${h1}.
`;
        } else if (pageContext?.location) {
          // JOBS PAGE context
          pageContextSection = `
PAGE_CONTEXT: JOBS PAGE
User is viewing: ${pageContext.location.toUpperCase()} JOBS PAGE
${pageContext.totalJobs ? `- Total jobs on page: ${pageContext.totalJobs}` : ''}
${pageContext.topRoles?.length ? `- Top roles: ${pageContext.topRoles.join(', ')}` : ''}

When the user says "jobs here", "these roles", "this area" - they mean ${pageContext.location}.
When they ask to "show more" - search for more ${pageContext.location} jobs.
Greet them mentioning ${pageContext.location}: "I see you're exploring ${pageContext.location} roles!"
`;
        }

        const systemPrompt = `## YOUR ROLE
You are the VOICE INTERFACE for a fractional executive jobs platform.
Your job is to have natural conversations and help users explore jobs.

## USER PROFILE
${firstName ? `Name: ${firstName}` : 'Guest user'}
${zepContext ? `\n### What I Remember About ${firstName || 'You'}:\n${zepContext}\n` : '\n### No prior history - this is their first visit.\n'}

${pageContextSection}

## GREETING RULES
${greetingInstruction}

## CRITICAL CONTEXT AWARENESS
${pageContext?.pageType === 'services' && pageContext?.roleType ? `
🎯 USER IS ON THE "HIRE A FRACTIONAL ${pageContext.roleType.toUpperCase()}" SERVICES PAGE
- This is NOT a job listings page - it's our services/sales page
- Help them understand Fractional ${pageContext.roleType} value proposition
- Be ready to explain pricing: Starter £3k, Growth £6k, Scale £9k per month
- When asked "what page" say: "Hire a Fractional ${pageContext.roleType} services page"
` : pageContext?.location ? `
🎯 USER IS ON THE ${pageContext.location.toUpperCase()} JOBS PAGE
- When they say "jobs here", "these roles", "what's available" → ${pageContext.location} jobs
- Total jobs on this page: ${pageContext.totalJobs || 'checking...'}
- Top roles: ${pageContext.topRoles?.join(', ') || 'various C-suite'}
- Always mention "${pageContext.location}" when discussing jobs
` : '- User is on the main page'}

## BEHAVIOR GUIDELINES
1. Reference the PAGE CONTEXT above - they're on a specific location page!
2. Reference their ZEP MEMORY if available - mention their past interests
3. Be specific: "I see ${pageContext?.totalJobs || 'several'} roles here in ${pageContext?.location || 'the UK'}..."
4. When they express interest ("I like CTO", "that looks good"), confirm and remember it
5. Use emojis sparingly: 🔥 for hot roles, 💰 for salary, 📍 for location
6. Keep responses SHORT for voice - 1-2 sentences max unless they ask for details

## ONBOARDING (if no Zep memory)
If this is their first visit, gently ask about:
- What role type interests them? (CTO, CFO, CMO, etc.)
- Preferred location? (London, Remote, etc.)
- Experience level?
Then confirm: "So you're interested in [role] in [location] - I'll remember that!"
`;

        // Use stable session ID based on user ID
        const stableSessionId = userId
          ? `fractional_${userId}`
          : `fractional_anon_${Math.random().toString(36).slice(2, 10)}`;

        // Include page context in session ID for CLM (format: "firstName|sessionId|location:X,jobs:Y" or "firstName|sessionId|services:CMO")
        let pageContextPart = '';
        if (pageContext?.pageType === 'services' && pageContext?.roleType) {
          // Services page: pass role type
          pageContextPart = `|services:${pageContext.roleType}`;
        } else if (pageContext?.location) {
          // Jobs page: pass location and job count
          const parts = [`location:${pageContext.location}`];
          if (pageContext.totalJobs) parts.push(`jobs:${pageContext.totalJobs}`);
          pageContextPart = `|${parts.join(',')}`;
        }

        const customSessionId = firstName
          ? `${firstName}|${stableSessionId}${pageContextPart}`
          : `|${stableSessionId}${pageContextPart}`;

        console.log("🎤 Got token, connecting with configId and user context:", firstName || 'anonymous');
        console.log("🎤 Session ID:", customSessionId);
        console.log("🎤 Quick reconnect?", isQuickReconnect, "Was greeted?", wasGreeted);
        await connect({
          auth: { type: "accessToken", value: accessToken },
          configId: "acb5575c-e22f-44c0-a9c8-b03305d1ea92",
          sessionSettings: {
            type: "session_settings",
            systemPrompt: systemPrompt,
            customSessionId: customSessionId,
          }
        });
        console.log("🎤 Connect call completed");

        // Mark that we've greeted this session (only trigger greeting on FIRST connection)
        if (!wasGreeted && !isQuickReconnect && firstName) {
          setTimeout(() => {
            console.log("🎤 FIRST connection - triggering greeting for:", firstName);
            greetedThisSession.current = true;
            setSessionValue(SESSION_GREETED_KEY, true);
            sendUserInput(`Hello, my name is ${firstName}`);
          }, 500);
        } else {
          // RECONNECTION - do NOT send any input, just mark as greeted
          console.log("🎤 RECONNECTION detected - NOT re-greeting. wasGreeted:", wasGreeted, "quickReconnect:", isQuickReconnect);
          greetedThisSession.current = true;
          setSessionValue(SESSION_GREETED_KEY, true);
          // Don't call sendUserInput at all!
        }
      } catch (e) {
        console.error("Voice connect error:", e);
      } finally {
        setIsPending(false);
      }
    }
  }, [connect, disconnect, status.value, firstName, userId, sendUserInput]);

  const isConnected = status.value === "connected";

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
        isConnected
          ? "bg-red-500 hover:bg-red-600 animate-pulse"
          : isPending
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700"
      }`}
      title={isConnected ? "Stop listening" : "Start voice input"}
    >
      {isPending ? (
        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isConnected ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10h6v4H9z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          )}
        </svg>
      )}
    </button>
  );
}

// Stable callbacks to prevent VoiceProvider remounting
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleVoiceError = (err: any) => console.error("🔴 Hume Error:", err?.message || err);
const handleVoiceOpen = () => console.log("🟢 Hume connected");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleVoiceClose = (e: any) => console.log("🟡 Hume closed:", e?.code, e?.reason);

// Exported component with VoiceProvider - memoized to prevent remounting
export function VoiceInput({ onMessage, firstName, userId, pageContext }: {
  onMessage: (text: string, role?: "user" | "assistant") => void;
  firstName?: string | null;
  userId?: string | null;
  pageContext?: PageContext;
}) {
  // Memoize the button to prevent unnecessary re-renders
  const voiceButton = useCallback(() => (
    <VoiceButton onMessage={onMessage} firstName={firstName} userId={userId} pageContext={pageContext} />
  ), [onMessage, firstName, userId, pageContext]);

  return (
    <VoiceProvider
      onError={handleVoiceError}
      onOpen={handleVoiceOpen}
      onClose={handleVoiceClose}
    >
      {voiceButton()}
    </VoiceProvider>
  );
}
