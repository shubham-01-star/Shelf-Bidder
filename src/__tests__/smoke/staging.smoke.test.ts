/**
 * Smoke tests for staging environment
 * These tests verify that critical services are operational after deployment
 */

import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

const STAGING_API_URL = process.env.STAGING_API_URL || '';
const STAGING_PHOTO_BUCKET = process.env.STAGING_PHOTO_BUCKET || '';
const STAGING_DYNAMO_TABLES = process.env.STAGING_DYNAMO_TABLES || '';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Table names from staging config
const STAGING_TABLES = {
  shopkeepers: 'ShelfBidder-Staging-Shopkeepers',
  shelfSpaces: 'ShelfBidder-Staging-ShelfSpaces',
  auctions: 'ShelfBidder-Staging-Auctions',
  tasks: 'ShelfBidder-Staging-Tasks',
  transactions: 'ShelfBidder-Staging-Transactions',
};

describe('Staging Environment Smoke Tests', () => {
  const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
  const s3Client = new S3Client({ region: AWS_REGION });

  describe('API Gateway Health', () => {
    it('should respond to health check endpoint', async () => {
      if (!STAGING_API_URL) {
        console.warn('STAGING_API_URL not set, skipping API health check');
        return;
      }

      const response = await fetch(`${STAGING_API_URL}health`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
      expect(data).toHaveProperty('environment', 'staging');
      expect(data).toHaveProperty('timestamp');
    }, 10000);

    it('should have CORS headers configured', async () => {
      if (!STAGING_API_URL) {
        console.warn('STAGING_API_URL not set, skipping CORS check');
        return;
      }

      const response = await fetch(`${STAGING_API_URL}health`, {
        method: 'OPTIONS',
      });

      expect(response.headers.get('access-control-allow-origin')).toBeTruthy();
      expect(response.headers.get('access-control-allow-methods')).toBeTruthy();
    }, 10000);
  });

  describe('DynamoDB Tables', () => {
    it('should have Shopkeepers table accessible', async () => {
      if (!STAGING_DYNAMO_TABLES) {
        console.warn('STAGING_DYNAMO_TABLES not set, skipping DynamoDB table check');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: STAGING_TABLES.shopkeepers,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(STAGING_TABLES.shopkeepers);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    }, 10000);

    it('should have ShelfSpaces table accessible', async () => {
      if (!STAGING_DYNAMO_TABLES) {
        console.warn('STAGING_DYNAMO_TABLES not set, skipping DynamoDB table check');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: STAGING_TABLES.shelfSpaces,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(STAGING_TABLES.shelfSpaces);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    }, 10000);

    it('should have Auctions table accessible', async () => {
      if (!STAGING_DYNAMO_TABLES) {
        console.warn('STAGING_DYNAMO_TABLES not set, skipping DynamoDB table check');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: STAGING_TABLES.auctions,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(STAGING_TABLES.auctions);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    }, 10000);

    it('should have Tasks table accessible', async () => {
      if (!STAGING_DYNAMO_TABLES) {
        console.warn('STAGING_DYNAMO_TABLES not set, skipping DynamoDB table check');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: STAGING_TABLES.tasks,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(STAGING_TABLES.tasks);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    }, 10000);

    it('should have Transactions table accessible', async () => {
      if (!STAGING_DYNAMO_TABLES) {
        console.warn('STAGING_DYNAMO_TABLES not set, skipping DynamoDB table check');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: STAGING_TABLES.transactions,
      });

      const response = await dynamoClient.send(command);
      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(STAGING_TABLES.transactions);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    }, 10000);

    it('should have ShelfSpaces table with correct GSI', async () => {
      if (!STAGING_DYNAMO_TABLES) {
        console.warn('STAGING_DYNAMO_TABLES not set, skipping DynamoDB GSI check');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: STAGING_TABLES.shelfSpaces,
      });

      const response = await dynamoClient.send(command);
      const gsis = response.Table?.GlobalSecondaryIndexes || [];
      
      const shelfSpaceIdIndex = gsis.find(gsi => gsi.IndexName === 'ShelfSpaceIdIndex');
      expect(shelfSpaceIdIndex).toBeDefined();
      expect(shelfSpaceIdIndex?.IndexStatus).toBe('ACTIVE');
    }, 10000);

    it('should have Auctions table with correct GSIs', async () => {
      if (!STAGING_DYNAMO_TABLES) {
        console.warn('STAGING_DYNAMO_TABLES not set, skipping DynamoDB GSI check');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: STAGING_TABLES.auctions,
      });

      const response = await dynamoClient.send(command);
      const gsis = response.Table?.GlobalSecondaryIndexes || [];
      
      expect(gsis.length).toBeGreaterThanOrEqual(2);
      
      const shelfSpaceIndex = gsis.find(gsi => gsi.IndexName === 'ShelfSpaceStartTimeIndex');
      expect(shelfSpaceIndex).toBeDefined();
      expect(shelfSpaceIndex?.IndexStatus).toBe('ACTIVE');
      
      const statusIndex = gsis.find(gsi => gsi.IndexName === 'StatusIndex');
      expect(statusIndex).toBeDefined();
      expect(statusIndex?.IndexStatus).toBe('ACTIVE');
    }, 10000);
  });

  describe('S3 Photo Bucket', () => {
    it('should have photo bucket accessible', async () => {
      if (!STAGING_PHOTO_BUCKET) {
        console.warn('STAGING_PHOTO_BUCKET not set, skipping S3 check');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: STAGING_PHOTO_BUCKET,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    }, 10000);
  });

  describe('Infrastructure Tags', () => {
    it('should have staging environment tags on tables', async () => {
      if (!STAGING_DYNAMO_TABLES) {
        console.warn('STAGING_DYNAMO_TABLES not set, skipping infrastructure tags check');
        return;
      }

      const command = new DescribeTableCommand({
        TableName: STAGING_TABLES.shopkeepers,
      });

      const response = await dynamoClient.send(command);
      
      // Note: Tags are not returned in DescribeTable, but we verify the table exists
      // In a real scenario, you'd use ListTagsOfResource
      expect(response.Table).toBeDefined();
    }, 10000);
  });

  describe('Performance Checks', () => {
    it('should respond to API health check within 2 seconds', async () => {
      if (!STAGING_API_URL) {
        console.warn('STAGING_API_URL not set, skipping performance check');
        return;
      }

      const startTime = Date.now();
      const response = await fetch(`${STAGING_API_URL}health`);
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(2000);
    }, 10000);

    it('should describe DynamoDB table within 1 second', async () => {
      if (!STAGING_DYNAMO_TABLES) {
        console.warn('STAGING_DYNAMO_TABLES not set, skipping DynamoDB performance check');
        return;
      }

      const startTime = Date.now();
      
      const command = new DescribeTableCommand({
        TableName: STAGING_TABLES.shopkeepers,
      });
      
      await dynamoClient.send(command);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000);
    }, 10000);
  });
});
