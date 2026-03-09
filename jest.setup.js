require('dotenv').config({ path: '.env.local' });

process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_URL) {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const database = process.env.DB_NAME || 'shelfbidder';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres_dev_password';

  process.env.DATABASE_URL = `postgresql://${user}:${password}@${host}:${port}/${database}`;
}
