# Staging Environment Deployment Guide

This guide covers deploying and managing the Shelf-Bidder staging environment.

## Overview

The staging environment mirrors production but uses:
- Separate AWS resources with "Staging" prefix
- Lower rate limits and shorter retention periods
- Auto-deletion on stack removal (DESTROY policy)
- Single-region deployment (no replication)
- Reduced costs for testing

## Prerequisites

1. **AWS Account**: Active AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured
   ```bash
   aws configure
   ```
3. **Node.js**: Version 18 or higher
4. **AWS CDK**: Install globally
   ```bash
   npm install -g aws-cdk
   ```
5. **jq**: JSON processor for parsing outputs
   ```bash
   # macOS
   brew install jq
   
   # Ubuntu/Debian
   sudo apt-get install jq
   ```

## Manual Deployment

### 1. Bootstrap CDK (First Time Only)

```bash
cd infrastructure
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

### 2. Deploy Using Script

The easiest way to deploy:

```bash
cd infrastructure/scripts
chmod +x deploy-staging.sh
./deploy-staging.sh
```

This script will:
- Verify AWS credentials
- Install dependencies
- Synthesize the CDK stack
- Deploy to AWS
- Extract outputs
- Create `.env.staging` file

### 3. Manual Deployment (Alternative)

If you prefer manual control:

```bash
cd infrastructure

# Install dependencies
npm install

# Synthesize stack
npx cdk synth ShelfBidderStagingStack

# Deploy
npx cdk deploy ShelfBidderStagingStack \
  --require-approval never \
  --outputs-file outputs.json
```

## Automated Deployment (CI/CD)

### GitHub Actions Setup

The repository includes a GitHub Actions workflow for automated staging deployment.

#### Required Secrets

Configure these secrets in your GitHub repository:

1. **AWS_ROLE_ARN_STAGING**: IAM role ARN for GitHub Actions
   ```
   arn:aws:iam::ACCOUNT-ID:role/GitHubActionsRole
   ```

2. **VERCEL_TOKEN** (Optional): For frontend deployment
3. **VERCEL_ORG_ID** (Optional): Your Vercel organization ID
4. **VERCEL_PROJECT_ID** (Optional): Your Vercel project ID

#### Setting Up AWS IAM Role

Create an IAM role for GitHub Actions with OIDC:

```bash
# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT-ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR-ORG/YOUR-REPO:*"
        }
      }
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name GitHubActionsRole \
  --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name GitHubActionsRole \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
```

#### Triggering Deployment

The workflow triggers automatically on:
- Push to `develop` branch
- Manual trigger via GitHub Actions UI

To manually trigger:
1. Go to Actions tab in GitHub
2. Select "Deploy to Staging" workflow
3. Click "Run workflow"

## Verification

### 1. Run Smoke Tests

After deployment, verify all services:

```bash
# Set environment variables
export STAGING_API_URL=$(jq -r '.ShelfBidderStagingStack.ApiUrl' infrastructure/outputs.json)
export STAGING_USER_POOL_ID=$(jq -r '.ShelfBidderStagingStack.UserPoolId' infrastructure/outputs.json)
export STAGING_USER_POOL_CLIENT_ID=$(jq -r '.ShelfBidderStagingStack.UserPoolClientId' infrastructure/outputs.json)
export STAGING_PHOTO_BUCKET=$(jq -r '.ShelfBidderStagingStack.PhotoBucketName' infrastructure/outputs.json)
export AWS_REGION=us-east-1

# Run smoke tests
npm run test:smoke
```

### 2. Manual Verification

#### Check API Gateway
```bash
curl $(jq -r '.ShelfBidderStagingStack.ApiUrl' infrastructure/outputs.json)health
```

Expected response:
```json
{
  "status": "healthy",
  "environment": "staging",
  "timestamp": "..."
}
```

#### Check DynamoDB Tables
```bash
aws dynamodb list-tables | grep Staging
```

Expected output:
```
ShelfBidder-Staging-Auctions
ShelfBidder-Staging-ShelfSpaces
ShelfBidder-Staging-Shopkeepers
ShelfBidder-Staging-Tasks
ShelfBidder-Staging-Transactions
```

#### Check S3 Bucket
```bash
aws s3 ls | grep staging
```

#### Check Cognito User Pool
```bash
USER_POOL_ID=$(jq -r '.ShelfBidderStagingStack.UserPoolId' infrastructure/outputs.json)
aws cognito-idp describe-user-pool --user-pool-id $USER_POOL_ID
```

## Configuration Differences from Production

| Feature | Production | Staging |
|---------|-----------|---------|
| Table Names | `ShelfBidder-*` | `ShelfBidder-Staging-*` |
| Bucket Name | `shelf-bidder-photos-*` | `shelf-bidder-staging-photos-*` |
| API Stage | `prod` | `staging` |
| Rate Limit | 100 req/s | 50 req/s |
| Burst Limit | 200 | 100 |
| Photo Retention | 90 days | 30 days |
| IA Transition | 30 days | 7 days |
| Point-in-Time Recovery | Enabled | Disabled |
| Removal Policy | RETAIN | DESTROY |
| Multi-Region | Yes | No |
| Versioning | Enabled | Disabled |

## Updating Staging

To update the staging environment:

```bash
cd infrastructure

