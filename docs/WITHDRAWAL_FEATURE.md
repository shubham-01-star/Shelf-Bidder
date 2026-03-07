# Fake Withdrawal Feature

## Overview

This document describes the fake withdrawal functionality implemented for the Shelf-Bidder hackathon demo. The withdrawal system simulates a real payment gateway without actual money transfer.

## Implementation

### API Endpoint

**POST** `/api/wallet/withdraw`

**Request Body:**
```json
{
  "amount": 500
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "transactionId": "txn-withdraw-1234567890",
    "shopkeeperId": "shopkeeper-id",
    "amount": 500,
    "status": "completed",
    "message": "Successfully withdrawn ₹500 to your bank account",
    "bankAccount": "State Bank of India •••• 1234",
    "timestamp": "2026-03-07T10:30:00.000Z"
  }
}
```

**Response (Error):**
```json
{
  "error": "Invalid withdrawal amount",
  "details": "Amount must be greater than 0"
}
```

### Features

1. **Local Development Mode**
   - Uses mock data for testing
   - Simulates 1-second processing delay
   - No real database transactions in local mode

2. **Production Mode**
   - Uses real wallet service (`requestPayout`)
   - Creates payout transaction in database
   - Deducts amount from shopkeeper balance
   - Validates balance and thresholds

3. **Validation**
   - Amount must be greater than 0
   - Amount cannot exceed current balance
   - Minimum balance threshold: ₹100
   - Maximum payout per request: ₹10,000

4. **UI Features**
   - Modal-based withdrawal interface
   - Real-time balance display
   - "Max Fill" button to withdraw full balance
   - Processing state with loading spinner
   - Success/error alerts with transaction details
   - Disabled state during processing

## User Flow

1. User clicks "Withdraw to Bank" button on wallet page
2. Modal opens with withdrawal form
3. User enters amount or clicks "Max Fill"
4. User clicks "Confirm Transfer"
5. Button shows loading state
6. API processes withdrawal
7. Success alert shows transaction details
8. Modal closes and balance updates

## Testing

Run the test script:
```bash
node test-withdrawal.js
```

This tests:
- Unauthenticated requests (should fail)
- Valid withdrawal requests
- Invalid amounts (zero, negative)
- Large withdrawals

## Files Modified

1. **src/app/api/wallet/withdraw/route.ts** - New API endpoint
2. **src/app/wallet/page.tsx** - Updated UI with processing state
3. **src/hooks/use-wallet.ts** - Updated to use new endpoint
4. **test-withdrawal.js** - Test script for API

## Demo Notes

For the hackathon demo:
- The withdrawal is instant (no real payment processing)
- Shows fake bank account: "State Bank of India •••• 1234"
- Transaction appears in wallet history immediately
- Balance updates in real-time
- Perfect for demonstrating the complete workflow

## Future Enhancements

For production deployment:
1. Integrate real payment gateway (Razorpay, Stripe, etc.)
2. Add KYC verification
3. Implement withdrawal limits per day/week
4. Add email/SMS notifications
5. Support multiple bank accounts
6. Add withdrawal history filtering
7. Implement withdrawal cancellation
8. Add admin approval workflow for large amounts

## Security Considerations

Current implementation (demo):
- Uses JWT authentication
- Validates shopkeeper ownership
- Checks balance before withdrawal
- ACID transactions for data consistency

Production requirements:
- Two-factor authentication for withdrawals
- Rate limiting on withdrawal attempts
- Fraud detection algorithms
- Audit logging for all transactions
- Encrypted bank account storage
- PCI DSS compliance for payment data
