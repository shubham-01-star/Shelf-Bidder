/**
 * Client-side Photo Upload Utilities
 * Handles photo upload from browser to S3 via presigned URLs
 */

/**
 * Upload result interface
 */
export interface UploadResult {
  success: boolean;
  photoKey: string;
  photoUrl: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
  error?: string;
}

/**
 * Upload progress callback
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Upload a photo file to S3 using presigned URL
 * @param file - File object to upload
 * @param shopkeeperId - Shopkeeper ID
 * @param photoType - Type of photo (shelf or proof)
 * @param onProgress - Optional progress callback
 * @returns Upload result with photo URL and metadata
 */
export async function uploadPhoto(
  file: File,
  shopkeeperId: string,
  photoType: 'shelf' | 'proof',
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  try {
    // Step 1: Request presigned URL from API
    const urlResponse = await fetch('/api/photos/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shopkeeperId,
        photoType,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      }),
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.json();
      throw new Error(error.details || 'Failed to get upload URL');
    }

    const { data } = await urlResponse.json();
    const { uploadUrl, photoKey, photoUrl } = data;

    // Step 2: Upload file to S3 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload photo to S3');
    }

    // Report progress
    if (onProgress) {
      onProgress(100);
    }

    // Step 3: Process photo (extract metadata, compress)
    const imageData = await fileToBase64(file);
    const deviceInfo = getDeviceInfo();

    const processResponse = await fetch('/api/photos/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shopkeeperId,
        photoType,
        s3Key: photoKey,
        s3Url: photoUrl,
        imageData,
        deviceInfo,
      }),
    });

    if (!processResponse.ok) {
      // Photo uploaded but processing failed - still return success
      console.warn('Photo processing failed, but upload succeeded');
      return {
        success: true,
        photoKey,
        photoUrl,
      };
    }

    const { data: processData } = await processResponse.json();

    return {
      success: true,
      photoKey,
      photoUrl,
      metadata: {
        width: processData.metadata.width,
        height: processData.metadata.height,
        format: processData.metadata.format,
        size: processData.metadata.fileSize,
      },
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      photoKey: '',
      photoUrl: '',
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Convert File to base64 string
 * @param file - File object
 * @returns Base64 encoded string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Get device information for metadata
 * @returns Device information object
 */
function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
  };
}

/**
 * Validate file before upload
 * @param file - File to validate
 * @returns Validation result
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const MAX_SIZE = 20 * 1024 * 1024; // 20MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Compress image on client side before upload (for low bandwidth)
 * @param file - Original file
 * @param maxWidth - Maximum width
 * @param maxHeight - Maximum height
 * @param quality - Compression quality (0-1)
 * @returns Compressed file
 */
export async function compressImageClient(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
