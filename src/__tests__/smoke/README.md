# Smoke Tests

Smoke tests verify that critical services are operational after deployment to staging or production environments.

## Purpose

Smoke tests are lightweight, fast tests that check:
- ✅ Services are accessible
- ✅ Basic functionality works
- ✅ Configuration is correct
- ✅ Performance meets minimum requirements

They do NOT test:
- ❌ Complex business logic
- ❌ Edge cases
- ❌ Integration workflows
- ❌ User interface

## Running Smoke Tests

### Prerequisites

1. **AWS Credentials**: Configure AWS CLI with appropriate permissions
   ```bash
   aws configure
   ```

2. **Environment Variables**: Set staging/production endpoints
   ```bash
   export STAGING_API_URL=https://your-api.execute-api.us-east-1.amazonaws.com/staging/
   export STAGING_PHOTO_BUCKET=shelf-bidder-staging-photos-XXXXXXXXXXXX
   export STAGING_DYNAMO_TABLES=1
   export AWS_REGION=us-east-1
   ```

### Run Tests

```bash
# Run all smoke tests
npm run test:smoke

# Run with verbose output
npm run test:smoke -- --verbose

# Run specific test file
npm run test:smoke -- staging.smoke.test.ts
```

### After Deployment

Smoke tests are automatically run in the CI/CD pipeline after staging deployment. You can also run them manually:

```bash
# Using deployment script outputs
cd infrastructure
./scripts/deploy-staging.sh

# Then run smoke tests
cd ..
export STAGING_API_URL=$(jq -r '.ShelfBidderStagingStack.ApiUrl' infrastructure/outputs.json)
export STAGING_PHOTO_BUCKET=$(jq -r '.ShelfBidderStagingStack.PhotoBucketName' infrastructure/outputs.json)
export STAGING_DYNAMO_TABLES=1
npm run test:smoke
```

## Test Coverage

### API Gateway Health
- ✅ Health endpoint responds with 200
- ✅ Returns correct environment identifier
- ✅ CORS headers configured

### DynamoDB Tables
- ✅ All 5 tables exist and are ACTIVE
- ✅ Correct table names with environment prefix
- ✅ Global Secondary Indexes configured
- ✅ GSIs are ACTIVE

### S3 Photo Bucket
- ✅ Bucket exists and is accessible
- ✅ Correct bucket name with environment prefix

### Performance
- ✅ API responds within 2 seconds
- ✅ DynamoDB queries complete within 1 second

## Expected Results

All tests should pass after a successful deployment:

```
PASS  src/__tests__/smoke/staging.smoke.test.ts
  Staging Environment Smoke Tests
    API Gateway Health
      ✓ should respond to health check endpoint (XXXms)
      ✓ should have CORS headers configured (XXXms)
    DynamoDB Tables
      ✓ should have Shopkeepers table accessible (XXXms)
      ✓ should have ShelfSpaces table accessible (XXXms)
      ✓ should have Auctions table accessible (XXXms)
      ✓ should have Tasks table accessible (XXXms)
      ✓ should have Transactions table accessible (XXXms)
      ✓ should have ShelfSpaces table with correct GSI (XXXms)
      ✓ should have Auctions table with correct GSIs (XXXms)
    S3 Photo Bucket
      ✓ should have photo bucket accessible (XXXms)
    Performance Checks
      ✓ should respond to API health check within 2 seconds (XXXms)
      ✓ should describe DynamoDB table within 1 second (XXXms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

## Troubleshooting

### Tests Skipped with Warnings

If you see warnings like:
```
STAGING_API_URL not set, skipping API health check
```

**Solution**: Set the required environment variables before running tests.

### AWS Credentials Error

**Error**: "Unable to locate credentials"

**Solution**: Configure AWS CLI:
```bash
aws configure
```

### Permission Denied

**Error**: "User is not authorized to perform: dynamodb:DescribeTable"

**Solution**: Ensure your AWS credentials have read permissions for:
- DynamoDB: DescribeTable
- S3: HeadBucket
- API Gateway: GET requests

### Timeout Errors

**Error**: "Timeout of 10000ms exceeded"

**Solution**: 
1. Check network connectivity
2. Verify AWS region is correct
3. Ensure services are fully deployed (wait 1-2 minutes after deployment)

### Table Not Found

**Error**: "Requested resource not found: Table: ShelfBidder-Staging-Shopkeepers not found"

**Solution**: 
1. Verify deployment completed successfully
2. Check table name matches staging config
3. Ensure you're in the correct AWS region

## Adding New Smoke Tests

When adding new infrastructure components, add corresponding smoke tests:

```typescript
describe('New Component', () => {
  it('should be accessible', async () => {
    // Test that component exists and is operational
    expect(component).toBeDefined();
  });

  it('should have correct configuration', async () => {
    // Test that configuration matches expectations
    expect(config).toMatchObject(expectedConfig);
  });
});
```

### Guidelines

1. **Fast**: Each test should complete in < 10 seconds
2. **Independent**: Tests should not depend on each other
3. **Idempotent**: Tests should not modify state
4. **Clear**: Test names should clearly describe what is being verified
5. **Resilient**: Tests should handle missing environment variables gracefully

## CI/CD Integration

Smoke tests are integrated into the GitHub Actions workflow:

```yaml
- name: Run smoke tests
  env:
    STAGING_API_URL: ${{ needs.deploy-infrastructure.outputs.api-url }}
    STAGING_DYNAMO_TABLES: 1
    # ... other env vars
  run: npm run test:smoke
```

Tests must pass before deployment is considered successful.

## Best Practices

1. **Run After Every Deployment**: Always run smoke tests after deploying to staging
2. **Monitor Performance**: Track test execution times to detect performance degradation
3. **Update Tests**: Keep tests in sync with infrastructure changes
4. **Document Failures**: If tests fail, document the issue and resolution
5. **Automate**: Integrate smoke tests into CI/CD pipeline

## Related Documentation

- [Infrastructure README](../../../infrastructure/README.md)
