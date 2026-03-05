/**
 * Check AWS Bedrock Access
 * Verifies if Claude models are accessible in your AWS account
 */

const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
require('dotenv').config({ path: '.env.local' });

const client = new BedrockRuntimeClient({
  region: process.env.BEDROCK_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testBedrockAccess() {
  console.log('🔍 Testing AWS Bedrock Access');
  console.log('==============================\n');
  
  console.log('Region:', process.env.BEDROCK_REGION || 'us-east-1');
  console.log('');
  
  // Try multiple model IDs
  const modelIds = [
    process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
    'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    'anthropic.claude-3-haiku-20240307-v1:0',  // Older but might work
    'us.anthropic.claude-3-haiku-20240307-v1:0',
    'anthropic.claude-3-sonnet-20240229-v1:0',
  ];
  
  // Test with a simple text prompt
  const request = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Say "Hello, Bedrock is working!" in one sentence.',
          },
        ],
      },
    ],
  };
  
  let successfulModel = null;
  
  for (const modelId of modelIds) {
    console.log(`📤 Testing model: ${modelId}`);
    
    try {
      const command = new InvokeModelCommand({
        modelId: modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(request),
      });
      
      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      console.log('✅ SUCCESS! This model works!\n');
      console.log('Response:', responseBody.content[0].text);
      console.log('\nUsage:');
      console.log('  Input tokens:', responseBody.usage.input_tokens);
      console.log('  Output tokens:', responseBody.usage.output_tokens);
      
      successfulModel = modelId;
      break;
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
      console.log('');
    }
  }
  
  if (successfulModel) {
    console.log('\n✅ Your AWS Bedrock setup is working!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Working Model ID:', successfulModel);
    console.log('\nAdd this to your .env.local:');
    console.log(`BEDROCK_MODEL_ID=${successfulModel}`);
  } else {
    console.error('\n❌ FAILED! None of the models worked');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 Setup Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to: https://console.aws.amazon.com/bedrock/home?region=us-east-1#/modelaccess');
    console.log('2. Click "Manage model access"');
    console.log('3. Enable "Claude 3.5 Sonnet v2" or "Claude 3 Haiku"');
    console.log('4. Click "Save changes"');
    console.log('5. Wait 1-2 minutes for activation');
    console.log('6. Run this script again');
  }
}

testBedrockAccess();
