/**
 * Check if DynamoDB entry exists for the shopkeeper
 */

require('dotenv').config({ path: '.env.local' });

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const shopkeeperId = '144814a8-1091-7092-8e7c-c9233377efc7'; // From latest signin

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function checkEntry() {
  console.log('🔍 Checking DynamoDB for shopkeeper entry...\n');
  console.log('Shopkeeper ID:', shopkeeperId);
  console.log('Table:', process.env.DYNAMODB_TABLE_SHOPKEEPERS);
  console.log('');

  try {
    // Try to get with expected key format
    console.log('1️⃣ Trying GetCommand with PK=SHOPKEEPER#<id>, SK=METADATA...');
    const getResult = await docClient.send(new GetCommand({
      TableName: process.env.DYNAMODB_TABLE_SHOPKEEPERS,
      Key: {
        PK: `SHOPKEEPER#${shopkeeperId}`,
        SK: 'METADATA',
      },
    }));

    if (getResult.Item) {
      console.log('✅ Found entry with GetCommand!');
      console.log('Entry:', JSON.stringify(getResult.Item, null, 2));
      return;
    } else {
      console.log('❌ Not found with GetCommand');
      console.log('');
    }

    // Scan to see what's actually in the table
    console.log('2️⃣ Scanning table to see all entries...');
    const scanResult = await docClient.send(new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_SHOPKEEPERS,
      Limit: 10,
    }));

    console.log(`Found ${scanResult.Items?.length || 0} items in table:`);
    console.log('');

    if (scanResult.Items && scanResult.Items.length > 0) {
      scanResult.Items.forEach((item, index) => {
        console.log(`Item ${index + 1}:`);
        console.log('  PK:', item.PK);
        console.log('  SK:', item.SK);
        console.log('  Name:', item.Name);
        console.log('  PhoneNumber:', item.PhoneNumber);
        console.log('');
      });

      // Check if any item matches our shopkeeper ID
      const matchingItem = scanResult.Items.find(item => 
        item.PK && item.PK.includes(shopkeeperId)
      );

      if (matchingItem) {
        console.log('✅ Found matching entry!');
        console.log('Full entry:', JSON.stringify(matchingItem, null, 2));
      } else {
        console.log('❌ No entry found for shopkeeper ID:', shopkeeperId);
        console.log('');
        console.log('🔍 Possible issues:');
        console.log('1. Entry was not created during verify');
        console.log('2. Entry was created with different ID');
        console.log('3. Check server console for [DynamoDB Create] logs');
      }
    } else {
      console.log('⚠️  Table is empty!');
      console.log('');
      console.log('This means ShopkeeperOperations.create was never called');
      console.log('or it failed silently during verify.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

checkEntry();
