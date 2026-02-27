/**
 * Custom error classes for DynamoDB operations
 */

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ItemNotFoundError extends DatabaseError {
  constructor(entityType: string, identifier: string) {
    super(
      `${entityType} not found: ${identifier}`,
      'ITEM_NOT_FOUND'
    );
    this.name = 'ItemNotFoundError';
  }
}

export class ConditionalCheckFailedError extends DatabaseError {
  constructor(message: string) {
    super(message, 'CONDITIONAL_CHECK_FAILED');
    this.name = 'ConditionalCheckFailedError';
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class RetryableError extends DatabaseError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'RETRYABLE_ERROR', originalError);
    this.name = 'RetryableError';
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RetryableError) {
    return true;
  }

  // Check for AWS SDK retryable errors
  if (typeof error === 'object' && error !== null) {
    const awsError = error as { name?: string; $retryable?: { throttling?: boolean } };
    
    // Throttling errors are retryable
    if (awsError.$retryable?.throttling) {
      return true;
    }

    // Specific retryable error types
    const retryableErrorNames = [
      'ProvisionedThroughputExceededException',
      'ThrottlingException',
      'RequestLimitExceeded',
      'InternalServerError',
      'ServiceUnavailable',
    ];

    if (awsError.name && retryableErrorNames.includes(awsError.name)) {
      return true;
    }
  }

  return false;
}

/**
 * Convert AWS SDK errors to custom error types
 */
export function handleDynamoDBError(error: unknown, context: string): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const awsError = error as { name?: string; message?: string };

    switch (awsError.name) {
      case 'ResourceNotFoundException':
        return new ItemNotFoundError('Resource', context);
      
      case 'ConditionalCheckFailedException':
        return new ConditionalCheckFailedError(
          `Conditional check failed for ${context}`
        );
      
      case 'ValidationException':
        return new ValidationError(
          awsError.message || `Validation failed for ${context}`
        );
      
      case 'ProvisionedThroughputExceededException':
      case 'ThrottlingException':
      case 'RequestLimitExceeded':
        return new RetryableError(
          `Throttled while ${context}`,
          error
        );
      
      case 'InternalServerError':
      case 'ServiceUnavailable':
        return new RetryableError(
          `Service unavailable while ${context}`,
          error
        );
      
      default:
        return new DatabaseError(
          awsError.message || `Unknown error while ${context}`,
          awsError.name || 'UNKNOWN_ERROR',
          error
        );
    }
  }

  return new DatabaseError(
    `Unexpected error while ${context}`,
    'UNEXPECTED_ERROR',
    error
  );
}
