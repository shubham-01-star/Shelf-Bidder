# S3 Lifecycle Management and Storage Monitoring

This module implements automatic S3 lifecycle policies and storage monitoring to optimize costs within AWS Free Tier limits.

## Overview

The system monitors S3 storage usage and automatically applies lifecycle policies when storage exceeds 4.5GB (90% of the 5GB Free Tier limit). This ensures cost optimization by transitioning older photos to cheaper storage classes.

## Features

### 1. Storage Usage Monitoring

- **Real-time monitoring**: Check current S3 bucket usage across all photos
- **Categorization**: Track usage by photo type (shelf vs proof)
- **Free Tier tracking**: Calculate percentage of 5GB Free Tier used

### 2. Automatic Lifecycle Policies

When storage exceeds 4.5GB (90% threshold), the system automatically applies:

#### Shelf Photos (`shelf/` prefix)
- **Days 0-30**: S3 Standard (frequent access)
- **Days 30-60**: S3 Standard-IA (infrequent access)
- **Days 60-90**: S3 Glacier Instant Retrieval (archive)
- **Day 90+**: Deleted

#### Proof Photos (`proof/` prefix)
- **Days 0-30**: S3 Standard (frequent access for verification)
- **Days 30-90**: S3 Standard-IA (occasional access)
- **Days 90-180**: S3 Glacier Instant Retrieval (audit archive)
- **Day 180+**: Deleted

#### Incomplete Upload Cleanup
- Aborts incomplete multipart uploads after 7 days

## API Endpoints

### 1. Storage Usage Check
```
GET /api/storage/usage
```

