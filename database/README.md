# PostgreSQL Database Infrastructure

This directory contains the PostgreSQL database schema and initialization scripts for the Shelf-Bidder system.

## Overview

The Shelf-Bidder system uses PostgreSQL as its primary database with the following features:

- **ACID Compliance**: All financial transactions use ACID-compliant operations
- **Connection Pooling**: Efficient connection management with configurable pool size
- **Row-Level Locking**: Prevents race conditions in concurrent operations
- **Automatic Indexing**: Optimized indexes for campaign matching and wallet queries
- **Triggers**: Automatic timestamp updates on row changes

## Database Schema

### Tables

1. **shopkeepers** - Store owner profiles and wallet balances
2. **shelf_spaces** - Shelf analysis results from Bedrock vision AI
3. **campaigns** - Brand campaigns with budget allocation
4. **tasks** - Product placement tasks assigned to shopkeepers
5. **wallet_transactions** - Financial transaction audit trail

### Views

1. **active_campaigns** - Active campaigns with remaining budget and statistics
2. **shopkeeper_dashboard** - Shopkeeper summary with earnings and task counts

### Key Features

- **UUID Primary Keys**: All tables use UUID for distributed system compatibility
- **JSONB Columns**: Flexible storage for complex data (empty_spaces, placement_requirements)
- **Geographic Support**: PostGIS POINT type for location-based campaign matching
- **Referential Integrity**: Foreign key constraints with CASCADE options
- **Check Constraints**: Data validation at database level

## Setup

### Local Development (Docker)

1. Copy local env values:
   ```bash
   cp .env.example .env.local
   ```

2. Start PostgreSQL, generate Prisma client, and wait for readiness:
   ```bash
   npm run db:setup
   ```

3. Verify database initialization:
   ```bash
   npm run db:status
   ```

4. Run ACID transaction test:
   ```bash
   npm run db:test
   ```

5. Connect to database:
   ```bash
   npm run db:connect
   ```

For one-command setup plus verification:

```bash
npm run test:db
```

### Production (AWS RDS)

Update `.env.local` with RDS endpoint:

```env
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=shelfbidder
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_SSL=true
```

## Schema Initialization

The schema is automatically initialized when the Docker container starts using the files in `database/init/`:

1. **01-schema.sql** - Creates tables, indexes, triggers, and views
2. **02-migrate-shopkeepers.sql** - Optional migration from DynamoDB

To manually run the schema:

```bash
docker exec -i shelfbidder-postgres psql -U postgres -d shelfbidder < database/init/01-schema.sql
```

## Connection Pooling

The system uses `pg` connection pooling with the following configuration:

```typescript
{
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // 30 seconds idle timeout
  connectionTimeoutMillis: 10000  // 10 seconds connection timeout
}
```

Configure via environment variables:
- `DB_POOL_SIZE` - Maximum number of connections (default: 20)
- `DB_IDLE_TIMEOUT` - Idle connection timeout in ms (default: 30000)

## ACID Transactions

All financial operations use ACID transactions with row-level locking:

### Example: Campaign Budget Deduction

```typescript
await transaction(async (client) => {
  // Lock campaign row
  const campaign = await client.query(
    'SELECT * FROM campaigns WHERE id = $1 FOR UPDATE',
    [campaignId]
  );
  
  // Deduct budget
  await client.query(
    'UPDATE campaigns SET remaining_budget = remaining_budget - $1 WHERE id = $2',
    [amount, campaignId]
  );
  
  // Create task
  await client.query(
    'INSERT INTO tasks (...) VALUES (...)',
    [...]
  );
  
  // Transaction commits automatically or rolls back on error
});
```

### Example: Wallet Transaction

```typescript
await WalletTransactionOperations.create({
  shopkeeper_id: 'uuid',
  task_id: 'uuid',
  type: 'earning',
  amount: 50.00,
  description: 'Task completion payment'
});
// Atomically creates transaction record AND updates shopkeeper balance
```

