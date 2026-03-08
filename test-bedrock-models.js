import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const modelsToTest = [
  'amazon.nova-2-lite-v1:0',
  'amazon.nova-lite-v1:0',
  'amazon.nova-pro-v1:0',
  'amazon.nova-micro-v1:0',
  'us.amazon.nova-lite-v1:0',
  'us.amazon.nova-pro-v1:0',
  'anthropic.claude-3-haiku-20240307-v1:0',
  'anthropic.claude-3-5-sonnet-20240620-v1:0',
  'us.anthropic.claude-3-haiku-20240307-v1:0',
  'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
];

const client = new BedrockRuntimeClient({ region: 'us-east-1' });

async function testModels() {
  console.log(`🔍 Testing Bedrock Models Availability in ${await client.config.region()}...\n`);
  
  const workingModels = [];

  for (const modelId of modelsToTest) {
    try {
      process.stdout.write(`Testing ${modelId}... `);
      
      let body;
      if (modelId.includes('nova')) {
        body = {
          messages: [{ role: 'user', content: [{ text: 'Say hello' }] }],
          inferenceConfig: { maxTokens: 10 }
        };
      } else if (modelId.includes('claude')) {
        body = {
          anthropic_version: 'bedrock-2023-05-31',
          messages: [{ role: 'user', content: [{ type: 'text', text: 'Say hello' }] }],
          max_tokens: 10
        };
      } else {
          continue;
      }

      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(body),
      });

      const response = await client.send(command);
      console.log('✅ SUCCESS!');
      workingModels.push(modelId);
      
    } catch (error) {
       // Only log a short version of the error to keep it clean
      let errorMsg = error.message;
      if (errorMsg.includes('ValidationException')) errorMsg = 'ValidationException (throughput/unsupported)';
      if (errorMsg.includes('AccessDenied')) errorMsg = 'AccessDenied (marketplace/billing)';
      console.log(`❌ FAILED (${error.name}: ${errorMsg.substring(0, 80)})`);
    }
  }

  console.log('\n---RESULTS---');
  if (workingModels.length > 0) {
      console.log('Working Models:');
      workingModels.forEach(m => console.log(`- ${m}`));
  } else {
      console.log('No working models found with current AWS credentials/region.');
  }
}

testModels();
