# GlobeBridge - Global Trade Intelligence & EXIM Platform

GlobeBridge is an enterprise-grade EXIM and Customs intelligence platform built on Next.js 16 App Router and MySQL (`mysql2`). It provides real-time access to foreign buyer records, verified supplier entities, bill of lading shipments, ITC-HS code tariff lookup, deterministic Market Intelligence & Opportunity Scoring, country comparisons, saved analysis dossiers, search history, user profile management, contact unlock with subscription quota enforcement, and full role-gated admin CRUD controls.

---

## Technical Stack & Architecture

- **Framework**: Next.js 16 (App Router with Turbopack) & React 19
- **Database**: MySQL with connection pooling (`lib/db.js` via `mysql2/promise`)
- **Authentication**: JWT-based session cookies (`gb_session` httpOnly cookies) with `bcryptjs` password hashing and `jose` token signing
- **Rate Limiting**: In-memory sliding-window rate limiter (`lib/rateLimit.js`) with per-endpoint thresholds
- **Styling**: Tailwind CSS & Vanilla CSS Design System with rich dark themes and responsive layouts
- **Validation**: Zod schema validation on all API request bodies

---

## Getting Started

### 1. Requirements & Configuration
Ensure you have Node.js 18+ and a running MySQL instance (default port `3306`).

