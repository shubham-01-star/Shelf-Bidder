import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { shopkeepers } from '@prisma/client';

function generateSimpleToken(user: shopkeepers) {
  // A very simple token generation for the "simple API" 
  // without external dependencies like 'jsonwebtoken'
  const payload = {
    sub: user.shopkeeper_id,
    phone_number: user.phone_number,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 days
  };
  
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // Note: For true security, this should be signed with a secret key (HMAC).
  // For the requested "simple API", we are returning a basic payload.
  return `simple.${encodedPayload}.token`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, password } = body;

    if (!phoneNumber || !password) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Phone number and password are required' },
        { status: 400 }
      );
    }

    // Find the user in PostgreSQL
    const user = await prisma.shopkeepers.findUnique({
      where: { phone_number: phoneNumber }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'UserNotFoundException', message: 'Account not found. Please sign up first.' },
        { status: 404 }
      );
    }

    // Verify Password (direct string comparison for simple mode)
    // Note: Use bcrypt in production
    // @ts-ignore - Prisma types are cached in IDE
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'NotAuthorizedException', message: 'Incorrect password.' },
        { status: 401 }
      );
    }

    // Update last active date
    await prisma.shopkeepers.update({
      where: { id: user.id },
      data: { last_active_date: new Date() }
    });

    const token = generateSimpleToken(user);

    return NextResponse.json({
      accessToken: token,
      idToken: token,
      refreshToken: `refresh.${token}`,
      expiresIn: 7 * 24 * 3600,
      name: user.name,
      phoneNumber: user.phone_number,
    });
    
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during sign in' },
      { status: 500 }
    );
  }
}
