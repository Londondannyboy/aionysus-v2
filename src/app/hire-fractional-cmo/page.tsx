import { Metadata } from "next";
import { ServicesTemplate } from "@/components/templates/ServicesTemplate";
import { CMO_SERVICE_FAQS } from "@/components/seo";

export const metadata: Metadata = {
  title: "Hire a Fractional CMO | Marketing Leadership On-Demand",
  description:
    "Hire an experienced Fractional CMO for your business. Get strategic marketing leadership at a fraction of full-time cost. Day rates from £700-£1,400. Book a free consultation.",
  keywords: [
    "hire fractional cmo",
    "fractional cmo services",
    "fractional marketing director",
    "part time cmo",
    "outsourced cmo",
    "fractional cmo uk",
  ],
  openGraph: {
    title: "Hire a Fractional CMO | Fractional Quest",
    description:
      "Strategic marketing leadership without the full-time commitment. Experienced CMOs available 1-3 days per week.",
    url: "https://fractional.quest/hire-fractional-cmo",
    type: "website",
  },
};

export default function HireFractionalCMOPage() {
  return (
    <ServicesTemplate
      // SEO
      title="Hire a Fractional CMO | Marketing Leadership On-Demand"
      description="Hire an experienced Fractional CMO for your business. Get strategic marketing leadership at a fraction of full-time cost."
      url="https://fractional.quest/hire-fractional-cmo"
      // Hero
      heroHeadline="Hire a Fractional CMO"
      heroSubheadline="Strategic Marketing Leadership Without the Full-Time Commitment"
      heroDescription="Get an experienced Chief Marketing Officer working with your team 1-3 days per week. Build your marketing strategy, lead your team, and drive growth—at a fraction of the cost of a full-time hire."
      roleType="CMO"
      // FAQ
      faqs={CMO_SERVICE_FAQS}
      // CTA
      ctaHeadline="Ready to Transform Your Marketing?"
      ctaDescription="Book a free 30-minute consultation to discuss your marketing challenges and see if a Fractional CMO is right for you."
      ctaButtonText="Book a Free Consultation"
      ctaButtonLink="/contact"
    />
  );
}
