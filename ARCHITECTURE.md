# 🏔️ Chopal Apple Orchard — System Architecture

## Overview

Production-grade Next.js 14+ application deployed on Vercel Edge Network, backed by Supabase PostgreSQL, with Redis caching, Cloudinary CDN, and Razorpay payments.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Browser   │  │   Mobile    │  │  WhatsApp   │  │   Instagram/YT API  │ │
│  │   (Next.js) │  │  (PWA)      │  │  Business   │  │   (Social Feed)     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                    │            │
│         └────────────────┴────────────────┴────────────────────┘            │
│                                    │                                        │
│                         Vercel Edge Network (CDN)                          │
│                         ├─ Static Assets (Images/CSS)                      │
│                         ├─ ISR / SSG Pages                                 │
│                         └─ Edge Middleware (Geo, Auth)                     │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                           APPLICATION LAYER                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 14 App Router                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │  App Router │  │ API Routes  │  │  Server     │  │  React    │  │   │
│  │  │  (RSC/SSC)  │  │  (tRPC/REST)│  │  Actions    │  │  Components│  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │   │
│  │  │ Framer Motion│  │ Tailwind CSS│  │ Zustand     │  │  Lucide   │  │   │
│  │  │ (Parallax)  │  │ (Styling)   │  │ (State)     │  │  Icons    │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                           SERVICE LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │  Prisma ORM │  │  Redis      │  │  Cloudinary │  │  Razorpay SDK     │  │
│  │  (Database) │  │  (Cache)    │  │  (CDN/Media)│  │  (Payments)       │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │  Twilio API │  │  SendGrid   │  │  Mapbox API │  │  OpenWeatherMap   │  │
│  │  (SMS/WA)   │  │  (Email)    │  │  (Maps)     │  │  (Weather)        │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼────────────────────────────────────────┐
│                           DATA LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Supabase PostgreSQL                               │   │
│  │  ├─ Users / Orders / B2B Inquiries / Tour Bookings                  │   │
│  │  ├─ Products / Batch Traceability / Reviews                         │   │
│  │  └─ Row Level Security (RLS) enabled                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Redis (Upstash / Redis Cloud)                     │   │
│  │  ├─ Session Store (JWT refresh tokens)                              │   │
│  │  ├─ Inventory Cache (stock levels, real-time)                       │   │
│  │  ├─ Weather Cache (TTL: 10 minutes)                                 │   │
│  │  └─ Rate Limiting (API protection)                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Order Placement

```
1. Customer selects product → Frontend validates stock (Zustand + Redis cache)
2. Customer proceeds to checkout → Next.js Server Action validates cart
3. Server Action creates Order (PENDING) in PostgreSQL via Prisma
4. Razorpay order created → Client receives payment link
5. Webhook receives payment confirmation → Order status updated to CONFIRMED
6. Trigger: SendGrid email + Twilio WhatsApp notification dispatched
7. Inventory decremented in PostgreSQL + Redis cache invalidated
8. Batch traceability record linked to OrderItem
```

---

## Data Flow: Batch Traceability Lookup

```
1. Customer enters batch code (e.g., "CHP-2025-RD-001")
2. API Route queries BatchTraceability + Product (Prisma, indexed on batchCode)
3. Response includes: harvest date, tree block, farmer notes, altitude, photos
4. Frontend renders interactive timeline + QR verification badge
5. Redis caches result for 1 hour (high-read, low-write pattern)
```

---

## Data Flow: B2B Inquiry

```
1. Wholesaler fills multi-step form → Client-side validation (Zod)
2. Server Action creates B2BInquiry (status: NEW)
3. Admin dashboard receives real-time notification (Supabase Realtime)
4. Auto-response email sent via SendGrid
5. Admin reviews → updates status → quote generated
6. WhatsApp Business API sends personalized quote to prospect
```

---

## Technology Stack Summary

| Layer          | Technology                     | Purpose                                       |
| -------------- | ------------------------------ | --------------------------------------------- |
| **Frontend**   | Next.js 14 (App Router)        | SSR/SSG, API routes, server actions           |
| **Styling**    | Tailwind CSS + shadcn/ui       | Utility-first, Himalayan earth palette        |
| **Animation**  | Framer Motion                  | Parallax, scroll reveals, page transitions    |
| **State**      | Zustand                        | Client cart, UI state, form wizard            |
| **ORM**        | Prisma                         | Type-safe database operations                 |
| **Database**   | Supabase PostgreSQL            | Primary data store with RLS                   |
| **Cache**      | Redis (Upstash)                | Sessions, inventory, weather, rate limits     |
| **Media**      | Cloudinary                     | Image optimization, responsive srcsets, video |
| **Payments**   | Razorpay                       | UPI, Cards, NetBanking, EMI                   |
| **Email**      | SendGrid                       | Transactional + marketing emails              |
| **SMS/WA**     | Twilio / WhatsApp Business API | Order alerts, B2B quotes                      |
| **Maps**       | Mapbox                         | Orchard location, elevation visualization     |
| **Weather**    | OpenWeatherMap                 | Live Chopal weather widget                    |
| **Auth**       | NextAuth.js / Supabase Auth    | OAuth, phone OTP                              |
| **Monitoring** | Vercel Analytics + Sentry      | Performance, error tracking                   |
| **CI/CD**      | GitHub → Vercel                | Auto-deploy on push                           |

---

## Environment Variables (.env.local)

```env
# Database
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# Redis (Upstash)
REDIS_URL="rediss://default:[token]@[host]:[port]"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Razorpay
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."

# SendGrid
SENDGRID_API_KEY="SG."
SENDGRID_FROM_EMAIL="orders@chopalorchard.com"

# Twilio
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+91..."
WHATSAPP_BUSINESS_NUMBER="+91..."

# Weather
OPENWEATHERMAP_API_KEY="..."

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN="pk."

# Auth (NextAuth)
NEXTAUTH_URL="https://chopalorchard.com"
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```
