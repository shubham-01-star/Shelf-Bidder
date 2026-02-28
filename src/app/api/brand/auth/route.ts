/**
 * Brand Auth API
 * POST /api/brand/auth
 * Simple prototype authentication for brand owners
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, brandName, email, password, contactPerson } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (action === 'signup') {
      if (!brandName) {
        return NextResponse.json(
          { error: 'Brand name is required for signup' },
          { status: 400 }
        );
      }

      // Prototype: Create brand with deterministic ID
      const brandId = `brand-${Date.now()}`;
      const token = Buffer.from(`${brandId}:${email}:${Date.now()}`).toString('base64');

      return NextResponse.json({
        success: true,
        token,
        brand: {
          id: brandId,
          brandName,
          email,
          contactPerson: contactPerson || '',
          totalSpent: 0,
          auctionsWon: 0,
          createdAt: new Date().toISOString(),
        },
      }, { status: 201 });
    }

    // Login — prototype: accept any credentials
    const brandId = `brand-${Buffer.from(email).toString('base64').slice(0, 8)}`;
    const token = Buffer.from(`${brandId}:${email}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      token,
      brand: {
        id: brandId,
        brandName: brandName || email.split('@')[0],
        email,
        totalSpent: 12450,
        auctionsWon: 28,
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    });
  } catch (error) {
    console.error('Brand auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
