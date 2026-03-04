/**
 * Resend OTP API Route
 * Resends verification code to user's email.
 * Uses Resend's `react:` param (official pattern).
 * OTP is always logged to console.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { TEMP_OTP_STORE } from '../signup/route';

/**
 * Generate OTP HTML email body (inline — no extra dependencies)
 */
function getOTPEmailHtml(otpCode: string): string {
  return `
    <div style="background-color:#f6f9fc;padding:40px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
      <div style="background-color:#fff;border:1px solid #e6ebf1;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);max-width:500px;margin:0 auto;padding:32px;text-align:center">
        <h1 style="color:#0f172a;font-size:24px;font-weight:700;margin:0 0 24px 0">Shelf-Bidder Verification</h1>
        <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px 0;text-align:left">Here is your new verification code:</p>
        <div style="background-color:#f8fafc;border:2px dashed #94a3b8;border-radius:12px;margin:32px 0;padding:24px">
          <span style="color:#0f172a;font-size:36px;font-weight:800;letter-spacing:8px">${otpCode}</span>
        </div>
        <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px 0;text-align:left">This code will expire in 10 minutes.</p>
        <hr style="border-top:1px solid #e6ebf1;border-left:none;border-right:none;border-bottom:none;margin:32px 0"/>
        <p style="color:#64748b;font-size:14px;margin:0">© ${new Date().getFullYear()} Shelf-Bidder. All rights reserved.</p>
      </div>
    </div>
  `;
}

/**
 * Generate new OTP, store it, and always log to console.
 */
function generateAndStoreOTP(phoneNumber: string, email: string): string {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  TEMP_OTP_STORE[phoneNumber] = {
    code: otpCode,
    email,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };

  console.log('');
  console.log('============================================================');
  console.log('🔐 RESEND OTP CODE');
  console.log('============================================================');
  console.log(`  Phone:   ${phoneNumber}`);
  console.log(`  Email:   ${email}`);
  console.log(`  OTP:     ${otpCode}`);
  console.log(`  Expires: ${new Date(TEMP_OTP_STORE[phoneNumber].expiresAt).toLocaleString()}`);
  console.log('============================================================');
  console.log('');

  return otpCode;
}

/**
 * Send OTP email via Resend using html: param.
 */
async function sendOTPEmail(
  resendApiKey: string,
  toEmail: string,
  otpCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: 'Shelf-Bidder <onboarding@resend.dev>',
      to: [toEmail],
      subject: 'Your New Verification Code',
      html: getOTPEmailHtml(otpCode),
    });

    if (error) {
      console.error('[Resend Error]', error);
      return { success: false, error: error.message };
    }

    console.log(`[Resend] ✅ OTP resent to ${toEmail} (id: ${data?.id})`);
    return { success: true };
  } catch (err: unknown) {
    console.error('[Resend Exception]', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Support GET for convenience
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const phoneNumber = url.searchParams.get('phone');

  if (!phoneNumber) {
    return NextResponse.json(
      { error: 'Missing phone number', message: 'Phone number is required in query params' },
      { status: 400 }
    );
  }

  return handleResendOTP(phoneNumber, null);
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      } else {
        const url = new URL(request.url);
        const phoneFromQuery = url.searchParams.get('phone');
        if (phoneFromQuery) {
          body = { phoneNumber: phoneFromQuery };
        } else {
          return NextResponse.json(
            { error: 'Missing request body', message: 'Phone number is required' },
            { status: 400 }
          );
        }
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON', message: 'Request body must be valid JSON' },
        { status: 400 }
      );
    }

    const { phoneNumber, email } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Missing phone number', message: 'Phone number is required' },
        { status: 400 }
      );
    }

    return handleResendOTP(phoneNumber, email);
  } catch (error: unknown) {
    console.error('Resend OTP error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to resend verification code';
    return NextResponse.json(
      { error: 'Internal server error', message: errMsg },
      { status: 500 }
    );
  }
}

async function handleResendOTP(phoneNumber: string, email: string | null) {
  try {
    const existingOTP = TEMP_OTP_STORE[phoneNumber];
    const targetEmail = email || existingOTP?.email || '';

    if (!targetEmail) {
      return NextResponse.json(
        { error: 'No email found', message: 'No email address available for this phone number. Please sign up again.' },
        { status: 400 }
      );
    }

    // Generate new OTP & log to console
    const otpCode = generateAndStoreOTP(phoneNumber, targetEmail);

    // Send via Resend email
    const { getAWSConfig } = await import('@/types/aws-config');
    const config = getAWSConfig();

    let emailSent = false;
    if (config.resendApiKey) {
      const result = await sendOTPEmail(config.resendApiKey, targetEmail, otpCode);
      emailSent = result.success;
    }

    return NextResponse.json(
      {
        message: emailSent
          ? 'Verification code resent successfully. Please check your email.'
          : 'OTP resent successfully. Check server console for code.',
        emailSent,
        otpInConsole: true,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Handle Resend OTP error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to resend verification code';
    return NextResponse.json(
      { error: 'Internal server error', message: errMsg },
      { status: 500 }
    );
  }
}
