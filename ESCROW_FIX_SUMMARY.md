# Budget Escrow Reversal - Fix Summary

**Issue:** Budget stuck when tasks expire  
**Status:** ✅ FIXED  
**Date:** March 7, 2026

---

## 🐛 Problem

```
Campaign creates task:
├─ Deduct ₹50 from campaign budget
├─ Create task with 24-hour deadline
└─ Shopkeeper assigned

Shopkeeper doesn't complete task...

24 hours later:
❌ Budget still deducted (₹50 stuck)
❌ Campaign can't use that money
❌ Brand loses money on incomplete task
```

---

## ✅ Solution

### 1. Database Schema Update
```sql
-- Added expires_at field
ALTER TABLE tasks 
ADD COLUMN expires_at TIMESTAMP NOT NULL 
DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- Added constraint
ALTER TABLE tasks 
ADD CONSTRAINT valid_expiry CHECK (expires_at > assigned_date);

-- Added index for efficient queries
CREATE INDEX idx_tasks_expires_at 
ON tasks(expires_at) 
WHERE status IN ('assigned', 'in_progress');
```

### 2. Cron Job API Created
```
POST /api/tasks/cleanup
Authorization: Bearer {CRON_SECRET}

What it does:
1. Find expired tasks (expires_at < NOW)
2. Revert budget to campaigns (ACID transaction)
3. Mark tasks as 'expired'
4. Return summary
```

### 3. Automatic Budget Reversal
```typescript
// Every hour, cron job runs:
BEGIN TRANSACTION;

// Find expired tasks
SELECT * FROM tasks
WHERE status IN ('assigned', 'in_progress')
  AND expires_at < NOW()
FOR UPDATE;

// For each expired task:
// 1. Revert budget
UPDATE campaigns
SET remaining_budget = remaining_budget + task.earnings
WHERE id = task.campaign_id;

// 2. Mark as expired
UPDATE tasks
SET status = 'expired'
WHERE id = task.id;

COMMIT;
```

---

## 📊 Flow Comparison

### Before Fix
```
Task Created → Budget Deducted → Task Expires
                                      ↓
                              ❌ Budget stuck forever
```

### After Fix
```
Task Created → Budget Deducted → Task Expires
                                      ↓
                              Cron Job Runs
                                      ↓
                              ✅ Budget reverted
                              ✅ Campaign can reuse
```

---

## 🎯 Impact

### For Brands
- ✅ No budget leakage
- ✅ Can reuse budget from expired tasks
- ✅ Better ROI

### For System
- ✅ Data consistency
- ✅ ACID transactions
- ✅ Automatic cleanup

---

## 📝 Files Changed

1. **database/init/01-schema.sql**
   - Added `expires_at` field
   - Added `valid_expiry` constraint
   - Added index for performance

2. **src/app/api/tasks/cleanup/route.ts** (NEW)
   - POST endpoint for cleanup
   - GET endpoint for status check
   - ACID transaction implementation

3. **docs/BUDGET_ESCROW_REVERSAL.md** (NEW)
   - Complete documentation
   - Flow diagrams
   - Test cases

4. **COMPLETE_ARCHITECTURE_AND_FLOW.md**
   - Updated database schema
   - Added cleanup API endpoint

---

## ⏰ Cron Setup

```bash
# Vercel Cron (vercel.json)
{
  "crons": [{
    "path": "/api/tasks/cleanup",
    "schedule": "0 * * * *"
  }]
}

# Or external cron
0 * * * * curl -X POST https://app.com/api/tasks/cleanup \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

---

## ✅ Checklist

- [x] Added `expires_at` field to database
- [x] Created cleanup API endpoint
- [x] Implemented ACID transaction
- [x] Added authentication (cron secret)
- [x] Created documentation
- [ ] Setup cron job
- [ ] Test in production
- [ ] Monitor metrics

---

**Status:** ✅ COMPLETE  
**Ready for:** Cron job setup  
**Impact:** HIGH - Prevents budget leakage

