"use client";

import { useCallback, useEffect, useState } from "react";
import { useCoAgent, useCopilotChat } from "@copilotkit/react-core";
import { CopilotSidebar, CopilotKitCSSProperties } from "@copilotkit/react-ui";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import { authClient } from "@/lib/auth/client";
import { VoiceInput } from "@/components/voice-input";
import { FAQ, FAQItem } from "@/components/seo";
import { WebPageSchema, FAQPageSchema } from "@/components/seo";

interface ServiceTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

interface ServicesTemplateProps {
  // SEO
  title: string;
  description: string;
  url: string;

  // Content
  heroHeadline: string;
  heroSubheadline: string;
  heroDescription: string;
  roleType: string; // CMO, CTO, CFO, COO

  // Service tiers
  tiers?: ServiceTier[];

  // Process steps
  processSteps?: ProcessStep[];

  // FAQ
  faqs: FAQItem[];

  // CTA
  ctaHeadline?: string;
  ctaDescription?: string;
  ctaButtonText?: string;
  ctaButtonLink?: string;
}

// Default service tiers
const defaultTiers: ServiceTier[] = [
  {
    name: "Starter",
    price: "£3,000/mo",
    description: "1 day per week",
    features: [
      "Strategic guidance",
      "Monthly planning sessions",
      "Team oversight",
      "Slack/email support",
    ],
  },
  {
    name: "Growth",
    price: "£6,000/mo",
    description: "2 days per week",
    features: [
      "Everything in Starter",
      "Hands-on execution",
      "Weekly leadership meetings",
      "Investor reporting",
      "Agency management",
    ],
    highlight: true,
  },
  {
    name: "Scale",
    price: "£9,000/mo",
    description: "3 days per week",
    features: [
      "Everything in Growth",
      "Full strategic ownership",
      "Board presentations",
      "Hiring & team building",
      "Priority availability",
    ],
  },
];

// Default process steps
const defaultProcessSteps: ProcessStep[] = [
  {
    number: "01",
    title: "Discovery Call",
    description: "We discuss your challenges, goals, and determine if we're a good fit.",
  },
  {
    number: "02",
    title: "Proposal & Kickoff",
    description: "We scope the engagement and start with a deep-dive into your business.",
  },
  {
    number: "03",
    title: "Strategy & Execution",
    description: "We develop and implement a roadmap tailored to your specific needs.",
  },
  {
    number: "04",
    title: "Ongoing Partnership",
    description: "Continuous support, reporting, and iteration based on results.",
  },
];

