# Shelf-Bidder Complete User Flow & API Guide

This document explains the end-to-end journey from the **Shopkeeper's (User's) perspective**, showing what they see on their screen, the actions they take, and the corresponding backend APIs that power those actions.

---

## Step 1: Morning Login & Dashboard View

**The User Experience:**
The shopkeeper opens the Shelf-Bidder App on their phone in the morning. They see a personalized greeting ("Good Morning, Ramesh 👋"), their total wallet balance, and a big "Scan Shelf" button.

**Frontend UI:** `/dashboard` page.

**The API Call:**
The app fetches their current balance and task status to display on the dashboard.

```bash
# Get Dashboard Data
curl -X GET http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer <shopkeeper-jwt-token>"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "todayEarnings": 0,
    "weeklyEarnings": 1250,
    "totalBalance": 3400,
    "activeTasks": 0
  }
}
```

---

## Step 2: Scanning the Empty Shelf

**The User Experience:**
The shopkeeper notices an empty space on their shelf. They tap **"Scan Shelf"** on the dashboard. The Camera opens up. They point their phone at the empty shelf and tap the capture button. The app shows a "Analyzing..." loader and then says "Uploaded! We are finding brands for this space."

**Frontend UI:** `/camera` page.

**The API Flow (Two-step process):**
First, the app requests a secure link to upload the heavy image.

```bash
# 1. Get S3 Presigned URL
curl -X POST http://localhost:3000/api/photos/upload-url \
  -H "Content-Type: application/json" \
  -d '{
    "shopkeeperId": "sk-12345",
    "photoType": "shelf",
    "filename": "morning-scan.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 850000
  }'
```

Second, after the image uploads to S3, the app tells the backend to analyze it using Claude AI to count the empty spaces.

```bash
# 2. Analyze Shelf Photo
curl -X POST http://localhost:3000/api/photos/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "shopkeeperId": "sk-12345",
    "photoUrl": "s3://shelf-bidder-images/sk-12345/shelf/morning-scan.jpg",
    "mimeType": "image/jpeg"
  }'
```

_(Behind the scenes: The backend sees 2 empty spaces, creates an Auction, Kiro Agent bids on behalf of Coke, Coke wins, and AWS Step Functions assigns a task to the shopkeeper)._

---

## Step 3: Getting the Notification & Task

**The User Experience:**
A few minutes later, the shopkeeper receives an automated **Phone Call in Hindi**: _"Mubarak ho! Aaj ki boli Coke ne jeeti hai 200 rupaye mein. App check karein."_ They also receive a Push Notification.

They open the app and tap the **"Tasks"** tab. They see a new task: "Place Coca-Cola 2L on the middle shelf - Earn ₹200."

**Frontend UI:** Push Notification prompt -> `/tasks` page.

**The API Call:**
The app fetches the newly assigned tasks for the shopkeeper to view the instructions.

```bash
# Fetch Assigned Tasks
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <shopkeeper-jwt-token>"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-abcde",
        "status": "assigned",
        "earnings": 200,
        "instructions": {
          "productName": "Coca-Cola 2L",
          "brandName": "Coca-Cola",
          "positioningRules": [
            "Place on middle shelf",
            "Ensure logo faces outward"
          ]
        }
      }
    ]
  }
}
```

---

## Step 4: Completing the Task & Capturing Proof

**The User Experience:**
The shopkeeper physically picks up a Coca-Cola 2L bottle and places it exactly where the instructions said. In the app, they expand the task and tap **"Upload Proof"**. The camera opens again. They take a picture of the newly placed Coke bottle. They see an "Analyzing Proof..." loader, followed by a green success checkmark and a message: _"Verified! ₹200 added to your wallet."_

**Frontend UI:** `/tasks` page -> `/camera?taskId=task-abcde`

**The API Flow (after getting another upload URL like in Step 2):**
The app asks Claude AI to verify if the photo matches the instructions.

```bash
# Verify Task Proof
curl -X POST http://localhost:3000/api/tasks/verify \
  -H "Content-Type: application/json" \
  -d '{
    "shopkeeperId": "sk-12345",
    "taskId": "task-abcde",
    "photoUrl": "s3://shelf-bidder-images/sk-12345/proof/proof-scan.jpg"
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "verified": true,
    "confidence": 98,
    "feedback": "Excellent placement. Coca-Cola is clearly visible on the middle shelf."
  }
}
```

---

## Step 5: Withdrawing Earnings

**The User Experience:**
The shopkeeper navigates to the **Wallet** section. They see their balance has increased from ₹3400 to ₹3600. They click **"Withdraw"** and enter their UPI ID to transfer the money to their bank account.

**Frontend UI:** `/dashboard` (Wallet Section / Payout Modal)

**The API Call:**

```bash
# Process Wallet Payout
curl -X POST http://localhost:3000/api/wallet/payout \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 3600,
    "method": "upi",
    "details": { "upiId": "ramesh@okicici" }
  }'
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "transactionId": "txn-payout-890",
    "status": "processing",
    "newBalance": 0
  }
}
```
