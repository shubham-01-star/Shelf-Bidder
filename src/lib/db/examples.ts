/**
 * Usage examples for the data layer
 * These examples demonstrate how to use the data models, validation, and mappers
 */

import type {
  Shopkeeper,
  ShelfSpace,
  Auction,
  Task,
  WalletTransaction,
} from '@/types/models';
import {
  ShopkeeperSchema,
  ShelfSpaceSchema,
  AuctionSchema,
  TaskSchema,
  WalletTransactionSchema,
  validate,
  safeValidate,
} from '@/lib/validation/schemas';
import {
  ShopkeeperMapper,
  ShelfSpaceMapper,
  AuctionMapper,
  TaskMapper,
  WalletTransactionMapper,
  KeyBuilder,
  TABLE_NAMES,
} from '@/lib/db';

// ============================================================================
// Example 1: Creating and Validating a Shopkeeper
// ============================================================================

export function createShopkeeperExample() {
  const shopkeeperData: Shopkeeper = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Ramesh Kumar',
    phoneNumber: '+919876543210',
    storeAddress: '123 Main Street, Mumbai, Maharashtra 400001',
    preferredLanguage: 'hi',
    timezone: 'Asia/Kolkata',
    walletBalance: 0,
    registrationDate: new Date().toISOString(),
    lastActiveDate: new Date().toISOString(),
  };

  // Validate the data
  const validatedShopkeeper = validate(ShopkeeperSchema, shopkeeperData);

  // Convert to DynamoDB item
  const dynamoItem = ShopkeeperMapper.toItem(validatedShopkeeper);

  console.log('DynamoDB Item:', dynamoItem);
  console.log('PK:', dynamoItem.PK); // SHOPKEEPER#123e4567-e89b-12d3-a456-426614174000
  console.log('SK:', dynamoItem.SK); // METADATA

  return dynamoItem;
}

// ============================================================================
// Example 2: Creating a ShelfSpace with Empty Spaces
// ============================================================================

export function createShelfSpaceExample() {
  const shelfSpaceData: ShelfSpace = {
    id: '456e7890-e89b-12d3-a456-426614174001',
    shopkeeperId: '123e4567-e89b-12d3-a456-426614174000',
    photoUrl: 'https://s3.amazonaws.com/shelf-photos/photo1.jpg',
    analysisDate: new Date().toISOString(),
    emptySpaces: [
      {
        id: '789e0123-e89b-12d3-a456-426614174002',
        coordinates: {
          x: 100,
          y: 200,
          width: 300,
          height: 150,
        },
        shelfLevel: 2,
        visibility: 'high',
        accessibility: 'easy',
      },
    ],
    currentInventory: [
      {
        name: 'Coca Cola',
        brand: 'Coca Cola Company',
        category: 'Beverages',
      },
    ],
    analysisConfidence: 95.5,
  };

  // Safe validation with error handling
  const result = safeValidate(ShelfSpaceSchema, shelfSpaceData);

  if (result.success) {
    const dynamoItem = ShelfSpaceMapper.toItem(result.data);
    console.log('ShelfSpace DynamoDB Item:', dynamoItem);
    return dynamoItem;
  } else {
    console.error('Validation errors:', result.error.issues);
    return null;
  }
}

// ============================================================================
// Example 3: Creating an Auction with Bids
// ============================================================================

export function createAuctionExample() {
  const now = new Date();
  const endTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes later

  const auctionData: Auction = {
    id: '111e2222-e89b-12d3-a456-426614174003',
    shelfSpaceId: '456e7890-e89b-12d3-a456-426614174001',
    startTime: now.toISOString(),
    endTime: endTime.toISOString(),
    status: 'active',
    bids: [
      {
        id: '333e4444-e89b-12d3-a456-426614174004',
        agentId: '555e6666-e89b-12d3-a456-426614174005',
        amount: 50.0,
        productDetails: {
          name: 'Pepsi 500ml',
          brand: 'PepsiCo',
          category: 'Beverages',
          dimensions: {
            width: 6.5,
            height: 20.0,
            depth: 6.5,
          },
        },
        timestamp: now.toISOString(),
        status: 'valid',
      },
    ],
  };

  const validatedAuction = validate(AuctionSchema, auctionData);
  const dynamoItem = AuctionMapper.toItem(validatedAuction);

  console.log('Auction Keys:');
  console.log('PK:', dynamoItem.PK); // AUCTION#{auctionId}
  console.log('GSI1PK:', dynamoItem.GSI1PK); // SHELFSPACE#{shelfSpaceId}
  console.log('GSI2PK:', dynamoItem.GSI2PK); // STATUS#active

  return dynamoItem;
}

// ============================================================================
// Example 4: Creating a Task
// ============================================================================

