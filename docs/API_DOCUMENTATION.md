# GlobeBridge REST API Documentation (v1.0)

Welcome to the **GlobeBridge Enterprise Trade Intelligence API** documentation. This reference guide provides detailed technical specifications for all authentication, search, market intelligence, saved portfolio, contact unlock, and administrative endpoints.

---

## 1. Overview & Architecture

### Base URL
- **Development**: `http://localhost:3000` (or `http://localhost:3005`)
- **Production**: `https://your-domain.com`

### Protocol & Headers
- **Format**: JSON (`Content-Type: application/json`)
- **Character Encoding**: UTF-8
- **Authentication**: JWT session tokens delivered via `gb_session` HTTP-Only cookies.

---

## 2. Authentication & Authorization

All protected endpoints check the session cookie (`gb_session`) set upon login or registration.

### Access Levels
| Access Level | Required Role / Permission | Description |
|---|---|---|
| **Public** | None | Accessible to any client without authentication. |
| **Authenticated (`USER`)** | Valid `gb_session` cookie | Accessible to any signed-in account. |
| **Admin (`ADMIN`)** | Valid `gb_session` cookie with `role: "ADMIN"` | Administrative endpoints for data management. |

---

## 3. Rate Limiting

The API implements a sliding-window rate limiter per client IP / User ID:

| Endpoint Action | Limit | Window | HTTP Headers |
|---|---|---|---|
| **Login** (`/api/auth/login`) | 10 attempts | 1 Minute | `X-RateLimit-Limit`, `Retry-After` |
| **Register** (`/api/auth/register`) | 5 registrations | 1 Hour | `X-RateLimit-Limit`, `Retry-After` |
| **Contact / Demo** (`/api/contact`, `/api/demo`) | 10 requests | 1 Hour | `X-RateLimit-Limit`, `Retry-After` |
| **Market Analysis** (`/api/market-analysis/*`) | 60 requests | 1 Minute | `X-RateLimit-Limit`, `Retry-After` |
| **General APIs** (Directory & Searches) | 120 requests | 1 Minute | `X-RateLimit-Limit`, `Retry-After` |

If rate limit is exceeded, the server returns HTTP `429 Too Many Requests`.

---

## 4. Standard Response Formats & Status Codes

### Standard HTTP Status Codes
- `200 OK` — Request completed successfully.
- `201 Created` — Resource created successfully.
- `400 Bad Request` — Invalid input parameters or failed Zod validation.
- `401 Unauthorized` — Unauthenticated request (missing session cookie).
- `403 Forbidden` — Authenticated user lacks required permissions (e.g. non-admin accessing admin route) or quota limit reached.
- `404 Not Found` — Resource does not exist or user lacks ownership.
- `409 Conflict` — Duplicate resource (e.g., existing email or duplicate HS code).
- `429 Too Many Requests` — Rate limit threshold exceeded.
- `500 Internal Server Error` — Server exception error.

### Error Response Schema
```json
{
  "error": "Descriptive error message string"
}
```

---

## 5. Endpoints Specification

---

### A. Authentication & Lifecycle (`/api/auth/*`)

#### `POST /api/auth/register`
Creates a new user account and associated company record.

- **Access Level**: Public (Rate-limited: 5 / hour)
- **Request Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1 555-0199",
    "password": "StrongPassword123",
    "companyName": "Acme Exports Ltd",
    "country": "Germany",
    "industry": "Textiles"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "user": {
      "id": 12,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1 555-0199",
      "role": "USER",
      "company": "Acme Exports Ltd"
    }
  }
  ```

#### `POST /api/auth/login`
Authenticates credentials and sets the `gb_session` HTTP-Only cookie.

- **Access Level**: Public (Rate-limited: 10 / minute)
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "StrongPassword123"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Logged in successfully",
    "user": {
      "id": 12,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "USER"
    }
  }
  ```

#### `GET /api/auth/me`
Fetches current authenticated user session details.

- **Access Level**: Authenticated (`USER`)
- **Success Response (`200 OK`)**:
  ```json
  {
    "user": {
      "id": 12,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "+1 555-0199",
      "role": "USER",
      "company": "Acme Exports Ltd"
    }
  }
  ```

#### `POST /api/auth/forgot-password`
Generates password reset token and logs dev link.

- **Access Level**: Public
- **Request Body**: `{ "email": "user@example.com" }`
- **Success Response (`200 OK`)**: `{ "message": "If an account exists, a reset link has been sent." }`

#### `POST /api/auth/reset-password`
Resets user password using reset token.

