# Requirements Document

## Introduction

Shelf-Bidder is an Autonomous Retail Ad-Network that transforms physical store shelves into digital advertising real estate through automated campaign matching. The system enables shopkeepers with low technical literacy to monetize empty shelf space by facilitating automated campaign matching where brands create campaigns that are automatically matched with suitable shelf spaces based on budget and location.

## Glossary

- **Shelf_Bidder_System**: The complete hybrid application including Next.js PWA, AWS EC2-hosted API server, and AWS services
- **Shopkeeper**: Store owner who uses the system to monetize shelf space (primary user: Ramesh)
- **Brand_Agent**: Kiro-powered autonomous agent representing brands in campaign creation
- **Campaign_Matcher**: EC2-hosted system that automatically matches campaigns with shelf spaces based on budget and location
- **Vision_Analyzer**: AWS Bedrock-powered AI with fallback configuration that analyzes shelf photos for empty space and stock
- **Task_Manager**: System component that guides users through product placement tasks
- **Proof_Verifier**: AI system that validates task completion through photos
- **Wallet_System**: PostgreSQL-based earnings tracking and display system with ACID transactions
- **Morning_Trigger**: Daily push notification system that initiates the workflow
- **Email_Notifier**: AWS Lambda + Cognito + SES system for email notifications
- **PostgreSQL_Database**: Primary database for all transactional data with ACID compliance, running as Docker container on EC2
- **EC2_Server**: AWS EC2 Free Tier instance (750 hrs/month free) hosting the Next.js API, PostgreSQL Docker container, and campaign matching logic
- **S3_Storage**: AWS S3 bucket (5GB free) for image storage with pre-signed URLs for direct upload
- **Bedrock_Fallback_Chain**: Multi-tier AI model configuration ensuring system resilience (Nova Pro → Nova Lite → Claude Haiku)

## Requirements

### Requirement 1: Morning Workflow Initiation

**User Story:** As a shopkeeper, I want to receive a morning notification to start my daily shelf optimization, so that I can consistently monetize my available shelf space.

#### Acceptance Criteria

1. WHEN it is 8:00 AM local time, THE Shelf_Bidder_System SHALL send a push notification to the shopkeeper
2. WHEN the shopkeeper opens the notification, THE Shelf_Bidder_System SHALL display the photo capture interface
3. WHEN the shopkeeper dismisses the notification, THE Shelf_Bidder_System SHALL allow manual access to photo capture within 4 hours
4. WHEN the shopkeeper has not responded by 12:00 PM, THE Shelf_Bidder_System SHALL send a gentle reminder notification

### Requirement 2: Shelf Space Analysis with S3 Direct Upload

**User Story:** As a shopkeeper, I want to easily photograph my shelves, so that the system can identify monetization opportunities without requiring technical knowledge.

#### Acceptance Criteria

1. WHEN the shopkeeper accesses photo capture, THE Shelf_Bidder_System SHALL display a simple camera interface with guidance overlay
2. WHEN a shelf photo is captured, THE EC2_Server SHALL generate a pre-signed S3 URL for direct upload
3. WHEN the photo is uploaded directly to S3_Storage, THE EC2_Server SHALL receive upload confirmation within 5 seconds
4. WHEN the photo is confirmed in S3, THE EC2_Server SHALL call AWS Bedrock for analysis within 30 seconds
5. WHEN analyzing the photo, THE Vision_Analyzer SHALL detect current product inventory and categorize items
6. WHEN empty space is detected, THE Vision_Analyzer SHALL calculate available dimensions and optimal product placement zones
7. WHEN analysis is complete, THE EC2_Server SHALL store results in PostgreSQL_Database with ACID transaction
8. WHEN no empty space is detected, THE Shelf_Bidder_System SHALL notify the shopkeeper and suggest trying again later
9. WHEN S3 storage approaches 5GB limit, THE EC2_Server SHALL apply lifecycle policies to archive old photos to Glacier

### Requirement 3: Automated Campaign Matching

**User Story:** As a shopkeeper, I want brands to automatically match their campaigns with my shelf space, so that I can earn revenue without managing complex negotiations.

#### Acceptance Criteria

1. WHEN shelf analysis is complete, THE Campaign_Matcher SHALL query active campaigns in PostgreSQL_Database
2. WHEN campaigns are found, THE Campaign_Matcher SHALL match based on budget availability and location proximity
3. WHEN a suitable campaign is matched, THE Campaign_Matcher SHALL deduct budget from campaign using ACID transaction
4. WHEN budget deduction succeeds, THE Campaign_Matcher SHALL create a task assignment for the shopkeeper
5. WHEN no suitable campaigns are found, THE Shelf_Bidder_System SHALL notify the shopkeeper and suggest retrying later
6. WHEN campaign matching fails, THE Campaign_Matcher SHALL rollback any partial transactions to maintain data consistency

### Requirement 4: Campaign Assignment and Email Notification

