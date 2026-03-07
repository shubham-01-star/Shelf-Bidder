/**
 * PostgreSQL Validation Schema Tests
 * Task 2.1: Unit tests for Zod validation schemas
 */

import { describe, it, expect } from '@jest/globals';
import {
  CreateShopkeeperSchema,
  CreateCampaignSchema,
  CreateTaskSchema,
  CreateTransactionSchema,
  validate,
  safeValidate,
  validateOrThrow,
} from '../validation';

describe('PostgreSQL Validation Schemas', () => {
  describe('CreateShopkeeperSchema', () => {
    it('should validate valid shopkeeper data', () => {
      const validData = {
        shopkeeper_id: 'test-123',
        name: 'Test Shopkeeper',
        phone_number: '+1234567890',
        email: 'test@example.com',
        store_address: '123 Test St',
      };

      const result = safeValidate(CreateShopkeeperSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        shopkeeper_id: 'test-123',
        name: 'Test Shopkeeper',
        phone_number: '+1234567890',
        email: 'invalid-email',
        store_address: '123 Test St',
      };

      const result = safeValidate(CreateShopkeeperSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone number', () => {
      const invalidData = {
        shopkeeper_id: 'test-123',
        name: 'Test Shopkeeper',
        phone_number: 'invalid',
        email: 'test@example.com',
        store_address: '123 Test St',
      };

      const result = safeValidate(CreateShopkeeperSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateCampaignSchema', () => {
    it('should validate valid campaign data', () => {
      const validData = {
        agent_id: 'agent-123',
        brand_name: 'Test Brand',
        product_name: 'Test Product',
        product_category: 'Food',
        budget: 1000,
        payout_per_task: 50,
        target_locations: ['New York', 'Los Angeles'],
        placement_requirements: [
          {
            type: 'visibility' as const,
            description: 'Must be at eye level',
            required: true,
          },
        ],
        product_dimensions: {
          width: 10,
          height: 20,
          depth: 5,
          unit: 'cm' as const,
        },
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
      };

      const result = safeValidate(CreateCampaignSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject end date before start date', () => {
      const invalidData = {
        agent_id: 'agent-123',
        brand_name: 'Test Brand',
        product_name: 'Test Product',
        product_category: 'Food',
        budget: 1000,
        payout_per_task: 50,
        target_locations: ['New York'],
        placement_requirements: [],
        product_dimensions: {
          width: 10,
          height: 20,
          depth: 5,
          unit: 'cm' as const,
        },
        start_date: new Date('2025-12-31'),
        end_date: new Date('2025-01-01'),
      };

      const result = safeValidate(CreateCampaignSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative budget', () => {
      const invalidData = {
        agent_id: 'agent-123',
        brand_name: 'Test Brand',
        product_name: 'Test Product',
        product_category: 'Food',
        budget: -100,
        payout_per_task: 50,
        target_locations: ['New York'],
        placement_requirements: [],
        product_dimensions: {
          width: 10,
          height: 20,
          depth: 5,
          unit: 'cm' as const,
        },
        start_date: new Date('2025-01-01'),
        end_date: new Date('2025-12-31'),
      };

      const result = safeValidate(CreateCampaignSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateTransactionSchema', () => {
    it('should validate valid transaction data', () => {
      const validData = {
        shopkeeper_id: '550e8400-e29b-41d4-a716-446655440000',
        task_id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'earning' as const,
        amount: 50,
        description: 'Task completion payment',
      };

      const result = safeValidate(CreateTransactionSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        shopkeeper_id: 'invalid-uuid',
        type: 'earning' as const,
        amount: 50,
        description: 'Task completion payment',
      };

      const result = safeValidate(CreateTransactionSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Validation Helper Functions', () => {
    it('validate() should throw on invalid data', () => {
      const invalidData = {
        shopkeeper_id: 'test-123',
        name: 'Test',
        phone_number: 'invalid',
        email: 'invalid',
        store_address: '123 Test St',
      };

      expect(() => validate(CreateShopkeeperSchema, invalidData)).toThrow();
    });

    it('validateOrThrow() should throw with entity name', () => {
      const invalidData = {
        shopkeeper_id: 'test-123',
        name: 'Test',
        phone_number: 'invalid',
        email: 'invalid',
        store_address: '123 Test St',
      };

      expect(() =>
        validateOrThrow(CreateShopkeeperSchema, invalidData, 'Shopkeeper')
      ).toThrow(/Shopkeeper validation failed/);
    });
  });
});
