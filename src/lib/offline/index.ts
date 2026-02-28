/**
 * Offline Module Exports
 * Task 8.4: PWA offline capabilities
 */

export {
  queuePhoto,
  getQueuedPhotos,
  updateQueuedPhotoStatus,
  removeFromQueue,
  getQueueLength,
  cacheData,
  getCachedData,
  clearCache,
  type QueuedPhoto,
  type CachedItem,
} from './storage';

export {
  processQueue,
  startBackgroundSync,
  stopBackgroundSync,
  onSyncStatusChange,
  isOnline,
  type SyncStatus,
  type SyncResult,
} from './sync-manager';
