#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Starting ShelfBidder production infrastructure deployment..."

if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "AWS credentials are not configured."
    exit 1
fi

cd "$INFRA_DIR"

if [ ! -d node_modules ]; then
    npm install
fi

npx cdk synth ShelfBidderStack
npx cdk diff ShelfBidderStack || true
npx cdk deploy ShelfBidderStack --require-approval never --outputs-file outputs.json

"$SCRIPT_DIR/export-config.sh" ShelfBidderStack

EC2_INSTANCE_ID=$(jq -r '.ShelfBidderStack.EC2InstanceId // empty' outputs.json)
EC2_PUBLIC_IP=$(jq -r '.ShelfBidderStack.EC2PublicIP // empty' outputs.json)
PHOTO_BUCKET=$(jq -r '.ShelfBidderStack.PhotoBucketName // empty' outputs.json)
BACKUP_BUCKET=$(jq -r '.ShelfBidderStack.BackupBucketName // empty' outputs.json)

echo ""
echo "Production infrastructure deployed."
echo "EC2 Instance ID: $EC2_INSTANCE_ID"
echo "EC2 Elastic IP: $EC2_PUBLIC_IP"
echo "Photo Bucket: $PHOTO_BUCKET"
echo "Backup Bucket: $BACKUP_BUCKET"
echo ""
echo "Next steps:"
echo "1. Connect to the EC2 instance with SSM Session Manager or SSH"
echo "2. Run infrastructure/scripts/deploy-ec2.sh <repo-url> on the instance"
echo "3. Review and edit .env.ec2 on the instance"
echo "4. Run infrastructure/scripts/first-deploy-ec2.sh on the instance"
echo "5. Install host cron entries for renew-certificates.sh and backup-postgres-to-s3.sh"
echo ""
echo "If .env.ec2 already existed, stack-generated values were written to .env.ec2.generated."
echo "Merge bucket/region outputs from that file into your real .env.ec2 before deploying the app."
