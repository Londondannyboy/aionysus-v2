import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createDbQuery } from '@/lib/db'
import { FAQ, CMO_FAQS } from '@/components/seo/FAQ'
import { RoleCalculator } from '@/components/RoleCalculator'
import { IR35Calculator } from '@/components/IR35Calculator'
import { RoleNews } from '@/components/RoleNews'
import { ServerJobGrid } from '@/components/ServerJobGrid'
import { BreadcrumbsLight } from '@/components/Breadcrumbs'
import { JobListingSchema } from '@/components/seo/JobPostingSchema'
import { getRoleBreadcrumbs } from '@/lib/seo-config'
import { WebPageSchema, LastUpdatedBadge } from '@/components/seo/WebPageSchema'
import { FAQPageSchema } from '@/components/seo/FAQPageSchema'
import { ExpertProfile, ExpertProfileSchema } from '@/components/ExpertProfile'
import { CaseStudy, CaseStudySchema } from '@/components/CaseStudy'
import { LazyYouTube } from '@/components/LazyYouTube'
import { HotJobsLines } from '@/components/HotJobsLines'
import { RoleContentHub } from '@/components/RoleContentHub'

export const revalidate = 3600

// Target keywords: "fractional cmo jobs uk", "fractional cmo uk", "fractional marketing jobs", "cmo salary uk", "part time cmo"
export const metadata: Metadata = {
  title: 'Fractional CMO Jobs UK | Part-Time CMO & Marketing Leadership Roles 2025',
  description: 'Fractional CMO jobs UK for experienced marketing leaders. Part-time CMO and fractional marketing jobs paying £700-£1,400/day. Browse fractional CMO UK roles, CMO salary UK rates, and fractional CMO services across London, Manchester, Bristol.',
  keywords: 'fractional cmo jobs uk, fractional cmo jobs, fractional cmo uk, fractional marketing jobs, part time cmo, part-time cmo, cmo salary uk, fractional cmo roles, fractional cmo services, cmo jobs uk, part time chief marketing officer, fractional cmo bristol',
  alternates: {
    canonical: 'https://fractional.quest/fractional-cmo-jobs-uk',
  },
  openGraph: {
    title: 'Fractional CMO Jobs UK | Part-Time CMO & Fractional Marketing Jobs',
    description: 'Fractional CMO jobs UK & fractional marketing jobs. Part-time CMO positions paying £700-£1,400/day. CMO salary UK guide included.',
    url: 'https://fractional.quest/fractional-cmo-jobs-uk',
    images: ['/images/fractional-cmo-jobs-uk.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fractional CMO Jobs UK | Part-Time CMO Roles',
    description: 'Fractional CMO UK - Part-time CMO & fractional marketing jobs £700-£1,400/day.',
  },
}

// UK location filter for all queries
const UK_FILTER = `(country ILIKE '%UK%' OR country ILIKE '%United Kingdom%' OR location ILIKE '%UK%' OR location ILIKE '%London%' OR location ILIKE '%Manchester%' OR location ILIKE '%Edinburgh%' OR location ILIKE '%Birmingham%' OR location ILIKE '%Bristol%' OR location ILIKE '%Leeds%' OR location ILIKE '%Glasgow%' OR location ILIKE '%England%' OR location ILIKE '%Scotland%' OR location ILIKE '%Wales%')`

async function getMarketingStats() {
  try {
    const sql = createDbQuery()
    const [totalResult, avgRateResult, remoteResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM jobs WHERE is_active = true AND role_category = 'Marketing' AND (country ILIKE '%UK%' OR country ILIKE '%United Kingdom%' OR location ILIKE '%UK%' OR location ILIKE '%London%' OR location ILIKE '%Manchester%' OR location ILIKE '%Edinburgh%' OR location ILIKE '%Birmingham%' OR location ILIKE '%Bristol%' OR location ILIKE '%Leeds%' OR location ILIKE '%Glasgow%' OR location ILIKE '%England%' OR location ILIKE '%Scotland%' OR location ILIKE '%Wales%')`,
      sql`SELECT AVG(CAST(REGEXP_REPLACE(compensation, '[^0-9]', '', 'g') AS BIGINT)) as avg FROM jobs WHERE is_active = true AND role_category = 'Marketing' AND (country ILIKE '%UK%' OR country ILIKE '%United Kingdom%' OR location ILIKE '%UK%' OR location ILIKE '%London%' OR location ILIKE '%Manchester%' OR location ILIKE '%Edinburgh%' OR location ILIKE '%Birmingham%' OR location ILIKE '%Bristol%' OR location ILIKE '%Leeds%' OR location ILIKE '%Glasgow%' OR location ILIKE '%England%' OR location ILIKE '%Scotland%' OR location ILIKE '%Wales%') AND compensation IS NOT NULL AND compensation ~ '^[£$]?[0-9]+'`,
      sql`SELECT COUNT(*) as count FROM jobs WHERE is_active = true AND role_category = 'Marketing' AND (country ILIKE '%UK%' OR country ILIKE '%United Kingdom%' OR location ILIKE '%UK%' OR location ILIKE '%London%' OR location ILIKE '%Manchester%' OR location ILIKE '%Edinburgh%' OR location ILIKE '%Birmingham%' OR location ILIKE '%Bristol%' OR location ILIKE '%Leeds%' OR location ILIKE '%Glasgow%' OR location ILIKE '%England%' OR location ILIKE '%Scotland%' OR location ILIKE '%Wales%') AND (is_remote = true OR workplace_type = 'Remote')`
    ])
    return {
      total: parseInt((totalResult[0] as any)?.count || '0'),
      avgRate: Math.round(parseFloat((avgRateResult[0] as any)?.avg || '950')),
      remoteCount: parseInt((remoteResult[0] as any)?.count || '0')
    }
  } catch {
    return { total: 38, avgRate: 950, remoteCount: 15 }
  }
}

async function getFeaturedCompanies() {
  try {
    const sql = createDbQuery()
    const companies = await sql`
      SELECT DISTINCT company_name
      FROM jobs
      WHERE is_active = true
        AND role_category = 'Marketing'
        AND company_name IS NOT NULL
        AND (country ILIKE '%UK%' OR country ILIKE '%United Kingdom%' OR location ILIKE '%UK%' OR location ILIKE '%London%' OR location ILIKE '%Manchester%' OR location ILIKE '%Edinburgh%' OR location ILIKE '%Birmingham%' OR location ILIKE '%Bristol%' OR location ILIKE '%Leeds%' OR location ILIKE '%Glasgow%' OR location ILIKE '%England%' OR location ILIKE '%Scotland%' OR location ILIKE '%Wales%')
      ORDER BY company_name
      LIMIT 30
    `
    return companies.map((c: any) => c.company_name)
  } catch {
    return []
  }
}

// Server-side job fetch for SEO - renders in initial HTML for crawlers (UK only)
async function getMarketingJobs() {
  try {
    const sql = createDbQuery()
    const jobs = await sql`
      SELECT
        id, slug, title, company_name, location, country, city, is_remote, workplace_type,
        compensation, role_category, skills_required, posted_date, hours_per_week, salary_min, salary_max, salary_currency,
        description_snippet
      FROM jobs
      WHERE is_active = true
        AND role_category = 'Marketing'
        AND title NOT ILIKE '%interim%'
        AND (country ILIKE '%UK%' OR country ILIKE '%United Kingdom%' OR location ILIKE '%UK%' OR location ILIKE '%London%' OR location ILIKE '%Manchester%' OR location ILIKE '%Edinburgh%' OR location ILIKE '%Birmingham%' OR location ILIKE '%Bristol%' OR location ILIKE '%Leeds%' OR location ILIKE '%Glasgow%' OR location ILIKE '%England%' OR location ILIKE '%Scotland%' OR location ILIKE '%Wales%')
      ORDER BY posted_date DESC NULLS LAST
      LIMIT 20
    `
    return jobs as any[]
  } catch {
    return []
  }
}

// Get related jobs from OTHER C-suite roles for cross-linking (UK only)
async function getRelatedJobs() {
  try {
    const sql = createDbQuery()
    const jobs = await sql`
      SELECT id, slug, title, company_name, location, is_remote, compensation, role_category, posted_date
      FROM jobs
      WHERE is_active = true
        AND role_category IS NOT NULL
        AND role_category != 'Marketing'
        AND title NOT ILIKE '%interim%'
        AND (country ILIKE '%UK%' OR country ILIKE '%United Kingdom%' OR location ILIKE '%UK%' OR location ILIKE '%London%' OR location ILIKE '%Manchester%' OR location ILIKE '%Edinburgh%' OR location ILIKE '%Birmingham%' OR location ILIKE '%Bristol%' OR location ILIKE '%Leeds%' OR location ILIKE '%Glasgow%' OR location ILIKE '%England%' OR location ILIKE '%Scotland%' OR location ILIKE '%Wales%')
      ORDER BY posted_date DESC NULLS LAST
      LIMIT 15
    `
    return jobs
  } catch {
    return []
  }
}

export default async function FractionalCmoJobsUkPage() {
  const [stats, companies, jobs, relatedJobs] = await Promise.all([
    getMarketingStats(),
    getFeaturedCompanies(),
    getMarketingJobs(),
    getRelatedJobs()
  ])

  const mostRecentJob = jobs[0]
  const lastUpdatedDate = mostRecentJob?.posted_date ? new Date(mostRecentJob.posted_date) : new Date()

  return (
    <div className="min-h-screen bg-white">
      <WebPageSchema
        title="Fractional CMO Jobs UK | Part-Time CMO & Fractional Marketing Jobs"
        description="Fractional CMO jobs UK and fractional marketing jobs for experienced marketing leaders. Part-time CMO positions paying £700-£1,400/day. CMO salary UK guide and fractional CMO services across the UK."
        url="https://fractional.quest/fractional-cmo-jobs-uk"
        dateModified={lastUpdatedDate}
        itemCount={stats.total}
      />
      <FAQPageSchema faqs={CMO_FAQS} />

      {/* Video Schema for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": "What is a Fractional CMO? Role Explained",
            "description": "Learn what a fractional CMO UK does and how part-time CMO leaders help UK businesses grow. Discover fractional CMO jobs, fractional marketing jobs, CMO salary UK rates, and how fractional CMO services provide strategic guidance to startups and scale-ups.",
            "thumbnailUrl": "https://img.youtube.com/vi/L8vLq6nqQdM/maxresdefault.jpg",
            "uploadDate": "2024-02-01",
            "duration": "PT8M45S",
            "contentUrl": "https://www.youtube.com/watch?v=L8vLq6nqQdM",
            "embedUrl": "https://www.youtube.com/embed/L8vLq6nqQdM",
            "publisher": {
              "@type": "Organization",
              "name": "Fractional Quest",
              "logo": { "@type": "ImageObject", "url": "https://fractional.quest/logo.png" }
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": "Fractional CMO vs Marketing Consultant",
            "description": "Understand the difference between a fractional CMO UK and a marketing consultant. Learn about fractional CMO roles, part-time CMO options, and how fractional marketing jobs provide embedded leadership versus project-based advice.",
            "thumbnailUrl": "https://img.youtube.com/vi/R8xXiQA7F5o/maxresdefault.jpg",
            "uploadDate": "2024-03-20",
            "duration": "PT10M15S",
            "contentUrl": "https://www.youtube.com/watch?v=R8xXiQA7F5o",
            "embedUrl": "https://www.youtube.com/embed/R8xXiQA7F5o",
            "publisher": {
              "@type": "Organization",
              "name": "Fractional Quest",
              "logo": { "@type": "ImageObject", "url": "https://fractional.quest/logo.png" }
            }
          })
        }}
      />

      <JobListingSchema jobs={jobs} pageUrl="https://fractional.quest/fractional-cmo-jobs-uk" />

      {/* Hero with Aspirational Image */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        {/* Background Image - Marketing professional */}
        <Image
          src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=1920&q=80"
          alt="Fractional CMO UK - Part-time CMO and fractional marketing jobs professional"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/85 via-orange-500/70 to-pink-500/50" />
        <div className="relative z-10 w-full py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <BreadcrumbsLight items={getRoleBreadcrumbs('cmo', 'jobs')} className="mb-8" />
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-12">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="inline-block bg-white/20 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                    Fractional Marketing Jobs
                  </span>
                  <LastUpdatedBadge date={lastUpdatedDate} className="text-white/70" />
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  <strong>Fractional CMO Jobs UK</strong> & Part-Time CMO Roles
                </h1>
                <p className="text-xl text-white/90 leading-relaxed max-w-2xl mb-8">
                  <strong>Fractional CMO UK</strong> and <strong>part-time CMO</strong> roles for experienced marketing leaders.
                  Browse <strong>fractional marketing jobs</strong> with <strong>CMO salary UK</strong> rates of £700-£1,400/day.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="#jobs" className="px-8 py-4 bg-white text-amber-700 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                    Browse Jobs
                  </Link>
                  <Link href="/fractional-cmo-salary" className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors">
                    Salary Guide
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gray-900 py-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white">{stats.total}+</div>
              <div className="text-sm text-gray-400">Live Roles</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">£{stats.avgRate}</div>
              <div className="text-sm text-gray-400">Avg Day Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{stats.remoteCount}</div>
              <div className="text-sm text-gray-400">Remote Roles</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">2-3 days</div>
              <div className="text-sm text-gray-400">Avg Engagement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Jobs Lines - Latest CMO Jobs */}
      {(jobs as any[]).length > 0 && (
        <section className="py-6 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <HotJobsLines
              jobs={(jobs as any[]).map(job => ({
                id: job.id,
                slug: job.slug,
                title: job.title,
                company_name: job.company_name,
                location: job.location,
                is_remote: job.is_remote,
                compensation: job.compensation,
                role_category: job.role_category,
                posted_date: job.posted_date
              }))}
              title="Latest CMO Jobs"
              maxJobs={12}
              viewAllHref="#jobs"
              viewAllText="See all jobs"
            />
          </div>
        </section>
      )}

      {/* JOBS SECTION - Server-rendered for SEO */}
      <section id="jobs" className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">Browse</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">Fractional CMO Jobs UK & Part-Time CMO Roles</h2>
            </div>
            <p className="text-gray-500">{jobs.length}+ live fractional CMO UK and fractional marketing jobs</p>
          </div>

          {/* Server-rendered job grid - visible to search engines */}
          <ServerJobGrid
            jobs={jobs}
            roleCategory="Marketing"
            ctaLink="/fractional-jobs-uk?department=Marketing"
            ctaText={`View All ${stats.total}+ Fractional Marketing Jobs`}
            maxJobs={9}
            showViewAll={true}
          />
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">CMO Salary UK</span>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900">
              CMO Salary UK Calculator - Fractional CMO Rates
            </h2>
          </div>
          <RoleCalculator role="cmo" />
        </div>
      </section>

      {/* Companies Hiring */}
      {companies.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-2 block">Who&apos;s Hiring</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">UK Companies Hiring Fractional CMOs</h2>
              <p className="text-gray-600 mt-2">These UK companies are actively looking for fractional CMO talent</p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
              {companies.map((company: string, index: number) => (
                <span
                  key={index}
                  className="text-xl md:text-2xl font-light text-gray-400 hover:text-amber-500 transition-colors cursor-default"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Editorial Content Section */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* Lead-in */}
          <div className="mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-4 block">The Guide</span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              Everything You Need to Know About<br />
              <span className="text-amber-700">Fractional CMO UK & Part-Time CMO Jobs</span>
            </h2>
            <div className="w-24 h-1 bg-amber-500"></div>
          </div>

          {/* SEO Image - Editorial Style */}
          <figure className="mb-16 -mx-6 lg:-mx-16">
            <img
              src="https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Fractional CMO UK - part-time CMO and fractional marketing jobs team strategy meeting"
              title="Fractional CMO Jobs UK - Part-Time CMO & Fractional Marketing Jobs"
              className="w-full h-80 md:h-96 object-cover"
            />
            <figcaption className="text-sm text-gray-500 mt-3 px-6 lg:px-16">
              Fractional CMO UK: Marketing leaders are embracing part-time CMO and fractional marketing jobs with competitive CMO salary UK rates
            </figcaption>
          </figure>

          {/* Article Content - Editorial Typography */}
          <article className="prose prose-lg prose-gray max-w-none">
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-8 font-light">
              <strong className="font-semibold text-gray-900">Fractional CMO jobs</strong> and <strong className="font-semibold text-gray-900">fractional marketing jobs</strong> represent the new frontier of marketing leadership. <strong>Part-time CMO</strong> positions where experienced leaders provide strategic guidance to multiple companies simultaneously—delivering world-class <strong>fractional CMO services</strong> at a fraction of the cost. According to <a href="https://www.ipse.co.uk/" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-700 underline">IPSE (Association of Independent Professionals and the Self-Employed)</a>, the UK&apos;s senior contractor market continues to expand, with <strong>fractional CMO UK</strong> and marketing leadership roles among the fastest-growing segments.
            </p>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">The Rise of Fractional CMO UK & Fractional Marketing Jobs</h3>
            <p>
              The UK market for <strong>fractional CMO jobs UK</strong> and <strong>fractional marketing jobs</strong> has exploded, with a 200% year-on-year increase in searches. Startups, scale-ups, and SMEs are accessing senior marketing talent through <strong>fractional CMO UK</strong> arrangements without the £120,000-£200,000 annual cost of a full-time Chief Marketing Officer. <strong>Part-time CMO</strong> and <strong>part-time cmo</strong> positions now represent a significant portion of the market.
            </p>

            <div className="bg-gray-50 p-8 my-10 border-l-4 border-amber-500">
              <p className="text-xl font-semibold text-gray-900 mb-0">
                &ldquo;Companies access CMO expertise for £1,500-£4,000/week instead of £10,000+ monthly for full-time.&rdquo;
              </p>
            </div>

            {/* Video 1: What is a Fractional CMO */}
            <div className="my-10 not-prose">
              <h4 className="text-lg font-bold text-gray-900 mb-4">What is a Fractional CMO?</h4>
              <LazyYouTube
                videoId="L8vLq6nqQdM"
                title="What is a Fractional CMO? Role Explained"
              />
              <p className="text-gray-500 text-sm mt-3">Learn how fractional CMOs provide strategic marketing leadership to UK businesses</p>
            </div>

            <div className="bg-amber-50 p-6 border border-amber-200 rounded-lg my-8 not-prose">
              <p className="text-amber-800 font-medium mb-3">Looking to hire a fractional CMO instead?</p>
              <Link href="/hire-fractional-cmo" className="inline-flex items-center text-amber-700 font-bold hover:text-amber-900">
                How to Hire a Fractional CMO →
              </Link>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Why Fractional CMO UK & Part-Time CMO Jobs Are Booming</h3>
            <p>
              The growth in <strong>fractional CMO UK</strong> and <strong>part-time CMO</strong> demand is supported by broader economic trends. The <a href="https://www.britishbusinessbank.co.uk/" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-700 underline">British Business Bank&apos;s research</a> shows UK SMEs are increasingly seeking flexible access to senior talent through <strong>fractional marketing jobs</strong>, while <a href="https://technation.io/" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-700 underline">Tech Nation data</a> highlights the UK tech sector&apos;s continued expansion, creating strong demand for <strong>fractional CMO services</strong>.
            </p>
            <ul className="space-y-3">
              <li><strong>Cost efficiency:</strong> <strong>Fractional CMO UK</strong> provides senior expertise at a fraction of the cost</li>
              <li><strong>Diverse experience:</strong> <strong>Part-time CMO</strong> leaders bring insights from multiple industries</li>
              <li><strong>Immediate impact:</strong> <strong>Fractional marketing jobs</strong> deliver strategy from day one</li>
              <li><strong>Scalability:</strong> Flex engagement based on business needs</li>
              <li><strong>VC expectations:</strong> Professional marketing leadership post-Series A through <strong>fractional CMO roles</strong></li>
            </ul>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Types of Fractional CMO Roles & Fractional Marketing Jobs</h3>
            <p>
              <strong>Fractional CMO roles</strong> and <strong>fractional marketing jobs</strong> in the UK span a wide range of specialisations, each commanding different <strong>CMO salary UK</strong> rates based on the complexity and demand. B2B SaaS <strong>part-time CMO</strong> positions tend to pay the highest rates due to the technical expertise required in product-led growth and demand generation strategies.
            </p>
            <div className="grid md:grid-cols-2 gap-6 not-prose my-8">
              {[
                { title: 'B2B SaaS CMO', desc: 'Demand generation & pipeline acceleration', rate: '£1,000-£1,400/day' },
                { title: 'DTC/E-commerce CMO', desc: 'Customer acquisition & brand building', rate: '£900-£1,300/day' },
                { title: 'Startup CMO', desc: 'Building marketing foundations Series A-C', rate: '£850-£1,200/day' },
                { title: 'Growth Marketing CMO', desc: 'Performance-focused CAC/LTV optimisation', rate: '£900-£1,300/day' },
              ].map((type, i) => (
                <div key={i} className="bg-gray-50 p-6 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-1">{type.title}</h4>
                  <p className="text-gray-600 text-sm mb-2">{type.desc}</p>
                  <span className="text-amber-700 font-semibold text-sm">{type.rate}</span>
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">CMO Salary UK: Fractional CMO Rates</h3>
            <p>
              <strong>CMO salary UK</strong> rates for <strong>fractional CMO</strong> positions vary significantly based on experience, specialisation, and location. Understanding <strong>CMO salary UK</strong> benchmarks is essential for both candidates seeking <strong>fractional CMO roles</strong> and companies hiring <strong>part-time CMO</strong> talent.
            </p>
            <div className="bg-gray-50 p-6 rounded-lg my-6 not-prose">
              <h4 className="font-bold text-gray-900 mb-4">CMO Salary UK - Typical Day Rates (2025)</h4>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Entry-level Fractional CMO:</strong> £600-£850/day</li>
                <li><strong>Mid-level Fractional CMO UK:</strong> £850-£1,100/day</li>
                <li><strong>Senior Part-Time CMO:</strong> £1,100-£1,400/day</li>
                <li><strong>Specialist CMO (PE/VC):</strong> £1,300-£1,600/day</li>
              </ul>
              <p className="text-sm text-gray-600 mt-4">CMO salary UK rates based on 2-3 days per week engagement. Full-time equivalent CMO salary UK ranges from £120,000-£200,000 annually.</p>
            </div>

            {/* Video 2: Fractional CMO vs Marketing Consultant */}
            <div className="my-10 not-prose">
              <h4 className="text-lg font-bold text-gray-900 mb-4">Fractional CMO vs Marketing Consultant</h4>
              <LazyYouTube
                videoId="R8xXiQA7F5o"
                title="Fractional CMO vs Marketing Consultant"
              />
              <p className="text-gray-500 text-sm mt-3">Understand the key differences between fractional CMO and marketing consultant roles</p>
            </div>

            {/* Second SEO Image */}
            <figure className="my-10 -mx-6 lg:-mx-16">
              <img
                src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Fractional CMO UK - Part-time CMO and fractional marketing jobs reviewing strategy and analytics"
                title="Fractional CMO Jobs UK - Part-Time CMO & CMO Salary UK"
                className="w-full h-64 md:h-80 object-cover"
              />
              <figcaption className="text-sm text-gray-500 mt-3 px-6 lg:px-16">
                Fractional CMO UK and part-time CMO roles offer flexible fractional marketing jobs opportunities with competitive CMO salary UK rates
              </figcaption>
            </figure>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional CMO Services: What Companies Need</h3>
            <p>
              <strong>Fractional CMO services</strong> encompass the full spectrum of strategic marketing leadership delivered on a flexible basis. Companies seeking <strong>fractional CMO UK</strong> talent typically need experienced leaders who can provide:
            </p>
            <ul className="space-y-2">
              <li><strong>Strategic Marketing Planning:</strong> Developing comprehensive marketing strategies aligned with business objectives</li>
              <li><strong>Brand Development:</strong> Building and evolving brand positioning, messaging, and identity</li>
              <li><strong>Demand Generation:</strong> Creating and optimising lead generation and pipeline acceleration programs</li>
              <li><strong>Marketing Team Leadership:</strong> Building, mentoring, and managing marketing teams and agencies</li>
              <li><strong>Performance Marketing:</strong> Overseeing paid acquisition, SEO, content, and conversion optimisation</li>
              <li><strong>Marketing Technology:</strong> Implementing and optimising martech stacks and analytics</li>
            </ul>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Fractional CMO Jobs by Location</h3>
            <p>
              London leads <strong>fractional CMO UK</strong> opportunities with 55% of roles, but <strong>fractional marketing jobs</strong> exist nationwide. Regional hubs like Manchester and Edinburgh are rapidly expanding their <strong>part-time CMO</strong> markets:
            </p>
            <ul className="space-y-2">
              <li><strong><Link href="/fractional-jobs-london" className="text-amber-700 hover:text-amber-700 underline">London Tech City</Link>:</strong> £900-£1,400/day - highest <strong>CMO salary UK</strong> rates</li>
              <li><strong>Manchester:</strong> £700-£1,000/day - growing <strong>fractional CMO UK</strong> hub</li>
              <li><strong>Bristol:</strong> £700-£1,000/day - <strong>fractional CMO services Bristol</strong> market expanding</li>
              <li><strong>Edinburgh:</strong> £700-£1,000/day - strong Scottish <strong>fractional marketing jobs</strong></li>
              <li><strong>Remote UK:</strong> £650-£950/day - nationwide <strong>part-time CMO</strong> opportunities</li>
            </ul>

            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Requirements for Fractional CMO Jobs</h3>
            <p>
              Professional credentials and continuous development are increasingly valued in fractional CMO roles. Many successful CMOs hold qualifications from bodies like the <a href="https://www.cim.co.uk" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-700 underline">Chartered Institute of Marketing (CIM)</a>. Understanding <a href="https://www.gov.uk/topic/business-tax/ir35" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-700 underline">IR35 compliance</a> is also essential for most fractional arrangements.
            </p>
            <ul className="space-y-2">
              <li>12-15+ years marketing experience, 5+ in senior leadership</li>
              <li>Proven track record of revenue/pipeline growth</li>
              <li>Deep channel expertise (performance, brand, PLG, ABM)</li>
              <li>Team building and management experience</li>
              <li>Board-level communication skills</li>
            </ul>

            <div className="bg-gray-50 text-gray-900 p-6 rounded-lg my-10 not-prose">
              <p className="text-gray-600 mb-3">Want to understand fractional CMO pricing?</p>
              <Link href="/fractional-cmo-cost" className="inline-flex items-center text-amber-500 font-bold hover:text-amber-400">
                View Fractional CMO Cost Guide →
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* IR35 Calculator Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">UK Tax</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              UK IR35 Calculator for Fractional CMO UK & Part-Time CMO Jobs
            </h2>
            <p className="text-gray-600 mt-4">
              As a <strong>fractional CMO UK</strong> or <strong>part-time CMO</strong>, your IR35 status significantly impacts your <strong>CMO salary UK</strong> take-home pay
            </p>
          </div>
          <IR35Calculator defaultDayRate={950} />
        </div>
      </section>

      {/* Marketing News */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <RoleNews category="Marketing" title="Latest UK Fractional Marketing Jobs & CMO News" limit={3} />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">
              Common Questions About Fractional CMO UK & Part-Time CMO Jobs
            </h2>
            <p className="text-gray-600 mt-4">
              Answers about <strong>fractional CMO jobs</strong>, <strong>fractional marketing jobs</strong>, <strong>CMO salary UK</strong> rates, and <strong>fractional CMO services</strong>
            </p>
          </div>
          <FAQ items={CMO_FAQS} title="" />
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">Resources</span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">UK Resources for Fractional CMO Jobs</h2>
            <p className="text-xl text-gray-500">Authoritative UK sources for fractional CMO professionals</p>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-amber-500">Professional Bodies</h3>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="https://www.marketingweek.com/" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-700 underline font-medium">
                    Marketing Week
                  </a>
                  {' '}&mdash; Leading UK marketing publication with industry news and insights
                </li>
                <li>
                  <a href="https://www.dma.org.uk/" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-700 underline font-medium">
                    Data & Marketing Association (DMA)
                  </a>
                  {' '}&mdash; UK trade association for data-driven marketing
                </li>
                <li>
                  <a href="https://www.iod.com/" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-700 underline font-medium">
                    Institute of Directors (IoD)
                  </a>
                  {' '}&mdash; Professional development for C-level executives
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-amber-500">Government & Regulation</h3>
              <ul className="space-y-3 text-gray-600">
                <li>
                  <a href="https://www.gov.uk/set-up-business" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-700 underline font-medium">
                    Gov.uk Business Setup Guide
                  </a>
                  {' '}&mdash; Official guidance for setting up as a fractional executive
                </li>
                <li>
                  <a href="https://www.cap.org.uk/" target="_blank" rel="noopener noreferrer" className="text-amber-700 hover:text-amber-700 underline font-medium">
                    Committee of Advertising Practice (CAP)
                  </a>
                  {' '}&mdash; UK advertising codes and compliance guidance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* E-E-A-T: Expert Profile */}
      <ExpertProfile />
      <ExpertProfileSchema />

      {/* E-E-A-T: Case Study */}
      <CaseStudy />
      <CaseStudySchema />

      {/* Related C-Suite Jobs */}
      {(relatedJobs as any[]).length > 0 && (
        <section className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Other C-Suite Opportunities
              </h2>
              <p className="text-gray-600">
                Explore other executive roles across the UK.
              </p>
            </div>
            <HotJobsLines
              jobs={(relatedJobs as any[]).map(job => ({
                id: job.id,
                slug: job.slug,
                title: job.title,
                company_name: job.company_name,
                location: job.location,
                is_remote: job.is_remote,
                compensation: job.compensation,
                role_category: job.role_category,
                posted_date: job.posted_date
              }))}
              title="Related Executive Roles"
              maxJobs={15}
              viewAllHref="/fractional-jobs-uk"
              viewAllText="View all UK jobs"
            />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 block">Fractional CMO UK</span>
          <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Find Fractional CMO UK & Part-Time CMO Jobs
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Create your profile and get matched with UK companies seeking <strong>fractional CMO</strong> and <strong>part-time CMO</strong> leadership.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/handler/sign-up"
              className="px-10 py-5 bg-amber-500 text-black font-bold uppercase tracking-wider hover:bg-amber-400 transition-colors"
            >
              Browse Fractional CMO Jobs
            </Link>
            <Link
              href="/fractional-cmo-salary"
              className="px-10 py-5 border-2 border-white text-white font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
            >
              CMO Salary UK Guide
            </Link>
          </div>
        </div>
      </section>

      {/* Related Pages */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <span className="text-sm font-bold uppercase tracking-wider text-gray-400">Related Pages</span>
            <div className="flex flex-wrap gap-4">
              <Link href="/fractional-jobs-london" className="text-gray-600 hover:text-amber-700 font-medium transition-colors">London Jobs</Link>
              <Link href="/fractional-cmo-salary" className="text-gray-600 hover:text-amber-700 font-medium transition-colors">CMO Salary UK</Link>
              <Link href="/hire-fractional-cmo" className="text-gray-600 hover:text-amber-700 font-medium transition-colors">Hire a CMO</Link>
              <Link href="/fractional-cfo-jobs-uk" className="text-gray-600 hover:text-amber-700 font-medium transition-colors">CFO Jobs UK</Link>
              <Link href="/fractional-cto-jobs-uk" className="text-gray-600 hover:text-amber-700 font-medium transition-colors">CTO Jobs UK</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Content Hub - Internal Linking */}
      <RoleContentHub currentRole="cmo" />
    </div>
  )
}
