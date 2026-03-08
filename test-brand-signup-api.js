const fetch = require('node-fetch');

async function testBrandSignup() {
  const response = await fetch('http://localhost:3000/api/brand/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'signup',
      brandName: 'Test Brand',
      email: 'work.shubhmkumar@gmail.com',
      contactPerson: 'Shubham',
      password: 'Password123!'
    })
  });
  const data = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', data);
}

testBrandSignup();