Returns current storage usage statistics without applying any policies.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalGB": 3.45,
    "totalBytes": 3704857600,
    "objectCount": 1250,
    "percentOfFreeLimit": 69.0,
    "byPrefix": {
      "shelf": {
        "gb": 2.10,
        "bytes": 2254857600,
        "count": 750
      },
      "proof": {
        "gb": 1.35,
        "bytes": 1450000000,
        "count": 500
      }
    },
    "freeTierLimit": {
      "totalGB": 5,
      "remainingGB": 1.55
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 2. Storage Monitoring with Auto-Policy Application
```
GET /api/storage/monitor
```

Monitors storage and automatically applies lifecycle policies if needed (>4.5GB).

**Response:**
```json
{
  "success": true,
  "data": {
    "usage": {
      "totalGB": 4.65,
      "objectCount": 1500,
      "percentOfFreeLimit": 93.0
    },
    "lifecyclePolicyApplied": true,
    "lifecycleResult": {
      "success": true,
      "message": "Lifecycle policies applied successfully",
      "appliedAt": "2024-01-15T10:30:00.000Z"
    },
    "recommendation": "Lifecycle policies applied successfully. Old photos will be transitioned to Glacier.",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Manual Lifecycle Policy Application
```
POST /api/storage/monitor
```

Manually triggers lifecycle policy application regardless of storage usage.

### 4. Scheduled Cron Job
```
POST /api/storage/cron
Authorization: Bearer <CRON_SECRET>
```

Scheduled endpoint for daily monitoring. Requires `CRON_SECRET` environment variable.

## Usage

### Programmatic Usage

```typescript
import {
  checkStorageUsage,
  applyGlacierTransition,
  monitorAndApplyLifecyclePolicies,
} from '@/lib/storage';

// Check current storage usage
const usage = await checkStorageUsage();
console.log(`Storage: ${usage.totalGB.toFixed(2)}GB (${usage.percentOfFreeLimit.toFixed(1)}%)`);

// Manually apply lifecycle policies
const result = await applyGlacierTransition();
console.log(`Policies applied: ${result.success}`);

// Monitor and auto-apply if needed
const monitoring = await monitorAndApplyLifecyclePolicies();
console.log(monitoring.recommendation);
```

### Scheduled Monitoring

#### Option 1: AWS CloudWatch Events (Recommended for Production)

Create a CloudWatch Events rule to trigger the cron endpoint daily:

```bash
# Create EventBridge rule
aws events put-rule \
  --name shelf-bidder-storage-monitor \
  --schedule-expression "cron(0 2 * * ? *)" \
  --description "Daily S3 storage monitoring at 2 AM UTC"

# Add target (API Gateway or Lambda)
aws events put-targets \
  --rule shelf-bidder-storage-monitor \
  --targets "Id"="1","Arn"="<your-api-endpoint>"
```

#### Option 2: External Cron Service

Use services like:
- **Cron-job.org**: Free cron job service
- **EasyCron**: Scheduled HTTP requests
- **GitHub Actions**: Scheduled workflows

Example GitHub Actions workflow:

```yaml
name: Storage Monitoring
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Storage Monitoring
        run: |
          curl -X POST https://your-domain.com/api/storage/cron \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

#### Option 3: Manual Trigger

For development or testing:

```bash
# Check usage
curl https://your-domain.com/api/storage/usage

# Monitor and apply policies
curl https://your-domain.com/api/storage/monitor

# Scheduled cron (requires secret)
curl -X POST https://your-domain.com/api/storage/cron \
  -H "Authorization: Bearer your-cron-secret"
```

## Environment Variables

```env
# AWS Configuration (required)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
NEXT_PUBLIC_AWS_REGION=us-east-1
AWS_ACCOUNT_ID=338261675242

# S3 Bucket (required)
PHOTO_BUCKET_NAME=shelf-bidder-photos-338261675242
# or
S3_BUCKET_PHOTOS=shelf-bidder-photos-338261675242

# Cron Security (required for scheduled jobs)
CRON_SECRET=your-secure-random-secret
```

## Cost Optimization

### Storage Cost Breakdown

| Storage Class | Cost per GB/month | Use Case |
|--------------|-------------------|----------|
| S3 Standard | $0.023 | Active photos (0-30 days) |
| S3 Standard-IA | $0.0125 | Recent photos (30-90 days) |
| S3 Glacier IR | $0.004 | Archive photos (90+ days) |

### Estimated Savings

With 1000 active shopkeepers:
- **Without lifecycle policies**: ~$9.19/month
- **With lifecycle policies**: ~$4.50/month
- **Savings**: ~50% reduction in storage costs

## Monitoring and Alerts

### Thresholds

- **70% (3.5GB)**: Warning logged, no action taken
- **90% (4.5GB)**: Lifecycle policies automatically applied
- **100% (5GB)**: Free Tier limit reached

### Recommendations

1. **Daily monitoring**: Run cron job daily to track usage trends
2. **Alert setup**: Configure CloudWatch alarms for storage metrics
3. **Manual review**: Periodically review lifecycle policy effectiveness
4. **Cost tracking**: Monitor AWS billing for S3 costs

## Testing

### Local Testing

```bash
# Start development server
npm run dev

# Test storage usage endpoint
curl http://localhost:3000/api/storage/usage

# Test monitoring endpoint
curl http://localhost:3000/api/storage/monitor

# Test cron endpoint (with auth)
curl -X POST http://localhost:3000/api/storage/cron \
  -H "Authorization: Bearer dev-cron-secret"
```

### Integration Testing

See `src/lib/storage/__tests__/lifecycle.test.ts` for unit tests.

## Troubleshooting

### Common Issues

1. **"Failed to check storage usage"**
   - Verify AWS credentials are configured
   - Check S3 bucket name is correct
   - Ensure IAM permissions include `s3:ListBucket`

2. **"Failed to apply lifecycle policies"**
   - Verify IAM permissions include `s3:PutLifecycleConfiguration`
   - Check bucket exists and is accessible
   - Review CloudWatch logs for detailed errors

3. **"Unauthorized" on cron endpoint**
   - Verify `CRON_SECRET` environment variable is set
   - Check Authorization header format: `Bearer <secret>`

### Required IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetLifecycleConfiguration",
        "s3:PutLifecycleConfiguration"
      ],
      "Resource": "arn:aws:s3:::shelf-bidder-photos-*"
    }
  ]
}
```

## Future Enhancements

1. **Intelligent Tiering**: Consider S3 Intelligent-Tiering for unpredictable access patterns
2. **Cross-Region Replication**: For disaster recovery
3. **Object Lock**: For regulatory compliance
4. **Versioning**: For accidental deletion protection
5. **CloudWatch Dashboards**: Visual monitoring of storage metrics
6. **Email Alerts**: Notify administrators when policies are applied

## References

- [S3 Lifecycle Configuration Documentation](../../docs/S3_LIFECYCLE_CONFIGURATION.md)
- [AWS S3 Lifecycle Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [AWS Free Tier Limits](https://aws.amazon.com/free/)
