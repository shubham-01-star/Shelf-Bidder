/**
 * Unit Tests for Location Utility Functions
 * 
 * Task 3.1: Test location extraction, normalization, and matching
 */

import { describe, test, expect } from '@jest/globals';
import { extractCityFromAddress, normalizeCityName, isLocationMatch } from '@/lib/utils/location';

describe('extractCityFromAddress', () => {
  test('extracts city from standard address format', () => {
    expect(extractCityFromAddress('Shop 123, Main Market, Delhi')).toBe('Delhi');
    expect(extractCityFromAddress('Sector 18, Noida')).toBe('Noida');
    expect(extractCityFromAddress('DLF Phase 3, Gurgaon')).toBe('Gurgaon');
  });

  test('handles address with pincode', () => {
    expect(extractCityFromAddress('Shop 45, Sector 18, Noida, 201301')).toBe('Noida');
    expect(extractCityFromAddress('Main Market, Delhi, 110001')).toBe('Delhi');
  });

  test('handles single component address', () => {
    expect(extractCityFromAddress('Mumbai')).toBe('Mumbai');
    expect(extractCityFromAddress('Bangalore')).toBe('Bangalore');
  });

  test('handles empty or invalid input', () => {
    expect(extractCityFromAddress('')).toBe('Unknown');
    expect(extractCityFromAddress('   ')).toBe('Unknown');
  });

  test('handles address with extra whitespace', () => {
    expect(extractCityFromAddress('Shop 10 ,  Main Market  ,  Gurgaon  ')).toBe('Gurgaon');
  });

  test('handles lowercase addresses', () => {
    expect(extractCityFromAddress('shop 45, sector 18, noida')).toBe('noida');
    expect(extractCityFromAddress('main market, delhi')).toBe('delhi');
  });
});

describe('normalizeCityName', () => {
  test('converts to lowercase', () => {
    expect(normalizeCityName('Delhi')).toBe('delhi');
    expect(normalizeCityName('MUMBAI')).toBe('mumbai');
    expect(normalizeCityName('NoIdA')).toBe('noida');
  });

  test('trims whitespace', () => {
    expect(normalizeCityName('  Delhi  ')).toBe('delhi');
    expect(normalizeCityName('Mumbai   ')).toBe('mumbai');
  });

  test('handles spelling variations', () => {
    expect(normalizeCityName('Gurgaon')).toBe('gurugram');
    expect(normalizeCityName('Gurugram')).toBe('gurugram');
    expect(normalizeCityName('Bombay')).toBe('mumbai');
    expect(normalizeCityName('Calcutta')).toBe('kolkata');
    expect(normalizeCityName('Madras')).toBe('chennai');
    expect(normalizeCityName('Bangalore')).toBe('bengaluru');
    expect(normalizeCityName('Bengaluru')).toBe('bengaluru');
  });

  test('handles empty or invalid input', () => {
    expect(normalizeCityName('')).toBe('');
    expect(normalizeCityName('   ')).toBe('');
  });

  test('preserves cities without variations', () => {
    expect(normalizeCityName('Pune')).toBe('pune');
    expect(normalizeCityName('Hyderabad')).toBe('hyderabad');
  });
});

describe('isLocationMatch', () => {
  test('matches exact city names (case-insensitive)', () => {
    expect(isLocationMatch('Delhi', 'Delhi')).toBe(true);
    expect(isLocationMatch('delhi', 'Delhi')).toBe(true);
    expect(isLocationMatch('DELHI', 'delhi')).toBe(true);
    expect(isLocationMatch('Mumbai', 'Mumbai')).toBe(true);
  });

  test('matches spelling variations', () => {
    expect(isLocationMatch('Gurgaon', 'Gurugram')).toBe(true);
    expect(isLocationMatch('Gurugram', 'Gurgaon')).toBe(true);
    expect(isLocationMatch('Bombay', 'Mumbai')).toBe(true);
    expect(isLocationMatch('Bangalore', 'Bengaluru')).toBe(true);
  });

  test('matches Delhi NCR regional locations', () => {
    // Delhi NCR target should match NCR cities
    expect(isLocationMatch('Delhi', 'Delhi NCR')).toBe(true);
    expect(isLocationMatch('Gurgaon', 'Delhi NCR')).toBe(true);
    expect(isLocationMatch('Gurugram', 'Delhi NCR')).toBe(true);
    expect(isLocationMatch('Noida', 'Delhi NCR')).toBe(true);
    expect(isLocationMatch('Faridabad', 'Delhi NCR')).toBe(true);
    expect(isLocationMatch('Ghaziabad', 'Delhi NCR')).toBe(true);
  });

  test('matches NCR target variations', () => {
    expect(isLocationMatch('Delhi', 'NCR')).toBe(true);
    expect(isLocationMatch('Gurgaon', 'ncr')).toBe(true);
    expect(isLocationMatch('Noida', 'Delhi NCR')).toBe(true);
  });

  test('does not match non-NCR cities with Delhi NCR', () => {
    expect(isLocationMatch('Mumbai', 'Delhi NCR')).toBe(false);
    expect(isLocationMatch('Bangalore', 'Delhi NCR')).toBe(false);
    expect(isLocationMatch('Pune', 'NCR')).toBe(false);
  });

  test('matches partial/substring matches', () => {
    expect(isLocationMatch('New Delhi', 'Delhi')).toBe(true);
    expect(isLocationMatch('Delhi', 'New Delhi')).toBe(true);
  });

  test('does not match completely different cities', () => {
    expect(isLocationMatch('Mumbai', 'Delhi')).toBe(false);
    expect(isLocationMatch('Bangalore', 'Pune')).toBe(false);
    expect(isLocationMatch('Chennai', 'Kolkata')).toBe(false);
  });

  test('handles empty or invalid input', () => {
    expect(isLocationMatch('', 'Delhi')).toBe(false);
    expect(isLocationMatch('Delhi', '')).toBe(false);
    expect(isLocationMatch('', '')).toBe(false);
  });

  test('handles whitespace in input', () => {
    expect(isLocationMatch('  Delhi  ', 'Delhi')).toBe(true);
    expect(isLocationMatch('Gurgaon', '  Gurugram  ')).toBe(true);
  });
});
