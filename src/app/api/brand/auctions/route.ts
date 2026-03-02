import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const { AuctionOperations, ShelfSpaceOperations, ShopkeeperOperations } = await import('@/lib/db');
    
    // Fetch active auctions
    const auctionsRes = await AuctionOperations.queryByStatus('active', { limit: 50 });
    const auctions = auctionsRes.items || [];
    
    // Map them to the UI format
    const mappedAuctions = await Promise.all(auctions.map(async (auction) => {
      let shelfLocation = 'Standard Shelf';
      let shopkeeperArea = 'Unknown Area';
      let spaceSize = '30x40 cm';
      let shelfLevel = 2;
      let visibility = 'Medium';
      
      try {
        const shelf = await ShelfSpaceOperations.get(auction.shelfSpaceId).catch(() => null);
        if (shelf) {
          const emptySpace = shelf.emptySpaces?.[0]; // just grab first for demo
          if (emptySpace) {
            shelfLevel = emptySpace.shelfLevel;
            visibility = emptySpace.visibility.charAt(0).toUpperCase() + emptySpace.visibility.slice(1);
            spaceSize = `${Math.round(emptySpace.coordinates.width)}×${Math.round(emptySpace.coordinates.height)} cm`;
          }
          
          const shopkeeper = await ShopkeeperOperations.get(shelf.shopkeeperId).catch(() => null);
          if (shopkeeper) {
            shopkeeperArea = shopkeeper.storeAddress || shopkeeperArea;
          }
        }
      } catch(e) { /* ignore mapping errors for resilience */ }

      const highestBid = auction.bids && auction.bids.length > 0 
        ? Math.max(...auction.bids.map(b => b.amount))
        : 50; // Starting price

      // Calculate endsIn string (e.g. "12 min")
      const endTime = new Date(auction.endTime).getTime();
      const now = Date.now();
      const diffMinutes = Math.max(0, Math.floor((endTime - now) / 60000));
      const endsIn = diffMinutes > 60 
        ? `${Math.floor(diffMinutes / 60)} hr ${diffMinutes % 60} min`
        : `${diffMinutes} min`;

      return {
        id: auction.id,
        shelfLocation,
        shopkeeperArea,
        spaceSize,
        shelfLevel,
        visibility,
        currentBids: auction.bids ? auction.bids.length : 0,
        highestBid,
        endsIn,
        status: auction.status,
      };
    }));

    return NextResponse.json({ success: true, data: mappedAuctions });
  } catch(error) {
    console.error('Failed to fetch brand auctions', error);
    return NextResponse.json({ success: false, error: 'Database query failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { auctionId, amount, productName, brandName } = body;
    const brandId = request.headers.get('x-brand-id') || 'default-brand';

    if (!auctionId || !amount || !productName || !brandName) {
      return NextResponse.json({ success: false, error: 'Missing required bid details' }, { status: 400 });
    }

    const { AuctionOperations } = await import('@/lib/db');
    
    // Fetch the auction
    const auction = await AuctionOperations.get(auctionId);
    if (!auction || auction.status !== 'active') {
      return NextResponse.json({ success: false, error: 'Auction is not active or does not exist' }, { status: 400 });
    }

    // Determine current highest bid
    const currentHighest = auction.bids && auction.bids.length > 0
      ? Math.max(...auction.bids.map(b => b.amount))
      : 0;

    if (amount <= currentHighest) {
      return NextResponse.json({ success: false, error: 'Bid must be higher than current highest bid' }, { status: 400 });
    }

    // Append the new bid
    const newBid = {
      id: uuidv4(),
      agentId: brandId,
      amount: Number(amount),
      productDetails: {
        name: productName,
        brand: brandName,
        category: 'FMCG',
        dimensions: { width: 10, height: 20 }
      },
      timestamp: new Date().toISOString(),
      status: 'valid' as const
    };

    const updatedBids = [...(auction.bids || []), newBid];

    // Update auction in DynamoDB
    await AuctionOperations.update(auctionId, { bids: updatedBids });

    return NextResponse.json({ success: true, bid: newBid });

  } catch (error) {
    console.error('Failed to submit brand bid', error);
    return NextResponse.json({ success: false, error: 'Failed to process bid' }, { status: 500 });
  }
}
