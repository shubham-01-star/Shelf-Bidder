#!/usr/bin/env node
/**
 * PostgreSQL ACID Transaction Test
 * Task 1.2: Verify ACID compliance and transaction functionality
 * 
 * This script tests:
 * 1. Connection pooling
 * 2. ACID transaction with rollback
 * 3. Row-level locking
 * 4. Concurrent transaction handling
 */

const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shelfbidder',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
};

console.log('🧪 PostgreSQL ACID Transaction Test');
console.log('====================================\n');

async function testConnectionPool(pool) {
  console.log('1️⃣  Testing Connection Pool...');
  
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now');
    client.release();
    
    console.log('✅ Connection pool working');
    console.log(`   Pool stats: total=${pool.totalCount}, idle=${pool.idleCount}, waiting=${pool.waitingCount}\n`);
    return true;
  } catch (error) {
    console.error('❌ Connection pool failed:', error.message);
    return false;
  }
}

async function testTransactionCommit(pool) {
  console.log('2️⃣  Testing Transaction Commit...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create test shopkeeper
    const insertResult = await client.query(`
      INSERT INTO shopkeepers (
        shopkeeper_id, name, phone_number, email, store_address
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, shopkeeper_id, name
    `, ['test-001', 'Test Shopkeeper', '+911234567890', 'test@example.com', 'Test Address']);
    
    const shopkeeper = insertResult.rows[0];
    console.log(`   Created shopkeeper: ${shopkeeper.name} (${shopkeeper.shopkeeper_id})`);
    
    await client.query('COMMIT');
    console.log('✅ Transaction committed successfully\n');
    
    return shopkeeper.id;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction failed:', error.message);
    return null;
  } finally {
    client.release();
  }
}

async function testTransactionRollback(pool, shopkeeperId) {
  console.log('3️⃣  Testing Transaction Rollback...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Update wallet balance
    await client.query(`
      UPDATE shopkeepers
      SET wallet_balance = 100.00
      WHERE id = $1
    `, [shopkeeperId]);
    
    console.log('   Updated wallet balance to 100.00');
    
    // Simulate error - try to insert duplicate phone number
    await client.query(`
      INSERT INTO shopkeepers (
        shopkeeper_id, name, phone_number, email, store_address
      ) VALUES ($1, $2, $3, $4, $5)
    `, ['test-002', 'Test Shopkeeper 2', '+911234567890', 'test2@example.com', 'Test Address 2']);
    
    await client.query('COMMIT');
    console.log('❌ Should have failed due to duplicate phone number');
    return false;
  } catch (error) {
    await client.query('ROLLBACK');
    console.log('   Error occurred (expected):', error.message.split('\n')[0]);
    
    // Verify rollback - balance should still be 0
    const checkResult = await pool.query(`
      SELECT wallet_balance FROM shopkeepers WHERE id = $1
    `, [shopkeeperId]);
    
    const balance = parseFloat(checkResult.rows[0].wallet_balance);
    if (balance === 0) {
      console.log('✅ Transaction rolled back successfully (balance still 0.00)\n');
      return true;
    } else {
      console.log(`❌ Rollback failed (balance is ${balance})\n`);
      return false;
    }
  } finally {
    client.release();
  }
}

