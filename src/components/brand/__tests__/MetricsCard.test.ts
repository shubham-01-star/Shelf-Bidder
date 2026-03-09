/**
 * Unit Tests for MetricsCard Component
 * Feature: brand-dashboard-redesign
 * Task: 6.1 Create MetricsCard component
 * 
 * Tests the formatCurrency utility function which is the core logic
 * for displaying currency values in the MetricsCard component.
 * 
 * Requirements: 3.2, 6.3 (Currency formatting with ₹ symbol and thousand separators)
 */

import { describe, it, expect } from '@jest/globals';
import { formatCurrency } from '../MetricsCard';

describe('MetricsCard - formatCurrency utility', () => {
  describe('Basic currency formatting', () => {
    it('should format currency with rupee symbol and thousand separators', () => {
      expect(formatCurrency(12500)).toBe('₹12,500');
      expect(formatCurrency(1000000)).toBe('₹10,00,000');
      expect(formatCurrency(500)).toBe('₹500');
      expect(formatCurrency(0)).toBe('₹0');
    });

    it('should handle large numbers correctly', () => {
      expect(formatCurrency(9999999)).toBe('₹99,99,999');
      expect(formatCurrency(50000000)).toBe('₹5,00,00,000');
    });

    it('should handle small numbers without separators', () => {
      expect(formatCurrency(1)).toBe('₹1');
      expect(formatCurrency(99)).toBe('₹99');
      expect(formatCurrency(999)).toBe('₹999');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero correctly', () => {
      expect(formatCurrency(0)).toBe('₹0');
    });

    it('should handle numbers at thousand boundaries', () => {
      expect(formatCurrency(1000)).toBe('₹1,000');
      expect(formatCurrency(10000)).toBe('₹10,000');
      expect(formatCurrency(100000)).toBe('₹1,00,000');
    });

    it('should format typical wallet amounts correctly', () => {
      // Common recharge amounts from requirements
      expect(formatCurrency(1000)).toBe('₹1,000');
      expect(formatCurrency(5000)).toBe('₹5,000');
      expect(formatCurrency(10000)).toBe('₹10,000');
      expect(formatCurrency(25000)).toBe('₹25,000');
      expect(formatCurrency(50000)).toBe('₹50,000');
      expect(formatCurrency(100000)).toBe('₹1,00,000');
    });
  });

  describe('Indian numbering system', () => {
    it('should use Indian numbering system (lakhs and crores)', () => {
      // 1 lakh = 100,000
      expect(formatCurrency(100000)).toBe('₹1,00,000');
      
      // 10 lakhs = 1,000,000
      expect(formatCurrency(1000000)).toBe('₹10,00,000');
      
      // 1 crore = 10,000,000
      expect(formatCurrency(10000000)).toBe('₹1,00,00,000');
    });
  });
});
