/**
 * Migration Script: DynamoDB to PostgreSQL
 * Migrates existing shopkeeper data from DynamoDB to PostgreSQL
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// DynamoDB Configuration
const dynamoClient = new DynamoDBClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// PostgreSQL Configuration
const pgClient = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'shelfbidder',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Table names
const DYNAMODB_SHOPKEEPERS_TABLE = process.env.DYNAMODB_TABLE_SHOPKEEPERS || 
  process.env.DYNAMODB_SHOPKEEPERS_TABLE || 
  'ShelfBidderStack-ShopkeepersTable57A680B4-1ZJ9UQFQ0SKC';

/**
 * Fetch all shopkeepers from DynamoDB
 */
async function fetchShopkeepersFromDynamoDB() {
  console.log('📥 Fetching shopkeepers from DynamoDB...');
  console.log('   Table:', DYNAMODB_SHOPKEEPERS_TABLE);
  
  const shopkeepers = [];
  let lastEvaluatedKey = undefined;
  
  try {
    do {
      const command = new ScanCommand({
        TableName: DYNAMODB_SHOPKEEPERS_TABLE,
        ExclusiveStartKey: lastEvaluatedKey,
      });
      
      const response = await docClient.send(command);
      
      if (response.Items) {
        shopkeepers.push(...response.Items);
      }
      
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    
    console.log(`✅ Fetched ${shopkeepers.length} shopkeepers from DynamoDB`);
    return shopkeepers;
  } catch (error) {
    console.error('❌ Error fetching from DynamoDB:', error);
    throw error;
  }
}

/**
 * Transform DynamoDB item to PostgreSQL format
 */
function transformShopkeeper(dynamoItem) {
  return {
    shopkeeper_id: dynamoItem.shopkeeperId || dynamoItem.ShopkeeperId || dynamoItem.PK?.replace('SHOPKEEPER#', ''),
    name: dynamoItem.Name || dynamoItem.name || 'Unknown',
    phone_number: dynamoItem.PhoneNumber || dynamoItem.phoneNumber || dynamoItem.phone_number || '',
    email: dynamoItem.Email || dynamoItem.email || `${dynamoItem.shopkeeperId || 'unknown'}@temp.com`,
    store_address: dynamoItem.StoreAddress || dynamoItem.storeAddress || dynamoItem.store_address || 'Not provided',
    preferred_language: dynamoItem.PreferredLanguage || dynamoItem.preferredLanguage || 'en',
    timezone: dynamoItem.Timezone || dynamoItem.timezone || 'UTC',
    wallet_balance: parseFloat(dynamoItem.WalletBalance || dynamoItem.walletBalance || 0),
    registration_date: dynamoItem.RegistrationDate || dynamoItem.registrationDate || dynamoItem.CreatedAt || new Date().toISOString(),
    last_active_date: dynamoItem.LastActiveDate || dynamoItem.lastActiveDate || dynamoItem.UpdatedAt || new Date().toISOString(),
  };
}

/**
 * Insert shopkeepers into PostgreSQL
 */
async function insertShopkeepersToPostgreSQL(shopkeepers) {
  console.log('📤 Inserting shopkeepers into PostgreSQL...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const dynamoItem of shopkeepers) {
    try {
      const shopkeeper = transformShopkeeper(dynamoItem);
      
      // Check if shopkeeper already exists
      const checkQuery = 'SELECT id FROM shopkeepers WHERE shopkeeper_id = $1';
      const checkResult = await pgClient.query(checkQuery, [shopkeeper.shopkeeper_id]);
      
      if (checkResult.rows.length > 0) {
        console.log(`⏭️  Skipping existing shopkeeper: ${shopkeeper.shopkeeper_id}`);
        continue;
      }
      
      // Insert new shopkeeper
      const insertQuery = `
        INSERT INTO shopkeepers (
          shopkeeper_id, name, phone_number, email, store_address,
          preferred_language, timezone, wallet_balance,
          registration_date, last_active_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, shopkeeper_id, name
      `;
      
      const values = [
        shopkeeper.shopkeeper_id,
        shopkeeper.name,
        shopkeeper.phone_number,
        shopkeeper.email,
        shopkeeper.store_address,
        shopkeeper.preferred_language,
        shopkeeper.timezone,
        shopkeeper.wallet_balance,
        shopkeeper.registration_date,
        shopkeeper.last_active_date,
      ];
      
      const result = await pgClient.query(insertQuery, values);
      console.log(`✅ Inserted: ${result.rows[0].name} (${result.rows[0].shopkeeper_id})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error inserting shopkeeper:`, error.message);
      console.error('   Item:', JSON.stringify(dynamoItem, null, 2));
      errorCount++;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📝 Total: ${shopkeepers.length}`);
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting DynamoDB to PostgreSQL migration...\n');
  
  try {
    // Connect to PostgreSQL
    console.log('🔌 Connecting to PostgreSQL...');
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL\n');
    
    // Fetch data from DynamoDB
    const shopkeepers = await fetchShopkeepersFromDynamoDB();
    
    if (shopkeepers.length === 0) {
      console.log('⚠️  No shopkeepers found in DynamoDB');
      return;
    }
    
    console.log('\n📋 Sample shopkeeper data:');
    console.log(JSON.stringify(shopkeepers[0], null, 2));
    console.log('');
    
    // Insert into PostgreSQL
    await insertShopkeepersToPostgreSQL(shopkeepers);
    
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pgClient.end();
    console.log('🔌 PostgreSQL connection closed');
  }
}

// Run migration
migrate();
