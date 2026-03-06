/**
 * Shelf Space Analysis using Amazon Nova Lite Vision
 * Analyzes shelf photos to identify empty spaces and current inventory
 */

import { EmptySpace, Product, Visibility, Accessibility } from '@/types/models';
import {
  invokeNova,
  getMediaType,
  ImageSource,
  MessageContent,
} from './bedrock-client';

/**
 * Raw analysis result from Claude
 */
export interface RawAnalysisResult {
  emptySpaces: Array<{
    id: string;
    coordinates: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    shelfLevel: number;
    locationDescription: string;
    visibility: string;
    accessibility: string;
  }>;
  currentInventory: Array<{
    name: string;
    brand: string;
    category: string;
  }>;
  confidence: number;
  reasoning?: string;
}

/**
 * Result of shelf space analysis
 */
export interface ShelfAnalysisResult {
  emptySpaces: Array<EmptySpace & { locationDescription?: string }>;
  currentInventory: Product[];
  analysisConfidence: number;
  processingTime: number;
}

/**
 * Error thrown when analysis fails
 */
export class AnalysisError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AnalysisError';
  }
}

/**
 * Vision analysis prompt template
 */
const ANALYSIS_PROMPT = `Analyze this retail shelf photo and provide detailed information about empty spaces and current inventory.

Your task:
1. Identify all empty shelf areas with precise pixel coordinates (x, y, width, height)
2. List visible products with brand names and categories (MAXIMUM 30 ITEMS TOTAL limit to avoid overly long responses)
3. Determine optimal placement zones for new products
4. Rate your analysis confidence (0-100%)

For empty spaces (LOOK VERY CAREFULLY for gaps between products or empty shelf sections), provide:
- Unique ID (e.g., "space-1", "space-2")
- Pixel coordinates: x (left), y (top), width, height
- Shelf level: 1 (bottom) to 5 (top)
- locationDescription: A short plain-English description of where this empty space is (e.g., "Between the blue Lays packets and green Maggi packets on the middle shelf")
- Visibility: "high" (eye level), "medium" (above/below eye level), "low" (very high/low)
- Accessibility: "easy" (front, unobstructed), "moderate" (partially blocked), "difficult" (back, hard to reach)

For products, provide:
- Product name
- Brand name
- Category (e.g., "beverages", "snacks", "household")

Return ONLY valid JSON in this exact format:
{
  "emptySpaces": [
    {
      "id": "space-1",
      "coordinates": { "x": 100, "y": 200, "width": 150, "height": 200 },
      "shelfLevel": 2,
      "locationDescription": "Between the red boxes and blue cans on the second shelf from bottom",
      "visibility": "high",
      "accessibility": "easy"
    }
  ],
  "currentInventory": [
    {
      "name": "Product Name",
      "brand": "Brand Name",
      "category": "category"
    }
  ],
  "confidence": 85,
  "reasoning": "Brief explanation of analysis"
}

If no empty spaces are found, return an empty array for emptySpaces.
If no products are visible, return an empty array for currentInventory.`;

/**
 * Analyze shelf photo for empty spaces and inventory
 */
export async function analyzeShelfSpace(
  imageData: Buffer,
  mimeType: string
): Promise<ShelfAnalysisResult> {
  const startTime = Date.now();

  try {
    // Validate input
    if (!imageData || imageData.length === 0) {
      throw new AnalysisError(
        'Invalid image data',
        'INVALID_INPUT',
        { reason: 'Empty image buffer' }
      );
    }

    // Prepare image for Claude
    const base64Image = imageData.toString('base64');
    const mediaType = getMediaType(mimeType);

    const imageSource: ImageSource = {
      type: 'base64',
      media_type: mediaType,
      data: base64Image,
    };

    const messageContent: MessageContent[] = [
      {
        type: 'image',
        source: imageSource,
      },
      {
        type: 'text',
        text: ANALYSIS_PROMPT,
      },
    ];

    // Invoke Amazon Nova Lite
    const response = await invokeNova({
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
      maxTokens: 4096,
      temperature: 0.1,
    });

    // Parse Nova response (output.message.content[0].text)
    const textContent = response.output?.message?.content?.[0]?.text;
    if (!textContent) {
      throw new AnalysisError(
        'No text content in response',
        'INVALID_RESPONSE',
        { response }
      );
    }

    const rawResult = parseAnalysisResponse(textContent);
    const result = transformAnalysisResult(rawResult);

    const processingTime = Date.now() - startTime;

    return {
      ...result,
      processingTime,
    };
  } catch (error) {
    if (error instanceof AnalysisError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new AnalysisError(
        `Analysis failed: ${error.message}`,
        'ANALYSIS_FAILED',
        { originalError: error.message }
      );
    }

    throw new AnalysisError(
      'Analysis failed with unknown error',
      'UNKNOWN_ERROR',
      { error }
    );
  }
}

