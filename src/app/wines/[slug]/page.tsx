import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { neon } from '@neondatabase/serverless'
import WineDetailClient from './WineDetailClient'

const sql = neon(process.env.DATABASE_URL!)

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

async function getWine(idOrSlug: string): Promise<Wine | null> {
  const isNumericId = /^\d+$/.test(idOrSlug)

  let results
  if (isNumericId) {
    results = await sql`
      SELECT id, name, slug, winery, region, country, grape_variety,
             vintage, wine_type, color, price_retail, image_url
      FROM wines
      WHERE id = ${idOrSlug} AND is_active = true
      LIMIT 1
    `
  } else {
    results = await sql`
      SELECT id, name, slug, winery, region, country, grape_variety,
             vintage, wine_type, color, price_retail, image_url
      FROM wines
      WHERE slug = ${idOrSlug} AND is_active = true
      LIMIT 1
    `
  }

  return results[0] as Wine | null
}

// Generate SEO-optimized metadata
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const wine = await getWine(slug)

  if (!wine) {
    return {
      title: 'Wine Not Found | Aionysus',
      description: 'The requested wine could not be found in our collection.'
    }
  }

  const displayName = wine.name

  // Build keyword-rich title (30-60 characters optimal)
  const title = `Buy ${displayName} Online | Aionysus Wine UK`

  // Build comprehensive meta description (150-160 characters)
  const priceText = wine.price_retail
    ? `£${wine.price_retail.toLocaleString('en-GB')}`
    : 'Price on request'
  const description = `Buy ${displayName} from ${wine.region}, ${wine.country}. ${wine.wine_type.charAt(0).toUpperCase() + wine.wine_type.slice(1)} wine by ${wine.winery}. ${priceText}. Expert wine recommendations from Aionysus.`

  // Canonical URL using slug
  const canonicalSlug = wine.slug || wine.id.toString()

  return {
    title,
    description,
    keywords: [
      wine.name,
      wine.winery,
      wine.region,
      wine.country,
      wine.wine_type,
      wine.grape_variety,
      wine.vintage ? `${wine.vintage} wine` : 'fine wine',
      'buy wine online',
      'fine wine',
      'investment wine'
    ].filter(Boolean).join(', '),
    openGraph: {
      title: `Buy ${displayName} Online | ${wine.region} Wine`,
      description,
      type: 'website',
      url: `https://aionysus.wine/wines/${canonicalSlug}`,
      images: wine.image_url ? [
        {
          url: wine.image_url,
          width: 400,
          height: 600,
          alt: `Buy ${displayName} online - ${wine.wine_type} wine from ${wine.region}, ${wine.country}`
        }
      ] : undefined,
      siteName: 'Aionysus - AI Wine Sommelier'
    },
    twitter: {
      card: 'summary_large_image',
      title: displayName,
      description,
      images: wine.image_url ? [wine.image_url] : undefined
    },
    alternates: {
      canonical: `https://aionysus.wine/wines/${canonicalSlug}`
    },
    robots: {
      index: true,
      follow: true
    }
  }
}

// Generate static params for common wines (optional - improves build performance)
export async function generateStaticParams() {
  return []
}

export default async function WineDetailPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const wine = await getWine(slug)

  if (!wine) {
    notFound()
  }

  // Build structured data for SEO (JSON-LD)
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: wine.name,
    description: `Fine ${wine.wine_type} wine from ${wine.region}, ${wine.country}`,
    image: wine.image_url,
    brand: {
      '@type': 'Brand',
      name: wine.winery
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'GBP',
      price: wine.price_retail || 0,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Aionysus'
      }
    },
    category: `${wine.wine_type} Wine`,
    countryOfOrigin: {
      '@type': 'Country',
      name: wine.country
    }
  }

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <WineDetailClient wine={wine} />
    </>
  )
}
