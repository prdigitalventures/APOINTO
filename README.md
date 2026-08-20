# Apointo

**AI-Powered Universal Booking Platform for Indian SMBs**

> Tell us about your business. AI builds your booking system.

## Phase 1 Features

- **AI Business Onboarding** — Conversational setup that extracts business info from natural language
- **Universal Booking Engine** — Dynamic booking flows per business category (salon, clinic, auto, tutor, sports, etc.)
- **Real-time Slot Availability** — Considers working hours, staff, breaks, holidays, buffers, and existing bookings
- **Booking Request/Approval Flow** — Owner accept, reject, or suggest alternative times
- **Time Request System** — Both owner and customer can request +5/+10/+15/+20/+30 min delays
- **Owner Calendar** — Today's bookings, walk-ins, block time, mark complete
- **Customer Booking Flow** — Mobile-first: service → staff → date → time → confirm
- **Shareable Booking Links** — Copy link, WhatsApp share, QR code generation
- **Notification System** — In-app notifications (extensible to SMS/WhatsApp/push)

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Prisma 5** + PostgreSQL (Neon / any Postgres)
- **Tailwind CSS** — Mobile-first design
- **JWT Auth** — Role-based (Owner / Customer)

## Getting Started

Postgres is required (SQLite is not used in production because serverless hosts like Vercel have ephemeral disks).

```bash
# Option A: local Postgres
docker compose up -d
# then set DATABASE_URL and DIRECT_URL to postgresql://apointo:apointo@localhost:5432/apointo

# Option B: hosted Postgres (Neon, Railway, etc.)
cp .env.example .env
# edit DATABASE_URL and DIRECT_URL

npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Accounts

| Role | Phone | Password |
|------|-------|----------|
| Owner | 9876543210 | demo123 |
| Customer | 9876543211 | demo123 |

Demo business: `/ravihairstudio`

## Deploy

The app is configured for **Vercel** (`vercel.json`) and **Railway** (`Dockerfile` + `railway.json`).

Required environment variables:

- `DATABASE_URL` — pooled Postgres URL (add `pgbouncer=true` when using Neon’s pooler)
- `DIRECT_URL` — direct (non-pooled) Postgres URL for migrations
- `JWT_SECRET` — long random string
- `OPENAI_API_KEY` — optional; onboarding falls back to a local NLU parser without it

Build runs `prisma migrate deploy` and seeds demo accounts.

SQLite is **not** used on Vercel: each serverless instance has its own ephemeral filesystem, so bookings would not persist. Use Postgres instead.
