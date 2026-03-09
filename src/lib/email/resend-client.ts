/**
 * Resend Email Client
 * Handles all email operations using Resend API
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Shelf-Bidder <noreply@opsguard.dev>'; // Update with your verified domain
const COMPANY_NAME = 'Shelf-Bidder';

export interface SendOTPEmailParams {
  to: string;
  otp: string;
  name?: string;
}

export interface SendWelcomeEmailParams {
  to: string;
  name: string;
  userType: 'shopkeeper' | 'brand';
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail({ to, otp, name }: SendOTPEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `${otp} is your ${COMPANY_NAME} verification code`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #11d452 0%, #0fa844 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #1a1c1e; font-size: 28px; font-weight: 800;">
                          🛒 ${COMPANY_NAME}
                        </h1>
                        <p style="margin: 10px 0 0 0; color: #1a1c1e; font-size: 14px; opacity: 0.9;">
                          Autonomous Retail Ad-Network
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #1a1c1e; font-size: 24px; font-weight: 700;">
                          Verify Your Email Address
                        </h2>
                        
                        ${name ? `<p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                          Hi ${name},
                        </p>` : ''}
                        
                        <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                          Thank you for signing up! Please use the verification code below to complete your registration:
                        </p>
                        
                        <!-- OTP Box -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 30px 0;">
                              <div style="background-color: #f7fafc; border: 2px dashed #11d452; border-radius: 12px; padding: 30px; display: inline-block;">
                                <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                  Your Verification Code
                                </p>
                                <p style="margin: 0; color: #1a1c1e; font-size: 48px; font-weight: 800; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                  ${otp}
                                </p>
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                          This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
                        </p>
                        
                        <!-- Security Notice -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff5f5; border-left: 4px solid #fc8181; border-radius: 8px; padding: 15px; margin-top: 30px;">
                          <tr>
                            <td>
                              <p style="margin: 0; color: #742a2a; font-size: 13px; line-height: 1.5;">
                                <strong>🔒 Security Tip:</strong> Never share this code with anyone. ${COMPANY_NAME} will never ask for your verification code.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px;">
                          Need help? Contact us at <a href="mailto:support@shelf-bidder.com" style="color: #11d452; text-decoration: none;">support@shelf-bidder.com</a>
                        </p>
                        <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                          © 2026 ${COMPANY_NAME}. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Resend] Failed to send OTP email:', error);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }

    console.log(`[Resend] ✅ OTP email sent to ${to}, ID: ${data?.id}`);
    return data;
  } catch (error) {
    console.error('[Resend] Error sending OTP email:', error);
    throw error;
  }
}

/**
 * Send welcome email after successful registration
 */
