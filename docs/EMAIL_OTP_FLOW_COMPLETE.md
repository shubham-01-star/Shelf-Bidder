# Email OTP Flow - Complete Implementation

## Overview

Complete email-based OTP verification system using Resend for both **Shopkeepers** and **Brands**.

---

## ✅ What's Implemented

### 1. Shopkeeper Auth Flow (Email OTP)

**Signup:** `POST /api/auth/signup`
- User provides: phone, email, password, name
- System generates 6-digit OTP
- OTP sent via Resend email
- OTP stored in memory with 10-minute expiration
- OTP also logged to console for testing

**Verify:** `POST /api/auth/verify`
- User provides: phone, OTP code
- System validates OTP
- Confirms account in AWS Cognito
- Creates shopkeeper record in database
- **Sends welcome email** 🎉
- Cleans up OTP from memory

**Welcome Email:**
- Personalized with shopkeeper name
- 3-step getting started guide
- Scan shelf → Get matched → Place & earn
- Call-to-action button

---

### 2. Brand Auth Flow (Email OTP)

**Signup:** `POST /api/brand/auth` (action: signup)
- Brand provides: email, password, brandName, contactPerson
- System generates 6-digit OTP
- OTP sent via Resend email
- OTP stored in memory with 10-minute expiration

**Verify:** `POST /api/brand/auth/verify`
- Brand provides: email, OTP code
- System validates OTP
- Confirms account in AWS Cognito
- **Sends welcome email** 🎉
- Cleans up OTP from memory

**Welcome Email:**
- Personalized with brand name
- 3-step campaign creation guide
- Recharge wallet → Create campaign → Track results
- Call-to-action button

---

## Email Templates

### OTP Email (Both Shopkeeper & Brand)

**Subject:** `{OTP} is your Shelf-Bidder verification code`

**Features:**
- ✅ Gradient green header with branding
- ✅ Large, readable 6-digit OTP code
- ✅ 10-minute expiration notice
- ✅ Security warning (never share code)
- ✅ Professional footer with support email
- ✅ Mobile-responsive design

**Template Location:** `src/lib/email/resend-client.ts` → `sendOTPEmail()`

---

### Welcome Email (Shopkeeper)

**Subject:** `Welcome to Shelf-Bidder! 🎉`

**Content:**
- Personalized greeting
- 3-step getting started guide:
  1. 📷 Scan Your Shelf
  2. 🎯 Get Matched
  3. 💰 Place & Earn
- Green "Get Started Now" button
- Support contact information

**Template Location:** `src/lib/email/resend-client.ts` → `sendWelcomeEmail()` (userType: 'shopkeeper')

---

### Welcome Email (Brand)

**Subject:** `Welcome to Shelf-Bidder! 🎉`

**Content:**
- Personalized greeting
- 3-step campaign creation guide:
  1. 💳 Recharge Your Wallet
  2. 🎯 Create Campaign
  3. 📊 Track Results
- Green "Get Started Now" button
- Support contact information

**Template Location:** `src/lib/email/resend-client.ts` → `sendWelcomeEmail()` (userType: 'brand')

---

## API Endpoints

### Shopkeeper Auth

#### 1. Signup
```
POST /api/auth/signup
```

**Request:**
```json
{
  "phoneNumber": "+919876543210",
  "email": "shopkeeper@example.com",
  "password": "SecurePass123!",
  "name": "Ramesh Kumar"
}
```

**Response:**
```json
{
  "message": "Account created successfully. Please check your email for the verification code.",
  "emailSent": true,
  "otpInConsole": true
}
```

#### 2. Verify
```
POST /api/auth/verify
```

**Request:**
```json
{
  "phoneNumber": "+919876543210",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Account verified successfully."
}
```

---

### Brand Auth

#### 1. Signup
```
POST /api/brand/auth
```

**Request:**
```json
{
  "action": "signup",
  "email": "brand@example.com",
  "password": "SecurePass123!",
  "brandName": "Pepsi India",
  "contactPerson": "John Doe"
}
```

**Response:**
```json
{
  "message": "Account created successfully. Please check your email for the verification code.",
  "requiresVerification": true
}
```

#### 2. Verify
```
POST /api/brand/auth/verify
```

**Request:**
```json
{
  "email": "brand@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Brand Account verified successfully."
}
```

---

## Flow Diagrams

### Shopkeeper Signup Flow

```
1. User fills signup form
   ↓
2. POST /api/auth/signup
   ↓
3. System creates Cognito user (UNCONFIRMED)
   ↓
4. System generates 6-digit OTP
   ↓
5. OTP stored in memory (10 min expiry)
   ↓
6. OTP sent via Resend email
   ↓
7. User receives email with OTP
   ↓
8. User enters OTP on verify page
   ↓
9. POST /api/auth/verify
   ↓
10. System validates OTP
    ↓
11. System confirms Cognito account
    ↓
12. System creates shopkeeper in database
    ↓
13. System sends welcome email
    ↓
14. User receives welcome email
    ↓
15. User redirected to dashboard
```

### Brand Signup Flow

