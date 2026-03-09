/**
 * Backup and Disaster Recovery Configuration
 * Task 15.2: Implement backup and disaster recovery
 */

import * as cdk from 'aws-cdk-lib';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface BackupConfigProps {
  dynamoTableArns: string[];
  s3BucketArn: string;
  environment: 'staging' | 'production';
}

export class BackupConfig extends Construct {
  public readonly backupVault: backup.BackupVault;
  public readonly backupPlan: backup.BackupPlan;

  constructor(scope: Construct, id: string, props: BackupConfigProps) {
    super(scope, id);

    // Create backup vault
    this.backupVault = new backup.BackupVault(this, 'BackupVault', {
      backupVaultName: `${props.environment}-shelf-bidder-vault`,
      removalPolicy: props.environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // Create backup plan
    this.backupPlan = new backup.BackupPlan(this, 'BackupPlan', {
      backupPlanName: `${props.environment}-shelf-bidder-plan`,
      backupVault: this.backupVault,
    });

    // Production backup rules
    if (props.environment === 'production') {
      // Daily backups - retained for 30 days
      this.backupPlan.addRule(new backup.BackupPlanRule({
        ruleName: 'DailyBackups',
        scheduleExpression: events.Schedule.cron({
          hour: '2',
          minute: '0',
        }),
        deleteAfter: cdk.Duration.days(30),
        moveToColdStorageAfter: cdk.Duration.days(7),
      }));

      // Weekly backups - retained for 90 days
      this.backupPlan.addRule(new backup.BackupPlanRule({
        ruleName: 'WeeklyBackups',
        scheduleExpression: events.Schedule.cron({
          weekDay: 'SUN',
          hour: '3',
          minute: '0',
        }),
        deleteAfter: cdk.Duration.days(90),
        moveToColdStorageAfter: cdk.Duration.days(14),
      }));

      // Monthly backups - retained for 1 year
      this.backupPlan.addRule(new backup.BackupPlanRule({
        ruleName: 'MonthlyBackups',
        scheduleExpression: events.Schedule.cron({
          day: '1',
          hour: '4',
          minute: '0',
        }),
        deleteAfter: cdk.Duration.days(365),
        moveToColdStorageAfter: cdk.Duration.days(30),
      }));
    } else {
      // Staging: Daily backups only - retained for 7 days
      this.backupPlan.addRule(new backup.BackupPlanRule({
        ruleName: 'DailyBackups',
        scheduleExpression: events.Schedule.cron({
          hour: '2',
          minute: '0',
        }),
        deleteAfter: cdk.Duration.days(7),
      }));
    }

    // Add DynamoDB tables to backup
    props.dynamoTableArns.forEach((tableArn, index) => {
      this.backupPlan.addSelection(`DynamoDBTable${index}`, {
        resources: [
          backup.BackupResource.fromArn(tableArn),
        ],
      });
    });

    // Add S3 bucket to backup (if needed)
    // Note: S3 versioning is often preferred over AWS Backup for S3
    // this.backupPlan.addSelection('S3Bucket', {
    //   resources: [
    //     backup.BackupResource.fromArn(props.s3BucketArn),
    //   ],
    // });
  }
}

/**
 * Point-in-Time Recovery Configuration for DynamoDB
 */
export interface PITRConfigProps {
  tableName: string;
  environment: 'staging' | 'production';
}

export function enablePointInTimeRecovery(
  table: any, // DynamoDB Table construct
  environment: 'staging' | 'production'
): void {
  if (environment === 'production') {
    // Enable PITR for production tables
    table.pointInTimeRecovery = true;
  }
}

/**
 * Disaster Recovery Configuration
 */
export interface DisasterRecoveryProps {
  primaryRegion: string;
  drRegion: string;
  environment: 'staging' | 'production';
}

export class DisasterRecoveryConfig extends Construct {
  constructor(scope: Construct, id: string, props: DisasterRecoveryProps) {
    super(scope, id);

    // For production, set up cross-region replication
    if (props.environment === 'production') {
      // DynamoDB Global Tables are configured in the main stack
      // S3 Cross-Region Replication is configured in the main stack
      
      // Create IAM role for disaster recovery operations
      const drRole = new iam.Role(this, 'DisasterRecoveryRole', {
        roleName: `${props.environment}-disaster-recovery-role`,
        assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
        description: 'Role for disaster recovery operations',
      });

      // Add permissions for cross-region restore
      drRole.addToPolicy(new iam.PolicyStatement({
        actions: [
          'dynamodb:RestoreTableFromBackup',
          'dynamodb:RestoreTableToPointInTime',
          's3:RestoreObject',
          's3:GetObject',
          's3:PutObject',
        ],
        resources: ['*'],
      }));

      // Output DR role ARN
      new cdk.CfnOutput(this, 'DRRoleArn', {
        value: drRole.roleArn,
        description: 'Disaster Recovery Role ARN',
        exportName: `${props.environment}-dr-role-arn`,
      });
    }
  }
}

/**
 * Backup Monitoring and Alerts
 */
export interface BackupMonitoringProps {
  backupVault: backup.BackupVault;
  alarmTopicArn: string;
  environment: 'staging' | 'production';
}

export class BackupMonitoring extends Construct {
  constructor(scope: Construct, id: string, props: BackupMonitoringProps) {
    super(scope, id);

    // Create CloudWatch alarm for failed backups
    // This would typically be done using CloudWatch Events
    // and SNS notifications configured in the monitoring stack
    
    // Example: Monitor backup job failures
    // const backupFailureRule = new events.Rule(this, 'BackupFailureRule', {
    //   eventPattern: {
    //     source: ['aws.backup'],
    //     detailType: ['Backup Job State Change'],
    //     detail: {
    //       state: ['FAILED', 'ABORTED'],
    //     },
    //   },
    // });
    
    // backupFailureRule.addTarget(
    //   new targets.SnsTopic(sns.Topic.fromTopicArn(
    //     this,
    //     'AlarmTopic',
    //     props.alarmTopicArn
    //   ))
    // );
  }
}
