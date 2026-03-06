/**
 * Proof Verification System using Amazon Nova Lite Vision
 * Verifies task completion by comparing before/after photos
 */

import { PlacementInstructions, VerificationResult } from '@/types/models';
import {
  invokeNova,
  getMediaType,
  ImageSource,
  MessageContent,
} from './bedrock-client';

/**
 * Raw verification result from Claude
 */
interface RawVerificationResult {
  verified: boolean;
  feedback: string;
  confidence: number;
  issues?: string[];
  reasoning?: string;
}

/**
 * Error thrown when verification fails
 */
export class VerificationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'VerificationError';
  }
}

/**
 * Build verification prompt from placement instructions
 */
function buildVerificationPrompt(
  instructions: PlacementInstructions
): string {
  const positioningRules = instructions.positioningRules
    .map((rule, i) => `${i + 1}. ${rule}`)
    .join('\n');

  const visualRequirements = instructions.visualRequirements
    .map((req, i) => `${i + 1}. ${req}`)
    .join('\n');

  return `You are verifying that a shopkeeper correctly completed a product placement task.

TASK DETAILS:
Product: ${instructions.productName}
Brand: ${instructions.brandName}
Target Location: Shelf level ${instructions.targetLocation.shelfLevel}, coordinates (${instructions.targetLocation.coordinates.x}, ${instructions.targetLocation.coordinates.y})

POSITIONING RULES:
${positioningRules}

VISUAL REQUIREMENTS:
${visualRequirements}

You will see TWO images:
1. BEFORE: The empty shelf space where the product should be placed
2. AFTER: The current state showing the placed product

Your task:
1. Verify the product is correctly placed in the target location
2. Check all positioning rules are followed
3. Verify all visual requirements are met
4. Provide specific feedback on any issues found
5. Rate your verification confidence (0-100%)

Return ONLY valid JSON in this exact format:
{
  "verified": true,
  "feedback": "Product correctly placed. All requirements met.",
  "confidence": 95,
  "issues": [],
  "reasoning": "Brief explanation of verification decision"
}

If verification fails, set verified to false and list specific issues in the issues array.
Be strict but fair in your assessment.`;
}

/**
 * Verify task completion with before/after photos
 */
export async function verifyTaskCompletion(
  beforeImage: Buffer,
  beforeMimeType: string,
  afterImage: Buffer,
  afterMimeType: string,
  instructions: PlacementInstructions
): Promise<VerificationResult> {
  try {
    // Validate inputs
    if (!beforeImage || beforeImage.length === 0) {
      throw new VerificationError(
        'Invalid before image data',
        'INVALID_INPUT',
        { reason: 'Empty before image buffer' }
      );
    }

    if (!afterImage || afterImage.length === 0) {
      throw new VerificationError(
        'Invalid after image data',
        'INVALID_INPUT',
        { reason: 'Empty after image buffer' }
      );
    }

    // Prepare images for Claude
    const beforeBase64 = beforeImage.toString('base64');
    const afterBase64 = afterImage.toString('base64');

    const beforeSource: ImageSource = {
      type: 'base64',
      media_type: getMediaType(beforeMimeType),
      data: beforeBase64,
    };

    const afterSource: ImageSource = {
      type: 'base64',
      media_type: getMediaType(afterMimeType),
      data: afterBase64,
    };

    const prompt = buildVerificationPrompt(instructions);

    const messageContent: MessageContent[] = [
      {
        type: 'text',
        text: 'BEFORE IMAGE (empty shelf space):',
      },
      {
        type: 'image',
        source: beforeSource,
      },
      {
        type: 'text',
        text: 'AFTER IMAGE (with placed product):',
      },
      {
        type: 'image',
        source: afterSource,
      },
      {
        type: 'text',
        text: prompt,
      },
    ];

    // Invoke Amazon Nova Lite
    const response = await invokeNova({
      messages: [{ role: 'user', content: messageContent }],
      maxTokens: 2048,
      temperature: 0.1,
    });

    // Parse Nova response
    const textContent = response.output?.message?.content?.[0]?.text;
    if (!textContent) {
      throw new VerificationError(
        'No text content in response',
        'INVALID_RESPONSE',
        { response }
      );
    }

    const rawResult = parseVerificationResponse(textContent);
    return transformVerificationResult(rawResult);
  } catch (error) {
    if (error instanceof VerificationError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new VerificationError(
        `Verification failed: ${error.message}`,
        'VERIFICATION_FAILED',
        { originalError: error.message }
      );
    }

    throw new VerificationError(
      'Verification failed with unknown error',
      'UNKNOWN_ERROR',
      { error }
    );
  }
}

