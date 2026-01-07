"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useCoAgent, useCopilotChat } from "@copilotkit/react-core";
import { CopilotSidebar, CopilotKitCSSProperties } from "@copilotkit/react-ui";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import { authClient } from "@/lib/auth/client";
import { VoiceInput } from "@/components/voice-input";
import { FAQ, FAQItem } from "@/components/seo";
import { WebPageSchema, FAQPageSchema } from "@/components/seo";
import { HireProcessStepper } from "@/components/HireProcessStepper";

const faqItems: FAQItem[] = [
  {
    question: 'How long does it take to hire a fractional CTO?',
    answer: 'Typically 2-4 weeks from first conversations to start date. This includes: defining requirements (1-3 days), sourcing candidates (3-7 days), interviews (1-2 weeks), and onboarding (1 week). Much faster than the 3-6 months required for full-time CTO recruitment.',
  },
  {
    question: 'Where can I find fractional CTOs to hire?',
    answer: 'Five main sources: (1) Fractional executive job boards like Fractional.Quest with pre-vetted candidates, (2) LinkedIn using hashtags like #FractionalCTO or #PortfolioCTO, (3) Fractional executive networks and agencies, (4) Referrals from VCs, founders, or other fractional executives, (5) Tech communities and Slack groups.',
  },
  {
    question: 'What should I look for when hiring a fractional CTO?',
    answer: 'Five key criteria: (1) Relevant experience scaling companies at your stage and with your tech stack, (2) Architecture expertise matching your needs (cloud, AI/ML, security, etc.), (3) Proven track record building and leading engineering teams, (4) Experience with similar company stages (seed, Series A, etc.), (5) Cultural fit and ability to work fractionally with your team.',
  },
  {
    question: 'How much does it cost to hire a fractional CTO?',
    answer: 'Day rates range from £900-£1,600 depending on experience. Most engagements are 1-2 days per week (£4,000-£6,500/month retainer) or 2-3 days per week (£90,000-£160,000 annually). This is 40-60% cheaper than full-time CTOs who cost £180,000-£300,000+ with benefits and equity.',
  },
  {
    question: 'What contract terms should I use?',
    answer: 'Start with a 3-month trial period with 30 days notice either side. After the trial, extend to 12-month rolling contracts. Key terms: day rate or monthly retainer, expected days per week, notice period (30 days standard), IP ownership (company owns all work), confidentiality, and scope of responsibilities.',
  },
  {
    question: 'Can I convert a fractional CTO to full-time later?',
    answer: 'Yes, many companies do this as they scale. Common transition points: Series B fundraising, hitting £5M-£10M ARR, or when engineering team grows beyond 15 people. Discuss this upfront—most fractional CTOs are open to conversion if the timing and equity package make sense.',
  },
];

const sourcingChannels = [
  { channel: 'Fractional Job Boards', description: 'Platforms like Fractional.Quest with pre-vetted fractional executives actively looking for engagements.', pros: 'Pre-screened candidates, fast matching, transparent rates', bestFor: 'Companies wanting quality candidates quickly', icon: '🎯' },
  { channel: 'LinkedIn Search', description: 'Search for CTOs using hashtags #FractionalCTO, #PortfolioCTO, or "Fractional CTO" in titles.', pros: 'Large pool, direct outreach, can research background', bestFor: 'Companies with time to source and screen', icon: '💼' },
  { channel: 'Fractional Executive Networks', description: 'Agencies and networks that match companies with fractional technology leaders.', pros: 'Curated matches, support through process, quality guarantee', bestFor: 'Companies wanting managed recruitment', icon: '🤝' },
  { channel: 'VC & Founder Referrals', description: "Ask your investors, advisors, or founder network who they've used or heard of.", pros: 'Trusted recommendations, proven track records', bestFor: 'Seed to Series B startups with strong networks', icon: '🌟' },
  { channel: 'Tech Communities', description: 'Slack groups (CTO Craft, Engineering Leadership), tech meetups, or Stack Overflow.', pros: 'Active practitioners, can observe technical expertise', bestFor: 'Finding specialists in specific tech stacks', icon: '👥' },
  { channel: 'Tech Conferences', description: 'Attend QCon, DevOps conferences, or engineering leadership events.', pros: 'Meet in person, assess cultural fit, network effect', bestFor: 'Companies attending conferences anyway', icon: '🎤' },
];