export function ServicesTemplate({
  title,
  description,
  url,
  heroHeadline,
  heroSubheadline,
  heroDescription,
  roleType,
  tiers = defaultTiers,
  processSteps = defaultProcessSteps,
  faqs,
  ctaHeadline = "Ready to Get Started?",
  ctaDescription = "Book a free consultation to discuss your needs.",
  ctaButtonText = "Book a Call",
  ctaButtonLink = "/contact",
}: ServicesTemplateProps) {
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
            metadata: { page: `hire-fractional-${roleType.toLowerCase()}`, service: true }
          }),
        }).catch(e => console.warn('Failed to store to Zep:', e));
      }

      const messageRole = role === "user" ? Role.User : Role.Assistant;
      appendMessage(new TextMessage({ content: text, role: messageRole }));
    },
    [appendMessage, user?.id, roleType]
  );

  // Dynamic suggestions
  const suggestions = [
    {
      title: "Pricing details",
      message: `Tell me about your Fractional ${roleType} pricing`,
    },
    {
      title: "How it works",
      message: `How does hiring a Fractional ${roleType} work?`,
    },
    {
      title: "Get started",
      message: `I'd like to discuss hiring a Fractional ${roleType}`,
    },
  ];

  return (
    <main
      style={{ "--copilot-kit-primary-color": "#2563eb" } as CopilotKitCSSProperties}
    >
      {/* Schema Markup */}
      <WebPageSchema
        title={title}
        description={description}
        url={url}
        dateModified={new Date('2025-01-07T00:00:00Z')}
      />
      <FAQPageSchema faqs={faqs} />

      <CopilotSidebar
        instructions={`## Service Page Context: Fractional ${roleType}

You're helping someone learn about our Fractional ${roleType} services.

**What we offer:**
- Part-time ${roleType} leadership (1-3 days/week)
- Strategic guidance and hands-on execution
- Team building and management
- Board/investor support

**Pricing tiers:**
${tiers.map(t => `- ${t.name}: ${t.price} (${t.description})`).join('\n')}

**Your approach:**
1. Be helpful and consultative
2. Explain the value of fractional leadership
3. Answer questions about pricing, process, and fit
4. Guide interested visitors toward booking a call
5. Be confident about our expertise`}
        labels={{
          title: `Fractional ${roleType} Services`,
          initial: firstName
            ? `Hi ${firstName}! 👋 Interested in learning about our Fractional ${roleType} services? I can explain how it works, pricing, and help you decide if it's right for your company.`
            : `Welcome! 👋 Looking for Fractional ${roleType} leadership? I can explain how our services work and help you find the right fit for your needs.`,
        }}
        suggestions={suggestions}
        clickOutsideToClose={false}
      >
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white py-20 px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="container-content relative z-10">
            <div className="max-w-3xl">
              <span className="inline-block bg-white/20 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                Fractional {roleType} Services
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight font-editorial text-white">
                {heroHeadline}
              </h1>
              <p className="text-xl md:text-2xl opacity-90 mb-4">
                {heroSubheadline}
              </p>
              <p className="text-lg opacity-80 mb-8 max-w-2xl">
                {heroDescription}
              </p>

              {/* Voice Widget */}
              <div className="flex items-center gap-4">
                <VoiceInput
                  onMessage={handleVoiceMessage}
                  firstName={firstName}
                  userId={user?.id}
                  pageContext={{
                    location: "UK",
                    totalJobs: 0,
                    topRoles: [roleType],
                  }}
                />
                <span className="text-sm opacity-70">
                  Ask about our {roleType} services
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-20 bg-white">
          <div className="container-content">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2 block">
                Pricing
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-editorial">
                Fractional {roleType} Packages
              </h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                Flexible engagement models to match your needs and budget.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {tiers.map((tier, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-8 ${
                    tier.highlight
                      ? "bg-gray-900 text-white ring-4 ring-accent"
                      : "bg-gray-50 text-gray-900"
                  }`}
                >
                  {tier.highlight && (
                    <span className="inline-block bg-accent text-white px-3 py-1 rounded-full text-xs font-bold mb-4">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                  <div className="text-3xl font-bold mb-1">{tier.price}</div>
                  <p className={`text-sm mb-6 ${tier.highlight ? "text-gray-400" : "text-gray-500"}`}>
                    {tier.description}
                  </p>
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg className={`w-5 h-5 flex-shrink-0 ${tier.highlight ? "text-accent" : "text-green-500"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className={`text-sm ${tier.highlight ? "text-gray-300" : "text-gray-600"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={ctaButtonLink}
                    className={`mt-8 block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                      tier.highlight
                        ? "bg-accent hover:bg-accent-dark text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  >
                    Get Started
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-gray-50">
          <div className="container-content">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2 block">
                Process
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-editorial">
                How It Works
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {processSteps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-accent mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container-content">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2 block">
                  FAQ
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-editorial">
                  Common Questions
                </h2>
              </div>
              <FAQ items={faqs} title="" skipSchema={true} />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-900 text-white">
          <div className="container-content text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-editorial">
              {ctaHeadline}
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              {ctaDescription}
            </p>
            <a
              href={ctaButtonLink}
              className="inline-block bg-accent hover:bg-accent-dark text-white font-bold py-4 px-8 rounded-lg transition-colors"
            >
              {ctaButtonText}
            </a>
          </div>
        </section>
      </CopilotSidebar>
    </main>
  );
}
