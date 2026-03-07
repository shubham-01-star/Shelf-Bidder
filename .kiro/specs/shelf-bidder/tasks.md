# Implementation Plan: Shelf-Bidder

## Overview

This implementation plan breaks down the Shelf-Bidder Autonomous Retail Ad-Network into discrete coding tasks. The system consists of a Next.js PWA frontend, AWS EC2-hosted API server with PostgreSQL Docker container, and AWS services for vision analysis (Bedrock multi-model fallback), storage (S3 direct upload), and email notifications (Lambda). Tasks are organized to build incrementally, with early validation through testing and checkpoints.

## Tasks

- [ ] 1. Project Setup and Hybrid Infrastructure
  - [x] 1.1 Initialize Next.js PWA project with TypeScript
    - Set up Next.js 14 with App Router and TypeScript configuration
    - Configure PWA capabilities with service worker
    - Set up ESLint, Prettier, and basic project structure
    - _Requirements: 7.1, 7.2_

  - [x] 1.2 Configure EC2 Free Tier infrastructure and PostgreSQL Docker container
    - Set up AWS EC2 Free Tier instance (t2.micro or t3.micro) with Node.js
    - Deploy PostgreSQL 15 as Docker container on EC2 instance
    - Create PostgreSQL database schema with ACID-compliant tables
    - Configure connection pooling for local Docker container connection
    - Set up proper indexing for performance optimization
    - Configure Docker volumes for data persistence with EBS storage
    - _Requirements: 9.1, 9.5, 9.6, 11.1, 11.2, 11.6_

  - [x] 1.3 Set up authentication and security
    - Implement JWT-based authentication in EC2 API
    - Configure refresh token rotation and security
    - Set up API rate limiting and CORS policies
    - Implement Frontend Auth UI (/signin, /signup, /verify)
    - _Requirements: 9.1_

  - [ ]\* 1.4 Write property test for PostgreSQL Docker data integrity
    - **Property 9: PostgreSQL Data Integrity**
    - **Validates: Requirements 9.1, 9.3, 9.5, 9.6, 11.2**

- [ ] 2. Core Data Models and PostgreSQL Layer
  - [x] 2.1 Implement TypeScript interfaces and data models
    - Create Shopkeeper, ShelfSpace, Campaign, Task, and WalletTransaction interfaces
    - Implement data validation schemas using Zod
    - Create PostgreSQL entity mappers and query builders
    - _Requirements: 9.1, 9.4_

  - [x] 2.2 Implement PostgreSQL operations layer
    - Create CRUD operations for all entities with ACID transactions
    - Implement complex queries for campaign matching
    - Add connection pooling and retry logic
    - Implement row-level locking for concurrent operations
    - _Requirements: 9.1, 9.2, 9.5, 9.6_

  - [ ]\* 2.3 Write property tests for ACID transaction consistency
    - **Property 8: ACID Transaction Consistency for Earnings**
    - **Validates: Requirements 5.4, 5.6, 6.1, 6.6**

  - [ ]\* 2.4 Write unit tests for database operations
    - Test CRUD operations with PostgreSQL test containers
    - Test ACID transaction scenarios and rollbacks
    - Test concurrent access and locking mechanisms
    - _Requirements: 9.1, 9.2, 9.5, 9.6_

