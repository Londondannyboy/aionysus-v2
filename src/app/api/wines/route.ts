import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const wines = await sql`
      SELECT id, name, slug, winery, region, country, wine_type, color, price_retail, image_url, vintage, grape_variety
      FROM wines
      WHERE is_active = true
      ORDER BY name ASC
    `

    return NextResponse.json(wines)
  } catch (error) {
    console.error('[Wines API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wines' },
      { status: 500 }
    )
  }
}
