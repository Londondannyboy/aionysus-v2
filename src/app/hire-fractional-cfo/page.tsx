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
  { question: 'How long does it take to hire a fractional CFO?', answer: 'Typically 2-4 weeks from first conversations to start date. This includes: defining requirements (1-3 days), sourcing candidates (3-7 days), interviews (1-2 weeks), and onboarding (1 week). Much faster than the 3-6 months required for full-time CFO recruitment.' },
  { question: 'Where can I find fractional CFOs to hire?', answer: 'Five main sources: (1) Fractional executive job boards like Fractional.Quest with pre-vetted candidates, (2) LinkedIn using hashtags like #FractionalCFO or #PortfolioCFO, (3) Fractional executive networks and agencies, (4) Referrals from VCs, founders, or accountants, (5) Finance communities and professional associations.' },
  { question: 'What should I look for when hiring a fractional CFO?', answer: 'Five key criteria: (1) Relevant experience at your company stage (seed, Series A, PE-backed), (2) Industry expertise matching your sector, (3) Proven track record with fundraising, M&A, or exits if relevant, (4) Strong financial modeling and forecasting skills, (5) Cultural fit and ability to work fractionally with your team.' },
  { question: 'How much does it cost to hire a fractional CFO?', answer: 'Day rates range from £800-£1,500 depending on experience. Most engagements are 1-2 days per week (£3,500-£6,000/month retainer) or 2-3 days per week (£80,000-£150,000 annually). This is 40-60% cheaper than full-time CFOs who cost £150,000-£280,000+ with benefits and equity.' },
  { question: 'What contract terms should I use?', answer: 'Start with a 3-month trial period with 30 days notice either side. After the trial, extend to 12-month rolling contracts. Key terms: day rate or monthly retainer, expected days per week, notice period (30 days standard), IP ownership (company owns all work), confidentiality, and scope of responsibilities.' },
  { question: 'Can I convert a fractional CFO to full-time later?', answer: 'Yes, many companies do this as they scale. Common transition points: Series B fundraising, hitting £10M+ ARR, or preparing for acquisition. Discuss this upfront—most fractional CFOs are open to conversion if the timing and equity package make sense.' },
];

const sourcingChannels = [
  { channel: 'Fractional Job Boards', description: 'Platforms like Fractional.Quest with pre-vetted fractional executives actively looking for engagements.', pros: 'Pre-screened candidates, fast matching, transparent rates', bestFor: 'Companies wanting quality candidates quickly', icon: '🎯' },
  { channel: 'LinkedIn Search', description: 'Search for CFOs using hashtags #FractionalCFO, #PortfolioCFO, or "Fractional CFO" in titles.', pros: 'Large pool, direct outreach, can research background', bestFor: 'Companies with time to source and screen', icon: '💼' },
  { channel: 'Fractional Executive Networks', description: 'Agencies and networks that match companies with fractional finance leaders.', pros: 'Curated matches, support through process, quality guarantee', bestFor: 'Companies wanting managed recruitment', icon: '🤝' },
  { channel: 'VC & PE Referrals', description: "Ask your investors, advisors, or board members who they've worked with.", pros: 'Trusted recommendations, investor-approved, proven with similar companies', bestFor: 'VC/PE-backed startups with investor networks', icon: '🌟' },
  { channel: 'Accounting Firm Networks', description: 'Big 4 alumni networks, FD/CFO communities, and professional associations like ICAEW.', pros: 'Qualified professionals, strong financial foundations', bestFor: 'Companies needing technical accounting expertise', icon: '📊' },
  { channel: 'Finance Conferences', description: 'Attend CFO conferences, finance leadership events, or industry-specific meetups.', pros: 'Meet in person, assess cultural fit, network effect', bestFor: 'Companies attending conferences anyway', icon: '🎤' },
];

