/**
 * Resend OTP API Route
 * Resends verification code to user's email
 */

import { NextRequest, NextResponse } from 'next/server';
import { TEMP_OTP_STORE } from '../signup/route';

// Support both POST and GET for flexibility
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
        // If no body, try query params
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
    } catch (e) {
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
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    
    return NextResponse.json(
      { error: error.name || 'Internal server error', message: error.message || 'Failed to resend verification code' },
      { status: 500 }
    );
  }
}

async function handleResendOTP(phoneNumber: string, email: string | null) {
  try {

    // Check if there's an existing OTP for this phone number
    const existingOTP = TEMP_OTP_STORE[phoneNumber];
    
    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Update OTP store
    TEMP_OTP_STORE[phoneNumber] = {
      code: otpCode,
      email: email || existingOTP?.email || '',
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    // Send OTP via email (if Resend is configured)
    const { getAWSConfig } = await import('@/types/aws-config');
    const config = getAWSConfig();

    if (config.resendApiKey) {
      try {
        const React = await import('react');
        const { Resend } = await import('resend');
        const { OTPTemplate } = await import('@/lib/email/templates/OTPTemplate');
        const ReactDOMServer = (await import('react-dom/server')).default;

        const resend = new Resend(config.resendApiKey);
        const emailHtml = ReactDOMServer.renderToStaticMarkup(
          React.createElement(OTPTemplate, { otpCode, firstName: 'User' })
        );

        const targetEmail = email || existingOTP?.email;
        if (!targetEmail) {
          throw new Error('No email address available');
        }

        const { data, error } = await resend.emails.send({
          from: 'Shelf-Bidder Verification <onboarding@resend.dev>',
          to: targetEmail,
          subject: 'Your New Verification Code',
          html: emailHtml,
        });

        if (error) {
          console.error('[Resend Error]', error);
          
          // In development, log OTP to console
          if (process.env.NODE_ENV !== 'production') {
            console.log('='.repeat(60));
            console.log('🔐 RESEND OTP - DEVELOPMENT MODE');
            console.log('='.repeat(60));
            console.log(`Phone: ${phoneNumber}`);
            console.log(`Email: ${targetEmail}`);
            console.log(`OTP: ${otpCode}`);
            console.log(`Expires: ${new Date(TEMP_OTP_STORE[phoneNumber].expiresAt).toLocaleString()}`);
            console.log('='.repeat(60));
          }

          // Don't fail in development
          if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json(
              { 
                message: 'OTP resent successfully. Check server console for code.',
                devMode: true,
                otpInConsole: true
              },
              { status: 200 }
            );
          }

          return NextResponse.json(
            { error: 'EmailServiceError', message: 'Failed to send verification code' },
            { status: 500 }
          );
        }

        console.log(`[Resend] Successfully resent OTP to ${targetEmail}, id: ${data?.id}`);
        
        return NextResponse.json(
          { message: 'Verification code resent successfully. Please check your email.' },
          { status: 200 }
        );
      } catch (emailError) {
        console.error('[Email Error]', emailError);
        
        // In development, log OTP as fallback
        if (process.env.NODE_ENV !== 'production') {
          console.log('='.repeat(60));
          console.log('🔐 RESEND OTP - DEVELOPMENT MODE (Email Failed)');
          console.log('='.repeat(60));
          console.log(`Phone: ${phoneNumber}`);
          console.log(`Email: ${email || existingOTP?.email}`);
          console.log(`OTP: ${otpCode}`);
          console.log('='.repeat(60));
          
          return NextResponse.json(
            { 
              message: 'OTP resent successfully. Check server console for code.',
              devMode: true,
              otpInConsole: true
            },
            { status: 200 }
          );
        }

        throw emailError;
      }
    } else {
      // No Resend API key - log OTP to console
      console.log('='.repeat(60));
      console.log('🔐 RESEND OTP - NO API KEY');
      console.log('='.repeat(60));
      console.log(`Phone: ${phoneNumber}`);
      console.log(`Email: ${email || existingOTP?.email}`);
      console.log(`OTP: ${otpCode}`);
      console.log('='.repeat(60));
      
      return NextResponse.json(
        { 
          message: 'OTP resent successfully. Check server console for code.',
          devMode: true,
          otpInConsole: true
        },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error('Handle Resend OTP error:', error);
    
    return NextResponse.json(
      { error: error.name || 'Internal server error', message: error.message || 'Failed to resend verification code' },
      { status: 500 }
    );
  }
}
