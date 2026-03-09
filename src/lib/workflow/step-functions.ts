/**
 * Step Functions Workflow Definition
 *
 * Task 5.2: Create Step Functions state machine for daily workflow
 * Defines the complete daily workflow: Morning notification → Photo capture →
 * Vision analysis → Auction → Task assignment → Verification → Payment.
 * Requirements: 1.1, 3.1, 4.1
 */

// ============================================================================
// Types
// ============================================================================

export interface WorkflowState {
  shopkeeperId: string;
  timezone: string;
  phoneNumber: string;
  language: string;
  photoReceived?: boolean;
  photoUrl?: string;
  shelfSpaceId?: string;
  emptySpaces?: number;
  auctionId?: string;
  auctionResult?: {
    winnerId: string;
    winningBid: number;
    productName: string;
    brandName: string;
  };
  taskId?: string;
  taskCompleted?: boolean;
  verificationPassed?: boolean;
  earningsCredited?: boolean;
}

export type WorkflowStep =
  | 'send_morning_notification'
  | 'wait_for_photo'
  | 'send_reminder'
  | 'analyze_photo'
  | 'check_empty_spaces'
  | 'start_auction'
  | 'wait_for_bids'
  | 'select_winner'
  | 'notify_winner'
  | 'assign_task'
  | 'wait_for_completion'
  | 'verify_task'
  | 'credit_earnings'
  | 'workflow_complete'
  | 'no_spaces_found'
  | 'no_bids_received';

// ============================================================================
// State Machine Definition (ASL - Amazon States Language)
// ============================================================================

