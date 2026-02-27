# Quick Start Guide

Get the Shelf-Bidder infrastructure up and running in minutes.

## Prerequisites Check

```bash
# Check Node.js version (should be 18+)
node --version

# Check AWS CLI
aws --version

# Check AWS credentials
aws sts get-caller-identity

# Install CDK globally
npm install -g aws-cdk
```

## Deploy in 5 Steps

### 1. Install Dependencies

```bash
cd infrastructure
npm install
```

### 2. Bootstrap CDK (First Time Only)

```bash
cdk bootstrap
```

### 3. Deploy Stack

```bash
npm run deploy
```

Wait 5-10 minutes for deployment to complete.

### 4. Export Configuration

```bash
chmod +x scripts/export-config.sh
./scripts/export-config.sh
```

### 5. Verify

```bash
# Check if .env.local was created
cat ../.env.local

# Test API endpoint
curl $(aws cloudformation describe-stacks \
  --stack-name ShelfBidderStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)
```

## What Gets Created

✅ 5 DynamoDB tables with GSIs  
✅ 2 S3 buckets (primary + replica)  
✅ API Gateway with CORS  
✅ Cognito User Pool  
✅ IAM roles and policies  
✅ CloudWatch logs  

## Next Steps

1. Get User Pool Client ID:
```bash
aws cognito-idp list-user-pool-clients \
  --user-pool-id $(aws cloudformation describe-stacks \
    --stack-name ShelfBidderStack \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' \
    --output text)
```

2. Add to `.env.local`:
```
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<client-id-from-above>
```

3. Start the Next.js app:
```bash
cd ..
npm run dev
```

## Common Issues

**Issue**: "Unable to resolve AWS account"  
**Fix**: Run `aws configure` and set credentials

**Issue**: "Stack already exists"  
**Fix**: Run `cdk destroy` first, then redeploy

**Issue**: "Insufficient permissions"  
**Fix**: Ensure your AWS user has AdministratorAccess or equivalent

## Cleanup

To remove everything:

```bash
cdk destroy
```

Note: Tables and buckets with RETAIN policy must be deleted manually.

## Cost

Expected monthly cost for development: **$5-15**

- DynamoDB: Pay-per-request (minimal)
- S3: Storage + requests (minimal)
- API Gateway: $3.50 per million requests
- Cognito: Free tier (50K MAUs)

## Support

- Full documentation: [DEPLOYMENT.md](DEPLOYMENT.md)
- Architecture details: [README.md](README.md)
- CDK issues: Check `cdk.out/` for CloudFormation templates
