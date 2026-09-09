# Outsauce

An all-in-one platform for job seekers, freelancers, and employers to discover opportunities across multiple platforms, manage leads, build professional networks, and generate AI-powered content — all from a single dashboard.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [Frontend (Next.js)](#frontend-nextjs)
  - [Routes](#routes)
  - [UI Components](#ui-components)
  - [Authentication Flow](#authentication-flow)
- [Backend (NestJS)](#backend-nestjs)
  - [API Endpoints](#api-endpoints)
  - [Guards and Decorators](#guards-and-decorators)
  - [Modules](#modules)
- [Database Schema](#database-schema)
- [Integrations](#integrations)
- [Plan Tiers and Limits](#plan-tiers-and-limits)
- [Scripts Reference](#scripts-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Multi-Platform Scraping
Configure and launch scrape jobs across LinkedIn, Upwork, Fiverr, and Reddit. Define search criteria including keywords, location, salary range, experience level, and remote preference. Monitor scrape progress in real time with live status updates via Supabase Realtime.

### Lead Management
Save scrape results as leads, organize them into color-coded folders, apply custom tags, and track status through a pipeline (New, Contacted, In Progress, Closed, Archived). Add notes, bulk-save results, and export leads as CSV or JSON.

### Lead Match Scoring
Every scraped result is automatically scored for relevance against the user's profile and search criteria as it's ingested from n8n. Scoring runs through `LeadScoringService`, which calls Groq (Llama 3.3 70B) to rate each lead and surface the strongest matches first. Scores appear as a badge in the leads table, letting users prioritize outreach instead of manually triaging every result.

### Professional Networking
Discover other users on the platform with an interest/skill-based matching algorithm. Send connection requests with personalized messages, accept or reject incoming requests, and manage your network.

### Messaging
Real-time 1:1 conversations with other users. Messages are delivered via Supabase Realtime with read receipts and unread counts.

### AI Content Generation
Generate professional content tailored to specific platforms:
- **Bio** — personal/professional biography
- **Resume** — formatted resume content
- **Cover Letter** — job-specific cover letters
- **Gig Description** — freelance listing descriptions
- **Profile Summary** — platform-optimized profile summaries

Target platforms: LinkedIn, Upwork, Fiverr, Reddit.

### AI-Tailored Content Generation
Beyond generic content generation, users can tailor a resume or cover letter to a specific saved lead. The tailoring workflow combines deterministic keyword-matching (scoring overlap between the lead's listing and the user's base content) with Groq-powered rewriting (Llama 3.3 70B) to align tone, keywords, and emphasis with the target listing — producing a version noticeably closer to what an ATS or hiring manager for that specific role expects, rather than a one-size-fits-all draft.

### Billing and Subscriptions
Tiered subscription plans (Free, Starter, Pro, Enterprise) with usage tracking for scrapes, leads, and AI generations. Stripe integration for checkout and customer portal management.

### Notifications
Real-time notification system with strict per-user privacy (Row Level Security). Users receive instant alerts for:
- **Scrape Completed** — when a scraping job finishes processing
- **New Messages** — when another user sends a message
- **Network Matches** — when a relevant freelancer or employer becomes active
- **System Alerts** — onboarding reminders, plan limits, and platform updates

Notifications appear via a live bell icon in the header bar (with unread count badge) and a dedicated `/notifications` page. Users can mark individual or all notifications as read, and delete notifications. The system uses Supabase Realtime for instant delivery without page refresh.

### Settings and Profile
Full profile management with onboarding flow, user type selection (Job Seeker, Freelancer, Employer), skills/interests tagging, discoverability toggle, and linked accounts.

### Contact Form
Public contact page at `/contact` that saves messages to the database and sends a best-effort email notification to admins via a Supabase Edge Function (`send-contact-email`). Messages are always persisted to `contact_submissions` regardless of email delivery.

### Admin Module
A secure, role-gated admin panel accessible only to users with `is_admin = true`. Protected by both `SupabaseAuthGuard` and `AdminGuard` on the backend, and a server-side layout check + middleware on the frontend. Includes six dashboards:

- **Analytics** — platform-wide stats (total users, leads saved, scrapes run)
- **User Management** — view all users, create/edit/delete accounts, change platform role (Job Seeker / Freelancer / Employer), subscription plan, and admin access
- **Billing Overview** — plan distribution and estimated MRR across all subscribers
- **Scraping Health** — total, completed, failed, and running scrape job counts
- **AI Usage** — total AI generations broken down by tool type (generation, tailoring, and lead scoring)
- **Support Inbox** — email-client-style inbox for reading and replying to contact form submissions; replies are sent via Gmail SMTP and auto-mark the message as read with a `replied_at` timestamp

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Monorepo** | Turborepo | 2.x |
| **Package Manager** | pnpm | 10.29.3 |
| **Frontend** | Next.js (App Router) | 16.2.1 |
| **UI Framework** | React | 19.2.4 |
| **UI Components** | shadcn/ui (base-nova style) | 4.1.1 |
| **Styling** | Tailwind CSS | 4.x |
| **Icons** | lucide-react | 1.7.x |
| **Backend** | NestJS | 11.x |
| **Validation** | Zod | 3.25.x |
| **Database** | Supabase (PostgreSQL) | — |
| **Auth** | Supabase Auth (SSR) | — |
| **Realtime** | Supabase Realtime | — |
| **Payments** | Stripe | — |
| **Scraping Engine** | n8n (webhook integration) | — |
| **AI** | Groq (Llama 3.3 70B) | — |
| **Runtime** | Node.js | 22 |
| **Language** | TypeScript | 5.x |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
   ┌──────────▼──────────┐   ┌─────────▼──────────┐
   │   Next.js Frontend  │   │   NestJS API        │
   │   (Port 3000)       │   │   (Port 3001)       │
   │                     │   │                     │
   │  - App Router       │   │  - REST endpoints   │
   │  - Server Components│   │  - Auth guard       │
   │  - shadcn/ui        │   │  - Zod validation   │
   │  - Supabase SSR     │   │  - Business logic   │
   └──────────┬──────────┘   └─────────┬──────────┘
              │                         │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │       Supabase          │
              │                         │
              │  - PostgreSQL (DB)      │
              │  - Auth (JWT)           │
              │  - Realtime (WebSocket) │
              │  - Row Level Security   │
              └────────────┬────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │    Stripe   │ │     n8n     │ │    Groq     │
    │  (Payments) │ │  (Scraping) │ │   (AI Gen)  │
    └─────────────┘ └─────────────┘ └─────────────┘
```

**Request flow:**
1. User authenticates via Supabase Auth (email/password or OAuth)
2. Next.js middleware refreshes the session on every request
3. Frontend calls the NestJS API with the Supabase access token as a Bearer token
4. NestJS `SupabaseAuthGuard` validates the token and extracts the user
5. API performs business logic, enforces plan limits, and queries Supabase

---

## Project Structure

```
outsauce/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts               # App bootstrap (port 3001, CORS, /api prefix)
│   │   │   ├── app.module.ts          # Root module
│   │   │   ├── common/
│   │   │   │   ├── decorators/        # @CurrentUser() decorator
│   │   │   │   ├── filters/           # HttpExceptionFilter
│   │   │   │   ├── guards/            # SupabaseAuthGuard
│   │   │   │   └── pipes/             # ZodValidationPipe
│   │   │   ├── supabase/              # SupabaseService (admin + user clients)
│   │   │   └── modules/
│   │   │       ├── auth/              # Profile CRUD, onboarding
│   │   │       ├── scrapes/           # Scrape job management
│   │   │       ├── webhooks/          # n8n result ingestion
│   │   │       ├── leads/             # Lead/folder/tag CRUD
│   │   │       ├── export/            # CSV/JSON/PDF export
│   │   │       ├── messages/          # Conversations & messaging
│   │   │       ├── network/           # User discovery & connections
│   │   │       ├── billing/           # Stripe subscriptions & usage
│   │   │       └── ai-tools/          # AI content generation
│   │   ├── test/                      # E2E tests
│   │   └── package.json
│   │
│   └── web/                           # Next.js frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── globals.css        # OKLCH theme variables
│       │   │   ├── layout.tsx         # Root layout
│       │   │   ├── page.tsx           # Landing page
│       │   │   ├── (auth)/            # Auth route group
│       │   │   │   ├── layout.tsx     # Centered card layout
│       │   │   │   ├── login/
│       │   │   │   ├── signup/
│       │   │   │   └── callback/      # OAuth callback
│       │   │   └── (dashboard)/       # Protected route group
│       │   │       ├── layout.tsx     # Sidebar + header layout
│       │   │       ├── dashboard/
│       │   │       ├── scrapes/       # /scrapes, /scrapes/new, /scrapes/[id]
│       │   │       ├── leads/         # /leads, /leads/[id]
│       │   │       ├── messages/      # /messages, /messages/[conversationId]
│       │   │       ├── network/
│       │   │       ├── ai-tools/
│       │   │       ├── billing/
│       │   │       ├── notifications/   # /notifications (real-time alerts)
│       │   │       └── settings/
│       │   ├── components/
│       │   │   ├── ui/                # 20 shadcn/ui components
│       │   │   ├── shared/            # AppSidebar, Header, NotificationBell
│       │   │   ├── auth/              # LoginForm, SignupForm
│       │   │   ├── scrapes/           # ScrapeConfigForm, ScrapeResultsTable, ScrapeStatusBadge
│       │   │   └── leads/             # LeadTable, FolderSidebar, TagManager
│       │   ├── hooks/
│       │   │   ├── use-realtime-scrape.ts
│       │   │   ├── use-realtime-messages.ts
│       │   │   └── use-mobile.ts
│       │   └── lib/
│       │       ├── api-client.ts      # Typed fetch wrapper with auth
│       │       ├── utils.ts           # cn() utility (clsx + tailwind-merge)
│       │       └── supabase/
│       │           ├── client.ts      # Browser client
│       │           ├── server.ts      # Server client
│       │           └── middleware.ts   # Auth session refresh
│       ├── middleware.ts              # Route protection
│       ├── components.json            # shadcn configuration
│       └── package.json
│
├── packages/
│   └── shared/                        # Shared types, schemas, constants
│       ├── src/
│       │   ├── types/
│       │   │   ├── profile.ts         # Profile, UserType
│       │   │   ├── scrape.ts          # ScrapeJob, ScrapeResult, ScrapeSource, ScrapeStatus
│       │   │   ├── lead.ts            # Lead, LeadFolder, Tag, LeadStatus
│       │   │   ├── message.ts         # Conversation, Message, MessageStatus
│       │   │   ├── billing.ts         # Subscription, Usage, PlanTier, PlanLimits
│       │   │   └── network.ts         # Connection, ConnectionStatus
│       │   ├── schemas/
│       │   │   ├── profile.schema.ts  # Onboarding & update schemas
│       │   │   ├── scrape.schema.ts   # Create scrape schema
│       │   │   └── lead.schema.ts     # Create/update/bulk lead schemas
│       │   └── constants/
│       │       ├── plans.ts           # PLAN_LIMITS per tier
│       │       └── sources.ts         # SCRAPE_SOURCES metadata
│       └── package.json
│
├── supabase/
│   ├── migrations/                    # SQL migration files
│   │   ├── 001_profiles.sql
│   │   ├── 002_scrape_jobs.sql
│   │   ├── 003_scrape_results.sql
│   │   ├── 004_leads.sql
│   │   ├── 005_connections.sql
│   │   ├── 006_messages.sql
│   │   ├── 007_billing.sql
│   │   ├── 008_ai_generations.sql
│   │   ├── 009_add_verification_flag.sql
│   │   ├── 010_contact_submissions.sql
│   │   ├── 011_notifications.sql
│   │   └── 012_add_contact_fields.sql  # subject, is_read, replied_at
│   └── functions/
│       └── send-contact-email/        # Deno edge function (Gmail SMTP notification)
│
├── turbo.json                         # Turborepo pipeline config
├── pnpm-workspace.yaml               # Workspace definitions
├── package.json                       # Root scripts
├── .env.example                       # Environment template
├── .nvmrc                             # Node 22
└── .gitignore
```

---

## Getting Started

### Prerequisites

- **Node.js** 22+ (see `.nvmrc`)
- **pnpm** 10.29+ (`corepack enable && corepack prepare pnpm@10.29.3 --activate`)
- **Supabase CLI** for local development (`npx supabase init`)
- **n8n** (optional, for scraping workflows)
- **Stripe CLI** (optional, for billing webhook testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/Elixxir-Dev/outsauce.git
cd outsauce

# Install dependencies
pnpm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXT_PUBLIC_API_URL` | Yes | NestJS API base URL (default: `http://localhost:3001`) |
| `API_PORT` | No | API server port (default: `3001`) |
| `N8N_WEBHOOK_URL` | No | n8n webhook endpoint for triggering scrapes |
| `N8N_WEBHOOK_SECRET` | No | Shared secret for n8n webhook authentication |
| `STRIPE_SECRET_KEY` | No | Stripe secret key for billing |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key (client-side) |
| `STRIPE_STARTER_PRICE_ID` | No | Stripe Price ID for Starter plan |
| `STRIPE_PRO_PRICE_ID` | No | Stripe Price ID for Pro plan |
| `STRIPE_ENTERPRISE_PRICE_ID` | No | Stripe Price ID for Enterprise plan |
| `GROQ_API_KEY` | No | Groq API key for AI content generation (Llama) |
| `GROQ_MODEL` | No | Groq model ID; defaults to `llama-3.3-70b-versatile` |
| `NODE_ENV` | No | Environment (`development` / `production`) |

### Database Setup

Start a local Supabase instance and run migrations (requires [Docker](https://docs.docker.com/get-docker/) running):

```bash
# Start local Supabase services (Postgres, Auth, Realtime, Storage)
npx supabase start

# The output will display your local credentials:
#   API URL:          http://127.0.0.1:54321
#   anon key:         eyJ...
#   service_role key: eyJ...
# Copy these into your .env file.

# Apply database migrations (local)
npx supabase db reset
```

The migrations will create all required tables, enums, indexes, Row Level Security policies, and triggers.

**Useful commands:**
- `npx supabase status` — show running services and credentials
- `npx supabase stop` — shut down local Supabase
- `npx supabase db reset` — reset database and re-run all migrations
- `npx supabase db push` — push migrations to a remote/linked Supabase project

### Running the App

Open **two terminals** and run:

```bash
# Terminal 1 — Next.js frontend (http://localhost:3000)
pnpm dev:web

# Terminal 2 — NestJS backend (http://localhost:3001)
pnpm dev:api
```

### Running the Contact Email Service (Optional)

The contact form sends emails via a Supabase Edge Function powered by Gmail SMTP. To test this locally, open a **third terminal**:

```bash
npx supabase functions serve send-contact-email --no-verify-jwt --env-file .env
```

> This is only needed when testing the `/contact` page email submission locally.
> In production, deploy the function once with `npx supabase functions deploy send-contact-email` and it runs automatically — no manual step required.

> **Credentials note:** Google OAuth and SMTP credentials are not stored in this repository. Request `TEAM_CREDENTIALS.md` from the project lead through a private channel.

---

## Frontend (Next.js)

### Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with features overview and sign-up CTAs |
| `/contact` | Public | Contact form — saves to DB + triggers admin email notification |
| `/login` | Public | Email/password and OAuth login |
| `/signup` | Public | New account registration |
| `/forgot-password` | Public | Request OTP for password reset |
| `/reset-password` | Public | Enter OTP code + set new password |
| `/callback` | Public | OAuth redirect handler |
| `/onboarding` | Protected | 4-step profile setup wizard (new users) |
| `/dashboard` | Protected | Home dashboard with stats and onboarding steps |
| `/scrapes` | Protected | List all scrape jobs with status badges |
| `/scrapes/new` | Protected | Configure and launch a new scrape |
| `/scrapes/[id]` | Protected | Scrape detail with real-time status and results table |
| `/leads` | Protected | Lead list with folder sidebar, tag filters, and export |
| `/leads/[id]` | Protected | Lead detail with status, notes, tags, and delete |
| `/messages` | Protected | Conversation inbox with unread indicators |
| `/messages/[id]` | Protected | Real-time chat interface |
| `/network` | Protected | User discovery with match scores and connection requests |
| `/ai-tools` | Protected | AI content generator with history |
| `/billing` | Protected | Subscription plans, usage meters, and plan management |
| `/notifications` | Protected | Real-time notification feed with mark-read and delete |
| `/settings` | Protected | Profile editing, preferences, and linked accounts |
| `/admin` | Admin only | Platform analytics overview |
| `/admin/users` | Admin only | Full user management (create, edit role/plan, delete) |
| `/admin/billing` | Admin only | Billing overview and plan distribution |
| `/admin/scrapes` | Admin only | Platform-wide scraping health stats |
| `/admin/ai` | Admin only | AI generation usage breakdown by tool |
| `/admin/contact` | Admin only | Support inbox — read, reply, and delete contact messages |

### UI Components

The frontend uses [shadcn/ui](https://ui.shadcn.com/) v4 with the **base-nova** style (built on `@base-ui/react` primitives). 20 components are installed:

`Alert` `Avatar` `Badge` `Button` `Card` `Checkbox` `DropdownMenu` `Input` `Label` `Progress` `RadioGroup` `Select` `Separator` `Sheet` `Sidebar` `Skeleton` `Table` `Tabs` `Textarea` `Tooltip`

---

### Design System

The OutSauce design system is applied globally across the landing page, authentication screens, and all dashboard views. It is defined in `apps/web/src/app/globals.css` and enforced as a project-wide standard.

#### Brand Tokens

| Token | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| Brand Red | `--brand-red` | `#C41E1E` | Primary actions, CTAs, accents |
| Deep Navy | `--brand-navy` | `#020617` | Dark mode background |
| Slate White | `--bg-main-light` | `#F1F5F9` | Light mode background |
| Text Main (Dark) | `--text-main` | `#F1F5F9` | Primary headers and body (dark mode) |
| Text Main (Light) | `--text-main` | `#0F172A` | Primary headers and body (light mode) |
| Text Muted (Dark) | `--text-muted` | `#94A3B8` | Secondary info (dark mode) |
| Text Muted (Light) | `--text-muted` | `#64748B` | Secondary info (light mode) |

#### Theme Modes

**🌙 Dark Mode (Default)**
- Background: `#020617` (Deep Navy)
- Glass panel: `rgba(255, 255, 255, 0.03)` with `rgba(255, 255, 255, 0.08)` border
- Navigation: Glass panel + `blur(24px)`
- Shadows: `rgba(0, 0, 0, 0.20)` for subtle depth

**☀️ Light Mode**
- Background: `#F8FAFC` (Slate White)
- Glass panel: `rgba(0, 0, 0, 0.02)` with `rgba(0, 0, 0, 0.06)` border
- Navigation: `rgba(15, 23, 42, 0.08)` background with `rgba(15, 23, 42, 0.12)` border
- Shadows: `rgba(0, 0, 0, 0.05)` to lift panels

#### Typography
- **Primary Font:** `Plus Jakarta Sans` (Google Fonts)
- **Hero Weight:** 800 (Extra Bold) with `letter-spacing: -0.04em`
- **Subheader Weight:** 500 (Medium)
- **Dashboard Font:** `Inter` via Tailwind

#### Component Specs

| Component | Spec |
|-----------|------|
| Navigation pill | `border-radius: 999px`, lifts `-2px` on hover |
| Bento / Glass cards | `border-radius: 2rem`, `padding: 2.5rem`, light-glow hover |
| Auth cards | Glassmorphic, `backdrop-blur-xl`, dual-mode border prominence |
| Buttons (primary) | `border-radius: 999px`, Brand Red background, scale `1.05` on hover |
| Inputs | `border-radius: 0.75rem`, subtle glass background |

#### Animations & Effects
- **Particle system:** 120 particles at `0.2vx/vy` (`EtherealDust` component)
  - Dark: `rgba(241, 245, 249, 0.1)` — Light: `rgba(15, 23, 42, 0.1)`
- **Scan line:** 2px gradient animated top → bottom over 3s in preview containers
- **Transitions:** `0.3s cubic-bezier(0.4, 0, 0.2, 1)` globally
- **Bento card hover:** Mouse-position radial gradient via `--x` / `--y` CSS variables + translate `-5px`

---

### Authentication Flow

1. User signs up or logs in via Supabase Auth (email/password or Google OAuth)
2. On signup, an OTP verification email is sent — user enters the 6-digit code to verify
3. Next.js middleware (`middleware.ts`) refreshes the Supabase session on every request and clears stale/invalid tokens automatically, redirecting to `/login`
4. `AuthSessionGuard` (client-side) monitors `onAuthStateChange` events and handles token expiry mid-session
5. Protected routes redirect unauthenticated users to `/login`
6. Authenticated users on `/login` or `/signup` are redirected to `/dashboard`
7. Password reset uses a 2-step OTP flow: request email → enter 6-digit code → set new password
8. The `apiClient` automatically attaches the current session token to API requests

---

## Backend (NestJS)

The API runs on port 3001 with a global `/api` prefix. All endpoints (except webhooks) are protected by `SupabaseAuthGuard`.

### API Endpoints

#### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/profile` | Get current user's profile |
| `POST` | `/auth/profile` | Complete onboarding |
| `PATCH` | `/auth/profile` | Update profile fields |

#### Scrapes (`/api/scrapes`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/scrapes` | Create a new scrape job |
| `GET` | `/scrapes` | List user's scrape jobs (paginated) |
| `GET` | `/scrapes/:id` | Get scrape job details |
| `GET` | `/scrapes/:id/results` | Get scrape results (paginated) |
| `POST` | `/scrapes/:id/cancel` | Cancel a running scrape |

#### Leads (`/api/leads`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/leads` | Save a scrape result as a lead |
| `POST` | `/leads/bulk` | Bulk save scrape results as leads |
| `GET` | `/leads` | List leads (filter by status, folder, tag) |
| `GET` | `/leads/:id` | Get lead details |
| `PATCH` | `/leads/:id` | Update lead (status, notes, folder) |
| `DELETE` | `/leads/:id` | Delete a lead |
| `GET` | `/leads/folders` | List folders |
| `POST` | `/leads/folders` | Create a folder |
| `PATCH` | `/leads/folders/:id` | Rename a folder |
| `DELETE` | `/leads/folders/:id` | Delete a folder |
| `GET` | `/leads/tags` | List tags |
| `POST` | `/leads/tags` | Create a tag |
| `PATCH` | `/leads/tags/:id` | Rename a tag |
| `DELETE` | `/leads/tags/:id` | Delete a tag |
| `POST` | `/leads/:id/tags` | Add tags to a lead |
| `DELETE` | `/leads/:id/tags/:tagId` | Remove a tag from a lead |

#### Messages (`/api/messages`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/messages/conversations` | Create or get a conversation |
| `GET` | `/messages/conversations` | List user's conversations |
| `GET` | `/messages/conversations/:id/messages` | Get messages (paginated) |
| `POST` | `/messages/conversations/:id/send` | Send a message |
| `PATCH` | `/messages/conversations/:id/read` | Mark conversation as read |

#### Network (`/api/network`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/network/discover` | Discover users with match scores |
| `POST` | `/network/connect` | Send a connection request |
| `PATCH` | `/network/connections/:id` | Accept or reject a request |
| `GET` | `/network/connections` | List connections |

#### AI Tools (`/api/ai-tools`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai-tools/generate` | Generate AI content |
| `GET` | `/ai-tools/history` | Get generation history (paginated) |

#### Billing (`/api/billing`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/billing/subscription` | Get subscription and usage data |
| `POST` | `/billing/checkout` | Create a Stripe checkout session |
| `POST` | `/billing/portal` | Create a Stripe customer portal session |
| `POST` | `/billing/webhook` | Handle Stripe webhooks |

#### Export (`/api/export`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/export/leads` | Export leads as CSV, JSON, or PDF |

#### Webhooks (`/api/webhooks`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/webhooks/n8n/results` | Receive scrape results from n8n |

#### Admin (`/api/admin`) — requires `is_admin = true`
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/analytics` | Platform-wide stats (users, leads, scrapes) |
| `GET` | `/admin/users` | List all registered users |
| `POST` | `/admin/users` | Create a new user account |
| `PATCH` | `/admin/users/:id` | Update name, platform role, admin flag |
| `DELETE` | `/admin/users/:id` | Permanently delete a user |
| `PATCH` | `/admin/users/:id/plan` | Change a user's subscription plan |
| `GET` | `/admin/billing` | Billing overview and MRR estimate |
| `GET` | `/admin/scrapes` | Scraping health stats |
| `GET` | `/admin/ai` | AI generation usage by tool |
| `GET` | `/admin/contact` | List all contact form submissions |
| `PATCH` | `/admin/contact/:id/read` | Mark message read/unread |
| `POST` | `/admin/contact/:id/reply` | Send email reply via Gmail SMTP |
| `DELETE` | `/admin/contact/:id` | Delete a contact submission |

### Guards and Decorators

- **`SupabaseAuthGuard`** — validates the Bearer token against Supabase, rejects invalid/expired tokens
- **`AdminGuard`** — secondary guard that checks `is_admin = true` on the user's profile; used on all `/admin/*` routes
- **`@CurrentUser()`** — parameter decorator that extracts the authenticated user from the request
- **`ZodValidationPipe`** — validates request bodies against Zod schemas
- **`HttpExceptionFilter`** — global exception handler for consistent error responses

### Modules

The API is organized into 10 feature modules, each with its own controller and service:

| Module | Responsibility |
|--------|---------------|
| `AuthModule` | User profiles, onboarding |
| `ScrapesModule` | Scrape job lifecycle, n8n triggers |
| `WebhooksModule` | Ingest results from n8n |
| `LeadsModule` | Leads, folders, tags CRUD |
| `ExportModule` | Lead data export (CSV/JSON/PDF) |
| `MessagesModule` | Conversations and real-time messaging |
| `NetworkModule` | User discovery and connections |
| `BillingModule` | Stripe subscriptions and usage tracking |
| `AiToolsModule` | AI content generation |
| `AdminModule` | Admin-only platform management (users, billing, scrapes, AI, support inbox) |

---

## Database Schema

The Supabase PostgreSQL database contains 16 tables across 12 migrations:

```
profiles ─────────────┐
  │                    │
  ├── scrape_jobs      │
  │     └── scrape_results
  │                    │
  ├── leads ◄──────── scrape_results
  │   ├── lead_tags ──► tags
  │   └── folder_id ──► lead_folders
  │                    │
  ├── connections      │
  │                    │
  ├── conversations    │
  │   ├── conversation_participants
  │   └── messages     │
  │                    │
  ├── notifications    │
  ├── subscriptions    │
  ├── usage            │
  └── ai_generations   │

contact_submissions   (public inserts, admin reads/writes)
  ├── id, name, email, subject
  ├── message, is_read, replied_at
  └── created_at
```

**Security:**
- Row Level Security (RLS) is enabled on all tables
- Users can only read/write their own data
- Discoverable profiles are visible to all authenticated users
- Conversation participants can view and send messages
- Connection recipients can accept/reject requests
- `contact_submissions` allows public inserts (contact form) but reads are restricted to authenticated users

**Realtime:**
- `messages`, `scrape_jobs`, and `notifications` tables are published for real-time subscriptions

**Triggers:**
- Auto-create `profiles` row when a user signs up via `auth.users`
- Auto-create `subscriptions` (free tier) and `usage` rows when a profile is created

**Admin flag:**
- `profiles.is_admin (boolean)` — set to `true` to grant admin panel access; checked by `AdminGuard` on every admin API call

---

## Integrations

### Supabase
Primary backend-as-a-service providing PostgreSQL database, authentication (email/password + OAuth), real-time subscriptions, and Row Level Security.

### n8n (Scraping Engine)
Outsauce triggers n8n workflows via webhook to perform the actual web scraping. The n8n workflow scrapes the configured sources and posts results back to `/api/webhooks/n8n/results`. This decouples the scraping logic from the main application.

**Setup:** Deploy n8n and configure a webhook workflow that accepts scrape criteria and returns structured results to the callback URL.

### Stripe (Payments)
Handles subscription checkout, plan changes, and customer portal. Webhook events update the local `subscriptions` table.

> **Note:** Stripe integration is currently stubbed. Connect your Stripe account and configure price IDs to enable billing.

### Groq (AI Generation)
Powers three AI-driven capabilities via the Groq API (Llama 3.3 70B):
- **Content generation** — bio, resume, cover letter, gig description, profile summary
- **Content tailoring** — rewriting a resume/cover letter against a specific lead, combined with deterministic keyword-match scoring
- **Lead match scoring** — automatic relevance scoring of scrape results as they're ingested, via `LeadScoringService`

Set `GROQ_API_KEY` to enable. The default model is `llama-3.3-70b-versatile`; override with `GROQ_MODEL` if needed. Without a key set, generation, tailoring, and scoring endpoints return a 503.

---

## Plan Tiers and Limits

| Resource | Free | Starter ($19/mo) | Pro ($49/mo) | Enterprise ($99/mo) |
|----------|------|-------------------|--------------|---------------------|
| Scrape Jobs / month | 5 | 50 | Unlimited | Unlimited |
| Saved Leads / month | 20 | 200 | Unlimited | Unlimited |
| AI Generations / month | 10 | 100 | Unlimited | Unlimited |

Usage is tracked per billing period and enforced server-side. Usage counters reset at the start of each period.

---

## Scripts Reference

### Root (Turborepo)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps for production |
| `pnpm lint` | Lint all apps |
| `pnpm clean` | Clean build artifacts |
| `pnpm dev:web` | Start only the frontend |
| `pnpm dev:api` | Start only the backend |
| `pnpm build:web` | Build only the frontend |
| `pnpm build:api` | Build only the backend |

### Frontend (`apps/web`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Next.js dev server (port 3000) |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

### Backend (`apps/api`)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start NestJS in watch mode (port 3001) |
| `pnpm build` | Compile TypeScript |
| `pnpm start:prod` | Start production server |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm test:cov` | Run tests with coverage |
| `pnpm lint` | Run ESLint with auto-fix |
| `pnpm format` | Format code with Prettier |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run linting and tests (`pnpm lint && pnpm test`)
5. Commit with a descriptive message
6. Push and open a Pull Request

---

## License

This project is proprietary and unlicensed for public distribution.