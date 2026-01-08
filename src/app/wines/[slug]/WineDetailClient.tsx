'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Wine {
  id: number
  name: string
  slug: string
  winery: string
  region: string
  country: string
  grape_variety: string
  vintage: number | null
  wine_type: string
  color: string | null
  price_retail: number | null
  image_url: string
}

interface WineDetailClientProps {
  wine: Wine
}

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

export default function WineDetailClient({ wine }: WineDetailClientProps) {
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const handleAddToCart = () => {
    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem('aionysus-cart') || '[]')

    // Check if wine already in cart
    const existingIndex = existingCart.findIndex((item: { id: number }) => item.id === wine.id)

    if (existingIndex >= 0) {
      existingCart[existingIndex].quantity += quantity
    } else {
      existingCart.push({
        id: wine.id,
        name: wine.name,
        slug: wine.slug,
        winery: wine.winery,
        price: wine.price_retail || 0,
        quantity,
        image_url: wine.image_url,
      })
    }

    localStorage.setItem('aionysus-cart', JSON.stringify(existingCart))

    // Dispatch custom event to update cart count in NavBar
    window.dispatchEvent(new Event('cart-updated'))

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  // Generate wine type description for SEO content
  const wineTypeDescriptions: Record<string, string> = {
    red: 'This red wine showcases the depth and complexity that wine enthusiasts seek. Red wines are known for their rich tannins, full body, and ability to age gracefully.',
    white: 'This white wine offers refreshing acidity and aromatic complexity. White wines are celebrated for their crisp character and food-friendly versatility.',
    rose: 'This rose wine combines the best of both worlds with its delicate pink hue and refreshing character. Rose wines are perfect for warm weather and light cuisine.',
    sparkling: 'This sparkling wine delivers elegant effervescence and celebratory character. Sparkling wines are crafted through secondary fermentation to create their signature bubbles.',
    dessert: 'This dessert wine offers luscious sweetness balanced with acidity. Dessert wines are crafted to pair perfectly with sweet courses or enjoyed on their own.'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb with schema markup */}
      <div className="max-w-6xl mx-auto px-4 py-4 pt-24">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
          <ol itemScope itemType="https://schema.org/BreadcrumbList" className="flex items-center">
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/" itemProp="item" className="hover:text-amber-700">
                <span itemProp="name">Home</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <span className="mx-2">/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <Link href="/wines" itemProp="item" className="hover:text-amber-700">
                <span itemProp="name">Wines</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <span className="mx-2">/</span>
            <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
              <span itemProp="name" className="text-gray-900">{wine.name}</span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <article itemScope itemType="https://schema.org/Product">
          {/* Hero Section - Image + Purchase Info in viewport */}
          <div className="grid md:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr] gap-6 md:gap-10 mb-8">
            {/* Wine Image */}
            <div className="bg-white rounded-2xl p-4 flex items-center justify-center border border-gray-100 shadow-sm">
              <figure className="relative w-56 h-80 md:w-64 md:h-96 lg:w-72 lg:h-[420px]">
                <Image
                  src={wine.image_url || PLACEHOLDER_IMAGE}
                  alt={`Buy ${wine.name} online - ${wine.wine_type} wine from ${wine.region}, ${wine.country}`}
                  fill
                  className="object-contain rounded-lg"
                  itemProp="image"
                  priority
                  sizes="(max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                />
                <figcaption className="sr-only">
                  {wine.name} wine bottle from {wine.winery}
                </figcaption>
              </figure>
            </div>

            {/* Wine Info */}
            <div className="flex flex-col">
              {/* Wine Type Badge */}
              <div className="mb-2">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  wine.wine_type === 'red' ? 'bg-red-100 text-red-700' :
                  wine.wine_type === 'white' ? 'bg-yellow-100 text-yellow-700' :
                  wine.wine_type === 'rose' ? 'bg-pink-100 text-pink-700' :
                  wine.wine_type === 'sparkling' ? 'bg-amber-100 text-amber-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {wine.wine_type.charAt(0).toUpperCase() + wine.wine_type.slice(1)} Wine
                </span>
              </div>

              {/* H1 - Main heading */}
              <h1
                className="text-2xl md:text-3xl lg:text-4xl font-editorial font-bold text-gray-900 mb-2"
                itemProp="name"
              >
                {wine.name}
              </h1>

              {/* Producer & Region */}
              <h2 className="text-base md:text-lg text-gray-700 mb-3">
                {wine.winery || 'Fine Wine'} - {wine.region}, {wine.country}
              </h2>

              {/* Vintage & Details */}
              {wine.vintage && (
                <p className="text-gray-500 text-sm mb-3">
                  <strong>Vintage:</strong> {wine.vintage} | <strong>Region:</strong> {wine.region}
                </p>
              )}

              {/* Price */}
              <p
                className="text-2xl md:text-3xl font-bold text-amber-700 mb-4"
                itemProp="offers"
                itemScope
                itemType="https://schema.org/Offer"
              >
                <span itemProp="price" content={wine.price_retail?.toString() || '0'}>
                  {formatPrice(wine.price_retail)}
                </span>
                <meta itemProp="priceCurrency" content="GBP" />
                <meta itemProp="availability" content="https://schema.org/InStock" />
              </p>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors rounded-l-lg"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 font-medium text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors rounded-r-lg"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`py-3 px-8 rounded-lg font-semibold transition-all ${
                    addedToCart
                      ? 'bg-green-600 text-white'
                      : 'bg-amber-600 text-white hover:bg-amber-700 shadow-md hover:shadow-lg'
                  }`}
                >
                  {addedToCart ? 'Added!' : 'Add to Cart'}
                </button>
              </div>

              {/* Quick Details */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mt-auto pt-4 border-t border-gray-200">
                <div>
                  <span className="text-gray-500">Producer:</span>{' '}
                  <span className="text-gray-900">{wine.winery || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Region:</span>{' '}
                  <span className="text-gray-900">{wine.region}</span>
                </div>
                {wine.grape_variety && (
                  <div>
                    <span className="text-gray-500">Grape:</span>{' '}
                    <span className="text-gray-900">{wine.grape_variety}</span>
                  </div>
                )}
                {wine.vintage && (
                  <div>
                    <span className="text-gray-500">Vintage:</span>{' '}
                    <span className="text-gray-900">{wine.vintage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Details Section - Below the fold */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Wine Details */}
            <section className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">
                Wine Details
              </h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Producer</dt>
                  <dd className="text-gray-900 font-medium" itemProp="brand">{wine.winery || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Grape Variety</dt>
                  <dd className="text-gray-900 font-medium">{wine.grape_variety || 'Classic Blend'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Wine Type</dt>
                  <dd className="text-gray-900 font-medium">{wine.wine_type}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Region</dt>
                  <dd className="text-gray-900 font-medium">{wine.region}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Country</dt>
                  <dd className="text-gray-900 font-medium">{wine.country}</dd>
                </div>
                {wine.vintage && (
                  <div>
                    <dt className="text-gray-500">Vintage Year</dt>
                    <dd className="text-gray-900 font-medium">{wine.vintage}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* About This Wine - SEO Content Section */}
            <section className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">
                About This Wine
              </h3>
              <div itemProp="description" className="text-gray-600 leading-relaxed space-y-4">
                <p>
                  {wine.name} is a distinguished {wine.wine_type} wine produced by {wine.winery || 'a renowned producer'} in the celebrated {wine.region} region of {wine.country}.
                  {wine.grape_variety && ` Crafted from ${wine.grape_variety} grapes, this wine exemplifies the finest traditions of winemaking.`}
                </p>
                <p>
                  {wineTypeDescriptions[wine.wine_type] || wineTypeDescriptions.red}
                </p>
              </div>
            </section>
          </div>

        </article>
      </main>
    </div>
  )
}
