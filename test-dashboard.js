const http = require('http');

async function testDashboard() {
  console.log('Testing Brand Dashboard API...');
  
  // 1. First sign in to get a valid token
  const signinReq = await fetch('http://localhost:3000/api/brand/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'work.shubhmkumar@gmail.com',
      password: 'Test@1234'
    })
  });
  
  const signinData = await signinReq.json();
  
  if (!signinData.accessToken) {
    console.error('Failed to sign in:', signinData);
    return;
  }
  
  const token = signinData.accessToken;
  const brandId = signinData.brand.id;
  
  console.log(`✅ Signed in as ${signinData.brand.name} (ID: ${brandId})`);
  
  // 2. Fetch Dashboard with Token
  const dashboardReq = await fetch('http://localhost:3000/api/brand/dashboard', {
    method: 'GET',
    headers: {
      'x-brand-id': brandId,
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log(`Dashboard Status: ${dashboardReq.status}`);
  const dashboardData = await dashboardReq.json();
  console.log(JSON.stringify(dashboardData, null, 2));
}

testDashboard();
