// SEO Content for Fractional CFO Jobs UK Page
// High-ranking page - preserve text structure

export const cfoJobsUkSEO = {
  meta: {
    title: "Fractional CFO Jobs UK | Part-Time Finance Director Roles",
    description:
      "Find fractional CFO and part-time Finance Director jobs across the UK. Day rates £1,000-£1,500. FCA-regulated, PE-backed, and high-growth companies seeking interim finance leadership.",
    keywords: [
      "fractional cfo jobs uk",
      "fractional cfo",
      "part time cfo uk",
      "interim cfo jobs",
      "fractional finance director",
      "portfolio cfo",
      "part time finance director",
    ],
  },

  breadcrumb: [
    { name: "Home", url: "/" },
    { name: "UK Jobs", url: "/fractional-jobs" },
    { name: "CFO Jobs", url: "/fractional-cfo-jobs-uk" },
  ],

  hero: {
    headline: "Fractional CFO Jobs UK",
    subtitle:
      "Part-time Finance Director and CFO roles across the United Kingdom",
    stats: {
      avgDayRate: "£1,000-£1,500",
      hubStatus: "Premium Roles",
      hybridOptions: "70% Hybrid",
    },
  },

  content: {
    whyLondon: {
      title: "Why Fractional CFO Demand is Surging",
      paragraphs: [
        "The fractional CFO model has become mainstream in the UK. PE-backed companies, high-growth startups, and established SMEs increasingly prefer flexible finance leadership to full-time hires. This creates exceptional opportunities for experienced finance leaders.",
        "Whether you're an ACA/ACCA qualified accountant seeking portfolio work, a former Finance Director exploring flexibility, or a CFO ready for varied challenges, the UK market offers compelling fractional opportunities.",
      ],
    },

    dayRates: {
      title: "Fractional CFO Day Rates by Sector",
      description:
        "Day rates vary significantly by sector and complexity:",
      rates: [
        { role: "PE-Backed", range: "£1,200 - £1,800/day", typical: "£1,400" },
        { role: "Fintech/FCA", range: "£1,100 - £1,600/day", typical: "£1,300" },
        { role: "High-Growth", range: "£1,000 - £1,400/day", typical: "£1,200" },
        { role: "SME/Family", range: "£800 - £1,200/day", typical: "£1,000" },
        { role: "Non-Profit", range: "£700 - £1,000/day", typical: "£850" },
      ],
    },

    locations: {
      title: "Key CFO Sectors",
      areas: [
        {
          name: "PE-Backed Companies",
          description:
            "High demand for CFOs experienced with investor reporting, bolt-on M&A, and value creation plans. Premium rates, typically 2-3 days/week.",
        },
        {
          name: "Fintech & Regulated",
          description:
            "FCA-regulated companies need CFOs familiar with regulatory capital, compliance reporting, and governance frameworks.",
        },
        {
          name: "Scale-Up CFOs",
          description:
            "Series A-C companies seeking CFOs for fundraising support, board reporting, and financial infrastructure building.",
        },
      ],
    },

    emergingRoles: {
      title: "Specialist CFO Roles",
      roles: [
        {
          title: "M&A CFO",
          description:
            "Specialists in due diligence, carve-outs, and post-merger integration. High-value project work.",
        },
        {
          title: "IPO CFO",
          description:
            "Experience preparing companies for public markets. Audit readiness, governance, investor relations.",
        },
        {
          title: "Turnaround CFO",
          description:
            "Crisis management, cash flow optimization, stakeholder negotiation. Intensive engagements.",
        },
        {
          title: "FP&A Leader",
          description:
            "Strategic planning, forecasting, business partnering. Often combined with broader CFO duties.",
        },
      ],
    },
  },

  faqs: [
    {
      question: "What qualifications do fractional CFOs need?",
      answer:
        "Most fractional CFO roles require ACA, ACCA, or CIMA qualification plus 10-15+ years post-qualification experience. Prior CFO, FD, or Finance Director experience is typically essential. Sector-specific credentials (FCA experience for fintech, etc.) add significant value.",
    },
    {
      question: "How much do fractional CFOs earn in the UK?",
      answer:
        "UK fractional CFOs typically earn £1,000-£1,500 per day, with PE-backed and FCA-regulated roles at the premium end. Working 2-3 days per week across multiple clients, annual earnings often exceed full-time CFO salaries while offering greater flexibility.",
    },
    {
      question: "What's the typical fractional CFO engagement?",
      answer:
        "Initial engagements typically run 6-12 months with 2-3 days per week commitment. Many evolve into longer relationships as companies value continuity. Some CFOs maintain 2-3 concurrent clients for portfolio diversity.",
    },
    {
      question: "Do fractional CFOs work remotely?",
      answer:
        "About 70% of fractional CFO roles offer hybrid arrangements. Finance leadership typically requires some on-site presence for board meetings, investor calls, and team management. Fully remote CFO roles exist but are less common.",
    },
  ],

  schema: {
    organization: {
      "@type": "Organization",
      name: "Fractional Quest",
      url: "https://fractional.quest",
    },
  },
};

export type CFOJobsUkSEOContent = typeof cfoJobsUkSEO;
