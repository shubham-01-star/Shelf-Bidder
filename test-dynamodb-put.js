// Test DynamoDB put operation
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ 
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function testPut() {
  const now = new Date().toISOString();
  const item = {
    PK: 'SHOPKEEPER#54d83438-e051-70de-6b80-df6ab6dfc9c6',
    SK: 'METADATA',
    EntityType: 'SHOPKEEPER',
    ShopkeeperId: '54d83438-e051-70de-6b80-df6ab6dfc9c6',
    Name: 'Ramesh Kumar',
    PhoneNumber: '+919876543210',
    StoreAddress: '',
    PreferredLanguage: 'en',
    Timezone: 'Asia/Kolkata',
    WalletBalance: 0,
    RegistrationDate: now,
    LastActiveDate: now,
    CreatedAt: now,
    UpdatedAt: now,
  };

  try {
    console.log('\n=== PUTTING ITEM ===');
    console.log('Item:', JSON.stringify(item, null, 2));
    
    const command = new PutCommand({
      TableName: 'ShelfBidderStack-ShopkeepersTable57A680B4-1ZJ9UQFQ0SKC',
      Item: item,
    });
    
    await docClient.send(command);
    console.log('\n✅ SUCCESS! Item created in DynamoDB');
    console.log('===================\n');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Error name:', error.name);
    console.error('===================\n');
  }
}

testPut();