async function testRowLevelLocking(pool, shopkeeperId) {
  console.log('4️⃣  Testing Row-Level Locking...');
  
  const client1 = await pool.connect();
  const client2 = await pool.connect();
  
  try {
    // Client 1: Start transaction and lock row
    await client1.query('BEGIN');
    await client1.query(`
      SELECT * FROM shopkeepers WHERE id = $1 FOR UPDATE
    `, [shopkeeperId]);
    console.log('   Client 1: Locked shopkeeper row');
    
    // Client 2: Try to lock same row (should fail immediately with NOWAIT)
    let lockFailed = false;
    try {
      await client2.query('BEGIN');
      console.log('   Client 2: Attempting to lock same row...');
      
      await client2.query(`
        SELECT * FROM shopkeepers WHERE id = $1 FOR UPDATE NOWAIT
      `, [shopkeeperId]);
      
      await client2.query('COMMIT');
    } catch (error) {
      lockFailed = true;
      if (error.code === '55P03' || error.message.includes('could not obtain lock')) {
        console.log('   Client 2: Lock blocked (expected)');
        try {
          await client2.query('ROLLBACK');
        } catch (e) {
          // Ignore rollback errors
        }
      } else {
        throw error;
      }
    }
    
    // Release lock
    await client1.query('COMMIT');
    console.log('   Client 1: Released lock');
    
    if (lockFailed) {
      console.log('✅ Row-level locking working (Client 2 blocked as expected)\n');
      return true;
    } else {
      console.log('❌ Client 2 should have been blocked\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Row-level locking test failed:', error.message);
    await client1.query('ROLLBACK').catch(() => {});
    await client2.query('ROLLBACK').catch(() => {});
    return false;
  } finally {
    client1.release();
    client2.release();
  }
}

async function testConcurrentTransactions(pool, shopkeeperId) {
  console.log('5️⃣  Testing Concurrent Wallet Updates...');
  
  // Reset balance to 0
  await pool.query('UPDATE shopkeepers SET wallet_balance = 0 WHERE id = $1', [shopkeeperId]);
  
  // Simulate 10 concurrent earnings of 10.00 each
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push((async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        // Lock and read current balance
        const result = await client.query(`
          SELECT wallet_balance FROM shopkeepers WHERE id = $1 FOR UPDATE
        `, [shopkeeperId]);
        
        const currentBalance = parseFloat(result.rows[0].wallet_balance);
        const newBalance = currentBalance + 10.00;
        
        // Small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        
        // Update balance
        await client.query(`
          UPDATE shopkeepers SET wallet_balance = $1 WHERE id = $2
        `, [newBalance, shopkeeperId]);
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    })());
  }
  
  await Promise.all(promises);
  
  // Check final balance
  const finalResult = await pool.query(`
    SELECT wallet_balance FROM shopkeepers WHERE id = $1
  `, [shopkeeperId]);
  
  const finalBalance = parseFloat(finalResult.rows[0].wallet_balance);
  
  if (finalBalance === 100.00) {
    console.log(`✅ Concurrent transactions handled correctly (final balance: ${finalBalance})\n`);
    return true;
  } else {
    console.log(`❌ Concurrent transaction issue (expected 100.00, got ${finalBalance})\n`);
    return false;
  }
}

async function cleanup(pool, shopkeeperId) {
  console.log('🧹 Cleaning up test data...');
  
  try {
    await pool.query('DELETE FROM shopkeepers WHERE id = $1', [shopkeeperId]);
    console.log('✅ Test data cleaned up\n');
  } catch (error) {
    console.error('⚠️  Cleanup failed:', error.message);
  }
}

async function main() {
  const pool = new Pool(dbConfig);
  
  try {
    // Cleanup any existing test data
    await pool.query("DELETE FROM shopkeepers WHERE shopkeeper_id LIKE 'test-%'");
    
    const results = {
      connectionPool: false,
      transactionCommit: false,
      transactionRollback: false,
      rowLevelLocking: false,
      concurrentTransactions: false,
    };
    
    // Run tests
    results.connectionPool = await testConnectionPool(pool);
    
    if (results.connectionPool) {
      const shopkeeperId = await testTransactionCommit(pool);
      
      if (shopkeeperId) {
        results.transactionCommit = true;
        results.transactionRollback = await testTransactionRollback(pool, shopkeeperId);
        results.rowLevelLocking = await testRowLevelLocking(pool, shopkeeperId);
        results.concurrentTransactions = await testConcurrentTransactions(pool, shopkeeperId);
        
        await cleanup(pool, shopkeeperId);
      }
    }
    
    // Summary
    console.log('📊 Test Summary');
    console.log('===============');
    console.log(`Connection Pool:          ${results.connectionPool ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Transaction Commit:       ${results.transactionCommit ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Transaction Rollback:     ${results.transactionRollback ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Row-Level Locking:        ${results.rowLevelLocking ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Concurrent Transactions:  ${results.concurrentTransactions ? '✅ PASS' : '❌ FAIL'}`);
    
    const allPassed = Object.values(results).every(r => r === true);
    console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed'}\n`);
    
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
