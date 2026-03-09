/**
 * CloudWatch Alarms Configuration
 * Task 15.2: Production monitoring and alerting
 */

import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringAlarmsProps {
  apiGatewayName: string;
  dynamoTableNames: string[];
  s3BucketName: string;
  alarmEmail: string;
  environment: 'staging' | 'production';
}

export class MonitoringAlarms extends Construct {
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringAlarmsProps) {
    super(scope, id);

    // Create SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      displayName: `${props.environment}-shelf-bidder-alarms`,
      topicName: `${props.environment}-shelf-bidder-alarms`,
    });

    // Add email subscription
    this.alarmTopic.addSubscription(
      new subscriptions.EmailSubscription(props.alarmEmail)
    );

    const alarmAction = new cloudwatch_actions.SnsAction(this.alarmTopic);

    // API Gateway Alarms
    this.createApiGatewayAlarms(props.apiGatewayName, alarmAction, props.environment);

    // DynamoDB Alarms
    props.dynamoTableNames.forEach(tableName => {
      this.createDynamoDBAlarms(tableName, alarmAction, props.environment);
    });

    // S3 Alarms
    this.createS3Alarms(props.s3BucketName, alarmAction, props.environment);

    // Lambda Alarms (if applicable)
    this.createLambdaAlarms(alarmAction, props.environment);
  }

  private createApiGatewayAlarms(
    apiName: string,
    alarmAction: cloudwatch_actions.SnsAction,
    environment: string
  ) {
    // 5xx Error Rate
    new cloudwatch.Alarm(this, 'ApiGateway5xxErrors', {
      alarmName: `${environment}-api-5xx-errors`,
      alarmDescription: 'Alert when API Gateway 5xx error rate is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '5XXError',
        dimensionsMap: {
          ApiName: apiName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // 4xx Error Rate
    new cloudwatch.Alarm(this, 'ApiGateway4xxErrors', {
      alarmName: `${environment}-api-4xx-errors`,
      alarmDescription: 'Alert when API Gateway 4xx error rate is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: '4XXError',
        dimensionsMap: {
          ApiName: apiName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 50,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // High Latency
    new cloudwatch.Alarm(this, 'ApiGatewayLatency', {
      alarmName: `${environment}-api-high-latency`,
      alarmDescription: 'Alert when API Gateway latency is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApiGateway',
        metricName: 'Latency',
        dimensionsMap: {
          ApiName: apiName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 2000, // 2 seconds
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);
  }

  private createDynamoDBAlarms(
    tableName: string,
    alarmAction: cloudwatch_actions.SnsAction,
    environment: string
  ) {
    // Read Throttling
    new cloudwatch.Alarm(this, `DynamoDB-${tableName}-ReadThrottle`, {
      alarmName: `${environment}-dynamodb-${tableName}-read-throttle`,
      alarmDescription: `Alert when ${tableName} read requests are throttled`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'ReadThrottleEvents',
        dimensionsMap: {
          TableName: tableName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // Write Throttling
    new cloudwatch.Alarm(this, `DynamoDB-${tableName}-WriteThrottle`, {
      alarmName: `${environment}-dynamodb-${tableName}-write-throttle`,
      alarmDescription: `Alert when ${tableName} write requests are throttled`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'WriteThrottleEvents',
        dimensionsMap: {
          TableName: tableName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // User Errors
    new cloudwatch.Alarm(this, `DynamoDB-${tableName}-UserErrors`, {
      alarmName: `${environment}-dynamodb-${tableName}-user-errors`,
      alarmDescription: `Alert when ${tableName} has user errors`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/DynamoDB',
        metricName: 'UserErrors',
        dimensionsMap: {
          TableName: tableName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);
  }

  private createS3Alarms(
    bucketName: string,
    alarmAction: cloudwatch_actions.SnsAction,
    environment: string
  ) {
    // 4xx Errors
    new cloudwatch.Alarm(this, 'S3-4xxErrors', {
      alarmName: `${environment}-s3-4xx-errors`,
      alarmDescription: 'Alert when S3 4xx error rate is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: '4xxErrors',
        dimensionsMap: {
          BucketName: bucketName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 20,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);

    // 5xx Errors
    new cloudwatch.Alarm(this, 'S3-5xxErrors', {
      alarmName: `${environment}-s3-5xx-errors`,
      alarmDescription: 'Alert when S3 5xx error rate is high',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: '5xxErrors',
        dimensionsMap: {
          BucketName: bucketName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(alarmAction);
  }

  private createLambdaAlarms(
    alarmAction: cloudwatch_actions.SnsAction,
    environment: string
  ) {
    // Lambda Errors (if you have Lambda functions)
    // This is a placeholder - adjust based on your actual Lambda functions
    
    // Example: Auction Lambda Errors
    // new cloudwatch.Alarm(this, 'LambdaAuctionErrors', {
    //   alarmName: `${environment}-lambda-auction-errors`,
    //   alarmDescription: 'Alert when auction Lambda has errors',
    //   metric: new cloudwatch.Metric({
    //     namespace: 'AWS/Lambda',
    //     metricName: 'Errors',
    //     dimensionsMap: {
    //       FunctionName: 'auction-function-name',
    //     },
    //     statistic: 'Sum',
    //     period: cdk.Duration.minutes(5),
    //   }),
    //   threshold: 5,
    //   evaluationPeriods: 1,
    //   comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    //   treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    // }).addAlarmAction(alarmAction);
  }
}
