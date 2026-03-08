import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// @ts-ignore
import { brands } from '@prisma/client';

export const dynamic = 'force-dynamic';

// @ts-ignore
function generateSimpleToken(brand: brands) {
  const payload = {
    sub: brand.id,
    name: brand.name,
    email: brand.email,
    role: 'brand',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
  };
  
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // Using brand. prefix for clarity but format aligned with shopkeeper simple. prefix structure
  return `brand.${encodedPayload}.token`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const brand = await prisma.brands.findUnique({
      where: { email }
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'UserNotFoundException', message: 'Account not found. Please sign up first.' },
        { status: 404 }
      );
    }

    if (brand.password !== password) {
      return NextResponse.json(
        { error: 'NotAuthorizedException', message: 'Incorrect email or password.' },
        { status: 401 }
      );
    }

    const token = generateSimpleToken(brand);

    return NextResponse.json({
      accessToken: token,
      idToken: token,
      refreshToken: `refresh.${token}`,
      expiresIn: 7 * 24 * 3600,
      brand: {
        id: brand.id,
        name: brand.name,
        email: brand.email,
        createdAt: brand.created_at,
      },
    });
  } catch (error: unknown) {
    console.error('Brand sign in error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during sign in' },
      { status: 500 }
    );
  }
}
