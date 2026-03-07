/**
 * Test script for Proof Verification System
 * Task 4.3: Verify task completion with Bedrock fallback chain
 * Tests: Requirements 5.3, 5.6, 13.1, 13.2, 13.3
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  shopkeeperId: 'test-shopkeeper-uuid',
  taskId: 'test-task-uuid',
  beforePhotoPath: './test-assets/shelf-before.jpg',
  afterPhotoPath: './test-assets/shelf-after.jpg',
};

console.log('🧪 Testing Proof Verification System with Bedrock Fallback\n');
console.log('This test verifies:');
console.log('  ✓ Bedrock multi-model fallback chain (Nova Pro → Nova Lite → Claude Haiku)');
console.log('  ✓ Before/after photo comparison');
console.log('  ✓ Task completion with ACID transaction');
console.log('  ✓ Earnings credit to wallet');
console.log('  ✓ Performance requirement (< 30 seconds)\n');

/**
 * Convert image file to base64
 */
function imageToBase64(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    return imageBuffer.toString('base64');
  } catch (error) {
    console.error(`❌ Failed to read image: ${filePath}`);
    console.error(error.message);
    return null;
  }
}

/**
 * Test 1: Verify with before/after photos (URLs)
 */
async function testVerifyWithUrls() {
  console.log('\n1️⃣ Testing verification with S3 URLs...');

  const requestBody = {
    taskId: TEST_CONFIG.taskId,
    shopkeeperId: TEST_CONFIG.shopkeeperId,
    beforePhotoUrl