Copy `.env.example` to `.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=globebridge
AUTH_SECRET=dev-only-secret-change-me
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Database Migrations & Seeding
Run database migrations to initialize tables:
```bash
npm run db:migrate
```

Populate initial trade dataset (buyers, suppliers, shipments, HS codes, admin account):
```bash
npm run db:seed
```

Default Admin Credentials:
- **Email**: `admin@globebridge.dev`
- **Password**: `Admin@12345`

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run End-to-End Tests (Phase 11)
With the dev server running, execute the full platform E2E verification suite (register → login → search → save → admin CRUD → security gating):
```bash
DISABLE_RATE_LIMIT=true npm run test:e2e
```
All 8 phases of user, directory, market intelligence, portfolio, unlock, admin, and security boundary assertions should report:
```
🎉 ALL END-TO-END (E2E) TESTS PASSED SUCCESSFULLY!
```

---

## Core Platform Features & Routing

| Route | Access Level | Feature Description |
|---|---|---|
| `/` | Public | Hero landing page with platform capabilities & pricing. |
| `/trade-data` | Authenticated | Live EXIM directory searching for Buyers, Suppliers & Shipments. |
| `/market-analysis` | Authenticated | Advanced Market Intelligence workbench, Opportunity Scoring & Country Comparison. |
| `/hs-codes` | Authenticated | 99 HS Chapter directory, 6/8 digit search & customs duty calculator. |
| `/buyer-discovery` | Authenticated | Buyer discovery with lead scoring, contact masking & CRM save. |
| `/supplier-discovery` | Authenticated | Supplier search with verified entity verification & save-to-leads. |
| `/my-leads` | Authenticated | Full CRM pipeline with 6 statuses, notes, export CSV & recommended leads. |
| `/export-planner` | Authenticated | **Stage 3 Phase 3** — Export opportunity analysis, tariff economics, risk scoring, buyer matching & adaptive action plan. |
| `/export-planner/report` | Authenticated | Printable/PDF-ready trade intelligence dossier for a saved export plan. |
| `/search-history` | Authenticated | Log of recent search queries and saved query management. |
| `/profile` | Authenticated | User account details, company info, and subscription status. |
| `/dashboard` | Authenticated | Unified dashboard with market opportunity cards, Export Intelligence widget, and recent saved analyses. |
| `/contact` | Public | Contact form submissions. |
| `/book-a-demo` | Public | One-on-one demo booking. |
| `/admin` | Admin Only | Administrative overview with full metric dashboard. |
| `/admin/users` | Admin Only | User permissions control & role toggle (`USER` / `ADMIN`). |
| `/admin/buyers` | Admin Only | Foreign buyers directory CRUD. |
| `/admin/suppliers` | Admin Only | Verified suppliers directory CRUD. |
| `/admin/shipments` | Admin Only | Shipment records CRUD — search, filter, paginate, sort. |
| `/admin/hs-codes` | Admin Only | HS Code database CRUD — duplicate-code protection, chapter filter. |
| `/admin/leads` | Admin Only | Admin-level CRM: all user leads, pipeline review and management. |
| `/admin/requests` | Admin Only | Manage inbound contact and demo request lead statuses. |

---

## Market Intelligence Suite (Stage 3, Phase 1)

The Market Intelligence engine (`lib/marketIntelligence.js`) computes real-time analytics from database trade records:

### 1. Market Opportunity Scoring (`lib/marketOpportunity.js`)
Generates a deterministic 0–100 score normalized across 4 pillars:
- **Buyer Demand (0–30 pts)**: Count of active buyers matching product/HS code and country volume.
- **Shipment Activity (0–30 pts)**: Verified customs manifests and cumulative USD trade value.
- **Buyer Availability (0–20 pts)**: Ratio of verified buyer entities with audited records.
- **Supplier Competition Balance (0–20 pts)**: Competing supplier saturation vs buyer demand.
- **Data Confidence Rating**: Multiplier based on sample size and historical coverage.

### 2. Transparent Score Explanations & Risk Mapping
- Positive factor signals (`✓ High buyer presence`, `✓ Active customs manifest flow`)
- Market warning signals (`⚠ Concentrated buyer base`, `⚠ High supplier saturation`)
- Concrete rule-based risk classification (HIGH, MEDIUM, LOW severity)

### 3. Historical Shipment Trends
- Aggregated by year/month using SQL `GROUP BY`.
- Displays real shipment counts, total value, and average value per commercial manifest.
- Gracefully handles low-data corridors with "Insufficient historical data" notices (never uses fake numbers).

### 4. Cross-Border Country Comparison (`/api/market-analysis/compare`)
- Compares 2 to 5 target countries side-by-side.
- Ranks markets by Opportunity Score, buyer counts, supplier counts, and trade volume.

### 5. Best Markets Opportunity Finder (`/api/market-analysis/best-markets`)
- Automatically discovers and ranks top destination markets for a selected HS code.

### 6. Saved Market Analyses Portfolio (`/api/market-analysis/saved`)
- Save, view, delete, and 1-click re-run market intelligence reports against live database data.

### 7. Data Transparency & Quality Notice
> [!NOTE]
> The current Market Intelligence module operates on the GlobeBridge database/demo dataset. External live trade-data providers are not yet integrated.

---

## Stage 3 Phase 3 — Advanced Trade Intelligence & Export Decision Support

The Export Planner acts as a **"control tower"** that connects Market Intelligence, Buyer Discovery, Tariff Duty, and the CRM pipeline into one unified export decision workflow. All calculations are **strictly deterministic** — no `Math.random()`, no fabricated figures.

### Key Features
- **Export Opportunity Score (0–100)**: Weighted composite index (market 30%, readiness 25%, corridor safety 20%, buyer demand 15%, cost efficiency 10%)
- **Tariff & Landed Cost Economics** (`lib/landedCost.js`): Integrates BCD/SWS/IGST from `hs_codes` table. Returns `{ available: false }` gracefully if HS code is not in database — never invents rates
- **Trade Risk Analysis** (`lib/tradeRisk.js`): Deterministic LOW/MEDIUM/HIGH risk bucket based on buyer concentration, shipment history, and supplier saturation
- **Export Readiness Assessment** (`lib/exportReadiness.js`): 8-dimension structural evaluation covering HS classification, buyer availability, demand, trade activity, data confidence, risk mitigation, and cost efficiency
- **Strategic Market Entry Recommendation** (`lib/marketEntryRecommendation.js`): 4-decision verdict — `ENTER_NOW | ENTER_WITH_CAUTION | RESEARCH_MORE | AVOID`
- **Buyer-to-Market Matching** (`lib/buyerMarketMatching.js`): Scores buyers by HS/country/verification overlap. **Contact masking is preserved** — locked contacts return `null` for email and phone
- **Adaptive 10-Step Action Plan** (`lib/exportActionPlan.js`): Dynamically adapts steps to risk level, readiness, and buyer pipeline status
- **Persistent Export Plans** (`saved_export_plans` table): Save, retrieve, delete, and re-run plans with ownership isolation

### Data Transparency
> All scores are computed from verified customs manifest records and entity data stored in the GlobeBridge database. No external live APIs are used. If trade data is sparse, scores reflect lower confidence rather than fabricated values.

### New API Endpoints (Stage 3 Phase 3)
- `GET/POST /api/export-planner/analyze` — Full unified export analysis engine
- `GET /api/export-planner/best-markets` — Ranked destination market discovery
- `GET /api/export-planner/recommended-buyers` — Buyer matching with contact masking
- `GET /api/export-planner/action-plan` — Adaptive 10-step execution roadmap
- `GET /api/export-planner/saved` — List saved plans
- `POST /api/export-planner/saved` — Save export plan
- `GET /api/export-planner/saved/[id]` — Retrieve single plan
- `DELETE /api/export-planner/saved/[id]` — Delete saved plan
- `POST /api/export-planner/saved/[id]/rerun` — Re-evaluate with live metrics

### Integration Points
- **Market Analysis → Export Planner**: "📋 Create Export Plan" button in Market Analysis overview and each Best Markets card
- **Buyer Discovery → Export Planner**: "📊 Analyze Plan" link in BuyerCard footer
- **My Leads → Recommended Leads**: Phase 3 injects recommended buyers from `buyerMarketMatching.js` into the My Leads pipeline
- **Dashboard**: Compact Export Intelligence widget showing corridor score, readiness status, risk level, and active lead count
- **Nav**: "Export Planner" navigation link added after "My Leads" for all users

## Stage 4 Production Readiness

Stage 4 adds strict unlock validation and transactional quota consumption, same-origin protection for authenticated mutations, configurable trusted-proxy handling, database-backed market alerts and notifications, historical trend helpers, formal data-confidence metadata, deterministic lead intelligence, aggregate admin analytics, and lightweight API metrics.

Trade data defaults to `TRADE_DATA_PROVIDER=database` and is sourced from the GlobeBridge database. Live external trade data is not available unless a real provider adapter is configured; the application never fabricates trade, tariff, trend, or confidence values. HS codes remain strings, including leading-zero values such as `010121`.

Run `npm run db:migrate` before using Stage 4 tables. The complete test command remains `DISABLE_RATE_LIMIT=true npm run test:e2e`; run `npm run lint` and `npm run build` before deployment. Set `TRUST_PROXY=true` only when a trusted deployment proxy overwrites forwarded client headers. No real credentials belong in `.env.example` or source control.

For scheduled alert evaluation, configure `ALERT_CRON_SECRET` on the server and invoke `POST /api/internal/alerts/evaluate` with the `x-alert-cron-secret` header from a trusted scheduled HTTP job. The endpoint evaluates active alerts against current database records, creates deduplicated notifications, and creates deduplicated follow-up reminders. Metrics in `lib/apiObservability.js` are process-local and reset when the server restarts.

---

## API Reference

> 📄 **Full API Documentation**: See [`docs/API_DOCUMENTATION.md`](./docs/API_DOCUMENTATION.md) for complete endpoint specs, request/response schemas, error codes, rate limiting details, and sample cURL requests.

### Authentication Endpoints
- `POST /api/auth/register` - Create new user account (rate-limited)
- `POST /api/auth/login` - Authenticate user credentials and establish session cookie (rate-limited)
- `POST /api/auth/logout` - Clear user session cookie
- `GET /api/auth/me` - Fetch currently logged-in user profile
- `POST /api/auth/forgot-password` - Generate reset token (logs link in dev console)
- `POST /api/auth/reset-password` - Update password using token

### Market Intelligence APIs (Protected: `requireUser()`)
- `GET /api/market-analysis?hsCode=&country=&year=&direction=` - Comprehensive market intelligence report (rate-limited)
- `GET /api/market-analysis/compare?hsCode=&countries=Germany,UAE,USA` - Benchmark 2–5 countries side-by-side
- `GET /api/market-analysis/best-markets?hsCode=&limit=` - Discover top global destination opportunities
- `GET /api/market-analysis/saved` - List saved analyses for authenticated user
- `POST /api/market-analysis/saved` - Bookmark market analysis with filters and score
- `DELETE /api/market-analysis/saved/[id]` - Remove saved analysis (enforces user ownership)
- `POST /api/market-analysis/saved/[id]/rerun` - Re-evaluate analysis with fresh database data

### Export Opportunity Planner APIs (Protected: `requireUser()`)
- `GET/POST /api/export-planner/analyze` — Full unified analysis (market, risk, tariff, readiness, buyers, action plan)
- `GET /api/export-planner/best-markets` — Ranked destination corridors by composite opportunity score
- `GET /api/export-planner/recommended-buyers` — Buyer matching with HS/country scoring and contact masking
- `GET /api/export-planner/action-plan` — Adaptive 10-step execution roadmap
- `GET /api/export-planner/saved` — List saved export plans
- `POST /api/export-planner/saved` — Save export plan with auto-run analysis
- `GET /api/export-planner/saved/[id]` — Single plan retrieval (ownership enforced)
- `DELETE /api/export-planner/saved/[id]` — Delete saved plan
- `POST /api/export-planner/saved/[id]/rerun` — Re-run analysis with latest DB metrics

### CRM Pipeline APIs (Protected: `requireUser()`)
- `GET /api/leads` — List own leads with metrics (NEW/CONTACTED/QUALIFIED/NEGOTIATING/WON/LOST)
- `POST /api/leads` — Save buyer/supplier as lead (duplicate protection: 409)
- `GET/PUT/DELETE /api/leads/[id]` — Read, update status/notes, or delete lead
- `GET /api/leads/export` — Export CRM pipeline as CSV download
- `GET/PUT/DELETE /api/admin/leads` — Admin-level CRM management

### Trade Data & Directory APIs
- `GET /api/buyers?product=&country=&hsCode=&hsChapter=&q=&page=&limit=&sort=` - Paginated buyer search
- `GET /api/suppliers?product=&country=&hsCode=&hsChapter=&q=&page=&limit=&sort=` - Paginated supplier search
- `GET /api/shipments?product=&hsCode=&originCountry=&destinationCountry=&page=&limit=&sort=` - Paginated shipment records
- `GET /api/hs-codes?code=&description=&chapter=&q=&page=&limit=&sort=` - HS code directory search

### Search History & Saved Searches
- `GET /api/search-history` & `POST /api/search-history` - Query history logs
- `GET /api/saved-searches` & `POST /api/saved-searches` & `DELETE /api/saved-searches/[id]` - Saved search management

### Profile & Lead Requests
- `GET /api/profile` & `PUT /api/profile` - Account and company details update
- `POST /api/contact` - Handle contact form submissions (rate-limited)
- `POST /api/demo` - Handle 1-on-1 demo bookings (rate-limited)
- `GET /api/unlock` & `POST /api/unlock` - Check remaining plan quota and unlock entity contacts

### Admin Management APIs (Role Gated: `ADMIN`)
- `GET /api/admin/stats` - Platform metric summary counters
- `GET /api/admin/analytics?range=` - Aggregate platform usage metrics (users, subscriptions, leads, unlocks, alerts, notifications, API request counts)
- `GET /api/admin/users` & `PUT /api/admin/users/[id]` & `DELETE /api/admin/users/[id]` - User management
- `GET /api/admin/buyers` & `POST /api/admin/buyers` & `PUT /api/admin/buyers/[id]` & `DELETE /api/admin/buyers/[id]` - Buyers CRUD
- `GET /api/admin/suppliers` & `POST /api/admin/suppliers` & `PUT /api/admin/suppliers/[id]` & `DELETE /api/admin/suppliers/[id]` - Suppliers CRUD
- `GET /api/admin/shipments` & `POST /api/admin/shipments` & `PUT /api/admin/shipments/[id]` & `DELETE /api/admin/shipments/[id]` - Shipments CRUD
- `GET /api/admin/hs-codes` & `POST /api/admin/hs-codes` & `PUT /api/admin/hs-codes/[id]` & `DELETE /api/admin/hs-codes/[id]` - HS Codes CRUD
- `GET /api/admin/requests` & `PUT /api/admin/requests/[id]` - Contact & demo lead status updates
- `GET /api/admin/subscriptions` & `PUT /api/admin/subscriptions/[userId]` - Subscription plan management (FREE / GROWTH / CONNECT / CONQUER)
- `GET/PUT/DELETE /api/admin/leads` — Admin-level CRM management across all users

### Market Alerts & Notifications (Protected: `requireUser()`)
- `GET /api/alerts` & `POST /api/alerts` - List / create saved market alerts (HS_CODE, COUNTRY, OPPORTUNITY_SCORE, BUYER_ACTIVITY, SHIPMENT_ACTIVITY, RISK_LEVEL)
- `GET/PUT/DELETE /api/alerts/[id]` - Read, update, or delete a single alert (ownership enforced)
- `POST /api/alerts/evaluate` - Manually evaluate the current user's active alerts against live data and dispatch notifications for matches
- `GET /api/notifications` - List notifications, newest first
- `PUT /api/notifications/[id]/read` & `PUT /api/notifications/read-all` - Mark one or all notifications as read
- `DELETE /api/notifications/[id]` - Remove a notification
- `POST /api/internal/alerts/evaluate` - Scheduled/cron evaluation of **all** users' active alerts; requires the `x-alert-cron-secret` header to match `ALERT_CRON_SECRET` (see Stage 4 section above) — intended to be called by an external scheduler (cron job, Vercel Cron, etc.), not by end users

---

## Subscription Limits Matrix

| Plan | Contact Unlocks Quota | Features Included |
|---|---|---|
| **FREE** | 10 Contact Unlocks | 10 searches & entity contact views |
| **GROWTH** | 50 Contact Unlocks | Advanced search, Nexus supply chain overview |
| **CONNECT** | 200 Contact Unlocks / Mo | Multi-tier mapping & decision maker contacts |
| **CONQUER** | Unlimited Unlocks | Full raw dataset, API feeds & custom dossiers |

---

## Deployment

This app needs two things in production: a place to run the Next.js server, and a MySQL database it can reach. Neither Render nor Vercel provide a free MySQL instance, so pair either one with an external free MySQL host such as [Aiven](https://aiven.io) or [Clever Cloud](https://www.clever-cloud.com/).

> ⚠️ Free-tier terms (trial credits, idle sleep, storage caps) change frequently across providers — check each provider's current pricing page before committing, and never commit real `.env` values to source control.

### Option A — Render (recommended for this codebase)
`lib/db.js` uses a long-lived `mysql2` connection pool, which fits a traditional always-on server better than a serverless one. Render runs your app as a persistent process, so no extra tuning is needed.

1. Create a free MySQL database on Aiven (or Clever Cloud) and note the host/port/user/password/database name.
2. From your local machine, point `.env` at that database temporarily and run `npm run db:migrate` then `npm run db:seed` to provision tables and the default admin account. Revert `.env` back to your local DB afterwards.
3. On [render.com](https://render.com), create a **Web Service** from this GitHub repo.
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add the environment variables below in Render's **Environment** tab (see [`.env.example`](./.env.example) for the full list): `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (use the `.onrender.com` URL Render assigns).
5. Deploy. Render's free tier sleeps after ~15 minutes of inactivity — the first request after a sleep will be slow (10–60s) while it wakes back up.
6. Log in with the seeded admin account and change the password immediately.

