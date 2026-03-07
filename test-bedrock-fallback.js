/**
 * Test script for Bedrock multi-model fallback chain
 * Task 4.2: Verify Nova Pro → Nova Lite → Claude Haiku fallback
 */

const fs = require('fs');
const path = require('path');

// Mock a simple shelf image (1x1 pixel JPEG in base64)
const MOCK_IMAGE_BASE64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q==';

async function testBedrockFallback() {
  console.log('🧪 Testing Bedrock Multi-Model Fallback Chain\n');

  try {
    // Import the Bedrock client
    const { analyzeShelfPhoto } = require('./src/lib/vision/bedrock-client.ts');

    console.log('📸 Analyzing mock shelf photo...');
    console.log('Expected: Nova Pro → Nova Lite → Claude Haiku fallback chain\n');

    const startTime = Date.now();
    
    const analysis = await analyzeShelfPhoto(
      MOCK_IMAGE_BASE64,
      'image/jpeg',
      'test-shopkeeper-id'
    );

    const duration = Date.now() - startTime;

    console.log('\n✅ Analysis completed successfully!');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log('\n📊 Analysis Results:');
    console.log(JSON.stringify(analysis, null, 2));

    // Verify the database logging
    console.log('\n🔍 Checking database logs...');
    const { query } = require('./src/lib/db/postgres/client.ts');
    
    const logs = await query(
      `SELECT model, status, request_type, response_time_ms, timestamp 
       FROM bedrock_usage_logs 
       ORDER BY timestamp DESC 
       LIMIT 5`
    );

    console.log('\n📝 Recent Bedrock Usage Logs:');
    logs.rows.forEach((log, i) => {
      console.log(`${i + 1}. ${log.model} - ${log.status} (${log.response_time_ms}ms) - ${log.request_type}`);
    });

    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testBedrockFallback();
