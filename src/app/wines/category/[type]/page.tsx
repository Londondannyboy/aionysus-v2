import { Metadata } from 'next'
import { neon } from '@neondatabase/serverless'
import WineCategoryClient from './WineCategoryClient'

const sql = neon(process.env.DATABASE_URL!)

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

const WINE_CATEGORIES: Record<string, { title: string; description: string; query: string }> = {
  red: {
    title: 'Red Wines',
    description: 'Discover our collection of exceptional red wines from world-renowned producers. From bold Bordeaux to elegant Burgundy, find your perfect red.',
    query: 'red'
  },
  white: {
    title: 'White Wines',
    description: 'Explore our selection of fine white wines. From crisp Chablis to rich Chardonnay, discover refreshing whites from premier estates.',
    query: 'white'
  },
  rose: {
    title: 'Rose Wines',
    description: 'Browse our curated rose wine collection. From Provence classics to sophisticated blends, find the perfect rose for any occasion.',
    query: 'rose'
  },
  sparkling: {
    title: 'Sparkling Wines & Champagne',
    description: 'Celebrate with our prestigious sparkling wines and Champagnes. From vintage Dom Perignon to rare Krug, discover effervescent excellence.',
    query: 'sparkling'
  },
  champagne: {
    title: 'Champagne',
    description: 'The finest Champagnes from legendary houses. Discover vintage and prestige cuvees from Krug, Dom Perignon, Salon, and more.',
    query: 'sparkling'
  },
  dessert: {
    title: 'Dessert & Sweet Wines',
    description: 'Indulge in our collection of dessert wines. From Sauternes to Port, discover luscious sweetness and complex flavors.',
    query: 'dessert'
  }
}

async function getWinesByType(type: string): Promise<Wine[]> {
  const category = WINE_CATEGORIES[type]
  if (!category) return []

  const wines = await sql`
    SELECT id, name, slug, winery, region, wine_type, color, price_retail, image_url, vintage
    FROM wines
    WHERE is_active = true
    AND (LOWER(wine_type) = ${category.query} OR LOWER(color) = ${category.query})
    ORDER BY name ASC
  `

  return wines as Wine[]
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ type: string }>
}): Promise<Metadata> {
  const { type } = await params
  const category = WINE_CATEGORIES[type]

  if (!category) {
    return {
      title: 'Wine Category Not Found | Aionysus',
      description: 'The requested wine category could not be found.'
    }
  }

  return {
    title: `${category.title} | Buy Wine Online | Aionysus`,
    description: category.description,
    openGraph: {
      title: `${category.title} | Aionysus Wine Collection`,
      description: category.description,
      type: 'website',
      url: `https://aionysus.wine/wines/category/${type}`,
      siteName: 'Aionysus - AI Wine Sommelier'
    },
    alternates: {
      canonical: `https://aionysus.wine/wines/category/${type}`
    }
  }
}

export async function generateStaticParams() {
  return Object.keys(WINE_CATEGORIES).map((type) => ({ type }))
}

export default async function WineCategoryPage({
  params
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = await params
  const category = WINE_CATEGORIES[type]

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Category Not Found</h1>
          <p className="text-gray-600">The wine category you are looking for does not exist.</p>
        </div>
      </div>
    )
  }

  const wines = await getWinesByType(type)

  return (
    <WineCategoryClient
      wines={wines}
      category={category}
      type={type}
    />
  )
}
