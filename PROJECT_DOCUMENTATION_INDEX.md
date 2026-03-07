# 📚 Shelf Bidder - Complete Project Documentation Index

> **Quick Navigation**: Yeh document aapko batata hai ki project mein kahan kya likha hai

---

## 🎯 START HERE - Main Documents

### 1. **COMPLETE_ARCHITECTURE_AND_FLOW.md** ⭐
**Location**: Root folder  
**Contains**:
- Complete system architecture
- All 7 user flows (Shopkeeper signup → Task completion)
- Database schema with all tables
- Technology stack details
- AWS services configuration
- API endpoints list
- Deployment architecture

**Read this for**: Overall system understanding, architecture diagrams, complete flows

---

### 2. **HACKATHON_SUBMISSION_CHECKLIST.md** ⭐
**Location**: Root folder  
**Contains**:
- Pre-submission checklist
- AWS setup requirements
- Testing checklist
- Demo preparation guide
- Known limitations
- Submission requirements

**Read this for**: Hackathon submission preparation, what's pending

---

### 3. **docs/ACTUAL_STATUS_AND_SETUP_NEEDED.md** ⭐
**Location**: `docs/` folder  
**Contains**:
- Current implementation status
- What's working vs what needs AWS setup
- Active services (PostgreSQL, Resend)
- Pending services (Bedrock, S3, Cognito)
- Region configuration (Mumbai ap-south-1)
- Step-by-step AWS setup guide

**Read this for**: Current status, what needs to be done before demo

---

## 📋 Specification Documents

### 4. **.kiro/specs/shelf-bidder/requirements.md**
**Location**: `.kiro/specs/shelf-bidder/` folder  
**Contains**:
- Complete functional requirements
- User stories for Shopkeepers, Brands, System
- Acceptance criteria
- Correctness properties
- Non-functional requirements (performance, security)

**Read this for**: What the system should do, business requirements

---

### 5. **.kiro/specs/shelf-bidder/design.md**
**Location**: `.kiro/specs/shelf-bidder/` folder  
**Contains**:
- High-level design (system components, data models)
- Low-level design (algorithms, pseudocode)
- Database schema design
- API design
- Security design
- Performance optimization strategies

**Read this for**: Technical design decisions, how system is built

---

### 6. **.kiro/specs/shelf-bidder/tasks.md**
**Location**: `.kiro/specs/shelf-bidder/` folder  
**Contains**:
- Implementation task list
- Priority 1 (Core Workflow) - ✅ 100% Complete
- Priority 2 (Enhanced Features) - Partially complete
- Priority 3 (Advanced Features) - Not started
- Task status tracking

**Read this for**: Implementation progress, what's done vs pending

---

## 🔧 Technical Documentation

### 7. **API_FLOW.md**
**Location**: Root folder  
**Contains**:
- API endpoint documentation
- Request/response formats
- Authentication flow
- Error handling

**Read this for**: API usage, integration guide

---

### 8. **ARCHITECTURE.md**
**Location**: Root folder  
**Contains**:
- System architecture overview
- Component interactions
- Technology choices

**Read this for**: Quick architecture reference

---

### 9. **COMPLETE_FLOW_DIAGRAM.md**
**Location**: Root folder  
**Contains**:
- Visual flow diagrams
- Step-by-step process flows
- Sequence diagrams

**Read this for**: Visual understanding of flows

---

### 10. **VISUAL_FLOW_DIAGRAM.md**
**Location**: Root folder  
**Contains**:
- Mermaid diagrams
- System interaction flows
- Data flow diagrams

**Read this for**: Visual system representation

---

## 📁 Feature-Specific Documentation

### 11. **docs/EMAIL_OTP_FLOW_COMPLETE.md**
**Location**: `docs/` folder  
**Contains**:
- Email OTP implementation details
- Resend integration
- Shopkeeper & Brand signup flows
- OTP verification process

**Read this for**: Email authentication implementation

---

