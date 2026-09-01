'use client';

// app/admin/leads/page.jsx
// Stage 3 Phase 2 — /admin/leads (ADMIN only; server route enforces
// 401/403 — this page just assumes it's rendered inside your existing
// admin-only layout/guard).

import { useEffect, useState, useCallback } from 'react';

export default function AdminLeadsPage() {
  const [filters, setFilters] = useState({ company: '', user: '', entityType: '', status: '' });
  const [status, setStatus] = useState('loading');
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({ total: 0 });
  const [page, setPage] = useState(0);
  const limit = 25;

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
      params.set('limit', String(limit));
      params.set('offset', String(page * limit));
      const res = await fetch(`/api/admin/leads?${params.toString()}`);
      if (res.status === 403) throw new Error('forbidden');
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setLeads(data.leads);
      setPagination(data.pagination);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-yellow-400 mb-6">Lead Management (Admin)</h1>

        <div className="grid gap-3 sm:grid-cols-4 mb-6">
          <input
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
            placeholder="Search company"
            value={filters.company}
            onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, company: e.target.value })); }}
          />
          <input
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
            placeholder="Search user (name/email)"
            value={filters.user}
            onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, user: e.target.value })); }}
          />
          <select
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
            value={filters.entityType}
            onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, entityType: e.target.value })); }}
          >
            <option value="">All types</option>
            <option value="BUYER">Buyer</option>
            <option value="SUPPLIER">Supplier</option>
          </select>
          <select
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => { setPage(0); setFilters((f) => ({ ...f, status: e.target.value })); }}
          >
            <option value="">All statuses</option>
            {['NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATING', 'WON', 'LOST'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {status === 'loading' && <p className="text-neutral-400">Loading…</p>}
        {status === 'error' && (
          <p className="text-red-400">
            Could not load admin lead data — you may not have access, or the request failed.
          </p>
        )}

        {status === 'success' && (
          <>
            {leads.length === 0 ? (
              <p className="text-neutral-500 border border-neutral-800 rounded-lg p-6 text-center">
                No leads match these filters.
              </p>
            ) : (
              <table className="w-full text-sm text-neutral-300">
                <thead className="text-neutral-500 text-left border-b border-neutral-800">
                  <tr>
                    <th className="py-2 pr-4">Company</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">User</th>
                    <th className="py-2 pr-4">Score</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-neutral-900">
                      <td className="py-2 pr-4">{lead.companyName}</td>
                      <td className="py-2 pr-4">{lead.entityType}</td>
                      <td className="py-2 pr-4">{lead.user.name || lead.user.email}</td>
                      <td className="py-2 pr-4">{lead.leadScore}/100</td>
                      <td className="py-2 pr-4">{lead.status}</td>
                      <td className="py-2 pr-4">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="mt-4 flex justify-between text-sm text-neutral-400">
              <span>Total: {pagination.total}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="border border-neutral-700 rounded px-3 py-1 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagination.hasMore}
                  className="border border-neutral-700 rounded px-3 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
