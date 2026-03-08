const BASE_URL = 'http://localhost:3000';
let authToken = '';
let brandId = '';
let brandName = '';

// Test data
const uniqueId = Math.floor(Date.now() / 1000).toString().slice(-8);
const testBrand = {
  brandName: `TestBrand${uniqueId}`,
  email: `brand${uniqueId}@example.com`,
  password: 'TestPassword123!',
  contactPerson: 'Mr. Tester'
};

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null, useAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
    headers['x-brand-id'] = brandId;
    headers['x-brand-name'] = brandName;
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
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

async function test1_Signup() {
  console.log('\n1️⃣ Testing Brand Signup API...');
  const result = await apiCall('/api/brand/auth/signup', 'POST', {
    brandName: testBrand.brandName,
    email: testBrand.email,
    password: testBrand.password,
    contactPerson: testBrand.contactPerson
  });
  
  if (result.ok) {
    console.log('✅ Brand Signup API working');
    return true;
  } else {
    console.log('❌ Brand Signup API failed:', result.data);
    return false;
  }
}

async function test2_Signin() {
  console.log('\n2️⃣ Testing Brand Signin API...');
  const result = await apiCall('/api/brand/auth/signin', 'POST', {
    email: testBrand.email,
    password: testBrand.password,
  });
  
  if (result.ok && result.data.accessToken) {
    authToken = result.data.accessToken;
    brandId = result.data.brand.id;
    brandName = result.data.brand.name;
    console.log('✅ Brand Signin API working');
    console.log(`   Logged in as: ${brandName} (${brandId})`);
    return true;
  } else {
    console.log('❌ Brand Signin API failed:', result.data);
    return false;
  }
}

async function test3_Dashboard() {
  console.log('\n3️⃣ Testing Brand Dashboard API...');
  const result = await apiCall('/api/brand/dashboard', 'GET', null, true);
  
  if (result.ok) {
    console.log('✅ Brand Dashboard API working');
    console.log(`   Auctions Won: ${result.data.data.auctionsWon}`);
    console.log(`   Total Spent: ${result.data.data.totalSpent}`);
    return true;
  } else {
    console.log('❌ Brand Dashboard API failed:', result.data);
    return false;
  }
}

async function test4_Products() {
  console.log('\n4️⃣ Testing Brand Products API (POST & GET)...');
  
  const postResult = await apiCall('/api/brand/products', 'POST', {
    name: 'Test Cola 500ml',
    category: 'beverages',
    dimensions: { width: 5, height: 15 }
  }, true);
  
  if (!postResult.ok) {
    console.log('❌ Brand Products POST API failed:', postResult.data);
    return false;
  }

  const getResult = await apiCall('/api/brand/products', 'GET', null, true);
  
  if (getResult.ok && getResult.data.data.count > 0) {
    console.log('✅ Brand Products API working');
    console.log(`   Found ${getResult.data.data.count} products`);
    return true;
  } else {
    console.log('❌ Brand Products GET API failed:', getResult.data);
    return false;
  }
}

let testAuctionId = null;

async function test5_Auctions() {
  console.log('\n5️⃣ Testing Brand Auctions API (GET & POST)...');
  
  const getResult = await apiCall('/api/brand/auctions', 'GET', null, true);
  
  if (!getResult.ok || !Array.isArray(getResult.data.data)) {
    console.log('❌ Brand Auctions GET API failed:', getResult.data);
    return false;
  }

  console.log(`   Found ${getResult.data.data.length} active auctions`);
  
  if (getResult.data.data.length > 0) {
    const auctionToBidOn = getResult.data.data[0];
    testAuctionId = auctionToBidOn.id;
    const bidAmount = auctionToBidOn.highestBid + 10;
    
    const postResult = await apiCall('/api/brand/auctions', 'POST', {
      auctionId: testAuctionId,
      amount: bidAmount,
      productName: 'Test Cola 500ml',
      brandName: brandName
    }, true);
    
    if (postResult.ok) {
      console.log('✅ Brand Auctions API completely working (GET and POST bids)');
      console.log(`   Placed bid of ₹${bidAmount} on auction ${testAuctionId.substring(0,8)}...`);
      return true;
    } else {
      console.log('❌ Brand Auctions POST (Bid) API failed:', postResult.data);
      return false;
    }
  } else {
    console.log('⚠️ No active auctions to place a bid on. (Mock script needs active auctions to test bid placement)');
    return true;
  }
}

async function test6_Wallet() {
  console.log('\n6️⃣ Testing Brand Wallet Recharge API (POST & GET)...');
  
  const rechargeAmount = 5000;
  const postResult = await apiCall('/api/brand/wallet/recharge', 'POST', {
    amount: rechargeAmount,
    brandId: brandId,
    paymentMethod: 'card'
  }, true);
  
  if (!postResult.ok) {
    console.log('❌ Brand Wallet POST API failed:', postResult.data);
    return false;
  }

  const getResult = await apiCall(`/api/brand/wallet/recharge?brandId=${brandId}`, 'GET', null, true);
  
  if (getResult.ok) {
    console.log('✅ Brand Wallet API working');
    console.log(`   Total recharges: ${getResult.data.data.totalRecharges}`);
    return true;
  } else {
    console.log('❌ Brand Wallet GET API failed:', getResult.data);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Brand Backend API Tests...\n');
  
  let passed = 0;
  let total = 6;
  
  if (await test1_Signup()) passed++;
  if (await test2_Signin()) passed++;
  if (await test3_Dashboard()) passed++;
  if (await test4_Products()) passed++;
  if (await test5_Auctions()) passed++;
  if (await test6_Wallet()) passed++;
  
  console.log('\n=======================================');
  console.log(`🏁 Test Results: ${passed}/${total} passed`);
  console.log('=======================================');
  
  if (passed === total) {
    console.log('🎉 ALL BRAND APIS ARE WORKING PERFECTLY!');
    process.exit(0);
  } else {
    console.log('⚠️ SOME BRAND APIS FAILED. Check the logs above.');
    process.exit(1);
  }
}

runAllTests();
