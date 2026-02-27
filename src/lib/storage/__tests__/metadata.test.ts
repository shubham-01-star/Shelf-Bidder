/**
 * Unit tests for photo metadata utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  validatePhotoMetadata,
  generatePhotoId,
  parsePhotoId,
  estimateStorageCost,
  getMetadataSummary,
} from '../metadata';
import type { PhotoMetadata } from '../metadata';

describe('Photo Metadata Utilities', () => {
  describe('validatePhotoMetadata', () => {
    const validMetadata: PhotoMetadata = {
      photoId: 'photo_shop123_1234567890',
      shopkeeperId: 'shop123',
      photoType: 'shelf',
      s3Key: 'shelf/shop123/1234567890.jpg',
      s3Url: 'https://bucket.s3.amazonaws.com/shelf/shop123/1234567890.jpg',
      uploadedAt: '2024-01-01T00:00:00.000Z',
      fileSize: 1024 * 1024,
      originalSize: 1024 * 1024,
      width: 1920,
      height: 1080,
      format: 'jpeg',
      hasAlpha: false,
    };

    it('should validate correct metadata', () => {
      const result = validatePhotoMetadata(validMetadata);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing photoId', () => {
      const metadata = { ...validMetadata, photoId: '' };
      const result = validatePhotoMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Photo ID is required');
    });

    it('should reject missing shopkeeperId', () => {
      const metadata = { ...validMetadata, shopkeeperId: '' };
      const result = validatePhotoMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Shopkeeper ID is required');
    });

    it('should reject invalid width', () => {
      const metadata = { ...validMetadata, width: 0 };
      const result = validatePhotoMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid width');
    });

    it('should reject invalid height', () => {
      const metadata = { ...validMetadata, height: -1 };
      const result = validatePhotoMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid height');
    });

    it('should reject file size exceeding 20MB', () => {
      const metadata = { ...validMetadata, fileSize: 25 * 1024 * 1024 };
      const result = validatePhotoMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size exceeds 20MB limit');
    });

    it('should reject invalid photo type', () => {
      const metadata = { ...validMetadata, photoType: 'invalid' as any };
      const result = validatePhotoMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid photo type');
    });

    it('should accept proof photo type', () => {
      const metadata = { ...validMetadata, photoType: 'proof' as const };
      const result = validatePhotoMetadata(metadata);
      expect(result.valid).toBe(true);
    });

    it('should collect multiple errors', () => {
      const metadata = {
        ...validMetadata,
        photoId: '',
        width: 0,
        height: -1,
      };
      const result = validatePhotoMetadata(metadata);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('generatePhotoId', () => {
    it('should generate photo ID with shopkeeper ID', () => {
      const photoId = generatePhotoId('shop123');
      expect(photoId).toMatch(/^photo_shop123_\d+$/);
    });

    it('should generate unique IDs for same shopkeeper', async () => {
      const id1 = generatePhotoId('shop123');
      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      const id2 = generatePhotoId('shop123');
      expect(id1).not.toBe(id2);
    });

    it('should use provided timestamp', () => {
      const timestamp = 1234567890;
      const photoId = generatePhotoId('shop123', timestamp);
      expect(photoId).toBe('photo_shop123_1234567890');
    });

    it('should handle shopkeeper IDs with special characters', () => {
      const photoId = generatePhotoId('shop-123_abc');
      expect(photoId).toMatch(/^photo_shop-123_abc_\d+$/);
    });
  });

  describe('parsePhotoId', () => {
    it('should parse valid photo ID', () => {
      const result = parsePhotoId('photo_shop123_1234567890');
      expect(result).not.toBeNull();
      expect(result?.shopkeeperId).toBe('shop123');
      expect(result?.timestamp).toBe(1234567890);
    });

    it('should return null for invalid format', () => {
      expect(parsePhotoId('invalid')).toBeNull();
      expect(parsePhotoId('photo_shop123')).toBeNull();
      expect(parsePhotoId('shop123_1234567890')).toBeNull();
    });

    it('should handle shopkeeper IDs with special characters', () => {
      const result = parsePhotoId('photo_shop-123_abc_1234567890');
      expect(result).not.toBeNull();
      expect(result?.shopkeeperId).toBe('shop-123_abc');
      expect(result?.timestamp).toBe(1234567890);
    });

    it('should handle large timestamps', () => {
      const timestamp = Date.now();
      const photoId = `photo_shop123_${timestamp}`;
      const result = parsePhotoId(photoId);
      expect(result?.timestamp).toBe(timestamp);
    });
  });

  describe('estimateStorageCost', () => {
    const metadata: PhotoMetadata = {
      photoId: 'photo_shop123_1234567890',
      shopkeeperId: 'shop123',
      photoType: 'shelf',
      s3Key: 'shelf/shop123/1234567890.jpg',
      s3Url: 'https://bucket.s3.amazonaws.com/shelf/shop123/1234567890.jpg',
      uploadedAt: '2024-01-01T00:00:00.000Z',
      fileSize: 1024 * 1024 * 1024, // 1GB
      originalSize: 1024 * 1024 * 1024,
      width: 1920,
      height: 1080,
      format: 'jpeg',
      hasAlpha: false,
    };

    it('should calculate storage cost for 1GB over 3 months', () => {
      const cost = estimateStorageCost(metadata, 3);
      expect(cost).toBeCloseTo(0.069, 3); // $0.023 * 3 months
    });

    it('should use default 3 months if not specified', () => {
      const cost = estimateStorageCost(metadata);
      expect(cost).toBeCloseTo(0.069, 3);
    });

    it('should calculate cost for different durations', () => {
      const cost1Month = estimateStorageCost(metadata, 1);
      const cost6Months = estimateStorageCost(metadata, 6);
      expect(cost6Months).toBeCloseTo(cost1Month * 6, 3);
    });

    it('should handle small file sizes', () => {
      const smallMetadata = { ...metadata, fileSize: 1024 * 1024 }; // 1MB
      const cost = estimateStorageCost(smallMetadata, 3);
      expect(cost).toBeLessThan(0.001);
    });
  });

  describe('getMetadataSummary', () => {
    const metadata: PhotoMetadata = {
      photoId: 'photo_shop123_1234567890',
      shopkeeperId: 'shop123',
      photoType: 'shelf',
      s3Key: 'shelf/shop123/1234567890.jpg',
      s3Url: 'https://bucket.s3.amazonaws.com/shelf/shop123/1234567890.jpg',
      uploadedAt: '2024-01-01T12:00:00.000Z',
      fileSize: 5 * 1024 * 1024, // 5MB
      originalSize: 10 * 1024 * 1024, // 10MB
      width: 1920,
      height: 1080,
      format: 'jpeg',
      hasAlpha: false,
      compressionRatio: 50,
    };

    it('should format file size in MB', () => {
      const summary = getMetadataSummary(metadata);
      expect(summary.size).toBe('5.00 MB');
    });

    it('should format dimensions', () => {
      const summary = getMetadataSummary(metadata);
      expect(summary.dimensions).toBe('1920 x 1080');
    });

    it('should format format as uppercase', () => {
      const summary = getMetadataSummary(metadata);
      expect(summary.format).toBe('JPEG');
    });

    it('should include compression info when available', () => {
      const summary = getMetadataSummary(metadata);
      expect(summary.compressionInfo).toBe('50.0% reduction');
    });

    it('should omit compression info when not available', () => {
      const metadataNoCompression = { ...metadata, compressionRatio: undefined };
      const summary = getMetadataSummary(metadataNoCompression);
      expect(summary.compressionInfo).toBeUndefined();
    });

    it('should format upload date as locale string', () => {
      const summary = getMetadataSummary(metadata);
      expect(summary.uploadDate).toBeTruthy();
      expect(typeof summary.uploadDate).toBe('string');
    });
  });
});
