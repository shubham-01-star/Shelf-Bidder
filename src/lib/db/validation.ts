/**
 * Database Schema Validation Module
 * 
 * Validates DynamoDB key structures and data types before operations.
 * Ensures all keys match the expected format patterns defined in the schema.
 */

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// Key Format Validators
// ============================================================================

/**
 * UUID v4 format pattern
 * Example: 550e8400-e29b-41d4-a716-446655440000
 */
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

/**
 * ISO 8601 date format (YYYY-MM-DD)
 * Example: 2025-01-28
 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * ISO 8601 datetime format
 * Example: 2025-01-28T10:30:00.000Z
 */
const DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;

/**
 * Entity ID format (alphanumeric with hyphens and underscores)
 * Example: task-123, auction_456, space-abc-123
 */
const ENTITY_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Validates UUID v4 format
 */
export function isValidUUID(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Validates ISO 8601 date format (YYYY-MM-DD)
 */
export function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  
  // Additional validation: check if date is valid
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // Verify the date components match (catches invalid dates like 2025-02-30)
  const [year, month, day] = value.split('-').map(Number);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validates ISO 8601 datetime format
 */
export function isValidDatetime(value: string): boolean {
  if (!DATETIME_PATTERN.test(value)) {
    return false;
  }
  
  // Additional validation: check if datetime is valid
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Validates entity ID format
 */
export function isValidEntityId(value: string): boolean {
  return ENTITY_ID_PATTERN.test(value) && value.length > 0;
}

// ============================================================================
// Schema Validator Interface
// ============================================================================

export interface SchemaValidator {
  validateShopkeeperKey(shopkeeperId: string): ValidationResult;
  validateTaskKey(shopkeeperId: string, assignedDate: string, taskId: string): ValidationResult;
  validateAuctionKey(auctionId: string): ValidationResult;
  validateTransactionKey(shopkeeperId: string, timestamp: string, transactionId: string): ValidationResult;
  validateShelfSpaceKey(shopkeeperId: string, analysisDate: string, shelfSpaceId: string): ValidationResult;
}

// ============================================================================
// Validation Implementation
// ============================================================================

class SchemaValidatorImpl implements SchemaValidator {
  /**
   * Validates Shopkeeper key structure
   * PK: SHOPKEEPER#{shopkeeperId} (UUID format)
   * SK: METADATA
   */
  validateShopkeeperKey(shopkeeperId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!shopkeeperId) {
      errors.push('Shopkeeper ID is required');
    } else if (!isValidUUID(shopkeeperId)) {
      errors.push(`Invalid shopkeeper ID format: ${shopkeeperId}. Expected UUID v4 format.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates Task key structure
   * PK: SHOPKEEPER#{shopkeeperId}
   * SK: TASK#{assignedDate}#{taskId}
   * GSI1PK: TASK#{taskId}
   * GSI1SK: METADATA
   * GSI2PK: STATUS#{status}
   * GSI2SK: TASK#{assignedDate}
   */
  validateTaskKey(shopkeeperId: string, assignedDate: string, taskId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate shopkeeper ID
    if (!shopkeeperId) {
      errors.push('Shopkeeper ID is required');
    } else if (!isValidUUID(shopkeeperId)) {
      errors.push(`Invalid shopkeeper ID format: ${shopkeeperId}. Expected UUID v4 format.`);
    }

    // Validate assigned date
    if (!assignedDate) {
      errors.push('Assigned date is required');
    } else if (!isValidDate(assignedDate)) {
      errors.push(`Invalid assigned date format: ${assignedDate}. Expected ISO 8601 date (YYYY-MM-DD).`);
    }

    // Validate task ID
    if (!taskId) {
      errors.push('Task ID is required');
    } else if (!isValidEntityId(taskId)) {
      errors.push(`Invalid task ID format: ${taskId}. Expected alphanumeric with hyphens and underscores.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates Auction key structure
   * PK: AUCTION#{auctionId}
   * SK: METADATA
   * GSI1PK: SHELFSPACE#{shelfSpaceId}
   * GSI1SK: AUCTION#{startTime}
   * GSI2PK: STATUS#{status}
   * GSI2SK: AUCTION#{startTime}
   */
  validateAuctionKey(auctionId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!auctionId) {
      errors.push('Auction ID is required');
    } else if (!isValidEntityId(auctionId)) {
      errors.push(`Invalid auction ID format: ${auctionId}. Expected alphanumeric with hyphens and underscores.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates Transaction key structure
   * PK: SHOPKEEPER#{shopkeeperId}
   * SK: TRANSACTION#{timestamp}#{transactionId}
   * GSI1PK: TRANSACTION#{transactionId}
   * GSI1SK: METADATA
   */
  validateTransactionKey(shopkeeperId: string, timestamp: string, transactionId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate shopkeeper ID
    if (!shopkeeperId) {
      errors.push('Shopkeeper ID is required');
    } else if (!isValidUUID(shopkeeperId)) {
      errors.push(`Invalid shopkeeper ID format: ${shopkeeperId}. Expected UUID v4 format.`);
    }

    // Validate timestamp
    if (!timestamp) {
      errors.push('Timestamp is required');
    } else if (!isValidDatetime(timestamp)) {
      errors.push(`Invalid timestamp format: ${timestamp}. Expected ISO 8601 datetime.`);
    }

    // Validate transaction ID
    if (!transactionId) {
      errors.push('Transaction ID is required');
    } else if (!isValidEntityId(transactionId)) {
      errors.push(`Invalid transaction ID format: ${transactionId}. Expected alphanumeric with hyphens and underscores.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates ShelfSpace key structure
   * PK: SHOPKEEPER#{shopkeeperId}
   * SK: SHELFSPACE#{analysisDate}#{shelfSpaceId}
   * GSI1PK: SHELFSPACE#{shelfSpaceId}
   * GSI1SK: METADATA
   */
  validateShelfSpaceKey(shopkeeperId: string, analysisDate: string, shelfSpaceId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate shopkeeper ID
    if (!shopkeeperId) {
      errors.push('Shopkeeper ID is required');
    } else if (!isValidUUID(shopkeeperId)) {
      errors.push(`Invalid shopkeeper ID format: ${shopkeeperId}. Expected UUID v4 format.`);
    }

    // Validate analysis date
    if (!analysisDate) {
      errors.push('Analysis date is required');
    } else if (!isValidDate(analysisDate)) {
      errors.push(`Invalid analysis date format: ${analysisDate}. Expected ISO 8601 date (YYYY-MM-DD).`);
    }

    // Validate shelf space ID
    if (!shelfSpaceId) {
      errors.push('Shelf space ID is required');
    } else if (!isValidEntityId(shelfSpaceId)) {
      errors.push(`Invalid shelf space ID format: ${shelfSpaceId}. Expected alphanumeric with hyphens and underscores.`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// ============================================================================
// Exported Validator Instance
// ============================================================================

export const schemaValidator: SchemaValidator = new SchemaValidatorImpl();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates a complete DynamoDB key structure
 */
export function validateKey(pk: string, sk: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!pk) {
    errors.push('Partition key (PK) is required');
  }

  if (!sk) {
    errors.push('Sort key (SK) is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Creates a validation error message
 */
export function createValidationError(result: ValidationResult): Error {
  const message = result.errors.join('; ');
  const error = new Error(`Validation failed: ${message}`);
  error.name = 'ValidationError';
  return error;
}
