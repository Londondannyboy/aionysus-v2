import { Metadata } from "next";
import { JobPageClient } from "@/components/job-pages";
import { getJobsPageData } from "@/lib/jobs";
import { ukSEO } from "@/lib/seo-content/uk";

// SEO Metadata
export const metadata: Metadata = {
  title: ukSEO.meta.title,
  description: ukSEO.meta.description,
  keywords: ukSEO.meta.keywords,
  openGraph: {
    title: ukSEO.meta.title,
    description: ukSEO.meta.description,
    type: "website",
    url: "https://fractional.quest/fractional-jobs",
  },
};

// Revalidate every hour for fresh job data
export const revalidate = 3600;

export default async function FractionalJobsUKPage() {
  // Server-side data fetch - UK wide (no location filter)
  const { jobs, stats } = await getJobsPageData("uk");

  // Schema markup
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: ukSEO.breadcrumb.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://fractional.quest${item.url}`,
    })),
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: ukSEO.meta.title,
    description: ukSEO.meta.description,
    url: "https://fractional.quest/fractional-jobs",
    isPartOf: {
      "@type": "WebSite",
      name: "Fractional Quest",
      url: "https://fractional.quest",
    },
  };

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />

      {/* Page Content */}
      <JobPageClient
        location="uk"
        locationDisplay="UK"
        initialJobs={jobs}
        stats={stats}
        seoContent={ukSEO}
      />
    </>
  );
}