- [x] 3. Checkpoint - Core Infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Photo Processing and Vision Analysis
  - [x] 4.1 Implement S3 direct upload system with pre-signed URLs
    - Create EC2 API endpoint for pre-signed S3 URL generation (5-minute expiration)
    - Implement frontend direct upload to S3 bypassing EC2 bandwidth
    - Add photo metadata extraction and storage in PostgreSQL Docker container
    - Configure S3 lifecycle policies for automatic Glacier transition (photos >30 days)
    - Implement S3 storage monitoring to detect when approaching 5GB Free Tier limit
    - _Requirements: 2.2, 2.9, 11.3, 11.4, 11.5_

  - [x] 4.2 Implement AWS Bedrock multi-model fallback chain
    - Create EC2 service for Bedrock API calls with fallback configuration
    - Implement primary model: amazon.nova-pro-v1:0 for shelf space analysis
    - Implement secondary fallback: amazon.nova-lite-v1:0 with 1s exponential backoff
    - Implement tertiary fallback: anthropic.claude-3-haiku-20240307-v1:0 with 2s backoff
    - Add structured prompts for empty space detection and product categorization
    - Parse vision analysis results into EmptySpace objects with confidence scoring
    - Implement comprehensive error handling for all three models
    - Add bedrock_usage_logs table logging for all model attempts and failures
    - Implement operator alerting system after 10 consecutive failures within 1 hour
    - _Requirements: 2.3, 2.4, 12.1, 12.2, 12.3, 12.6, 12.7, 13.1, 13.2, 13.3, 13.4, 13.5, 13.7, 13.8_

  - [x] 4.3 Implement proof verification system with Bedrock fallback
    - Create before/after photo comparison using Bedrock multi-model fallback chain
    - Implement placement verification logic from EC2 API
    - Add feedback generation for incorrect placements
    - Store verification results in PostgreSQL Docker container
    - _Requirements: 5.3, 5.6, 13.1, 13.2, 13.3_

  - [ ]\* 4.4 Write property test for S3 direct upload workflow with pre-signed URLs
    - **Property 3: S3 Direct Upload Workflow**
    - **Validates: Requirements 2.2, 2.3, 11.4_

  - [ ]\* 4.5 Write property test for Bedrock multi-model fallback chain
    - **Property 7: Bedrock Multi-Model Fallback Chain**
    - **Validates: Requirements 2.4, 5.3, 13.1, 13.2, 13.3, 13.7**

  - [ ]\* 4.6 Write property test for photo analysis performance
    - **Property 2: Photo Analysis Performance**
    - **Validates: Requirements 2.3, 5.3**

  - [ ]\* 4.7 Write unit tests for vision analysis and fallback behavior
    - Test pre-signed URL generation with 5-minute expiration
    - Test Bedrock multi-model fallback chain (Nova Pro → Nova Lite → Claude Haiku)
    - Test exponential backoff timing (1s, 2s, 4s)
    - Test proof verification with sample images
    - Test bedrock_usage_logs table logging for all model attempts
    - Test operator alerting after 10 consecutive failures
    - _Requirements: 2.2, 2.3, 5.3, 13.1, 13.2, 13.3, 13.4, 13.5, 13.8_

  - [ ]\* 4.8 Write property test for Bedrock fallback logging and alerting
    - **Property 16: Bedrock Fallback Logging and Alerting**
    - **Validates: Requirements 13.4, 13.5, 13.8**

  - [ ]\* 4.9 Write property test for S3 storage lifecycle management
    - **Property 17: S3 Storage Lifecycle Management**
    - **Validates: Requirements 2.9, 11.5**

  - [ ]\* 4.10 Write property test for AI load-bearing business logic
    - **Property 18: AI Load-Bearing Business Logic**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.6, 12.7**

- [x] 5. Campaign Matching Engine and EC2 API
  - [x] 5.1 Implement campaign matching system
    - Create campaign matching algorithm based on budget and location
    - Implement PostgreSQL Docker container queries for active campaign retrieval
    - Add campaign prioritization logic (budget, distance, age)
    - Create ACID transaction for budget deduction and task creation
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [x] 5.2 Create EC2 API endpoints for campaign management
    - Implement campaign creation and management endpoints
    - Create campaign matching trigger after photo analysis
    - Add campaign status management and budget tracking
    - Implement task assignment workflow
    - _Requirements: 3.1, 4.3, 4.4, 4.5_

  - [x] 5.3 Implement Brand Agent integration
    - Create API endpoints for campaign creation by agents
    - Implement agent authentication and validation
    - Add campaign performance metrics and reporting
    - Create campaign modification and deactivation endpoints
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.6_

  - [ ]\* 5.4 Write property test for campaign matching and budget deduction
    - **Property 4: Campaign Matching and Budget Deduction**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.6**

  - [ ]\* 5.5 Write property test for campaign budget management
    - **Property 11: Campaign Budget Management**
    - **Validates: Requirements 10.1, 10.2, 10.4, 10.6**

  - [ ]\* 5.6 Write unit tests for campaign matching
    - Test campaign matching algorithm with various scenarios
    - Test ACID transaction rollback scenarios
    - Test concurrent campaign access and locking
    - _Requirements: 3.1, 3.2, 3.6_

