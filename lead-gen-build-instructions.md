# Lead Generation System — Full Build Instructions

> **For the AI Agent:** Read this entire document before writing a single line of code. This is a complete specification. Do not add features not listed here. Do not use libraries not listed here. Build exactly what is described.

---

## 1. What You Are Building

A high-intent local business lead finder.

A solo operator runs this tool daily to find local businesses that have no website or a broken website — then calls them to sell web services.

**One-line summary:** Scrape → Filter → Score → Store → Show → Call.

---

## 2. Tech Stack (Exact — No Substitutions)

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Hosting | Vercel |
| UI Components | shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Language | TypeScript |
| Styling | Tailwind CSS |

**Hard constraints:**
- No Playwright, no Puppeteer — Vercel serverless cannot run browsers
- No Redis, no queues, no background jobs
- No authentication — single user, no login needed
- No external AI APIs

---

## 3. Project Structure

```
/
├── app/
│   ├── page.tsx                  # Main dashboard UI
│   ├── layout.tsx                # Root layout
│   └── api/
│       ├── run/
│       │   └── route.ts          # POST — triggers pipeline
│       └── leads/
│           └── route.ts          # GET — fetch leads, PATCH — mark called
├── lib/
│   ├── scraper.ts                # Scrapes business data via HTTP
│   ├── analyzer.ts               # Checks website status
│   ├── scorer.ts                 # Scores each lead
│   ├── deduplicator.ts           # Normalizes and deduplicates
│   └── supabase.ts               # Supabase client
├── components/
│   └── leads-table.tsx           # Table UI component
├── types/
│   └── lead.ts                   # TypeScript types
└── .env.local                    # Environment variables
```

---

## 4. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 5. Database Setup

Run this SQL in Supabase SQL editor. Run it once before starting the app.

```sql
CREATE TABLE leads (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT,
  phone       TEXT,
  website     TEXT,
  score       INT,
  reason      TEXT,
  source      TEXT,
  called      BOOLEAN DEFAULT false,
  called_at   TIMESTAMP DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  last_seen   TIMESTAMP DEFAULT NOW()
);

-- Unique constraint on phone to prevent duplicates
CREATE UNIQUE INDEX unique_phone_idx
ON leads (phone)
WHERE phone IS NOT NULL;
```

**Column meanings:**
- `name` — business name
- `phone` — normalized 10-digit phone
- `website` — cleaned domain or NULL
- `score` — integer 0–100+
- `reason` — human-readable string explaining the score (e.g. "No website")
- `source` — the search query that produced this lead (e.g. "salons in mumbai")
- `called` — has the operator called this lead
- `called_at` — when they called it
- `created_at` — first time this lead was found
- `last_seen` — last time this lead appeared in a scrape run

---

## 6. TypeScript Types

**`types/lead.ts`**

```typescript
export type Lead = {
  id: number;
  name: string | null;
  phone: string | null;
  website: string | null;
  score: number;
  reason: string;
  source: string | null;
  called: boolean;
  called_at: string | null;
  created_at: string;
  last_seen: string;
};

export type RawBusiness = {
  name: string;
  phone: string | null;
  website: string | null;
};

export type PipelineResult = {
  scraped: number;
  filtered: number;
  stored: number;
  skipped_dedup: number;
  skipped_score: number;
};
```

---

## 7. Supabase Client

**`lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## 8. Scraper

**`lib/scraper.ts`**

The scraper fetches business listings from a free, public data source via HTTP GET only (no browser). Use the Google Places Text Search API or a similar REST-based public directory.

**If using Google Places API**, the operator must provide a `GOOGLE_PLACES_API_KEY` in `.env.local`.

```typescript
export type RawBusiness = {
  name: string;
  phone: string | null;
  website: string | null;
};

export async function scrapeBusinesses(query: string): Promise<RawBusiness[]> {
  // Step 1: Call Google Places Text Search
  // Endpoint: https://maps.googleapis.com/maps/api/place/textsearch/json
  // Params: query=<query>&key=<GOOGLE_PLACES_API_KEY>

  // Step 2: For each result, call Place Details to get phone + website
  // Endpoint: https://maps.googleapis.com/maps/api/place/details/json
  // Params: place_id=<id>&fields=name,formatted_phone_number,website&key=<key>

  // Step 3: Return array of { name, phone, website }
  // Hard cap: return maximum 30 results per run

  const results: RawBusiness[] = [];

  // --- implement above logic here ---

  return results.slice(0, 30); // HARD CAP — never return more than 30
}
```

**Critical rules for scraper:**
- Maximum 30 results per run — enforce with `.slice(0, 30)`
- If phone is null or empty string → do not include in results at all (filter here)
- Return empty array on any network error — do not throw

---

## 9. Analyzer

**`lib/analyzer.ts`**

Checks if a website is live, broken, or missing.

```typescript
export type WebsiteStatus = 'none' | 'broken' | 'weak' | 'ok';

