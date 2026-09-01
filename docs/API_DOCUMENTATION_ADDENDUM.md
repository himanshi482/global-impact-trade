# API Documentation Addendum — Stage 3 Phase 2

Append this section to `docs/API_DOCUMENTATION.md`. Trade intelligence
(buyers, suppliers, shipments) reflects GlobeBridge's current database /
demo dataset unless an external live trade-data provider is configured.

## Buyer Discovery

`GET /api/buyers/discover`

Auth: required (`requireUser()`). Returns `401` if unauthenticated.

Query params: `q`, `product`, `hsCode`, `hsChapter`, `country`,
`verified` (`true`/`false`), `minShipments`, `minValue`,
`sort` (`relevance` | `leadScore` | `activity` | `value` | `verification` | `name`),
`limit` (max `100`), `offset`.

Response:
```json
{
  "results": [{
    "id": 1, "companyName": "...", "country": "...", "product": "...",
    "hsCode": "010121", "shipmentCount": 12, "totalShipmentValue": 450000,
    "verified": true, "leadScore": 86, "potential": "HIGH POTENTIAL",
    "scoreReasons": ["Strong shipment activity", "..."],
    "contactUnlocked": false
  }],
  "pagination": { "total": 132, "limit": 20, "offset": 0, "hasMore": true }
}
```

Contact fields (`email`, `phone`, `contactPerson`, `website`) are present
in a result object ONLY when `contactUnlocked` is `true` for the
requesting user, or the requesting user is `ADMIN`.

## Supplier Discovery

`GET /api/suppliers/discover` — identical contract to Buyer Discovery,
scoped to suppliers.

## Lead Scoring

Deterministic, 0–100, computed in `lib/leadScoring.js` from real
database fields (no randomness):

| Factor              | Max points |
|----------------------|-----------|
| Shipment Activity     | 30 |
| Trade Value           | 20 |
| Product Match         | 20 |
| Country Match         | 10 |
| Verification          | 10 |
| Recency               | 10 |

Potential label: `80–100` HIGH · `50–79` MEDIUM · `0–49` LOW.

## Saved Leads

`GET /api/leads` — the authenticated user's leads + pipeline metrics
(`total`, `new`, `contacted`, `qualified`, `negotiating`, `won`, `lost`,
`highPotential`). Optional `status` / `entityType` query filters.

`POST /api/leads` — body: `{ entityType, entityId, leadScore, notes? }`.
`user_id` is always taken from the session, never from the request body.
Returns `409` with `"Lead already exists in your pipeline."` on
duplicate `(user_id, entity_type, entity_id)`.

`PUT /api/leads/[id]` — body: `{ status?, notes? }`. Scoped to
`WHERE id = ? AND user_id = ?`; returns `404` for leads that exist but
belong to another user (never `403`, to avoid confirming existence).

`DELETE /api/leads/[id]` — same ownership scoping as `PUT`.

Lead statuses: `NEW`, `CONTACTED`, `QUALIFIED`, `NEGOTIATING`, `WON`,
`LOST`.

## CSV Export

`GET /api/leads/export` — streams a CSV of the authenticated user's own
leads only. Columns: `Company, Country, Entity Type, Lead Score,
Potential, Status, Notes, Created Date`. RFC 4180 field escaping.

## Admin Lead Management

`GET /api/admin/leads` — `requireAdmin()`. `401` unauthenticated, `403`
authenticated non-admin. Supports `company`, `user`, `entityType`,
`status`, `sort` (`newest` | `oldest` | `score` | `company`), `limit`
(max 100), `offset`.

## Contact Unlock

Phase 2 reuses the existing `POST /api/unlock` endpoint and subscription
quota system — no new unlock logic was introduced. `403` with
`"Your contact unlock limit has been reached."` when quota is exceeded;
unlocking an already-unlocked entity does not consume additional quota.

## Rate Limiting

`/api/buyers/discover`, `/api/suppliers/discover`, `/api/leads`, and
`/api/leads/export` reuse the existing `lib/rateLimit.js` limiter.
`DISABLE_RATE_LIMIT=true` still disables rate limiting in E2E test mode.

## Database Migration

`db/migrations/007_saved_leads.sql` (renumber if `007` is already taken)
creates `saved_leads` with a `UNIQUE (user_id, entity_type, entity_id)`
constraint for duplicate protection, a foreign key to `users`, and
indexes on `user_id`, `(user_id, status)`, and `(entity_type,
entity_id)`.

## E2E Tests

See `tests/e2e/leads.spec.js` for Buyer Discovery, Supplier Discovery,
Lead Management, Ownership, Contact Unlock, CSV Export, and Admin Lead
Management coverage, plus Phase 1 / Stage 2 regression placeholders.
