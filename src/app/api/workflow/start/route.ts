import { NextResponse } from 'next/server';

/**
 * Workflow Trigger API
 * 
 * Task: Start the backend workflow for the daily retail ad-network loop.
 * Note: Refactored to remove AWS Step Functions dependency.
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shopkeeperId, photoUrl } = body;

    if (!shopkeeperId || !photoUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: shopkeeperId, photoUrl' },
        { status: 400 }
      );
    }


    console.log('[Workflow] Faking Step Functions start in local/dev mode');
    return NextResponse.json({ 
      success: true, 
      executionArn: `arn:mock:states:local:1234:execution:mock-${Date.now()}`,
      mode: 'mock'
    });

  } catch (error) {
    console.error('Failed to start workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
