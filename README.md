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
| `/search-history` | Authenticated | Log of recent search queries and saved query management. |
| `/profile` | Authenticated | User account details, company info, and subscription status. |
| `/dashboard` | Authenticated | Unified dashboard with market opportunity cards and recent saved analyses. |
| `/contact` | Public | Contact form submissions. |
| `/book-a-demo` | Public | One-on-one demo booking. |
| `/admin` | Admin Only | Administrative overview with full metric dashboard. |
| `/admin/users` | Admin Only | User permissions control & role toggle (`USER` / `ADMIN`). |
| `/admin/buyers` | Admin Only | Foreign buyers directory CRUD. |
| `/admin/suppliers` | Admin Only | Verified suppliers directory CRUD. |
| `/admin/shipments` | Admin Only | Shipment records CRUD — search, filter, paginate, sort. |
| `/admin/hs-codes` | Admin Only | HS Code database CRUD — duplicate-code protection, chapter filter. |
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
- `GET /api/admin/users` & `PUT /api/admin/users/[id]` & `DELETE /api/admin/users/[id]` - User management
- `GET /api/admin/buyers` & `POST /api/admin/buyers` & `PUT /api/admin/buyers/[id]` & `DELETE /api/admin/buyers/[id]` - Buyers CRUD
- `GET /api/admin/suppliers` & `POST /api/admin/suppliers` & `PUT /api/admin/suppliers/[id]` & `DELETE /api/admin/suppliers/[id]` - Suppliers CRUD
- `GET /api/admin/shipments` & `POST /api/admin/shipments` & `PUT /api/admin/shipments/[id]` & `DELETE /api/admin/shipments/[id]` - Shipments CRUD
- `GET /api/admin/hs-codes` & `POST /api/admin/hs-codes` & `PUT /api/admin/hs-codes/[id]` & `DELETE /api/admin/hs-codes/[id]` - HS Codes CRUD
- `GET /api/admin/requests` & `PUT /api/admin/requests/[id]` - Contact & demo lead status updates
- `GET /api/admin/subscriptions` & `PUT /api/admin/subscriptions/[userId]` - Subscription plan management (FREE / GROWTH / CONNECT / CONQUER)

---

## Subscription Limits Matrix

| Plan | Contact Unlocks Quota | Features Included |
|---|---|---|
| **FREE** | 10 Contact Unlocks | 10 searches & entity contact views |
| **GROWTH / PROFESSIONAL** | 50 Contact Unlocks | Advanced search, Nexus supply chain overview |
| **CONNECT** | 200 Contact Unlocks / Mo | Multi-tier mapping & decision maker contacts |
| **CONQUER / ENTERPRISE** | Unlimited Unlocks | Full raw dataset, API feeds & custom dossiers |
