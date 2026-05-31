import * as fs from 'fs';
import * as path from 'path';
import { scrapeBusinesses } from './scraper';
import { scoreLead } from './scorer';

// Load environment variables from .env.local manually to avoid extra dependencies
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index > 0) {
        const key = trimmed.substring(0, index).trim();
        const value = trimmed.substring(index + 1).trim();
        process.env[key] = value;
      }
    });
  }
}

async function runTest() {
  loadEnv();
  
  const query = process.argv[2] || 'dentist in bandra';
  console.log(`\n🔍 Fetching leads from Google Places API for query: "${query}"...`);
  
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY is not defined. Please check .env.local.');
    process.exit(1);
  }
  
  const businesses = await scrapeBusinesses(query);
  console.log(`✅ Found ${businesses.length} leads with phone numbers.\n`);
  
  if (businesses.length === 0) {
    console.log('No leads found to score. Try another query like "restaurant in bandra".');
    return;
  }
  
  // Test score for the first 3 leads to keep logs clean and detailed
  const countToScore = Math.min(businesses.length, 3);
  console.log(`✍️  Scoring the first ${countToScore} leads:\n`);
  
  for (let i = 0; i < countToScore; i++) {
    const biz = businesses[i];
    console.log(`--- [Lead #${i + 1}] ${biz.name} ---`);
    console.log(`📍 Address: ${biz.address || 'N/A'}`);
    console.log(`📞 Phone: ${biz.phone || 'N/A'}`);
    console.log(`🌐 Website: ${biz.website || 'N/A'}`);
    console.log(`⭐ Rating: ${biz.rating || 0} (${biz.reviews || 0} reviews)`);
    
    console.log('🔄 Running scoring pipeline...');
    try {
      const scoreResult = await scoreLead(biz.website, {
        name: biz.name,
        phone: biz.phone || undefined,
        website: biz.website || undefined,
        address: biz.address || undefined,
        rating: biz.rating || undefined,
        reviews: biz.reviews || undefined,
        query: query,
        reviewsList: biz.reviews_list || undefined,
        business_status: biz.business_status,
        types: biz.types,
        photos: biz.photos,
        opening_hours: biz.opening_hours
      });
      
      console.log('\n📊 SCORING RESULTS:');
      console.log(`  Disqualified:   ${scoreResult.isDisqualified ? `❌ Yes (${scoreResult.disqualifyReason})` : '✅ No'}`);
      console.log(`  Tier:           ${scoreResult.tier.toUpperCase()}`);
      console.log(`  Final Score:    ${scoreResult.finalScore} / 100`);
      console.log(`  Dimensions:`);
      console.log(`    - Opportunity (Digital Gap):  ${scoreResult.digitalGapNorm} / 100 (raw opportunity points: ${scoreResult.opportunityScore})`);
      console.log(`    - Revenue Potential:         ${scoreResult.revenueNorm} / 100 (raw revenue points: ${scoreResult.revenueScore})`);
      console.log(`    - Contactability:            ${scoreResult.contactNorm} / 100 (raw contactability: ${scoreResult.contactScore})`);
      console.log(`    - Intent Signal:             ${scoreResult.intentNorm} / 100 (raw intent points: ${scoreResult.intentScore})`);
      console.log(`  Outreach Hook:  "${scoreResult.outreach_context.hook}"`);
      console.log(`  Service Offer:  "${scoreResult.outreach_context.offer}"`);
      console.log(`  Est. Mo. Loss:  ₹${scoreResult.estimated_loss.toLocaleString('en-IN')}`);
      console.log(`  Priority Rank:  ${scoreResult.priority_rank}`);
      console.log(`  Conversion Prob: ${scoreResult.conversion_probability}%`);
      console.log(`  Extracted Email: ${scoreResult.extractedEmail || 'None'}`);
    } catch (e) {
      console.error('❌ Scoring failed with error:', e);
    }
    console.log('\n' + '='.repeat(40) + '\n');
  }
}

runTest();
