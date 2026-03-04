/**
 * Direct DynamoDB Write Test
 * Tests if we can write to DynamoDB with current credentials
 */

require('dotenv').config({ path: '.env.local' });

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

console.log('🔍 Testing DynamoDB Connection...\n');
console.log('Environment Variables:');
console.log('  AWS_REGION:', process.env.AWS_REGION);
console.log('  AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Set' : '❌ Not Set');
console.log('  AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not Set');
console.log('  DYNAMODB_TABLE_SHOPKEEPERS:', process.env.DYNAMODB_TABLE_SHOPKEEPERS);
console.log('');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

async function testDynamoDB() {
  const testShopkeeperId = 'test-' + Date.now();
  const testItem = {
    PK: `SHOPKEEPER#${testShopkeeperId}`,
    SK: 'METADATA',
    Name: 'Test Shopkeeper',
    PhoneNumber: '+919999999999',
    StoreAddress: 'Test Store Address',
    PreferredLanguage: 'en',
    Timezone: 'Asia/Kolkata',
    WalletBalance: 0,
    RegistrationDate: new Date().toISOString(),
    LastActiveDate: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  };

  console.log('📝 Attempting to write test item...');
  console.log('Item:', JSON.stringify(testItem, null, 2));
  console.log('');

  try {
    // Write test item
    await docClient.send(new PutCommand({
      TableName: process.env.DYNAMODB_TABLE_SHOPKEEPERS,
      Item: testItem,
    }));
    console.log('✅ Write successful!');
    console.log('');

    // Read it back
    console.log('📖 Reading back the item...');
    const result = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_SHOPKEEPERS,
      Key: {
        PK: `SHOPKEEPER#${testShopkeeperId}`,
        SK: 'METADATA',
      },
    }));

    if (result.Item) {
      console.log('✅ Read successful!');
      console.log('Retrieved item:', JSON.stringify(result.Item, null, 2));
      console.log('');
      console.log('🎉 DynamoDB is working correctly!');
    } else {
      console.log('❌ Item not found after write');
    }
  } catch (error) {
    console.error('❌ DynamoDB operation failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('');
    console.error('Full error:', error);
    
    if (error.name === 'ResourceNotFoundException') {
      console.error('\n⚠️  Table not found! Check your table name in .env.local');
    } else if (error.name === 'UnrecognizedClientException') {
      console.error('\n⚠️  Invalid AWS credentials! Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY');
    } else if (error.name === 'AccessDeniedException') {
      console.error('\n⚠️  Permission denied! Your IAM user needs dynamodb:PutItem permission');
    }
  }
}

testDynamoDB();
