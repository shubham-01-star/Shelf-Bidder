import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Hackathon prototype static mock data for active auctions
    const auctions = [
      {
        id: 'mock-auc-1',
        shelfLocation: 'Premium Endcap',
        shopkeeperArea: 'Downtown Delhi',
        spaceSize: '50x50 cm',
        shelfLevel: 3,
        visibility: 'High',
        currentBids: 2,
        highestBid: 250,
        endsIn: '45 min',
        status: 'active',
      },
      {
        id: 'mock-auc-2',
        shelfLocation: 'Aisle 4',
        shopkeeperArea: 'South Mumbai',
        spaceSize: '30x40 cm',
        shelfLevel: 2,
        visibility: 'Medium',
        currentBids: 1,
        highestBid: 120,
        endsIn: '2 hr 10 min',
        status: 'active',
      },
      {
        id: 'mock-auc-3',
        shelfLocation: 'Standard Shelf',
        shopkeeperArea: 'Unknown Area',
        spaceSize: '30x40 cm',
        shelfLevel: 2,
        visibility: 'Medium',
        currentBids: 0,
        highestBid: 50,
        endsIn: '2 hr',
        status: 'active',
      }
    ];
    
    return NextResponse.json({ success: true, data: auctions });
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

    // Hackathon static mock to allow bidding
    const auction = {
      id: auctionId,
      status: 'active',
      bids: [
        { amount: 100 }
      ]
    };

    // Determine current highest bid from mock
    const currentHighest = (auction.bids && auction.bids.length > 0)
      ? Math.max(...auction.bids.map(b => b.amount))
      : 0;

    if (amount <= currentHighest) {
      return NextResponse.json({ success: false, error: 'Bid must be higher than current highest bid' }, { status: 400 });
    }

    // Append the new bid (mock)
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
      status: 'valid'
    };

    console.log(`[Brand Auction] Mock bid placed by ${brandId} for ₹${amount} on ${auctionId}`);

    return NextResponse.json({ success: true, bid: newBid });

  } catch (error) {
    console.error('Failed to submit brand bid', error);
    return NextResponse.json({ success: false, error: 'Failed to process bid' }, { status: 500 });
  }
}