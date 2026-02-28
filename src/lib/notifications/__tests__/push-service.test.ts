/**
 * Unit tests for Push Notification Service
 * Task 7.5: Unit tests for notification systems
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  msUntilHour,
  isPermissionGranted,
  requestPermission,
  scheduleMorningNotifications,
} from '../push-service';

// ============================================================================
// Browser API Mocks — must set Notification on global.window since source
// checks `'Notification' in window`
// ============================================================================

const mockRequestPermission = jest.fn<() => Promise<NotificationPermission>>();

function setupNotification(permission: NotificationPermission) {
  const NotificationMock = {
    permission,
    requestPermission: mockRequestPermission,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Notification = NotificationMock;
  // Source code checks 'Notification' in window, so must set on window too
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).window = (global as any).window || {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).window.Notification = NotificationMock;
}

function removeNotification() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (global as any).Notification;
  if (typeof (global as any).window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (global as any).window.Notification;
  }
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  // Ensure window exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).window = (global as any).window || {};
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  removeNotification();
});

// ============================================================================
// msUntilHour Tests
// ============================================================================

describe('msUntilHour', () => {
  it('should return a positive number of milliseconds', () => {
    const result = msUntilHour(8, 'Asia/Kolkata');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it('should return less than 24 hours for any target hour', () => {
    for (let hour = 0; hour < 24; hour++) {
      const result = msUntilHour(hour, 'UTC');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    }
  });

  it('should work with different timezones', () => {
    const kolkata = msUntilHour(8, 'Asia/Kolkata');
    const utc = msUntilHour(8, 'UTC');
    expect(typeof kolkata).toBe('number');
    expect(typeof utc).toBe('number');
  });
});

// ============================================================================
// isPermissionGranted Tests
// ============================================================================

describe('isPermissionGranted', () => {
  it('should return true when permission is granted', () => {
    setupNotification('granted');
    expect(isPermissionGranted()).toBe(true);
  });

  it('should return false when permission is denied', () => {
    setupNotification('denied');
    expect(isPermissionGranted()).toBe(false);
  });

  it('should return false when permission is default', () => {
    setupNotification('default');
    expect(isPermissionGranted()).toBe(false);
  });

  it('should return false when Notification API is not available', () => {
    removeNotification();
    expect(isPermissionGranted()).toBe(false);
  });
});

// ============================================================================
// requestPermission Tests
// ============================================================================

describe('requestPermission', () => {
  it('should return false when Notification API is not in window', async () => {
    removeNotification();
    const result = await requestPermission();
    expect(result).toBe(false);
  });

  it('should return true when permission is already granted', async () => {
    setupNotification('granted');
    const result = await requestPermission();
    expect(result).toBe(true);
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('should return false when permission is denied', async () => {
    setupNotification('denied');
    const result = await requestPermission();
    expect(result).toBe(false);
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('should prompt and return true on grant', async () => {
    setupNotification('default');
    mockRequestPermission.mockResolvedValueOnce('granted');
    const result = await requestPermission();
    expect(result).toBe(true);
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('should prompt and return false on deny', async () => {
    setupNotification('default');
    mockRequestPermission.mockResolvedValueOnce('denied');
    const result = await requestPermission();
    expect(result).toBe(false);
  });
});

// ============================================================================
// scheduleMorningNotifications Tests
// ============================================================================

describe('scheduleMorningNotifications', () => {
  it('should return a cleanup function', () => {
    const cleanup = scheduleMorningNotifications('Asia/Kolkata');
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('should set two timers (morning + reminder)', () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
    const cleanup = scheduleMorningNotifications('Asia/Kolkata');
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    cleanup();
    setTimeoutSpy.mockRestore();
  });

  it('cleanup should clear both timers', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const cleanup = scheduleMorningNotifications('Asia/Kolkata');
    cleanup();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
    clearTimeoutSpy.mockRestore();
  });
});
