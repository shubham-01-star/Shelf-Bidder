const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const connectionString = 'postgresql://postgres:postgres@localhost:5432/shelfbidder';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

async function testQuery() {
  try {
    console.log('🔍 Testing Prisma campaign query...\n');

    const campaigns = await prisma.campaigns.findMany({
      where: {
        status: 'active',
        remaining_budget: {
          gte: 0,
        },
        start_date: {
          lte: new Date(),
        },
        end_date: {
          gte: new Date(),
        },
      },
      orderBy: {
        payout_per_task: 'desc',
      },
    });

    console.log(`📊 Found ${campaigns.length} active campaigns:\n`);

    campaigns.forEach((c, i) => {
      console.log(`${i + 1}. ${c.brand_name} - ${c.product_name}`);
      console.log(`   ID: ${c.id}`);
      console.log(`   Locations: ${JSON.stringify(c.target_locations)}`);
      console.log(`   Budget: ₹${c.remaining_budget}`);
      console.log(`   Payout: ₹${c.payout_per_task}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Start: ${c.start_date}`);
      console.log(`   End: ${c.end_date}`);
      console.log('');
    });

    // Test location matching
    const location = 'Gurugram';
    const normalizedLocation = location.toLowerCase();
    
    console.log(`\n🎯 Testing location matching for: "${location}"\n`);

    campaigns.forEach((c) => {
      const matches = c.target_locations.some(loc => {
        const normalizedLoc = loc.toLowerCase();
        const match = normalizedLoc.includes(normalizedLocation) || normalizedLocation.includes(normalizedLoc);
        console.log(`   "${loc}" (${normalizedLoc}) vs "${location}" (${normalizedLocation}) = ${match}`);
        return match;
      });
      console.log(`   ${matches ? '✅' : '❌'} ${c.brand_name} - ${c.product_name}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();
