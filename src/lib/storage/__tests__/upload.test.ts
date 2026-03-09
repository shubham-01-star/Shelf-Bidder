/**
 * Unit tests for photo upload utilities
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  validatePhotoFile,
  getFileExtension,
  PhotoType,
} from '../upload';

describe('Photo Upload Utilities', () => {
  describe('validatePhotoFile', () => {
    it('should validate a valid JPEG file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validatePhotoFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid PNG file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validatePhotoFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate a valid WebP file', () => {
      const file = new File(['test'], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validatePhotoFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file exceeding size limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 25 * 1024 * 1024 }); // 25MB

      const result = validatePhotoFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should reject invalid file type', () => {
      const file = new File(['test'], 'test.gif', { type: 'image/gif' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validatePhotoFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject PDF file', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const result = validatePhotoFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should handle edge case: exactly 20MB file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 }); // Exactly 20MB

      const result = validatePhotoFile(file);
      expect(result.valid).toBe(true);
    });

    it('should handle edge case: 1 byte over limit', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 + 1 }); // 20MB + 1 byte

      const result = validatePhotoFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('photo.jpg', 'image/jpeg')).toBe('jpg');
      expect(getFileExtension('photo.png', 'image/png')).toBe('png');
      expect(getFileExtension('photo.webp', 'image/webp')).toBe('webp');
    });

    it('should handle uppercase extensions', () => {
      expect(getFileExtension('photo.JPG', 'image/jpeg')).toBe('jpg');
      expect(getFileExtension('photo.PNG', 'image/png')).toBe('png');
    });

    it('should fallback to MIME type when no extension', () => {
      expect(getFileExtension('photo', 'image/jpeg')).toBe('jpg');
      expect(getFileExtension('photo', 'image/png')).toBe('png');
      expect(getFileExtension('photo', 'image/webp')).toBe('webp');
    });

    it('should handle multiple dots in filename', () => {
      expect(getFileExtension('my.photo.jpg', 'image/jpeg')).toBe('jpg');
      expect(getFileExtension('test.backup.png', 'image/png')).toBe('png');
    });

    it('should handle JPEG vs JPG MIME type', () => {
      expect(getFileExtension('photo.jpeg', 'image/jpeg')).toBe('jpeg');
      expect(getFileExtension('photo', 'image/jpg')).toBe('jpg');
    });

    it('should default to jpg for unknown MIME type', () => {
      expect(getFileExtension('photo', 'image/unknown')).toBe('jpg');
    });
  });

  describe('PhotoType enum', () => {
    it('should have correct values', () => {
      expect(PhotoType.SHELF).toBe('shelf');
      expect(PhotoType.PROOF).toBe('proof');
    });
  });
});
