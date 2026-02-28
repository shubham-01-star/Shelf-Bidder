# Vision Analysis Module

This module provides Claude 3.5 Sonnet vision analysis capabilities for the Shelf-Bidder system.

## Features

- **Shelf Space Analysis**: Identify empty spaces and current inventory from shelf photos
- **Proof Verification**: Verify task completion by comparing before/after photos
- **Confidence Scoring**: Rate analysis quality and reliability
- **Error Handling**: Comprehensive error handling with detailed error codes

## Components

### Bedrock Client (`bedrock-client.ts`)

Low-level AWS Bedrock client for Claude 3.5 Sonnet.

```typescript
import { invokeClaude, getBedrockClient } from '@/lib/vision';

const response = await invokeClaude({
  anthropic_version: 'bedrock-2023-05-31',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: [
        { type: 'image', source: imageSource },
        { type: 'text', text: 'Analyze this image' }
      ]
    }
  ]
});
```

### Shelf Analyzer (`shelf-analyzer.ts`)

Analyzes shelf photos to identify empty spaces and current inventory.

```typescript
import { analyzeShelfSpace } from '@/lib/vision';

const result = await analyzeShelfSpace(imageBuffer, 'image/jpeg');

console.log(result.emptySpaces); // Array of EmptySpace objects
console.log(result.currentInventory); // Array of Product objects
console.log(result.analysisConfidence); // 0-100 confidence score
console.log(result.processingTime); // Time in milliseconds
```

**Output Format:**

```typescript
interface ShelfAnalysisResult {
  emptySpaces: EmptySpace[];
  currentInventory: Product[];
  analysisConfidence: number;
  processingTime: number;
}
```

### Proof Verifier (`proof-verifier.ts`)

Verifies task completion by comparing before/after photos.

```typescript
import { verifyTaskCompletion, verifyProofPhoto } from '@/lib/vision';

// With before/after comparison
const result = await verifyTaskCompletion(
  beforeImageBuffer,
  'image/jpeg',
  afterImageBuffer,
  'image/jpeg',
  placementInstructions
);

// Simplified verification (proof photo only)
const result = await verifyProofPhoto(
  proofImageBuffer,
  'image/jpeg',
  placementInstructions
);

console.log(result.verified); // true/false
console.log(result.feedback); // Detailed feedback
console.log(result.confidence); // 0-100 confidence score
```

## Error Handling

The module provides custom error classes with detailed error codes:

```typescript
import { AnalysisError, VerificationError } from '@/lib/vision';

try {
  const result = await analyzeShelfSpace(imageBuffer, mimeType);
} catch (error) {
  if (error instanceof AnalysisError) {
    console.error('Analysis failed:', error.code, error.details);
  }
}
```

**Error Codes:**

- `INVALID_INPUT`: Invalid image data or parameters
- `INVALID_RESPONSE`: Unexpected response from Claude
- `PARSE_ERROR`: Failed to parse Claude's JSON response
- `ANALYSIS_FAILED`: General analysis failure
- `VERIFICATION_FAILED`: General verification failure
- `UNKNOWN_ERROR`: Unknown error occurred

## Performance

- **Target**: Analysis completes within 30 seconds (Requirement 2.2)
- **Typical**: 5-15 seconds for standard shelf photos
- **Timeout**: Configure timeout at API Gateway level (30s default)

## Configuration

Required environment variables:

```bash
NEXT_PUBLIC_AWS_REGION=us-east-1  # AWS region for Bedrock
```

The module uses Claude 3.5 Sonnet model: `anthropic.claude-3-5-sonnet-20241022-v2:0`

## Testing

Unit tests are located in `__tests__/` directory:

```bash
npm test src/lib/vision
```

Property-based tests validate:
- Property 2: Photo Analysis Performance (30s requirement)
- Property 3: Empty Space Detection Consistency

## Usage in API Routes

Example integration in Next.js API route:

```typescript
import { analyzeShelfSpace } from '@/lib/vision';
import { getObject } from '@/lib/storage';

export async function POST(request: Request) {
  const { photoUrl } = await request.json();
  
  // Download image from S3
  const imageBuffer = await getObject(photoUrl);
  
  // Analyze shelf space
  const result = await analyzeShelfSpace(imageBuffer, 'image/jpeg');
  
  return Response.json(result);
}
```

## Limitations

- Maximum image size: 20MB (S3Config.MAX_PHOTO_SIZE)
- Supported formats: JPEG, PNG, WebP
- Claude 3.5 Sonnet has token limits (4096 output tokens for analysis)
- Requires AWS Bedrock access with Claude 3.5 Sonnet enabled

## Future Enhancements

- Batch processing for multiple photos
- Caching of analysis results
- Progressive analysis for large images
- Multi-language support for feedback
