# Task Verification Fix - Product Context Issue

**Issue Identified:** March 7, 2026  
**Status:** ✅ FIXED

---

## 🐛 Problem Identified

### The Gap
In the original implementation, the Bedrock AI verification was comparing before/after photos WITHOUT knowing:
- What product to look for
- How many items should be placed
- Where exactly to place them
- What the product looks like

### Example of the Problem
```typescript
// ❌ BEFORE (Incomplete)
await verifyTaskCompletion(
  beforePhoto,
  afterPhoto,
  'image/jpeg',
  shopkeeperId
);

// Bedrock prompt was generic:
"Compare these two photos and verify product placement"
// ❌ AI doesn't know WHAT product to verify!
```

### Why This Was a Problem
1. **No Product Context**: AI couldn't verify if the RIGHT product was placed
2. **No Quantity Check**: AI couldn't confirm if correct number of items were placed
3. **No Location Verification**: AI couldn't check if placement matched instructions
4. **Generic Feedback**: AI could only give vague responses like "something changed"

---

## ✅ Solution Implemented

### 1. Updated Function Signature
```typescript
// ✅ AFTER (Complete)
export async function verifyTaskCompletion(
  beforeImageBase64: string,
  afterImageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  shopkeeperId?: string,
  taskInstructions?: string,              // ← NEW: Task instructions
  productDetails?: {                      // ← NEW: Product details
    name?: string;                        // e.g., "Coca-Cola 500ml Bottle"
    category?: string;                    // e.g., "Beverages"
    quantity?: number;                    // e.g., 2
    location?: string;                    // e.g., "Top shelf, eye level"
  }
): Promise<VerificationResult>
```

### 2. Enhanced Prompt Generation
```typescript
function generateProofVerificationPrompt(
  taskInstructions?: string,
  productDetails?: ProductDetails
): string {
  return `
Compare these two retail shelf photos (before and after).

TARGET PRODUCT SPECIFICATION:
- Product Name: ${productDetails.name || 'Not specified'}
- Category: ${productDetails.category || 'Not specified'}
- Required Quantity: ${productDetails.quantity || 'Not specified'}
- Target Location: ${productDetails.location || 'Not specified'}

TASK INSTRUCTIONS:
${taskInstructions}

Your verification task:
1. Verify the CORRECT product is placed (match product name)
2. Verify the CORRECT quantity (count items)
3. Verify the CORRECT location (check placement)
4. Assess visibility and presentation quality

Return JSON with specific feedback.
`;
}
```

### 3. Updated API Route
```typescript
// Extract task details from database
const task = await TaskOperations.getById(taskId);

// Build product details from task
const productDetails = {
  name: task.product_name || undefined,      // From campaign
  category: task.category || undefined,       // From campaign
  quantity: task.quantity || undefined,       // From task
  location: task.target_location || undefined // From task
};

// Call Bedrock with full context
const bedrockResult = await verifyTaskCompletion(
  beforeBase64,
  afterBase64,
  getMediaType(mimeType),
  shopkeeperId,
  task.instructions || 'Complete the product placement task',
  productDetails
);
```

---

## 📊 Before vs After Comparison

### Before Fix
```
Prompt to Bedrock:
┌─────────────────────────────────────────┐
│ Compare these two photos:               │
│ - Before: [image]                       │
│ - After: [image]                        │
│                                         │
│ Verify product placement.               │
└─────────────────────────────────────────┘

AI Response:
{
  "verified": true,
  "feedback": "Something changed in the photo"
}
❌ Not specific enough!
```

### After Fix
```
Prompt to Bedrock:
┌─────────────────────────────────────────┐
│ Compare these two photos:               │
│ - Before: [image]                       │
│ - After: [image]                        │
│                                         │
│ TARGET PRODUCT SPECIFICATION:           │
│ - Product Name: Coca-Cola 500ml Bottle │
│ - Category: Beverages                   │
│ - Required Quantity: 2                  │
│ - Target Location: Top shelf, eye level│
│                                         │
│ TASK INSTRUCTIONS:                      │
│ Place 2 Coca-Cola bottles on top shelf │
│                                         │
│ Verify:                                 │
│ 1. Correct product? (Coca-Cola 500ml)  │
│ 2. Correct quantity? (2 bottles)       │
│ 3. Correct location? (top shelf)       │
│ 4. Good visibility?                     │
└─────────────────────────────────────────┘

AI Response:
{
  "verified": true,
  "confidence": 95,
  "feedback": "Perfect! 2 Coca-Cola 500ml bottles 
              placed on top shelf at eye level. 
              Products clearly visible and aligned.",
  "issues": []
}
✅ Specific and actionable!
```

---

## 🎯 What This Fix Enables

### 1. Accurate Product Verification
```typescript
// AI can now verify:
✅ "Is this Coca-Cola?" (not Pepsi)
✅ "Is this 500ml?" (not 1L)
✅ "Are there 2 bottles?" (not 1 or 3)
```

### 2. Location Verification
```typescript
// AI can now check:
✅ "Is it on top shelf?" (not bottom)
✅ "Is it at eye level?" (not hidden)
✅ "Is it in the right section?" (beverages area)
```

### 3. Specific Feedback
```typescript
// Before:
"Product placement needs adjustment"

// After:
"Only 1 bottle visible instead of required 2 bottles.
 Product is on middle shelf instead of top shelf.
 Please move to top shelf and add 1 more bottle."
```