- [ ] 6. Checkpoint - EC2 Backend Core Services
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Push Notifications and Email System
  - [x] 7.1 Implement push notification system
    - Set up web push notifications in PWA
    - Create EC2 API endpoint for notification scheduling
    - Implement morning and reminder notification logic
    - _Requirements: 1.1, 1.3, 1.4_

  - [ ] 7.2 Implement AWS Lambda email notification system
    - Create Lambda function for email notifications
    - Configure AWS Cognito and SES integration
    - Implement email templates for campaign assignments
    - Add email delivery status tracking and retry logic
    - _Requirements: 4.1, 4.2, 4.6_

  - [ ]\* 7.3 Write property test for morning notification timing
    - **Property 1: Morning Notification Timing**
    - **Validates: Requirements 1.1, 1.4**

  - [ ]\* 7.4 Write property test for email notification delivery
    - **Property 5: Email Notification Delivery**
    - **Validates: Requirements 4.1, 4.2, 4.6**

  - [ ]\* 7.5 Write unit tests for notification systems
    - Test push notification delivery
    - Test email notification scenarios and fallbacks
    - Test notification scheduling edge cases
    - _Requirements: 1.1, 4.1, 4.2_

- [x] 8. Frontend PWA Implementation
  - [x] 8.1 Implement camera interface and photo capture
    - Create camera component with guidance overlay
    - Implement photo capture with compression
    - Add offline photo queuing functionality
    - Integrate with EC2 API for pre-signed S3 URL workflow
    - _Requirements: 2.1, 7.3, 11.4_

  - [x] 8.2 Implement dashboard and earnings display
    - Create main dashboard with earnings overview
    - Implement wallet interface with transaction history
    - Add daily and weekly earnings summaries
    - Connect to EC2 API for PostgreSQL Docker container data retrieval
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 8.3 Implement task management interface
    - Create task display with visual instructions
    - Implement step-by-step guidance system
    - Add proof photo capture and submission
    - Integrate with EC2 API for task management
    - _Requirements: 4.4, 5.1, 5.2_

  - [x] 8.4 Implement PWA offline capabilities and EC2 integration
    - Configure service worker for offline functionality
    - Implement background sync for photo uploads
    - Add offline data caching and sync with EC2 API
    - _Requirements: 7.2, 7.3, 7.5, 7.6_

  - [ ]\* 8.5 Write property test for PWA offline functionality
    - **Property 14: PWA Offline Functionality**
    - **Validates: Requirements 7.1, 7.3, 7.4, 7.5**

  - [ ]\* 8.6 Write property test for EC2 API server reliability
    - **Property 10: EC2 API Server Reliability**
    - **Validates: Requirements 7.2, 7.6, 9.2, 11.1, 11.2**

  - [ ]\* 8.7 Write property test for user interface consistency
    - **Property 12: User Interface Consistency**
    - **Validates: Requirements 8.1, 8.2, 8.5**

  - [ ]\* 8.8 Write unit tests for frontend components
    - Test camera interface functionality
    - Test offline queuing and sync
    - Test task interface interactions
    - _Requirements: 2.1, 7.3, 5.1_

