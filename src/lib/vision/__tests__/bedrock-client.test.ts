/**
 * Unit tests for Bedrock Client
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  getBedrockClient,
  imageToBase64,
  getMediaType,
} from '../bedrock-client';

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
});
