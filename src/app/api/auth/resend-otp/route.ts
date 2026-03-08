import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'OTP flow is bypassed.' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'OTP flow is bypassed.' });
}
