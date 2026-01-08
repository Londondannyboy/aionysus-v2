/**
 * Add Investment Data to Wines
 *
 * Creates investment columns and populates with realistic mock data
 * for wine investment analysis.
 */

import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_Qa5goP4lptAV@ep-square-frog-abxc6js2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

const db = neon(DATABASE_URL);

// Investment-grade wine indicators
const INVESTMENT_REGIONS = ['bordeaux', 'burgundy', 'champagne', 'tuscany', 'piedmont', 'rhone', 'napa'];
const INVESTMENT_CLASSIFICATIONS = ['first growth', 'grand cru', 'premier cru', 'super tuscan', 'cult wine'];

// Generate realistic price history based on wine characteristics
function generatePriceHistory(wine) {
  const baseYear = 2018;
  const currentYear = 2024;
  const history = [];

  // Base price from retail or estimated
  let basePrice = wine.price_retail || Math.floor(Math.random() * 200) + 50;

  // Investment-grade wines appreciate more
  const isInvestmentGrade = isInvestmentWine(wine);
  const annualGrowth = isInvestmentGrade
    ? 0.08 + Math.random() * 0.12  // 8-20% for investment wines
    : 0.02 + Math.random() * 0.05; // 2-7% for regular wines

  // Add some volatility
  const volatility = isInvestmentGrade ? 0.05 : 0.08;

  let price = basePrice;
  for (let year = baseYear; year <= currentYear; year++) {
    // Add yearly growth with volatility
    const yearGrowth = annualGrowth + (Math.random() - 0.5) * volatility;
    price = price * (1 + yearGrowth);

    // Calculate trend line (smoothed)
    const trend = basePrice * Math.pow(1 + annualGrowth, year - baseYear);

    history.push({
      year: year.toString(),
      price: Math.round(price),
      trend: Math.round(trend),
      volume: Math.floor(Math.random() * 1000) + 100, // Trading volume
    });
  }

  return history;
}

// Determine if wine is investment grade
function isInvestmentWine(wine) {
  const region = (wine.region || '').toLowerCase();
  const classification = (wine.classification || '').toLowerCase();
  const price = wine.price_retail || 0;

  // Check region
  const isInvestmentRegion = INVESTMENT_REGIONS.some(r => region.includes(r));

  // Check classification
  const hasInvestmentClassification = INVESTMENT_CLASSIFICATIONS.some(c => classification.includes(c));

  // High price point
  const isHighValue = price >= 100;

  return (isInvestmentRegion && isHighValue) || hasInvestmentClassification || price >= 500;
}

// Calculate investment score (1-10)
function calculateInvestmentScore(wine, priceHistory) {
  let score = 5; // Base score

  // Factor 1: Price appreciation
  if (priceHistory.length >= 2) {
    const firstPrice = priceHistory[0].price;
    const lastPrice = priceHistory[priceHistory.length - 1].price;
    const appreciation = (lastPrice - firstPrice) / firstPrice;

    if (appreciation > 0.5) score += 2;
    else if (appreciation > 0.3) score += 1.5;
    else if (appreciation > 0.15) score += 1;
    else if (appreciation < 0) score -= 1;
  }

  // Factor 2: Region prestige
  const region = (wine.region || '').toLowerCase();
  if (region.includes('bordeaux') || region.includes('burgundy')) score += 1.5;
  else if (region.includes('champagne') || region.includes('tuscany')) score += 1;
  else if (INVESTMENT_REGIONS.some(r => region.includes(r))) score += 0.5;

  // Factor 3: Classification
  const classification = (wine.classification || '').toLowerCase();
  if (classification.includes('first growth') || classification.includes('grand cru')) score += 1.5;
  else if (classification.includes('premier cru') || classification.includes('super tuscan')) score += 1;

  // Factor 4: Vintage (older = potentially better for investment)
  const vintage = wine.vintage || 2020;
  const age = 2024 - vintage;
  if (age >= 10) score += 1;
  else if (age >= 5) score += 0.5;

  // Clamp to 1-10
  return Math.min(10, Math.max(1, Math.round(score * 10) / 10));
}

