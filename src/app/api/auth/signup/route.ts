/**
 * Sign Up API Route
 * Handles shopkeeper registration with AWS Cognito.
 * In local dev (no real Cognito), stores user in-memory for testing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { LOCAL_DEV_USERS } from '../signin/route';

export const TEMP_OTP_STORE: Record<string, { code: string; email: string; expiresAt: number; password?: string; name?: string }> = {};

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
      // Register user in-memory
      LOCAL_DEV_USERS[phoneNumber] = { name, password };
      console.log(`[Local Dev] Registered user: ${phoneNumber} (${name})`);
      return NextResponse.json({ message: 'Account created. Please verify your phone number.' }, { status: 201 });
    }
    // ── End local dev mock ───────────────────────────────────────────

    // Real AWS Cognito Registration (Unconfirmed)
    const { getAWSConfig } = await import('@/types/aws-config');
    const { CognitoIdentityProviderClient, SignUpCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    
    // We import Resend for the Email OTP
    const React = await import('react');
    const { Resend } = await import('resend');
    const { OTPTemplate } = await import('@/lib/email/templates/OTPTemplate');
    const ReactDOMServer = (await import('react-dom/server')).default;
    
    const config = getAWSConfig();
    const client = new CognitoIdentityProviderClient({ region: config.region });

    // Step 1: Create the Unconfirmed User in Cognito
    const command = new SignUpCommand({
      ClientId: config.userPoolClientId,
      Username: phoneNumber,
      Password: password,
      UserAttributes: [
        { Name: 'name', Value: name || 'Shopkeeper' },
        { Name: 'phone_number', Value: phoneNumber }, // Commenting this out from Cognito verification
        { Name: 'email', Value: email }
      ],
    });

    await client.send(command);

    // Step 2: Generate custom 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Step 3: Store OTP temporarily 
    // In production this should be in DynamoDB/Redis, here we use in-memory store for fast Next.js implementation
    TEMP_OTP_STORE[phoneNumber] = {
      code: otpCode,
      email: email,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    // Step 4: Send the OTP via Resend Email (Bypassing AWS SNS limits)
    if (config.resendApiKey) {
      const resend = new Resend(config.resendApiKey);
      const emailHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(OTPTemplate, { otpCode, firstName: name || 'Shopkeeper' })
      );
      
      try {
        const { data, error } = await resend.emails.send({
          from: 'Shelf-Bidder Verification <onboarding@resend.dev>', // You can change this when you add your own domain
          to: email,
          subject: 'Verify your Shelf-Bidder Account',
          html: emailHtml,
        });
        
        if (error) {
          console.error('[Resend Error]', error);
          
          // In development, log OTP to console as fallback
          if (process.env.NODE_ENV !== 'production') {
            console.log('='.repeat(60));
            console.log('🔐 DEVELOPMENT MODE - OTP CODE (Email Failed)');
            console.log('='.repeat(60));
            console.log(`Phone: ${phoneNumber}`);
            console.log(`Email: ${email}`);
            console.log(`OTP: ${otpCode}`);
            console.log(`Expires: ${new Date(TEMP_OTP_STORE[phoneNumber].expiresAt).toLocaleString()}`);
            console.log('='.repeat(60));
            console.log('Note: Resend is in Sandbox mode. Use your verified email or check console for OTP.');
            console.log('='.repeat(60));
          }
          
          let errorMessage = 'Failed to send verification email.';
          
          // Handle Resend Sandbox limitation explicitly
          if (error.name === 'validation_error' && error.message.includes('own email address')) {
            errorMessage = 'Resend is in Sandbox mode. You can ONLY send emails to your verified Resend account email. Please use that email to test, or check the server console for the OTP code.';
          }
          
          // In development, don't fail - allow user to get OTP from console
          if (process.env.NODE_ENV !== 'production') {
            return NextResponse.json(
              { 
                message: 'Account created successfully. Email service is in sandbox mode - check server console for OTP code.',
                devMode: true,
                otpInConsole: true
              },
              { status: 201 }
            );
          }
          
          return NextResponse.json(
            { error: 'EmailServiceError', message: errorMessage },
            { status: 500 }
          );
        }
        
        console.log(`[Resend] Successfully sent OTP to ${email}, id: ${data?.id}`);
      } catch (emailError) {
        console.error('[Email Error]', emailError);
        
        // In development, log OTP as fallback
        if (process.env.NODE_ENV !== 'production') {
          console.log('='.repeat(60));
          console.log('🔐 DEVELOPMENT MODE - OTP CODE (Email Exception)');
          console.log('='.repeat(60));
          console.log(`Phone: ${phoneNumber}`);
          console.log(`Email: ${email}`);
          console.log(`OTP: ${otpCode}`);
          console.log('='.repeat(60));
          
          return NextResponse.json(
            { 
              message: 'Account created successfully. Check server console for OTP code.',
              devMode: true,
              otpInConsole: true
            },
            { status: 201 }
          );
        }
        
        throw emailError;
      }
    } else {
      // No Resend API key - log OTP to console
      console.log('='.repeat(60));
      console.log('🔐 NO RESEND API KEY - OTP CODE');
      console.log('='.repeat(60));
      console.log(`Phone: ${phoneNumber}`);
      console.log(`Email: ${email}`);
      console.log(`OTP: ${otpCode}`);
      console.log('='.repeat(60));
      console.warn(`[Warning] No RESEND_API_KEY found! OTP for ${email} is ${otpCode}`);
    }

    return NextResponse.json(
      { message: 'Account created successfully. Please check your email for the verification code.' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Sign up error:', error);
    
    if (error.name === 'UsernameExistsException') {
      return NextResponse.json(
        { error: 'UsernameExistsException', message: 'An account with this phone number already exists.' },
        { status: 409 }
      );
    }
    
    if (error.name === 'InvalidPasswordException') {
      return NextResponse.json(
        { 
          error: 'InvalidPasswordException', 
          message: error.message || 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.name || 'Internal server error', message: error.message || 'An error occurred during sign up' },
      { status: 500 }
    );
  }
}