- [ ] 9. Wallet System and ACID-Compliant Earnings Management
  - [x] 9.1 Implement ACID-compliant wallet transaction processing
    - Create earnings crediting system with PostgreSQL Docker container transactions
    - Implement atomic balance calculation and updates
    - Add transaction history management with referential integrity
    - Implement concurrent transaction handling with row-level locking
    - _Requirements: 5.4, 5.6, 6.1, 6.6, 11.2_

  - [x] 9.2 Implement payout system with transaction safety
    - Create payout threshold detection
    - Implement payout request processing with locked transactions
    - Add payout status tracking and rollback mechanisms
    - _Requirements: 6.4, 6.5_

  - [ ]\* 9.3 Write property test for ACID transaction consistency
    - **Property 8: ACID Transaction Consistency for Earnings**
    - **Validates: Requirements 5.4, 5.6, 6.1, 6.6**

  - [ ]\* 9.4 Write property test for wallet balance and transaction history
    - **Property 15: Wallet Balance and Transaction History**
    - **Validates: Requirements 6.2, 6.3, 6.4, 6.5**

  - [ ]\* 9.5 Write unit tests for wallet operations
    - Test earnings calculation edge cases
    - Test ACID transaction rollback scenarios
    - Test concurrent wallet access and locking
    - _Requirements: 6.1, 6.2, 6.4, 6.6_

- [ ] 10. Task Assignment and Verification Workflow
  - [x] 10.1 Implement task assignment system
    - Create task creation from campaign matching results
    - Implement task status tracking in PostgreSQL Docker container
    - Add task timeout and reminder logic
    - _Requirements: 4.4, 4.5, 5.1_

  - [x] 10.2 Implement task completion verification with Bedrock fallback
    - Create proof photo validation workflow using Bedrock multi-model fallback chain
    - Implement feedback system for incorrect placements
    - Add retry mechanism for failed verifications
    - Store verification results with ACID transactions in PostgreSQL Docker container
    - _Requirements: 5.2, 5.3, 5.5, 5.6, 13.1, 13.2, 13.3_

  - [ ]\* 10.3 Write property test for task assignment workflow
    - **Property 6: Task Assignment Workflow**
    - **Validates: Requirements 4.3, 4.4, 4.5**

  - [ ]\* 10.4 Write unit tests for task verification
    - Test proof photo validation scenarios
    - Test feedback generation accuracy
    - Test retry mechanism functionality
    - _Requirements: 5.2, 5.3, 5.5_

- [ ] 11. Checkpoint - Core Features Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Error Handling and Recovery Systems
  - [ ] 12.1 Implement comprehensive error handling
    - Add network connectivity error handling
    - Implement Bedrock multi-model fallback chain error recovery
    - Create campaign matching system error management
    - Add PostgreSQL Docker container transaction rollback mechanisms
    - Implement S3 pre-signed URL expiration handling and regeneration
    - _Requirements: 8.3, 9.3, 13.1, 13.2, 13.3_

  - [ ] 12.2 Implement graceful degradation features
    - Add offline mode functionality
    - Implement reduced feature sets during EC2 API failures
    - Create progressive enhancement for advanced features
    - _Requirements: 7.3, 9.3_

  - [ ]\* 12.3 Write property test for error handling and recovery
    - **Property 13: Error Handling and Recovery**
    - **Validates: Requirements 8.3, 8.4, 9.3**

  - [ ]\* 12.4 Write unit tests for error scenarios
    - Test network failure recovery
    - Test Bedrock multi-model fallback chain service unavailability
    - Test PostgreSQL Docker container transaction failures
    - Test S3 pre-signed URL expiration and regeneration
    - _Requirements: 8.3, 9.3, 13.1, 13.2, 13.3_

