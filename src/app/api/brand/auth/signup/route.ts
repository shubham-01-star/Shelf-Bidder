import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/passwords';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandName, email, password, contactPerson } = body;

    if (!brandName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Brand name, email, and password are required' },
        { status: 400 }
      );
    }

    const existingBrand = await prisma.brands.findUnique({
      where: { email }
    });

    if (existingBrand) {
      return NextResponse.json(
        { error: 'UserExistsException', message: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.brands.create({
      data: {
        name: brandName,
        email,
        password: hashedPassword,
        contact_person: contactPerson || brandName
      }
    });

    console.log(`[Brand Signup] ✅ Created new brand: ${email} (${brandName})`);

    return NextResponse.json(
      {
        message: 'Brand account created successfully. You can now log in.',
        requiresVerification: false,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Brand sign up error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during sign up' },
      { status: 500 }
    );
  }
}
