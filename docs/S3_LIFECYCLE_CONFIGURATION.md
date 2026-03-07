# S3 Lifecycle Configuration for Shelf-Bidder

## Overview

This document describes the S3 bucket organization and lifecycle policies for the Shelf-Bidder photo storage system.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    S3 Storage Monitoring                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Daily Cron Job  │
                    │  (2 AM UTC)      │
                    └──────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  Check Storage Usage          │
              │  - Scan S3 bucket             │
              │  - Calculate total GB         │
              │  - Check % of Free Tier       │
              └───────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Usage > 4.5GB?  │
                    │  (90% threshold) │
                    └──────────────────┘
                         │         │
                    No   │         │   Yes
                         │         │
                         ▼         ▼
              ┌──────────────┐  ┌──────────────────────┐
              │  Continue    │  │  Apply Lifecycle     │
              │  Monitoring  │  │  Policies            │
              └──────────────┘  └──────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │  Automatic Transitions │
                              │  - Shelf: 30→60→90 days│
                              │  - Proof: 30→90→180 days│
                              └────────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │  Cost Savings Achieved │
                              │  (~50% reduction)      │
                              └────────────────────────┘
```

## Bucket Organization

### Folder Structure

```
shelf-bidder-photos-{account-id}/
├── shelf/
│   └── {shopkeeper-id}/
│       └── {timestamp}.{ext}
└── proof/
    └── {shopkeeper-id}/
        └── {timestamp}.{ext}
```

### Photo Types

1. **Shelf Photos** (`shelf/`)
   - Daily shelf space analysis photos
   - Used for empty space detection
   - Retention: 90 days

2. **Proof Photos** (`proof/`)
   - Task completion verification photos
   - Used for campaign verification
   - Retention: 180 days (for audit trail)

## Lifecycle Policies

### Policy 1: Shelf Photos Archival

**Purpose**: Reduce storage costs for older shelf photos

```json
{
  "Rules": [
    {
      "Id": "ArchiveShelfPhotos",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "shelf/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 60,
          "StorageClass": "GLACIER_IR"
        }
      ],
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
```

**Lifecycle Stages**:
- Days 0-30: S3 Standard (frequent access)
- Days 30-60: S3 Standard-IA (infrequent access)
- Days 60-90: S3 Glacier Instant Retrieval (archive)
- Day 90+: Deleted

### Policy 2: Proof Photos Archival

**Purpose**: Retain proof photos longer for audit compliance

```json
{
  "Rules": [
    {
      "Id": "ArchiveProofPhotos",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "proof/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER_IR"
        }
      ],
      "Expiration": {
        "Days": 180
      }
    }
  ]
}
```

**Lifecycle Stages**:
- Days 0-30: S3 Standard (frequent access for verification)
- Days 30-90: S3 Standard-IA (occasional access)
- Days 90-180: S3 Glacier Instant Retrieval (audit archive)
- Day 180+: Deleted

### Policy 3: Incomplete Multipart Upload Cleanup

**Purpose**: Clean up failed uploads to reduce costs

```json
{
  "Rules": [
    {
      "Id": "CleanupIncompleteUploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    }
  ]
}
```

## Cost Optimization

### Storage Cost Breakdown

| Storage Class | Cost per GB/month | Use Case |
|--------------|-------------------|----------|
| S3 Standard | $0.023 | Active photos (0-30 days) |
| S3 Standard-IA | $0.0125 | Recent photos (30-90 days) |
| S3 Glacier IR | $0.004 | Archive photos (90+ days) |

### Estimated Monthly Costs

**Assumptions**:
- 1000 active shopkeepers
- 1 shelf photo per day per shopkeeper (5MB average)
- 0.5 proof photos per day per shopkeeper (3MB average)

**Monthly Storage**:
- Shelf photos: 1000 × 30 × 5MB = 150GB (Standard)
- Proof photos: 1000 × 15 × 3MB = 45GB (Standard)
- Archived shelf: 1000 × 60 × 5MB = 300GB (IA + Glacier)
- Archived proof: 1000 × 150 × 3MB = 450GB (IA + Glacier)

**Monthly Cost Estimate**:
- Standard: (150 + 45) × $0.023 = $4.49
- Standard-IA: 200GB × $0.0125 = $2.50
- Glacier IR: 550GB × $0.004 = $2.20
- **Total: ~$9.19/month**

## Implementation

### AWS CLI Commands

#### Apply Lifecycle Configuration

```bash
# Create lifecycle configuration file
cat > lifecycle-config.json << EOF
{
  "Rules": [
    {
      "Id": "ArchiveShelfPhotos",
      "Status": "Enabled",
      "Filter": { "Prefix": "shelf/" },
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" },
        { "Days": 60, "StorageClass": "GLACIER_IR" }
      ],
      "Expiration": { "Days": 90 }
    },
    {
      "Id": "ArchiveProofPhotos",
      "Status": "Enabled",
      "Filter": { "Prefix": "proof/" },
      "Transitions": [
        { "Days": 30, "StorageClass": "STANDARD_IA" },
        { "Days": 90, "StorageClass": "GLACIER_IR" }
      ],
      "Expiration": { "Days": 180 }
    },
    {
      "Id": "CleanupIncompleteUploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
    }
  ]
}
EOF

