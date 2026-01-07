import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createDbQuery } from '@/lib/db'
import { FAQ, CPO_FAQS } from '@/components/seo/FAQ'
import { IR35Calculator } from '@/components/IR35Calculator'
import { ServerJobGrid } from '@/components/ServerJobGrid'
import { BreadcrumbsLight } from '@/components/Breadcrumbs'
import { JobListingSchema } from '@/components/seo/JobPostingSchema'
import { getRoleBreadcrumbs } from '@/lib/seo-config'
import { WebPageSchema, LastUpdatedBadge } from '@/components/seo/WebPageSchema'
import { FAQPageSchema } from '@/components/seo/FAQPageSchema'
import { HotJobsLines } from '@/components/HotJobsLines'
import { RoleContentHub } from '@/components/RoleContentHub'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Fractional CPO Jobs UK | Part-Time Chief Product Officer Roles 2025',
  description: 'Fractional CPO jobs UK for experienced product leaders. Part-time CPO and fractional product director jobs paying £800-£1,400/day. Browse fractional CPO UK roles and product leadership positions.',
  keywords: 'fractional cpo jobs uk, fractional cpo uk, fractional product officer, part time cpo, fractional product jobs, cpo salary uk, fractional head of product',
  alternates: { canonical: 'https://fractional.quest/fractional-cpo-jobs-uk' },
  openGraph: {
    title: 'Fractional CPO Jobs UK | Part-Time Product Leadership Roles',
    description: 'Fractional CPO jobs UK & fractional product director positions paying £800-£1,400/day.',
    url: 'https://fractional.quest/fractional-cpo-jobs-uk',
  },
}

