/**
 * Unit tests for Proof Verifier
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  verifyTaskCompletion,
  verifyProofPhoto,
  VerificationError,
} from '../proof-verifier';
import { PlacementInstructions } from '@/types/models';
import * as bedrockClient from '../bedrock-client';

// Mock the bedrock client
jest.mock('../bedrock-client');

describe('Proof Verifier', () => {
  const mockInstructions: PlacementInstructions = {
    productName: 'Coca Cola 500ml',
    brandName: 'Coca Cola',
    targetLocation: {
      id: 'space-1',
      coordinates: { x: 100, y: 200, width: 150, height: 200 },
      shelfLevel: 2,
      visibility: 'high',
      accessibility: 'easy',
    },
    positioningRules: [
      'Place product at eye level',
      'Ensure label faces forward',
    ],
    visualRequirements: [
      'Product must be clearly visible',
      'No obstructions in front',
    ],
    timeLimit: 24,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyTaskCompletion', () => {
    it('should throw VerificationError for empty before image', async () => {
      const emptyBuffer = Buffer.from('');
      const afterBuffer = Buffer.from('fake image');

      await expect(
        verifyTaskCompletion(
          emptyBuffer,
          'image/jpeg',
          afterBuffer,
          'image/jpeg',
          mockInstructions
        )
      ).rejects.toThrow(VerificationError);

      await expect(
        verifyTaskCompletion(
          emptyBuffer,
          'image/jpeg',
          afterBuffer,
          'image/jpeg',
          mockInstructions
        )
      ).rejects.toMatchObject({
        code: 'INVALID_INPUT',
      });
    });

    it('should throw VerificationError for empty after image', async () => {
      const beforeBuffer = Buffer.from('fake image');
      const emptyBuffer = Buffer.from('');

      await expect(
        verifyTaskCompletion(
          beforeBuffer,
          'image/jpeg',
          emptyBuffer,
          'image/jpeg',
          mockInstructions
        )
      ).rejects.toThrow(VerificationError);
    });

    it('should successfully verify correct placement', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              verified: true,
              feedback: 'Product correctly placed. All requirements met.',
              confidence: 95,
              issues: [],
              reasoning: 'Product is at correct location with proper visibility',
            }),
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as any).mockResolvedValue(mockResponse);

      const beforeBuffer = Buffer.from('before image');
      const afterBuffer = Buffer.from('after image');

      const result = await verifyTaskCompletion(
        beforeBuffer,
        'image/jpeg',
        afterBuffer,
        'image/jpeg',
        mockInstructions
      );

      expect(result.verified).toBe(true);
      expect(result.confidence).toBe(95);
      expect(result.feedback).toContain('correctly placed');
    });

    it('should handle verification failure with issues', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              verified: false,
              feedback: 'Placement incorrect.',
              confidence: 85,
              issues: [
                'Product not at eye level',
                'Label not facing forward',
              ],
              reasoning: 'Multiple positioning rules violated',
            }),
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as any).mockResolvedValue(mockResponse);

      const beforeBuffer = Buffer.from('before image');
      const afterBuffer = Buffer.from('after image');

      const result = await verifyTaskCompletion(
        beforeBuffer,
        'image/jpeg',
        afterBuffer,
        'image/jpeg',
        mockInstructions
      );

      expect(result.verified).toBe(false);
      expect(result.confidence).toBe(85);
      expect(result.feedback).toContain('Issues found');
      expect(result.feedback).toContain('Product not at eye level');
      expect(result.feedback).toContain('Label not facing forward');
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
              verified: true,
              feedback: 'Looks good',
              confidence: 90,
            }) + '\n```',
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as any).mockResolvedValue(mockResponse);

      const beforeBuffer = Buffer.from('before image');
      const afterBuffer = Buffer.from('after image');

      const result = await verifyTaskCompletion(
        beforeBuffer,
        'image/jpeg',
        afterBuffer,
        'image/jpeg',
        mockInstructions
      );

      expect(result.verified).toBe(true);
      expect(result.confidence).toBe(90);
    });

    it('should clamp confidence to 0-100 range', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              verified: true,
              feedback: 'Perfect placement',
              confidence: 150, // Invalid, should be clamped to 100
            }),
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as any).mockResolvedValue(mockResponse);

      const beforeBuffer = Buffer.from('before image');
      const afterBuffer = Buffer.from('after image');

      const result = await verifyTaskCompletion(
        beforeBuffer,
        'image/jpeg',
        afterBuffer,
        'image/jpeg',
        mockInstructions
      );

      expect(result.confidence).toBe(100);
    });

    it('should throw VerificationError for invalid JSON response', async () => {
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

      (bedrockClient.invokeClaude as any).mockResolvedValue(mockResponse);

      const beforeBuffer = Buffer.from('before image');
      const afterBuffer = Buffer.from('after image');

      await expect(
        verifyTaskCompletion(
          beforeBuffer,
          'image/jpeg',
          afterBuffer,
          'image/jpeg',
          mockInstructions
        )
      ).rejects.toThrow(VerificationError);
    });
  });

  describe('verifyProofPhoto', () => {
    it('should throw VerificationError for empty proof image', async () => {
      const emptyBuffer = Buffer.from('');

      await expect(
        verifyProofPhoto(emptyBuffer, 'image/jpeg', mockInstructions)
      ).rejects.toThrow(VerificationError);

      await expect(
        verifyProofPhoto(emptyBuffer, 'image/jpeg', mockInstructions)
      ).rejects.toMatchObject({
        code: 'INVALID_INPUT',
      });
    });

    it('should successfully verify proof photo', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              verified: true,
              feedback: 'Product placement verified',
              confidence: 88,
              issues: [],
            }),
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as any).mockResolvedValue(mockResponse);

      const proofBuffer = Buffer.from('proof image');

      const result = await verifyProofPhoto(
        proofBuffer,
        'image/jpeg',
        mockInstructions
      );

      expect(result.verified).toBe(true);
      expect(result.confidence).toBe(88);
      expect(result.feedback).toContain('verified');
    });

    it('should handle verification failure', async () => {
      const mockResponse = {
        id: 'msg-123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              verified: false,
              feedback: 'Wrong product visible',
              confidence: 92,
              issues: ['Different product brand detected'],
            }),
          },
        ],
        model: 'claude-3-5-sonnet',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      };

      (bedrockClient.invokeClaude as any).mockResolvedValue(mockResponse);

      const proofBuffer = Buffer.from('proof image');

      const result = await verifyProofPhoto(
        proofBuffer,
        'image/jpeg',
        mockInstructions
      );

      expect(result.verified).toBe(false);
      expect(result.feedback).toContain('Wrong product');
      expect(result.feedback).toContain('Different product brand detected');
    });
  });
});
