/**
 * Test Script: S3 Storage Monitoring
 * Tests the storage monitoring and lifecycle policy implementation
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'dev-cron-secret';

async function testStorageUsage() {
  console.log('\n📊 Testing Storage Usage Endpoint...');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${BASE_URL}/api/storage/usage`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Storage usage retrieved successfully');
      console.log(`   Total Storage: ${data.data.totalGB} GB`);
      console.log(`   Free Tier Usage: ${data.data.percentOfFreeLimit}%`);
      console.log(`   Object Count: ${data.data.objectCount}`);
      console.log(`   Shelf Photos: ${data.data.byPrefix.shelf.gb} GB (${data.data.byPrefix.shelf.count} files)`);
      console.log(`   Proof Photos: ${data.data.byPrefix.proof.gb} GB (${data.data.byPrefix.proof.count} files)`);
      console.log(`   Remaining: ${data.data.freeTierLimit.remainingGB} GB`);
    } else {
      console.log('❌ Failed to retrieve storage usage');
      console.log('   Error:', data.error);
      console.log('   Details:', data.details);
    }
    
    return data;
  } catch (error) {
    console.log('❌ Error testing storage usage:', error.message);
    return null;
  }
}

async function testStorageMonitoring() {
  console.log('\n🔍 Testing Storage Monitoring Endpoint...');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${BASE_URL}/api/storage/monitor`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Storage monitoring completed successfully');
      console.log(`   Total Storage: ${data.data.usage.totalGB} GB`);
      console.log(`   Free Tier Usage: ${data.data.usage.percentOfFreeLimit}%`);
      console.log(`   Lifecycle Policy Applied: ${data.data.lifecyclePolicyApplied ? 'Yes' : 'No'}`);
      console.log(`   Recommendation: ${data.data.recommendation}`);
      
      if (data.data.lifecycleResult) {
        console.log(`   Policy Result: ${data.data.lifecycleResult.message}`);
        console.log(`   Applied At: ${data.data.lifecycleResult.appliedAt}`);
      }
    } else {
      console.log('❌ Failed to monitor storage');
      console.log('   Error:', data.error);
      console.log('   Details:', data.details);
    }
    
    return data;
  } catch (error) {
    console.log('❌ Error testing storage monitoring:', error.message);
    return null;
  }
}

async function testManualPolicyApplication() {
  console.log('\n🔄 Testing Manual Lifecycle Policy Application...');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${BASE_URL}/api/storage/monitor`, {
      method: 'POST',
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Manual policy application completed');
      console.log(`   Total Storage: ${data.data.usage.totalGB} GB`);
      console.log(`   Free Tier Usage: ${data.data.usage.percentOfFreeLimit}%`);
      console.log(`   Policy Result: ${data.data.lifecycleResult.message}`);
      console.log(`   Applied At: ${data.data.lifecycleResult.appliedAt}`);
    } else {
      console.log('❌ Failed to apply lifecycle policies');
      console.log('   Error:', data.error);
      console.log('   Details:', data.details);
    }
    
    return data;
  } catch (error) {
    console.log('❌ Error testing manual policy application:', error.message);
    return null;
  }
}

async function testCronEndpoint() {
  console.log('\n⏰ Testing Cron Endpoint...');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${BASE_URL}/api/storage/cron`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
      },
    });
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Cron endpoint executed successfully');
      console.log(`   Total Storage: ${data.data.usage.totalGB} GB`);
      console.log(`   Free Tier Usage: ${data.data.usage.percentOfFreeLimit}%`);
      console.log(`   Lifecycle Policy Applied: ${data.data.lifecyclePolicyApplied ? 'Yes' : 'No'}`);
      console.log(`   Recommendation: ${data.data.recommendation}`);
    } else {
      console.log('❌ Cron endpoint failed');
      console.log('   Error:', data.error);
      console.log('   Details:', data.details);
    }
    
    return data;
  } catch (error) {
    console.log('❌ Error testing cron endpoint:', error.message);
    return null;
  }
}

async function testUnauthorizedCronAccess() {
  console.log('\n🔒 Testing Unauthorized Cron Access...');
  console.log('='.repeat(50));
  
  try {
    const response = await fetch(`${BASE_URL}/api/storage/cron`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer wrong-secret',
      },
    });
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Unauthorized access correctly blocked');
      console.log('   Status:', response.status);
      console.log('   Error:', data.error);
    } else {
      console.log('❌ Security issue: Unauthorized access was not blocked');
      console.log('   Status:', response.status);
    }
    
    return data;
  } catch (error) {
    console.log('❌ Error testing unauthorized access:', error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('\n🚀 S3 Storage Monitoring Test Suite');
  console.log('='.repeat(50));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Cron Secret: ${CRON_SECRET.substring(0, 5)}...`);
  
  // Test 1: Storage Usage
  await testStorageUsage();
  
  // Test 2: Storage Monitoring
  await testStorageMonitoring();
  
  // Test 3: Manual Policy Application (commented out to avoid applying policies during testing)
  // Uncomment if you want to test manual policy application
  // await testManualPolicyApplication();
  
  // Test 4: Cron Endpoint
  await testCronEndpoint();
  
  // Test 5: Unauthorized Access
  await testUnauthorizedCronAccess();
  
  console.log('\n✅ All tests completed!');
  console.log('='.repeat(50));
}

// Run tests
runAllTests().catch(console.error);
