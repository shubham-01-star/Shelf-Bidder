/**
 * Complete Photo Upload Test
 * 1. Sign in to get token
 * 2. Get presigned upload URL
 * 3. Upload actual image file to S3
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const IMAGE_PATH = path.join(__dirname, 'public', 'icon-512x512.png');

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

async function uploadToS3(presignedUrl, filePath) {
  console.log('\n📤 Uploading file to S3...');
  console.log('File:', filePath);
  console.log('URL:', presignedUrl.substring(0, 100) + '...');
  
  try {
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    
    console.log('File size:', (stats.size / 1024).toFixed(2), 'KB');
    
    // Upload to S3 using presigned URL
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'image/png',
      },
    });
    
    console.log('Upload status:', response.status);
    
    if (response.ok) {
      console.log('✅ File uploaded successfully!');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Upload failed');
      console.log('Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Complete Photo Upload Test');
  console.log('================================\n');
  
  // Check if image file exists
  if (!fs.existsSync(IMAGE_PATH)) {
    console.error('❌ Image file not found:', IMAGE_PATH);
    return;
  }
  
  const stats = fs.statSync(IMAGE_PATH);
  console.log('📸 Image file found');
  console.log('Path:', IMAGE_PATH);
  console.log('Size:', (stats.size / 1024).toFixed(2), 'KB');
  console.log('');
  
  // Step 1: Sign in
  console.log('🔐 Step 1: Signing in...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const signinResult = await apiCall('/api/auth/signin', 'POST', {
    phoneNumber: '+919876543210',
    password: 'Test@1234',
  });
  
  if (!signinResult.ok || !signinResult.data.accessToken) {
    console.error('❌ Signin failed');
    console.log('Response:', JSON.stringify(signinResult.data, null, 2));
    return;
  }
  
  TOKEN = signinResult.data.accessToken;
  const payload = JSON.parse(Buffer.from(TOKEN.split('.')[1], 'base64').toString());
  const shopkeeperId = payload.sub;
  
  console.log('✅ Signed in successfully');
  console.log('Shopkeeper ID:', shopkeeperId);
  
  // Step 2: Get presigned upload URL
  console.log('\n📝 Step 2: Getting presigned upload URL...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const uploadUrlResult = await apiCall('/api/photos/upload-url', 'POST', {
    shopkeeperId: shopkeeperId,
    photoType: 'shelf',
    filename: 'icon-512x512.png',
    mimeType: 'image/png',
    fileSize: stats.size,
  }, true);
  
  if (!uploadUrlResult.ok) {
    console.error('❌ Failed to get upload URL');
    console.log('Response:', JSON.stringify(uploadUrlResult.data, null, 2));
    return;
  }
  
  console.log('✅ Got presigned URL');
  console.log('Photo Key:', uploadUrlResult.data.data.photoKey);
  console.log('Photo URL:', uploadUrlResult.data.data.photoUrl);
  console.log('Expires in:', uploadUrlResult.data.data.expiresIn, 'seconds');
  
  // Step 3: Upload file to S3
  console.log('\n📤 Step 3: Uploading file to S3...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const uploadSuccess = await uploadToS3(
    uploadUrlResult.data.data.uploadUrl,
    IMAGE_PATH
  );
  
  if (uploadSuccess) {
    console.log('\n🎉 Complete upload flow successful!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Photo is now available at:');
    console.log(uploadUrlResult.data.data.photoUrl);
  } else {
    console.log('\n❌ Upload flow failed');
  }
}

main();
