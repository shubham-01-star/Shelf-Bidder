/**
 * Test Resend Email
 * Direct test to check if email is being sent
 */

require('dotenv').config({ path: '.env.local' });
const { Resend } = require('resend');

const testEmail = 'shubhamsingh8348@gmail.com'; // Verified email
const testOTP = '123456';

console.log('📧 Testing Resend Email...\n');
console.log('Configuration:');
console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not Set');
console.log('  To Email:', testEmail);
console.log('  Test OTP:', testOTP);
console.log('');

async function testResendEmail() {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env.local');
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('Sending test email...');
    
    const { data, error } = await resend.emails.send({
      from: 'Shelf-Bidder <noreply@opsguard.dev>', // Using your verified domain
      to: [testEmail],
      subject: 'Test Email - Shelf-Bidder OTP',
      html: `
        <div style="background-color:#f6f9fc;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
          <div style="background-color:#fff;border:1px solid #e6ebf1;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);max-width:500px;margin:0 auto;padding:32px;text-align:center">
            <h1 style="color:#0f172a;font-size:24px;font-weight:700;margin:0 0 24px 0">Shelf-Bidder Test Email</h1>
            <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px 0;text-align:left">Hi,</p>
            <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px 0;text-align:left">This is a test email to verify Resend integration. Your test OTP code is:</p>
            <div style="background-color:#f8fafc;border:2px dashed #94a3b8;border-radius:12px;margin:32px 0;padding:24px">
              <span style="color:#0f172a;font-size:36px;font-weight:800;letter-spacing:8px">${testOTP}</span>
            </div>
            <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px 0;text-align:left">If you received this email, Resend is working correctly!</p>
            <hr style="border-top:1px solid #e6ebf1;border-left:none;border-right:none;border-bottom:none;margin:32px 0"/>
            <p style="color:#64748b;font-size:14px;margin:0">© ${new Date().getFullYear()} Shelf-Bidder. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend Error:', error);
      console.error('');
      
      if (error.message && error.message.includes('testing emails')) {
        console.error('⚠️  Resend is in test mode!');
        console.error('You can only send emails to your verified email address.');
        console.error('');
        console.error('Solutions:');
        console.error('1. Use your verified email (shubhamkumar990201@gmail.com)');
        console.error('2. Verify a domain at https://resend.com/domains');
        console.error('3. Use console OTP for testing (already working)');
      }
      
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('');
    console.log('Email Details:');
    console.log('  Email ID:', data?.id);
    console.log('  To:', testEmail);
    console.log('  Subject: Test Email - Shelf-Bidder OTP');
    console.log('');
    console.log('🎉 Check your inbox at', testEmail);
    console.log('(Check spam folder if not in inbox)');

  } catch (err) {
    console.error('❌ Unexpected Error:', err);
    console.error('');
    console.error('Error details:', {
      name: err.name,
      message: err.message,
    });
  }
}

testResendEmail();
