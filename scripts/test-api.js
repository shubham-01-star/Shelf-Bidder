const http = require('http');

async function testFlow() {
  console.log('Sending signup request...');
  const signupResponse = await fetch('http://localhost:3000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: '+919999988888',
      password: 'TestPassword123#',
      name: 'Test Shopkeeper',
      email: 'test@example.com'
    })
  });
  
  const signupText = await signupResponse.text();
  console.log('Signup Status:', signupResponse.status);
  console.log('Signup Response:', signupText);
  
  // Wait to allow console logs to appear in Next.js
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\nSending verify request with standard fake code 123456 ...');
  const verifyResponse = await fetch('http://localhost:3000/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: '+919999988888',
      code: '123456'
    })
  });
  
  const verifyText = await verifyResponse.text();
  console.log('Verify Status:', verifyResponse.status);
  console.log('Verify Response:', verifyText);
  
  console.log('\nGenerating mock JWT for dashboard...');
  const h = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64');
  const p = Buffer.from(JSON.stringify({sub:'+919999988888'})).toString('base64');
  const mockToken = h + '.' + p + '.sig';
  
  console.log('\nSending dashboard request...');
  const dashResponse = await fetch('http://localhost:3000/api/dashboard', {
    headers: { 'Authorization': `Bearer ${mockToken}` }
  });
  
  const dashText = await dashResponse.text();
  console.log('Dashboard Status:', dashResponse.status);
  console.log('Dashboard Response:', dashText);
}

testFlow().catch(console.error);