async function getProductStats() {
  try {
    const sql = createDbQuery()
    const [totalResult, avgRateResult, remoteResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM jobs WHERE is_active = true AND role_category = 'Product' AND (country ILIKE '%UK%' OR country ILIKE '%United Kingdom%' OR location ILIKE '%UK%' OR location ILIKE '%London%' OR location ILIKE '%Manchester%')`,
      sql`SELECT AVG(CAST(REGEXP_REPLACE(compensation, '[^0-9]', '', 'g') AS BIGINT)) as avg FROM jobs WHERE is_active = true AND role_category = 'Product' AND (country ILIKE '%UK%' OR location ILIKE '%UK%' OR location ILIKE '%London%') AND compensation IS NOT NULL AND compensation ~ '^[£$]?[0-9]+'`,
      sql`SELECT COUNT(*) as count FROM jobs WHERE is_active = true AND role_category = 'Product' AND (country ILIKE '%UK%' OR location ILIKE '%UK%' OR location ILIKE '%London%') AND (is_remote = true OR workplace_type = 'Remote')`
    ])
    return { total: parseInt((totalResult[0] as any)?.count || '0'), avgRate: Math.round(parseFloat((avgRateResult[0] as any)?.avg || '1100')), remoteCount: parseInt((remoteResult[0] as any)?.count || '0') }
  } catch { return { total: 30, avgRate: 1100, remoteCount: 12 } }
}

async function getProductJobs() {
  try {
    const sql = createDbQuery()
    const jobs = await sql`SELECT id, slug, title, company_name, location, country, city, is_remote, workplace_type, compensation, role_category, skills_required, posted_date, hours_per_week, salary_min, salary_max, salary_currency, description_snippet FROM jobs WHERE is_active = true AND role_category = 'Product' AND title NOT ILIKE '%interim%' AND (country ILIKE '%UK%' OR country ILIKE '%United Kingdom%' OR location ILIKE '%UK%' OR location ILIKE '%London%' OR location ILIKE '%Manchester%') ORDER BY posted_date DESC NULLS LAST LIMIT 20`
    return jobs as any[]
  } catch { return [] }
}

async function getRelatedJobs() {
  try {
    const sql = createDbQuery()
    const jobs = await sql`SELECT id, slug, title, company_name, location, is_remote, compensation, role_category, posted_date FROM jobs WHERE is_active = true AND role_category IS NOT NULL AND role_category != 'Product' AND title NOT ILIKE '%interim%' AND (country ILIKE '%UK%' OR location ILIKE '%UK%' OR location ILIKE '%London%') ORDER BY posted_date DESC NULLS LAST LIMIT 15`
    return jobs
  } catch { return [] }
}

export default async function FractionalCpoJobsUkPage() {
  const [stats, jobs, relatedJobs] = await Promise.all([getProductStats(), getProductJobs(), getRelatedJobs()])
  const mostRecentJob = jobs[0]
  const lastUpdatedDate = mostRecentJob?.posted_date ? new Date(mostRecentJob.posted_date) : new Date()

  return (
    <div className="min-h-screen bg-white">
      <WebPageSchema title="Fractional CPO Jobs UK | Part-Time Product Leadership" description="Fractional CPO jobs UK and fractional product director positions." url="https://fractional.quest/fractional-cpo-jobs-uk" dateModified={lastUpdatedDate} itemCount={stats.total} />
      <FAQPageSchema faqs={CPO_FAQS} />
      <JobListingSchema jobs={jobs} pageUrl="https://fractional.quest/fractional-cpo-jobs-uk" />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80" alt="Fractional CPO UK - Part-time Product Director jobs" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/85 via-violet-500/70 to-purple-500/50" />
        <div className="relative z-10 w-full py-16">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <BreadcrumbsLight items={getRoleBreadcrumbs('cpo', 'jobs')} className="mb-8" />
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-block bg-white/20 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">Fractional Product Jobs</span>
                <LastUpdatedBadge date={lastUpdatedDate} className="text-white/70" />
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"><strong>Fractional CPO Jobs UK</strong> & Part-Time Product Roles</h1>
              <p className="text-xl text-white/90 leading-relaxed max-w-2xl mb-8"><strong>Fractional CPO UK</strong> and <strong>part-time product director</strong> roles for experienced product leaders. Browse <strong>fractional product jobs</strong> with rates of £800-£1,400/day.</p>
              <Link href="#jobs" className="px-8 py-4 bg-white text-indigo-700 font-bold rounded-lg hover:bg-gray-100 transition-colors inline-block">Browse Jobs</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div><div className="text-3xl font-bold text-white">{stats.total}+</div><div className="text-sm text-gray-400">Live Roles</div></div>
            <div><div className="text-3xl font-bold text-white">£{stats.avgRate}</div><div className="text-sm text-gray-400">Avg Day Rate</div></div>
            <div><div className="text-3xl font-bold text-white">{stats.remoteCount}</div><div className="text-sm text-gray-400">Remote Roles</div></div>
            <div><div className="text-3xl font-bold text-white">2-3 days</div><div className="text-sm text-gray-400">Avg Engagement</div></div>
          </div>
        </div>
      </section>

      {jobs.length > 0 && (
        <section className="py-6 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <HotJobsLines jobs={jobs.map(job => ({ id: job.id, slug: job.slug, title: job.title, company_name: job.company_name, location: job.location, is_remote: job.is_remote, compensation: job.compensation, role_category: job.role_category, posted_date: job.posted_date }))} title="Latest CPO Jobs" maxJobs={12} viewAllHref="#jobs" viewAllText="See all jobs" />
          </div>
        </section>
      )}

      <section id="jobs" className="py-16 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-2 block">Browse</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">Fractional CPO Jobs UK & Product Roles</h2>
            </div>
            <p className="text-gray-500">{jobs.length}+ live fractional CPO and product jobs</p>
          </div>
          <ServerJobGrid jobs={jobs} roleCategory="Product" ctaLink="/fractional-jobs-uk?department=Product" ctaText={`View All ${stats.total}+ Fractional Product Jobs`} maxJobs={9} showViewAll={true} />
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <article className="prose prose-lg prose-gray max-w-none">
            <h2 className="text-3xl font-black text-gray-900 mb-6">Why Fractional CPO Roles Are in Demand</h2>
            <p>The <strong>fractional CPO</strong> model allows companies to access senior product leadership during critical phases - from building initial product teams to launching new product lines. Product-led growth (PLG) expertise is particularly valued.</p>
            <h3 className="text-2xl font-black text-gray-900 mt-12 mb-4">Typical Fractional CPO Responsibilities</h3>
            <ul>
              <li><strong>Product Strategy:</strong> Defining product vision and roadmap</li>
              <li><strong>Team Building:</strong> Hiring and mentoring product managers</li>
              <li><strong>PLG/Discovery:</strong> Implementing product-led growth strategies</li>
              <li><strong>Prioritisation:</strong> Managing product backlog and stakeholder alignment</li>
              <li><strong>Metrics:</strong> Establishing product success metrics and analytics</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">UK IR35 Calculator for Fractional CPO Jobs</h2>
          <IR35Calculator defaultDayRate={1100} />
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-black text-gray-900 mb-8">FAQ: Fractional CPO Jobs UK</h2>
          <FAQ items={CPO_FAQS} title="" />
        </div>
      </section>

      {(relatedJobs as any[]).length > 0 && (
        <section className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Other C-Suite Opportunities</h2>
            <HotJobsLines jobs={(relatedJobs as any[]).map(job => ({ id: job.id, slug: job.slug, title: job.title, company_name: job.company_name, location: job.location, is_remote: job.is_remote, compensation: job.compensation, role_category: job.role_category, posted_date: job.posted_date }))} title="Related Executive Roles" maxJobs={15} viewAllHref="/fractional-jobs-uk" viewAllText="View all UK jobs" />
          </div>
        </section>
      )}

      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black mb-6">Find Fractional CPO Jobs UK</h2>
          <p className="text-xl text-gray-300 mb-10">Create your profile and get matched with companies seeking fractional product leadership.</p>
          <Link href="/handler/sign-up" className="px-10 py-5 bg-indigo-500 text-white font-bold uppercase tracking-wider hover:bg-indigo-400 transition-colors inline-block">Browse Fractional CPO Jobs</Link>
        </div>
      </section>

      <RoleContentHub currentRole="product" />
    </div>
  )
}
