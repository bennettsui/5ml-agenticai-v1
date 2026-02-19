/**
 * Autosave Functionality Test Suite
 * Tests persistence for all three Social Content Ops modules:
 * - Content Development (cards)
 * - Interactive (campaigns)
 * - Calendar (posts)
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

// Test helper
async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Autosave Functionality Test Suite\n');

  // Use a test brand ID (UUID)
  const testBrandId = '550e8400-e29b-41d4-a716-446655440000';

  try {
    // =================== TEST 1: Content Development ===================
    console.log('📝 TEST 1: Content Development Autosave');

    const contentDevCard = {
      title: 'Test Card',
      platform: 'IG',
      format: 'Reel',
      script: 'Test script content',
      objective: 'Awareness',
    };

    const saveRes = await request('POST', `/api/social/content-dev/${testBrandId}`, contentDevCard);
    assert.strictEqual(saveRes.status, 200, `Save should return 200, got ${saveRes.status}`);
    console.log('  ✓ Save successful');

    const loadRes = await request('GET', `/api/social/content-dev/${testBrandId}`);
    assert.strictEqual(loadRes.status, 200, `Load should return 200, got ${loadRes.status}`);
    assert(Array.isArray(loadRes.body.data), 'Response should have data array');
    console.log(`  ✓ Load successful (${loadRes.body.data.length} items)`);

    // =================== TEST 2: Interactive ===================
    console.log('\n🎯 TEST 2: Interactive Campaigns Autosave');

    const interactiveCampaign = {
      title: 'Test Poll Campaign',
      type: 'Poll',
      status: 'Draft',
      question: 'Which content do you prefer?',
      options: ['Option A', 'Option B', 'Option C'],
    };

    const intSaveRes = await request('POST', `/api/social/interactive/${testBrandId}`, interactiveCampaign);
    assert.strictEqual(intSaveRes.status, 200, `Save should return 200, got ${intSaveRes.status}`);
    console.log('  ✓ Save successful');

    const intLoadRes = await request('GET', `/api/social/interactive/${testBrandId}`);
    assert.strictEqual(intLoadRes.status, 200, `Load should return 200, got ${intLoadRes.status}`);
    assert(Array.isArray(intLoadRes.body.data), 'Response should have data array');
    console.log(`  ✓ Load successful (${intLoadRes.body.data.length} items)`);

    // =================== TEST 3: Calendar ===================
    console.log('\n📅 TEST 3: Calendar Posts Autosave');

    const calendarPost = {
      posts: [
        {
          id: 'test-post-001',
          date: '2026-03-20',
          platform: 'IG',
          format: 'Reel',
          pillar: 'Educate',
          title: 'Test Reel',
          objective: 'Awareness',
          keyMessage: 'Key message here',
          visualType: 'Product',
          captionStatus: 'Draft',
          visualStatus: 'Draft',
          boostPlan: 'Organic only',
          link: '',
          notes: 'Test note',
        }
      ]
    };

    const calSaveRes = await request('POST', `/api/social/calendar/${testBrandId}`, calendarPost);
    assert.strictEqual(calSaveRes.status, 200, `Save should return 200, got ${calSaveRes.status}`);
    console.log('  ✓ Save successful');

    const calLoadRes = await request('GET', `/api/social/calendar/${testBrandId}`);
    assert.strictEqual(calLoadRes.status, 200, `Load should return 200, got ${calLoadRes.status}`);
    assert(Array.isArray(calLoadRes.body.data), 'Response should have data array');
    console.log(`  ✓ Load successful (${calLoadRes.body.data.length} items)`);

    // =================== TEST 4: Data Persistence ===================
    console.log('\n💾 TEST 4: Data Persistence Verification');

    // Re-fetch all three and verify data persists
    const cdCheck = await request('GET', `/api/social/content-dev/${testBrandId}`);
    assert(cdCheck.body.data.length > 0, 'Content dev data should persist');
    console.log('  ✓ Content Development data persisted');

    const intCheck = await request('GET', `/api/social/interactive/${testBrandId}`);
    assert(intCheck.body.data.length > 0, 'Interactive data should persist');
    console.log('  ✓ Interactive data persisted');

    const calCheck = await request('GET', `/api/social/calendar/${testBrandId}`);
    assert(calCheck.body.data.length > 0, 'Calendar data should persist');
    console.log('  ✓ Calendar data persisted');

    console.log('\n✅ All tests passed!\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