### 12. **docs/INFRASTRUCTURE_USAGE.md**
**Location**: `docs/` folder  
**Contains**:
- Active services breakdown
- Unused services identification
- Service usage analysis
- Cost optimization notes

**Read this for**: Which AWS services are actually used

---

### 13. **docs/COMPLETE_FLOW_VERIFICATION.md**
**Location**: `docs/` folder  
**Contains**:
- All 7 flows verification status
- Implementation confirmation
- Code references for each flow

**Read this for**: Verification that all flows are implemented

---

### 14. **docs/WITHDRAWAL_FEATURE.md**
**Location**: `docs/` folder  
**Contains**:
- Withdrawal API implementation
- Demo mode vs Production mode
- Testing guide
- UI implementation

**Read this for**: Shopkeeper withdrawal feature

---

### 15. **docs/BRAND_WALLET_EMAIL_FLOW.md**
**Location**: `docs/` folder  
**Contains**:
- Brand wallet recharge implementation
- Email integration with Resend
- Transaction history
- UI components

**Read this for**: Brand wallet and email features

---

### 16. **docs/TASK_VERIFICATION_FIX.md**
**Location**: `docs/` folder  
**Contains**:
- Task verification improvement
- Product context in verification
- Bedrock prompt enhancement
- Before/after photo comparison

**Read this for**: How task verification works with product context

---

### 17. **docs/BUDGET_ESCROW_REVERSAL.md**
**Location**: `docs/` folder  
**Contains**:
- Expired task handling
- Budget reversal mechanism
- Cron job implementation
- ACID transaction details

**Read this for**: How expired tasks are handled

---

### 18. **docs/S3_LIFECYCLE_IMPLEMENTATION.md**
**Location**: `docs/` folder  
**Contains**:
- S3 lifecycle policies
- Photo retention rules
- Storage optimization
- Cron job for cleanup

**Read this for**: S3 storage management

---

## 🗄️ Database Documentation

### 19. **database/README.md**
**Location**: `database/` folder  
**Contains**:
- Database setup instructions
- Schema overview
- Migration guide
- Local development setup

**Read this for**: Database setup and management

---

### 20. **database/init/*.sql**
**Location**: `database/init/` folder  
**Contains**:
- `01-schema.sql` - Complete database schema
- `02-indexes.sql` - Performance indexes
- `03-sample-data.sql` - Test data
- `04-bedrock-usage-logs.sql` - Bedrock logging table

**Read this for**: Database structure, tables, relationships

---

## 🧪 Testing Documentation

### 21. **Test Scripts** (Root folder)
**Files**:
- `test-all-apis.js` - Complete API testing
- `test-api-step-by-step.js` - Step-by-step flow testing
- `test-photo-upload.js` - Photo upload testing
- `test-photo-analyze.js` - Bedrock analysis testing
- `test-bedrock-fallback.js` - Multi-model fallback testing
- `test-verify-flow.js` - Task verification testing
- `test-resend-email.js` - Email OTP testing
- `test-withdrawal.js` - Withdrawal API testing

**Read this for**: How to test each feature

---

### 22. **Postman Collection**
**Files**:
- `Shelf-Bidder-API.postman_collection.json` - All API endpoints
- `Shelf-Bidder.postman_environment.json` - Environment variables

**Read this for**: API testing with Postman

---

## ⚙️ Configuration Files

### 23. **.env.local** ⭐
**Location**: Root folder  
**Contains**:
- All environment variables (30+ variables)
- AWS credentials
- Database connection
- API keys (Resend, etc.)
- Feature flags

**Read this for**: Environment configuration

---

### 24. **.env.example**
**Location**: Root folder  
**Contains**:
- Template for environment variables
- Required variables list
- Configuration guide

**Read this for**: Setting up new environment

---

### 25. **package.json**
**Location**: Root folder  
**Contains**:
- Dependencies list
- Scripts (dev, build, test)
- Project metadata

**Read this for**: Project dependencies and scripts

