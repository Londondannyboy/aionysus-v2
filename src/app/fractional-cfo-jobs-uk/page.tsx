import { Metadata } from "next";
import { JobPageClient } from "@/components/job-pages";
import { getJobsPageData } from "@/lib/jobs";
import { cfoJobsUkSEO } from "@/lib/seo-content/cfo-jobs-uk";

// SEO Metadata
export const metadata: Metadata = {
  title: cfoJobsUkSEO.meta.title,
  description: cfoJobsUkSEO.meta.description,
  keywords: cfoJobsUkSEO.meta.keywords,
  openGraph: {
    title: cfoJobsUkSEO.meta.title,
    description: cfoJobsUkSEO.meta.description,
    type: "website",
    url: "https://fractional.quest/fractional-cfo-jobs-uk",
  },
};

// Revalidate every hour for fresh job data
export const revalidate = 3600;

export default async function FractionalCFOJobsUKPage() {
  // Server-side data fetch - CFO roles across UK
  const { jobs, stats } = await getJobsPageData("cfo");

  // Schema markup
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: cfoJobsUkSEO.breadcrumb.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://fractional.quest${item.url}`,
    })),
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: cfoJobsUkSEO.meta.title,
    description: cfoJobsUkSEO.meta.description,
    url: "https://fractional.quest/fractional-cfo-jobs-uk",
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
        location="cfo"
        locationDisplay="CFO UK"
        initialJobs={jobs}
        stats={stats}
        seoContent={cfoJobsUkSEO}
      />
    </>
  );
}
