# Staging Environment Setup - Task 14.2 Summary

## Overview

Task 14.2 has been completed successfully. The staging environment is now fully configured with automated deployment pipeline and comprehensive smoke tests.

## What Was Implemented

### 1. Staging CDK Stack (`infrastructure/lib/shelf-bidder-staging-stack.ts`)

A complete staging environment stack that mirrors production with staging-specific configurations:

**Key Features:**
- ✅ 5 DynamoDB tables with "Staging" prefix
- ✅ S3 bucket for photo storage
- ✅ Cognito User Pool for authentication
- ✅ API Gateway with health endpoint
- ✅ Step Functions state machine
- ✅ Auto-deletion on stack removal (DESTROY policy)
- ✅ Lower rate limits (50 req/s vs 100 req/s)
- ✅ Shorter retention periods (30 days vs 90 days)
- ✅ Single-region deployment (cost optimization)

**Configuration Differences from Production:**

| Feature | Production | Staging |
|---------|-----------|---------|
| Table Names | `ShelfBidder-*` | `ShelfBidder-Staging-*` |
| Removal Policy | RETAIN | DESTROY |
| Point-in-Time Recovery | Enabled | Disabled |
| Multi-Region | Yes | No |
| Rate Limit | 100 req/s | 50 req/s |
| Photo Retention | 90 days | 30 days |

### 2. Automated Deployment Pipeline (`.github/workflows/deploy-staging.yml`)

GitHub Actions workflow for CI/CD:

**Workflow Jobs:**
1. **Test**: Run linter and test suite
2. **Deploy Infrastructure**: Deploy CDK stack to AWS
3. **Deploy Application**: Build and deploy frontend
4. **Smoke Tests**: Verify deployment success
5. **Notify**: Report deployment status

**Triggers:**
- Push to `develop` branch
- Manual workflow dispatch

**Required Secrets:**
- `AWS_ROLE_ARN_STAGING`: IAM role for GitHub Actions
- `VERCEL_TOKEN`: (Optional) For frontend deployment
- `VERCEL_ORG_ID`: (Optional) Vercel organization
- `VERCEL_PROJECT_ID`: (Optional) Vercel project

### 3. Smoke Tests (`src/__tests__/smoke/staging.smoke.test.ts`)

Comprehensive post-deployment verification tests:

**Test Coverage:**
- ✅ API Gateway health endpoint
- ✅ CORS configuration
- ✅ All 5 DynamoDB tables accessibility
- ✅ Global Secondary Indexes
- ✅ S3 photo bucket
- ✅ Cognito User Pool configuration
- ✅ Password policy
- ✅ Phone sign-in enabled
- ✅ Performance benchmarks (< 2s API, < 1s DynamoDB)

**Total Tests:** 15 smoke tests

### 4. Deployment Scripts

**`infrastructure/scripts/deploy-staging.sh`**
- Automated deployment script
- Verifies AWS credentials
- Deploys CDK stack
- Extracts outputs
- Creates `.env.staging` file

### 5. Documentation

**Created Documentation:**
1. **STAGING_DEPLOYMENT.md**: Complete deployment guide
   - Prerequisites
   - Manual deployment steps
   - CI/CD setup
   - Verification procedures
   - Troubleshooting
   - Cost estimation
   - Monitoring setup

2. **STAGING_QUICK_START.md**: 5-minute quick start guide
   - Essential commands
   - Quick deployment
   - Basic verification

3. **src/__tests__/smoke/README.md**: Smoke tests documentation
   - Purpose and scope
   - Running tests
   - Expected results
   - Troubleshooting
   - Best practices

4. **STAGING_SETUP_SUMMARY.md**: This file

### 6. Configuration Updates

**Updated Files:**
- `infrastructure/bin/shelf-bidder.ts`: Added staging stack instantiation
- `package.json`: Added `test:smoke` script
- `infrastructure/README.md`: Added staging environment section

## File Structure