### Option B — Vercel
Vercel's Hobby tier is free and has first-class Next.js support, but functions run serverless (a fresh instance per request), which doesn't naturally match a persistent connection pool — under sustained traffic you may see MySQL "too many connections" errors. Fine for demos/low traffic; consider a serverless-friendly pooling layer (e.g. PlanetScale's driver, or your DB provider's built-in pooler) before relying on it for real traffic.

1. Provision and migrate/seed a free MySQL database the same way as Option A, steps 1–2.
2. On [vercel.com](https://vercel.com), import this GitHub repo as a new project — build/start commands are auto-detected.
3. Add the same environment variables as Option A under **Project Settings → Environment Variables**.
4. Deploy, then copy the assigned `.vercel.app` URL into `NEXT_PUBLIC_APP_URL` and redeploy so the app picks it up.
5. Log in with the seeded admin account and change the password immediately.

### Scheduled Alert Evaluation in Production
Whichever host you choose, `POST /api/internal/alerts/evaluate` needs to be called periodically (e.g. every 15–30 minutes) by an external scheduler — a cron job, GitHub Actions schedule, or your platform's native cron feature — with the `x-alert-cron-secret` header set to your `ALERT_CRON_SECRET` value. Nothing evaluates alerts automatically on its own.

### Outgoing Email in Production
`EMAIL_SERVER` / `EMAIL_FROM` are blank by default, which makes password-reset links log to the server console instead of emailing them — fine for local dev, not usable for real users. Configure a real SMTP provider (e.g. Resend, SendGrid) for these variables before inviting real users.
