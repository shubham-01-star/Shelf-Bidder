// Using native fetch if available (Node 18+)

const API_URL = 'http://localhost:3000/api';

const randomString = () => Math.random().toString(36).substring(7);

async function testAuthFlow() {
  console.log('🔄 Starting Full Authentication Flow Test...\n');

  // --- SHOPKEEPER TEST ---
  console.log('--- 🏪 SHOPKEEPER AUTH TEST ---');
  const shopPhone = `+919999${Math.floor(100000 + Math.random() * 900000)}`;
  const shopPassword = 'ShopPassword123!';
  
  console.log(`1. Signing up new shopkeeper: ${shopPhone}`);
  try {
    const signupRes = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: shopPhone,
        password: shopPassword,
        name: `Test Shop ${randomString()}`,
        email: `shop_${randomString()}@example.com`
      })
    });
    
    const signupText = await signupRes.text();
    if (!signupRes.ok) {
        console.log(`Signup Failed (${signupRes.status})`);
        console.log('--- HTML ERROR OUTPUT START ---');
        console.log(signupText.substring(0, 1500));
        console.log('--- HTML ERROR OUTPUT END ---');
    } else {
        const signupData = JSON.parse(signupText);
        console.log('Signup Response:', JSON.stringify(signupData, null, 2));

        console.log('\n2. Signing in as shopkeeper...');
        const signinRes = await fetch(`${API_URL}/auth/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: shopPhone,
            password: shopPassword
          })
        });
        
        console.log(`Signin Status: ${signinRes.status} ${signinRes.statusText}`);
        const signinData = await signinRes.json();
        console.log('Signin Response (Has Token?):', !!signinData.accessToken ? '✅ YES' : '❌ NO');
    }
  } catch (err) {
    console.error('❌ Shopkeeper flow failed:', err.message);
  }

  console.log('\n--- 🏢 BRAND AUTH TEST ---');
  const brandEmail = `brand_${randomString()}@example.com`;
  const brandPassword = 'BrandPassword123!';

  console.log(`1. Signing up new brand: ${brandEmail}`);
  try {
    const bSignupRes = await fetch(`${API_URL}/brand/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'signup',
        email: brandEmail,
        password: brandPassword,
        brandName: `Brand ${randomString()}`,
        contactPerson: 'Director'
      })
    });
    
    const bSignupText = await bSignupRes.text();
    if (!bSignupRes.ok) {
        console.log(`Brand Signup Failed (${bSignupRes.status})`);
        console.log('--- HTML ERROR OUTPUT START ---');
        console.log(bSignupText.substring(0, 1500));
        console.log('--- HTML ERROR OUTPUT END ---');
    } else {
        const bSignupData = JSON.parse(bSignupText);
        console.log('Brand Signup Response:', JSON.stringify(bSignupData, null, 2));

        console.log('\n2. Verifying brand email (Passthrough route)...');
        const bVerifyRes = await fetch(`${API_URL}/brand/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: brandEmail,
            code: '123456'
          })
        });
        console.log(`Brand Verify Status: ${bVerifyRes.status}`);

        console.log('\n3. Signing in as Brand...');
        const bSigninRes = await fetch(`${API_URL}/brand/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            email: brandEmail,
            password: brandPassword
          })
        });
        
        console.log(`Brand Signin Status: ${bSigninRes.status} ${bSigninRes.statusText}`);
        const bSigninData = await bSigninRes.json();
        console.log('Brand Signin Response (Has Token?):', !!bSigninData.token ? '✅ YES' : '❌ NO', '- User:', bSigninData.brand?.brandName);
    }
  } catch (err) {
    console.error('❌ Brand flow failed:', err.message);
  }

  console.log('\n✅ Testing Complete.');
}

testAuthFlow();
