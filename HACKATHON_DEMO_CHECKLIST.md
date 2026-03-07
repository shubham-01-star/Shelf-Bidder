# Hackathon Demo Checklist - Shelf-Bidder

**Deadline:** March 8, 2026, 11:59 PM IST (Kal Raat)  
**Current Status:** Local development working, AWS setup pending

---

## ✅ Already Done (Working)

- [x] PostgreSQL database setup with all tables
- [x] Next.js PWA with all pages (signup, dashboard, camera, tasks, wallet)
- [x] Resend email service (OTP + Welcome emails)
- [x] Shopkeeper signup/signin flow
- [x] Brand signup/signin flow
- [x] Wallet operations (demo mode)
- [x] Brand wallet recharge (demo mode)
- [x] All API routes implemented
- [x] Frontend UI complete

---

## ⚠️ Pending (Needs Decision)

### Option 1: Setup AWS (2-3 hours)
- [ ] Enable AWS Bedrock models in Mumbai region
  - [ ] amazon.nova-pro-v1:0
  - [ ] amazon.nova-lite-v1:0
  - [ ] anthropic.claude-3-haiku-20240307-v1:0
- [ ] Create S3 bucket: `shelf-bidder-photos-mumbai`
- [ ] Configure S3 CORS for direct upload
- [ ] (Optional) Create Cognito User Pool

### Option 2: Mock Mode (30 minutes)
- [ ] Set `USE_MOCK_DATA=true` in `.env.local`
- [ ] Create mock Bedrock responses
- [ ] Create mock S3 upload (save to local filesystem)
- [ ] Test complete flow with mock data

---

## 🧪 Testing Before Demo

### Must Test:
- [ ] Shopkeeper signup → OTP email → verify → dashboard
- [ ] Brand signup → OTP email → verify → dashboard
- [ ] Brand wallet recharge
- [ ] Photo upload (real S3 or mock)
- [ ] Photo analysis (real Bedrock or mock)
- [ ] Campaign matching
- [ ] Task verification (real Bedrock or mock)
- [ ] Wallet withdrawal

### Quick Test Commands:
```bash
# Test database
node check-db-entry.js

# Test email
node test-resend-email.js

# Test Bedrock (if set up)
node check-bedrock-access.js

# Test S3 (if set up)
node test-photo-upload.js

# Start app
npm run dev
```

---

## 📝 Demo Script

### 1. Shopkeeper Flow (5 minutes)
1. Open http://localhost:3000/auth/signup
2. Fill form: phone, email, password, name
3. Show OTP email received
4. Verify OTP → Dashboard
5. Click "Take Photo" → Upload shelf photo
6. Show AI analysis results
7. Show matched campaign
8. Complete task → Upload proof photo
9. Show verification result
10. Show earnings in wallet

### 2. Brand Flow (3 minutes)
1. Open http://localhost:3000/brand/auth/signup
2. Fill form: email, password, brand name
3. Show OTP email received
4. Verify OTP → Brand Dashboard
5. Show wallet balance
6. Recharge wallet (demo mode)
7. Show transaction history

---

## 🎯 What to Highlight in Demo

### Technical Features:
- ✅ Real-time email notifications (Resend)
- ✅ PostgreSQL with ACID transactions
- ✅ Multi-model AI fallback (if Bedrock set up)
- ✅ S3 direct upload (if S3 set up)
- ✅ PWA with offline capabilities
- ✅ Responsive UI for mobile

### Business Features:
- ✅ Automated shelf space monetization
- ✅ AI-powered photo analysis
- ✅ Campaign matching algorithm
- ✅ Instant earnings for shopkeepers
- ✅ Brand wallet system
- ✅ Task verification system

---

## 🚨 Backup Plan

### If AWS fails during demo:
1. Switch to mock mode immediately
2. Explain: "We've simulated the AI analysis for demo purposes"
3. Show the code architecture
4. Emphasize: "Production-ready architecture, just needs AWS deployment"

### If database fails:
1. Restart PostgreSQL: `docker-compose restart postgres`
2. Check connection: `node check-db-entry.js`

### If email fails:
1. Check Resend API key
2. Show email logs in Resend dashboard
3. Fallback: Show OTP in console logs

---

## 📊 Final Checklist Before Submission

- [ ] All code committed to Git
- [ ] README.md updated with setup instructions
- [ ] Environment variables documented
- [ ] Demo video recorded (if required)
- [ ] Presentation slides ready
- [ ] Test complete flow one more time
- [ ] Backup plan ready

---

## 🎬 Demo Day Preparation

### Morning (March 8):
- [ ] Test complete flow
- [ ] Fix any bugs
- [ ] Prepare demo script
- [ ] Record backup video

### Afternoon:
- [ ] Final testing
- [ ] Clean up code
- [ ] Update documentation
- [ ] Prepare for questions

### Evening (Before 11:59 PM):
- [ ] Submit project
- [ ] Double-check submission
- [ ] Celebrate! 🎉

---

## 💡 Quick Decision Guide

**If you have 3+ hours:** → Setup AWS (full features)  
**If you have 1-2 hours:** → Setup S3 + Bedrock (core features)  
**If you have < 1 hour:** → Mock mode (safe demo)

**Current time:** March 7, 2026 evening  
**Time available:** ~24 hours  
**Recommendation:** Try AWS setup, keep mock mode as backup

---

## 🆘 Need Help?

### AWS Setup Issues:
- Check AWS credentials in `.env.local`
- Verify region is `ap-south-1` (Mumbai)
- Check IAM permissions for Bedrock, S3, Cognito

### Code Issues:
- Check PostgreSQL is running: `docker ps`
- Check Node.js version: `node --version` (should be 18+)
- Clear Next.js cache: `rm -rf .next`

### Email Issues:
- Verify Resend API key
- Check sender email is verified
- Check Resend dashboard for logs

---

**Status:** Ready for final push! 🚀  
**Next Step:** Decide AWS setup or mock mode  
**Deadline:** 24 hours remaining

