/**
 * AWS Bedrock Client for Amazon Nova Lite
 * Amazon Nova - Amazon's own vision model, NO Marketplace subscription required
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

// Amazon Nova Lite - Amazon's own model, no AWS Marketplace needed
// Supports vision (images), fast & cheap
const NOVA_MODEL_ID =
  process.env.BEDROCK_MODEL_ID || 'amazon.nova-lite-v1:0';

const AWS_REGION =
  process.env.BEDROCK_REGION ||
  process.env.NEXT_PUBLIC_AWS_REGION ||
  'us-east-1';

console.log('[Bedrock Client] 🤖 Model ID:', NOVA_MODEL_ID);
console.log('[Bedrock Client] 🌍 Region:', AWS_REGION);

let bedrockClient: BedrockRuntimeClient | null = null;

export function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({ region: AWS_REGION });
  }
  return bedrockClient;
}

// ─── Nova Request / Response Types ───────────────────────────────────────────

export interface ImageSource {
  type: 'base64';
  media_type: 'image/jpeg' | 'image/png' | 'image/webp';
  data: string;
}

/** Content block for Nova messages */
export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: ImageSource };

/** Nova request body (messages-v1 schema) */
export interface NovaRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: NovaContentBlock[];
  }>;
  inferenceConfig?: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
  };
}

/** Nova content block — text or image */
type NovaContentBlock =
  | { text: string }
  | { image: { format: string; source: { bytes: string } } };

/** Nova response body */
export interface NovaResponse {
  output: {
    message: {
      role: string;
      content: Array<{ text: string }>;
    };
  };
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ─── Invoke Nova ─────────────────────────────────────────────────────────────

/**
 * Convert our internal MessageContent[] → Nova content blocks
 */
function toNovaContent(content: MessageContent[]): NovaContentBlock[] {
  return content.map((block) => {
    if (block.type === 'text') {
      return { text: block.text };
    }
    // image block
    return {
      image: {
        format: block.source.media_type.split('/')[1], // "jpeg" | "png" | "webp"
        source: { bytes: block.source.data },
      },
    };
  });
}

/**
 * Invoke Amazon Nova Lite with vision capabilities
 */
export async function invokeNova(params: {
  messages: Array<{ role: 'user' | 'assistant'; content: MessageContent[] }>;
  maxTokens?: number;
  temperature?: number;
}): Promise<NovaResponse> {
  const client = getBedrockClient();

  const novaBody: NovaRequest = {
    messages: params.messages.map((m) => ({
      role: m.role,
      content: toNovaContent(m.content),
    })),
    inferenceConfig: {
      maxTokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.1,
    },
  };

  const input: InvokeModelCommandInput = {
    modelId: NOVA_MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(novaBody),
  };

  try {
    const command = new InvokeModelCommand(input);
    const response = await client.send(command);

    if (!response.body) {
      throw new Error('Empty response from Bedrock');
    }

    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body)
    ) as NovaResponse;

    return responseBody;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Bedrock invocation failed: ${error.message}`);
    }
    throw new Error('Bedrock invocation failed with unknown error');
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function imageToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export function getMediaType(
  mimeType: string
): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'image/jpeg';
  if (mimeType === 'image/png') return 'image/png';
  if (mimeType === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}
