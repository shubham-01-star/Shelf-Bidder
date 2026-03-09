# DynamoDB Data Layer

This directory contains the complete data access layer for the Shelf-Bidder application, including CRUD operations, error handling, retry logic, and entity mappers.

## Overview

The data layer provides:

1. **Type-safe CRUD operations** for all entities
2. **Automatic retry logic** with exponential backoff
3. **Comprehensive error handling** with custom error types
4. **GSI query support** for all access patterns
5. **Entity mappers** for data transformation
6. **DynamoDB client** configuration

## Components

### Client (`client.ts`)

Configured DynamoDB Document Client with:
- Automatic retries (up to 3 attempts)
- Marshalling/unmarshalling options
- Region configuration from environment

### Operations (`operations.ts`)

CRUD operations for all entities:
- `ShopkeeperOperations`: Create, get, update, delete shopkeepers
- `ShelfSpaceOperations`: Create, get, query by shopkeeper with date range
- `AuctionOperations`: Create, get, update, query by status or shelf space
- `TaskOperations`: Create, get, update, query by shopkeeper or status
- `WalletTransactionOperations`: Create, get, update status, query by shopkeeper

### Errors (`errors.ts`)

Custom error types:
- `DatabaseError`: Base error class
- `ItemNotFoundError`: Entity not found
- `ConditionalCheckFailedError`: Condition expression failed
- `ValidationError`: Invalid input data
- `RetryableError`: Transient errors that can be retried

### Retry Logic (`retry.ts`)

Exponential backoff retry mechanism:
- Configurable max attempts (default: 3)
- Exponential delay with jitter
- Automatic detection of retryable errors

### Mappers (`mappers.ts`)

Entity mappers for converting between application models and DynamoDB items

### Types (`types.ts`)

DynamoDB item structures, table names, and key builders

## Table Design

### Single Table Design Pattern

All entities use composite keys with GSIs for alternative access patterns:

| Entity | PK | SK | GSI1 | GSI2 |
|--------|----|----|------|------|
| Shopkeeper | SHOPKEEPER#{id} | METADATA | - | - |
| ShelfSpace | SHOPKEEPER#{id} | SHELFSPACE#{date}#{id} | SHELFSPACE#{id} | - |
| Auction | AUCTION#{id} | METADATA | SHELFSPACE#{id} | STATUS#{status} |
| Task | SHOPKEEPER#{id} | TASK#{date}#{id} | TASK#{id} | STATUS#{status} |
| Transaction | SHOPKEEPER#{id} | TRANSACTION#{time}#{id} | TRANSACTION#{id} | - |

## Usage Examples

### Shopkeeper Operations

```typescript
import { ShopkeeperOperations } from '@/lib/db';

// Create
const shopkeeper = await ShopkeeperOperations.create({
  id: 'shop-123',
  name: 'Ramesh Kumar',
  phoneNumber: '+919876543210',
  storeAddress: '123 Main Street, Mumbai',
  preferredLanguage: 'hi',
  timezone: 'Asia/Kolkata',
  walletBalance: 0,
  registrationDate: new Date().toISOString(),
  lastActiveDate: new Date().toISOString(),
});

// Get
const shopkeeper = await ShopkeeperOperations.get('shop-123');

// Update
const updated = await ShopkeeperOperations.update('shop-123', {
  walletBalance: 200.0,
  lastActiveDate: new Date().toISOString(),
});

// Delete
await ShopkeeperOperations.delete('shop-123');
```

### ShelfSpace Operations

```typescript
import { ShelfSpaceOperations } from '@/lib/db';

// Create
const shelfSpace = await ShelfSpaceOperations.create({
  id: 'shelf-456',
  shopkeeperId: 'shop-123',
  photoUrl: 'https://example.com/photo.jpg',
  analysisDate: new Date().toISOString(),
  emptySpaces: [...],
  currentInventory: [...],
  analysisConfidence: 95.5,
});

// Query by shopkeeper with date range
const result = await ShelfSpaceOperations.queryByShopkeeper(
  'shop-123',
  '2024-01-01T00:00:00.000Z',
  '2024-01-31T23:59:59.999Z',
  { limit: 10 }
);

// Get by ID
const shelfSpace = await ShelfSpaceOperations.get('shelf-456');
```

### Auction Operations

