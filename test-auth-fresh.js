const { spawn } = require('child_process');
const fetch = require('node-fetch');

const PORT = 4000;
const API_URL = `http://localhost:${PORT}/api`;

const nextDev = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'dev', '--', '-p', PORT], {
  cwd: __dirname,
  stdio: 'pipe',
  shell: true
});

nextDev.stdout.on('data', (data) => console.log(`[Next.js] ${data.toString().trim()}`));
nextDev.stderr.on('data', (data) => console.error(`[Next.js Error] ${data.toString().trim()}`));

console.log('⏳ Waiting for Next.js to start on port 4000...');

setTimeout(async () => {
    console.log('🔄 Starting Full Authentication Flow Test...\n');
    const randomString = () => Math.random().toString(36).substring(7);
  
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
          if (signupText.includes('Error:')) {
            console.log(signupText.match(/Error:[^<]+/)?.[0] || 'Unknown Error in HTML');
          } else {
            console.log(signupText.substring(0, 100));
          }
          console.log('--- HTML ERROR OUTPUT END ---');
      } else {
          console.log('Signup Response:', signupText);
      }
    } catch (err) {
      console.error('❌ Shopkeeper flow failed:', err.message);
    }
  
    // --- BRAND AUTH TEST ---
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
          if (bSignupText.includes('Error:')) {
            console.log(bSignupText.match(/Error:[^<]+/)?.[0] || 'Unknown Error in HTML');
          } else {
            console.log(bSignupText.substring(0, 100));
          }
          console.log('--- HTML ERROR OUTPUT END ---');
      } else {
          console.log('Brand Signup Response:', bSignupText);
      }
    } catch (err) {
      console.error('❌ Brand flow failed:', err.message);
    }
  
    console.log('\n✅ Testing Complete. Shutting down Next.js...');
    nextDev.kill();
    process.exit(0);

}, 15000); // Wait 15 seconds for next.js to compile
