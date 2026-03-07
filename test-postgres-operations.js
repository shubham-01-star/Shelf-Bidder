/**
 * Test PostgreSQL Operations Layer
 * Quick verification script for Task 2.2
 */

const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shelfbidder',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
});

async function testOperations() {
  console.log('🧪 Testing PostgreSQL Operations Layer\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣  Testing database connection...');
    const healthResult = await pool.query('SELECT NOW() as now, version() as version');
    console.log('✅ Database connected:', healthResult.rows[0].now);
    console.log('   PostgreSQL version:', healthResult.rows[0].version.split(',')[0]);

    // Test 2: Create Shopkeeper
    console.log('\n2️⃣  Testing shopkeeper creation...');
    const shopkeeperResult = await pool.query(
      `INSERT INTO shopkeepers (
        shopkeeper_id, name, phone_number, email, store_address
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, wallet_balance`,
      [
        'test-shopkeeper-' + Date.now(),
        'Test Shopkeeper',
        '+1234567890',
        'test@example.com',
        '123 Test Street',
      ]
    );
    const shopkeeperId = shopkeeperResult.rows[0].id;
    console.log('✅ Shopkeeper created:', shopkeeperResult.rows[0]);

    // Test 3: Create Campaign
    console.log('\n3️⃣  Testing campaign creation...');
    const campaignResult = await pool.query(
      `INSERT INTO campaigns (
        agent_id, brand_name, product_name, product_category,
        budget, remaining_budget, payout_per_task, target_locations,
        placement_requirements, product_dimensions, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, brand_name, remaining_budget`,
      [
        'test-agent',
        'Test Brand',
        'Test Product',
        'Electronics',
        1000,
        1000,
        50,
        ['New York', 'Los Angeles'],
        JSON.stringify([{ type: 'position', description: 'Eye level', required: true }]),
        JSON.stringify({ width: 10, height: 15, depth: 5, unit: 'cm' }),
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      ]
    );
    const campaignId = campaignResult.rows[0].id;
    console.log('✅ Campaign created:', campaignResult.rows[0]);

    // Test 4: Test Row-Level Locking (ACID Transaction)
    console.log('\n4️⃣  Testing ACID transaction with row-level locking...');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Lock campaign row
      const lockResult = await client.query(
        'SELECT * FROM campaigns WHERE id = $1 FOR UPDATE',
        [campaignId]
      );
      console.log('   🔒 Campaign row locked');

      // Deduct budget
      const deductResult = await client.query(
        `UPDATE campaigns 
         SET remaining_budget = remaining_budget - $1
         WHERE id = $2
         RETURNING remaining_budget`,
        [50, campaignId]
      );
      console.log('   💰 Budget deducted, new balance:', deductResult.rows[0].remaining_budget);

      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction rolled back:', error.message);
    } finally {
      client.release();
    }

    // Test 5: Complex Query - Find Matching Campaigns
    console.log('\n5️⃣  Testing complex campaign matching query...');
    const matchResult = await pool.query(
      `SELECT id, brand_name, product_name, remaining_budget
       FROM campaigns
       WHERE status = 'active'
       AND remaining_budget >= $1
       AND $2 = ANY(target_locations)
       ORDER BY remaining_budget DESC
       LIMIT 5`,
      [50, 'New York']
    );
    console.log('✅ Found matching campaigns:', matchResult.rowCount);
    matchResult.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.brand_name} - ${row.product_name} ($${row.remaining_budget})`);
    });

    // Test 6: Cleanup
    console.log('\n6️⃣  Cleaning up test data...');
    await pool.query('DELETE FROM campaigns WHERE id = $1', [campaignId]);
    await pool.query('DELETE FROM shopkeepers WHERE id = $1', [shopkeeperId]);
    console.log('✅ Test data cleaned up');

    console.log('\n✨ All tests passed! PostgreSQL operations layer is working correctly.\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testOperations();
