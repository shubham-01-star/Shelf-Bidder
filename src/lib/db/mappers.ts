/**
 * Entity mappers for converting between application models and DynamoDB items
 */

import type {
  Shopkeeper,
  ShelfSpace,
  Auction,
  Task,
  WalletTransaction,
} from '@/types/models';
import type {
  ShopkeeperItem,
  ShelfSpaceItem,
  AuctionItem,
  TaskItem,
  WalletTransactionItem,
} from './types';
import { KeyBuilder } from './types';

// ============================================================================
// Shopkeeper Mapper
// ============================================================================

export const ShopkeeperMapper = {
  toItem(shopkeeper: Shopkeeper): ShopkeeperItem {
    const now = new Date().toISOString();
    return {
      PK: KeyBuilder.shopkeeper.pk(shopkeeper.id),
      SK: KeyBuilder.shopkeeper.sk(),
      EntityType: 'SHOPKEEPER',
      ShopkeeperId: shopkeeper.id,
      Name: shopkeeper.name,
      PhoneNumber: shopkeeper.phoneNumber,
      StoreAddress: shopkeeper.storeAddress,
      PreferredLanguage: shopkeeper.preferredLanguage,
      Timezone: shopkeeper.timezone,
      WalletBalance: shopkeeper.walletBalance,
      RegistrationDate: shopkeeper.registrationDate,
      LastActiveDate: shopkeeper.lastActiveDate,
      CreatedAt: now,
      UpdatedAt: now,
    };
  },

  fromItem(item: ShopkeeperItem): Shopkeeper {
    return {
      id: item.ShopkeeperId,
      name: item.Name,
      phoneNumber: item.PhoneNumber,
      storeAddress: item.StoreAddress,
      preferredLanguage: item.PreferredLanguage,
      timezone: item.Timezone,
      walletBalance: item.WalletBalance,
      registrationDate: item.RegistrationDate,
      lastActiveDate: item.LastActiveDate,
    };
  },
};

// ============================================================================
// ShelfSpace Mapper
// ============================================================================

export const ShelfSpaceMapper = {
  toItem(shelfSpace: ShelfSpace): ShelfSpaceItem {
    const now = new Date().toISOString();
    return {
      PK: KeyBuilder.shelfSpace.pk(shelfSpace.shopkeeperId),
      SK: KeyBuilder.shelfSpace.sk(shelfSpace.analysisDate, shelfSpace.id),
      GSI1PK: KeyBuilder.shelfSpace.gsi1pk(shelfSpace.id),
      GSI1SK: KeyBuilder.shelfSpace.gsi1sk(),
      EntityType: 'SHELFSPACE',
      ShelfSpaceId: shelfSpace.id,
      ShopkeeperId: shelfSpace.shopkeeperId,
      PhotoUrl: shelfSpace.photoUrl,
      AnalysisDate: shelfSpace.analysisDate,
      EmptySpaces: JSON.stringify(shelfSpace.emptySpaces),
      CurrentInventory: JSON.stringify(shelfSpace.currentInventory),
      AnalysisConfidence: shelfSpace.analysisConfidence,
      CreatedAt: now,
      UpdatedAt: now,
    };
  },

  fromItem(item: ShelfSpaceItem): ShelfSpace {
    return {
      id: item.ShelfSpaceId,
      shopkeeperId: item.ShopkeeperId,
      photoUrl: item.PhotoUrl,
      analysisDate: item.AnalysisDate,
      emptySpaces: JSON.parse(item.EmptySpaces),
      currentInventory: JSON.parse(item.CurrentInventory),
      analysisConfidence: item.AnalysisConfidence,
    };
  },
};

// ============================================================================
// Auction Mapper
// ============================================================================

