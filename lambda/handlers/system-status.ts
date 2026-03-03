import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get counts from tables
    const [shopkeepersResult, auctionsResult, tasksResult] = await Promise.allSettled([
      dynamoClient.send(new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE_SHOPKEEPERS,
        Select: 'COUNT',
        Limit: 1000,
      })),
      dynamoClient.send(new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE_AUCTIONS,
        Select: 'COUNT',
        Limit: 1000,
      })),
      dynamoClient.send(new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE_TASKS,
        Select: 'COUNT',
        Limit: 1000,
      })),
    ]);
    
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      region: process.env.AWS_REGION,
      version: '1.0.0',
      statistics: {
        totalShopkeepers: shopkeepersResult.status === 'fulfilled' 
          ? shopkeepersResult.value.Count || 0 
          : 0,
        totalAuctions: auctionsResult.status === 'fulfilled' 
          ? auctionsResult.value.Count || 0 
          : 0,
        totalTasks: tasksResult.status === 'fulfilled' 
          ? tasksResult.value.Count || 0 
          : 0,
      },
      features: {
        authentication: !!process.env.COGNITO_USER_POOL_ID,
        photoProcessing: !!process.env.S3_BUCKET_PHOTOS,
        visionAnalysis: true,
        auctionEngine: true,
        notifications: true,
        wallet: true,
      },
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(status),
    };
  } catch (error) {
    console.error('Failed to retrieve system status', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to retrieve system status' }),
    };
  }
};
