"use client";

import { useCallback, useEffect, useState } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { useCoAgent, useCopilotChat } from "@copilotkit/react-core";
import { CopilotSidebar, CopilotKitCSSProperties } from "@copilotkit/react-ui";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import { authClient } from "@/lib/auth/client";
import { VoiceInput } from "@/components/voice-input";
import { FAQ, FAQItem } from "@/components/seo";
import { WebPageSchema, FAQPageSchema } from "@/components/seo";
import { HireProcessStepper } from "@/components/HireProcessStepper";

// FAQ items for the page
const faqItems: FAQItem[] = [
  {
    question: 'How long does it take to hire a fractional CMO?',
    answer: 'Typically 2-4 weeks from first conversations to start date. This includes: defining requirements (1-3 days), sourcing candidates (3-7 days), interviews (1-2 weeks), and onboarding (1 week). Much faster than the 3-6 months required for full-time CMO recruitment.',
  },
  {
    question: 'Where can I find fractional CMOs to hire?',
    answer: 'Five main sources: (1) Fractional executive job boards like Fractional.Quest with pre-vetted candidates, (2) LinkedIn using hashtags like #FractionalCMO or #PortfolioCMO, (3) Fractional executive networks and agencies, (4) Referrals from VCs, founders, or other fractional executives, (5) Marketing communities and Slack groups.',
  },
  {
    question: 'What should I look for when hiring a fractional CMO?',
    answer: 'Five key criteria: (1) Relevant experience scaling companies at your stage and in your industry, (2) Channel expertise matching your needs (PLG, demand gen, brand, etc.), (3) Proven track record with measurable results, (4) Team leadership and hiring experience, (5) Cultural fit and ability to work fractionally with your team.',
  },
  {
    question: 'How much does it cost to hire a fractional CMO?',
    answer: 'Day rates range from £700-£1,400 depending on experience. Most engagements are 1-2 days per week (£3,000-£5,500/month retainer) or 2-3 days per week (£70,000-£140,000 annually). This is 40-60% cheaper than full-time CMOs who cost £150,000-£250,000+ with benefits and equity.',
  },
  {
    question: 'What contract terms should I use?',
    answer: 'Start with a 3-month trial period with 30 days notice either side. After the trial, extend to 12-month rolling contracts. Key terms: day rate or monthly retainer, expected days per week, notice period (30 days standard), IP ownership (company owns all work), confidentiality, and scope of responsibilities.',
  },
  {
    question: 'Can I convert a fractional CMO to full-time later?',
    answer: 'Yes, many companies do this as they scale. Common transition points: Series B fundraising, hitting £5M-£10M ARR, or when marketing team grows beyond 10 people. Discuss this upfront—most fractional CMOs are open to conversion if the timing and equity package make sense.',
  },
];

// Sourcing channels
const sourcingChannels = [
  {
    channel: 'Fractional Job Boards',
    description: 'Platforms like Fractional.Quest with pre-vetted fractional executives actively looking for engagements.',
    pros: 'Pre-screened candidates, fast matching, transparent rates',
    bestFor: 'Companies wanting quality candidates quickly',
    icon: '🎯',
  },
  {
    channel: 'LinkedIn Search',
    description: 'Search for CMOs using hashtags #FractionalCMO, #PortfolioCMO, or "Fractional CMO" in titles.',
    pros: 'Large pool, direct outreach, can research background',
    bestFor: 'Companies with time to source and screen',
    icon: '💼',
  },
  {
    channel: 'Fractional Executive Networks',
    description: 'Agencies and networks (Exec, Bolster, Chief) that match companies with fractional executives.',
    pros: 'Curated matches, support through process, quality guarantee',
    bestFor: 'Companies wanting managed recruitment',
    icon: '🤝',
  },
  {
    channel: 'VC & Founder Referrals',
    description: 'Ask your investors, advisors, or founder network who they\'ve used or heard of.',
    pros: 'Trusted recommendations, proven track records',
    bestFor: 'Seed to Series B startups with strong networks',
    icon: '🌟',
  },
  {
    channel: 'Marketing Communities',
    description: 'Slack groups (Marketing Ops, GTM), Pavilion, or industry-specific communities.',
    pros: 'Active practitioners, can observe expertise publicly',
    bestFor: 'Finding niche specialists (PLG, B2B SaaS, etc.)',
    icon: '👥',
  },
  {
    channel: 'Fractional CMO Events',
    description: 'Attend SaaStr, GTM conferences, or fractional executive meetups.',
    pros: 'Meet in person, assess cultural fit, network effect',
    bestFor: 'Companies attending conferences anyway',
    icon: '🎤',
  },
];

