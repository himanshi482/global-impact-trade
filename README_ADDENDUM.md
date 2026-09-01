# README Addendum — Stage 3 Phase 2

## Advanced Buyer/Supplier Discovery, Lead Intelligence & CRM Pipeline

Phase 2 turns GlobeBridge's Market Intelligence (Phase 1) into an
end-to-end lead workflow:

```
Market Analysis → Best Market Finder → Discover Buyers → Buyer/Supplier
Intelligence → Lead Score → Save Lead → My Leads → Contact Unlock →
Contacted → Qualified → Negotiating → Won / Lost
```

### New pages
- `/buyer-discovery`, `/supplier-discovery` — filterable, sortable,
  paginated discovery over real database records.
- `/buyers/[id]`, `/suppliers/[id]` — profile with lead score
  explanation, shipment evidence, and unlock-gated contact details.
- `/my-leads` — CRM pipeline with status changes, notes, CSV export.
- `/admin/leads` — admin-only lead oversight.

### New APIs
`GET /api/buyers/discover`, `GET /api/suppliers/discover`,
`GET|POST /api/leads`, `PUT|DELETE /api/leads/[id]`,
`GET /api/leads/export`, `GET /api/admin/leads`.

See `docs/API_DOCUMENTATION_ADDENDUM.md` for full request/response
contracts.

### Database
New migration: `db/migrations/007_saved_leads.sql` — check your actual
`db/migrations` directory first and renumber if `007` is taken.

### Data integrity
All trade intelligence is read from GlobeBridge's existing MySQL
database (current dataset) — no synthetic buyers, suppliers, or
shipments are generated anywhere in Phase 2. Lead scores are computed
deterministically in `lib/leadScoring.js` from real fields; no
`Math.random()`.

### Security
- All new routes require `requireUser()`; `/api/admin/leads` requires
  `requireAdmin()`.
- Every lead query is scoped to the authenticated `user.id` — ownership
  is enforced server-side, never trusted from the client.
- All SQL is parameterized.
- Contact fields are masked unless legitimately unlocked (existing
  `/api/unlock` + subscription quota — no duplicate unlock system).
- Notes are stripped of HTML before storage.

### What this addendum does NOT include
Since this was generated without direct access to the live repository,
the following need to be reconciled against your actual codebase before
merging:
- Exact column/table names in `buyers`, `suppliers`, `shipments`,
  `users`, and the unlock-tracking table.
- The exact single-entity endpoints (`/api/buyers/[id]`,
  `/api/suppliers/[id]`) — Phase 2's profile pages assume these exist
  or need to be added, returning `{ buyer, shipments }` /
  `{ supplier, shipments }` with the same contact-masking rules as
  discovery.
- Your actual design-system components/tokens (Navigation, Footer,
  color variables) — the pages here use placeholder Tailwind classes
  matching "dark theme, gold accent" and should be swapped for your
  real components.
- Wiring the integration snippets in `INTEGRATION_SNIPPETS.md` into the
  real `/market-analysis`, Best Market Finder, and `/dashboard`
  components.
- Running the existing migration-numbering check, `npm run lint`,
  `npm run build`, and the full E2E suite (including Phase 1 / Stage 2
  regression) inside your actual environment.