```
1. Brand fills signup form
   ↓
2. POST /api/brand/auth (action: signup)
   ↓
3. System creates Cognito user (UNCONFIRMED)
   ↓
4. System generates 6-digit OTP
   ↓
5. OTP stored in memory (10 min expiry)
   ↓
6. OTP sent via Resend email
   ↓
7. Brand receives email with OTP
   ↓
8. Brand enters OTP on verify page
   ↓
9. POST /api/brand/auth/verify
   ↓
10. System validates OTP
    ↓
11. System confirms Cognito account
    ↓
12. System sends welcome email
    ↓
13. Brand receives welcome email
    ↓
14. Brand redirected to dashboard
```

---

## Configuration

### Environment Variables

```bash
# Resend API Key (already configured)
RESEND_API_KEY=re_FC8YXgj1_7Dwq9DwuyxvxoBDUsm9A7Sd9

# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AWS Cognito (already configured)
AWS_REGION=ap-south-1
```

### Email Settings

**From Address:** `Shelf-Bidder <onboarding@resend.dev>`

**Note:** In production, update to your verified domain:
```typescript
const FROM_EMAIL = 'Shelf-Bidder <noreply@yourdomain.com>';
```

---

## Testing

### Test Shopkeeper Flow

1. Go to `/auth/signup`
2. Fill form with:
   - Phone: +919876543210
   - Email: your-email@example.com
   - Password: Test@1234
   - Name: Test User
3. Check email for OTP
4. Go to `/auth/verify`
5. Enter OTP code
6. Check email for welcome message

### Test Brand Flow

1. Go to `/brand/auth/signup`
2. Fill form with:
   - Email: your-email@example.com
   - Password: Test@1234
   - Brand Name: Test Brand
   - Contact Person: Test Person
3. Check email for OTP
4. Go to `/brand/auth/verify`
5. Enter OTP code
6. Check email for welcome message

### Console Logs

**OTP Generation:**
```
============================================================
🔐 OTP CODE
============================================================
  Phone:   +919876543210
  Email:   user@example.com
  Name:    Test User
  OTP:     123456
  Expires: 3/7/2026, 10:40:00 AM
============================================================
```

**Email Sent:**
```
[Resend] ✅ OTP email sent to user@example.com, ID: abc123
[Resend] ✅ Welcome email sent to user@example.com, ID: def456
```

---

## Files Updated

### Modified Files

1. **src/app/api/auth/verify/route.ts**
   - Added welcome email after verification
   - Imports `sendWelcomeEmail` from resend-client
   - Sends email with userType: 'shopkeeper'

2. **src/app/api/brand/auth/route.ts**
   - Updated to use `sendOTPEmail` from resend-client
   - Removed custom template imports
   - Simplified email sending logic

3. **src/app/api/brand/auth/verify/route.ts**
   - Added welcome email after verification
   - Imports `sendWelcomeEmail` from resend-client
   - Sends email with userType: 'brand'

### Existing Files (Already Had Email)

1. **src/app/api/auth/signup/route.ts**
   - Already had Resend OTP email integration
   - No changes needed

2. **src/lib/email/resend-client.ts**
   - Email service with OTP and welcome templates
   - Created in previous step

---

## Email Delivery Status

### Success Indicators

**OTP Email:**
- ✅ Console log: `[Resend] ✅ OTP email sent to {email}, ID: {id}`
- ✅ User receives email within 1-2 minutes
- ✅ OTP code is readable and correct

**Welcome Email:**
- ✅ Console log: `[Welcome Email] ✅ Sent to {email}`
- ✅ User receives email after verification
- ✅ Email contains personalized content

### Error Handling

**Email Send Failure:**
- ❌ Console log: `[Resend Error] {error}`
- ⚠️ Verification still succeeds (email is optional)
- 📝 Error logged but doesn't block user flow

**Sandbox Mode:**
- ⚠️ Resend sandbox only sends to verified email
- 💡 Use your verified Resend account email for testing
- 🔧 Add domain verification for production

---

## Production Checklist

### Before Going Live

1. **Domain Verification**
   - [ ] Add domain to Resend
   - [ ] Verify DNS records (SPF, DKIM, DMARC)
   - [ ] Update FROM_EMAIL to your domain
   - [ ] Test email deliverability

2. **Email Templates**
   - [ ] Review all email content
   - [ ] Test on multiple email clients
   - [ ] Check mobile responsiveness
   - [ ] Verify all links work

3. **Security**
   - [ ] Rotate Resend API key
   - [ ] Add rate limiting for OTP requests
   - [ ] Implement CAPTCHA on signup
   - [ ] Add email verification retry limits

4. **Monitoring**
   - [ ] Set up email delivery monitoring
   - [ ] Track OTP success/failure rates
   - [ ] Monitor email bounce rates
   - [ ] Set up alerts for failures

---

## Summary

### ✅ Complete Email Flow

**Shopkeepers:**
- ✅ OTP email on signup
- ✅ Welcome email after verification
- ✅ Personalized content
- ✅ Getting started guide

**Brands:**
- ✅ OTP email on signup
- ✅ Welcome email after verification
- ✅ Personalized content
- ✅ Campaign creation guide

**Both:**
- ✅ Professional HTML templates
- ✅ Mobile-responsive design
- ✅ Security warnings
- ✅ Support contact info
- ✅ Branding and styling

---

**Ready for hackathon demo! 🚀**

All email flows are working for both shopkeepers and brands with beautiful templates and proper error handling.
