'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const ROLE_IMAGES: Record<string, string[]> = {
  'CFO': [
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=100&q=60&auto=format',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&q=60&auto=format',
  ],
  'CTO': [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&q=60&auto=format',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100&q=60&auto=format',
  ],
  'CMO': [
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=100&q=60&auto=format',
    'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=100&q=60&auto=format',
  ],
  'COO': [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=60&auto=format',
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&q=60&auto=format',
  ],
  'CHRO': [
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=100&q=60&auto=format',
    'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=100&q=60&auto=format',
  ],
  'default': [
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&q=60&auto=format',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=100&q=60&auto=format',
    'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&q=60&auto=format',
  ]
}

function getJobImage(jobId: string, roleCategory?: string, title?: string): string {
  const hashSource = `${jobId}-${title || ''}-${roleCategory || ''}`
  let hash = 0
  for (let i = 0; i < hashSource.length; i++) {
    const char = hashSource.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const images = ROLE_IMAGES[roleCategory || ''] || ROLE_IMAGES['default']
  return images[Math.abs(hash) % images.length]
}

interface HotJobLine {
  id: string
  slug: string
  title: string
  company_name: string
  location: string
  compensation?: string
  posted_date?: string
  is_remote?: boolean
  role_category?: string
}

interface HotJobsLinesProps {
  jobs: HotJobLine[]
  title?: string
  maxJobs?: number
  className?: string
  showViewAll?: boolean
  viewAllHref?: string
  viewAllText?: string
}

function getDaysAgo(dateString: string | undefined, now: Date): string {
  if (!dateString) return ''
  const posted = new Date(dateString)
  const diffMs = now.getTime() - posted.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1d'
  if (diffDays < 7) return `${diffDays}d`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`
  return `${Math.floor(diffDays / 30)}mo`
}

function getStaticDate(dateString?: string): string {
  if (!dateString) return ''
  const posted = new Date(dateString)
  return posted.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function HotJobsLines({
  jobs,
  title = 'Latest Jobs',
  maxJobs = 10,
  className = '',
  showViewAll = true,
  viewAllHref = '/fractional-jobs-uk',
  viewAllText = 'View all jobs'
}: HotJobsLinesProps) {
  const [isClient, setIsClient] = useState(false)
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setIsClient(true)
    setNow(new Date())
  }, [])

  const displayJobs = jobs.slice(0, maxJobs)

  if (displayJobs.length === 0) return null

  return (
    <div className={`bg-white border border-gray-200 rounded-xl ${className}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <span className="text-xs text-gray-500">({displayJobs.length})</span>
        </div>
        {showViewAll && (
          <Link href={viewAllHref} className="text-xs font-medium text-blue-600 hover:text-blue-700">
            {viewAllText} →
          </Link>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {displayJobs.map((job) => {
          const daysAgo = isClient && now ? getDaysAgo(job.posted_date, now) : getStaticDate(job.posted_date)

          return (
            <a
              key={`jobline-${job.slug}`}
              href={`/fractional-job/${job.slug}`}
              className="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={getJobImage(job.id, job.role_category, job.title)}
                  alt={job.title}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="font-medium text-gray-900 group-hover:text-blue-600 truncate flex-1 min-w-0 text-sm">
                {job.title}
              </span>

              <span className="text-gray-500 text-sm truncate max-w-[120px] hidden sm:block">
                {job.company_name}
              </span>

              <span className="text-gray-500 text-xs truncate max-w-[80px] hidden md:block">
                {job.is_remote ? 'Remote' : job.location?.split(',')[0]}
              </span>

              {job.compensation && (
                <span className="text-emerald-700 text-xs font-medium hidden lg:block">
                  {job.compensation}
                </span>
              )}

              {daysAgo && (
                <span className="text-gray-500 text-xs w-10 text-right flex-shrink-0">
                  {daysAgo}
                </span>
              )}

              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          )
        })}
      </div>

      {showViewAll && jobs.length > maxJobs && (
        <div className="px-4 py-2 bg-gray-50 rounded-b-xl border-t border-gray-100">
          <Link href={viewAllHref} className="text-xs text-gray-500 hover:text-blue-600">
            +{jobs.length - maxJobs} more jobs available
          </Link>
        </div>
      )}
    </div>
  )
}
