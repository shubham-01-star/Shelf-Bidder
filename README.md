# Shelf-Bidder

Autonomous Retail Ad-Network that transforms physical store shelves into digital advertising real estate through automated bidding.

## Features

- **Progressive Web App (PWA)**: Installable, offline-capable, native app-like experience
- **Next.js 14**: Built with App Router and TypeScript
- **Mobile-First Design**: Optimized for low-end devices and 3G connections
- **Service Worker**: Automatic caching and offline functionality

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop / Docker Engine for local DB or container runs
- AWS account only if you want S3 / Bedrock / Connect features or EC2 deployment

### Installation

1. Install dependencies:
```bash
npm install
```

2. For local testing, create env file:
```bash
cp .env.example .env.local
```

### Which Env File To Edit

- Local app / local DB: copy `.env.example` to `.env.local`, then edit `.env.local`
- EC2 Docker production: create `.env.ec2` on the server from `.env.ec2.example`, then edit `.env.ec2`
- Only these two runtime env files matter now: `.env.local` and `.env.ec2`
- Old files like `.env.docker`, `.env.local.example`, and `.env.production.example` have been removed
- Cognito env vars are not part of the active app runtime anymore

### Local Run

```bash
npm run db:setup
npm run dev
```

### Local Docker Flow

```bash
npm run docker:up
```

This local Docker path now:
- starts PostgreSQL
- syncs the schema with Prisma
- builds and starts the app container
- reads AWS credentials from your host `~/.aws` for local S3/Bedrock tests

With the current `.env.local`, use:
- app: `http://localhost:3002`
- optional Nginx proxy: `npm run docker:proxy:up`, then `http://localhost:8088`

If you use a non-default AWS profile, export it before startup:

```bash
export AWS_PROFILE=your-profile
npm run docker:up
```

### EC2 Docker Deploy

Production deploy uses the existing `infrastructure/` folder and does not require a globally installed CDK CLI.

```bash
cd infrastructure
./scripts/deploy-production.sh
```

That script installs local infra dependencies and runs `npx cdk ...` internally.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

```bash
npm run build
npm start
```

### Linting and Formatting

```bash
npm run lint
npm run format
```

### Database Test Setup

```bash
npm run db:setup
npm run db:test
```

Or run the full database setup + verification in one command:

```bash
npm run test:db
```

For the broader Jest suite after DB setup:

```bash
npm run test:local
```

## Project Structure

```
shelf-bidder/
├── postman/              # API collections
├── scripts/              # Database helpers
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript type definitions
├── infrastructure/       # AWS CDK infrastructure code
│   ├── bin/              # CDK app entry point
│   ├── lib/              # CDK stack definitions
│   ├── scripts/          # Deployment scripts
│   └── README.md         # Infrastructure documentation
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   └── icons/            # App icons
└── package.json          # Dependencies
```

## AWS Usage

Current live path uses:

- **EC2**: Docker host for app + postgres + nginx
- **S3**: photo storage and database backup storage
- **Bedrock**: optional vision analysis
- **Connect**: optional voice notifications

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **Backend**: Next.js API routes, PostgreSQL, Docker, Nginx
- **AI**: AWS Bedrock
- **Voice**: AWS Connect

## License

Private - All rights reserved
