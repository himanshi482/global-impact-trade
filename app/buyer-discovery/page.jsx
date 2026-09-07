'use client';

// app/buyer-discovery/page.jsx
// Stage 3 Phase 2 — /buyer-discovery
//
// Wire this into your existing design system: replace the className
// strings below with your actual dark-theme / gold-accent tokens
// (e.g. your Tailwind config or CSS module classes) and swap
// <YourNavigation> / <YourFooter> for the real components.

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import FieldLabel from '../../components/FieldLabel';

function BuyerDiscoveryInner() {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState({
    q: '',
    product: '',
    hsCode: searchParams.get('hsCode') || '',
    country: searchParams.get('country') || '',
    verified: '',
    minShipments: '',
    minValue: '',
    sort: 'relevance',
  });
  const [page, setPage] = useState(0);
  const [limit] = useState(20);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, hasMore: false });
  const [savingId, setSavingId] = useState(null);

  const fetchResults = useCallback(async () => {
    setStatus('loading');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v);
      });
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));

      const res = await fetch(`/api/buyers/discover?${params.toString()}`);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setResults(data.results || []);
      setPagination(data.pagination || { total: 0, hasMore: false });
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [filters, page, limit]);

  useEffect(() => {
    Promise.resolve().then(fetchResults);
  }, [fetchResults]);

  const handleFilterChange = (key, value) => {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const saveLead = async (buyer) => {
    setSavingId(buyer.id);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'BUYER',
          entityId: buyer.id,
          leadScore: buyer.leadScore,
        }),
      });
      if (res.status === 401) {
        alert('Please sign in to save leads to your account.');
      } else if (res.status === 409) {
        alert('Lead already exists in your pipeline.');
      } else if (!res.ok) {
        alert('Could not save lead. Please try again.');
      } else {
        alert(`${buyer.companyName} saved to My Leads.`);
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--ink)] text-[var(--paper)]">
      {/* Hero Header */}
      <section className="border-b border-[var(--brass)]/20 bg-gradient-to-b from-[var(--ink-2)] via-[var(--ink)] to-[var(--ink)] px-6 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <FieldLabel>Global Procurement Intelligence</FieldLabel>
          <h1 className="font-display mt-2 text-3xl md:text-5xl text-[var(--paper)]">
            Foreign Buyer Discovery
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-mono text-[var(--muted)] leading-relaxed">
            Search active, verified global importers across 181+ countries with granular shipment transaction records and direct decision-maker linkages.
          </p>
        </div>
      </section>

      {/* Main Filter & Results Section */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <FilterBar filters={filters} onChange={handleFilterChange} />

        {status === 'loading' && <StateMessage text="Scanning verified buyer records..." />}
        {status === 'error' && (
          <StateMessage text="Something went wrong loading buyers. Please verify your connection and try again." isError />
        )}
        {status === 'success' && results.length === 0 && (
          <StateMessage text="No buyer records matched your filters. Try broadening your keywords, HS code, or country." />
        )}

        {status === 'success' && results.length > 0 && (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((buyer) => (
                <BuyerCard
                  key={buyer.id}
                  buyer={buyer}
                  onSave={() => saveLead(buyer)}
                  saving={savingId === buyer.id}
                />
              ))}
            </div>

            <Pagination
              page={page}
              limit={limit}
              total={pagination.total}
              hasMore={pagination.hasMore}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
          </>
        )}
      </section>
    </main>
  );
}

function FilterBar({ filters, onChange }) {
  return (
    <div className="mb-8 rounded-2xl border border-[var(--brass)]/25 bg-[var(--ink-2)]/90 p-5 shadow-xl">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 font-mono text-xs">
        <input
          className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded-lg px-3.5 py-2.5 text-xs text-[var(--paper)] placeholder-[var(--muted)] focus:border-[var(--brass)] focus:outline-none transition"
          placeholder="Search company or product"
          value={filters.q}
          onChange={(e) => onChange('q', e.target.value)}
        />
        <input
          className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded-lg px-3.5 py-2.5 text-xs text-[var(--paper)] placeholder-[var(--muted)] focus:border-[var(--brass)] focus:outline-none transition"
          placeholder="HS Code (e.g. 0902)"
          value={filters.hsCode}
          onChange={(e) => onChange('hsCode', e.target.value)}
        />
        <input
          className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded-lg px-3.5 py-2.5 text-xs text-[var(--paper)] placeholder-[var(--muted)] focus:border-[var(--brass)] focus:outline-none transition"
          placeholder="Country (e.g. UAE, USA)"
          value={filters.country}
          onChange={(e) => onChange('country', e.target.value)}
        />
        <input
          className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded-lg px-3.5 py-2.5 text-xs text-[var(--paper)] placeholder-[var(--muted)] focus:border-[var(--brass)] focus:outline-none transition"
          placeholder="Min shipments"
          type="number"
          value={filters.minShipments}
          onChange={(e) => onChange('minShipments', e.target.value)}
        />
        <select
          className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded-lg px-3.5 py-2.5 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none transition cursor-pointer"
          value={filters.verified}
          onChange={(e) => onChange('verified', e.target.value)}
        >
          <option value="">Any verification</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified only</option>
        </select>
        <select
          className="bg-[var(--ink)] border border-[var(--brass)]/30 rounded-lg px-3.5 py-2.5 text-xs text-[var(--paper)] focus:border-[var(--brass)] focus:outline-none transition cursor-pointer"
          value={filters.sort}
          onChange={(e) => onChange('sort', e.target.value)}
        >
          <option value="relevance">Sort: Relevance</option>
          <option value="leadScore">Sort: Lead Score</option>
          <option value="activity">Sort: Shipment Activity</option>
          <option value="value">Sort: Shipment Value</option>
          <option value="verification">Sort: Verification</option>
          <option value="name">Sort: Company Name</option>
        </select>
      </div>
    </div>
  );
}

