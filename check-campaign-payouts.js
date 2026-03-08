const { Client } = require('pg');

async function checkPayouts() {
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

    const result = await client.query(
      `SELECT id, brand_name, product_name, payout_per_task, target_locations, status
       FROM campaigns
       WHERE status = 'active' AND remaining_budget >= 0
       ORDER BY payout_per_task DESC`
    );

    console.log(`📊 Active campaigns ordered by payout:\n`);

    result.rows.forEach((c, i) => {
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
  }
}

checkPayouts().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});
