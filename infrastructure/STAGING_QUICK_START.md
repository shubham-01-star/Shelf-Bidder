# Staging Environment - Quick Start

Get your staging environment up and running in 5 minutes.

## Prerequisites

- AWS CLI configured (`aws configure`)
- Node.js 18+ installed
- AWS CDK installed (`npm install -g aws-cdk`)

## Deploy in 3 Steps

### 1. Bootstrap CDK (First Time Only)

```bash
cd infrastructure
cdk bootstrap
```

### 2. Deploy Staging Stack

```bash
# Using the deployment script (recommended)
cd scripts
./deploy-staging.sh

# OR manually
cd infrastructure
npx cdk deploy ShelfBidderStagingStack --outputs-file outputs.json
```

### 3. Verify Deployment

```bash
# Set environment variables
export STAGING_API_URL=$(jq -r '.ShelfBidderStagingStack.ApiUrl' infrastructure/outputs.json)
export STAGING_USER_POOL_ID=$(jq -r '.ShelfBidderStagingStack.UserPoolId' infrastructure/outputs.json)
export STAGING_USER_POOL_CLIENT_ID=$(jq -r '.ShelfBidderStagingStack.UserPoolClientId' infrastructure/outputs.json)
export STAGING_PHOTO_BUCKET=$(jq -r '.ShelfBidderStagingStack.PhotoBucketName' infrastructure/outputs.json)

# Run smoke tests
npm run test:smoke
```

## What Gets Deployed?

✅ 5 DynamoDB tables (Shopkeepers, ShelfSpaces, Auctions, Tasks, Transactions)  
✅ S3 bucket for photo storage  
✅ Cognito User Pool for authentication  
✅ API Gateway with health endpoint  
✅ Step Functions state machine for workflow  

## Quick Commands

```bash
# Check deployment status
aws cloudformation describe-stacks --stack-name ShelfBidderStagingStack

# Test API health
curl $(jq -r '.ShelfBidderStagingStack.ApiUrl' infrastructure/outputs.json)health

# List tables
aws dynamodb list-tables | grep Staging

# Update stack
npx cdk deploy ShelfBidderStagingStack

# Destroy stack
npx cdk destroy ShelfBidderStagingStack
```

## Troubleshooting

**Error: "This stack uses assets"**  
→ Run `cdk bootstrap` first

**Error: "User is not authorized"**  
→ Check AWS credentials: `aws sts get-caller-identity`

**Error: "Table already exists"**  
→ Delete existing table or destroy old stack first

## Next Steps

1. ✅ Deploy staging infrastructure
2. ✅ Run smoke tests
3. ✅ Deploy frontend with staging config
4. ✅ Test authentication flow
5. ✅ Test photo upload
6. ✅ Test auction workflow

## Cost

Estimated: **$3-7/month** for staging environment

## Support

- Full guide: [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md)
- Smoke tests: [src/__tests__/smoke/README.md](../src/__tests__/smoke/README.md)
- Infrastructure: [README.md](./README.md)
