# Campaign Matching Logic Fix - Bugfix Design

## Overview

The campaign matching system currently fails to match campaigns because it uses a hardcoded location ('Gurgaon') and exact string matching against the `target_locations` array in the database. This fix will extract the shopkeeper's actual location from their profile (`store_address` field), implement flexible city/region-based matching, and ensure the highest-paying campaign is selected while maintaining ACID transaction guarantees for budget deduction and task creation.

The fix involves three key changes:
1. Extract shopkeeper's actual location from their profile instead of using hardcoded 'Gurgaon'
2. Implement flexible location matching using city/region extraction and similarity matching
3. Ensure proper state machine transition to 'offer' state when campaigns are matched

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when AI analysis detects empty shelf spaces but no campaigns are matched due to hardcoded location or exact string matching
- **Property (P)**: The desired behavior - campaigns should be matched using the shopkeeper's actual location with flexible city/region matching
- **Preservation**: Existing behavior that must remain unchanged - ACID transactions, error handling, offline mode, and state transitions for non-matching scenarios
- **findMatchingCampaigns**: The function in `src/lib/db/postgres/operations/campaign.ts` that queries campaigns from PostgreSQL using location filtering
- **matchCampaign**: The function in `src/lib/services/campaign-matcher.ts` that orchestrates campaign matching with ACID transaction for budget deduction
- **store_address**: The text field in the shopkeepers table containing the shopkeeper's store address (e.g., "Shop 123, Main Market, Delhi")
- **target_locations**: The array field in campaigns table containing target cities/regions (e.g., ['Gurgaon', 'Delhi'])
- **Scene 4 State Machine**: The camera page state flow that transitions through ready → preview → uploading → analyzing → offer/done

## Bug Details

### Bug Condition

The bug manifests when AI analysis successfully detects empty shelf spaces (confidence ≥85%) but the system fails to match any campaigns. This occurs because the `/api/campaigns/match` endpoint receives a hardcoded location ('Gurgaon') from the frontend, and the database query uses exact string matching (`$2 = ANY(target_locations)`) which fails when:
- The shopkeeper's actual location differs from 'Gurgaon'
- Campaign target_locations use similar but not identical strings (e.g., 'Delhi NCR' vs 'Delhi')
- Campaign target_locations use broader regions that should include the shopkeeper's city

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { analysisResult, shopkeeperLocation, campaignTargetLocations }
  OUTPUT: boolean
  
  RETURN input.analysisResult.emptySpaces > 0
         AND input.analysisResult.confidence >= 85
         AND input.shopkeeperLocation != 'Gurgaon'
         AND NOT exactMatch(input.shopkeeperLocation, campaignTargetLocations)
         AND existsFlexibleMatch(input.shopkeeperLocation, campaignTargetLocations)
