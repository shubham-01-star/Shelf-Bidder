# Shelf-Bidder Infrastructure

This directory contains the AWS CDK infrastructure code for the Shelf-Bidder Autonomous Retail Ad-Network.

## Architecture Overview

The infrastructure includes:

- **DynamoDB Tables**: Five tables for storing shopkeepers, shelf spaces, auctions, tasks, and transactions
- **S3 Buckets**: Photo storage with lifecycle policies and cross-region replication
- **API Gateway**: RESTful API with CORS, authentication, and rate limiting
- **Cognito User Pool**: Authentication for shopkeepers using phone numbers

## Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with appropriate credentials
- AWS CDK CLI installed globally: `npm install -g aws-cdk`

## Setup

1. Install dependencies:
   ```bash
   cd infrastructure
   npm install
   ```

2. Bootstrap CDK (first time only):
   ```bash
   cdk bootstrap
   ```

3. Synthesize CloudFormation template:
   ```bash
   npm run synth
   ```

4. Deploy to AWS:
   ```bash
   npm run deploy
   ```

## DynamoDB Tables

### Shopkeepers Table
- **Partition Key**: `shopkeeperId` (String)
- **Purpose**: Store shopkeeper profiles and account information
- **Replication**: Multi-region (us-east-1, us-west-2)

### ShelfSpaces Table
- **Partition Key**: `shopkeeperId` (String)
- **Sort Key**: `analysisDate` (String)
- **GSI**: `ShelfSpaceIdIndex` on `shelfSpaceId`
- **Purpose**: Store shelf analysis results and empty space data

### Auctions Table
- **Partition Key**: `auctionId` (String)
- **GSI 1**: `ShelfSpaceStartTimeIndex` on `shelfSpaceId` + `startTime`
- **GSI 2**: `StatusIndex` on `status` + `startTime`
- **Purpose**: Manage auction lifecycle and bid data

### Tasks Table
- **Partition Key**: `shopkeeperId` (String)
- **Sort Key**: `assignedDate` (String)
- **GSI 1**: `TaskIdIndex` on `taskId`
- **GSI 2**: `StatusIndex` on `status` + `assignedDate`
- **Purpose**: Track product placement tasks and completion status

### Transactions Table
- **Partition Key**: `shopkeeperId` (String)
- **Sort Key**: `timestamp` (String)
- **GSI**: `TransactionIdIndex` on `transactionId`
- **Purpose**: Record wallet transactions and earnings history

## S3 Buckets

### Photo Bucket
- **Purpose**: Store high-resolution shelf photos (max 20MB)
- **Lifecycle Policies**:
  - Transition to Infrequent Access after 30 days
  - Delete after 90 days
- **Features**: Versioning, encryption, CORS enabled
- **Replication**: Cross-region replication for redundancy

## API Gateway

### Endpoints
- `/shopkeepers` - Shopkeeper management
- `/shelf-spaces` - Shelf analysis and photo upload
- `/auctions` - Auction management and bidding
- `/tasks` - Task assignment and verification
- `/wallet` - Earnings and transaction management

### Features
- **Authentication**: Cognito User Pool authorizer
- **CORS**: Enabled for PWA access
- **Rate Limiting**: 100 requests/second, 200 burst
- **Validation**: Request body and parameter validation
- **Logging**: CloudWatch logs with metrics

## Cognito User Pool

### Configuration
- **Sign-in**: Phone number only (no email/username)
- **Verification**: SMS-based phone verification
- **Password Policy**: 8+ characters, mixed case, digits required
- **Recovery**: Phone-based account recovery

## Multi-Region Replication

All DynamoDB tables and S3 buckets are configured with cross-region replication to meet Requirement 9.5:
- **Primary Region**: us-east-1
- **Replica Region**: us-west-2

This ensures data redundancy and disaster recovery capabilities.

## Outputs

After deployment, the following outputs are available:

- `ShopkeepersTableName`: DynamoDB table name for shopkeepers
- `ShelfSpacesTableName`: DynamoDB table name for shelf spaces
- `AuctionsTableName`: DynamoDB table name for auctions
- `TasksTableName`: DynamoDB table name for tasks
- `TransactionsTableName`: DynamoDB table name for transactions
- `PhotoBucketName`: S3 bucket name for photos
- `UserPoolId`: Cognito User Pool ID
- `ApiUrl`: API Gateway endpoint URL

## Cost Optimization

- **DynamoDB**: Pay-per-request billing mode (no idle costs)
- **S3**: Lifecycle policies to reduce storage costs
- **API Gateway**: Rate limiting to prevent abuse
- **Point-in-Time Recovery**: Enabled for data protection

## Security

- **Encryption**: All data encrypted at rest (S3, DynamoDB)
- **Access Control**: IAM roles with least privilege
- **Authentication**: Cognito-based user authentication
- **Network**: S3 buckets block all public access
- **Monitoring**: CloudWatch logs and metrics enabled

## Next Steps

After infrastructure deployment:
1. Note the output values (table names, API URL, User Pool ID)
2. Update frontend environment variables with these values
3. Deploy Lambda functions for API endpoints
4. Configure Step Functions for workflow orchestration
5. Set up AWS Bedrock for Claude 3.5 vision analysis
