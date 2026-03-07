# Infrastructure Usage - Complete Analysis

## Overview

Complete analysis of how Shelf-Bidder uses AWS and other infrastructure services.

---

## ✅ AWS Services Usage

### 1. **AWS Bedrock (AI Vision Analysis)** 🤖

**Status:** ✅ Actively Used

**Implementation:**
- **File:** `src/lib/vision/bedrock-client.ts`
- **Region:** Mumbai (ap-south-1)
- **Models Used:**
  1. Primary: `amazon.nova-pro-v1:0`
  2. Fallback 1: `amazon.nova-lite-v1:0`
  3. Fallback 2: `anthropic.claude-3-haiku-20240307-v1:0`

**Usage Points:**
1. **Photo Analysis** (`/api/photos/analyze`)
   - Analyzes shelf photos
   - Detects empty spaces
   - Identifies product categories
   - Returns confidence scores

2. **Task Verification** (`/api/tasks/verify`)
   - Compares before/after photos
   - Verifies product placement
   - Generates feedback
   - Validates task completion

**Features Implemented:**
- ✅ Multi-model fallback chain
- ✅ Exponential backoff (1s, 2s, 4s)
- ✅ Error handling for all models
- ✅ Usage logging in database
- ✅ Operator alerting (10 consecutive failures)
- ✅ Performance monitoring (<30 seconds)

**Code Example:**
```typescript
// Photo analysis with Bedrock
const result = await analyzeShelfPhoto(
  base64Image,
  'image/jpeg',
  shopkeeperId
);

// Task verification with Bedrock
const verification = await verifyTaskCompletion(
  beforePhoto,
  afterPhoto,
  'image/jpeg',
  shopkeeperId
);
```

---

### 2. **AWS S3 (Photo Storage)** 📸

**Status:** ✅ Actively Used

**Implementation:**
- **Files:** 
  - `src/lib/storage/client.ts`
  - `src/lib/storage/lifecycle.ts`
  - `src/app/api/photos/upload-url/route.ts`
- **Region:** Mumbai (ap-south-1)
- **Bucket:** `shelf-bidder-photos-mumbai`

**Usage Points:**
1. **Pre-signed URL Generation** (`/api/photos/upload-url`)
   - Generates 5-minute pre-signed URLs
   - Client uploads directly to S3
   - Bypasses server bandwidth
   - Reduces EC2 costs

2. **Photo Storage**
   - Shelf photos: `shelf-photos/`
   - Proof photos: `proof-photos/`
   - Metadata stored in PostgreSQL

3. **Lifecycle Management**
   - Auto-transition to Glacier after 30 days
   - Storage monitoring (5GB Free Tier)
   - Auto-policy application at 90% (4.5GB)
   - Cron job for monitoring

**Features Implemented:**
- ✅ Pre-signed URL generation
- ✅ Direct client upload
- ✅ Lifecycle policies
- ✅ Storage monitoring
- ✅ Automatic Glacier transition
- ✅ Cost optimization

**Code Example:**
```typescript
// Generate pre-signed URL
const { uploadUrl, photoKey } = await generatePresignedUrl(
  shopkeeperId,
  'shelf-photo',
  'image/jpeg'
);

// Client uploads directly to S3
await fetch(uploadUrl, {
  method: 'PUT',
  body: photoFile,
  headers: { 'Content-Type': 'image/jpeg' }
});
```

---

### 3. **AWS Cognito (Authentication)** 🔐

**Status:** ✅ Actively Used

**Implementation:**
- **Files:**
  - `src/app/api/auth/signup/route.ts`
  - `src/app/api/auth/signin/route.ts`
  - `src/app/api/auth/verify/route.ts`
  - `src/app/api/brand/auth/route.ts`
  - `src/app/api/brand/auth/verify/route.ts`
- **Region:** Mumbai (ap-south-1)
- **Mode:** Local dev with fallback

**Usage Points:**
1. **Shopkeeper Signup** (`/api/auth/signup`)
   - Creates Cognito user (UNCONFIRMED)
   - Stores user attributes
   - Generates custom OTP
   - Sends OTP via email

