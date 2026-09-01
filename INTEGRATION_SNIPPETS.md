# Integration snippets — paste into your existing pages

I could not read your actual `/market-analysis`, Best Market Finder, or
`/dashboard` components (no repo access from this session), so these are
drop-in snippets rather than full file replacements. Paste each into the
right spot in your existing JSX — do not replace the whole file.

---

## 1. `/market-analysis` — after Buyer Intelligence section

```jsx
<div className="flex gap-3 mt-4">
  <Link
    href={`/buyer-discovery?hsCode=${encodeURIComponent(hsCode)}&country=${encodeURIComponent(country)}`}
    className="bg-yellow-500 text-black rounded px-4 py-2 text-sm font-medium hover:bg-yellow-400"
  >
    Discover Buyers
  </Link>
  <Link
    href={`/supplier-discovery?hsCode=${encodeURIComponent(hsCode)}&country=${encodeURIComponent(country)}`}
    className="border border-yellow-500 text-yellow-400 rounded px-4 py-2 text-sm font-medium hover:bg-yellow-500/10"
  >
    Find Suppliers
  </Link>
</div>
```

Replace `hsCode` / `country` with whatever variables already hold the
current analysis context in that component.

The discovery pages (`/buyer-discovery`, `/supplier-discovery`) already
read `?hsCode=` and `?country=` from the URL and pre-populate their
filters — see the `useSearchParams()` calls in
`app/buyer-discovery/page.jsx` / `app/supplier-discovery/page.jsx`.

---

## 2. Best Market Finder — per market result row

```jsx
<Link
  href={`/buyer-discovery?hsCode=${encodeURIComponent(hsCode)}&country=${encodeURIComponent(market.country)}`}
  className="text-xs border border-yellow-500 text-yellow-400 rounded px-3 py-1 hover:bg-yellow-500/10"
>
  Find Buyers
</Link>
```

Place this inside the per-market card/row, using that row's `market.country`
value and the `hsCode` already in scope for the current Best Market search.

---

## 3. `/dashboard` — Lead Intelligence card

```jsx
// Fetch alongside your other dashboard data:
const leadsRes = await fetch('/api/leads');
const { leads, metrics } = await leadsRes.json();
const recentLeads = leads.slice(0, 5);
```

```jsx
<section className="border border-neutral-800 rounded-lg p-4">
  <div className="flex items-center justify-between mb-3">
    <h2 className="font-medium text-white">Lead Intelligence</h2>
    <Link href="/my-leads" className="text-xs text-yellow-400 hover:underline">
      View My Leads
    </Link>
  </div>

  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
    <DashboardStat label="Saved Leads" value={metrics.total} />
    <DashboardStat label="High-Potential Leads" value={metrics.highPotential} />
    <DashboardStat label="Potential Buyers" value={metrics.byType?.BUYER ?? '—'} />
    <DashboardStat label="Potential Suppliers" value={metrics.byType?.SUPPLIER ?? '—'} />
  </div>

  <ul className="text-sm text-neutral-300 space-y-1">
    {recentLeads.map((lead) => (
      <li key={lead.id} className="flex justify-between">
        <span>{lead.companyName}</span>
        <span className="text-neutral-500">{lead.status}</span>
      </li>
    ))}
  </ul>
</section>
```

Note: `metrics.byType` (counts of BUYER vs SUPPLIER saved leads) isn't in
the `GET /api/leads` response as written — either derive it client-side
from the `leads` array (`leads.filter(l => l.entityType === 'BUYER').length`)
or extend the API route's `metrics` object if you'd rather compute it
server-side. Left as a one-line addition either way.

Add this section into your existing dashboard grid without removing any
current cards.
