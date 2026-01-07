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
  { question: 'How long does it take to hire a fractional COO?', answer: 'Typically 2-4 weeks from first conversations to start date. This includes: defining requirements (1-3 days), sourcing candidates (3-7 days), interviews (1-2 weeks), and onboarding (1 week). Much faster than the 3-6 months required for full-time COO recruitment.' },
  { question: 'Where can I find fractional COOs to hire?', answer: 'Five main sources: (1) Fractional executive job boards like Fractional.Quest with pre-vetted candidates, (2) LinkedIn using hashtags like #FractionalCOO or #PortfolioCOO, (3) Fractional executive networks and agencies, (4) Referrals from VCs, founders, or other fractional executives, (5) Operations communities and professional networks.' },
  { question: 'What should I look for when hiring a fractional COO?', answer: 'Five key criteria: (1) Relevant experience scaling operations at your company stage, (2) Industry expertise matching your operational challenges, (3) Proven track record building systems, processes, and teams, (4) Strong leadership and people management skills, (5) Cultural fit and ability to work fractionally with your team.' },
  { question: 'How much does it cost to hire a fractional COO?', answer: 'Day rates range from £750-£1,400 depending on experience. Most engagements are 1-2 days per week (£3,200-£5,500/month retainer) or 2-3 days per week (£75,000-£135,000 annually). This is 40-60% cheaper than full-time COOs who cost £140,000-£250,000+ with benefits and equity.' },
  { question: 'What contract terms should I use?', answer: 'Start with a 3-month trial period with 30 days notice either side. After the trial, extend to 12-month rolling contracts. Key terms: day rate or monthly retainer, expected days per week, notice period (30 days standard), IP ownership (company owns all work), confidentiality, and scope of responsibilities.' },
  { question: 'Can I convert a fractional COO to full-time later?', answer: 'Yes, many companies do this as they scale. Common transition points: Series B fundraising, hitting £10M+ ARR, or when operational complexity requires full-time leadership. Discuss this upfront—most fractional COOs are open to conversion if the timing makes sense.' },
];

const sourcingChannels = [
  { channel: 'Fractional Job Boards', description: 'Platforms like Fractional.Quest with pre-vetted fractional executives actively looking for engagements.', pros: 'Pre-screened candidates, fast matching, transparent rates', bestFor: 'Companies wanting quality candidates quickly', icon: '🎯' },
  { channel: 'LinkedIn Search', description: 'Search for COOs using hashtags #FractionalCOO, #PortfolioCOO, or "Fractional COO" in titles.', pros: 'Large pool, direct outreach, can research background', bestFor: 'Companies with time to source and screen', icon: '💼' },
  { channel: 'Fractional Executive Networks', description: 'Agencies and networks that match companies with fractional operations leaders.', pros: 'Curated matches, support through process, quality guarantee', bestFor: 'Companies wanting managed recruitment', icon: '🤝' },
  { channel: 'VC & PE Referrals', description: "Ask your investors, advisors, or board members who they've worked with.", pros: 'Trusted recommendations, proven with high-growth companies', bestFor: 'Funded startups with investor networks', icon: '🌟' },
  { channel: 'Operations Communities', description: 'Slack groups (RevOps, BizOps), Chief of Staff networks, and operations-focused events.', pros: 'Active practitioners, can observe operational expertise', bestFor: 'Finding specialists in specific operational areas', icon: '⚙️' },
  { channel: 'Consulting Firm Alumni', description: 'Ex-McKinsey, BCG, Bain professionals who have moved into operating roles.', pros: 'Structured problem-solving, quick to diagnose issues', bestFor: 'Companies needing strategic operations expertise', icon: '📊' },
];

