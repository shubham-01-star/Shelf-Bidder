const { Client } = require('pg');

async function createTestCampaign() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'shelfbidder',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create a test campaign with Gurugram, Gurgaon, and Delhi NCR
    const result = await client.query(
      `INSERT INTO campaigns (
        agent_id, brand_name, product_name, product_category,
        budget, remaining_budget, payout_per_task,
        target_locations, target_radius_km,
        placement_requirements, product_dimensions,
        start_date, end_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, brand_name, product_name, target_locations`,
      [
        'agent-test-001',
        'Test Brand',
        'Test Product',
        'beverages',
        100000,
        100000,
        250,
        ['Gurugram', 'Gurgaon', 'Delhi NCR'],
        10.0,
        JSON.stringify({ type: 'position', description: 'Eye level', required: true }),
        JSON.stringify({ width: 10, height: 20, depth: 10, unit: 'cm' }),
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        'active'
      ]
    );

    console.log('✅ Test campaign created:');
    console.log('   ID:', result.rows[0].id);
    console.log('   Brand:', result.rows[0].brand_name);
    console.log('   Product:', result.rows[0].product_name);
    console.log('   Locations:', result.rows[0].target_locations);

    // Verify the campaign exists
    const verify = await client.query(
      `SELECT id, brand_name, product_name, target_locations, status, remaining_budget
       FROM campaigns
       WHERE status = 'active' AND remaining_budget > 0
       ORDER BY created_at DESC
       LIMIT 5`
    );

    console.log('\n📊 Active campaigns in database:');
    verify.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.brand_name} - ${row.product_name}`);
      console.log(`      Locations: ${row.target_locations.join(', ')}`);
      console.log(`      Budget: ₹${row.remaining_budget}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

createTestCampaign().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});
