const { Client } = require('pg');

async function checkDashboard() {
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
      `SELECT id, shopkeeper_id, name, wallet_balance
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
    console.log('   Name:', sk.name);
    console.log('   Wallet Balance: ₹' + sk.wallet_balance);
    console.log('');

    // Get tasks
    const tasks = await client.query(
      `SELECT status, COUNT(*) as count
       FROM tasks
       WHERE shopkeeper_id = $1
       GROUP BY status`,
      [sk.id]
    );

    console.log('📋 Tasks by Status:');
    tasks.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

    const activeTasks = tasks.rows
      .filter(r => r.status === 'assigned' || r.status === 'in_progress')
      .reduce((sum, r) => sum + parseInt(r.count), 0);
    console.log(`   Active (assigned + in_progress): ${activeTasks}`);
    console.log('');

    // Get today's completed tasks
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedToday = await client.query(
      `SELECT COUNT(*) as count
       FROM tasks
       WHERE shopkeeper_id = $1
         AND status = 'completed'
         AND completed_date >= $2`,
      [sk.id, todayStart]
    );

    console.log('✅ Completed Today:', completedToday.rows[0].count);
    console.log('');

    // Get earnings
    const todayEarnings = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM wallet_transactions
       WHERE shopkeeper_id = $1
         AND type = 'earning'
         AND status = 'completed'
         AND transaction_date >= $2`,
      [sk.id, todayStart]
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyEarnings = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM wallet_transactions
       WHERE shopkeeper_id = $1
         AND type = 'earning'
         AND status = 'completed'
         AND transaction_date >= $2`,
      [sk.id, sevenDaysAgo]
    );

    console.log('💰 Earnings:');
    console.log('   Today: ₹' + todayEarnings.rows[0].total);
    console.log('   This Week: ₹' + weeklyEarnings.rows[0].total);
    console.log('');

    // Get active campaigns
    const campaigns = await client.query(
      `SELECT COUNT(*) as count
       FROM campaigns
       WHERE status = 'active'
         AND remaining_budget > 0
         AND start_date <= NOW()
         AND end_date >= NOW()`
    );

    console.log('🎯 Active Campaigns:', campaigns.rows[0].count);
    console.log('');

    console.log('📊 Dashboard Summary:');
    console.log('   Total Balance: ₹' + sk.wallet_balance);
    console.log('   Active Tasks: ' + activeTasks);
    console.log('   Completed Today: ' + completedToday.rows[0].count);
    console.log('   Today Earnings: ₹' + todayEarnings.rows[0].total);
    console.log('   Weekly Earnings: ₹' + weeklyEarnings.rows[0].total);
    console.log('   Pending Auctions: ' + campaigns.rows[0].count);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkDashboard().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});
