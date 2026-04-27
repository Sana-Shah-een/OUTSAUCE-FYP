# Final Year Project Synopsis

---

## Project Title

**Outsauce: An AI-Powered Multi-Platform Opportunity Aggregation and Professional Networking System**

---

## 1. Introduction

The modern job market and freelance economy are fragmented across multiple platforms — LinkedIn, Upwork, Fiverr, Reddit, and many others. Job seekers, freelancers, and employers spend significant time manually browsing these platforms, tracking opportunities, and managing their professional presence. There is no unified tool that aggregates opportunities from multiple sources, provides intelligent lead management, enables professional networking, and leverages artificial intelligence to optimize user profiles and content.

**Outsauce** addresses this gap by providing an all-in-one web-based platform that automates the discovery process across multiple job and freelance platforms, offers a structured pipeline for managing and organizing leads, facilitates professional networking with interest-based matching, and integrates AI-powered content generation tools for crafting platform-specific professional content.

---

## 2. Problem Statement

Professionals navigating the job and freelance market face several interconnected challenges:

1. **Platform Fragmentation**: Opportunities are scattered across LinkedIn, Upwork, Fiverr, Reddit, and other platforms. Users must manually visit each platform, perform separate searches, and track results independently.

2. **Inefficient Lead Management**: There is no standardized way to save, categorize, and track the status of discovered opportunities across platforms. Users resort to spreadsheets or note-taking apps that lack structure and automation.

3. **Limited Networking Tools**: Existing platforms confine networking to their own ecosystems. There is no cross-platform mechanism for connecting with like-minded professionals based on shared skills and interests.

4. **Time-Consuming Content Creation**: Writing tailored bios, cover letters, resumes, and gig descriptions for different platforms is repetitive and time-intensive. Each platform has its own tone, format, and best practices.

5. **Lack of Centralized Analytics**: Users have no visibility into their search patterns, lead conversion rates, or usage trends across their job-seeking or hiring activities.

---

## 3. Objectives

The primary objectives of this project are:

1. **Design and develop a multi-platform web scraping system** that aggregates job and freelance opportunities from LinkedIn, Upwork, Fiverr, and Reddit using configurable search criteria.

2. **Build a comprehensive lead management system** with folder organization, custom tagging, status tracking (New, Contacted, In Progress, Closed, Archived), and export capabilities (CSV, JSON).

3. **Implement a professional networking module** with user discovery, interest/skill-based matching algorithms, connection requests, and real-time messaging.

4. **Integrate AI-powered content generation tools** capable of producing platform-optimized bios, resumes, cover letters, gig descriptions, and profile summaries.

5. **Develop a subscription-based billing system** with tiered plans (Free, Starter, Pro, Enterprise) and usage-based resource limits.

6. **Ensure responsive design** that delivers a consistent and accessible user experience across desktop and mobile devices.

7. **Implement robust authentication and authorization** with email/password and OAuth (Google) sign-in, session management, and Row Level Security at the database level.

---

## 4. Scope

### In Scope

- Multi-platform opportunity scraping (LinkedIn, Upwork, Fiverr, Reddit)
- User registration, authentication (email + Google OAuth), and profile onboarding
- Lead management with folders, tags, status pipeline, notes, and export
- Professional networking with discovery, matching, and connection management
- Real-time messaging between connected users
- AI-powered content generation for multiple tool types and target platforms
- Subscription management with tiered plans and usage tracking
- Responsive web interface for desktop and mobile
- Role-based user types: Job Seeker, Freelancer, Employer
- Comprehensive Admin Module for analytics, user management, and support inbox
- Public contact system with automated email notifications

### Out of Scope

- Native mobile applications (iOS/Android)
- Browser extension
- Automated job application submission
- Resume parsing / document upload
- Video calling or voice messaging
- Integration with Applicant Tracking Systems (ATS)

---

## 5. Proposed Methodology

The project follows an **Agile development methodology** with iterative sprints, enabling continuous integration of features and feedback.

### 5.1 Development Phases

| Phase | Description | Deliverables |
|-------|-------------|--------------|
| **Phase 1: Foundation** | Monorepo setup, authentication, database schema, base UI | Project structure, auth flow, profile management |
| **Phase 2: Scraping Engine** | Multi-platform scraping with n8n integration, real-time status | Scrape configuration, job execution, results display |
| **Phase 3: Lead Management** | Lead CRUD, folders, tags, filtering, bulk operations, export | Lead pipeline, organization tools, CSV/JSON export |
| **Phase 4: Networking & Messaging** | User discovery, matching algorithm, connections, real-time chat | Network module, messaging system |
| **Phase 5: AI Tools & Billing** | AI content generation, Stripe billing, usage tracking | AI generator, subscription plans, usage limits |
| **Phase 6: UI/UX Revamp** | shadcn/ui migration, responsive design, color theming | Polished, accessible, mobile-ready interface |

### 5.2 Architecture Pattern

The system employs a **three-tier architecture**:

