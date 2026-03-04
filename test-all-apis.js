/**
 * Complete API Testing Suite
 * Tests all APIs one by one
 */

const BASE_URL = 'http://localhost:3000';
let accessToken = '';
let shopkeeperId = '';

// Test data
const testUser = {
  phoneNumber: '+919876543210',
  password: 'Test@1234',
  name: 'Test Shopkeeper',
  email: 'test@example.com',
};

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null, useAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (useAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

// Test functions
async function test1_Health() {
  console.log('\n1️⃣ Testing Health API...');
  const result = await apiCall('/api/health');
  
  if (result.ok && result.data.status === 'healthy') {
    console.log('✅ Health API working');
    return true;
  } else {
    console.log('❌ Health API failed:', result.data);
    return false;
  }
}

async function test2_Signup() {
  console.log('\n2️⃣ Testing Signup API...');
  const result = await apiCall('/api/auth/signup', 'POST', testUser);
  
  if (result.status === 201 || result.status === 409) {
    console.log('✅ Signup API working');
    console.log('   Note: Check console for OTP or email');
    return true;
  } else {
    console.log('❌ Signup API failed:', result.data);
    return false;
  }
}

async function test3_Verify() {
  console.log('\n3️⃣ Testing Verify API...');
  console.log('   Using test OTP: 123456');
  
  const result = await apiCall('/api/auth/verify', 'POST', {
    phoneNumber: testUser.phoneNumber,
    code: '123456',
  });
  
  if (result.ok) {
    console.log('✅ Verify API working');
    return true;
  } else {
    console.log('❌ Verify API failed:', result.data);
    console.log('   Try with real OTP from console/email');
    return false;
  }
}

async function test4_Signin() {
  console.log('\n4️⃣ Testing Signin API...');
  const result = await apiCall('/api/auth/signin', 'POST', {
    phoneNumber: testUser.phoneNumber,
    password: testUser.password,
  });
  
  if (result.ok && result.data.accessToken) {
    accessToken = result.data.accessToken;
    console.log('✅ Signin API working');
    console.log('   Token:', accessToken.substring(0, 50) + '...');
    
    // Decode token to get shopkeeperId
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
    shopkeeperId = payload.sub;
    console.log('   Shopkeeper ID:', shopkeeperId);
    return true;
  } else {
    console.log('❌ Signin API failed:', result.data);
    return false;
  }
}

async function test5_Profile() {
  console.log('\n5️⃣ Testing Profile GET API...');
  const result = await apiCall('/api/profile', 'GET', null, true);
  
  if (result.ok && result.data.data) {
    console.log('✅ Profile GET API working');
    console.log('   Name:', result.data.data.name);
    console.log('   Phone:', result.data.data.phoneNumber);
    return true;
  } else {
    console.log('❌ Profile GET API failed:', result.data);
    return false;
  }
}

async function test6_ProfileUpdate() {
  console.log('\n6️⃣ Testing Profile PATCH API...');
  const result = await apiCall('/api/profile', 'PATCH', {
    storeAddress: '123 Test Street, Mumbai',
    preferredLanguage: 'hi',
  }, true);
  
  if (result.ok) {
    console.log('✅ Profile PATCH API working');
    console.log('   Updated address:', result.data.data?.storeAddress);
    return true;
  } else {
    console.log('❌ Profile PATCH API failed:', result.data);
    return false;
  }
}

async function test7_Dashboard() {
  console.log('\n7️⃣ Testing Dashboard API...');
  const result = await apiCall('/api/dashboard', 'GET', null, true);
  
  if (result.ok) {
    console.log('✅ Dashboard API working');
    console.log('   Wallet Balance:', result.data.walletBalance);
    console.log('   Active Tasks:', result.data.activeTasks);
    return true;
  } else {
    console.log('❌ Dashboard API failed:', result.data);
    return false;
  }
}

async function test8_PhotoUploadUrl() {
  console.log('\n8️⃣ Testing Photo Upload URL API...');
  const result = await apiCall('/api/photos/upload-url', 'POST', {
    fileName: 'test-shelf.jpg',
    fileType: 'image/jpeg',
  }, true);
  
  if (result.ok && result.data.uploadUrl) {
    console.log('✅ Photo Upload URL API working');
    console.log('   Upload URL generated');
    return true;
  } else {
    console.log('❌ Photo Upload URL API failed:', result.data);
    return false;
  }
}

async function test9_Auctions() {
  console.log('\n9️⃣ Testing Auctions GET API...');
  const result = await apiCall('/api/auctions', 'GET', null, true);
  
  if (result.ok) {
    console.log('✅ Auctions GET API working');
    console.log('   Auctions found:', result.data.auctions?.length || 0);
    return true;
  } else {
    console.log('❌ Auctions GET API failed:', result.data);
    return false;
  }
}

async function test10_RefreshToken() {
  console.log('\n🔟 Testing Refresh Token API...');
  const result = await apiCall('/api/auth/refresh', 'POST', {
    refreshToken: 'dummy-refresh-token',
  });
  
  // This might fail with invalid token, but API should respond
  if (result.status === 401 || result.status === 400) {
    console.log('✅ Refresh Token API responding (expected auth error with dummy token)');
    return true;
  } else if (result.ok) {
    console.log('✅ Refresh Token API working');
    return true;
  } else {
    console.log('❌ Refresh Token API failed:', result.data);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Complete API Test Suite');
  console.log('=====================================');
  console.log('Base URL:', BASE_URL);
  console.log('Make sure Next.js server is running!');
  
  const results = [];
  
  // Run tests sequentially
  results.push({ name: 'Health', passed: await test1_Health() });
  results.push({ name: 'Signup', passed: await test2_Signup() });
  
  console.log('\n⏸️  Pausing for 2 seconds...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  results.push({ name: 'Verify', passed: await test3_Verify() });
  results.push({ name: 'Signin', passed: await test4_Signin() });
  
  // Only continue if signin worked (we need token)
  if (accessToken) {
    results.push({ name: 'Profile GET', passed: await test5_Profile() });
    results.push({ name: 'Profile PATCH', passed: await test6_ProfileUpdate() });
    results.push({ name: 'Dashboard', passed: await test7_Dashboard() });
    results.push({ name: 'Photo Upload URL', passed: await test8_PhotoUploadUrl() });
    results.push({ name: 'Auctions', passed: await test9_Auctions() });
  } else {
    console.log('\n⚠️  Skipping authenticated APIs (no token)');
  }
  
  results.push({ name: 'Refresh Token', passed: await test10_RefreshToken() });
  
  // Summary
  console.log('\n=====================================');
  console.log('📊 Test Summary');
  console.log('=====================================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log('');
  console.log(`Total: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check logs above for details.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
});
