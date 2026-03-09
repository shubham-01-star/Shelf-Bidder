#!/bin/bash

# Deploy Staging Environment Script
# This script deploys the Shelf-Bidder staging environment to AWS

set -e

echo "🚀 Starting Staging Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS credentials verified${NC}"

# Navigate to infrastructure directory
cd "$(dirname "$0")/.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing CDK dependencies..."
    npm install
fi

# Synthesize CloudFormation template
echo "🔨 Synthesizing CDK stack..."
npx cdk synth ShelfBidderStagingStack

# Deploy the stack
echo "☁️  Deploying to AWS..."
npx cdk deploy ShelfBidderStagingStack \
    --require-approval never \
    --outputs-file outputs.json

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Infrastructure deployment successful!${NC}"
    
    # Extract outputs
    if [ -f "outputs.json" ]; then
        echo ""
        echo "📋 Stack Outputs:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        API_URL=$(jq -r '.ShelfBidderStagingStack.ApiUrl' outputs.json)
        USER_POOL_ID=$(jq -r '.ShelfBidderStagingStack.UserPoolId' outputs.json)
        USER_POOL_CLIENT_ID=$(jq -r '.ShelfBidderStagingStack.UserPoolClientId' outputs.json)
        PHOTO_BUCKET=$(jq -r '.ShelfBidderStagingStack.PhotoBucketName' outputs.json)
        REGION=$(jq -r '.ShelfBidderStagingStack.Region' outputs.json)
        
        echo "API URL: $API_URL"
        echo "User Pool ID: $USER_POOL_ID"
        echo "User Pool Client ID: $USER_POOL_CLIENT_ID"
        echo "Photo Bucket: $PHOTO_BUCKET"
        echo "Region: $REGION"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Create .env.staging file
        echo ""
        echo "📝 Creating .env.staging file..."
        cat > ../.env.staging << EOF
# Staging Environment Configuration
# Generated on $(date)

NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_AWS_REGION=$REGION
NEXT_PUBLIC_PHOTO_BUCKET_NAME=$PHOTO_BUCKET
NEXT_PUBLIC_ENVIRONMENT=staging
EOF
        
        echo -e "${GREEN}✓ Created .env.staging file${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}📌 Next Steps:${NC}"
    echo "1. Run smoke tests: npm run test:smoke"
    echo "2. Deploy frontend application with staging config"
    echo "3. Verify all services are operational"
    
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi
