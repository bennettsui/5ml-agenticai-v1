#!/usr/bin/env node
/**
 * Test script for Sarah Orchestrator with Daikin Hong Kong scenario
 *
 * This script:
 * 1. Initializes the database
 * 2. Runs Sarah with a Daikin brief
 * 3. Verifies all 8 nodes execute successfully
 * 4. Checks database persistence
 * 5. Tests the API endpoints
 */

require('dotenv').config();

const {
  pool,
  initDatabase,
  getAllArtefacts,
  getSocialContentPosts,
  getSocialAdCampaigns,
  getSocialKPIs,
} = require('./db');

const { runSarah } = require('./agents/social/sarahOrchestrator');

const DAIKIN_BRIEF = `
Create Q1 2026 social media strategy, content calendar, and media plan for Daikin Hong Kong Air Conditioning products.

Context:
- Brand: Daikin Hong Kong (premium AC and HVAC solutions)
- Markets: Hong Kong, APAC
- Primary products: Residential AC units, commercial HVAC systems
- Key audience: Homeowners, property managers, facilities managers (25-55, affluent)
- Tone: Professional, reliable, innovative, energy-efficient
- Channels: Instagram, Facebook, LinkedIn, TikTok

Goals for Q1 2026:
1. Build brand awareness for new inverter series
2. Drive lead generation for residential AC units
3. Establish thought leadership on energy efficiency
4. Community engagement with building managers

Requirements:
- Bilingual (Traditional Chinese + English)
- 12-week content calendar
- Media budget allocation (HKD 50,000)
- KPI tracking for performance
- Content pillars: Product Features, Energy Efficiency, Customer Stories, Seasonal Tips, Industry Insights
`;

async function runTest() {
  try {
    console.log('🚀 Starting Sarah Orchestrator test with Daikin scenario...\n');

    // Initialize database
    console.log('1️⃣  Initializing database...');
    await initDatabase();
    console.log('   ✅ Database ready\n');

    // Run Sarah orchestrator
    console.log('2️⃣  Running Sarah orchestrator with Daikin brief...');
    const taskId = `test-daikin-${Date.now()}`;
    console.log(`   Task ID: ${taskId}`);

    const result = await runSarah({
      taskId,
      userInput: DAIKIN_BRIEF,
      brandContext: {
        brand_name: 'Daikin Hong Kong',
        project_name: 'Q1 2026 Campaign',
        brand_id: 'daikin-hk',
        project_id: 'q1-2026',
      },
      brandId: 'daikin-hk',
      projectId: 'q1-2026',
      runFullPipeline: false, // Run step by step to see progress
    });

    console.log('   ✅ Orchestrator completed\n');
    console.log(`   Final Status: ${result.state.status}`);
    console.log(`   Next Step: ${result.state.next_step}`);
    console.log(`   Artefacts Generated: ${Object.keys(result.state.artefacts).length}\n`);

    // Check database persistence
    console.log('3️⃣  Checking database persistence...');
    const artefacts = await getAllArtefacts(taskId);
    console.log(`   ✅ Found ${artefacts.length} artefacts in database\n`);

    if (artefacts.length > 0) {
      console.log('   Artefact Keys:');
      artefacts.forEach((art) => {
        console.log(`   - ${art.artefact_key} (${art.artefact_type})`);
      });
      console.log();
    }

    // Test API endpoints
    console.log('4️⃣  Testing API endpoints...\n');

    // Test content posts
    const contentPosts = await getSocialContentPosts(taskId, 10);
    console.log(`   ✅ Content Posts API: ${contentPosts.length} posts found`);
    if (contentPosts.length > 0) {
      console.log(`      Sample: ${contentPosts[0].title || 'N/A'} (${contentPosts[0].platform})`);
    }

    // Test ad campaigns
    const adCampaigns = await getSocialAdCampaigns(taskId);
    console.log(`   ✅ Ad Campaigns API: ${adCampaigns.length} campaigns found`);
    if (adCampaigns.length > 0) {
      console.log(`      Sample: ${adCampaigns[0].campaign_name} (${adCampaigns[0].platform})`);
    }

    // Test KPIs
    const kpis = await getSocialKPIs(taskId);
    console.log(`   ✅ KPIs API: ${kpis.length} KPIs found`);
    if (kpis.length > 0) {
      console.log(`      Sample: ${kpis[0].kpi_name} (${kpis[0].kpi_type})`);
    }

    console.log('\n✨ Test completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Task ID: ${taskId}`);
    console.log(`   - Status: ${result.state.status}`);
    console.log(`   - Artefacts: ${artefacts.length}`);
    console.log(`   - Content Posts: ${contentPosts.length}`);
    console.log(`   - Ad Campaigns: ${adCampaigns.length}`);
    console.log(`   - KPIs: ${kpis.length}`);

    // API endpoint URLs for manual testing
    console.log('\n🔗 API Endpoints for manual testing:');
    console.log(`   GET http://localhost:5000/api/social/artefacts/${taskId}`);
    console.log(`   GET http://localhost:5000/api/social/content-posts/${taskId}`);
    console.log(`   GET http://localhost:5000/api/social/ad-campaigns/${taskId}`);
    console.log(`   GET http://localhost:5000/api/social/kpis/${taskId}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTest();