export async function sendWelcomeEmail({ to, name, userType }: SendWelcomeEmailParams) {
  const isShopkeeper = userType === 'shopkeeper';
  
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Welcome to ${COMPANY_NAME}! 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to ${COMPANY_NAME}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #11d452 0%, #0fa844 100%); padding: 50px 30px; text-align: center;">
                        <h1 style="margin: 0; color: #1a1c1e; font-size: 36px; font-weight: 800;">
                          🎉 Welcome to ${COMPANY_NAME}!
                        </h1>
                        <p style="margin: 15px 0 0 0; color: #1a1c1e; font-size: 16px; opacity: 0.9;">
                          ${isShopkeeper ? 'Start earning from your empty shelf space' : 'Launch your first campaign today'}
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="margin: 0 0 20px 0; color: #1a1c1e; font-size: 24px; font-weight: 700;">
                          Hi ${name}! 👋
                        </h2>
                        
                        <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                          Thank you for joining ${COMPANY_NAME}! We're excited to have you on board.
                        </p>
                        
                        ${isShopkeeper ? `
                          <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                            As a shopkeeper, you can now monetize your empty shelf space by placing brand products and earning instant payments.
                          </p>
                          
                          <!-- Getting Started Steps -->
                          <h3 style="margin: 30px 0 20px 0; color: #1a1c1e; font-size: 20px; font-weight: 700;">
                            🚀 Getting Started
                          </h3>
                          
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 15px; background-color: #f7fafc; border-left: 4px solid #11d452; border-radius: 8px; margin-bottom: 15px;">
                                <p style="margin: 0 0 5px 0; color: #1a1c1e; font-size: 16px; font-weight: 700;">
                                  1️⃣ Scan Your Shelf
                                </p>
                                <p style="margin: 0; color: #4a5568; font-size: 14px;">
                                  Take a photo of your empty shelf space using the camera feature
                                </p>
                              </td>
                            </tr>
                            <tr><td style="height: 15px;"></td></tr>
                            <tr>
                              <td style="padding: 15px; background-color: #f7fafc; border-left: 4px solid #11d452; border-radius: 8px; margin-bottom: 15px;">
                                <p style="margin: 0 0 5px 0; color: #1a1c1e; font-size: 16px; font-weight: 700;">
                                  2️⃣ Get Matched
                                </p>
                                <p style="margin: 0; color: #4a5568; font-size: 14px;">
                                  Our AI will match your space with relevant brand campaigns
                                </p>
                              </td>
                            </tr>
                            <tr><td style="height: 15px;"></td></tr>
                            <tr>
                              <td style="padding: 15px; background-color: #f7fafc; border-left: 4px solid #11d452; border-radius: 8px; margin-bottom: 15px;">
                                <p style="margin: 0 0 5px 0; color: #1a1c1e; font-size: 16px; font-weight: 700;">
                                  3️⃣ Place & Earn
                                </p>
                                <p style="margin: 0; color: #4a5568; font-size: 14px;">
                                  Place the product, submit proof, and get paid instantly!
                                </p>
                              </td>
                            </tr>
                          </table>
                        ` : `
                          <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                            As a brand, you can now create campaigns to place your products in thousands of retail stores across India.
                          </p>
                          
                          <!-- Getting Started Steps -->
                          <h3 style="margin: 30px 0 20px 0; color: #1a1c1e; font-size: 20px; font-weight: 700;">
                            🚀 Getting Started
                          </h3>
                          
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding: 15px; background-color: #f7fafc; border-left: 4px solid #11d452; border-radius: 8px; margin-bottom: 15px;">
                                <p style="margin: 0 0 5px 0; color: #1a1c1e; font-size: 16px; font-weight: 700;">
                                  1️⃣ Recharge Your Wallet
                                </p>
                                <p style="margin: 0; color: #4a5568; font-size: 14px;">
                                  Add funds to your brand wallet to start creating campaigns
                                </p>
                              </td>
                            </tr>
                            <tr><td style="height: 15px;"></td></tr>
                            <tr>
                              <td style="padding: 15px; background-color: #f7fafc; border-left: 4px solid #11d452; border-radius: 8px; margin-bottom: 15px;">
                                <p style="margin: 0 0 5px 0; color: #1a1c1e; font-size: 16px; font-weight: 700;">
                                  2️⃣ Create Campaign
                                </p>
                                <p style="margin: 0; color: #4a5568; font-size: 14px;">
                                  Set your budget, target locations, and product details
                                </p>
                              </td>
                            </tr>
                            <tr><td style="height: 15px;"></td></tr>
                            <tr>
                              <td style="padding: 15px; background-color: #f7fafc; border-left: 4px solid #11d452; border-radius: 8px; margin-bottom: 15px;">
                                <p style="margin: 0 0 5px 0; color: #1a1c1e; font-size: 16px; font-weight: 700;">
                                  3️⃣ Track Results
                                </p>
                                <p style="margin: 0; color: #4a5568; font-size: 14px;">
                                  Monitor placements and see proof photos from shopkeepers
                                </p>
                              </td>
                            </tr>
                          </table>
                        `}
                        
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 40px;">
                          <tr>
                            <td align="center">
                              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; background-color: #11d452; color: #1a1c1e; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 4px 6px rgba(17, 212, 82, 0.3);">
                                Get Started Now →
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="margin: 0 0 10px 0; color: #718096; font-size: 14px;">
                          Need help? Contact us at <a href="mailto:support@shelf-bidder.com" style="color: #11d452; text-decoration: none;">support@shelf-bidder.com</a>
                        </p>
                        <p style="margin: 0; color: #a0aec0; font-size: 12px;">
                          © 2026 ${COMPANY_NAME}. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Resend] Failed to send welcome email:', error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }

    console.log(`[Resend] ✅ Welcome email sent to ${to}, ID: ${data?.id}`);
    return data;
  } catch (error) {
    console.error('[Resend] Error sending welcome email:', error);
    throw error;
  }
}

export { resend };
