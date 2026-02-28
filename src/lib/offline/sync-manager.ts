/**
 * Background Sync Manager
 *
 * Task 8.4: PWA offline capabilities
 * Syncs queued photos when connection is restored.
 * Requirements: 7.3
 */

import {
  getQueuedPhotos,
  updateQueuedPhotoStatus,
  removeFromQueue,
  type QueuedPhoto,
} from './storage';

const MAX_RETRIES = 3;
const SYNC_INTERVAL_MS = 30_000; // 30 seconds

// ============================================================================
// Types
// ============================================================================

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export interface SyncResult {
  synced: number;
  failed: number;
  remaining: number;
}

type SyncListener = (status: SyncStatus, result?: SyncResult) => void;

// ============================================================================
// Sync Manager
// ============================================================================

let syncTimer: ReturnType<typeof setInterval> | null = null;
const listeners: Set<SyncListener> = new Set();

/**
 * Register a listener for sync status changes
 */
export function onSyncStatusChange(listener: SyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(status: SyncStatus, result?: SyncResult) {
  listeners.forEach((l) => l(status, result));
}

/**
 * Process the photo upload queue
 */
export async function processQueue(): Promise<SyncResult> {
  if (!navigator.onLine) {
    notifyListeners('offline');
    return { synced: 0, failed: 0, remaining: 0 };
  }

  notifyListeners('syncing');

  const photos = await getQueuedPhotos();
  let synced = 0;
  let failed = 0;

  for (const photo of photos) {
    try {
      await uploadPhoto(photo);
      await removeFromQueue(photo.id);
      synced++;
    } catch {
      if (photo.retryCount >= MAX_RETRIES) {
        await updateQueuedPhotoStatus(photo.id, 'failed');
      } else {
        await updateQueuedPhotoStatus(photo.id, 'queued');
      }
      failed++;
    }
  }

  const remaining = photos.length - synced;
  const status: SyncStatus = failed > 0 ? 'error' : 'idle';
  const result = { synced, failed, remaining };

  notifyListeners(status, result);
  return result;
}

/**
 * Upload a single photo to the server
 */
async function uploadPhoto(photo: QueuedPhoto): Promise<void> {
  await updateQueuedPhotoStatus(photo.id, 'uploading');

  const response = await fetch('/api/photos/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shopkeeperId: photo.shopkeeperId,
      imageData: photo.imageData,
    }),
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}

/**
 * Start automatic background sync
 */
export function startBackgroundSync(): void {
  if (syncTimer) return;

  // Sync immediately on startup
  processQueue().catch(console.error);

  // Periodic sync
  syncTimer = setInterval(() => {
    processQueue().catch(console.error);
  }, SYNC_INTERVAL_MS);

  // Sync when coming back online
  window.addEventListener('online', () => {
    processQueue().catch(console.error);
  });
}

/**
 * Stop background sync
 */
export function stopBackgroundSync(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

/**
 * Check if currently online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}
