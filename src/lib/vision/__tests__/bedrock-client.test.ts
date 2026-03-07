/**
 * Unit tests for Bedrock Client with Multi-Model Fallback Chain
 * Task 4.2: Tests Nova Pro → Nova Lite → Claude Haiku fallback
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  getBedrockClient,
  imageToBase64,
  getMediaType,
  analyzeShelfPhoto,
  verifyTaskCompletion,
} from '../bedrock-client';

// Mock the database query function
jest.mock('@/lib/db/postgres/client', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
  InvokeModelCommand: jest.fn(),
}));

describe('Bedrock Client', () => {
  describe('getBedrockClient', () => {
    it('should create and return a Bedrock client', () => {
      const client = getBedrockClient();
      expect(client).toBeDefined();
      expect(client.config).toBeDefined();
    });

    it('should return the same client instance on subsequent calls', () => {
      const client1 = getBedrockClient();
      const client2 = getBedrockClient();
      expect(client1).toBe(client2);
    });
  });

  describe('imageToBase64', () => {
    it('should convert buffer to base64 string', () => {
      const buffer = Buffer.from('test image data');
      const base64 = imageToBase64(buffer);
      expect(base64).toBe(buffer.toString('base64'));
      expect(typeof base64).toBe('string');
    });

    it('should handle empty buffer', () => {
      const buffer = Buffer.from('');
      const base64 = imageToBase64(buffer);
      expect(base64).toBe('');
    });
  });

  describe('getMediaType', () => {
    it('should return image/jpeg for jpeg mime type', () => {
      expect(getMediaType('image/jpeg')).toBe('image/jpeg');
      expect(getMediaType('image/jpg')).toBe('image/jpeg');
    });

    it('should return image/png for png mime type', () => {
      expect(getMediaType('image/png')).toBe('image/png');
    });

    it('should return image/webp for webp mime type', () => {
      expect(getMediaType('image/webp')).toBe('image/webp');
    });

    it('should default to image/jpeg for unknown mime types', () => {
      expect(getMediaType('image/gif')).toBe('image/jpeg');
      expect(getMediaType('application/octet-stream')).toBe('image/jpeg');
      expect(getMediaType('')).toBe('image/jpeg');
    });
  });

  describe('Multi-Model Fallback Chain', () => {
    // Note: Full integration tests for fallback chain are in integration tests
    // These are basic unit tests to verify the functions exist and have correct signatures
    
    it('should export analyzeShelfPhoto function', () => {
      expect(typeof analyzeShelfPhoto).toBe('function');
    });

    it('should export verifyTaskCompletion function', () => {
      expect(typeof verifyTaskCompletion).toBe('function');
    });
  });
});
