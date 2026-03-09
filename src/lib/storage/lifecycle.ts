/**
 * S3 Lifecycle Management
 * Handles lifecycle policies and storage monitoring for cost optimization
 */

import {
  PutBucketLifecycleConfigurationCommand,
  GetBucketLifecycleConfigurationCommand,
  ListObjectsV2Command,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import { s3Client, PHOTO_BUCKET_NAME } from './s3-client';

/**
 * Storage usage information
 */
export interface StorageUsage {
  totalBytes: number;
  totalGB: number;
  objectCount: number;
  byPrefix: {
    shelf: { bytes: number; count: number };
    proof: { bytes: number; count: number };
  };
  percentOfFreeLimit: number; // Percentage of 5GB Free Tier
}

/**
 * Lifecycle policy configuration result
 */
export interface LifecyclePolicyResult {
  success: boolean;
  message: string;
  appliedAt: string;
}

/**
 * Check current S3 storage usage across all photos
 * @returns Storage usage statistics
 */
export async function checkStorageUsage(): Promise<StorageUsage> {
  const usage: StorageUsage = {
    totalBytes: 0,
    totalGB: 0,
    objectCount: 0,
    byPrefix: {
      shelf: { bytes: 0, count: 0 },
      proof: { bytes: 0, count: 0 },
    },
    percentOfFreeLimit: 0,
  };

  try {
    // List all objects in the bucket
    let continuationToken: string | undefined;
    
    do {
      const command = new ListObjectsV2Command({
        Bucket: PHOTO_BUCKET_NAME,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);

      if (response.Contents) {
        for (const object of response.Contents) {
          const size = object.Size || 0;
          usage.totalBytes += size;
          usage.objectCount++;

          // Categorize by prefix
          if (object.Key?.startsWith('shelf/')) {
            usage.byPrefix.shelf.bytes += size;
            usage.byPrefix.shelf.count++;
          } else if (object.Key?.startsWith('proof/')) {
            usage.byPrefix.proof.bytes += size;
            usage.byPrefix.proof.count++;
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // Calculate GB and percentage
    usage.totalGB = usage.totalBytes / (1024 * 1024 * 1024);
    usage.percentOfFreeLimit = (usage.totalGB / 5) * 100; // 5GB Free Tier

    console.log('[S3 Lifecycle] 📊 Storage usage:', {
      totalGB: usage.totalGB.toFixed(2),
      percentOfFreeLimit: usage.percentOfFreeLimit.toFixed(1) + '%',
      objectCount: usage.objectCount,
    });

    return usage;
  } catch (error) {
    console.error('[S3 Lifecycle] ❌ Error checking storage usage:', error);
    throw new Error(
      `Failed to check storage usage: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Apply Glacier transition lifecycle policies to the S3 bucket
 * This is triggered automatically when storage exceeds 4.5GB (90% of 5GB Free Tier)
 * @returns Result of lifecycle policy application
 */
export async function applyGlacierTransition(): Promise<LifecyclePolicyResult> {
  try {
    console.log('[S3 Lifecycle] 🔄 Applying Glacier transition policies...');

    const lifecycleConfig = {
      Rules: [
        {
          Id: 'ArchiveShelfPhotos',
          Status: 'Enabled' as const,
          Filter: {
            Prefix: 'shelf/',
          },
          Transitions: [
            {
              Days: 30,
              StorageClass: 'STANDARD_IA' as const,
            },
            {
              Days: 60,
              StorageClass: 'GLACIER_IR' as const,
            },
          ],
          Expiration: {
            Days: 90,
          },
        },
        {
          Id: 'ArchiveProofPhotos',
          Status: 'Enabled' as const,
          Filter: {
            Prefix: 'proof/',
          },
          Transitions: [
            {
              Days: 30,
              StorageClass: 'STANDARD_IA' as const,
            },
            {
              Days: 90,
              StorageClass: 'GLACIER_IR' as const,
            },
          ],
          Expiration: {
            Days: 180,
          },
        },
        {
          Id: 'CleanupIncompleteUploads',
          Status: 'Enabled' as const,
          Filter: {},
          AbortIncompleteMultipartUpload: {
            DaysAfterInitiation: 7,
          },
        },
      ],
    };

    const command = new PutBucketLifecycleConfigurationCommand({
      Bucket: PHOTO_BUCKET_NAME,
      LifecycleConfiguration: lifecycleConfig,
    });

    await s3Client.send(command);

    const result: LifecyclePolicyResult = {
      success: true,
      message: 'Lifecycle policies applied successfully',
      appliedAt: new Date().toISOString(),
    };

    console.log('[S3 Lifecycle] ✅ Lifecycle policies applied:', result);

    return result;
  } catch (error) {
    console.error('[S3 Lifecycle] ❌ Error applying lifecycle policies:', error);

    return {
      success: false,
      message: `Failed to apply lifecycle policies: ${error instanceof Error ? error.message : 'Unknown error'}`,
      appliedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get current lifecycle configuration from the bucket
 * @returns Current lifecycle rules or null if none configured
 */
export async function getLifecycleConfiguration(): Promise<any | null> {
  try {
    const command = new GetBucketLifecycleConfigurationCommand({
      Bucket: PHOTO_BUCKET_NAME,
    });

    const response = await s3Client.send(command);
    return response.Rules || null;
  } catch (error: any) {
    // NoSuchLifecycleConfiguration is expected if no policies are set
    if (error.name === 'NoSuchLifecycleConfiguration') {
      return null;
    }
    throw error;
  }
}

/**
 * Monitor storage and automatically apply lifecycle policies if needed
 * This should be called periodically (e.g., daily via cron job or API endpoint)
 * @returns Monitoring result with actions taken
 */
export async function monitorAndApplyLifecyclePolicies(): Promise<{
  usage: StorageUsage;
  lifecyclePolicyApplied: boolean;
  lifecycleResult?: LifecyclePolicyResult;
  recommendation: string;
}> {
  console.log('[S3 Lifecycle] 🔍 Starting storage monitoring...');

  // Check current storage usage
  const usage = await checkStorageUsage();

  // Check if lifecycle policies are already configured
  const existingPolicies = await getLifecycleConfiguration();
  const policiesAlreadyConfigured = existingPolicies !== null;

  // Determine if we need to apply lifecycle policies
  const shouldApplyPolicies = usage.totalGB > 4.5 && !policiesAlreadyConfigured;

  let lifecyclePolicyApplied = false;
  let lifecycleResult: LifecyclePolicyResult | undefined;
  let recommendation = '';

  if (shouldApplyPolicies) {
    // Storage exceeds 90% of Free Tier limit - apply lifecycle policies
    console.log(
      `[S3 Lifecycle] ⚠️  Storage at ${usage.totalGB.toFixed(2)}GB (${usage.percentOfFreeLimit.toFixed(1)}%) - applying lifecycle policies`
    );
    lifecycleResult = await applyGlacierTransition();
    lifecyclePolicyApplied = lifecycleResult.success;
    recommendation = lifecycleResult.success
      ? 'Lifecycle policies applied successfully. Old photos will be transitioned to Glacier.'
      : 'Failed to apply lifecycle policies. Manual intervention required.';
  } else if (policiesAlreadyConfigured) {
    recommendation = `Lifecycle policies already configured. Current usage: ${usage.totalGB.toFixed(2)}GB (${usage.percentOfFreeLimit.toFixed(1)}%)`;
  } else if (usage.totalGB > 3.5) {
    // Warning threshold: 70% of Free Tier
    recommendation = `Storage at ${usage.totalGB.toFixed(2)}GB (${usage.percentOfFreeLimit.toFixed(1)}%). Approaching threshold for lifecycle policy application (4.5GB).`;
  } else {
    recommendation = `Storage usage healthy: ${usage.totalGB.toFixed(2)}GB (${usage.percentOfFreeLimit.toFixed(1)}%)`;
  }

  console.log('[S3 Lifecycle] 📋 Monitoring complete:', {
    totalGB: usage.totalGB.toFixed(2),
    percentOfFreeLimit: usage.percentOfFreeLimit.toFixed(1) + '%',
    lifecyclePolicyApplied,
    recommendation,
  });

  return {
    usage,
    lifecyclePolicyApplied,
    lifecycleResult,
    recommendation,
  };
}
