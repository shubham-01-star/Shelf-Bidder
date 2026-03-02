# Shelf-Bidder Architecture

This document visualizes the high-level architecture and the data flow of the Shelf-Bidder Autonomous Retail Ad-Network using Mermaid.js diagrams.

## High-Level System Architecture

The following diagram illustrates the core components of the system: the Next.js Frontend (PWA), the AWS Serverless Backend (API Gateway, Lambda, DynamoDB, S3), the external AI/LLM integrations (Claude 3.5 Sonnet on Bedrock), and the Kiro Brand Agents.

```mermaid
graph TD
    %% Frontend Clients
    Shopkeeper[("Shopkeeper PWA\n(Next.js / Vercel)")]

    %% External AI & Agents
    Claude["Claude 3.5 Sonnet\n(AWS Bedrock / Vision)"]
    KiroAgent["Kiro Brand Agents\n(Coke, Pepsi, etc.)"]

    %% AWS Backend Infrastructure
    subgraph "AWS Cloud Infrastructure"
        APIGateway["Amazon API Gateway"]

        %% Microservices
        subgraph "Serverless Microservices (AWS Lambda)"
            AuthService["Auth & Session Service"]
            PhotoService["Photo & Vision Service"]
            AuctionEngine["Auction Engine Service"]
            TaskService["Task Orchestration Service"]
            WalletService["Wallet & Payout Service"]
        end

        %% Storage & State
        S3[("Amazon S3\n(Photo Storage)")]
        DynamoDB[("Amazon DynamoDB\n(NoSQL Main Database)")]
        StepFunctions[["AWS Step Functions\n(State Machine)"]]

        %% Notification Channels
        AmazonConnect(("Amazon Connect\n(Hindi Voice Calls)"))
        PushNotif(("Web Push\nNotifications"))
    end

    %% Connections
    Shopkeeper <-->|REST API / JWT| APIGateway
    Shopkeeper -->|Direct Upload| S3

    APIGateway --> AuthService
    APIGateway --> PhotoService
    APIGateway --> AuctionEngine
    APIGateway --> TaskService
    APIGateway --> WalletService

    PhotoService <-->|Prompt & Image| Claude
    PhotoService -->|Save Metadata| DynamoDB

    AuctionEngine <-->|Receive Bids| KiroAgent
    AuctionEngine -->|Save Auction/Bids| DynamoDB
    AuctionEngine -->|Trigger Workflow upon Win| StepFunctions

    StepFunctions -->|Wait for Execution| TaskService
    StepFunctions -->|Trigger Call| AmazonConnect
    StepFunctions -->|Trigger Push| PushNotif

    TaskService <-->|Verify Proof| Claude
    TaskService -->|Update State| DynamoDB

    WalletService -->|Update Balance| DynamoDB
```

---

## Detailed User Flow Diagram

This sequence diagram maps out the step-by-step API interactions during a typical daily lifecycle.

```mermaid
sequenceDiagram
    autonumber

    actor Shopkeeper
    participant Frontend as Next.js PWA
    participant Backend as API Gateway/Lambda
    participant S3 as Amazon S3
    participant Claude as Claude 3.5 (Bedrock)
    participant Dynamo as DynamoDB
    participant Agents as Kiro Brand Agents
    participant SF as AWS Step Functions
    participant Phone as AWS Connect (Call)

    %% Scan Phase
    Shopkeeper->>Frontend: Opens app & clicks "Scan Shelf"
    Frontend->>Backend: POST /api/photos/upload-url
    Backend-->>Frontend: Return Presigned S3 URL
    Frontend->>S3: PUT Image (Direct Upload)
    Frontend->>Backend: POST /api/photos/analyze (Image URL)
    Backend->>Claude: Analyze Image for Empty Spaces
    Claude-->>Backend: 2 Empty Spaces found

    %% Bidding Phase
    Backend->>Agents: Notify empty spaces & broadcast context
    Agents-->>Backend: Submit Bids (e.g., Coke bids ₹200)
    Backend->>Backend: Evaluate highest valid bid
    Backend->>Dynamo: Create Auction Winner & Assigned Task

    %% Orchestration Phase
    Backend->>SF: Start "DailyWorkflow" Execution
    Backend-->>Frontend: Return Success Status

    SF->>Phone: Make Voice Call (Hindi TTS)
    Phone-->>Shopkeeper: "Coke ne boli jeeti..."
    SF->>SF: Enter Wait State (waitForTaskToken)

    %% Execution Phase
    Shopkeeper->>Frontend: Places Coke & takes "Proof" photo
    Frontend->>Backend: POST /api/photos/upload-url
    Backend-->>Frontend: Return Presigned S3 URL
    Frontend->>S3: PUT Proof Image (Direct Upload)
    Frontend->>Backend: POST /api/tasks/verify
    Backend->>Claude: Verify Original vs Proof Image
    Claude-->>Backend: Verified (Score: 95)

    %% Resolution Phase
    Backend->>SF: SendTaskSuccess (with Token)
    SF->>Backend: Trigger Payout Lambda
    Backend->>Dynamo: Credit Wallet (₹200)
    Backend-->>Frontend: Verification Success!
```

---

## Technical Stack Overview

- **Frontend**: Next.js 14 App Router, TypeScript, TailwindCSS, Progressive Web App (PWA) with Service Workers & IndexedDB for offline capability.
- **Backend / API**: AWS API Gateway, AWS Lambda (Node.js/TypeScript).
- **Database**: Amazon DynamoDB (Single-Table Design).
- **Storage**: Amazon S3 (using pre-signed URLs to bypass Lambda payload limits).
- **AI / ML**: Amazon Bedrock accessing Anthropic Claude 3.5 Sonnet for multi-modal vision analysis.
- **Orchestration**: AWS Step Functions for managing long-running asynchronous workflows (Task assignment -> waiting for shopkeeper -> verification).
- **Communication**: Amazon Connect (Voice calls), Web Push API.
