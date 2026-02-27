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
- AWS Account with CLI configured (for infrastructure deployment)
- AWS CDK CLI: `npm install -g aws-cdk`

### Installation

1. Install frontend dependencies:
```bash
npm install
```

2. Install infrastructure dependencies:
```bash
cd infrastructure
npm install
cd ..
```

### Infrastructure Setup

Before running the application, deploy the AWS infrastructure:

1. Deploy CDK stack:
```bash
cd infrastructure
npm run deploy
```

2. Export configuration:
```bash
./scripts/export-config.sh
cd ..
```

This creates a `.env.local` file with all necessary AWS resource identifiers.

See [infrastructure/DEPLOYMENT.md](infrastructure/DEPLOYMENT.md) for detailed deployment instructions.

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

## Project Structure

```
shelf-bidder/
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
│   ├── DEPLOYMENT.md     # Deployment guide
│   └── README.md         # Infrastructure documentation
├── public/               # Static assets
│   ├── manifest.json     # PWA manifest
│   └── icons/            # App icons
├── .kiro/                # Kiro specs
│   └── specs/
│       └── shelf-bidder/ # Feature specifications
└── package.json          # Dependencies
```

## AWS Infrastructure

The application uses the following AWS services:

- **DynamoDB**: Five tables for data persistence
  - Shopkeepers, ShelfSpaces, Auctions, Tasks, Transactions
- **S3**: Photo storage with lifecycle policies and cross-region replication
- **API Gateway**: RESTful API with CORS and authentication
- **Cognito**: User authentication for shopkeepers
- **Lambda**: Serverless functions (to be added)
- **Step Functions**: Workflow orchestration (to be added)
- **Bedrock**: Claude 3.5 for vision analysis (to be added)
- **Connect**: Voice notifications (to be added)

See [infrastructure/README.md](infrastructure/README.md) for detailed architecture documentation.

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa
- **Backend**: AWS Lambda, DynamoDB, S3, Step Functions
- **AI**: AWS Bedrock (Claude 3.5 Sonnet)
- **Voice**: AWS Connect

## License

Private - All rights reserved