const evaluationCriteria = [
  { criteria: 'Company Stage Experience', description: "Have they scaled operations at your stage? A COO from a Fortune 500 company won't know how to create from scratch at a startup. Look for experience with companies 1-2 stages ahead of yours.", lookFor: 'Experience at similar stage companies, scaled operations from 10 to 100+ people, understanding of your growth phase', redFlag: 'Only worked at large corporations or never scaled operations under resource constraints' },
  { criteria: 'Industry & Business Model Expertise', description: 'Do they understand your industry\'s operational challenges? E-commerce operations differ from SaaS or manufacturing. Ensure they know your operational model—fulfillment, customer success, service delivery.', lookFor: 'Experience in your industry, knowledge of relevant operational KPIs, understanding of your business model', redFlag: 'No experience in similar business models or industries' },
  { criteria: 'Process Design & Systems Thinking', description: 'Can they build scalable processes from scratch? Great fractional COOs see the whole system, identify bottlenecks, and create processes that scale. They should be able to document, optimize, and automate.', lookFor: 'Examples of processes designed, systems implemented, playbooks created', redFlag: "Can't show examples of processes they've built or only inherited existing systems" },
  { criteria: 'Team Leadership & Management', description: 'Have they built and led cross-functional teams? A fractional COO needs to manage people, hire effectively, and build culture. They should have managed teams of 20+ and hired dozens of people.', lookFor: 'Built teams from scratch, hiring process expertise, performance management stories', redFlag: 'Never managed large teams or uncomfortable with people decisions' },
  { criteria: 'Execution & Delivery Focus', description: 'Can they actually get things done? Great COOs are doers, not just advisors. They should show examples of shipping projects, solving problems, and driving results—not just creating strategy decks.', lookFor: 'Concrete examples of projects delivered, metrics improved, problems solved', redFlag: 'Only consulting experience or can\'t point to specific outcomes' },
  { criteria: 'Fractional Working Model Fit', description: 'Do they know how to work fractionally? This requires discipline, clear communication, and asynchronous collaboration. Ask how they manage multiple clients and make impact in 2 days/week.', lookFor: 'Works with 2-4 companies currently, systems for time management, clear communication cadence', redFlag: 'First fractional engagement or working with 6+ companies (spread too thin)' },
];

