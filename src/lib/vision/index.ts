/**
 * Vision Analysis Module
 * Exports all vision-related functionality
 */

export {
  getBedrockClient,
  imageToBase64,
  getMediaType,
  type ImageSource,
  type MessageContent,
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
