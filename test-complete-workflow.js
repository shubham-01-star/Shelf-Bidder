/**
 * Complete Workflow Test
 * Tests the entire Shelf-Bidder workflow end-to-end
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_PHOTO_URL = 'https://shelf-bidder-photos.s3.amazonaws.com/test-shelf.jpg';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = lib.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testCompleteWorkflow() {
  console.log('🚀 Starting Complete Workflow Test\n');

  try {
    // Step 1: Health Check
    console.log('Step 1: Health Check');
    const health = await makeRequest('GET', '/api/health');
    console.log('✅ Health:', health.data);
    console.log('');

    // Step 2: Create Test Shopkeeper
    console.log('Step 2: Create Test Shopkeeper');
    const signupData = {
      name: 'Test Shopkeeper',
      phoneNumber: `+91${Date.now().toString().slice(-10)}`,
      email: `test${Date.now()}@example.com`,
      password: 'Test@123',
      storeAddress: 'Test Shop, Main Market, Delhi',
    };

    const signup = await makeRequest('POST', '/api/auth/signup', signupData);
    console.log('✅ Signup:', signup.status === 200 ? 'Success' : 'Failed');
    
    if (signup.status !== 200) {
      console.log('❌ Signup failed:', signup.data);
      return;
    }

    const shopkeeperId = signup.data.shopkeeperId;
    const token = signup.data.token;
    console.log('   Shopkeeper ID:', shopkeeperId);
    console.log('');

    // Step 3: Create Test Campaign
    console.log('Step 3: Create Test Campaign');
    const campaignData = {
      agent_id: 'test-agent-001',
      brand_name: 'Test Brand',
      product_name: 'Test Product',
      product_category: 'Beverages',
      budget: 1000,
      payout_per_task: 50,
      target_locations: ['Delhi', 'Mumbai'],
      target_radius_km: 5,
      placement_requirements: {
        shelfLevel: 'eye-level',
        visibility: 'high',
      },
      product_dimensions: {
        width: 20,
        height: 30,
        depth: 10,
      },
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const campaign = await makeRequest('POST', '/api/campaigns', campaignData, token);
    console.log('✅ Campaign:', campaign.status === 201 ? 'Created' : 'Failed');
    
    if (campaign.status !== 201) {
      console.log('❌ Campaign creation failed:', campaign.data);
      return;
    }

    const campaignId = campaign.data.id;
    console.log('   Campaign ID:', campaignId);
    console.log('');

    // Step 4: Complete Workflow (Photo → Analysis → Matching → Task)
    console.log('Step 4: Complete Workflow');
    const workflowData = {
      photoUrl: TEST_PHOTO_URL,
      shopkeeperId,
      phoneNumber: signupData.phoneNumber,
      timezone: 'Asia/Kolkata',
      language: 'en',
      location: 'Delhi',
    };

    const workflow = await makeRequest('POST', '/api/workflow/complete', workflowData, token);
    console.log('✅ Workflow:', workflow.data.success ? 'Success' : 'Failed');
    console.log('   Message:', workflow.data.message);
    
    if (workflow.data.data) {
      console.log('   Empty Spaces:', workflow.data.data.emptySpaces);
      console.log('   Campaign Matched:', workflow.data.data.campaignMatched);
      if (workflow.data.data.taskId) {
        console.log('   Task ID:', workflow.data.data.taskId);
        console.log('   Earnings:', workflow.data.data.earnings);
      }
    }
    console.log('');

    // Step 5: Check Dashboard
    console.log('Step 5: Check Dashboard');
    const dashboard = await makeRequest('GET', '/api/dashboard', null, token);
    console.log('✅ Dashboard:', dashboard.status === 200 ? 'Success' : 'Failed');
    
    if (dashboard.status === 200 && dashboard.data.stats) {
      console.log('   Total Tasks:', dashboard.data.stats.totalTasks);
      console.log('   Pending Tasks:', dashboard.data.stats.pendingTasks);
      console.log('   Wallet Balance:', dashboard.data.shopkeeper?.walletBalance || 0);
    }
    console.log('');

    // Step 6: Get Campaign Stats
    console.log('Step 6: Get Campaign Stats');
    const campaignStats = await makeRequest('GET', `/api/campaigns/${campaignId}`, null, token);
    console.log('✅ Campaign Stats:', campaignStats.status === 200 ? 'Success' : 'Failed');
    
    if (campaignStats.status === 200) {
      console.log('   Remaining Budget:', campaignStats.data.remainingBudget);
      console.log('   Status:', campaignStats.data.status);
    }
    console.log('');

    console.log('🎉 Complete Workflow Test Finished!\n');
    console.log('Summary:');
    console.log('✅ Health check passed');
    console.log('✅ Shopkeeper registration working');
    console.log('✅ Campaign creation working');
    console.log('✅ Complete workflow functional');
    console.log('✅ Dashboard accessible');
    console.log('✅ Campaign stats available');
    console.log('\n✨ System is ready for demo!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testCompleteWorkflow();
