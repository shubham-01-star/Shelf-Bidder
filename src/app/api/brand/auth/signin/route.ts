import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { setAuthCookies } from '@/lib/auth/cookies';
import { hashPassword, verifyPassword } from '@/lib/auth/passwords';
import {
  buildBrandClaims,
  getCookieDurations,
  issueAuthSession,
} from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

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
      where: { email },
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'UserNotFoundException', message: 'Account not found. Please sign up first.' },
        { status: 404 }
      );
    }

    const passwordCheck = await verifyPassword(password, brand.password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { error: 'NotAuthorizedException', message: 'Incorrect email or password.' },
        { status: 401 }
      );
    }

    if (passwordCheck.needsMigration) {
      await prisma.brands.update({
        where: { id: brand.id },
        data: {
          password: await hashPassword(password),
        },
      });
    }

    const session = await issueAuthSession(
      buildBrandClaims({
        sub: brand.id,
        name: brand.name,
        email: brand.email,
      })
    );
    const response = NextResponse.json({
      ...session,
      brand: {
        id: brand.id,
        name: brand.name,
        email: brand.email,
        createdAt: brand.created_at,
      },
    });
    const { accessMaxAge, refreshMaxAge } = getCookieDurations();

    setAuthCookies(
      response,
      'brand',
      session.accessToken,
      session.refreshToken,
      accessMaxAge,
      refreshMaxAge
    );

    return response;
  } catch (error: unknown) {
    console.error('Brand sign in error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during sign in' },
      { status: 500 }
    );
  }
}
