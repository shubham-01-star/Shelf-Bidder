// Quick script to check DynamoDB table schema
const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ 
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function checkSchema() {
  try {
    const command = new DescribeTableCommand({
      TableName: 'ShelfBidderStack-ShopkeepersTable57A680B4-1ZJ9UQFQ0SKC'
    });
    
    const result = await client.send(command);
    console.log('\n=== TABLE SCHEMA ===');
    console.log('Table Name:', result.Table.TableName);
    console.log('\nKey Schema:');
    result.Table.KeySchema.forEach(key => {
      console.log(`  ${key.KeyType}: ${key.AttributeName}`);
    });
    
    console.log('\nAttribute Definitions:');
    result.Table.AttributeDefinitions.forEach(attr => {
      console.log(`  ${attr.AttributeName}: ${attr.AttributeType}`);
    });
    
    console.log('\n===================\n');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();