- **Access Level**: Public
- **Request Body**: `{ "token": "abc123token", "password": "NewStrongPassword123" }`
- **Success Response (`200 OK`)**: `{ "message": "Password updated successfully" }`

#### `POST /api/auth/logout`
Invalidates user session and clears session cookie.

- **Access Level**: Public / Authenticated
- **Success Response (`200 OK`)**: `{ "message": "Logged out successfully" }`

---

### B. Account Profile & Entity Unlocks (`/api/profile`, `/api/unlock`)

#### `GET /api/profile` & `PUT /api/profile`
Fetches and updates account user and company profile details.

- **Access Level**: Authenticated (`USER`)
- **PUT Request Body**:
  ```json
  {
    "name": "Jane Doe Updated",
    "companyName": "Acme Global Exim",
    "phone": "+1 555-0199",
    "country": "Germany",
    "city": "Berlin",
    "website": "https://acme-global.de"
  }
  ```
- **Success Response (`200 OK`)**: `{ "message": "Profile updated successfully" }`

#### `GET /api/unlock`
Returns current subscription plan unlock quota status and lists unlocked entity IDs.

- **Access Level**: Authenticated (`USER`)
- **Success Response (`200 OK`)**:
  ```json
  {
    "quota": {
      "plan": "FREE",
      "used": 1,
      "maxAllowed": 10,
      "remaining": 9,
      "isUnlimited": false
    },
    "unlockedBuyers": [8, 14],
    "unlockedSuppliers": [3]
  }
  ```

#### `POST /api/unlock`
Unlocks contact details (person name, email, phone, website) for a specific Buyer or Supplier entity against the user's plan quota.

- **Access Level**: Authenticated (`USER`)
- **Request Body**: `{ "buyerId": 8 }` or `{ "supplierId": 3 }`
- **Success Response (`200 OK`)**:
  ```json
  {
    "message": "Contact unlocked successfully",
    "granted": true,
    "contact": {
      "companyName": "Dubai Food Importers LLC",
      "contactPerson": "Tariq Al-Mansoor",
      "email": "tariq@dubaifood.ae",
      "phone": "+971 4 881 9900",
      "website": "https://dubaifood.ae"
    },
    "quota": { "used": 2, "remaining": 8, "maxAllowed": 10 }
  }
  ```

---

### C. Directory Search APIs (`/api/buyers`, `/api/suppliers`, `/api/shipments`, `/api/hs-codes`)

All search endpoints support standard pagination query parameters: `page` (default `1`), `limit` (default `20`, max `100`), and whitelisted sorting `sort` (e.g. `id:desc`, `created_at:desc`).

#### `GET /api/buyers`
Search foreign buyer records with filters: `q`, `product`, `country`, `hsCode`, `hsChapter`, `page`, `limit`, `sort`.