// Calculate 5-year return percentage
function calculateFiveYearReturn(priceHistory) {
  if (priceHistory.length < 5) return null;

  const fiveYearsAgo = priceHistory[priceHistory.length - 5]?.price || priceHistory[0].price;
  const current = priceHistory[priceHistory.length - 1].price;

  return Math.round(((current - fiveYearsAgo) / fiveYearsAgo) * 100 * 10) / 10;
}

// Assign storage type
function assignStorageType(wine) {
  const isInvestment = isInvestmentWine(wine);
  const price = wine.price_retail || 0;

  if (price >= 500 || isInvestment) {
    // High-value wines typically bonded
    return Math.random() > 0.3 ? 'bonded' : 'private_cellar';
  } else if (price >= 100) {
    return Math.random() > 0.5 ? 'bonded' : 'private_cellar';
  } else {
    return Math.random() > 0.7 ? 'private_cellar' : 'retail';
  }
}

async function main() {
  console.log('🍷 Adding investment data to wines...\n');

  // Step 1: Add columns if they don't exist
  console.log('📋 Adding investment columns...');

  await db`
    ALTER TABLE wines
    ADD COLUMN IF NOT EXISTS price_history JSONB DEFAULT '[]'
  `;

  await db`
    ALTER TABLE wines
    ADD COLUMN IF NOT EXISTS investment_score DECIMAL(3,1)
  `;

  await db`
    ALTER TABLE wines
    ADD COLUMN IF NOT EXISTS is_investment_grade BOOLEAN DEFAULT false
  `;

  await db`
    ALTER TABLE wines
    ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20)
  `;

  await db`
    ALTER TABLE wines
    ADD COLUMN IF NOT EXISTS five_year_return DECIMAL(5,1)
  `;

  await db`
    ALTER TABLE wines
    ADD COLUMN IF NOT EXISTS liv_ex_score INTEGER
  `;

  console.log('✅ Columns added\n');

  // Step 2: Get all wines
  console.log('📊 Fetching wines...');
  const wines = await db`SELECT id, name, region, country, price_retail, vintage, classification FROM wines`;
  console.log(`Found ${wines.length} wines\n`);

  // Step 3: Generate and update investment data
  console.log('💰 Generating investment data...');

  let investmentGradeCount = 0;
  let processed = 0;

  for (const wine of wines) {
    const priceHistory = generatePriceHistory(wine);
    const isInvestment = isInvestmentWine(wine);
    const investmentScore = calculateInvestmentScore(wine, priceHistory);
    const fiveYearReturn = calculateFiveYearReturn(priceHistory);
    const storageType = assignStorageType(wine);
    const livExScore = isInvestment ? Math.floor(Math.random() * 30) + 70 : null; // 70-100 for investment wines

    if (isInvestment) investmentGradeCount++;

    await db`
      UPDATE wines
      SET
        price_history = ${JSON.stringify(priceHistory)}::jsonb,
        investment_score = ${investmentScore},
        is_investment_grade = ${isInvestment},
        storage_type = ${storageType},
        five_year_return = ${fiveYearReturn},
        liv_ex_score = ${livExScore}
      WHERE id = ${wine.id}
    `;

    processed++;
    if (processed % 500 === 0) {
      console.log(`  Processed ${processed}/${wines.length} wines...`);
    }
  }

  console.log(`\n✅ Investment data added!`);
  console.log(`   Total wines: ${wines.length}`);
  console.log(`   Investment-grade: ${investmentGradeCount}`);
  console.log(`   Regular wines: ${wines.length - investmentGradeCount}`);

  // Step 4: Show sample data
  console.log('\n📈 Sample investment wines:');
  const samples = await db`
    SELECT name, region, price_retail, investment_score, five_year_return, storage_type
    FROM wines
    WHERE is_investment_grade = true
    ORDER BY investment_score DESC
    LIMIT 5
  `;

  for (const wine of samples) {
    console.log(`  ${wine.name} (${wine.region})`);
    console.log(`    Score: ${wine.investment_score}/10 | 5yr Return: ${wine.five_year_return}% | Storage: ${wine.storage_type}`);
  }
}

main().catch(console.error);