# Review changes
npx cdk diff ShelfBidderStagingStack

# Deploy updates
npx cdk deploy ShelfBidderStagingStack
```

## Rollback

If deployment fails or you need to rollback:

```bash
aws cloudformation rollback-stack --stack-name ShelfBidderStagingStack
```

## Cleanup

To remove the staging environment:

```bash
cd infrastructure
npx cdk destroy ShelfBidderStagingStack
```

**Note**: All resources will be deleted automatically due to DESTROY removal policy.

## Troubleshooting

### Issue: Stack Already Exists

**Error**: "ShelfBidderStagingStack already exists"

**Solution**: Either update the existing stack or destroy it first:
```bash
npx cdk destroy ShelfBidderStagingStack
```

### Issue: Table Already Exists

**Error**: "Table already exists: ShelfBidder-Staging-Shopkeepers"

**Solution**: Delete the table manually:
```bash
aws dynamodb delete-table --table-name ShelfBidder-Staging-Shopkeepers
```

### Issue: Insufficient Permissions

**Error**: "User is not authorized to perform: cloudformation:CreateStack"

**Solution**: Ensure your AWS credentials have appropriate IAM permissions. Required permissions:
- CloudFormation: Full access
- DynamoDB: Create/Update/Delete tables
- S3: Create/Update/Delete buckets
- API Gateway: Create/Update/Delete APIs
- Cognito: Create/Update/Delete user pools
- IAM: Create/Update roles (for Lambda execution)

### Issue: CDK Bootstrap Required

**Error**: "This stack uses assets, so the toolkit stack must be deployed"

**Solution**: Run CDK bootstrap:
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

### Issue: Smoke Tests Failing

**Problem**: Smoke tests fail after deployment

**Solution**:
1. Wait 1-2 minutes for resources to fully initialize
2. Verify environment variables are set correctly
3. Check AWS credentials have read permissions
4. Review CloudWatch logs for errors

## Cost Estimation

Estimated monthly costs for staging (low usage):
- **DynamoDB**: $0.50-2 (pay-per-request, lower usage)
- **S3**: $0.50-1 (shorter retention)
- **API Gateway**: $1-2 (lower traffic)
- **Cognito**: Free tier
- **Data Transfer**: $0.50-1

**Total**: ~$3-7/month

## Monitoring

### CloudWatch Dashboards

View staging metrics:
```bash
aws cloudwatch list-dashboards | grep Staging
```

### CloudWatch Logs

View API Gateway logs:
```bash
aws logs tail /aws/apigateway/ShelfBidderStagingStack --follow
```

### Alarms

Set up basic alarms:
```bash
# API Gateway 5xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name staging-api-errors \
  --alarm-description "Alert on API errors in staging" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold
```

## Best Practices

1. **Regular Testing**: Run smoke tests after every deployment
2. **Cost Monitoring**: Review AWS costs weekly
3. **Cleanup**: Delete unused resources promptly
4. **Security**: Restrict CORS to staging domain only
5. **Data**: Use synthetic test data, never production data
6. **Monitoring**: Set up CloudWatch alarms for critical metrics
7. **Documentation**: Keep this guide updated with changes

## Next Steps

After staging deployment:

1. ✅ Run smoke tests to verify infrastructure
2. ✅ Deploy frontend application with staging config
3. ✅ Test authentication flow
4. ✅ Test photo upload and analysis
5. ✅ Test auction workflow
6. ✅ Test task completion
7. ✅ Verify wallet transactions
8. ✅ Test error scenarios
9. ✅ Performance testing
10. ✅ Security testing

## Support

For issues or questions:
- Check CloudWatch logs
- Review CDK synthesis output
- Consult AWS documentation
- Check GitHub Actions logs for CI/CD issues