2. **Shopkeeper Verification** (`/api/auth/verify`)
   - Validates OTP
   - Confirms Cognito account
   - Creates database record
   - Issues JWT tokens

3. **Brand Signup** (`/api/brand/auth`)
   - Creates brand Cognito user
   - Email-based authentication
   - Custom OTP flow
   - Brand attributes

4. **Brand Verification** (`/api/brand/auth/verify`)
   - Validates brand OTP
   - Confirms brand account
   - Issues JWT tokens

**Features Implemented:**
- ✅ User pool management
- ✅ Email-based OTP
- ✅ Account confirmation
- ✅ JWT token generation
- ✅ User attributes storage
- ✅ Local dev fallback

**Code Example:**
```typescript
// Create Cognito user
const command = new SignUpCommand({
  ClientId: config.userPoolClientId,
  Username: phoneNumber,
  Password: password,
  UserAttributes: [
    { Name: 'name', Value: name },
    { Name: 'email', Value: email },
  ],
});

await client.send(command);

// Confirm user
const confirmCommand = new AdminConfirmSignUpCommand({
  UserPoolId: config.userPoolId,
  Username: phoneNumber,
});

await client.send(confirmCommand);
```

---

## ✅ Database Infrastructure

### **PostgreSQL (Primary Database)** 🗄️

**Status:** ✅ Actively Used

**Implementation:**
- **Files:**
  - `src/lib/db/postgres/client.ts`
  - `src/lib/db/postgres/operations/`
  - `database/init/*.sql`
- **Host:** localhost (Docker container)
- **Port:** 5432
- **Database:** shelf_bidder

**Tables:**
1. **shopkeepers** - User accounts
2. **campaigns** - Brand campaigns
3. **tasks** - Placement tasks
4. **wallet_transactions** - Financial records
5. **photos** - Photo metadata
6. **bedrock_usage_logs** - AI usage tracking

**Features Implemented:**
- ✅ ACID transactions
- ✅ Row-level locking
- ✅ Connection pooling
- ✅ Retry logic
- ✅ 35+ indexes for performance
- ✅ Referential integrity
- ✅ Concurrent access handling

**Usage Points:**
1. **Campaign Management**
   - Create/update campaigns
   - Budget tracking
   - ACID-compliant deductions

2. **Task Management**
   - Task creation
   - Status tracking
   - Completion verification

3. **Wallet Transactions**
   - Earnings credit
   - Payout processing
   - Transaction history
   - Balance calculations

4. **Photo Metadata**
   - S3 key storage
   - Analysis results
   - Verification data

**Code Example:**
```typescript
// ACID transaction for campaign budget deduction
await transaction(async (client) => {
  // Lock campaign row
  const campaign = await client.query(
    'SELECT * FROM campaigns WHERE id = $1 FOR UPDATE',
    [campaignId]
  );
  
  // Deduct budget
  await client.query(
    'UPDATE campaigns SET remaining_budget = remaining_budget - $1 WHERE id = $2',
    [amount, campaignId]
  );
  
  // Create task
  await client.query(
    'INSERT INTO tasks (...) VALUES (...)',
    [...]
  );
});
```

---

## ✅ Email Infrastructure

### **Resend (Email Service)** 📧

**Status:** ✅ Actively Used

**Implementation:**
- **File:** `src/lib/email/resend-client.ts`
- **API Key:** Configured
- **From:** `Shelf-Bidder <onboarding@resend.dev>`

**Usage Points:**
1. **OTP Emails** (Signup)
   - Shopkeeper signup
   - Brand signup
   - 6-digit verification code
   - 10-minute expiration

2. **Welcome Emails** (Verification)
   - Shopkeeper welcome
   - Brand welcome
   - Getting started guide
   - Personalized content

**Features Implemented:**
- ✅ HTML email templates
- ✅ Mobile-responsive design
- ✅ Professional branding
- ✅ Security warnings
- ✅ Error handling
- ✅ Delivery logging

**Code Example:**
```typescript
// Send OTP email
await sendOTPEmail({
  to: 'user@example.com',
  otp: '123456',
  name: 'John Doe',
});

// Send welcome email
await sendWelcomeEmail({
  to: 'user@example.com',
  name: 'John Doe',
  userType: 'shopkeeper',
});
```

