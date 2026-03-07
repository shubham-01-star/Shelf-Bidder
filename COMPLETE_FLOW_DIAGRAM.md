# Shelf-Bidder - Complete Flow Diagrams

**All User Flows with Technical Details**

---

## 🔐 Flow 1: Shopkeeper Signup & Authentication

```
┌─────────────┐
│  Shopkeeper │
│   Browser   │
└──────┬──────┘
       │
       │ 1. Visit /auth/signup
       │
       ▼
┌─────────────────────────────────────────┐
│  Signup Form                            │
│  • Phone Number                         │
│  • Email                                │
│  • Password                             │
│  • Name                                 │
└──────┬──────────────────────────────────┘
       │
       │ 2. Submit Form
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /api/auth/signup                  │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 1. Validate Input (Zod)           │ │
│  │ 2. Check if user exists           │ │
│  │ 3. Create Cognito User            │ │
│  │    - Status: UNCONFIRMED          │ │
│  │ 4. Generate 6-digit OTP           │ │
│  │ 5. Store OTP in memory            │ │
│  │    - Expiry: 10 minutes           │ │
│  │ 6. Send OTP via Resend            │ │
│  └───────────────────────────────────┘ │
└──────┬──────────────────────────────────┘
       │
       │ 3. OTP Sent Response
       │
       ▼
┌─────────────────────────────────────────┐
│  AWS Cognito                            │
│  • User created (UNCONFIRMED)           │
│  • Username: phone number               │
│  • Attributes: email, name              │
└─────────────────────────────────────────┘
       │
       │ 4. Email Sent
       │
       ▼
┌─────────────────────────────────────────┐
│  Resend Email Service                   │
│  • To: user email                       │
│  • Subject: "Verify Your Account"      │
│  • Body: OTP code + instructions        │
│  • Template: HTML with branding         │
└──────┬──────────────────────────────────┘
       │
       │ 5. User receives email
       │
       ▼
┌─────────────────────────────────────────┐
│  User Email Inbox                       │
│  📧 "Your OTP: 123456"                  │
└──────┬──────────────────────────────────┘
       │
       │ 6. Enter OTP
       │
       ▼
┌─────────────────────────────────────────┐
│  Verify Form (/auth/verify)             │
│  • Phone Number                         │
│  • OTP Code                             │
└──────┬──────────────────────────────────┘
       │
       │ 7. Submit OTP
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /api/auth/verify                  │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 1. Validate OTP                   │ │
│  │ 2. Check expiry (10 min)          │ │
│  │ 3. Confirm Cognito User           │ │
│  │ 4. Create Shopkeeper in DB        │ │
│  │ 5. Generate JWT tokens            │ │
│  │ 6. Send Welcome Email             │ │
│  └───────────────────────────────────┘ │
└──────┬──────────────────────────────────┘
       │
       │ 8. Success Response
       │
       ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Database                    │
│  INSERT INTO shopkeepers (              │
│    id, phone, email, name,              │
│    wallet_balance, created_at           │
│  )                                      │
└──────┬──────────────────────────────────┘
       │
       │ 9. Welcome Email
       │
       ▼
┌─────────────────────────────────────────┐
│  Resend Email Service                   │
│  • Subject: "Welcome to Shelf-Bidder"  │
│  • Body: Getting started guide         │
│  • Template: Personalized HTML          │
└──────┬──────────────────────────────────┘
       │
       │ 10. Redirect to Dashboard
       │
       ▼
┌─────────────────────────────────────────┐
│  /dashboard                             │
│  • Welcome message                      │
│  • Wallet balance: ₹0                   │
│  • "Take Photo" button                  │
└─────────────────────────────────────────┘
```

**Files Involved:**
- `src/app/auth/signup/page.tsx`
- `src/app/api/auth/signup/route.ts`
- `src/app/api/auth/verify/route.ts`
- `src/lib/email/resend-client.ts`
- `database/init/01-shopkeepers.sql`

---

## 📸 Flow 2: Photo Upload & AI Analysis

