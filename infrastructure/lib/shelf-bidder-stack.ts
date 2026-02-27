import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';

export class ShelfBidderStack extends cdk.Stack {
  public readonly shopkeepersTable: dynamodb.Table;
  public readonly shelfSpacesTable: dynamodb.Table;
  public readonly auctionsTable: dynamodb.Table;
  public readonly tasksTable: dynamodb.Table;
  public readonly transactionsTable: dynamodb.Table;
  public readonly photoBucket: s3.Bucket;
  public readonly api: apigateway.RestApi;
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    this.shopkeepersTable = this.createShopkeepersTable();
    this.shelfSpacesTable = this.createShelfSpacesTable();
    this.auctionsTable = this.createAuctionsTable();
    this.tasksTable = this.createTasksTable();
    this.transactionsTable = this.createTransactionsTable();

    // S3 Buckets
    this.photoBucket = this.createPhotoBucket();

    // Cognito User Pool
    this.userPool = this.createUserPool();

    // API Gateway
    this.api = this.createApiGateway();

    // Outputs
    this.createOutputs();
  }

  private createShopkeepersTable(): dynamodb.Table {
    const table = new dynamodb.Table(this, 'ShopkeepersTable', {
      tableName: 'ShelfBidder-Shopkeepers',
      partitionKey: {
        name: 'shopkeeperId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      replicationRegions: ['us-west-2'], // Multi-region replication for Requirement 9.5
    });

    // Add tags for organization
    cdk.Tags.of(table).add('Project', 'ShelfBidder');
    cdk.Tags.of(table).add('Component', 'Database');

    return table;
  }

  private createShelfSpacesTable(): dynamodb.Table {
    const table = new dynamodb.Table(this, 'ShelfSpacesTable', {
      tableName: 'ShelfBidder-ShelfSpaces',
      partitionKey: {
        name: 'shopkeeperId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'analysisDate',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      replicationRegions: ['us-west-2'],
    });

    // GSI for querying by shelf space ID
    table.addGlobalSecondaryIndex({
      indexName: 'ShelfSpaceIdIndex',
      partitionKey: {
        name: 'shelfSpaceId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    cdk.Tags.of(table).add('Project', 'ShelfBidder');
    cdk.Tags.of(table).add('Component', 'Database');

    return table;
  }

  private createAuctionsTable(): dynamodb.Table {
    const table = new dynamodb.Table(this, 'AuctionsTable', {
      tableName: 'ShelfBidder-Auctions',
      partitionKey: {
        name: 'auctionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      replicationRegions: ['us-west-2'],
    });

    // GSI for querying auctions by shelf space and start time
    table.addGlobalSecondaryIndex({
      indexName: 'ShelfSpaceStartTimeIndex',
      partitionKey: {
        name: 'shelfSpaceId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'startTime',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying active auctions
    table.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'startTime',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    cdk.Tags.of(table).add('Project', 'ShelfBidder');
    cdk.Tags.of(table).add('Component', 'Database');

    return table;
  }

  private createTasksTable(): dynamodb.Table {
    const table = new dynamodb.Table(this, 'TasksTable', {
      tableName: 'ShelfBidder-Tasks',
      partitionKey: {
        name: 'shopkeeperId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'assignedDate',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      replicationRegions: ['us-west-2'],
    });

    // GSI for querying tasks by ID
    table.addGlobalSecondaryIndex({
      indexName: 'TaskIdIndex',
      partitionKey: {
        name: 'taskId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying tasks by status
    table.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'assignedDate',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    cdk.Tags.of(table).add('Project', 'ShelfBidder');
    cdk.Tags.of(table).add('Component', 'Database');

    return table;
  }

  private createTransactionsTable(): dynamodb.Table {
    const table = new dynamodb.Table(this, 'TransactionsTable', {
      tableName: 'ShelfBidder-Transactions',
      partitionKey: {
        name: 'shopkeeperId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      replicationRegions: ['us-west-2'],
    });

    // GSI for querying transactions by ID
    table.addGlobalSecondaryIndex({
      indexName: 'TransactionIdIndex',
      partitionKey: {
        name: 'transactionId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    cdk.Tags.of(table).add('Project', 'ShelfBidder');
    cdk.Tags.of(table).add('Component', 'Database');

    return table;
  }

  private createPhotoBucket(): s3.Bucket {
    const bucket = new s3.Bucket(this, 'PhotoBucket', {
      bucketName: `shelf-bidder-photos-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'DeleteOldPhotos',
          enabled: true,
          expiration: cdk.Duration.days(90), // Keep photos for 90 days
        },
        {
          id: 'TransitionToInfrequentAccess',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          allowedOrigins: ['*'], // Should be restricted to actual domain in production
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // Enable replication to another region for Requirement 9.5
    const replicationBucket = new s3.Bucket(this, 'PhotoReplicationBucket', {
      bucketName: `shelf-bidder-photos-replica-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create replication role
    const replicationRole = new iam.Role(this, 'ReplicationRole', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
    });

    bucket.grantRead(replicationRole);
    replicationBucket.grantWrite(replicationRole);

    cdk.Tags.of(bucket).add('Project', 'ShelfBidder');
    cdk.Tags.of(bucket).add('Component', 'Storage');

    return bucket;
  }

  private createUserPool(): cognito.UserPool {
    const userPool = new cognito.UserPool(this, 'ShopkeeperUserPool', {
      userPoolName: 'ShelfBidder-Shopkeepers',
      selfSignUpEnabled: true,
      signInAliases: {
        phone: true,
        email: false,
        username: false,
      },
      autoVerify: {
        phone: true,
      },
      standardAttributes: {
        phoneNumber: {
          required: true,
          mutable: false,
        },
        fullname: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.PHONE_ONLY_WITHOUT_MFA,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create user pool client for the PWA
    this.userPoolClient = userPool.addClient('PWAClient', {
      userPoolClientName: 'ShelfBidder-PWA',
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      generateSecret: false,
      preventUserExistenceErrors: true,
    });

    cdk.Tags.of(userPool).add('Project', 'ShelfBidder');
    cdk.Tags.of(userPool).add('Component', 'Authentication');

    return userPool;
  }

  private createApiGateway(): apigateway.RestApi {
    const api = new apigateway.RestApi(this, 'ShelfBidderApi', {
      restApiName: 'ShelfBidder API',
      description: 'API for Shelf-Bidder Autonomous Retail Ad-Network',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Should be restricted in production
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: true,
      },
    });

    // Create Cognito authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      'ApiAuthorizer',
      {
        cognitoUserPools: [this.userPool],
        authorizerName: 'ShopkeeperAuthorizer',
      }
    );

    // Create API resources (endpoints will be added by Lambda functions in later tasks)
    const shopkeepers = api.root.addResource('shopkeepers');
    const shelfSpaces = api.root.addResource('shelf-spaces');
    const auctions = api.root.addResource('auctions');
    const tasks = api.root.addResource('tasks');
    const wallet = api.root.addResource('wallet');

    // Add request validators
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: api,
        requestValidatorName: 'ShelfBidderRequestValidator',
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

    cdk.Tags.of(api).add('Project', 'ShelfBidder');
    cdk.Tags.of(api).add('Component', 'API');

    return api;
  }

  private createOutputs(): void {
    // DynamoDB Table Names
    new cdk.CfnOutput(this, 'ShopkeepersTableName', {
      value: this.shopkeepersTable.tableName,
      description: 'Shopkeepers DynamoDB Table Name',
      exportName: 'ShelfBidder-ShopkeepersTableName',
    });

    new cdk.CfnOutput(this, 'ShelfSpacesTableName', {
      value: this.shelfSpacesTable.tableName,
      description: 'Shelf Spaces DynamoDB Table Name',
      exportName: 'ShelfBidder-ShelfSpacesTableName',
    });

    new cdk.CfnOutput(this, 'AuctionsTableName', {
      value: this.auctionsTable.tableName,
      description: 'Auctions DynamoDB Table Name',
      exportName: 'ShelfBidder-AuctionsTableName',
    });

    new cdk.CfnOutput(this, 'TasksTableName', {
      value: this.tasksTable.tableName,
      description: 'Tasks DynamoDB Table Name',
      exportName: 'ShelfBidder-TasksTableName',
    });

    new cdk.CfnOutput(this, 'TransactionsTableName', {
      value: this.transactionsTable.tableName,
      description: 'Transactions DynamoDB Table Name',
      exportName: 'ShelfBidder-TransactionsTableName',
    });

    // S3 Bucket
    new cdk.CfnOutput(this, 'PhotoBucketName', {
      value: this.photoBucket.bucketName,
      description: 'Photo Storage S3 Bucket Name',
      exportName: 'ShelfBidder-PhotoBucketName',
    });

    // Cognito
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: 'ShelfBidder-UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: 'ShelfBidder-UserPoolClientId',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS Region',
      exportName: 'ShelfBidder-Region',
    });

    // API Gateway
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: 'ShelfBidder-ApiUrl',
    });
  }
}
