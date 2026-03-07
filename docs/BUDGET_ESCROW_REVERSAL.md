# Budget Escrow Reversal - Expired Tasks Handling

**Feature:** Automatic budget reversal for expired tasks  
**Status:** ✅ IMPLEMENTED  
**Date:** March 7, 2026

---

## 🎯 Problem Statement

### The Issue
When a campaign matches with a shopkeeper:
1. Budget is deducted from campaign: `remaining_budget = remaining_budget - 50`
2. Task is created with 24-hour deadline
3. **What if shopkeeper doesn't complete the task?**
   - Budget is stuck (deducted but not earned)
   - Campaign can't use that budget for other tasks
   - Brand loses money on incomplete tasks

### Example Scenario
```
Campaign: Coca-Cola
- Total Budget: ₹10,000
- Remaining Budget: ₹10,000

Task Created (10 AM):
- Deduct ₹50 from campaign
- Remaining Budget: ₹9,950
- Deadline: Tomorrow 10 AM (24 hours)

Shopkeeper doesn't complete task...

Next Day (10:01 AM):
- Task expired
- ❌ Budget still stuck at ₹9,950
- ❌ Brand can't use that ₹50 for another task
```

---

## ✅ Solution: Budget Escrow Reversal

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    TASK LIFECYCLE                            │
└─────────────────────────────────────────────────────────────┘

1. Task Created (Budget Deducted)
   ├─ Campaign: ₹10,000 → ₹9,950
   ├─ Task Status: 'assigned'
   └─ Expires At: NOW() + 24 hours

2a. Task Completed (Within 24 hours) ✅
    ├─ Shopkeeper earns ₹50
    ├─ Task Status: 'completed'
    └─ Budget stays deducted (₹9,950)

2b. Task Expired (After 24 hours) ⏰
    ├─ Cron job detects expiry
    ├─ Budget reverted: ₹9,950 → ₹10,000
    ├─ Task Status: 'expired'
    └─ Campaign can reuse budget
```

---

## 🗄️ Database Schema Changes

### Tasks Table (Updated)
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  shopkeeper_id UUID REFERENCES shopkeepers(id),
  
  -- Task details
  instructions JSONB NOT NULL,
  earnings DECIMAL(10,2) NOT NULL,
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'assigned' 
    CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed', 'expired')),
  
  -- Timing
  assigned_date TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),  -- ← NEW
  completed_date TIMESTAMP,
  
  -- Constraints
  CONSTRAINT valid_expiry CHECK (expires_at > assigned_date),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient expiry checks
CREATE INDEX idx_tasks_expires_at 
  ON tasks(expires_at) 
  WHERE status IN ('assigned', 'in_progress');
```

### Key Changes
1. **Added `expires_at` field**: Defaults to 24 hours from assignment
2. **Added constraint**: Ensures expiry is after assignment
3. **Added index**: Optimizes cron job queries

---

## 🔄 Cleanup Cron Job

### API Endpoint
```
POST /api/tasks/cleanup
Authorization: Bearer {CRON_SECRET}
```

### What It Does
1. **Finds expired tasks**
   ```sql
   SELECT * FROM tasks
   WHERE status IN ('assigned', 'in_progress')
     AND expires_at < NOW()
   FOR UPDATE;
   ```

2. **Reverts budget (ACID transaction)**
   ```sql
   BEGIN TRANSACTION;
   
   -- Revert budget to campaign
   UPDATE campaigns
   SET remaining_budget = remaining_budget + 50
   WHERE id = campaign_id;
   
   -- Mark task as expired
   UPDATE tasks
   SET status = 'expired'
   WHERE id = task_id;
   
   COMMIT;
   ```

3. **Returns summary**
   ```json
   {
     "expiredCount": 5,
     "revertedBudget": 250,
     "processedTasks": [...]
   }
   ```

---

## 📊 Complete Flow with Escrow

