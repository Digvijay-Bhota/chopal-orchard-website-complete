# 🏔️ Chopal Apple Orchard — Premium Website

> Production-ready Next.js 14 application for a premium apple orchard in Chopal, Shimla, Himachal Pradesh, India.

## 📁 Project Structure

```
chopal-apple-orchard/
├── app/
│   ├── globals.css              # Global styles + Tailwind directives
│   ├── layout.tsx               # Root layout with fonts + structured data
│   ├── metadata.ts              # SEO, OpenGraph, JSON-LD schemas
│   ├── page.tsx                 # Main landing page
│   └── api/
│       ├── weather/
│       │   └── route.ts         # OpenWeatherMap proxy + Redis cache
│       ├── payment/
│       │   ├── create-order.ts  # Razorpay order creation
│       │   └── webhook.ts       # Razorpay webhook handler
│       ├── traceability/
│       │   └── route.ts         # Batch code lookup API
│       ├── b2b/
│       │   └── route.ts         # B2B inquiry submission
│       └── notifications/
│           └── route.ts         # Twilio/SendGrid dispatch
├── components/
│   ├── HeroSection.tsx          # Parallax hero + weather badge
│   ├── AppleShowcase.tsx        # Product grid + ratings + pre-order
│   ├── TraceabilityLookup.tsx   # Batch verification tool
│   ├── B2BInquiryForm.tsx       # Multi-step wholesale form
│   ├── EcoTourismBooking.tsx    # (TODO) Orchard visit calendar
│   ├── SocialFeed.tsx           # (TODO) Instagram/YouTube embed
│   └── ui/                      # shadcn/ui components
├── lib/
│   ├── prisma.ts                # Prisma client singleton
│   ├── redis.ts                 # Redis client (Upstash)
│   ├── cloudinary.ts            # Cloudinary SDK config
│   ├── razorpay.ts              # Razorpay SDK config
│   └── utils.ts                 # cn() + helpers
├── prisma/
│   └── schema.prisma            # Full database schema
├── public/
│   ├── favicon.ico
│   ├── manifest.json            # PWA manifest
│   └── images/
├── tailwind.config.ts           # Himalayan earth color palette
├── next.config.js               # Export + image config
└── package.json
```

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-org/chopal-orchard.git
cd chopal-orchard
npm install
```

### 2. Environment Setup

Create `.env.local`:

```env
# ── Database ──
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# ── Redis (Upstash) ──
REDIS_URL="rediss://default:[token]@[host]:[port]"

# ── Cloudinary ──
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# ── Razorpay ──
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."

# ── SendGrid ──
SENDGRID_API_KEY="SG."
SENDGRID_FROM_EMAIL="orders@chopalorchard.com"

# ── Twilio ──
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+91..."
WHATSAPP_BUSINESS_NUMBER="+91..."

# ── Weather ──
OPENWEATHERMAP_API_KEY="..."

# ── Mapbox ──
NEXT_PUBLIC_MAPBOX_TOKEN="pk."

# ── Auth ──
NEXTAUTH_URL="https://chopalorchard.com"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase
npm run db:push

# (Optional) Seed with demo data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
# → http://localhost:3000
```

### 5. Build for Production

```bash
npm run build
npm start
```

## 🌐 Deployment Pipeline (Vercel + Supabase)

### Vercel Setup

1. **Connect Repository**
   ```bash
   vercel --prod
   ```

2. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Set `NODE_ENV=production`

3. **Enable Analytics**
   - Vercel Analytics (Web Vitals)
   - Vercel Speed Insights

### Supabase Setup

1. Create new project at [supabase.com](https://supabase.com)
2. Copy connection string for `DATABASE_URL`
3. Enable Row Level Security (RLS) on all tables
4. Set up database backups

### Redis (Upstash)

1. Create Redis database at [upstash.com](https://upstash.com)
2. Copy `REDIS_URL` from connection details
3. Set max memory policy to `allkeys-lru`

### Cloudinary Setup

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Configure upload presets for:
   - `orchard_products` (product images, 1200x1200)
   - `orchard_hero` (hero banners, 1920x1080)
   - `orchard_traceability` (harvest photos, 800x600)
3. Enable automatic image optimization

### Razorpay Setup

1. Create account at [razorpay.com](https://razorpay.com)
2. Generate API keys (Test → Live)
3. Configure webhook URL: `https://chopalorchard.com/api/payment/webhook`
4. Enable UPI, Cards, NetBanking

### Domain & SSL

1. Purchase domain: `chopalorchard.com`
2. Add to Vercel project
3. Configure DNS (CNAME → cname.vercel-dns.com)
4. Auto-SSL via Vercel

## 📊 Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| LCP | < 2.5s | Lighthouse |
| FID | < 100ms | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| TTFB | < 600ms | Vercel Analytics |
| FCP | < 1.8s | Lighthouse |
| Speed Index | < 3.4s | Lighthouse |

## 🔒 Security Checklist

- [ ] Enable RLS on all Supabase tables
- [ ] Configure CORS headers in `next.config.js`
- [ ] Set up rate limiting (Redis)
- [ ] Validate all API inputs with Zod
- [ ] Use `helmet` headers in API routes
- [ ] Enable CSP (Content Security Policy)
- [ ] Rotate API keys quarterly
- [ ] Enable 2FA on all service accounts

## 📝 License

Proprietary — Chopal Apple Orchard. All rights reserved.
