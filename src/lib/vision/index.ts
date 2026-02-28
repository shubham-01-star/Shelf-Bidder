/**
 * Vision Analysis Module
 * Exports all vision-related functionality
 */

export {
  getBedrockClient,
  invokeClaude,
  imageToBase64,
  getMediaType,
  type ImageSource,
  type MessageContent,
  type ClaudeRequest,
  type ClaudeResponse,
} from './bedrock-client';

export {
  analyzeShelfSpace,
  calculateConfidenceScore,
  AnalysisError,
  type ShelfAnalysisResult,
  type RawAnalysisResult,
} from './shelf-analyzer';

export {
  verifyTaskCompletion,
  verifyProofPhoto,
  VerificationError,
} from './proof-verifier';
