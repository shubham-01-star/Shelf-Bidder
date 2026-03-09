/**
 * Unit tests for Photo Analysis API Route
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import * as vision from '@/lib/vision';
import * as storage from '@/lib/storage';

// Mock dependencies
jest.mock('@/lib/vision');
jest.mock('@/lib/storage');
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    shopkeepers: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'shopkeeper-uuid-1',
        shopkeeper_id: 'shop-123',
        name: 'Test Shopkeeper',
        store_address: 'Test Address',
      }),
    },
    shelf_spaces: {
      create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: 'shelf-space-1',
          ...data,
        })
      ),
    },
  },
}));

describe('POST /api/photos/analyze', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if shopkeeperId is missing', async () => {
    const request = new NextRequest('http://localhost/api/photos/analyze', {
      method: 'POST',
      body: JSON.stringify({
        photoUrl: 'https://example.com/photo.jpg',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('shopkeeperId');
  });

  it('should return 400 if neither photoUrl nor imageData is provided', async () => {
    const request = new NextRequest('http://localhost/api/photos/analyze', {
      method: 'POST',
      body: JSON.stringify({
        shopkeeperId: 'shop-123',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('photoUrl or imageData');
  });

  it('should successfully analyze shelf photo with imageData', async () => {
    const mockAnalysisResult = {
      emptySpaces: [
        {
          id: 'space-1',
          coordinates: { x: 100, y: 200, width: 150, height: 200 },
          shelfLevel: 2,
          visibility: 'high' as const,
          accessibility: 'easy' as const,
        },
      ],
      currentInventory: [
        {
          name: 'Coca Cola',
          brand: 'Coca Cola',
          category: 'beverages',
        },
      ],
      analysisConfidence: 85,
      processingTime: 5000,
    };

    (vision.analyzeShelfSpace as any).mockResolvedValue(mockAnalysisResult);

    const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const request = new NextRequest('http://localhost/api/photos/analyze', {
      method: 'POST',
      body: JSON.stringify({
        shopkeeperId: 'shop-123',
        photoUrl: 'https://example.com/photo.jpg',
        imageData,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.emptySpaces).toHaveLength(1);
    expect(data.data.currentInventory).toHaveLength(1);
    expect(data.data.analysisConfidence).toBe(85);
  });

  it('should return 400 for image exceeding size limit', async () => {
    // Create a large buffer (>20MB)
    const largeBuffer = Buffer.alloc(21 * 1024 * 1024);
    const largeImageData = `data:image/jpeg;base64,${largeBuffer.toString('base64')}`;

    const request = new NextRequest('http://localhost/api/photos/analyze', {
      method: 'POST',
      body: JSON.stringify({
        shopkeeperId: 'shop-123',
        photoUrl: 'https://example.com/photo.jpg',
        imageData: largeImageData,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('too large');
  });

  it('should handle AnalysisError appropriately', async () => {
    // Create a proper AnalysisError instance
    const analysisError = Object.assign(
      new Error('Invalid image format'),
      {
        name: 'AnalysisError',
        code: 'INVALID_INPUT',
        details: { reason: 'Corrupted image data' },
      }
    );

    // Make it an instance of AnalysisError
    Object.setPrototypeOf(analysisError, vision.AnalysisError.prototype);

    (vision.analyzeShelfSpace as any).mockRejectedValue(analysisError);

    const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const request = new NextRequest('http://localhost/api/photos/analyze', {
      method: 'POST',
      body: JSON.stringify({
        shopkeeperId: 'shop-123',
        photoUrl: 'https://example.com/photo.jpg',
        imageData,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Analysis failed');
    expect(data.code).toBe('INVALID_INPUT');
  });

  it('should handle general errors', async () => {
    (vision.analyzeShelfSpace as any).mockRejectedValue(
      new Error('Network error')
    );

    const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    const request = new NextRequest('http://localhost/api/photos/analyze', {
      method: 'POST',
      body: JSON.stringify({
        shopkeeperId: 'shop-123',
        photoUrl: 'https://example.com/photo.jpg',
        imageData,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to analyze photo');
  });
});
