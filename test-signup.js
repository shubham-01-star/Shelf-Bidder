const http = require('http');

function postData(path, data) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });

    req.on('error', reject);
    req.write(dataString);
    req.end();
  });
}

async function test() {
  console.log('Sending Shopkeeper signup request...');
  try {
    const shopkeeperRes = await postData('/api/auth/signup', {
      phoneNumber: '+919999999998', // dummy for shopkeeper
      password: 'Password123!',
      name: 'Shubham',
      email: 'shubhamkumar990201@gmail.com'
    });
    console.log('Shopkeeper Response:', shopkeeperRes.status, shopkeeperRes.body);
  } catch(e) { console.error('Shopkeeper Error:', e.message); }

  console.log('Sending Brand signup request...');
  try {
    const brandRes = await postData('/api/brand/auth', {
      action: 'signup',
      brandName: 'Test Brand',
      email: 'work.shubhmkumar@gmail.com',
      password: 'Password123!',
      contactPerson: 'Shubham Brand'
    });
    console.log('Brand Response:', brandRes.status, brandRes.body);
  } catch(e) { console.error('Brand Error:', e.message); }
}

test();
