/**
 * Unit tests for DashboardHeader component
 * Feature: brand-dashboard-redesign
 * Task: 5.1 Build header with greeting, brand name, and avatar
 * 
 * Requirements: 9N.2, 9N.3, 9N.4, 9N.5
 */

import { describe, it, expect } from '@jest/globals';
import { getGreeting } from '../DashboardHeader';

describe('DashboardHeader - Time-based greeting logic', () => {
  describe('getGreeting function', () => {
    it('should return "Good Morning" for hours 0-11', () => {
      expect(getGreeting(0)).toBe('Good Morning');
      expect(getGreeting(6)).toBe('Good Morning');
      expect(getGreeting(11)).toBe('Good Morning');
    });

    it('should return "Good Afternoon" for hours 12-16', () => {
      expect(getGreeting(12)).toBe('Good Afternoon');
      expect(getGreeting(14)).toBe('Good Afternoon');
      expect(getGreeting(16)).toBe('Good Afternoon');
    });

    it('should return "Good Evening" for hours 17-23', () => {
      expect(getGreeting(17)).toBe('Good Evening');
      expect(getGreeting(20)).toBe('Good Evening');
      expect(getGreeting(23)).toBe('Good Evening');
    });

    it('should handle boundary cases correctly', () => {
      // Morning-Afternoon boundary
      expect(getGreeting(11)).toBe('Good Morning');
      expect(getGreeting(12)).toBe('Good Afternoon');
      
      // Afternoon-Evening boundary
      expect(getGreeting(16)).toBe('Good Afternoon');
      expect(getGreeting(17)).toBe('Good Evening');
    });

    it('should use current time when no hour is provided', () => {
      const result = getGreeting();
      expect(['Good Morning', 'Good Afternoon', 'Good Evening']).toContain(result);
    });
  });
});
