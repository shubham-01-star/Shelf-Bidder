const { Client } = require('pg');

async function checkShopkeeper() {
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

    // Find shopkeeper with phone number 9856321478
    const result = await client.query(
      `SELECT id, shopkeeper_id, name, phone_number, store_address
       FROM shopkeepers
       WHERE phone_number = $1`,
      ['+919856321478']
    );

    if (result.rows.length === 0) {
      console.log('❌ No shopkeeper found with phone number +919856321478');
      return;
    }

    const shopkeeper = result.rows[0];
    console.log('\n📍 Shopkeeper Details:');
    console.log('   ID:', shopkeeper.id);
    console.log('   Shopkeeper ID:', shopkeeper.shopkeeper_id);
    console.log('   Name:', shopkeeper.name);
    console.log('   Phone:', shopkeeper.phone_number);
    console.log('   Store Address:', shopkeeper.store_address);

    // Extract city from address
    const extractCity = (address) => {
      if (!address) return 'Unknown';
      const parts = address.split(',').map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length === 0) return 'Unknown';
      const lastPart = parts[parts.length - 1];
      if (/^\d{6}$/.test(lastPart) && parts.length > 1) {
        return parts[parts.length - 2];
      }
      return lastPart;
    };

    const city = extractCity(shopkeeper.store_address);
    console.log('   Extracted City:', city);

    // Check if campaigns match
    const campaigns = await client.query(
      `SELECT id, brand_name, product_name, target_locations
       FROM campaigns
       WHERE status = 'active' AND remaining_budget > 0`
    );

    console.log('\n🎯 Campaign Matching Analysis:');
    campaigns.rows.forEach((campaign) => {
      const matches = campaign.target_locations.some(loc => {
        const normalizedLoc = loc.toLowerCase();
        const normalizedCity = city.toLowerCase();
        return normalizedLoc.includes(normalizedCity) || normalizedCity.includes(normalizedLoc);
      });
      console.log(`   ${matches ? '✅' : '❌'} ${campaign.brand_name} - ${campaign.product_name}`);
      console.log(`      Locations: ${campaign.target_locations.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Database connection closed');
  }
}

checkShopkeeper().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});