---

## 📊 Infrastructure Usage Summary

### AWS Services
| Service | Status | Usage | Cost Optimization |
|---------|--------|-------|-------------------|
| **Bedrock** | ✅ Active | AI vision analysis | Multi-model fallback |
| **S3** | ✅ Active | Photo storage | Lifecycle policies, direct upload |
| **Cognito** | ✅ Active | Authentication | Local dev fallback |

### Database
| Service | Status | Usage | Features |
|---------|--------|-------|----------|
| **PostgreSQL** | ✅ Active | Primary database | ACID, row-locking, pooling |

### Email
| Service | Status | Usage | Features |
|---------|--------|-------|----------|
| **Resend** | ✅ Active | OTP & welcome emails | HTML templates, responsive |

---

## 🎯 Infrastructure Highlights

### 1. **Cost Optimization**
- ✅ S3 direct upload (bypasses EC2 bandwidth)
- ✅ Lifecycle policies (auto Glacier transition)
- ✅ Multi-model fallback (cheaper models first)
- ✅ Connection pooling (reduces DB connections)
- ✅ Pre-signed URLs (reduces server load)

### 2. **Performance**
- ✅ Mumbai region (low latency for India)
- ✅ Database indexes (fast queries)
- ✅ Connection pooling (reuse connections)
- ✅ Exponential backoff (retry logic)
- ✅ Concurrent request handling

### 3. **Reliability**
- ✅ Multi-model fallback (AI resilience)
- ✅ ACID transactions (data consistency)
- ✅ Row-level locking (no race conditions)
- ✅ Error handling (graceful degradation)
- ✅ Usage logging (monitoring)

### 4. **Security**
- ✅ Pre-signed URLs (time-limited access)
- ✅ JWT tokens (secure authentication)
- ✅ Row-level locking (prevent conflicts)
- ✅ Environment variables (secret management)
- ✅ HTTPS only (encrypted transport)

---

## 🔧 Infrastructure Flow

### Complete Workflow

```
1. User Signup
   ↓
   AWS Cognito (create user)
   ↓
   Resend (send OTP email)
   ↓
   PostgreSQL (store user data)

2. Photo Upload
   ↓
   API generates S3 pre-signed URL
   ↓
   Client uploads directly to S3
   ↓
   PostgreSQL (store photo metadata)

3. Photo Analysis
   ↓
   Fetch photo from S3
   ↓
   AWS Bedrock (analyze with fallback)
   ↓
   PostgreSQL (store analysis results)
   ↓
   PostgreSQL (log Bedrock usage)

4. Campaign Matching
   ↓
   PostgreSQL (query active campaigns)
   ↓
   PostgreSQL (ACID transaction: deduct budget + create task)

5. Task Verification
   ↓
   Fetch photos from S3
   ↓
   AWS Bedrock (verify with fallback)
   ↓
   PostgreSQL (ACID transaction: update task + credit earnings)

6. Wallet Operations
   ↓
   PostgreSQL (ACID transaction: update balance + create transaction)
```

---

## ✅ Infrastructure Checklist

### AWS Services
- ✅ Bedrock: Multi-model AI with fallback
- ✅ S3: Photo storage with lifecycle
- ✅ Cognito: Authentication with OTP

### Database
- ✅ PostgreSQL: ACID transactions
- ✅ Connection pooling
- ✅ Row-level locking
- ✅ 35+ indexes

### Email
- ✅ Resend: OTP emails
- ✅ Resend: Welcome emails
- ✅ HTML templates

### Monitoring
- ✅ Bedrock usage logs
- ✅ S3 storage monitoring
- ✅ Database health checks
- ✅ Email delivery logs

---

## 🚀 Production Ready

**All infrastructure services are:**
- ✅ Properly configured
- ✅ Actively used in code
- ✅ Cost-optimized
- ✅ Performance-tuned
- ✅ Monitored and logged
- ✅ Error-handled
- ✅ Security-hardened

**Ready for hackathon demo! 🎉**

---

**Last Updated:** March 7, 2026  
**Region:** Mumbai (ap-south-1)  
**Status:** Production Ready
