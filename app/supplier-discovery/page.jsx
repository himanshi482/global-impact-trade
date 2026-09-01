'use client';

// app/supplier-discovery/page.jsx
// Stage 3 Phase 2 — /supplier-discovery
//
// Wire this into your existing design system: replace the className
// strings below with your actual dark-theme / gold-accent tokens
// (e.g. your Tailwind config or CSS module classes) and swap
// <YourNavigation> / <YourFooter> for the real components.

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function SupplierDiscoveryInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

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

      const res = await fetch(`/api/suppliers/discover?${params.toString()}`);
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setResults(data.results);
      setPagination(data.pagination);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleFilterChange = (key, value) => {
    setPage(0);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const saveLead = async (supplier) => {
    setSavingId(supplier.id);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'SUPPLIER',
          entityId: supplier.id,
          leadScore: supplier.leadScore,
        }),
      });
      if (res.status === 409) {
        alert('Lead already exists in your pipeline.');
      } else if (!res.ok) {
        alert('Could not save lead. Please try again.');
      } else {
        alert(`${supplier.companyName} saved to My Leads.`);
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-yellow-400 mb-1">Supplier Discovery</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Search real supplier records from GlobeBridge trade data.
        </p>

        <FilterBar filters={filters} onChange={handleFilterChange} />

        {status === 'loading' && <StateMessage text="Loading suppliers…" />}
        {status === 'error' && (
          <StateMessage text="Something went wrong loading suppliers. Please try again." isError />
        )}
        {status === 'success' && results.length === 0 && (
          <StateMessage text="No suppliers match your filters yet. Try broadening your search." />
        )}

        {status === 'success' && results.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((supplier) => (
                <SupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  onSave={() => saveLead(supplier)}
                  saving={savingId === supplier.id}
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
      </main>
    </div>
  );
}

function FilterBar({ filters, onChange }) {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <input
        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
        placeholder="Search company or product"
        value={filters.q}
        onChange={(e) => onChange('q', e.target.value)}
      />
      <input
        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
        placeholder="HS Code"
        value={filters.hsCode}
        onChange={(e) => onChange('hsCode', e.target.value)}
      />
      <input
        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
        placeholder="Country"
        value={filters.country}
        onChange={(e) => onChange('country', e.target.value)}
      />
      <input
        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
        placeholder="Min shipments"
        type="number"
        value={filters.minShipments}
        onChange={(e) => onChange('minShipments', e.target.value)}
      />
      <select
        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
        value={filters.verified}
        onChange={(e) => onChange('verified', e.target.value)}
      >
        <option value="">Any verification</option>
        <option value="true">Verified only</option>
        <option value="false">Unverified only</option>
      </select>
      <select
        className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
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
  );
}

function SupplierCard({ supplier, onSave, saving }) {
  const potentialColor =
    supplier.potential === 'HIGH POTENTIAL'
      ? 'text-green-400'
      : supplier.potential === 'MEDIUM POTENTIAL'
      ? 'text-yellow-400'
      : 'text-neutral-400';

  return (
    <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-950">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href={`/suppliers/${supplier.id}`}
            className="font-medium text-white hover:text-yellow-400"
          >
            {supplier.companyName}
          </Link>
          <p className="text-xs text-neutral-400">{supplier.country}</p>
        </div>
        {supplier.verified && (
          <span className="text-xs rounded bg-green-900/40 text-green-400 px-2 py-0.5">
            Verified
          </span>
        )}
      </div>

      <div className="mt-3 text-sm text-neutral-300 space-y-1">
        <p>Product: {supplier.product}</p>
        <p>HS Code: {supplier.hsCode}</p>
        <p>
          Shipments: {supplier.shipmentCount} · Value: $
          {Number(supplier.totalShipmentValue).toLocaleString()}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={`text-sm font-semibold ${potentialColor}`}>
          Lead Score: {supplier.leadScore}/100
        </span>
        <button
          onClick={onSave}
          disabled={saving}
          className="text-xs bg-yellow-500 text-black rounded px-3 py-1 font-medium hover:bg-yellow-400 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Lead'}
        </button>
      </div>
    </div>
  );
}

function Pagination({ page, limit, total, hasMore, onPrev, onNext }) {
  return (
    <div className="mt-6 flex items-center justify-between text-sm text-neutral-400">
      <span>
        Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
      </span>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page === 0}
          className="border border-neutral-700 rounded px-3 py-1 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasMore}
          className="border border-neutral-700 rounded px-3 py-1 disabled:opacity-40"
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
      className={`rounded border px-4 py-6 text-center text-sm ${
        isError ? 'border-red-800 text-red-400' : 'border-neutral-800 text-neutral-400'
      }`}
    >
      {text}
    </div>
  );
}

export default function SupplierDiscoveryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SupplierDiscoveryInner />
    </Suspense>
  );
}