export async function analyzeWebsite(website: string | null): Promise<{
  status: WebsiteStatus;
  hasContactForm: boolean;
  hasEmail: boolean;
  hasWeakContent: boolean;
}> {
  // If no website
  if (!website) {
    return { status: 'none', hasContactForm: false, hasEmail: false, hasWeakContent: false };
  }

  try {
    const url = website.startsWith('http') ? website : `https://${website}`;

    // Attempt HTTP GET with 5 second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return { status: 'broken', hasContactForm: false, hasEmail: false, hasWeakContent: false };
    }

    const html = await res.text();
    const lower = html.toLowerCase();

    const hasContactForm =
      lower.includes('<form') ||
      lower.includes('contact') ||
      lower.includes('whatsapp');

    const hasEmail = lower.includes('@') && lower.includes('.');

    // Weak content = very short page
    const textLength = html.replace(/<[^>]+>/g, '').trim().length;
    const hasWeakContent = textLength < 300;

    return {
      status: 'ok',
      hasContactForm,
      hasEmail,
      hasWeakContent,
    };
  } catch {
    // Network error, timeout, or DNS failure = broken
    return { status: 'broken', hasContactForm: false, hasEmail: false, hasWeakContent: false };
  }
}
```

---

## 10. Scorer

**`lib/scorer.ts`**

Assigns a numeric score and human-readable reason to each lead.

```typescript
import { analyzeWebsite, WebsiteStatus } from './analyzer';

export type ScoreResult = {
  score: number;
  reason: string;
};

export async function scoreLead(website: string | null): Promise<ScoreResult> {
  const analysis = await analyzeWebsite(website);

  let score = 0;
  const reasons: string[] = [];

  if (analysis.status === 'none') {
    score += 60;
    reasons.push('No website');
  } else if (analysis.status === 'broken') {
    score += 40;
    reasons.push('Broken website');
  }

  if (!analysis.hasContactForm) {
    score += 15;
    reasons.push('No contact form');
  }

  if (!analysis.hasEmail) {
    score += 10;
    reasons.push('No email');
  }

  if (analysis.hasWeakContent) {
    score += 10;
    reasons.push('Weak content');
  }

  return {
    score,
    reason: reasons.join(', ') || 'Site looks OK',
  };
}
```

**Scoring table:**

| Condition | Points |
|---|---|
| No website | +60 |
| Broken website | +40 |
| No contact form | +15 |
| No email on site | +10 |
| Weak content (<300 chars) | +10 |

**Threshold:** Only store leads with `score > 50`. Discard the rest.

---

## 11. Deduplicator

**`lib/deduplicator.ts`**

Normalizes phone numbers and website domains before database operations.

```typescript
export function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Take last 10 digits
  return digits.slice(-10) || null;
}

export function normalizeWebsite(website: string | null): string | null {
  if (!website) return null;
  return website
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')
    .trim() || null;
}
```

---

## 12. Pipeline API Route

**`app/api/run/route.ts`**

This is the main pipeline. Called via POST from the UI.

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { scrapeBusinesses } from '@/lib/scraper';
import { scoreLead } from '@/lib/scorer';
import { normalizePhone, normalizeWebsite } from '@/lib/deduplicator';
import { supabase } from '@/lib/supabase';
import { PipelineResult } from '@/types/lead';

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  const result: PipelineResult = {
    scraped: 0,
    filtered: 0,
    stored: 0,
    skipped_dedup: 0,
    skipped_score: 0,
  };

  // Step 1: Scrape
  const businesses = await scrapeBusinesses(query);
  result.scraped = businesses.length;

  for (const biz of businesses) {
    // Step 2: Filter — skip if no phone
    if (!biz.phone) continue;
    result.filtered++;

    // Step 3: Normalize
    const phone = normalizePhone(biz.phone);
    const website = normalizeWebsite(biz.website);

    if (!phone) continue;

    // Step 4: Dedup check — skip if phone already exists
    const { data: existing } = await supabase
      .from('leads')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();

    if (existing) {
      // Update last_seen and skip
      await supabase
        .from('leads')
        .update({ last_seen: new Date().toISOString() })
        .eq('phone', phone);
      result.skipped_dedup++;
      continue;
    }

    // Step 5: Score
    const { score, reason } = await scoreLead(website);

    // Step 6: Discard if score too low
    if (score <= 50) {
      result.skipped_score++;
      continue;
    }

    // Step 7: Store
    await supabase
      .from('leads')
      .upsert(
        {
          name: biz.name,
          phone,
          website,
          score,
          reason,
          source: query,
          called: false,
          called_at: null,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'phone' }
      );

    result.stored++;
  }

  return NextResponse.json(result);
}
```

