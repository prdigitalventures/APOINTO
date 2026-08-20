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
- **Prisma** + SQLite
- **Tailwind CSS** — Mobile-first design
- **JWT Auth** — Role-based (Owner / Customer)

## Getting Started

```bash
npm install
npx prisma migrate dev
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

## Deploy on Railway

This app is configured to deploy with Docker on Railway.

1. Install the CLI and log in:

```bash
bash <(curl -fsSL railway.com/install.sh)
railway login
```

2. Create a project, set secrets, add a persistent volume for SQLite, and deploy:

```bash
railway init --name apointo
railway variable set JWT_SECRET="$(openssl rand -hex 32)"
railway variable set DATABASE_URL="file:/data/prod.db"
railway volume add --mount /data
railway up
railway domain
```

The container runs Prisma migrations and seeds demo data on start.

Demo logins after deploy:

| Role | Phone | Password |
|------|-------|----------|
| Owner | 9876543210 | demo123 |
| Customer | 9876543211 | demo123 |