- [ ] 13. Performance Optimization and Monitoring
  - [ ] 13.1 Implement performance monitoring
    - Add response time tracking for EC2 API endpoints
    - Implement health checks for PostgreSQL Docker container and AWS services
    - Create performance metrics dashboard
    - Monitor ACID transaction performance and deadlocks
    - Track Bedrock multi-model fallback usage and consecutive failures
    - Monitor S3 storage usage approaching Free Tier limits (5GB)
    - _Requirements: 2.3, 5.3, 11.5, 13.4, 13.5, 13.8_

  - [ ] 13.2 Optimize for low-end devices and 3G connections
    - Implement image compression and lazy loading
    - Add progressive loading for UI components
    - Optimize EC2 API response times and caching
    - Minimize EC2 bandwidth usage with S3 direct upload
    - _Requirements: 7.5, 8.1, 11.4_

  - [ ]\* 13.3 Write performance validation tests
    - Test response time requirements
    - Test low-bandwidth scenarios
    - Test concurrent user load on EC2 API
    - Test Bedrock fallback chain performance
    - Test S3 direct upload performance
    - _Requirements: 2.3, 5.3, 7.5, 11.4, 13.7_

- [ ] 14. Integration Testing and End-to-End Workflows
  - [ ] 14.1 Implement integration test suite
    - Create end-to-end workflow tests
    - Test EC2 API and AWS service integrations (Bedrock, S3, Lambda)
    - Add cross-component interaction tests
    - Test PostgreSQL Docker container ACID transaction scenarios
    - Test Bedrock multi-model fallback chain behavior
    - Test S3 direct upload with pre-signed URLs
    - _Requirements: All requirements_

  - [ ] 14.2 Set up staging environment testing
    - Configure staging EC2 instance and PostgreSQL Docker container
    - Set up AWS services for staging (Bedrock, S3, Lambda)
    - Implement automated deployment pipeline
    - Add smoke tests for production readiness
    - Test S3 lifecycle policies for Glacier transition
    - _Requirements: All requirements_

  - [ ]\* 14.3 Write comprehensive integration tests
    - Test complete daily workflow from notification to earnings
    - Test campaign matching system with multiple campaigns
    - Test offline/online sync scenarios
    - _Requirements: All requirements_

- [ ] 15. Final System Integration and Deployment Preparation
  - [ ] 15.1 Complete system integration
    - Wire all EC2 API endpoints with frontend
    - Implement final PostgreSQL Docker container schema optimizations
    - Add comprehensive logging and monitoring
    - Verify Bedrock multi-model fallback chain configuration
    - Confirm S3 lifecycle policies for cost optimization
    - _Requirements: All requirements_

  - [ ] 15.2 Production deployment configuration
    - Configure production EC2 Free Tier instance (t2.micro or t3.micro)
    - Deploy PostgreSQL Docker container with EBS volume persistence
    - Set up AWS services for production (Bedrock, S3, Lambda)
    - Implement backup and disaster recovery for Docker volumes
    - Configure S3 lifecycle policies for automatic Glacier transition
    - Verify AWS Free Tier cost optimization (EC2 750 hrs/month, S3 5GB)
    - _Requirements: 9.1, 9.5, 11.1, 11.2, 11.3, 11.5, 11.6, 11.7_

  - [ ] 15.3 Final validation and testing
    - Run complete test suite
    - Validate all correctness properties including Bedrock fallback chain
    - Perform final security and performance checks
    - Verify AWS Free Tier cost optimization
    - Test S3 storage monitoring and Glacier transition
    - _Requirements: All requirements_

- [ ] 16. Final Checkpoint - System Complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout development
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and error conditions
- The system uses Next.js PWA for frontend, AWS EC2 Free Tier with PostgreSQL Docker container, and AWS services (Bedrock multi-model fallback, S3 direct upload, Lambda email)
- All property tests should be tagged with: **Feature: shelf-bidder, Property {number}: {property_text}**
- ACID transactions are critical for financial operations and must be thoroughly tested
- Campaign matching replaces the auction system for simplified workflow
- Bedrock multi-model fallback chain (Nova Pro → Nova Lite → Claude Haiku) ensures AI resilience
- S3 direct upload with pre-signed URLs minimizes EC2 bandwidth costs
- PostgreSQL Docker container on EC2 provides $0 additional cost within Free Tier
- S3 lifecycle policies automatically transition old photos to Glacier for cost optimization
- Bedrock usage logging and operator alerting ensure system reliability monitoring
