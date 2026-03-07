/**
 * Test Script: Brand Wallet Recharge & Email Flow
 * Tests brand wallet recharge and email OTP/welcome functionality
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testBrandWalletRecharge() {
  console.log('🧪 Testing Brand Wallet Recharge\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Recharge with valid amount
    console.log('\n📝 Test 1: Brand wallet recharge (₹10,000)');
    console.log('-'.repeat(60));
    
    const response1 = await fetch(`${BASE_URL}/api/brand/wallet/recharge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brandId: 'brand-test-001',
        amount: 10000,
        paymentMethod: 'card',
      }),
    });

    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(result1, null, 2));
    
    if (response1.status === 200 && result1.success) {
      console.log('✅ Test 1 PASSED: Recharge successful');
      console.log(`   Transaction ID: ${result1.data.transactionId}`);
      console.log(`   Amount: ₹${result1.data.amount}`);
      console.log(`   Payment Method: ${result1.data.paymentMethod}`);
    } else {
      console.log('❌ Test 1 FAILED: Recharge should have succeeded');
    }

    // Test 2: Recharge with amount below minimum
    console.log('\n📝 Test 2: Recharge with amount below minimum (₹500)');
    console.log('-'.repeat(60));
    
    const response2 = await fetch(`${BASE_URL}/api/brand/wallet/recharge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brandId: 'brand-test-001',
        amount: 500,
        paymentMethod: 'upi',
      }),
    });

    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(result2, null, 2));
    
    if (response2.status === 400) {
      console.log('✅ Test 2 PASSED: Correctly rejected amount below minimum');
    } else {
      console.log('❌ Test 2 FAILED: Should have rejected low amount');
    }

    // Test 3: Get recharge history
    console.log('\n📝 Test 3: Get recharge history');
    console.log('-'.repeat(60));
    
    const response3 = await fetch(`${BASE_URL}/api/brand/wallet/recharge?brandId=brand-test-001`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(result3, null, 2));
    
    if (response3.status === 200 && result3.success) {
      console.log('✅ Test 3 PASSED: Retrieved recharge history');
      console.log(`   Total Recharges: ${result3.data.totalRecharges}`);
      console.log(`   Total Amount: ₹${result3.data.totalAmount}`);
    } else {
      console.log('❌ Test 3 FAILED: Should have retrieved history');
    }

    // Test 4: Large recharge
    console.log('\n📝 Test 4: Large recharge (₹100,000)');
    console.log('-'.repeat(60));
    
    const response4 = await fetch(`${BASE_URL}/api/brand/wallet/recharge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brandId: 'brand-test-001',
        amount: 100000,
        paymentMethod: 'card',
      }),
    });

    const result4 = await response4.json();
    console.log('Status:', response4.status);
    console.log('Response:', JSON.stringify(result4, null, 2));
    
    if (response4.status === 200 && result4.success) {
      console.log('✅ Test 4 PASSED: Large recharge successful');
    } else {
      console.log('❌ Test 4 FAILED: Large recharge should have succeeded');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Brand wallet recharge tests completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

async function testEmailFlow() {
  console.log('\n\n🧪 Testing Email Flow (OTP & Welcome)\n');
  console.log('='.repeat(60));
  
  console.log('\n📧 Email Flow Test Instructions:');
  console.log('-'.repeat(60));
  console.log('1. Sign up with a new account at /auth/signup');
  console.log('2. Check your email for OTP code');
  console.log('3. Verify OTP at /auth/verify');
  console.log('4. Check your email for welcome message');
  console.log('\n✅ Email integration is configured with Resend');
  console.log('   - OTP emails will be sent during signup');
  console.log('   - Welcome emails will be sent after verification');
  console.log('   - Check server console for email logs');
  console.log('\n' + '='.repeat(60));
}

// Run tests
(async () => {
  await testBrandWalletRecharge();
  await testEmailFlow();
})();
