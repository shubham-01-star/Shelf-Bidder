/**
 * AWS Bedrock Client for Claude 3.5 Sonnet
 * Handles communication with AWS Bedrock for vision analysis
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

const CLAUDE_MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
const AWS_REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';

/**
 * Get or create Bedrock client instance
 */
let bedrockClient: BedrockRuntimeClient | null = null;

export function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: AWS_REGION,
    });
  }
  return bedrockClient;
}

/**
 * Image format for Claude vision API
 */
export interface ImageSource {
  type: 'base64';
  media_type: 'image/jpeg' | 'image/png' | 'image/webp';
  data: string;
}

/**
 * Message content for Claude API
 */
export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: ImageSource };

/**
 * Claude API request format
 */
export interface ClaudeRequest {
  anthropic_version: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: MessageContent[];
  }>;
  temperature?: number;
}

/**
 * Claude API response format
 */
export interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Invoke Claude 3.5 Sonnet with vision capabilities
 */
export async function invokeClaude(
  request: ClaudeRequest
): Promise<ClaudeResponse> {
  const client = getBedrockClient();

  const input: InvokeModelCommandInput = {
    modelId: CLAUDE_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(request),
  };

  try {
    const command = new InvokeModelCommand(input);
    const response = await client.send(command);

    if (!response.body) {
      throw new Error('Empty response from Bedrock');
    }

    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body)
    );

    return responseBody as ClaudeResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Bedrock invocation failed: ${error.message}`);
    }
    throw new Error('Bedrock invocation failed with unknown error');
  }
}

/**
 * Convert image buffer to base64 string
 */
export function imageToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

/**
 * Determine media type from file extension or buffer
 */
export function getMediaType(
  mimeType: string
): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return 'image/jpeg';
  }
  if (mimeType === 'image/png') {
    return 'image/png';
  }
  if (mimeType === 'image/webp') {
    return 'image/webp';
  }
  // Default to JPEG
  return 'image/jpeg';
}
