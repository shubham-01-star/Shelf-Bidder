# PostgreSQL Operations Layer

**Task 2.2**: Implement PostgreSQL operations layer with ACID transactions, connection pooling, retry logic, and row-level locking.

**Requirements**: 9.1, 9.2, 9.5, 9.6

## Overview

This module provides a complete PostgreSQL operations layer for the Shelf-Bidder application with:

- ✅ **CRUD Operations** for all entities (Shopkeepers, ShelfSpaces, Campaigns, Tasks, WalletTransactions)
- ✅ **ACID Transactions** with automatic rollback on errors
- ✅ **Connection Pooling** with configurable pool size and timeouts
- ✅ **Retry Logic** for transient failures (connection errors, deadlocks, serialization failures)
- ✅ **Row-Level Locking** for concurrent operations (`FOR UPDATE`)
- ✅ **Complex Queries** for campaign matching with location and budget filters
- ✅ **Error Handling** with custom error types (NotFoundError, DuplicateError, InsufficientFundsError)

## Architecture

```
src/lib/db/postgres/
├── client.ts          # Connection pool and transaction management
├── types.ts           # TypeScript interfaces and error classes
├── mappers.ts         # Row-to-object conversion
├── validation.ts      # Zod validation schemas
├── operations.ts      # CRUD operations and complex queries
└── index.ts           # Main export file
```

## Usage

### Basic CRUD Operations

```typescript
import { ShopkeeperOperations } from '@/lib/db/postgres';

// Create
const shopkeeper = await ShopkeeperOperations.create({
  shopkeeper_id: 'cognito-user-id',
  name: 'John Doe',
  phone_number: '+1234567890',
  email: 'john@example.com',
  store_address: '123 Main St',
});

// Read
const shopkeeper = await ShopkeeperOperations.getById(id);

// Update (with row-level locking)
const updated = await ShopkeeperOperations.update(id, {
  name: 'Jane Doe',
  store_address: '456 Oak Ave',
});

// Delete
await ShopkeeperOperations.delete(id);

// List with pagination
const result = await ShopkeeperOperations.list({
  limit: 20,
  offset: 0,
  orderBy: 'created_at',
  orderDirection: 'DESC',
});
```

### Complex Queries

```typescript
import { CampaignOperations } from '@/lib/db/postgres';

// Find matching campaigns by location and budget
const campaigns = await CampaignOperations.findMatchingCampaigns(
  'New York',      // location
  50,              // required budget
  'Electronics'    // optional category
);

// Query active campaigns with pagination
const activeCampaigns = await CampaignOperations.queryActive({
  limit: 10,
  offset: 0,
});
```

### ACID Transactions

```typescript
import { TransactionOperations } from '@/lib/db/postgres';

// Campaign budget deduction + task creation (atomic)
const result = await TransactionOperations.deductBudgetAndCreateTask(
  campaignId,
  {
    campaign_id: campaignId,
    shopkeeper_id: shopkeeperId,
    shelf_space_id: shelfSpaceId,
    instructions: { /* ... */ },
    earnings: 50,
  }
);
// Returns: { campaign, task }

// Task completion + earnings credit (atomic)
const result = await TransactionOperations.completeTaskAndCreditEarnings(
  taskId,
  proofPhotoUrl,
  verificationResult
);
// Returns: { task, transaction, newBalance }

// Payout processing with balance check (atomic)
const result = await TransactionOperations.processPayout(
  shopkeeperId,
  100,
  'Bank transfer payout'
);
// Returns: { transaction, newBalance }
```

### Row-Level Locking

All update operations use row-level locking to prevent race conditions:

```typescript
// Automatic locking in update operations
const updated = await ShopkeeperOperations.update(id, updates);

// Manual transaction with locking
import { transaction } from '@/lib/db/postgres';

await transaction(async (client) => {
  // Lock the row
  const result = await client.query(
    'SELECT * FROM campaigns WHERE id = $1 FOR UPDATE',
    [campaignId]
  );
  
  // Perform updates
  await client.query(
    'UPDATE campaigns SET remaining_budget = remaining_budget - $1 WHERE id = $2',
    [amount, campaignId]
  );
  
  // Commit happens automatically
});
```

### Error Handling

```typescript
import {
  NotFoundError,
  DuplicateError,
  InsufficientFundsError,
  DatabaseError,
} from '@/lib/db/postgres';

try {
  const shopkeeper = await ShopkeeperOperations.getById(id);
} catch (error) {
  if (error instanceof NotFoundError) {
    console.error('Shopkeeper not found:', error.message);
  } else if (error instanceof DuplicateError) {
    console.error('Duplicate entry:', error.message);
  } else if (error instanceof InsufficientFundsError) {
    console.error('Insufficient funds:', error.message);
  } else if (error instanceof DatabaseError) {
    console.error('Database error:', error.message, error.code);
  }
}
```

## Connection Pooling

The connection pool is configured via environment variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shelfbidder
DB_USER=postgres
DB_PASSWORD=postgres_dev_password
DB_SSL=false
DB_POOL_SIZE=20
DB_IDLE_TIMEOUT=30000
```

Pool features:
- Maximum 20 connections by default
- 30-second idle timeout
- Automatic connection management
- Graceful shutdown on SIGINT/SIGTERM

## Retry Logic

Operations automatically retry on transient failures:

- Connection errors (ECONNREFUSED, ENOTFOUND)
- Deadlock detection
- Serialization failures
- Connection timeouts

Configuration:
- Maximum 3 retries
- Exponential backoff (100ms, 200ms, 300ms)

## Testing

Run the test script to verify operations:

```bash
node test-postgres-operations.js
```

Tests cover:
1. Database connection health check
2. Shopkeeper CRUD operations
3. Campaign creation
4. ACID transactions with row-level locking
5. Complex campaign matching queries
6. Data cleanup

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried columns are indexed
2. **Connection Pooling**: Reuses connections to reduce overhead
3. **Row-Level Locking**: Prevents full table locks for better concurrency
4. **Prepared Statements**: All queries use parameterized queries to prevent SQL injection
5. **JSONB Columns**: Efficient storage and querying of complex data structures

## ACID Compliance

All financial operations guarantee ACID properties:

- **Atomicity**: Transactions either complete fully or rollback completely
- **Consistency**: Database constraints are always enforced
- **Isolation**: Row-level locking prevents concurrent modification conflicts
- **Durability**: Committed transactions are persisted to disk

## Next Steps

- Task 2.3: Write property tests for ACID transaction consistency
- Task 2.4: Write unit tests for database operations
- Task 4.x: Integrate with photo processing and vision analysis
- Task 5.x: Implement campaign matching engine

