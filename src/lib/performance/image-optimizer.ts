/**
 * Image Optimization Utilities
 *
 * Task 13.2: Optimize for low-end devices and 3G connections
 * Compress and resize images before upload for faster processing.
 * Requirements: 7.5, 8.1
 */

// ============================================================================
// Constants
// ============================================================================

const MAX_WIDTH = 1280;
const MAX_HEIGHT = 960;
const JPEG_QUALITY = 0.75;
const MAX_FILE_SIZE_KB = 500;

// ============================================================================
// Image Compression
// ============================================================================

/**
 * Compress an image file for upload
 * Resizes to max dimensions and compresses to JPEG
 */
export async function compressImage(
  file: File | Blob,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  } = {}
): Promise<Blob> {
  const { maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT, quality = JPEG_QUALITY } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate target dimensions maintaining aspect ratio
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert an image file to base64 string (compressed)
 */
export async function imageToBase64(file: File | Blob): Promise<string> {
  const compressed = await compressImage(file);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(compressed);
  });
}

/**
 * Get file size in KB
 */
export function getFileSizeKB(file: File | Blob): number {
  return Math.round(file.size / 1024);
}

/**
 * Check if image needs compression
 */
export function needsCompression(file: File | Blob): boolean {
  return getFileSizeKB(file) > MAX_FILE_SIZE_KB;
}

// ============================================================================
// Lazy Loading
// ============================================================================

/**
 * Create an IntersectionObserver for lazy loading elements
 */
export function createLazyLoader(
  callback: (entry: IntersectionObserverEntry) => void,
  options?: IntersectionObserverInit
): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback(entry);
        }
      });
    },
    {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    }
  );
}
