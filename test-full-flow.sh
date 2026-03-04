#!/bin/bash

echo "=========================================="
echo "Step 1: Signin"
echo "=========================================="

SIGNIN_RESPONSE=$(curl -s --location 'http://localhost:3000/api/auth/signin' \
--header 'Content-Type: application/json' \
--data-raw '{
  "phoneNumber": "+919876543210",
  "password": "Test@1234"
}')

echo "$SIGNIN_RESPONSE" | jq '.'

# Extract access token
ACCESS_TOKEN=$(echo "$SIGNIN_RESPONSE" | jq -r '.accessToken')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token"
  exit 1
fi

echo ""
echo "✅ Got access token"
echo ""

echo "=========================================="
echo "Step 2: Profile Sync (Create DynamoDB entry)"
echo "=========================================="

SYNC_RESPONSE=$(curl -s --location 'http://localhost:3000/api/profile/sync' \
--header "Authorization: Bearer $ACCESS_TOKEN" \
--request POST)

echo "$SYNC_RESPONSE" | jq '.'

echo ""
echo "=========================================="
echo "Step 3: Get Profile"
echo "=========================================="

PROFILE_RESPONSE=$(curl -s --location 'http://localhost:3000/api/profile' \
--header "Authorization: Bearer $ACCESS_TOKEN")

echo "$PROFILE_RESPONSE" | jq '.'

echo ""
echo "=========================================="
echo "Done!"
echo "=========================================="
