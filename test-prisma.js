require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

try {
  const { PrismaClient } = require('@prisma/client');
  console.log('Successfully required PrismaClient');
  
  const prisma = new PrismaClient();
  console.log('Successfully instantiated PrismaClient');
  
  prisma.$connect()
    .then(() => {
      console.log('✅ Connected to database successfully!');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Failed to connect:', err);
      process.exit(1);
    });
} catch (e) {
  console.error('❌ Failed to require/instantiate PrismaClient:', e);
}