**User Story:** As a shopkeeper, I want to be clearly informed about campaign matches and what I need to do, so that I can complete tasks without confusion.

#### Acceptance Criteria

1. WHEN a campaign is matched successfully, THE EC2_Server SHALL trigger AWS Lambda for email notification
2. WHEN the Lambda function executes, THE Email_Notifier SHALL use Cognito and SES to send campaign details
3. WHEN the email is sent, THE Shelf_Bidder_System SHALL display the same information in the app
4. WHEN task details are delivered, THE Task_Manager SHALL provide step-by-step visual guidance for product placement
5. WHEN the shopkeeper confirms understanding, THE Task_Manager SHALL start the task completion timer
6. WHEN email delivery fails, THE Shelf_Bidder_System SHALL retry notification and log the failure in PostgreSQL_Database

### Requirement 5: Task Completion and Verification

**User Story:** As a shopkeeper, I want simple guidance to complete product placement tasks, so that I can earn money while ensuring brand requirements are met.

#### Acceptance Criteria

1. WHEN a task is active, THE Task_Manager SHALL display clear visual instructions with product placement requirements
2. WHEN the shopkeeper indicates task completion, THE Shelf_Bidder_System SHALL prompt for a proof photo
3. WHEN a proof photo is submitted, THE EC2_Server SHALL call AWS Bedrock for verification within 30 seconds
4. WHEN placement is verified as correct, THE Wallet_System SHALL credit earnings using ACID transaction in PostgreSQL_Database
5. WHEN placement is incorrect, THE Task_Manager SHALL provide specific feedback and allow retry
6. WHEN wallet credit succeeds, THE EC2_Server SHALL update shopkeeper balance atomically

### Requirement 6: ACID-Compliant Earnings Management

**User Story:** As a shopkeeper, I want to easily track my earnings with guaranteed data consistency, so that I can trust the system with my financial information.

#### Acceptance Criteria

1. WHEN earnings are credited, THE Wallet_System SHALL use PostgreSQL ACID transactions to ensure consistency
2. WHEN the shopkeeper accesses the wallet, THE EC2_Server SHALL query PostgreSQL_Database for current balance and transaction history
3. WHEN displaying earnings history, THE Wallet_System SHALL show transaction records with dates, amounts, and campaign details
4. WHEN the balance reaches withdrawal threshold, THE Wallet_System SHALL notify about payout options
5. WHEN payout is requested, THE Wallet_System SHALL initiate transfer using locked transaction to prevent double-spending
6. WHEN any wallet operation fails, THE PostgreSQL_Database SHALL rollback the transaction to maintain data integrity

### Requirement 7: Progressive Web Application with EC2 Backend

**User Story:** As a shopkeeper with limited smartphone storage, I want to use the system without installing a heavy app, so that I can access all features through my mobile browser with reliable backend support.

#### Acceptance Criteria

1. WHEN the shopkeeper visits the web URL, THE Shelf_Bidder_System SHALL load as a Progressive Web App
2. WHEN using the PWA, THE Shelf_Bidder_System SHALL communicate with EC2_Server for all API operations
3. WHEN the device is offline, THE Shelf_Bidder_System SHALL queue photos and sync when connection is restored
4. WHEN the shopkeeper adds to home screen, THE Shelf_Bidder_System SHALL function identically to a native app
5. WHEN using on low-end devices, THE Shelf_Bidder_System SHALL maintain responsive performance under 3G connections
6. WHEN API calls are made, THE EC2_Server SHALL handle all business logic and database operations

### Requirement 8: Low-Tech User Experience

**User Story:** As a shopkeeper with limited technical skills, I want the interface to be extremely simple and intuitive, so that I can use the system without assistance or training.

#### Acceptance Criteria

1. WHEN navigating the interface, THE Shelf_Bidder_System SHALL use large buttons and clear visual hierarchy
2. WHEN displaying instructions, THE Shelf_Bidder_System SHALL use simple language and visual icons
3. WHEN errors occur, THE Shelf_Bidder_System SHALL provide clear, actionable error messages in local language
4. WHEN the shopkeeper needs help, THE Shelf_Bidder_System SHALL provide voice-guided tutorials
5. WHEN completing any action, THE Shelf_Bidder_System SHALL provide immediate visual and audio feedback

### Requirement 9: PostgreSQL Data Persistence and ACID Compliance

**User Story:** As a shopkeeper, I want my data and earnings to be safely stored with guaranteed consistency, so that I never lose track of my business information or money.

#### Acceptance Criteria

1. WHEN any financial data is created or modified, THE PostgreSQL_Database SHALL use ACID transactions to ensure consistency
2. WHEN network connectivity is lost, THE EC2_Server SHALL maintain transaction integrity and retry failed operations
3. WHEN system errors occur, THE PostgreSQL_Database SHALL rollback incomplete transactions without data loss
4. WHEN the shopkeeper switches devices, THE EC2_Server SHALL provide access to all historical data from PostgreSQL_Database
5. WHEN concurrent operations occur, THE PostgreSQL_Database SHALL use row-level locking to prevent conflicts
6. WHEN campaign budget deduction and shopkeeper wallet credit occur, THE PostgreSQL_Database SHALL ensure both operations succeed or both fail atomically

