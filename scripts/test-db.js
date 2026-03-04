const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config({ path: '.env.local' });

async function testDynamo() {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
  const docClient = DynamoDBDocumentClient.from(client);
  
  const tableName = process.env.DYNAMODB_SHOPKEEPERS_TABLE;
  console.log('Testing DynamoDB Table:', tableName);
  
  const shopkeeperId = '+919999999999';
  
  try {
    console.log('Putting item...');
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        PK: `SHOPKEEPER#${shopkeeperId}`,
        SK: 'METADATA',
        EntityType: 'SHOPKEEPER',
        ShopkeeperId: shopkeeperId,
        Name: 'Test',
        PhoneNumber: shopkeeperId,
        StoreAddress: '',
        PreferredLanguage: 'en',
        Timezone: 'Asia/Kolkata',
        WalletBalance: 0,
        RegistrationDate: new Date().toISOString(),
        LastActiveDate: new Date().toISOString(),
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      }
    }));
    console.log('Put successful!');
    
    console.log('Getting item...');
    const result = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: {
        PK: `SHOPKEEPER#${shopkeeperId}`,
        SK: 'METADATA'
      }
    }));
    console.log('Get successful! Item:', result.Item);
    
  } catch (err) {
    console.error('DynamoDB Error:', err);
  }
}

testDynamo().catch(console.error);
