#!/usr/bin/env node

const { Client } = require('pg');

const timeoutMs = parseInt(process.env.DB_WAIT_TIMEOUT_MS || '60000', 10);
const intervalMs = parseInt(process.env.DB_WAIT_INTERVAL_MS || '2000', 10);

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'shelfbidder',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function canConnect() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    return true;
  } catch (error) {
    try {
      await client.end();
    } catch (_) {
      // Ignore cleanup failures while polling.
    }
    return false;
  }
}

async function main() {
  const startedAt = Date.now();

  console.log('⏳ Waiting for PostgreSQL...');
  console.log(`   host=${dbConfig.host} port=${dbConfig.port} db=${dbConfig.database}`);

  while (Date.now() - startedAt < timeoutMs) {
    if (await canConnect()) {
      console.log('✅ PostgreSQL is ready');
      return;
    }

    await sleep(intervalMs);
  }

  console.error(`❌ PostgreSQL did not become ready within ${timeoutMs}ms`);
  process.exit(1);
}

main().catch((error) => {
  console.error('❌ Failed while waiting for PostgreSQL:', error.message);
  process.exit(1);
});
