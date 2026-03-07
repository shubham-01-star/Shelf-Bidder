# AWS Bedrock Multi-Model Fallback Chain

## Overview

Task 4.2 implements a resilient multi-model fallback chain for AWS Bedrock vision analysis, ensuring continuous operation even when primary AI models fail or are rate-limited.

## Architecture

### Fallback Chain

```
Primary:   amazon.nova-pro-v1:0      (Best accuracy, highest cost)
    ↓ (1s backoff)
Secondary: amazon.nova-lite-v1:0     (Fast, cost-effective)
    ↓ (2s backoff)
Tertiary:  anthropic.claude-3-haiku-20240307-v1:0 (Final fallback)
```

### Exponential Backoff

- **1st failure**: Wait 1 second before trying Nova Lite
- **2nd failure**: Wait 2 seconds before trying Claude Haiku
- **3rd failure**: All models failed, alert operators

## Features

### 1. Multi-Model Support

The system automatically formats requests for different model types:

- **Nova models**: Use Amazon's messages-v1 schema
- **Claude models**: Use Anthropic's messages API format

### 2. Comprehensive Logging

All model invocations are logged to PostgreSQL `bedrock_usage_logs` table:

```sql
CREATE TABLE bedrock_usage_logs (
  id UUID PRIMARY KEY,
  model VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL,  -- 'success' or 'failure'
  error_message TEXT,
  request_type VARCHAR(50) NOT NULL,  -- 'analysis' or 'verification'
  shopkeeper_id UUID,
  response_time_ms INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Operator Alerting

The system monitors for consecutive failures:

- Checks last 10 Bedrock invocations within 1 hour
- Alerts operators when all 10 are failures
- Indicates critical system-wide issue requiring immediate attention

### 4. Structured Prompts

#### Shelf Analysis Prompt

Analyzes retail shelf photos to detect:
- Empty spaces with coordinates and dimensions
- Current product inventory with categories
- Placement recommendations
- Confidence scores for all detections

#### Proof Verification Prompt

Compares before/after photos to verify:
- Correct product placement
- Placement quality assessment
- Specific feedback and issues
- Verification confidence score

## API Usage

### Analyze Shelf Photo

```typescript
import { analyzeShelfPhoto } from '@/lib/vision/bedrock-client';

const analysis = await analyzeShelfPhoto(
  imageBase64,
  'image/jpeg',
  shopkeeperId  // optional, for logging
);

// Returns:
// {
//   emptySpaces: EmptySpace[],
//   currentInventory: DetectedProduct[],
//   analysisConfidence: number,
//   recommendations: string[]
// }
```

### Verify Task Completion

```typescript
import { verifyTaskCompletion } from '@/lib/vision/bedrock-client';

const verification = await verifyTaskCompletion(
  beforeImageBase64,
  afterImageBase64,
  'image/jpeg',
  shopkeeperId  // optional, for logging
);

// Returns:
// {
//   verified: boolean,
//   confidence: number,
//   placementQuality: string,
//   feedback: string,
//   issues: string[]
// }
```

## Error Handling

### Automatic Fallback

When a model fails, the system:
1. Logs the failure with error details
2. Waits for exponential backoff period
3. Attempts next model in chain
4. Continues until success or all models exhausted

### All Models Failed

When all three models fail:
1. Logs all failures to database
2. Checks for consecutive failure pattern
3. Alerts operators if threshold exceeded (10 failures in 1 hour)
4. Throws error with details for application handling

### Graceful Degradation

The application should handle Bedrock failures by:
- Notifying users that analysis is temporarily unavailable
- Suggesting they retry later
- Queuing requests for later processing if possible

## Monitoring

### Database Queries

Check recent model usage:
```sql
SELECT model, status, COUNT(*) as count
FROM bedrock_usage_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY model, status
ORDER BY model, status;
```

Check failure rate:
```sql
SELECT 
  COUNT(*) FILTER (WHERE status = 'failure') * 100.0 / COUNT(*) as failure_rate_percent
FROM bedrock_usage_logs
WHERE timestamp > NOW() - INTERVAL '1 hour';
```

Check average response times:
```sql
SELECT 
  model,
  AVG(response_time_ms) as avg_response_ms,
  MIN(response_time_ms) as min_response_ms,
  MAX(response_time_ms) as max_response_ms
FROM bedrock_usage_logs
WHERE status = 'success'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY model;
```

## Cost Optimization

### Model Pricing (per 1M tokens)

| Model | Input | Output | Use Case |
|-------|-------|--------|----------|
| Nova Pro | $0.80 | $3.20 | Primary - Best accuracy |
| Nova Lite | $0.06 | $0.24 | Secondary - Fast & cheap |
| Claude Haiku | $0.25 | $1.25 | Tertiary - Reliable fallback |

### Optimization Strategy

1. **Primary Model**: Nova Pro for best accuracy
2. **Automatic Fallback**: Use cheaper models when primary fails
3. **Cost Tracking**: Monitor usage logs to optimize model selection
4. **Future Enhancement**: Could implement smart routing based on:
   - Time of day (use cheaper models during off-peak)
   - Request complexity (simple requests → Nova Lite)
   - Historical success rates (prefer models with better track record)

## Testing

### Manual Test

```bash
node test-bedrock-fallback.js
```

This will:
1. Analyze a mock shelf photo
2. Verify fallback chain works
3. Check database logging
4. Display recent usage logs

### Integration Tests

The implementation should be tested with:
- Valid shelf photos
- Invalid/corrupted images
- Network failures (simulated)
- Rate limiting scenarios
- All three models failing

## Requirements Validated

This implementation validates the following requirements:

- **2.3**: Photo analysis within 30 seconds
- **2.4**: AWS Bedrock for analysis
- **12.1-12.3**: AI-powered empty space detection
- **12.6-12.7**: Load-bearing AI business logic
- **13.1-13.3**: Multi-model fallback chain
- **13.4-13.5**: Usage logging and monitoring
- **13.7**: Exponential backoff between retries
- **13.8**: Operator alerting after consecutive failures

## Future Enhancements

1. **Smart Model Selection**: Use ML to predict best model for each request
2. **Cost Optimization**: Implement budget-aware model routing
3. **Performance Monitoring**: Real-time dashboards for model performance
4. **A/B Testing**: Compare model accuracy and cost-effectiveness
5. **Caching**: Cache analysis results for similar images
6. **Batch Processing**: Process multiple photos in parallel
7. **Advanced Alerting**: Integration with PagerDuty, Slack, or SNS