const evaluationCriteria = [
  { criteria: 'Relevant Tech Stack Experience', description: "Have they built systems with your tech stack? A CTO experienced with enterprise Java won't be ideal for a Python/React startup. Look for experience with similar architectures, cloud platforms, and development methodologies.", lookFor: 'Portfolio of similar tech stacks, architecture decisions at your scale, knowledge of modern dev practices', redFlag: 'Only worked with legacy systems or completely different tech paradigms' },
  { criteria: 'Company Stage Experience', description: "Have they scaled engineering at your stage? A CTO from a 500-person company won't know how to prioritize at a 5-person startup. Look for experience at companies 1-2 stages ahead of you.", lookFor: 'Built teams from scratch, scaled from 5 to 50 engineers, experience at Series A/B companies', redFlag: 'Only worked at large enterprises or never scaled a team past 10 people' },
  { criteria: 'Architecture & System Design', description: 'Can they design scalable, maintainable systems? Great fractional CTOs can whiteboard architecture, explain trade-offs, and make decisions about build vs buy, monolith vs microservices, and tech debt.', lookFor: 'Clear architecture thinking, can explain past decisions and trade-offs, pragmatic about technology choices', redFlag: "Dogmatic about specific technologies or can't explain architectural decisions" },
  { criteria: 'Team Leadership & Hiring', description: 'Have they built and led engineering teams? A fractional CTO needs to hire, mentor, and manage people—not just write code. They should have hired at least 10-20 engineers and managed teams of 5-20 people.', lookFor: 'Built teams from scratch, hiring process expertise, coaching/mentorship stories, structured engineering culture', redFlag: 'Never managed people or prefers to code alone' },
  { criteria: 'Business & Product Alignment', description: 'Can they translate business needs to technology strategy? Great CTOs understand product roadmaps, revenue models, and can prioritize features that matter. They should speak business language.', lookFor: 'Experience with product teams, can explain how tech decisions impact revenue, prioritization frameworks', redFlag: 'Purely technical mindset, dismissive of business constraints' },
  { criteria: 'Fractional Working Model Fit', description: 'Do they know how to work fractionally? This requires discipline, clear communication, and asynchronous collaboration. Ask how they manage multiple clients, stay organized, and make impact in 2 days/week.', lookFor: 'Works with 2-4 companies currently, systems for time management, clear communication cadence', redFlag: 'First fractional engagement or working with 6+ companies (spread too thin)' },
];

