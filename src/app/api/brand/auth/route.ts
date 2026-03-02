/**
 * Brand Auth API
 * POST /api/brand/auth
 * Production-ready AWS Cognito and Resend Email OTP
 */

import { NextRequest, NextResponse } from 'next/server';

export const BRAND_TEMP_OTP_STORE: Record<string, { code: string; email: string; expiresAt: number; brandName?: string; contactPerson?: string }> = {};

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

    const { getAWSConfig } = await import('@/types/aws-config');
    const { CognitoIdentityProviderClient, SignUpCommand, InitiateAuthCommand } = await import('@aws-sdk/client-cognito-identity-provider');
    const config = getAWSConfig();
    const client = new CognitoIdentityProviderClient({ region: config.region });

    // ==========================================
    // BRAND SIGNUP FLOW
    // ==========================================
    if (action === 'signup') {
      if (!brandName) {
        return NextResponse.json(
          { error: 'Brand name is required for signup' },
          { status: 400 }
        );
      }

      // Step 1: Create the User in Cognito
      const command = new SignUpCommand({
        ClientId: config.userPoolClientId,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'name', Value: brandName },
          { Name: 'email', Value: email },
        ],
      });

      await client.send(command);

      // Step 2: Generate custom 6-digit OTP for Email verification
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Step 3: Store OTP temporarily 
      BRAND_TEMP_OTP_STORE[email] = {
        code: otpCode,
        email: email,
        brandName,
        contactPerson,
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      };

      // Step 4: Send the OTP via Resend Email
      if (config.resendApiKey) {
        const React = await import('react');
        const { Resend } = await import('resend');
        const { BrandOTPTemplate } = await import('@/lib/email/templates/BrandOTPTemplate');
        const ReactDOMServer = (await import('react-dom/server')).default;

        const resend = new Resend(config.resendApiKey);
        const emailHtml = ReactDOMServer.renderToStaticMarkup(
          React.createElement(BrandOTPTemplate, { otpCode, brandName, contactPerson: contactPerson || 'Brand Partner' })
        );
        
        const { data, error } = await resend.emails.send({
          from: 'Shelf-Bidder Corporate <onboarding@resend.dev>',
          to: email,
          subject: 'Verify your Shelf-Bidder Brand Account',
          html: emailHtml,
        });
        
        if (error) {
          console.error('[Resend Error]', error);
          let errorMessage = 'Failed to send verification email.';
          if (error.name === 'validation_error' && error.message.includes('own email address')) {
            errorMessage = 'Resend is in Sandbox mode. You can ONLY send emails to your verified Resend account email. Please use that email to test.';
          }
          return NextResponse.json({ error: 'EmailServiceError', message: errorMessage }, { status: 500 });
        }
        console.log(`[Resend] Successfully sent OTP to Brand ${email}, id: ${data?.id}`);
      } else {
        console.warn(`[Warning] No RESEND_API_KEY found! OTP for ${email} is ${otpCode}`);
      }

      return NextResponse.json(
        { message: 'Account created successfully. Please check your email for the verification code.', requiresVerification: true },
        { status: 201 }
      );
    }

    // ==========================================
    // BRAND LOGIN FLOW
    // ==========================================
    const loginCommand = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: config.userPoolClientId,
      AuthParameters: {
        USERNAME: email, // Brand uses email to login
        PASSWORD: password,
      },
    });

    const authResponse = await client.send(loginCommand);

    if (authResponse.AuthenticationResult) {
      // Decode JWT token directly in Next.js to extract user details
      const idToken = authResponse.AuthenticationResult.IdToken;
      let brandNameFromToken = email.split('@')[0];
      let brandId = `brand-${Date.now()}`; // Fallback
      
      try {
        if (idToken) {
          const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
          brandNameFromToken = payload.name || brandNameFromToken;
          brandId = payload.sub || brandId;
        }
      } catch (e) {
        console.error('Failed to parse Token Payload', e);
      }

      return NextResponse.json({
        success: true,
        token: authResponse.AuthenticationResult.AccessToken, // Or ID Token based on client structure
        brand: {
          id: brandId,
          brandName: brandNameFromToken,
          email,
          totalSpent: 0, // In prod this would come from DynamoDB
          auctionsWon: 0,
          createdAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json(
      { error: 'NotAuthorizedException', message: 'Authentication failed. Please check your credentials.' },
      { status: 401 }
    );

  } catch (error: any) {
    console.error('Brand auth error:', error);

    if (error.name === 'NotAuthorizedException') {
      return NextResponse.json({ error: 'NotAuthorizedException', message: 'Incorrect email or password.' }, { status: 401 });
    }
    if (error.name === 'UserNotFoundException') {
      return NextResponse.json({ error: 'UserNotFoundException', message: 'Account not found. Please sign up first.' }, { status: 404 });
    }
    if (error.name === 'UserNotConfirmedException') {
      return NextResponse.json({ error: 'UserNotConfirmedException', message: 'Please verify your email address first.' }, { status: 403 });
    }
    if (error.name === 'UsernameExistsException') {
      return NextResponse.json({ error: 'UsernameExistsException', message: 'An account with this email already exists.' }, { status: 409 });
    }
    if (error.name === 'InvalidPasswordException') {
      return NextResponse.json({ 
        error: 'InvalidPasswordException', 
        message: error.message || 'Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.' 
      }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Authentication failed', message: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
