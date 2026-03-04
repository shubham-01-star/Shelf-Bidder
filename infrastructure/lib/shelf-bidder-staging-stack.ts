import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';

/**
 * Staging Stack for Shelf-Bidder
 *
 * A lighter-weight copy of the production stack with:
 *  - DESTROY removal policies (easy cleanup)
 *  - "Staging-" table name prefixes
 *  - No S3 replication bucket
 */
export class ShelfBidderStagingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── DynamoDB Tables ──────────────────────────────────────────
    const shopkeepersTable = new dynamodb.Table(this, 'ShopkeepersTable', {
      tableName: 'Staging-ShelfBidder-Shopkeepers',
      partitionKey: { name: 'shopkeeperId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const shelfSpacesTable = new dynamodb.Table(this, 'ShelfSpacesTable', {
      tableName: 'Staging-ShelfBidder-ShelfSpaces',
      partitionKey: { name: 'shopkeeperId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'analysisDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    shelfSpacesTable.addGlobalSecondaryIndex({
      indexName: 'ShelfSpaceIdIndex',
      partitionKey: { name: 'shelfSpaceId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const auctionsTable = new dynamodb.Table(this, 'AuctionsTable', {
      tableName: 'Staging-ShelfBidder-Auctions',
      partitionKey: { name: 'auctionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    auctionsTable.addGlobalSecondaryIndex({
      indexName: 'ShelfSpaceStartTimeIndex',
      partitionKey: { name: 'shelfSpaceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'startTime', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    auctionsTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'startTime', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const tasksTable = new dynamodb.Table(this, 'TasksTable', {
      tableName: 'Staging-ShelfBidder-Tasks',
      partitionKey: { name: 'shopkeeperId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'assignedDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    tasksTable.addGlobalSecondaryIndex({
      indexName: 'TaskIdIndex',
      partitionKey: { name: 'taskId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    tasksTable.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'assignedDate', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const transactionsTable = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: 'Staging-ShelfBidder-Transactions',
      partitionKey: { name: 'shopkeeperId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    transactionsTable.addGlobalSecondaryIndex({
      indexName: 'TransactionIdIndex',
      partitionKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ── S3 Bucket (no replication for staging) ───────────────────
    const photoBucket = new s3.Bucket(this, 'PhotoBucket', {
      bucketName: `staging-shelf-bidder-photos-${this.account}`,
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT, s3.HttpMethods.POST],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // ── Cognito ──────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'StagingUserPool', {
      userPoolName: 'Staging-ShelfBidder-Shopkeepers',
      selfSignUpEnabled: true,
      signInAliases: { phone: true, email: false, username: false },
      autoVerify: { phone: true },
      standardAttributes: {
        phoneNumber: { required: true, mutable: false },
        fullname: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.PHONE_ONLY_WITHOUT_MFA,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    userPool.addClient('StagingPWAClient', {
      userPoolClientName: 'Staging-ShelfBidder-PWA',
      authFlows: { userPassword: true, userSrp: true },
      generateSecret: false,
      preventUserExistenceErrors: true,
    });

    // ── API Gateway ──────────────────────────────────────────────
    const api = new apigateway.RestApi(this, 'StagingApi', {
      restApiName: 'Staging ShelfBidder API',
      description: 'Staging API for Shelf-Bidder',
      deployOptions: {
        stageName: 'staging',
        throttlingRateLimit: 50,
        throttlingBurstLimit: 100,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type', 'X-Amz-Date', 'Authorization',
          'X-Api-Key', 'X-Amz-Security-Token',
        ],
        allowCredentials: true,
      },
    });

    api.root.addResource('shopkeepers');
    api.root.addResource('shelf-spaces');
    api.root.addResource('auctions');
    api.root.addResource('tasks');
    api.root.addResource('wallet');

    // ── Tags ─────────────────────────────────────────────────────
    cdk.Tags.of(this).add('Project', 'ShelfBidder');
    cdk.Tags.of(this).add('Environment', 'Staging');
  }
}
