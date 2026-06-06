# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tokyo Minbak (`tokyominbak.net`) — a Next.js 14 Airbnb-style vacation rental booking platform targeting Korean guests staying in Tokyo. The UI is in Korean; host-facing pages support Japanese locale.

## Commands

```bash
npm run dev           # Start dev server (localhost:3000)
npm run dev:mock      # Seed DB then start dev server
npm run build         # Production build
npm run check         # Lint + build (run before deploying)
npm run lint          # ESLint only

# Database
npm run db:migrate         # Create + apply migration
npm run db:migrate:deploy  # Deploy migrations (CI/prod)
npm run db:generate        # Regenerate Prisma client
npm run db:seed            # Seed with sample data
npm run db:studio          # Open Prisma Studio (visual DB editor)

# Deploy
npm run deploy:cli    # Recommended: direct Vercel deploy (requires VERCEL_ORG_ID, VERCEL_PROJECT_ID)
npm run deploy        # git add/commit/push + Deploy Hook trigger
npm run deploy:vercel # Trigger deploy without push
```

After any `prisma/schema.prisma` change: run `npm run db:migrate`, then `npm run db:generate`.
When adding new env vars: document them in `.env.example` with a comment.

## Architecture

### Directory Layout

```
src/
├── app/              # Next.js App Router — pages are Server Components by default
│   ├── api/          # 80+ REST API routes (use Prisma singleton from @/lib/prisma)
│   ├── listing/[id]/ # Listing detail + booking form
│   ├── booking/      # Multi-step booking flow (confirm → pay → complete)
│   ├── host/         # Host dashboard (listings, bookings, revenue, messages)
│   ├── admin/        # Admin panel (reviews, settlements, blog publishing)
│   ├── search/       # Filtered listing search
│   ├── recommend/    # AI-powered 30-second recommendation funnel
│   ├── blog/         # SEO blog (ISR, 300s revalidate)
│   └── messages/     # Guest-host conversation
├── components/
│   ├── ui/           # Primitive UI elements (Button, Input, Skeleton, etc.)
│   ├── layout/       # Header, Footer, BottomNav, NotificationBell
│   ├── analytics/    # GA4 and Meta Pixel event components
│   ├── currency/     # CurrencyProvider + CurrencyContext (KRW/JPY)
│   └── channel/      # ChannelTalk chat widget integration
├── lib/              # All utilities, queries, and third-party wrappers
│   ├── prisma.ts     # Singleton Prisma client — always import from here
│   ├── auth.ts       # NextAuth config (Google, Kakao, Credentials providers)
│   ├── listings.ts   # Core listing queries (uses React.cache)
│   ├── bookings.ts   # Booking creation and state management
│   ├── availability.ts # Calendar/date availability logic
│   ├── portone.ts    # Payment gateway (KG Inicis) API wrapper
│   ├── beds24.ts     # Beds24 PMS sync (calendar, pricing)
│   ├── email.ts      # Resend email client
│   ├── channel-api.ts # ChannelTalk API wrapper
│   ├── currency.ts   # KRW/JPY conversion
│   ├── design-tokens.ts # Tailwind design constants — use these for colors/spacing
│   ├── ga4-events.ts # GA4 event helpers
│   └── meta-pixel.ts # Meta Pixel event helpers
└── types/            # Global TypeScript types
```

### Key Architectural Patterns

**Server vs. Client Components:** Default to Server Components. Add `"use client"` only where necessary (interactivity, browser APIs, context consumers). Keep the `"use client"` boundary as narrow as possible.

**Data Fetching:** Server Components fetch directly via Prisma or lib functions. `React.cache()` is used on `getListings()` and `getWishlistListingIds()` for request deduplication. ISR revalidation: home page 60s, blog 300s, host/auth pages `revalidate = 0`.

**Auth & Authorization:**
- NextAuth with Prisma adapter; JWT strategy (30-day expiry)
- `role` field on User: `"user"` (guest/host) or `"admin"`
- Host ownership checked per-resource (listings, bookings, messages)
- Access `session.user.role` and `session.user.id` for authorization in API routes

**Styling:** Tailwind CSS with custom brand tokens defined in `tailwind.config.ts` and `src/lib/design-tokens.ts`. Brand primary red: `#D74132`. Custom Tailwind classes: `minbak` border-radius variants, `navbar` spacing, `minbak-h1`/`minbak-body` font sizes.

**Currency:** Wrap context-sensitive price displays in `CurrencyProvider`. `CurrencyAudienceContext` determines guest vs. host audience (affects KRW/JPY display).

### Third-Party Integrations

| Service | Purpose | Key files |
|---------|---------|-----------|
| Portone (KG Inicis) | Payments (cards, virtual accounts) | `lib/portone.ts`, `app/api/payment/` |
| Beds24 | PMS sync — calendar & pricing | `lib/beds24.ts`, `app/api/beds24/` |
| Resend | Transactional email | `lib/email.ts`, `lib/email-templates.ts` |
| ChannelTalk | Customer support chat | `lib/channel-api.ts`, `components/channel/` |
| OpenAI | AI recommendation engine | `lib/recommend*.ts` |
| Cloudinary | Image/video CDN | configured in `next.config.mjs` |
| Meta Pixel + CAPI | Ad conversion tracking | `lib/meta-pixel.ts`, `components/analytics/` |
| Google Analytics 4 | Traffic tracking | `lib/ga4-events.ts`, `components/analytics/` |

### Booking Flow

1. Guest selects dates → listing detail → `BookingForm`
2. POST `/api/bookings` → creates `Booking` with `status: pending`
3. Portone payment → POST `/api/payment/confirm`
4. Webhook → `/api/payment/webhook` → updates booking status
5. Confirmation email (Resend) + ChannelTalk host notification

### Scheduled Jobs (Vercel Cron — `vercel.json`)

- Every 10 min: send scheduled messages
- Daily midnight: cancel unpaid bookings, charge deferred payments
- Daily 1 AM: blog automation
- Daily 6 AM: Beds24 price sync
- Daily 7 AM: Meta Commerce Catalog rebuild

## Deployment

**Recommended:** `npm run deploy:cli` (direct Vercel deploy, no GitHub dependency)

- Production project: `minbaktokyos` → `tokyominbak.net`
- Staging/dev project: `chris-projects` → `airbnb-clone-six-hazel-53.vercel.app`

Always run `npm run check` before deploying.

## Language Convention

User-facing text, comments, and documentation are written in **Korean**. Host-dashboard pages additionally support Japanese locale via `HostLocaleProvider`.