### Flow 1: Task Completed (Happy Path)
```
10:00 AM - Task Created
├─ Campaign Budget: ₹10,000 → ₹9,950 (deduct ₹50)
├─ Task Status: 'assigned'
├─ Expires At: Tomorrow 10:00 AM
└─ Shopkeeper notified

11:00 AM - Shopkeeper Completes Task
├─ Proof photo uploaded
├─ AI verification: ✅ Verified
├─ Task Status: 'completed'
├─ Shopkeeper Balance: ₹0 → ₹50 (earn ₹50)
└─ Campaign Budget: ₹9,950 (stays deducted)

Result:
✅ Brand paid ₹50 for completed task
✅ Shopkeeper earned ₹50
✅ Campaign budget correctly reduced
```

### Flow 2: Task Expired (Edge Case)
```
10:00 AM - Task Created
├─ Campaign Budget: ₹10,000 → ₹9,950 (deduct ₹50)
├─ Task Status: 'assigned'
├─ Expires At: Tomorrow 10:00 AM
└─ Shopkeeper notified

... 24 hours pass ...

Next Day 10:01 AM - Cron Job Runs
├─ Detects expired task
├─ BEGIN TRANSACTION
│   ├─ Revert Budget: ₹9,950 → ₹10,000 (add ₹50 back)
│   └─ Update Status: 'assigned' → 'expired'
├─ COMMIT
└─ Log: "Task expired, ₹50 reverted to campaign"

Result:
✅ Budget returned to campaign
✅ Campaign can create new task with that ₹50
✅ No money lost
```

### Flow 3: Multiple Expired Tasks
```
Cron Job Runs (Every Hour)
├─ Find all expired tasks
│   ├─ Task 1: Expired 2 hours ago, ₹50
│   ├─ Task 2: Expired 1 hour ago, ₹75
│   └─ Task 3: Expired 30 mins ago, ₹100
│
├─ Process in ACID transaction
│   ├─ Revert Task 1: Campaign A gets ₹50 back
│   ├─ Revert Task 2: Campaign B gets ₹75 back
│   └─ Revert Task 3: Campaign C gets ₹100 back
│
└─ Summary
    ├─ Expired Count: 3
    ├─ Total Reverted: ₹225
    └─ Execution Time: 45ms

Result:
✅ All budgets reverted
✅ All tasks marked as expired
✅ Campaigns can reuse budget
```

---

## 🔐 Security

### Cron Secret Authentication
```typescript
// In .env.local
CRON_SECRET=your-secret-key-here

// In API route
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Why This Matters
- Prevents unauthorized cleanup calls
- Only cron service can trigger cleanup
- Protects against malicious budget manipulation

---

## ⏰ Cron Schedule

### Recommended Schedule
```bash
# Every hour
0 * * * * curl -X POST https://your-app.com/api/tasks/cleanup \
  -H "Authorization: Bearer ${CRON_SECRET}"

# Or using Vercel Cron
# vercel.json
{
  "crons": [{
    "path": "/api/tasks/cleanup",
    "schedule": "0 * * * *"
  }]
}
```

### Why Hourly?
- Tasks expire after 24 hours
- Hourly cleanup ensures max 1-hour delay
- Not too frequent (saves resources)
- Not too slow (timely budget recovery)

---

## 🧪 Testing

### Test Case 1: Single Expired Task
```typescript
// Setup
const campaign = await createCampaign({ budget: 10000 });
const task = await createTask({ 
  campaign_id: campaign.id,
  earnings: 50,
  expires_at: new Date(Date.now() - 1000) // Expired 1 second ago
});

// Execute
const response = await fetch('/api/tasks/cleanup', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
});

// Verify
const result = await response.json();
expect(result.expiredCount).toBe(1);
expect(result.revertedBudget).toBe(50);

const updatedCampaign = await getCampaign(campaign.id);
expect(updatedCampaign.remaining_budget).toBe(10000); // Budget reverted

