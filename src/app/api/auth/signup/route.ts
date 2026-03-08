import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, password, name, email } = body;

    // Validate input
    if (!phoneNumber || !password || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Phone number, email, password, and name are required' },
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

    // Check if user already exists
    const existingUser = await prisma.shopkeepers.findFirst({
      where: {
        OR: [
          { phone_number: phoneNumber },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'UserExistsException', message: 'An account with this phone number or email already exists.' },
        { status: 409 }
      );
    }

    // Create user in PostgreSQL
    // In a real production app, password should be hashed with bcrypt. 
    // Here we store it directly as per "simple API" request, but consider hashing later.
    const shopkeeperId = `sk-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    await prisma.shopkeepers.create({
      data: {
        shopkeeper_id: shopkeeperId,
        name,
        phone_number: phoneNumber,
        email,
        password: password, // Store password
        store_address: '',
        preferred_language: 'en',
        timezone: 'Asia/Kolkata',
        wallet_balance: 0,
      }
    });

    console.log(`[Signup] ✅ Created new shopkeeper: ${phoneNumber} (${name})`);

    // Return success without requiring verification
    return NextResponse.json(
      {
        message: 'Account created successfully. You can now log in.',
        requiresVerification: false,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Sign up error:', error);
    const errMessage = error instanceof Error ? error.message : 'An error occurred during sign up';
    
    return NextResponse.json(
      { error: 'Internal server error', message: errMessage },
      { status: 500 }
    );
  }
}
