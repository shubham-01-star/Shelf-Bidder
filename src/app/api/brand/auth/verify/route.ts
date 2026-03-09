import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  // Verification is no longer needed since we write directly to the DB on signup
  // We keep this route returning 200 so the frontend doesn't break if it still calls it.
  
  return NextResponse.json({ 
    message: 'Brand Account verified successfully.',
    bypassed: true
  });
}