## Indexing Strategy

### Performance-Critical Indexes

1. **Campaign Matching**:
   - `idx_campaigns_status` - Filter active campaigns
   - `idx_campaigns_budget` - Find campaigns with available budget
   - `idx_campaigns_location` - GIN index for location array matching

2. **Wallet Queries**:
   - `idx_wallet_transactions_shopkeeper` - Fast shopkeeper transaction lookup
   - `idx_wallet_transactions_date` - Date-range queries for earnings

3. **Task Management**:
   - `idx_tasks_shopkeeper` - Shopkeeper's task list
   - `idx_tasks_status` - Filter by task status
   - `idx_tasks_assigned_date` - Chronological ordering

### Index Monitoring

Check index usage:

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## Database Operations

### TypeScript API

All database operations are available through type-safe operations:

```typescript
import {
  ShopkeeperOperations,
  CampaignOperations,
  TaskOperations,
  ShelfSpaceOperations,
  WalletTransactionOperations,
} from '@/lib/db/postgres';

// Create shopkeeper
const shopkeeper = await ShopkeeperOperations.create({
  shopkeeper_id: 'cognito-uuid',
  name: 'Ramesh Kumar',
  phone_number: '+919876543210',
  email: 'ramesh@example.com',
  store_address: 'Shop 123, Main Market, Delhi',
});

// Find matching campaigns
const campaigns = await CampaignOperations.findMatchingCampaigns(
  'Delhi',
  50.00,
  { limit: 10 }
);

// Create task with budget deduction (ACID transaction)
const campaign = await CampaignOperations.deductBudget(campaignId, 50.00);
const task = await TaskOperations.create({
  campaign_id: campaignId,
  shopkeeper_id: shopkeeperId,
  shelf_space_id: shelfSpaceId,
  instructions: {...},
  earnings: 50.00,
});

// Credit earnings (ACID transaction)
const transaction = await WalletTransactionOperations.createEarning(
  shopkeeperId,
  taskId,
  50.00,
  'Task completion payment'
);
```

## Maintenance

### Backup

```bash
# Backup database
docker exec shelfbidder-postgres pg_dump -U postgres shelfbidder > backup.sql

# Restore database
docker exec -i shelfbidder-postgres psql -U postgres shelfbidder < backup.sql
```

### Cleanup Old Data

```typescript
// Delete shelf spaces older than 90 days
await ShelfSpaceOperations.deleteOlderThan(90);
```

### Monitor Connection Pool

```typescript
import { getPool } from '@/lib/db/postgres';

const pool = getPool();
console.log('Total connections:', pool.totalCount);
console.log('Idle connections:', pool.idleCount);
console.log('Waiting requests:', pool.waitingCount);
```

## Troubleshooting

### Connection Issues

1. Check if PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Verify environment variables:
   ```bash
   echo $DB_HOST $DB_PORT $DB_NAME
   ```

3. Test connection:
   ```bash
   npm run db:status
   ```

### Performance Issues

1. Check slow queries:
   ```sql
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

2. Analyze table statistics:
   ```sql
   ANALYZE shopkeepers;
   ANALYZE campaigns;
   ANALYZE tasks;
   ```

3. Check index usage (see Index Monitoring section above)

### Transaction Deadlocks

If you encounter deadlocks, check:

```sql
SELECT * FROM pg_stat_activity
WHERE state = 'active';
```

The system uses row-level locking with `FOR UPDATE` to prevent most deadlocks.

## Migration from DynamoDB

If migrating from DynamoDB, use the migration script:

```bash
npm run migrate:dynamodb
```

This will:
1. Read data from DynamoDB tables
2. Transform to PostgreSQL format
3. Insert into PostgreSQL with proper relationships

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg) Documentation](https://node-postgres.com/)
- [ACID Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)
- [Connection Pooling](https://node-postgres.com/features/pooling)