```
.github/workflows/
  └── deploy-staging.yml          # CI/CD pipeline

infrastructure/
  ├── lib/
  │   ├── shelf-bidder-staging-stack.ts  # Staging CDK stack
  │   └── staging-config.ts              # Staging configuration
  ├── scripts/
  │   └── deploy-staging.sh              # Deployment script
  ├── STAGING_DEPLOYMENT.md              # Full deployment guide
  ├── STAGING_QUICK_START.md             # Quick start guide
  └── STAGING_SETUP_SUMMARY.md           # This file

src/__tests__/smoke/
  ├── staging.smoke.test.ts              # Smoke tests
  └── README.md                          # Smoke tests documentation
```

## How to Use

### Quick Deployment

```bash
# 1. Bootstrap CDK (first time only)
cd infrastructure
cdk bootstrap

# 2. Deploy staging
./scripts/deploy-staging.sh

# 3. Run smoke tests
cd ..
npm run test:smoke
```

### CI/CD Deployment

1. Configure GitHub secrets:
   - `AWS_ROLE_ARN_STAGING`
   - (Optional) Vercel secrets

2. Push to `develop` branch or manually trigger workflow

3. Monitor deployment in GitHub Actions

### Manual Deployment

```bash
cd infrastructure
npx cdk deploy ShelfBidderStagingStack --outputs-file outputs.json
```

## Verification

After deployment, verify with smoke tests:

```bash
# Set environment variables
export STAGING_API_URL=$(jq -r '.ShelfBidderStagingStack.ApiUrl' infrastructure/outputs.json)
export STAGING_USER_POOL_ID=$(jq -r '.ShelfBidderStagingStack.UserPoolId' infrastructure/outputs.json)
export STAGING_USER_POOL_CLIENT_ID=$(jq -r '.ShelfBidderStagingStack.UserPoolClientId' infrastructure/outputs.json)
export STAGING_PHOTO_BUCKET=$(jq -r '.ShelfBidderStagingStack.PhotoBucketName' infrastructure/outputs.json)

# Run tests
npm run test:smoke
```

Expected: All 15 tests pass ✅

## Cost Estimation

**Monthly Cost:** $3-7 for staging environment

**Breakdown:**
- DynamoDB: $0.50-2 (pay-per-request)
- S3: $0.50-1 (shorter retention)
- API Gateway: $1-2 (lower traffic)
- Cognito: Free tier
- Data Transfer: $0.50-1

## Benefits

1. **Isolated Testing**: Separate environment for testing without affecting production
2. **Cost-Effective**: Optimized for lower costs with shorter retention and single-region
3. **Automated**: CI/CD pipeline automates deployment and verification
4. **Production-Ready**: Smoke tests ensure deployment success before promoting to production
5. **Easy Cleanup**: DESTROY policy allows easy environment teardown
6. **Fast Deployment**: Automated scripts reduce deployment time
7. **Comprehensive Verification**: 15 smoke tests cover all critical services

## Next Steps

1. ✅ Deploy staging infrastructure
2. ✅ Run smoke tests to verify
3. ⏭️ Deploy frontend application with staging config
4. ⏭️ Test authentication flow
5. ⏭️ Test photo upload and analysis
6. ⏭️ Test auction workflow
7. ⏭️ Test task completion
8. ⏭️ Performance testing
9. ⏭️ Security testing
10. ⏭️ Promote to production

## Troubleshooting

See detailed troubleshooting in:
- [STAGING_DEPLOYMENT.md](./STAGING_DEPLOYMENT.md#troubleshooting)
- [Smoke Tests README](../src/__tests__/smoke/README.md#troubleshooting)

## Related Tasks

- ✅ Task 1.2: Configure AWS infrastructure foundation
- ✅ Task 14.1: Implement integration test suite
- ✅ Task 14.2: Set up staging environment testing (This task)
- ⏭️ Task 14.3: Write comprehensive integration tests
- ⏭️ Task 15.2: Production deployment configuration

## Success Criteria

All success criteria for Task 14.2 have been met:

- ✅ Staging AWS environment configured
- ✅ Automated deployment pipeline implemented
- ✅ Smoke tests for production readiness added
- ✅ Documentation complete
- ✅ CI/CD integration working
- ✅ Cost-optimized configuration
- ✅ Easy cleanup and maintenance

## Conclusion

The staging environment is now fully operational and ready for testing. The automated deployment pipeline ensures consistent and reliable deployments, while comprehensive smoke tests verify that all critical services are functioning correctly.