const evaluationCriteria = [
  { criteria: 'Company Stage Experience', description: "Have they worked with companies at your stage? A CFO from a FTSE 250 company won't know how to manage cash at a seed-stage startup. Look for experience with companies 1-2 stages ahead of yours.", lookFor: 'Experience at similar stage companies, relevant fundraising experience, understanding of your growth phase', redFlag: 'Only worked at large corporations or never managed a growing company finances' },
  { criteria: 'Industry & Business Model Expertise', description: 'Do they understand your industry\'s financial dynamics? SaaS metrics differ from manufacturing or services. Ensure they speak your language—MRR, LTV:CAC, burn rate, gross margin.', lookFor: 'Experience in your industry, knowledge of relevant KPIs, understanding of your business model', redFlag: 'No experience in similar business models or industries' },
  { criteria: 'Fundraising & Investor Relations', description: 'If you\'re raising capital, have they supported fundraises before? Great fractional CFOs can build investor-ready financial models, data rooms, and present to investors alongside founders.', lookFor: 'Track record of successful fundraises, investor presentation experience, data room management', redFlag: 'Never supported a fundraise or lacks investor communication skills' },
  { criteria: 'Financial Modeling & Forecasting', description: 'Can they build sophisticated financial models? Beyond basic P&L, they should create scenario models, runway forecasts, unit economics analysis, and board-ready reporting.', lookFor: 'Strong Excel/modeling skills, scenario planning experience, board reporting examples', redFlag: "Can't demonstrate complex modeling work or relies solely on accountants" },
  { criteria: 'Strategic Finance vs Accounting', description: 'Are they a strategic partner or just a bean counter? Great CFOs influence strategy, not just report on it. They should challenge assumptions, identify opportunities, and drive decision-making.', lookFor: 'Examples of strategic input, business partnership mindset, beyond-the-numbers thinking', redFlag: 'Purely backward-looking, only focused on compliance and reporting' },
  { criteria: 'Fractional Working Model Fit', description: 'Do they know how to work fractionally? This requires discipline, clear communication, and asynchronous collaboration. Ask how they manage multiple clients and make impact in 2 days/week.', lookFor: 'Works with 2-4 companies currently, systems for time management, clear communication cadence', redFlag: 'First fractional engagement or working with 6+ companies (spread too thin)' },
];