### 4. Quality Assessment
```typescript
// AI can now evaluate:
✅ Product visibility (clear vs obscured)
✅ Alignment (straight vs crooked)
✅ Presentation (professional vs messy)
✅ Accessibility (easy to reach vs blocked)
```

---

## 🔄 Complete Verification Flow (Fixed)

```
1. Shopkeeper completes task
   ↓
2. Takes proof photo
   ↓
3. API receives verification request
   ↓
4. Fetch task from database
   ├─ instructions: "Place 2 Coca-Cola bottles..."
   ├─ product_name: "Coca-Cola 500ml Bottle"
   ├─ category: "Beverages"
   ├─ quantity: 2
   └─ target_location: "Top shelf, eye level"
   ↓
5. Fetch before photo from S3
   ↓
6. Fetch after photo from S3
   ↓
7. Build product details object
   ↓
8. Call Bedrock with FULL CONTEXT:
   ├─ Before image
   ├─ After image
   ├─ Task instructions
   └─ Product details (name, category, quantity, location)
   ↓
9. Bedrock analyzes with context:
   ├─ Identifies Coca-Cola bottles in after photo
   ├─ Counts: 2 bottles ✅
   ├─ Checks location: Top shelf ✅
   ├─ Assesses visibility: Clear ✅
   └─ Generates specific feedback
   ↓
10. Return verification result:
    {
      "verified": true,
      "confidence": 95,
      "placementQuality": "excellent",
      "feedback": "Perfect placement! 2 Coca-Cola 500ml 
                   bottles clearly visible on top shelf.",
      "issues": []
    }
```

---

## 📝 Database Schema Requirements

To support this fix, the `tasks` table should have:

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  shopkeeper_id UUID REFERENCES shopkeepers(id),
  campaign_id UUID REFERENCES campaigns(id),
  
  -- Task details
  instructions TEXT NOT NULL,           -- "Place 2 Coca-Cola bottles..."
  
  -- Product details (from campaign)
  product_name VARCHAR(255),            -- "Coca-Cola 500ml Bottle"
  category VARCHAR(100),                -- "Beverages"
  quantity INTEGER,                     -- 2
  target_location VARCHAR(255),         -- "Top shelf, eye level"
  
  -- Photos
  before_photo_url TEXT,
  proof_photo_url TEXT,
  
  -- Verification
  verification_result JSONB,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_date TIMESTAMP
);
```

---

## 🧪 Testing the Fix

### Test Case 1: Correct Placement
```typescript
const result = await verifyTaskCompletion(
  beforePhoto,
  afterPhoto,
  'image/jpeg',
  'shopkeeper_123',
  'Place 2 Coca-Cola 500ml bottles on top shelf',
  {
    name: 'Coca-Cola 500ml Bottle',
    category: 'Beverages',
    quantity: 2,
    location: 'Top shelf, eye level'
  }
);

// Expected:
// verified: true
// feedback: "Perfect! 2 Coca-Cola bottles on top shelf"
```

### Test Case 2: Wrong Quantity
```typescript
// After photo shows only 1 bottle instead of 2

// Expected:
// verified: false
// issues: ["Only 1 bottle visible instead of required 2"]
```

### Test Case 3: Wrong Product
```typescript
// After photo shows Pepsi instead of Coca-Cola

// Expected:
// verified: false
// issues: ["Wrong product: Pepsi found instead of Coca-Cola"]
```

### Test Case 4: Wrong Location
```typescript
// After photo shows bottles on bottom shelf instead of top

// Expected:
// verified: false
// issues: ["Product on bottom shelf instead of top shelf"]
```

---

## 🎯 Impact of This Fix

### For Shopkeepers
- ✅ Clear feedback on what's wrong
- ✅ Specific instructions to fix issues
- ✅ Faster task completion (no guessing)
- ✅ Higher success rate

### For Brands
- ✅ Accurate verification of placements
- ✅ Correct products in correct locations
- ✅ Better ROI on campaigns
- ✅ Quality control

### For System
- ✅ More accurate AI verification
- ✅ Reduced false positives
- ✅ Better user experience
- ✅ Actionable feedback

---

## 📚 Files Modified

1. **src/lib/vision/bedrock-client.ts**
   - Added `taskInstructions` parameter
   - Added `productDetails` parameter
   - Created `generateProofVerificationPrompt()` function
   - Enhanced prompt with product context

2. **src/app/api/tasks/verify/route.ts**
   - Extract product details from task
   - Pass instructions and details to Bedrock
   - Better error handling

3. **COMPLETE_ARCHITECTURE_AND_FLOW.md**
   - Updated verification prompt example
   - Added product specification section

---

## ✅ Verification Checklist

- [x] Function signature updated with new parameters
- [x] Prompt generation function created
- [x] Product details extracted from task
- [x] API route updated to pass context
- [x] Documentation updated
- [x] Test cases defined
- [x] Error handling improved

---

## 🚀 Next Steps

1. **Test with real photos**
   - Upload before/after photos
   - Verify AI can identify products
   - Check feedback quality

2. **Add product reference images** (Future enhancement)
   - Store product images in database
   - Pass reference image to AI
   - Even more accurate verification

3. **Add confidence thresholds**
   - Require 80%+ confidence for auto-approval
   - Manual review for 50-80% confidence
   - Auto-reject below 50%

---

**Status:** ✅ FIXED  
**Impact:** HIGH - Critical for accurate task verification  
**Testing:** Ready for testing with AWS Bedrock  

**Last Updated:** March 7, 2026