### Requirement 10: Brand Agent Campaign Integration

**User Story:** As a brand representative, I want my autonomous agent to create and manage campaigns effectively, so that I can secure optimal product placement opportunities through automated matching.

#### Acceptance Criteria

1. WHEN Brand_Agents create campaigns, THE EC2_Server SHALL store campaign details in PostgreSQL_Database with budget allocation
2. WHEN campaigns are created, THE Campaign_Matcher SHALL validate agent credentials and campaign parameters
3. WHEN multiple campaigns match the same shelf space, THE Campaign_Matcher SHALL prioritize based on budget and location proximity
4. WHEN campaign budgets are depleted, THE EC2_Server SHALL automatically deactivate campaigns using ACID transactions
5. WHEN agents need performance data, THE EC2_Server SHALL provide historical campaign metrics from PostgreSQL_Database
6. WHEN campaign modifications are requested, THE PostgreSQL_Database SHALL ensure atomic updates to prevent inconsistent states

### Requirement 11: AWS Infrastructure Deployment and Cost Efficiency

**User Story:** As a system operator, I want the application deployed on AWS Free Tier resources, so that I can demonstrate production-ready infrastructure while minimizing costs during the hackathon phase.

#### Acceptance Criteria

1. WHEN deploying the application, THE Shelf_Bidder_System SHALL run on AWS EC2 Free Tier (t2.micro or t3.micro) with 750 hours per month free
2. WHEN PostgreSQL is needed, THE EC2_Server SHALL run PostgreSQL as a Docker container on the same EC2 instance for $0 additional cost
3. WHEN images are stored, THE Shelf_Bidder_System SHALL use S3_Storage with 5GB free tier allocation
4. WHEN photos are uploaded, THE EC2_Server SHALL generate pre-signed S3 URLs for direct client-to-S3 upload to minimize EC2 bandwidth
5. WHEN S3 storage approaches capacity, THE EC2_Server SHALL implement lifecycle policies to transition old photos to S3 Glacier
6. WHEN the system is idle, THE EC2_Server SHALL maintain PostgreSQL_Database availability without incurring RDS costs
7. WHEN calculating total infrastructure cost, THE Shelf_Bidder_System SHALL remain within AWS Free Tier limits for the first 12 months

### Requirement 12: AI-Powered Empty Space Detection (Load-Bearing AI)

**User Story:** As a shopkeeper, I want AI to automatically detect empty shelf space in my photos, so that I can monetize opportunities without manual measurement or technical knowledge.

#### Acceptance Criteria

1. WHEN a shelf photo is uploaded to S3, THE Vision_Analyzer SHALL use AWS Bedrock to analyze the image for empty space
2. WHEN analyzing photos, THE Vision_Analyzer SHALL detect product boundaries, empty zones, and shelf dimensions
3. WHEN empty space is identified, THE Vision_Analyzer SHALL calculate usable dimensions in centimeters for product placement
4. WHEN products are detected, THE Vision_Analyzer SHALL categorize product types to inform campaign matching
5. WHEN shelf analysis is complete, THE Vision_Analyzer SHALL return structured data including empty space coordinates and product inventory
6. WHEN no AI analysis is available, THE Shelf_Bidder_System SHALL fail gracefully and notify the shopkeeper that manual retry is needed
7. THE Vision_Analyzer SHALL be essential for business logic - empty space detection cannot function without AI analysis

### Requirement 13: Bedrock Multi-Model Fallback Configuration

**User Story:** As a system operator, I want automatic fallback between Bedrock models, so that the system remains operational even when the primary AI model is unavailable or rate-limited.

#### Acceptance Criteria

1. WHEN making AI analysis requests, THE Vision_Analyzer SHALL attempt to use amazon.nova-pro-v1:0 as the primary model
2. WHEN the primary model fails or returns an error, THE Bedrock_Fallback_Chain SHALL automatically retry with amazon.nova-lite-v1:0
3. WHEN the secondary model fails, THE Bedrock_Fallback_Chain SHALL automatically retry with anthropic.claude-3-haiku-20240307-v1:0
4. WHEN all three models fail, THE Vision_Analyzer SHALL log the failure and return a clear error message to the user
5. WHEN a fallback occurs, THE EC2_Server SHALL log the model used and reason for fallback in PostgreSQL_Database
6. WHEN the primary model recovers, THE Bedrock_Fallback_Chain SHALL automatically resume using amazon.nova-pro-v1:0
7. WHEN configuring fallback behavior, THE Vision_Analyzer SHALL implement exponential backoff between retry attempts (1s, 2s, 4s)
8. WHEN a model consistently fails, THE EC2_Server SHALL alert system operators after 10 consecutive failures