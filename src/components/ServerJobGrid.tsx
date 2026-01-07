/**
 * ServerJobGrid - Server-rendered job grid for SEO
 * This component renders job cards that are visible to search engine crawlers
 * Uses static fallback images (no Unsplash API dependency)
 */

import Link from 'next/link'

// Role-specific color themes
const ROLE_COLORS: Record<string, { from: string; to: string; accent: string }> = {
  'Executive': { from: 'from-purple-600', to: 'to-indigo-700', accent: 'text-purple-600' },
  'CEO': { from: 'from-purple-600', to: 'to-indigo-700', accent: 'text-purple-600' },
  'Marketing': { from: 'from-amber-600', to: 'to-orange-700', accent: 'text-amber-600' },
  'CMO': { from: 'from-amber-600', to: 'to-orange-700', accent: 'text-amber-600' },
  'Finance': { from: 'from-emerald-600', to: 'to-teal-700', accent: 'text-emerald-600' },
  'CFO': { from: 'from-emerald-600', to: 'to-teal-700', accent: 'text-emerald-600' },
  'Engineering': { from: 'from-blue-600', to: 'to-cyan-700', accent: 'text-blue-600' },
  'Technology': { from: 'from-blue-600', to: 'to-cyan-700', accent: 'text-blue-600' },
  'CTO': { from: 'from-blue-600', to: 'to-cyan-700', accent: 'text-blue-600' },
  'Operations': { from: 'from-slate-600', to: 'to-gray-700', accent: 'text-slate-600' },
  'COO': { from: 'from-slate-600', to: 'to-gray-700', accent: 'text-slate-600' },
  'HR': { from: 'from-pink-600', to: 'to-rose-700', accent: 'text-pink-600' },
  'CHRO': { from: 'from-pink-600', to: 'to-rose-700', accent: 'text-pink-600' },
  'Product': { from: 'from-violet-600', to: 'to-purple-700', accent: 'text-violet-600' },
  'CPO': { from: 'from-violet-600', to: 'to-purple-700', accent: 'text-violet-600' },
  'Sales': { from: 'from-red-600', to: 'to-orange-700', accent: 'text-red-600' },
  'CRO': { from: 'from-red-600', to: 'to-orange-700', accent: 'text-red-600' },
  'default': { from: 'from-gray-600', to: 'to-slate-700', accent: 'text-gray-600' },
}

// Fallback images by role category (Unsplash URLs that are reliable)
const FALLBACK_IMAGES: Record<string, string> = {
  'Executive': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=60&auto=format',
  'CEO': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=60&auto=format',
  'Marketing': 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400&q=60&auto=format',
  'CMO': 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400&q=60&auto=format',
  'Finance': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=60&auto=format',
  'CFO': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&q=60&auto=format',
  'Technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=60&auto=format',
  'Engineering': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=60&auto=format',
  'CTO': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=60&auto=format',
  'Operations': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=60&auto=format',
  'COO': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=60&auto=format',
  'HR': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=60&auto=format',
  'CHRO': 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=60&auto=format',
  'Product': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&q=60&auto=format',
  'CPO': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&q=60&auto=format',
  'Sales': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&q=60&auto=format',
  'CRO': 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&q=60&auto=format',
  'default': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=60&auto=format',
}

export interface Job {
  id: string
  slug: string
  title: string
  company_name: string
  location?: string
  is_remote?: boolean
  workplace_type?: string
  compensation?: string
  role_category?: string
  executive_title?: string
  skills_required?: string[]
  posted_date?: string
  hours_per_week?: string
  description_snippet?: string
}

interface ServerJobGridProps {
  jobs: Job[]
  roleCategory?: string
  ctaLink?: string
  ctaText?: string
  maxJobs?: number
  showViewAll?: boolean
  pageSlug?: string
}

// Calculate days ago for posted date
function getDaysAgo(postedDate: string | null | undefined): number | undefined {
  if (!postedDate) return undefined
  const posted = new Date(postedDate)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - posted.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Get color theme for role category
function getRoleColors(roleCategory?: string): { from: string; to: string; accent: string } {
  if (!roleCategory) return ROLE_COLORS.default
  if (ROLE_COLORS[roleCategory]) return ROLE_COLORS[roleCategory]
  for (const [key, colors] of Object.entries(ROLE_COLORS)) {
    if (roleCategory.toLowerCase().includes(key.toLowerCase())) {
      return colors
    }
  }
  return ROLE_COLORS.default
}

// Get fallback image for role category
function getFallbackImage(roleCategory?: string): string {
  if (!roleCategory) return FALLBACK_IMAGES.default
  if (FALLBACK_IMAGES[roleCategory]) return FALLBACK_IMAGES[roleCategory]
  for (const [key, image] of Object.entries(FALLBACK_IMAGES)) {
    if (roleCategory.toLowerCase().includes(key.toLowerCase())) {
      return image
    }
  }
  return FALLBACK_IMAGES.default
}

export function ServerJobGrid({
  jobs,
  roleCategory,
  ctaLink,
  ctaText = 'View All Jobs',
  maxJobs = 9,
  showViewAll = true,
  pageSlug,
}: ServerJobGridProps) {
  const displayJobs = jobs.slice(0, maxJobs)
  const colors = getRoleColors(roleCategory)

  if (displayJobs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No jobs found. Check back soon for new opportunities.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Server-rendered job grid - visible to search engines */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {displayJobs.map((job, index) => {
          const daysAgo = getDaysAgo(job.posted_date)
          const jobImage = getFallbackImage(job.role_category || roleCategory)
          const jobColors = getRoleColors(job.role_category || roleCategory)

          return (
            <article
              key={job.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <Link href={`/fractional-job/${job.slug}`} className="block">
                {/* Job image header */}
                <div className={`relative h-40 bg-gradient-to-br ${jobColors.from} ${jobColors.to}`}>
                  <img
                    src={jobImage}
                    alt={`${job.title} - ${roleCategory || job.role_category || 'Fractional'} job UK at ${job.company_name}`}
                    className="w-full h-full object-cover opacity-60"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-bold text-lg line-clamp-2" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {job.title}
                    </h3>
                  </div>
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {(job.role_category || job.executive_title) && (
                      <span className="bg-white/90 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                        {job.executive_title || job.role_category}
                      </span>
                    )}
                    {daysAgo !== undefined && daysAgo <= 3 && (
                      <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>
                  {job.is_remote && (
                    <span className="absolute top-3 right-3 bg-teal-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      Remote
                    </span>
                  )}
                </div>
                {/* Job content */}
                <div className="p-5 md:p-6">
                  <p className="text-gray-900 font-semibold mb-3 text-base">{job.company_name}</p>

                  {/* Location and compensation */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {job.location || 'UK'}
                    </span>
                    {job.compensation && (
                      <span className="font-bold text-gray-900 text-base">{job.compensation}</span>
                    )}
                  </div>

                  {/* Description */}
                  {job.description_snippet && (
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">
                      {job.description_snippet}
                    </p>
                  )}

                  {/* CTA */}
                  <span className={`inline-flex items-center gap-2 text-sm font-bold ${jobColors.accent} hover:opacity-80 pt-2`}>
                    View {roleCategory || job.role_category || 'fractional'} job
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            </article>
          )
        })}
      </div>

      {/* CTA to view all */}
      {showViewAll && ctaLink && (
        <div className="text-center">
          <Link
            href={ctaLink}
            className={`inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r ${colors.from} ${colors.to} text-white font-bold rounded-lg hover:opacity-90 transition-opacity`}
          >
            {ctaText}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  )
}

export default ServerJobGrid