```typescript
import { AuctionOperations } from '@/lib/db';

// Create
const auction = await AuctionOperations.create({
  id: 'auction-111',
  shelfSpaceId: 'shelf-456',
  startTime: new Date().toISOString(),
  endTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  status: 'active',
  bids: [],
});

// Query active auctions
const activeAuctions = await AuctionOperations.queryByStatus('active');

// Update with winner
const updated = await AuctionOperations.update('auction-111', {
  status: 'completed',
  winnerId: 'agent-555',
  winningBid: 50.0,
});

// Query by shelf space
const auctions = await AuctionOperations.queryByShelfSpace('shelf-456');
```

### Task Operations

```typescript
import { TaskOperations } from '@/lib/db';

// Create
const task = await TaskOperations.create({
  id: 'task-777',
  auctionId: 'auction-111',
  shopkeeperId: 'shop-123',
  instructions: {...},
  status: 'assigned',
  assignedDate: new Date().toISOString(),
  earnings: 50.0,
});

// Query by shopkeeper
const tasks = await TaskOperations.queryByShopkeeper('shop-123');

// Query by status
const assignedTasks = await TaskOperations.queryByStatus('assigned');

// Update
const updated = await TaskOperations.update(
  'task-777',
  'shop-123',
  '2024-01-15T10:00:00.000Z',
  {
    status: 'completed',
    completedDate: new Date().toISOString(),
    proofPhotoUrl: 'https://example.com/proof.jpg',
  }
);
```

### Transaction Operations

```typescript
import { WalletTransactionOperations } from '@/lib/db';

// Create
const transaction = await WalletTransactionOperations.create({
  id: 'txn-999',
  shopkeeperId: 'shop-123',
  type: 'earning',
  amount: 50.0,
  description: 'Task completion payment',
  taskId: 'task-777',
  timestamp: new Date().toISOString(),
  status: 'completed',
});

// Query by shopkeeper with date range
const transactions = await WalletTransactionOperations.queryByShopkeeper(
  'shop-123',
  '2024-01-01T00:00:00.000Z',
  '2024-01-31T23:59:59.999Z'
);

// Update status
const updated = await WalletTransactionOperations.updateStatus(
  'txn-999',
  'shop-123',
  '2024-01-15T10:30:00.000Z',
  'completed'
);
```

## Error Handling

All operations include comprehensive error handling:

```typescript
import { ItemNotFoundError, DatabaseError, RetryableError } from '@/lib/db';

try {
  const shopkeeper = await ShopkeeperOperations.get('shop-123');
} catch (error) {
  if (error instanceof ItemNotFoundError) {
    console.log('Shopkeeper not found');
  } else if (error instanceof RetryableError) {
    console.log('Temporary error, already retried');
  } else if (error instanceof DatabaseError) {
    console.error('Database error:', error.code, error.message);
  } else {
    throw error;
  }
}
```

## Access Patterns

The database layer supports all required access patterns:

1. **Get shopkeeper profile by shopkeeperId**: `ShopkeeperOperations.get()`
2. **Get recent shelf analyses by shopkeeperId + date range**: `ShelfSpaceOperations.queryByShopkeeper()`
3. **Get active auctions via GSI query on status**: `AuctionOperations.queryByStatus()`
4. **Get shopkeeper tasks by shopkeeperId + date range**: `TaskOperations.queryByShopkeeper()`
5. **Get wallet transactions by shopkeeperId + date range**: `WalletTransactionOperations.queryByShopkeeper()`

## Testing

Run tests with:

```bash
npm test                    # Run all tests
npm test -- operations      # Run operations tests only
npm run test:coverage       # Run with coverage report
```

All operations are thoroughly tested with mocked DynamoDB client.

## Environment Variables

Required environment variables:

```bash
AWS_REGION=us-east-1
DYNAMODB_SHOPKEEPERS_TABLE=ShelfBidder-Shopkeepers
DYNAMODB_SHELF_SPACES_TABLE=ShelfBidder-ShelfSpaces
DYNAMODB_AUCTIONS_TABLE=ShelfBidder-Auctions
DYNAMODB_TASKS_TABLE=ShelfBidder-Tasks
DYNAMODB_TRANSACTIONS_TABLE=ShelfBidder-Transactions
```

## Files

- `client.ts`: DynamoDB client configuration
- `types.ts`: TypeScript types and table definitions
- `mappers.ts`: Entity mappers for data transformation
- `operations.ts`: CRUD operations for all entities
- `errors.ts`: Custom error classes
- `retry.ts`: Retry logic with exponential backoff
- `index.ts`: Public API exports
- `__tests__/`: Unit tests for all components
