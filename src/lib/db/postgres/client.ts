/**
 * PostgreSQL Database Client
 * Connection pooling and query execution
 * Task 2.2: PostgreSQL operations layer with connection pooling
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// Database configuration from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shelfbidder',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_SIZE || '20'), // Maximum pool size
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // 30 seconds
  connectionTimeoutMillis: 10000, // 10 seconds
};

console.log('[PostgreSQL Client] 🔧 Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: !!dbConfig.ssl,
  maxConnections: dbConfig.max,
});

// Create connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool] ❌ Unexpected error:', err);
    });
    
    // Log pool events in development
    if (process.env.NODE_ENV === 'development') {
      pool.on('connect', () => {
        console.log('[PostgreSQL Pool] ✅ New client connected');
      });
      
      pool.on('acquire', () => {
        console.log('[PostgreSQL Pool] 🔒 Client acquired from pool');
      });
      
      pool.on('remove', () => {
        console.log('[PostgreSQL Pool] 🗑️  Client removed from pool');
      });
    }
    
    console.log('[PostgreSQL Pool] 🚀 Connection pool created');
  }
  
  return pool;
}

/**
 * Execute a query with automatic connection management
 */
export async function query<T extends Record<string, any> = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[PostgreSQL Query] ⚡', {
        query: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('[PostgreSQL Query] ❌ Error:', {
      query: text.substring(0, 100),
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Execute a transaction with automatic rollback on error
 * This ensures ACID compliance for financial operations
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    console.log('[PostgreSQL Transaction] 🔄 Transaction started');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    console.log('[PostgreSQL Transaction] ✅ Transaction committed');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[PostgreSQL Transaction] ⚠️  Transaction rolled back:', error);
    throw error;
  } finally {
    client.release();
    console.log('[PostgreSQL Transaction] 🔓 Client released');
  }
}

/**
 * Close the connection pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[PostgreSQL Pool] 🛑 Connection pool closed');
  }
}

/**
 * Health check - verify database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as now');
    console.log('[PostgreSQL Health] ✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('[PostgreSQL Health] ❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown on process termination
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    console.log('[PostgreSQL] 🛑 Received SIGINT, closing pool...');
    await closePool();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('[PostgreSQL] 🛑 Received SIGTERM, closing pool...');
    await closePool();
    process.exit(0);
  });
}