---

## 13. Leads API Route

**`app/api/leads/route.ts`**

Two operations: fetch all uncalled leads (GET), mark a lead as called (PATCH).

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET — fetch leads, newest first, uncalled only by default
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('showAll') === 'true';

  let query = supabase
    .from('leads')
    .select('*')
    .order('score', { ascending: false })
    .limit(100);

  if (!showAll) {
    query = query.eq('called', false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH — mark a lead as called
export async function PATCH(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('leads')
    .update({
      called: true,
      called_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

---

## 14. UI — Main Page

**`app/page.tsx`**

The entire app lives on one page. No routing needed.

**Layout:**
- Top: a text input for the search query + a "Run" button
- Below input: a small status bar showing pipeline results after a run
- Below that: the leads table

**Behavior:**
- On load: fetch leads via `GET /api/leads`
- When Run is clicked: POST to `/api/run` with query, show loading state, then refresh leads
- Each lead row has a "Mark Called" button
- Clicking "Mark Called" calls `PATCH /api/leads` and removes the row from view
- A toggle "Show Called" shows/hides already-called leads

**Query input default values (show as placeholder examples):**
- "salons in mumbai"
- "dentists in bangalore"
- "gyms in delhi"
- "coaching classes in pune"
- "real estate agents in hyderabad"

---

## 15. Leads Table Component

**`components/leads-table.tsx`**

A clean shadcn `Table` component with these columns:

| Column | Notes |
|---|---|
| Name | Business name |
| Phone | Display as-is, clickable `tel:` link |
| Score | Show as colored badge: green ≥ 70, yellow 51–69 |
| Reason | Plain text, e.g. "No website, No contact form" |
| Source | The query that produced this lead |
| Action | "Mark Called" button — ghost variant, small |

**Sorting:** Default sort is `score DESC` (already handled by API).

**Empty state:** If no leads, show a simple message: "No leads yet. Run a query to get started."

---

## 16. Score Badge Colors

```typescript
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';

  return (
    <span className={`px-2 py-1 rounded text-sm font-medium ${color}`}>
      {score}
    </span>
  );
}
```

---

## 17. Pipeline Status Display

After clicking Run, show a one-line summary below the input:

```
Run complete: 24 scraped → 18 filtered → 6 stored (3 duplicate, 9 low score)
```

Map to `PipelineResult` fields:
- `scraped` → total from scraper
- `filtered` → passed the "has phone" check
- `stored` → actually saved to DB
- `skipped_dedup` → already in DB
- `skipped_score` → score ≤ 50

---

## 18. Error Handling Rules

| Situation | Behavior |
|---|---|
| Scraper network error | Return empty array, pipeline continues with 0 results |
| Website analyzer timeout | Treat as broken site, score accordingly |
| Supabase insert error | Log to console, continue to next lead |
| API route throws | Return `{ error: message }` with HTTP 500 |
| UI fetch fails | Show toast: "Something went wrong. Try again." |

Do not crash the pipeline on individual lead failures. Use try/catch per lead inside the loop.

---

## 19. Loading States

| Trigger | UI State |
|---|---|
| Run button clicked | Button shows "Running…" and is disabled |
| Leads loading on page open | Table shows skeleton rows (3 rows) |
| Mark Called clicked | Row fades out immediately (optimistic update) |

---

## 20. What NOT to Build

Do not build any of the following. They are explicitly out of scope:

- User authentication / login
- Multiple user accounts
- Email collection or outreach
- AI-powered analysis
- Webhook integrations
- CSV export
- Pagination (100 lead limit is sufficient)
- Charts or analytics dashboard
- Mobile responsiveness beyond basic Tailwind defaults
- Dark mode
- Settings page
- Notification system

---

## 21. Package Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "typescript": "5.x",
    "@supabase/supabase-js": "^2.0.0",
    "tailwindcss": "^3.0.0",
    "@shadcn/ui": "latest"
  }
}
```

Install shadcn components needed:
```bash
npx shadcn-ui@latest add button input table badge toast
```

---

## 22. Setup Instructions for the Operator

After the agent builds the project:

1. Create a Supabase project at supabase.com
2. Run the SQL from Section 5 in the Supabase SQL editor
3. Get a Google Places API key from Google Cloud Console and enable Places API
4. Copy `.env.local.example` to `.env.local` and fill in values
5. Run `npm install`
6. Run `npm run dev`
7. Open `http://localhost:3000`

For production:
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

---

## 23. Definition of Done

The build is complete when:

- [ ] Typing a query and clicking Run fetches real businesses
- [ ] Only leads with score > 50 appear in the table
- [ ] Running the same query twice does not create duplicate rows
- [ ] "Mark Called" removes the lead from the default view
- [ ] The pipeline summary shows correct counts after each run
- [ ] The app deploys to Vercel without errors
