/**
 * Push Notification Service
 *
 * Task 7.1: Push notification system
 * Handles morning notifications, reminders, and task alerts.
 * Requirements: 1.1, 1.3, 1.4
 */

// ============================================================================
// Types
// ============================================================================

export type NotificationType =
  | 'morning_scan'
  | 'scan_reminder'
  | 'auction_started'
  | 'auction_won'
  | 'task_assigned'
  | 'task_reminder'
  | 'payout_ready'
  | 'earnings_credited';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
  actions?: Array<{ action: string; title: string }>;
}

// ============================================================================
// Notification Templates
// ============================================================================

const TEMPLATES: Record<NotificationType, (data?: Record<string, string>) => NotificationPayload> = {
  morning_scan: () => ({
    type: 'morning_scan',
    title: '☀️ Good Morning!',
    body: 'Time to scan your shelves and start earning. Tap to open camera.',
    icon: '/icon-192x192.png',
    data: { url: '/camera' },
    actions: [{ action: 'scan', title: '📷 Scan Now' }],
  }),

  scan_reminder: () => ({
    type: 'scan_reminder',
    title: '⏰ Reminder',
    body: "You haven't scanned your shelves today. Don't miss out on earnings!",
    icon: '/icon-192x192.png',
    data: { url: '/camera' },
  }),

  auction_started: (data) => ({
    type: 'auction_started',
    title: '🏷️ Auction Started!',
    body: `Brands are bidding for your shelf space. ${data?.spaces || ''} spaces available.`,
    icon: '/icon-192x192.png',
    data: { url: '/dashboard' },
  }),

  auction_won: (data) => ({
    type: 'auction_won',
    title: '🎉 Auction Complete!',
    body: `${data?.brand || 'A brand'} won for ₹${data?.amount || '0'}. Check your task!`,
    icon: '/icon-192x192.png',
    data: { url: '/tasks' },
    actions: [{ action: 'view_task', title: '📋 View Task' }],
  }),

  task_assigned: (data) => ({
    type: 'task_assigned',
    title: '📋 New Task!',
    body: `Place ${data?.product || 'product'} on your shelf to earn ₹${data?.amount || '0'}`,
    icon: '/icon-192x192.png',
    data: { url: '/tasks' },
    actions: [{ action: 'start_task', title: '▶️ Start' }],
  }),

  task_reminder: (data) => ({
    type: 'task_reminder',
    title: '⏳ Task Expiring Soon',
    body: `Complete your ${data?.product || ''} placement before it expires!`,
    icon: '/icon-192x192.png',
    data: { url: '/tasks' },
  }),

  payout_ready: (data) => ({
    type: 'payout_ready',
    title: '💰 Payout Available!',
    body: `Your balance of ₹${data?.balance || '0'} is ready for withdrawal.`,
    icon: '/icon-192x192.png',
    data: { url: '/wallet' },
    actions: [{ action: 'payout', title: '💸 Withdraw' }],
  }),

  earnings_credited: (data) => ({
    type: 'earnings_credited',
    title: '✅ Earnings Credited!',
    body: `₹${data?.amount || '0'} added to your wallet for ${data?.product || 'task completion'}.`,
    icon: '/icon-192x192.png',
    data: { url: '/wallet' },
  }),
};

// ============================================================================
// Permission Management
// ============================================================================

/**
 * Request notification permission from the user
 */
export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Push notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Check if notifications are currently permitted
 */
export function isPermissionGranted(): boolean {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
}

// ============================================================================
// Sending Notifications
// ============================================================================

/**
 * Send a notification using a predefined template
 */
export async function sendNotification(
  type: NotificationType,
  data?: Record<string, string>
): Promise<boolean> {
  const hasPermission = await requestPermission();
  if (!hasPermission) return false;

  const template = TEMPLATES[type];
  if (!template) return false;

  const payload = template(data);

  try {
    const registration = await navigator.serviceWorker?.ready;
    if (registration) {
      await registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        data: payload.data,
        actions: payload.actions as NotificationAction[],
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        tag: type,
        renotify: true,
      });
    } else {
      // Fallback to basic notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon,
      });
    }
    return true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
}

// ============================================================================
// Scheduling
// ============================================================================

/**
 * Calculate ms until a specific hour in the user's timezone
 */
export function msUntilHour(targetHour: number, timezone = 'Asia/Kolkata'): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const currentHour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0');
  const currentMinute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0');

  let hoursUntil = targetHour - currentHour;
  if (hoursUntil < 0) hoursUntil += 24;
  if (hoursUntil === 0 && currentMinute > 0) hoursUntil = 24;

  return hoursUntil * 60 * 60 * 1000 - currentMinute * 60 * 1000;
}

/**
 * Schedule the morning notification and reminder
 * Morning: 8:00 AM, Reminder: 12:00 PM
 */
export function scheduleMorningNotifications(timezone = 'Asia/Kolkata'): () => void {
  const morningDelay = msUntilHour(8, timezone);
  const reminderDelay = msUntilHour(12, timezone);

  const morningTimer = setTimeout(() => {
    sendNotification('morning_scan');
  }, morningDelay);

  const reminderTimer = setTimeout(() => {
    sendNotification('scan_reminder');
  }, reminderDelay);

  // Return cleanup function
  return () => {
    clearTimeout(morningTimer);
    clearTimeout(reminderTimer);
  };
}