export default function HireFractionalCFOPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const firstName = user?.name?.split(" ")[0] || null;
  const { state, setState } = useCoAgent<{ user?: { id: string; name: string; email: string } }>({ name: "my_agent", initialState: {} });
  useEffect(() => { if (user && !state?.user) { setState((prev) => ({ ...prev, user: { id: user.id, name: user.name || "", email: user.email || "" } })); } }, [user?.id, state?.user, setState]);
  const { appendMessage } = useCopilotChat();
  const handleVoiceMessage = useCallback((text: string, role: "user" | "assistant" = "user") => {
    if (user?.id && text.length > 5) { fetch('/api/zep-store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, role, content: text, metadata: { page: 'hire-fractional-cfo', hiringGuide: true } }) }).catch(() => {}); }
    appendMessage(new TextMessage({ content: text, role: role === "user" ? Role.User : Role.Assistant }));
  }, [appendMessage, user?.id]);

  const suggestions = [
    { title: "Where to find CFOs", message: "Where can I find fractional CFOs to hire?" },
    { title: "Interview questions", message: "What questions should I ask when interviewing a fractional CFO?" },
    { title: "Pricing & costs", message: "How much does a fractional CFO cost?" },
  ];

  return (
    <main style={{ "--copilot-kit-primary-color": "#059669" } as CopilotKitCSSProperties}>
      <WebPageSchema title="Hire a Fractional CFO UK 2025" description="How to hire a fractional CFO. Where to find them, interview questions, red flags, contract terms." url="https://fractional.quest/hire-fractional-cfo" dateModified={new Date('2025-01-07T00:00:00Z')} />
      <FAQPageSchema faqs={faqItems} />

      <CopilotSidebar
        instructions={`## PAGE CONTEXT\nPage Type: hiring_guide\nPage URL: /hire-fractional-cfo\nRole Type: CFO\n\nYou're helping someone learn how to hire a fractional CFO.\nKey facts: Day rates £800-£1,500, 2-4 weeks to hire, 3 month trial, 30 days notice.\nWhen asked what page you're on, say "Fractional CFO Hiring Guide"`}
        labels={{ title: "CFO Hiring Guide", initial: firstName ? `Hi ${firstName}! 👋 I can help you hire a fractional CFO. Ask about sourcing, interview questions, or costs.` : `Welcome! 👋 This guide covers everything about hiring a fractional CFO.` }}
        suggestions={suggestions}
        clickOutsideToClose={false}
      >
        <div className="min-h-screen bg-white">
          <section className="bg-gradient-to-br from-emerald-600 to-teal-600 py-24">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <Link href="/fractional-cfo" className="text-emerald-100 hover:text-white mb-8 inline-flex items-center text-sm"><span className="mr-2">←</span> Back to Fractional CFO Guide</Link>
              <div className="max-w-4xl">
                <span className="inline-block bg-white text-emerald-600 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] mb-6">Hiring Guide</span>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-8 leading-tight">Hire a<br /><span className="text-emerald-200">Fractional CFO</span></h1>
                <p className="text-2xl md:text-3xl text-emerald-50 leading-relaxed font-light mb-10">Complete guide to finding, vetting, and hiring the perfect fractional Chief Financial Officer for your business.</p>
                <div className="flex flex-wrap gap-10 mb-12">
                  <div><div className="text-5xl font-black text-white">2-4 Weeks</div><div className="text-emerald-100 text-sm uppercase tracking-wider mt-1">To Hire</div></div>
                  <div><div className="text-5xl font-black text-white">90 Days</div><div className="text-emerald-100 text-sm uppercase tracking-wider mt-1">To Impact</div></div>
                  <div><div className="text-5xl font-black text-white">100+</div><div className="text-emerald-100 text-sm uppercase tracking-wider mt-1">Candidates</div></div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <VoiceInput onMessage={handleVoiceMessage} firstName={firstName} userId={user?.id} pageContext={{ pageType: 'hiring_guide', roleType: 'CFO', pageH1: 'Hire a Fractional CFO', pageUrl: '/hire-fractional-cfo', pageDescription: 'Complete guide to hiring a fractional CFO' }} />
                  <Link href="/fractional-cfo-jobs-uk" className="px-8 py-4 bg-white text-emerald-600 font-bold uppercase tracking-wider hover:bg-emerald-50 transition-colors">Browse CFO Candidates</Link>
                  <Link href="#process" className="px-8 py-4 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-emerald-600 transition-colors">See Hiring Process</Link>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-gray-50 border-b">
            <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
              <div className="grid md:grid-cols-4 gap-8 text-center">
                <div><div className="text-4xl font-black text-emerald-600 mb-2">5-10</div><div className="text-gray-600 text-sm">Candidates to Interview</div></div>
                <div><div className="text-4xl font-black text-emerald-600 mb-2">3-6 Months</div><div className="text-gray-600 text-sm">Minimum Engagement</div></div>
                <div><div className="text-4xl font-black text-emerald-600 mb-2">£800-1.5k</div><div className="text-gray-600 text-sm">Day Rate Range</div></div>
                <div><div className="text-4xl font-black text-emerald-600 mb-2">30 Days</div><div className="text-gray-600 text-sm">Standard Notice</div></div>
              </div>
            </div>
          </section>

          <section className="py-24 bg-white">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <div className="mb-16 text-center max-w-3xl mx-auto">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Sourcing</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Where to Find Fractional CFOs</h2>
                <p className="text-xl text-gray-600">Six proven channels for finding pre-vetted, experienced fractional finance leaders.</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sourcingChannels.map((source, i) => (
                  <div key={i} className="bg-gray-50 p-8 border-l-4 border-emerald-500 hover:shadow-md transition-shadow">
                    <div className="text-4xl mb-4">{source.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{source.channel}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{source.description}</p>
                    <div className="mb-3"><div className="text-xs font-bold text-gray-500 uppercase mb-1">Pros:</div><div className="text-sm text-gray-700">{source.pros}</div></div>
                    <div><div className="text-xs font-bold text-gray-500 uppercase mb-1">Best For:</div><div className="text-sm text-emerald-600">{source.bestFor}</div></div>
                  </div>
                ))}
              </div>
              <div className="mt-12 bg-emerald-50 border-2 border-emerald-200 p-8 rounded-lg">
                <p className="text-lg text-gray-900"><strong>Pro Tip:</strong> Use multiple channels in parallel. The best fractional CFOs are often working with 2-3 companies and may not be actively looking—referrals help you reach them.</p>
              </div>
            </div>
          </section>

          <section className="py-24 bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Evaluation Criteria</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">What to Look For in a Fractional CFO</h2>
                <p className="text-xl text-gray-600 max-w-3xl">Not all experienced finance professionals make good fractional CFOs. Here's what separates the best from the rest.</p>
              </div>
              <div className="space-y-8">
                {evaluationCriteria.map((item, i) => (
                  <div key={i} className="bg-white p-10 border-l-4 border-emerald-500 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{i + 1}. {item.criteria}</h3>
                    <p className="text-gray-700 leading-relaxed mb-6">{item.description}</p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg"><div className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2"><span className="text-lg">✅</span> Look For</div><p className="text-sm text-gray-700">{item.lookFor}</p></div>
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
                <p className="text-xl text-gray-600 max-w-3xl">These questions separate strategic CFOs from bookkeepers.</p>
              </div>
              <div className="space-y-8">
                <div className="bg-emerald-50 border-2 border-emerald-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">💰 Financial Strategy Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700"><strong className="text-gray-900">"Walk me through how you managed cash flow during a challenging period."</strong><br/><span className="text-sm text-gray-600">Listen for: Proactive planning, scenario modeling, decisive action</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you approach financial forecasting? What's your process?"</strong><br/><span className="text-sm text-gray-600">Listen for: Driver-based models, scenario planning, regular updates</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"Tell me about a time you identified a financial risk before it became a problem."</strong><br/><span className="text-sm text-gray-600">Listen for: Proactive monitoring, early warning systems, decisive action</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you ensure financial data drives better business decisions?"</strong><br/><span className="text-sm text-gray-600">Listen for: Beyond reporting, strategic insights, business partnership</span></li>
                  </ul>
                </div>
                <div className="bg-emerald-50 border-2 border-emerald-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">📈 Fundraising & Investor Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700"><strong className="text-gray-900">"What's your experience supporting fundraising rounds?"</strong><br/><span className="text-sm text-gray-600">Listen for: Data room management, investor presentations, term sheet negotiations</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you prepare financial models for investor due diligence?"</strong><br/><span className="text-sm text-gray-600">Listen for: Cohort analysis, unit economics, defensible assumptions</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"Tell me about managing board reporting and investor relations."</strong><br/><span className="text-sm text-gray-600">Listen for: Clear communication, proactive updates, relationship management</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you think about runway and when to start raising?"</strong><br/><span className="text-sm text-gray-600">Listen for: 12-18 month runway thinking, market timing, milestone planning</span></li>
                  </ul>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 p-10 rounded-lg">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">👥 Leadership & Team Questions</h3>
                  <ul className="space-y-4">
                    <li className="text-gray-700"><strong className="text-gray-900">"How would you structure our finance function? What roles are needed?"</strong><br/><span className="text-sm text-gray-600">Listen for: Stage-appropriate team structure, clear hiring priorities</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you work with bookkeepers, accountants, and auditors?"</strong><br/><span className="text-sm text-gray-600">Listen for: Clear delegation, quality oversight, vendor management</span></li>
                    <li className="text-gray-700"><strong className="text-gray-900">"How do you collaborate with other executives and founders?"</strong><br/><span className="text-sm text-gray-600">Listen for: Business partnership mindset, challenging constructively</span></li>
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
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">The Fractional CFO Hiring Process</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">From first conversation to start date in 2-4 weeks.</p>
              </div>
              <HireProcessStepper accentColor="emerald" />
              <div className="mt-16 bg-emerald-50 border-2 border-emerald-200 p-10 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Timeline Breakdown</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div><h4 className="font-bold text-gray-900 mb-2">Week 1: Define & Source</h4><ul className="text-sm text-gray-700 space-y-1"><li>• Define financial requirements (Day 1-2)</li><li>• Post on job boards, ask for referrals (Day 2-3)</li><li>• Review candidates, shortlist 5-10 (Day 4-7)</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Week 2-3: Interview & Select</h4><ul className="text-sm text-gray-700 space-y-1"><li>• First-round interviews (45-min calls)</li><li>• Second round: modeling exercise or deep dive</li><li>• Reference checks (2-3 calls)</li><li>• Make offer and negotiate terms</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Week 4: Onboard & Start</h4><ul className="text-sm text-gray-700 space-y-1"><li>• Contract signing and admin setup</li><li>• Share financials access, systems, docs</li><li>• First week: financial audit and review</li><li>• Begin forecasting and planning work</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">First 90 Days: Deliver</h4><ul className="text-sm text-gray-700 space-y-1"><li>• Month 1: Financial audit, quick wins, reporting</li><li>• Month 2: Forecasting, board deck, processes</li><li>• Month 3: Strategic initiatives, hiring plan</li><li>• Decide to extend or part ways</li></ul></div>
                </div>
              </div>
            </div>
          </section>

          <section className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="mb-16">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-3 block">Contracts</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">Contract Terms & Structure</h2>
                <p className="text-xl text-gray-600 max-w-3xl">Standard terms for fractional CFO engagements.</p>
              </div>
              <div className="bg-gray-50 border-2 border-gray-200 p-10 rounded-lg">
                <h3 className="text-2xl font-bold text-gray-900 mt-0 mb-6">Standard Contract Template</h3>
                <div className="space-y-6">
                  <div><h4 className="font-bold text-gray-900 mb-2">Engagement Model</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Day rate:</strong> £800-£1,500 per day (based on experience)</li><li><strong>Commitment:</strong> 1-3 days per week (specify exact days)</li><li><strong>Monthly retainer option:</strong> £3,500-£6,000 for predictable billing</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Term & Notice</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Initial term:</strong> 3-month trial period</li><li><strong>Renewal:</strong> Auto-renew to 12-month rolling contract after trial</li><li><strong>Notice period:</strong> 30 days either side (standard)</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Scope of Work</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Responsibilities:</strong> Financial strategy, forecasting, board reporting, investor relations</li><li><strong>Deliverables:</strong> Monthly financials, board deck, forecasts, cash flow management</li><li><strong>Exclusions:</strong> Day-to-day bookkeeping (unless scoped), tax filings</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">IP & Confidentiality</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>IP ownership:</strong> Company owns all financial models and documentation</li><li><strong>Confidentiality:</strong> Standard NDA terms, survives termination (critical for financial data)</li><li><strong>Non-compete:</strong> Usually not applicable (fractional works with multiple companies)</li></ul></div>
                  <div><h4 className="font-bold text-gray-900 mb-2">Optional: Equity</h4><ul className="text-gray-700 space-y-1 text-base"><li><strong>Advisory shares:</strong> 0.25-0.5% for long-term engagements (12+ months)</li><li><strong>Vesting:</strong> Quarterly or annual vesting</li><li><strong>Cash reduction:</strong> If equity included, day rate may reduce 10-15%</li></ul></div>
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

          <section className="py-20 bg-emerald-600 text-white">
            <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to Hire?</h2>
              <p className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">Browse 100+ pre-vetted fractional CFO candidates. Post your role and start interviews this week.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/fractional-cfo-jobs-uk" className="px-10 py-5 bg-white text-emerald-600 font-bold uppercase tracking-wider hover:bg-emerald-50 transition-colors">Browse CFO Candidates</Link>
                <Link href="/contact" className="px-10 py-5 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-emerald-600 transition-colors">Post Your Role</Link>
              </div>
            </div>
          </section>

          <section className="py-12 bg-white border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Related Resources</span>
                <div className="flex flex-wrap gap-4">
                  <Link href="/fractional-cfo" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Fractional CFO Guide</Link>
                  <Link href="/fractional-cfo-cost" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">CFO Cost Guide</Link>
                  <Link href="/fractional-cfo-services" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">CFO Services</Link>
                  <Link href="/fractional-cfo-salary" className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">CFO Salary Data</Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </CopilotSidebar>
    </main>
  );
}