function BuyerCard({ buyer, onSave, saving }) {
  const potentialBadge =
    buyer.potential === 'HIGH POTENTIAL'
      ? 'border-emerald-500/40 bg-emerald-950/80 text-emerald-400'
      : buyer.potential === 'MEDIUM POTENTIAL'
      ? 'border-[var(--brass)]/40 bg-[var(--brass)]/15 text-[var(--brass)]'
      : 'border-[var(--muted)]/40 bg-[var(--ink)] text-[var(--muted)]';

  return (
    <div className="flex flex-col justify-between rounded-xl border border-[var(--brass)]/20 bg-[var(--ink-2)]/90 p-5 shadow-lg transition hover:border-[var(--brass)]/60 hover:shadow-2xl">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/buyers/${buyer.id}`}
              className="font-display text-lg text-[var(--paper)] hover:text-[var(--brass)] transition"
            >
              {buyer.companyName}
            </Link>
            <p className="font-mono text-xs text-[var(--brass)] mt-0.5 flex items-center gap-1">
              <span>📍</span> {buyer.country}
            </p>
          </div>
          {buyer.verified && (
            <span className="rounded bg-emerald-950/90 border border-emerald-500/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold shrink-0">
              ✓ Verified
            </span>
          )}
        </div>

        <div className="mt-4 rounded-lg bg-[var(--ink)]/80 border border-[var(--brass)]/15 p-3 font-mono text-xs text-[var(--muted)] space-y-1.5">
          <p><span className="text-[var(--paper)] font-semibold">Product:</span> {buyer.product || 'General Merchandise'}</p>
          <p><span className="text-[var(--paper)] font-semibold">HS Code:</span> {buyer.hsCode || '—'}</p>
          <p>
            <span className="text-[var(--paper)] font-semibold">Shipments:</span> {buyer.shipmentCount} · <span className="text-[var(--paper)] font-semibold">Value:</span> ${Number(buyer.totalShipmentValue || 0).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-[var(--brass)]/15 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
        <span className={`rounded px-2 py-0.5 border text-[11px] font-bold ${potentialBadge}`}>
          Score: {buyer.leadScore}/100
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/export-planner?hsCode=${encodeURIComponent(buyer.hsCode || '')}&targetCountry=${encodeURIComponent(buyer.country || '')}&product=${encodeURIComponent(buyer.product || '')}`}
            className="rounded border border-[var(--brass)]/40 px-2.5 py-1.5 font-bold uppercase tracking-wider text-[var(--brass)] hover:bg-[var(--brass)] hover:text-[var(--ink)] transition text-[10px]"
          >
            📊 Analyze Plan
          </Link>
          <button
            onClick={onSave}
            disabled={saving}
            className="rounded bg-[var(--brass)] px-3 py-1.5 font-bold uppercase tracking-wider text-[var(--ink)] hover:brightness-110 disabled:opacity-50 transition shadow text-[10px]"
          >
            {saving ? 'Saving…' : 'Save Lead →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, limit, total, hasMore, onPrev, onNext }) {
  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-[var(--muted)] border-t border-[var(--brass)]/20 pt-6">
      <span>
        Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total} verified buyers
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page === 0}
          className="rounded border border-[var(--brass)]/30 px-3.5 py-1.5 uppercase tracking-wider text-[var(--paper)] hover:border-[var(--brass)] hover:text-[var(--brass)] disabled:opacity-40 transition"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasMore}
          className="rounded border border-[var(--brass)]/30 px-3.5 py-1.5 uppercase tracking-wider text-[var(--paper)] hover:border-[var(--brass)] hover:text-[var(--brass)] disabled:opacity-40 transition"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function StateMessage({ text, isError }) {
  return (
    <div
      className={`rounded-xl border p-8 text-center font-mono text-xs ${
        isError ? 'border-rose-500/40 bg-rose-950/20 text-rose-300' : 'border-[var(--brass)]/20 bg-[var(--ink-2)] text-[var(--muted)]'
      }`}
    >
      {text}
    </div>
  );
}

export default function BuyerDiscoveryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--ink)]" />}>
      <BuyerDiscoveryInner />
    </Suspense>
  );
}
