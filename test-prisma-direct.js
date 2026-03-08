require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

require('ts-node').register({ transpileOnly: true });

try {
  const prisma = require('./src/lib/prisma').default;
  
  prisma.$connect()
    .then(() => {
      console.log('✅ Connected to database successfully via src/lib/prisma.ts!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Failed to connect:', err);
      process.exit(1);
    });
} catch (e) {
  console.error('❌ Failed to require/instantiate PrismaClient via lib:', e);
}
