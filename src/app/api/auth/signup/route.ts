/**
 * Sign Up API Route
 * Handles shopkeeper registration with AWS Cognito.
 * In local dev (no real Cognito), stores user in-memory for testing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LOCAL_DEV_USERS } from '../signin/route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, password, name } = body;

    // Validate input
    if (!phoneNumber || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Phone number, password, and name are required' },
        { status: 400 }
      );
    }

    // Validate phone number format (E.164)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: 'Invalid phone number', message: 'Please provide a valid phone number in E.164 format (e.g. +919876543210)' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Weak password', message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // ── Local dev mock registration ──────────────────────────────────
    const isLocalDev = process.env.NODE_ENV !== 'production';
    const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID || '';
    const isPlaceholderPool = userPoolId.includes('localDev') || userPoolId === '';

    if (isLocalDev && isPlaceholderPool) {
      if (LOCAL_DEV_USERS[phoneNumber]) {
        return NextResponse.json(
          { error: 'UsernameExistsException', message: 'An account with this phone number already exists.' },
          { status: 409 }
        );
      }
      // Register user in-memory
      LOCAL_DEV_USERS[phoneNumber] = { name, password };
      console.log(`[Local Dev] Registered user: ${phoneNumber} (${name})`);
      return NextResponse.json({ message: 'Account created. Please verify your phone number.' }, { status: 201 });
    }
    // ── End local dev mock ───────────────────────────────────────────

    // TODO (Production): Use AWS Cognito SDK here
    return NextResponse.json(
      { error: 'Not implemented', message: 'AWS Cognito integration pending.' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Sign up error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during sign up' },
      { status: 500 }
    );
  }
}