export const AuctionMapper = {
  toItem(auction: Auction): AuctionItem {
    const now = new Date().toISOString();
    return {
      PK: KeyBuilder.auction.pk(auction.id),
      SK: KeyBuilder.auction.sk(),
      GSI1PK: KeyBuilder.auction.gsi1pk(auction.shelfSpaceId),
      GSI1SK: KeyBuilder.auction.gsi1sk(auction.startTime),
      GSI2PK: KeyBuilder.auction.gsi2pk(auction.status),
      GSI2SK: KeyBuilder.auction.gsi2sk(auction.startTime),
      EntityType: 'AUCTION',
      AuctionId: auction.id,
      ShelfSpaceId: auction.shelfSpaceId,
      StartTime: auction.startTime,
      EndTime: auction.endTime,
      Status: auction.status,
      Bids: JSON.stringify(auction.bids),
      WinnerId: auction.winnerId,
      WinningBid: auction.winningBid,
      CreatedAt: now,
      UpdatedAt: now,
    };
  },

  fromItem(item: AuctionItem): Auction {
    return {
      id: item.AuctionId,
      shelfSpaceId: item.ShelfSpaceId,
      startTime: item.StartTime,
      endTime: item.EndTime,
      status: item.Status as 'active' | 'completed' | 'cancelled',
      bids: JSON.parse(item.Bids),
      winnerId: item.WinnerId,
      winningBid: item.WinningBid,
    };
  },
};

// ============================================================================
// Task Mapper
// ============================================================================

export const TaskMapper = {
  toItem(task: Task): TaskItem {
    const now = new Date().toISOString();
    return {
      PK: KeyBuilder.task.pk(task.shopkeeperId),
      SK: KeyBuilder.task.sk(task.assignedDate, task.id),
      GSI1PK: KeyBuilder.task.gsi1pk(task.id),
      GSI1SK: KeyBuilder.task.gsi1sk(),
      GSI2PK: KeyBuilder.task.gsi2pk(task.status),
      GSI2SK: KeyBuilder.task.gsi2sk(task.assignedDate),
      EntityType: 'TASK',
      TaskId: task.id,
      AuctionId: task.auctionId,
      ShopkeeperId: task.shopkeeperId,
      Instructions: JSON.stringify(task.instructions),
      Status: task.status,
      AssignedDate: task.assignedDate,
      CompletedDate: task.completedDate,
      ProofPhotoUrl: task.proofPhotoUrl,
      Earnings: task.earnings,
      VerificationResult: task.verificationResult
        ? JSON.stringify(task.verificationResult)
        : undefined,
      CreatedAt: now,
      UpdatedAt: now,
    };
  },

  fromItem(item: TaskItem): Task {
    return {
      id: item.TaskId,
      auctionId: item.AuctionId,
      shopkeeperId: item.ShopkeeperId,
      instructions: JSON.parse(item.Instructions),
      status: item.Status as 'assigned' | 'in_progress' | 'completed' | 'failed',
      assignedDate: item.AssignedDate,
      completedDate: item.CompletedDate,
      proofPhotoUrl: item.ProofPhotoUrl,
      earnings: item.Earnings,
      verificationResult: item.VerificationResult
        ? JSON.parse(item.VerificationResult)
        : undefined,
    };
  },
};

// ============================================================================
// WalletTransaction Mapper
// ============================================================================

export const WalletTransactionMapper = {
  toItem(transaction: WalletTransaction): WalletTransactionItem {
    const now = new Date().toISOString();
    return {
      PK: KeyBuilder.transaction.pk(transaction.shopkeeperId),
      SK: KeyBuilder.transaction.sk(transaction.timestamp, transaction.id),
      GSI1PK: KeyBuilder.transaction.gsi1pk(transaction.id),
      GSI1SK: KeyBuilder.transaction.gsi1sk(),
      EntityType: 'TRANSACTION',
      TransactionId: transaction.id,
      ShopkeeperId: transaction.shopkeeperId,
      Type: transaction.type,
      Amount: transaction.amount,
      Description: transaction.description,
      TaskId: transaction.taskId,
      Timestamp: transaction.timestamp,
      Status: transaction.status,
      CreatedAt: now,
      UpdatedAt: now,
    };
  },

  fromItem(item: WalletTransactionItem): WalletTransaction {
    return {
      id: item.TransactionId,
      shopkeeperId: item.ShopkeeperId,
      type: item.Type as 'earning' | 'payout' | 'adjustment',
      amount: item.Amount,
      description: item.Description,
      taskId: item.TaskId,
      timestamp: item.Timestamp,
      status: item.Status as 'pending' | 'completed' | 'failed',
    };
  },
};
