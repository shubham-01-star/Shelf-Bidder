# Shelf-Bidder - Complete Architecture & Flow

**Project:** Shelf-Bidder - Autonomous Retail Ad-Network  
**Tech Stack:** Next.js 14, PostgreSQL, AWS (Bedrock, S3, Cognito), Resend  
**Date:** March 7, 2026

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Shopkeeper PWA  │              │   Brand Portal   │         │
│  │  (Mobile First)  │              │   (Desktop)      │         │
│  └────────┬─────────┘              └────────┬─────────┘         │
│           │                                 │                    │
└───────────┼─────────────────────────────────┼────────────────────┘
            │                                 │
            └─────────────┬───────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth APIs    │  │ Photo APIs   │  │ Campaign APIs│          │
│  │ /api/auth/*  │  │ /api/photos/*│  │ /api/campaigns/*        │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Task APIs    │  │ Wallet APIs  │  │ Brand APIs   │          │
│  │ /api/tasks/* │  │ /api/wallet/*│  │ /api/brand/* │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
            │                │                │
            ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Service │  │ Vision Service│  │ Storage Svc  │          │
│  │ (Cognito)    │  │ (Bedrock)    │  │ (S3)         │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Email Service│  │ Campaign Svc │  │ Wallet Svc   │          │
│  │ (Resend)     │  │ (Matching)   │  │ (ACID)       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                          │   │
│  │  • shopkeepers        • campaigns      • tasks           │   │
│  │  • wallet_transactions • photos        • bedrock_logs    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Application Structure

### Shopkeeper App (PWA)

```
/                    → Landing page
/signup              → Shopkeeper registration
/signin              → Shopkeeper login
/verify              → OTP verification
/dashboard           → Earnings overview
/camera              → Take shelf photo
/tasks               → View assigned tasks
/wallet              → Wallet & withdrawals
/profile             → Profile settings
/analytics           → Earnings analytics
/network             → Network stats
```

### Brand Portal
```
/brand               → Brand landing
/brand/login         → Brand login
/brand/auctions      → View auctions
/brand/products      → Product catalog
/brand/wallet        → Wallet & recharge
```

---

## 🔄 Complete User Flows

### Flow 1: Shopkeeper Onboarding
```
┌─────────────────────────────────────────────────────────────┐
│ 1. SIGNUP                                                    │
│    User → /signup                                            │
│    Fill: phone, email, password, name, shopName, location   │
│    ↓                                                         │
│    POST /api/auth/signup                                     │
│    ├─ Create Cognito user (UNCONFIRMED)                     │
│    ├─ Generate 6-digit OTP                                  │
│    ├─ Store OTP in memory (10 min expiry)                   │
│    └─ Send OTP via Resend email                             │
│                                                              │
│ 2. VERIFY                                                    │
│    User receives email → Opens /verify                       │
│    Enter OTP code                                            │
│    ↓                                                         │
│    POST /api/auth/verify                                     │
│    ├─ Validate OTP                                          │
│    ├─ Confirm Cognito account                               │
│    ├─ Create shopkeeper in PostgreSQL                       │
│    ├─ Send welcome email via Resend                         │
│    └─ Return JWT tokens                                     │
│                                                              │
│ 3. DASHBOARD                                                 │
│    Redirect to /dashboard                                    │
│    ├─ Show earnings: ₹0                                     │
│    ├─ Show tasks: 0 pending                                 │
│    └─ Show "Take Photo" button                              │
└─────────────────────────────────────────────────────────────┘
```

### Flow 2: Photo Upload & Analysis
```
┌─────────────────────────────────────────────────────────────┐
│ 1. TAKE PHOTO                                                │
│    User → /camera                                            │
│    ├─ Open camera                                           │
│    ├─ Capture shelf photo                                   │
│    └─ Compress image                                        │
│                                                              │
│ 2. GET UPLOAD URL                                            │
│    POST /api/photos/upload-url                               │
│    ├─ Generate S3 pre-signed URL (5 min expiry)            │
│    └─ Return: { uploadUrl, photoKey }                       │
│                                                              │
│ 3. UPLOAD TO S3                                              │
│    PUT {uploadUrl}                                           │
│    ├─ Direct upload to S3 (bypasses server)                │
│    └─ Photo stored: s3://shelf-bidder-photos-mumbai/...    │
│                                                              │
│ 4. ANALYZE PHOTO                                             │
│    POST /api/photos/analyze                                  │
│    ├─ Fetch photo from S3                                   │
│    ├─ Call Bedrock (Nova Pro)                               │
│    │  └─ Fallback: Nova Lite → Claude Haiku                │
│    ├─ Parse AI response                                     │
│    │  └─ Extract: empty spaces, categories, confidence     │
│    ├─ Store results in PostgreSQL                           │
│    └─ Log Bedrock usage                                     │
│                                                              │
│ 5. RESULT                                                    │
│    Return: {                                                 │
│      emptySpaces: [                                          │
│        { location: "top-left", size: "medium",              │
│          category: "beverages", confidence: 0.85 }          │
│      ]                                                       │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Flow 3: Campaign Matching & Task Assignment

```
┌─────────────────────────────────────────────────────────────┐
│ 1. MATCH CAMPAIGN                                            │
│    POST /api/campaigns/match                                 │
│    Input: { photoId, emptySpaces, shopkeeperId, location }  │
│    ↓                                                         │
│    Query PostgreSQL:                                         │
│    ├─ SELECT * FROM campaigns                               │
│    │  WHERE status = 'active'                               │
│    │  AND remaining_budget > 0                              │
│    │  AND category IN (emptySpaces.categories)             │
│    │  AND location_radius covers shopkeeper                │
│    │                                                         │
│    ├─ Prioritize by:                                        │
│    │  1. Budget (highest first)                            │
│    │  2. Distance (nearest first)                          │
│    │  3. Campaign age (oldest first)                       │
│    │                                                         │
│    └─ Select best match                                     │
│                                                              │
│ 2. CREATE TASK (ACID Transaction)                           │
│    BEGIN TRANSACTION;                                        │
│    ├─ Lock campaign row: FOR UPDATE                         │
│    ├─ Check remaining_budget >= task_reward                 │
│    ├─ Deduct budget:                                        │
│    │  UPDATE campaigns                                      │
│    │  SET remaining_budget = remaining_budget - 50          │
│    │  WHERE id = campaign_id                                │
│    ├─ Create task:                                          │
│    │  INSERT INTO tasks (                                   │
│    │    shopkeeper_id, campaign_id, photo_id,              │
│    │    status, reward_amount, instructions                │
│    │  ) VALUES (...)                                        │
│    └─ COMMIT;                                               │
│                                                              │
│ 3. NOTIFY SHOPKEEPER                                         │
│    Return: {                                                 │
│      taskId, campaignName, reward: ₹50,                     │
│      instructions: "Place 2 Coca-Cola bottles..."          │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Flow 4: Task Completion & Verification
```
┌─────────────────────────────────────────────────────────────┐
│ 1. VIEW TASK                                                 │
│    User → /tasks                                             │
│    GET /api/tasks                                            │
│    ├─ Fetch pending tasks from PostgreSQL                   │
│    └─ Show: instructions, reward, deadline                  │
│                                                              │
│ 2. COMPLETE TASK                                             │
│    User places products on shelf                             │
│    User → /camera (proof photo)                              │
│    ├─ Take proof photo                                      │
│    ├─ Upload to S3 (same as Flow 2)                         │
│    └─ Get photoKey                                          │
│                                                              │
│ 3. VERIFY TASK                                               │
│    POST /api/tasks/verify                                    │
│    Input: { taskId, proofPhotoKey }                         │
│    ↓                                                         │
│    ├─ Fetch task from PostgreSQL                            │
│    ├─ Fetch before photo from S3                            │
│    ├─ Fetch after photo from S3                             │
│    ├─ Call Bedrock for verification                         │
│    │  Prompt: "Compare before/after photos.                │
│    │           Verify products placed correctly."           │
│    │  └─ Fallback: Nova Pro → Nova Lite → Claude Haiku    │
│    ├─ Parse verification result                             │
│    │  └─ { verified: true/false, feedback: "..." }        │
│    └─ Log Bedrock usage                                     │
│                                                              │
│ 4. CREDIT EARNINGS (ACID Transaction)                       │
│    IF verified = true:                                       │
│    BEGIN TRANSACTION;                                        │
│    ├─ Update task:                                          │
│    │  UPDATE tasks                                          │
│    │  SET status = 'completed', verified_at = NOW()        │
│    │  WHERE id = task_id                                    │
│    ├─ Create wallet transaction:                            │
│    │  INSERT INTO wallet_transactions (                     │
│    │    shopkeeper_id, type, amount, task_id               │
│    │  ) VALUES (..., 'earning', 50, ...)                   │
│    ├─ Update shopkeeper balance:                            │
│    │  UPDATE shopkeepers                                    │
│    │  SET wallet_balance = wallet_balance + 50             │
│    │  WHERE id = shopkeeper_id                              │
│    └─ COMMIT;                                               │
│                                                              │
│ 5. NOTIFY RESULT                                             │
│    Return: {                                                 │
│      verified: true,                                         │
│      earned: ₹50,                                           │
│      newBalance: ₹50,                                       │
│      feedback: "Perfect placement!"                         │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Flow 5: Wallet Withdrawal

```
┌─────────────────────────────────────────────────────────────┐
│ 1. VIEW WALLET                                               │
│    User → /wallet                                            │
│    GET /api/wallet                                           │
│    ├─ Fetch balance from PostgreSQL                         │
│    ├─ Fetch transaction history                             │
│    └─ Show: balance, earnings, withdrawals                  │
│                                                              │
│ 2. REQUEST WITHDRAWAL                                        │
│    User clicks "Withdraw to Bank"                            │
│    Enter amount: ₹500                                        │
│    ↓                                                         │
│    POST /api/wallet/withdraw                                 │
│    Input: { amount: 500 }                                    │
│    ↓                                                         │
│    ├─ Validate: amount > 0                                  │
│    ├─ Check: balance >= amount                              │
│    ├─ Simulate withdrawal (1s delay) [DEMO MODE]           │
│    ├─ Generate transaction ID                               │
│    └─ Return success                                        │
│                                                              │
│ 3. UPDATE UI                                                 │
│    ├─ Show success message                                  │
│    ├─ Update balance: ₹50 → ₹0 (if withdrew ₹50)          │
│    └─ Add to transaction history                            │
│                                                              │
│ Note: In production, this would:                             │
│ - Create payout request in database                         │
│ - Integrate with payment gateway                            │
│ - Process actual bank transfer                              │
└─────────────────────────────────────────────────────────────┘
```

### Flow 6: Brand Onboarding & Wallet Recharge
```
┌─────────────────────────────────────────────────────────────┐
│ 1. BRAND SIGNUP                                              │
│    Brand → /brand/login (signup tab)                         │
│    Fill: email, password, brandName, contactPerson          │
│    ↓                                                         │
│    POST /api/brand/auth (action: signup)                     │
│    ├─ Create Cognito user (UNCONFIRMED)                     │
│    ├─ Generate 6-digit OTP                                  │
│    ├─ Store OTP in memory (10 min expiry)                   │
│    └─ Send OTP via Resend email                             │
│                                                              │
│ 2. VERIFY                                                    │
│    Brand receives email → Enters OTP                         │
│    ↓                                                         │
│    POST /api/brand/auth/verify                               │
│    ├─ Validate OTP                                          │
│    ├─ Confirm Cognito account                               │
│    ├─ Send welcome email via Resend                         │
│    └─ Return JWT tokens                                     │
│                                                              │
│ 3. BRAND DASHBOARD                                           │
│    Redirect to /brand                                        │
│    ├─ Show wallet balance: ₹0                               │
│    ├─ Show active campaigns: 0                              │
│    └─ Show "Recharge Wallet" button                         │
│                                                              │
│ 4. WALLET RECHARGE                                           │
│    Brand → /brand/wallet                                     │
│    Click "Recharge Wallet"                                   │
│    Select amount: ₹10,000                                    │
│    ↓                                                         │
│    POST /api/brand/wallet/recharge                           │
│    Input: { amount: 10000 }                                  │
│    ↓                                                         │
│    ├─ Validate: amount >= 1000 (min ₹1,000)                │
│    ├─ Simulate payment gateway (2s delay) [DEMO MODE]      │
│    ├─ Generate transaction ID                               │
│    └─ Return success                                        │
│                                                              │
│ 5. UPDATE UI                                                 │
│    ├─ Show success message                                  │
│    ├─ Update balance: ₹0 → ₹10,000                         │
│    └─ Add to transaction history                            │
│                                                              │
│ Note: In production, this would:                             │
│ - Integrate with Razorpay/Stripe                            │
│ - Process actual payment                                    │
│ - Update database after payment confirmation                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Tables & Relationships
```
shopkeepers
├─ id (PK)
├─ phone_number (unique)
├─ email (unique)
├─ name
├─ shop_name
├─ location (lat, lng)
├─ wallet_balance (default: 0)
├─ created_at
└─ updated_at

campaigns
├─ id (PK)
├─ brand_id (FK → brands.id)
├─ name
├─ category
├─ budget
├─ remaining_budget
├─ reward_per_task
├─ status (active/paused/completed)
├─ location_radius
├─ created_at
└─ expires_at

tasks
├─ id (PK)
├─ shopkeeper_id (FK → shopkeepers.id)
├─ campaign_id (FK → campaigns.id)
├─ photo_id (FK → photos.id)
├─ proof_photo_id (FK → photos.id)
├─ status (pending/in_progress/completed/failed/expired)
├─ reward_amount
├─ instructions
├─ assigned_date
├─ expires_at (default: assigned_date + 24 hours)
├─ verified_at
├─ created_at
└─ deadline

wallet_transactions
├─ id (PK)
├─ shopkeeper_id (FK → shopkeepers.id)
├─ type (earning/withdrawal/refund)
├─ amount
├─ task_id (FK → tasks.id, nullable)
├─ status (pending/completed/failed)
├─ transaction_id (external)
├─ created_at
└─ completed_at

photos
├─ id (PK)
├─ shopkeeper_id (FK → shopkeepers.id)
├─ s3_key
├─ type (shelf/proof)
├─ analysis_result (JSON)
├─ uploaded_at
└─ analyzed_at

bedrock_usage_logs
├─ id (PK)
├─ shopkeeper_id (FK → shopkeepers.id)
├─ model_id
├─ operation (analyze/verify)
├─ success (boolean)
├─ error_message
├─ latency_ms
└─ created_at
```

---

## 🔌 API Endpoints

### Authentication APIs

```
POST   /api/auth/signup          → Create shopkeeper account
POST   /api/auth/signin          → Login shopkeeper
POST   /api/auth/verify          → Verify OTP
POST   /api/auth/resend-otp      → Resend OTP
POST   /api/auth/refresh         → Refresh JWT token
```

### Photo APIs
```
POST   /api/photos/upload-url    → Get S3 pre-signed URL
POST   /api/photos/analyze       → Analyze shelf photo with Bedrock
GET    /api/photos/metadata      → Get photo metadata
```

### Campaign APIs
```
GET    /api/campaigns            → List all campaigns
POST   /api/campaigns            → Create campaign (brand only)
GET    /api/campaigns/:id        → Get campaign details
PUT    /api/campaigns/:id        → Update campaign
POST   /api/campaigns/match      → Match campaign to empty space
```

### Task APIs
```
GET    /api/tasks                → List shopkeeper tasks
GET    /api/tasks/:id            → Get task details
POST   /api/tasks/verify         → Verify task completion
PUT    /api/tasks/:id            → Update task status
```

### Wallet APIs
```
GET    /api/wallet               → Get wallet balance & history
POST   /api/wallet/withdraw      → Request withdrawal
GET    /api/wallet/payout        → Get payout status
```

### Brand APIs
```
POST   /api/brand/auth           → Brand signup/signin
POST   /api/brand/auth/verify    → Verify brand OTP
GET    /api/brand/dashboard      → Brand dashboard data
POST   /api/brand/wallet/recharge → Recharge brand wallet
GET    /api/brand/auctions       → List brand auctions
GET    /api/brand/products       → List brand products
```

### System APIs
```
GET    /api/health               → Health check
GET    /api/system/status        → System status
GET    /api/system/metrics       → System metrics
GET    /api/storage/usage        → S3 storage usage
POST   /api/tasks/cleanup        → Cleanup expired tasks (Cron)
GET    /api/tasks/cleanup        → Check cleanup status
```

---

## 🔐 Authentication Flow

### JWT Token Structure
```javascript
{
  // Access Token (15 min expiry)
  accessToken: "eyJhbGc...",
  payload: {
    sub: "shopkeeper_id",
    email: "user@example.com",
    role: "shopkeeper",
    exp: 1234567890
  },
  
  // Refresh Token (7 days expiry)
  refreshToken: "eyJhbGc...",
  payload: {
    sub: "shopkeeper_id",
    exp: 1234567890
  }
}
```

### Protected Routes
```javascript
// Middleware checks:
1. Extract JWT from Authorization header
2. Verify JWT signature
3. Check expiration
4. Extract user ID
5. Attach to request: req.user = { id, email, role }
6. Continue to route handler
```

---

## 🤖 AI Integration (AWS Bedrock)

### Multi-Model Fallback Chain
```
Request → Try Nova Pro (amazon.nova-pro-v1:0)
          ↓ (if fails)
          Try Nova Lite (amazon.nova-lite-v1:0)
          ↓ (if fails)
          Try Claude Haiku (anthropic.claude-3-haiku-20240307-v1:0)
          ↓ (if all fail)
          Return error + alert operator
```

### Photo Analysis Prompt
```
Analyze this retail shelf photo and identify:
1. Empty spaces (location, size)
2. Product categories that fit
3. Confidence score (0-1)

Return JSON format:
{
  "emptySpaces": [
    {
      "location": "top-left",
      "size": "medium",
      "category": "beverages",
      "confidence": 0.85
    }
  ]
}
```

### Task Verification Prompt
```
Compare these two shelf photos:
- Before: [base64_image_1]
- After: [base64_image_2]

TARGET PRODUCT SPECIFICATION:
- Product Name: "Coca-Cola 500ml Bottle"
- Category: "Beverages"
- Required Quantity: 2
- Target Location: "Top shelf, eye level"

TASK INSTRUCTIONS:
"Place 2 Coca-Cola 500ml bottles on the top shelf at eye level"

Verify:
1. Are the correct products placed (Coca-Cola 500ml)?
2. Is the quantity correct (2 bottles)?
3. Is the location correct (top shelf, eye level)?
4. Are products visible and properly aligned?

Return JSON:
{
  "verified": true/false,
  "confidence": 0.95,
  "feedback": "Perfect placement! 2 Coca-Cola bottles clearly visible on top shelf at eye level.",
  "issues": []
}
```

---

## 📦 Storage Architecture (AWS S3)

### Bucket Structure
```
shelf-bidder-photos-mumbai/
├── shelf-photos/
│   ├── {shopkeeper_id}/
│   │   ├── {timestamp}_{uuid}.jpg
│   │   └── ...
│   └── ...
├── proof-photos/
│   ├── {shopkeeper_id}/
│   │   ├── {timestamp}_{uuid}.jpg
│   │   └── ...
│   └── ...
└── temp/
    └── (auto-deleted after 24h)
```

### Lifecycle Policy
```
Rule 1: Transition to Glacier
- After: 30 days
- Storage class: GLACIER
- Cost: ~$0.004/GB/month

Rule 2: Delete temp files
- After: 1 day
- Prefix: temp/
```

### Pre-signed URL Flow
```
1. Client requests upload URL
   POST /api/photos/upload-url
   
2. Server generates pre-signed URL
   - Expiry: 5 minutes
   - Method: PUT
   - Content-Type: image/jpeg
   
3. Client uploads directly to S3
   PUT {presignedUrl}
   Body: <image_data>
   
4. S3 stores photo
   - No server bandwidth used
   - Direct client → S3 transfer
```

---

## 📧 Email Service (Resend)

### Email Templates

#### OTP Email
```
Subject: Your Shelf-Bidder Verification Code
Body:
  Hi {name},
  
  Your verification code is: {otp}
  
  This code expires in 10 minutes.
  
  If you didn't request this, ignore this email.
```

#### Welcome Email (Shopkeeper)
```
Subject: Welcome to Shelf-Bidder!
Body:
  Hi {name},
  
  Welcome to Shelf-Bidder! 🎉
  
  Start earning by:
  1. Taking a photo of your shelf
  2. Getting matched with campaigns
  3. Completing tasks
  4. Earning money instantly
  
  Get started: {app_url}/dashboard
```

#### Welcome Email (Brand)
```
Subject: Welcome to Shelf-Bidder Brand Portal
Body:
  Hi {brandName},
  
  Welcome to Shelf-Bidder! 🎉
  
  Start advertising by:
  1. Recharging your wallet
  2. Creating campaigns
  3. Reaching thousands of shops
  4. Tracking performance
  
  Get started: {app_url}/brand
```

---

## 🔄 Data Flow Summary

### Complete Daily Workflow

```
Morning (8 AM):
├─ Shopkeeper opens app
├─ Sees "Take Photo" prompt
└─ Clicks camera

Photo Capture (8:05 AM):
├─ Takes shelf photo
├─ Uploads to S3 (direct)
└─ Triggers analysis

AI Analysis (8:06 AM):
├─ Bedrock analyzes photo
├─ Finds 3 empty spaces
└─ Returns categories

Campaign Matching (8:07 AM):
├─ Queries active campaigns
├─ Matches: Coca-Cola campaign
├─ Deducts budget (ACID)
└─ Creates task

Task Assignment (8:08 AM):
├─ Shopkeeper sees task
├─ Instructions: "Place 2 bottles"
├─ Reward: ₹50
└─ Deadline: 24 hours

Task Completion (10 AM):
├─ Shopkeeper places products
├─ Takes proof photo
└─ Uploads to S3

Verification (10:01 AM):
├─ Bedrock verifies placement
├─ Compares before/after
└─ Returns: verified = true

Earnings Credit (10:02 AM):
├─ Update task: completed
├─ Create transaction: +₹50
├─ Update balance: ₹0 → ₹50
└─ Notify shopkeeper

Withdrawal (Evening 6 PM):
├─ Shopkeeper requests ₹50
├─ Validates balance
├─ Processes withdrawal (demo)
└─ Updates balance: ₹50 → ₹0
```

---

## 🏗️ Technology Stack Details

### Frontend
```
Framework:     Next.js 14 (App Router)
Language:      TypeScript
Styling:       Tailwind CSS
UI Components: Shadcn/ui
State:         React Hooks
PWA:           next-pwa
Icons:         Lucide React
```

### Backend
```
Runtime:       Node.js 18+
Framework:     Next.js API Routes
Database:      PostgreSQL 15
ORM:           Raw SQL with pg library
Auth:          AWS Cognito + JWT
Email:         Resend
```

### AWS Services
```
Bedrock:       AI vision analysis
  - amazon.nova-pro-v1:0
  - amazon.nova-lite-v1:0
  - anthropic.claude-3-haiku-20240307-v1:0

S3:            Photo storage
  - Bucket: shelf-bidder-photos-mumbai
  - Region: ap-south-1 (Mumbai)
  - Lifecycle: 30 days → Glacier

Cognito:       Authentication
  - User Pool: Shopkeepers + Brands
  - Region: ap-south-1 (Mumbai)
```

### Database
```
PostgreSQL 15:
  - Host: localhost (Docker)
  - Port: 5432
  - Database: shelf_bidder
  - Connection Pool: 20 max
  - ACID Transactions: Yes
  - Row-level Locking: Yes
```

---

## 📊 Performance Metrics

### Target Performance
```
Photo Upload:        < 5 seconds
AI Analysis:         < 30 seconds
Campaign Matching:   < 2 seconds
Task Verification:   < 30 seconds
Wallet Operations:   < 1 second
Page Load:           < 3 seconds
```

### Scalability
```
Concurrent Users:    1,000+
Photos per Day:      10,000+
Campaigns Active:    100+
Tasks per Day:       5,000+
Database Size:       < 10 GB
S3 Storage:          < 5 GB (Free Tier)
```

---

## 🔒 Security Features

### Authentication
```
✅ JWT tokens with expiration
✅ Refresh token rotation
✅ Password hashing (Cognito)
✅ OTP verification (6 digits)
✅ Rate limiting on auth endpoints
```

### Data Protection
```
✅ HTTPS only
✅ Environment variables for secrets
✅ SQL injection prevention (parameterized queries)
✅ XSS protection (React escaping)
✅ CORS configuration
```

### AWS Security
```
✅ IAM roles with least privilege
✅ S3 bucket private (pre-signed URLs only)
✅ Cognito user pool with MFA support
✅ Bedrock API key rotation
```

---

## 🚀 Deployment Architecture

### Current (Development)
```
┌─────────────────────────────────────┐
│  Local Machine                       │
│  ├─ Next.js (localhost:3000)        │
│  ├─ PostgreSQL (Docker)             │
│  └─ .env.local (config)             │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  AWS Services (Mumbai Region)        │
│  ├─ Bedrock (AI)                    │
│  ├─ S3 (Storage)                    │
│  └─ Cognito (Auth)                  │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  External Services                   │
│  └─ Resend (Email)                  │
└─────────────────────────────────────┘
```

### Production (Planned)
```
┌─────────────────────────────────────┐
│  Vercel / AWS EC2                    │
│  ├─ Next.js App                     │
│  ├─ PostgreSQL (RDS/Docker)         │
│  └─ Environment Variables           │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  AWS Services (Mumbai Region)        │
│  ├─ Bedrock (AI)                    │
│  ├─ S3 (Storage)                    │
│  ├─ Cognito (Auth)                  │
│  └─ CloudWatch (Monitoring)         │
└─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  External Services                   │
│  └─ Resend (Email)                  │
└─────────────────────────────────────┘
```

---

## 📝 Environment Configuration

### Required Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shelf_bidder
DB_USER=postgres
DB_PASSWORD=postgres

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_PHOTOS=shelf-bidder-photos-mumbai
BEDROCK_REGION=ap-south-1
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0

# Cognito
NEXT_PUBLIC_USER_POOL_ID=ap-south-1_...
NEXT_PUBLIC_USER_POOL_CLIENT_ID=...

# Email
RESEND_API_KEY=re_...
SENDER_EMAIL=noreply@opsguard.dev

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🎯 Key Features Summary

### For Shopkeepers
```
✅ Easy signup with OTP verification
✅ Take shelf photos with camera
✅ AI-powered empty space detection
✅ Automatic campaign matching
✅ Step-by-step task instructions
✅ Instant earnings on completion
✅ Wallet with withdrawal support
✅ Transaction history
✅ Earnings analytics
```

### For Brands
```
✅ Brand portal with separate login
✅ Wallet recharge system
✅ Campaign creation & management
✅ Product catalog
✅ Performance tracking
✅ Budget management
✅ Real-time auction participation
```

### Technical Highlights
```
✅ PWA with offline support
✅ Multi-model AI fallback
✅ ACID-compliant transactions
✅ S3 direct upload (bandwidth optimization)
✅ Pre-signed URLs (security)
✅ Real-time email notifications
✅ Responsive mobile-first UI
✅ PostgreSQL with row-level locking
```

---

## 📈 Future Enhancements

### Phase 2 (Post-Hackathon)
```
- Real payment gateway integration (Razorpay/Stripe)
- Push notifications (Firebase)
- Real-time chat support
- Advanced analytics dashboard
- Geolocation-based matching
- Multi-language support (Hindi, etc.)
- Referral program
- Shopkeeper ratings & reviews
```

### Phase 3 (Scale)
```
- Mobile apps (React Native)
- Brand mobile app
- AI-powered pricing optimization
- Predictive campaign matching
- Automated quality checks
- Blockchain-based payments
- IoT shelf sensors integration
```

---

## ✅ Current Status

### Working Features
```
✅ Shopkeeper signup/signin with OTP
✅ Brand signup/signin with OTP
✅ Email notifications (Resend)
✅ PostgreSQL database with all tables
✅ All frontend pages implemented
✅ All API routes implemented
✅ Wallet operations (demo mode)
✅ Brand wallet recharge (demo mode)
```

### Pending Setup
```
⚠️ AWS Bedrock model access
⚠️ AWS S3 bucket creation
⚠️ AWS Cognito user pool (using local dev)
```

### Demo Ready
```
✅ Can demo with mock AI responses
✅ Can demo with local file storage
✅ All flows work end-to-end
✅ Real email notifications
✅ Real database operations
```

---

**Last Updated:** March 7, 2026  
**Status:** Development Complete, AWS Setup Pending  
**Deadline:** March 8, 2026, 11:59 PM IST

**Next Steps:**
1. Setup AWS Bedrock (enable models)
2. Create S3 bucket
3. Test complete flow
4. Prepare demo script
5. Submit to hackathon! 🚀

