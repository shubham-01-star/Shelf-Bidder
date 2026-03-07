# Shelf-Bidder - Quick Reference Guide

**One-page reference for developers and demo**

---

## 🚀 Quick Start

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Start Next.js
npm run dev

# 3. Open browser
http://localhost:3000
```

---

## 📱 Key URLs

### Shopkeeper
- Landing: `http://localhost:3000`
- Signup: `http://localhost:3000/signup`
- Signin: `http://localhost:3000/signin`
- Verify: `http://localhost:3000/verify`
- Dashboard: `http://localhost:3000/dashboard`
- Camera: `http://localhost:3000/camera`
- Tasks: `http://localhost:3000/tasks`
- Wallet: `http://localhost:3000/wallet`

### Brand
- Landing: `http://localhost:3000/brand`
- Login: `http://localhost:3000/brand/login`
- Dashboard: `http://localhost:3000/brand`
- Wallet: `http://localhost:3000/brand/wallet`
- Auctions: `http://localhost:3000/brand/auctions`
- Products: `http://localhost:3000/brand/products`

---

## 🔌 Key API Endpoints

### Auth
```
POST /api/auth/signup          → Shopkeeper signup
POST /api/auth/signin          → Shopkeeper login
POST /api/auth/verify          → Verify OTP
POST /api/brand/auth           → Brand signup/signin
POST /api/brand/auth/verify    → Verify brand OTP
```

### Photos
```
POST /api/photos/upload-url    → Get S3 pre-signed URL
POST /api/photos/analyze       → Analyze with Bedrock
```

### Campaigns & Tasks
```
POST /api/campaigns/match      → Match campaign
GET  /api/tasks                → List tasks
POST /api/tasks/verify         → Verify task
```

### Wallet
```
GET  /api/wallet               → Get balance
POST /api/wallet/withdraw      → Withdraw money
POST /api/brand/wallet/recharge → Recharge brand wallet
```

---

## 🗄️ Database Tables

```sql
-- Core tables
shopkeepers          → User accounts
campaigns            → Brand campaigns
tasks                → Placement tasks
wallet_transactions  → Financial records
photos               → Photo metadata
bedrock_usage_logs   → AI usage tracking
```

---

## 🔑 Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shelf_bidder

# AWS
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_PHOTOS=shelf-bidder-photos-mumbai
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0

# Email
RESEND_API_KEY=re_...
SENDER_EMAIL=noreply@opsguard.dev
```

---

## 🧪 Test Commands

```bash
# Test database
node check-db-entry.js

# Test email
node test-resend-email.js

# Test Bedrock
node check-bedrock-access.js

# Test S3
node test-photo-upload.js
```

---

## 📊 Demo Flow (5 minutes)

1. **Shopkeeper Signup** (1 min)
   - Go to /signup
   - Fill form → Get OTP email
   - Verify → Dashboard

2. **Take Photo** (1 min)
   - Click "Take Photo"
   - Upload shelf photo
   - See AI analysis

3. **Get Task** (1 min)
   - Campaign matched
   - Task assigned: ₹50 reward

4. **Complete Task** (1 min)
   - Place products
   - Take proof photo
   - Verify → Earn ₹50

5. **Withdraw** (1 min)
   - Go to /wallet
   - Withdraw ₹50
   - Success!

---

## 🏗️ Tech Stack

```
Frontend:  Next.js 14 + TypeScript + Tailwind
Backend:   Next.js API Routes
Database:  PostgreSQL 15
AI:        AWS Bedrock (Nova Pro/Lite, Claude Haiku)
Storage:   AWS S3
Auth:      AWS Cognito + JWT
Email:     Resend
```

---

## 🔄 Key Flows

### Photo → Task
```
Photo Upload → S3 → Bedrock Analysis → Campaign Match → Task Created
```

### Task → Earnings
```
Proof Photo → S3 → Bedrock Verify → ACID Transaction → Earnings Credited
```

### Withdrawal
```
Request → Validate Balance → Process (Demo) → Update Balance
```

---

## 🎯 Key Features

- ✅ OTP-based authentication
- ✅ AI photo analysis (Bedrock)
- ✅ Campaign matching algorithm
- ✅ ACID-compliant transactions
- ✅ S3 direct upload
- ✅ Real email notifications
- ✅ Wallet system
- ✅ Brand portal

---

## 🐛 Troubleshooting

### Database not connecting
```bash
docker ps  # Check if postgres is running
docker-compose restart postgres
```

### Email not sending
```bash
# Check Resend API key in .env.local
# Check sender email is verified
```

### AWS services failing
```bash
# Check credentials in .env.local
# Verify region is ap-south-1
# Enable Bedrock models in AWS Console
# Create S3 bucket
```

---

## 📈 Current Status

✅ **Working:**
- Local development
- Database operations
- Email service
- All UI pages
- All API routes

⚠️ **Pending:**
- AWS Bedrock setup
- AWS S3 bucket
- AWS Cognito (using local dev)

---

## 🚀 Next Steps

1. Enable Bedrock models
2. Create S3 bucket
3. Test complete flow
4. Prepare demo
5. Submit! 🎉

---

**Last Updated:** March 7, 2026  
**Deadline:** March 8, 2026, 11:59 PM IST

