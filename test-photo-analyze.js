/**
 * Test Photo Analysis API
 * Tests the complete flow:
 * 1. Sign in
 * 2. Upload photo (or use existing)
 * 3. Analyze photo with Claude AI
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const IMAGE_PATH = process.argv[2] || path.join(__dirname, 'public', 'icon-512x512.png');

let TOKEN = '';
let SHOPKEEPER_ID = '';

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

async function uploadToS3(presignedUrl, filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: fileBuffer,
    headers: {
      'Content-Type': 'image/png',
    },
  });
  
  return response.ok;
}

async function main() {
  console.log('🧪 Photo Analysis Test');
  console.log('======================\n');
  
  // Step 1: Sign in
  console.log('🔐 Step 1: Signing in...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const signinResult = await apiCall('/api/auth/signin', 'POST', {
    phoneNumber: '+919902010000',
    password: 'Password123!',
  });
  
  if (!signinResult.ok || !signinResult.data.accessToken) {
    console.error('❌ Signin failed');
    console.log('Response:', JSON.stringify(signinResult.data, null, 2));
    return;
  }
  
  TOKEN = signinResult.data.accessToken;
  const payload = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64').toString());
  SHOPKEEPER_ID = payload.sub;
  
  console.log('✅ Signed in successfully');
  console.log('Shopkeeper ID:', SHOPKEEPER_ID);
  
  // Step 2: Upload photo (if needed)
  console.log('\n📤 Step 2: Uploading photo...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const stats = fs.statSync(IMAGE_PATH);
  
  const uploadUrlResult = await apiCall('/api/photos/upload-url', 'POST', {
    shopkeeperId: SHOPKEEPER_ID,
    photoType: 'shelf',
    filename: 'test-shelf-analysis.png',
    mimeType: 'image/png',
    fileSize: stats.size,
  }, true);
  
  if (!uploadUrlResult.ok) {
    console.error('❌ Failed to get upload URL');
    console.log('Response:', JSON.stringify(uploadUrlResult.data, null, 2));
    return;
  }
  
  const photoUrl = uploadUrlResult.data.data.photoUrl;
  const photoKey = uploadUrlResult.data.data.photoKey;
  
  console.log('✅ Got presigned URL');
  console.log('Photo Key:', photoKey);
  
  const uploadSuccess = await uploadToS3(
    uploadUrlResult.data.data.uploadUrl,
    IMAGE_PATH
  );
  
  if (!uploadSuccess) {
    console.error('❌ Upload failed');
    return;
  }
  
  console.log('✅ Photo uploaded successfully');
  console.log('Photo URL:', photoUrl);
  
  // Step 3: Analyze photo
  console.log('\n🔍 Step 3: Analyzing photo with Claude AI...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('This may take 10-30 seconds...\n');
  
  const analyzeStartTime = Date.now();
  
  const analyzeResult = await apiCall('/api/photos/analyze', 'POST', {
    shopkeeperId: SHOPKEEPER_ID,
    photoUrl: photoUrl,
    s3Key: photoKey,
    mimeType: 'image/png',
  }, true);
  
  const analyzeTime = Date.now() - analyzeStartTime;
  
  console.log('Analysis completed in:', (analyzeTime / 1000).toFixed(2), 'seconds');
  console.log('Status:', analyzeResult.status);
  console.log('\nResponse:');
  console.log(JSON.stringify(analyzeResult.data, null, 2));
  
  if (analyzeResult.ok) {
    console.log('\n✅ ANALYSIS SUCCESSFUL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const data = analyzeResult.data.data;
    
    console.log('\n📊 Analysis Results:');
    console.log('-------------------');
    console.log('Empty Spaces:', data.emptySpaces?.length || 0);
    if (data.emptySpaces && data.emptySpaces.length > 0) {
      data.emptySpaces.forEach((space, i) => {
        console.log(`  ${i + 1}. Level ${space.shelfLevel} - ${space.locationDescription}`);
        console.log(`     Details: ${space.visibility} visibility, ${space.accessibility} accessibility (${space.coordinates?.width}x${space.coordinates?.height} at x:${space.coordinates?.x}, y:${space.coordinates?.y})`);
      });
    }
    
    console.log('\nCurrent Inventory:', data.currentInventory?.length || 0);
    if (data.currentInventory && data.currentInventory.length > 0) {
      data.currentInventory.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.name} (${item.brand}) - ${item.category}`);
      });
    }
    
    console.log('\nConfidence:', (data.analysisConfidence * 100).toFixed(1) + '%');
    console.log('Processing Time:', data.processingTime + 'ms');
    console.log('Total Time:', data.totalTime + 'ms');
    
    if (data.totalTime > 30000) {
      console.log('\n⚠️  Warning: Analysis took longer than 30 seconds');
    }
  } else {
    console.log('\n❌ ANALYSIS FAILED');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
}

main();
