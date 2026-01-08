"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { VoiceProvider, useVoice } from "@humeai/voice-react";

interface PageContext {
  // Wine region currently being discussed
  region?: string;
  wineType?: string;
  // Scene for dynamic background
  scene?: string;
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

        // Build system prompt for DIONYSUS wine sommelier
        let greetingInstruction = "";
        if (wasGreeted || isQuickReconnect) {
          greetingInstruction = `⚠️ DO NOT GREET - user already greeted this session.
Continue the conversation naturally. If you must acknowledge, say "I'm here" or "What wine shall we explore?"`;
        } else {
          greetingInstruction = firstName
            ? `First connection - greet warmly: "Welcome ${firstName}! I'm DIONYSUS, your AI sommelier."`
            : `First connection - give a warm welcome as DIONYSUS the wine sommelier.`;
        }

        // Build wine context section
        let wineContextSection = "";
        if (pageContext?.region) {
          wineContextSection = `
Currently discussing: ${pageContext.region} wines
${pageContext.wineType ? `Wine type: ${pageContext.wineType}` : ''}
`;
        }

        const systemPrompt = `## YOUR ROLE
You are DIONYSUS, an expert AI wine sommelier for Aionysus - a premium wine investment and discovery platform.
Your voice is warm, knowledgeable, and approachable. You help users discover exceptional wines.

## USER PROFILE
${firstName ? `Name: ${firstName}` : 'Guest wine enthusiast'}
${zepContext ? `\n### What I Remember About ${firstName || 'You'}:\n${zepContext}\n` : '\n### No prior history - this is their first visit.\n'}

${wineContextSection}

## GREETING RULES
${greetingInstruction}

## YOUR EXPERTISE
- Deep knowledge of wine regions: Bordeaux, Burgundy, Champagne, Tuscany, Piedmont, Rhône, Napa
- Investment-grade wines: understanding of Liv-ex scores, price appreciation, bonded storage
- Food pairings: classic and modern combinations
- Wine terminology: terroir, tannins, appellations, classifications
- Our database: 3,800+ wines from premium regions worldwide

## PHONETIC CORRECTIONS (what you might hear → what they mean)
- "bow jo lay" → Beaujolais
- "shard oh nay" → Chardonnay
- "pin oh noir" → Pinot Noir
- "bor doh" → Bordeaux
- "burr gun dee" → Burgundy
- "shah toe" → Château
- "doe main" → Domaine

## BEHAVIOR GUIDELINES
1. Be knowledgeable but not pretentious - make wine accessible
2. Reference their ZEP MEMORY if available - mention wines they've liked before
3. For investment queries, mention scores, 5-year returns, storage options (bonded vs private cellar)
4. Keep responses SHORT for voice - 1-2 sentences unless they ask for details
5. Use wine emoji sparingly: 🍷 🍇 🥂
6. Suggest tools when relevant: "Would you like me to show you investment wines?" or "Shall I calculate ROI on that?"

## TOOLS YOU CAN SUGGEST
- search_wines: Find wines by region, type, price, grape variety
- get_investment_wines: Show top investment-grade wines with scores
- show_investment_chart: Display price trends over time
- calculate_wine_roi: Calculate return on investment including storage costs
- build_portfolio: Build a diversified wine investment portfolio
- get_food_pairings: Suggest food pairings for wines
`;

        // Use stable session ID based on user ID
        const stableSessionId = userId
          ? `aionysus_${userId}`
          : `aionysus_anon_${Math.random().toString(36).slice(2, 10)}`;

        const customSessionId = firstName
          ? `${firstName}|${stableSessionId}`
          : `|${stableSessionId}`;

        // Get config ID from environment or use default
        const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID || "29cec14d-5272-4a79-820d-382dc0d0e801";

        console.log("🍷 Got token, connecting DIONYSUS with user:", firstName || 'anonymous');
        console.log("🍷 Session ID:", customSessionId);
        console.log("🍷 Config ID:", configId);
        await connect({
          auth: { type: "accessToken", value: accessToken },
          configId: configId,
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