export function createTaskExample() {
  const taskData: Task = {
    id: '777e8888-e89b-12d3-a456-426614174006',
    auctionId: '111e2222-e89b-12d3-a456-426614174003',
    shopkeeperId: '123e4567-e89b-12d3-a456-426614174000',
    instructions: {
      productName: 'Pepsi 500ml',
      brandName: 'PepsiCo',
      targetLocation: {
        id: '789e0123-e89b-12d3-a456-426614174002',
        coordinates: {
          x: 100,
          y: 200,
          width: 300,
          height: 150,
        },
        shelfLevel: 2,
        visibility: 'high',
        accessibility: 'easy',
      },
      positioningRules: [
        'Place product at eye level',
        'Ensure label faces forward',
        'Align with shelf edge',
      ],
      visualRequirements: [
        'Product must be clearly visible',
        'No obstructions in front',
      ],
      timeLimit: 24,
    },
    status: 'assigned',
    assignedDate: new Date().toISOString(),
    earnings: 50.0,
  };

  const validatedTask = validate(TaskSchema, taskData);
  const dynamoItem = TaskMapper.toItem(validatedTask);

  console.log('Task Keys:');
  console.log('PK:', dynamoItem.PK); // SHOPKEEPER#{shopkeeperId}
  console.log('SK:', dynamoItem.SK); // TASK#{assignedDate}#{taskId}
  console.log('GSI1PK:', dynamoItem.GSI1PK); // TASK#{taskId}
  console.log('GSI2PK:', dynamoItem.GSI2PK); // STATUS#assigned

  return dynamoItem;
}

// ============================================================================
// Example 5: Creating a Wallet Transaction
// ============================================================================

export function createTransactionExample() {
  const transactionData: WalletTransaction = {
    id: '999e0000-e89b-12d3-a456-426614174007',
    shopkeeperId: '123e4567-e89b-12d3-a456-426614174000',
    type: 'earning',
    amount: 50.0,
    description: 'Task completion payment for Pepsi placement',
    taskId: '777e8888-e89b-12d3-a456-426614174006',
    timestamp: new Date().toISOString(),
    status: 'completed',
  };

  const validatedTransaction = validate(WalletTransactionSchema, transactionData);
  const dynamoItem = WalletTransactionMapper.toItem(validatedTransaction);

  console.log('Transaction Keys:');
  console.log('PK:', dynamoItem.PK); // SHOPKEEPER#{shopkeeperId}
  console.log('SK:', dynamoItem.SK); // TRANSACTION#{timestamp}#{transactionId}
  console.log('GSI1PK:', dynamoItem.GSI1PK); // TRANSACTION#{transactionId}

  return dynamoItem;
}

// ============================================================================
// Example 6: Key Building for Queries
// ============================================================================

export function keyBuildingExamples() {
  const shopkeeperId = '123e4567-e89b-12d3-a456-426614174000';
  const shelfSpaceId = '456e7890-e89b-12d3-a456-426614174001';
  const auctionId = '111e2222-e89b-12d3-a456-426614174003';

  console.log('Key Building Examples:');
  console.log('---');

  // Shopkeeper keys
  console.log('Shopkeeper PK:', KeyBuilder.shopkeeper.pk(shopkeeperId));
  console.log('Shopkeeper SK:', KeyBuilder.shopkeeper.sk());

  // ShelfSpace keys
  const analysisDate = new Date().toISOString();
  console.log('ShelfSpace PK:', KeyBuilder.shelfSpace.pk(shopkeeperId));
  console.log('ShelfSpace SK:', KeyBuilder.shelfSpace.sk(analysisDate, shelfSpaceId));
  console.log('ShelfSpace GSI1PK:', KeyBuilder.shelfSpace.gsi1pk(shelfSpaceId));

  // Auction keys
  const startTime = new Date().toISOString();
  console.log('Auction PK:', KeyBuilder.auction.pk(auctionId));
  console.log('Auction GSI1PK:', KeyBuilder.auction.gsi1pk(shelfSpaceId));
  console.log('Auction GSI2PK:', KeyBuilder.auction.gsi2pk('active'));

  // Table names
  console.log('---');
  console.log('Table Names:', TABLE_NAMES);
}

// ============================================================================
// Example 7: Converting DynamoDB Items Back to Models
// ============================================================================

export function convertFromDynamoDBExample() {
  // Simulate a DynamoDB item retrieved from the database
  const dynamoItem = {
    PK: 'SHOPKEEPER#123e4567-e89b-12d3-a456-426614174000',
    SK: 'METADATA',
    EntityType: 'SHOPKEEPER',
    ShopkeeperId: '123e4567-e89b-12d3-a456-426614174000',
    Name: 'Ramesh Kumar',
    PhoneNumber: '+919876543210',
    StoreAddress: '123 Main Street, Mumbai',
    PreferredLanguage: 'hi',
    Timezone: 'Asia/Kolkata',
    WalletBalance: 150.5,
    RegistrationDate: '2024-01-01T00:00:00.000Z',
    LastActiveDate: '2024-01-15T10:30:00.000Z',
    CreatedAt: '2024-01-01T00:00:00.000Z',
    UpdatedAt: '2024-01-15T10:30:00.000Z',
  };

  // Convert back to application model
  const shopkeeper = ShopkeeperMapper.fromItem(dynamoItem as any);

  console.log('Converted Shopkeeper:', shopkeeper);
  console.log('Wallet Balance:', shopkeeper.walletBalance);

  return shopkeeper;
}
