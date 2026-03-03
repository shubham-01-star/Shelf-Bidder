#!/bin/bash

# Production Deployment Script for Shelf-Bidder
# Task 15.2: Production deployment configuration

set -e

echo "🚀 Starting Production Deployment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS credentials are configured
echo "📋 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "Please run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS Account: $ACCOUNT_ID${NC}"
echo ""

# Confirm production deployment
echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION${NC}"
echo -e "${YELLOW}This will affect live users and incur costs.${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Run tests
echo "🧪 Running tests..."
npm run test
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Tests failed. Deployment aborted.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ All tests passed${NC}"
echo ""

# Run linter
echo "🔍 Running linter..."
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Linting failed. Deployment aborted.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Linting passed${NC}"
echo ""

# Synthesize CDK stack
echo "🏗️  Synthesizing CDK stack..."
npx cdk synth ShelfBidderStack
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ CDK synthesis failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ CDK synthesis successful${NC}"
echo ""

# Show diff
echo "📊 Showing infrastructure changes..."
npx cdk diff ShelfBidderStack
echo ""

# Confirm deployment
read -p "Deploy these changes to production? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Deploy to AWS
echo "🚀 Deploying to AWS..."
npx cdk deploy ShelfBidderStack \
    --require-approval never \
    --outputs-file outputs.json

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""

# Extract outputs
if [ -f outputs.json ]; then
    echo "📝 Extracting stack outputs..."
    
    API_URL=$(jq -r '.ShelfBidderStack.ApiUrl' outputs.json)
    USER_POOL_ID=$(jq -r '.ShelfBidderStack.UserPoolId' outputs.json)
    USER_POOL_CLIENT_ID=$(jq -r '.ShelfBidderStack.UserPoolClientId' outputs.json)
    PHOTO_BUCKET=$(jq -r '.ShelfBidderStack.PhotoBucketName' outputs.json)
    
    # Create .env.production file
    cat > ../.env.production << EOF
# Production Environment Variables
# Generated: $(date)

NEXT_PUBLIC_API_URL=$API_URL
NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_PHOTO_BUCKET_NAME=$PHOTO_BUCKET
NEXT_PUBLIC_ENVIRONMENT=production
EOF
    
    echo -e "${GREEN}✅ Created .env.production${NC}"
    echo ""
    
    echo "📋 Production Stack Outputs:"
    echo "  API URL: $API_URL"
    echo "  User Pool ID: $USER_POOL_ID"
    echo "  User Pool Client ID: $USER_POOL_CLIENT_ID"
    echo "  Photo Bucket: $PHOTO_BUCKET"
    echo ""
fi

# Test health endpoint
if [ ! -z "$API_URL" ]; then
    echo "🏥 Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s "${API_URL}health" || echo "failed")
    
    if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
        echo -e "${GREEN}✅ Health check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check failed or endpoint not ready yet${NC}"
        echo "   Response: $HEALTH_RESPONSE"
    fi
    echo ""
fi

echo -e "${GREEN}🎉 Production deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Deploy frontend application with production config"
echo "  2. Run smoke tests: npm run test:smoke"
echo "  3. Monitor CloudWatch logs and metrics"
echo "  4. Set up CloudWatch alarms"
echo "  5. Configure backup schedules"
echo ""
