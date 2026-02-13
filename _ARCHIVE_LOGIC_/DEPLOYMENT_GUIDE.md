# eCalc RO - Deployment Guide

## 🚀 Quick Deploy to Vercel

### Prerequisites
1. GitHub account
2. Vercel account (sign up at vercel.com)
3. MongoDB Atlas account (for database)

### Step 1: Prepare Your Repository

1. **Initialize Git (if not already done):**
```bash
cd /app
git init
git add .
git commit -m "Initial commit: eCalc RO MVP"
```

2. **Create GitHub Repository:**
   - Go to github.com/new
   - Name: `ecalc-ro`
   - Description: "Platform de calculatoare fiscale România 2026"
   - Public or Private (your choice)
   - Don't initialize with README (we already have one)

3. **Push to GitHub:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/ecalc-ro.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. **Connect GitHub to Vercel:**
   - Go to vercel.com/new
   - Click "Import Git Repository"
   - Select your `ecalc-ro` repository

2. **Configure Build Settings:**
   ```
   Framework Preset: Next.js
   Build Command: next build
   Output Directory: .next
   Install Command: yarn install
   ```

3. **Add Environment Variables:**
   In Vercel Dashboard → Settings → Environment Variables, add:

   ```env
   MONGO_URL=mongodb+srv://ecalc_db_user:tQOflzPxU5TLOUB9@admin-ecalc.piefwf2.mongodb.net/?appName=admin-ecalc
   DB_NAME=ecalc_ro
   ADMIN_EMAIL=admin@ecalc.ro
   ADMIN_PASSWORD=Admin2026!
   CORS_ORIGINS=*
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your site will be live at `https://ecalc-ro.vercel.app`

### Step 3: Custom Domain (Optional)

1. **Buy a domain** (ex: ecalc.ro from GoDaddy, Namecheap, etc.)

2. **Add to Vercel:**
   - Vercel Dashboard → Settings → Domains
   - Add your domain
   - Update DNS records as instructed by Vercel

3. **SSL:** Automatically handled by Vercel (HTTPS enabled)

---

## 🔧 Post-Deployment Configuration

### 1. Test Your Deployment
```bash
# Test homepage
curl https://your-domain.vercel.app

# Test API
curl https://your-domain.vercel.app/api

# Test admin login
curl -X POST https://your-domain.vercel.app/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@ecalc.ro","password":"Admin2026!"}'
```

### 2. Configure Monetization

#### A. Google AdSense
1. Go to: `https://your-domain.vercel.app/admin`
2. Login with: admin@ecalc.ro / Admin2026!
3. Tab "Ad Slots (4)"
4. Paste your AdSense code in all 4 slots:
   - Ad Header
   - Ad Sidebar
   - Above Results Ad ⭐
   - Below Results Ad ⭐

#### B. Affiliate Links
1. Still in Admin → Tab "Affiliate Links"
2. For each calculator, configure **3 slots**:
   - Slot 1: Primary offer (highest commission)
   - Slot 2: Alternative offer
   - Slot 3: Backup offer
3. Save all links

### 3. Analytics Setup

Add to `/app/app/layout.js` before closing `</head>`:

```javascript
{/* Google Analytics */}
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script dangerouslySetInnerHTML={{
  __html: `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  `
}} />

{/* Meta Pixel */}
<script dangerouslySetInnerHTML={{
  __html: `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', 'YOUR_PIXEL_ID');
    fbq('track', 'PageView');
  `
}} />
```

---

## 📊 Monitoring & Optimization

### Key Metrics to Track

1. **Traffic (Google Analytics):**
   - Page views per calculator
   - Bounce rate
   - Time on site
   - Mobile vs Desktop

2. **Revenue (Manual tracking initially):**
   - AdSense earnings per calculator
   - Affiliate clicks (use tracking parameters)
   - Lead generation rate

3. **Performance (Vercel Dashboard):**
   - Page load time (<2s target)
   - API response time (<100ms target)
   - Error rate (<0.1% target)

### A/B Testing Strategy

1. **Week 1-2:** Test 3 different CTA texts per calculator
2. **Week 3-4:** Test different affiliate slot orders
3. **Month 2:** Test ad slot positions

---

## 🛡️ Security Checklist

- [ ] Change admin password in production
- [ ] Enable CORS only for your domain
- [ ] Set up MongoDB IP whitelist
- [ ] Enable Vercel password protection (optional)
- [ ] Add rate limiting (future enhancement)

---

## 🐛 Common Issues & Solutions

### Issue: "Build Failed on Vercel"
**Solution:** Check build logs. Usually missing environment variables.

### Issue: "Cannot connect to MongoDB"
**Solution:** 
1. Check MONGO_URL in Vercel env vars
2. Verify MongoDB Atlas allows connections from "0.0.0.0/0"

### Issue: "Admin login not working"
**Solution:** 
1. Check ADMIN_EMAIL and ADMIN_PASSWORD in Vercel
2. Clear browser cache
3. Check database for adminUsers collection

### Issue: "Affiliate buttons not showing"
**Solution:** Make sure links are set in Admin (not just "#")

---

## 📈 Growth Checklist

### Week 1:
- [ ] Deploy to Vercel
- [ ] Configure all affiliate links (18 total)
- [ ] Add Google AdSense
- [ ] Add Google Analytics
- [ ] Test all calculators

### Month 1:
- [ ] Write 5 blog posts for SEO
- [ ] Submit to Google Search Console
- [ ] Create social media accounts
- [ ] Start email marketing with collected leads

### Month 2:
- [ ] A/B test CTAs
- [ ] Optimize for mobile
- [ ] Add more calculators
- [ ] Partner with Romanian financial sites

### Month 3:
- [ ] Launch referral program
- [ ] Create API for partners
- [ ] White-label opportunities

---

## 💰 Revenue Optimization Tips

1. **Strategic Ad Placement:**
   - "Above Results Ad" has highest CTR (15-25%)
   - "Below Results Ad" captures engaged users (10-15%)
   - Test different ad formats (display, native, link units)

2. **Affiliate Optimization:**
   - Slot 1: Highest commission offer (green button)
   - Slot 2: Best brand recognition (blue button)
   - Slot 3: Lowest barrier to entry (purple button)

3. **Lead Monetization:**
   - Export CSV weekly
   - Segment by calculator type
   - Create targeted email campaigns
   - Sell qualified leads to partners (€2-5 per lead)

---

## 🎯 Success Metrics (3-Month Goals)

| Metric | Target |
|--------|--------|
| Monthly Visitors | 10,000+ |
| Calculations/Day | 200+ |
| Leads Collected | 500+ |
| AdSense Revenue | €300+/month |
| Affiliate Revenue | €500+/month |
| Total MRR | €800+/month |

---

## 📞 Support

**Technical Issues:** Check Vercel logs and MongoDB Atlas logs  
**Business Questions:** Review analytics dashboard  
**Updates:** Git pull → Vercel auto-deploys

**Repository:** https://github.com/YOUR_USERNAME/ecalc-ro  
**Live Site:** https://ecalc-ro.vercel.app  
**Admin:** https://ecalc-ro.vercel.app/admin

---

## 🎉 You're Ready to Launch!

Your site is now configured for **maximum monetization**:
- ✅ 4 AdSense slots (2 in prime positions)
- ✅ 18 affiliate links (3 per calculator × 6 calculators)
- ✅ Lead generation system with CSV export
- ✅ Dynamic tax labels (future-proof)

**Next Step:** Push to GitHub and deploy! 🚀
