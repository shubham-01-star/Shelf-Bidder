afterAll(async () => {
  try {
    const { closePool } = require('./src/lib/db/postgres/client');
    await closePool();
  } catch (_) {
    // Ignore teardown failures in tests that never touched PostgreSQL.
  }

  try {
    const prisma = require('./src/lib/prisma').default;
    if (prisma?.$disconnect) {
      await prisma.$disconnect();
    }
  } catch (_) {
    // Ignore teardown failures in tests that never touched Prisma.
  }
});
