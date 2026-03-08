const { Client } = require('pg');

async function checkCampaigns() {
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

    // Get all campaigns
    const all = await client.query(
      `SELECT id, brand_name, product_name, target_locations, status, 
              remaining_budget, start_date, end_date, created_at
       FROM campaigns
       ORDER BY created_at DESC`
    );

    console.log(`📊 Total campaigns in database: ${all.rows.length}\n`);

    all.rows.forEach((c, i) => {
      console.log(`${i + 1}. ${c.brand_name} - ${c.product_name}`);
      console.log(`   ID: ${c.id}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Budget: ₹${c.remaining_budget}`);
      console.log(`   Locations: ${c.target_locations.join(', ')}`);
      console.log(`   Start: ${c.start_date}`);
      console.log(`   End: ${c.end_date}`);
      console.log(`   Created: ${c.created_at}`);
      
      // Check if it meets Prisma query criteria
      const now = new Date();
      const isActive = c.status === 'active';
      const hasBudget = parseFloat(c.remaining_budget) >= 0;
      const hasStarted = new Date(c.start_date) <= now;
      const notEnded = new Date(c.end_date) >= now;
      const meetsAllCriteria = isActive && hasBudget && hasStarted && notEnded;
      
      console.log(`   Meets Prisma criteria: ${meetsAllCriteria ? '✅' : '❌'}`);
      if (!meetsAllCriteria) {
        console.log(`     - Active: ${isActive}`);
        console.log(`     - Has budget: ${hasBudget}`);
        console.log(`     - Has started: ${hasStarted}`);
        console.log(`     - Not ended: ${notEnded}`);
      }
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

checkCampaigns().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});
