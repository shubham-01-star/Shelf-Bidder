const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const shopkeeperId = '144814a8-1091-7092-8e7c-c9233377efc7';
const tableName = process.env.DYNAMODB_TABLE_SHOPKEEPERS;

async function testDirectRead() {
  console.log('🔍 Testing direct read from DynamoDB');
  console.log('📍 Table:', tableName);
  console.log('👤 Shopkeeper ID:', shopkeeperId);
  console.log('');
  
  // First, let's try to write a test item
  console.log('📝 Step 1: Writing test item...');
  const putCommand = new PutCommand({
    TableName: tableName,
    Item: {
      PK: `SHOPKEEPER#${shopkeeperId}`,
      SK: 'METADATA',
      EntityType: 'SHOPKEEPER',
      shopkeeperId: shopkeeperId,
      Name: 'Test User',
      PhoneNumber: '+919876543210',
      StoreAddress: 'Test Store',
      PreferredLanguage: 'en',
      Timezone: 'Asia/Kolkata',
      WalletBalance: 0,
      RegistrationDate: new Date().toISOString(),
      LastActiveDate: new Date().toISOString(),
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    },
  });
  
  try {
    await docClient.send(putCommand);
    console.log('✅ Successfully wrote item');
  } catch (error) {
    console.error('❌ Error writing:', error.message);
    return;
  }
  
  console.log('');
  console.log('📖 Step 2: Reading item back...');
  
  const getCommand = new GetCommand({
    TableName: tableName,
    Key: {
      PK: `SHOPKEEPER#${shopkeeperId}`,
      SK: 'METADATA',
    },
  });
  
  try {
    const result = await docClient.send(getCommand);
    console.log('✅ Successfully read item');
    console.log('📦 Item:', JSON.stringify(result.Item, null, 2));
  } catch (error) {
    console.error('❌ Error reading:', error.message);
    console.error('Full error:', error);
  }
}

testDirectRead();
