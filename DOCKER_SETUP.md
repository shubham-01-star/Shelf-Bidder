# Shelf-Bidder Docker Setup Guide

Complete guide to run Shelf-Bidder with PostgreSQL using Docker.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed (comes with Docker Desktop)
- Node.js 20+ (for running migration scripts)

## Quick Start

### 1. Start Docker Services

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Check if services are running
docker-compose ps
```

You should see:
- `shelfbidder-postgres` - PostgreSQL database (port 5432)
- `shelfbidder-pgadmin` - Database management UI (port 5050)

### 2. Verify PostgreSQL is Running

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Connect to PostgreSQL
docker exec -it shelfbidder-postgres psql -U postgres -d shelfbidder
```

Inside PostgreSQL shell:
```sql
-- List all tables
\dt

-- Check shopkeepers table structure
\d shopkeepers

-- Exit
\q
```

### 3. Migrate Existing Shopkeeper Data from DynamoDB

```bash
# Install pg library if not already installed
npm install pg

# Run migration script
node scripts/migrate-dynamodb-to-postgres.js
```

Expected output:
```
🚀 Starting DynamoDB to PostgreSQL migration...
🔌 Connecting to PostgreSQL...
✅ Connected to PostgreSQL
📥 Fetching shopkeepers from DynamoDB...
✅ Fetched 5 shopkeepers from DynamoDB
📤 Inserting shopkeepers into PostgreSQL...
✅ Inserted: Ramesh Kumar (sk-12345)
✅ Migration completed successfully!
```

### 4. Verify Migration

```bash
# Connect to PostgreSQL
docker exec -it shelfbidder-postgres psql -U postgres -d shelfbidder

# Check migrated data
SELECT shopkeeper_id, name, phone_number, wallet_balance FROM shopkeepers;
```

### 5. Start Next.js App (Optional - Docker)

```bash
# Build and start the app container
docker-compose up app

# Or run locally with Docker PostgreSQL
npm run dev
```

## Database Management

### Using pgAdmin (Web UI)

1. Open browser: http://localhost:5050
2. Login:
   - Email: `admin@shelfbidder.com`
   - Password: `admin`
3. Add Server:
   - Name: `Shelf-Bidder Local`
   - Host: `postgres` (Docker network name)
   - Port: `5432`
   - Database: `shelfbidder`
   - Username: `postgres`
   - Password: `postgres_dev_password`

### Using psql (Command Line)

```bash
# Connect to database
docker exec -it shelfbidder-postgres psql -U postgres -d shelfbidder

# Common queries
SELECT COUNT(*) FROM shopkeepers;
SELECT COUNT(*) FROM campaigns;
SELECT COUNT(*) FROM tasks;

# View active campaigns
SELECT * FROM active_campaigns;

# View shopkeeper dashboard
SELECT * FROM shopkeeper_dashboard WHERE shopkeeper_id = 'sk-12345';
```

## Environment Variables

### For Docker (`.env.docker`)
Used by Docker containers - PostgreSQL connection points to `postgres` service.

### For Local Development (`.env.local`)
Used when running Next.js locally - PostgreSQL connection points to `localhost:5432`.

## Common Commands

### Docker Compose

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# View logs
docker-compose logs -f postgres
docker-compose logs -f app

# Restart services
docker-compose restart
```

### Database Operations

```bash
# Backup database
docker exec shelfbidder-postgres pg_dump -U postgres shelfbidder > backup.sql

# Restore database
docker exec -i shelfbidder-postgres psql -U postgres shelfbidder < backup.sql

# Reset database (⚠️ deletes all data)
docker exec -it shelfbidder-postgres psql -U postgres -c "DROP DATABASE shelfbidder;"
docker exec -it shelfbidder-postgres psql -U postgres -c "CREATE DATABASE shelfbidder;"
docker-compose restart postgres
```

## Troubleshooting

### PostgreSQL won't start

```bash
# Check logs
docker-compose logs postgres

# Remove old volumes and restart
docker-compose down -v
docker-compose up -d postgres
```

### Migration fails

```bash
# Check DynamoDB credentials in .env.local
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY

# Check DynamoDB table name
echo $DYNAMODB_TABLE_SHOPKEEPERS

# Test DynamoDB connection
node check-db-entry.js
```

### Can't connect to PostgreSQL from local app

```bash
# Make sure PostgreSQL is running
docker-compose ps

# Check if port 5432 is available
netstat -an | grep 5432

# Update .env.local to use localhost
DB_HOST=localhost
DB_PORT=5432
```

### pgAdmin can't connect

```bash
# Make sure you're using the Docker network name
Host: postgres (not localhost)

# Check if services are on same network
docker network inspect shelfbidder_shelfbidder-network
```

## Next Steps

After successful setup:

1. ✅ PostgreSQL running in Docker
2. ✅ Shopkeeper data migrated from DynamoDB
3. ✅ Database schema created with ACID support
4. 🔄 Update API endpoints to use PostgreSQL
5. 🔄 Implement campaign matching system
6. 🔄 Update frontend for campaign workflow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Environment                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  PostgreSQL  │◄────────│   pgAdmin    │                 │
│  │   (5432)     │         │    (5050)    │                 │
│  └──────▲───────┘         └──────────────┘                 │
│         │                                                    │
│         │                                                    │
│  ┌──────┴───────┐                                          │
│  │  Next.js App │                                          │
│  │   (3000)     │                                          │
│  └──────────────┘                                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │
         │ AWS Services (External)
         │
         ├─► S3 (Photo Storage)
         ├─► Bedrock (Vision AI)
         ├─► Cognito (Auth)
         └─► SES (Email)
```

## Database Schema

See `database/init/01-schema.sql` for complete schema with:
- ✅ ACID-compliant transactions
- ✅ Row-level locking support
- ✅ Proper indexes for performance
- ✅ Foreign key constraints
- ✅ Check constraints for data integrity
- ✅ Triggers for automatic timestamp updates
- ✅ Views for common queries

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify environment variables
3. Check database connection
4. Review migration output
