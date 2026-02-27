#!/bin/bash

# Export AWS CDK Stack Outputs to .env.local
# This script retrieves the deployed stack outputs and creates a .env.local file

set -e

STACK_NAME="ShelfBidderStack"
ENV_FILE="../.env.local"

echo "Fetching stack outputs from $STACK_NAME..."

# Get stack outputs
API_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
REGION=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='Region'].OutputValue" --output text)
PHOTO_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PhotoBucketName'].OutputValue" --output text)
SHOPKEEPERS_TABLE=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ShopkeepersTableName'].OutputValue" --output text)
SHELF_SPACES_TABLE=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ShelfSpacesTableName'].OutputValue" --output text)
AUCTIONS_TABLE=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='AuctionsTableName'].OutputValue" --output text)
TASKS_TABLE=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='TasksTableName'].OutputValue" --output text)
TRANSACTIONS_TABLE=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='TransactionsTableName'].OutputValue" --output text)

# Create .env.local file
cat > $ENV_FILE << EOF
# AWS Infrastructure Configuration
# Auto-generated from CDK stack outputs
# Generated on: $(date)

# API Gateway
NEXT_PUBLIC_API_URL=$API_URL

# Cognito
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_AWS_REGION=$REGION

# S3
NEXT_PUBLIC_PHOTO_BUCKET=$PHOTO_BUCKET

# DynamoDB Tables (for server-side use)
DYNAMODB_SHOPKEEPERS_TABLE=$SHOPKEEPERS_TABLE
DYNAMODB_SHELF_SPACES_TABLE=$SHELF_SPACES_TABLE
DYNAMODB_AUCTIONS_TABLE=$AUCTIONS_TABLE
DYNAMODB_TASKS_TABLE=$TASKS_TABLE
DYNAMODB_TRANSACTIONS_TABLE=$TRANSACTIONS_TABLE
EOF

echo "✅ Configuration exported to $ENV_FILE"
echo ""
echo "Stack outputs:"
echo "  API URL: $API_URL"
echo "  User Pool ID: $USER_POOL_ID"
echo "  User Pool Client ID: $USER_POOL_CLIENT_ID"
echo "  Region: $REGION"
echo "  Photo Bucket: $PHOTO_BUCKET"
