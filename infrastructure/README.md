# Shelf-Bidder Infrastructure

This directory now drives the EC2-based production deployment for Shelf-Bidder.

You do not need a globally installed `cdk` CLI. The scripts in this folder install local dependencies and run `npx cdk ...`.

## Production Shape

- `ShelfBidderStack` provisions one EC2 instance, an Elastic IP, security group rules for `22/80/443`, an IAM role for S3/Bedrock/Connect/SES, and two S3 buckets:
  - photo storage bucket
  - PostgreSQL backup bucket
- The app itself runs on that EC2 host with Docker Compose:
  - `app` (Next.js standalone)
  - `postgres`
  - `nginx`
  - `certbot` (manual profile)

## Main Files

- `lib/shelf-bidder-stack.ts`: production EC2 + bucket stack
- `scripts/deploy-production.sh`: deploys the CDK production stack
- `scripts/export-config.sh`: generates a starter `.env.ec2`
- `scripts/deploy-ec2.sh`: bootstraps Docker and tools on the EC2 host
- `scripts/first-deploy-ec2.sh`: first app deploy with HTTP bootstrap and Let's Encrypt issuance
- `scripts/renew-certificates.sh`: renewal hook for host cron
- `scripts/backup-postgres-to-s3.sh`: nightly backup hook for host cron
- `scripts/restore-postgres-from-backup.sh`: restore helper for backup verification
- `nginx/default.http.conf.template`: bootstrap HTTP-only Nginx config
- `nginx/default.https.conf.template`: final HTTPS reverse-proxy config

## Deploy Order

1. From your workstation:
   `cd infrastructure && ./scripts/deploy-production.sh`
2. Connect to the EC2 instance with SSM Session Manager or SSH.
3. On the EC2 instance:
   `./infrastructure/scripts/deploy-ec2.sh <repo-url>`
4. Edit `/opt/shelfbidder/.env.ec2`.
5. Run:
   `./infrastructure/scripts/first-deploy-ec2.sh`
6. Add host cron jobs:
   - `0 3 * * * cd /opt/shelfbidder && ./infrastructure/scripts/renew-certificates.sh`
   - `30 3 * * * cd /opt/shelfbidder && ./infrastructure/scripts/backup-postgres-to-s3.sh`

## Backup And Restore

Nightly backups are plain `pg_dump` archives gzipped locally and uploaded to the backup S3 bucket defined by `S3_BACKUP_URI`.

Manual backup:

```bash
cd /opt/shelfbidder
./infrastructure/scripts/backup-postgres-to-s3.sh
```

Restore from a local archive:

```bash
cd /opt/shelfbidder
./infrastructure/scripts/restore-postgres-from-backup.sh ./backups/postgres-shelfbidder-YYYYMMDDTHHMMSSZ.sql.gz
```

Restore from S3:

```bash
cd /opt/shelfbidder
./infrastructure/scripts/restore-postgres-from-backup.sh s3://your-backup-bucket/postgres/postgres-shelfbidder-YYYYMMDDTHHMMSSZ.sql.gz
```

Run one restore drill on a non-critical environment before public launch.
