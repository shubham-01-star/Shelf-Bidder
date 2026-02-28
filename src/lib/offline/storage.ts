/**
 * Offline Storage Manager
 *
 * Task 8.4: PWA offline capabilities
 * Uses IndexedDB for offline data persistence and photo queue.
 * Requirements: 7.2, 7.3, 7.5
 */

const DB_NAME = 'shelf-bidder-offline';
const DB_VERSION = 1;

// Store names
const PHOTO_QUEUE = 'photo_queue';
const CACHED_DATA = 'cached_data';

export interface QueuedPhoto {
  id: string;
  shopkeeperId: string;
  imageData: string;          // base64 encoded image
  timestamp: string;
  status: 'queued' | 'uploading' | 'failed';
  retryCount: number;
}

export interface CachedItem {
  key: string;
  data: unknown;
  expiresAt: number;
  updatedAt: string;
}

// ============================================================================
// IndexedDB Initialization
// ============================================================================

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Photo queue store
      if (!db.objectStoreNames.contains(PHOTO_QUEUE)) {
        const photoStore = db.createObjectStore(PHOTO_QUEUE, { keyPath: 'id' });
        photoStore.createIndex('status', 'status', { unique: false });
        photoStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Cached data store
      if (!db.objectStoreNames.contains(CACHED_DATA)) {
        db.createObjectStore(CACHED_DATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
}

// ============================================================================
// Photo Queue Operations
// ============================================================================

/**
 * Add a photo to the offline upload queue
 */
export async function queuePhoto(photo: Omit<QueuedPhoto, 'status' | 'retryCount'>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_QUEUE, 'readwrite');
    const store = tx.objectStore(PHOTO_QUEUE);

    const queuedPhoto: QueuedPhoto = {
      ...photo,
      status: 'queued',
      retryCount: 0,
    };

    const request = store.add(queuedPhoto);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to queue photo'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Get all queued photos (for sync)
 */
export async function getQueuedPhotos(): Promise<QueuedPhoto[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_QUEUE, 'readonly');
    const store = tx.objectStore(PHOTO_QUEUE);
    const index = store.index('status');
    const request = index.getAll('queued');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get queued photos'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Update photo queue status
 */
export async function updateQueuedPhotoStatus(
  id: string,
  status: QueuedPhoto['status']
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_QUEUE, 'readwrite');
    const store = tx.objectStore(PHOTO_QUEUE);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const photo = getReq.result;
      if (photo) {
        photo.status = status;
        if (status === 'failed') photo.retryCount += 1;
        store.put(photo);
      }
      resolve();
    };
    getReq.onerror = () => reject(new Error('Failed to update photo'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Remove a photo from the queue (after successful upload)
 */
export async function removeFromQueue(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_QUEUE, 'readwrite');
    const store = tx.objectStore(PHOTO_QUEUE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to remove from queue'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Get count of items in queue
 */
export async function getQueueLength(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PHOTO_QUEUE, 'readonly');
    const store = tx.objectStore(PHOTO_QUEUE);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to count queue'));
    tx.oncomplete = () => db.close();
  });
}

// ============================================================================
// Cache Operations (for offline data)
// ============================================================================

/**
 * Cache data for offline access (e.g., dashboard data, task list)
 */
export async function cacheData(key: string, data: unknown, ttlMs = 3600000): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHED_DATA, 'readwrite');
    const store = tx.objectStore(CACHED_DATA);

    const item: CachedItem = {
      key,
      data,
      expiresAt: Date.now() + ttlMs,
      updatedAt: new Date().toISOString(),
    };

    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to cache data'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Get cached data (returns null if expired or not found)
 */
export async function getCachedData<T = unknown>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHED_DATA, 'readonly');
    const store = tx.objectStore(CACHED_DATA);
    const request = store.get(key);

    request.onsuccess = () => {
      const item = request.result as CachedItem | undefined;
      if (!item || Date.now() > item.expiresAt) {
        resolve(null);
      } else {
        resolve(item.data as T);
      }
    };
    request.onerror = () => reject(new Error('Failed to get cached data'));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Clear all cached data
 */
export async function clearCache(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHED_DATA, 'readwrite');
    const store = tx.objectStore(CACHED_DATA);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear cache'));
    tx.oncomplete = () => db.close();
  });
}
