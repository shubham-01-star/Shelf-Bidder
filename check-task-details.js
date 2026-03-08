const { Client } = require('pg');

async function checkTask() {
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

    // Get shopkeeper
    const shopkeeper = await client.query(
      `SELECT id, shopkeeper_id, name, store_address
       FROM shopkeepers
       WHERE phone_number = $1`,
      ['+919856321478']
    );

    if (shopkeeper.rows.length === 0) {
      console.log('❌ Shopkeeper not found');
      return;
    }

    const sk = shopkeeper.rows[0];
    console.log('📍 Shopkeeper:');
    console.log('   UUID:', sk.id);
    console.log('   Shopkeeper ID:', sk.shopkeeper_id);
    console.log('   Name:', sk.name);
    console.log('   Address:', sk.store_address);
    console.log('');

    // Get tasks for this shopkeeper
    const tasks = await client.query(
      `SELECT id, campaign_id, shelf_space_id, status, earnings, instructions, created_at
       FROM tasks
       WHERE shopkeeper_id = $1
       ORDER BY created_at DESC
       LIMIT 5`,
      [sk.id]
    );

    console.log(`📋 Tasks: ${tasks.rows.length}\n`);

    tasks.rows.forEach((task, i) => {
      console.log(`${i + 1}. Task ID: ${task.id}`);
      console.log(`   Status: ${task.status}`);
      console.log(`   Earnings: ₹${task.earnings}`);
      console.log(`   Campaign ID: ${task.campaign_id}`);
      console.log(`   Shelf Space ID: ${task.shelf_space_id || 'NULL ❌'}`);
      console.log(`   Instructions: ${JSON.stringify(task.instructions).substring(0, 100)}...`);
      console.log(`   Created: ${task.created_at}`);
      console.log('');
    });

    // Check shelf spaces
    const shelfSpaces = await client.query(
      `SELECT id, photo_url, analysis_date
       FROM shelf_spaces
       WHERE shopkeeper_id = $1
       ORDER BY analysis_date DESC
       LIMIT 5`,
      [sk.id]
    );

    console.log(`📸 Shelf Spaces: ${shelfSpaces.rows.length}\n`);

    shelfSpaces.rows.forEach((ss, i) => {
      console.log(`${i + 1}. Shelf Space ID: ${ss.id}`);
      console.log(`   Photo URL: ${ss.photo_url}`);
      console.log(`   Analysis Date: ${ss.analysis_date}`);
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

checkTask().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});