export default function HireFractionalCTOPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] || null;

  const { state, setState } = useCoAgent<{ user?: { id: string; name: string; email: string } }>({ name: "my_agent", initialState: {} });

  useEffect(() => {
    if (user && !state?.user) {
      setState((prev) => ({ ...prev, user: { id: user.id, name: user.name || "", email: user.email || "" } }));
    }
  }, [user?.id, state?.user, setState]);

  const { appendMessage } = useCopilotChat();

  const handleVoiceMessage = useCallback((text: string, role: "user" | "assistant" = "user") => {
    if (user?.id && text.length > 5) {
      fetch('/api/zep-store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, role, content: text, metadata: { page: 'hire-fractional-cto', hiringGuide: true } }) }).catch(() => {});
    }
    appendMessage(new TextMessage({ content: text, role: role === "user" ? Role.User : Role.Assistant }));
  }, [appendMessage, user?.id]);

  const suggestions = [
    { title: "Where to find CTOs", message: "Where can I find fractional CTOs to hire?" },
    { title: "Interview questions", message: "What questions should I ask when interviewing a fractional CTO?" },
    { title: "Pricing & costs", message: "How much does a fractional CTO cost?" },
  ];

  return (
    <main style={{ "--copilot-kit-primary-color": "#0284c7" } as CopilotKitCSSProperties}>
      <WebPageSchema title="Hire a Fractional CTO UK 2025" description="How to hire a fractional CTO. Where to find them, interview questions, red flags, contract terms." url="https://fractional.quest/hire-fractional-cto" dateModified={new Date('2025-01-07T00:00:00Z')} />
      <FAQPageSchema faqs={faqItems} />

      <CopilotSidebar
        instructions={`## PAGE CONTEXT
Page Type: hiring_guide
Page URL: /hire-fractional-cto
Role Type: CTO

You're helping someone learn how to hire a fractional CTO.
Key facts: Day rates £900-£1,600, 2-4 weeks to hire, 3 month trial, 30 days notice.
When asked what page you're on, say "Fractional CTO Hiring Guide"`}
        labels={{
          title: "CTO Hiring Guide",
          initial: firstName ? `Hi ${firstName}! 👋 I can help you hire a fractional CTO. Ask about sourcing, interview questions, or costs.` : `Welcome! 👋 This guide covers everything about hiring a fractional CTO.`,
        }}
        suggestions={suggestions}
        clickOutsideToClose={false}
      >
        <div className="min-h-screen bg-white">
          {/* Hero */}
          <section className="bg-gradient-to-br from-cyan-600 to-blue-600 py-24">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <Link href="/fractional-cto" className="text-cyan-100 hover:text-white mb-8 inline-flex items-center text-sm"><span className="mr-2">←</span> Back to Fractional CTO Guide</Link>
              <div className="max-w-4xl">
                <span className="inline-block bg-white text-cyan-600 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] mb-6">Hiring Guide</span>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">Hire a<br /><span className="text-cyan-200">Fractional CTO</span></h1>
                <p className="text-2xl md:text-3xl text-cyan-50 leading-relaxed font-light mb-10">Complete guide to finding, vetting, and hiring the perfect fractional Chief Technology Officer for your business.</p>
                <div className="flex flex-wrap gap-10 mb-12">
                  <div><div className="text-5xl font-black text-white">2-4 Weeks</div><div className="text-cyan-100 text-sm uppercase tracking-wider mt-1">To Hire</div></div>
                  <div><div className="text-5xl font-black text-white">90 Days</div><div className="text-cyan-100 text-sm uppercase tracking-wider mt-1">To Impact</div></div>
                  <div><div className="text-5xl font-black text-white">100+</div><div className="text-cyan-100 text-sm uppercase tracking-wider mt-1">Candidates</div></div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <VoiceInput onMessage={handleVoiceMessage} firstName={firstName} userId={user?.id} pageContext={{ pageType: 'hiring_guide', roleType: 'CTO', pageH1: 'Hire a Fractional CTO', pageUrl: '/hire-fractional-cto', pageDescription: 'Complete guide to hiring a fractional CTO' }} />
                  <Link href="/fractional-cto-jobs-uk" className="px-8 py-4 bg-white text-cyan-600 font-bold uppercase tracking-wider hover:bg-cyan-50 transition-colors">Browse CTO Candidates</Link>
                  <Link href="#process" className="px-8 py-4 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-cyan-600 transition-colors">See Hiring Process</Link>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Stats */}
          <section className="bg-gray-50 border-b">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div><div className="text-4xl font-black text-cyan-600 mb-2">5-10</div><div className="text-gray-600 text-sm">Candidates to Interview</div></div>
                <div><div className="text-4xl font-black text-cyan-600 mb-2">3-6 Months</div><div className="text-gray-600 text-sm">Minimum Engagement</div></div>
                <div><div className="text-4xl font-black text-cyan-600 mb-2">£900-1.6k</div><div className="text-gray-600 text-sm">Day Rate Range</div></div>
                <div><div className="text-4xl font-black text-cyan-600 mb-2">30 Days</div><div className="text-gray-600 text-sm">Standard Notice</div></div>
              </div>
            </div>
          </section>

          {/* Where to Find */}
          <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <div className="mb-16 text-center max-w-3xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Sourcing</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Where to Find Fractional CTOs</h2>
                <p className="text-xl text-gray-600">Six proven channels for finding pre-vetted, experienced fractional technology leaders.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sourcingChannels.map((source, i) => (
                  <div key={i} className="bg-gray-50 p-8 border-l-4 border-cyan-500 hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">{source.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{source.channel}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{source.description}</p>
                    <div className="mb-3"><div className="text-xs font-bold text-gray-500 uppercase mb-1">Pros:</div><div className="text-sm text-gray-700">{source.pros}</div></div>
                    <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Best For:</div><div className="text-sm text-cyan-600">{source.bestFor}</div></div>
                  </div>
                ))}
              </div>
              <div className="mt-12 bg-cyan-50 border-2 border-cyan-200 p-8 rounded-lg">
                <p className="text-lg text-gray-900"><strong>Pro Tip:</strong> Use multiple channels in parallel. The best fractional CTOs are often working with 2-3 companies and may not be actively looking—referrals help you reach them.</p>
              </div>
            </div>
          </section>

          {/* What to Look For */}
          <section className="py-24 bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Evaluation Criteria</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">What to Look For in a Fractional CTO</h2>
                <p className="text-xl text-gray-600 max-w-3xl">Not all experienced engineers make good fractional CTOs. Here's what separates the best from the rest.</p>
              </div>
              <div className="space-y-8">
                {evaluationCriteria.map((item, i) => (
                  <div key={i} className="bg-white p-10 border-l-4 border-cyan-500 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{i + 1}. {item.criteria}</h3>
                    <p className="text-gray-700 leading-relaxed mb-6">{item.description}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg"><div className="text-sm font-bold text-cyan-800 mb-2 flex items-center gap-2"><span className="text-lg">✅</span> Look For</div><p className="text-sm text-gray-700">{item.lookFor}</p></div>
                      <div className="bg-red-50 border border-red-200 p-4 rounded-lg"><div className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2"><span className="text-lg">🚩</span> Red Flag</div><p className="text-sm text-gray-700">{item.redFlag}</p></div>
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
                <p className="text-xl text-gray-600 max-w-3xl">These questions separate strategic CTOs from hands-on engineers.</p>
              </div>
              <div className="space-y-8">
                <div className="bg-cyan-50 border-2 border-cyan-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">🎯 Architecture & Technical Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700"><strong className="text-gray-900">"Walk me through how you designed the architecture at [Company X]. What trade-offs did you make?"</strong><br/><span className="text-sm text-gray-600">Listen for: Clear reasoning, awareness of trade-offs, pragmatic decision-making</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How would you approach our current tech debt? What would you prioritize?"</strong><br/><span className="text-sm text-gray-600">Listen for: Balance between perfect and good enough, business-aware prioritization</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you decide between building vs buying? Give me an example."</strong><br/><span className="text-sm text-gray-600">Listen for: Framework for decision-making, awareness of total cost of ownership</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"Tell me about a system that failed under load. What did you learn?"</strong><br/><span className="text-sm text-gray-600">Listen for: Comfort with failure, post-mortem culture, continuous improvement</span></li>
                  </ul>
                </div>
                <div className="bg-cyan-50 border-2 border-cyan-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">📊 Delivery & Process Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you measure engineering productivity? What KPIs do you track?"</strong><br/><span className="text-sm text-gray-600">Listen for: DORA metrics, cycle time, deployment frequency, not just story points</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you balance new features vs tech debt vs reliability?"</strong><br/><span className="text-sm text-gray-600">Listen for: Clear allocation strategy (e.g., 70/20/10), business-aware trade-offs</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"Walk me through your release process. How do you ship safely?"</strong><br/><span className="text-sm text-gray-600">Listen for: CI/CD, feature flags, rollback procedures, monitoring</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"Tell me about a major project that went off track. How did you course-correct?"</strong><br/><span className="text-sm text-gray-600">Listen for: Early warning systems, stakeholder communication, pragmatic solutions</span></li>
                  </ul>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">👥 Team & Leadership Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700"><strong className="text-gray-900">"How would you structure our engineering team? What roles would you hire first?"</strong><br/><span className="text-sm text-gray-600">Listen for: Alignment with product roadmap, clear hiring priorities, team topology thinking</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you evaluate engineering candidates? What signals do you look for?"</strong><br/><span className="text-sm text-gray-600">Listen for: Structured interview process, beyond just coding ability</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"Tell me about a time you coached an underperforming engineer to success."</strong><br/><span className="text-sm text-gray-600">Listen for: Mentorship approach, patience, structured feedback</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you stay effective working 2 days/week vs embedded full-time?"</strong><br/><span className="text-sm text-gray-600">Listen for: Async communication, clear frameworks, delegation and trust</span></li>
                  </ul>
                </div>
                <div className="bg-amber-50 border-2 border-amber-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">🔍 Business & Product Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you work with product managers? What's your ideal relationship?"</strong><br/><span className="text-sm text-gray-600">Listen for: Partnership mindset, healthy tension, clear ownership boundaries</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you estimate engineering effort for product planning?"</strong><br/><span className="text-sm text-gray-600">Listen for: Realistic estimating, confidence intervals, clear communication</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"When have you said 'no' to a feature request? How did you handle it?"</strong><br/><span className="text-sm text-gray-600">Listen for: Business reasoning, alternative solutions, stakeholder management</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"Are you open to converting to full-time if we scale significantly?"</strong><br/><span className="text-sm text-gray-600">Listen for: Flexibility, transparency about preferences, long-term thinking</span></li>
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
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">The Fractional CTO Hiring Process</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">From first conversation to start date in 2-4 weeks.</p>
              </div>
              <HireProcessStepper accentColor="blue" />
              <div className="mt-16 bg-cyan-50 border-2 border-cyan-200 p-10 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Timeline Breakdown</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div><h4 className="font-bold text-gray-900 mb-2">Week 1: Define & Source</h4><ul className="text-sm text-gray-700 space-y-1"><li>• Define tech stack requirements (Day 1-2)</li><li>• Post on job boards, ask for referrals (Day 2-3)</li><li>• Review candidates, shortlist 5-10 (Day 4-7)</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Week 2-3: Interview & Select</h4><ul className="text-sm text-gray-700 space-y-1"><li>• First-round interviews (45-min calls)</li><li>• Second round: architecture deep dive</li><li>• Reference checks (2-3 calls)</li><li>• Make offer and negotiate terms</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Week 4: Onboard & Start</h4><ul className="text-sm text-gray-700 space-y-1"><li>• Contract signing and admin setup</li><li>• Share codebase access, docs, architecture</li><li>• First week: codebase review, team intros</li><li>• Begin audit and roadmap work</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">First 90 Days: Deliver</h4><ul className="text-sm text-gray-700 space-y-1"><li>• Month 1: Audit, quick wins, roadmap</li><li>• Month 2: Process improvements, hiring plan</li><li>• Month 3: Scale, architecture decisions</li><li>• Decide to extend or part ways</li></ul></div>
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
                <p className="text-xl text-gray-600 max-w-3xl">Standard terms for fractional CTO engagements.</p>
              </div>
              <div className="bg-gray-50 border-2 border-gray-200 p-10 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mt-0 mb-6">Standard Contract Template</h3>
                <div className="space-y-6">
                  <div><h4 className="font-bold text-gray-900 mb-2">Engagement Model</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Day rate:</strong> £900-£1,600 per day (based on experience)</li><li><strong>Commitment:</strong> 1-3 days per week (specify exact days)</li><li><strong>Monthly retainer option:</strong> £4,000-£6,500 for predictable billing</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Term & Notice</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Initial term:</strong> 3-month trial period</li><li><strong>Renewal:</strong> Auto-renew to 12-month rolling contract after trial</li><li><strong>Notice period:</strong> 30 days either side (standard)</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Scope of Work</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Responsibilities:</strong> Tech strategy, architecture decisions, team leadership, hiring</li><li><strong>Deliverables:</strong> Architecture docs, tech roadmap, weekly async updates</li><li><strong>Exclusions:</strong> Day-to-day coding (unless scoped), attending all standups</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">IP & Confidentiality</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>IP ownership:</strong> Company owns all code and documentation</li><li><strong>Confidentiality:</strong> Standard NDA terms, survives termination</li><li><strong>Non-compete:</strong> Usually not applicable (fractional works with multiple companies)</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Payment Terms</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Invoicing:</strong> Monthly in arrears or bi-weekly</li><li><strong>Payment terms:</strong> Net 15 or Net 30</li><li><strong>Expenses:</strong> Pre-approved expenses reimbursed separately</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Optional: Equity</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Advisory shares:</strong> 0.25-0.5% for long-term engagements (12+ months)</li><li><strong>Vesting:</strong> Quarterly or annual vesting</li><li><strong>Cash reduction:</strong> If equity included, day rate may reduce 10-15%</li></ul></div>
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
          <section className="py-20 bg-cyan-600 text-white">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Hire?</h2>
              <p className="text-xl text-cyan-100 mb-10 max-w-2xl mx-auto">Browse 100+ pre-vetted fractional CTO candidates. Post your role and start interviews this week.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/fractional-cto-jobs-uk" className="px-10 py-5 bg-white text-cyan-600 font-bold uppercase tracking-wider hover:bg-cyan-50 transition-colors">Browse CTO Candidates</Link>
                <Link href="/contact" className="px-10 py-5 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-cyan-600 transition-colors">Post Your Role</Link>
              </div>
            </div>
          </section>

          {/* Related Links */}
          <section className="py-12 bg-white border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Related Resources</span>
                <div className="flex flex-wrap gap-4">
                  <Link href="/fractional-cto" className="text-gray-600 hover:text-cyan-600 font-medium transition-colors">Fractional CTO Guide</Link>
                  <Link href="/fractional-cto-cost" className="text-gray-600 hover:text-cyan-600 font-medium transition-colors">CTO Cost Guide</Link>
                  <Link href="/fractional-cto-services" className="text-gray-600 hover:text-cyan-600 font-medium transition-colors">CTO Services</Link>
                  <Link href="/fractional-cto-salary" className="text-gray-600 hover:text-cyan-600 font-medium transition-colors">CTO Salary Data</Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </CopilotSidebar>
    </main>
  );
}