```
Presentation Tier       Application Tier         Data Tier
┌──────────────┐       ┌──────────────────┐     ┌──────────────┐
│  Next.js     │ HTTP  │  NestJS REST API │     │  PostgreSQL  │
│  (React SSR) │◄─────►│  (Business Logic)│◄───►│  (Supabase)  │
│  Frontend    │       │  Backend         │     │  + Auth      │
└──────────────┘       └──────────────────┘     │  + Realtime  │
                              │                 └──────────────┘
                     ┌────────┼────────┐
                     │        │        │
                   n8n     Stripe   OpenAI
                (Scraping) (Billing)  (AI)
```

---

## 6. Technology Stack

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Monorepo Tooling** | Turborepo, pnpm | Efficient multi-package builds with dependency caching and parallel execution |
| **Frontend Framework** | Next.js 16 (App Router) | Server-side rendering, file-based routing, React Server Components for performance |
| **UI Library** | React 19 | Latest concurrent features, server component support |
| **Component Library** | shadcn/ui (base-nova) | Accessible, customizable, copy-paste components built on Base UI primitives |
| **Styling** | Tailwind CSS 4 | Utility-first CSS with OKLCH color theming for perceptually uniform colors |
| **Backend Framework** | NestJS 11 | Modular architecture, dependency injection, TypeScript-first, enterprise patterns |
| **Validation** | Zod | Runtime type validation with TypeScript type inference, shared between frontend and backend |
| **Database** | PostgreSQL (via Supabase) | Relational data model with JSONB support, full-text search, and GIN indexing |
| **Authentication** | Supabase Auth | JWT-based auth with OAuth providers, SSR session management, Row Level Security |
| **Real-time** | Supabase Realtime | WebSocket-based pub/sub for live updates on scrape status and messages |
| **Scraping Orchestration** | n8n | Visual workflow automation for scraping pipelines, webhook-based triggering |
| **Payments** | Stripe | Industry-standard subscription billing with checkout, webhooks, and customer portal |
| **AI Generation** | OpenAI API | GPT-based content generation for professional writing tasks |
| **Runtime** | Node.js 22 | Latest LTS with improved performance and native TypeScript support |

---

## 7. Database Design

The system uses a relational database with **14 tables** organized into the following domains:

### Core Entities

- **profiles** — extends Supabase auth.users with professional details, user type, and admin privileges
- **subscriptions** — one-per-user subscription records with plan tier and Stripe references
- **usage** — per-period usage counters for enforcing plan limits

### Administrative Domain

- **contact_submissions** — records of public contact form submissions with read status and reply tracking

### Scraping Domain

- **scrape_jobs** — scrape configurations with status tracking (pending → running → completed/failed/cancelled)
- **scrape_results** — individual results from scrape jobs with source, title, description, salary data

### Lead Management Domain

- **leads** — saved opportunities with status pipeline, notes, and folder assignment
- **lead_folders** — user-created organizational folders with color coding
- **tags** — user-created labels for categorization
- **lead_tags** — many-to-many junction between leads and tags

### Networking Domain

- **connections** — directional connection requests with status (pending/accepted/rejected)

### Messaging Domain

- **conversations** — conversation containers
- **conversation_participants** — users in a conversation with read timestamps
- **messages** — individual messages with delivery status tracking

### AI Domain

- **ai_generations** — history of AI-generated content with input/output data

### Security

All tables enforce **Row Level Security (RLS)** policies ensuring users can only access their own data, with specific policies for shared resources (discoverable profiles, conversation messages, connection requests).

---

## 8. Key Features and Implementation Details

### 8.1 Multi-Platform Scraping

Users configure scrape jobs by selecting target platforms (LinkedIn, Upwork, Fiverr, Reddit) and defining search criteria including keywords, location, salary range, experience level, and remote work preference. The system triggers an n8n workflow via webhook, which orchestrates the actual scraping. Results are posted back to a webhook endpoint and stored in the database. The frontend displays real-time scrape progress using Supabase Realtime subscriptions.

### 8.2 Lead Management Pipeline

Scrape results can be saved as leads individually or in bulk. Leads are organized through:
- **Status Pipeline**: New → Contacted → In Progress → Closed / Archived
- **Folders**: Color-coded folders for categorical organization
- **Tags**: Custom labels applied to leads for flexible filtering
- **Notes**: Free-text notes per lead for tracking communications
- **Export**: Leads can be exported as CSV or JSON with CSV injection prevention

### 8.3 Interest-Based Networking

The discovery algorithm calculates a **match score** between users based on overlapping interests and skills stored as PostgreSQL arrays with GIN indexes. Users can send connection requests with optional messages, and recipients can accept or reject them.

### 8.4 Real-Time Messaging

Built on Supabase Realtime (WebSocket), the messaging system supports 1:1 conversations with:
- Instant message delivery
- Read receipts and unread message counts
- Message status tracking (sent → delivered → read)

### 8.5 AI Content Generation

The AI module supports five content types (bio, resume, cover letter, gig description, profile summary) with optional platform targeting (LinkedIn, Upwork, Fiverr, Reddit). Generation history is stored for future reference. Usage is metered and enforced per plan tier.

### 8.6 Subscription Billing