export default function HireFractionalCOOPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] || null;
  const { state, setState } = useCoAgent<{ user?: { id: string; name: string; email: string } }>({ name: "my_agent", initialState: {} });
  useEffect(() => { if (user && !state?.user) { setState((prev) => ({ ...prev, user: { id: user.id, name: user.name || "", email: user.email || "" } })); } }, [user?.id, state?.user, setState]);
  const { appendMessage } = useCopilotChat();
  const handleVoiceMessage = useCallback((text: string, role: "user" | "assistant" = "user") => {
    if (user?.id && text.length > 5) { fetch('/api/zep-store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, role, content: text, metadata: { page: 'hire-fractional-coo', hiringGuide: true } }) }).catch(() => {}); }
    appendMessage(new TextMessage({ content: text, role: role === "user" ? Role.User : Role.Assistant }));
  }, [appendMessage, user?.id]);

  const suggestions = [
    { title: "Where to find COOs", message: "Where can I find fractional COOs to hire?" },
    { title: "Interview questions", message: "What questions should I ask when interviewing a fractional COO?" },
    { title: "Pricing & costs", message: "How much does a fractional COO cost?" },
  ];

  return (
    <main style={{ "--copilot-kit-primary-color": "#6b7280" } as CopilotKitCSSProperties}>
      <WebPageSchema title="Hire a Fractional COO UK 2025" description="How to hire a fractional COO. Where to find them, interview questions, red flags, contract terms." url="https://fractional.quest/hire-fractional-coo" dateModified={new Date('2025-01-07T00:00:00Z')} />
      <FAQPageSchema faqs={faqItems} />

      <CopilotSidebar
        instructions={`## PAGE CONTEXT\nPage Type: hiring_guide\nPage URL: /hire-fractional-coo\nRole Type: COO\n\nYou're helping someone learn how to hire a fractional COO.\nKey facts: Day rates £750-£1,400, 2-4 weeks to hire, 3 month trial, 30 days notice.\nWhen asked what page you're on, say "Fractional COO Hiring Guide"`}
        labels={{ title: "COO Hiring Guide", initial: firstName ? `Hi ${firstName}! 👋 I can help you hire a fractional COO. Ask about sourcing, interview questions, or costs.` : `Welcome! 👋 This guide covers everything about hiring a fractional COO.` }}
        suggestions={suggestions}
        clickOutsideToClose={false}
      >
        <div className="min-h-screen bg-white">
          <section className="bg-gradient-to-br from-slate-700 to-gray-800 py-24">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <Link href="/fractional-coo" className="text-slate-300 hover:text-white mb-8 inline-flex items-center text-sm"><span className="mr-2">←</span> Back to Fractional COO Guide</Link>
              <div className="max-w-4xl">
                <span className="inline-block bg-white text-slate-700 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] mb-6">Hiring Guide</span>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">Hire a<br /><span className="text-slate-300">Fractional COO</span></h1>
                <p className="text-2xl md:text-3xl text-slate-200 leading-relaxed font-light mb-10">Complete guide to finding, vetting, and hiring the perfect fractional Chief Operating Officer for your business.</p>
                <div className="flex flex-wrap gap-10 mb-12">
                  <div><div className="text-5xl font-black text-white">2-4 Weeks</div><div className="text-slate-300 text-sm uppercase tracking-wider mt-1">To Hire</div></div>
                  <div><div className="text-5xl font-black text-white">90 Days</div><div className="text-slate-300 text-sm uppercase tracking-wider mt-1">To Impact</div></div>
                  <div><div className="text-5xl font-black text-white">100+</div><div className="text-slate-300 text-sm uppercase tracking-wider mt-1">Candidates</div></div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <VoiceInput onMessage={handleVoiceMessage} firstName={firstName} userId={user?.id} pageContext={{ pageType: 'hiring_guide', roleType: 'COO', pageH1: 'Hire a Fractional COO', pageUrl: '/hire-fractional-coo', pageDescription: 'Complete guide to hiring a fractional COO' }} />
                  <Link href="/fractional-coo-jobs-uk" className="px-8 py-4 bg-white text-slate-700 font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors">Browse COO Candidates</Link>
                  <Link href="#process" className="px-8 py-4 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-slate-700 transition-colors">See Hiring Process</Link>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gray-50 border-b">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div><div className="text-4xl font-black text-slate-700 mb-2">5-10</div><div className="text-gray-600 text-sm">Candidates to Interview</div></div>
                <div><div className="text-4xl font-black text-slate-700 mb-2">3-6 Months</div><div className="text-gray-600 text-sm">Minimum Engagement</div></div>
                <div><div className="text-4xl font-black text-slate-700 mb-2">£750-1.4k</div><div className="text-gray-600 text-sm">Day Rate Range</div></div>
                <div><div className="text-4xl font-black text-slate-700 mb-2">30 Days</div><div className="text-gray-600 text-sm">Standard Notice</div></div>
              </div>
            </div>
          </section>

          <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <div className="mb-16 text-center max-w-3xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Sourcing</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Where to Find Fractional COOs</h2>
                <p className="text-xl text-gray-600">Six proven channels for finding pre-vetted, experienced fractional operations leaders.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sourcingChannels.map((source, i) => (
                  <div key={i} className="bg-gray-50 p-8 border-l-4 border-slate-600 hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">{source.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{source.channel}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{source.description}</p>
                    <div className="mb-3"><div className="text-xs font-bold text-gray-500 uppercase mb-1">Pros:</div><div className="text-sm text-gray-700">{source.pros}</div></div>
                    <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Best For:</div><div className="text-sm text-slate-700">{source.bestFor}</div></div>
                  </div>
                ))}
              </div>
              <div className="mt-12 bg-slate-50 border-2 border-slate-200 p-8 rounded-lg">
                <p className="text-lg text-gray-900"><strong>Pro Tip:</strong> Use multiple channels in parallel. The best fractional COOs are often working with 2-3 companies and may not be actively looking—referrals help you reach them.</p>
              </div>
            </div>
          </section>

          <section className="py-24 bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Evaluation Criteria</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">What to Look For in a Fractional COO</h2>
                <p className="text-xl text-gray-600 max-w-3xl">Not all experienced operators make good fractional COOs. Here's what separates the best from the rest.</p>
              </div>
              <div className="space-y-8">
                {evaluationCriteria.map((item, i) => (
                  <div key={i} className="bg-white p-10 border-l-4 border-slate-600 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{i + 1}. {item.criteria}</h3>
                    <p className="text-gray-700 leading-relaxed mb-6">{item.description}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg"><div className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><span className="text-lg">✅</span> Look For</div><p className="text-sm text-gray-700">{item.lookFor}</p></div>
                      <div className="bg-red-50 border border-red-200 p-4 rounded-lg"><div className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2"><span className="text-lg">🚩</span> Red Flag</div><p className="text-sm text-gray-700">{item.redFlag}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Interview Guide</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Interview Questions to Ask</h2>
                <p className="text-xl text-gray-600 max-w-3xl">These questions separate strategic COOs from administrators.</p>
              </div>
              <div className="space-y-8">
                <div className="bg-slate-50 border-2 border-slate-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">⚙️ Operations & Process Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700"><strong className="text-gray-900">"Walk me through how you scaled operations at [Company X]. What broke and how did you fix it?"</strong><br/><span className="text-sm text-gray-600">Listen for: Proactive problem identification, systematic solutions, measurable improvements</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you identify bottlenecks in an operation you're new to?"</strong><br/><span className="text-sm text-gray-600">Listen for: Data analysis, stakeholder interviews, process mapping methodology</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"Tell me about a process you built from scratch. How did you document and scale it?"</strong><br/><span className="text-sm text-gray-600">Listen for: Systematic approach, documentation habits, iteration mindset</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you balance short-term firefighting with long-term operational improvements?"</strong><br/><span className="text-sm text-gray-600">Listen for: Prioritization frameworks, root cause thinking, time management</span></li>
                  </ul>
                </div>
                <div className="bg-slate-50 border-2 border-slate-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">📈 Scaling & Growth Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700"><strong className="text-gray-900">"What operational systems need to be in place for a company at our stage?"</strong><br/><span className="text-sm text-gray-600">Listen for: Stage-appropriate thinking, not over-engineering, pragmatic priorities</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you approach automation vs hiring decisions?"</strong><br/><span className="text-sm text-gray-600">Listen for: ROI thinking, understanding of technical capabilities, build vs buy mindset</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"Tell me about a time you had to cut costs or improve efficiency significantly."</strong><br/><span className="text-sm text-gray-600">Listen for: Data-driven decisions, communication approach, results achieved</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you ensure operational changes stick and don't regress?"</strong><br/><span className="text-sm text-gray-600">Listen for: Change management, measurement systems, accountability structures</span></li>
                  </ul>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">👥 Leadership & Team Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700"><strong className="text-gray-900">"How would you structure the operations function at our company?"</strong><br/><span className="text-sm text-gray-600">Listen for: Stage-appropriate team structure, clear hiring priorities</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you get buy-in from teams who resist process changes?"</strong><br/><span className="text-sm text-gray-600">Listen for: Change management skills, empathy, communication approach</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"Tell me about managing cross-functional projects with no direct authority."</strong><br/><span className="text-sm text-gray-600">Listen for: Influence skills, stakeholder management, collaboration mindset</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you stay effective working 2 days/week vs embedded full-time?"</strong><br/><span className="text-sm text-gray-600">Listen for: Async communication, clear frameworks, delegation</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section id="process" className="py-24 bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-12 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Process</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">The Fractional COO Hiring Process</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">From first conversation to start date in 2-4 weeks.</p>
              </div>
              <HireProcessStepper accentColor="gray" />
              <div className="mt-16 bg-slate-50 border-2 border-slate-200 p-10 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Timeline Breakdown</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div><h4 className="font-bold text-gray-900 mb-2">Week 1: Define & Source</h4><ul className="text-sm text-gray-700 space-y-1"><li>• Define operational requirements (Day 1-2)</li><li>• Post on job boards, ask for referrals (Day 2-3)</li><li>• Review candidates, shortlist 5-10 (Day 4-7)</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Week 2-3: Interview & Select</h4><ul className="text-sm text-gray-700 space-y-1"><li>• First-round interviews (45-min calls)</li><li>• Second round: case study or process review</li><li>• Reference checks (2-3 calls)</li><li>• Make offer and negotiate terms</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Week 4: Onboard & Start</h4><ul className="text-sm text-gray-700 space-y-1"><li>• Contract signing and admin setup</li><li>• Share operations access, systems, docs</li><li>• First week: operational audit and review</li><li>• Begin process optimization work</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">First 90 Days: Deliver</h4><ul className="text-sm text-gray-700 space-y-1"><li>• Month 1: Operational audit, quick wins</li><li>• Month 2: Process improvements, systems</li><li>• Month 3: Scale, hire, measure results</li><li>• Decide to extend or part ways</li></ul></div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Contracts</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Contract Terms & Structure</h2>
                <p className="text-xl text-gray-600 max-w-3xl">Standard terms for fractional COO engagements.</p>
              </div>
              <div className="bg-gray-50 border-2 border-gray-200 p-10 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mt-0 mb-6">Standard Contract Template</h3>
                <div className="space-y-6">
                  <div><h4 className="font-bold text-gray-900 mb-2">Engagement Model</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Day rate:</strong> £750-£1,400 per day (based on experience)</li><li><strong>Commitment:</strong> 1-3 days per week (specify exact days)</li><li><strong>Monthly retainer option:</strong> £3,200-£5,500 for predictable billing</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Term & Notice</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Initial term:</strong> 3-month trial period</li><li><strong>Renewal:</strong> Auto-renew to 12-month rolling contract after trial</li><li><strong>Notice period:</strong> 30 days either side (standard)</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Scope of Work</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Responsibilities:</strong> Operational strategy, process design, team leadership, scaling systems</li><li><strong>Deliverables:</strong> Process documentation, operational KPIs, improvement roadmap</li><li><strong>Exclusions:</strong> Day-to-day task execution (unless scoped), individual contributor work</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">IP & Confidentiality</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>IP ownership:</strong> Company owns all process documentation and systems</li><li><strong>Confidentiality:</strong> Standard NDA terms, survives termination</li><li><strong>Non-compete:</strong> Usually not applicable (fractional works with multiple companies)</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Optional: Equity</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Advisory shares:</strong> 0.15-0.35% for long-term engagements (12+ months)</li><li><strong>Vesting:</strong> Quarterly or annual vesting</li><li><strong>Cash reduction:</strong> If equity included, day rate may reduce 10-15%</li></ul></div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-20 bg-gray-50">
            <div className="max-w-4xl mx-auto px-6 lg:px-8">
              <h2 className="text-3xl font-black text-gray-900 mb-8">Frequently Asked Questions</h2>
              <FAQ items={faqItems} title="" skipSchema={true} />
            </div>
          </section>

          <section className="py-20 bg-slate-700 text-white">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Hire?</h2>
              <p className="text-xl text-slate-200 mb-10 max-w-2xl mx-auto">Browse 100+ pre-vetted fractional COO candidates. Post your role and start interviews this week.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/fractional-coo-jobs-uk" className="px-10 py-5 bg-white text-slate-700 font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors">Browse COO Candidates</Link>
                <Link href="/contact" className="px-10 py-5 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-slate-700 transition-colors">Post Your Role</Link>
              </div>
            </div>
          </section>

          <section className="py-12 bg-white border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Related Resources</span>
                <div className="flex flex-wrap gap-4">
                  <Link href="/fractional-coo" className="text-gray-600 hover:text-slate-700 font-medium transition-colors">Fractional COO Guide</Link>
                  <Link href="/fractional-coo-cost" className="text-gray-600 hover:text-slate-700 font-medium transition-colors">COO Cost Guide</Link>
                  <Link href="/fractional-coo-services" className="text-gray-600 hover:text-slate-700 font-medium transition-colors">COO Services</Link>
                  <Link href="/fractional-coo-salary" className="text-gray-600 hover:text-slate-700 font-medium transition-colors">COO Salary Data</Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </CopilotSidebar>
    </main>
  );
}