---

## 📝 Implementation Status Documents

### 26. **IMPLEMENTATION_STATUS.md**
**Location**: Root folder  
**Contains**:
- Feature implementation status
- Completed features list
- Pending features list
- Known issues

**Read this for**: Quick status overview

---

### 27. **VERIFICATION_FIX_SUMMARY.md**
**Location**: Root folder  
**Contains**:
- Task verification fix details
- Problem statement
- Solution implementation
- Testing guide

**Read this for**: Recent verification fix details

---

### 28. **ESCROW_FIX_SUMMARY.md**
**Location**: Root folder  
**Contains**:
- Budget escrow reversal fix
- Problem statement
- Solution implementation
- Cron job details

**Read this for**: Recent escrow fix details

---

## 🎨 Frontend Documentation

### 29. **src/app/** (Folder structure)
**Location**: `src/app/` folder  
**Contains**:
- Page components
- API routes
- Layout components
- Middleware

**Read this for**: Frontend structure and pages

---

### 30. **src/components/** (Folder structure)
**Location**: `src/components/` folder  
**Contains**:
- Reusable UI components
- Form components
- Layout components

**Read this for**: UI component library

---

## 🔐 Security & Auth Documentation

### 31. **src/lib/auth/** (Folder structure)
**Location**: `src/lib/auth/` folder  
**Contains**:
- JWT token management
- Authentication utilities
- Session handling

**Read this for**: Authentication implementation

---

## 📊 Database Operations Documentation

### 32. **src/lib/db/postgres/operations/** (Folder structure)
**Location**: `src/lib/db/postgres/operations/` folder  
**Contains**:
- `auction.ts` - Auction CRUD operations
- `bid.ts` - Bid operations
- `campaign.ts` - Campaign operations
- `task.ts` - Task operations
- `wallet-transaction.ts` - Wallet operations
- `shopkeeper.ts` - Shopkeeper operations
- `brand.ts` - Brand operations

**Read this for**: Database operation implementations

---

## 🤖 AI/ML Documentation

### 33. **src/lib/vision/bedrock-client.ts**
**Location**: `src/lib/vision/` folder  
**Contains**:
- Bedrock multi-model fallback chain
- Nova Pro → Nova Lite → Claude Haiku
- Shelf analysis implementation
- Task verification implementation
- Exponential backoff logic
- Logging and alerting

**Read this for**: AI/ML integration, Bedrock usage

---

## 📧 Email Documentation

### 34. **src/lib/email/resend-client.ts**
**Location**: `src/lib/email/` folder  
**Contains**:
- Resend integration
- OTP email templates
- Welcome email templates
- Email sending utilities

**Read this for**: Email service implementation

---

## 💾 Storage Documentation

### 35. **src/lib/storage/** (Folder structure)
**Location**: `src/lib/storage/` folder  
**Contains**:
- `index.ts` - S3 operations
- `lifecycle.ts` - Lifecycle policies
- `LIFECYCLE_README.md` - Lifecycle documentation

**Read this for**: S3 storage implementation

---

## 🎯 Quick Reference by Use Case

### "Main project ko samajhna hai"
→ Read: `COMPLETE_ARCHITECTURE_AND_FLOW.md`

### "Kya kya implement ho gaya hai?"
→ Read: `docs/ACTUAL_STATUS_AND_SETUP_NEEDED.md`, `IMPLEMENTATION_STATUS.md`

### "AWS setup kaise karein?"
→ Read: `docs/ACTUAL_STATUS_AND_SETUP_NEEDED.md`, `HACKATHON_SUBMISSION_CHECKLIST.md`

### "Database schema kya hai?"
→ Read: `database/init/01-schema.sql`, `COMPLETE_ARCHITECTURE_AND_FLOW.md`

### "API kaise use karein?"
→ Read: `API_FLOW.md`, Postman collection

### "Testing kaise karein?"
→ Read: Test scripts in root folder, `HACKATHON_SUBMISSION_CHECKLIST.md`

