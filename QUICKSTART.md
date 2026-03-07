# 🚀 Shelf-Bidder Quick Start with Docker

Complete setup in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

This will install:
- ✅ PostgreSQL client (`pg`)
- ✅ All existing dependencies

## Step 2: Start Docker Services

```bash
# Start PostgreSQL + pgAdmin
npm run docker:up

# Check if running
docker ps
```

You should see:
- `shelfbidder-postgres` running on port 5432
- `shelfbidder-pgadmin` running on port 5050

## Step 3: Migrate Shopkeeper Data

```bash
# Migrate existing shopkeepers from DynamoDB to PostgreSQL
npm run migrate:dynamodb
```

Expected output:
```
🚀 Starting DynamoDB to PostgreSQL migration...
✅ Connected to PostgreSQL
📥 Fetching shopkeepers from DynamoDB...
✅ Fetched 5 shopkeepers
📤 Inserting shopkeepers into PostgreSQL...
✅ Inserted: Ramesh Kumar (sk-12345)
✅ Migration completed successfully!
```

## Step 4: Verify Setup

```bash
# Connect to PostgreSQL
npm run db:connect

# Inside PostgreSQL shell, run:
SELECT shopkeeper_id, name, phone_number, wallet_balance FROM shopkeepers;

# Exit with \q
```

## Step 5: Start Development Server

```bash
# Update .env.local to use Docker PostgreSQL
# (Already configured in .env.local)

# Start Next.js
npm run dev
```

Open http://localhost:3000

## 🎉 Done!

Your setup is complete:
- ✅ PostgreSQL running in Docker
- ✅ Shopkeeper data migrated
- ✅ Database schema with ACID support
- ✅ Next.js app connected to PostgreSQL

## Next Steps

1. **View Database**: Open http://localhost:5050 (pgAdmin)
   - Email: `admin@shelfbidder.com`
   - Password: `admin`

2. **Check Logs**: `npm run docker:logs`

3. **Reset Database**: `npm run docker:reset` (⚠️ deletes all data)

## Useful Commands

```bash
# Docker
npm run docker:up        # Start services
npm run docker:down      # Stop services
npm run docker:logs      # View logs
npm run docker:reset     # Reset everything

# Database
npm run db:connect       # Connect to PostgreSQL
npm run migrate:dynamodb # Migrate from DynamoDB

# Development
npm run dev              # Start Next.js
npm run test             # Run tests
```

## Troubleshooting

### Port 5432 already in use?
```bash
# Stop existing PostgreSQL
sudo service postgresql stop  # Linux
brew services stop postgresql # Mac

# Or change port in docker-compose.yml
```

### Migration fails?
```bash
# Check DynamoDB credentials
echo $AWS_ACCESS_KEY_ID

# Check table name
echo $DYNAMODB_TABLE_SHOPKEEPERS

# Verify .env.local has correct values
```

### Can't connect to database?
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check logs
npm run docker:logs
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Docker Environment              │
├─────────────────────────────────────────┤
│                                          │
│  PostgreSQL (5432) ◄─── Next.js (3000) │
│       ▲                                  │
│       │                                  │
│  pgAdmin (5050)                         │
│                                          │
└─────────────────────────────────────────┘
         │
         │ AWS Services
         │
         ├─► S3 (Photos)
         ├─► Bedrock (AI)
         ├─► Cognito (Auth)
         └─► SES (Email)
```

## What's Next?

Now that your database is set up, you can:

1. ✅ Create campaign endpoints
2. ✅ Implement campaign matching logic
3. ✅ Update frontend for campaigns
4. ✅ Test ACID transactions

See `DOCKER_SETUP.md` for detailed documentation.
