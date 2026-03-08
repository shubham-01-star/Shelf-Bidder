import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
let authToken = '';
let shopkeeperId = '';

async function apiCall(endpoint, method = 'GET', body = null, useAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (useAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
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
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.indexOf("application/json") !== -1) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function runFlow() {
  console.log('🚀 Starting Hackathon Photo Flow Test...\n');

  // 1. Signup to get a shopkeeper record mapped in DB
  const phone = '+9199' + Date.now().toString().slice(-8);
  console.log(`1️⃣ Creating Test User (${phone})...`);
  const signupResult = await apiCall('/api/auth/signup', 'POST', {
    phoneNumber: phone,
    name: 'Hackathon Tester',
    email: `tester${Date.now()}@test.com`,
    password: 'password123',
    store_address: 'Test Address'
  });
  
  if (!signupResult.ok) {
    console.error('Signup failed:', signupResult.data);
    return;
  }
  
  // 2. Signin to get the token and shopkeeper ID
  console.log('2️⃣ Signing in...');
  const signinResult = await apiCall('/api/auth/signin', 'POST', {
    phoneNumber: phone,
    password: 'password123'
  });
  
  if (!signinResult.ok || !signinResult.data.accessToken) {
    console.error('Signin failed:', signinResult.data);
    return;
  }
  
  authToken = signinResult.data.accessToken;
  const payload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
  shopkeeperId = payload.sub;
  console.log(`   Logged in as: ${shopkeeperId}\n`);

  // 3. Step 2 of Flow: Get Pre-Signed URL
  console.log('3️⃣ Step 2: Requesting Pre-signed S3 URL...');
  const urlResult = await apiCall('/api/photos/upload-url', 'POST', {
    shopkeeperId,
    photoType: 'shelf',
    filename: 'test-shelf.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024
  }, true);
  
  if (!urlResult.ok) {
    console.error('URL generation failed:', urlResult.data);
    return;
  }
  
  const uploadUrl = urlResult.data.data.uploadUrl;
  const photoUrl = urlResult.data.data.photoUrl;
  console.log(`   ✅ S3 URL Generated: ${uploadUrl.substring(0, 50)}...\n`);
  
  // 4. Step 4/5 of Flow: Bedrock Trigger
  console.log('4️⃣ Step 4 & 5: Triggering AI Inspector (Bedrock)...');
  
  // We send a valid base64 image (reading the user's specified testing image)
  let dummyImageBase64 = '';
  try {
    const imageBuffer = fs.readFileSync('./public/ms-display-rack-1000x1000.png');
    dummyImageBase64 = imageBuffer.toString('base64');
    console.log(`   Read public/ms-display-rack-1000x1000.png successfully (${dummyImageBase64.length} bytes)`);
  } catch (err) {
    console.warn(`   ⚠️ Warning: Could not read dummy image file: ${err.message}. Using fallback pixel.`);
    dummyImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
  
  const analyzeResult = await apiCall('/api/photos/analyze', 'POST', {
    shopkeeperId,
    photoUrl: photoUrl, // Pass the AWS S3 URL we just generated
    imageData: `data:image/png;base64,${dummyImageBase64}`, // Send image data directly to bypass download from s3
    mimeType: 'image/png'
  }, true);
  
  if (analyzeResult.ok) {
    console.log('   ✅ Analysis Succeeded!');
    console.log('   Response Data:', JSON.stringify(analyzeResult.data.data, null, 2));
  } else {
    console.error('   ❌ Analysis Failed:', analyzeResult.data);
  }
}

runFlow();