Four-tier subscription model:

| Feature | Free | Starter ($19/mo) | Pro ($49/mo) | Enterprise ($99/mo) |
|---------|------|-------------------|--------------|---------------------|
| Scrapes/month | 5 | 50 | Unlimited | Unlimited |
| Leads/month | 20 | 200 | Unlimited | Unlimited |
| AI Generations/month | 10 | 100 | Unlimited | Unlimited |

### 8.7 Admin Module & Support

A secure, role-gated administrative dashboard provides platform operators with:
- System-wide analytics and usage metrics
- Comprehensive user management capabilities
- An integrated support inbox for handling contact form submissions with direct email reply functionality

---

## 9. System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Next.js Frontend                          │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │  Auth    │ │ Dashboard│ │  Scrapes │ │  Leads   │      │ │
│  │  │  Pages   │ │  Page    │ │  Module  │ │  Module  │      │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │ Network  │ │ Messages │ │ AI Tools │ │ Billing  │      │ │
│  │  │  Module  │ │  Module  │ │  Module  │ │  Module  │      │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │ │
│  │                                                              │ │
│  │  shadcn/ui Components  │  Supabase SSR Auth  │  API Client  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────┬───────────────────┬───────────────────────┘
                        │ REST API          │ WebSocket
                        ▼                   ▼
┌──────────────────────────────┐  ┌─────────────────────┐
│      NestJS Backend          │  │  Supabase Realtime   │
│                              │  │  (Live Updates)      │
│  ┌────────┐ ┌────────┐      │  └─────────────────────┘
│  │  Auth  │ │Scrapes │      │
│  │ Guard  │ │ Module │──────│──────► n8n (Scraping)
│  └────────┘ └────────┘      │
│  ┌────────┐ ┌────────┐      │
│  │ Leads  │ │Network │      │
│  │ Module │ │ Module │      │
│  └────────┘ └────────┘      │
│  ┌────────┐ ┌────────┐      │
│  │  AI    │ │Billing │──────│──────► Stripe (Payments)
│  │ Tools  │ │ Module │      │
│  └────────┘ └────────┘      │
│  ┌────────┐                 │
│  │ Admin  │                 │
│  │ Module │                 │
│  └────────┘                 │
│       │                      │
│       └──────────────────────│──────► OpenAI (AI Gen)
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     Supabase (PostgreSQL)    │
│                              │
│  ┌────────────────────────┐  │
│  │  15 Tables with RLS    │  │
│  │  GIN Indexes           │  │
│  │  Triggers & Functions  │  │
│  │  Auth (JWT + OAuth)    │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## 10. Expected Outcomes

Upon completion, the system will:

1. Successfully aggregate opportunities from at least four platforms (LinkedIn, Upwork, Fiverr, Reddit) through automated scraping workflows.
2. Provide a fully functional lead management system with organizational tools that replace manual spreadsheet-based tracking.
3. Enable professional networking with an interest-based matching algorithm that produces relevant connection suggestions.
4. Generate AI-powered professional content that is tailored to specific platforms and use cases.
5. Deliver a responsive web interface that works seamlessly on both desktop and mobile devices.
6. Enforce subscription-based access control with tiered resource limits.
7. Demonstrate a production-grade architecture using modern technologies and best practices.

---

## 11. Tools and Environment

| Tool | Purpose |
|------|---------|
| **VS Code** | Primary development IDE |
| **Git / GitHub** | Version control and collaboration |
| **Docker** | Local Supabase development environment |
| **Postman** | API testing and documentation |
| **Supabase Studio** | Database management and inspection |
| **Stripe Dashboard** | Payment configuration and testing |
| **n8n** | Scraping workflow design and execution |
| **Vercel** | Frontend deployment (production) |
| **Turborepo** | Monorepo build orchestration |

---

## 12. Timeline

| Week | Activity |
|------|----------|
| 1-2 | Requirements analysis, system design, database schema design |
| 3-4 | Monorepo setup, authentication system, profile management |
| 5-6 | Scraping engine with n8n integration, real-time status tracking |
| 7-8 | Lead management system (CRUD, folders, tags, export) |
| 9-10 | Networking module (discovery, matching, connections) |
| 11-12 | Messaging system with real-time delivery |
| 13-14 | AI content generation tools, billing and subscription system |
| 15-16 | UI/UX revamp, responsive design, testing and bug fixes |
| 17-18 | Documentation, deployment, final presentation preparation |

---

## 13. References

1. Next.js Documentation — https://nextjs.org/docs
2. NestJS Documentation — https://docs.nestjs.com
3. Supabase Documentation — https://supabase.com/docs
4. shadcn/ui Documentation — https://ui.shadcn.com
5. Tailwind CSS Documentation — https://tailwindcss.com/docs
6. Stripe API Reference — https://stripe.com/docs/api
7. n8n Documentation — https://docs.n8n.io
8. OpenAI API Reference — https://platform.openai.com/docs
9. Turborepo Documentation — https://turbo.build/repo/docs
10. PostgreSQL Row Level Security — https://www.postgresql.org/docs/current/ddl-rowsecurity.html