### "Email OTP kaise kaam karta hai?"
→ Read: `docs/EMAIL_OTP_FLOW_COMPLETE.md`

### "Task verification kaise hota hai?"
→ Read: `docs/TASK_VERIFICATION_FIX.md`, `VERIFICATION_FIX_SUMMARY.md`

### "Bedrock integration kaise hai?"
→ Read: `src/lib/vision/bedrock-client.ts`, `docs/TASK_VERIFICATION_FIX.md`

### "Wallet system kaise kaam karta hai?"
→ Read: `docs/WITHDRAWAL_FEATURE.md`, `docs/BRAND_WALLET_EMAIL_FLOW.md`

### "Expired tasks ka kya hota hai?"
→ Read: `docs/BUDGET_ESCROW_REVERSAL.md`, `ESCROW_FIX_SUMMARY.md`

---

## 📌 Most Important Documents (Top 5)

1. **COMPLETE_ARCHITECTURE_AND_FLOW.md** - Complete system overview
2. **docs/ACTUAL_STATUS_AND_SETUP_NEEDED.md** - Current status & AWS setup
3. **HACKATHON_SUBMISSION_CHECKLIST.md** - Submission preparation
4. **.kiro/specs/shelf-bidder/requirements.md** - Business requirements
5. **.env.local** - Configuration

---

## 🚀 For Hackathon Demo

**Must Read Before Demo**:
1. `HACKATHON_SUBMISSION_CHECKLIST.md`
2. `docs/ACTUAL_STATUS_AND_SETUP_NEEDED.md`
3. `COMPLETE_ARCHITECTURE_AND_FLOW.md`
4. Test scripts for demo preparation

---

## 📞 Document Organization

```
shelf-bidder/
├── 📄 Main Docs (Root)
│   ├── COMPLETE_ARCHITECTURE_AND_FLOW.md ⭐
│   ├── HACKATHON_SUBMISSION_CHECKLIST.md ⭐
│   ├── API_FLOW.md
│   ├── ARCHITECTURE.md
│   └── IMPLEMENTATION_STATUS.md
│
├── 📁 docs/ (Detailed Documentation)
│   ├── ACTUAL_STATUS_AND_SETUP_NEEDED.md ⭐
│   ├── EMAIL_OTP_FLOW_COMPLETE.md
│   ├── INFRASTRUCTURE_USAGE.md
│   ├── TASK_VERIFICATION_FIX.md
│   └── BUDGET_ESCROW_REVERSAL.md
│
├── 📁 .kiro/specs/shelf-bidder/ (Specifications)
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
│
├── 📁 database/ (Database)
│   ├── README.md
│   └── init/*.sql
│
├── 📁 src/ (Source Code)
│   ├── app/ (Pages & API routes)
│   ├── components/ (UI components)
│   ├── lib/ (Utilities)
│   └── types/ (TypeScript types)
│
└── 🧪 Test Scripts (Root)
    ├── test-*.js
    └── *.postman_collection.json
```

---

## 🎓 Learning Path

**For New Developers**:
1. Start with `COMPLETE_ARCHITECTURE_AND_FLOW.md`
2. Read `.kiro/specs/shelf-bidder/requirements.md`
3. Check `docs/ACTUAL_STATUS_AND_SETUP_NEEDED.md`
4. Explore `database/init/01-schema.sql`
5. Review API routes in `src/app/api/`
6. Run test scripts to understand flows

**For Hackathon Judges**:
1. `COMPLETE_ARCHITECTURE_AND_FLOW.md` - System overview
2. `HACKATHON_SUBMISSION_CHECKLIST.md` - What's implemented
3. Demo the working features
4. Show Postman collection for API testing

---

**Last Updated**: March 8, 2026  
**Project**: Shelf Bidder - AI-Powered Retail Shelf Space Marketplace  
**Hackathon**: Bharat AI Hackathon 2026
