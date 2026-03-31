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

### Billing and Subscriptions
Tiered subscription plans (Free, Starter, Pro, Enterprise) with usage tracking for scrapes, leads, and AI generations. Stripe integration for checkout and customer portal management.

### Settings and Profile
Full profile management with onboarding flow, user type selection (Job Seeker, Freelancer, Employer), skills/interests tagging, discoverability toggle, and linked accounts.

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
| **AI** | OpenAI API | — |
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
    │    Stripe   │ │     n8n     │ │   OpenAI    │
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
│       │   │       └── settings/
│       │   ├── components/
│       │   │   ├── ui/                # 20 shadcn/ui components
│       │   │   ├── shared/            # AppSidebar, Header
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
│   └── migrations/                    # 8 SQL migration files
│       ├── 001_profiles.sql
│       ├── 002_scrape_jobs.sql
│       ├── 003_scrape_results.sql
│       ├── 004_leads.sql
│       ├── 005_connections.sql
│       ├── 006_messages.sql
│       ├── 007_billing.sql
│       └── 008_ai_generations.sql
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
| `OPENAI_API_KEY` | No | OpenAI API key for AI content generation |
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

# Apply database migrations
npx supabase db push
```

The migrations will create all required tables, enums, indexes, Row Level Security policies, and triggers.

**Useful commands:**
- `npx supabase status` — show running services and credentials
- `npx supabase stop` — shut down local Supabase
- `npx supabase db reset` — reset database and re-run all migrations

### Running the App

```bash
# Start both frontend and backend in development mode
pnpm dev

# Or start individually
pnpm dev:web    # Next.js on http://localhost:3000
pnpm dev:api    # NestJS on http://localhost:3001
```

---

## Frontend (Next.js)

### Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page with features overview and sign-up CTAs |
| `/login` | Public | Email/password and OAuth login |
| `/signup` | Public | New account registration |
| `/callback` | Public | OAuth redirect handler |
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
| `/settings` | Protected | Profile editing, preferences, and linked accounts |

### UI Components

The frontend uses [shadcn/ui](https://ui.shadcn.com/) v4 with the **base-nova** style (built on `@base-ui/react` primitives). 20 components are installed:

`Alert` `Avatar` `Badge` `Button` `Card` `Checkbox` `DropdownMenu` `Input` `Label` `Progress` `RadioGroup` `Select` `Separator` `Sheet` `Sidebar` `Skeleton` `Table` `Tabs` `Textarea` `Tooltip`

**Design system:**
- Color palette uses OKLCH format in CSS variables
- Primary: Mauve/Berry (`#853953`)
- Secondary: Dark Plum (`#612D53`)
- Sidebar background: Dark Plum with light text
- Foreground: Charcoal (`#2C2C2C`)
- Background: Light Gray (`#F3F4F4`)

**Responsive design:**
- Sidebar collapses to a Sheet drawer on mobile via `SidebarTrigger`
- Tables hide non-essential columns at breakpoints (`hidden md:table-cell`)
- Forms stack to single column on small screens
- Grid layouts adapt from multi-column to single-column

**Key patterns:**
- `render` prop for composition (base-nova uses `render={<Link />}` instead of Radix's `asChild`)
- `cn()` utility for conditional class merging
- Server Components for data fetching, Client Components for interactivity
- `apiClient<T>()` typed fetch wrapper that auto-attaches Supabase auth tokens

### Authentication Flow

1. User signs up or logs in via Supabase Auth (email/password or Google OAuth)
2. Next.js middleware (`middleware.ts`) refreshes the Supabase session on every request
3. Protected routes redirect unauthenticated users to `/login`
4. Authenticated users on `/login` or `/signup` are redirected to `/dashboard`
5. The `apiClient` automatically attaches the current session token to API requests

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

### Guards and Decorators

- **`SupabaseAuthGuard`** — validates the Bearer token against Supabase, rejects invalid/expired tokens
- **`@CurrentUser()`** — parameter decorator that extracts the authenticated user from the request
- **`ZodValidationPipe`** — validates request bodies against Zod schemas
- **`HttpExceptionFilter`** — global exception handler for consistent error responses

### Modules

The API is organized into 9 feature modules, each with its own controller and service:

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

---

## Database Schema

The Supabase PostgreSQL database contains 14 tables across 8 migrations:

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
  ├── subscriptions    │
  ├── usage            │
  └── ai_generations   │
```

**Security:**
- Row Level Security (RLS) is enabled on all tables
- Users can only read/write their own data
- Discoverable profiles are visible to all authenticated users
- Conversation participants can view and send messages
- Connection recipients can accept/reject requests

**Realtime:**
- `messages` and `scrape_jobs` tables are published for real-time subscriptions

**Triggers:**
- Auto-create `profiles` row when a user signs up via `auth.users`
- Auto-create `subscriptions` (free tier) and `usage` rows when a profile is created

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

### OpenAI (AI Generation)
Powers the AI content generation tools (bio, resume, cover letter, etc.).

> **Note:** AI generation currently returns placeholder content. Add your `OPENAI_API_KEY` and implement the API calls in `AiToolsService` to enable.

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
