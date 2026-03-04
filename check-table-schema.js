const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config({ path: '.env.local' });

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function checkTableSchema() {
  const tableName = process.env.DYNAMODB_TABLE_SHOPKEEPERS;
  
  console.log('🔍 Checking table schema for:', tableName);
  console.log('');
  
  try {
    const command = new DescribeTableCommand({
      TableName: tableName,
    });
    
    const response = await client.send(command);
    const table = response.Table;
    
    console.log('📋 Table Name:', table.TableName);
    console.log('');
    console.log('🔑 Key Schema:');
    table.KeySchema.forEach(key => {
      console.log(`  - ${key.AttributeName} (${key.KeyType})`);
    });
    console.log('');
    console.log('📊 Attribute Definitions:');
    table.AttributeDefinitions.forEach(attr => {
      console.log(`  - ${attr.AttributeName}: ${attr.AttributeType}`);
    });
    console.log('');
    
    if (table.GlobalSecondaryIndexes) {
      console.log('🌐 Global Secondary Indexes:');
      table.GlobalSecondaryIndexes.forEach(gsi => {
        console.log(`  ${gsi.IndexName}:`);
        gsi.KeySchema.forEach(key => {
          console.log(`    - ${key.AttributeName} (${key.KeyType})`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

checkTableSchema();
