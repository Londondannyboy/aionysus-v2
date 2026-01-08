'use client'

import { useState, useEffect, useMemo } from 'react'
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

// Placeholder image for wines without images
const PLACEHOLDER_IMAGE = '/wine-placeholder.svg'

export default function WinesPage() {
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priceFilter, setPriceFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [wineryFilter, setWineryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  useEffect(() => {
    async function fetchWines() {
      try {
        const response = await fetch('/api/wines')
        if (response.ok) {
          const data = await response.json()
          setWines(data)
        }
      } catch (error) {
        console.error('Error fetching wines:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchWines()
  }, [])

  // Get unique regions and wineries for filter dropdowns
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(wines.map(w => w.region).filter(Boolean))]
    return uniqueRegions.sort()
  }, [wines])

  const wineries = useMemo(() => {
    const uniqueWineries = [...new Set(wines.map(w => w.winery).filter(Boolean))]
    return uniqueWineries.sort()
  }, [wines])

  // Count active filters
  const activeFilterCount = [
    typeFilter !== 'all',
    priceFilter !== 'all',
    regionFilter !== 'all',
    wineryFilter !== 'all',
  ].filter(Boolean).length

  // Clear all filters
  const clearFilters = () => {
    setTypeFilter('all')
    setPriceFilter('all')
    setRegionFilter('all')
    setWineryFilter('all')
    setSearchQuery('')
  }

  // Filter wines
  const filteredWines = wines.filter(w => {
    // Type filter
    const matchesType = typeFilter === 'all' ||
      (w.wine_type || '').toLowerCase() === typeFilter ||
      (w.color || '').toLowerCase() === typeFilter

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

    // Winery filter
    const matchesWinery = wineryFilter === 'all' || w.winery === wineryFilter

    // Search filter (name, winery, region)
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = !query ||
      (w.name || '').toLowerCase().includes(query) ||
      (w.winery || '').toLowerCase().includes(query) ||
      (w.region || '').toLowerCase().includes(query)

    return matchesType && matchesPrice && matchesRegion && matchesWinery && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-amber-700 text-sm tracking-widest uppercase mb-2">Fine Wine Collection</p>
          <h1 className="text-4xl md:text-5xl font-editorial font-bold text-gray-900">
            Buy Wine Online
          </h1>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            Over 3,800 fine wines curated by your AI sommelier. Discover exceptional wines from the world&apos;s finest producers.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wines, wineries, regions..."
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
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Wine Type */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Wine Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-amber-500 transition-all"
                  >
                    <option value="all">All Types</option>
                    <option value="red">Red</option>
                    <option value="white">White</option>
                    <option value="rose">Rose</option>
                    <option value="sparkling">Sparkling</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>

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

                {/* Winery */}
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-2">Winery</label>
                  <select
                    value={wineryFilter}
                    onChange={(e) => setWineryFilter(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 focus:outline-none focus:border-amber-500 transition-all"
                  >
                    <option value="all">All Wineries</option>
                    {wineries.map((winery) => (
                      <option key={winery} value={winery}>{winery}</option>
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

        {/* Quick Type Filters - Always visible */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {['all', 'red', 'white', 'rose', 'sparkling', 'dessert'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                typeFilter === type
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {type === 'rose' ? 'Rose' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-2 border-gray-200 border-t-amber-600 rounded-full animate-spin" />
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
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
                    (wine.wine_type || '').toLowerCase() === 'red' ? 'bg-red-100 text-red-700' :
                    (wine.wine_type || '').toLowerCase() === 'white' ? 'bg-yellow-100 text-yellow-700' :
                    (wine.wine_type || '').toLowerCase() === 'rose' ? 'bg-pink-100 text-pink-700' :
                    (wine.wine_type || '').toLowerCase() === 'sparkling' ? 'bg-amber-100 text-amber-700' :
                    (wine.wine_type || '').toLowerCase() === 'dessert' ? 'bg-orange-100 text-orange-700' :
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
        {!loading && (
          <p className="text-center text-gray-400 text-sm mt-12">
            Showing {filteredWines.length} of {wines.length} wines
          </p>
        )}

        {/* Internal link back to home */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Need help choosing? <Link href="/" className="text-amber-600 hover:text-amber-700 underline">Ask our AI sommelier</Link> for personalized recommendations.
          </p>
        </div>
      </main>
    </div>
  )
}
