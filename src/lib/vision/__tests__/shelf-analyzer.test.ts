/**
 * Unit tests for Shelf Analyzer
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  analyzeShelfSpace,
  calculateConfidenceScore,
  AnalysisError,
  type ShelfAnalysisResult,
} from '../shelf-analyzer';
import * as bedrockClient from '../bedrock-client';

// Mock the bedrock client
jest.mock('../bedrock-client');

describe('Shelf Analyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeShelfSpace', () => {
    it('should throw AnalysisError for empty image buffer', async () => {
      const emptyBuffer = Buffer.from('');
      
      await expect(
        analyzeShelfSpace(emptyBuffer, 'image/jpeg')
      ).rejects.toThrow(AnalysisError);
      
      await expect(
        analyzeShelfSpace(emptyBuffer, 'image/jpeg')
      ).rejects.toMatchObject({
        code: 'INVALID_INPUT',
      });
    });

    it('should successfully analyze shelf space with valid response', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              emptySpaces: [
                {
                  id: 'space-1',
                  coordinates: { x: 100, y: 200, width: 150, height: 200 },
                  shelfLevel: 2,
                  visibility: 'high',
                  accessibility: 'easy',
                },
              ],
              currentInventory: [
                {
                  name: 'Coca Cola',
                  brand: 'Coca Cola',
                  category: 'beverages',
                },
              ],
              confidence: 85,
              reasoning: 'Clear image with good lighting',
            }),
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as jest.Mock).mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake image data');
      const result = await analyzeShelfSpace(imageBuffer, 'image/jpeg');

      expect(result.emptySpaces).toHaveLength(1);
      expect(result.emptySpaces[0].id).toBe('space-1');
      expect(result.emptySpaces[0].visibility).toBe('high');
      expect(result.currentInventory).toHaveLength(1);
      expect(result.currentInventory[0].name).toBe('Coca Cola');
      expect(result.analysisConfidence).toBe(85);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should handle response with markdown code blocks', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: '```json\n' + JSON.stringify({
              emptySpaces: [],
              currentInventory: [],
              confidence: 50,
            }) + '\n```',
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as jest.Mock).mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake image data');
      const result = await analyzeShelfSpace(imageBuffer, 'image/jpeg');

      expect(result.emptySpaces).toHaveLength(0);
      expect(result.currentInventory).toHaveLength(0);
      expect(result.analysisConfidence).toBe(50);
    });

    it('should normalize invalid visibility values', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              emptySpaces: [
                {
                  id: 'space-1',
                  coordinates: { x: 100, y: 200, width: 150, height: 200 },
                  shelfLevel: 2,
                  visibility: 'invalid-value',
                  accessibility: 'easy',
                },
              ],
              currentInventory: [],
              confidence: 70,
            }),
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as jest.Mock).mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake image data');
      const result = await analyzeShelfSpace(imageBuffer, 'image/jpeg');

      expect(result.emptySpaces[0].visibility).toBe('medium'); // Default value
    });

    it('should clamp shelf level to valid range (1-5)', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              emptySpaces: [
                {
                  id: 'space-1',
                  coordinates: { x: 100, y: 200, width: 150, height: 200 },
                  shelfLevel: 10, // Invalid, should be clamped to 5
                  visibility: 'high',
                  accessibility: 'easy',
                },
              ],
              currentInventory: [],
              confidence: 70,
            }),
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as jest.Mock).mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake image data');
      const result = await analyzeShelfSpace(imageBuffer, 'image/jpeg');

      expect(result.emptySpaces[0].shelfLevel).toBe(5);
    });

    it('should throw AnalysisError for invalid JSON response', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: 'This is not valid JSON',
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as jest.Mock).mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake image data');
      
      await expect(
        analyzeShelfSpace(imageBuffer, 'image/jpeg')
      ).rejects.toThrow(AnalysisError);
    });

    it('should throw AnalysisError when response has no text content', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as jest.Mock).mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake image data');
      
      await expect(
        analyzeShelfSpace(imageBuffer, 'image/jpeg')
      ).rejects.toMatchObject({
        code: 'INVALID_RESPONSE',
      });
    });
  });

  describe('calculateConfidenceScore', () => {
    it('should return original confidence for fast processing with results', () => {
      const result: ShelfAnalysisResult = {
        emptySpaces: [
          {
            id: 'space-1',
            coordinates: { x: 100, y: 200, width: 150, height: 200 },
            shelfLevel: 2,
            visibility: 'high',
            accessibility: 'easy',
          },
        ],
        currentInventory: [],
        analysisConfidence: 85,
        processingTime: 10000, // 10 seconds
      };

      expect(calculateConfidenceScore(result)).toBe(85);
    });

    it('should reduce confidence for slow processing', () => {
      const result: ShelfAnalysisResult = {
        emptySpaces: [
          {
            id: 'space-1',
            coordinates: { x: 100, y: 200, width: 150, height: 200 },
            shelfLevel: 2,
            visibility: 'high',
            accessibility: 'easy',
          },
        ],
        currentInventory: [],
        analysisConfidence: 85,
        processingTime: 30000, // 30 seconds
      };

      expect(calculateConfidenceScore(result)).toBe(75); // 85 - 10
    });

    it('should reduce confidence when no results found', () => {
      const result: ShelfAnalysisResult = {
        emptySpaces: [],
        currentInventory: [],
        analysisConfidence: 85,
        processingTime: 10000,
      };

      expect(calculateConfidenceScore(result)).toBe(65); // 85 - 20
    });

    it('should not go below 0', () => {
      const result: ShelfAnalysisResult = {
        emptySpaces: [],
        currentInventory: [],
        analysisConfidence: 10,
        processingTime: 30000,
      };

      expect(calculateConfidenceScore(result)).toBe(0); // Max(0, 10 - 10 - 20)
    });
  });
});
