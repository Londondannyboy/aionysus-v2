// SEO Content for UK Jobs Page (main hub)
// Text content preserved from fractional.quest for ranking continuity

export const ukSEO = {
  meta: {
    title: "Fractional Jobs UK | CTO, CFO, CMO Executive Roles Nationwide",
    description:
      "Browse 200+ fractional executive jobs across the UK. Find CTO, CFO, CMO, COO and CHRO roles with day rates from £800-£1,500. The UK's leading fractional talent marketplace.",
    keywords: [
      "fractional jobs uk",
      "fractional executive uk",
      "fractional cto uk",
      "fractional cfo uk",
      "part time executive jobs",
      "interim executive uk",
      "portfolio career uk",
    ],
  },

  breadcrumb: [
    { name: "Home", url: "/" },
    { name: "UK Jobs", url: "/fractional-jobs" },
  ],

  hero: {
    headline: "Fractional Jobs UK",
    subtitle:
      "CTO, CFO, CMO & executive roles across the United Kingdom",
    stats: {
      avgDayRate: "£800-£1,500",
      hubStatus: "200+ Roles",
      hybridOptions: "55% Hybrid",
    },
  },

  content: {
    whyLondon: {
      title: "Why the UK Leads in Fractional Executive Hiring",
      paragraphs: [
        "The UK has emerged as a global leader in the fractional executive model. From London's tech scene to Manchester's growing business hub, Scottish innovation centers to Birmingham's manufacturing heartland, UK companies increasingly value flexible C-suite expertise.",
        "This shift reflects broader changes in how businesses access leadership talent. Whether you're seeking fractional roles in fintech, healthtech, manufacturing, or professional services, the UK market offers unparalleled opportunities for portfolio careers.",
      ],
    },

    dayRates: {
      title: "UK Fractional Day Rates by Region",
      description:
        "Typical day rates for fractional executives across the UK, based on region and experience:",
      rates: [
        { role: "London", range: "£900 - £1,500/day", typical: "£1,100" },
        { role: "South East", range: "£800 - £1,300/day", typical: "£950" },
        { role: "Manchester", range: "£750 - £1,200/day", typical: "£900" },
        { role: "Scotland", range: "£700 - £1,100/day", typical: "£850" },
        { role: "Remote UK", range: "£700 - £1,200/day", typical: "£900" },
      ],
    },

    locations: {
      title: "UK Regional Hubs",
      areas: [
        {
          name: "London & South East",
          description:
            "The UK's primary hub for fractional executives. High concentration of startups, scale-ups, and established enterprises. Premium rates.",
        },
        {
          name: "Manchester & North West",
          description:
            "Growing tech and media scene. BBC, tech startups, and manufacturing. Strong demand for fractional CTOs and CMOs.",
        },
        {
          name: "Scotland",
          description:
            "Edinburgh and Glasgow offer fintech, gaming, and energy sector opportunities. Growing demand for fractional CFOs.",
        },
      ],
    },

    emergingRoles: {
      title: "In-Demand Fractional Roles",
      roles: [
        {
          title: "Fractional CTO",
          description:
            "Tech leadership for startups and scale-ups. AI/ML, cloud architecture, engineering management.",
        },
        {
          title: "Fractional CFO",
          description:
            "Financial strategy, fundraising, M&A support. High demand from PE-backed companies.",
        },
        {
          title: "Fractional CMO",
          description:
            "Growth marketing, brand strategy, digital transformation. Popular with D2C brands.",
        },
        {
          title: "Fractional COO",
          description:
            "Operations scaling, process optimization. Critical for high-growth companies.",
        },
      ],
    },
  },

  faqs: [
    {
      question: "What are typical fractional executive day rates in the UK?",
      answer:
        "UK fractional executives typically command £800-£1,500 per day, with London rates at the higher end. Rates vary by role, sector, and experience level. CFOs and CTOs generally command the highest rates.",
    },
    {
      question: "How many days per week do UK fractional roles require?",
      answer:
        "Most UK fractional roles require 2-3 days per week, though this varies significantly. Early-stage startups may need more intensive engagement (3-4 days), while established companies often work on 1-2 days per week.",
    },
    {
      question: "Are UK fractional roles mostly remote?",
      answer:
        "Approximately 55% of UK fractional roles offer hybrid arrangements. London roles tend toward more on-site presence, while regional and Remote UK roles offer greater flexibility. Most expect at least occasional in-person meetings.",
    },
    {
      question: "What qualifications do UK fractional executives need?",
      answer:
        "UK companies typically seek fractional executives with 10-15+ years of experience, including prior C-suite or senior leadership roles. Professional qualifications (ACA, CIMA for CFOs; relevant tech credentials for CTOs) and sector experience are valued.",
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

export type UKSEOContent = typeof ukSEO;