// Evaluation criteria
const evaluationCriteria = [
  {
    criteria: 'Relevant Industry & Stage Experience',
    description: 'Have they scaled companies at your stage? A CMO who took a Series D company from £50M to £200M won\'t know how to build 0-to-1 demand gen at a pre-seed startup. Look for experience scaling companies from £1M to £10M ARR if that\'s where you are.',
    lookFor: 'Portfolio of 3-5 similar companies, measurable growth metrics, knowledge of your GTM motion',
    redFlag: 'Only worked at big brands or only at tiny startups (if you\'re mid-market)',
  },
  {
    criteria: 'Channel & Tactical Expertise',
    description: 'Do they know the channels that matter for your business? A brand marketing expert won\'t help you build PLG or performance marketing. Ensure their channel expertise matches your needs.',
    lookFor: 'Deep knowledge of 2-3 core channels, proven ability to drive pipeline/revenue, hands-on execution experience',
    redFlag: 'Generalist who hasn\'t specialized in any channel or GTM motion',
  },
  {
    criteria: 'Proven Track Record with Data',
    description: 'Can they articulate measurable results? Great fractional CMOs talk in numbers: "Reduced CAC from £4.2k to £1.8k," "Scaled MQLs from 100 to 450/month," "Drove £2.4M incremental pipeline." Vague claims like "improved brand awareness" are red flags.',
    lookFor: 'Specific metrics (CAC, LTV, pipeline, conversion rates), before/after results, attribution modeling experience',
    redFlag: 'Can\'t cite specific numbers or only talks about activities, not outcomes',
  },
  {
    criteria: 'Team Leadership Experience',
    description: 'Have they built and led marketing teams? A fractional CMO needs to hire, mentor, and manage people—not just execute tactics themselves. They should have hired at least 5-10 marketers and managed teams of 3-15 people.',
    lookFor: 'Built teams from scratch, hiring process expertise, coaching/mentorship stories, structured 1-on-1s',
    redFlag: 'Never managed people or only managed 1-2 direct reports',
  },
  {
    criteria: 'Strategic Thinking & Decision-Making',
    description: 'Can they make hard prioritization calls? Great CMOs say "no" to good ideas because better ones exist. They should be able to build a strategy, allocate budgets, and justify decisions with data and logic.',
    lookFor: 'Clear POV on what won\'t work, frameworks for prioritization, comfort with ambiguity',
    redFlag: 'Says "yes" to everything or can\'t explain why they\'d prioritize X over Y',
  },
  {
    criteria: 'Fractional Working Model Fit',
    description: 'Do they know how to work fractionally? This requires discipline, clear communication, and asynchronous collaboration. Ask how they manage multiple clients, stay organized, and make impact in 2 days/week.',
    lookFor: 'Works with 2-4 companies currently, systems for time management, clear communication cadence',
    redFlag: 'First fractional engagement or working with 6+ companies (spread too thin)',
  },
];

