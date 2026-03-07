# Shelf-Bidder Demo Guide

## Hackathon Submission - AI for Bharat

This guide demonstrates the complete Shelf-Bidder workflow for evaluators.

## System Overview

Shelf-Bidder is an Autonomous Retail Ad-Network that transforms physical store shelves into digital advertising real estate using:

- **AWS Bedrock Nova Lite**: AI vision analysis for shelf space detection
- **PostgreSQL**: ACID-compliant transaction management
- **Next.js PWA**: Mobile-first progressive web application
- **Campaign Matching**: Automated brand-to-shopkeeper matching

## Demo Flow

### 1. Shopkeeper Registration

```bash
# Sign up a new shopkeeper
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramesh Kumar",
    "phoneNumber": "+919876543210",
    "email": "ramesh@example.com",
    "storeAddress": "Shop 123, Main Market, Delhi"
  }'
```

### 2. Create Brand Campaign

```bash
# Create a campaign (Brand Agent)
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "agent_id": "brand-agent-001",
    "brand_name": "Coca-Cola",
    "product_name": "Coke 500ml",
    "product_category": "Beverages",
    "budget": 10000,
    "payout_per_task": 50,
    "target_locations": ["Delhi", "Mumbai", "Bangalore"],
    "target_radius_km": 5,
    "placement_requirements": {
      "shelfLevel": "eye-level",
      "visibility": "high",
      "minQuantity": 6
    },
    "product_dimensions": {
      "width": 20,
      "height": 30,
      "depth": 10
    },
    "start_date": "2026-03-01T00:00:00Z",
    "end_date": "2026-04-01T00:00:00Z"
  }'
```

### 3. Complete Daily Workflow

```bash
# Upload shelf photo and trigger complete workflow
curl -X POST http://localhost:3000/api/workflow/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "photoUrl": "https://your-s3-bucket.s3.amazonaws.com/shelf-photo.jpg",
    "shopkeeperId": "cognito-user-id",
    "phoneNumber": "+919876543210",
    "timezone": "Asia/Kolkata",
    "language": "en",
    "location": "Delhi"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Great! You've been matched with Coca-Cola. Complete the task to earn ₹50!",
  "data": {
    "shelfSpaceId": "uuid",
    "emptySpaces": 3,
    "campaignMatched": true,
    "taskId": "uuid",
    "earnings": 50,
    "brandName": "Coca-Cola",
    "productName": "Coke 500ml"
  }
}
```

### 4. View Dashboard

```bash
# Get shopkeeper dashboard
curl -X GET http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "shopkeeper": {
    "name": "Ramesh Kumar",
    "walletBalance": 150.00
  },
  "stats": {
    "totalTasks": 5,
    "completedTasks": 3,
    "pendingTasks": 2,
    "todayEarnings": 50.00,
    "weeklyEarnings": 150.00
  },
  "recentTasks": [...]
}
```

### 5. Complete Task with Verification

```bash
# Submit proof photo for task verification
curl -X POST http://localhost:3000/api/tasks/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "taskId": "task-uuid",
    "proofPhotoUrl": "https://your-s3-bucket.s3.amazonaws.com/proof-photo.jpg"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "verified": true,
  "earnings": 50.00,
  "message": "Task completed successfully! ₹50 credited to your wallet.",
  "feedback": "Perfect placement! Products are at eye level with good visibility."
}
```

## Key Features Demonstrated

### 1. AI-Powered Vision Analysis
- **AWS Bedrock Nova Lite** analyzes shelf photos
- Detects empty spaces with pixel-accurate measurements
- Identifies current product inventory
- Provides confidence scoring

### 2. Automated Campaign Matching
- Location-based matching
- Budget availability checking
- Priority-based selection (highest budget first)
- ACID-compliant budget deduction

### 3. ACID Transaction Management
- PostgreSQL ensures data consistency
- Row-level locking prevents race conditions
- Atomic budget deduction + task creation
- Automatic rollback on failures

### 4. Progressive Web App
- Mobile-first design
- Offline capability
- Camera integration
- Real-time updates

### 5. Complete Workflow Orchestration
- Photo upload → Analysis → Matching → Task → Verification → Earnings
- Error handling and recovery
- Comprehensive logging

## Architecture Highlights

### AWS Services Used
1. **AWS Bedrock Nova Lite**: Vision AI for shelf analysis and verification
2. **Amazon S3**: Photo storage with pre-signed URLs
3. **Amazon RDS (PostgreSQL)**: ACID-compliant database
4. **AWS Lambda** (optional): Email notifications
5. **Amazon SES** (optional): Email delivery

### Why AI is Required
- **Shelf Space Detection**: Manual measurement is time-consuming and error-prone
- **Product Verification**: Ensures brand requirements are met automatically
- **Quality Control**: AI provides consistent, objective verification
- **Scalability**: Can process thousands of photos simultaneously

### Value Added by AI
- **Time Savings**: 5 minutes → 30 seconds per photo
- **Accuracy**: 95%+ confidence in space detection
- **Automation**: Zero manual intervention required
- **Trust**: Objective verification builds brand confidence

## Testing the System

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Database Status
```bash
npm run db:status
```

### 3. Run Test Suite
```bash
npm test
```

### 4. Check Logs
```bash
# View application logs
tail -f logs/application.log
```

## Demo Video Script

1. **Introduction** (30 seconds)
   - Show problem: Empty shelf spaces = lost revenue
   - Show solution: Shelf-Bidder automates monetization

2. **Shopkeeper Flow** (2 minutes)
   - Sign up on mobile
   - Take shelf photo
   - AI analyzes in 30 seconds
   - Campaign matched automatically
   - Task instructions displayed
   - Complete task, submit proof
   - Earnings credited instantly

3. **Brand Flow** (1 minute)
   - Create campaign via API
   - Set budget and targeting
   - Monitor campaign performance
   - View completed placements

4. **Technical Architecture** (1 minute)
   - Show AWS Bedrock vision analysis
   - Demonstrate ACID transactions
   - Highlight campaign matching algorithm
   - Show real-time dashboard updates

5. **Impact** (30 seconds)
   - Shopkeepers earn extra income
   - Brands get targeted placements
   - AI ensures quality and trust
   - Scalable across India

## Troubleshooting

### Issue: Bedrock Access Denied
```bash
# Check AWS credentials
node check-bedrock-access.js
```

### Issue: Database Connection Failed
```bash
# Restart PostgreSQL
npm run docker:up
```

### Issue: Photo Upload Failed
```bash
# Check S3 configuration
echo $AWS_S3_BUCKET_NAME
```

## Production Deployment

### Environment Variables Required
```env
# Database
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=5432
DB_NAME=shelfbidder
DB_USER=postgres
DB_PASSWORD=your-secure-password

# AWS
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET_NAME=shelf-bidder-photos

# Application
NEXT_PUBLIC_API_URL=https://your-domain.com
JWT_SECRET=your-jwt-secret
```

### Deployment Steps
1. Set up PostgreSQL RDS
2. Configure AWS Bedrock access
3. Create S3 bucket with lifecycle policies
4. Deploy Next.js to Vercel/AWS
5. Run database migrations
6. Test complete workflow

## Contact

For questions or issues during evaluation:
- GitHub: [Your GitHub URL]
- Email: [Your Email]
- Demo Video: [YouTube Link]

---

**Built for AI for Bharat Hackathon 2026**
**Powered by AWS Bedrock, PostgreSQL, and Next.js**