export const DAILY_WORKFLOW_DEFINITION = {
  Comment: 'Shelf-Bidder Daily Workflow - Morning scan to earnings',
  StartAt: 'SendMorningNotification',
  States: {
    // Step 1: Send morning push notification at 8 AM
    SendMorningNotification: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-send-notification',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'notificationType': 'morning_scan',
        'timezone.$': '$.timezone',
      },
      ResultPath: '$.notificationResult',
      Next: 'WaitForPhoto',
    },

    // Step 2: Wait up to 4 hours for photo
    WaitForPhoto: {
      Type: 'Wait',
      Seconds: 14400, // 4 hours
      Next: 'CheckPhotoReceived',
    },

    // Step 3: Check if photo was submitted
    CheckPhotoReceived: {
      Type: 'Choice',
      Choices: [
        {
          Variable: '$.photoReceived',
          BooleanEquals: true,
          Next: 'AnalyzePhoto',
        },
      ],
      Default: 'SendReminder',
    },

    // Step 3b: Send reminder if no photo by noon
    SendReminder: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-send-notification',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'notificationType': 'scan_reminder',
      },
      ResultPath: '$.reminderResult',
      Next: 'WorkflowEndNoPhoto',
    },

    WorkflowEndNoPhoto: {
      Type: 'Succeed',
      Comment: 'Workflow ended - no photo received',
    },

    // Step 4: Analyze the shelf photo with Claude Vision
    AnalyzePhoto: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-analyze-photo',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'photoUrl.$': '$.photoUrl',
      },
      ResultPath: '$.analysisResult',
      Retry: [
        {
          ErrorEquals: ['ServiceUnavailable', 'TooManyRequestsException'],
          IntervalSeconds: 5,
          MaxAttempts: 3,
          BackoffRate: 2,
        },
      ],
      Catch: [
        {
          ErrorEquals: ['States.ALL'],
          Next: 'AnalysisFailedNotification',
          ResultPath: '$.error',
        },
      ],
      Next: 'CheckEmptySpaces',
    },

    AnalysisFailedNotification: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-send-notification',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'notificationType': 'analysis_failed',
      },
      End: true,
    },

    // Step 5: Check if empty spaces were found
    CheckEmptySpaces: {
      Type: 'Choice',
      Choices: [
        {
          Variable: '$.analysisResult.emptySpaceCount',
          NumericGreaterThan: 0,
          Next: 'StartAuction',
        },
      ],
      Default: 'NoSpacesNotification',
    },

    NoSpacesNotification: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-send-notification',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'notificationType': 'no_spaces',
      },
      End: true,
    },

    // Step 6: Start a 15-minute auction
    StartAuction: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-start-auction',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'shelfSpaceId.$': '$.analysisResult.shelfSpaceId',
        'duration': 900, // 15 minutes
      },
      ResultPath: '$.auctionResult',
      Next: 'NotifyBrandAgents',
    },

    // Step 6b: Notify brand agents
    NotifyBrandAgents: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-notify-agents',
      Parameters: {
        'auctionId.$': '$.auctionResult.auctionId',
        'shelfSpaceId.$': '$.analysisResult.shelfSpaceId',
      },
      ResultPath: '$.agentNotification',
      Next: 'WaitForBids',
    },

    // Step 7: Wait for bids (15 minutes)
    WaitForBids: {
      Type: 'Wait',
      Seconds: 900,
      Next: 'SelectWinner',
    },

    // Step 8: Select auction winner
    SelectWinner: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-select-winner',
      Parameters: {
        'auctionId.$': '$.auctionResult.auctionId',
      },
      ResultPath: '$.winnerResult',
      Next: 'CheckWinnerFound',
    },

    CheckWinnerFound: {
      Type: 'Choice',
      Choices: [
        {
          Variable: '$.winnerResult.hasWinner',
          BooleanEquals: true,
          Next: 'VoiceNotifyShopkeeper',
        },
      ],
      Default: 'NoBidsNotification',
    },

    NoBidsNotification: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-send-notification',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'notificationType': 'no_bids',
      },
      End: true,
    },

    // Step 9: Voice call to shopkeeper with result
    VoiceNotifyShopkeeper: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-voice-notify',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'phoneNumber.$': '$.phoneNumber',
        'language.$': '$.language',
        'productName.$': '$.winnerResult.productName',
        'brandName.$': '$.winnerResult.brandName',
        'earnings.$': '$.winnerResult.winningBid',
      },
      ResultPath: '$.voiceResult',
      Catch: [
        {
          ErrorEquals: ['States.ALL'],
          Next: 'FallbackPushNotification',
          ResultPath: '$.voiceError',
        },
      ],
      Next: 'AssignTask',
    },

    // Voice call fallback to push notification
    FallbackPushNotification: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-send-notification',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'notificationType': 'auction_won',
        'data': {
          'brand.$': '$.winnerResult.brandName',
          'amount.$': '$.winnerResult.winningBid',
        },
      },
      ResultPath: '$.fallbackResult',
      Next: 'AssignTask',
    },

    // Step 10: Create task for shopkeeper
    AssignTask: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-assign-task',
      Parameters: {
        'auctionId.$': '$.auctionResult.auctionId',
        'shopkeeperId.$': '$.shopkeeperId',
      },
      ResultPath: '$.taskResult',
      Next: 'WaitForTaskCompletion',
    },

    // Step 11: Wait for task completion (24 hours max)
    WaitForTaskCompletion: {
      Type: 'Wait',
      Seconds: 86400, // 24 hours
      Next: 'CheckTaskCompletion',
    },

    CheckTaskCompletion: {
      Type: 'Choice',
      Choices: [
        {
          Variable: '$.taskCompleted',
          BooleanEquals: true,
          Next: 'VerifyTaskCompletion',
        },
      ],
      Default: 'TaskTimeoutNotification',
    },

    TaskTimeoutNotification: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-task-timeout',
      Parameters: {
        'taskId.$': '$.taskResult.taskId',
        'shopkeeperId.$': '$.shopkeeperId',
      },
      End: true,
    },

    // Step 12: Verify task completion
    VerifyTaskCompletion: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-verify-task',
      Parameters: {
        'taskId.$': '$.taskResult.taskId',
        'proofPhotoUrl.$': '$.proofPhotoUrl',
      },
      ResultPath: '$.verificationResult',
      Next: 'CheckVerification',
    },

    CheckVerification: {
      Type: 'Choice',
      Choices: [
        {
          Variable: '$.verificationResult.verified',
          BooleanEquals: true,
          Next: 'CreditEarnings',
        },
      ],
      Default: 'VerificationFailedNotification',
    },

    VerificationFailedNotification: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-send-notification',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'notificationType': 'verification_failed',
        'data': {
          'feedback.$': '$.verificationResult.feedback',
        },
      },
      End: true,
    },

    // Step 13: Credit earnings to wallet
    CreditEarnings: {
      Type: 'Task',
      Resource: 'arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:shelf-bidder-credit-earnings',
      Parameters: {
        'shopkeeperId.$': '$.shopkeeperId',
        'taskId.$': '$.taskResult.taskId',
        'amount.$': '$.winnerResult.winningBid',
      },
      ResultPath: '$.earningsResult',
      Next: 'WorkflowComplete',
    },

    // Step 14: Done!
    WorkflowComplete: {
      Type: 'Succeed',
      Comment: 'Daily workflow completed successfully',
    },
  },
};

// ============================================================================
// Workflow Helpers
// ============================================================================

/**
 * Get the current step description for a shopkeeper
 */
export function getStepDescription(step: WorkflowStep): string {
  const descriptions: Record<WorkflowStep, string> = {
    send_morning_notification: 'Sending morning notification...',
    wait_for_photo: 'Waiting for your shelf photo',
    send_reminder: 'Sending reminder notification',
    analyze_photo: 'AI is analyzing your shelf photo...',
    check_empty_spaces: 'Checking for empty spaces...',
    start_auction: 'Starting auction for your shelf space',
    wait_for_bids: 'Brands are bidding (15 min)',
    select_winner: 'Selecting the winning bid...',
    notify_winner: 'Notifying you about the winner',
    assign_task: 'Creating your placement task',
    wait_for_completion: 'Waiting for task completion',
    verify_task: 'Verifying your proof photo...',
    credit_earnings: 'Crediting earnings to your wallet!',
    workflow_complete: 'All done! Earnings credited ✅',
    no_spaces_found: 'No empty spaces found today',
    no_bids_received: 'No bids received for this auction',
  };
  return descriptions[step] || 'Processing...';
}

export { DAILY_WORKFLOW_DEFINITION as default };
