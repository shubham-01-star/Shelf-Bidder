#!/bin/bash
set -euo pipefail

STACK_NAME="${1:-ShelfBidderStack}"
DEFAULT_ENV_FILE="../.env.ec2"
GENERATED_ENV_FILE="../.env.ec2.generated"

echo "Fetching stack outputs from $STACK_NAME..."

if [ -f "$DEFAULT_ENV_FILE" ]; then
    ENV_FILE="$GENERATED_ENV_FILE"
    echo "Existing $DEFAULT_ENV_FILE detected; writing generated values to $ENV_FILE instead."
else
    ENV_FILE="$DEFAULT_ENV_FILE"
fi

REGION=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='Region'].OutputValue" --output text)
PHOTO_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='PhotoBucketName'].OutputValue" --output text)
BACKUP_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='BackupBucketName'].OutputValue" --output text)
EC2_PUBLIC_IP=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='EC2PublicIP'].OutputValue" --output text)
EC2_INSTANCE_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query "Stacks[0].Outputs[?OutputKey=='EC2InstanceId'].OutputValue" --output text)

cat > "$ENV_FILE" << EOF
# Auto-generated from AWS CDK stack outputs
# Review and replace placeholder values before using in production.

DOMAIN_NAME=replace-me.example.com
LETSENCRYPT_EMAIL=ops@example.com
NEXT_PUBLIC_APP_URL=https://replace-me.example.com
NEXT_PUBLIC_API_URL=https://replace-me.example.com/api
NGINX_TEMPLATE_PATH=./infrastructure/nginx/default.https.conf.template

NODE_ENV=production
PORT=3000

DB_HOST=postgres
DB_PORT=5432
DB_NAME=shelfbidder
DB_USER=postgres
DB_PASSWORD=change_this_postgres_password
DB_SSL=false
DATABASE_URL=postgresql://postgres:change_this_postgres_password@postgres:5432/shelfbidder

AUTH_JWT_SECRET=replace_with_a_long_random_access_secret
AUTH_REFRESH_SECRET=replace_with_a_long_random_refresh_secret
CRON_SECRET=replace_with_a_long_random_cron_secret

AWS_REGION=$REGION
BEDROCK_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
PHOTO_BUCKET_NAME=$PHOTO_BUCKET
S3_BUCKET_PHOTOS=$PHOTO_BUCKET
S3_BACKUP_URI=s3://$BACKUP_BUCKET/postgres
CONNECT_INSTANCE_ID=
CONNECT_CONTACT_FLOW_ID=
CONNECT_SOURCE_PHONE_NUMBER=
RESEND_API_KEY=
SENDER_EMAIL=noreply@example.com

NEXT_PUBLIC_AWS_REGION=$REGION
NEXT_PUBLIC_PHOTO_BUCKET=$PHOTO_BUCKET
NEXT_PUBLIC_PHOTO_BUCKET_NAME=$PHOTO_BUCKET
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
EOF

echo "Created $ENV_FILE"
echo "EC2 Instance ID: $EC2_INSTANCE_ID"
echo "EC2 Elastic IP: $EC2_PUBLIC_IP"
echo "Photo Bucket: $PHOTO_BUCKET"
echo "Backup Bucket: $BACKUP_BUCKET"