export default function HireFractionalCMOPage() {
  // Auth
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] || null;

  // Agent state
  const { state, setState } = useCoAgent<{
    user?: { id: string; name: string; email: string };
  }>({
    name: "my_agent",
    initialState: {},
  });

  // Sync user to agent state
  useEffect(() => {
    if (user && !state?.user) {
      setState((prev) => ({
        ...prev,
        user: {
          id: user.id,
          name: user.name || "",
          email: user.email || "",
        },
      }));
    }
  }, [user?.id, state?.user, setState]);

  // Chat integration
  const { appendMessage } = useCopilotChat();

  // Handle voice messages
  const handleVoiceMessage = useCallback(
    (text: string, role: "user" | "assistant" = "user") => {
      console.log(`🎤 Voice (${role}):`, text.slice(0, 100));

      // Store to Zep for memory
      if (user?.id && text.length > 5) {
        fetch('/api/zep-store', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            role: role,
            content: text,
            metadata: { page: 'hire-fractional-cmo', hiringGuide: true }
          }),
        }).catch(e => console.warn('Failed to store to Zep:', e));
      }

      const messageRole = role === "user" ? Role.User : Role.Assistant;
      appendMessage(new TextMessage({ content: text, role: messageRole }));
    },
    [appendMessage, user?.id]
  );

  // Dynamic suggestions
  const suggestions = [
    {
      title: "Where to find CMOs",
      message: "Where can I find fractional CMOs to hire?",
    },
    {
      title: "Interview questions",
      message: "What questions should I ask when interviewing a fractional CMO?",
    },
    {
      title: "Pricing & costs",
      message: "How much does a fractional CMO cost?",
    },
  ];

  return (
    <main
      style={{ "--copilot-kit-primary-color": "#2563eb" } as CopilotKitCSSProperties}
    >
      {/* Schema Markup */}
      <WebPageSchema
        title="Hire a Fractional CMO UK 2025"
        description="How to hire a fractional CMO. Where to find them, interview questions, red flags, contract terms."
        url="https://fractional.quest/hire-fractional-cmo"
        dateModified={new Date('2025-01-07T00:00:00Z')}
      />
      <FAQPageSchema faqs={faqItems} />

      <CopilotSidebar
        instructions={`## PAGE CONTEXT (for agent parsing)
Page Type: hiring_guide
Page URL: /hire-fractional-cmo
Role Type: CMO
Service: Fractional CMO Hiring Guide

## Hiring Guide Context: Fractional CMO

You're helping someone learn how to hire a fractional CMO.
IMPORTANT: This is a HIRING GUIDE page, not a services page. Focus on:

**What's on this page:**
- Where to find fractional CMOs (6 sourcing channels)
- What to look for when evaluating candidates (6 criteria)
- Interview questions to ask (4 categories)
- Hiring process timeline (2-4 weeks)
- Contract terms and structure

**Key facts:**
- Day rates: £700-£1,400
- Typical engagement: 1-2 days per week
- Timeline: 2-4 weeks to hire
- Trial period: 3 months standard
- Notice: 30 days standard

**Your approach:**
1. Help companies understand the hiring process
2. Explain what makes a good fractional CMO
3. Share interview questions and red flags
4. Guide them to browse candidates or post a role
5. When asked what page you're on, say "Fractional CMO Hiring Guide"`}
        labels={{
          title: "CMO Hiring Guide",
          initial: firstName
            ? `Hi ${firstName}! 👋 I can help you understand how to hire a fractional CMO. Ask me about sourcing candidates, interview questions, or what to look for in a great CMO.`
            : `Welcome! 👋 This guide covers everything about hiring a fractional CMO. Ask me anything about the process, costs, or what makes a great candidate.`,
        }}
        suggestions={suggestions}
        clickOutsideToClose={false}
      >
        <div className="min-h-screen bg-white">
          {/* Hero */}
          <section className="bg-gradient-to-br from-blue-600 to-blue-500 py-24">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <Link href="/fractional-cmo" className="text-blue-100 hover:text-white mb-8 inline-flex items-center text-sm">
                <span className="mr-2">←</span> Back to Fractional CMO Guide
              </Link>
              <div className="max-w-4xl">
                <span className="inline-block bg-white text-blue-600 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] mb-6">
                  Hiring Guide
                </span>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">
                  Hire a<br />
                  <span className="text-blue-200">Fractional CMO</span>
                </h1>
                <p className="text-2xl md:text-3xl text-blue-50 leading-relaxed font-light mb-10">
                  Complete guide to finding, vetting, and hiring the perfect fractional Chief Marketing Officer for your business.
                </p>

                {/* Stats */}
                <div className="flex flex-wrap gap-10 mb-12">
                  <div>
                    <div className="text-5xl font-black text-white">2-4 Weeks</div>
                    <div className="text-blue-100 text-sm uppercase tracking-wider mt-1">To Hire</div>
                  </div>
                  <div>
                    <div className="text-5xl font-black text-white">90 Days</div>
                    <div className="text-blue-100 text-sm uppercase tracking-wider mt-1">To Impact</div>
                  </div>
                  <div>
                    <div className="text-5xl font-black text-white">100+</div>
                    <div className="text-blue-100 text-sm uppercase tracking-wider mt-1">Candidates</div>
                  </div>
                </div>

                {/* Voice Widget + CTAs */}
                <div className="flex flex-wrap items-center gap-4">
                  <VoiceInput
                    onMessage={handleVoiceMessage}
                    firstName={firstName}
                    userId={user?.id}
                    pageContext={{
                      pageType: 'hiring_guide',
                      roleType: 'CMO',
                      pageH1: 'Hire a Fractional CMO',
                      pageUrl: '/hire-fractional-cmo',
                      pageDescription: 'Complete guide to finding, vetting, and hiring the perfect fractional CMO',
                    }}
                  />
                  <Link href="/fractional-cmo-jobs-uk" className="px-8 py-4 bg-white text-blue-600 font-bold uppercase tracking-wider hover:bg-blue-50 transition-colors">
                    Browse CMO Candidates
                  </Link>
                  <Link href="#process" className="px-8 py-4 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-blue-600 transition-colors">
                    See Hiring Process
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Stats */}
          <section className="bg-gray-50 border-b">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-4xl font-black text-blue-600 mb-2">5-10</div>
                  <div className="text-gray-600 text-sm">Candidates to Interview</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-blue-600 mb-2">3-6 Months</div>
                  <div className="text-gray-600 text-sm">Minimum Engagement</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-blue-600 mb-2">£700-1.4k</div>
                  <div className="text-gray-600 text-sm">Day Rate Range</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-blue-600 mb-2">30 Days</div>
                  <div className="text-gray-600 text-sm">Standard Notice</div>
                </div>
              </div>
            </div>
          </section>

          {/* Where to Find Fractional CMOs */}
          <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <div className="mb-16 text-center max-w-3xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Sourcing</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Where to Find Fractional CMOs</h2>
                <p className="text-xl text-gray-600">
                  Five proven channels for finding pre-vetted, experienced fractional marketing leaders.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sourcingChannels.map((source, index) => (
                  <div key={index} className="bg-gray-50 p-8 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">{source.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{source.channel}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{source.description}</p>
                    <div className="mb-3">
                      <div className="text-xs font-bold text-gray-500 uppercase mb-1">Pros:</div>
                      <div className="text-sm text-gray-700">{source.pros}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase mb-1">Best For:</div>
                      <div className="text-sm text-blue-600">{source.bestFor}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 bg-blue-50 border-2 border-blue-200 p-8 rounded-lg">
                <p className="text-lg text-gray-900">
                  <strong>Pro Tip:</strong> Use multiple channels in parallel. Post on job boards while asking for referrals.
                  The best fractional CMOs are often working with 2-3 companies and may not be actively looking—referrals help
                  you reach them.
                </p>
              </div>
            </div>
          </section>

          {/* What to Look For */}
          <section className="py-24 bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Evaluation Criteria</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">What to Look For in a Fractional CMO</h2>
                <p className="text-xl text-gray-600 max-w-3xl">
                  Not all experienced marketers make good fractional CMOs. Here's what separates the best from the rest.
                </p>
              </div>

              <div className="space-y-8">
                {evaluationCriteria.map((item, index) => (
                  <div key={index} className="bg-white p-10 border-l-4 border-blue-500 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{index + 1}. {item.criteria}</h3>
                    <p className="text-gray-700 leading-relaxed mb-6">{item.description}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
                          <span className="text-lg">✅</span> Look For
                        </div>
                        <p className="text-sm text-gray-700">{item.lookFor}</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                        <div className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                          <span className="text-lg">🚩</span> Red Flag
                        </div>
                        <p className="text-sm text-gray-700">{item.redFlag}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Interview Questions */}
          <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Interview Guide</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Interview Questions to Ask</h2>
                <p className="text-xl text-gray-600 max-w-3xl">
                  These questions separate strategic CMOs from tactical marketers. Use them to assess expertise, results, and fit.
                </p>
              </div>

              <div className="space-y-8">
                <div className="bg-blue-50 border-2 border-blue-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">🎯 Strategy & Experience Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"Walk me through how you scaled marketing at [Company X]. What was the before/after?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Specific metrics, challenges overcome, tactical decisions made, timeline</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"If you joined us tomorrow, what would your first 30 days look like?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Audit process, stakeholder interviews, quick wins, strategic framework</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"How do you prioritize marketing channels when you have limited budget?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Framework for prioritization, comfort saying "no," ICP/buyer journey thinking</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"Tell me about a strategy pivot you made mid-execution. What changed and why?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Data-driven decision-making, comfort with failure, clear reasoning</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">📊 Metrics & Performance Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"What marketing KPIs do you track religiously? How do you define success?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Revenue metrics (not vanity), leading vs lagging indicators, attribution models</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"How do you approach proving marketing ROI to the CFO or board?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Multi-touch attribution, incrementality testing, clear reporting frameworks</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"What CAC and LTV:CAC ratios are healthy for a business like ours?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Benchmarks for your stage/model, understanding of unit economics</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"Tell me about a campaign that underperformed. How did you diagnose and fix it?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Analytical rigor, comfort with failure, iteration speed</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50 border-2 border-purple-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">👥 Team & Leadership Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"How would you structure our marketing team? What roles would you hire first?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Alignment with strategy, clear hiring roadmap, build vs buy decisions</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"How do you balance managing agencies vs building in-house capabilities?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Agency management experience, clear rationale for outsourcing decisions</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"Tell me about a time you coached an underperforming marketer to success."</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Mentorship approach, feedback frameworks, patience and empathy</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"How do you stay effective working 2 days/week vs embedded full-time?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Async communication, clear frameworks, delegation and trust</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">🔍 Fit & Working Model Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"How many companies are you currently working with? How do you manage your time?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: 2-4 companies ideal, clear systems, calendar management</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"What would success look like for you in the first 90 days here?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Realistic expectations, clear milestones, alignment with your goals</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"What red flags would make you walk away from this engagement?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Self-awareness, cultural values, partnership mindset</span>
                    </li>
                    <li className="text-gray-700">
                      <strong className="text-gray-900">"Are you open to converting to full-time if we scale significantly?"</strong><br/>
                      <span className="text-sm text-gray-600">Listen for: Flexibility, transparency about preferences, long-term thinking</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Hiring Process */}
          <section id="process" className="py-24 bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-12 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Process</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">The Fractional CMO Hiring Process</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  From first conversation to start date in 2-4 weeks. Here's the proven process.
                </p>
              </div>

              <HireProcessStepper accentColor="blue" />

              <div className="mt-16 bg-blue-50 border-2 border-blue-200 p-10 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Timeline Breakdown</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Week 1: Define & Source</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Define requirements and budget (Day 1-2)</li>
                      <li>• Post on job boards, ask for referrals (Day 2-3)</li>
                      <li>• Review candidates, shortlist 5-10 (Day 4-7)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Week 2-3: Interview & Select</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• First-round interviews (30-min calls)</li>
                      <li>• Second round with case study or deep dive</li>
                      <li>• Reference checks (2-3 calls)</li>
                      <li>• Make offer and negotiate terms</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Week 4: Onboard & Start</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Contract signing and admin setup</li>
                      <li>• Share context docs, logins, calendars</li>
                      <li>• First week: stakeholder interviews</li>
                      <li>• Begin audit and strategy work</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">First 90 Days: Deliver</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Month 1: Audit, strategy, quick wins</li>
                      <li>• Month 2: Build systems, launch campaigns</li>
                      <li>• Month 3: Scale, hire, measure results</li>
                      <li>• Decide to extend or part ways</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contract Terms */}
          <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Contracts</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Contract Terms & Structure</h2>
                <p className="text-xl text-gray-600 max-w-3xl">
                  Standard terms for fractional CMO engagements. Adapt based on your needs and the candidate's preferences.
                </p>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 p-10 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mt-0 mb-6">Standard Contract Template</h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Engagement Model</h4>
                    <ul className="text-gray-700 space-y-1 text-base">
                      <li><strong>Day rate:</strong> £700-£1,400 per day (based on experience)</li>
                      <li><strong>Commitment:</strong> 1-3 days per week (specify exact days)</li>
                      <li><strong>Monthly retainer option:</strong> £3,000-£5,500 for predictable billing</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Term & Notice</h4>
                    <ul className="text-gray-700 space-y-1 text-base">
                      <li><strong>Initial term:</strong> 3-month trial period</li>
                      <li><strong>Renewal:</strong> Auto-renew to 12-month rolling contract after trial</li>
                      <li><strong>Notice period:</strong> 30 days either side (standard)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Scope of Work</h4>
                    <ul className="text-gray-700 space-y-1 text-base">
                      <li><strong>Responsibilities:</strong> Marketing strategy, team leadership, budget management, performance reporting</li>
                      <li><strong>Deliverables:</strong> Monthly strategy reviews, quarterly OKRs, weekly async updates</li>
                      <li><strong>Exclusions:</strong> Hands-on execution (unless scoped separately), attending all meetings</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">IP & Confidentiality</h4>
                    <ul className="text-gray-700 space-y-1 text-base">
                      <li><strong>IP ownership:</strong> Company owns all work product</li>
                      <li><strong>Confidentiality:</strong> Standard NDA terms, survives termination</li>
                      <li><strong>Non-compete:</strong> Usually not applicable (fractional works with multiple companies)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Payment Terms</h4>
                    <ul className="text-gray-700 space-y-1 text-base">
                      <li><strong>Invoicing:</strong> Monthly in arrears or bi-weekly</li>
                      <li><strong>Payment terms:</strong> Net 15 or Net 30</li>
                      <li><strong>Expenses:</strong> Pre-approved expenses reimbursed separately</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Optional: Equity</h4>
                    <ul className="text-gray-700 space-y-1 text-base">
                      <li><strong>Advisory shares:</strong> 0.1-0.25% for long-term engagements (12+ months)</li>
                      <li><strong>Vesting:</strong> Quarterly or annual vesting</li>
                      <li><strong>Cash reduction:</strong> If equity included, day rate may reduce 10-15%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="py-20 bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 lg:px-8">
              <h2 className="text-3xl font-black text-gray-900 mb-8">Frequently Asked Questions</h2>
              <FAQ items={faqItems} title="" skipSchema={true} />
            </div>
          </section>

          {/* CTA */}
          <section className="py-20 bg-blue-600 text-white">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Ready to Hire?
              </h2>
              <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Browse 100+ pre-vetted fractional CMO candidates on Fractional.Quest. Post your role and start interviews this week.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/fractional-cmo-jobs-uk" className="px-10 py-5 bg-white text-blue-600 font-bold uppercase tracking-wider hover:bg-blue-50 transition-colors">
                  Browse CMO Candidates
                </Link>
                <Link href="/contact" className="px-10 py-5 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-blue-600 transition-colors">
                  Post Your Role
                </Link>
              </div>
            </div>
          </section>

          {/* Related Links */}
          <section className="py-12 bg-white border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Related Resources</span>
                <div className="flex flex-wrap gap-4">
                  <Link href="/fractional-cmo" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                    Fractional CMO Guide
                  </Link>
                  <Link href="/fractional-cmo-cost" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                    CMO Cost Guide
                  </Link>
                  <Link href="/fractional-cmo-services" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                    CMO Services
                  </Link>
                  <Link href="/fractional-cmo-salary" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
                    CMO Salary Data
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </CopilotSidebar>
    </main>
  );
}
