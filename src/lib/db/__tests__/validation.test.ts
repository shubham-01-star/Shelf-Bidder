/**
 * Database Schema Validation Tests
 * 
 * Tests the validation module for DynamoDB key structures.
 */

import {
  schemaValidator,
  isValidUUID,
  isValidDate,
  isValidDatetime,
  isValidEntityId,
  validateKey,
  createValidationError,
  type ValidationResult,
} from '../validation';

describe('Key Format Validators', () => {
  describe('isValidUUID', () => {
    it('should validate correct UUID v4 format', () => {
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUUID('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('550e8400e29b41d4a716446655440000')).toBe(false); // Missing hyphens
    });

    it('should reject UUID v1 format', () => {
      // UUID v1 has version 1 in the third group
      expect(isValidUUID('550e8400-e29b-11d4-a716-446655440000')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should validate correct ISO 8601 date format', () => {
      expect(isValidDate('2025-01-28')).toBe(true);
      expect(isValidDate('2024-12-31')).toBe(true);
      expect(isValidDate('2023-06-15')).toBe(true);
    });

    it('should reject invalid date formats', () => {
      expect(isValidDate('28-01-2025')).toBe(false);
      expect(isValidDate('2025/01/28')).toBe(false);
      expect(isValidDate('2025-1-28')).toBe(false); // Missing leading zero
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('not-a-date')).toBe(false);
    });

    it('should reject invalid dates', () => {
      expect(isValidDate('2025-13-01')).toBe(false); // Invalid month
      expect(isValidDate('2025-02-30')).toBe(false); // Invalid day
    });
  });

  describe('isValidDatetime', () => {
    it('should validate correct ISO 8601 datetime format', () => {
      expect(isValidDatetime('2025-01-28T10:30:00.000Z')).toBe(true);
      expect(isValidDatetime('2024-12-31T23:59:59.999Z')).toBe(true);
      expect(isValidDatetime('2023-06-15T00:00:00Z')).toBe(true); // Without milliseconds
    });

    it('should reject invalid datetime formats', () => {
      expect(isValidDatetime('2025-01-28 10:30:00')).toBe(false); // Space instead of T
      expect(isValidDatetime('2025-01-28T10:30:00')).toBe(false); // Missing Z
      expect(isValidDatetime('2025-01-28T10:30')).toBe(false); // Missing seconds
      expect(isValidDatetime('')).toBe(false);
      expect(isValidDatetime('not-a-datetime')).toBe(false);
    });
  });

  describe('isValidEntityId', () => {
    it('should validate correct entity ID formats', () => {
      expect(isValidEntityId('task-123')).toBe(true);
      expect(isValidEntityId('auction_456')).toBe(true);
      expect(isValidEntityId('space-abc-123')).toBe(true);
      expect(isValidEntityId('ABC123')).toBe(true);
      expect(isValidEntityId('test_id-123')).toBe(true);
    });

    it('should reject invalid entity ID formats', () => {
      expect(isValidEntityId('')).toBe(false);
      expect(isValidEntityId('id with spaces')).toBe(false);
      expect(isValidEntityId('id@special')).toBe(false);
      expect(isValidEntityId('id.with.dots')).toBe(false);
    });
  });
});

describe('SchemaValidator', () => {
  describe('validateShopkeeperKey', () => {
    it('should validate correct shopkeeper key', () => {
      const result = schemaValidator.validateShopkeeperKey('550e8400-e29b-41d4-a716-446655440000');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing shopkeeper ID', () => {
      const result = schemaValidator.validateShopkeeperKey('');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Shopkeeper ID is required');
    });

    it('should reject invalid shopkeeper ID format', () => {
      const result = schemaValidator.validateShopkeeperKey('not-a-uuid');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid shopkeeper ID format');
    });
  });

  describe('validateTaskKey', () => {
    it('should validate correct task key', () => {
      const result = schemaValidator.validateTaskKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '2025-01-28',
        'task-123'
      );
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing shopkeeper ID', () => {
      const result = schemaValidator.validateTaskKey('', '2025-01-28', 'task-123');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Shopkeeper ID is required');
    });

    it('should reject invalid shopkeeper ID format', () => {
      const result = schemaValidator.validateTaskKey('not-a-uuid', '2025-01-28', 'task-123');
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid shopkeeper ID format'))).toBe(true);
    });

    it('should reject missing assigned date', () => {
      const result = schemaValidator.validateTaskKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '',
        'task-123'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Assigned date is required');
    });

    it('should reject invalid assigned date format', () => {
      const result = schemaValidator.validateTaskKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '28-01-2025',
        'task-123'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid assigned date format'))).toBe(true);
    });

    it('should reject missing task ID', () => {
      const result = schemaValidator.validateTaskKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '2025-01-28',
        ''
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Task ID is required');
    });

    it('should reject invalid task ID format', () => {
      const result = schemaValidator.validateTaskKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '2025-01-28',
        'task with spaces'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid task ID format'))).toBe(true);
    });

    it('should accumulate multiple errors', () => {
      const result = schemaValidator.validateTaskKey('', '', '');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('validateAuctionKey', () => {
    it('should validate correct auction key', () => {
      const result = schemaValidator.validateAuctionKey('auction-123');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing auction ID', () => {
      const result = schemaValidator.validateAuctionKey('');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Auction ID is required');
    });

    it('should reject invalid auction ID format', () => {
      const result = schemaValidator.validateAuctionKey('auction with spaces');
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid auction ID format'))).toBe(true);
    });
  });

  describe('validateTransactionKey', () => {
    it('should validate correct transaction key', () => {
      const result = schemaValidator.validateTransactionKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '2025-01-28T10:30:00.000Z',
        'txn-123'
      );
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing shopkeeper ID', () => {
      const result = schemaValidator.validateTransactionKey(
        '',
        '2025-01-28T10:30:00.000Z',
        'txn-123'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Shopkeeper ID is required');
    });

    it('should reject invalid shopkeeper ID format', () => {
      const result = schemaValidator.validateTransactionKey(
        'not-a-uuid',
        '2025-01-28T10:30:00.000Z',
        'txn-123'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid shopkeeper ID format'))).toBe(true);
    });

    it('should reject missing timestamp', () => {
      const result = schemaValidator.validateTransactionKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '',
        'txn-123'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Timestamp is required');
    });

    it('should reject invalid timestamp format', () => {
      const result = schemaValidator.validateTransactionKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '2025-01-28 10:30:00',
        'txn-123'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid timestamp format'))).toBe(true);
    });

    it('should reject missing transaction ID', () => {
      const result = schemaValidator.validateTransactionKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '2025-01-28T10:30:00.000Z',
        ''
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Transaction ID is required');
    });

    it('should reject invalid transaction ID format', () => {
      const result = schemaValidator.validateTransactionKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '2025-01-28T10:30:00.000Z',
        'txn with spaces'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid transaction ID format'))).toBe(true);
    });
  });

  describe('validateShelfSpaceKey', () => {
    it('should validate correct shelf space key', () => {
      const result = schemaValidator.validateShelfSpaceKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '2025-01-28',
        'space-123'
      );
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing shopkeeper ID', () => {
      const result = schemaValidator.validateShelfSpaceKey('', '2025-01-28', 'space-123');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Shopkeeper ID is required');
    });

    it('should reject invalid shopkeeper ID format', () => {
      const result = schemaValidator.validateShelfSpaceKey('not-a-uuid', '2025-01-28', 'space-123');
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid shopkeeper ID format'))).toBe(true);
    });

    it('should reject missing analysis date', () => {
      const result = schemaValidator.validateShelfSpaceKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '',
        'space-123'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Analysis date is required');
    });

    it('should reject invalid analysis date format', () => {
      const result = schemaValidator.validateShelfSpaceKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '28-01-2025',
        'space-123'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid analysis date format'))).toBe(true);
    });

    it('should reject missing shelf space ID', () => {
      const result = schemaValidator.validateShelfSpaceKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '2025-01-28',
        ''
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Shelf space ID is required');
    });

    it('should reject invalid shelf space ID format', () => {
      const result = schemaValidator.validateShelfSpaceKey(
        '550e8400-e29b-41d4-a716-446655440000',
        '2025-01-28',
        'space with spaces'
      );
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid shelf space ID format'))).toBe(true);
    });
  });
});

describe('Helper Functions', () => {
  describe('validateKey', () => {
    it('should validate complete key structure', () => {
      const result = validateKey('SHOPKEEPER#123', 'METADATA');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing partition key', () => {
      const result = validateKey('', 'METADATA');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Partition key (PK) is required');
    });

    it('should reject missing sort key', () => {
      const result = validateKey('SHOPKEEPER#123', '');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Sort key (SK) is required');
    });

    it('should reject both missing keys', () => {
      const result = validateKey('', '');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('createValidationError', () => {
    it('should create error from validation result', () => {
      const result: ValidationResult = {
        valid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: [],
      };
      
      const error = createValidationError(result);
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toContain('Error 1');
      expect(error.message).toContain('Error 2');
    });

    it('should join multiple errors with semicolon', () => {
      const result: ValidationResult = {
        valid: false,
        errors: ['First error', 'Second error', 'Third error'],
        warnings: [],
      };
      
      const error = createValidationError(result);
      
      expect(error.message).toBe('Validation failed: First error; Second error; Third error');
    });
  });
});
