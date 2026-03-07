# Brand Wallet Recharge & Email Flow

## Overview

Complete implementation of brand wallet recharge system and email notifications using Resend for OTP verification and welcome emails.

---

## Features Implemented

### 1. Brand Wallet Recharge System

**API Endpoint:** `POST /api/brand/wallet/recharge`

**Features:**
- Fake payment gateway integration for demo
- Minimum recharge: ₹1,000
- Simulated 2-second processing delay
- Transaction ID generation
- Payment method support (card, UPI)
- Recharge history tracking

**Request:**
```json
{
  "brandId": "brand-001",
  "amount": 10000,
  "paymentMethod": "card"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-recharge-1234567890",
    "orderId": "order-1234567890",
    "brandId": "brand-001",
    "amount": 10000,
    "status": "completed",
    "paymentMethod": "card",
    "message": "Successfully recharged ₹10000 to your brand wallet",
    "timestamp": "2026-03-07T10:30:00.000Z",
    "gateway": {
      "provider": "Razorpay",
      "paymentId": "pay_1234567890",
      "signature": "fake_signature_for_demo"
    }
  }
}
```

### 2. Email Integration with Resend

**Service:** `src/lib/email/resend-client.ts`

#### A. OTP Email
- Sent during signup
- 6-digit verification code
- 10-minute expiration
- Beautiful HTML template
- Security tips included

**Features:**
- Professional email design
- Gradient header with branding
- Large, readable OTP code
- Expiration notice
- Security warning
- Mobile-responsive

#### B. Welcome Email
- Sent after successful verification
- Personalized with user name
- Different content for shopkeepers vs brands
- Getting started guide
- Call-to-action button

**Shopkeeper Welcome:**
- 3-step getting started guide
- Scan shelf → Get matched → Place & earn
- Emphasis on instant payments

**Brand Welcome:**
- 3-step campaign creation guide
- Recharge wallet → Create campaign → Track results
- Emphasis on reach and tracking

### 3. Brand Wallet UI

**Page:** `src/app/brand/wallet/page.tsx`

**Features:**
- Beautiful gradient balance card
- Quick amount selection (₹1K to ₹100K)
- Custom amount input
- Transaction history
- Real-time balance updates
- Processing states with loading spinner
- Success/error alerts

**Quick Amounts:**
- ₹1,000
- ₹5,000
- ₹10,000
- ₹25,000
- ₹50,000
- ₹100,000

---

## User Flows

### Flow 1: Brand Wallet Recharge

```
1. Brand opens wallet page
   ↓
2. Clicks "Recharge Wallet" button
   ↓
3. Modal opens with quick amounts
   ↓
4. Selects amount or enters custom
   ↓
5. Clicks "Recharge" button
   ↓
6. Shows loading spinner (2 seconds)
   ↓
7. API processes payment
   ↓
8. Success alert with transaction ID
   ↓
9. Balance updates immediately
   ↓
10. Transaction added to history
```

### Flow 2: Email OTP Verification

```
1. User signs up with email
   ↓
2. OTP generated and stored
   ↓
3. OTP email sent via Resend
   ↓
4. User receives email with code
   ↓
5. User enters OTP on verify page
   ↓
6. OTP validated against stored code
   ↓
7. Account confirmed in Cognito
   ↓
8. Welcome email sent
   ↓
9. User receives welcome message
```

---

## API Endpoints

### 1. Brand Wallet Recharge

**POST** `/api/brand/wallet/recharge`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "brandId": "string (required)",
  "amount": "number (required, min: 1000)",
  "paymentMethod": "string (optional, default: 'card')"
}
```

**Responses:**

**200 Success:**
```json
{
  "success": true,
  "data": {
    "transactionId": "string",
    "orderId": "string",
    "brandId": "string",
    "amount": "number",
    "status": "completed",
    "paymentMethod": "string",
    "message": "string",
    "timestamp": "ISO 8601 string",
    "gateway": {
      "provider": "Razorpay",
      "paymentId": "string",
      "signature": "string"
    }
  }
}
```

**400 Bad Request:**
```json
{
  "error": "Invalid recharge amount",
  "details": "Amount must be greater than 0"
}
```

### 2. Get Recharge History

**GET** `/api/brand/wallet/recharge?brandId={brandId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "brandId": "string",
    "transactions": [
      {
        "transactionId": "string",
        "orderId": "string",
        "brandId": "string",
        "amount": "number",
        "status": "string",
        "paymentMethod": "string",
        "timestamp": "ISO 8601 string"
      }
    ],
    "totalRecharges": "number",
    "totalAmount": "number"
  }
}
```

---

## Email Templates

### OTP Email Template

**Subject:** `{OTP} is your Shelf-Bidder verification code`

**Features:**
- Gradient green header
- Large OTP code display
- 10-minute expiration notice
- Security warning
- Professional footer

**Variables:**
- `{otp}` - 6-digit code
- `{name}` - User's name (optional)

### Welcome Email Template

**Subject:** `Welcome to Shelf-Bidder! 🎉`

**Features:**
- Celebration header
- Personalized greeting
- Role-specific getting started guide
- Call-to-action button
- Support contact info

**Variables:**
- `{name}` - User's name
- `{userType}` - 'shopkeeper' or 'brand'

---

## Configuration

### Environment Variables

```bash
# Resend API Key (already configured)
RESEND_API_KEY=re_FC8YXgj1_7Dwq9DwuyxvxoBDUsm9A7Sd9

# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Email Settings

**From Address:** `Shelf-Bidder <onboarding@resend.dev>`

**Note:** Update to your verified domain in production:
```typescript
const FROM_EMAIL = 'Shelf-Bidder <noreply@yourdomain.com>';
```

---

## Testing

### Test Brand Wallet Recharge

```bash
node test-brand-wallet-email.js
```

**Tests:**
1. Valid recharge (₹10,000)
2. Amount below minimum (₹500) - should fail
3. Get recharge history
4. Large recharge (₹100,000)

### Test Email Flow

**Manual Testing:**
1. Go to `/auth/signup`
2. Enter email and details
3. Check email for OTP
4. Go to `/auth/verify`
5. Enter OTP code
6. Check email for welcome message

**Console Logs:**
```
[Resend] ✅ OTP email sent to user@example.com (id: xxx)
[Resend] ✅ Welcome email sent to user@example.com (id: xxx)
```

---

## Files Created/Modified

### New Files

1. **src/lib/email/resend-client.ts**
   - Resend email service
   - OTP email function
   - Welcome email function
   - HTML templates

2. **src/app/api/brand/wallet/recharge/route.ts**
   - Brand wallet recharge API
   - GET and POST handlers
   - Mock payment processing

3. **src/app/brand/wallet/page.tsx**
   - Brand wallet UI
   - Recharge modal
   - Transaction history
   - Balance display

4. **test-brand-wallet-email.js**
   - Test script for wallet and email

5. **docs/BRAND_WALLET_EMAIL_FLOW.md**
   - This documentation file

### Modified Files

1. **src/app/api/auth/verify/route.ts**
   - Added welcome email after verification
   - Imports sendWelcomeEmail function
   - Error handling for email failures

---

## Demo Features

### For Hackathon Demo

**Brand Wallet:**
- ✅ Instant recharge (2-second delay)
- ✅ Fake payment gateway (Razorpay simulation)
- ✅ Transaction history
- ✅ Beautiful UI with gradients
- ✅ Quick amount selection
- ✅ Real-time balance updates

**Email System:**
- ✅ Professional OTP emails
- ✅ Welcome emails with getting started guide
- ✅ Role-specific content
- ✅ Mobile-responsive templates
- ✅ Security warnings
- ✅ Branding and styling

---

## Production Considerations

### Payment Gateway Integration

Replace mock with real gateway:

```typescript
// Example: Razorpay integration
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const order = await razorpay.orders.create({
  amount: amount * 100, // Convert to paise
  currency: 'INR',
  receipt: `receipt_${Date.now()}`,
});
```

### Email Domain Verification

1. Add your domain to Resend
2. Verify DNS records
3. Update FROM_EMAIL address
4. Test email deliverability

### Database Integration

Store transactions in PostgreSQL:

```sql
CREATE TABLE brand_wallet_transactions (
  id UUID PRIMARY KEY,
  brand_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  payment_method VARCHAR(50),
  gateway_transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Security Enhancements

1. Add payment signature verification
2. Implement webhook handlers
3. Add transaction reconciliation
4. Enable 2FA for large amounts
5. Add fraud detection
6. Implement rate limiting

---

## Support

For issues or questions:
- Email: support@shelf-bidder.com
- Check server logs for email delivery status
- Verify Resend API key is valid
- Ensure environment variables are set

---

**Built for AI for Bharat Hackathon 2026**  
**Powered by Resend, Next.js, and AWS**
