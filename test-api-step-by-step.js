/**
 * Step by Step API Testing
 * Run each test individually
 */

const BASE_URL = 'http://localhost:3000';

// Store token globally
let TOKEN = '';

async function apiCall(endpoint, method = 'GET', body = null, useAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (useAuth && TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

// Test 1: Health
async function testHealth() {
  console.log('\n🏥 Testing Health API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = await apiCall('/api/health');
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok) {
    console.log('✅ PASSED');
  } else {
    console.log('❌ FAILED');
  }
}

// Test 2: Signin
async function testSignin() {
  console.log('\n🔐 Testing Signin API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const result = await apiCall('/api/auth/signin', 'POST', {
    phoneNumber: '+919876543210',
    password: 'Test@1234',
  });
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok && result.data.accessToken) {
    TOKEN = result.data.accessToken;
    console.log('\n✅ PASSED');
    console.log('Token saved for next tests');
    
    // Decode token
    const payload = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64').toString());
    console.log('Shopkeeper ID:', payload.sub);
  } else {
    console.log('❌ FAILED');
  }
}

// Test 3: Profile GET
async function testProfileGet() {
  console.log('\n👤 Testing Profile GET API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!TOKEN) {
    console.log('❌ No token! Run testSignin() first');
    return;
  }
  
  const result = await apiCall('/api/profile', 'GET', null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok) {
    console.log('✅ PASSED');
  } else {
    console.log('❌ FAILED');
  }
}

// Test 3.5: Profile SYNC (Creates DynamoDB entry if missing)
async function testProfileSync() {
  console.log('\n🔄 Testing Profile SYNC API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!TOKEN) {
    console.log('❌ No token! Run testSignin() first');
    return;
  }
  
  const result = await apiCall('/api/profile/sync', 'POST', null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok) {
    console.log('✅ PASSED - DynamoDB entry created/updated');
  } else {
    console.log('❌ FAILED');
  }
}

// Test 4: Profile UPDATE
async function testProfileUpdate() {
  console.log('\n✏️  Testing Profile UPDATE API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!TOKEN) {
    console.log('❌ No token! Run testSignin() first');
    return;
  }
  
  const result = await apiCall('/api/profile', 'PATCH', {
    storeAddress: '123 Test Street, Mumbai',
    preferredLanguage: 'hi',
  }, true);
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok) {
    console.log('✅ PASSED');
  } else {
    console.log('❌ FAILED');
  }
}

// Test 5: Dashboard
async function testDashboard() {
  console.log('\n📊 Testing Dashboard API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!TOKEN) {
    console.log('❌ No token! Run testSignin() first');
    return;
  }
  
  const result = await apiCall('/api/dashboard', 'GET', null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok) {
    console.log('✅ PASSED');
  } else {
    console.log('❌ FAILED');
  }
}

// Test 6: Photo Upload URL
async function testPhotoUploadUrl() {
  console.log('\n📸 Testing Photo Upload URL API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!TOKEN) {
    console.log('❌ No token! Run testSignin() first');
    return;
  }
  
  // Decode token to get shopkeeperId
  const payload = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64').toString());
  const shopkeeperId = payload.sub;
  
  console.log('Using shopkeeperId:', shopkeeperId);
  
  const result = await apiCall('/api/photos/upload-url', 'POST', {
    shopkeeperId: shopkeeperId,
    photoType: 'shelf',
    filename: 'test-shelf.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024 * 1024, // 1MB
  }, true);
  
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok) {
    console.log('✅ PASSED');
  } else {
    console.log('❌ FAILED');
  }
}

// Test 7: Auctions GET
async function testAuctionsGet() {
  console.log('\n🏷️  Testing Auctions GET API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!TOKEN) {
    console.log('❌ No token! Run testSignin() first');
    return;
  }
  
  const result = await apiCall('/api/auctions', 'GET', null, true);
  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.ok) {
    console.log('✅ PASSED');
  } else {
    console.log('❌ FAILED');
  }
}

// Main menu
async function main() {
  const args = process.argv.slice(2);
  const test = args[0];

  console.log('🧪 API Testing Tool');
  console.log('==================\n');

  if (!test) {
    console.log('Usage: node test-api-step-by-step.js <test-name>');
    console.log('\nAvailable tests:');
    console.log('  health          - Test health check');
    console.log('  signin          - Test signin (gets token)');
    console.log('  profile         - Test profile GET');
    console.log('  profile-sync    - Test profile SYNC (creates DynamoDB entry)');
    console.log('  profile-update  - Test profile UPDATE');
    console.log('  dashboard       - Test dashboard');
    console.log('  photo-url       - Test photo upload URL');
    console.log('  auctions        - Test auctions GET');
    console.log('  all             - Run all tests');
    console.log('\nExample: node test-api-step-by-step.js signin');
    return;
  }

  switch (test) {
    case 'health':
      await testHealth();
      break;
    case 'signin':
      await testSignin();
      break;
    case 'profile':
      await testSignin();
      await testProfileGet();
      break;
    case 'profile-sync':
      await testSignin();
      await testProfileSync();
      break;
    case 'profile-update':
      await testSignin();
      await testProfileUpdate();
      break;
    case 'dashboard':
      await testSignin();
      await testDashboard();
      break;
    case 'photo-url':
      await testSignin();
      await testPhotoUploadUrl();
      break;
    case 'auctions':
      await testSignin();
      await testAuctionsGet();
      break;
    case 'all':
      await testHealth();
      await testSignin();
      await testProfileSync(); // Create DynamoDB entry first
      await testProfileGet();
      await testProfileUpdate();
      await testDashboard();
      await testPhotoUploadUrl();
      await testAuctionsGet();
      break;
    default:
      console.log('❌ Unknown test:', test);
      console.log('Run without arguments to see available tests');
  }
}

main().catch(console.error);