- **Access Level**: Authenticated (`USER`)
- **Sample Request**: `/api/buyers?product=cotton&country=India&page=1&limit=5`
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "company_name": "Bharat Textiles Corp",
        "country": "India",
        "city": "Ahmedabad",
        "product": "Organic Cotton Yarn",
        "hs_code": "520512",
        "import_volume": "$2,500,000",
        "verified": 1
      }
    ],
    "pagination": { "page": 1, "limit": 5, "total": 1, "totalPages": 1 }
  }
  ```

#### `GET /api/suppliers`
Search verified supplier records with filters: `q`, `product`, `country`, `hsCode`, `hsChapter`, `page`, `limit`, `sort`.

- **Access Level**: Authenticated (`USER`)

#### `GET /api/shipments`
Search bill of lading customs shipment logs with filters: `product`, `hsCode`, `originCountry`, `destinationCountry`, `page`, `limit`, `sort`.

- **Access Level**: Authenticated (`USER`)

#### `GET /api/hs-codes`
Lookup 6/8-digit HS Chapter directory & duty structures with filters: `q`, `code`, `description`, `chapter`, `page`, `limit`, `sort`.

- **Access Level**: Authenticated (`USER`)

---

### D. Market Intelligence Workbench (`/api/market-analysis/*`)

#### `GET /api/market-analysis`
Computes deterministic 0–100 Market Opportunity Scores, historical shipment trends, top buyers/suppliers, risk factors, and strategic recommendations.

- **Access Level**: Authenticated (`USER`)
- **Query Parameters**:
  - `hsCode`: (string, e.g. `"010121"`)
  - `country`: (string, e.g. `"United Arab Emirates"`)
  - `direction`: (`"export"` | `"import"`)
  - `year`: (`"all"` | `"2025"` | `"2024"`)
- **Success Response (`200 OK`)**:
  ```json
  {
    "market": { "hsCode": "010121", "country": "United Arab Emirates", "direction": "export" },
    "score": {
      "overall": 84,
      "tier": "High Opportunity",
      "breakdown": { "buyerDemand": 28, "shipmentActivity": 26, "buyerAvailability": 16, "supplierBalance": 14 }
    },
    "metrics": { "buyerCount": 12, "shipmentCount": 85, "totalShipmentValue": 4200000 },
    "risks": [ { "severity": "MEDIUM", "title": "Concentrated Buyer Base", "detail": "12 active buyers cataloged." } ],
    "recommendations": [ "Leverage verified direct importer contacts." ]
  }
  ```

#### `GET /api/market-analysis/compare`
Side-by-side market benchmarking across 2 to 5 destination countries.

- **Access Level**: Authenticated (`USER`)
- **Query Parameters**: `hsCode=010121&countries=Germany,UAE,USA`
- **Success Response (`200 OK`)**:
  ```json
  {
    "hsCode": "010121",
    "comparisons": [
      { "country": "United Arab Emirates", "score": { "overall": 84 } },
      { "country": "Germany", "score": { "overall": 72 } }
    ]
  }
  ```

#### `GET /api/market-analysis/best-markets`
Ranks top global import demand destinations for a given product or HS Code.

- **Access Level**: Authenticated (`USER`)
- **Query Parameters**: `hsCode=010121&limit=5`
- **Success Response (`200 OK`)**:
  ```json
  {
    "hsCode": "010121",
    "bestMarkets": [
      { "country": "United Arab Emirates", "score": { "overall": 84 } }
    ]
  }
  ```

---

### E. Search History & Saved Portfolios

#### `GET /api/search-history` & `POST /api/search-history`
Log recent user search queries and retrieve historical query log.

- **Access Level**: Authenticated (`USER`)
- **POST Body**: `{ "searchType": "buyers", "query": "cotton yarn", "filters": { "country": "India" } }`

#### `GET /api/saved-searches` & `POST /api/saved-searches` & `DELETE /api/saved-searches/[id]`
Bookmark directory searches and delete saved bookmarks.

- **Access Level**: Authenticated (`USER`)

#### Saved Market Analysis Dossiers (`/api/market-analysis/saved/*`)
- `GET /api/market-analysis/saved` — List saved market analyses for current user.
- `POST /api/market-analysis/saved` — Bookmark market analysis with filters and score.
- `POST /api/market-analysis/saved/[id]/rerun` — Re-evaluate saved analysis against fresh database data.
- `DELETE /api/market-analysis/saved/[id]` — Delete saved analysis dossier.

---

### F. Lead Capture (`/api/contact`, `/api/demo`)

#### `POST /api/contact`
- **Access Level**: Public
- **Request Body**:
  ```json
  {
    "name": "Alice Smith",
    "email": "alice@company.com",
    "company": "Smith Imports",
    "subject": "Enterprise Data Feed",
    "message": "We need custom API integration."
  }
  ```
- **Success Response (`201 Created`)**: `{ "message": "Contact request submitted successfully" }`

#### `POST /api/demo`
- **Access Level**: Public
- **Request Body**:
  ```json
  {
    "name": "Bob Taylor",
    "email": "bob@enterprise.com",
    "company": "Taylor Trade",
    "role": "VP Procurement",
    "teamSize": "20-50",
    "date": "2026-09-10",
    "time": "15:00"
  }
  ```
- **Success Response (`201 Created`)**: `{ "message": "Demo request booked successfully" }`

---

### G. Admin Management Suite (`/api/admin/*`)

*All admin endpoints strictly require `role: "ADMIN"`. Standard users receive `403 Forbidden`.*

#### `GET /api/admin/stats`
Platform overview metrics (total users, buyers, suppliers, shipments, hs-codes, leads).

#### `GET /api/admin/users`, `PUT /api/admin/users/[id]`, `DELETE /api/admin/users/[id]`
Admin user account management, role toggles (`USER` / `ADMIN`), and activation state.

#### `GET /api/admin/subscriptions`, `PUT /api/admin/subscriptions/[userId]`
Admin subscription plan management (`FREE`, `GROWTH`, `CONNECT`, `CONQUER`).

#### Admin Buyers CRUD (`/api/admin/buyers/*`)
- `GET /api/admin/buyers` — List buyers
- `POST /api/admin/buyers` — Create buyer
- `PUT /api/admin/buyers/[id]` — Update buyer
- `DELETE /api/admin/buyers/[id]` — Delete buyer

#### Admin Suppliers CRUD (`/api/admin/suppliers/*`)
- `GET /api/admin/suppliers` — List suppliers
- `POST /api/admin/suppliers` — Create supplier
- `PUT /api/admin/suppliers/[id]` — Update supplier
- `DELETE /api/admin/suppliers/[id]` — Delete supplier

#### Admin Shipments CRUD (`/api/admin/shipments/*`)
- `GET /api/admin/shipments` — List shipments
- `POST /api/admin/shipments` — Create shipment
- `PUT /api/admin/shipments/[id]` — Update shipment
- `DELETE /api/admin/shipments/[id]` — Delete shipment

#### Admin HS Codes CRUD (`/api/admin/hs-codes/*`)
- `GET /api/admin/hs-codes` — List HS codes
- `POST /api/admin/hs-codes` — Create HS code (with duplicate code & country protection `409`)
- `PUT /api/admin/hs-codes/[id]` — Update HS code
- `DELETE /api/admin/hs-codes/[id]` — Delete HS code

#### Admin Lead Requests (`/api/admin/requests`, `/api/admin/requests/[id]`)
- `GET /api/admin/requests` — List contact & demo leads
- `PUT /api/admin/requests/[id]` — Update lead status (`NEW` -> `CONTACTED` -> `CLOSED`)

---

### H. Export Opportunity Planner (`/api/export-planner/*`)

*Stage 3 Phase 3 — Advanced Trade Intelligence & Export Decision Support. All endpoints require authenticated session (`USER` or `ADMIN`).*

> **HS Code Rule**: All `hsCode` parameters are treated as **strings**. Leading zeros (e.g. `"010121"`) are always preserved. Never pass an integer.

#### `GET /api/export-planner/analyze`
Runs the complete unified export opportunity analysis engine for a given commodity corridor.

- **Access Level**: Authenticated (`USER`), rate-limited: `market-analysis` bucket
- **Query Parameters**:
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | `hsCode` | string | No | 6-digit WCO HS Sub-heading (leading zeros preserved) |
  | `product` | string | No | Product description / commodity name |
  | `originCountry` | string | No | Exporter's home country (default: `"India"`) |
  | `targetCountry` | string | No | Destination import market |
  | `price` | number | No | Unit FOB export price (USD) |
  | `quantity` | number | No | Export volume (units) |
  | `shipping` | number | No | Total ocean/air freight cost (USD) |
  | `insurance` | number | No | Total cargo insurance cost (USD) |
  | `otherCosts` | number | No | Port handling and other fees (USD) |
  | `targetSellingPrice` | number | No | Optional benchmark destination price for margin calc |
- **Success Response (`200 OK`)**:
  ```json
  {
    "inputs": { "hsCode": "010121", "product": "...", "price": 1200, "quantity": 50, "..." },
    "scores": {
      "finalOpportunityScore": 67,
      "marketOpportunityScore": 72,
      "buyerDemandScore": 80,
      "tradeRiskScore": 35,
      "exportReadinessScore": 74
    },
    "riskAssessment": { "score": 35, "level": "LOW", "factors": [], "recommendations": [] },
    "landedCost": { "available": true, "totalLandedCost": 75450, "costPerUnit": 1509, "marginPercentage": 2.7 },
    "readinessAssessment": { "score": 74, "level": "MODERATE", "blockers": [], "recommendations": [] },
    "recommendation": { "decision": "ENTER_WITH_CAUTION", "reasons": [], "advantages": [], "risks": [], "requiredActions": [] },
    "recommendedBuyers": [...],
    "actionPlan": [ { "step": 1, "title": "...", "description": "...", "status": "COMPLETED" }, ... ],
    "marketMetrics": { "buyerCount": 3, "verifiedBuyerCount": 2, "shipmentCount": 8 },
    "analyzedAt": "2026-09-03T16:00:00Z"
  }
  ```
- Also supports `POST` with same parameters in JSON request body.

---

#### `GET /api/export-planner/best-markets`
Evaluates and ranks the best export destination countries for a given HS code by composite opportunity score.

- **Access Level**: Authenticated (`USER`)
- **Query Parameters**: `hsCode`, `product`, `originCountry`, `limit` (max 10)
- **Success Response (`200 OK`)**:
  ```json
  {
    "markets": [
      { "country": "Germany", "finalOpportunityScore": 72, "marketScore": 68, "risk": { "level": "LOW", "score": 28 } },
      ...
    ]
  }
  ```

---

#### `GET /api/export-planner/recommended-buyers`
Returns buyers ranked by contextual match score against HS code and target country. **Contact details are masked unless the authenticated user has unlocked them.**

- **Access Level**: Authenticated (`USER`)
- **Query Parameters**: `hsCode`, `targetCountry`, `product`, `limit` (max 20)
- **Success Response (`200 OK`)**:
  ```json
  {
    "buyers": [
      {
        "id": 3,
        "companyName": "Gulf Livestock FZCO",
        "country": "United Arab Emirates",
        "matchScore": 85,
        "leadScore": 78,
        "isUnlocked": false,
        "email": null,
        "phone": null
      }
    ]
  }
  ```

---

#### `GET /api/export-planner/action-plan`
Returns a tailored 10-step adaptive export execution roadmap.

- **Access Level**: Authenticated (`USER`)
- **Query Parameters**: `hsCode`, `product`, `originCountry`, `targetCountry`, `price`, `quantity`, `shipping`, `insurance`, `otherCosts`
- **Success Response (`200 OK`)**:
  ```json
  {
    "actionPlan": [
      { "step": 1, "title": "Validate Commodity HS Code", "description": "...", "status": "COMPLETED", "link": "/hs-codes" },
      ...
    ]
  }
  ```

---

#### `GET /api/export-planner/saved`
Lists all export plans saved by the authenticated user.

- **Access Level**: Authenticated (`USER`)
- **Success Response (`200 OK`)**: `{ "plans": [...], "total": 3 }`

#### `POST /api/export-planner/saved`
Saves a new export plan. If `analysisResult` is omitted, the engine re-runs analysis automatically.

- **Access Level**: Authenticated (`USER`)
- **Request Body**: `{ "name", "hsCode", "product", "originCountry", "targetCountry", "price", "quantity", "shipping", "insurance", "otherCosts", "targetSellingPrice", "analysisResult?" }`
- **Success Response (`201 Created`)**: `{ "id": 7, "message": "Export plan saved successfully" }`

## Stage 4 APIs

`GET/POST /api/alerts` and `PUT/DELETE /api/alerts/[id]` manage ownership-scoped market alerts. Alert criteria are evaluated only against database-backed intelligence; no synthetic alerts are generated.

`GET /api/notifications`, `PUT /api/notifications/[id]/read`, and `PUT /api/notifications/read-all` provide ownership-scoped notification access and read state updates.

`GET /api/admin/analytics?range=7|30|90|all` returns aggregate administrator metrics, including users, subscriptions, saved analyses, saved export plans, unlocks, lead status distribution, and in-process API metrics. It never returns private contact data.

Market analysis responses include `dataConfidence`, `historicalTrend`, and score `factors`. The default source is the GlobeBridge database. Live external trade data is unavailable unless a real provider adapter and credentials are configured through environment variables; tariff and trade values are never fabricated.

Authenticated mutations apply same-origin validation when browsers send an `Origin` header. `TRUST_PROXY=true` must only be used behind a proxy that overwrites forwarded client headers. Run migrations before using Stage 4 tables, then run `npm run lint`, `npm run build`, and the complete E2E suite.

`POST /api/internal/alerts/evaluate` is a server-to-server scheduled-job endpoint. It requires the server-only `ALERT_CRON_SECRET` value in the `x-alert-cron-secret` header. It evaluates real active alerts, writes deduplicated alert and follow-up notifications, and updates `last_triggered_at`. It must be invoked by a trusted scheduler and is never called directly by browser clients.

---

#### `GET /api/export-planner/saved/[id]`
Retrieves a single saved export plan. Returns `404` if plan does not belong to the authenticated user.

#### `DELETE /api/export-planner/saved/[id]`
Permanently deletes a saved export plan owned by the authenticated user.

---

#### `POST /api/export-planner/saved/[id]/rerun`
Re-runs the full export decision engine analysis using the original saved `input_data` and updates `analysis_result` with fresh live repository metrics.

- **Access Level**: Authenticated (`USER`)
- **Success Response (`200 OK`)**: `{ "success": true, "analysis": { ... } }`

---

## 6. Subscription Matrix & Quota Enforcement

| Plan Tier | Contact Unlocks Quota | Features Included |
|---|---|---|
| **FREE** | 10 Entity Contact Unlocks | Base search, Market Intelligence scoring |
| **GROWTH** | 50 Entity Contact Unlocks | Advanced filtering, country comparisons |
| **CONNECT** | 200 Entity Contact Unlocks / Mo | Multi-tier supply chain mapping, key contact details |
| **CONQUER** | Unlimited Unlocks | Raw dataset access, custom dossiers & API feeds |

---
