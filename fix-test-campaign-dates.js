const { Client } = require('pg');

async function fixDates() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'shelfbidder',
    user: 'postgres',
    password: 'postgres'
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Update test campaigns to have start_date in the past
    const result = await client.query(
      `UPDATE campaigns
       SET start_date = NOW() - INTERVAL '1 day'
       WHERE brand_name = 'Test Brand'
       RETURNING id, brand_name, product_name, start_date, end_date`
    );

    console.log(`✅ Updated ${result.rows.length} test campaigns:\n`);

    result.rows.forEach((c) => {
      console.log(`   ${c.brand_name} - ${c.product_name}`);
      console.log(`   Start: ${c.start_date}`);
      console.log(`   End: ${c.end_date}`);
      console.log('');
    });

    // Verify active campaigns now
    const verify = await client.query(
      `SELECT brand_name, product_name, target_locations, payout_per_task
       FROM campaigns
       WHERE status = 'active' 
         AND remaining_budget >= 0
         AND start_date <= NOW()
         AND end_date >= NOW()
       ORDER BY payout_per_task DESC`
    );

    console.log(`📊 Active campaigns that meet all criteria: ${verify.rows.length}\n`);

    verify.rows.forEach((c, i) => {
      console.log(`${i + 1}. ${c.brand_name} - ${c.product_name}`);
      console.log(`   Payout: ₹${c.payout_per_task}`);
      console.log(`   Locations: ${c.target_locations.join(', ')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('✅ Database connection closed');
  }
}

fixDates().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});
