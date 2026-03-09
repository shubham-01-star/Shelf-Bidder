/**
 * Image Compression and Optimization
 * Handles image processing for low-bandwidth scenarios
 */

import sharp from 'sharp';

/**
 * Compression quality levels
 */
export enum CompressionQuality {
  HIGH = 90,
  MEDIUM = 75,
  LOW = 60,
}

/**
 * Image dimensions for different use cases
 */
export interface ImageDimensions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Compression options
 */
export interface CompressionOptions {
  quality?: CompressionQuality;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
  progressive?: boolean;
}

/**
 * Compress and optimize an image buffer
 * @param imageBuffer - Original image buffer
 * @param options - Compression options
 * @returns Compressed image buffer
 */
export async function compressImage(
  imageBuffer: Buffer,
  options: CompressionOptions = {}
): Promise<Buffer> {
  const {
    quality = CompressionQuality.MEDIUM,
    maxWidth = 1920,
    maxHeight = 1080,
    format = 'jpeg',
    progressive = true,
  } = options;

  let pipeline = sharp(imageBuffer);

  // Resize if dimensions exceed maximum
  pipeline = pipeline.resize(maxWidth, maxHeight, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Apply format-specific compression
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({
        quality,
        progressive,
        mozjpeg: true, // Use mozjpeg for better compression
      });
      break;
    case 'png':
      pipeline = pipeline.png({
        quality,
        progressive,
        compressionLevel: 9,
      });
      break;
    case 'webp':
      pipeline = pipeline.webp({
        quality,
        effort: 6, // Higher effort for better compression
      });
      break;
  }

  return await pipeline.toBuffer();
}

/**
 * Generate multiple image variants for different use cases
 * @param imageBuffer - Original image buffer
 * @returns Object with different image variants
 */
export async function generateImageVariants(imageBuffer: Buffer): Promise<{
  original: Buffer;
  compressed: Buffer;
  thumbnail: Buffer;
  lowBandwidth: Buffer;
}> {
  const [compressed, thumbnail, lowBandwidth] = await Promise.all([
    // Compressed version for standard viewing
    compressImage(imageBuffer, {
      quality: CompressionQuality.HIGH,
      maxWidth: 1920,
      maxHeight: 1080,
      format: 'jpeg',
    }),
    // Thumbnail for previews
    compressImage(imageBuffer, {
      quality: CompressionQuality.MEDIUM,
      maxWidth: 400,
      maxHeight: 300,
      format: 'jpeg',
    }),
    // Low bandwidth version for 3G connections
    compressImage(imageBuffer, {
      quality: CompressionQuality.LOW,
      maxWidth: 800,
      maxHeight: 600,
      format: 'webp',
    }),
  ]);

  return {
    original: imageBuffer,
    compressed,
    thumbnail,
    lowBandwidth,
  };
}

/**
 * Extract image metadata
 * @param imageBuffer - Image buffer
 * @returns Image metadata including dimensions, format, and size
 */
export async function extractImageMetadata(imageBuffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  orientation?: number;
}> {
  const metadata = await sharp(imageBuffer).metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: imageBuffer.length,
    hasAlpha: metadata.hasAlpha || false,
    orientation: metadata.orientation,
  };
}

/**
 * Optimize image for web delivery
 * Automatically selects best format and compression based on image characteristics
 * @param imageBuffer - Original image buffer
 * @returns Optimized image buffer and recommended format
 */
export async function optimizeForWeb(imageBuffer: Buffer): Promise<{
  buffer: Buffer;
  format: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
}> {
  const metadata = await extractImageMetadata(imageBuffer);
  const originalSize = imageBuffer.length;

  // Choose format based on image characteristics
  const format = metadata.hasAlpha ? 'png' : 'webp';

  // Compress with appropriate settings
  const optimized = await compressImage(imageBuffer, {
    quality: CompressionQuality.HIGH,
    maxWidth: 1920,
    maxHeight: 1080,
    format: format === 'png' ? 'png' : 'webp',
  });

  const optimizedSize = optimized.length;
  const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

  return {
    buffer: optimized,
    format,
    originalSize,
    optimizedSize,
    compressionRatio,
  };
}

/**
 * Convert image to base64 data URL
 * @param imageBuffer - Image buffer
 * @param mimeType - MIME type of the image
 * @returns Base64 data URL
 */
export function toBase64DataUrl(imageBuffer: Buffer, mimeType: string): string {
  const base64 = imageBuffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Convert base64 data URL to buffer
 * @param dataUrl - Base64 data URL
 * @returns Image buffer
 */
export function fromBase64DataUrl(dataUrl: string): Buffer {
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}
