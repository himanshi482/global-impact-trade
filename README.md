# GlobeBridge - AI Global Trade Intelligence & EXIM Platform

GlobeBridge is an enterprise-grade AI-powered EXIM and Customs intelligence platform built on Next.js 16 App Router and MySQL (`mysql2`). It provides real-time access to foreign buyer records, verified supplier entities, bill of lading shipments, ITC-HS code tariff lookup, search history, user profile management, role-gated admin controls, and subscription plan limits.

---

## Technical Stack & Architecture

- **Framework**: Next.js 16 (App Router with Turbopack) & React 19
- **Database**: MySQL database engine with connection pooling (`lib/db.js` via `mysql2/promise`)
- **Authentication**: JWT-based session cookies (`gb_session` httpOnly cookies) with `bcryptjs` password hashing and `jose` token signing
- **Styling**: Tailwind CSS & Vanilla CSS Design System with rich dark themes and responsive layouts

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

---

## Core Platform Features & Routing

| Route | Access Level | Feature Description |
|---|---|---|
| `/` | Public | Hero landing page with platform capabilities & pricing. |
| `/trade-data` | Authenticated | Live EXIM directory searching for Buyers, Suppliers & Shipments. |
| `/hs-codes` | Authenticated | 99 HS Chapter directory, 6/8 digit search & customs duty calculator. |
| `/search-history` | Authenticated | Log of recent search queries and saved query management. |
| `/profile` | Authenticated | User account details, company info, and subscription status. |
| `/admin` | Admin Only | Administrative overview, user role management & CRUD operations. |
| `/admin/users` | Admin Only | User permissions control & role toggle (`USER` / `ADMIN`). |
| `/admin/buyers` | Admin Only | Foreign buyers directory CRUD. |
| `/admin/suppliers` | Admin Only | Verified suppliers directory CRUD. |
| `/admin/requests` | Admin Only | Manage inbound contact and demo request lead statuses. |

---

## API Reference

### Authentication Endpoints
- `POST /api/auth/register` - Create new user account with company details
- `POST /api/auth/login` - Authenticate user credentials and establish session cookie
- `POST /api/auth/logout` - Clear user session cookie
- `GET /api/auth/me` - Fetch currently logged-in user profile
- `POST /api/auth/forgot-password` - Generate reset token (logs link in dev console)
- `POST /api/auth/reset-password` - Update password using token

### Trade Data & Directory APIs
- `GET /api/buyers?product=&country=&hsCode=&hsChapter=&q=&page=&limit=` - Paginated buyer search
- `GET /api/suppliers?product=&country=&hsCode=&hsChapter=&q=&page=&limit=` - Paginated supplier search
- `GET /api/shipments?product=&hsCode=&originCountry=&destinationCountry=&page=&limit=` - Paginated shipment records
- `GET /api/hs-codes?code=&description=&chapter=&q=&page=&limit=` - HS code directory search

### Search History & Saved Searches
- `GET /api/search-history` & `POST /api/search-history` - Query history logs
- `GET /api/saved-searches` & `POST /api/saved-searches` & `DELETE /api/saved-searches/[id]` - Saved search management

### Profile & Lead Requests
- `GET /api/profile` & `PUT /api/profile` - Account and company details update
- `POST /api/contact` - Handle contact form submissions
- `POST /api/demo` - Handle 1-on-1 demo bookings
- `GET /api/unlock` & `POST /api/unlock` - Check remaining plan quota and unlock entity contacts

### Admin Management APIs (Role Gated: `ADMIN`)
- `GET /api/admin/stats` - Platform metric summary counters
- `GET /api/admin/users` & `PUT /api/admin/users/[id]` & `DELETE /api/admin/users/[id]` - User management
- `GET /api/admin/buyers` & `POST /api/admin/buyers` & `PUT /api/admin/buyers/[id]` & `DELETE /api/admin/buyers/[id]` - Buyers CRUD
- `GET /api/admin/suppliers` & `POST /api/admin/suppliers` & `PUT /api/admin/suppliers/[id]` & `DELETE /api/admin/suppliers/[id]` - Suppliers CRUD
- `GET /api/admin/requests` & `PUT /api/admin/requests/[id]` - Contact & demo lead status updates

---

## Subscription Limits Matrix

| Plan | Contact Unlocks Quota | Features Included |
|---|---|---|
| **FREE** | 10 Contact Unlocks | 10 searches & entity contact views |
| **GROWTH / PROFESSIONAL** | 50 Contact Unlocks | Advanced search, Nexus supply chain overview |
| **CONNECT** | 200 Contact Unlocks / Mo | Multi-tier mapping & decision maker contacts |
| **CONQUER / ENTERPRISE** | Unlimited Unlocks | Full raw dataset, API feeds & custom dossiers |
