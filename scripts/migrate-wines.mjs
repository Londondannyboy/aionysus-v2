/**
 * Wine Migration Script
 * Migrates wines from Sommelier to aionysus.wine Neon database
 */

import { neon } from '@neondatabase/serverless';

// Source: Sommelier database
const SOURCE_DB = 'postgresql://neondb_owner:npg_aT0PxdZwmD9i@ep-sweet-wildflower-abmn8fp7-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

// Target: aionysus.wine database
const TARGET_DB = 'postgresql://neondb_owner:npg_Qa5goP4lptAV@ep-square-frog-abxc6js2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function migrate() {
  console.log('🍷 Starting wine migration...\n');

  const sourceDb = neon(SOURCE_DB);
  const targetDb = neon(TARGET_DB);

  // Step 1: Get source schema
  console.log('📋 Fetching wines table schema from Sommelier...');
  const schemaResult = await sourceDb`
    SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = 'wines'
    ORDER BY ordinal_position
  `;
  console.log(`Found ${schemaResult.length} columns in wines table\n`);

  // Step 2: Create wines table in target (if not exists)
  console.log('🏗️  Creating wines table in aionysus.wine...');

  // Get the CREATE TABLE statement
  const createTableResult = await sourceDb`
    SELECT
      'CREATE TABLE IF NOT EXISTS wines (' ||
      string_agg(
        column_name || ' ' ||
        CASE
          WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
          WHEN data_type = 'integer' THEN 'INTEGER'
          WHEN data_type = 'numeric' THEN 'NUMERIC' || COALESCE('(' || numeric_precision || ',' || numeric_scale || ')', '')
          WHEN data_type = 'boolean' THEN 'BOOLEAN'
          WHEN data_type = 'text' THEN 'TEXT'
          WHEN data_type = 'jsonb' THEN 'JSONB'
          WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
          WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
          ELSE data_type
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_name = 'id' THEN ' PRIMARY KEY' ELSE '' END,
        ', '
      ) || ')'
    FROM information_schema.columns
    WHERE table_name = 'wines'
  `;

  // Simpler approach - just copy the schema we know
  await targetDb`
    CREATE TABLE IF NOT EXISTS wines (
      id SERIAL PRIMARY KEY,
      name TEXT,
      winery TEXT,
      region TEXT,
      country TEXT,
      grape_variety TEXT,
      vintage INTEGER,
      wine_type TEXT,
      style TEXT,
      color TEXT,
      price_retail NUMERIC(10,2),
      price_trade NUMERIC(10,2),
      bottle_size TEXT,
      tasting_notes TEXT,
      critic_scores JSONB,
      drinking_window TEXT,
      classification TEXT,
      image_url TEXT,
      stock_quantity INTEGER,
      case_size INTEGER,
      is_active BOOLEAN DEFAULT true,
      slug TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✅ Wines table created\n');

  // Step 3: Count source wines
  const countResult = await sourceDb`SELECT COUNT(*) as count FROM wines`;
  const totalWines = countResult[0].count;
  console.log(`📊 Found ${totalWines} wines in Sommelier\n`);

  // Step 4: Migrate in batches
  const BATCH_SIZE = 100;
  let migrated = 0;

  console.log('🚚 Migrating wines in batches...');

  for (let offset = 0; offset < totalWines; offset += BATCH_SIZE) {
    const wines = await sourceDb`
      SELECT * FROM wines
      ORDER BY id
      LIMIT ${BATCH_SIZE} OFFSET ${offset}
    `;

    for (const wine of wines) {
      await targetDb`
        INSERT INTO wines (
          id, name, winery, region, country, grape_variety, vintage, wine_type,
          style, color, price_retail, price_trade, bottle_size, tasting_notes,
          critic_scores, drinking_window, classification, image_url,
          stock_quantity, case_size, is_active, slug
        ) VALUES (
          ${wine.id}, ${wine.name}, ${wine.winery}, ${wine.region}, ${wine.country},
          ${wine.grape_variety}, ${wine.vintage}, ${wine.wine_type}, ${wine.style},
          ${wine.color}, ${wine.price_retail}, ${wine.price_trade}, ${wine.bottle_size},
          ${wine.tasting_notes}, ${wine.critic_scores}, ${wine.drinking_window},
          ${wine.classification}, ${wine.image_url}, ${wine.stock_quantity},
          ${wine.case_size}, ${wine.is_active}, ${wine.slug}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      migrated++;
    }

    console.log(`  Migrated ${migrated}/${totalWines} wines (${Math.round(migrated/totalWines*100)}%)`);
  }

  // Step 5: Reset sequence
  await targetDb`SELECT setval('wines_id_seq', (SELECT MAX(id) FROM wines))`;

  // Step 6: Verify
  const targetCount = await targetDb`SELECT COUNT(*) as count FROM wines`;
  console.log(`\n✅ Migration complete!`);
  console.log(`   Source: ${totalWines} wines`);
  console.log(`   Target: ${targetCount[0].count} wines`);
}

migrate().catch(console.error);
