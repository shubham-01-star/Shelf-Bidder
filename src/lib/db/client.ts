/**
 * DynamoDB client configuration
 * Provides a configured DynamoDB client with retry logic
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Create and configure DynamoDB client
 */
function createDynamoDBClient(): DynamoDBDocumentClient {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    maxAttempts: 3, // Retry up to 3 times
  });

  // Create document client with marshalling options
  const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true, // Remove undefined values
      convertEmptyValues: false, // Don't convert empty strings to null
    },
    unmarshallOptions: {
      wrapNumbers: false, // Return numbers as JavaScript numbers
    },
  });

  return docClient;
}

// Export singleton instance
export const dynamoDBClient = createDynamoDBClient();