/**
 * Parse Claude's verification response
 */
function parseVerificationResponse(
  responseText: string
): RawVerificationResult {
  try {
    // Extract JSON from response
    let jsonText = responseText.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    // Validate required fields
    if (typeof parsed.verified !== 'boolean') {
      throw new Error('Missing or invalid verified field');
    }

    if (typeof parsed.feedback !== 'string') {
      throw new Error('Missing or invalid feedback field');
    }

    if (typeof parsed.confidence !== 'number') {
      throw new Error('Missing or invalid confidence field');
    }

    return parsed as RawVerificationResult;
  } catch (error) {
    if (error instanceof Error) {
      throw new VerificationError(
        `Failed to parse verification response: ${error.message}`,
        'PARSE_ERROR',
        { responseText, error: error.message }
      );
    }
    throw new VerificationError(
      'Failed to parse verification response',
      'PARSE_ERROR',
      { responseText }
    );
  }
}

/**
 * Transform raw verification result to typed model
 */
function transformVerificationResult(
  raw: RawVerificationResult
): VerificationResult {
  // Build comprehensive feedback
  let feedback = raw.feedback.trim();

  if (raw.issues && raw.issues.length > 0) {
    feedback += '\n\nIssues found:\n';
    feedback += raw.issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n');
  }

  // Clamp confidence to 0-100
  const confidence = Math.max(0, Math.min(100, raw.confidence));

  return {
    verified: raw.verified,
    feedback,
    confidence,
  };
}

/**
 * Verify proof photo without before image (simplified verification)
 */
export async function verifyProofPhoto(
  proofImage: Buffer,
  proofMimeType: string,
  instructions: PlacementInstructions
): Promise<VerificationResult> {
  try {
    // Validate input
    if (!proofImage || proofImage.length === 0) {
      throw new VerificationError(
        'Invalid proof image data',
        'INVALID_INPUT',
        { reason: 'Empty proof image buffer' }
      );
    }

    // Prepare image for Claude
    const base64Image = proofImage.toString('base64');
    const imageSource: ImageSource = {
      type: 'base64',
      media_type: getMediaType(proofMimeType),
      data: base64Image,
    };

    const positioningRules = instructions.positioningRules
      .map((rule, i) => `${i + 1}. ${rule}`)
      .join('\n');

    const visualRequirements = instructions.visualRequirements
      .map((req, i) => `${i + 1}. ${req}`)
      .join('\n');

    const prompt = `Verify that this photo shows correct product placement.

EXPECTED:
Product: ${instructions.productName}
Brand: ${instructions.brandName}

POSITIONING RULES:
${positioningRules}

VISUAL REQUIREMENTS:
${visualRequirements}

Check if:
1. The correct product is visible
2. Positioning rules are followed
3. Visual requirements are met

Return ONLY valid JSON:
{
  "verified": true,
  "feedback": "Detailed feedback",
  "confidence": 85,
  "issues": []
}`;

    const messageContent: MessageContent[] = [
      {
        type: 'image',
        source: imageSource,
      },
      {
        type: 'text',
        text: prompt,
      },
    ];

    // Invoke Amazon Nova Lite
    const response = await invokeNova({
      messages: [{ role: 'user', content: messageContent }],
      maxTokens: 2048,
      temperature: 0.1,
    });

    // Parse Nova response
    const textContent = response.output?.message?.content?.[0]?.text;
    if (!textContent) {
      throw new VerificationError(
        'No text content in response',
        'INVALID_RESPONSE',
        { response }
      );
    }

    const rawResult = parseVerificationResponse(textContent);
    return transformVerificationResult(rawResult);
  } catch (error) {
    if (error instanceof VerificationError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new VerificationError(
        `Verification failed: ${error.message}`,
        'VERIFICATION_FAILED',
        { originalError: error.message }
      );
    }

    throw new VerificationError(
      'Verification failed with unknown error',
      'UNKNOWN_ERROR',
      { error }
    );
  }
}
