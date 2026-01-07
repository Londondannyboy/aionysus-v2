/**
 * RoleNews - Server component for displaying category-specific news articles
 * Fetches and displays recent articles for a given role category
 */

import Link from 'next/link'
import { createDbQuery } from '@/lib/db'

interface NewsArticle {
  id: number
  slug: string
  title: string
  excerpt: string | null
  category: string | null
  article_type: string | null
  featured_asset_url: string | null
  published_at: string | null
}

interface RoleNewsProps {
  category: 'Finance' | 'Marketing' | 'Engineering' | 'Operations' | 'HR' | 'Sales' | 'General' | 'Security' | 'Executive' | 'Compliance' | 'Product'
  limit?: number
  title?: string
  showViewAll?: boolean
}

// Map category to display name
const categoryDisplayNames: Record<string, string> = {
  Finance: 'Finance & CFO',
  Marketing: 'Marketing & CMO',
  Engineering: 'Technology & CTO',
  Operations: 'Operations & COO',
  HR: 'People & HR',
  Sales: 'Sales & Revenue',
  General: 'Executive',
  Security: 'Security & CISO',
  Executive: 'CEO & Leadership',
  Compliance: 'Compliance & Regulatory',
  Product: 'Product & CPO'
}

// Map article_type to badge
const typeBadges: Record<string, { label: string; color: string }> = {
  job_roundup: { label: 'Jobs Update', color: 'bg-blue-100 text-blue-800' },
  company_spotlight: { label: 'Company', color: 'bg-amber-100 text-amber-800' },
  market_trend: { label: 'Insights', color: 'bg-purple-100 text-purple-800' },
  manual: { label: 'Article', color: 'bg-gray-100 text-gray-700' }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short'
  })
}

export async function RoleNews({
  category,
  limit = 3,
  title,
  showViewAll = true
}: RoleNewsProps) {
  let articles: NewsArticle[] = []

  try {
    const sql = createDbQuery()
    articles = await sql`
      SELECT id, slug, title, excerpt, category, article_type,
             featured_asset_url, published_at
      FROM articles
      WHERE app = 'fractional'
        AND status = 'published'
        AND category = ${category}
      ORDER BY published_at DESC
      LIMIT ${limit}
    ` as NewsArticle[]
  } catch (error) {
    console.error('RoleNews: Failed to fetch articles', error)
    return null
  }

  if (articles.length === 0) {
    return null
  }

  const displayTitle = title || `${categoryDisplayNames[category]} News`

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {displayTitle}
        </h3>
        {showViewAll && (
          <Link
            href="/fractional-jobs-articles"
            className="text-sm font-medium text-amber-700 hover:text-amber-800 transition-colors"
          >
            View all articles →
          </Link>
        )}
      </div>

      {/* Articles Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {articles.map((article) => {
          const badge = typeBadges[article.article_type || 'manual']

          return (
            <Link
              key={article.id}
              href={`/${article.slug}`}
              className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md hover:border-amber-200 transition-all duration-200"
            >
              {/* Image */}
              {article.featured_asset_url && (
                <div className="relative h-32 bg-gray-100 overflow-hidden">
                  <img
                    src={article.featured_asset_url}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                {/* Badge and Date */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded ${badge.color}`}>
                    {badge.label}
                  </span>
                  {article.published_at && (
                    <span className="text-xs text-gray-500">
                      {formatDate(article.published_at)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-amber-700 transition-colors text-sm">
                  {article.title}
                </h4>

                {/* Excerpt */}
                {article.excerpt && (
                  <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                    {article.excerpt}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

/**
 * Compact version for sidebars
 */
export async function RoleNewsCompact({
  category,
  limit = 4
}: Omit<RoleNewsProps, 'showViewAll' | 'title'>) {
  let articles: NewsArticle[] = []

  try {
    const sql = createDbQuery()
    articles = await sql`
      SELECT id, slug, title, article_type, published_at
      FROM articles
      WHERE app = 'fractional'
        AND status = 'published'
        AND category = ${category}
      ORDER BY published_at DESC
      LIMIT ${limit}
    ` as NewsArticle[]
  } catch (error) {
    console.error('RoleNewsCompact: Failed to fetch articles', error)
    return null
  }

  if (articles.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wide">
        Latest {categoryDisplayNames[category]} News
      </h4>
      <ul className="space-y-2">
        {articles.map((article) => (
          <li key={article.id}>
            <Link
              href={`/${article.slug}`}
              className="block text-sm text-gray-700 hover:text-amber-700 transition-colors line-clamp-2"
            >
              {article.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
