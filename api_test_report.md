# API Testing cURL Guide

This document contains cURL commands for all major backend APIs to allow for modular manual testing.

> **IMPORTANT:**
>
> - Most APIs require authentication. Ensure you replace `<shopkeeper-jwt-token>` or `<brand-jwt-token>` with the token received from the successful login API.
> - Replace `<shopkeeperId>` or `<brandId>` with the ID received from the login payload.

---

## 🟢 1. Shopkeeper Flow (Auth & Profile)

### Sign Up

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919902010000",
    "password": "Password123!",
    "name": "Shubham",
    "email": "shubhamkumar990201@gmail.com"
  }'
```

_(Check your local server terminal output for the OTP)_

### Verify OTP

```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919902010000",
    "code": "123456"
  }'
```

_(Replace `123456` with the OTP from the server logs)_

### Sign In

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919902010000",
    "password": "Password123!"
  }'
```

### Get Shopkeeper Profile

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer <shopkeeper-jwt-token>"
```

### Sync Shopkeeper Profile (Creates DynamoDB Entry)

```bash
curl -X POST http://localhost:3000/api/profile/sync \
  -H "Authorization: Bearer <shopkeeper-jwt-token>"
```

### Update Shopkeeper Profile

```bash
curl -X PATCH http://localhost:3000/api/profile \
  -H "Authorization: Bearer <shopkeeper-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "storeAddress": "123 Main St",
    "preferredLanguage": "en"
  }'
```

---

## 🟢 2. Shopkeeper Flow (Dashboard & Tasks)

### Get Dashboard Data

```bash
curl -X GET http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer <shopkeeper-jwt-token>"
```

### Fetch Assigned Tasks

```bash
curl -X GET http://localhost:3000/api/tasks \
  -H "Authorization: Bearer <shopkeeper-jwt-token>"
```

### Get Wallet Information

```bash
curl -X GET http://localhost:3000/api/wallet \
  -H "Authorization: Bearer <shopkeeper-jwt-token>"
```

### Fake Withdraw from Wallet

```bash
curl -X POST http://localhost:3000/api/wallet/withdraw \
  -H "Authorization: Bearer <shopkeeper-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500
  }'
```

---

## 🟢 3. Shopkeeper Flow (Camera & Analysis)

### Get S3 Presigned Upload URL

```bash
curl -X POST http://localhost:3000/api/photos/upload-url \
  -H "Authorization: Bearer <shopkeeper-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shopkeeperId": "<shopkeeperId>",
    "photoType": "shelf",
    "filename": "shelf-scan.png",
    "mimeType": "image/png",
    "fileSize": 850000
  }'
```

### Analyze Shelf Photo (Bedrock Claude/Nova)

_(Requires uploading an image to the S3 bucket first using the presigned URL above)_

```bash
curl -X POST http://localhost:3000/api/photos/analyze \
  -H "Authorization: Bearer <shopkeeper-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shopkeeperId": "<shopkeeperId>",
    "photoUrl": "https://staging-shelf-bidder-photos-338261675242.s3.amazonaws.com/shelf/<shopkeeperId>/shelf-scan.png",
    "s3Key": "shelf/<shopkeeperId>/shelf-scan.png",
    "mimeType": "image/png"
  }'
```

### Verify Task Proof

```bash
curl -X POST http://localhost:3000/api/tasks/verify \
  -H "Authorization: Bearer <shopkeeper-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shopkeeperId": "<shopkeeperId>",
    "taskId": "task-xyz",
    "photoUrl": "s3://shelf-bidder-images/<shopkeeperId>/proof/proof-scan.png"
  }'
```

---

## 🔵 4. Brand Flow (Auth & Wallet)

### Brand Sign Up

```bash
curl -X POST http://localhost:3000/api/brand/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "signup",
    "email": "work.shubhmkumar@gmail.com",
    "brandName": "Brand Example",
    "contactPerson": "Shubham",
    "password": "Password123!"
  }'
```

_(Check local server logs for OTP)_

### Brand Verify OTP

```bash
curl -X POST http://localhost:3000/api/brand/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "work.shubhmkumar@gmail.com",
    "code": "123456"
  }'
```

### Brand Sign In

```bash
curl -X POST http://localhost:3000/api/brand/auth \
  -H "Content-Type: application/json" \
  -d '{
    "action": "login",
    "email": "work.shubhmkumar@gmail.com",
    "password": "Password123!"
  }'
```

### Fake Brand Wallet Recharge

```bash
curl -X POST http://localhost:3000/api/brand/wallet/recharge \
  -H "Authorization: Bearer <brand-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 5000,
    "paymentMethod": "credit_card",
    "brandId": "<brandId>"
  }'
```

### Get Active Brand Auctions

```bash
curl -X GET http://localhost:3000/api/brand/auctions \
  -H "Authorization: Bearer <brand-jwt-token>"
```

### Create Product Campaign

```bash
curl -X POST http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer <brand-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Blast Campaign",
    "productId": "prod-1234",
    "budget": 10000,
    "startDate": "2026-04-01T00:00:00Z",
    "endDate": "2026-04-30T00:00:00Z",
    "storeTypeFilters": ["kirana", "supermarket"],
    "minSpaceRequired": 25,
    "maxBidPerSpace": 200,
    "instructions": "Place on eye-level shelf"
  }'
```
