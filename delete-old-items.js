// Delete old shopkeeper items from DynamoDB
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ 
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);

async function deleteAllItems() {
  try {
    console.log('\n=== SCANNING TABLE ===');
    
    // Scan to get all items
    const scanCommand = new ScanCommand({
      TableName: 'ShelfBidderStack-ShopkeepersTable57A680B4-1ZJ9UQFQ0SKC'
    });
    
    const scanResult = await docClient.send(scanCommand);
    console.log(`Found ${scanResult.Items?.length || 0} items`);
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('No items to delete');
      return;
    }
    
    // Delete each item
    for (const item of scanResult.Items) {
      console.log(`\nDeleting item: PK=${item.PK}, SK=${item.SK}`);
      
      const deleteCommand = new DeleteCommand({
        TableName: 'ShelfBidderStack-ShopkeepersTable57A680B4-1ZJ9UQFQ0SKC',
        Key: {
          PK: item.PK,
          SK: item.SK
        }
      });
      
      await docClient.send(deleteCommand);
      console.log('✅ Deleted');
    }
    
    console.log('\n=== ALL ITEMS DELETED ===\n');
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

deleteAllItems();
