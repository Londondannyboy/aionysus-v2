'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQProps {
  items?: FAQItem[]
  faqs?: FAQItem[]  // Alias for backwards compatibility
  title?: string
  className?: string
  skipSchema?: boolean  // Set to true if page has its own FAQPage schema
}

export function FAQ({ items, faqs, title = 'Frequently Asked Questions', className = '', skipSchema = false }: FAQProps) {
  // Support both 'items' and 'faqs' prop names
  const faqItems = items || faqs || []

  const [openIndex, setOpenIndex] = useState<number | null>(0) // First item open by default

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  // Generate JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <section className={`${className}`}>
      {/* JSON-LD structured data for SEO - skip if page has its own FAQPage schema */}
      {!skipSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {title && (
        <h2 className="text-3xl font-bold text-gray-900 mb-8 font-editorial">{title}</h2>
      )}

      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-xl overflow-hidden bg-white card-hover"
          >
            <button
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={openIndex === index}
            >
              <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
              <span className="flex-shrink-0 ml-4">
                <svg
                  className={`w-5 h-5 text-accent transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div
                className="p-6 pt-0 text-gray-600 leading-relaxed [&_a]:text-accent [&_a]:underline [&_a]:hover:text-accent-dark"
                dangerouslySetInnerHTML={{ __html: item.answer }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// Pre-defined FAQ sets for common pages
export const CMO_FAQS: FAQItem[] = [
  {
    question: 'What is a Fractional CMO?',
    answer: 'A Fractional CMO (Chief Marketing Officer) is an experienced marketing executive who works with companies on a part-time or contract basis, typically 1-3 days per week. They provide strategic marketing leadership without the commitment and cost of a full-time hire, making senior marketing expertise accessible to startups, scale-ups, and SMEs.',
  },
  {
    question: 'How much do Fractional CMO jobs pay in the UK?',
    answer: 'Fractional CMO day rates in the UK typically range from £700 to £1,400 per day, depending on experience, industry, and location. London-based roles often command premium rates of £900-£1,400/day, while regional positions average £700-£1,000/day. Annual earnings for fractional CMOs working with multiple clients can range from £100,000 to £250,000+.',
  },
  {
    question: 'What qualifications do I need for Fractional CMO jobs?',
    answer: 'Successful Fractional CMO candidates typically have 12-15+ years of marketing experience with at least 5 years in senior leadership roles. Key requirements include a proven track record of driving revenue growth, expertise in specific marketing channels (performance, brand, PLG, ABM), experience building and managing teams, and strong stakeholder management skills.',
  },
  {
    question: 'How many days per week do Fractional CMOs work?',
    answer: 'Most Fractional CMO engagements involve 1-3 days per week per client. Many fractional CMOs work with 2-4 clients simultaneously, totaling 4-5 working days per week. Engagement intensity often varies based on company needs - increasing during product launches or fundraising and reducing during steady-state periods.',
  },
  {
    question: 'What industries hire Fractional CMOs in the UK?',
    answer: 'The highest demand for Fractional CMOs in the UK comes from B2B SaaS companies, FinTech, DTC/E-commerce, HealthTech, and Professional Services. Startups post-Series A frequently hire fractional CMOs to establish marketing foundations, while established SMEs use them for specific initiatives like rebranding or market expansion.',
  },
  {
    question: 'What is the difference between a Fractional CMO and a Marketing Consultant?',
    answer: 'A Fractional CMO is an embedded executive who takes ownership of marketing strategy and typically manages teams, attends leadership meetings, and is accountable for results. A Marketing Consultant typically provides advice and recommendations on specific projects without the ongoing leadership responsibilities. Fractional CMOs are often seen as part of the executive team.',
  },
]

export const CFO_FAQS: FAQItem[] = [
  {
    question: 'What is a Fractional CFO?',
    answer: 'A Fractional CFO (Chief Financial Officer) is an experienced finance executive who works with companies on a part-time basis, typically 1-3 days per week. They provide strategic financial leadership, fundraising support, and financial operations expertise without the cost of a full-time CFO hire.',
  },
  {
    question: 'How much do Fractional CFO jobs pay in the UK?',
    answer: 'Fractional CFO day rates in the UK typically range from £800 to £1,500 per day, with London roles often at the higher end. Annual earnings for experienced fractional CFOs with multiple clients can exceed £200,000.',
  },
  {
    question: 'What qualifications do I need for Fractional CFO jobs?',
    answer: 'Fractional CFOs typically need ACA, ACCA, or CIMA qualifications, 15+ years of finance experience including senior leadership roles, and expertise in areas like fundraising, M&A, or financial transformation. Industry-specific knowledge (e.g., SaaS metrics, e-commerce) is highly valued.',
  },
  {
    question: 'What do Fractional CFOs do?',
    answer: 'Fractional CFOs handle strategic financial planning, fundraising and investor relations, financial reporting and compliance, cash flow management, building finance teams, M&A support, and board reporting. They act as a strategic partner to the CEO and leadership team.',
  },
]

export const CTO_FAQS: FAQItem[] = [
  {
    question: 'What is a Fractional CTO?',
    answer: 'A Fractional CTO (Chief Technology Officer) is an experienced technology leader who works with companies on a part-time basis. They provide technical strategy, architecture guidance, and engineering leadership without the commitment of a full-time CTO hire.',
  },
  {
    question: 'How much do Fractional CTO jobs pay in the UK?',
    answer: 'Fractional CTO day rates in the UK typically range from £800 to £1,600 per day, with highly specialized roles (AI, security) commanding premium rates. London-based and FinTech roles often pay at the higher end of this range.',
  },
  {
    question: 'When should a company hire a Fractional CTO?',
    answer: 'Companies typically hire Fractional CTOs when they need technical leadership but cannot justify or afford a full-time CTO. Common scenarios include early-stage startups building their first product, companies needing technical due diligence for fundraising, or businesses undergoing digital transformation.',
  },
]

export const COO_FAQS: FAQItem[] = [
  {
    question: 'What is a Fractional COO?',
    answer: 'A Fractional COO (Chief Operating Officer) is an experienced operations executive who works with companies on a part-time basis. They focus on operational efficiency, process optimization, scaling operations, and implementing systems to support growth.',
  },
  {
    question: 'How much do Fractional COO jobs pay in the UK?',
    answer: 'Fractional COO day rates in the UK typically range from £700 to £1,300 per day. Rates vary based on industry, company stage, and specific operational challenges being addressed.',
  },
  {
    question: 'What does a Fractional COO do?',
    answer: 'Fractional COOs focus on operational strategy, process improvement, team structure optimization, implementing operational systems, managing key initiatives, and ensuring the business can scale efficiently. They often work closely with the CEO to execute on strategic priorities.',
  },
]

// Service-focused FAQs (for company/employer audience)
export const CMO_SERVICE_FAQS: FAQItem[] = [
  {
    question: 'What is a Fractional CMO?',
    answer: 'A Fractional CMO is an experienced Chief Marketing Officer who works with your company part-time, typically 1-3 days per week. You get strategic marketing leadership, team management, and growth expertise without the cost of a full-time executive hire.',
  },
  {
    question: 'When should my company hire a Fractional CMO?',
    answer: 'Consider hiring a fractional CMO when: you need to build or rebuild your marketing strategy; your marketing team needs senior leadership; you\'re scaling and need to professionalise marketing; you\'re launching into new markets or segments; your current marketing isn\'t delivering results; or you need expertise in specific areas (PLG, demand gen, brand).',
  },
  {
    question: 'How much does a Fractional CMO cost?',
    answer: 'Fractional CMOs typically charge £700-£1,400 per day in the UK. At 2 days per week, this translates to roughly £70,000-£140,000 annually—compared to £150,000-£250,000+ for a full-time CMO (including salary, benefits, and overhead). You save 40-60% while getting equivalent expertise.',
  },
  {
    question: 'What does a Fractional CMO do?',
    answer: 'A Fractional CMO develops marketing strategy, manages and mentors your marketing team, oversees campaigns and channels, builds marketing infrastructure, tracks performance metrics, manages agency relationships, aligns marketing with sales, and reports to the board on marketing performance and ROI.',
  },
  {
    question: 'How is a Fractional CMO different from a marketing agency?',
    answer: 'A Fractional CMO is an embedded leader—they join your team, attend leadership meetings, manage your people, and take ownership of results. Agencies execute specific campaigns or channels but don\'t provide strategic leadership or team management. Many companies use both: a fractional CMO to lead strategy with agencies handling execution.',
  },
  {
    question: 'How quickly can a Fractional CMO make an impact?',
    answer: 'Most fractional CMOs can begin adding value within the first 2-4 weeks—conducting audits, identifying quick wins, and developing initial strategy. Significant results typically emerge within 3-6 months as strategies are implemented. The key is that fractional CMOs are experienced and can move fast.',
  },
]

export const CFO_SERVICE_FAQS: FAQItem[] = [
  {
    question: 'What is a Fractional CFO?',
    answer: 'A Fractional CFO is an experienced Chief Financial Officer who works with your company on a part-time basis, typically 1-3 days per week. You get senior-level financial leadership, strategic guidance, and hands-on expertise at a fraction of the cost of a full-time CFO.',
  },
  {
    question: 'When should my company hire a Fractional CFO?',
    answer: 'Consider hiring a fractional CFO when: you\'re preparing for fundraising or due diligence; your finance function needs professionalising; you need strategic financial guidance but can\'t justify a full-time CFO; you\'re scaling rapidly and need to build financial infrastructure; or you\'re navigating a major transition (M&A, restructuring, IPO prep).',
  },
  {
    question: 'How much does a Fractional CFO cost?',
    answer: 'Fractional CFOs typically charge £800-£1,500 per day in the UK, depending on experience and specialisation. At 2 days per week, this translates to roughly £80,000-£150,000 annually—compared to £180,000-£300,000+ for a full-time CFO (including salary, benefits, and overhead).',
  },
  {
    question: 'Can a Fractional CFO help with fundraising?',
    answer: 'Yes—fundraising support is one of the most common reasons to hire a fractional CFO. They can build financial models, prepare data rooms, create investor presentations, manage due diligence, negotiate terms, and provide credibility with investors. Many fractional CFOs have raised hundreds of millions across multiple deals.',
  },
]

export const CTO_SERVICE_FAQS: FAQItem[] = [
  {
    question: 'What is a Fractional CTO?',
    answer: 'A Fractional CTO is an experienced Chief Technology Officer who works with your company part-time, typically 1-3 days per week. You get technical leadership, architecture guidance, and engineering strategy without the cost of a full-time CTO.',
  },
  {
    question: 'When should my company hire a Fractional CTO?',
    answer: 'Consider hiring a fractional CTO when: you\'re building your first product and need technical direction; your engineering team needs senior leadership; you\'re preparing for fundraising and need technical credibility; you\'re scaling and need to evolve your architecture; or you need expertise in specific areas (AI, security, cloud migration).',
  },
  {
    question: 'How much does a Fractional CTO cost?',
    answer: 'Fractional CTOs typically charge £850-£1,600 per day in the UK, with specialised expertise (AI, security) at the higher end. At 2 days per week, this translates to roughly £85,000-£160,000 annually—compared to £180,000-£350,000+ for a full-time CTO.',
  },
  {
    question: 'Can a Fractional CTO help with technical due diligence?',
    answer: 'Yes—technical due diligence is a common reason to engage a fractional CTO. They can prepare your technology for investor scrutiny, address technical debt concerns, document architecture, and represent your technical capabilities during fundraising or M&A processes.',
  },
]

export const COO_SERVICE_FAQS: FAQItem[] = [
  {
    question: 'What is a Fractional COO?',
    answer: 'A Fractional COO is an experienced Chief Operating Officer who works with your company part-time, typically 1-3 days per week. You get operational leadership, process optimisation, and scaling expertise without the cost of a full-time COO.',
  },
  {
    question: 'When should my company hire a Fractional COO?',
    answer: 'Consider hiring a fractional COO when: you\'re scaling rapidly and operations are struggling to keep up; your processes are inefficient or undocumented; you need to build operational infrastructure; you\'re experiencing growing pains; or the CEO is spending too much time on operations instead of strategy.',
  },
  {
    question: 'How much does a Fractional COO cost?',
    answer: 'Fractional COOs typically charge £750-£1,400 per day in the UK. At 2 days per week, this translates to roughly £75,000-£140,000 annually—compared to £160,000-£250,000+ for a full-time COO.',
  },
  {
    question: 'What does a Fractional COO do?',
    answer: 'A Fractional COO optimises operations and processes, implements systems and tools, manages key initiatives and projects, builds operational teams, creates playbooks and SOPs, oversees vendor relationships, drives cross-functional alignment, and frees the CEO to focus on strategy and growth.',
  },
]

// Export FAQItem type for use in other components
export type { FAQItem }
