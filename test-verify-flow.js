/**
 * Test Complete Signup -> Verify Flow
 * This will help debug why DB entry is not created
 */

const testPhoneNumber = '+919876543210';
const testPassword = 'Test@1234';
const testName = 'Ramesh Kumar';
const testEmail = 'ramesh@example.com';

console.log('🧪 Testing Complete Signup -> Verify Flow\n');

async function testFlow() {
  try {
    // Step 1: Signup
    console.log('1️⃣ Testing Signup...');
    const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: testPhoneNumber,
        password: testPassword,
        name: testName,
        email: testEmail,
      }),
    });

    const signupData = await signupResponse.json();
    console.log('Signup Response:', signupData);
    console.log('');

    if (!signupResponse.ok) {
      console.log('⚠️  Signup failed or user already exists');
      console.log('Continuing with verify test anyway...\n');
    }

    // Step 2: Verify with test OTP
    console.log('2️⃣ Testing Verify with OTP 123456...');
    const verifyResponse = await fetch('http://localhost:3000/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: testPhoneNumber,
        code: '123456', // Test OTP
      }),
    });

    const verifyData = await verifyResponse.json();
    console.log('Verify Response Status:', verifyResponse.status);
    console.log('Verify Response:', verifyData);
    console.log('');

    if (!verifyResponse.ok) {
      console.log('❌ Verify failed!');
      console.log('Check server console for detailed error logs');
      return;
    }

    console.log('✅ Verify API returned success');
    console.log('');

    // Step 3: Try to signin and get token
    console.log('3️⃣ Testing Signin...');
    const signinResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: testPhoneNumber,
        password: testPassword,
      }),
    });

    const signinData = await signinResponse.json();
    console.log('Signin Response:', signinData);
    console.log('');

    if (!signinResponse.ok) {
      console.log('❌ Signin failed!');
      return;
    }

    const token = signinData.accessToken || signinData.idToken;
    console.log('✅ Got token:', token.substring(0, 50) + '...');
    console.log('');

    // Step 4: Check profile (this will query DynamoDB)
    console.log('4️⃣ Testing Profile API (checks DynamoDB)...');
    const profileResponse = await fetch('http://localhost:3000/api/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const profileData = await profileResponse.json();
    console.log('Profile Response Status:', profileResponse.status);
    console.log('Profile Response:', JSON.stringify(profileData, null, 2));
    console.log('');

    if (profileResponse.ok && profileData.shopkeeper) {
      console.log('🎉 SUCCESS! DynamoDB entry exists!');
      console.log('Shopkeeper ID:', profileData.shopkeeper.id);
      console.log('Name:', profileData.shopkeeper.name);
      console.log('Phone:', profileData.shopkeeper.phoneNumber);
    } else {
      console.log('❌ FAILED! DynamoDB entry NOT found!');
      console.log('');
      console.log('🔍 Debugging Steps:');
      console.log('1. Check server console for [DynamoDB Create] logs');
      console.log('2. Check server console for [DynamoDB Error] logs');
      console.log('3. Look for any error during verify API call');
      console.log('4. Check if Cognito user was created but DB write failed');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('');
    console.error('Make sure:');
    console.error('1. Next.js server is running (npm run dev)');
    console.error('2. Server is accessible at http://localhost:3000');
  }
}

testFlow();
