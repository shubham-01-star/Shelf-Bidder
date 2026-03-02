require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error('No RESEND_API_KEY found in .env.local');
  process.exit(1);
}

const resend = new Resend(apiKey);

async function testResend() {
  console.log('Sending test email via Resend...');
  const { data, error } = await resend.emails.send({
    from: 'Shelf-Bidder Verification <onboarding@resend.dev>',
    to: 'test@example.com', // Just to test API connection
    subject: 'Resend Connection Test',
    html: '<h1>If you see this, Resend is configured correctly!</h1>',
  });

  if (error) {
    console.error('Resend Error:', error);
  } else {
    console.log('Success! Email ID:', data?.id);
  }
}

testResend();
