import { NextResponse } from 'next/server';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';

/**
 * Workflow Trigger API
 * 
 * Task: Start the AWS Step Functions workflow for the daily retail ad-network loop.
 * PRD: "The Orchestrator (The Manager) - AWS Step Functions"
 */

// Initialize Step Functions Client
const sfnClient = new SFNClient({ 
  region: process.env.AWS_REGION || 'us-west-2' 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopkeeperId, photoUrl, emptySpaces } = body;

    if (!shopkeeperId || !photoUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: shopkeeperId, photoUrl' },
        { status: 400 }
      );
    }

    const stateMachineArn = process.env.STATE_MACHINE_ARN;
    
    // If we're fully in local dev without the real state machine,
    // we return a simulated success to prevent crashes.
    if (!stateMachineArn || stateMachineArn === 'mock-arn') {
      console.log('[Workflow] Faking Step Functions start in local/dev mode');
      return NextResponse.json({ 
        success: true, 
        executionArn: `arn:mock:states:local:1234:execution:mock-${Date.now()}`,
        mode: 'mock'
      });
    }

    // 1. Prepare workflow input payload
    const inputPayload = {
      shopkeeperId,
      photoUrl,
      emptySpaces,
      timestamp: new Date().toISOString(),
      auctionDurationMinutes: 15,
      // Pass other context needed by Kiro Agent / Call Center
    };

    // 2. Start Execution
    const command = new StartExecutionCommand({
      stateMachineArn,
      name: `ShelfBidder-${shopkeeperId}-${Date.now()}`,
      input: JSON.stringify(inputPayload),
    });

    const response = await sfnClient.send(command);

    return NextResponse.json({ 
      success: true, 
      executionArn: response.executionArn,
      startDate: response.startDate
    });

  } catch (error) {
    console.error('Failed to start workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
