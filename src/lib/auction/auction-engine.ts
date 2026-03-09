/**
 * Auction Engine - Core Business Logic
 *
 * Task 5.1: Implement auction management functions
 * Manages the full lifecycle of shelf-space auctions:
 *  - Initialize auctions from shelf analysis
 *  - Collect and validate bids from brand agents
 *  - Select winners (highest bid)
 *  - Cancel auctions
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Auction,
  Bid,
  EmptySpace,
  ProductDetails,
  AuctionStatus,
} from '@/types/models';
import { AuctionOperations, ShelfSpaceOperations } from '@/lib/db';
import { validateBid, BidValidationError } from './bid-validator';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

const sfnClient = new SFNClient({ region: process.env.AWS_REGION || 'us-west-2' });
const STATE_MACHINE_ARN = process.env.WORKFLOW_STATE_MACHINE_ARN;

const DEFAULT_AUCTION_DURATION_MINUTES = 15;

export async function initializeAuctions(
  shelfSpaceId: string,
  emptySpaces: EmptySpace[],
  durationMinutes: number = DEFAULT_AUCTION_DURATION_MINUTES
): Promise<Auction[]> {
  if (!emptySpaces?.length) {
    return [];
  }

  const createdAuctions = await Promise.all(
    emptySpaces.map(async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

      const auction: Auction = {
        id: uuidv4(),
        shelfSpaceId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: 'active',
        bids: [],
      };

      return AuctionOperations.create(auction);
    })
  );

  return createdAuctions;
}

export async function submitBid(
  auctionId: string,
  agentId: string,
  amount: number,
  productDetails: ProductDetails
): Promise<Auction> {
  const auction = await AuctionOperations.get(auctionId);
  const shelfSpaceData = await getShelfSpaceForAuction(auction.shelfSpaceId);
  const emptySpace = shelfSpaceData?.emptySpaces?.[0] || createDefaultEmptySpace();

  const validation = validateBid({ agentId, amount, productDetails }, auction, emptySpace);
  if (!validation.valid) {
    throw new BidValidationError(
      `Bid validation failed: ${validation.errors.join('; ')}`,
      'BID_VALIDATION_FAILED',
      { errors: validation.errors }
    );
  }

  const bid: Bid = {
    id: uuidv4(),
    agentId,
    amount,
    productDetails,
    timestamp: new Date().toISOString(),
    status: 'valid',
  };

  return AuctionOperations.update(auctionId, {
    bids: [...auction.bids, bid],
  });
}

export async function selectWinner(auctionId: string): Promise<Auction> {
  const auction = await AuctionOperations.get(auctionId);

  if (auction.status !== 'active') {
    throw new BidValidationError(
      `Cannot select winner for non-active auction (status: ${auction.status})`,
      'AUCTION_NOT_ACTIVE'
    );
  }

  const validBids = auction.bids.filter((bid) => bid.status === 'valid');
  if (validBids.length === 0) {
    return cancelAuction(auctionId, 'No valid bids received');
  }

  const winningBid = validBids.reduce((highest, current) =>
    current.amount > highest.amount ? current : highest
  );

  const updatedAuction = await AuctionOperations.update(auctionId, {
    status: 'completed' as AuctionStatus,
    winnerId: winningBid.agentId,
    winningBid: winningBid.amount,
  });

  if (STATE_MACHINE_ARN) {
    try {
      const command = new StartExecutionCommand({
        stateMachineArn: STATE_MACHINE_ARN,
        input: JSON.stringify({
          auctionId: updatedAuction.id,
          shelfSpaceId: updatedAuction.shelfSpaceId,
          auctionResult: {
            winnerId: updatedAuction.winnerId,
            winningBid: updatedAuction.winningBid,
            productName: winningBid.productDetails.name,
            brandName: winningBid.productDetails.brand,
          },
        }),
      });
      await sfnClient.send(command);
    } catch (error) {
      console.error('Failed to start Step Functions workflow:', error);
    }
  }

  return updatedAuction;
}

export async function cancelAuction(
  auctionId: string,
  reason: string = 'Cancelled by system'
): Promise<Auction> {
  console.log(`Cancelling auction ${auctionId}: ${reason}`);
  return AuctionOperations.update(auctionId, {
    status: 'cancelled' as AuctionStatus,
  });
}

export async function getActiveAuctions(): Promise<Auction[]> {
  const result = await AuctionOperations.queryByStatus('active');
  return result.items;
}

export async function getAuctionsByShelfSpace(
  shelfSpaceId: string
): Promise<Auction[]> {
  const result = await AuctionOperations.queryByShelfSpace(shelfSpaceId);
  return result.items;
}

async function getShelfSpaceForAuction(
  shelfSpaceId: string
): Promise<{ emptySpaces: EmptySpace[] } | null> {
  try {
    const shelfSpace = await ShelfSpaceOperations.get(shelfSpaceId) as any;
    const emptySpaces = shelfSpace.emptySpaces || shelfSpace.empty_spaces;

    if (!Array.isArray(emptySpaces)) {
      return null;
    }

    const normalizedSpaces = emptySpaces.map((space: any) => ({
      id: space.id,
      coordinates: space.coordinates,
      shelfLevel: space.shelfLevel ?? space.shelf_level,
      visibility: space.visibility,
      accessibility: space.accessibility,
    }));

    return { emptySpaces: normalizedSpaces };
  } catch {
    return null;
  }
}

function createDefaultEmptySpace(): EmptySpace {
  return {
    id: 'default',
    coordinates: {
      x: 0,
      y: 0,
      width: 10000,
      height: 10000,
    },
    shelfLevel: 1,
    visibility: 'medium',
    accessibility: 'moderate',
  };
}
