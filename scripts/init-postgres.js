#!/usr/bin/env node
/**
 * PostgreSQL Database Initialization Script
 * Task 1.2: Initialize database schema and verify setup
 * 
 * This script:
 * 1. Verifies database connection
 * 2. Checks if schema is initialized
 * 3. Provides status report on tables and indexes
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shelfbidder',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_dev_password',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

console.log('🔧 PostgreSQL Initialization Script');
console.log('=====================================\n');
console.log('Configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user,
  ssl: !!dbConfig.ssl,
});
console.log('');

async function main() {
  const pool = new Pool(dbConfig);

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const result = await pool.query('SELECT NOW() as now, version() as version');
    console.log('✅ Connected successfully!');
    console.log(`   Time: ${result.rows[0].now}`);
    console.log(`   Version: ${result.rows[0].version.split(',')[0]}\n`);

    // Check if UUID extension exists
    console.log('🔍 Checking extensions...');
    const extResult = await pool.query(`
      SELECT extname FROM pg_extension WHERE extname = 'uuid-ossp'
    `);
    if (extResult.rows.length > 0) {
      console.log('✅ uuid-ossp extension installed\n');
    } else {
      console.log('⚠️  uuid-ossp extension not found\n');
    }

    // Check tables
    console.log('📊 Checking database schema...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found. Schema needs to be initialized.');
      console.log('\nTo initialize the schema, run:');
      console.log('  docker-compose up -d postgres');
      console.log('  (Schema will be auto-initialized from database/init/01-schema.sql)\n');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
      console.log('');

      // Check row counts
      console.log('📈 Table statistics:');
      for (const row of tablesResult.rows) {
        const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${row.table_name}`);
        console.log(`   ${row.table_name}: ${countResult.rows[0].count} rows`);
      }
      console.log('');

      // Check indexes
      console.log('🔍 Checking indexes...');
      const indexResult = await pool.query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `);
      console.log(`✅ Found ${indexResult.rows.length} indexes`);
      
      // Group by table
      const indexesByTable = {};
      indexResult.rows.forEach(row => {
        if (!indexesByTable[row.tablename]) {
          indexesByTable[row.tablename] = [];
        }
        indexesByTable[row.tablename].push(row.indexname);
      });

      Object.keys(indexesByTable).sort().forEach(table => {
        console.log(`   ${table}: ${indexesByTable[table].length} indexes`);
        indexesByTable[table].forEach(idx => {
          console.log(`     - ${idx}`);
        });
      });
      console.log('');

      // Check views
      console.log('👁️  Checking views...');
      const viewsResult = await pool.query(`
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      if (viewsResult.rows.length > 0) {
        console.log(`✅ Found ${viewsResult.rows.length} views:`);
        viewsResult.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
      } else {
        console.log('⚠️  No views found');
      }
      console.log('');

      // Check triggers
      console.log('⚡ Checking triggers...');
      const triggersResult = await pool.query(`
        SELECT
          event_object_table as table_name,
          trigger_name
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        ORDER BY event_object_table, trigger_name
      `);
      if (triggersResult.rows.length > 0) {
        console.log(`✅ Found ${triggersResult.rows.length} triggers:`);
        const triggersByTable = {};
        triggersResult.rows.forEach(row => {
          if (!triggersByTable[row.table_name]) {
            triggersByTable[row.table_name] = [];
          }
          triggersByTable[row.table_name].push(row.trigger_name);
        });
        Object.keys(triggersByTable).sort().forEach(table => {
          console.log(`   ${table}:`);
          triggersByTable[table].forEach(trigger => {
            console.log(`     - ${trigger}`);
          });
        });
      } else {
        console.log('⚠️  No triggers found');
      }
      console.log('');
    }

    console.log('✅ Database initialization check complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure PostgreSQL is running: docker-compose up -d postgres');
    console.error('2. Check environment variables in .env.docker or .env.local');
    console.error('3. Verify database credentials');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
