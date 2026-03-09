import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { setAuthCookies } from '@/lib/auth/cookies';
import { hashPassword, verifyPassword } from '@/lib/auth/passwords';
import {
  buildShopkeeperClaims,
  getCookieDurations,
  issueAuthSession,
} from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

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

    const user = await prisma.shopkeepers.findUnique({
      where: { phone_number: phoneNumber },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'UserNotFoundException', message: 'Account not found. Please sign up first.' },
        { status: 404 }
      );
    }

    const passwordCheck = await verifyPassword(password, user.password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: 'NotAuthorizedException', message: 'Incorrect password.' },
        { status: 401 }
      );
    }

    const pendingUpdate: Record<string, unknown> = {
      last_active_date: new Date(),
    };

    if (passwordCheck.needsMigration) {
      pendingUpdate.password = await hashPassword(password);
    }

    await prisma.shopkeepers.update({
      where: { id: user.id },
      data: pendingUpdate,
    });

    const session = await issueAuthSession(
      buildShopkeeperClaims({
        sub: user.shopkeeper_id,
        phoneNumber: user.phone_number,
        name: user.name,
        email: user.email,
      })
    );
    const response = NextResponse.json({
      ...session,
      name: user.name,
      phoneNumber: user.phone_number,
    });
    const { accessMaxAge, refreshMaxAge } = getCookieDurations();

    setAuthCookies(
      response,
      'shopkeeper',
      session.accessToken,
      session.refreshToken,
      accessMaxAge,
      refreshMaxAge
    );

    return response;
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during sign in' },
      { status: 500 }
    );
  }
}
