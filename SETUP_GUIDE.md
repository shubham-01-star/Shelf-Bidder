# 🚀 Shelf-Bidder — Complete Project Setup Guide (Zero से शुरू)

> **Yeh guide tumhare liye hai jo project bilkul fresh start karna chahte hain — ek naya computer ya naya developer dono ke liye.**

---

## 📋 Table of Contents

1. [Prerequisites — Kya Install Karna Hai](#1-prerequisites)
2. [Repository Clone Karo](#2-repo-clone-karo)
3. [Dependencies Install Karo](#3-dependencies-install)
4. [AWS Account Setup](#4-aws-account-setup)
5. [AWS Services Configure Karo](#5-aws-services)
6. [Infrastructure Deploy Karo (CDK)](#6-cdk-deploy)
7. [Environment Variables Setup](#7-env-variables)
8. [App Locally Run Karo](#8-local-run)
9. [Tests Chalao](#9-tests)
10. [CI/CD — GitHub Actions](#10-cicd)
11. [Troubleshooting](#11-troubleshooting)
12. [Cost Estimate](#12-cost)

---

## 1. Prerequisites

Pehle check karo kya installed hai:

```bash
node --version        # Should be v18.x or higher
npm --version         # Should be 9+
git --version         # Any recent version
aws --version         # AWS CLI v2 preferred
```

### Install karo (agar nahi hai)

| Tool                           | Download Link               |
| ------------------------------ | --------------------------- |
| **Node.js 20 LTS**             | https://nodejs.org          |
| **Git**                        | https://git-scm.com         |
| **AWS CLI v2**                 | https://aws.amazon.com/cli/ |
| **pnpm** _(optional but fast)_ | `npm install -g pnpm`       |

**Windows pe AWS CLI install karo:**

```powershell
# PowerShell me run karo (as Admin)
winget install Amazon.AWSCLI
# ya MSI installer download karo from aws.amazon.com/cli
```

---

## 2. Repo Clone Karo

```bash
# GitHub se clone karo
git clone https://github.com/shubham-01-star/Shelf-Bidder.git

# Project folder me jao
cd Shelf-Bidder
```

### Folder Structure (overview)

```
shelfbider/
├── src/                    ← Next.js app (frontend + API routes)
│   ├── app/               ← App Router pages & API routes
│   ├── lib/               ← Shared utilities, DB clients
│   └── components/        ← React components
├── infrastructure/         ← AWS CDK stack (IaC)
│   ├── lib/               ← CDK stack definition
│   └── scripts/           ← Config export scripts
├── lambda/                 ← Lambda function handlers
├── scripts/               ← Utility scripts
├── .env.local             ← Your local environment vars (git-ignored)
├── package.json           ← Dependencies & npm scripts
└── jest.config.js         ← Test configuration
```

---

## 3. Dependencies Install

```bash
# Root project dependencies install karo
npm install

# Phir infrastructure folder me jao
cd infrastructure
npm install

# Wapas root pe aao
cd ..
```

> **Note:** `node_modules/` folder auto-create hoga. Isko git me push mat karo — `.gitignore` me already hai.

---

## 4. AWS Account Setup

### 4.1 — AWS Account Banao

- https://aws.amazon.com pe jaao → "Create an AWS Account"
- Credit card chahiye (Free Tier available hai)
- **Region** `us-east-1` (N. Virginia) use karo — project isi pe configured hai

### 4.2 — IAM User Banao (credentials ke liye)

1. AWS Console → **IAM** → **Users** → **Create User**
2. Username: `shelf-bidder-deploy`
3. **Permissions:** `AdministratorAccess` attach karo (development ke liye)
4. **Access Keys** create karo:
   - IAM → Users → shelf-bidder-deploy → **Security Credentials** tab
   - "Create Access Key" → CLI ke liye
   - **`Access Key ID`** aur **`Secret Access Key`** copy karke rakh lo — ek baar hi dikhta hai!

### 4.3 — AWS CLI Configure Karo

```bash
aws configure
```

Ye poochega:

```
AWS Access Key ID [None]: AKIAU5QPXRTV...  ← apna paste karo
AWS Secret Access Key [None]: eJR5nRi...   ← apna paste karo
Default region name [None]: us-east-1
Default output format [None]: json
```

**Verify karo:**

```bash
aws sts get-caller-identity
# Output me tumhara Account ID dikhna chahiye
```

---

## 5. AWS Services

Project ko ye 6 AWS services chahiye:

| Service              | Kaam                   | Free Tier                   |
| -------------------- | ---------------------- | --------------------------- |
| **DynamoDB**         | Database (5 tables)    | 25GB free                   |
| **S3**               | Photo storage          | 5GB free                    |
| **Cognito**          | User auth (OTP/JWT)    | 50k users free              |
| **Bedrock (Claude)** | AI vision analysis     | Pay per use                 |
| **Step Functions**   | Workflow orchestration | 4000 state transitions free |
| **Resend**           | Email (OTP delivery)   | 100 emails/day free         |

### 5.1 — Bedrock Model Access Enable Karo

> ⚠️ **Yeh manually karna padega — CDK se nahi hota**

1. AWS Console → **Bedrock** → left sidebar → **Model Access**
2. "Manage model access" click karo
3. **Anthropic Claude Haiku** (ya Sonnet) ke liye access request karo
4. Usually 2–5 minutes me approve ho jaata hai
5. Verify: In the same screen, status "Access granted" dikhna chahiye

### 5.2 — Resend API Key Banao

Email (OTP) ke liye **Resend** use karo:

1. https://resend.com pe signup karo
2. **API Keys** → Create API Key
3. Key copy karo — `.env.local` me daaloge

---

## 6. CDK Deploy (Infrastructure)

AWS CDK tumhare liye automatically DynamoDB tables, S3, Cognito, API Gateway sab create karta hai.

```bash
# CDK CLI globally install karo (ek baar)
npm install -g aws-cdk

# Infrastructure folder me jao
cd infrastructure

# Pehli baar: CDK bootstrap karo (sirf ek baar per account/region)
cdk bootstrap

# Stack deploy karo
npm run deploy
# ya seedha: cdk deploy
```

> ⏳ **5–10 minutes lagenge.** CloudFormation stack create hoga.

### Deploy ke baad — Config Export Karo

```bash
# CDK outputs dekhkar .env.local update karo:
aws cloudformation describe-stacks --stack-name ShelfBidderStack --query "Stacks[0].Outputs"
```

Ye outputs milenge (example):

```json
[
  {
    "OutputKey": "ApiUrl",
    "OutputValue": "https://abc123.execute-api.us-east-1.amazonaws.com/prod"
  },
  { "OutputKey": "UserPoolId", "OutputValue": "us-east-1_XXXXXXX" },
  {
    "OutputKey": "PhotoBucketName",
    "OutputValue": "shelf-bidder-photos-338261675242"
  }
]
```

---

## 7. Environment Variables Setup

Root folder me `.env.local` file banao:

```bash
# Windows PowerShell
copy .env.local.example .env.local
```

Phir `.env.local` edit karo aur apni real values daal do:

```env
# ============================================================
# .env.local — Apni values yahan daal
# ============================================================

# PUBLIC (Frontend me use hoti hain)
NEXT_PUBLIC_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod
NEXT_PUBLIC_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_PHOTO_BUCKET=shelf-bidder-photos-YOUR_ACCOUNT_ID
NEXT_PUBLIC_APP_URL=http://localhost:3000

# SERVER-SIDE (Only server me use hoti hain)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAU5QPXRTV...         # IAM user se copy karo
AWS_SECRET_ACCESS_KEY=eJR5nRi...          # IAM user se copy karo

# S3
PHOTO_BUCKET_NAME=shelf-bidder-photos-YOUR_ACCOUNT_ID

# DynamoDB Tables (CDK outputs se copy karo — exact names!)
DYNAMODB_SHOPKEEPERS_TABLE=ShelfBidderStack-ShopkeepersTableXXXXX-XXXXX
DYNAMODB_SHELF_SPACES_TABLE=ShelfBidderStack-ShelfSpacesTableXXXXX-XXXXX
DYNAMODB_AUCTIONS_TABLE=ShelfBidderStack-AuctionsTableXXXXX-XXXXX
DYNAMODB_TASKS_TABLE=ShelfBidderStack-TasksTableXXXXX-XXXXX
DYNAMODB_TRANSACTIONS_TABLE=ShelfBidderStack-TransactionsTableXXXXX-XXXXX

# AI
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-haiku-4-5-20251001-v1:0

# Step Functions (CDK output se)
STATE_MACHINE_ARN=arn:aws:states:us-east-1:YOUR_ACCOUNT_ID:stateMachine:ShelfBidder-DailyWorkflow

# Email
RESEND_API_KEY=re_XXXXXXXXXXXX            # resend.com se copy karo

# Misc
CRON_SECRET=any-random-secret-string-here
USE_MOCK_DATA=false
```

> **⚠️ IMPORTANT:** `.env.local` ko kabhi Git me push mat karo! `.gitignore` me already listed hai.

---

## 8. App Locally Run Karo

```bash
# Root folder me hona chahiye
npm run dev
```

Browser me open karo: **http://localhost:3000**

### Available Scripts

```bash
npm run dev              # Development server (localhost:3000)
npm run build            # Production build banao
npm run start            # Production server start karo
npm run lint             # ESLint se code check karo
npm run type-check       # TypeScript errors check karo
npm run format           # Prettier se code format karo
```

---

## 9. Tests Chalao

```bash
npm test                 # Saare tests chalao
npm run test:watch       # Watch mode (auto re-run on save)
npm run test:coverage    # Coverage report
npm run test:smoke       # AWS connectivity tests
npm run test:integration # Integration tests
npm run validate         # Lint + type-check + test sab ek saath
```

> **Pehli baar** saare tests pass honge agar `.env.local` sahi set hai aur AWS services deploy hain.

---

## 10. CI/CD — GitHub Actions

`.github/workflows/` me 3 pipelines hain:

| Workflow               | Trigger           | Kya karta hai             |
| ---------------------- | ----------------- | ------------------------- |
| **ci.yml**             | Every Push / PR   | Lint + Type Check + Tests |
| **deploy-staging.yml** | Push to `develop` | Vercel staging deploy     |
| **deploy-prod.yml**    | Push to `main`    | Vercel production deploy  |

### GitHub Secrets Setup Karo

GitHub repo → **Settings → Secrets and Variables → Actions** → ye secrets add karo:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION                   = us-east-1
DYNAMODB_SHOPKEEPERS_TABLE
DYNAMODB_SHELF_SPACES_TABLE
DYNAMODB_AUCTIONS_TABLE
DYNAMODB_TASKS_TABLE
DYNAMODB_TRANSACTIONS_TABLE
RESEND_API_KEY
VERCEL_TOKEN                 ← vercel.com/account/tokens se
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Vercel Deploy (Frontend)

```bash
npm install -g vercel    # Vercel CLI install karo
vercel login             # Login karo
vercel link              # Project link karo (pehli baar)

npm run deploy:staging   # Staging pe deploy
npm run deploy:prod      # Production pe deploy
```

---

## 11. Troubleshooting

| Error                              | Fix                                                        |
| ---------------------------------- | ---------------------------------------------------------- |
| `aws: command not found`           | AWS CLI install karo: https://aws.amazon.com/cli/          |
| `Unable to locate credentials`     | `aws configure` run karo                                   |
| `Bootstrap stack required`         | `cdk bootstrap` run karo (ek baar)                         |
| `Stack already exists`             | `cdk destroy` phir `cdk deploy`                            |
| `ValidationError: Table not found` | `.env.local` me table names exact CDK output se copy karo  |
| `Bedrock access denied`            | AWS Console → Bedrock → Model Access → Claude approve karo |
| `CORS error` on S3 upload          | CDK redeploy karo — S3 CORS auto-set hota hai              |
| Email OTP nahi aa raha             | `RESEND_API_KEY` valid hai check karo resend.com pe        |
| `npm install` fail                 | Node.js v18+ install karo                                  |

---

## 12. Cost Estimate

### Development / Testing (Per Month)

| Service        | Cost             |
| -------------- | ---------------- |
| DynamoDB       | $0–5             |
| S3             | $0–2             |
| Cognito        | Free (50k users) |
| Bedrock Claude | ~$5–20           |
| Step Functions | $0–1             |
| **Total**      | **~$5–30/month** |

### Production (1000 Shopkeepers)

| Service        | Cost                |
| -------------- | ------------------- |
| DynamoDB       | $20–50              |
| S3             | $10–20              |
| Cognito        | Free                |
| Bedrock Claude | $100–200            |
| Step Functions | $5–10               |
| Lambda         | $5–15               |
| **Total**      | **~$140–295/month** |

---

## 🎯 Quick Summary

```
1.  Node.js 20 + Git + AWS CLI install karo
2.  git clone → cd shelfbider
3.  npm install  (root folder me)
4.  cd infrastructure → npm install → cdk bootstrap → npm run deploy
5.  CDK outputs copy karo → .env.local banao aur fill karo
6.  Resend signup → API key → .env.local me daal
7.  npm run dev → http://localhost:3000 kholo
8.  npm test → sab green ✅
```

---

_Last updated: March 2026 | Stack: Next.js 16 · AWS CDK · DynamoDB · Bedrock · Resend_
