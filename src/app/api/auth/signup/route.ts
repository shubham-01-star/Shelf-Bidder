/**
 * Sign Up API Route
 * Handles shopkeeper registration with AWS Cognito.
 * OTP is sent via Resend email and always logged to console.
 * In local dev (no real Cognito), stores user in-memory for testing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { LOCAL_DEV_USERS } from '../signin/route';

// Keep OTP store in global scope so it survives Next.js HMR/Turbopack reloads
const globalForOTP = global as unknown as { 
  TEMP_OTP_STORE: Record<string, { code: string; email: string; expiresAt: number; password?: string; name?: string }> 
};

export const TEMP_OTP_STORE = globalForOTP.TEMP_OTP_STORE || {};
if (process.env.NODE_ENV !== 'production') {
  globalForOTP.TEMP_OTP_STORE = TEMP_OTP_STORE;
}

/**
 * Generate OTP HTML email body (inline — no extra dependencies)
 */
function getOTPEmailHtml(otpCode: string, firstName: string): string {
  return `
    <div style="background-color:#f6f9fc;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <div style="background-color:#fff;border:1px solid #e6ebf1;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);max-width:500px;margin:0 auto;padding:32px;text-align:center">
        <h1 style="color:#0f172a;font-size:24px;font-weight:700;margin:0 0 24px 0">Shelf-Bidder Verification</h1>
        <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px 0;text-align:left">Hi ${firstName},</p>
        <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px 0;text-align:left">Welcome to Shelf-Bidder! Please use the verification code below to complete your registration:</p>
        <div style="background-color:#f8fafc;border:2px dashed #94a3b8;border-radius:12px;margin:32px 0;padding:24px">
          <span style="color:#0f172a;font-size:36px;font-weight:800;letter-spacing:8px">${otpCode}</span>
        </div>
        <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px 0;text-align:left">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        <hr style="border-top:1px solid #e6ebf1;border-left:none;border-right:none;border-bottom:none;margin:32px 0"/>
        <p style="color:#64748b;font-size:14px;margin:0">© ${new Date().getFullYear()} Shelf-Bidder. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Helper: Generate 6-digit OTP, store it, and always log to console.
 */
function generateAndStoreOTP(phoneNumber: string, email: string, name?: string): string {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  TEMP_OTP_STORE[phoneNumber] = {
    code: otpCode,
    email,
    name,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };

  // Always log OTP to console (for dev convenience)
  console.log('');
  console.log('============================================================');
  console.log('🔐 OTP CODE');
  console.log('============================================================');
  console.log(`  Phone:   ${phoneNumber}`);
  console.log(`  Email:   ${email}`);
  if (name) console.log(`  Name:    ${name}`);
  console.log(`  OTP:     ${otpCode}`);
  console.log(`  Expires: ${new Date(TEMP_OTP_STORE[phoneNumber].expiresAt).toLocaleString()}`);
  console.log('============================================================');
  console.log('');

  return otpCode;
}

/**
 * Helper: Send OTP email via Resend using html: param (no extra deps needed).
 */
async function sendOTPEmail(
  resendApiKey: string,
  toEmail: string,
  otpCode: string,
  firstName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: 'Shelf-Bidder <noreply@opsguard.dev>',
      to: [toEmail],
      subject: 'Verify your Shelf-Bidder Account',
      html: getOTPEmailHtml(otpCode, firstName),
    });

    if (error) {
      console.error('[Resend Error]', error);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] ✅ OTP email sent to ${toEmail} (id: ${data?.id})`);
    return { success: true };
  } catch (err: unknown) {
    console.error('[Resend Exception]', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

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
      LOCAL_DEV_USERS[phoneNumber] = { name, password };
      console.log(`[Local Dev] Registered user: ${phoneNumber} (${name})`);
      return NextResponse.json({ message: 'Account created. Please verify your phone number.' }, { status: 201 });
    }
    // ── End local dev mock ───────────────────────────────────────────

    // Real AWS Cognito Registration
    const { getAWSConfig } = await import('@/types/aws-config');
    const { CognitoIdentityProviderClient, SignUpCommand } = await import('@aws-sdk/client-cognito-identity-provider');

    const config = getAWSConfig();
    const client = new CognitoIdentityProviderClient({ region: config.region });

    // Step 1: Create user in Cognito (UNCONFIRMED)
    const command = new SignUpCommand({
      ClientId: config.userPoolClientId,
      Username: phoneNumber,
      Password: password,
      UserAttributes: [
        { Name: 'name', Value: name || 'Shopkeeper' },
        { Name: 'phone_number', Value: phoneNumber },
        { Name: 'email', Value: email },
      ],
    });

    await client.send(command);

    // 2. Generate and store OTP (with name for later DynamoDB creation)
    const otpCode = generateAndStoreOTP(phoneNumber, email, name);

    // Step 3: Send OTP via Resend email
    let emailSent = false;
    if (config.resendApiKey) {
      const result = await sendOTPEmail(config.resendApiKey, email, otpCode, name || 'Shopkeeper');
      emailSent = result.success;
    }

    return NextResponse.json(
      {
        message: emailSent
          ? 'Account created successfully. Please check your email for the verification code.'
          : 'Account created successfully. Check server console for OTP code.',
        emailSent,
        otpInConsole: true,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Sign up error:', error);

    const errName = error instanceof Error ? error.name : '';
    const errMessage = error instanceof Error ? error.message : 'An error occurred during sign up';

    if (errName === 'UsernameExistsException') {
      return NextResponse.json(
        { error: 'UsernameExistsException', message: 'An account with this phone number already exists.' },
        { status: 409 }
      );
    }

    if (errName === 'InvalidPasswordException') {
      return NextResponse.json(
        {
          error: 'InvalidPasswordException',
          message: errMessage || 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: errName || 'Internal server error', message: errMessage },
      { status: 500 }
    );
  }
}
