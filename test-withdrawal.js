/**
 * Test Script: Wallet Withdrawal
 * Tests the fake withdrawal API endpoint
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testWithdrawal() {
  console.log('🧪 Testing Wallet Withdrawal API\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Withdrawal without authentication (should fail)
    console.log('\n📝 Test 1: Withdrawal without authentication');
    console.log('-'.repeat(60));
    
    const response1 = await fetch(`${BASE_URL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 100 }),
    });

    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(result1, null, 2));
    
    if (response1.status === 401) {
      console.log('✅ Test 1 PASSED: Correctly rejected unauthenticated request');
    } else {
      console.log('❌ Test 1 FAILED: Should have rejected unauthenticated request');
    }

    // Test 2: Withdrawal with mock authentication (local dev mode)
    console.log('\n📝 Test 2: Withdrawal with mock authentication');
    console.log('-'.repeat(60));
    
    const response2 = await fetch(`${BASE_URL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-for-local-dev',
      },
      body: JSON.stringify({ amount: 500 }),
    });

    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(result2, null, 2));
    
    if (response2.status === 200 && result2.success) {
      console.log('✅ Test 2 PASSED: Withdrawal successful');
      console.log(`   Transaction ID: ${result2.data.transactionId}`);
      console.log(`   Amount: ₹${result2.data.amount}`);
      console.log(`   Bank: ${result2.data.bankAccount}`);
    } else {
      console.log('❌ Test 2 FAILED: Withdrawal should have succeeded');
    }

    // Test 3: Invalid amount (zero)
    console.log('\n📝 Test 3: Withdrawal with invalid amount (zero)');
    console.log('-'.repeat(60));
    
    const response3 = await fetch(`${BASE_URL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-for-local-dev',
      },
      body: JSON.stringify({ amount: 0 }),
    });

    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(result3, null, 2));
    
    if (response3.status === 400) {
      console.log('✅ Test 3 PASSED: Correctly rejected invalid amount');
    } else {
      console.log('❌ Test 3 FAILED: Should have rejected invalid amount');
    }

    // Test 4: Negative amount
    console.log('\n📝 Test 4: Withdrawal with negative amount');
    console.log('-'.repeat(60));
    
    const response4 = await fetch(`${BASE_URL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-for-local-dev',
      },
      body: JSON.stringify({ amount: -100 }),
    });

    const result4 = await response4.json();
    console.log('Status:', response4.status);
    console.log('Response:', JSON.stringify(result4, null, 2));
    
    if (response4.status === 400) {
      console.log('✅ Test 4 PASSED: Correctly rejected negative amount');
    } else {
      console.log('❌ Test 4 FAILED: Should have rejected negative amount');
    }

    // Test 5: Large withdrawal
    console.log('\n📝 Test 5: Large withdrawal (₹5000)');
    console.log('-'.repeat(60));
    
    const response5 = await fetch(`${BASE_URL}/api/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-for-local-dev',
      },
      body: JSON.stringify({ amount: 5000 }),
    });

    const result5 = await response5.json();
    console.log('Status:', response5.status);
    console.log('Response:', JSON.stringify(result5, null, 2));
    
    if (response5.status === 200 && result5.success) {
      console.log('✅ Test 5 PASSED: Large withdrawal successful');
    } else {
      console.log('⚠️  Test 5: Check if balance is sufficient');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Withdrawal API tests completed!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests
testWithdrawal();