# Apply to bucket
aws s3api put-bucket-lifecycle-configuration \
  --bucket shelf-bidder-photos-338261675242 \
  --lifecycle-configuration file://lifecycle-config.json
```

#### Verify Configuration

```bash
aws s3api get-bucket-lifecycle-configuration \
  --bucket shelf-bidder-photos-338261675242
```

### CDK Implementation

Add to your CDK stack:

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

const photoBucket = new s3.Bucket(this, 'PhotoBucket', {
  bucketName: `shelf-bidder-photos-${this.account}`,
  lifecycleRules: [
    {
      id: 'ArchiveShelfPhotos',
      enabled: true,
      prefix: 'shelf/',
      transitions: [
        {
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        },
        {
          storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
          transitionAfter: cdk.Duration.days(60),
        },
      ],
      expiration: cdk.Duration.days(90),
    },
    {
      id: 'ArchiveProofPhotos',
      enabled: true,
      prefix: 'proof/',
      transitions: [
        {
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        },
        {
          storageClass: s3.StorageClass.GLACIER_INSTANT_RETRIEVAL,
          transitionAfter: cdk.Duration.days(90),
        },
      ],
      expiration: cdk.Duration.days(180),
    },
    {
      id: 'CleanupIncompleteUploads',
      enabled: true,
      abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
    },
  ],
});
```

## Monitoring

### CloudWatch Metrics

Monitor these metrics to track lifecycle effectiveness:

1. **Storage Metrics**:
   - `BucketSizeBytes` by storage class
   - `NumberOfObjects` by storage class

2. **Cost Metrics**:
   - Daily storage costs by class
   - Transition request costs

3. **Lifecycle Metrics**:
   - Objects transitioned per day
   - Objects expired per day

### Alerts

Set up CloudWatch alarms for:

1. **Storage Growth**: Alert if total storage exceeds expected growth rate
2. **Cost Anomalies**: Alert if daily costs exceed threshold
3. **Failed Transitions**: Alert if lifecycle transitions fail

## Best Practices

1. **Photo Naming**: Use timestamp-based naming for easy lifecycle management
2. **Metadata**: Store critical metadata in PostgreSQL, not S3 tags
3. **Retrieval**: Cache frequently accessed photos in CloudFront
4. **Cleanup**: Run periodic audits to verify lifecycle policies are working
5. **Testing**: Test lifecycle policies in staging before production

## Compliance

### Data Retention

- **Shelf Photos**: 90 days (operational requirement)
- **Proof Photos**: 180 days (audit requirement)
- **Metadata**: Permanent (PostgreSQL)

### Data Deletion

- Automatic deletion via S3 lifecycle policies
- Manual deletion available via API
- Soft delete in PostgreSQL (mark as deleted, retain metadata)

## Future Enhancements

1. **Intelligent Tiering**: Consider S3 Intelligent-Tiering for unpredictable access patterns
2. **Cross-Region Replication**: For disaster recovery
3. **Object Lock**: For regulatory compliance
4. **Versioning**: For accidental deletion protection
