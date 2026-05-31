# 🎯 Leads Finder — Local Lead Scraper & outreach CRM

Leads Finder is a premium, high-intent local business lead finder and CRM system designed for solo operators and digital agencies. The system automates the process of finding local business prospects, auditing their digital presence, scoring the quality of the sales opportunity, and tracking outreach pipelines—all within a single, integrated interface.

One-line pipeline: **Scrape ➡️ Filter ➡️ Audit & Score ➡️ Store ➡️ Pipeline CRM ➡️ Client Outreach.**

---

## 🛠️ Core Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | High-performance React application structure |
| **Database** | Supabase (PostgreSQL) | Centralized, persistent storage for leads, audit metadata, and sales deals |
| **Audit Engine** | Heuristic & Regex | High-performance, fast local website auditing, contact form detection, and email crawling |
| **UI Components** | shadcn/ui & Radix UI | Premium, interactive, and accessible visual components |
| **Styling** | Tailwind CSS | Sleek, modern, and fluid responsive design with harmonious custom color palettes |
| **Icons** | Lucide React | Clean, scalable vector outline iconography |

---

## 🚀 Key System Features

### 1. Automated Local Scraper (`src/lib/scraper.ts`)
*   Queries public local business directories using the **Google Places API** (Text Search and Details endpoints).
*   Extracts business names, active phone numbers, reviews, and website domains.
*   **Enforced Constraints**: Caps results at a maximum of `30` per query to manage API costs, and automatically filters out leads that lack phone numbers.

### 2. High-Performance Web Audit (Heuristic & Regex)
*   **Heuristic Analyzer (`src/lib/analyzer.ts`)**: Resolves domains, attempts active `HTTP GET` handshakes with a 5-second timeout, handles redirects, and flags offline pages (404, 502, DNS timeouts).
*   **Structured Parser**: Checks website content for the presence of contact/booking form elements, visible contact or support emails, and evaluates text volume to identify empty/thin content.
*   **Resilient Design**: Runs entirely locally, resulting in instantaneous audits with zero external network API costs, zero token/rate limit concerns, and maximum privacy.

### 3. Intelligent Opportunity Scorer (`src/lib/scorer.ts`)
Prospects are graded on a 100-point opportunity scale:

| Condition | Points Added | Rationale |
|---|:---:|---|
| **No Website** | `+60` | Immediate sales opportunity for a new website setup |
| **Broken Website** | `+40` | Immediate sales opportunity to fix a broken web presence |
| **No Contact Form** | `+15` | Lead capture optimization opportunity |
| **No Email Listed** | `+10` | Standard communication configuration opportunity |
| **Weak Content** | `+10` | Content rewriting/SEO audit opportunity |

*   *Thresholding*: Only prospects with a total opportunity **score > 50** are stored in the database.

### 4. Enterprise-Grade Normalization & Deduplication (`src/lib/deduplicator.ts`)
*   Normalizes website domains (removing protocols, path strings, and trailing slashes).
*   Standardizes phone numbers down to the last 10 digits.
*   Runs unique index lookups before insertions, updating `last_seen` timestamps rather than creating duplicate database rows.

### 5. Outreach Assistant & Sales CRM (`src/app/dashboard/page.tsx`)
*   **Outreach Panel**: Instantly copy or launch communication templates (Email / WhatsApp) customized around the prospect's exact website issues.
*   **CRM Deal Stages**: Drag and log prospects through custom sales funnel stages, assign potential deal values, schedule callback calendars, and log manual follow-up notes.

---

## 📁 Repository Directory Map

```
/
├── app/
│   ├── page.tsx                     # Premium, animated landing page & documentation index
│   ├── layout.tsx                   # Main HTML layout, SEO tags, & font optimization
│   ├── dashboard/
│   │   └── page.tsx                 # Fully-featured pipeline CRM, search interface, & deal tracker
│   └── api/
│       ├── run/
│       │   └── route.ts             # POST — Triggers search, normalization, scoring, and DB storage
│       └── leads/
│           └── route.ts             # GET — Fetch prospects, PATCH — Update status & communication log
├── lib/
│   ├── scraper.ts                   # Google Places API crawler & phone parser
│   ├── analyzer.ts                  # Raw website response checker & HTML fetcher
│   ├── scorer.ts                    # Score aggregator (Heuristic-based)
│   ├── deduplicator.ts              # Normalizes phone numbers & URL formats
│   ├── supabase.ts                  # Supabase service role database client
│   └── utils.ts                     # Tailwind/class-merging utility helpers
├── components/
│   ├── leads-table.tsx              # Scraper results & opportunity preview display
│   ├── crm-leads-table.tsx          # Comprehensive CRM table with deals & stage updates
│   └── ui/                          # Custom shadcn modular UI primitive collection
├── types/
│   └── lead.ts                      # Common TypeScript types for Leads, Results, and Audits
├── postcss.config.js                # PostCSS utility configs
├── tailwind.config.ts               # Custom HSL color schemes, layout systems, & anims
└── tsconfig.json                    # Compiler configurations for TypeScript
```

---

## ⚙️ Environment Configuration

Copy `.env.local.example` to `.env.local` in the root directory:

```bash
cp .env.local.example .env.local
```

Fill in the following variables:

```env
# 1. Supabase Project Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 3. Crawler Credentials
GOOGLE_PLACES_API_KEY=AIzaSy...
```

---

## 🗄️ Database Schema Setup

Execute this script inside the **Supabase SQL Editor** to create the tables, indices, and constraints:

```sql
-- Create leads table
CREATE TABLE leads (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT,
  website     TEXT,
  score       INT DEFAULT 0,
  reason      TEXT,
  source      TEXT,
  called      BOOLEAN DEFAULT false,
  called_at   TIMESTAMP DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  last_seen   TIMESTAMP DEFAULT NOW(),
  notes       TEXT DEFAULT NULL,
  deal_value  NUMERIC DEFAULT 0,
  pipeline_stage TEXT DEFAULT 'Prospect', -- 'Prospect', 'Contacted', 'Proposal Sent', 'Won', 'Lost'
  reminder_date TIMESTAMP DEFAULT NULL
);

-- Unique constraint on phone to prevent duplicates
CREATE UNIQUE INDEX unique_phone_idx
ON leads (phone)
WHERE phone IS NOT NULL;
```

---

## 🏁 Local Development Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) inside your web browser to access the landing page, and navigate to `/dashboard` to run searches and manage lead outreach.

### 3. Production Build
Ensure that environment variables are fully configured in your Vercel project settings, then trigger a production build:
```bash
npm run build
```

---

## 🛡️ Error Resiliency Architecture

| Failure Scenario | Built-in Safety Behavior |
|---|---|
| **Google Places API Issue** | The scraper logs the issue, returns an empty array, and lets the app run normally. |
| **Supabase Query Fault** | Emits console logs, ignoring individual bad rows to continue processing the rest of the batch. |
| **HTTP Handshake Failures** | Automatically assumes the website is `broken` and issues a `+40` score penalty. |

---

Created in partnership with **Antigravity AI**.
