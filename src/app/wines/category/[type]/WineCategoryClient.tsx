'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Wine {
  id: number
  name: string
  slug: string | null
  winery: string
  region: string
  wine_type: string
  color: string | null
  price_retail: number | null
  image_url: string
  vintage: number | null
}

interface Category {
  title: string
  description: string
  query: string
}

interface WineCategoryClientProps {
  wines: Wine[]
  category: Category
  type: string
}

// Price range options
const PRICE_RANGES = [
  { label: 'All Prices', value: 'all' },
  { label: 'Price on Request', value: 'request' },
  { label: 'Under £500', value: '0-500' },
  { label: '£500 - £1,000', value: '500-1000' },
  { label: '£1,000 - £2,500', value: '1000-2500' },
  { label: '£2,500 - £5,000', value: '2500-5000' },
  { label: '£5,000+', value: '5000+' },
]

// Format price with proper currency
function formatPrice(price: number | null): string {
  if (!price) return 'Price on request'
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

const PLACEHOLDER_IMAGE = '/wine-placeholder.svg'

const CATEGORY_COLORS: Record<string, string> = {
  red: 'bg-red-600',
  white: 'bg-yellow-500',
  rose: 'bg-pink-500',
  sparkling: 'bg-amber-500',
  champagne: 'bg-amber-600',
  dessert: 'bg-orange-500'
}

export default function WineCategoryClient({ wines, category, type }: WineCategoryClientProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [priceFilter, setPriceFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Get unique regions for filter dropdown
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(wines.map(w => w.region).filter(Boolean))]
    return uniqueRegions.sort()
  }, [wines])

  // Count active filters
  const activeFilterCount = [
    priceFilter !== 'all',
    regionFilter !== 'all',
  ].filter(Boolean).length

  // Clear all filters
  const clearFilters = () => {
    setPriceFilter('all')
    setRegionFilter('all')
    setSearchQuery('')
  }

  // Filter wines
  const filteredWines = wines.filter(w => {
    // Price filter
    let matchesPrice = true
    if (priceFilter === 'request') {
      matchesPrice = w.price_retail === null || w.price_retail === 0
    } else if (priceFilter !== 'all') {
      const price = w.price_retail
      if (price === null || price === 0) {
        matchesPrice = false
      } else if (priceFilter === '5000+') {
        matchesPrice = price >= 5000
      } else {
        const [min, max] = priceFilter.split('-').map(Number)
        matchesPrice = price >= min && price < max
      }
    }

    // Region filter
    const matchesRegion = regionFilter === 'all' || w.region === regionFilter

    // Search filter
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = !query ||
      (w.name || '').toLowerCase().includes(query) ||
      (w.winery || '').toLowerCase().includes(query) ||
      (w.region || '').toLowerCase().includes(query)

    return matchesPrice && matchesRegion && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Category Header */}
        <div className="text-center mb-12">
          <div className={`inline-block w-12 h-1 ${CATEGORY_COLORS[type] || 'bg-amber-600'} rounded mb-4`} />
          <h1 className="text-4xl md:text-5xl font-editorial font-bold text-gray-900 mb-3">
            {category.title}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {category.description}
          </p>
          <p className="text-gray-400 text-sm mt-2">{wines.length} wines available</p>
        </div>

        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-amber-700">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/wines" className="hover:text-amber-700">Wines</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{category.title}</span>
        </nav>

        {/* Search and Filter Controls */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${category.title.toLowerCase()}...`}
                className="w-full px-5 py-3 pl-12 rounded-full bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-sm"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="mt-6 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Price Range */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Price Range</label>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-amber-500 transition-all"
                  >
                    {PRICE_RANGES.map((range) => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>

                {/* Region */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Region</label>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-amber-500 transition-all"
                  >
                    <option value="all">All Regions</option>
                    {regions.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Category Quick Links */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {[
            { label: 'All Wines', href: '/wines' },
            { label: 'Red', href: '/wines/category/red' },
            { label: 'White', href: '/wines/category/white' },
            { label: 'Rose', href: '/wines/category/rose' },
            { label: 'Champagne', href: '/wines/category/champagne' },
            { label: 'Sparkling', href: '/wines/category/sparkling' },
          ].map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                cat.href === `/wines/category/${type}`
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Wine Grid */}
        {filteredWines.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No wines found matching your criteria</p>
            <button
              onClick={clearFilters}
              className="text-amber-600 hover:text-amber-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredWines.map((wine) => (
              <Link
                key={wine.id}
                href={`/wines/${wine.slug || wine.id}`}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-amber-300 hover:shadow-lg transition-all group"
              >
                <div className="aspect-[3/4] relative bg-gray-100">
                  <Image
                    src={wine.image_url || PLACEHOLDER_IMAGE}
                    alt={`Buy ${wine.name} online - ${wine.wine_type || 'fine'} wine from ${wine.region}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
                    (wine.wine_type || '').toLowerCase() === 'red' ? 'bg-red-100 text-red-700' :
                    (wine.wine_type || '').toLowerCase() === 'white' ? 'bg-yellow-100 text-yellow-700' :
                    (wine.wine_type || '').toLowerCase() === 'rose' ? 'bg-pink-100 text-pink-700' :
                    (wine.wine_type || '').toLowerCase() === 'sparkling' ? 'bg-amber-100 text-amber-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {(wine.wine_type || 'Wine').charAt(0).toUpperCase() + (wine.wine_type || 'Wine').slice(1)}
                  </span>
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-amber-700 transition-colors">{wine.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{wine.region}</p>
                  <p className="font-bold text-amber-700">{formatPrice(wine.price_retail)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Wine count */}
        <p className="text-center text-gray-400 text-sm mt-12">
          Showing {filteredWines.length} of {wines.length} {category.title.toLowerCase()}
        </p>
      </main>
    </div>
  )
}