const updatedTask = await getTask(task.id);
expect(updatedTask.status).toBe('expired');
```

### Test Case 2: No Expired Tasks
```typescript
// Setup
const task = await createTask({ 
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires tomorrow
});

// Execute
const response = await fetch('/api/tasks/cleanup', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
});

// Verify
const result = await response.json();
expect(result.expiredCount).toBe(0);
expect(result.revertedBudget).toBe(0);
```

### Test Case 3: Completed Task (Should Not Revert)
```typescript
// Setup
const task = await createTask({ 
  status: 'completed',
  expires_at: new Date(Date.now() - 1000) // Expired but completed
});

// Execute
const response = await fetch('/api/tasks/cleanup', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${CRON_SECRET}` }
});

// Verify
const result = await response.json();
expect(result.expiredCount).toBe(0); // Completed tasks not processed
```

---

## 📈 Monitoring

### Metrics to Track
```typescript
// Log format
{
  "event": "task_cleanup",
  "timestamp": "2026-03-07T10:00:00Z",
  "expiredCount": 5,
  "revertedBudget": 250,
  "executionTime": 45,
  "tasks": [
    { "taskId": "...", "campaignId": "...", "amount": 50 },
    ...
  ]
}
```

### Alerts to Set
1. **High Expiry Rate**: > 20% of tasks expiring
2. **Large Budget Reversals**: > ₹1,000 reverted in single run
3. **Cleanup Failures**: Any errors during cleanup
4. **Slow Execution**: Cleanup taking > 5 seconds

---

## 🎯 Benefits

### For Brands
- ✅ No budget stuck in incomplete tasks
- ✅ Can reuse budget for new tasks
- ✅ Better ROI on campaigns
- ✅ Accurate budget tracking

### For System
- ✅ Data consistency maintained
- ✅ ACID transactions prevent race conditions
- ✅ Automatic cleanup (no manual intervention)
- ✅ Scalable solution

### For Shopkeepers
- ✅ Clear 24-hour deadline
- ✅ No penalty for expired tasks
- ✅ Can still complete future tasks

---

## 🔄 Task Status Lifecycle

```
assigned → in_progress → completed ✅
   ↓           ↓
   └─────→ expired ⏰ (budget reverted)
   
failed ❌ (manual intervention)
```

### Status Definitions
- **assigned**: Task created, waiting for shopkeeper
- **in_progress**: Shopkeeper started working
- **completed**: Task verified and earnings credited
- **expired**: Deadline passed, budget reverted
- **failed**: Verification failed, manual review needed

---

## 📝 API Documentation

### POST /api/tasks/cleanup
**Purpose:** Clean up expired tasks and revert budget

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "expiredCount": 5,
    "revertedBudget": 250,
    "processedTasks": [
      {
        "taskId": "uuid",
        "campaignId": "uuid",
        "shopkeeperId": "uuid",
        "revertedAmount": 50,
        "expiredAt": "2026-03-07T10:00:00Z"
      }
    ],
    "timestamp": "2026-03-07T11:00:00Z",
    "executionTime": 45
  }
}
```

### GET /api/tasks/cleanup
**Purpose:** Check how many tasks need cleanup

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "expiredTasksCount": 5,
    "needsCleanup": true,
    "timestamp": "2026-03-07T11:00:00Z"
  }
}
```

---

## ✅ Implementation Checklist

- [x] Added `expires_at` field to tasks table
- [x] Added `valid_expiry` constraint
- [x] Added index for efficient queries
- [x] Created `/api/tasks/cleanup` endpoint
- [x] Implemented ACID transaction for reversal
- [x] Added cron secret authentication
- [x] Added logging and monitoring
- [x] Created documentation
- [ ] Set up cron job (Vercel Cron or external)
- [ ] Test with real data
- [ ] Monitor in production

---

**Status:** ✅ IMPLEMENTED  
**Impact:** HIGH - Prevents budget leakage  
**Next:** Setup cron job and monitor

**Last Updated:** March 7, 2026