END FUNCTION
```

### Examples

- **Example 1**: Shopkeeper in "Shop 45, Sector 18, Noida" with AI detecting 2 empty spaces at 95% confidence. Campaign exists with target_locations=['Delhi', 'Noida']. Current system sends 'Gurgaon' to API, finds no match. Expected: Extract 'Noida' from store_address, match campaign.

- **Example 2**: Shopkeeper in "Main Market, Gurgaon" with AI detecting 3 empty spaces at 90% confidence. Campaign exists with target_locations=['Gurgaon', 'Delhi']. Current system sends 'Gurgaon', finds exact match. Expected: Continue to work (preservation case).

- **Example 3**: Shopkeeper in "DLF Phase 3, Gurgaon" with AI detecting 1 empty space at 88% confidence. Campaign exists with target_locations=['Delhi NCR']. Current system sends 'Gurgaon', finds no match because 'Gurgaon' != 'Delhi NCR'. Expected: Extract 'Gurgaon', recognize it's part of 'Delhi NCR' region, match campaign.

- **Edge Case**: Shopkeeper in "Remote Village, Himachal Pradesh" with AI detecting 2 empty spaces at 92% confidence. No campaigns exist for that region. Expected: Show "No campaigns matched" message (correct behavior, not a bug).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- ACID transaction guarantees for budget deduction and task creation must continue to work exactly as before
- Error handling for upload failures, analysis failures, and network errors must remain unchanged
- Offline mode behavior (queueing photos for later sync) must remain unchanged
- State transitions for non-matching scenarios (no empty spaces, low confidence, no campaigns) must remain unchanged
- Task verification flow (when taskId is present) must remain unchanged
- Mouse clicks, button interactions, and UI display must remain unchanged

**Scope:**
All inputs that do NOT involve the campaign matching flow after successful AI analysis should be completely unaffected by this fix. This includes:
- Photo upload and compression logic
- AI analysis API calls and response handling
- Task verification flow
- Offline queueing mechanism
- Error states and retry logic
- Navigation and UI interactions

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Hardcoded Location in Frontend**: The camera page (`src/app/camera/page.tsx` line 157) sends a hardcoded `location: 'Gurgaon'` to the `/api/campaigns/match` endpoint instead of extracting the shopkeeper's actual location from their profile

2. **Exact String Matching in Database Query**: The `findMatchingCampaigns` function (`src/lib/db/postgres/operations/campaign.ts` line 138) uses `$2 = ANY(target_locations)` which requires exact string match, failing when:
   - Shopkeeper's city is spelled differently (e.g., 'Gurgaon' vs 'Gurugram')
   - Campaign uses broader region names (e.g., 'Delhi NCR' should match 'Gurgaon', 'Noida', 'Delhi')
   - Case sensitivity issues (e.g., 'delhi' vs 'Delhi')

3. **No Location Extraction Logic**: There is no utility function to extract city/region from the `store_address` text field, which contains full addresses like "Shop 123, Main Market, Delhi"

4. **No Flexible Matching Logic**: There is no logic to handle regional matching (e.g., recognizing that Gurgaon, Noida, and Delhi are all part of Delhi NCR)

## Correctness Properties

Property 1: Bug Condition - Campaign Matching with Actual Location

_For any_ input where AI analysis detects empty shelf spaces with confidence ≥85% and the shopkeeper's actual location differs from 'Gurgaon', the fixed system SHALL extract the shopkeeper's city from their store_address, use flexible location matching to find campaigns targeting that city or region, and present the highest-paying matched campaign.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - ACID Transactions and Non-Matching Flows

_For any_ input where the bug condition does NOT hold (offline mode, task verification, no empty spaces, low confidence, or legitimately no matching campaigns), the fixed system SHALL produce exactly the same behavior as the original system, preserving ACID transaction guarantees, error handling, and state transitions.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File 1**: `src/app/camera/page.tsx`

**Function**: `handleUpload` (around line 150-160)

**Specific Changes**:
1. **Extract Location from Shopkeeper Profile**: Replace hardcoded `location: 'Gurgaon'` with extracted city from `shopkeeper.store_address`
   - Add location extraction logic before the `/api/campaigns/match` call
   - Use a utility function to parse city from full address
   - Fallback to 'Unknown' if extraction fails

**File 2**: `src/lib/db/postgres/operations/campaign.ts`

**Function**: `findMatchingCampaigns` (line 124-148)

**Specific Changes**:
1. **Implement Flexible Location Matching**: Replace exact string match with flexible matching
   - Use case-insensitive matching with ILIKE
   - Support partial matching for regional names (e.g., 'Delhi NCR' matches 'Delhi', 'Gurgaon', 'Noida')
   - Use PostgreSQL array functions to check if location is contained in any target_location string

2. **Add City Normalization**: Normalize city names before matching
   - Handle common spelling variations (Gurgaon/Gurugram)
   - Trim whitespace and convert to lowercase for comparison

**File 3**: `src/lib/utils/location.ts` (new file)

**Purpose**: Utility functions for location extraction and matching

**Specific Changes**:
1. **Create extractCityFromAddress function**: Parse city from full address string
   - Split address by commas
   - Identify city component (usually last or second-to-last segment)
   - Handle common address formats in India

2. **Create normalizeCityName function**: Normalize city names for matching
   - Handle spelling variations (Gurgaon → Gurugram)
   - Trim whitespace and convert to lowercase
   - Return normalized string

3. **Create isLocationMatch function**: Check if shopkeeper location matches campaign target
   - Handle exact matches
   - Handle regional matches (Delhi NCR includes Delhi, Gurgaon, Noida, Faridabad)
   - Case-insensitive comparison

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Create test scenarios with shopkeepers in different locations and campaigns with various target_locations. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Noida Shopkeeper Test**: Create shopkeeper with store_address="Shop 45, Sector 18, Noida" and campaign with target_locations=['Delhi', 'Noida']. Trigger AI analysis with 2 empty spaces at 95% confidence. (will fail on unfixed code - sends 'Gurgaon', no match)

2. **Delhi NCR Regional Test**: Create shopkeeper with store_address="DLF Phase 3, Gurgaon" and campaign with target_locations=['Delhi NCR']. Trigger AI analysis with 1 empty space at 90% confidence. (will fail on unfixed code - 'Gurgaon' doesn't exactly match 'Delhi NCR')

3. **Case Sensitivity Test**: Create shopkeeper with store_address="Main Market, delhi" and campaign with target_locations=['Delhi']. Trigger AI analysis with 3 empty spaces at 88% confidence. (may fail on unfixed code if case-sensitive)

4. **Multiple Campaigns Test**: Create shopkeeper with store_address="Sector 44, Gurgaon" and two campaigns: Campaign A with payout_per_task=150 and Campaign B with payout_per_task=200, both targeting ['Gurgaon']. Trigger AI analysis. (will work on unfixed code for exact match, but should verify highest-paying is selected)

**Expected Counterexamples**:
- No campaigns matched for shopkeepers outside Gurgaon
- No campaigns matched when target_locations use regional names
- Possible causes: hardcoded location, exact string matching, no city extraction

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := handleUpload_fixed(input)
  ASSERT result.state = 'offer'
  ASSERT result.matchedCampaign != null
  ASSERT result.matchedCampaign.location matches shopkeeper.actualLocation
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleUpload_original(input) = handleUpload_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for offline mode, task verification, error handling, and non-matching scenarios, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Offline Mode Preservation**: Observe that offline photo queueing works correctly on unfixed code, then write test to verify this continues after fix
2. **Task Verification Preservation**: Observe that task verification flow (with taskId) works correctly on unfixed code, then write test to verify this continues after fix
3. **Error Handling Preservation**: Observe that upload errors and analysis errors are handled correctly on unfixed code, then write test to verify this continues after fix
4. **No Empty Spaces Preservation**: Observe that when AI detects 0 empty spaces, system shows 'done' state without matching on unfixed code, then write test to verify this continues after fix
5. **Low Confidence Preservation**: Observe that when AI confidence < 85%, system shows 'done' state without matching on unfixed code, then write test to verify this continues after fix

### Unit Tests

- Test `extractCityFromAddress` with various address formats (comma-separated, with/without shop numbers, different city positions)
- Test `normalizeCityName` with spelling variations (Gurgaon/Gurugram, delhi/Delhi)
- Test `isLocationMatch` with exact matches, regional matches, and non-matches
- Test database query with flexible matching using ILIKE and array containment
- Test state machine transitions from 'analyzing' to 'offer' when campaign is matched
- Test state machine transitions from 'analyzing' to 'done' when no campaign is matched

### Property-Based Tests

- Generate random shopkeeper addresses and verify city extraction produces valid city names
- Generate random campaign target_locations and shopkeeper locations, verify flexible matching finds all valid matches
- Generate random AI analysis results with varying confidence levels, verify campaign matching only occurs when confidence ≥85%
- Generate random campaign budgets and verify highest-paying campaign is always selected when multiple matches exist

### Integration Tests

- Test full flow: create shopkeeper in Noida → upload photo → AI detects empty spaces → campaign matched → task created → budget deducted
- Test full flow: create shopkeeper in Delhi → upload photo → AI detects empty spaces → multiple campaigns matched → highest-paying selected → offer displayed
- Test full flow: create shopkeeper in remote location → upload photo → AI detects empty spaces → no campaigns matched → 'done' state with message
- Test regional matching: create campaigns with 'Delhi NCR' target → shopkeepers in Delhi, Gurgaon, Noida all match successfully
- Test ACID transaction: verify budget deduction and task creation are atomic (both succeed or both fail)