```
┌─────────────┐
│  Shopkeeper │
│  Dashboard  │
└──────┬──────┘
       │
       │ 1. Click "Take Photo"
       │
       ▼
┌─────────────────────────────────────────┐
│  /camera                                │
│  • Camera preview                       │
│  • Capture button                       │
│  • Guidance overlay                     │
└──────┬──────────────────────────────────┘
       │
       │ 2. Capture Photo
       │
       ▼
┌─────────────────────────────────────────┐
│  Client-side Processing                 │
│  • Compress image                       │
│  • Convert to base64                    │
│  • Validate size (<5MB)                 │
└──────┬──────────────────────────────────┘
       │
       │ 3. Request Upload URL
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /api/photos/upload-url            │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 1. Authenticate user              │ │
│  │ 2. Generate unique photo key      │ │
│  │ 3. Create S3 pre-signed URL       │ │
│  │    - Expiry: 5 minutes            │ │
│  │    - Method: PUT                  │ │
│  │ 4. Return URL + key               │ │
│  └───────────────────────────────────┘ │
└──────┬──────────────────────────────────┘
       │
       │ 4. Pre-signed URL Response
       │    { uploadUrl, photoKey }
       │
       ▼
┌─────────────────────────────────────────┐
│  Client Direct Upload to S3             │
│  PUT {uploadUrl}                        │
│  • Headers: Content-Type: image/jpeg   │
│  • Body: Photo binary data              │
│  • Bypasses Next.js server              │
└──────┬──────────────────────────────────┘
       │
       │ 5. Upload Complete
       │
       ▼
┌─────────────────────────────────────────┐
│  AWS S3 Bucket                          │
│  shelf-bidder-photos-mumbai/            │
│  └── shelf-photos/                      │
│      └── {shopkeeperId}/                │
│          └── {timestamp}.jpg            │
└──────┬──────────────────────────────────┘
       │
       │ 6. Request Analysis
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /api/photos/analyze               │
│  Body: { photoKey }                     │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 1. Fetch photo from S3            │ │
│  │ 2. Convert to base64              │ │
│  │ 3. Call Bedrock API               │ │
│  │    - Model: Nova Pro (primary)    │ │
│  │    - Fallback: Nova Lite          │ │
│  │    - Fallback: Claude Haiku       │ │
│  │ 4. Parse AI response              │ │
│  │ 5. Store in PostgreSQL            │ │
│  │ 6. Log Bedrock usage              │ │
│  └───────────────────────────────────┘ │
└──────┬──────────────────────────────────┘
       │
       │ 7. Call Bedrock
       │
       ▼
┌─────────────────────────────────────────┐
│  AWS Bedrock (Mumbai)                   │
│                                         │
│  Try 1: amazon.nova-pro-v1:0            │
│  ├─ Success? → Return result            │
│  └─ Fail? → Wait 1s, try fallback       │
│                                         │
│  Try 2: amazon.nova-lite-v1:0           │
│  ├─ Success? → Return result            │
│  └─ Fail? → Wait 2s, try fallback       │
│                                         │
│  Try 3: claude-3-haiku                  │
│  ├─ Success? → Return result            │
│  └─ Fail? → Return error                │
└──────┬──────────────────────────────────┘
       │
       │ 8. AI Analysis Result
       │
       ▼
┌─────────────────────────────────────────┐
│  Analysis Response                      │
│  {                                      │
│    emptySpaces: [                       │
│      {                                  │
│        location: "top-left",            │
│        size: "medium",                  │
│        category: "beverages",           │
│        confidence: 0.92                 │
│      }                                  │
│    ],                                   │
│    totalSpaces: 3                       │
│  }                                      │
└──────┬──────────────────────────────────┘
       │
       │ 9. Store in Database
       │
       ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Database                    │
│                                         │
│  INSERT INTO photos (                   │
│    shopkeeper_id, s3_key,               │
│    analysis_result, created_at          │
│  )                                      │
│                                         │
│  INSERT INTO bedrock_usage_logs (       │
│    model_used, success, latency         │
│  )                                      │
└──────┬──────────────────────────────────┘
       │
       │ 10. Show Results
       │
       ▼
┌─────────────────────────────────────────┐
│  Analysis Results Page                  │
│  • "Found 3 empty spaces"               │
│  • Visual markers on photo              │
│  • "Finding campaigns..." button        │
└─────────────────────────────────────────┘
```

**Files Involved:**
- `src/app/camera/page.tsx`
- `src/app/api/photos/upload-url/route.ts`
- `src/app/api/photos/analyze/route.ts`
- `src/lib/storage/client.ts`
- `src/lib/vision/bedrock-client.ts`
- `database/init/03-photos.sql`
- `database/init/04-bedrock-usage-logs.sql`

---


## 🎯 Flow 3: Campaign Matching & Task Creation

```
┌─────────────┐
│  Shopkeeper │
│  (After     │
│   Analysis) │
└──────┬──────┘
       │
       │ 1. Click "Find Campaigns"
       │
       ▼
┌─────────────────────────────────────────┐
│  POST /api/campaigns/match              │
│  Body: { photoId, emptySpaces }         │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 1. Get shopkeeper location        │ │
│  │ 2. Query active campaigns         │ │
│  │ 3. Filter by:                     │ │
│  │    - Location (within 50km)       │ │
│  │    - Budget available             │ │
│  │    - Product category match       │ │
│  │ 4. Prioritize by:                 │ │
│  │    - Highest budget first         │ │
│  │    - Closest distance             │ │
│  │    - Campaign age                 │ │
│  │ 5. Select best match              │ │
│  └───────────────────────────────────┘ │
└──────┬──────────────────────────────────┘
       │
       │ 2. Query Database
       │
       ▼
┌─────────────────────────────────────────┐
│  PostgreSQL - Campaign Query            │
│                                         │
│  SELECT * FROM campaigns                │
│  WHERE status = 'active'                │
│    AND remaining_budget > 0             │
│    AND product_category IN (...)        │
│    AND ST_Distance(                     │
│          location,                      │
│          shopkeeper_location            │
│        ) < 50000                        │
│  ORDER BY                               │
│    remaining_budget DESC,               │
│    distance ASC                         │
│  LIMIT 1                                │
└──────┬──────────────────────────────────┘
       │
       │ 3. Campaign Found
       │
       ▼
┌─────────────────────────────────────────┐
│  ACID Transaction START                 │
│                               