/**
 * Parse Claude's JSON response
 */
function parseAnalysisResponse(responseText: string): RawAnalysisResult {
  try {
    // Extract JSON from response (Claude might include markdown code blocks)
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (!parsed.emptySpaces || !Array.isArray(parsed.emptySpaces)) {
      throw new Error('Missing or invalid emptySpaces array');
    }

    if (!parsed.currentInventory || !Array.isArray(parsed.currentInventory)) {
      throw new Error('Missing or invalid currentInventory array');
    }

    if (typeof parsed.confidence !== 'number') {
      throw new Error('Missing or invalid confidence score');
    }

    return parsed as RawAnalysisResult;
  } catch (error) {
    if (error instanceof Error) {
      throw new AnalysisError(
        `Failed to parse analysis response: ${error.message}`,
        'PARSE_ERROR',
        { responseText, error: error.message }
      );
    }
    throw new AnalysisError(
      'Failed to parse analysis response',
      'PARSE_ERROR',
      { responseText }
    );
  }
}

/**
 * Transform raw analysis result to typed model
 */
function transformAnalysisResult(
  raw: RawAnalysisResult
): Omit<ShelfAnalysisResult, 'processingTime'> {
  // Validate and transform empty spaces
  const emptySpaces: EmptySpace[] = raw.emptySpaces.map((space) => {
    // Validate visibility
    const visibility = normalizeVisibility(space.visibility);
    const accessibility = normalizeAccessibility(space.accessibility);

    return {
      id: space.id,
      coordinates: {
        x: Math.max(0, Math.round(space.coordinates.x)),
        y: Math.max(0, Math.round(space.coordinates.y)),
        width: Math.max(1, Math.round(space.coordinates.width)),
        height: Math.max(1, Math.round(space.coordinates.height)),
      },
      shelfLevel: Math.max(1, Math.min(5, space.shelfLevel)),
      locationDescription: space.locationDescription || "Unknown location",
      visibility,
      accessibility,
    };
  });

  // Transform inventory
  const currentInventory: Product[] = raw.currentInventory.map((product) => ({
    name: product.name.trim(),
    brand: product.brand.trim(),
    category: product.category.trim().toLowerCase(),
  }));

  // Clamp confidence to 0-100
  const analysisConfidence = Math.max(0, Math.min(100, raw.confidence));

  return {
    emptySpaces,
    currentInventory,
    analysisConfidence,
  };
}

/**
 * Normalize visibility string to valid type
 */
function normalizeVisibility(value: string): Visibility {
  const normalized = value.toLowerCase().trim();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') {
    return normalized;
  }
  // Default to medium if invalid
  return 'medium';
}

/**
 * Normalize accessibility string to valid type
 */
function normalizeAccessibility(value: string): Accessibility {
  const normalized = value.toLowerCase().trim();
  if (
    normalized === 'easy' ||
    normalized === 'moderate' ||
    normalized === 'difficult'
  ) {
    return normalized;
  }
  // Default to moderate if invalid
  return 'moderate';
}

/**
 * Calculate confidence score based on analysis quality
 */
export function calculateConfidenceScore(result: ShelfAnalysisResult): number {
  let score = result.analysisConfidence;

  // Reduce confidence if processing took too long (>25 seconds)
  if (result.processingTime > 25000) {
    score = Math.max(0, score - 10);
  }

  // Reduce confidence if no empty spaces found (might be analysis failure)
  if (result.emptySpaces.length === 0 && result.currentInventory.length === 0) {
    score = Math.max(0, score - 20);
  }

  return Math.round(score);
}
