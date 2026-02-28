/**
 * Unit tests for Voice Notification Service
 * Task 7.5: Unit tests for notification systems
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// ============================================================================
// Mocks
// ============================================================================

const mockSend = jest.fn<(...args: unknown[]) => Promise<unknown>>();

jest.mock('@aws-sdk/client-connect', () => ({
  ConnectClient: jest.fn().mockImplementation(() => ({
    send: (...args: unknown[]) => mockSend(...args),
  })),
  StartOutboundVoiceContactCommand: jest.fn().mockImplementation((input: unknown) => input),
}));

import {
  initiateVoiceCall,
  generateVoiceMessage,
  type VoiceCallRequest,
  type VoiceMessage,
} from '../voice-service';

// ============================================================================
// Test Data
// ============================================================================

const createMockRequest = (overrides?: Partial<VoiceCallRequest>): VoiceCallRequest => ({
  shopkeeperId: 'shop-123',
  phoneNumber: '+919876543210',
  language: 'hi',
  message: {
    type: 'auction_winner',
    productName: 'Pepsi 500ml',
    brandName: 'PepsiCo',
    earnings: 150,
  },
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('generateVoiceMessage', () => {
  const message: VoiceMessage = {
    type: 'auction_winner',
    productName: 'Coca-Cola 500ml',
    brandName: 'Coca-Cola',
    earnings: 200,
  };

  it('should generate Hindi message with brand details', () => {
    const result = generateVoiceMessage(message, 'hi');

    expect(result).toContain('Namaste');
    expect(result).toContain('Coca-Cola');
    expect(result).toContain('200');
  });

  it('should generate English message with brand details', () => {
    const result = generateVoiceMessage(message, 'en');

    expect(result).toContain('Hello');
    expect(result).toContain('Coca-Cola');
    expect(result).toContain('200');
  });

  it('should default to English when no language specified', () => {
    const result = generateVoiceMessage(message);

    expect(result).toContain('Hello');
  });

  it('should include product name in message', () => {
    const result = generateVoiceMessage(message, 'en');

    expect(result).toContain('Coca-Cola 500ml');
  });
});

describe('initiateVoiceCall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use hackathon fallback when env vars are missing', async () => {
    // Default env: no CONNECT_INSTANCE_ID, etc.
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const request = createMockRequest();
    const result = await initiateVoiceCall(request);

    expect(result.success).toBe(true);
    expect(result.callId).toContain('mock-contact-');
    expect(result.fallbackUsed).toBe(false);

    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should include phone number in fallback log', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const request = createMockRequest({ phoneNumber: '+911234567890' });
    await initiateVoiceCall(request);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('+911234567890')
    );

    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('should include earnings in fallback message', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const request = createMockRequest();
    request.message.earnings = 250;
    await initiateVoiceCall(request);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('250')
    );

    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
