# Deployment Guide

This guide walks through deploying the Shelf-Bidder infrastructure to AWS.

## Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured with credentials
   ```bash
   aws configure
   ```
3. **Node.js**: Version 18 or higher
4. **AWS CDK**: Install globally
   ```bash
   npm install -g aws-cdk
   ```

## Initial Setup

### 1. Install Dependencies

```bash
cd infrastructure
npm install
```

### 2. Configure AWS Region

Edit `bin/shelf-bidder.ts` if you want to change the default region (currently `us-east-1`).

### 3. Bootstrap CDK (First Time Only)

Bootstrap CDK in your AWS account and region:

```bash
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

For multi-region deployment, bootstrap both regions:

```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

## Deployment Steps

### 1. Review Changes

Preview what will be deployed:

```bash
npm run synth
```

This generates CloudFormation templates in the `cdk.out` directory.

### 2. Deploy Infrastructure

Deploy the stack:

```bash
npm run deploy
```

Or use CDK directly for more control:

```bash
cdk deploy --require-approval never
```

The deployment will:
- Create 5 DynamoDB tables with GSIs
- Create S3 buckets with lifecycle policies
- Set up API Gateway with CORS and authentication
- Create Cognito User Pool for shopkeepers
- Configure multi-region replication

**Expected Duration**: 5-10 minutes

### 3. Export Configuration

After successful deployment, export the configuration for the Next.js app:

```bash
chmod +x scripts/export-config.sh
./scripts/export-config.sh
```

This creates a `.env.local` file in the project root with all necessary environment variables.

## Verification

### 1. Check Stack Status

```bash
aws cloudformation describe-stacks --stack-name ShelfBidderStack
```

### 2. Verify DynamoDB Tables

```bash
aws dynamodb list-tables | grep ShelfBidder
```

### 3. Verify S3 Buckets

```bash
aws s3 ls | grep shelf-bidder-photos
```

### 4. Test API Gateway

```bash
curl $(aws cloudformation describe-stacks \
  --stack-name ShelfBidderStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)
```

## Post-Deployment Configuration

### 1. Update Frontend Environment

The `export-config.sh` script creates `.env.local` with:
- API Gateway URL
- Cognito User Pool ID
- S3 Bucket names
- DynamoDB table names

### 2. Configure Cognito User Pool Client

Get the User Pool Client ID:

```bash
aws cognito-idp list-user-pool-clients \
  --user-pool-id $(aws cloudformation describe-stacks \
    --stack-name ShelfBidderStack \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)
```

Add the client ID to `.env.local`:
```
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<client-id>
```

### 3. Configure CORS Origins

For production, update the API Gateway CORS settings in `lib/shelf-bidder-stack.ts`:

```typescript
allowOrigins: ['https://yourdomain.com'],
```

Then redeploy:
```bash
cdk deploy
```

## Updating Infrastructure

### 1. Make Changes

Edit files in `lib/` directory to modify infrastructure.

### 2. Review Diff

See what will change:

```bash
cdk diff
```

### 3. Deploy Updates

```bash
cdk deploy
```

## Rollback

If deployment fails or you need to rollback:

```bash
aws cloudformation rollback-stack --stack-name ShelfBidderStack
```

## Cleanup

To remove all infrastructure (WARNING: This deletes all data):

```bash
cdk destroy
```

Note: Tables and buckets with `RETAIN` policy will not be deleted automatically. Delete them manually if needed:

```bash
# Delete tables
aws dynamodb delete-table --table-name ShelfBidder-Shopkeepers
aws dynamodb delete-table --table-name ShelfBidder-ShelfSpaces
aws dynamodb delete-table --table-name ShelfBidder-Auctions
aws dynamodb delete-table --table-name ShelfBidder-Tasks
aws dynamodb delete-table --table-name ShelfBidder-Transactions

# Empty and delete buckets
aws s3 rb s3://shelf-bidder-photos-ACCOUNT --force
aws s3 rb s3://shelf-bidder-photos-replica-ACCOUNT --force
```

## Troubleshooting

### Issue: Bootstrap Error

**Error**: "This stack uses assets, so the toolkit stack must be deployed"

**Solution**: Run `cdk bootstrap` first

### Issue: Insufficient Permissions

**Error**: "User is not authorized to perform: cloudformation:CreateStack"

**Solution**: Ensure your AWS credentials have appropriate IAM permissions

### Issue: Table Already Exists

**Error**: "Table already exists: ShelfBidder-Shopkeepers"

**Solution**: Either delete the existing table or change the table name in the code

### Issue: Region Mismatch

**Error**: "Could not find replication region"

**Solution**: Bootstrap both regions (us-east-1 and us-west-2)

## Cost Estimation

Estimated monthly costs (low usage):
- **DynamoDB**: $1-5 (pay-per-request)
- **S3**: $1-3 (storage + requests)
- **API Gateway**: $3.50 per million requests
- **Cognito**: Free tier (50,000 MAUs)
- **Data Transfer**: Variable

**Total**: ~$5-15/month for development/testing

Production costs will scale with usage.

## Security Checklist

- [ ] AWS credentials secured and not committed to git
- [ ] API Gateway CORS restricted to actual domain
- [ ] S3 buckets have public access blocked
- [ ] Cognito password policy enforced
- [ ] CloudWatch logs enabled for monitoring
- [ ] IAM roles follow least privilege principle
- [ ] Encryption enabled for all data at rest
- [ ] Multi-region replication configured

## Next Steps

After infrastructure deployment:

1. Deploy Lambda functions for API endpoints (Task 2.2)
2. Set up Step Functions for workflow orchestration (Task 5.2)
3. Configure AWS Bedrock for Claude 3.5 integration (Task 4.2)
4. Set up AWS Connect for voice notifications (Task 7.2)
5. Test end-to-end workflows
